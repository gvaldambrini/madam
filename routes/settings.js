/**
 * Settings module, contains all the views and code related to settings
 * (workers and services).
 * @module
 */
var express = require('express');
var router = express.Router();

var settingsPath = '/settings';

var elasticsearch = require('elasticsearch');
var esErrors = elasticsearch.errors;
var common = require('../common');
var client = common.createClient();

router.use(common.isAuthenticated);
router.use(function (request, response, next) {
  // everything inside this file is under the active view 'settings'
  response.locals.isSettingsActive = true;
  next();
});

router.get('/', function(req, res, next) {
    res.redirect('/settings/workers');
});

router.get('/workers', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'workers',
        id: common.workersDocId
    }, function(err, resp, respcode) {
        var items;
        if (resp.found && resp._source.workers.length > 0) {
            items = resp._source.workers;
        }
        else {
            items = [{name: '', color: req.config.defaultWorkerColor}];
        }

        res.render('settings', {
            i18n: {
                title: req.i18n.__('Settings'),
                name: req.i18n.__('Name'),
                workers: req.i18n.__('Workers'),
                services: req.i18n.__('Services'),
                update: req.i18n.__('Update'),
                save: req.i18n.__('Save')
            },
            hasColorpicker: true,
            isWorkersActive: true,
            items: items,
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
    });
});

router.post('/workers', function(req, res, next) {
    req.body.name = common.toArray(req.body.name);
    req.body.color = common.toArray(req.body.color);

    var workers = [];
    for (var i = 0; i < req.body.name.length; i++) {
        if (req.body.name[i]) {
            workers.push({
                name: req.body.name[i].trim(),
                color: req.body.color[i]
            });
        }
    }

    if (workers.length === 0) {
        res.render('settings', {
            i18n: {
                title: req.i18n.__('Settings'),
                name: req.i18n.__('Name'),
                workers: req.i18n.__('Workers'),
                services: req.i18n.__('Services'),
                update: req.i18n.__('Update'),
                save: req.i18n.__('Save')
            },
            hasColorpicker: true,
            isWorkersActive: true,
            flash: {
                type: 'alert-danger',
                messages: [{msg: req.i18n.__('At least one worker is mandatory')}]
            },
            items: [{name: '', color: req.config.defaultWorkerColor}],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
        return;
    }

    var args = {
        index: req.config.mainIndex,
        type: 'workers',
        refresh: true,
        id: common.workersDocId,
        body: {
            workers: workers
        }
    };

    client.index(args, function(err, resp, respcode) {
        var params = {
            i18n: {
                title: req.i18n.__('Settings'),
                name: req.i18n.__('Name'),
                workers: req.i18n.__('Workers'),
                services: req.i18n.__('Services'),
                update: req.i18n.__('Update'),
                save: req.i18n.__('Save')
            },
            hasColorpicker: true,
            isWorkersActive: true,
            items: workers.length > 0 ? workers : [{name: '', color: req.config.defaultWorkerColor}],
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
        index: req.config.mainIndex,
        type: 'services',
        id: common.servicesDocId
    }, function(err, resp, respcode) {
        res.render('settings', {
            i18n: {
                title: req.i18n.__('Settings'),
                name: req.i18n.__('Name'),
                workers: req.i18n.__('Workers'),
                services: req.i18n.__('Services'),
                update: req.i18n.__('Update'),
                save: req.i18n.__('Save')
            },
            isServicesActive: true,
            items: resp.found && resp._source.names.length > 0 ? resp._source.names : [''],
            workersUrl: '/settings/workers',
            servicesUrl: '#'
        });
    });
});

router.post('/services', function(req, res, next) {
    var services = common.toArray(req.body.name).filter(function(e) { return e; });
    if (services.length === 0) {
        res.render('settings', {
            i18n: {
                title: req.i18n.__('Settings'),
                name: req.i18n.__('Name'),
                workers: req.i18n.__('Workers'),
                services: req.i18n.__('Services'),
                update: req.i18n.__('Update'),
                save: req.i18n.__('Save')
            },
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
        index: req.config.mainIndex,
        type: 'services',
        refresh: true,
        id: common.servicesDocId,
        body: {
            names: services
        }
    };

    client.index(args, function(err, resp, respcode) {
        var params = {
            i18n: {
                title: req.i18n.__('Settings'),
                name: req.i18n.__('Name'),
                workers: req.i18n.__('Workers'),
                services: req.i18n.__('Services'),
                update: req.i18n.__('Update'),
                save: req.i18n.__('Save')
            },
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

/** The settings router. */
module.exports.router = router;
/** The settings routes base path. */
module.exports.path = settingsPath;
