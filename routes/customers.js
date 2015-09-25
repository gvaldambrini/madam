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

router.use(common.isAuthenticated);
router.use(function (request, response, next) {
  // everything inside this file is under the active view 'customers'
  response.locals.isCustomersActive = true;
  next();
});

/**
 * Helper function to build the url for a single customer based route.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {string} route the base route path.
 * @param {string} [customerId] the customer id, which will be extracted from the request if not provided.
 */
function getCustomerUrl(req, route, customerId) {
    var cid = typeof customerId == 'undefined' ? req.params.id : customerId;
    return getCustomersUrl(req, cid + '/' + route);
}

/**
 * Helper function to build the url for a customer based route.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {string} route the base route path.
 */
function getCustomersUrl(req, route) {
    return req.protocol + "://" + req.get('host') + customersPath + '/' + route;
}

/**
 * Helper function to build an arbitrary url.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {string} the path.
 */
function getUrl(req, path) {
    return req.protocol + "://" + req.get('host') + path;
}

/**
 * Return the full name of the customer.
 * @function
 *
 * @param {object} obj the customer object fetched from elasticsearch
 */
function getCustomerName(obj) {
    if (typeof obj.surname !== 'undefined') {
        return obj.name + ' ' + obj.surname;
    }
    return obj.name;
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
        else
            phone_mobile = phone;

        results[results.length] = {
            urlEdit: getCustomerUrl(req, 'edit', hits[i]._id),
            urlDelete: getCustomerUrl(req, 'delete', hits[i]._id),
            name: getField(hits[i], 'name', 'autocomplete'),
            surname: getField(hits[i], 'surname', 'autocomplete'),
            phone: phone_mobile
        };
    }

    results.sort(sortFn);
    return results;
}

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
            emptyMsg: req.i18n.__('No customers to display.'),
            customers: processElasticsearchResults(req, resp.hits.hits)
        });
    });
});

