module.exports = {
    server: undefined,
    devServer: undefined,

    beforeEach: function(done) {
        console.log('Reset database...');
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
        ], function() {
            console.log = fn;
            done();
        });
    },

    before: function(done) {
        console.log('Start server...');
        var async = require('async');
        var fn = console.log;
        console.log = function() {};
        async.series([
            function(callback) {
              var webpack = require("webpack");
              var webpackConfig = require("../config/webpack.js");
              var WebpackDevServer = require("webpack-dev-server");

              var config = Object.create(webpackConfig);
              config.devtool = "eval";
              config.debug = true;
              config.entry.app.unshift("webpack-dev-server/client?http://localhost:8081");

              var serverOptions = {
                publicPath: 'http://localhost:8081/',
                stats: {colors: true},
                quiet: true
              };

              devServer = new WebpackDevServer(webpack(config), serverOptions);
              devServer.listen(8081, 'localhost', function(err) {
                if (err)
                  console.log('unable to start webpack-dev-server:', err);
                process.env.WEBPACK_DEV_SERVER = 'http://localhost:8081/';
                callback();
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

    after: function(done) {
        console.log('Stop server...');
        server.close();
        devServer.close();
        done();
        process.exit();  // Workaround needed to exit from the process.
    }

};