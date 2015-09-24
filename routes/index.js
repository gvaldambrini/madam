/**
 * Index module, contains all the homepage and the login/logout views.
 * @module
 */
var express = require('express');
var passport = require('passport');
var router = express.Router();
var common = require('../common');

router.get('/', common.isAuthenticated, function(req, res, next) {
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


router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/login');
});

/** The index router. */
module.exports = router;
