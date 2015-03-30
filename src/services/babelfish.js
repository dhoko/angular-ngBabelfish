angular.module('ngBabelfish')
  .service('babelfish', function (marvin, marvinMemory, babelfishLang, marvinTasks, babelfishEvent) {

    'use strict';

    var model = marvinMemory.get();

    /**
     * Return the current state translation
     * @param  {String} lang
     * @return {Object}
     */
    function get(lang) {

      var currentLang = model.data[lang || model.lang.current] || {},
          common = {};

      if(!currentLang[model.state.current]) {

        if(marvin.isVerbose()) {
          console.warn('[ngBabelfish.babelfish@get] No translation available for the page %s for the lang %s',model.state.current, (lang || model.lang.current));
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
      return model.data[lang || model.lang.current];
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
      return !!model.data && !!model.data[lang];
    }

    /**
     * Get the current Language
     * @return {String} lang
     */
    function current() {
      return model.lang.current;
    }

    /**
     * List each language available in babelfish
     * @return {Array}
     */
    function getLanguages() {

      if(model.available.indexOf('_common') > -1) {
        model.available.splice(model.available.indexOf('_common'),1);
      }
      return model.available;
    }

    /**
     * Change the current language
     * @param  {String} lang
     * @return {void}
     */
    function updateLang(lang) {
      babelfishLang.set(lang, marvinTasks.bindToScope);
    }

    return {
      get: get,
      all: all,
      current: current,
      translations: translations,
      languages: getLanguages,
      isLangLoaded: isLangLoaded,
      updateLang: updateLang,
      on: babelfishEvent.set
    };
  });
