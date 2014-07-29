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
module.exports = ['translator', function (translator) {

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
                namespace = translator.getNamespace();

            key = (namespace) ? attr.i18nBind.replace(namespace + '.', '') : attr.i18nBind;

            // Because it breaks if you update translationKey...
            if(attr.i18nBindLang) {

                if(!translator.isLangLoaded(attr.i18nBindLang)) {
                    translator.loadTranslation(attr.i18nBindLang)
                        .then(function() {
                            el.text(translator.get(attr.i18nBindLang || translator.current())[key]);
                        });
                }else{
                    el.text(translator.get(attr.i18nBindLang || translator.current())[key]);
                }

            }

        }
    };

}];
