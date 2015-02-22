angular.module('ngBabelfish', [])
  .run(['$rootScope', 'marvin', 'babelfishLang', function ($rootScope, marvin, babelfishLang) {
    // Update the translation when you change a page
    $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
      babelfishLang.init(toState.name);
    });
  }]);

angular.module('ngBabelfish')
  .directive('i18nBind', ['$rootScope', 'marvin', 'babelfish', function ($rootScope, marvin, babelfish) {

    return {
      scope: {
        translationKey: '=i18nBind',
        translationLang: '@i18nBindLang'
      },
      template: '{{translationKey}}',
      link: function(scope, el, attr) {

        var key = '',
            namespace = marvin.getNamespace();

        key = (namespace) ? attr.i18nBind.replace(namespace + '.', '') : attr.i18nBind;

        // Because it breaks if you update translationKey...
        if(attr.i18nBindLang) {

          if(babelfish.isLangLoaded(attr.i18nBindLang)) {
            var translation = babelfish.get(attr.i18nBindLang);
            return el.text(translation[key]);
          }

          /**
           * @todo Remove event listener, too many listeners !
           */
          $rootScope.$on('ngBabelfish.lang:loaded', function (e, data) {
            if(babelfish.isLangLoaded(attr.i18nBindLang)) {
              var translation = babelfish.get(attr.i18nBindLang);
              el.text(translation[key]);
            }
          });
        }
      }
    }
  }]);
angular.module('ngBabelfish')
  .directive('i18nLoad', ['babelfish', function (babelfish) {

    return {
      link: function(scope, el, attr) {
        el.on('click',function() {
          scope.$apply(function() {
            babelfish.updateLang(attr.i18nLoad);
          });

        });
      }
    }
  }]);
angular.module('ngBabelfish')
  .factory('marvinMemory', function() {

    'use strict';

    var memory = {
      state: {
        current: '',
        loaded: false
      },
      lang: {
        previous: 'en-EN',
        current: 'en-EN'
      },
      data: null,
      available: [],
      active: false
    };

    return {
      get: function() {
        return memory;
      }
    };
  });
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
    this.$get = ['$document', function($document) {
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
    }];

  });

angular.module('ngBabelfish')
  .service('babelfish', ['$rootScope', 'marvin', 'marvinMemory', 'babelfishLang', 'marvinTasks', function ($rootScope, marvin, marvinMemory, babelfishLang, marvinTasks) {

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
        return model.data && !!model.data[lang];
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
      isLoaded: isLoaded,
      updateLang: updateLang
    };
  }]);
