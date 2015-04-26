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
      resolve: {
        i18n: function (babelfishLang) {
          return babelfishLang.load();
        }
      },
      controller: function ($scope, babelfish) {
        $scope.i18n = babelfish.get();

        babelfish.on('change:language', function() {
          $scope.i18n = babelfish.get();
          console.log('Yolo')
        })
      }
    })

    .state('config', {
      url: '/config',
      templateUrl: '../partials/config.html',
      resolve: {
        i18n: function (babelfishLang) {
          return babelfishLang.load();
        }
      },
      controller: function ($scope, babelfish) {
        $scope.i18n = babelfish.get();

        babelfish.on('change:language', function() {
          $scope.i18n = babelfish.get();
        })
      }
    })

    $urlRouterProvider.otherwise('/');

    marvinProvider.init({
      url: '../i18n/languages.json'
    });

    marvinProvider.bindToScope(false);
  })
