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

program
    .description('Generate elastisearch indices.')
    .option('-d, --delete', 'delete old indices')
    .parse(process.argv);


var tasks = [];

if (program.delete)
    tasks[tasks.length] = deleteIndex;

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
