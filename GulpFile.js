var fs          = require('fs'),
    path        = require('path'),
    gulp        = require('gulp'),
    semver      = require('semver'),
    concat      = require('gulp-concat'),
    tap         = require('gulp-tap'),
    plumber     = require('gulp-plumber'),
    beautify    = require('gulp-beautify'),
    uglify      = require('gulp-uglify'),
    jeditor     = require('gulp-json-editor'),
    streamqueue = require('streamqueue'),
    sourcemaps  = require('gulp-sourcemaps')
    ngAnnotate  = require('gulp-ng-annotate');


gulp.task('module', function() {

  gulp
    .src(['./src/index.js', './src/**/*.js'])
    .pipe(plumber())
    .pipe(ngAnnotate({
      add: true,
      remove: true,
      single_quotes: true
    }))
    .pipe(beautify({
      indentSize: 2,
      keepArrayIndentation: true
    }))
    .pipe(sourcemaps.init())
    .pipe(concat('bundle.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist'))
    .pipe(uglify())
    .pipe(concat('bundle.min.js'))
    .pipe(gulp.dest('./dist'));

});

gulp.task('package', function() {

  var type = 'patch';

  gulp.src(['package.json', 'bower.json'])
    .pipe(jeditor(function (json) {

      if(process.argv.indexOf('--major') > -1) {
        type = 'major';
      }

      if(process.argv.indexOf('--minor') > -1) {
        type = 'minor';
      }
      json.version = semver.inc(json.version, type);
      return json;
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('default', ['module'], function() {
  gulp.watch('./src/**/*.js',['module']);
});
