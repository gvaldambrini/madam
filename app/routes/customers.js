var express = require('express');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();
var esErrors = elasticsearch.errors;
var customersPath = '/customers';

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
            title: 'Customers',
            customers: results,
            // TODO: create a generic method to get the url from the route name.
            newCustomerUrl: getCustomerUrl(req, 'new')
        });
    });
});


function handleCustomerForm(title, req, res) {
    // Trim all the fields that allow the user write text
    fields = ['name', 'surname', 'mobile_phone', 'phone', 'email', 'first_see', 'last_see'];
    for (var i = 0; i < fields.length; i++)
        req.sanitize(fields[i]).trim();

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
        req.checkBody('first_see', 'The first date does not seem a valid date').isDate();
    }
    if (req.body.last_see) {
        req.checkBody('last_see', 'The last date does not seem a valid date').isDate();
    }

    var obj = {};
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (req.body[field]) {
            if (field == 'first_see' || field == 'last_see')
                obj[field] = new Date(req.body[field]).toISOString().slice(0, 10);
            else
                obj[field] = req.body[field];
        }
    }

    var errors = req.validationErrors();
    if (errors) {
        res.render('customer', {
            title: title,
            flash: { type: 'alert-danger', messages: errors},
            obj: obj
        });
        return;
    }

    var args = {
        index: 'customers',
        type: 'customer',
        refresh: true,
        body: obj
    }
    if (typeof req.params.id != 'undefined')
        args.id = req.params.id;

    client.index(args, function(err, resp, respcode) {
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
                title: title,
                flash: { type: 'alert-danger', messages: messages},
                obj: obj
            });
        }
    });

}

router.get('/new', function(req, res, next) {
    res.render('customer', { title: 'Create new customer', obj: {}});
});

router.post('/new', function(req, res, next) {
    handleCustomerForm('Create new customer', req, res);
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
            obj: resp._source
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
