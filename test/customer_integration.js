var should = require('should');
var utils = require('./utils');


describe('API tests: customer integration tests', function() {
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

    this.slow(400);

    before(function(done) {
        var workers = [
            {name_raw: 'Arya', color: '#ff0000'},
            {name_raw: 'Sansa', color: '#00ff00'},
            {name_raw: 'Margaery', color: '#0000ff'}
        ];

        var calendar = {
            days: [{
                date: '2015-12-15',
                planned_appointments: [
                    {
                        appid: '1187a4d2-4c2b-4e20-94ce-22e16871b53e',
                        fullname: 'new customer1'
                    }
                ]}]
        };

        client.bulk({body: [
            {index: {_index: mainIndex, _type: 'workers', _id: common.workersDocId}},
            {workers: workers},
            {index: {_index: mainIndex, _type: 'calendar', _id: common.calendarDocId}},
            calendar
        ], refresh: true}, function(err, resp, respcode) {
            utils.login(function(c) {
                cookies = c;
                done();
            });
        });
    });

    it('should preserve the appointments after updating the customer', function(done) {
        var customerId;
        utils.waterfall([
            function(callback) {
                utils.request.post(cookies, '/customers/')
                    .send({
                        name: 'someone',
                        surname: 'devnull',
                        phone: '55533243'
                    })
                    .expect(201)
                    .end(function(err, res) {
                        customerId = res.body.id;
                        callback(err, null);
                    });
            },
            function(res, callback) {
                utils.request.post(cookies, '/customers/' + customerId + '/appointments')
                    .send({services: [
                        {enabled: true, description: 'shampoo', worker: 'Daenerys'},
                        {enabled: true, description: 'haircut', worker: 'Daenerys'}
                    ],
                    date: '26/12/2015'})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                utils.request.post(cookies, '/customers/planned-appointments/2016-01-05')
                    .send({id: customerId})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                utils.request.put(cookies, '/customers/' + customerId)
                    .send({
                        name: 'othername',
                        surname: 'othersurname',
                        email: 'other@email.com'})
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                utils.es.getCustomer(customerId, function(obj) {
                    obj.name.should.equal('othername');
                    obj.surname.should.equal('othersurname');
                    obj.email.should.equal('other@email.com');
                    obj.appointments.should.be.an.Array().and.have.length(1);
                    obj.appointments[0].date.should.equal('2015-12-26');
                    obj.appointments[0].services.should.be.an.Array().and.have.length(2);
                    obj.appointments[0].services[0].description.should.equal('shampoo');
                    obj.appointments[0].services[1].description.should.equal('haircut');
                    obj.planned_appointments.should.be.an.Array().and.have.length(1);
                    obj.planned_appointments[0].date.should.equal('2016-01-05');
                    callback(null, null);
                });
            }
        ], done);
    });

    it('should remove a planned appointment when a normal one has been created with the same date', function(done) {
        var customerId;
        utils.waterfall([
            function(callback) {
                utils.request.post(cookies, '/customers/')
                    .send({
                        name: 'othername',
                        surname: 'othersurname'
                    })
                    .expect(201)
                    .end(function(err, res) {
                        customerId = res.body.id;
                        callback(err, null);
                    });
            },
            function(res, callback) {
                utils.request.post(cookies, '/customers/planned-appointments/2016-01-05')
                    .send({id: customerId})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                utils.request.post(cookies, '/customers/' + customerId + '/appointments')
                    .send({services: [
                        {enabled: true, description: 'shampoo', worker: 'Arya'},
                        {enabled: true, description: 'haircut', worker: 'Daenerys'}
                    ],
                    date: '05/01/2016'})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                utils.es.getCustomer(customerId, function(obj) {
                    obj.name.should.equal('othername');
                    obj.surname.should.equal('othersurname');
                    obj.appointments.should.be.an.Array().and.have.length(1);
                    obj.appointments[0].date.should.equal('2016-01-05');
                    obj.appointments[0].services.should.be.an.Array().and.have.length(2);
                    obj.appointments[0].services[0].description.should.equal('shampoo');
                    obj.appointments[0].services[1].description.should.equal('haircut');
                    obj.planned_appointments.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                });
            }
        ], done);
    });

    it('should remove a planned appointment when a normal one has been created starting from it', function(done) {
        var customerId, appointmentId;
        utils.waterfall([
            function(callback) {
                utils.request.post(cookies, '/customers/')
                    .send({
                        name: 'gregor',
                        surname: 'clegane'
                    })
                    .expect(201)
                    .end(function(err, res) {
                        customerId = res.body.id;
                        callback(err, null);
                    });
            },
            function(res, callback) {
                utils.request.post(cookies, '/customers/planned-appointments/2016-01-05')
                    .send({id: customerId})
                    .expect(201)
                    .end(function(err, res) {
                        appointmentId = res.body.id;
                        callback(err, null);
                    });
            },
            function(res, callback) {
                utils.request.put(cookies, '/customers/' + customerId + '/appointments/' + appointmentId)
                    .send({services: [
                        {enabled: true, description: 'shampoo', worker: 'Arya'},
                        {enabled: true, description: 'haircut', worker: 'Daenerys'}
                    ],
                    date: '04/01/2016'})
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                utils.es.getCustomer(customerId, function(obj) {
                    obj.name.should.equal('gregor');
                    obj.surname.should.equal('clegane');
                    obj.appointments.should.be.an.Array().and.have.length(1);
                    obj.appointments[0].date.should.equal('2016-01-04');
                    obj.appointments[0].services.should.be.an.Array().and.have.length(2);
                    obj.appointments[0].services[0].description.should.equal('shampoo');
                    obj.appointments[0].services[1].description.should.equal('haircut');
                    obj.planned_appointments.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                });
            }
        ], done);
    });

    it('should preserve the planned appointment when creating the customer starting from it', function(done) {
        var customerId;
        utils.waterfall([
            function(callback) {
                utils.request.post(cookies, '/customers/')
                    .send({
                        name: 'sandor',
                        surname: 'clegane',
                        __appid: '1187a4d2-4c2b-4e20-94ce-22e16871b53e',
                    })
                    .expect(201)
                    .end(function(err, res) {
                        customerId = res.body.id;
                        callback(err, null);
                    });
            },
            function(res, callback) {
                utils.es.getCustomer(customerId, function(obj) {
                    obj.name.should.equal('sandor');
                    obj.surname.should.equal('clegane');
                    obj.should.not.have.property('appointments');
                    obj.planned_appointments.should.be.an.Array().and.have.length(1);
                    obj.planned_appointments[0].date.should.equal('2015-12-15');
                    callback(null, null);
                });
            },
            function(res, callback) {
                utils.es.getCalendar(function(obj) {
                    obj.days[0].date.should.equal('2015-12-15');
                    obj.days[0].planned_appointments.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                });
            }
        ], done);
    });

    after(function(done) {
        utils.waterfall([
            utils.es.deleteCustomers,
            utils.es.deleteWorkers
        ], done);
    });
});