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
        log: true,
        bindToScope: true
    };

    /**
     * Configure the service with a provider from the config of your module
     * @param  {Object} params Configuration object
     * @return {void}
     */
    this.init = function initBabelfishConfig(params) {
      angular.extend(config, params);
      return this;
    };

    /**
     * Add each language for your application
     * @param  {Object} opt {lang: "",url: ""}
     * @return {babelfishProvider}
     */
    this.lang = function lang(opt) {

      if(!opt.lang) {
        throw new Error('[marvinProvider@lang] You must set the key lang');
      }

      if(!opt.url) {
        throw new Error('[marvinProvider@lang] You must set the key url');
      }

      config.lazy = true;
      config.lazyConfig.push(opt);
      return this;
    };

    /**
     * Bind to the scope all translations
     * @default true
     * @param  {Boolean} isBind
     * @return {void}
     */
    this.bindToScope = function bindToScope(isBind) {
      config.bindToScope = isBind;
      return this;
    };

    /**
     * Active verbose mode
     * @default true
     * @param  {Boolean} isVerbose
     * @return {void}
     */
    this.verbose = function verbose(isVerbose) {
      config.log = isVerbose;
      return this;
    };

    /**
     * Set the route event Name to listen to
     * @default $stateChangeSuccess
     * @param  {String} eventName
     * @return {void}
     */
    this.routingEvent = function routingEvent(eventName) {
      config.routeEventName = eventName;
      return this;
    };

    /**
     * Marvin service
     */
    this.$get = function() {
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
            document.documentElement.lang = config.lang.split('-')[0];
            return config.lang;
          }

          return document.documentElement.lang + '-' + document.documentElement.lang.toUpperCase();
        },

        /**
         * List each lang available for lazy mode
         * @return {Array}
         */
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

        /**
         * Find a lazy config by its url
         * @param  {String} url
         * @return {Object}
         */
        getLazyConfigByUrl: function getLazyConfigByUrl(url) {
          return config.lazyConfig.filter(function (o) {
            return o.url === url;
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

        /**
         * Check if we need to bind data to the scope
         * @default true
         * @return {Boolean}
         */
        isBindToScope: function isBindToScope() {
          return config.bindToScope;
        }
      };
    };

  });
