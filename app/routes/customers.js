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

function toISODate(req, localFormattedDate) {
    return moment.utc(localFormattedDate, req.config.date_format).format('YYYY-MM-DD');
}

function toLocalFormattedDate(req, ISODate) {
    return moment.utc(ISODate, 'YYYY-MM-DD').format(req.config.date_format);
}

function bootstrapDateFormat(date_format) {
    return date_format.toLowerCase();
}

var customerFormFields = ['name', 'surname', 'mobile_phone', 'phone', 'email', 'first_see', 'last_see'];

function customerFormNames(req) {
    return {
        'name': req.i18n.__('Name'),
        'surname': req.i18n.__('Surname'),
        'mobile_phone': req.i18n.__('Mobile Phone'),
        'allow_sms': req.i18n.__('Allow sms'),
        'phone': req.i18n.__('Phone'),
        'email': req.i18n.__('Email'),
        'allow_email': req.i18n.__('Allow email'),
        'first_see': req.i18n.__('First see'),
        'last_see': req.i18n.__('Last see')
    };
}

function toElasticsearchFormat(req, sourceObj) {
    var obj = {};
    for (var i = 0; i < customerFormFields.length; i++) {
        var field = customerFormFields[i];
        if (sourceObj[field]) {
            if (field == 'first_see' || field == 'last_see')
                obj[field] = toISODate(req, sourceObj[field]);
            else
                obj[field] = sourceObj[field];
        }
    }
    return obj;
}

function toViewFormat(req, sourceObj) {
    var obj = {};
    for (var i = 0; i < customerFormFields.length; i++) {
        var field = customerFormFields[i];
        if (sourceObj[field]) {
            if (field == 'first_see' || field == 'last_see')
                obj[field] = toLocalFormattedDate(req, sourceObj[field]);
            else
                obj[field] = sourceObj[field];
        }
    }
    return obj;
}

function handleCustomerForm(title, req, res) {
    // Trim all the fields that allow the user write text
    for (var i = 0; i < customerFormFields.length; i++)
        req.sanitize(customerFormFields[i]).trim();

    req.checkBody('name', 'The name is mandatory').notEmpty();

    if (!req.body.mobile_phone)
        req.checkBody(
            'allow_sms', 'To set allow sms, you must specify a mobile phone').optional().isEmpty();

    if (!req.body.email) {
        req.checkBody('allow_email', 'To set allow email, you must specify an email').optional().isEmpty();
    }
    else {
        req.checkBody('email', 'The email does not seem a valid email').isEmail();
    }

    if (req.body.first_see) {
        req.checkBody('first_see', 'The first date does not seem a valid date').isValidDate();
    }
    if (req.body.last_see) {
        req.checkBody('last_see', 'The last date does not seem a valid date').isValidDate();
    }

    var errors = req.validationErrors();
    if (errors) {
        res.render('customer', {
            title: title,
            form_names: customerFormNames(req),
            date_format: bootstrapDateFormat(req.config.date_format),
            flash: { type: 'alert-danger', messages: errors},
            obj: req.body
        });
        return;
    }

    var args = {
        index: 'customers',
        type: 'customer',
        refresh: true,
        body: toElasticsearchFormat(req, req.body)
    };
    if (typeof req.params.id != 'undefined')
        args.id = req.params.id;

    client.index(args, function(err, resp, respcode) {
        if (!err) {
            // redirect does not take into account being in inside a router
            res.redirect(customersPath);
        }
        else {
            var messages;
            if (err instanceof esErrors.NoConnections)
                messages = ['Database connection error'];
            else
                messages = ['Database error'];
            console.error(err);

            res.render('customer', {
                title: title,
                form_names: customerFormNames(req),
                date_format: bootstrapDateFormat(req.config.date_format),
                flash: { type: 'alert-danger', messages: messages},
                obj: req.body
            });
        }
    });

}

router.get('/new', function(req, res, next) {
    res.render('customer', {
        title: req.i18n.__('Create new customer'),
        form_names: customerFormNames(req),
        date_format: bootstrapDateFormat(req.config.date_format),
        obj: {}
    });
});

router.post('/new', function(req, res, next) {
    handleCustomerForm(req.i18n.__('Create new customer'), req, res);
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
            form_names: customerFormNames(req),
            date_format: bootstrapDateFormat(req.config.date_format),
            obj: toViewFormat(req, resp._source)
        });
    });
});

router.post('/edit/:id', function(req, res, next) {
    client.get({
        index:'customers',
        type:'customer',
        id: req.params.id
    }, function(err, resp, respcode) {
        handleCustomerForm(getTitle(resp._source), req, res);
    });
});

module.exports.router = router;
module.exports.path = customersPath;
