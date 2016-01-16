"use strict";

/**
 * Products module, contains all the routes related to products.
 * @module
 */

const express = require('express');

const router = express.Router();
const common = require('../common');
const productsPath = '/products';

const ProductHandler = require('../routehandlers/product');

const handlers = {
    product: ProductHandler
};

router.use(common.isAuthenticated);

router.get('/search', handlers.product.search);
router.get('/:id', handlers.product.fetch);
router.post('/', handlers.product.create);
router.put('/:id', handlers.product.update);
router.delete('/:id', handlers.product.delete);

/** The products router. */
module.exports.router = router;
/** The product routes base path. */
module.exports.path = productsPath;
