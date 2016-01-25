var supertest = require('supertest');
var should = require('should');


describe('API tests: login', function() {
    var port = '7891';  // defined in global.js
    var request = supertest('http://localhost:' + port);

    describe('Login', function() {
        this.slow(500);

        it('should return an error on empty username', function(done) {
            request
                .post('/login')
                .set('x-requested-with', 'XmlHttpRequest')
                .send({username: '', password: ''})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;
                    res.body.errors[0].msg.should.equal('Missing username.');
                    done();
                });
        });

        it('should return an error on wrong username', function(done) {
            request
                .post('/login')
                .set('x-requested-with', 'XmlHttpRequest')
                .send({username: 'admina', password: 'pwdadmin'})
                .expect(401)
                .end(function(err, res) {
                    if (err)
                        throw err;
                    res.body.errors[0].msg.should.equal('Incorrect username.');
                    done();
                });
        });

        it('should return an error on empty password', function(done) {
            request
                .post('/login')
                .set('x-requested-with', 'XmlHttpRequest')
                .send({username: 'admin', password: ''})
                .expect(400)
                .end(function(err, res) {
                    if (err)
                        throw err;
                    res.body.errors[0].msg.should.equal('Missing password.');
                    done();
                });
        });

        it('should return an error on wrong password', function(done) {
            request
                .post('/login')
                .set('x-requested-with', 'XmlHttpRequest')
                .send({username: 'admin', password: 'pwdadmina'})
                .expect(401)
                .end(function(err, res) {
                    if (err)
                        throw err;
                    res.body.errors[0].msg.should.equal('Incorrect password.');
                    done();
                });
        });

        it('should return the logged user on successful login', function(done) {
            request
                .post('/login')
                .set('x-requested-with', 'XmlHttpRequest')
                .send({username: 'admin', password: 'pwdadmin'})
                .expect(200)
                .end(function(err, res) {
                    if (err)
                        throw err;
                    res.body.user.should.equal('admin');
                    done();
                });
        });

        it('should return OK if the logout is successul performed', function(done) {
            request
                .post('/logout')
                .set('x-requested-with', 'XmlHttpRequest')
                .expect(200, done);
        });

    });
})