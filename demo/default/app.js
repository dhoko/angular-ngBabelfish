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

      marvinProvider.init({
        url: '../i18n/languages.json'
      })
  })