var supertest = require('supertest');
var async = require('async');

var port = '7891';  // defined in global.js
var request = supertest('http://localhost:' + port);

var common = require('../common');
var client = common.createClient();
var mainIndex = 'main_test';


function postRequest(cookies, url) {
    return request
        .post(url)
        .set('Cookie', cookies)
        .set('Accept','application/json')
        .set('x-requested-with', 'XmlHttpRequest');
}

function putRequest(cookies, url) {
    return request
        .put(url)
        .set('Cookie', cookies)
        .set('Accept','application/json')
        .set('x-requested-with', 'XmlHttpRequest');
}

function getRequest(cookies, url) {
    return request
        .get(url)
        .set('Cookie', cookies)
        .set('Accept','application/json')
        .set('x-requested-with', 'XmlHttpRequest');
}

function deleteRequest(cookies, url) {
    return request
        .delete(url)
        .set('Cookie', cookies)
        .set('Accept','application/json')
        .set('x-requested-with', 'XmlHttpRequest');
}

function login(cb) {
    async.waterfall([
        function(callback) {
            request
                .post('/login')
                .set('Accept','application/json')
                .send({'username': 'admin', 'password': 'pwdadmin'})
                .expect(200)
                .end(callback);
        },
        function(res, callback) {
            res.body.user.should.equal('admin');
            var re = new RegExp('; path=/; httponly', 'gi');
            var cookies = res
                .headers['set-cookie']
                .map(function(r) { return r.replace(re, '');}).join("; ");
            callback(null, cookies);
        }
    ], function(err, result) {
            if (err)
                throw err;

        cb(result);
    });
}

function deleteCustomers(cb) {
    client.search({
        index: mainIndex,
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
            client.bulk({
                body: items,
                refresh: true
            }, function(err, resp, respcode) {
                setTimeout(function() { cb(); }, 50);
            });

        }
        else
            cb();
    });
}

function deleteWorkers(cb) {
    client.delete({
        index: mainIndex,
        type: 'workers',
        id: common.workersDocId
    }, function(err, resp) {
        cb();
    });
}

function getCustomer(customerId, cb) {
    client.get({
        index: mainIndex,
        type: 'customer',
        id: customerId
    }, function(err, resp, respcode) {
        cb(resp._source);
    });
}

function getCalendar(cb) {
    client.get({
        index: mainIndex,
        type: 'calendar',
        id: common.calendarDocId
    }, function(err, resp, respcode) {
        cb(resp._source);
    });
}

function waterfall(tasks, done) {
    async.waterfall(
        tasks,
        function(err, res) {
            if (err)
                throw err;
            done();
        });
}

function pause(msec) {
    return function(res, callback) {
        setTimeout(function() {
            callback(null, res);
        }, msec);
    }
}

module.exports = {
    request: {
        post: postRequest,
        put: putRequest,
        get: getRequest,
        delete: deleteRequest
    },
    login: login,
    waterfall: waterfall,
    pause: pause,
    es: {
        deleteCustomers: deleteCustomers,
        getCustomer: getCustomer,
        getCalendar: getCalendar,
        deleteWorkers: deleteWorkers
    }
};
