/**
 * transalte filter
 * Translate a string to another language
 * {{ name | translate:'fr-FR':"name"}}
 */
module.exports = ['babelfish', function (babelfish) {

    return function (input, lang, key) {
        return babelfish.get(lang)[key];
    }

}];