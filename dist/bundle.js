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
  .directive('i18nLoad', ['babelfishLang', 'marvinTasks', function (babelfishLang, marvinTasks) {

    return {
      link: function(scope, el, attr) {
        el.on('click',function() {
          scope.$apply(function() {
            babelfishLang.set(attr.i18nLoad);
            marvinTasks.bindToScope();
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
      config.urls.push(opt);
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
          return config.urls.filter(function (o) {
            return o.lang === langToFind;
          })[0] || {};
        },

        getLazyConfigByUrl: function getLazyConfigByUrl(url) {
          return config.urls.filter(function (o) {
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
  .service('babelfish', ['$rootScope', 'marvin', 'marvinMemory', function ($rootScope, marvin, marvinMemory) {

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
  }]);
angular.module('ngBabelfish')
  .service('babelfishLang', ['$http', '$rootScope', 'marvin', 'marvinMemory', 'marvinTasks', function ($http, $rootScope, marvin, marvinMemory, marvinTasks) {

    'use strict';

    var model = marvinMemory.get();

    $rootScope.$on('ngBabelfish.marvin:requestTranslation', function (e, data) {
      init(data);
    });

    function init(stateName, url) {
      model.state.current = stateName;
      load().then(marvinTasks.bindToScope);
    }

    function setLanguage(lang) {
      model.lang.previous = angular.copy(model.lang.current);
      model.lang.current = lang;

      $rootScope.$emit('ngBabelfish.lang:setLanguage', model.current);
    }

    function load(url) {

      var lang = model.lang.current;
      url = url || marvin.getConfig().url;

      if(marvin.isLazy()) {
        url = marvin.getLazyConfig(model.current || marvin.getConfig().lang);
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
        return $rootScope.$emit('ngBabelfish.marvin:requestTranslation', {
          state: model.state.current,
          url: marvin.getLazyConfig(lang).url
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvbWFydmluTWVtb3J5LmpzIiwicHJvdmlkZXJzL21hcnZpbi5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaC5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaExhbmcuanMiLCJzZXJ2aWNlcy9tYXJ2aW5UYXNrcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJywgW10pXG4gIC5ydW4oWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdiYWJlbGZpc2hMYW5nJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgYmFiZWxmaXNoTGFuZykge1xuICAgIC8vIFVwZGF0ZSB0aGUgdHJhbnNsYXRpb24gd2hlbiB5b3UgY2hhbmdlIGEgcGFnZVxuICAgICRyb290U2NvcGUuJG9uKG1hcnZpbi5nZXRSb3V0ZUV2ZW50KCksIGZ1bmN0aW9uIChlLCB0b1N0YXRlKSB7XG4gICAgICBiYWJlbGZpc2hMYW5nLmluaXQodG9TdGF0ZS5uYW1lKTtcbiAgICB9KTtcbiAgfV0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLmRpcmVjdGl2ZSgnaTE4bkJpbmQnLCBbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIGJhYmVsZmlzaCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIHRyYW5zbGF0aW9uS2V5OiAnPWkxOG5CaW5kJyxcbiAgICAgICAgdHJhbnNsYXRpb25MYW5nOiAnQGkxOG5CaW5kTGFuZydcbiAgICAgIH0sXG4gICAgICB0ZW1wbGF0ZTogJ3t7dHJhbnNsYXRpb25LZXl9fScsXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWwsIGF0dHIpIHtcblxuICAgICAgICB2YXIga2V5ID0gJycsXG4gICAgICAgICAgICBuYW1lc3BhY2UgPSBtYXJ2aW4uZ2V0TmFtZXNwYWNlKCk7XG5cbiAgICAgICAga2V5ID0gKG5hbWVzcGFjZSkgPyBhdHRyLmkxOG5CaW5kLnJlcGxhY2UobmFtZXNwYWNlICsgJy4nLCAnJykgOiBhdHRyLmkxOG5CaW5kO1xuXG4gICAgICAgIC8vIEJlY2F1c2UgaXQgYnJlYWtzIGlmIHlvdSB1cGRhdGUgdHJhbnNsYXRpb25LZXkuLi5cbiAgICAgICAgaWYoYXR0ci5pMThuQmluZExhbmcpIHtcbiAgICAgICAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgICAgICAgICAgaWYoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChhdHRyLmkxOG5CaW5kTGFuZykpIHtcbiAgICAgICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChhdHRyLmkxOG5CaW5kTGFuZyk7XG4gICAgICAgICAgICAgIGVsLnRleHQodHJhbnNsYXRpb25ba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKVxuICAuZGlyZWN0aXZlKCdpMThuTG9hZCcsIFsnYmFiZWxmaXNoTGFuZycsICdtYXJ2aW5UYXNrcycsIGZ1bmN0aW9uIChiYWJlbGZpc2hMYW5nLCBtYXJ2aW5UYXNrcykge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCwgYXR0cikge1xuICAgICAgICBlbC5vbignY2xpY2snLGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGJhYmVsZmlzaExhbmcuc2V0KGF0dHIuaTE4bkxvYWQpO1xuICAgICAgICAgICAgbWFydmluVGFza3MuYmluZFRvU2NvcGUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLmZhY3RvcnkoJ21hcnZpbk1lbW9yeScsIGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIG1lbW9yeSA9IHtcbiAgICAgIHN0YXRlOiB7XG4gICAgICAgIGN1cnJlbnQ6ICcnLFxuICAgICAgICBsb2FkZWQ6IGZhbHNlXG4gICAgICB9LFxuICAgICAgbGFuZzoge1xuICAgICAgICBwcmV2aW91czogJ2VuLUVOJyxcbiAgICAgICAgY3VycmVudDogJ2VuLUVOJ1xuICAgICAgfSxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBhdmFpbGFibGU6IFtdLFxuICAgICAgYWN0aXZlOiBmYWxzZVxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG1lbW9yeTtcbiAgICAgIH1cbiAgICB9O1xuICB9KTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKVxuICAucHJvdmlkZXIoJ21hcnZpbicsIGZ1bmN0aW9uKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciB0aGUgbW9kdWxlXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICB2YXIgY29uZmlnID0ge1xuICAgICAgICBzdGF0ZTogJ2hvbWUnLFxuICAgICAgICBsYW5nOiAnZW4tRU4nLFxuICAgICAgICB1cmw6ICcvaTE4bi9sYW5ndWFnZXMuanNvbicsXG4gICAgICAgIHJvdXRlRXZlbnROYW1lOiAnJHN0YXRlQ2hhbmdlU3VjY2VzcycsXG4gICAgICAgIG5hbWVzcGFjZTogJ2kxOG4nLFxuICAgICAgICBsYXp5OiBmYWxzZSxcbiAgICAgICAgbGF6eUNvbmZpZzogW10sXG4gICAgICAgIGN1cnJlbnQ6ICcnLFxuICAgICAgICBsb2c6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQ29uZmlndXJlIHRoZSBzZXJ2aWNlIHdpdGggYSBwcm92aWRlciBmcm9tIHRoZSBjb25maWcgb2YgeW91ciBtb2R1bGVcbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHBhcmFtcyBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgICAqIEByZXR1cm4ge3ZvaWR9XG4gICAgICovXG4gICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gaW5pdEJhYmVsZmlzaENvbmZpZyhwYXJhbXMpIHtcbiAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgcGFyYW1zKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQWRkIGVhY2ggbGFuZ3VhZ2UgZm9yIHlvdXIgYXBwbGljYXRpb25cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdCB7bGFuZzogXCJcIix1cmw6IFwiXCJ9XG4gICAgICogQHJldHVybiB7YmFiZWxmaXNoUHJvdmlkZXJ9XG4gICAgICovXG4gICAgdGhpcy5sYW5nID0gZnVuY3Rpb24gbGFuZyhvcHQpIHtcblxuICAgICAgaWYoIW9wdC5sYW5nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaFByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IGxhbmcnKTtcbiAgICAgIH1cblxuICAgICAgaWYoIW9wdC51cmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbYmFiZWxmaXNoUHJvdmlkZXJAbGFuZ10gWW91IG11c3Qgc2V0IHRoZSBrZXkgdXJsJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbmZpZy5sYXp5ID0gdHJ1ZTtcbiAgICAgIGNvbmZpZy51cmxzLnB1c2gob3B0KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBNYXJ2aW4gc2VydmljZVxuICAgICAqL1xuICAgIHRoaXMuJGdldCA9IFsnJGRvY3VtZW50JywgZnVuY3Rpb24oJGRvY3VtZW50KSB7XG4gICAgICByZXR1cm4ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm4gYmFiZWxmaXNoIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgZ2V0Q29uZmlnOiBmdW5jdGlvbiBnZXRDb25maWcoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJuIHRoZSBkZWZhdWx0IGV2ZW50IG5hbWUgaW4gb3JkZXIgdG8gbGlzdGVuIGEgbmV3IHN0YXRlfHxyb3V0ZVxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBnZXRSb3V0ZUV2ZW50OiBmdW5jdGlvbiBnZXRSb3V0ZUV2ZW50KCkge1xuICAgICAgICAgIHJldHVybiBjb25maWcucm91dGVFdmVudE5hbWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgbmFtZXNwYWNlIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBnZXROYW1lc3BhY2U6IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLm5hbWVzcGFjZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHRoZSBsYW5nIGZvciB5b3VyIGFwcC5cbiAgICAgICAgICogLSBZb3UgY2FuIHVzZSB0aGUgcHJvdmlkZXJcbiAgICAgICAgICogLSBZb3UgY2FuIHVzZSBodG1sIGRlZmF1bHQgYXR0clxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBnZXREZWZhdWx0TGFuZzogZnVuY3Rpb24gZ2V0RGVmYXVsdExhbmcoKSB7XG5cbiAgICAgICAgICBpZihjb25maWcubGFuZykge1xuICAgICAgICAgICAgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nID0gY29uZmlnLmxhbmcuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICAgIHJldHVybiBjb25maWcubGFuZztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nICsgJy0nICsgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TGF6eUxhbmdBdmFpbGFibGU6IGZ1bmN0aW9uIGdldExhenlMYW5nQXZhaWxhYmxlKCkge1xuICAgICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVtLmxhbmc7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCB0aGUgbGF6eSBjb25maWd1cmF0aW9uIGZvciBhbnkgbGFuZ1xuICAgICAgICAgKiAtIERlZmF1bHQgaXMgdGhlIGNvbmZpZyBsYW5nXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ0tleVxuICAgICAgICAgKiBAcmV0dXJuIHtPYmpldH1cbiAgICAgICAgICovXG4gICAgICAgIGdldExhenlDb25maWc6IGZ1bmN0aW9uIGdldExhenlDb25maWcobGFuZ0tleSkge1xuXG4gICAgICAgICAgdmFyIGxhbmdUb0ZpbmQgPSBsYW5nS2V5IHx8IHRoaXMuZ2V0RGVmYXVsdExhbmcoKTtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLnVybHMuZmlsdGVyKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgICByZXR1cm4gby5sYW5nID09PSBsYW5nVG9GaW5kO1xuICAgICAgICAgIH0pWzBdIHx8IHt9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldExhenlDb25maWdCeVVybDogZnVuY3Rpb24gZ2V0TGF6eUNvbmZpZ0J5VXJsKHVybCkge1xuICAgICAgICAgIHJldHVybiBjb25maWcudXJscy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgIHJldHVybiBvID09PSB1cmw7XG4gICAgICAgICAgfSlbMF07XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNWZXJib3NlOiBmdW5jdGlvbiBpc1ZlcmJvc2UoKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5sb2c7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNob3VsZCB3ZSB1c2UgdGhlIGxhenkgbW9kZSBmb3IgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgICAqL1xuICAgICAgICBpc0xhenk6IGZ1bmN0aW9uIGlzTGF6eSgpIHtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLmxhenk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNTb2xvOiBmdW5jdGlvbiBpc1NvbG8oKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1tAdG9kb10gTmVlZCB0byBpbXBsZW1lbnQgc29sbyBtb2RlJyk7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1dO1xuXG4gIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLnNlcnZpY2UoJ2JhYmVsZmlzaCcsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5KSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdMYW5nIGlzIGxvYWRlZCcpXG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgc3RhdGUgdHJhbnNsYXRpb25cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICovXG4gICAgZnVuY3Rpb24gZ2V0KGxhbmcpIHtcblxuICAgICAgdmFyIGN1cnJlbnRMYW5nID0gbW9kZWwuZGF0YVtsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudF0gfHwge30sXG4gICAgICAgICAgY29tbW9uID0ge307XG5cbiAgICAgIGlmKG1hcnZpbi5pc1NvbG8oKSkge1xuICAgICAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoe30sIG1vZGVsLmRhdGEuX2NvbW1vbiB8fCB7fSwgY3VycmVudExhbmcpO1xuICAgICAgfVxuXG5cbiAgICAgIGlmKCFjdXJyZW50TGFuZ1ttb2RlbC5zdGF0ZS5jdXJyZW50XSkge1xuXG4gICAgICAgIGlmKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignW25nQmFiZWxmaXNoLXRyYW5zbGF0b3JAZ2V0XSBObyB0cmFuc2xhdGlvbiBhdmFpbGFibGUgZm9yIHRoZSBwYWdlICVzIGZvciB0aGUgIGxhbmcgJXMnLG1vZGVsLnN0YXRlLmN1cnJlbnQsIChsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudCkpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdID0ge307XG4gICAgICB9XG5cbiAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbW1vbiwge30sIGN1cnJlbnRMYW5nLl9jb21tb24pO1xuICAgICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKGNvbW1vbiwgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEdldCBhbGwgdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgYSBsYW5nXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGFsbChsYW5nKSB7XG5cbiAgICAgIHZhciBsYW5nSWQgPSBsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgICAgaWYobWFydmluLmlzU29sbygpKSB7XG4gICAgICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZCh7fSwgbW9kZWwuZGF0YS5fY29tbW9uIHx8IHt9LCBtb2RlbC5kYXRhW2xhbmdJZF0gfHwge30pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbW9kZWwuZGF0YVtsYW5nSWRdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJldHVybiBlYWNoIHRyYW5zbGF0aW9ucyBhdmFpbGFibGUgZm9yIHlvdXIgYXBwXG4gICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHRyYW5zbGF0aW9ucygpIHtcbiAgICAgIHJldHVybiBtb2RlbC5kYXRhO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHlvdSBhbHJlYWR5IGxvYWQgdGhpcyBsYW5nXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSAgbGFuZ1xuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICovXG4gICAgZnVuY3Rpb24gaXNMYW5nTG9hZGVkKGxhbmcpIHtcbiAgICAgICAgcmV0dXJuICEhbW9kZWwuZGF0YVtsYW5nXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIGN1cnJlbnQgTGFuZ3VhZ2VcbiAgICAgKiBAcmV0dXJuIHtTdHJpbmd9IGxhbmdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBjdXJyZW50KCkge1xuICAgICAgcmV0dXJuIG1vZGVsLmxhbmcuY3VycmVudDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiB3ZSBoYXZlIGxvYWRlZCBpMThuXG4gICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBpc0xvYWRlZCgpIHtcbiAgICAgIHJldHVybiBtb2RlbC5hY3RpdmU7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGlzdCBlYWNoIGxhbmd1YWdlIGF2YWlsYWJsZSBpbiBiYWJlbGZpc2hcbiAgICAgKiBXaXRoIHRoZSBzb2xvIG1vZGUgeW91IGNhbiB1c2UgYSBrZXkgX2NvbW9tIHRvIHNoYXJlIGJldHdlZW4gZWFjaCBsYW5nIGEgdHJhZC4gU28gd2UgY2Fubm90IHJldHVybiBpdC5cbiAgICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBnZXRMYW5ndWFnZXMoKSB7XG4gICAgICBpZihtb2RlbC5hdmFpbGFibGUuaW5kZXhPZignX2NvbW9uJykgPiAtMSkge1xuICAgICAgICBtb2RlbC5hdmFpbGFibGUuc3BsaWNlKG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKCdfY29tb24nKSwxKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBtb2RlbC5hdmFpbGFibGU7XG4gICAgfVxuXG5cbiAgICByZXR1cm4ge1xuICAgICAgZ2V0OiBnZXQsXG4gICAgICBhbGw6IGFsbCxcbiAgICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgICB0cmFuc2xhdGlvbnM6IHRyYW5zbGF0aW9ucyxcbiAgICAgIGxhbmd1YWdlczogZ2V0TGFuZ3VhZ2VzLFxuICAgICAgaXNMYW5nTG9hZGVkOiBpc0xhbmdMb2FkZWQsXG4gICAgICBpc0xvYWRlZDogaXNMb2FkZWRcbiAgICB9O1xuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJylcbiAgLnNlcnZpY2UoJ2JhYmVsZmlzaExhbmcnLCBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdtYXJ2aW5UYXNrcycsIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnksIG1hcnZpblRhc2tzKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG4gICAgICBpbml0KGRhdGEpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gaW5pdChzdGF0ZU5hbWUsIHVybCkge1xuICAgICAgbW9kZWwuc3RhdGUuY3VycmVudCA9IHN0YXRlTmFtZTtcbiAgICAgIGxvYWQoKS50aGVuKG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXRMYW5ndWFnZShsYW5nKSB7XG4gICAgICBtb2RlbC5sYW5nLnByZXZpb3VzID0gYW5ndWxhci5jb3B5KG1vZGVsLmxhbmcuY3VycmVudCk7XG4gICAgICBtb2RlbC5sYW5nLmN1cnJlbnQgPSBsYW5nO1xuXG4gICAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOnNldExhbmd1YWdlJywgbW9kZWwuY3VycmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbG9hZCh1cmwpIHtcblxuICAgICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgICB1cmwgPSB1cmwgfHwgbWFydmluLmdldENvbmZpZygpLnVybDtcblxuICAgICAgaWYobWFydmluLmlzTGF6eSgpKSB7XG4gICAgICAgIHVybCA9IG1hcnZpbi5nZXRMYXp5Q29uZmlnKG1vZGVsLmN1cnJlbnQgfHwgbWFydmluLmdldENvbmZpZygpLmxhbmcpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gJGh0dHBcbiAgICAgICAgLmdldCh1cmwpXG4gICAgICAgIC5lcnJvcihmdW5jdGlvbigpIHtcbiAgICAgICAgICBpZihtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaExhbmdyQGxvYWRdIENhbm5vdCBsb2FkIHRoZSB0cmFuc2xhdGlvbiBmaWxlJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAuc3VjY2Vzcyh0cmFuc2xhdGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRyYW5zbGF0ZShkYXRhKSB7XG4gICAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgICAgaWYobWFydmluLmlzTGF6eSgpKSB7XG4gICAgICAgIG1vZGVsLmRhdGFbbGFuZ10gPSBkYXRhO1xuXG4gICAgICAgIGlmKC0xID09PSBtb2RlbC5hdmFpbGFibGUuaW5kZXhPZihsYW5nKSkge1xuICAgICAgICAgIG1vZGVsLmF2YWlsYWJsZS5wdXNoKGxhbmcpO1xuICAgICAgICB9XG5cbiAgICAgIH1lbHNlIHtcbiAgICAgICAgbW9kZWwuZGF0YSA9IGRhdGE7XG4gICAgICAgIG1vZGVsLmF2YWlsYWJsZSA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgICAgfVxuXG4gICAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOmxvYWRlZCcsIHtcbiAgICAgICAgbGFuZzogbGFuZ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0ID0gaW5pdDtcbiAgICB0aGlzLmxvYWQgPSBsb2FkO1xuICAgIHRoaXMudHJhbnNsYXRlID0gdHJhbnNsYXRlO1xuICAgIHRoaXMuc2V0ID0gc2V0TGFuZ3VhZ2U7XG5cbiAgfV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpXG4gIC5zZXJ2aWNlKCdtYXJ2aW5UYXNrcycsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5KSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgICBmdW5jdGlvbiBiaW5kVG9TY29wZSgpIHtcblxuICAgICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG5cbiAgICAgIC8vIFdlIGRvIG5vdCB3YW50IHRvIGhhdmUgbXVsdGlwbGUgcmVsb2FkIGlmIHRoZSBsYW5nIGlzIGFscmVhZHkgcHJlc2VudFxuICAgICAgaWYobWFydmluLmlzTGF6eSgpICYmICFtb2RlbC5kYXRhW2xhbmddKSB7XG4gICAgICAgIHJldHVybiAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5tYXJ2aW46cmVxdWVzdFRyYW5zbGF0aW9uJywge1xuICAgICAgICAgIHN0YXRlOiBtb2RlbC5zdGF0ZS5jdXJyZW50LFxuICAgICAgICAgIHVybDogbWFydmluLmdldExhenlDb25maWcobGFuZykudXJsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBzZXRUcmFuc2xhdGlvbigpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKCkge1xuXG4gICAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcbiAgICAgIHZhciBzdGF0ZSA9IG1vZGVsLnN0YXRlLmN1cnJlbnQsXG4gICAgICAgICAgc3RhdGVJMThuLFxuICAgICAgICAgIHRyYW5zbGF0aW9uID0ge307XG5cbiAgICAgIC8vIFByZXZlbnQgdG9vIG1hbnkgcmVsb2FkXG4gICAgICBpZihzdGF0ZSA9PT0gbW9kZWwuc3RhdGUucHJldmlvdXMgJiYgbW9kZWwubGFuZy5jdXJyZW50ID09PSBtb2RlbC5sYW5nLnByZXZpb3VzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYoIW1vZGVsLmRhdGFbbGFuZ10pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZUkxOG4gPSBtb2RlbC5kYXRhW2xhbmddW3N0YXRlXTtcblxuICAgICAgLyoqXG4gICAgICAgKiBQcmV2ZW50IHRoZSBlcnJvclxuICAgICAgICogICAgID4gVHlwZUVycm9yOiBDYW5ub3QgcmVhZCBwcm9wZXJ0eSAnJCRoYXNoS2V5JyBvZiB1bmRlZmluZWRcbiAgICAgICAqIGNmIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZGhva28vbmdCYWJlbGZpc2gvaXNzdWVzLzV9XG4gICAgICAgKi9cbiAgICAgIGlmKCFzdGF0ZUkxOG4pIHtcbiAgICAgICAgbW9kZWwuZGF0YVtsYW5nXVtzdGF0ZV0gPSB7fTtcblxuICAgICAgICBpZihtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1ttYXJ2aW5UYXNrc0BzZXRUcmFuc2xhdGlvbl0gTm8gdHJhbnNsYXRpb24gYXZhaWxhYmxlIGZvciB0aGUgcGFnZSAlcyBmb3IgdGhlIGxhbmcgJXMnLHN0YXRlLCBsYW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBhbmd1bGFyLmV4dGVuZChcbiAgICAgICAgdHJhbnNsYXRpb24sXG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHt9LCBtb2RlbC5kYXRhW2xhbmddLl9jb21tb24pLFxuICAgICAgICBzdGF0ZUkxOG5cbiAgICAgICk7XG5cbiAgICAgIGlmKG1hcnZpbi5nZXROYW1lc3BhY2UoKSkge1xuICAgICAgICAkcm9vdFNjb3BlW21hcnZpbi5nZXROYW1lc3BhY2UoKV0gPSB0cmFuc2xhdGlvbjtcbiAgICAgIH1lbHNlIHtcbiAgICAgICAgYW5ndWxhci5leHRlbmQoJHJvb3RTY29wZSwgdHJhbnNsYXRpb24pO1xuXG4gICAgICAgIGlmKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignW21hcnZpblRhc2tzQHNldFRyYW5zbGF0aW9uXSBJdCBpcyBiZXR0ZXIgdG8gTG9hZCBpMThuIGluc2lkZSBhIG5hbWVzcGFjZS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC50cmFuc2xhdGlvbjpsb2FkZWQnLCB7XG4gICAgICAgIGN1cnJlbnRTdGF0ZTogc3RhdGUsXG4gICAgICAgIGxhbmc6IGxhbmdcbiAgICAgIH0pO1xuXG4gICAgfVxuICAgIHRoaXMuYmluZFRvU2NvcGUgPSBiaW5kVG9TY29wZTtcbiAgfV0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==