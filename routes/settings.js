var express = require('express');
var router = express.Router();

var settingsPath = '/settings';

var elasticsearch = require('elasticsearch');
var esErrors = elasticsearch.errors;
var utils = require('../utils');
var client = utils.createClient();

router.use(function (request, response, next) {
  // everything inside this file is under the active view 'settings'
  response.locals.isSettingsActive = true;
  response.locals.title = request.i18n.__('Settings'),
  next();
});

router.get('/', function(req, res, next) {
    res.redirect('/settings/workers')
});

router.get('/workers', function(req, res, next) {
    client.get({
        index: 'main',
        type: 'workers',
        id: utils.workersDocId
    }, function(err, resp, respcode) {
        res.render('settings', {
            isWorkersActive: true,
            items: resp.found && resp._source.names.length > 0 ? resp._source.names : [''],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
    });
});

router.post('/workers', function(req, res, next) {
    var names = req.body.name;
    if (typeof names == 'string')
        names = [names];

    var workers = names.filter(function(e) { return e; });
    if (workers.length == 0) {
        res.render('settings', {
            isWorkersActive: true,
            flash: {
                type: 'alert-danger',
                messages: [{msg: req.i18n.__('At least one worker is mandatory')}]
            },
            items: [''],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
        return;
    }

    var args = {
        index: 'main',
        type: 'workers',
        refresh: true,
        id: utils.workersDocId,
        body: {
            names: workers
        }
    };

    client.index(args, function(err, resp, respcode) {
        var params = {
            isWorkersActive: true,
            items: workers.length > 0 ? workers : [''],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        };

        if (err) {
            var messages;
            if (err instanceof esErrors.NoConnections)
                messages = [{msg: req.i18n.__('Database connection error')}];
            else
                messages = [{msg: req.i18n.__('Database error')}];
            console.error(err);
            params.flash = {
                type: 'alert-danger',
                messages: messages
            };
        }

        res.render('settings', params);
    });
});

router.get('/services', function(req, res, next) {
    client.get({
        index: 'main',
        type: 'services',
        id: utils.servicesDocId
    }, function(err, resp, respcode) {
        res.render('settings', {
            isServicesActive: true,
            items: resp.found && resp._source.names.length > 0 ? resp._source.names : [''],
            workersUrl: '/settings/workers',
            servicesUrl: '#'
        });
    });
});

router.post('/services', function(req, res, next) {
    var names = req.body.name;
    if (typeof names == 'string')
        names = [names];

    var services = names.filter(function(e) { return e; });
    if (services.length == 0) {
        res.render('settings', {
            isServicesActive: true,
            flash: {
                type: 'alert-danger',
                messages: [{msg: req.i18n.__('At least one service is mandatory')}]
            },
            items: [''],
            workersUrl: '/settings/workers',
            servicesUrl: '#'
        });
        return;
    }

    var args = {
        index: 'main',
        type: 'services',
        refresh: true,
        id: utils.servicesDocId,
        body: {
            names: services
        }
    };

    client.index(args, function(err, resp, respcode) {
        var params = {
            isServicesActive: true,
            items: services.length > 0 ? services : [''],
            workersUrl: '/settings/workers',
            servicesUrl: '#'
        };

        if (err) {
            var messages;
            if (err instanceof esErrors.NoConnections)
                messages = [{msg: req.i18n.__('Database connection error')}];
            else
                messages = [{msg: req.i18n.__('Database error')}];
            console.error(err);
            params.flash = {
                type: 'alert-danger',
                messages: messages
            };
        }

        res.render('settings', params);
    });
});

module.exports.router = router;
module.exports.path = settingsPath;
