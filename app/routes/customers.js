var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();

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
        for (var i = 0; i < hits.length; i++)
            results[results.length] = {
                name: hits[i]._source.name,
                surname: hits[i]._source.surname
            };
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
        res.render('customer', {
            title: 'Create new customer',
            flash: { type: 'alert-danger', messages: errors},
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
            // TODO: handle errors
            console.log(err, resp, respcode);
            res.render('customer', { title: 'Create new customer' });
        }
    });
});

module.exports.router = router;
module.exports.path = customersPath;
