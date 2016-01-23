var supertest = require('supertest');
var should = require('should');


describe('API tests: customers search', function() {
    var port = '7891';  // defined in global.js
    var request = supertest('http://localhost:' + port);
    var cookies;
    var common = require('../common');
    var client = common.createClient();
    var mainIndex = 'main_test';

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

    // Helper function to create the request object with the common setttings.
    function getRequest(url) {
        return request
            .get(url)
            .set('Cookie', cookies)
            .set('Accept','application/json')
            .set('x-requested-with', 'XmlHttpRequest');
    }

    describe('Customers simple search', function() {
        it('should return an error if there isn\'t a field "text" in query string', function(done) {
            getRequest('/customers/simple-search')
                .expect(400, done);
        });

        it('should return an empty list if there are no customers at all', function(done) {
            getRequest('/customers/simple-search')
                .query({text: ''})
                .expect(200)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.customers.should.be.an.Array().and.have.length(0);
                    done();
                });
        });

        describe('Search with data', function() {
            before(function(done) {
                client.bulk({body: [
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Norris', surname: 'Blake'},
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Deon', surname: 'Gibbs'},
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Margarita', surname: 'Norman'},
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Lory', surname: 'Taylor'}

                ], refresh: true});
                // A little delay is required to let the modification being propagated and
                // avaiable for further requests (even using the refresh param).
                setTimeout(function() { done(); }, 50);
            });

            it('should return the customers that match with the name or surname', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: 'nor'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(2);
                        customers[0].name.should.equal('Norris');
                        customers[0].surname.should.equal('Blake');
                        customers[1].name.should.equal('Margarita');
                        customers[1].surname.should.equal('Norman');
                        done();
                    });
            });

            it('should return the customer that matches with the name or surname', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: 'norm'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('Margarita');
                        customers[0].surname.should.equal('Norman');
                        done();
                    });
            });

            it('should return the customer that matches with the exact name', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: 'DEON'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('Deon');
                        customers[0].surname.should.equal('Gibbs');
                        done();
                    });
            });

            it('should return the customer that matches with a combination of name and surname', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: 'no ma'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('Margarita');
                        customers[0].surname.should.equal('Norman');
                        done();
                    });
            });

            it('should return all the customers searching with the empty string', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: ''})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.customers.should.be.an.Array().and.have.length(4);
                        done();
                    });
            });

            it('should return a subset of the results when searching with a (max) size', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: '', size: 2})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.customers.should.be.an.Array().and.have.length(2);
                        done();
                    });
            });

            it('should return an empty list if the single searched word does not match anyone', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: 'noone'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.customers.should.be.an.Array().and.have.length(0);
                        done();
                    });
            });

            it('should return an empty list if the searched multi words text does not match anyone', function(done) {
                getRequest('/customers/simple-search')
                    .query({text: 'deo giv'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.customers.should.be.an.Array().and.have.length(0);
                        done();
                    });
            });

            after(deleteCustomers);
        });

    });

    describe('Customers search', function() {
        it('should return an error if there isn\'t a field "text" in query string', function(done) {
            getRequest('/customers/search')
                .expect(400, done);
        });

        it('should return an empty list if there are no customers at all', function(done) {
            getRequest('/customers/search')
                .query({text: ''})
                .expect(200)
                .end(function(err, res) {
                    if (err)
                        throw err;

                    res.body.customers.should.be.an.Array().and.have.length(0);
                    done();
                });
        });

        describe('Search with data', function() {
            before(function(done) {
                client.bulk({body: [
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Norris', surname: 'Blake', mobile_phone: '55589658', phone: '44423811'},
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Deon', surname: 'Gibbs', phone: '44438823'},
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Margarita', surname: 'Norman'},
                    {index: {_index: mainIndex, _type: 'customer'}},
                    {name: 'Lory', surname: 'Taylor', mobile_phone: '55566921'}

                ], refresh: true});
                // A little delay is required to let the modification being propagated and
                // avaiable for further requests (even using the refresh param).
                setTimeout(function() { done(); }, 50);
            });

            it('should return the customers that match with the name or surname', function(done) {
                getRequest('/customers/search')
                    .query({text: 'no'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(2);
                        customers[0].name.should.equal('<b>No</b>rris');
                        customers[0].surname.should.equal('Blake');
                        customers[0].phone.should.equal('55589658 / 44423811');
                        customers[0].last_seen.should.equal('-');

                        customers[1].name.should.equal('Margarita');
                        customers[1].surname.should.equal('<b>No</b>rman');
                        customers[1].phone.should.equal('-');
                        customers[1].last_seen.should.equal('-');
                        done();
                    });
            });

            it('should return the customer that matches with the name or surname', function(done) {
                getRequest('/customers/search')
                    .query({text: 'lor'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('<b>Lor</b>y');
                        customers[0].surname.should.equal('Taylor');
                        customers[0].phone.should.equal('55566921');
                        customers[0].last_seen.should.equal('-');
                        done();
                    });
            });

            it('should return the customers that match with the phone or mobile phone', function(done) {
                getRequest('/customers/search')
                    .query({text: '8'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(2);
                        customers[0].name.should.equal('Deon');
                        customers[0].surname.should.equal('Gibbs');
                        customers[0].phone.should.equal('4443<b>8</b><b>8</b>23');
                        customers[0].last_seen.should.equal('-');

                        customers[1].name.should.equal('Norris');
                        customers[1].surname.should.equal('Blake');
                        customers[1].phone.should.equal('555<b>8</b>965<b>8</b> / 44423<b>8</b>11');
                        customers[1].last_seen.should.equal('-');

                        done();
                    });
            });

            it('should return the customer that matches with the phone or mobile phone', function(done) {
                getRequest('/customers/search')
                    .query({text: '89'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('Norris');
                        customers[0].surname.should.equal('Blake');
                        customers[0].phone.should.equal('555<b>89</b>658 / 44423811');
                        customers[0].last_seen.should.equal('-');
                        done();
                    });
            });

            it('should return the customer that matches with the exact name', function(done) {
                getRequest('/customers/search')
                    .query({text: 'MargaRITa'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('<b>Margarita</b>');
                        customers[0].surname.should.equal('Norman');
                        customers[0].phone.should.equal('-');
                        customers[0].last_seen.should.equal('-');
                        done();
                    });
            });

            it('should return the customer that matches with a combination of name, surname and phone', function(done) {
                getRequest('/customers/search')
                    .query({text: 'no b 811'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(1);
                        customers[0].name.should.equal('<b>No</b>rris');
                        customers[0].surname.should.equal('<b>B</b>lake');
                        customers[0].phone.should.equal('55589658 / 44423<b>811</b>');
                        customers[0].last_seen.should.equal('-');
                        done();
                    });
            });

            it('should return all the customers searching with the empty string', function(done) {
                getRequest('/customers/search')
                    .query({text: ''})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        var customers = res.body.customers;
                        customers.should.be.an.Array().and.have.length(4);
                        customers[0].name.should.equal('Deon');
                        customers[0].surname.should.equal('Gibbs');
                        customers[0].phone.should.equal('44438823');

                        customers[1].name.should.equal('Lory');
                        customers[1].surname.should.equal('Taylor');
                        customers[1].phone.should.equal('55566921');

                        customers[2].name.should.equal('Margarita');
                        customers[2].surname.should.equal('Norman');
                        customers[2].phone.should.equal('-');

                        customers[3].name.should.equal('Norris');
                        customers[3].surname.should.equal('Blake');
                        customers[3].phone.should.equal('55589658 / 44423811');
                        done();
                    });
            });

            it('should return an empty list if the single searched word does not match anyone', function(done) {
                getRequest('/customers/search')
                    .query({text: 'noone'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.customers.should.be.an.Array().and.have.length(0);
                        done();
                    });
            });

            it('should return an empty list if the searched multi words text does not match anyone', function(done) {
                getRequest('/customers/search')
                    .query({text: 'deo giv'})
                    .expect(200)
                    .end(function(err, res) {
                        if (err)
                            throw err;

                        res.body.customers.should.be.an.Array().and.have.length(0);
                        done();
                    });
            });

        });
    });

    after(deleteCustomers);
})