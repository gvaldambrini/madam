var should = require('should');
var utils = require('./utils');


describe('API tests: services', function() {
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

    this.slow(200);

    before(function(done) {
        utils.login(function(c) {
            cookies = c;
            done();
        });
    });

    it('should return an empty list if no services are defined', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.get(cookies, '/settings/services/')
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.services.should.be.an.Array().and.have.length(0);
                callback(null, null);
            }
        ], done);
    });

    it('should return an error if the submitted data does not contain at least one service', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.put(cookies, '/settings/services/')
                    .send({services: []})
                    .expect(400)
                    .end(callback);
            },
            function(res, callback) {
                res.body.errors.should.be.an.Array().and.have.length(1);
                res.body.errors[0].msg.should.equal('At least one service is mandatory');
                callback(null, null);
            }
        ], done);
    });

    it('should return OK and the saved services if the submitted data is fine', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.put(cookies, '/settings/services/')
                    .send({services: ['shampoo', 'haircut']})
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.services.should.be.an.Array().and.have.length(2);
                res.body.services[0].should.equal('shampoo');
                res.body.services[1].should.equal('haircut');
                callback(null, null);
            },
            function(res, callback) {
                utils.es.getServices(function(obj) {
                    obj.name_raw.should.be.an.Array().and.have.length(2);
                    obj.name_raw[0].should.equal('shampoo');
                    obj.name_raw[1].should.equal('haircut');
                    callback(null, null);
                });
            }
        ], done);
    });

    it('should return OK and the list of services if they are present on the db', function(done) {
        utils.waterfall([
            function(callback) {
                client.index({
                    index: mainIndex,
                    type: 'services',
                    id: common.servicesDocId,
                    body: {
                        name_raw: ['wardrobe', 'massage', 'smile']
                    }
                }, function(err, resp, respcode) {
                    callback(err, resp);
                });
            },
            function(res, callback) {
                utils.request.get(cookies, '/settings/services/')
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.services.should.be.an.Array().and.have.length(3);
                res.body.services[0].should.equal('wardrobe');
                res.body.services[1].should.equal('massage');
                res.body.services[2].should.equal('smile');
                callback(null, null);
            }
        ], done);
    });

    after(utils.es.deleteServices);
});
