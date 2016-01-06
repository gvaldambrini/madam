/**
 * Common module.
 * @module
 */

var elasticsearch = require('elasticsearch');
var esErrors = elasticsearch.errors;
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
        return new elasticsearch.Client({host: process.env.BONSAI_URL, apiVersion: '1.5'});
    return new elasticsearch.Client({apiVersion: '1.5'});
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
  res.status(401).end();
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
    if (typeof ISODate == 'undefined' || !ISODate)
        return '-';
    return moment.utc(ISODate, 'YYYY-MM-DD').format(req.config.date_format);
};

/**
 * Converts the given container (array or string) into an array.
 * @method
 *
 * @param {array|string} container the container to converts.
 */
Common.prototype.toArray = function(container) {
    if (typeof container == 'string')
        container = [container];
    return container;
};

/**
 * Helper function which manages the result of an operation (index or update)
 * on a item and sends to the client the appropriate response.
 * @method
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 * @param {object} error the error returned by the elasticsearch client.
 * @oaram {object} resp the elasticsearch response.
 * @param newItem bool true if the index is perfomed for creating a new item.
 * @oaram string objId the optional object id if it is not the es document id.
 */
Common.prototype.indexCb = function(req, res, err, resp, newItem, objId) {
    if (!err) {
        res.status(newItem ? 201 : 200).json({
            id: typeof objId === 'undefined' ? resp._id : objId
        });
        return;
    }

    var errors = [];
    if (err instanceof esErrors.NoConnections)
        errors[errors.length] = {msg: req.i18n.__('Database connection error')};
    else
        errors[errors.length] = {msg: req.i18n.__('Database error')};

    res.status(500).json({errors: errors});
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

/**
 * The id of the calendar document.
 * @var {string}
 */
Common.prototype.calendarDocId = 'b6d047ab-ddb6-4a5d-b66b-8a321c45c2b5';

module.exports = new Common();
