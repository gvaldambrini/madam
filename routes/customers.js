var express = require('express');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var utils = require('../utils');
var client = utils.createClient();
var esErrors = elasticsearch.errors;
var customersPath = '/customers';
var moment = require('moment');


router.use(function (request, response, next) {
  // everything inside this file is under the active view 'customers'
  response.locals.isCustomersActive = true;
  response.locals.title = request.i18n.__('Customers'),
  next();
});

// Helper function to retrieve the url for a single customer based route
function getCustomerUrl(req, route, customerId) {
    var cid = typeof customerId == 'undefined' ? req.params.id : customerId;
    return getCustomersUrl(req, cid + '/' + route);
}

// Helper function to retrieve the url for a customers based route
function getCustomersUrl(req, route) {
    return req.protocol + "://" + req.get('host') + customersPath + '/' + route;
}

// Middleware to expose shared templates to the client side.
function exposeTemplates(req, res, next) {

    req.app.hbs.getTemplates('views/shared/', {
        cache: req.app.enabled('view cache'),
        precompiled: true
    }).then(function (templates) {
        var extRegex = new RegExp(req.app.hbs.extname + '$');

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        templates = Object.keys(templates).map(function (name) {
            return {
                name: name.replace(extRegex, ''),
                template: templates[name]
            };
        });

        // Exposes the templates during view rendering.
        if (templates.length) {
            res.locals.templates = templates;
        }

        setImmediate(next);
    })
    .catch(next);
}

function processElasticsearchResults(req, hits) {

    function getField(hit, field, field_type) {
        if (hit.highlight && hit.highlight[field + '.' + field_type])
            return hit.highlight[field + '.' + field_type][0];

        return hit._source[field];
    }

    var results = [];
    for (var i = 0; i < hits.length; i++) {
        var phone = getField(hits[i], 'phone', 'partial');
        var mobile = getField(hits[i], 'mobile_phone', 'partial');

        var phone_mpbile;
        if (phone && mobile)
            phone_mpbile = mobile + ' / ' + phone;
        else if (mobile)
            phone_mpbile = mobile;
        else
            phone_mpbile = phone;

        results[results.length] = {
            edit_url: getCustomerUrl(req, 'edit', hits[i]._id),
            name: getField(hits[i], 'name', 'autocomplete'),
            surname: getField(hits[i], 'surname', 'autocomplete'),
            phone: phone_mpbile,
            header_name: req.i18n.__('Name'),
            header_surname: req.i18n.__('Surname'),
            header_phone: req.i18n.__('Mobile') + ' / ' + req.i18n.__('Phone'),
        };
    }
    return results;
}

router.get('/search', function(req, res, next) {
    client.search({
        index: 'main',
        type: 'customer',
        size: 50,
        body: {
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
        }
    }, function(err, resp, respcode) {
        var results = processElasticsearchResults(req, resp.hits.hits);
        res.json(results);
    });
});

router.get('/', exposeTemplates, function(req, res, next) {
    client.search({
        index: 'main',
        type: 'customer',
        size: 50,
        body: {
            query: {
                match_all: {}
            }
        }
    }, function(err, resp, respcode) {
        var results = processElasticsearchResults(req, resp.hits.hits);
        res.render('customers', {
            customers: results,
            newCustomerUrl: getCustomersUrl(req, 'new'),
            searchUrl: getCustomersUrl(req, 'search')
        });
    });
});


function toISODate(req, localFormattedDate) {
    return moment.utc(localFormattedDate, req.config.date_format).format('YYYY-MM-DD');
}

function toLocalFormattedDate(req, ISODate) {
    return moment.utc(ISODate, 'YYYY-MM-DD').format(req.config.date_format);
}

var customerUtils = {
    init: function(req, res) {
        this.req = req;
        this.res = res;
    },

    toISODate: function(localFormattedDate) {
        return toISODate(this.req, localFormattedDate);
    },

    toLocalFormattedDate: function(ISODate) {
        return toLocalFormattedDate(this.req, ISODate);
    },

    formFields: ['name', 'surname', 'mobile_phone', 'phone', 'email', 'first_see', 'last_see', 'allow_sms', 'allow_email'],

    formNames: function() {
        return {
            'name': this.req.i18n.__('Name'),
            'surname': this.req.i18n.__('Surname'),
            'mobile_phone': this.req.i18n.__('Mobile Phone'),
            'allow_sms': this.req.i18n.__('Allow sms'),
            'phone': this.req.i18n.__('Phone'),
            'email': this.req.i18n.__('Email'),
            'allow_email': this.req.i18n.__('Allow email'),
            'first_see': this.req.i18n.__('First see'),
            'last_see': this.req.i18n.__('Last see')
        };
    },

    toElasticsearchFormat: function(sourceObj) {
        var obj = {};
        for (var i = 0; i < this.formFields.length; i++) {
            var field = this.formFields[i];
            if (sourceObj[field]) {
                if (field == 'first_see' || field == 'last_see')
                    obj[field] = this.toISODate(sourceObj[field]);
                else if (field == 'allow_sms' || field == 'allow_email')
                    obj[field] = sourceObj[field] == 'on'
                else
                    obj[field] = sourceObj[field];
            }
        }
        return obj;
    },

    toViewFormat: function(sourceObj) {
        var obj = {};
        for (var i = 0; i < this.formFields.length; i++) {
            var field = this.formFields[i];
            if (sourceObj[field]) {
                if (field == 'first_see' || field == 'last_see')
                    obj[field] = this.toLocalFormattedDate(sourceObj[field]);
                else
                    obj[field] = sourceObj[field];
            }
        }
        return obj;
    },

    handleForm: function(title) {
        // Trim all the fields that allow the user write text
        for (var i = 0; i < this.formFields.length; i++)
            this.req.sanitize(this.formFields[i]).trim();

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

            this.res.render('customer', {
                title: title,
                form_names: this.formNames(),
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
            index: 'main',
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
                that.res.render('customer', {
                    title: title,
                    form_names: that.formNames(),
                    isInfoActive: true,
                    isAppointmentsDisabled: appDisabled,
                    appointmentsUrl: appDisabled ? '#' :
                        getCustomerUrl(that.req, 'appointments'),
                    flash: { type: 'alert-danger', messages: messages},
                    obj: that.req.body
                });
            }
        });
    }
};


