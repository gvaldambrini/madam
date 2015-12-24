var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('cookie-session');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var bcrypt = require('bcrypt-nodejs');
var elasticsearch = require('elasticsearch');
var validator = require('express-validator');
var csrf = require('csurf');
var moment = require('moment');
var i18n = require('i18n-2');

var routes = require('./routes/index');
var customers = require('./routes/customers');
var products = require('./routes/products');
var settings = require('./routes/settings');
var common = require('./common');
var client = common.createClient();

/**
 * The {@link http://expressjs.com/4x/api.html#app|express application}.
 * @var {object}
 */
var app = express();

i18n.expressBind(app, {
  locales: ['en', 'it'],
});

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

  if (typeof process.env.WEBPACK_DEV_SERVER != 'undefined') {
    response.locals.webpackDevServer = process.env.WEBPACK_DEV_SERVER;
  }

  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));

var hbs = exphbs.create({
  defaultLayout: 'main',
  helpers: {
    json: function(context) {
      return JSON.stringify(context);
    }
  },
  partialsDir: [
      'views/shared/',
      'views/partials/'
  ]
});

app.hbs = hbs;
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(favicon(__dirname + '/public/images/favicon.ico'));

app.use(logger('dev', {
  skip: function(req, res) {
    return !req.config.logger;
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(request, response, next) {
  var validatorOptions = {
    customValidators: {
      isEmpty: function(value) {
        return /^\s+$/.test(value);
      },
      isValidDate: function(value) {
        return moment.utc(value, request.config.date_format).isValid();
      }
    }
  };
  return validator(validatorOptions)(request, response, next);
});

var cookieKey;
var cookieSecret;
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
  })
);

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

// For now, there is no need of something more than the username.
passport.serializeUser(function(username, done) {
  done(null, username);
});

passport.deserializeUser(function(username, done) {
  done(null, username);
});

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
          function filterFn(item) {
              return item.username === username;
          }
          var users, user;

          if (err) {
              return done(err);
          }

          if (typeof resp._source == 'undefined') {
            console.log('Users document not found');
            return done(req.i18n.__('Incorrect username.'), false);
          }
          users = resp._source.users.filter(filterFn);
          if (users.length === 0) {
            return done(req.i18n.__('Incorrect username.'), false);
          }

          user = users[0];
          if (!bcrypt.compareSync(password, user.password)) {
            return done(req.i18n.__('Incorrect password.'), false);
          }

          return done(null, username);
      });
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use(customers.path, customers.router);
app.use(products.path, products.router);
app.use(settings.path, settings.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
