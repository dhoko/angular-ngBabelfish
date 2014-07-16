/**
 * i18nBind directive
 * Load a translation for a var
 */
module.exports = ['babelfish', function (babelfish) {

    "use strict";

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.on('click',function() {
                scope.$apply(function() {
                    babelfish.updateLang(attr.i18nLoad);
                });
            });
        }
    };

}];