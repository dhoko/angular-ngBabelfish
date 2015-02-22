// Karma configuration

module.exports = function(config) {

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    // list of files / patterns to load in the browser
    files: [
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'node_modules/angular-ui-router/release/angular-ui-router.min.js',
      'dist/bundle.js',
      'test/specs/**/*'
    ],

    exclude: [],
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    // reporters: ['tap'],
    // reporters: ['progress'],
    reporters: ['mocha'],

    port: 9876,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,

    // browsers: ['Chrome', 'PhantomJS'],
    browsers: ['PhantomJS'],
    captureTimeout: 60000,

    singleRun: true,
    // browserify: {
    //   watch: true,
    // },

    // Add browserify to preprocessors
    preprocessors: {
        'src/**/*.js': ['coverage']
    },
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    }

  });
};
