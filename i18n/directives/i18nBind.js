/**
 * i18nBind directive
 * Load a translation for a var
 */
module.exports = ['babelfish', function (babelfish) {

    'use strict';

    return {
        restrict: "A",
        link: function(scope,el,attr) {

          scope.$on('ngBabelfish.translation:loaded', function() {
            el.html(babelfish.get(attr.i18nBindLang || babelfish.current() )[attr.i18nBind]);
          });
        }
    };

}];
