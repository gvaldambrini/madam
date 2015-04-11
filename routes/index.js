var express = require('express');
var router = express.Router();

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client();

// For simplicity, we hardcode the id of the workers document
var workersDocId = '0b78ce22-a667-423b-bdb4-9a09b64dcf7c';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {isHomeActive: true});
});


router.get('/settings', function(req, res, next) {
    res.redirect('/settings/workers')
});


router.get('/settings/workers', function(req, res, next) {

    client.get({
        index: 'main',
        type: 'workers',
        id: workersDocId
    }, function(err, resp, respcode) {
        res.render('settings_workers', {
            isSettingsActive: true,
            isWorkersActive: true,
            workers: resp.found ? resp._source.names : [''],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
    });
});

router.post('/settings/workers', function(req, res, next) {
    var workers = req.body.name.filter(function(e) { return e; });

    var args = {
        index: 'main',
        type: 'workers',
        refresh: true,
        id: workersDocId,
        body: {
            names: workers
        }
    };

    client.index(args, function(err, resp, respcode) {
        if (err) {
            console.error(err);
            // TODO: display the error in the ui.
        }

        res.render('settings_workers', {
            isSettingsActive: true,
            isWorkersActive: true,
            workers: workers.length > 0 ? workers : [''],
            workersUrl: '#',
            servicesUrl: '/settings/services'
        });
    });
});

router.get('/settings/services', function(req, res, next) {
    res.render('settings_services', {
        isSettingsActive: true,
        isServicesActive: true,
        workersUrl: '/settings/workers',
        servicesUrl: '#'

    });
});

module.exports = router;