angular.module('ngBabelfish')
  .service('babelfishLang', ['$http', '$rootScope', 'marvin', 'marvinMemory', 'marvinTasks', function ($http, $rootScope, marvin, marvinMemory, marvinTasks) {

    'use strict';

    var model = marvinMemory.get();

    $rootScope.$on('ngBabelfish.marvin:requestTranslation', function (e, data) {
      init(data.state, data.url);
    });

    function init(stateName, url) {
      model.state.current = stateName;
      load().then(marvinTasks.bindToScope);
    }

    function setLanguage(lang, cb) {
      cb = cb || angular.noop;
      model.lang.previous = angular.copy(model.lang.current);
      model.lang.current = lang;
      $rootScope.$emit('ngBabelfish.lang:setLanguage', model.current);
      cb();
    }

    function load(url) {

      var lang = model.lang.current;
      url = url || marvin.getConfig().url;

      if(marvin.isLazy()) {
        url = marvin.getLazyConfig(model.lang.current || marvin.getConfig().lang).url;
      }

      return $http
        .get(url)
        .error(function() {
          if(marvin.isVerbose()) {
            throw new Error('[babelfishLangr@load] Cannot load the translation file');
          }
        })
        .success(translate);
    }

    function translate(data) {
      var lang = model.lang.current;

      if(marvin.isLazy()) {
        model.data = {};
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

  }]);
angular.module('ngBabelfish')
  .service('marvinTasks', ['$rootScope', 'marvin', 'marvinMemory', function ($rootScope, marvin, marvinMemory) {

    'use strict';

    var model = marvinMemory.get();

    function bindToScope() {

      var lang = model.lang.current;

      // We do not want to have multiple reload if the lang is already present
      if(marvin.isLazy() && !model.data[lang]) {
        $rootScope.$emit('ngBabelfish.marvin:requestTranslation', {
          state: model.state.current,
          url: marvin.getLazyConfig(lang).url
        });
        return;
      }

      setTranslation();
    }

    function setTranslation() {
      var lang = model.lang.current;
      var state = model.state.current,
          stateI18n,
          translation = {};

      // Prevent too many reload
      if(state === model.state.previous && model.lang.current === model.lang.previous) {
        return;
      }

      if(!model.data[lang]) {
        return;
      }

      stateI18n = model.data[lang][state];

      /**
       * Prevent the error
       *     > TypeError: Cannot read property '$$hashKey' of undefined
       * cf {@link https://github.com/dhoko/ngBabelfish/issues/5}
       */
      if(!stateI18n) {
        model.data[lang][state] = {};

        if(marvin.isVerbose()) {
          console.warn('[marvinTasks@setTranslation] No translation available for the page %s for the lang %s',state, lang);
        }
      }

      angular.extend(
        translation,
        angular.extend({}, model.data[lang]._common),
        stateI18n
      );

      if(marvin.getNamespace()) {
        $rootScope[marvin.getNamespace()] = translation;
      }else {
        angular.extend($rootScope, translation);

        if(marvin.isVerbose()) {
          console.warn('[marvinTasks@setTranslation] It is better to Load i18n inside a namespace.');
        }
      }

      $rootScope.$emit('ngBabelfish.translation:loaded', {
        currentState: state,
        lang: lang
      });

    }
    this.bindToScope = bindToScope;
  }]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvbWFydmluTWVtb3J5LmpzIiwicHJvdmlkZXJzL21hcnZpbi5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaC5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaExhbmcuanMiLCJzZXJ2aWNlcy9tYXJ2aW5UYXNrcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcsIFtdKVxuICAucnVuKFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnYmFiZWxmaXNoTGFuZycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIGJhYmVsZmlzaExhbmcpIHtcbiAgICAvLyBVcGRhdGUgdGhlIHRyYW5zbGF0aW9uIHdoZW4geW91IGNoYW5nZSBhIHBhZ2VcbiAgICAkcm9vdFNjb3BlLiRvbihtYXJ2aW4uZ2V0Um91dGVFdmVudCgpLCBmdW5jdGlvbiAoZSwgdG9TdGF0ZSkge1xuICAgICAgYmFiZWxmaXNoTGFuZy5pbml0KHRvU3RhdGUubmFtZSk7XG4gICAgfSk7XG4gIH1dKTtcbiIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpXG4gIC5kaXJlY3RpdmUoJ2kxOG5CaW5kJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdiYWJlbGZpc2gnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2gpIHtcblxuICAgIHJldHVybiB7XG4gICAgICBzY29wZToge1xuICAgICAgICB0cmFuc2xhdGlvbktleTogJz1pMThuQmluZCcsXG4gICAgICAgIHRyYW5zbGF0aW9uTGFuZzogJ0BpMThuQmluZExhbmcnXG4gICAgICB9LFxuICAgICAgdGVtcGxhdGU6ICd7e3RyYW5zbGF0aW9uS2V5fX0nLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsLCBhdHRyKSB7XG5cbiAgICAgICAgdmFyIGtleSA9ICcnLFxuICAgICAgICAgICAgbmFtZXNwYWNlID0gbWFydmluLmdldE5hbWVzcGFjZSgpO1xuXG4gICAgICAgIGtleSA9IChuYW1lc3BhY2UpID8gYXR0ci5pMThuQmluZC5yZXBsYWNlKG5hbWVzcGFjZSArICcuJywgJycpIDogYXR0ci5pMThuQmluZDtcblxuICAgICAgICAvLyBCZWNhdXNlIGl0IGJyZWFrcyBpZiB5b3UgdXBkYXRlIHRyYW5zbGF0aW9uS2V5Li4uXG4gICAgICAgIGlmKGF0dHIuaTE4bkJpbmRMYW5nKSB7XG5cbiAgICAgICAgICBpZihiYWJlbGZpc2guaXNMYW5nTG9hZGVkKGF0dHIuaTE4bkJpbmRMYW5nKSkge1xuICAgICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChhdHRyLmkxOG5CaW5kTGFuZyk7XG4gICAgICAgICAgICByZXR1cm4gZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBAdG9kbyBSZW1vdmUgZXZlbnQgbGlzdGVuZXIsIHRvbyBtYW55IGxpc3RlbmVycyAhXG4gICAgICAgICAgICovXG4gICAgICAgICAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLmxhbmc6bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmKGJhYmVsZmlzaC5pc0xhbmdMb2FkZWQoYXR0ci5pMThuQmluZExhbmcpKSB7XG4gICAgICAgICAgICAgIHZhciB0cmFuc2xhdGlvbiA9IGJhYmVsZmlzaC5nZXQoYXR0ci5pMThuQmluZExhbmcpO1xuICAgICAgICAgICAgICBlbC50ZXh0KHRyYW5zbGF0aW9uW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLmRpcmVjdGl2ZSgnaTE4bkxvYWQnLCBbJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uIChiYWJlbGZpc2gpIHtcblxuICAgIHJldHVybiB7XG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWwsIGF0dHIpIHtcbiAgICAgICAgZWwub24oJ2NsaWNrJyxmdW5jdGlvbigpIHtcbiAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBiYWJlbGZpc2gudXBkYXRlTGFuZyhhdHRyLmkxOG5Mb2FkKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKVxuICAuZmFjdG9yeSgnbWFydmluTWVtb3J5JywgZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbWVtb3J5ID0ge1xuICAgICAgc3RhdGU6IHtcbiAgICAgICAgY3VycmVudDogJycsXG4gICAgICAgIGxvYWRlZDogZmFsc2VcbiAgICAgIH0sXG4gICAgICBsYW5nOiB7XG4gICAgICAgIHByZXZpb3VzOiAnZW4tRU4nLFxuICAgICAgICBjdXJyZW50OiAnZW4tRU4nXG4gICAgICB9LFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGF2YWlsYWJsZTogW10sXG4gICAgICBhY3RpdmU6IGZhbHNlXG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbWVtb3J5O1xuICAgICAgfVxuICAgIH07XG4gIH0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpXG4gIC5wcm92aWRlcignbWFydmluJywgZnVuY3Rpb24oKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvKipcbiAgICAgKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBtb2R1bGVcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqL1xuICAgIHZhciBjb25maWcgPSB7XG4gICAgICAgIHN0YXRlOiAnaG9tZScsXG4gICAgICAgIGxhbmc6ICdlbi1FTicsXG4gICAgICAgIHVybDogJy9pMThuL2xhbmd1YWdlcy5qc29uJyxcbiAgICAgICAgcm91dGVFdmVudE5hbWU6ICckc3RhdGVDaGFuZ2VTdWNjZXNzJyxcbiAgICAgICAgbmFtZXNwYWNlOiAnaTE4bicsXG4gICAgICAgIGxhenk6IGZhbHNlLFxuICAgICAgICBsYXp5Q29uZmlnOiBbXSxcbiAgICAgICAgY3VycmVudDogJycsXG4gICAgICAgIGxvZzogdHJ1ZVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDb25maWd1cmUgdGhlIHNlcnZpY2Ugd2l0aCBhIHByb3ZpZGVyIGZyb20gdGhlIGNvbmZpZyBvZiB5b3VyIG1vZHVsZVxuICAgICAqIEBwYXJhbSAge09iamVjdH0gcGFyYW1zIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAgICogQHJldHVybiB7dm9pZH1cbiAgICAgKi9cbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiBpbml0QmFiZWxmaXNoQ29uZmlnKHBhcmFtcykge1xuICAgICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBwYXJhbXMpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBZGQgZWFjaCBsYW5ndWFnZSBmb3IgeW91ciBhcHBsaWNhdGlvblxuICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0IHtsYW5nOiBcIlwiLHVybDogXCJcIn1cbiAgICAgKiBAcmV0dXJuIHtiYWJlbGZpc2hQcm92aWRlcn1cbiAgICAgKi9cbiAgICB0aGlzLmxhbmcgPSBmdW5jdGlvbiBsYW5nKG9wdCkge1xuXG4gICAgICBpZighb3B0LmxhbmcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbYmFiZWxmaXNoUHJvdmlkZXJAbGFuZ10gWW91IG11c3Qgc2V0IHRoZSBrZXkgbGFuZycpO1xuICAgICAgfVxuXG4gICAgICBpZighb3B0LnVybCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tiYWJlbGZpc2hQcm92aWRlckBsYW5nXSBZb3UgbXVzdCBzZXQgdGhlIGtleSB1cmwnKTtcbiAgICAgIH1cblxuICAgICAgY29uZmlnLmxhenkgPSB0cnVlO1xuICAgICAgY29uZmlnLmxhenlDb25maWcucHVzaChvcHQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIE1hcnZpbiBzZXJ2aWNlXG4gICAgICovXG4gICAgdGhpcy4kZ2V0ID0gWyckZG9jdW1lbnQnLCBmdW5jdGlvbigkZG9jdW1lbnQpIHtcbiAgICAgIHJldHVybiB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybiBiYWJlbGZpc2ggY29uZmlndXJhdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBnZXRDb25maWc6IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gdGhlIGRlZmF1bHQgZXZlbnQgbmFtZSBpbiBvcmRlciB0byBsaXN0ZW4gYSBuZXcgc3RhdGV8fHJvdXRlXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdldFJvdXRlRXZlbnQ6IGZ1bmN0aW9uIGdldFJvdXRlRXZlbnQoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5yb3V0ZUV2ZW50TmFtZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBuYW1lc3BhY2Ugb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdldE5hbWVzcGFjZTogZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKCkge1xuICAgICAgICAgIHJldHVybiBjb25maWcubmFtZXNwYWNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGxhbmcgZm9yIHlvdXIgYXBwLlxuICAgICAgICAgKiAtIFlvdSBjYW4gdXNlIHRoZSBwcm92aWRlclxuICAgICAgICAgKiAtIFlvdSBjYW4gdXNlIGh0bWwgZGVmYXVsdCBhdHRyXG4gICAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdldERlZmF1bHRMYW5nOiBmdW5jdGlvbiBnZXREZWZhdWx0TGFuZygpIHtcblxuICAgICAgICAgIGlmKGNvbmZpZy5sYW5nKSB7XG4gICAgICAgICAgICAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcgPSBjb25maWcubGFuZy5zcGxpdCgnLScpWzBdO1xuICAgICAgICAgICAgcmV0dXJuIGNvbmZpZy5sYW5nO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcgKyAnLScgKyAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRMYXp5TGFuZ0F2YWlsYWJsZTogZnVuY3Rpb24gZ2V0TGF6eUxhbmdBdmFpbGFibGUoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW0ubGFuZztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBsYXp5IGNvbmZpZ3VyYXRpb24gZm9yIGFueSBsYW5nXG4gICAgICAgICAqIC0gRGVmYXVsdCBpcyB0aGUgY29uZmlnIGxhbmdcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nS2V5XG4gICAgICAgICAqIEByZXR1cm4ge09iamV0fVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0TGF6eUNvbmZpZzogZnVuY3Rpb24gZ2V0TGF6eUNvbmZpZyhsYW5nS2V5KSB7XG5cbiAgICAgICAgICB2YXIgbGFuZ1RvRmluZCA9IGxhbmdLZXkgfHwgdGhpcy5nZXREZWZhdWx0TGFuZygpO1xuICAgICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgIHJldHVybiBvLmxhbmcgPT09IGxhbmdUb0ZpbmQ7XG4gICAgICAgICAgfSlbMF0gfHwge307XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TGF6eUNvbmZpZ0J5VXJsOiBmdW5jdGlvbiBnZXRMYXp5Q29uZmlnQnlVcmwodXJsKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLmZpbHRlcihmdW5jdGlvbiAobykge1xuICAgICAgICAgICAgcmV0dXJuIG8gPT09IHVybDtcbiAgICAgICAgICB9KVswXTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1ZlcmJvc2U6IGZ1bmN0aW9uIGlzVmVyYm9zZSgpIHtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLmxvZztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2hvdWxkIHdlIHVzZSB0aGUgbGF6eSBtb2RlIGZvciB0aGUgYXBwbGljYXRpb25cbiAgICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGlzTGF6eTogZnVuY3Rpb24gaXNMYXp5KCkge1xuICAgICAgICAgIHJldHVybiBjb25maWcubGF6eTtcbiAgICAgICAgfSxcblxuICAgICAgICBpc1NvbG86IGZ1bmN0aW9uIGlzU29sbygpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnW0B0b2RvXSBOZWVkIHRvIGltcGxlbWVudCBzb2xvIG1vZGUnKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfV07XG5cbiAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKVxuICAuc2VydmljZSgnYmFiZWxmaXNoJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCAnYmFiZWxmaXNoTGFuZycsICdtYXJ2aW5UYXNrcycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIG1hcnZpbk1lbW9yeSwgYmFiZWxmaXNoTGFuZywgbWFydmluVGFza3MpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAgIC8qKlxuICAgICAqIFJldHVybiB0aGUgY3VycmVudCBzdGF0ZSB0cmFuc2xhdGlvblxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXQobGFuZykge1xuXG4gICAgICB2YXIgY3VycmVudExhbmcgPSBtb2RlbC5kYXRhW2xhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50XSB8fCB7fSxcbiAgICAgICAgICBjb21tb24gPSB7fTtcblxuICAgICAgaWYobWFydmluLmlzU29sbygpKSB7XG4gICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZCh7fSwgbW9kZWwuZGF0YS5fY29tbW9uIHx8IHt9LCBjdXJyZW50TGFuZyk7XG4gICAgICB9XG5cblxuICAgICAgaWYoIWN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdKSB7XG5cbiAgICAgICAgaWYobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbbmdCYWJlbGZpc2gtdHJhbnNsYXRvckBnZXRdIE5vIHRyYW5zbGF0aW9uIGF2YWlsYWJsZSBmb3IgdGhlIHBhZ2UgJXMgZm9yIHRoZSAgbGFuZyAlcycsbW9kZWwuc3RhdGUuY3VycmVudCwgKGxhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50KSk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0gPSB7fTtcbiAgICAgIH1cblxuICAgICAgYW5ndWxhci5leHRlbmQoY29tbW9uLCB7fSwgY3VycmVudExhbmcuX2NvbW1vbik7XG4gICAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoY29tbW9uLCBjdXJyZW50TGFuZ1ttb2RlbC5zdGF0ZS5jdXJyZW50XSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCB0cmFuc2xhdGlvbnMgYXZhaWxhYmxlIGZvciBhIGxhbmdcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG4gICAgZnVuY3Rpb24gYWxsKGxhbmcpIHtcblxuICAgICAgdmFyIGxhbmdJZCA9IGxhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgICBpZihtYXJ2aW4uaXNTb2xvKCkpIHtcbiAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKHt9LCBtb2RlbC5kYXRhLl9jb21tb24gfHwge30sIG1vZGVsLmRhdGFbbGFuZ0lkXSB8fCB7fSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtb2RlbC5kYXRhW2xhbmdJZF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGVhY2ggdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgeW91ciBhcHBcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG4gICAgZnVuY3Rpb24gdHJhbnNsYXRpb25zKCkge1xuICAgICAgcmV0dXJuIG1vZGVsLmRhdGE7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgeW91IGFscmVhZHkgbG9hZCB0aGlzIGxhbmdcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9ICBsYW5nXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0xhbmdMb2FkZWQobGFuZykge1xuICAgICAgICByZXR1cm4gbW9kZWwuZGF0YSAmJiAhIW1vZGVsLmRhdGFbbGFuZ107XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IHRoZSBjdXJyZW50IExhbmd1YWdlXG4gICAgICogQHJldHVybiB7U3RyaW5nfSBsYW5nXG4gICAgICovXG4gICAgZnVuY3Rpb24gY3VycmVudCgpIHtcbiAgICAgIHJldHVybiBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ2hlY2sgaWYgd2UgaGF2ZSBsb2FkZWQgaTE4blxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNMb2FkZWQoKSB7XG4gICAgICByZXR1cm4gbW9kZWwuYWN0aXZlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIExpc3QgZWFjaCBsYW5ndWFnZSBhdmFpbGFibGUgaW4gYmFiZWxmaXNoXG4gICAgICogV2l0aCB0aGUgc29sbyBtb2RlIHlvdSBjYW4gdXNlIGEga2V5IF9jb21vbSB0byBzaGFyZSBiZXR3ZWVuIGVhY2ggbGFuZyBhIHRyYWQuIFNvIHdlIGNhbm5vdCByZXR1cm4gaXQuXG4gICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VzKCkge1xuICAgICAgaWYobW9kZWwuYXZhaWxhYmxlLmluZGV4T2YoJ19jb21vbicpID4gLTEpIHtcbiAgICAgICAgbW9kZWwuYXZhaWxhYmxlLnNwbGljZShtb2RlbC5hdmFpbGFibGUuaW5kZXhPZignX2NvbW9uJyksMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbW9kZWwuYXZhaWxhYmxlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUxhbmcobGFuZykge1xuICAgICAgYmFiZWxmaXNoTGFuZy5zZXQobGFuZywgbWFydmluVGFza3MuYmluZFRvU2NvcGUpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBnZXQ6IGdldCxcbiAgICAgIGFsbDogYWxsLFxuICAgICAgY3VycmVudDogY3VycmVudCxcbiAgICAgIHRyYW5zbGF0aW9uczogdHJhbnNsYXRpb25zLFxuICAgICAgbGFuZ3VhZ2VzOiBnZXRMYW5ndWFnZXMsXG4gICAgICBpc0xhbmdMb2FkZWQ6IGlzTGFuZ0xvYWRlZCxcbiAgICAgIGlzTG9hZGVkOiBpc0xvYWRlZCxcbiAgICAgIHVwZGF0ZUxhbmc6IHVwZGF0ZUxhbmdcbiAgICB9O1xuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLnNlcnZpY2UoJ2JhYmVsZmlzaExhbmcnLCBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdtYXJ2aW5UYXNrcycsIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnksIG1hcnZpblRhc2tzKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG4gICAgICBpbml0KGRhdGEuc3RhdGUsIGRhdGEudXJsKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGluaXQoc3RhdGVOYW1lLCB1cmwpIHtcbiAgICAgIG1vZGVsLnN0YXRlLmN1cnJlbnQgPSBzdGF0ZU5hbWU7XG4gICAgICBsb2FkKCkudGhlbihtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0TGFuZ3VhZ2UobGFuZywgY2IpIHtcbiAgICAgIGNiID0gY2IgfHwgYW5ndWxhci5ub29wO1xuICAgICAgbW9kZWwubGFuZy5wcmV2aW91cyA9IGFuZ3VsYXIuY29weShtb2RlbC5sYW5nLmN1cnJlbnQpO1xuICAgICAgbW9kZWwubGFuZy5jdXJyZW50ID0gbGFuZztcbiAgICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLmxhbmc6c2V0TGFuZ3VhZ2UnLCBtb2RlbC5jdXJyZW50KTtcbiAgICAgIGNiKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZCh1cmwpIHtcblxuICAgICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgICB1cmwgPSB1cmwgfHwgbWFydmluLmdldENvbmZpZygpLnVybDtcblxuICAgICAgaWYobWFydmluLmlzTGF6eSgpKSB7XG4gICAgICAgIHVybCA9IG1hcnZpbi5nZXRMYXp5Q29uZmlnKG1vZGVsLmxhbmcuY3VycmVudCB8fCBtYXJ2aW4uZ2V0Q29uZmlnKCkubGFuZykudXJsO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJGh0dHBcbiAgICAgICAgLmdldCh1cmwpXG4gICAgICAgIC5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZihtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaExhbmdyQGxvYWRdIENhbm5vdCBsb2FkIHRoZSB0cmFuc2xhdGlvbiBmaWxlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuc3VjY2Vzcyh0cmFuc2xhdGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYW5zbGF0ZShkYXRhKSB7XG4gICAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgICAgaWYobWFydmluLmlzTGF6eSgpKSB7XG4gICAgICAgIG1vZGVsLmRhdGEgPSB7fTtcbiAgICAgICAgbW9kZWwuZGF0YVtsYW5nXSA9IGRhdGE7XG5cbiAgICAgICAgaWYoLTEgPT09IG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKGxhbmcpKSB7XG4gICAgICAgICAgbW9kZWwuYXZhaWxhYmxlLnB1c2gobGFuZyk7XG4gICAgICAgIH1cblxuICAgICAgfWVsc2Uge1xuICAgICAgICBtb2RlbC5kYXRhID0gZGF0YTtcbiAgICAgICAgbW9kZWwuYXZhaWxhYmxlID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgICB9XG5cbiAgICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLmxhbmc6bG9hZGVkJywge1xuICAgICAgICBsYW5nOiBsYW5nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXQgPSBpbml0O1xuICAgIHRoaXMubG9hZCA9IGxvYWQ7XG4gICAgdGhpcy50cmFuc2xhdGUgPSB0cmFuc2xhdGU7XG4gICAgdGhpcy5zZXQgPSBzZXRMYW5ndWFnZTtcblxuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLnNlcnZpY2UoJ21hcnZpblRhc2tzJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnkpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAgIGZ1bmN0aW9uIGJpbmRUb1Njb3BlKCkge1xuXG4gICAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgICAgLy8gV2UgZG8gbm90IHdhbnQgdG8gaGF2ZSBtdWx0aXBsZSByZWxvYWQgaWYgdGhlIGxhbmcgaXMgYWxyZWFkeSBwcmVzZW50XG4gICAgICBpZihtYXJ2aW4uaXNMYXp5KCkgJiYgIW1vZGVsLmRhdGFbbGFuZ10pIHtcbiAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIHtcbiAgICAgICAgICBzdGF0ZTogbW9kZWwuc3RhdGUuY3VycmVudCxcbiAgICAgICAgICB1cmw6IG1hcnZpbi5nZXRMYXp5Q29uZmlnKGxhbmcpLnVybFxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzZXRUcmFuc2xhdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKCkge1xuICAgICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgICB2YXIgc3RhdGUgPSBtb2RlbC5zdGF0ZS5jdXJyZW50LFxuICAgICAgICAgIHN0YXRlSTE4bixcbiAgICAgICAgICB0cmFuc2xhdGlvbiA9IHt9O1xuXG4gICAgICAvLyBQcmV2ZW50IHRvbyBtYW55IHJlbG9hZFxuICAgICAgaWYoc3RhdGUgPT09IG1vZGVsLnN0YXRlLnByZXZpb3VzICYmIG1vZGVsLmxhbmcuY3VycmVudCA9PT0gbW9kZWwubGFuZy5wcmV2aW91cykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmKCFtb2RlbC5kYXRhW2xhbmddKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgc3RhdGVJMThuID0gbW9kZWwuZGF0YVtsYW5nXVtzdGF0ZV07XG5cbiAgICAgIC8qKlxuICAgICAgICogUHJldmVudCB0aGUgZXJyb3JcbiAgICAgICAqICAgICA+IFR5cGVFcnJvcjogQ2Fubm90IHJlYWQgcHJvcGVydHkgJyQkaGFzaEtleScgb2YgdW5kZWZpbmVkXG4gICAgICAgKiBjZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Rob2tvL25nQmFiZWxmaXNoL2lzc3Vlcy81fVxuICAgICAgICovXG4gICAgICBpZighc3RhdGVJMThuKSB7XG4gICAgICAgIG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdID0ge307XG5cbiAgICAgICAgaWYobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbbWFydmluVGFza3NAc2V0VHJhbnNsYXRpb25dIE5vIHRyYW5zbGF0aW9uIGF2YWlsYWJsZSBmb3IgdGhlIHBhZ2UgJXMgZm9yIHRoZSBsYW5nICVzJyxzdGF0ZSwgbGFuZyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYW5ndWxhci5leHRlbmQoXG4gICAgICAgIHRyYW5zbGF0aW9uLFxuICAgICAgICBhbmd1bGFyLmV4dGVuZCh7fSwgbW9kZWwuZGF0YVtsYW5nXS5fY29tbW9uKSxcbiAgICAgICAgc3RhdGVJMThuXG4gICAgICApO1xuXG4gICAgICBpZihtYXJ2aW4uZ2V0TmFtZXNwYWNlKCkpIHtcbiAgICAgICAgJHJvb3RTY29wZVttYXJ2aW4uZ2V0TmFtZXNwYWNlKCldID0gdHJhbnNsYXRpb247XG4gICAgICB9ZWxzZSB7XG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKCRyb290U2NvcGUsIHRyYW5zbGF0aW9uKTtcblxuICAgICAgICBpZihtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1ttYXJ2aW5UYXNrc0BzZXRUcmFuc2xhdGlvbl0gSXQgaXMgYmV0dGVyIHRvIExvYWQgaTE4biBpbnNpZGUgYSBuYW1lc3BhY2UuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywge1xuICAgICAgICBjdXJyZW50U3RhdGU6IHN0YXRlLFxuICAgICAgICBsYW5nOiBsYW5nXG4gICAgICB9KTtcblxuICAgIH1cbiAgICB0aGlzLmJpbmRUb1Njb3BlID0gYmluZFRvU2NvcGU7XG4gIH1dKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=