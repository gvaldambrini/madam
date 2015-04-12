var elasticsearch = require('elasticsearch');


function createClient() {
    if (process.env.NODE_ENV == 'production')
        return new elasticsearch.Client({host: process.env.BONSAI_URL});
    return new elasticsearch.Client();
}


module.exports.createClient = createClient;
