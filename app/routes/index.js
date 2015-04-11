var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {isHomeActive: true});
});


router.get('/settings', function(req, res, next) {
    res.redirect('/settings/workers')
});

// TODO: save into the database.
var workers = [];

router.get('/settings/workers', function(req, res, next) {

    res.render('settings_workers', {
        isSettingsActive: true,
        isWorkersActive: true,
        workers: workers.length > 0 ? workers : [''],
        workersUrl: '#',
        servicesUrl: '/settings/services'
    });
});

router.post('/settings/workers', function(req, res, next) {
    workers = req.body.name.filter(function(e) { return e; });

    res.render('settings_workers', {
        isSettingsActive: true,
        isWorkersActive: true,
        workers: workers.length > 0 ? workers : [''],
        workersUrl: '#',
        servicesUrl: '/settings/services'
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
