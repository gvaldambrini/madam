#!/usr/bin/env node
var async = require('async');
var common = require('../common');
var client = common.createClient();
var archiver = require('archiver');
var dropbox = require('dropbox');
var moment = require('moment');
var path = require('path');
var util = require('util');

/**
 * @overview Dumps the mapping and the documents on elasticsearch on dropbox.
 *
 * The script fetches from elasticsearch the mapping definition and all the
 * documents and create and archive which will be saved on dropbox under
 * the name <archive_YYYY-MM-DD.tar.gz>.
 *
 * Simmetric to the restore_es.js script which can be used to restore one or
 * more document from the generated archive.
 */

var mainIndex = 'main';

var dboxClient = new dropbox.Client({
    key: process.env.DROPBOX_APP_KEY,
    secret: process.env.DROPBOX_APP_SECRET,
    token: process.env.DROPBOX_APP_TOKEN
});

dboxClient.authDriver(new dropbox.AuthDriver.NodeServer(8191));

async.waterfall([
        // dump the mappings into a json string
        function(callback) {
            client.indices.getMapping({
                index: mainIndex
            }, function(err, resp, _respcode) {
                if (err) {
                    callback(err, null);
                    return;
                }

                var res = {mappings: JSON.stringify(resp[mainIndex].mappings, null, 2)};
                callback(null, res);
            });
        },
        // dump the documents into a json string
        function(res, callback) {
            client.search({
                index: mainIndex,
                size: 10000
            }, function(err, resp, _respcode) {
                if (err) {
                    console.log(err);
                    callback(err, null);
                }
                if (resp.hits.total !== resp.hits.hits.length) {
                    callback('Error in fetching all the documents', resp.hits.total);
                }
                var documents = [];
                for (var i = 0; i < resp.hits.hits.length; i++) {
                    documents[documents.length] = {
                        _index: resp.hits.hits[i]._index,
                        _type: resp.hits.hits[i]._type,
                        _id: resp.hits.hits[i]._id,
                        _source: resp.hits.hits[i]._source
                    };
                }
                res.documents = JSON.stringify(documents, null, 2);
                callback(null, res);
            });
        },
        // create an archive from the json strings and create an unique buffer object
        function(res, callback) {
            var archive = archiver('tar', {
                gzip: true,
                gzipOptions: {level: 1}
            });

            var bufs = [];
            archive.on('data', function(d) {
                bufs.push(d);
            });

            archive.on('end', function() {
                var buffer = Buffer.concat(bufs);
                callback(null, {buffer: buffer});
            });

            archive
                .append(new Buffer(res.mappings), {name: 'mappings.json'})
                .append(new Buffer(res.documents), {name: 'documents.json'})
                .finalize();
        },
        // write the buffer object on dropbox
        function(res, callback) {
            dboxClient.authenticate(function(error, dboxClient) {
                if (error) {
                    callback(error, null);
                }
                var today = moment();
                var fname = today.format('YYYY') + '/archive_' + today.format('YYYY-MM-DD') + '.tar.gz';
                dboxClient.writeFile(fname, res.buffer, function(error, _stat) {
                    if (error) {
                        callback(error, null);
                    }
                    callback(null, {fname: fname});
                });
            });
        }
    ],
    function(err, results) {
        if (err) {
            console.log(err, results);
        }
        else {
            console.log(
                util.format('Dump successfully created on file: "%s"', path.basename(results.fname)));
        }
        process.exit(err ? 1 : 0);
    });