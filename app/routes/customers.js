var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();
var esErrors = elasticsearch.errors;
var customersPath = '/customers';

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
                name: hits[i]._source.name,
                surname: hits[i]._source.surname,
                phone: phone,
            };
        }
        res.render('customers', {
            title: 'Customers',
            customers: results,
            // TODO: create a generic method to get the url from the route name.
            newCustomerUrl: req.protocol + "://" + req.get('host') + customersPath + '/new' });
    });
});


router.get('/new', function(req, res, next) {
    res.render('customer', { title: 'Create new customer' });
});

router.post('/new', function(req, res, next) {

    // Trim all the fields that allow the user write text
    fields = ['name', 'surname', 'mobile', 'phone', 'email', 'first_see', 'last_see'];
    for (var i = 0; i < fields.length; i++)
        req.sanitize(fields[i]).trim();

    req.checkBody('name', 'The name is mandatory').notEmpty();

    if (!req.body.mobile)
        req.checkBody(
            'allow_sms', 'To set allow sms, you must specify a mobile phone').optional().isEmpty();

    if (!req.body.email) {
        req.checkBody('allow_email', 'To set allow email, you must specify an email').optional().isEmpty();
    }
    else {
        req.checkBody('email', 'The email does not seem a valid email').isEmail();
    }

    if (req.body.first_see) {
        req.checkBody('first_see', 'The first date does not seem a valid date').isDate();
    }
    if (req.body.last_see) {
        req.checkBody('last_see', 'The last date does not seem a valid date').isDate();
    }
    var errors = req.validationErrors();

    if (errors) {
        res.render('customer', {
            title: 'Create new customer',
            flash: { type: 'alert-danger', messages: errors}
        });
        return;
    }

    obj = {
        name: req.body.name
    };
    if (req.body.surname)
        obj.surname = req.body.surname;
    if (req.body.mobile)
        obj.mobile_phone = req.body.mobile;
    if (req.body.allow_sms)
        obj.allow_sms = true;
    if (req.body.phone)
        obj.phone = req.body.phone;
    if (req.body.email)
        obj.email = req.body.email;
    if (req.body.allow_email)
        obj.allow_email = true;
    if (req.body.first_see)
        obj.first_see = new Date(req.body.first_see).toISOString().slice(0, 10);
    if (req.body.last_see)
        obj.last_see = new Date(req.body.last_see).toISOString().slice(0, 10);

    client.index({
        index: 'customers',
        type: 'customer',
        refresh: true,
        body: obj
    }, function(err, resp, respcode) {
        if (!err) {
            // redirect does not take into account being in inside a router
            res.redirect(customersPath);
        }
        else {
            if (err instanceof esErrors.NoConnections)
                var messages = ['Database connection error'];
            else
                var messages = ['Database error'];
            console.error(err);

            res.render('customer', {
                title: 'Create new customer',
                flash: { type: 'alert-danger', messages: messages}
            });
        }
    });
});

module.exports.router = router;
module.exports.path = customersPath;
