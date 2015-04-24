var express = require('express');
var exphbs = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var validator = require('express-validator');
var csrf = require('csurf');
var moment = require('moment');
var i18n = require('i18n-2');

var routes = require('./routes/index');
var customers = require('./routes/customers');
var settings = require('./routes/settings');

var app = express();

i18n.expressBind(app, {
  locales: ['en', 'it'],
});

app.use(function(request, response, next) {
  request.config = require('./config.json');
  request.i18n.setLocale(request.config.language);
  // Let the configuration available also in templates.
  response.locals.config = request.config;
  response.locals.isProduction = process.env.NODE_ENV == 'production';
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

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function (request, response, next) {
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

app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use(function (request, response, next) {
  response.locals.csrftoken = request.csrfToken();
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use(customers.path, customers.router);
app.use(settings.path, settings.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


module.exports = app;
