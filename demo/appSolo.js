/**
* ngBabelfishDemo Module
*
* Description
*/
angular.module('ngBabelfishDemoSolo', ['ui.router','ngBabelfish.solo'])
  .config(function ($stateProvider, $urlRouterProvider){

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'partials/home.html',
        controller: function(translator) {
            console.log(translator.get())
        }
      })

      .state('config', {
        url: '/config',
        templateUrl: 'partials/config.html',
        controller: function() {}
        // controller: 'configCtrl'

      })

      $urlRouterProvider.otherwise('/');
  })
  .run(function (translator) {
    translator.initSolo({
        lang: 'en-EN',
        url: 'i18n/translations.json',
        namespace: 'i18n'
    });
    translator.load();
  });