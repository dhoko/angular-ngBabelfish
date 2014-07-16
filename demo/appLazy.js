/**
* ngBabelfishDemo Module
*
* Description
*/
angular.module('ngBabelfishDemoLazy', ['ui.router','ngBabelfish'])
  .config(function ($stateProvider, $urlRouterProvider, babelfishProvider){

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'partials/home.html'
      })

      .state('config', {
        url: '/config',
        templateUrl: 'partials/config.html',
        controller: function() {}
        // controller: 'configCtrl'

      })

      $urlRouterProvider.otherwise('/');

      babelfishProvider.languages({
        namespace: 'i18n',
        lazy: true,
        urls: [
            {
                lang: 'fr-FR',
                url: 'i18n/fr-FR.json'
            },
            {
                lang: 'en-EN',
                url: 'i18n/en-EN.json'
            }
        ]
      })
  })