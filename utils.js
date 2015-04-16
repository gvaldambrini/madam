var elasticsearch = require('elasticsearch');


function createClient() {
    if (process.env.NODE_ENV == 'production')
        return new elasticsearch.Client({host: process.env.BONSAI_URL});
    return new elasticsearch.Client();
}

// For simplicity, we hardcode the id for the workers and services documents
module.exports.workersDocId = '0b78ce22-a667-423b-bdb4-9a09b64dcf7c';
module.exports.servicesDocId = '5678a632-9d9a-43c9-b440-4f6e1f6dfea7';


module.exports.createClient = createClient;
