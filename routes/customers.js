/**
 * Customers module, contains all the views and code related to customers (and appointments).
 * @module
 */

var express = require('express');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var common = require('../common');
var client = common.createClient();
var esErrors = elasticsearch.errors;
var customersPath = '/customers';
var moment = require('moment');
var util = require('util');
var async = require('async');
var uuid = require('node-uuid');

router.use(common.isAuthenticated);

/**
 * Updates the last_seen property of the given obj looping over the obj appointments.
 * @function
 *
 * @param {object} obj the customer object fetched from elasticsearch
 */
function updateLastSeen(obj) {
    if (obj.appointments.length === 0) {
        obj.last_seen = null;
    }
    else if (obj.appointments.length === 1) {
        obj.last_seen = obj.appointments[0].date;
    }
    else {
        var reduceFn = function (previousValue, currentValue, index, array) {
            if (typeof previousValue == 'undefined' || currentValue.date > previousValue.date)
                return currentValue;
            return previousValue;
        };

        obj.last_seen = obj.appointments.reduce(reduceFn).date;
    }
}

/**
 * Parses the elasticsearch response and returns an array of objects that represent the customers.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} hits the hits from the elasticsearch response.
 */
function processElasticsearchResults(req, hits) {

    function getField(hit, field, field_type) {
        if (hit.highlight && hit.highlight[field + '.' + field_type])
            return hit.highlight[field + '.' + field_type][0];

        return hit._source[field];
    }

    // sort by name & surname (ascending)
    function sortFn(a, b) {
        var aName = a.name.toLowerCase();
        var bName = b.name.toLowerCase();

        var aSurname = a.surname ? a.surname.toLowerCase() : '';
        var bSurname = b.surname ? b.surname.toLowerCase() : '';

        if (aName < bName)
            return -1;
        if (aName > bName)
            return 1;

        if (aSurname < bSurname)
            return -1;
        if (aSurname > bSurname)
            return 1;
        return 0;
    }

    var results = [];
    for (var i = 0; i < hits.length; i++) {
        var phone = getField(hits[i], 'phone', 'partial');
        var mobile = getField(hits[i], 'mobile_phone', 'partial');

        var phone_mobile;
        if (phone && mobile)
            phone_mobile = mobile + ' / ' + phone;
        else if (mobile)
            phone_mobile = mobile;
        else if (phone)
            phone_mobile = phone;
        else
            phone_mobile = '-';

        var surname = getField(hits[i], 'surname', 'autocomplete');
        if (!surname)
            surname = '-';

        results[results.length] = {
            id: hits[i]._id,
            deleteText: req.i18n.__('Delete customer'),
            name: getField(hits[i], 'name', 'autocomplete'),
            surname: surname,
            phone: phone_mobile,
            last_seen: common.toLocalFormattedDate(req, hits[i]._source.last_seen)
        };
    }

    results.sort(sortFn);
    return results;
}

router.use(['*'], function (req, res, next) {
    req.utils = new CustomerUtils(req, res);
    next();
});

router.get('/simple-search', function(req, res, next) {
    var queryBody;
    if (req.query.text.trim()) {
        queryBody = {
            query: {
                multi_match: {
                    query: req.query.text,
                    operator: 'and',
                    type: 'cross_fields',
                    fields: [
                        "name.autocomplete",
                        "surname.autocomplete"
                    ]
                }
            }
        };
    }
    else {
        queryBody = {
            query: {
                match_all: {}
            }
        };
    }

    client.search({
        index: req.config.mainIndex,
        type: 'customer',
        size: req.query.size ?  req.query.size : 50,
        body: queryBody
    }, function(err, resp, respcode) {

        var customers = [];
        for (var i = 0; i < resp.hits.hits.length; i++) {
            customers[customers.length] = {
                id: resp.hits.hits[i]._id,
                name: resp.hits.hits[i]._source.name,
                surname: resp.hits.hits[i]._source.surname
            };
        }

        res.json({
            customers: customers
        });
    });
});

