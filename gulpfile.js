var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var nodemon = require('gulp-nodemon');

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
}
else {
    console.log('*** development ***');
    gulp.task('sass', function () {
        gulp.src('views/stylesheets/*.scss')
            .pipe(sass())
            .pipe(concat('main.css'))
            .pipe(gulp.dest('public/stylesheets'));
    });

    gulp.task('scripts', function() {
        return gulp.src('views/javascripts/*.js')
          .pipe(concat('main.js'))
          .pipe(gulp.dest('public/javascripts'));
    });

}

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

var buildTasks = ['sass', 'scripts', 'vendorcss', 'vendorscripts', 'images'];

gulp.task('default', buildTasks);

gulp.task('start', function () {
  nodemon({
    script: 'bin/www',
    ignore: ['public/*'],
    ext: 'handlebars js scss',
    tasks: buildTasks
  });
});
