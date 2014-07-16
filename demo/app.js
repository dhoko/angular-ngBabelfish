/**
* ngBabelfishDemo Module
*
* Description
*/
angular.module('ngBabelfishDemo', ['ui.router','ngBabelfish'])
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
        url: 'i18n/i18n.json'
      })
  })