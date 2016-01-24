var supertest = require('supertest');
var should = require('should');
var async = require('async');

describe('API tests: customer integration tests', function() {
    var port = '7891';  // defined in global.js
    var request = supertest('http://localhost:' + port);
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

    this.slow(400);

    before(function(done) {
        var workers = [
            {name: 'Arya', color: '#ff0000'},
            {name: 'Sansa', color: '#00ff00'},
            {name: 'Margaery', color: '#0000ff'}
        ];

        client.bulk({body: [
            {index: {_index: mainIndex, _type: 'workers', _id: common.workersDocId}},
            {workers: workers}
        ], refresh: true}, function(err, resp, respcode) {
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
    });

    function postRequest(url) {
        return request
            .post(url)
            .set('Cookie', cookies)
            .set('Accept','application/json')
            .set('x-requested-with', 'XmlHttpRequest');
    }

    function putRequest(url) {
        return request
            .put(url)
            .set('Cookie', cookies)
            .set('Accept','application/json')
            .set('x-requested-with', 'XmlHttpRequest');
    }

    it('should preserve the appointments after updating the customer', function(done) {
        var customerId;
        async.waterfall([
            function(callback) {
                postRequest('/customers/')
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
                setTimeout(function() { callback(null, null);}, 50);
            },
            function(res, callback) {
                postRequest('/customers/' + customerId + '/appointments')
                    .send({services: [
                        {enabled: true, description: 'shampoo', worker: 'Daenerys'},
                        {enabled: true, description: 'haircut', worker: 'Daenerys'}
                    ],
                    date: '26/12/2015'})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                postRequest('/customers/planned-appointments/2016-01-05')
                    .send({id: customerId})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                putRequest('/customers/' + customerId)
                    .send({
                        name: 'othername',
                        surname: 'othersurname',
                        email: 'other@email.com'})
                    .expect(200)
                    .end(callback);
            },
            function(res, callback) {
                client.get({
                    index: mainIndex,
                    type: 'customer',
                    id: customerId
                }, callback);
            },
        ],
        function(err, resp) {
            if (err)
                throw err;

            var obj = resp._source;
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
            done();
        });

    });

    it('should remove a planned appointment when a normal one has been created with the same date', function(done) {
        var customerId;
        async.waterfall([
            function(callback) {
                postRequest('/customers/')
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
                postRequest('/customers/planned-appointments/2016-01-05')
                    .send({id: customerId})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                postRequest('/customers/' + customerId + '/appointments')
                    .send({services: [
                        {enabled: true, description: 'shampoo', worker: 'Arya'},
                        {enabled: true, description: 'haircut', worker: 'Daenerys'}
                    ],
                    date: '05/01/2016'})
                    .expect(201)
                    .end(callback);
            },
            function(res, callback) {
                client.get({
                    index: mainIndex,
                    type: 'customer',
                    id: customerId
                }, callback);
            },
        ],
        function(err, resp) {
            if (err)
                throw err;

            var obj = resp._source;
            obj.name.should.equal('othername');
            obj.surname.should.equal('othersurname');
            obj.appointments.should.be.an.Array().and.have.length(1);
            obj.appointments[0].date.should.equal('2016-01-05');
            obj.appointments[0].services.should.be.an.Array().and.have.length(2);
            obj.appointments[0].services[0].description.should.equal('shampoo');
            obj.appointments[0].services[1].description.should.equal('haircut');
            obj.planned_appointments.should.be.an.Array().and.have.length(0);
            done();
        });

    });
});