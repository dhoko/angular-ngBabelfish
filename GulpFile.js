var fs          = require('fs'),
    path        = require('path'),
    gulp        = require('gulp'),
    concat      = require('gulp-concat'),
    tap         = require('gulp-tap'),
    plumber     = require('gulp-plumber'),
    beautify    = require('gulp-beautify'),
    uglify      = require('gulp-uglify'),
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

gulp.task('modules', function() {

  /**
   * List each directory inside a directory
   * From {@link https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-task-steps-per-folder.md}
   * @param  {String} dir Directory
   * @return {Array}
   */
  function getFolders(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
  }

  var folders = getFolders('./src'),
      i = folders.length,
      stream = streamqueue({objectMode: true});

  stream.queue(gulp.src('./src/index.js'));

  while(i-- > 0) {

    stream
      .queue(
      gulp.src('./src/' + folders[i] + '/**/*.js')
        .pipe(plumber())
        .pipe(tap(function (file) {

          if('index' !== path.basename(file.path,'.js')) {
            var paths = file.path.split(path.sep);
            file.contents = Buffer
                    .concat([
                    new Buffer('angular.module(\'' + paths[paths.length -3] + '\')' + "\n."),file.contents
                    ]);
          }
        }))
        .pipe(concat(folders[i] + '.js',{newLine: "\n"}))
      );
  }

  return stream.done()
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
      .pipe(uglify())
      .pipe(concat('bundle.min.js'))
      .pipe(gulp.dest('./dev'));
});

gulp.task('default', ['module'], function() {
  gulp.watch('./src/**/*.js',['module']);
});
