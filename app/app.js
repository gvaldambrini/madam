var express = require('express');
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
//var users = require('./routes/users');
var customers = require('./routes/customers');

var app = express();

i18n.expressBind(app, {
  locales: ['en', 'it'],
});

app.use(function(request, response, next) {
  request.config = require('./config.json');
  request.i18n.setLocale(request.config.preferred_locale);
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

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
//app.use('/users', users);
app.use(customers.path, customers.router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