router.get('/search', function(req, res, next) {
    var queryBody;
    if (req.query.text.trim()) {
        queryBody = {
            query: {
                multi_match: {
                    query: req.query.text,
                    operator: 'and',
                    type: 'cross_fields',
                    fields: [
                        "name.autocomplete",
                        "surname.autocomplete",
                        "mobile_phone.partial",
                        "phone.partial"
                    ]
                }
            },
            highlight: {
                fields: {
                    '*': {
                        'pre_tags': ['<b>'],
                        'post_tags': ['</b>']
                    }
                }
            }
        };
    }
    else {
        queryBody = {
            query: {
                match_all: {}
            }
        };
    }

    client.search({
        index: req.config.mainIndex,
        type: 'customer',
        size: 50,
        body: queryBody
    }, function(err, resp, respcode) {
        res.json({
            headerName: req.i18n.__('Name'),
            headerSurname: req.i18n.__('Surname'),
            headerPhone: req.i18n.__('Mobile') + ' / ' + req.i18n.__('Phone'),
            headerLastSeen: req.i18n.__('Last seen'),
            emptyMsg: req.i18n.__('No customers to display.'),
            customers: processElasticsearchResults(req, resp.hits.hits)
        });
    });
});

router.get('/:id', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        res.json(req.utils.toViewFormat(resp._source));
    });
});

router.post('/', function(req, res, next) {
    var errors = req.utils.validateForm();
    if (errors) {
        res.status(400).json({errors: errors});
        return;
    }

    var args = {
        index: req.config.mainIndex,
        type: 'customer',
        refresh: true,
        body: req.utils.toElasticsearchFormat(req.body)
    };

    client.index(args, function(err, resp, respcode) {
        common.indexCb(req, res, err, resp, true);
    });
});


router.put('/:id', function(req, res, next) {
    var errors = req.utils.validateForm();
    if (errors) {
        res.status(400).json({errors: errors});
        return;
    }

    var args = {
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id,
        refresh: true,
        body: req.utils.toElasticsearchFormat(req.body)
    };

    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: args.id
    }, function(err, resp, respcode) {
        args.body.appointments = resp._source.appointments;
        args.body.last_seen = resp._source.last_seen;
        client.index(args, function(err, resp, respcode) {
            common.indexCb(req, res, err, resp, true);
        });
    });
});


router.delete('/:id', function(req, res, next) {
    client.delete({
        index: req.config.mainIndex,
        type: 'customer',
        refresh: true,
        id: req.params.id
    }, function(err, resp, respcode) {
        if (err) {
            console.log(err);
            res.status(400).end();
        }
        else {
            res.status(200).end();
        }
    });
});

/**
 * Creates a new CustomerUtils object, which encapsulates some common utility
 * functions and properties to handle the Customer form and the related documents
 * on elasticsearch.
 * @class CustomerUtils
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 */
var CustomerUtils = function(req, res) {
    this.req = req;
    this.res = res;
};

/**
 * The fields of the Customer form.
 * @var
 */
CustomerUtils.formFields = [
    'name', 'surname', 'mobile_phone', 'phone', 'email', 'first_seen', 'discount',
    'allow_sms', 'allow_email', 'notes'];

/**
 * Transforms a local formatted date to the iso format.
 * @method
 *
 * @param {string} localFormattedDate the local formatted date.
 */
CustomerUtils.prototype.toISODate = function(localFormattedDate) {
    return common.toISODate(this.req, localFormattedDate);
};

/**
 * Transforms an iso format date to the local format defined in the configuration.
 * @method
 *
 * @param {string} ISODate the iso date.
 */
CustomerUtils.prototype.toLocalFormattedDate = function(ISODate) {
    return common.toLocalFormattedDate(this.req, ISODate);
};

/**
 * Returns an object which maps the form fields and buttons of the Customer form
 * with the related translated names.
 * @method
 *
 * @param {bool} editForm true if the form is for edit.
 */
CustomerUtils.prototype.formNames = function(editForm) {
    return {
        name: this.req.i18n.__('Name'),
        surname: this.req.i18n.__('Surname'),
        mobile_phone: this.req.i18n.__('Mobile Phone'),
        allow_sms: this.req.i18n.__('Allow sms'),
        phone: this.req.i18n.__('Phone'),
        email: this.req.i18n.__('Email'),
        allow_email: this.req.i18n.__('Allow email'),
        first_seen: this.req.i18n.__('First seen'),
        discount: this.req.i18n.__('Discount'),
        notes: this.req.i18n.__('Notes'),
        submit: editForm ? this.req.i18n.__('Edit customer') : this.req.i18n.__('Create customer'),
        submit_and_add: this.req.i18n.__('Create customer and appointment'),
        mandatoryFields: this.req.i18n.__('Fields marked with <span className="mandatory">*</span> are mandatory.')
    };
};

/**
 * Converts the source object to the format used to save the related document
 * on elasticsearch.
 * @method
 *
 * @param {object} sourceObj the source object originated from the Customer form.
 */
