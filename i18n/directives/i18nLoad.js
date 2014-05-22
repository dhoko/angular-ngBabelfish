/**
 * i18nLoad directive
 * Load a translation from a click on a button with the attr i18n-load
 */
module.exports = ['localize', function(localize) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.on('click',function() {
                scope.$apply(function() {
                    localize.updateLang(attr.i18nLoad);
                });
            });
        }
    }

}];