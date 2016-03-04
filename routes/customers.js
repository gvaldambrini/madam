"use strict";

/**
 * Customers module, contains all the routes related to customers (and appointments).
 * @module
 */

const express = require('express');
const moment = require('moment');

const router = express.Router();

const common = require('../common');
const client = common.createClient();
const customersPath = '/customers';

const CustomerHandler = require('../routehandlers/customer');
const AppointmentHandler = require('../routehandlers/appointment');

const handlers = {
    customer: CustomerHandler,
    appointment: AppointmentHandler
};

router.use(common.isAuthenticated);

router.get('/simple-search', handlers.customer.simpleSearch);
router.get('/search', handlers.customer.search);

// Customer routes
router.param('id', function(req, res, next, id) {
    client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: id
    }, function(err, resp, _respcode) {
        if (err) {
            res.sendStatus(404);
            return;
        }
        req.customer = resp._source;
        req.customerVersion = resp._version;
        next();
    });
});

router.get('/:id', handlers.customer.fetch);
router.post('/', handlers.customer.create);
router.put('/:id', handlers.customer.update);
router.delete('/:id', handlers.customer.delete);

router.get('/:id/details', handlers.customer.fetchDetails);

// Appointment routes
router.param('date', function(req, res, next, date) {
    if (moment(date, 'YYYY-MM-DD').isValid()) {
        next();
    }
    else {
        res.sendStatus(404);
    }
});

router.get('/appointments/:date', handlers.appointment.fetchByDate);

router.post('/planned-appointments/:date', handlers.appointment.plan);
router.delete('/planned-appointments/:date/:appid', handlers.appointment.deletePlanned);

router.get('/:id/appointments', handlers.appointment.fetchByCustomer);

router.post('/:id/appointments', handlers.appointment.save);
router.get('/:id/appointments/:appid', handlers.appointment.fetch);
router.put('/:id/appointments/:appid', handlers.appointment.save);
router.delete('/:id/appointments/:appid', handlers.appointment.delete);

/** The customers router. */
module.exports.router = router;
/** The customer routes base path. */
module.exports.path = customersPath;
