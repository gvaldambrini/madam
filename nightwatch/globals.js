module.exports = {
    server: undefined,

    startServer: function(done) {
        var async = require('async');
        async.series([
            function(callback) {
                console.log('Generate indices...');
                var genIndices = require('../scripts/generate_indices');
                genIndices.generate('main_test', callback);
            },
            function(callback) {
                console.log('Create test user...');
                var bcrypt = require('bcrypt-nodejs');
                var common = require('../common');
                var client = common.createClient();

                client.index({
                    index: 'main_test',
                    type: 'users',
                    id: common.usersDocId,
                    body: {
                        users: [{
                            username: 'admin',
                            password: bcrypt.hashSync('pwdadmin', bcrypt.genSaltSync(10)),
                        }]
                    }
                }, function(err, resp, respcode) {
                    callback(err, resp);
                });
            },
            function(callback) {
                console.log('Start server...');
                process.env.NODE_CONFIG_FILE = './nightwatch/test_config.json';
                var app = require('../app');
                var http = require('http');

                var port = '7890';
                app.set('port', port);

                server = http.createServer(app);
                server.listen(port, callback);
            }
        ], done);
    },

    stopServer: function(done) {
        console.log('Stop server...');
        server.close();
        done();
    }

};