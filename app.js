"use strict";

/**
 * The main module, that sets up everything and includes all the other route modules.
 * @module
 */

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt-nodejs');
const elasticsearch = require('elasticsearch');
const validator = require('express-validator');
const csrf = require('csurf');
const moment = require('moment');
const i18n = require('i18n-2');

const routes = require('./routes/index');
const customers = require('./routes/customers');
const products = require('./routes/products');
const settings = require('./routes/settings');
const common = require('./common');
const client = common.createClient();

/**
 * Reads the configuration of the app, sets the language depending on it and make it
 * available within the request / response objects.
 * @function
 *
 * @param {app} app the {@link http://expressjs.com/4x/api.html#app|express application}.
 */
function setupConfig(app) {
    app.use(function(request, response, next) {
        if (typeof process.env.NODE_CONFIG_FILE != 'undefined') {
            request.config = require(process.env.NODE_CONFIG_FILE);
        }
        else {
            request.config = require('./config.json');
        }
        request.i18n.setLocale(request.config.language);
        // Let the configuration available also in templates.
        response.locals.config = request.config;
        response.locals.isProduction = process.env.NODE_ENV == 'production';
        next();
    });
}

/**
 * Makes the webpack dev server configuration available in the response object.
 * @function
 *
 * @param {app} app the {@link http://expressjs.com/4x/api.html#app|express application}.
 */
function setupWebpack(app) {
    app.use(function(request, response, next) {
        if (typeof process.env.WEBPACK_DEV_SERVER != 'undefined') {
            response.locals.webpackDevServer = process.env.WEBPACK_DEV_SERVER;
        }
        next();
    });
}

/**
 * Sets up the handlebars template engine.
 * @function
 *
 * @param {app} app the {@link http://expressjs.com/4x/api.html#app|express application}.
 */
function setupHandlebars(app) {
  const hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
      json: context => JSON.stringify(context)
    }
  });

  app.hbs = hbs;
  app.engine('handlebars', hbs.engine);
  app.set('view engine', 'handlebars');
}

/**
 * Sets up the express validator middleware.
 * @function
 *
 * @param {app} app the {@link http://expressjs.com/4x/api.html#app|express application}.
 */
function setupValidator(app) {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(function(request, response, next) {
      let validatorOptions = {
        customValidators: {
          isEmpty: value => /^\s+$/.test(value),
          isValidDate: value => moment(value, request.config.date_format).isValid()
        }
      };
      return validator(validatorOptions)(request, response, next);
    });
}

/**
 * Sets up the cookies and the csrf protection.
 * @function
 *
 * @param {app} app the {@link http://expressjs.com/4x/api.html#app|express application}.
 */
function setupCookies(app) {
    let cookieKey;
    let cookieSecret;
    if (process.env.NODE_ENV == 'production') {
        cookieKey = process.env.COOKIE_KEY;
        cookieSecret = process.env.COOKIE_SECRET;
    }
    else {
        cookieKey = 'sid';
        cookieSecret = 'secret';
    }

    app.use(cookieParser(cookieSecret));
    app.use(session({
        key: cookieKey,
        secret: cookieSecret,
        maxAge: 1 * 60 * 60 * 1000 // 1 hour (rolling)
    }));

    app.use(csrf({ cookie: true }));
    app.use(function(req, res, next) {
        // To update the session expiration time we need to send the new
        // expiration in the response cookie.
        // To send again the response cookie to the client we need to
        // update the session object.
        req.session.fake = Date.now();

        // Pass the csrf token to use to the frontend.
        res.cookie('csrf', req.csrfToken());
        next();
    });
}

/**
 * Sets up the authentication of the app using the passport local strategy.
 * @function
 *
 * @param {app} app the {@link http://expressjs.com/4x/api.html#app|express application}.
 */
function setupAuthentication(app) {
    // For now, there is no need of something more than the username.
    passport.serializeUser((username, done) => done(null, username));
    passport.deserializeUser((username, done) => done(null, username));

    passport.use('login', new LocalStrategy({
        passReqToCallback : true
    },
    // The verify callback, called only if both username and password are present.
    function(req, username, password, done) {
        client.get({
            index: req.config.mainIndex,
            type: 'users',
            id: common.usersDocId
        }, function(err, resp, respcode) {
            if (err) {
                return done(err);
            }

            if (typeof resp._source == 'undefined') {
                console.log('Users document not found');
                return done(req.i18n.__('Incorrect username.'), false);
            }
            let users = resp._source.users.filter(el => el.username === username);
            if (users.length === 0) {
                return done(req.i18n.__('Incorrect username.'), false);
            }

            let user = users[0];
            if (!bcrypt.compareSync(password, user.password)) {
                return done(req.i18n.__('Incorrect password.'), false);
            }

            return done(null, username);
        });
    }));

    app.use(passport.initialize());
    app.use(passport.session());
}

/**
 * The {@link http://expressjs.com/4x/api.html#app|express application}.
 * @var {object}
 */
const app = express();
const appDirname = path.resolve(path.dirname());

i18n.expressBind(app, {
  locales: ['en', 'it'],
});

setupConfig(app);
setupWebpack(app);

// view engine setup
app.set('views', path.join(appDirname, 'views'));

setupHandlebars(app);
app.use(favicon(appDirname + '/public/images/favicon.ico'));

app.use(logger('dev', {
  skip: (req, res) => !req.config.logger
}));

setupValidator(app);
setupCookies(app);
setupAuthentication(app);

app.use(express.static(path.join(appDirname, 'public')));

app.use('/', routes);
app.use(customers.path, customers.router);
app.use(products.path, products.router);
app.use(settings.path, settings.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
