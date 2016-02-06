"use strict";

const common = require('../common');
const client = common.createClient();

const moment = require('moment');

/**
 * The elasticsearch aggregation logic for products. To maintain good performance, it
 * contains the assumption that a product (name + brand) cannot be sold
 * more than 10000 times.
 * @var
 */
const aggregateProduct = {
    prods: {
      terms: {
        field: 'complete_name',
        size: 0  // no limits on the aggregation terms returned
      },
      aggs: {
        hits: {
          top_hits: {
            size: 10000,
            _source: {
              include: "_id"
            },
            sort: [
                {sold_date: { order: "desc" }},
                {created_at: { order: "asc" }}
            ]
          }
        }
      }
    }
};

 /**
 * The fields of the Product.
 * @var
 */
const productFields = ['name', 'brand', 'sold_date', 'notes'];


/**
 * Helper class that brings together all the route handlers (declared as static methods)
 * that work on the product doc and the utility functions used by them.
 * @class ProductHandler
 */
class ProductHandler {

    /**
     * Parses the elasticsearch response and returns an array of objects that represent the products.
     * @function
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} resp the elasticsearch response.
     */
    static processElasticsearchResults(req, resp) {
        function getField(hit, field, field_type) {
            if (hit.highlight && hit.highlight[field + '.' + field_type])
                return hit.highlight[field + '.' + field_type][0];

            return hit._source[field];
        }

        let hits = resp.hits.hits;
        let aggregations = resp.aggregations.prods.buckets;

        let lookup = {};
        for (let i = 0; i < hits.length; i++) {
            lookup[hits[i]._id] = hits[i];
        }

        let results = [];
        for (let i = 0; i < aggregations.length; i++) {
            let objects = [];
            let obj;
            for (let j = 0; j < aggregations[i].hits.hits.hits.length; j++) {
                obj = lookup[aggregations[i].hits.hits.hits[j]._id];

                objects[objects.length] = {
                    id: obj._id,
                    date: obj._source.sold_date ? common.toLocalFormattedDate(req, obj._source.sold_date) : '-',
                    notes: obj._source.notes ? obj._source.notes : '-'
                };
            }

            obj = lookup[aggregations[i].hits.hits.hits[0]._id];
            results[results.length] = {
                name: getField(obj, 'name', 'autocomplete'),
                brand: getField(obj, 'brand', 'autocomplete'),
                count: aggregations[i].doc_count,
                objects: objects
            };
        }

        return results;
    }

    /**
     * The handler that performs the products search, returning an aggregate structure that
     * groups together all the products with the same name and brand.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static search(req, res, _next) {
        if (typeof req.query.text === 'undefined') {
            res.sendStatus(400);
            return;
        }
        let queryBody;
        if (req.query.text.trim()) {
            queryBody = {
                query: {
                    multi_match: {
                        query: req.query.text,
                        operator: 'and',
                        type: 'cross_fields',
                        fields: [
                            "name.autocomplete",
                            "brand.autocomplete"
                        ]
                    }
                },
                highlight: {
                    fields: {
                        '*': {
                            pre_tags: ['<b>'],
                            post_tags: ['</b>']
                        }
                    }
                },
                aggs: aggregateProduct
            };
        }
        else {
            queryBody = {
                query: {
                    match_all: {}
                },
                aggs: aggregateProduct
            };
        }

        client.search({
            index: req.config.mainIndex,
            type: 'product',
            size: 50,
            body: queryBody
        }, (err, resp, _respcode) =>
            res.json({
                products: ProductHandler.processElasticsearchResults(req, resp)
            })
        );
    }

    /**
     * Validates the Product data and returns the list of the errors if any.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     */
    static validateData(req) {
        // Trim all the fields that allow the user to write text
        for (let i = 0; i < productFields.length; i++)
            req.sanitize(productFields[i]).trim();

        req.checkBody('name', req.i18n.__('The name is mandatory')).notEmpty();

        if (req.body.sold_date) {
            req.checkBody('sold_date', req.i18n.__(
                'The sold date does not seem a valid date')).isValidDate();
        }

        return req.validationErrors();
    }

    /**
     * Converts the source object to the format used to save the related document
     * on elasticsearch.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} sourceObj the source object originated from the Product form.
     */
    static toElasticsearchFormat(req, sourceObj) {
        let obj = {};
        for (let i = 0; i < productFields.length; i++) {
            let field = productFields[i];
            if (sourceObj[field]) {
                if (field === 'sold_date')
                    obj[field] = common.toISODate(req, sourceObj[field]);
                else
                    obj[field] = sourceObj[field];
            }
        }

        // we cannot use the elasticsearch copy_to as in that case the resulting
        // field will contain a set of values. See also: http://goo.gl/TCNo47
        obj.complete_name = obj.name;
        if (obj.brand) {
            obj.complete_name += obj.brand;
        }

        return obj;
    }

    /**
     * Converts the source object to the format used to present the product data.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} sourceObj the source object originated from the elasticsearch response.
     */
    static toViewFormat(req, sourceObj) {
        let obj = {};
        for (let i = 0; i < productFields.length; i++) {
            let field = productFields[i];
            if (sourceObj[field]) {
                if (field === 'sold_date')
                    obj[field] = common.toLocalFormattedDate(req, sourceObj[field]);
                else
                    obj[field] = sourceObj[field];
            }
        }
        return obj;
    }

    /**
     * The handler that returns a single product object identified by the given product id.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static fetch(req, res, _next) {
        client.get({
            index: req.config.mainIndex,
            type: 'product',
            id: req.params.id
        }, function(err, resp, _respcode) {
            if (!resp.found) {
                res.sendStatus(404);
                return;
            }
            res.json(ProductHandler.toViewFormat(req, resp._source));
        });
    }

    /**
     * The handler that creates a product object from the data passed in the request body.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static create(req, res, _next) {
        const errors = ProductHandler.validateData(req);
        if (errors) {
            res.status(400).json({errors: errors});
            return;
        }

        const args = {
            index: req.config.mainIndex,
            type: 'product',
            refresh: true
        };

        args.body = ProductHandler.toElasticsearchFormat(req, req.body);
        args.body.created_at = moment().format('YYYY-MM-DD');
        client.index(args,
            (err, resp, _respcode) =>
            common.saveCallback(req, res, err, resp, true)
        );
    }

    /**
     * The handler that updates a product object from the data passed in the request body.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static update(req, res, _next) {
        const errors = ProductHandler.validateData(req);
        if (errors) {
            res.status(400).json({errors: errors});
            return;
        }

        const args = {
            index: req.config.mainIndex,
            type: 'product',
            id: req.params.id,
            body: {doc: ProductHandler.toElasticsearchFormat(req, req.body)},
            refresh: true
        };

        client.update(args, function(err, resp, respcode) {
            if (respcode === 404) {
                res.sendStatus(404);
                return;
            }
            common.saveCallback(req, res, err, resp, false);
        });
    }

    /**
     * The handler that deletes a product object identified by the given id.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static delete(req, res, _next) {
        client.delete({
            index: req.config.mainIndex,
            type: 'product',
            refresh: true,
            id: req.params.id
        }, function(err, resp, respcode) {
            if (respcode === 404) {
                res.sendStatus(404);
                return;
            }

            if (err) {
                console.log(err);
                res.status(400).end();
            }
            else {
                res.status(200).end();
            }
        });
    }
}

module.exports = ProductHandler;