CustomerUtils.prototype.toElasticsearchFormat = function(sourceObj) {
    var obj = {};
    for (var i = 0; i < CustomerUtils.formFields.length; i++) {
        var field = CustomerUtils.formFields[i];
        if (sourceObj[field]) {
            if (field == 'first_seen')
                obj[field] = this.toISODate(sourceObj[field]);
            else if (field == 'allow_sms' || field == 'allow_email')
                obj[field] = sourceObj[field] === "true";
            else if (field == 'discount')
                obj[field] = parseInt(sourceObj[field], 10);
            else
                obj[field] = sourceObj[field];
        }
    }
    return obj;
};

/**
 * Converts the source object to the format used to present the data in the
 * Customer form.
 * @method
 *
 * @param {object} sourceObj the source object originated from the elasticsearch response.
 */
CustomerUtils.prototype.toViewFormat = function(sourceObj) {
    var obj = {};
    for (var i = 0; i < CustomerUtils.formFields.length; i++) {
        var field = CustomerUtils.formFields[i];
        if (sourceObj[field]) {
            if (field == 'first_seen')
                obj[field] = this.toLocalFormattedDate(sourceObj[field]);
            else if (field == 'discount')
                obj[field] = '' + sourceObj[field];
            else
                obj[field] = sourceObj[field];
        }
    }
    return obj;
};


/**
 * Validates the Customer form and returns the list of the errors if any.
 */
CustomerUtils.prototype.validateForm = function() {
    // Trim all the fields that allow the user to write text
    for (var i = 0; i < CustomerUtils.formFields.length; i++)
        this.req.sanitize(CustomerUtils.formFields[i]).trim();

    this.req.checkBody('name', this.req.i18n.__('The name is mandatory')).notEmpty();

    if (!this.req.body.mobile_phone)
        this.req.checkBody(
            'allow_sms', this.req.i18n.__(
                'To set allow sms, you must specify a mobile phone')).optional().isEmpty();

    if (!this.req.body.email) {
        this.req.checkBody('allow_email', this.req.i18n.__(
            'To set allow email, you must specify an email')).optional().isEmpty();
    }
    else {
        this.req.checkBody('email', this.req.i18n.__(
            'The email does not seem a valid email')).isEmail();
    }

    if (this.req.body.first_seen) {
        this.req.checkBody('first_seen', this.req.i18n.__(
            'The first date seen does not seem a valid date')).isValidDate();
    }

    return this.req.validationErrors();
};


router.get('/appointments/:date', function(req, res, next) {
    function getApps(callback) {
        var queryBody = {
            query: {
                bool: {
                    must: { term: { 'customer.appointments.date': req.params.date }}
                }
            }
        };

        client.search({
            index: req.config.mainIndex,
            type: 'customer',
            size: req.query.size ? req.query.size : 50,
            body: queryBody
        }, function(err, resp, respcode) {
            var appointments = [];
            for (var i = 0; i < resp.hits.hits.length; i++) {
                var hit = resp.hits.hits[i];

                for (var j = 0; j < hit._source.appointments.length; j++) {
                    if (hit._source.appointments[j].date === req.params.date) {
                        appointments[appointments.length] = {
                            id: hit._id,
                            appid: hit._source.appointments[j].appid,
                            fullname: util.format('%s %s', hit._source.name, hit._source.surname),
                            planned: false
                        };
                        break;
                    }
                }
            }
            callback(null, appointments);
        });
    }

    function getPlannedApps(callback) {
        var queryBody = {
            query: {
                bool: {
                    must: { term: { 'customer.planned_appointments.date': req.params.date }}
                }
            }
        };

        client.search({
            index: req.config.mainIndex,
            type: 'customer',
            size: req.query.size ?  req.query.size : 50,
            body: queryBody
        }, function(err, resp, respcode) {
            var appointments = [];
            for (var i = 0; i < resp.hits.hits.length; i++) {
                var hit = resp.hits.hits[i];
                for (var j = 0; j < hit._source.planned_appointments.length; j++) {
                    if (hit._source.planned_appointments[j].date === req.params.date) {
                        appointments[appointments.length] = {
                            id: hit._id,
                            appid: hit._source.planned_appointments[j].appid,
                            fullname: util.format('%s %s', hit._source.name, hit._source.surname),
                            planned: true
                        };
                        break;
                    }
                }
            }
            callback(null, appointments);
        });
    }

    function getPlannedCalendarApps(callback) {
        client.get({
            index: req.config.mainIndex,
            type: 'calendar',
            id: common.calendarDocId
        }, function(err, resp, respcode) {
            var appointments = [];

            if (resp.found && resp._source.days.length > 0) {
                var calDays = resp._source.days;
                for (var i = 0; i < calDays.length; i++) {
                    if (calDays[i].date === req.params.date) {
                        for (var j = 0; j < calDays[i].planned_appointments.length; j++) {
                            appointments.push({
                                id: undefined,
                                appid: calDays[i].planned_appointments[j].appid,
                                fullname: calDays[i].planned_appointments[j].fullname,
                                planned: true
                            });
                        }
                        break;
                    }
                }
                callback(null, appointments);
            }
        });
    }

    async.parallel(
        [getApps, getPlannedApps, getPlannedCalendarApps],
        function(err, results) {
            var appointments = [];
            var i, j;
            for (i = 0; i < results.length; i++) {
                for (j = 0; j < results[i].length; j++) {
                    appointments[appointments.length] = results[i][j];
                }
            }
            res.json({
                appointments: appointments
            });
        }
    );
});

