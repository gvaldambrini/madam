#!/usr/bin/env node

"use strict";

const async = require('async');
const dropbox = require('dropbox');
const stream = require('stream');
const zlib = require('zlib');
const tar = require('tar-stream');
const promptly = require('promptly');
const util = require('util');
const common = require('../common');
const client = common.createClient();

/**
 * @overview Restores document(s) on elasticsearch.
 *
 * The script asks the name of the archive that contains the document(s)
 * to restore, and after downloading it from dropbox, it extracts the
 * required document(s) and reindex the it/them on elasticsearch, asking
 * for confirmation if the document(s) already exists on the database.
 *
 * Simmetric to the dump_es.js script which can be used to create the
 * source archive.
 */

const mainIndex = 'main';

const dboxClient = new dropbox.Client({
  key: process.env.DROPBOX_APP_KEY,
  secret: process.env.DROPBOX_APP_SECRET,
  token: process.env.DROPBOX_APP_TOKEN
});

dboxClient.authDriver(new dropbox.AuthDriver.NodeServer(8191));

async.waterfall([
  // ask the archive filename to retrieve
  function(callback) {
    const archiveNameValidator = function(value) {
      if (!value.match(/^archive_\d{4}-\d{2}-\d{2}.tar.gz$/)) {
        throw new Error('The archive name should be in the form archive_YYYY-MM-DD.tar.gz');
      }

      return value;
    };
    const opt = {validator: archiveNameValidator};
    promptly.prompt('Enter the archive filename:', opt, function(err, value) {
      callback(err, {archiveFilename: value});
    });
  },
  // check if the archive filename exists on dropbox
  function(res, callback) {
    dboxClient.authenticate(function(error, dboxClient) {
      if (error) {
        callback(error, null);
      }
      const year = res.archiveFilename.match(/^archive_(\d{4})-\d{2}-\d{2}.tar.gz$/)[1];
      const fullname = year + '/' + res.archiveFilename;
      dboxClient.stat(fullname, { buffer: true }, function(error, _buf) {
        if (error) {
          callback('File not found', null);
        }
        callback(null, {fullname: fullname});
      });
    });
  },
  // download the given archive
  function(res, callback) {
    dboxClient.authenticate(function(error, dboxClient) {
      if (error) {
        callback(error, null);
      }
      dboxClient.readFile(res.fullname, { buffer: true }, function(error, buf) {
        if (error) {
          callback(error, null);
        }
        callback(null, {buffer: buf});
      });
    });
  },
  // extract the documents json from the archive
  function(res, callback) {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(res.buffer);

    const extract = tar.extract();
    let data = '';

    extract.on('entry', function(header, stream, cb) {
      stream.on('data', function(chunk) {
        if (header.name === 'documents.json')
          data += chunk;
      });

      stream.on('end', function() {
        cb();
      });

      stream.resume();
    });

    extract.on('finish', function() {
      callback(null, {documents: JSON.parse(data)});
    });

    bufferStream
      .pipe(zlib.createGunzip())
      .pipe(extract);
  },
  // ask the document id to restore
  function(res, callback) {
    const documentIdValidator = function(value) {
      if (value === 'all')
        return value;

      for (let i = 0; i < res.documents.length; i++) {
        if (res.documents[i]._id === value)
          return value;
      }

      throw new Error('The document id must be all or an id present in the archive.');
    };
    const opt = {validator: documentIdValidator};
    const msg = 'Enter the document id to restore or all to restore everything:';

    promptly.prompt(msg, opt, function(err, value) {
      const documents = [];
      for (let i = 0; i < res.documents.length; i++) {
        if (res.documents[i]._id === value || value === 'all') {
          documents[documents.length] = res.documents[i];
        }
      }
      callback(null, {documents: documents});
    });
  },
  // check if the required documents already exist on elasticsearch
  function(res, callback) {
    async.filter(res.documents, function(doc, filterCallback) {
      client.exists({
        index: mainIndex,
        type: doc._type,
        id: doc._id
      }, function(error, exists) {
        filterCallback(exists);
      });
    }, function(results) {
      res.existingDocuments = results;
      callback(null, res);
    });
  },
  // ask the user to confirm before overwriting the already existent docs
  function(res, callback) {
    function documentExists(doc) {
      for (let i = 0; i < res.existingDocuments.length; i++) {
        if (res.existingDocuments[i]._id === doc._id) {
          return true;
        }
      }
      return false;
    }

    const confirmMsg = 'The document "%s" already exists on the db. Overwrite? [y/n]';
    const yesNoValidator = function(value) {
      if (value === 'y' | value === 'yes')
        return 'yes';
      if (value === 'n' || value === 'no')
        return 'no';
      throw new Error('Enter yes or no.');
    };

    async.filterSeries(res.documents, function(doc, filterCallback) {
      if (!documentExists(doc)) {
        filterCallback(true);
        return;
      }
      const msg = util.format(confirmMsg, doc._id);
      const opt = {validator: yesNoValidator};

      promptly.prompt(msg, opt, function(err, value) {
        filterCallback(value === 'yes');
      });
    }, function(results) {
      callback(null, {documents: results});
    });
  },
  // restore the document(s)
  function(res, callback) {
    const body = [];
    for (let i = 0; i < res.documents.length; i++) {
      body[body.length] = {
        index: {
          _type: res.documents[i]._type,
          _id: res.documents[i]._id
        }
      };
      body[body.length] = res.documents[i]._source;
    }
    client.bulk({
      body: body,
      index: mainIndex,
      refresh: true
    }, function(err, _resp) {
      callback(err, res.documents);
    });
  }],
  function(err, results) {
    if (err) {
      console.log('Error:', err);
    }
    else {
      console.log('Documents restored:', results.length);
    }
    process.exit(err ? 1 : 0);
  }
);
