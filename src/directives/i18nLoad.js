angular.module('ngBabelfish')
  .directive('i18nLoad', function (babelfish) {

    return {
      link: function(scope, el, attr) {
        el.on('click',function() {
          scope.$apply(function() {
            babelfish.updateLang(attr.i18nLoad);
          });

        });
      }
    }
  });