var should = require('should');
var utils = require('./utils');


describe('API tests: product CRUD', function() {
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

    this.slow(300);

    before(function(done) {
        utils.login(function(c) {
            cookies = c;
            done();
        });
    });

    describe('Create product', function() {

        it('should return an error if the name is not present', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/products')
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The name is mandatory');
                    callback(null, null);
                }
            ], done);
        });

        it('should return an error if the sold date is not valid', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/products')
                        .send({name: 'hairspray', sold_date: '30/02/2015'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The sold date does not seem a valid date');
                    callback(null, null);
                }
            ], done);
        });

        it('should return CREATED and the product id if the submitted data contains only the name', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/products')
                        .send({name: 'hairspray', brand: 'wella', sold_date: '25/02/2015', 'notes': 'good product!'})
                        .expect(201)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    callback(null, res.body.id);
                },
                function(productId, callback) {
                    utils.es.getProduct(productId, function(obj) {
                        obj.name.should.equal('hairspray');
                        obj.brand.should.equal('wella');
                        obj.sold_date.should.equal('2015-02-25');
                        obj.notes.should.equal('good product!');
                        callback(null, null);
                    });
                }
            ], done);
        });
        after(utils.es.deleteProducts);
    });

    describe('Read product', function() {

        it('should return NOT FOUND if the product is not present in the db', function(done) {
            utils.request.get(cookies, '/products/dj34k39oj')
                .expect(404, done);
        });

        it('should return the product data if the product is present in the db', function(done) {
            utils.waterfall([
                function(callback) {
                    client.index({
                        index: mainIndex,
                        type: 'product',
                        refresh: true,
                        body: {
                            name: 'gel',
                            brand: 'oreal',
                            sold_date: '2016-01-20',
                            notes: 'cheap'
                        }
                    }, function(err, resp, respcode) {
                        callback(err, resp);
                    });
                },
                function(res, callback) {
                    utils.request.get(cookies, '/products/' + res._id)
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.name.should.equal('gel');
                    res.body.brand.should.equal('oreal');
                    res.body.sold_date.should.equal('20/01/2016');
                    res.body.notes.should.equal('cheap');
                    callback(null, null);
                }
            ], done);
        });

        after(utils.es.deleteProducts);
    });

    describe('Update product', function() {

        it('should return NOT FOUND if the product is not present in the db', function(done) {
            utils.request.put(cookies, '/products/kkqe1e8k2')
                .send({name: 'gel'})
                .expect(404, done);
        });

        describe('Update an existing product', function() {
            var productId;
            before(function(done) {
                client.index({
                    index: mainIndex,
                    type: 'product',
                    refresh: true,
                    body: {
                        name: 'argan oil',
                        brand: 'redken',
                        first_seen: '2016-01-20'
                    }
                }, function(err, resp, respcode) {
                    productId = resp._id;
                    done();
                });
            });

            it('should return an error if the submitted data does not contain the name', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/products/' + productId)
                            .send({name: '', brand: 'matrix'})
                            .expect(400)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The name is mandatory');
                        callback(null, null);
                    }
                ], done);
            });


            it('should return an error if the submitted data contains an invalid sold date', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/products/' + productId)
                            .send({name: 'silk therapy', sold_date: '33/01/2015'})
                            .expect(400)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The sold date does not seem a valid date');
                        callback(null, null);
                    }
                ], done);
            });

            it('should return OK and the product id if the submitted data contains only the name', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/products/' + productId)
                            .send({name: 'silk therapy'})
                            .expect(200)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        callback(null, res.body.id);
                    },
                    function(productId, callback) {
                        utils.es.getProduct(productId, function(obj) {
                            obj.name.should.equal('silk therapy');
                            obj.should.not.have.properties([
                                'brand', 'sold_date']);
                            callback(null, null);
                        });
                    }
                ], done);
            });

            it('should return OK and the product id if the submitted data contains every field', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/products/' + productId)
                            .send({
                                name: 'scalp treatment',
                                brand: 'pureology',
                                sold_date: '26/10/2015',
                                notes: 'expensive'
                            })
                            .expect(200)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        callback(null, res.body.id);
                    },
                    function(productId, callback) {
                        utils.es.getProduct(productId, function(obj) {
                            obj.name.should.equal('scalp treatment');
                            obj.brand.should.equal('pureology');
                            obj.sold_date.should.equal('2015-10-26');
                            obj.notes.should.equal('expensive');
                            callback(null, null);
                        });
                    }
                ], done);
            });
        });

        after(utils.es.deleteProducts);
    });

    describe('Delete product', function() {

        var productId;
        before(function(done) {
            client.index({
                index: mainIndex,
                type: 'product',
                refresh: true,
                body: {
                    name: 'hair protection',
                    brand: 'oreal'
                }
            }, function(err, resp, respcode) {
                productId = resp._id;
                done();
            });
        });

        it('should return NOT FOUND if the product is not present in the db', function(done) {
            utils.request.delete(cookies, '/products/k213k9qewl6s')
                .expect(404, done);
        });

        it('should return OK if the product is present in the db', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.delete(cookies, '/products/' + productId)
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    client.exists({
                        index: mainIndex,
                        type: 'product',
                        id: productId
                    }, function(err, exists, respcode) {
                        callback(err, exists);
                    });
                },
                function(res, callback) {
                    res.should.equal(false);
                    callback(null, null);
                }
            ], done);
        });
    });
});