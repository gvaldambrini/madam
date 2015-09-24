/**
 * Common module.
 * @module
 */

var elasticsearch = require('elasticsearch');
var moment = require('moment');

/**
 * Creates a new Common object, which encapsulates some common utility
 * functions and properties.
 * @class Common
 */
var Common = function() {};


/**
 * Creates the elasticsearch client.
 * @method
 */
Common.prototype.createClient = function() {
    if (process.env.NODE_ENV == 'production')
        return new elasticsearch.Client({host: process.env.BONSAI_URL});
    return new elasticsearch.Client();
};

/**
 * Middleware to check if there is an authenticated user visiting the url.
 * @method
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 * @param {object} next the next middleware to call.
 */
Common.prototype.isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
};

/**
 * Transforms a local formatted date to the iso format.
 * @method
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {string} localFormattedDate the local formatted date.
 */
Common.prototype.toISODate = function(req, localFormattedDate) {
    return moment.utc(localFormattedDate, req.config.date_format).format('YYYY-MM-DD');
};

/**
 * Transforms an iso format date to the local format defined in the configuration.
 * @method
 *
 * @param {object} req the current request object.
 * @param {string} ISODate the iso date.
 */
Common.prototype.toLocalFormattedDate = function(req, ISODate) {
    return moment.utc(ISODate, 'YYYY-MM-DD').format(req.config.date_format);
};

/**
 * Middleware to expose shared templates to the client side.
 * @method
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 * @param {object} next the next middleware to call.
 */
Common.prototype.exposeTemplates = function(req, res, next) {

    req.app.hbs.getTemplates('views/shared/', {
        cache: req.app.enabled('view cache'),
        precompiled: true
    }).then(function (templates) {
        var extRegex = new RegExp(req.app.hbs.extname + '$');

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        templates = Object.keys(templates).map(function (name) {
            return {
                name: name.replace(extRegex, ''),
                template: templates[name]
            };
        });

        // Exposes the templates during view rendering.
        if (templates.length) {
            res.locals.templates = templates;
        }

        setImmediate(next);
    })
    .catch(next);
};

/**
 * The id of the workers document.
 * @var {string}
 */
Common.prototype.workersDocId = '0b78ce22-a667-423b-bdb4-9a09b64dcf7c';

/**
 * The id of the services document.
 * @var {string}
 */
Common.prototype.servicesDocId = '5678a632-9d9a-43c9-b440-4f6e1f6dfea7';

/**
 * The id of the users document.
 * @var {string}
 */
Common.prototype.usersDocId = 'b5198cbb-3a7b-4393-a129-2593f18510d5';

module.exports = new Common();
