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
    res.render('settings', {
        i18n: {
            workersName: req.i18n.__('Workers'),
            servicesName: req.i18n.__('Services'),
            workers: {
                title: req.i18n.__('Set workers'),
                name: req.i18n.__('Name'),
                unlock: req.i18n.__('Unlock'),
                save: req.i18n.__('Save workers')
            },
            services: {
                title: req.i18n.__('Set services'),
                name: req.i18n.__('Name'),
                unlock: req.i18n.__('Unlock'),
                save: req.i18n.__('Save services')
            }
        }
    });
});

router.get('/workers', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'workers',
        id: common.workersDocId
    }, function(err, resp, respcode) {
        var items = [];
        if (resp.found && resp._source.workers.length > 0) {
            items = resp._source.workers;
        }
        res.json({
            items: items
        });
    });
});

router.put('/workers', function(req, res, next) {
    var workers = [];
    for (var i = 0; i < req.body.workers.length; i++) {
        if (req.body.workers[i].name.trim()) {
            workers.push({
                name: req.body.workers[i].name.trim(),
                color: req.body.workers[i].color
            });
        }
    }

    if (workers.length === 0) {
        var errors = [{msg: req.i18n.__('At least one worker is mandatory')}];
        res.status(400).json({errors: errors});
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
        if (!err) {
            res.status(200).json({items: workers});
            return;
        }
        var errors = [];
        if (err instanceof esErrors.NoConnections)
            errors[errors.length] = {msg: req.i18n.__('Database connection error')};
        else
            errors[errors.length] = {msg: req.i18n.__('Database error')};

        res.status(500).json({errors: errors});
    });
});

router.get('/services', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'services',
        id: common.servicesDocId
    }, function(err, resp, respcode) {
        res.json({
            items: resp.found && resp._source.names.length > 0 ? resp._source.names : []
        });
    });
});

router.put('/services', function(req, res, next) {
    var services = common.toArray(req.body.services).filter(function(e) { return e; });
    if (services.length === 0) {
        var errors = [{msg: req.i18n.__('At least one service is mandatory')}];
        res.status(400).json({errors: errors});
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
        if (!err) {
            res.status(200).json({items: services});
            return;
        }

        var errors = [];
        if (err instanceof esErrors.NoConnections)
            errors[errors.length] = {msg: req.i18n.__('Database connection error')};
        else
            errors[errors.length] = {msg: req.i18n.__('Database error')};

        res.status(500).json({errors: errors});
    });
});

/** The settings router. */
module.exports.router = router;
/** The settings routes base path. */
module.exports.path = settingsPath;
