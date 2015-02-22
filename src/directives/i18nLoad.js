angular.module('ngBabelfish')
  .directive('i18nLoad', function (babelfishLang, marvinTasks) {

    return {
      link: function(scope, el, attr) {
        el.on('click',function() {
          scope.$apply(function() {
            babelfishLang.set(attr.i18nLoad);
            marvinTasks.bindToScope();
          });
        });
      }
    }
  });