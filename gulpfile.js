var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
var webpack = require("webpack");
var webpackConfig = require("./webpack.config.js");
var WebpackDevServer = require("webpack-dev-server");
var reload = browserSync.reload;

gulp.task('vendorscripts', function() {
    return gulp.src([
        'node_modules/express-handlebars/node_modules/handlebars/dist/handlebars.runtime.min.js',
        'node_modules/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
        'node_modules/bootstrap-datepicker/dist/locales/bootstrap-datepicker.it.min.js',
        'vendor/bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min.js'])
      .pipe(concat('vendor.min.js'))
      .pipe(gulp.dest('public/javascripts'));
});

gulp.task('vendorcss', function() {
    return gulp.src([
        'node_modules/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css',
        'vendor/bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css'])
      .pipe(concat('vendor.min.css'))
      .pipe(gulp.dest('public/stylesheets'));
});

gulp.task('images', function() {
    return gulp.src([
        'vendor/bootstrap-colorpicker/dist/images/**'])
      .pipe(gulp.dest('public/images'));
});

gulp.task('webpack-build', function(cb) {
  var config = Object.create(webpackConfig);
  config.plugins = config.plugins.concat(
    new webpack.DefinePlugin({
      "process.env": {
        "NODE_ENV": JSON.stringify("production")
      }
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin()
  );

  webpack(config, function(err, stats) {
    if (err)
      console.log('[webpack-build] - Error:', err);
    cb();
  });
});

if (process.env.NODE_ENV === 'production') {
    console.log('*** production ***');

    gulp.task('sass', function () {
        gulp.src('views/stylesheets/*.scss')
            .pipe(sass())
            .pipe(concat('main.css'))
            .pipe(rename({ suffix: '.min' }))
            .pipe(minifycss())
            .pipe(gulp.dest('public/stylesheets'));
    });

    gulp.task('build', ['webpack-build', 'sass', 'vendorcss', 'vendorscripts', 'images']);
}
else {
    console.log('*** development ***');

    gulp.task('sass', function () {
        gulp.src('views/stylesheets/*.scss')
            .pipe(sass())
            .pipe(concat('main.css'))
            .pipe(gulp.dest('public/stylesheets'))
            .pipe(reload({stream:true}));
    });

    gulp.task('doc', shell.task([
      './node_modules/.bin/jsdoc -c jsdoc.json -r README.md']));

    gulp.task('lint', function() {
      return gulp.src(["*.js", "routes/*.js", "routehandlers/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    });

    gulp.task('build', ['sass', 'vendorcss', 'vendorscripts', 'images', 'doc', 'lint']);

    gulp.task('browser-sync', function() {
      browserSync.init(null, {
        proxy: "http://localhost:3000",
        port: 4000
      });
    });

    gulp.task('nodemon', function (cb) {
      var called = false;
      return nodemon({
        script: 'bin/www',
        ext: 'js',
        ignore: ['public/*', 'views/*']
      }).on('start', function () {
        if (!called) {
          called = true;
          // Give server time to start
          setTimeout(cb, 1000);
        }
      });
    });

    gulp.task('webpack-dev-server', function (cb) {
      var config = Object.create(webpackConfig);
      config.devtool = "eval";
      config.debug = true;
      config.entry.app.unshift("webpack-dev-server/client?http://localhost:8080");

      var serverOptions = {
        publicPath: 'http://localhost:8080/',
        stats: {colors: true},
        quiet: true
      };

      var devServer = new WebpackDevServer(webpack(config), serverOptions);
      devServer.listen(8080, 'localhost', function(err) {
        if (err)
          console.log('unable to start webpack-dev-server:', err);
        process.env.WEBPACK_DEV_SERVER = 'http://localhost:8080/';
        cb();
      });
    });

    gulp.task('default', ['build', 'webpack-dev-server', 'nodemon', 'browser-sync'], function () {
      gulp.watch(["*.js", "routes/*.js", "routehandlers/*.js"], ['lint']);
      gulp.watch(["*.js", "routes/*.js", "routehandlers/*.js", "README.md", "jsdoc.json"], ['doc']);
      gulp.watch("views/stylesheets/*.scss", ['sass']);
      gulp.watch(["views/*.handlebars"], reload);
    });
}



