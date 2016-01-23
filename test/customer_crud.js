var supertest = require('supertest');
var should = require('should');

describe('API tests: customer CRUD', function() {
    var port = '7891';  // defined in global.js
    var request = supertest('http://localhost:' + port);
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

    this.slow(300);

    before(function(done) {
        request
            .post('/login')
            .set('Accept','application/json')
            .send({'username': 'admin', 'password': 'pwdadmin'})
            .expect(200)
            .end(function(err, res) {
                if (err)
                    throw err;

                res.body.user.should.equal('admin');
                var re = new RegExp('; path=/; httponly', 'gi');
                cookies = res
                    .headers['set-cookie']
                    .map(function(r) { return r.replace(re, '');}).join("; ");
                done();
            });
    });

    function deleteCustomers(done) {
        client.search({
            idnex: mainIndex,
            type: 'customer',
            size: 100,
            body: { query: { match_all: {}}}
        }, function(err, resp, respcode) {
            var items = [];
            for (var i = 0; i < resp.hits.hits.length; i++)
                items[items.length] = {
                    delete: {
                        _index: mainIndex,
                        _type: 'customer',
                        _id: resp.hits.hits[i]._id }
                }
            if (items) {
                client.bulk({body: items, refresh: true});
                setTimeout(function() { done(); }, 50);
            }
            else
                done();
        });
    }

    describe('Create customer', function() {

        function postRequest(url) {
            return request
                .post(url)
                .set('Cookie', cookies)
                .set('Accept','application/json')
                .set('x-requested-with', 'XmlHttpRequest');
        }

        it('should return an error if the name is not present', function(done) {
            postRequest('/customers/')
                .send({name: '', surname: 'someone'})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The name is mandatory');
                    done();
                });
        });

        it('should return an error if the email is not valid', function(done) {
            postRequest('/customers/')
                .send({name: 'someone', email: 'invalid@email'})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The email does not seem a valid email');
                    done();
                });
        });

        it('should return an error if the first seen is not valid', function(done) {
            postRequest('/customers/')
                .send({name: 'someone', first_seen: '33/01/2015'})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('The first date seen does not seem a valid date');
                    done();
                });
        });

        it('should return an error if the allow sms is set but there isn\'t a valid mobile phone', function(done) {
            postRequest('/customers/')
                .send({name: 'someone', allow_sms: 'true'})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('To set allow sms, you must specify a mobile phone');
                    done();
                });
        });

        it('should return an error if the allow email is set but there isn\'t a valid email', function(done) {
            postRequest('/customers/')
                .send({name: 'someone', allow_email: 'true'})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.errors.should.be.an.Array().and.have.length(1);
                    res.body.errors[0].msg.should.equal('To set allow email, you must specify an email');
                    done();
                });
        });

        it('should return CREATED and the customer id if the submitted data contains only the name', function(done) {
            postRequest('/customers/')
                .send({name: 'someone'})
                .expect(201)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    var customerId = res.body.id;
                    setTimeout(function() {
                        client.get({
                            index: mainIndex,
                            type: 'customer',
                            id: customerId
                        }, function(err, resp, respcode) {
                            resp._source.name.should.equal('someone');
                            done();
                        });
                    }, 50);

                });
        });

        it('should return CREATED and the customer id if the submitted data contains every field', function(done) {
            postRequest('/customers/')
                .send({
                    name: 'thename',
                    surname: 'thesurname',
                    mobile_phone: '44477830',
                    phone: '55533243',
                    email: 'simple@email.com',
                    first_seen: '24/11/2015',
                    discount: '10',
                    allow_sms: 'false',
                    allow_email: 'true',
                    notes: 'very important person'
                })
                .expect(201)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.should.not.have.property('errors');
                    res.body.should.have.property('id');
                    var customerId = res.body.id;
                    setTimeout(function() {
                        client.get({
                            index: mainIndex,
                            type: 'customer',
                            id: customerId
                        }, function(err, resp, respcode) {
                            var obj = resp._source;
                            obj.name.should.equal('thename');
                            obj.surname.should.equal('thesurname');
                            obj.mobile_phone.should.equal('44477830');
                            obj.phone.should.equal('55533243');
                            obj.email.should.equal('simple@email.com');
                            obj.first_seen.should.equal('2015-11-24');
                            obj.discount.should.equal(10);
                            obj.allow_sms.should.equal(false);
                            obj.allow_email.should.equal(true);
                            obj.notes.should.equal('very important person');
                            done();
                        });
                    }, 50);
                });
        });

        after(deleteCustomers);
    });

    describe('Read customer', function() {

        function getRequest(url) {
            return request
                .get(url)
                .set('Cookie', cookies)
                .set('Accept','application/json')
                .set('x-requested-with', 'XmlHttpRequest');
        }

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            var nonExistingId = 'dj34k39oj';
            getRequest('/customers/' + nonExistingId)
                .expect(404, done);
        });

        it('should return the customer data if the customer is present in the db', function(done) {
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
                setTimeout(function() {
                    getRequest('/customers/' + resp._id)
                        .expect(200)
                        .end(function(err, res) {
                            if (err)
                                throw err;

                            res.body.name.should.equal('aname');
                            res.body.surname.should.equal('asurname');
                            res.body.first_seen.should.equal('20/01/2016');
                            res.body.mobile_phone.should.equal('44443243');
                            res.body.allow_sms.should.equal(true);
                            done();
                        });
                }, 50);
            });
        });

        after(deleteCustomers);
    });

    describe('Update customer', function() {

        function putRequest(url) {
            return request
                .put(url)
                .set('Cookie', cookies)
                .set('Accept','application/json')
                .set('x-requested-with', 'XmlHttpRequest');
        }

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            var nonExistingId = 'kkqe1e8k2';
            putRequest('/customers/' + nonExistingId)
                .send({name: 'newname'})
                .expect(404, done);
        });

        describe('Update an existing user', function() {
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

            it('should return an error if the submitted data does not contain the name', function(done) {
                putRequest('/customers/' + customerId)
                    .send({name: '', surname: 'newname'})
                    .expect(400)
                    .end(function(err, res) {
                        if (err)
                            throw err;
                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The name is mandatory');
                        done();
                    });
            });

            it('should return an error if the submitted data contains an invalid email', function(done) {
                putRequest('/customers/' + customerId)
                    .send({name: 'newname', email: 'invalid@email'})
                    .expect(400)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The email does not seem a valid email');
                        done();
                    });
            });

            it('should return an error if the submitted data contains an invalid first seen', function(done) {
                putRequest('/customers/' + customerId)
                    .send({name: 'newname', first_seen: '33/01/2015'})
                    .expect(400)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('The first date seen does not seem a valid date');
                        done();
                    });
            });

            it('should return an error if the allow sms is set but there isn\'t a valid mobile phone', function(done) {
                putRequest('/customers/' + customerId)
                    .send({name: 'newname', allow_sms: 'true'})
                    .expect(400)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.errors.should.be.an.Array().and.have.length(1);
                        res.body.errors[0].msg.should.equal('To set allow sms, you must specify a mobile phone');
                        done();
                    });
            });

            it('should return an error if the allow email is set but there isn\'t a valid email', function(done) {
                putRequest('/customers/' + customerId)
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

            it('should return OK and the customer data if the submitted data contains only the name', function(done) {
                putRequest('/customers/' + customerId)
                    .send({name: 'newname'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        var customerId = res.body.id;
                        setTimeout(function() {
                            client.get({
                                index: mainIndex,
                                type: 'customer',
                                id: customerId
                            }, function(err, resp, respcode) {
                                resp._source.name.should.equal('newname');
                                resp._source.should.not.have.properties([
                                    'surname', 'first_seen', 'mobile_phone', 'allow_sms']);
                                done();
                            });
                        }, 50);
                    });
            });

            it('should return OK and the customer data if the submitted data contains every field', function(done) {
                putRequest('/customers/' + customerId)
                    .send({
                        name: 'othername',
                        surname: 'othersurname',
                        mobile_phone: '4449231',
                        phone: '55500231',
                        email: 'other@email.com',
                        first_seen: '26/10/2015',
                        discount: '20',
                        allow_sms: 'false',
                        allow_email: 'false',
                        notes: 'not a so important person'
                    })
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.should.not.have.property('errors');
                        res.body.should.have.property('id');
                        var customerId = res.body.id;
                        setTimeout(function() {
                            client.get({
                                index: mainIndex,
                                type: 'customer',
                                id: customerId
                            }, function(err, resp, respcode) {
                                var obj = resp._source;
                                obj.name.should.equal('othername');
                                obj.surname.should.equal('othersurname');
                                obj.mobile_phone.should.equal('4449231');
                                obj.phone.should.equal('55500231');
                                obj.email.should.equal('other@email.com');
                                obj.first_seen.should.equal('2015-10-26');
                                obj.discount.should.equal(20);
                                obj.allow_sms.should.equal(false);
                                obj.allow_email.should.equal(false);
                                obj.notes.should.equal('not a so important person');
                                done();
                            });
                        }, 50);
                    });
            });

        });

        after(deleteCustomers);
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

        function deleteRequest(url) {
            return request
                .delete(url)
                .set('Cookie', cookies)
                .set('Accept','application/json')
                .set('x-requested-with', 'XmlHttpRequest');
        }

        it('should return NOT FOUND if the customer is not present in the db', function(done) {
            var nonExistingId = 'k213k9qewl6s';
            deleteRequest('/customers/' + nonExistingId)
                .expect(404, done);
        });

        it('should return OK if the customer is present in the db', function(done) {
            deleteRequest('/customers/' + customerId)
                .expect(200)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    client.exists({
                        index: mainIndex,
                        type: 'customer',
                        id: customerId
                    }, function(error, exists) {
                        console.log('exists:', exists);
                        exists.should.equal(false);
                        done();
                    });

                });
        });

        after(deleteCustomers);
    });

    after(deleteCustomers);
});