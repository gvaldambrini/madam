var supertest = require('supertest');
var should = require('should');
var utils = require('./utils');


describe('API tests: customer appointments', function() {
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';
    var customer1Id;
    var customer2Id;
    var customer3Id;

    var workers = [
        {name: 'Arya', color: '#ff0000'},
        {name: 'Sansa', color: '#00ff00'},
        {name: 'Margaery', color: '#0000ff'}
    ];

    this.slow(300);

    before(function(done) {

        var customer1 = {
            name: 'aname',
            surname: 'asurname',
            first_seen: '2016-01-20',
            email: 'simple@email.com',
            mobile_phone: '44443243',
            allow_sms: true,
            notes: 'kind and cute'
        };

        var customer2 = {
            name: 'othername',
            surname: 'othersurname',
            appointments: [{
                appid: 'eaafdf3b-6a76-4836-9cad-969ba0ca9a17',
                date: '2015-06-11',
                services: [
                    {description: 'shampoo', worker: 'Arya'},
                    {description: 'conditioning', worker: 'Arya'}
                ]
            }, {
                appid: '07965465-0037-4d7b-8a80-d2d9a8996410',
                date: '2015-08-20',
                services: [
                    {description: 'shampoo', worker: 'Arya'},
                    {description: 'haircut', worker: 'Sansa'},
                    {description: 'highlights', worker: 'Sansa'}
                ],
                notes: 'not the best work ever'
            }]
        };

        var customer3 = {
            name: 'mysterious'
        };

        client.bulk({body: [
            {index: {_index: mainIndex, _type: 'customer'}},
            customer1,
            {index: {_index: mainIndex, _type: 'customer'}},
            customer2,
            {index: {_index: mainIndex, _type: 'customer'}},
            customer3,
            {index: {_index: mainIndex, _type: 'workers', _id: common.workersDocId}},
            {workers: workers}
        ], refresh: true}, function(err, resp, respcode) {
            customer1Id = resp.items[0].create._id;
            customer2Id = resp.items[1].create._id;
            customer3Id = resp.items[2].create._id;

            utils.login(function(c) {
                cookies = c;
                done();
            });
        });
    });

    describe('Read appointments', function() {

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            utils.request.get(cookies, '/customers/dj34k39oj/appointments')
                .expect(404, done);
        });

        it('should return OK and an empty list if the customer does not have appointments', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/' + customer1Id + '/appointments')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.appointments.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                }
            ], done);
        });

        it('should return the appointment list if the customer has appointments', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/' + customer2Id + '/appointments')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.appointments.should.be.an.Array().and.have.length(2);
                    var app = res.body.appointments;
                    app[0].appid.should.equal('07965465-0037-4d7b-8a80-d2d9a8996410');
                    app[0].date.should.equal('20/08/2015');
                    app[0].services.should.equal('shampoo - haircut - highlights');
                    app[0].planned.should.equal(false);
                    app[1].appid.should.equal('eaafdf3b-6a76-4836-9cad-969ba0ca9a17');
                    app[1].date.should.equal('11/06/2015');
                    app[1].services.should.equal('shampoo - conditioning');
                    app[1].planned.should.equal(false);
                    callback(null, null);
                }
            ], done);
        });
    });

    describe('Read appointment', function() {

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            utils.request.get(cookies, '/customers/j20alddWa13r/appointments/eaafdf3b-6a76-4836-9cad-969ba0ca9a17')
                .expect(404, done);
        });

        it('should return NOT FOUND if the appointment is not related to the customer', function(done) {
            // the appointment exists but is for the customer 2.
            utils.request.get(cookies, '/customers/' + customer1Id + '/appointments/eaafdf3b-6a76-4836-9cad-969ba0ca9a17')
                .expect(404, done);
        });

        it('should return NOT FOUND if the appointment is not present in the db', function(done) {
            utils.request.get(cookies, '/customers/' + customer2Id + '/appointments/us9lEk72ab')
                .expect(404, done);
        });

        it('should return the appointment data if the appointment is present in the db', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/' + customer2Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.workers.should.be.an.Array().and.have.length(workers.length);

                    function compareObj(obj1, obj2) {
                        obj1.should.containEql(obj2);
                        obj2.should.containEql(obj1);
                    }

                    compareObj(res.body.workers[0], workers[0]);
                    compareObj(res.body.workers[1], workers[1]);
                    compareObj(res.body.workers[2], workers[2]);
                    res.body.date.should.equal('20/08/2015');
                    res.body.notes.should.equal('not the best work ever')
                    res.body.services.should.be.an.Array().and.have.length(3);
                    res.body.services[0].description.should.equal('shampoo');
                    res.body.services[0].worker.should.equal('Arya');
                    res.body.services[1].description.should.equal('haircut');
                    res.body.services[1].worker.should.equal('Sansa');
                    res.body.services[2].description.should.equal('highlights');
                    res.body.services[2].worker.should.equal('Sansa');
                    callback(null, null);
                }
            ], done);
        });

    });

    describe('Create appointment', function() {

        it('should return BAD REQUEST if the submitted data is empty', function(done) {
            utils.request.post(cookies, '/customers/' + customer1Id + '/appointments')
                .expect(400, done);
        });

        it('should return BAD REQUEST if the appointment date is invalid', function(done) {
            utils.request.post(cookies, '/customers/' + customer1Id + '/appointments')
                .send({services: [
                    {enabled: true, description: 'shampoo', worker: 'Daenerys'}
                ]})
                .expect(400, done);
        });

        it('should return an error if there are no enabled services', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/' + customer1Id + '/appointments')
                        .send({services: [
                            {enabled: false, description: 'shampoo', worker: 'Daenerys'},
                            {enabled: false, description: 'haircut', worker: 'Cersei'},
                            {enabled: true, description: '', worker: 'Daenerys'}
                        ], date: '26/12/2015'})
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

        it('should return an error if there is already an appointment for the same date', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/' + customer2Id + '/appointments')
                        .send({services: [
                            {enabled: true, description: 'shampoo', worker: 'Daenerys'},
                            {enabled: true, description: 'haircut', worker: 'Cersei'}
                        ], date: '11/06/2015'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('Unable to save the appointment: there is already an appointment for the same date.');
                    callback(null, null);
                }
            ], done);
        });

        it('should return CREATED and the appointment id if submitted data is fine.', function(done) {
            var appointmentId;
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/' + customer1Id + '/appointments')
                        .send({services: [
                            {enabled: true, description: 'shampoo', worker: 'Daenerys'},
                            {enabled: false, description: 'haircut', worker: 'Daenerys'},
                            {enabled: true, description: '', worker: 'Daenerys'},
                            {enabled: true, description: 'highlights', worker: 'Cersei'}
                        ],
                        date: '26/12/2015',
                        notes: 'good work!'})
                        .expect(201)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    appointmentId = res.body.id;
                    callback(null, null);
                },
                function(res, callback) {
                    utils.es.getCustomer(customer1Id, function(obj) {
                        obj.appointments.should.be.an.Array().and.have.length(1);
                        var app = obj.appointments[0];
                        app.services.should.be.an.Array().and.have.length(2);
                        app.services[0].description.should.equal('shampoo');
                        app.services[0].worker.should.equal('Daenerys');
                        app.services[1].description.should.equal('highlights');
                        app.services[1].worker.should.equal('Cersei');
                        app.date.should.equal('2015-12-26');
                        app.notes.should.equal('good work!');
                        app.appid.should.equal(appointmentId);

                        // Returned by the customer API, but updated by the appointment one.
                        obj.last_seen.should.equal('2015-12-26');
                        callback(null, null);
                    });

                }
            ], done);
        });

    });

    describe('Update appointment', function() {

        it('should return BAD REQUEST if the submitted data is empty', function(done) {
            utils.request.put(cookies, '/customers/' + customer2Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                .expect(400, done);
        });

        it('should return BAD REQUEST if the appointment date is invalid', function(done) {
            utils.request.put(cookies, '/customers/' + customer2Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                .send({services: [
                    {enabled: true, description: 'shampoo', worker: 'Daenerys'}
                ]})
                .expect(400, done);
        });

        it('should return NOT FOUND if the appointment is not present in the db', function(done) {
            utils.request.put(cookies, '/customers/' + customer2Id + '/appointments/ko3J0dLr1t')
                .send({date: '13/04/2015'})
                .expect(404, done);
        });

        it('should return NOT FOUND if the appointment is not related to the customer', function(done) {
            utils.request.put(cookies, '/customers/' + customer1Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                .send({date: '13/04/2015'})
                .expect(404, done);
        });

        it('should return an error if there are no enabled services', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.put(cookies, '/customers/' + customer2Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                        .send({services: [
                            {enabled: false, description: 'shampoo', worker: 'Daenerys'},
                            {enabled: false, description: 'haircut', worker: 'Cersei'},
                            {enabled: true, description: '', worker: 'Daenerys'}
                        ], date: '26/12/2015'})
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

        it('should return OK and the appointment id if submitted data is fine', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.put(cookies, '/customers/' + customer2Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                        .send({services: [
                            {enabled: true, description: 'shampoo', worker: 'Daenerys'},
                            {enabled: false, description: 'haircut', worker: 'Daenerys'},
                            {enabled: true, description: '', worker: 'Daenerys'},
                            {enabled: true, description: 'highlights', worker: 'Cersei'}
                        ],
                        date: '26/08/2015'})
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    callback(null, null);
                },
                function(res, callback) {
                    utils.es.getCustomer(customer2Id, function(obj) {
                        var app;
                        for (var i = 0; i < obj.appointments.length; i++) {
                            if (obj.appointments[i].appid === '07965465-0037-4d7b-8a80-d2d9a8996410') {
                                app = obj.appointments[i];
                                break;
                            }
                        }
                        app.services.should.be.an.Array().and.have.length(2);
                        app.services[0].description.should.equal('shampoo');
                        app.services[0].worker.should.equal('Daenerys');
                        app.services[1].description.should.equal('highlights');
                        app.services[1].worker.should.equal('Cersei');
                        app.date.should.equal('2015-08-26');
                        app.should.not.have.property('notes');

                        // Returned by the customer API, but updated by the appointment one.
                        obj.last_seen.should.equal('2015-08-26');
                        callback(null, null);
                    });
                }
            ], done);
        });
    });

    describe('Delete appointment', function() {

        it('should return NOT FOUND if the appointment is not present in the db', function(done) {
            utils.request.delete(cookies, '/customers/' + customer3Id + '/appointments/ko3J0dLr1t')
                .expect(404, done);
        });

        it('should return NOT FOUND if the appointment is not related to the customer', function(done) {
            utils.request.delete(cookies, '/customers/' + customer3Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                .expect(404, done);
        });

        it('should return OK when called on an existing appointment', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.delete(cookies, '/customers/' + customer2Id + '/appointments/07965465-0037-4d7b-8a80-d2d9a8996410')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    utils.es.getCustomer(customer2Id, function(obj) {
                        obj.appointments.should.have.length(1);
                        obj.appointments[0].appid.should.equal('eaafdf3b-6a76-4836-9cad-969ba0ca9a17');

                        // Returned by the customer API, but updated by the appointment one.
                        obj.last_seen.should.equal('2015-06-11');
                        callback(null, null);
                    });
                }
            ], done);
        });
    });

    after(utils.es.deleteCustomers);
});