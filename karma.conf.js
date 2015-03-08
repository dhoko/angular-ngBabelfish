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
      // 'dist/bundle.js',
      'src/index.js',
      'src/**/*.js',
      'test/specs/**/*.spec.js'
    ],

    exclude: [],
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['progress', 'coverage'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    // browsers: ['Chrome', 'PhantomJS'],
    browsers: ['PhantomJS'],
    captureTimeout: 60000,

    singleRun: true,

    preprocessors: {
      'src/**/*.js': ['coverage']
    },
    coverageReporter: {
      type : 'html',
      dir : 'coverage/'
    }

  });
};
