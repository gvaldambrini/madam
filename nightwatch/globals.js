module.exports = {
    server: undefined,

    startServer: function(done) {
        console.log('Start server...');
        var app = require('../app');
        var http = require('http');

        var port = '7890';
        app.set('port', port);

        server = http.createServer(app);
        server.listen(port, function() {
            done();
        });
    },

    stopServer: function(done) {
        console.log('Stop server...');
        server.close();
        done();
    }

};