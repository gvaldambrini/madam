var should = require('should');
var moment = require('moment');
var utils = require('./utils');


describe('API tests: products search', function() {
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

    before(function(done) {
        utils.login(function(c) {
            cookies = c;
            done();
        });
    });

    it('should return an error if there isn\'t a field "text" in query string', function(done) {
        utils.request.get(cookies, '/products/search')
            .expect(400, done);
    });

    it('should return an empty list if there are no products at all', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.get(cookies, '/products/search')
                    .query({text: ''})
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.products.should.be.an.Array().and.have.length(0);
                callback(null, null);
            }
        ], done);
    });

    describe('Search with data', function() {
        before(function(done) {
            var today = moment().format('YYYY-MM-DD');
            client.bulk({body: [
                {index: {_index: mainIndex, _type: 'product'}},
                {name: 'hairspray', brand: 'kenra', complete_name: 'hairspraykenra', sold_date: '2015-12-16', created_at: today},
                {index: {_index: mainIndex, _type: 'product'}},
                {name: 'gel', brand: 'oreal', complete_name: 'geloreal', sold_date: '2015-11-29', created_at: today},
                {index: {_index: mainIndex, _type: 'product'}},
                {name: 'hairspray', brand: 'kenra', complete_name: 'hairspraykenra', sold_date: '2016-02-03', created_at: today},
                {index: {_index: mainIndex, _type: 'product'}},
                {name: 'hairspray', brand: 'redken', complete_name: 'hairsprayredken', sold_date: '2015-06-20', created_at: today},
                {index: {_index: mainIndex, _type: 'product'}},
                {name: 'ultra defining gel', brand: '', complete_name: 'ultra defining gel', sold_date: '2015-09-12', created_at: today}

            ], refresh: true}, function(err, resp, respcode) {
                done();
            });
        });

        it('should return the two products that match the searched text', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/products/search')
                        .query({text: 'gel'})
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.products.should.be.an.Array().and.have.length(2);
                    res.body.products['0'].name.should.equal('<b>gel</b>');
                    res.body.products['0'].brand.should.equal('oreal');
                    res.body.products['0'].count.should.equal(1);
                    res.body.products['1'].name.should.equal('ultra defining <b>gel</b>');
                    res.body.products['1'].brand.should.equal('');
                    res.body.products['1'].count.should.equal(1);
                    callback(null, null);
                }
            ], done);
        });

        it('should return the entry that matches with name and brand', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/products/search')
                        .query({text: 'hair redken'})
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.products.should.be.an.Array().and.have.length(1);
                    res.body.products['0'].name.should.equal('<b>hair</b>spray');
                    res.body.products['0'].brand.should.equal('<b>redken</b>');
                    res.body.products['0'].count.should.equal(1);
                    callback(null, null);
                }
            ], done);
        });


        it('should return first the entries with a greater count', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/products/search')
                        .query({text: 'hair'})
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.products.should.be.an.Array().and.have.length(2);
                    res.body.products['0'].name.should.equal('<b>hair</b>spray');
                    res.body.products['0'].brand.should.equal('kenra');
                    res.body.products['0'].count.should.equal(2);
                    res.body.products['1'].name.should.equal('<b>hair</b>spray');
                    res.body.products['1'].brand.should.equal('redken');
                    res.body.products['1'].count.should.equal(1);
                    callback(null, null);
                }
            ], done);
        });

        it('should return an empty list if the single searched word does not match anyone', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/products/search')
                        .query({text: 'hoir'})
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.products.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                }
            ], done);
        });

        it('should return an empty list if the searched multi words text does not match anyone', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/products/search')
                        .query({text: 'hair oreal'})
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.products.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                }
            ], done);
        });
    });

    after(utils.es.deleteProducts);
});