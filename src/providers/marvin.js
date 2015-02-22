angular.module('ngBabelfish')
  .provider('marvin', function() {

    'use strict';

    /**
     * Default configuration for the module
     * @type {Object}
     */
    var config = {
        state: 'home',
        lang: 'en-EN',
        url: '/i18n/languages.json',
        routeEventName: '$stateChangeSuccess',
        namespace: 'i18n',
        lazy: false,
        lazyConfig: [],
        current: '',
        log: true
    };

    /**
     * Configure the service with a provider from the config of your module
     * @param  {Object} params Configuration object
     * @return {void}
     */
    this.init = function initBabelfishConfig(params) {
      angular.extend(config, params);
    };

    /**
     * Add each language for your application
     * @param  {Object} opt {lang: "",url: ""}
     * @return {babelfishProvider}
     */
    this.lang = function lang(opt) {

      if(!opt.lang) {
        throw new Error('[babelfishProvider@lang] You must set the key lang');
      }

      if(!opt.url) {
        throw new Error('[babelfishProvider@lang] You must set the key url');
      }

      config.lazy = true;
      config.lazyConfig.push(opt);
      return this;
    };

    /**
     * Marvin service
     */
    this.$get = function($document) {
      return {

        /**
         * Return babelfish configuration
         * @return {Object}
         */
        getConfig: function getConfig() {
          return config;
        },

        /**
         * Return the default event name in order to listen a new state||route
         * @return {String}
         */
        getRouteEvent: function getRouteEvent() {
          return config.routeEventName;
        },

        /**
         * Get the namespace of the application
         * @return {String}
         */
        getNamespace: function getNamespace() {
          return config.namespace;
        },

        /**
         * Get the lang for your app.
         * - You can use the provider
         * - You can use html default attr
         * @return {String}
         */
        getDefaultLang: function getDefaultLang() {

          if(config.lang) {
            $document.documentElement.lang = config.lang.split('-')[0];
            return config.lang;
          }

          return $document.documentElement.lang + '-' + $document.documentElement.lang.toUpperCase();
        },

        getLazyLangAvailable: function getLazyLangAvailable() {
          return config.lazyConfig.map(function (item) {
            return item.lang;
          });
        },

        /**
         * Get the lazy configuration for any lang
         * - Default is the config lang
         * @param  {String} langKey
         * @return {Objet}
         */
        getLazyConfig: function getLazyConfig(langKey) {

          var langToFind = langKey || this.getDefaultLang();
          return config.lazyConfig.filter(function (o) {
            return o.lang === langToFind;
          })[0] || {};
        },

        getLazyConfigByUrl: function getLazyConfigByUrl(url) {
          return config.lazyConfig.filter(function (o) {
            return o === url;
          })[0];
        },

        isVerbose: function isVerbose() {
          return config.log;
        },

        /**
         * Should we use the lazy mode for the application
         * @return {Boolean}
         */
        isLazy: function isLazy() {
          return config.lazy;
        },

        isSolo: function isSolo() {
          console.log('[@todo] Need to implement solo mode');
          return false;
        }
      };
    };

  });
