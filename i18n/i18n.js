require('./i18n-solo');

/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('ngBabelfish', ['ngBabelfish.solo'])
    .provider('babelfish', require('./providers/babelfish'))
    .filter('translate', require('./filters/translate'))
    .run(['babelfish', '$state','$rootScope', function(babelfish, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on(babelfish.getEvent(), function(e, toState) {
            babelfish.updateState(toState.name);
        });
        babelfish.load();
    }]);