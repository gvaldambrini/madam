#!/usr/bin/env node

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();

var args = process.argv.slice(2);

function deleteIndex(callback) {
    client.indices.delete({
        index: 'customers'
    }, function(err, resp, respcode) {
        if (!err) {
            console.log('Index customer deleted');
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
            console.log('Index customer created');
        }
        callback(err, resp);
    });
}

var async = require('async');

var tasks = [];

if (args.indexOf('-d') != -1) {
    tasks[tasks.length] = deleteIndex;
}

tasks[tasks.length] = createIndex;


async.series(
    tasks,
    // optional callback
    function(err, results) {
        if (err) {
            console.log(err, results);
        }
        process.exit(err ? 1 : 0);
    });
