"use strict";

const common = require('../common');
const client = common.createClient();


/**
 * Helper class that brings together all the route handlers (declared as static methods)
 * that work on the services doc.
 * @class ServicesHandler
 */
class ServicesHandler {

    /**
     * The handler that returns the services doc.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static fetch(req, res, _next) {
        client.get({
            index: req.config.mainIndex,
            type: 'services',
            id: common.servicesDocId
        }, (err, resp, _respcode) =>
            res.json({
                services: resp.found && resp._source.names.length > 0 ? resp._source.names : []
            })
        );
    }

    /**
     * The handler that updates the services doc.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static save(req, res, _next) {
        const services = common.toArray(req.body.services).filter(e => e);
        if (services.length === 0) {
            const errors = [{msg: req.i18n.__('At least one service is mandatory')}];
            res.status(400).json({errors: errors});
            return;
        }

        const args = {
            index: req.config.mainIndex,
            type: 'services',
            refresh: true,
            id: common.servicesDocId,
            body: {
                names: services
            }
        };

        client.index(args,
            (err, resp, _respcode) =>
            common.saveCallback(req, res, err, resp, false, {services: services})
        );
    }
}

module.exports = ServicesHandler;