var should = require('should');
var utils = require('./utils');


describe('API tests: workers', function() {
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

    it('should return an empty list if no workers are defined', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.get(cookies, '/settings/workers/')
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.workers.should.be.an.Array().and.have.length(0);
                callback(null, null);
            }
        ], done);
    });

    it('should return an error if the submitted data does not contain at least one worker', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.put(cookies, '/settings/workers/')
                    .send({workers: []})
                    .expect(400)
                    .end(callback);
            },
            function(res, callback) {
                res.body.errors.should.be.an.Array().and.have.length(1);
                res.body.errors[0].msg.should.equal('At least one worker is mandatory');
                callback(null, null);
            }
        ], done);
    });

    it('should return OK and the saved workers if the submitted data is fine', function(done) {
        utils.waterfall([
            function(callback) {
                utils.request.put(cookies, '/settings/workers/')
                    .send({workers: [
                        {name: 'name1', color: '#c0c0c0'},
                        {name: 'name2', color: '#dd00dd'}
                    ]})
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.workers.should.be.an.Array().and.have.length(2);
                res.body.workers[0].name.should.equal('name1');
                res.body.workers[0].color.should.equal('#c0c0c0');
                res.body.workers[1].name.should.equal('name2');
                res.body.workers[1].color.should.equal('#dd00dd');
                callback(null, null);
            },
            function(res, callback) {
                utils.es.getWorkers(function(obj) {
                    obj.workers.should.be.an.Array().and.have.length(2);
                    obj.workers[0].name.should.equal('name1');
                    obj.workers[0].color.should.equal('#c0c0c0');
                    obj.workers[1].name.should.equal('name2');
                    obj.workers[1].color.should.equal('#dd00dd');
                    callback(null, null);
                });
            }
        ], done);
    });

    it('should return OK and the list of workers if they are present on the db', function(done) {
        utils.waterfall([
            function(callback) {
                client.index({
                    index: mainIndex,
                    type: 'workers',
                    id: common.workersDocId,
                    body: {
                        workers: [
                            {name: 'smart', color: 'red'},
                            {name: 'dumb', color: 'green'},
                            {name: 'ugly', color: 'pink'}
                        ]
                    }
                }, function(err, resp, respcode) {
                    callback(err, resp);
                });
            },
            function(res, callback) {
                utils.request.get(cookies, '/settings/workers/')
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                res.body.workers.should.be.an.Array().and.have.length(3);
                res.body.workers[0].name.should.equal('smart');
                res.body.workers[0].color.should.equal('red');
                res.body.workers[1].name.should.equal('dumb');
                res.body.workers[1].color.should.equal('green');
                res.body.workers[2].name.should.equal('ugly');
                res.body.workers[2].color.should.equal('pink');
                callback(null, null);
            }
        ], done);
    });

    after(utils.es.deleteWorkers);
});
