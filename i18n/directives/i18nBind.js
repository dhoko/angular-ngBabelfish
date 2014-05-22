/**
 * i18nBind directive
 * Load a translation for a var
 */
module.exports = ['babelfish', function(babelfish) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.append(babelfish.get(attr.i18nBindLang || babelfish.current() )[attr.i18nBind]);
        }
    }

}];