var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
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

    gulp.task('scripts', function() {
        return gulp.src('views/javascripts/*.js')
          .pipe(concat('main.js'))
          .pipe(uglify())
          .pipe(rename('main.min.js'))
          .pipe(gulp.dest('public/javascripts'));
    });

    gulp.task('build', ['sass', 'scripts', 'vendorcss', 'vendorscripts', 'images']);
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

    gulp.task('scripts', function() {
        return gulp.src('views/javascripts/*.js')
          .pipe(concat('main.js'))
          .pipe(gulp.dest('public/javascripts'));
    });

    gulp.task('doc', shell.task([
      './node_modules/.bin/jsdoc -c jsdoc.json -r README.md']));

    gulp.task('lint', function() {
      return gulp.src(["*.js", "routes/*.js", "views/javascripts/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
    });

    gulp.task('build', ['sass', 'scripts', 'vendorcss', 'vendorscripts', 'images', 'doc', 'lint']);
    gulp.task('scripts-watch', ['scripts'], reload);

    gulp.task('browser-sync', ['nodemon'], function() {
      browserSync.init(null, {
        proxy: "http://localhost:3000",
        browser: ['google chrome'],
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
          cb();
        }
      });
    });

    gulp.task('default', ['build', 'browser-sync'], function () {
      gulp.watch(["*.js", "routes/*.js", "views/javascripts/*.js"], ['lint']);
      gulp.watch(["*.js", "routes/*.js", "README.md", "jsdoc.json"], ['doc']);
      gulp.watch("views/stylesheets/*.scss", ['sass']);
      gulp.watch("views/javascripts/*.js", ['scripts-watch']);
      gulp.watch([
        "views/*.handlebars",
        'views/partials/*.handlebars',
        'views/layouts/*.handlebars',
        'views/shared/*.handlebars'], reload);
    });
}



