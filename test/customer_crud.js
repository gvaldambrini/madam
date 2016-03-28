var should = require('should');
var utils = require('./utils');


describe('API tests: customer CRUD', function() {
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

    describe('Create customer', function() {

        it('should return an error if the name and the surname are not present', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({name: '', 'email': 'anaddress@email.com'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('Either name or surname must be specified');
                    callback(null, null);
                }
            ], done);
        });

        it('should return an error if the email is not valid', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({name: 'someone', email: 'invalid@email'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The email does not seem a valid email');
                    callback(null, null);
                }
            ], done);
        });

        it('should return an error if the first seen is not valid', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({name: 'someone', first_seen: '33/01/2015'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The first date seen does not seem a valid date');
                    callback(null, null);
                }
            ], done);
        });

        it('should return an error if the allow sms is set but there isn\'t a valid mobile phone', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({name: 'someone', allow_sms: 'true'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('To set allow sms, you must specify a mobile phone');
                    callback(null, null);
                }
            ], done);
        });

        it('should return an error if the allow email is set but there isn\'t a valid email', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({name: 'someone', allow_email: 'true'})
                        .expect(400)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('To set allow email, you must specify an email');
                    callback(null, null);
                }
            ], done);
        });

        it('should return CREATED and the customer id if the submitted data contains only the name', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({name: 'someone'})
                        .expect(201)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    callback(null, res.body.id);
                },
                function(customerId, callback) {
                    utils.es.getCustomer(customerId, function(obj) {
                        obj.name.should.equal('someone');
                        callback(null, null);
                    });
                }
            ], done);
        });

        it('should return CREATED and the customer id if the submitted data contains only the surname', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({surname: 'someone else'})
                        .expect(201)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    callback(null, res.body.id);
                },
                function(customerId, callback) {
                    utils.es.getCustomer(customerId, function(obj) {
                        obj.surname.should.equal('someone else');
                        callback(null, null);
                    });
                }
            ], done);
        });

        it('should return CREATED and the customer id if the submitted data contains every field', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.post(cookies, '/customers/')
                        .send({
                            name: 'thename',
                            surname: 'thesurname',
                            mobile_phone: '44477830',
                            phone: '55533243',
                            email: 'simple@email.com',
                            first_seen: '24/11/2015',
                            allow_sms: 'false',
                            allow_email: 'true',
                            notes: 'very important person'
                        })
                        .expect(201).
                        end(callback);
                },
                function(res, callback) {
                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    callback(null, res.body.id);
                },
                function(customerId, callback) {
                    utils.es.getCustomer(customerId, function(obj) {
                        obj.name.should.equal('thename');
                        obj.surname.should.equal('thesurname');
                        obj.mobile_phone.should.equal('44477830');
                        obj.phone.should.equal('55533243');
                        obj.email.should.equal('simple@email.com');
                        obj.first_seen.should.equal('2015-11-24');
                        obj.allow_sms.should.equal(false);
                        obj.allow_email.should.equal(true);
                        obj.notes.should.equal('very important person');
                        callback(null, null);
                    });
                }
            ], done);
        });

        after(utils.es.deleteCustomers);
    });

    describe('Read customer', function() {

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            utils.request.get(cookies, '/customers/dj34k39oj')
                .expect(404, done);
        });

        it('should return the customer data if the customer is present in the db', function(done) {
            utils.waterfall([
                function(callback) {
                    client.index({
                        index: mainIndex,
                        type: 'customer',
                        refresh: true,
                        body: {
                            name: 'aname',
                            surname: 'asurname',
                            first_seen: '2016-01-20',
                            mobile_phone: '44443243',
                            allow_sms: true
                        }
                    }, function(err, resp, respcode) {
                        callback(err, resp);
                    });
                },
                function(res, callback) {
                    utils.request.get(cookies, '/customers/' + res._id)
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    res.body.name.should.equal('aname');
                    res.body.surname.should.equal('asurname');
                    res.body.first_seen.should.equal('20/01/2016');
                    res.body.mobile_phone.should.equal('44443243');
                    res.body.allow_sms.should.equal(true);
                    callback(null, null);
                }
            ], done);
        });

        after(utils.es.deleteCustomers);
    });

    describe('Update customer', function() {

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            utils.request.put(cookies, '/customers/kkqe1e8k2')
                .send({name: 'newname'})
                .expect(404, done);
        });

        describe('Update an existing customer', function() {
            var customerId;
            before(function(done) {
                client.index({
                    index: mainIndex,
                    type: 'customer',
                    refresh: true,
                    body: {
                        name: 'aname',
                        surname: 'asurname',
                        first_seen: '2016-01-20',
                        mobile_phone: '44443243',
                        allow_sms: true
                    }
                }, function(err, resp, respcode) {
                    customerId = resp._id;
                    done();
                });
            });

            it('should return an error if the submitted data does not contain the name and the surname', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({name: '', surname: '', 'note': 'empty customer'})
                            .expect(400)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('Either name or surname must be specified');
                        callback(null, null);
                    }
                ], done);
            });

            it('should return an error if the submitted data contains an invalid email', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({name: 'newname', email: 'invalid@email'})
                            .expect(400)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The email does not seem a valid email');
                        callback(null, null);
                    }
                ], done);
            });

            it('should return an error if the submitted data contains an invalid first seen', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({name: 'newname', first_seen: '33/01/2015'})
                            .expect(400)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The first date seen does not seem a valid date');
                        callback(null, null);
                    }
                ], done);
            });

            it('should return an error if the allow sms is set but there isn\'t a valid mobile phone', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({name: 'newname', allow_sms: 'true'})
                            .expect(400)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('To set allow sms, you must specify a mobile phone');
                        callback(null, null);
                    }
                ], done);
            });

            it('should return an error if the allow email is set but there isn\'t a valid email', function(done) {
                utils.request.put(cookies, '/customers/' + customerId)
                    .send({name: 'newname', allow_email: 'true'})
                    .expect(400)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('To set allow email, you must specify an email');
                        done();
                    });
            });

            it('should return OK and the customer id if the submitted data contains only the name', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({name: 'newname'})
                            .expect(200)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        callback(null, res.body.id);
                    },
                    function(customerId, callback) {
                        utils.es.getCustomer(customerId, function(obj) {
                            obj.name.should.equal('newname');
                            obj.should.not.have.properties([
                                'surname', 'first_seen', 'mobile_phone', 'allow_sms']);
                            callback(null, null);
                        });
                    }
                ], done);
            });

            it('should return OK and the customer id if the submitted data contains only the surname', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({surname: 'newsurname'})
                            .expect(200)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        callback(null, res.body.id);
                    },
                    function(customerId, callback) {
                        utils.es.getCustomer(customerId, function(obj) {
                            obj.surname.should.equal('newsurname');
                            obj.should.not.have.properties([
                                'name', 'first_seen', 'mobile_phone', 'allow_sms']);
                            callback(null, null);
                        });
                    }
                ], done);
            });

            it('should return OK and the customer id if the submitted data contains every field', function(done) {
                utils.waterfall([
                    function(callback) {
                        utils.request.put(cookies, '/customers/' + customerId)
                            .send({
                                name: 'othername',
                                surname: 'othersurname',
                                mobile_phone: '4449231',
                                phone: '55500231',
                                email: 'other@email.com',
                                first_seen: '26/10/2015',
                                allow_sms: 'false',
                                allow_email: 'false',
                                notes: 'not a so important person'
                            })
                            .expect(200)
                            .end(callback);
                    },
                    function(res, callback) {
                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        callback(null, res.body.id);
                    },
                    function(customerId, callback) {
                        utils.es.getCustomer(customerId, function(obj) {
                            obj.name.should.equal('othername');
                            obj.surname.should.equal('othersurname');
                            obj.mobile_phone.should.equal('4449231');
                            obj.phone.should.equal('55500231');
                            obj.email.should.equal('other@email.com');
                            obj.first_seen.should.equal('2015-10-26');
                            obj.allow_sms.should.equal(false);
                            obj.allow_email.should.equal(false);
                            obj.notes.should.equal('not a so important person');
                            callback(null, null);
                        });
                    }
                ], done);
            });
        });

        after(utils.es.deleteCustomers);
    });

    describe('Delete customer', function() {

        var customerId;
        before(function(done) {
            client.index({
                index: mainIndex,
                type: 'customer',
                refresh: true,
                body: {
                    name: 'aname',
                    surname: 'asurname'
                }
            }, function(err, resp, respcode) {
                customerId = resp._id;
                done();
            });
        });

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            utils.request.delete(cookies, '/customers/k213k9qewl6s')
                .expect(404, done);
        });

        it('should return OK if the customer is present in the db', function(done) {
            utils.waterfall([
                function(callback) {
                    utils.request.delete(cookies, '/customers/' + customerId)
                        .expect(200)
                        .end(callback);
                },
                function(res, callback) {
                    client.exists({
                        index: mainIndex,
                        type: 'customer',
                        id: customerId
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

    after(utils.es.deleteCustomers);
});