router.get('/', common.exposeTemplates, function(req, res, next) {
    client.search({
        index: req.config.mainIndex,
        type: 'customer',
        size: 50,
        body: {
            query: {
                match_all: {}
            }
        }
    }, function(err, resp, respcode) {
        res.render('customers', {
            i18n: {
                title: req.i18n.__('Customers'),
                createNewCustomer: req.i18n.__('Create new customer'),
                search: req.i18n.__('Search...'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                deleteTitle: req.i18n.__('Delete the customer?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?')

            },
            customersData: {
                headerName: req.i18n.__('Name'),
                headerSurname: req.i18n.__('Surname'),
                headerPhone: req.i18n.__('Mobile') + ' / ' + req.i18n.__('Phone'),
                emptyMsg: req.i18n.__('No customers to display.'),
                customers: processElasticsearchResults(req, resp.hits.hits)
            },
            urlNew: getCustomersUrl(req, 'new'),
            urlSearch: getCustomersUrl(req, 'search')
        });
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
    'name', 'surname', 'mobile_phone', 'phone', 'email',
    'first_see', 'last_see', 'allow_sms', 'allow_email', 'notes'];

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
 */
CustomerUtils.prototype.formNames = function() {
    return {
        name: this.req.i18n.__('Name'),
        surname: this.req.i18n.__('Surname'),
        mobile_phone: this.req.i18n.__('Mobile Phone'),
        allow_sms: this.req.i18n.__('Allow sms'),
        phone: this.req.i18n.__('Phone'),
        email: this.req.i18n.__('Email'),
        allow_email: this.req.i18n.__('Allow email'),
        first_see: this.req.i18n.__('First see'),
        last_see: this.req.i18n.__('Last see'),
        discount: this.req.i18n.__('Discount'),
        notes: this.req.i18n.__('Notes'),
        submit: this.req.i18n.__('Submit')
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
            if (field == 'first_see' || field == 'last_see')
                obj[field] = this.toISODate(sourceObj[field]);
            else if (field == 'allow_sms' || field == 'allow_email')
                obj[field] = sourceObj[field] == 'on';
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
            if (field == 'first_see' || field == 'last_see')
                obj[field] = this.toLocalFormattedDate(sourceObj[field]);
            else
                obj[field] = sourceObj[field];
        }
    }
    return obj;
};

/**
 * Handles the Customer form, creating / updating a new document if the form
 * content validation passes, or displaying the proper error messages if not.
 * @method
 *
 * @param {string} title the title of the form.
 */
CustomerUtils.prototype.handleForm = function(title) {
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

    if (this.req.body.first_see) {
        this.req.checkBody('first_see', this.req.i18n.__(
            'The first date does not seem a valid date')).isValidDate();
    }
    if (this.req.body.last_see) {
        this.req.checkBody('last_see', this.req.i18n.__(
            'The last date does not seem a valid date')).isValidDate();
    }

    var errors = this.req.validationErrors();
    if (errors) {
        var appDisabled = typeof this.req.params.id == 'undefined';
        var i18n = this.formNames();
        i18n.title = title;
        i18n.info = this.req.i18n.__('Info');
        i18n.appointments = this.req.i18n.__('Appointments');

        this.res.render('customer', {
            i18n: i18n,
            isInfoActive: true,
            isAppointmentsDisabled: appDisabled,
            appointmentsUrl: appDisabled ? '#' :
                getCustomerUrl(this.req, 'appointments'),
            flash: { type: 'alert-danger', messages: errors},
            obj: this.req.body
        });
        return;
    }

    var args = {
        index: this.req.config.mainIndex,
        type: 'customer',
        refresh: true,
        body: this.toElasticsearchFormat(this.req.body)
    };
    if (typeof this.req.params.id != 'undefined')
        args.id = this.req.params.id;

    var that = this;  // workaround for the this visibility problem inside inner functions.
    client.index(args, function(err, resp, respcode) {
        if (!err) {
            // redirect does not take into account being in inside a router
            that.res.redirect(customersPath);
        }
        else {
            var messages;
            if (err instanceof esErrors.NoConnections)
                messages = [{msg: that.req.i18n.__('Database connection error')}];
            else
                messages = [{msg: that.req.i18n.__('Database error')}];
            console.error(err);

            var appDisabled = typeof that.req.params.id == 'undefined';
            var i18n = that.formNames();
            i18n.title = title;
            i18n.info = that.req.i18n.__('Info');
            i18n.appointments = that.req.i18n.__('Appointments');


            that.res.render('customer', {
                i18n: i18n,
                isInfoActive: true,
                isAppointmentsDisabled: appDisabled,
                appointmentsUrl: appDisabled ? '#' :
                    getCustomerUrl(that.req, 'appointments'),
                flash: { type: 'alert-danger', messages: messages},
                obj: that.req.body
            });
        }
    });
};


router.use(['/new', '*edit'], function (req, res, next) {
    req.utils = new CustomerUtils(req, res);
    next();
});

router.get('/new', function(req, res, next) {
    var i18n = req.utils.formNames();
    i18n.title = req.i18n.__('Create new customer');
    i18n.info = req.i18n.__('Info');
    i18n.appointments = req.i18n.__('Appointments');

    res.render('customer', {
        i18n: i18n,
        isInfoActive: true,
        isAppointmentsDisabled: true,
        appointmentsUrl: '#',
        obj: {}
    });
});

router.post('/new', function(req, res, next) {
    req.utils.handleForm(req.i18n.__('Create new customer'));
});

router.get('/:id/edit', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        var i18n = req.utils.formNames();
        i18n.title = req.i18n.__('Edit') + ' ' + getCustomerName(resp._source);
        i18n.info = req.i18n.__('Info');
        i18n.appointments = req.i18n.__('Appointments');

        res.render('customer', {
            i18n: i18n,
            isInfoActive: true,
            isAppointmentsDisabled: false,
            appointmentsUrl: getCustomerUrl(req, 'appointments'),
            obj: req.utils.toViewFormat(resp._source)
        });
    });
});

router.post('/:id/edit', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        req.utils.handleForm(req.i18n.__('Edit') + ' ' + getCustomerName(resp._source));
    });
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
            if (a.date < b.date)
                return 1;
            if (a.date > b.date)
                return -1;
            return 0;
        }

        var obj = resp._source;
        if (typeof obj.appointments == 'undefined' || obj.appointments.length === 0)
            res.redirect(getCustomerUrl(req, 'appointments/new'));
        else {
            var appointments = [];
            for (var i = 0; i < obj.appointments.length; i++) {
                appointments.push({
                    date: obj.appointments[i].date,
                    services: obj.appointments[i].services.map(descFn).join(' - '),
                    urlEdit: getCustomerUrl(req, 'appointments/' + i + '/edit'),
                    urlDelete: getCustomerUrl(req, 'appointments/' + i + '/delete')
                });
            }
            appointments.sort(sortFn);

            res.render('appointments', {
                i18n: {
                    title: req.i18n.__('Appointments'),
                    info: req.i18n.__('Info'),
                    appointments: req.i18n.__('Appointments'),
                    date: req.i18n.__('Date'),
                    services: req.i18n.__('Services'),
                    createNew: req.i18n.__('Create new'),
                    btnConfirm: req.i18n.__('Confirm'),
                    btnCancel: req.i18n.__('Cancel'),
                    deleteTitle: req.i18n.__('Delete the appointment?'),
                    deleteMsg: req.i18n.__('The operation cannot be undone. Continue?')
                },
                infoUrl: getCustomerUrl(req, 'edit'),
                isAppointmentsActive: true,
                appointmentsUrl: getCustomerUrl(req, 'appointments'),
                urlNew: getCustomerUrl(req, 'appointments/new'),
                appointments: appointments,
                customer: getCustomerName(obj)
            });
        }
    });
});

