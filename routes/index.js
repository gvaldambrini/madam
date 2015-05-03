var express = require('express');
var passport = require('passport');
var router = express.Router();
var utils = require('../utils');

router.get('/', utils.isAuthenticated, function(req, res, next) {
    res.render('index', {
        isHomeActive: true,
        title: req.i18n.__('Home')});
});


router.get('/login', function(req, res, next) {
    var params = {
        layout: false,
        i18n: {
            username: req.i18n.__('Username'),
            password: req.i18n.__('Password'),
            login: req.i18n.__('Login')
        }
    };

    if (typeof req.session.error !== 'undefined') {
        params.flash = {
            type: 'alert-danger',
            messages: [{msg: req.session.error}]
        };
        req.session.error = undefined;
    }
    res.render('login', params);
});

router.post('/login', passport.authenticate('login', {
      successRedirect: '/',
      failureRedirect: '/login'
  })
);

module.exports = router;
