/**
 * Products module, contains all the views and code related to products.
 * @module
 */

var express = require('express');
var elasticsearch = require('elasticsearch');
var router = express.Router();
var common = require('../common');
var client = common.createClient();
var esErrors = elasticsearch.errors;
var productsPath = '/products';
var moment = require('moment');

router.use(common.isAuthenticated);
router.use(function (request, response, next) {
  // everything inside this file is under the active view 'products'
  response.locals.isProductsActive = true;
  next();
});

/**
 * Helper function to build the url for a single product based route.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {string} route the base route path.
 * @param {string} [productId] the product id, which will be extracted from the request if not provided.
 */
function getProductUrl(req, route, productId) {
    var pid = typeof productId == 'undefined' ? req.params.id : productId;
    return getProductsUrl(req, pid + '/' + route);
}

/**
 * Helper function to build the url for a product based route.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {string} route the base route path.
 */
function getProductsUrl(req, route) {
    return req.protocol + "://" + req.get('host') + productsPath + '/' + route;
}

/**
 * Parses the elasticsearch response and returns an array of objects that represent the products.
 * @function
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} resp the elasticsearch response.
 */
function processElasticsearchResults(req, resp) {

    function getField(hit, field, field_type) {
        if (hit.highlight && hit.highlight[field + '.' + field_type])
            return hit.highlight[field + '.' + field_type][0];

        return hit._source[field];
    }

    var hits = resp.hits.hits;
    var aggregations = resp.aggregations.prods.buckets;

    var lookup = {};
    for (var i = 0; i < hits.length; i++) {
        lookup[hits[i]._id] = hits[i];
    }

    var results = [];
    var obj;
    var j;
    var objects;

    for (i = 0; i < aggregations.length; i++) {
        objects = [];
        for (j = 0; j < aggregations[i].hits.hits.hits.length; j++) {
            obj = lookup[aggregations[i].hits.hits.hits[j]._id];

            objects[objects.length] = {
                id: obj._id,
                deleteText: req.i18n.__('Delete product'),
                date: obj._source.sold_date ? common.toLocalFormattedDate(req, obj._source.sold_date) : '-',
                notes: obj._source.notes ? obj._source.notes : '-'
            };
        }

        obj = lookup[aggregations[i].hits.hits.hits[0]._id];
        results[results.length] = {
            urlClone: getProductUrl(req, 'clone', obj._id),
            cloneText: req.i18n.__('Add another'),
            name: getField(obj, 'name', 'autocomplete'),
            brand: getField(obj, 'brand', 'autocomplete'),
            count: aggregations[i].doc_count,
            headerDate: req.i18n.__('Sold date'),
            headerNotes: req.i18n.__('Notes'),
            objects: objects
        };
    }

    return results;
}

/**
 * The elasticsearch aggregation logic for products. To maintain good performance, it
 * contains the assumption that a product (name + brand) cannot be sold
 * more than 10000 times.
 * @var
 */
var aggregate_product = {
    prods: {
      terms: {
        field: 'complete_name'
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

router.get('/', function(req, res, next) {
    client.search({
        index: req.config.mainIndex,
        type: 'product',
        size: 50,
        body: {
            query: {
                match_all: {}
            },
            aggs: aggregate_product
        }
    }, function(err, resp, respcode) {

        res.render('products', {
            i18n: {
                title: req.i18n.__('Products'),
                addNewProduct: req.i18n.__('Add product'),
                editProduct: req.i18n.__('Edit product'),
                search: req.i18n.__('Search...'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                deleteTitle: req.i18n.__('Delete the product?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?'),
                name: req.i18n.__('Name'),
                brand: req.i18n.__('Brand'),
                sold_date: req.i18n.__('Sold date'),
                notes: req.i18n.__('Notes'),
                submitAdd: req.i18n.__('Add product'),
                submitEdit: req.i18n.__('Edit product'),
                mandatoryFields: req.i18n.__('Fields marked with <span className="mandatory">*</span> are mandatory.')
            },
            productsData: {
                headerName: req.i18n.__('Name'),
                headerBrand: req.i18n.__('Brand'),
                headerCount: req.i18n.__('Sold'),
                emptyMsg: req.i18n.__('No products to display.'),
                products: processElasticsearchResults(req, resp)
            },
            urlNew: getProductsUrl(req, 'new'),
            urlSearch: getProductsUrl(req, 'search')
        });
    });
});

router.get('/search', function(req, res, next) {
    var queryBody;
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
                        'pre_tags': ['<b>'],
                        'post_tags': ['</b>']
                    }
                }
            },
            aggs: aggregate_product
        };
    }
    else {
        queryBody = {
            query: {
                match_all: {}
            },
            aggs: aggregate_product
        };
    }

    client.search({
        index: req.config.mainIndex,
        type: 'product',
        size: 50,
        body: queryBody
    }, function(err, resp, respcode) {
        res.json({
            headerName: req.i18n.__('Name'),
            headerBrand: req.i18n.__('Brand'),
            headerCount: req.i18n.__('Sold'),
            emptyMsg: req.i18n.__('No products to display.'),
            products: processElasticsearchResults(req, resp)
        });
    });
});


/**
 * Creates a new ProductUtils object, which encapsulates some common utility
 * functions and properties to handle the Product form and the related documents
 * on elasticsearch.
 * @class ProductUtils
 *
 * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 */
var ProductUtils = function(req, res) {
    this.req = req;
    this.res = res;
};

