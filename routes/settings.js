var express = require('express');
var router = express.Router();

var settingsPath = '/settings';

var elasticsearch = require('elasticsearch');
var esErrors = elasticsearch.errors;
var utils = require('../utils');
var client = utils.createClient();

// For simplicity, we hardcode the id of the workers document
var workersDocId = '0b78ce22-a667-423b-bdb4-9a09b64dcf7c';

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
        id: workersDocId
    }, function(err, resp, respcode) {
        res.render('settings_workers', {
            isWorkersActive: true,
            workers: resp.found && resp._source.names.length > 0 ? resp._source.names : [''],
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
        res.render('settings_workers', {
            isWorkersActive: true,
            flash: {
                type: 'alert-danger',
                messages: [{msg: req.i18n.__('At least one worker is mandatory')}]
            },
            workers: [''],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
        return;
    }

    var args = {
        index: 'main',
        type: 'workers',
        refresh: true,
        id: workersDocId,
        body: {
            names: workers
        }
    };

    client.index(args, function(err, resp, respcode) {
        var params = {
            isWorkersActive: true,
            workers: workers.length > 0 ? workers : [''],
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

        res.render('settings_workers', params);
    });
});

router.get('/services', function(req, res, next) {
    res.render('settings_services', {
        isServicesActive: true,
        workersUrl: '/settings/workers',
        servicesUrl: '#'

    });
});

module.exports.router = router;
module.exports.path = settingsPath;
