"use strict";

/**
 * Settings module, contains all the views and code related to settings
 * (workers and services).
 * @module
 */
const express = require('express');
const router = express.Router();

const settingsPath = '/settings';

const elasticsearch = require('elasticsearch');
const esErrors = elasticsearch.errors;
const common = require('../common');
const client = common.createClient();

router.use(common.isAuthenticated);

router.get('/workers', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'workers',
        id: common.workersDocId
    }, function(err, resp, respcode) {
        let items = [];
        if (resp.found && resp._source.workers.length > 0) {
            items = resp._source.workers;
        }
        res.json({
            items: items
        });
    });
});

router.put('/workers', function(req, res, next) {
    let workers = [];
    for (let i = 0; i < req.body.workers.length; i++) {
        if (req.body.workers[i].name.trim()) {
            workers.push({
                name: req.body.workers[i].name.trim(),
                color: req.body.workers[i].color
            });
        }
    }

    if (workers.length === 0) {
        let errors = [{msg: req.i18n.__('At least one worker is mandatory')}];
        res.status(400).json({errors: errors});
        return;
    }

    let args = {
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
        let errors = [];
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
    let services = common.toArray(req.body.services).filter(function(e) { return e; });
    if (services.length === 0) {
        let errors = [{msg: req.i18n.__('At least one service is mandatory')}];
        res.status(400).json({errors: errors});
        return;
    }

    let args = {
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

        let errors = [];
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
