#!/usr/bin/env node

var program = require('commander');
var async = require('async');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();


function deleteIndex(callback) {
    client.indices.delete({
        index: 'customers'
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Index customers deleted');
        }
        callback(err, resp);
    });
}

function createIndex(callback) {
    client.indices.create({
        index: 'customers',
        body: {
            settings: {
                index: {
                    number_of_shards: 1,
                    number_of_replicas: 1
                }
            },
        }
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Index customers created');
        }
        callback(err, resp);
    });
}

function putMapping(callback) {
    client.indices.putMapping({
        index: 'customers',
        type: 'customer',
        body: {
            customer: {
                properties: {
                    name: {type: 'string'},
                    surname: {type: 'string'},
                    mobile_phone: {type: 'string'},
                    allow_sms: {type: 'boolean'},
                    phone: {type: 'string'},
                    email: {type: 'string'},
                    allow_email: {type: 'boolean'},
                    discount: {type: 'integer'},
                    first_see: {type: 'date'},
                    last_see: {type: 'date'},
                    notes: {type: 'string'},
                    appointments: {
                        properties: {
                            date: {type: 'date'},
                            services: {
                                properties: {
                                    description: {type: 'string'}
                                }
                            },
                            satisfaction: {type: 'integer'},
                            discount: {type: 'integer'},
                            notes: {type: 'string'}
                        }
                    },
                }
            }
        }
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Mapping customer created');
        }
        callback(err, resp);
    });
}

program
    .description('Generate elastisearch indices.')
    .option('-d, --delete', 'delete old indices')
    .parse(process.argv);


var tasks = [];

if (program.delete)
    tasks[tasks.length] = deleteIndex;

tasks[tasks.length] = createIndex;
tasks[tasks.length] = putMapping;

async.series(
    tasks,
    // optional callback
    function(err, results) {
        if (err) {
            console.log(err, results);
        }
        process.exit(err ? 1 : 0);
    });
