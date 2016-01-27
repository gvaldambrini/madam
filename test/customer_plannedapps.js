var should = require('should');
var utils = require('./utils');


describe('API tests: customer planned appointments', function() {
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';
    var customer1Id;
    var customer2Id;
    var customer3Id;

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
            }],
            planned_appointments: [{
                appid: '015f5d45-9e90-4523-8484-b006c3b9fc0c',
                date: '2015-12-05'
            }]
        };

        var customer3 = {
            name: 'newname',
            appointments: [{
                appid: 'ab872625-6f79-4088-8c65-959f3eddb4f9',
                date: '2015-12-05',
                services: [
                    {description: 'shampoo', worker: 'Arya'},
                    {description: 'color', worker: 'Arya'}
                ]
            }]
        };

        var calendar = {
            days: [{
                date: '2015-12-05',
                planned_appointments: [
                    {
                        appid: '1187a4d2-4c2b-4e20-94ce-22e16871b53e',
                        fullname: 'new customer1'
                    }
                ]}, {
                date: '2015-12-15',
                planned_appointments: [
                    {
                        appid: 'aa5173e1-8f4f-4c3a-8f92-1acab1f4848d',
                        fullname: 'new customer2'
                    },
                    {
                        appid: '235442dc-90eb-44f0-b0ad-1afbdf366fcc',
                        fullname: 'new customer3'
                    }
                ]
            }]
        };

        client.bulk({body: [
            {index: {_index: mainIndex, _type: 'customer'}},
            customer1,
            {index: {_index: mainIndex, _type: 'customer'}},
            customer2,
            {index: {_index: mainIndex, _type: 'customer'}},
            customer3,
            {index: {_index: mainIndex, _type: 'calendar', _id: common.calendarDocId}},
            calendar
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
        it('should return both planned and normal appointments if the customer has them', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/' + customer2Id + '/appointments')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.appointments.should.be.an.Array().and.have.length(3);
                    var app = res.body.appointments;
                    app[0].appid.should.equal('015f5d45-9e90-4523-8484-b006c3b9fc0c');
                    app[0].date.should.equal('05/12/2015');
                    app[0].should.not.have.property('services');
                    app[0].planned.should.equal(true);

                    app[1].appid.should.equal('07965465-0037-4d7b-8a80-d2d9a8996410');
                    app[1].date.should.equal('20/08/2015');
                    app[1].services.should.equal('shampoo - haircut - highlights');
                    app[1].planned.should.equal(false);

                    app[2].appid.should.equal('eaafdf3b-6a76-4836-9cad-969ba0ca9a17');
                    app[2].date.should.equal('11/06/2015');
                    app[2].services.should.equal('shampoo - conditioning');
                    app[2].planned.should.equal(false);
                    callback(null, null);
                }
            ], done);
        });

        it('should return an empty list if the requested date does not contain anything', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/appointments/2015-12-13')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.appointments.should.be.an.Array().and.have.length(0);
                    callback(null, null);
                }
            ], done);
        });

        it('should return all the different appointment types if the requested date contains them', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/appointments/2015-12-05')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    var apps = res.body.appointments;
                    apps.should.be.an.Array().and.have.length(3);
                    apps[0].id.should.equal(customer3Id);
                    apps[0].appid.should.equal('ab872625-6f79-4088-8c65-959f3eddb4f9');
                    apps[0].services.should.equal('shampoo - color');
                    apps[0].planned.should.equal(false);

                    apps[1].id.should.equal(customer2Id);
                    apps[1].appid.should.equal('015f5d45-9e90-4523-8484-b006c3b9fc0c');
                    apps[1].should.not.have.property('services');
                    apps[1].planned.should.equal(true);

                    apps[2].should.not.have.property('id');
                    apps[2].appid.should.equal('1187a4d2-4c2b-4e20-94ce-22e16871b53e');
                    apps[2].should.not.have.property('services');
                    apps[2].planned.should.equal(true);
                    callback(null, null);
                }
            ], done);
        });
    });

    describe('Read planned appointment', function() {
        it('should return NOT FOUND if the date is invalid', function(done) {
            utils.request.get(cookies, '/customers/planned-appointments/2015-41-15/m3e39od2a')
                .expect(404, done);
        });

        it('should return NOT FOUND if the requested appointment does not exists', function(done) {
            utils.request.get(cookies, '/customers/planned-appointments/2015-12-05/m3e39od2a')
                .expect(404, done);
        });

        it('should return the planned info if the requested appointment exists', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.get(cookies, '/customers/planned-appointments/2015-12-15/aa5173e1-8f4f-4c3a-8f92-1acab1f4848d')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.fullname.should.equal('new customer2');
                    callback(null, null);
                }
            ], done);
        });

    });

    describe('Create planned appointment', function() {

        it('should return NOT FOUND if the date is invalid', function(done) {
            utils.request.post(cookies, '/customers/planned-appointments/2015-02-30')
                .expect(404, done);
        });

        it('should return BAD REQUEST if the submitted data does not contain the fullname and the id', function(done) {
            utils.request.post(cookies, '/customers/planned-appointments/2015-12-05')
                .expect(400, done);
        });

        it('should return BAD REQUEST if the customer id is not an existing one', function(done) {
            utils.request.post(cookies, '/customers/planned-appointments/2015-12-05')
                .send({id: 'l2dWdl8kSa2'})
                .expect(400, done);
        });

        it('should return an error if the planned appointment is for a date that has already a planned one', function(done) {
            var plannedLen;
            utils.waterfall([
                function(callback) {
                    utils.es.getCustomer(customer2Id, function(obj) {
                        plannedLen = obj.planned_appointments.length;
                        callback(null, null);
                    });
                },
                function(res, callback) {
                    utils.request.post(cookies, '/customers/planned-appointments/2015-12-05')
                        .send({id: customer2Id})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal(
                        'Unable to plan the appointment: there is already a planned appointment for the same date.');

                    utils.es.getCustomer(customer2Id, function(obj) {
                        obj.planned_appointments.should.be.an.Array().and.have.length(plannedLen);
                        callback(null, null);
                    });
                }
            ], done);
        });

        it('should return an error if the planned appointment is for a date that has already an appointment', function(done) {
            var plannedLen;
            utils.waterfall([
                function(callback) {
                    utils.es.getCustomer(customer2Id, function(obj) {
                        plannedLen = obj.planned_appointments.length;
                        callback(null, null);
                    });
                },
                function(res, callback) {
                    utils.request.post(cookies, '/customers/planned-appointments/2015-06-11')
                        .send({id: customer2Id})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal(
                        'Unable to plan the appointment: there is already an appointment for the same date.');

                    utils.es.getCustomer(customer2Id, function(obj) {
                        obj.planned_appointments.should.be.an.Array().and.have.length(plannedLen);
                        callback(null, null);
                    });
                }
            ], done);
        });

        it('should return CREATED and the id if the submitted data contains the new customer fullname', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/planned-appointments/2015-02-28')
                        .send({fullname: 'iron man'})
                        .expect(201)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.have.property('id');
                    callback(null, res.body.id);
                },
                function(appId, callback) {
                    utils.es.getCalendar(function(obj) {
                        var i, j;
                        for (i = 0; i < obj.days.length; i++) {
                            if (obj.days[i].date === '2015-02-28') {
                                for (j = 0; obj.days[i].planned_appointments.length; j++) {
                                    if (obj.days[i].planned_appointments[j].appid === appId) {
                                        obj.days[i].planned_appointments[j].fullname.should.equal('iron man');
                                        callback(null, null);
                                    }
                                }
                            }
                        }
                    });
                }
            ], done);
        });

        it('should return CREATED and the id if the submitted data contains a valid customer id', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/planned-appointments/2015-02-28')
                        .send({id: customer1Id})
                        .expect(201)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.have.property('id');
                    callback(null, res.body.id);
                },
                function(appId, callback) {
                    utils.es.getCustomer(customer1Id, function(obj) {
                        for (var i = 0; i < obj.planned_appointments.length; i++) {
                            if (obj.planned_appointments[i].date === '2015-02-28') {
                                obj.planned_appointments[i].appid.should.equal(appId);
                                callback(null, null);
                            }
                        }
                    });
                }
            ], done);
        });
    });

    describe('Delete planned appointment', function() {

        it('should return NOT FOUND if the date is invalid', function(done) {
            utils.request.delete(cookies, '/customers/planned-appointments/2015-02-30/3jdsk2a')
                .expect(404, done);
        });

        it('should return NOT FOUND if the appointment id does not exists', function(done) {
            utils.request.delete(cookies, '/customers/planned-appointments/2015-02-26/3jdsk2a')
                .expect(404, done);
        });

        it('should return OK if the appointment id is for an existing customer', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.delete(cookies, '/customers/planned-appointments/2015-12-05/015f5d45-9e90-4523-8484-b006c3b9fc0c')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    utils.es.getCustomer(customer2Id, function(obj) {
                        obj.planned_appointments.should.be.an.Array().and.have.length(0);
                        callback(null, null);
                    });
                }
            ], done);
        });

        it('should return OK if the appointment id is for a new customer', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.delete(cookies, '/customers/planned-appointments/2015-12-15/aa5173e1-8f4f-4c3a-8f92-1acab1f4848d')
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    utils.es.getCalendar(function(obj) {
                        for (var i = 0; i < obj.days.length; i++) {
                            if (obj.days[i].date === '2015-12-15') {
                                obj.days[i].planned_appointments.should.be.an.Array().and.have.length(1);
                                obj.days[i].planned_appointments[0].appid.should.equal('235442dc-90eb-44f0-b0ad-1afbdf366fcc');
                                obj.days[i].planned_appointments[0].fullname.should.equal('new customer3');
                                callback(null, null);
                            }
                        }

                    });
                }
            ], done);
        });
    });

    after(utils.es.deleteCustomers);
});