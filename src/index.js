angular.module('ngBabelfish', [])
  .run(function ($rootScope, marvin, babelfishLang) {

    // Load translations onLoad
    babelfishLang.init();

    // Update the translation when you change a page
    $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
      babelfishLang.bindForState(toState.name);
    });
  });
