module.exports = {
    server: undefined,

    startServer: function(done) {
        console.log('Start server...');
        var async = require('async');
        var fn = console.log;
        console.log = function() {};
        async.series([
            function(callback) {
                var genIndices = require('../scripts/generate_indices');
                genIndices.generate('main_test', callback);
            },
            function(callback) {
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
                process.env.NODE_CONFIG_FILE = './nightwatch/test_config.json';
                var app = require('../app');
                var http = require('http');

                var port = '7890';
                app.set('port', port);

                server = http.createServer(app);
                server.listen(port, callback);
            }
        ], function() {
            console.log = fn;
            done();
        });
    },

    stopServer: function(done) {
        console.log('Stop server...');
        server.close();
        done();
    }

};