router.post('/:id/delete', function(req, res, next) {
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
 *
 * @param {string} title the title of the form.
 */
AppointmentUtils.prototype.handleForm = function(title) {
    var that = this;
    that.req.body.service = common.toArray(that.req.body.service);
    that.req.body.worker = common.toArray(that.req.body.worker);

    // starting from es 1.4.3 groovy dynamic scripting is no longer available
    // by default, so we fallback to a get/update implementation.
    client.mget({
        body: {
            docs: [
                {_index: this.req.config.mainIndex, _type: 'customer', _id: this.req.params.id},
                {_index: this.req.config.mainIndex, _type: 'workers', _id: common.workersDocId}
            ]
        }
    }, function(err, resp, respcode) {

        function filterServices(req) {
            function filterFn(item, index) {
                return that.req.body.enabled.indexOf(index.toString()) != -1 && item.trim().length > 0;
            }

            var descriptions = that.req.body.service.filter(filterFn);
            var workers = that.req.body.worker.filter(filterFn);

            var services = [];
            for (var i = 0; i < descriptions.length; i++) {
                services.push({
                    description: descriptions[i],
                    worker: workers[i]
                });
            }
            return services;
        }

        var version = resp.docs[0]._version;
        var obj = resp.docs[0]._source;
        var workers = resp.docs[1]._source.workers;

        var params = {
            i18n: {
                title: title,
                info: that.req.i18n.__('Info'),
                appointments: that.req.i18n.__('Appointments'),
                date: that.req.i18n.__('Date'),
                notes: that.req.i18n.__('Notes'),
                addService: that.req.i18n.__('Add service'),
                submit: that.req.i18n.__('Submit')
            },
            infoUrl: getCustomerUrl(that.req, 'edit'),
            isAppointmentsActive: true,
            appointmentsUrl: getCustomerUrl(that.req, 'appointments'),
            workers: workers,
            date: that.req.body.date,
            customer: getCustomerName(obj)
        };

        if (typeof that.req.body.enabled == 'undefined' || that.req.body.enabled.length === 0) {
            var services = [];
            for (var i = 0; i < that.req.body.service.length; i++) {
                services.push({
                    description: that.req.body.service[i],
                    worker: {
                        name: that.req.body.worker[i],
                        color: that.getWorkerColor(that.req.body.worker[i], workers)
                    },
                    checked: false
                });
            }
            params.services = services;
            params.flash = {
                type: 'alert-danger',
                messages: [{msg: that.req.i18n.__('At least one service is mandatory')}]
            };
            that.res.render('appointment', params);
            return;
        }

        var appointment = {
            date: common.toISODate(that.req, that.req.body.date),
            services: filterServices(that.req),
            notes: that.req.body.notes
        };

        if (typeof that.req.params.appnum == 'undefined') {
            if (typeof obj.appointments == 'undefined')
                obj.appointments = [];

            obj.appointments.push(appointment);
        }
        else {
            obj.appointments[that.req.params.appnum] = appointment;
        }

        client.update({
            index: that.req.config.mainIndex,
            type: 'customer',
            id: that.req.params.id,
            version: version,
            body: {
                doc: obj
            }
        }, function(err, resp, respcode) {

            if (!err) {
                that.res.redirect(getCustomerUrl(that.req, 'appointments'));
            }
            else {
                console.log(err);

                if (err instanceof esErrors.NoConnections)
                    messages = [{msg: that.req.i18n.__('Database connection error')}];
                else
                    messages = [{msg: that.req.i18n.__('Database error')}];

                var services = [];
                for (var i = 0; i < that.req.body.service.length; i++) {
                    services.push({
                        description: that.req.body.service[i],
                        worker: {
                            name: that.req.body.worker[i],
                            color: that.getWorkerColor(that.req.body.worker[i], workers)
                        },
                        checked: that.req.body.enabled.indexOf(i.toString()) != -1
                    });
                }
                params.services = services;
                params.flash = {
                    type: 'alert-danger',
                    messages: messages
                };
                that.res.render('appointment', params);
            }
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


router.use(['/:id/appointments/new', '/:id/appointments/*edit'], function (req, res, next) {
    req.utils = new AppointmentUtils(req, res);
    next();
});

router.get('/:id/appointments/new', function(req, res, next) {
    client.mget({
        body: {
            docs: [
                {_index: req.config.mainIndex, _type: 'customer', _id: req.params.id},
                {_index: req.config.mainIndex, _type: 'workers', _id: common.workersDocId},
                {_index: req.config.mainIndex, _type: 'services', _id: common.servicesDocId}
            ]
        }
    }, function(err, resp, respcode) {
        var workers = [];
        if (typeof resp.docs[1]._source !== 'undefined') {
            workers = resp.docs[1]._source.workers;
        }
        var services = [];
        if (resp.docs[2]._source) {
            for (var i = 0; i < resp.docs[2]._source.names.length; i++) {
                services.push({
                    description: resp.docs[2]._source.names[i],
                    worker: workers[0],
                    checked: false
                });
            }
        }
        res.render('appointment', {
            i18n: {
                title: req.i18n.__('New appointment'),
                info: req.i18n.__('Info'),
                appointments: req.i18n.__('Appointments'),
                date: req.i18n.__('Date'),
                notes: req.i18n.__('Notes'),
                addService: req.i18n.__('Add service'),
                submit: req.i18n.__('Submit'),
                setWorkersMsg: req.i18n.__(
                    'To create an appointment, you have first to <a href="%s">define the workers.</a>',
                    getUrl(req, '/settings/workers')),
                setServicesMsg: req.i18n.__(
                    'To create an appointment, you have first to <a href="%s">define the common services.</a>',
                    getUrl(req, '/settings/services'))
            },
            infoUrl: getCustomerUrl(req, 'edit'),
            isAppointmentsActive: true,
            appointmentsUrl: getCustomerUrl(req, 'appointments'),
            workers: workers,
            date: common.toLocalFormattedDate(req, moment()),
            services: services,
            notes: '',
            customer: getCustomerName(resp.docs[0]._source)
        });
    });
});

router.post('/:id/appointments/new', function(req, res, next) {
    req.utils.handleForm(req.i18n.__('New appointment'));
});

router.get('/:id/appointments/:appnum/edit', function(req, res, next) {
    client.mget({
        body: {
            docs: [
                {_index: req.config.mainIndex, _type: 'customer', _id: req.params.id},
                {_index: req.config.mainIndex, _type: 'workers', _id: common.workersDocId}
            ]
        }
    }, function(err, resp, respcode) {
        var appointment = resp.docs[0]._source.appointments[req.params.appnum];
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

        res.render('appointment', {
            i18n: {
                title: req.i18n.__('Edit appointment'),
                info: req.i18n.__('Info'),
                appointments: req.i18n.__('Appointments'),
                date: req.i18n.__('Date'),
                notes: req.i18n.__('Notes'),
                addService: req.i18n.__('Add service'),
                submit: req.i18n.__('Submit')
            },
            infoUrl: getCustomerUrl(req, 'edit'),
            isAppointmentsActive: true,
            appointmentsUrl: getCustomerUrl(req, 'appointments'),
            workers: workers,
            date: common.toLocalFormattedDate(req, appointment.date),
            services: services,
            notes: appointment.notes,
            customer: getCustomerName(resp.docs[0]._source)
        });
    });
});

router.post('/:id/appointments/:appnum/edit', function(req, res, next) {
    req.utils.handleForm(req.i18n.__('Edit appointment'));
});

router.post('/:id/appointments/:appnum/delete', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        var version = resp._version;
        var obj = resp._source;
        var index = req.params.appnum;

        if (err) {
            console.log(err);
            res.status(400).end();
            return;
        }
        if (index < 0 || index >= obj.appointments.length) {
            console.log('Wrong index:', index, 'in removing appointment for customer:', req.params.id);
            res.status(400).end();
            return;
        }
        obj.appointments.splice(index, 1);

        client.update({
            index: req.config.mainIndex,
            type: 'customer',
            id: req.params.id,
            version: version,
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
