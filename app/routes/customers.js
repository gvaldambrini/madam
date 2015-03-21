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

    client.index({
        index: 'customers',
        type: 'customer',
        refresh: true,
        body: {
            name: req.body.name,
            surname: req.body.surname
        }
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
