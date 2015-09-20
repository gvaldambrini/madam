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

// Helper function to retrieve the url for a single product based route
function getProductUrl(req, route, productId) {
    var pid = typeof productId == 'undefined' ? req.params.id : productId;
    return getProductsUrl(req, pid + '/' + route);
}

function getProductsUrl(req, route) {
    return req.protocol + "://" + req.get('host') + productsPath + '/' + route;
}

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
                urlDelete: getProductUrl(req, 'delete', obj._id),
                urlEdit: getProductUrl(req, 'edit', obj._id),
                date: obj._source.sold_date ? common.toLocalFormattedDate(req, obj._source.sold_date) : '-',
                notes: obj._source.notes ? obj._source.notes : '-'
            };
        }

        obj = lookup[aggregations[i].hits.hits.hits[0]._id];
        results[results.length] = {
            urlClone: getProductUrl(req, 'clone', obj._id),
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
            sort: {
                created_at: { order: "asc" }
            }
          }
        }
      }
    }
};

router.get('/', common.exposeTemplates, function(req, res, next) {
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
                search: req.i18n.__('Search...'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                deleteTitle: req.i18n.__('Delete the product?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?')
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

var ProductUtils = function(req, res) {
    this.req = req;
    this.res = res;
};

ProductUtils.formFields = ['name', 'brand', 'sold_date', 'notes'];

ProductUtils.prototype.toISODate = function(localFormattedDate) {
    return common.toISODate(this.req, localFormattedDate);
};

ProductUtils.prototype.toLocalFormattedDate = function(ISODate) {
    return common.toLocalFormattedDate(this.req, ISODate);
};

ProductUtils.prototype.formNames = function() {
    return {
        name: this.req.i18n.__('Name'),
        brand: this.req.i18n.__('Brand'),
        sold_date: this.req.i18n.__('Sold date'),
        notes: this.req.i18n.__('Notes'),
        submit: this.req.i18n.__('Submit')
    };
};

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

ProductUtils.prototype.handleForm = function(title) {
    // Trim all the fields that allow the user to write text
    for (var i = 0; i < ProductUtils.formFields.length; i++)
        this.req.sanitize(ProductUtils.formFields[i]).trim();

    this.req.checkBody('name', this.req.i18n.__('The name is mandatory')).notEmpty();

    if (this.req.body.first_see) {
        this.req.checkBody('sold_date', this.req.i18n.__(
            'The sold date does not seem a valid date')).isValidDate();
    }

    var errors = this.req.validationErrors();
    if (errors) {
        var i18n = this.formNames();
        i18n.title = title;

        this.res.render('product', {
            i18n: i18n,
            flash: { type: 'alert-danger', messages: errors},
            obj: this.req.body
        });
        return;
    }

    var args = {
        index: this.req.config.mainIndex,
        type: 'product',
        refresh: true,
    };

    var obj = this.toElasticsearchFormat(this.req.body);

    var that = this;  // workaround for the this visibility problem inside inner functions.
    var cb = function(err, resp, respcode) {
        if (!err) {
            // redirect does not take into account being in inside a router
            that.res.redirect(productsPath);
        }
        else {
            var messages;
            if (err instanceof esErrors.NoConnections)
                messages = [{msg: that.req.i18n.__('Database connection error')}];
            else
                messages = [{msg: that.req.i18n.__('Database error')}];
            console.error(err);

            var i18n = that.formNames();
            i18n.title = title;

            that.res.render('product', {
                i18n: i18n,
                flash: { type: 'alert-danger', messages: messages},
                obj: that.req.body
            });
        }
    };

    if (typeof this.req.params.id != 'undefined') {
        args.id = this.req.params.id;
        args.body = {doc: obj};
        client.update(args, cb);
    }
    else {
        args.body = obj;
        args.body.created_at = new Date().toISOString();
        client.index(args, cb);
    }
};


router.use(['/new', '*clone', '*edit'], function (req, res, next) {
    req.utils = new ProductUtils(req, res);
    next();
});

router.get('/new', function(req, res, next) {
    var i18n = req.utils.formNames();
    i18n.title = req.i18n.__('Add product');
    res.render('product', {
        i18n: i18n,
        obj: {
            sold_date: common.toLocalFormattedDate(req, moment()),
        }
    });
});

router.post('/new', function(req, res, next) {
    req.utils.handleForm(req.i18n.__('Add product'));
});

router.get('/:id/clone', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'product',
        id: req.params.id
    }, function(err, resp, respcode) {
        var i18n = req.utils.formNames();
        i18n.title = req.i18n.__('Add product');
        res.render('product', {
            i18n: i18n,
            obj: {
                name: resp._source.name,
                brand: resp._source.brand
            },
            actionUrl: getProductsUrl(req, 'new')
        });
    });
});

router.get('/:id/edit', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'product',
        id: req.params.id
    }, function(err, resp, respcode) {
        var i18n = req.utils.formNames();
        i18n.title = req.i18n.__('Edit product');

        res.render('product', {
            i18n: i18n,
            obj: req.utils.toViewFormat(resp._source)
        });
    });
});

router.post('/:id/edit', function(req, res, next) {
    client.get({
        index: req.config.mainIndex,
        type: 'product',
        id: req.params.id
    }, function(err, resp, respcode) {
        req.utils.handleForm(req.i18n.__('Edit product'));
    });
});

router.post('/:id/delete', function(req, res, next) {
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

module.exports.router = router;
module.exports.path = productsPath;
