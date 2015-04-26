angular.module('ngBabelfish')
  .service('babelfishLang', function ($http, $rootScope, marvin, marvinMemory, marvinTasks) {

    'use strict';

    var model = marvinMemory.get();

    $rootScope.$on('ngBabelfish.marvin:requestTranslation', function (e, data) {
      init(data.state, data.url);
    });

    /**
     * Load a translation and attach it to the scope if we can
     * @param  {String} stateName current state
     * @param  {String} url       Url to load
     * @return {void}
     */
    function init(stateName, url) {
      setState(stateName);

      load(url)
        .then(marvin.isBindToScope() ? marvinTasks.bindToScope : angular.noop);
    }

    /**
     * Attach a translation for a state to the scope if we can
     * @param  {String} stateName Current state name
     * @return {void}
     */
    function bindForState(stateName) {
      setState(stateName);

      if(marvin.isBindToScope()) {
        marvinTasks.bindToScope(stateName);
      }
    }

    /**
     * Record the current state
     * @param {String} stateName
     */
    function setState(stateName) {
      model.state.current = stateName;
    }

    /**
     * Change the current language
     * @param {String}   lang current lang
     * @param {Function} cb
     * @event ngBabelfish.lang:setLanguage
     */
    function setLanguage(lang, cb) {

      cb = cb || angular.noop;
      model.lang.previous = angular.copy(model.lang.current);
      model.lang.current = lang;
      $rootScope.$emit('ngBabelfish.lang:setLanguage', model.lang);
      cb();
    }

    /**
     * Load a translation
     * @param  {String} url
     * @param {String} Lang load a custom lang (lazy mode only)
     * @return {q.Promise}
     */
    function load(url, lang) {

      url = url || marvin.getConfig().url;

      if(marvin.isLazy() && !lang) {
        url = marvin.getLazyConfig(model.lang.current || marvin.getConfig().lang).url;
      }

      return $http
        .get(url)
        .error(function() {
          if(marvin.isVerbose()) {
            throw new Error('[ngBabelfish.babelfishLang@load] Cannot load the translation file');
          }
        })
        .success(function (data) {
          translate(data, lang);
        });
    }

    /**
     * Build translations or a language
     * @param  {Object} data
     * @event 'ngBabelfish.lang:loaded'
     * @return {void}
     */
    function translate(data, lang) {

      lang = lang || model.lang.current;

      if(marvin.isLazy()) {
        model.data = model.data || {};
        model.data[lang] = data;

        if(-1 === model.available.indexOf(lang)) {
          model.available.push(lang);
        }

      }else {
        model.data = data;
        model.available = Object.keys(data);
      }
      $rootScope.$emit('ngBabelfish.lang:loaded', {
        lang: lang
      });
    }

    this.init = init;
    this.load = load;
    this.translate = translate;
    this.set = setLanguage;
    this.bindForState = bindForState;
    this.setState = setState;

  });
