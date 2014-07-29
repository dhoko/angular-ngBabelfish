/**
 * i18nBind directive
 * Load a translation for a var
 *
 * If you do not provide any lang (i18n-bind-lang), we will compile the directive, else it will update the textContent.
 *
 * We do not update the translationKey's value because it will change the reference key from i18n-bind. Yup that's weird.
 *
 * Isolate scope FTW
 */
module.exports = ['babelfish', function (babelfish) {

    'use strict';


    return {
        restrict: "A",
        scope: {
            translationKey: "=i18nBind",
            translationLang: "@i18nBindLang"
        },
        template: "{{translationKey}}",

        link: function(scope,el,attr) {

            var key = '',
                namespace = babelfish.getNamespace();

            key = (namespace) ? attr.i18nBind.replace(namespace + '.', '') : attr.i18nBind;

            // Because it breaks if you update translationKey...
            if(attr.i18nBindLang) {

                // if(!babelfish.isLangLoaded(attr.i18nBindLang)) {
                //     babelfish.loadTranslation('fr-FR')
                //         .then(function() {
                //             el.text(babelfish.get(attr.i18nBindLang || babelfish.current())[key]);
                //         });
                // }else{
                    el.text(babelfish.get(attr.i18nBindLang || babelfish.current())[key]);
                // }

            }

        }
    };

}];
