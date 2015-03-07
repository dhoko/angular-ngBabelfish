angular.module('ngBabelfish', [])
  .run(function ($rootScope, marvin, babelfishLang) {

    // Update the translation when you change a page
    $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
      babelfishLang.init(toState.name);
    });
  });
