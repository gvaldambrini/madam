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

    // Form validation
    req.checkBody('name').notEmpty();

    if (!req.sanitize('mobile').trim())
        req.checkBody('allow_sms').optional().isEmpty();

    if (!req.sanitize('email').trim()) {
        req.checkBody('allow_email').optional().isEmpty();
    }
    else {
        req.checkBody('email').isEmail();
    }

    var errors = req.validationErrors();

    if (errors) {
        var messages = [];
        for (var i = 0; i < errors.length; i++)
            messages[messages.length] = errors[i].msg + ' for ' + errors[i].param;

        res.render('customer', {
            title: 'Create new customer',
            flash: { type: 'alert-danger', messages: messages}
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
