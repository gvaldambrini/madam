"use strict";

/**
 * Settings module, contains all the routes related to the settings
 * (workers and services).
 * @module
 */
const express = require('express');
const router = express.Router();

const settingsPath = '/settings';

const common = require('../common');

const WorkersHandler = require('../routehandlers/workers');
const ServicesHandler = require('../routehandlers/services');

router.use(common.isAuthenticated);

const handlers = {
  workers: WorkersHandler,
  services: ServicesHandler
};

router.get('/workers', handlers.workers.fetch);
router.put('/workers', handlers.workers.save);
router.get('/services', handlers.services.fetch);
router.put('/services', handlers.services.save);

/** The settings router. */
module.exports.router = router;
/** The settings routes base path. */
module.exports.path = settingsPath;
