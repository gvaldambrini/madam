var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');

if (process.env.NODE_ENV === 'production') {
    console.log('*** production ***');
    gulp.task('sass', function () {
        gulp.src('views/stylesheets/*.scss')
            .pipe(sass())
            .pipe(concat('main.css'))
            .pipe(rename({ suffix: '.min' }))
            .pipe(minifycss())
            .pipe(gulp.dest('public/stylesheets/'));
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
            .pipe(gulp.dest('public/stylesheets/'));
    });

    gulp.task('scripts', function() {
        return gulp.src('views/javascripts/*.js')
          .pipe(concat('main.js'))
          .pipe(gulp.dest('public/javascripts'));
    });

}



gulp.task('default', ['sass', 'scripts']);

