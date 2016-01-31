"use strict";

const common = require('../common');
const client = common.createClient();


/**
 * Helper class that brings together all the route handlers (declared as static methods)
 * that work on the workers doc.
 * @class WorkersHandler
 */
class WorkersHandler {

    /**
     * The handler that returns the workers doc.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static fetch(req, res, _next) {
        client.get({
            index: req.config.mainIndex,
            type: 'workers',
            id: common.workersDocId
        }, function(err, resp, _respcode) {
            let workers = [];
            if (resp.found && resp._source.workers.length > 0) {
                workers = resp._source.workers;
            }
            res.json({
                workers: workers
            });
        });
    }

    /**
     * The handler that updates the workers doc.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static save(req, res, _next) {
        const workers = [];
        for (let i = 0; i < req.body.workers.length; i++) {
            if (req.body.workers[i].name.trim()) {
                workers.push({
                    name: req.body.workers[i].name.trim(),
                    color: req.body.workers[i].color
                });
            }
        }

        if (workers.length === 0) {
            const errors = [{msg: req.i18n.__('At least one worker is mandatory')}];
            res.status(400).json({errors: errors});
            return;
        }

        const args = {
            index: req.config.mainIndex,
            type: 'workers',
            refresh: true,
            id: common.workersDocId,
            body: {
                workers: workers
            }
        };

        client.index(args,
            (err, resp, _respcode) =>
            common.saveCallback(req, res, err, resp, false, {workers: workers})
        );
    }
}

module.exports = WorkersHandler;