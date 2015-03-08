angular.module('ngBabelfish')
  .filter('translate', function (babelfish) {

    'use strict';

    /**
     * transalte filter
     * Translate a string to another language
     * {{ name | translate:'fr-FR':"name"}}
     * @param {String} input Input value to transalte
     * @param {String} lang Lang to translate (optional)
     */
    function filter(input, lang) {
      return babelfish.get(lang)[input];
    }

    filter.$stateful = true;

    return filter;
  });
