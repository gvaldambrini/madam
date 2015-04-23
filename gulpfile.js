var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');

gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./public/stylesheets/'));
});

gulp.task('scripts', function() {
    return gulp.src('views/javascripts/*.js')
      .pipe(concat('main.js'))
      .pipe(gulp.dest('public/javascripts'));
});

gulp.task('default', ['sass', 'scripts']);

