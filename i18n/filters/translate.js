/**
 * transalte filter
 * Translate a string to another language
 * {{ name | translate:'fr-FR':"name"}}
 */
module.exports = ['localize', '$timeout', function (localize, $timeout) {

    return function (input, lang, key) {
        return localize.get(lang)[key];
    }

}];