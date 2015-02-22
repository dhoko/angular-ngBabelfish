angular.module('ngBabelfish')
  .service('babelfish', function ($rootScope, marvin, marvinMemory) {

    'use strict';

    var model = marvinMemory.get();

    $rootScope.$on('ngBabelfish.lang:loaded', function() {
      console.log('Lang is loaded')
    });

    /**
     * Return the current state translation
     * @param  {String} lang
     * @return {Object}
     */
    function get(lang) {

      var currentLang = model.data[lang || model.lang.current] || {},
          common = {};

      if(marvin.isSolo()) {
        return angular.extend({}, model.data._common || {}, currentLang);
      }


      if(!currentLang[model.state.current]) {

        if(marvin.isVerbose()) {
          console.warn('[ngBabelfish-translator@get] No translation available for the page %s for the  lang %s',model.state.current, (lang || model.lang.current));
        }
        currentLang[model.state.current] = {};
      }

      angular.extend(common, {}, currentLang._common);
      return angular.extend(common, currentLang[model.state.current]);
    }

    /**
     * Get all translations available for a lang
     * @param  {String} lang
     * @return {Object}
     */
    function all(lang) {

      var langId = lang || model.lang.current;

      if(marvin.isSolo()) {
        return angular.extend({}, model.data._common || {}, model.data[langId] || {});
      }

      return model.data[langId];
    }

    /**
     * Return each translations available for your app
     * @return {Object}
     */
    function translations() {
      return model.data;
    }

    /**
     * Check if you already load this lang
     * @param  {String}  lang
     * @return {Boolean}
     */
    function isLangLoaded(lang) {
        return !!model.data[lang];
    }

    /**
     * Get the current Language
     * @return {String} lang
     */
    function current() {
      return model.lang.current;
    }

    /**
     * Check if we have loaded i18n
     * @return {Boolean}
     */
    function isLoaded() {
      return model.active;
    }

    /**
     * List each language available in babelfish
     * With the solo mode you can use a key _comom to share between each lang a trad. So we cannot return it.
     * @return {Array}
     */
    function getLanguages() {
      if(model.available.indexOf('_comon') > -1) {
        model.available.splice(model.available.indexOf('_comon'),1);
      }
      return model.available;
    }


    return {
      get: get,
      all: all,
      current: current,
      translations: translations,
      languages: getLanguages,
      isLangLoaded: isLangLoaded,
      isLoaded: isLoaded
    };
  });