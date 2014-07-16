/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('ngBabelfish', [])
    .provider('babelfish', require('./providers/babelfish'))
    .directive('i18nLoad', require('./directives/i18nLoad'))
    .directive('i18nBind', require('./directives/i18nBind'))
    .filter('translate', require('./filters/translate'))
    .run(['babelfish', '$state','$rootScope', function(babelfish, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on(babelfish.getEvent(), function(e, toState) {
            babelfish.updateState(toState.name);
        });

        babelfish.load();
    }]);