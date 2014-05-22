/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('servalI18n', [])
    .factory('babelfish', require('./services/babelfish'))
    .directive('i18nLoad', require('./directives/i18nLoad'))
    .directive('i18nBind', require('./directives/i18nBind'))
    .filter('translate', require('./filters/translate'))
    .value("custom")
    .run(['babelfish', '$state','$rootScope', function(babelfish, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on('$stateChangeSuccess', function(e, toState) {
            babelfish.updateState(toState.name);
        });

        babelfish.load();
    }]);