/**
 * The fields of the Product form.
 * @var
 */
ProductUtils.formFields = ['name', 'brand', 'sold_date', 'notes'];

/**
 * Validates the Product form and returns the list of the errors if any.
 */
ProductUtils.prototype.validateForm = function() {
    // Trim all the fields that allow the user to write text
    for (var i = 0; i < ProductUtils.formFields.length; i++)
        this.req.sanitize(ProductUtils.formFields[i]).trim();

    this.req.checkBody('name', this.req.i18n.__('The name is mandatory')).notEmpty();

    if (this.req.body.first_see) {
        this.req.checkBody('sold_date', this.req.i18n.__(
            'The sold date does not seem a valid date')).isValidDate();
    }

    return this.req.validationErrors();
};

/**
 * Transforms a local formatted date to the iso format.
 * @method
 *
 * @param {string} localFormattedDate the local formatted date.
 */
ProductUtils.prototype.toISODate = function(localFormattedDate) {
    return common.toISODate(this.req, localFormattedDate);
};

/**
 * Transforms an iso format date to the local format defined in the configuration.
 * @method
 *
 * @param {string} ISODate the iso date.
 */
ProductUtils.prototype.toLocalFormattedDate = function(ISODate) {
    return common.toLocalFormattedDate(this.req, ISODate);
};

/**
 * Returns an object which maps the form fields and buttons of the Product form
 * with the related translated names.
 * @method
 *
 * @param {bool} editForm true if the form is for edit.
 */
ProductUtils.prototype.formNames = function(editForm) {
    return {
        name: this.req.i18n.__('Name'),
        brand: this.req.i18n.__('Brand'),
        sold_date: this.req.i18n.__('Sold date'),
        notes: this.req.i18n.__('Notes'),
        submit: editForm ? this.req.i18n.__('Edit product') : this.req.i18n.__('Add product'),
        mandatoryFields: this.req.i18n.__('Fields marked with <span className="mandatory">*</span> are mandatory.')
    };
};

/**
 * Converts the source object to the format used to save the related document
 * on elasticsearch.
 * @method
 *
 * @param {object} sourceObj the source object originated from the Product form.
 */
ProductUtils.prototype.toElasticsearchFormat = function(sourceObj) {
    var obj = {};
    for (var i = 0; i < ProductUtils.formFields.length; i++) {
        var field = ProductUtils.formFields[i];
        if (sourceObj[field]) {
            if (field == 'sold_date')
                obj[field] = this.toISODate(sourceObj[field]);
            else
                obj[field] = sourceObj[field];
        }
    }

    obj.complete_name = obj.name;
    if (obj.brand) {
        obj.complete_name += obj.brand;
    }

    return obj;
};

/**
 * Converts the source object to the format used to present the data in the
 * Product form.
 * @method
 *
 * @param {object} sourceObj the source object originated from the elasticsearch response.
 */
ProductUtils.prototype.toViewFormat = function(sourceObj) {
    var obj = {};
    for (var i = 0; i < ProductUtils.formFields.length; i++) {
        var field = ProductUtils.formFields[i];
        if (sourceObj[field]) {
            if (field == 'sold_date')
                obj[field] = this.toLocalFormattedDate(sourceObj[field]);
            else
                obj[field] = sourceObj[field];
        }
    }
    return obj;
};


router.use(['*'], function (req, res, next) {
    req.utils = new ProductUtils(req, res);
    next();
});


router.get('/:id', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'product',
        id: req.params.id
    }, function(err, resp, respcode) {
        res.json(req.utils.toViewFormat(resp._source)
        );
    });
});

/**
 * Helper function which manages the result of an operation (index or update)
 * on a product and sends to the client the appropriate response.
 * @method
 *
 * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
 * @param {object} error the error returned by the elasticsearch client
 */
function productCb(res, err) {
    if (!err) {
        res.sendStatus(200);
        return;
    }

    var errors = [];
    if (err instanceof esErrors.NoConnections)
        errors[errors.length] = {msg: req.i18n.__('Database connection error')};
    else
        errors[errors.length] = {msg: req.i18n.__('Database error')};

    res.status(500).json({errors: errors});
}

router.post('/', function(req, res, next) {
    var errors = req.utils.validateForm();
    if (errors) {
        res.status(400).json({errors: errors});
        return;
    }

    var args = {
        index: req.config.mainIndex,
        type: 'product',
        refresh: true
    };

    args.body = req.utils.toElasticsearchFormat(req.body);
    args.body.created_at = new Date().toISOString();
    client.index(args, function(err, resp, respcode) {
        productCb(res, err);
    });
});

router.put('/:id', function(req, res, next) {
    var errors = req.utils.validateForm();
    if (errors) {
        res.status(400).json({errors: errors});
        return;
    }

    var args = {
        index: req.config.mainIndex,
        type: 'product',
        id: req.params.id,
        body: {doc: req.utils.toElasticsearchFormat(req.body)},
        refresh: true
    };

    client.update(args, function(err, resp, respcode) {
        productCb(res, err);
    });
});

router.delete('/:id', function(req, res, next) {
    client.delete({
        index: req.config.mainIndex,
        type: 'product',
        refresh: true,
        id: req.params.id
    }, function(err, resp, respcode) {
        if (err) {
            console.log(err);
            res.status(400).end();
        }
        else {
            res.status(200).end();
        }
    });
});

/** The products router. */
module.exports.router = router;
/** The product routes base path. */
module.exports.path = productsPath;
