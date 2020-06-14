const gulp = require('gulp');
const sass = require('gulp-sass');
const browserSync = require('browser-sync').create();
const nodemon = require('gulp-nodemon');

sass.compiler = require('node-sass');

// TAKEN FROM https://gist.github.com/dennib/6f1f9aa9b59596710f62c1ef22a655f4

gulp.task('sass', function() {
    return gulp
      .src('./dev/sass/**/*.scss')
      .pipe(sass().on('error', sass.logError))
      .pipe(gulp.dest('./html/css'));
  });
  
  gulp.task('sass:watch', function() {
    gulp.watch('./dev/sass/**/*.scss', gulp.series('sass'));
  });

  gulp.task('nodemon', cb => {
    let started = false;
    return nodemon({
      script: 'index.js'
    }).on('start', () => {
      if (!started) {
        cb();
        started = true;
      }
    });
  });
  
  gulp.task(
    'browser-sync',
    gulp.series('nodemon', () => {
      browserSync.init(null, {
        proxy: 'http://localhost:3000',
        files: ['html/**/*.*'],
        port: 4000
      });
    })
  );
  
  gulp.task('default', gulp.parallel('browser-sync', 'sass:watch'));