router.post('/planned-appointments/:date', function(req, res, next) {

    function planOnCustomer(isodate, id) {
        client.get({
            index: req.config.mainIndex,
            type: 'customer',
            id: id
        }, function(err, resp, respcode) {
            var version = resp._version;
            var obj = resp._source;
            var appointmentId = uuid.v4();

            if (typeof obj.planned_appointments == 'undefined')
                obj.planned_appointments = [];

            obj.planned_appointments.push({
                appid: appointmentId,
                date: isodate
            });

            client.update({
                index: req.config.mainIndex,
                type: 'customer',
                id: id,
                version: version,
                body: {doc: obj}
            }, function(err, resp, respcode) {
                common.indexCb(req, res, err, resp, true, appointmentId);
            });
        });
    }

    function planOnCalendar(isodate, fullname) {
        client.get({
            index: req.config.mainIndex,
            type: 'calendar',
            id: common.calendarDocId
        }, function(err, resp, respcode) {
            var calDays = [];
            if (resp.found && resp._source.days.length > 0) {
                calDays = resp._source.days;
            }
            var dateFound = false;
            var appointmentId = uuid.v4();
            for (var i = 0; i < calDays.length; i++) {
                if (calDays[i].date === isodate) {
                    dateFound = true;
                    calDays[i].planned_appointments.push({
                        appid: appointmentId,
                        fullname: fullname
                    });
                }
            }
            if (!dateFound) {
                calDays.push({
                    date: isodate,
                    planned_appointments: [{
                        appid: appointmentId,
                        fullname: fullname
                    }]
                });
            }

            client.index({
                index: req.config.mainIndex,
                type: 'calendar',
                id: common.calendarDocId,
                body: {days: calDays}
            }, function(err, resp, respcode) {
                common.indexCb(req, res, err, resp, true, appointmentId);
            });
        });
    }

    var plannedDate = moment(req.params.date);
    if (!plannedDate.isValid()) {
        var errors = [{msg: req.i18n.__('The planned date is not valid')}];
        res.status(400).json({errors: errors});
        return;
    }

    var that = this;

    if (typeof req.body.id !== 'undefined') {
        planOnCustomer(plannedDate.format('YYYY-MM-DD'), req.body.id);
    }
    else {
        planOnCalendar(plannedDate.format('YYYY-MM-DD'), req.body.fullname);
    }

});

router.get('/:id/appointments', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        function descFn(item) {
            return item.description;
        }

        // sort by date (descending)
        function sortFn(a, b) {
            if (a._date < b._date)
                return 1;
            if (a._date > b._date)
                return -1;
            return 0;
        }

        var obj = resp._source;
        var appointments = [];

        if (typeof obj.appointments == 'undefined' || obj.appointments.length === 0) {
            res.json(appointments);
            return;
        }

        for (var i = 0; i < obj.appointments.length; i++) {
            appointments.push({
                appid: obj.appointments[i].appid,
                _date: obj.appointments[i].date,
                date: common.toLocalFormattedDate(req, obj.appointments[i].date),
                services: obj.appointments[i].services.map(descFn).join(' - '),
                deleteText: req.i18n.__('Delete appointment')
            });
        }
        appointments.sort(sortFn);
        res.json(appointments);
    });
});


/**
 * Creates a new AppointmentUtils object, which encapsulates some common utility
 * functions and properties to handle the Appointment form and the related documents
 * on elasticsearch.
 * @class AppointmentUtils
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 */
var AppointmentUtils = function(req, res) {
    this.req = req;
    this.res = res;
};

/**
 * Handles the Appointment form, creating / updating a new document if the form
 * content validation passes, or displaying the proper error messages if not.
 * @method
 */
