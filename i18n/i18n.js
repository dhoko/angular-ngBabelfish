/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('servalI18n', [])
    .factory('localize', require('./services/localize'))
    .directive('i18nLoad', require('./directives/i18nLoad'))
    .directive('i18nBind', require('./directives/i18nBind'))
    .filter('translate', require('./filters/translate'))
    .value("custom")
    .run(['localize', '$state','$rootScope', function(localize, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on('$stateChangeSuccess', function(e, toState) {
            localize.updateState(toState.name);
        });

        localize.load();
    }]);