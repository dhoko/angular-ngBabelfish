/**
 * i18nBind directive
 * Load a translation for a var
 */
module.exports = ['localize', function(localize) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.append(localize.get(attr.i18nBindLang || document.documentElement.lang)[attr.i18nBind]);
        }
    }

}];