AppointmentUtils.prototype.handleForm = function() {
    var that = this;
    client.get({
        index: that.req.config.mainIndex,
        type: 'customer',
        id: that.req.params.id
    }, function(err, resp, respcode) {
        var version = resp._version;
        var obj = resp._source;

        var services = [];
        for (var i = 0; i < that.req.body.services.length; i++) {
            var item = that.req.body.services[i];
            if (item.enabled && item.description.trim().length > 0) {
                services.push({
                    description: item.description.trim(),
                    worker: item.worker
                });
            }
        }

        if (services.length === 0) {
            var errors = [{msg: that.req.i18n.__('At least one service is mandatory')}];
            that.res.status(400).json({errors: errors});
            return;
        }


        var newItem = false;
        var appointment = {
            appid: that.req.params.appid,
            date: common.toISODate(that.req, that.req.body.date),
            services: services,
            notes: that.req.body.notes
        };

        if (typeof that.req.params.appid === 'undefined') {
            newItem = true;
            appointment.appid = uuid.v4();
        }

        if (newItem) {
            if (typeof obj.appointments == 'undefined')
                obj.appointments = [];

            obj.appointments.push(appointment);
        }
        else {
            for (var j = 0; j < obj.appointments.length; j++) {
                if (obj.appointments[i].appid === that.req.params.appid) {
                    obj.appointments[j] = appointment;
                    break;
                }
            }
        }
        updateLastSeen(obj);

        client.update({
            index: that.req.config.mainIndex,
            type: 'customer',
            id: that.req.params.id,
            version: version,
            body: {doc: obj}
        }, function(err, resp, respcode) {
            common.indexCb(that.req, that.res, err, resp, newItem, appointment.appid);
        });
    });
};


/**
 * Returns the color associated to the given worker.
 * @method
 *
 * @param {string} worker the name of the worker.
 * @param {object} workers the list of the workers extracted from elasticsearch.
 */
AppointmentUtils.prototype.getWorkerColor = function(worker, workers) {
    for (var j = 0; j < workers.length; j++) {
        if (workers[j].name == worker) {
            return workers[j].color;
        }
    }
    return this.req.config.defaultWorkerColor;
};


router.use(['/:id/appointments*'], function (req, res, next) {
    req.utils = new AppointmentUtils(req, res);
    next();
});


router.get('/:id/appointments/:appid', function(req, res, next) {
    client.mget({
        body: {
            docs: [
                {_index: req.config.mainIndex, _type: 'customer', _id: req.params.id},
                {_index: req.config.mainIndex, _type: 'workers', _id: common.workersDocId}
            ]
        }
    }, function(err, resp, respcode) {

        var appointment;
        for (var j = 0; j < resp.docs[0]._source.appointments.length; j++) {
            if (resp.docs[0]._source.appointments[j].appid === req.params.appid) {
                appointment = resp.docs[0]._source.appointments[j];
                break;
            }
        }

        if (typeof appointment === 'undefined') {
            res.sendStatus(404);
            return;
        }

        var workers = resp.docs[1]._source.workers;
        var services = [];

        for (var i = 0; i < appointment.services.length; i++)
            services.push({
                description: appointment.services[i].description,
                worker: {
                    name: appointment.services[i].worker,
                    color: req.utils.getWorkerColor(appointment.services[i].worker, workers)
                },
                checked: true
            });

        res.json({
            workers: workers,
            date: common.toLocalFormattedDate(req, appointment.date),
            services: services,
            notes: appointment.notes
        });
    });
});

router.post('/:id/appointments', function(req, res, next) {
    req.utils.handleForm();
});

router.put('/:id/appointments/:appid', function(req, res, next) {
    req.utils.handleForm();
});

router.delete('/:id/appointments/:appid', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        var version = resp._version;
        var obj = resp._source;

        if (err) {
            console.log(err);
            res.status(400).end();
            return;
        }

        var index = -1;
        for (var i = 0; i < obj.appointments.length; i++) {
            if (obj.appointments[i].appid === req.params.appid) {
                index = i;
                break;
            }
        }

        if (index === -1) {
            res.sendStatus(404);
            return;
        }

        obj.appointments.splice(index, 1);
        updateLastSeen(obj);

        client.update({
            index: req.config.mainIndex,
            type: 'customer',
            id: req.params.id,
            version: version,
            refresh: true,
            body: {
                doc: obj
            }
        }, function(err, resp, respcode) {
            if (err) {
                console.log(err);
                res.status(400).end();
            }
            else {
                res.status(200).end();
            }
        });
    });
});

/** The customers router. */
module.exports.router = router;
/** The customer routes base path. */
module.exports.path = customersPath;
