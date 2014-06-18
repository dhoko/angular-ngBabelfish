// Karma configuration

module.exports = function(config) {

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    // list of files / patterns to load in the browser
    files: [
      'node_modules/angular/lib/angular.min.js',
      'node_modules/angular.js/src/ngMock/angular-mocks.js',
      'node_modules/angular-ui-router/release/angular-ui-router.min.js',
      'bundle.js',
      'test/**/*'
    ],

    exclude: [],
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress'],

    port: 9876,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_WARN,
    autoWatch: true,

    // browsers: ['Chrome', 'PhantomJS'],
    browsers: ['PhantomJS'],
    captureTimeout: 60000,

    singleRun: false,
    // browserify: {
    //   watch: true,
    // },

    // Add browserify to preprocessors
    // preprocessors: {'test/**/*'}

  });
};