router.use(['/new', '*edit'], function (req, res, next) {
    customerUtils.init(req, res);
    next();
});

router.get('/new', function(req, res, next) {
    res.render('customer', {
        title: req.i18n.__('Create new customer'),
        form_names: customerUtils.formNames(),
        isInfoActive: true,
        isAppointmentsDisabled: true,
        appointmentsUrl: '#',
        obj: {}
    });
});

router.post('/new', function(req, res, next) {
    customerUtils.handleForm(req.i18n.__('Create new customer'));
});

function getTitle(esObj) {
    if (esObj.name && esObj.surname)
        return 'Edit ' + esObj.name + ' ' + esObj.surname;

    return 'Edit ' + esObj.name;
}

router.get('/:id/edit', function(req, res, next) {
    client.get({
        index: 'main',
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        res.render('customer', {
            title: getTitle(resp._source),
            form_names: customerUtils.formNames(),
            isInfoActive: true,
            isAppointmentsDisabled: false,
            appointmentsUrl: getCustomerUrl(req, 'appointments'),
            obj: customerUtils.toViewFormat(resp._source)
        });
    });
});

router.post('/:id/edit', function(req, res, next) {
    client.get({
        index: 'main',
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        customerUtils.handleForm(getTitle(resp._source));
    });
});

router.get('/:id/appointments', function(req, res, next) {
    client.get({
        index: 'main',
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        var obj = resp._source;
        if (typeof obj.appointments == 'undefined' || obj.appointments.length == 0)
            res.redirect(getCustomerUrl(req, 'appointments/new'));
        else {
            function descFn(item) {
                return item.description;
            }

            var appointments = [];
            for (var i = 0; i < obj.appointments.length; i++) {
                appointments.push({
                    date: obj.appointments[i].date,
                    services: obj.appointments[i].services.map(descFn).join(' - ')
                });
            }

            res.render('appointments', {
                title: req.i18n.__('Appointments'),
                infoUrl: getCustomerUrl(req, 'edit'),
                isAppointmentsActive: true,
                appointmentsUrl: getCustomerUrl(req, 'appointments'),
                newAppointmentUrl: getCustomerUrl(req, 'appointments/new'),
                appointments: appointments
            });
        }
    });
});

router.get('/:id/appointments/new', function(req, res, next) {
    client.mget({
        body: {
            docs: [
                {_index: 'main', _type: 'workers', _id: utils.workersDocId},
                {_index: 'main', _type: 'services', _id: utils.servicesDocId}
            ]
        }
    }, function(err, resp, respcode) {
        res.render('appointment', {
            title: req.i18n.__('New Appointment'),
            infoUrl: getCustomerUrl(req, 'edit'),
            isAppointmentsActive: true,
            appointmentsUrl: getCustomerUrl(req, 'appointments'),
            workers: resp.docs[0]._source['names'],
            services: resp.docs[1]._source['names']
        });
    });
});

router.post('/:id/appointments/new', function(req, res, next) {

    // starting from es 1.4.3 groovy dynamic scripting is no longer available
    // by default, so we fallback to a get/update implementation.

    client.get({
        index: 'main',
        type: 'customer',
        id: req.params.id
    }, function(err, resp, respcode) {

        var version = resp._version;
        var obj = resp._source;

        function filterFn(item, index) {
            return req.body.cb_enable.indexOf(index.toString()) != -1;
        }

        var descriptions = req.body.service.filter(filterFn);
        var workers = req.body.worker.filter(filterFn);

        var services = [];
        for (var i = 0; i < descriptions.length; i++) {
            services.push({
                description: descriptions[i],
                worker: workers[i]
            });
        }

        if (typeof obj.appointments == 'undefined')
            obj.appointments = [];

        obj.appointments.push({
            date: toISODate(req, req.body.date),
            services: services
        });

        client.update({
            index: 'main',
            type: 'customer',
            id: req.params.id,
            version: version,
            body: {
                doc: obj
            }
        }, function(err, resp, respcode) {

            if (!err) {
                res.redirect(getCustomerUrl(req, 'appointments'));
            }
            else {
                console.log(err);
                // TODO: render errors

                client.mget({
                    body: {
                        docs: [
                            {_index: 'main', _type: 'workers', _id: utils.workersDocId},
                            {_index: 'main', _type: 'services', _id: utils.servicesDocId}
                        ]
                    }
                }, function(err, resp, respcode) {
                    res.render('appointment', {
                        title: req.i18n.__('New Appointment'),
                        infoUrl: getCustomerUrl(req, 'edit'),
                        isAppointmentsActive: true,
                        appointmentsUrl: getCustomerUrl(req, 'appointments'),
                        workers: resp.docs[0]._source['names'],
                        services: resp.docs[1]._source['names']
                    });
                });
            }
        });
    });
});


module.exports.router = router;
module.exports.path = customersPath;
