/**
* ngBabelfishDemo Module
*
* Description
*/
angular.module('ngBabelfishDemo', ['ui.router','ngBabelfish'])
  .config(function ($stateProvider, $urlRouterProvider, marvinProvider){

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: '../partials/home.html',
        controller: function() {}
      })

      .state('config', {
        url: '/config',
        templateUrl: '../partials/config.html',
        controller: function() {}
        // controller: 'configCtrl'

      })

      $urlRouterProvider.otherwise('/');

      marvinProvider
        .lang({
          lang: 'en-EN',
          url: '../i18n/en-EN.json'
        })
        .lang({
          lang: 'fr-FR',
          url: '../i18n/fr-FR.json'
        });
  })
