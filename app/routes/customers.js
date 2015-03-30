var express = require('express');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var client = new elasticsearch.Client();
var esErrors = elasticsearch.errors;
var customersPath = '/customers';
var moment = require('moment');


function getCustomerUrl(req, route) {
    return req.protocol + "://" + req.get('host') + customersPath + '/' + route;
}

router.get('/', function(req, res, next) {
    client.search({
        index: 'customers',
        size: 50,
        body: {
            query: {
                match_all: {}
            }
        }
    }, function(err, resp, respcode) {
        var results = [];
        var hits = resp.hits.hits;
        for (var i = 0; i < hits.length; i++) {
            var phone;
            if (hits[i]._source.phone && hits[i]._source.mobile_phone) {
                phone = hits[i]._source.mobile_phone + ' / ' + hits[i]._source.phone;
            }
            else if (hits[i]._source.mobile_phone) {
                phone = hits[i]._source.mobile_phone;
            }
            else
                phone = hits[i]._source.phone;
            results[results.length] = {
                edit_url: getCustomerUrl(req, 'edit/' + hits[i]._id),
                name: hits[i]._source.name,
                surname: hits[i]._source.surname,
                phone: phone,
            };
        }
        res.render('customers', {
            title: req.i18n.__('Customers'),
            customers: results,
            newCustomerUrl: getCustomerUrl(req, 'new')
        });
    });
});

var customerUtils = {
    init: function(req, res) {
        this.req = req;
        this.res = res;
    },

    toISODate: function(localFormattedDate) {
        return moment.utc(localFormattedDate, this.req.config.date_format).format('YYYY-MM-DD');
    },

    toLocalFormattedDate: function(ISODate) {
        return moment.utc(ISODate, 'YYYY-MM-DD').format(this.req.config.date_format);
    },

    bootstrapDateFormat: function() {
        return this.req.config.date_format.toLowerCase();
    },

    formFields: ['name', 'surname', 'mobile_phone', 'phone', 'email', 'first_see', 'last_see'],

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
            this.res.render('customer', {
                title: title,
                form_names: this.formNames(),
                date_format: this.bootstrapDateFormat(),
                language: this.req.config.preferred_locale,
                flash: { type: 'alert-danger', messages: errors},
                obj: this.req.body
            });
            return;
        }

        var args = {
            index: 'customers',
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
                    messages = ['Database connection error'];
                else
                    messages = ['Database error'];
                console.error(err);

                that.res.render('customer', {
                    title: title,
                    form_names: that.formNames(),
                    date_format: that.bootstrapDateFormat(),
                    language: that.req.config.preferred_locale,
                    flash: { type: 'alert-danger', messages: messages},
                    obj: that.req.body
                });
            }
        });
    }
};


router.use(['/new', '/edit*'], function (req, res, next) {
    customerUtils.init(req, res);
    next();
});

router.get('/new', function(req, res, next) {
    res.render('customer', {
        title: req.i18n.__('Create new customer'),
        form_names: customerUtils.formNames(),
        date_format: customerUtils.bootstrapDateFormat(),
        language: req.config.preferred_locale,
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

router.get('/edit/:id', function(req, res, next) {
    client.get({
        index:'customers',
        type:'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        res.render('customer', {
            title: getTitle(resp._source),
            form_names: customerUtils.formNames(),
            date_format: customerUtils.bootstrapDateFormat(),
            language: req.config.preferred_locale,
            obj: customerUtils.toViewFormat(resp._source)
        });
    });
});

router.post('/edit/:id', function(req, res, next) {
    client.get({
        index:'customers',
        type:'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        customerUtils.handleForm(getTitle(resp._source));
    });
});

module.exports.router = router;
module.exports.path = customersPath;
