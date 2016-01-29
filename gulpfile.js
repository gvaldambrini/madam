var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
var webpack = require("webpack");
var webpackConfig = require("./webpack.config.js");
var WebpackDevServer = require("webpack-dev-server");

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
    gulp.task('build', ['webpack-build']);
}
else {
    console.log('*** development ***');

    gulp.task('doc', shell.task([
      './node_modules/.bin/jsdoc -c jsdoc.json -r README.md']));

    gulp.task('lint', function() {
      return gulp.src(["*.js", "routes/*.js", "routehandlers/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    });

    gulp.task('build', ['doc', 'lint']);

    gulp.task('nodemon', function (cb) {
      var called = false;
      return nodemon({
        script: 'bin/www',
        ext: 'js',
        ignore: ['public/*', 'views/*', 'test/*', 'webpack.config.js']
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

    gulp.task('default', ['build', 'webpack-dev-server', 'nodemon'], function () {
      gulp.watch(["*.js", "routes/*.js", "routehandlers/*.js"], ['lint']);
      gulp.watch(["*.js", "routes/*.js", "routehandlers/*.js", "README.md", "jsdoc.json"], ['doc']);
    });
}
