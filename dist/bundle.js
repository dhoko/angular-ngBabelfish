angular.module('ngBabelfish', []).run(['$rootScope', 'marvin', 'babelfishLang', function ($rootScope, marvin, babelfishLang) {

  // Update the translation when you change a page
  $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
    babelfishLang.init(toState.name);
  });}]);
angular.module('ngBabelfish').directive('i18nBind', ['$rootScope', 'marvin', 'babelfish', function ($rootScope, marvin, babelfish) {

  return {
    scope: {
      translationKey: '=i18nBind',
      translationLang: '@i18nBindLang'
    },
    template: '{{translationKey}}',
    link: function (scope, el, attr) {

      var key = '',
          namespace = marvin.getNamespace();

      key = (namespace) ? attr.i18nBind.replace(namespace + '.', '') : attr.i18nBind;

      // Because it breaks if you update translationKey...
      if (attr.i18nBindLang) {

        if (babelfish.isLangLoaded(attr.i18nBindLang)) {
          var translation = babelfish.get(attr.i18nBindLang);
          return el.text(translation[key]);
        }

        /**
         * @todo Remove event listener, too many listeners !
         */
        $rootScope.$on('ngBabelfish.lang:loaded', function (e, data) {
          if (babelfish.isLangLoaded(attr.i18nBindLang)) {
            var translation = babelfish.get(attr.i18nBindLang);
            el.text(translation[key]);
          }
        });
      }
    }
  }}]);
angular.module('ngBabelfish').directive('i18nLoad', ['babelfish', function (babelfish) {

  return {
    link: function (scope, el, attr) {
      el.on('click', function () {
        scope.$apply(function () {
          babelfish.updateLang(attr.i18nLoad);
        });

      });
    }
  }}]);
angular.module('ngBabelfish').factory('babelfishEvent', ['$rootScope', function ($rootScope) {

  'use strict';

  var events = {};

  var factory = {
    set: function (eventName, cb) {
      events[eventName] = cb;
    },
    exec: function (eventName) {
      (events[eventName] || angular.noop)();
    }
  };

  $rootScope.$on('ngBabelfish.translation:loaded', function (e, data) {
    if (data.previousLang !== data.lang) {
      factory.exec('change:language');
    }
  });

  return factory;}]);
angular.module('ngBabelfish').factory('marvinMemory', function () {

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
    get: function () {
      return memory;
    }
  };
});
angular.module('ngBabelfish').provider('marvin', function () {

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
  };

  /**
   * Add each language for your application
   * @param  {Object} opt {lang: "",url: ""}
   * @return {babelfishProvider}
   */
  this.lang = function lang(opt) {

    if (!opt.lang) {
      throw new Error('[babelfishProvider@lang] You must set the key lang');
    }

    if (!opt.url) {
      throw new Error('[babelfishProvider@lang] You must set the key url');
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
  };

  /**
   * Marvin service
   */
  this.$get = ['$document', function ($document) {
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

        if (config.lang) {
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

      isBindToScope: function isBindToScope() {
        return config.bindToScope;
      },

      isSolo: function isSolo() {
        console.log('[@todo] Need to implement solo mode');
        return false;
      }
    };}];

});
angular.module('ngBabelfish').service('babelfish', ['$rootScope', 'marvin', 'marvinMemory', 'babelfishLang', 'marvinTasks', 'babelfishEvent', function ($rootScope, marvin, marvinMemory, babelfishLang, marvinTasks, babelfishEvent) {

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

    if (!currentLang[model.state.current]) {

      if (marvin.isVerbose()) {
        console.warn('[ngBabelfish-translator@get] No translation available for the page %s for the lang %s', model.state.current, (lang || model.lang.current));
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
    return model.data && !! model.data[lang];
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
   * @return {Array}
   */

  function getLanguages() {

    if (model.available.indexOf('_comon') > -1) {
      model.available.splice(model.available.indexOf('_comon'), 1);
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
    updateLang: updateLang,
    on: babelfishEvent.set
  };}]);
angular.module('ngBabelfish').service('babelfishLang', ['$http', '$rootScope', 'marvin', 'marvinMemory', 'marvinTasks', function ($http, $rootScope, marvin, marvinMemory, marvinTasks) {

  'use strict';

  var model = marvinMemory.get();

  $rootScope.$on('ngBabelfish.marvin:requestTranslation', function (e, data) {
    init(data.state, data.url);
  });

  function init(stateName, url) {
    model.state.current = stateName;

    if (!marvin.isBindToScope()) {
      return;
    }

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

    if (marvin.isLazy()) {
      url = marvin.getLazyConfig(model.lang.current || marvin.getConfig().lang).url;
    }

    return $http.get(url).error(function () {
      if (marvin.isVerbose()) {
        throw new Error('[babelfishLangr@load] Cannot load the translation file');
      }
    }).success(translate);
  }

  function translate(data) {
    var lang = model.lang.current;

    if (marvin.isLazy()) {
      model.data = {};
      model.data[lang] = data;

      if (-1 === model.available.indexOf(lang)) {
        model.available.push(lang);
      }

    } else {
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
angular.module('ngBabelfish').service('marvinTasks', ['$rootScope', 'marvin', 'marvinMemory', function ($rootScope, marvin, marvinMemory) {

  'use strict';

  var model = marvinMemory.get();

  function bindToScope() {

    var lang = model.lang.current;

    // We do not want to have multiple reload if the lang is already present
    if (marvin.isLazy() && !model.data[lang]) {
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
        stateI18n, translation = {};

    // Prevent too many reload
    if (state === model.state.previous && model.lang.current === model.lang.previous) {
      return;
    }

    if (!model.data[lang]) {
      return;
    }

    stateI18n = model.data[lang][state];

    /**
     * Prevent the error
     *     > TypeError: Cannot read property '$$hashKey' of undefined
     * cf {@link https://github.com/dhoko/ngBabelfish/issues/5}
     */
    if (!stateI18n) {
      model.data[lang][state] = {};

      if (marvin.isVerbose()) {
        console.warn('[marvinTasks@setTranslation] No translation available for the page %s for the lang %s', state, lang);
      }
    }

    angular.extend(
    translation, angular.extend({}, model.data[lang]._common), stateI18n);

    if (marvin.isBindToScope()) {
      if (marvin.getNamespace()) {
        $rootScope[marvin.getNamespace()] = translation;
      } else {
        angular.extend($rootScope, translation);

        if (marvin.isVerbose()) {
          console.warn('[marvinTasks@setTranslation] It is better to Load i18n inside a namespace.');
        }
      }
    }

    $rootScope.$emit('ngBabelfish.translation:loaded', {
      currentState: state,
      lang: lang,
      previousLang: model.lang.previous
    });

  }

  this.bindToScope = bindToScope;}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvYmFiZWxmaXNoRXZlbnRzLmpzIiwiZmFjdG9yaWVzL21hcnZpbk1lbW9yeS5qcyIsInByb3ZpZGVycy9tYXJ2aW4uanMiLCJzZXJ2aWNlcy9iYWJlbGZpc2guanMiLCJzZXJ2aWNlcy9iYWJlbGZpc2hMYW5nLmpzIiwic2VydmljZXMvbWFydmluVGFza3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcsIFtdKS5ydW4oWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdiYWJlbGZpc2hMYW5nJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgYmFiZWxmaXNoTGFuZykge1xuXG4gIC8vIFVwZGF0ZSB0aGUgdHJhbnNsYXRpb24gd2hlbiB5b3UgY2hhbmdlIGEgcGFnZVxuICAkcm9vdFNjb3BlLiRvbihtYXJ2aW4uZ2V0Um91dGVFdmVudCgpLCBmdW5jdGlvbiAoZSwgdG9TdGF0ZSkge1xuICAgIGJhYmVsZmlzaExhbmcuaW5pdCh0b1N0YXRlLm5hbWUpO1xuICB9KTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZGlyZWN0aXZlKCdpMThuQmluZCcsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnYmFiZWxmaXNoJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgYmFiZWxmaXNoKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBzY29wZToge1xuICAgICAgdHJhbnNsYXRpb25LZXk6ICc9aTE4bkJpbmQnLFxuICAgICAgdHJhbnNsYXRpb25MYW5nOiAnQGkxOG5CaW5kTGFuZydcbiAgICB9LFxuICAgIHRlbXBsYXRlOiAne3t0cmFuc2xhdGlvbktleX19JyxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsLCBhdHRyKSB7XG5cbiAgICAgIHZhciBrZXkgPSAnJyxcbiAgICAgICAgICBuYW1lc3BhY2UgPSBtYXJ2aW4uZ2V0TmFtZXNwYWNlKCk7XG5cbiAgICAgIGtleSA9IChuYW1lc3BhY2UpID8gYXR0ci5pMThuQmluZC5yZXBsYWNlKG5hbWVzcGFjZSArICcuJywgJycpIDogYXR0ci5pMThuQmluZDtcblxuICAgICAgLy8gQmVjYXVzZSBpdCBicmVha3MgaWYgeW91IHVwZGF0ZSB0cmFuc2xhdGlvbktleS4uLlxuICAgICAgaWYgKGF0dHIuaTE4bkJpbmRMYW5nKSB7XG5cbiAgICAgICAgaWYgKGJhYmVsZmlzaC5pc0xhbmdMb2FkZWQoYXR0ci5pMThuQmluZExhbmcpKSB7XG4gICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChhdHRyLmkxOG5CaW5kTGFuZyk7XG4gICAgICAgICAgcmV0dXJuIGVsLnRleHQodHJhbnNsYXRpb25ba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogQHRvZG8gUmVtb3ZlIGV2ZW50IGxpc3RlbmVyLCB0b28gbWFueSBsaXN0ZW5lcnMgIVxuICAgICAgICAgKi9cbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLmxhbmc6bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICAgICAgICBpZiAoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChhdHRyLmkxOG5CaW5kTGFuZykpIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2xhdGlvbiA9IGJhYmVsZmlzaC5nZXQoYXR0ci5pMThuQmluZExhbmcpO1xuICAgICAgICAgICAgZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfX1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5kaXJlY3RpdmUoJ2kxOG5Mb2FkJywgWydiYWJlbGZpc2gnLCBmdW5jdGlvbiAoYmFiZWxmaXNoKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsLCBhdHRyKSB7XG4gICAgICBlbC5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgYmFiZWxmaXNoLnVwZGF0ZUxhbmcoYXR0ci5pMThuTG9hZCk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9KTtcbiAgICB9XG4gIH19XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZmFjdG9yeSgnYmFiZWxmaXNoRXZlbnQnLCBbJyRyb290U2NvcGUnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgZXZlbnRzID0ge307XG5cbiAgdmFyIGZhY3RvcnkgPSB7XG4gICAgc2V0OiBmdW5jdGlvbiAoZXZlbnROYW1lLCBjYikge1xuICAgICAgZXZlbnRzW2V2ZW50TmFtZV0gPSBjYjtcbiAgICB9LFxuICAgIGV4ZWM6IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgIChldmVudHNbZXZlbnROYW1lXSB8fCBhbmd1bGFyLm5vb3ApKCk7XG4gICAgfVxuICB9O1xuXG4gICRyb290U2NvcGUuJG9uKCduZ0JhYmVsZmlzaC50cmFuc2xhdGlvbjpsb2FkZWQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgIGlmIChkYXRhLnByZXZpb3VzTGFuZyAhPT0gZGF0YS5sYW5nKSB7XG4gICAgICBmYWN0b3J5LmV4ZWMoJ2NoYW5nZTpsYW5ndWFnZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGZhY3Rvcnk7fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmZhY3RvcnkoJ21hcnZpbk1lbW9yeScsIGZ1bmN0aW9uICgpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1lbW9yeSA9IHtcbiAgICBzdGF0ZToge1xuICAgICAgY3VycmVudDogJycsXG4gICAgICBsb2FkZWQ6IGZhbHNlXG4gICAgfSxcbiAgICBsYW5nOiB7XG4gICAgICBwcmV2aW91czogJ2VuLUVOJyxcbiAgICAgIGN1cnJlbnQ6ICdlbi1FTidcbiAgICB9LFxuICAgIGRhdGE6IG51bGwsXG4gICAgYXZhaWxhYmxlOiBbXSxcbiAgICBhY3RpdmU6IGZhbHNlXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBtZW1vcnk7XG4gICAgfVxuICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykucHJvdmlkZXIoJ21hcnZpbicsIGZ1bmN0aW9uICgpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgY29uZmlndXJhdGlvbiBmb3IgdGhlIG1vZHVsZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdmFyIGNvbmZpZyA9IHtcbiAgICBzdGF0ZTogJ2hvbWUnLFxuICAgIGxhbmc6ICdlbi1FTicsXG4gICAgdXJsOiAnL2kxOG4vbGFuZ3VhZ2VzLmpzb24nLFxuICAgIHJvdXRlRXZlbnROYW1lOiAnJHN0YXRlQ2hhbmdlU3VjY2VzcycsXG4gICAgbmFtZXNwYWNlOiAnaTE4bicsXG4gICAgbGF6eTogZmFsc2UsXG4gICAgbGF6eUNvbmZpZzogW10sXG4gICAgY3VycmVudDogJycsXG4gICAgbG9nOiB0cnVlLFxuICAgIGJpbmRUb1Njb3BlOiB0cnVlXG4gIH07XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZSB0aGUgc2VydmljZSB3aXRoIGEgcHJvdmlkZXIgZnJvbSB0aGUgY29uZmlnIG9mIHlvdXIgbW9kdWxlXG4gICAqIEBwYXJhbSAge09iamVjdH0gcGFyYW1zIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICB0aGlzLmluaXQgPSBmdW5jdGlvbiBpbml0QmFiZWxmaXNoQ29uZmlnKHBhcmFtcykge1xuICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgcGFyYW1zKTtcbiAgfTtcblxuICAvKipcbiAgICogQWRkIGVhY2ggbGFuZ3VhZ2UgZm9yIHlvdXIgYXBwbGljYXRpb25cbiAgICogQHBhcmFtICB7T2JqZWN0fSBvcHQge2xhbmc6IFwiXCIsdXJsOiBcIlwifVxuICAgKiBAcmV0dXJuIHtiYWJlbGZpc2hQcm92aWRlcn1cbiAgICovXG4gIHRoaXMubGFuZyA9IGZ1bmN0aW9uIGxhbmcob3B0KSB7XG5cbiAgICBpZiAoIW9wdC5sYW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tiYWJlbGZpc2hQcm92aWRlckBsYW5nXSBZb3UgbXVzdCBzZXQgdGhlIGtleSBsYW5nJyk7XG4gICAgfVxuXG4gICAgaWYgKCFvcHQudXJsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tiYWJlbGZpc2hQcm92aWRlckBsYW5nXSBZb3UgbXVzdCBzZXQgdGhlIGtleSB1cmwnKTtcbiAgICB9XG5cbiAgICBjb25maWcubGF6eSA9IHRydWU7XG4gICAgY29uZmlnLmxhenlDb25maWcucHVzaChvcHQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBCaW5kIHRvIHRoZSBzY29wZSBhbGwgdHJhbnNsYXRpb25zXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICogQHBhcmFtICB7Qm9vbGVhbn0gaXNCaW5kXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICB0aGlzLmJpbmRUb1Njb3BlID0gZnVuY3Rpb24gYmluZFRvU2NvcGUoaXNCaW5kKSB7XG4gICAgY29uZmlnLmJpbmRUb1Njb3BlID0gaXNCaW5kO1xuICB9O1xuXG4gIC8qKlxuICAgKiBNYXJ2aW4gc2VydmljZVxuICAgKi9cbiAgdGhpcy4kZ2V0ID0gWyckZG9jdW1lbnQnLCBmdW5jdGlvbiAoJGRvY3VtZW50KSB7XG4gICAgcmV0dXJuIHtcblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm4gYmFiZWxmaXNoIGNvbmZpZ3VyYXRpb25cbiAgICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgICAqL1xuICAgICAgZ2V0Q29uZmlnOiBmdW5jdGlvbiBnZXRDb25maWcoKSB7XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybiB0aGUgZGVmYXVsdCBldmVudCBuYW1lIGluIG9yZGVyIHRvIGxpc3RlbiBhIG5ldyBzdGF0ZXx8cm91dGVcbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0Um91dGVFdmVudDogZnVuY3Rpb24gZ2V0Um91dGVFdmVudCgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yb3V0ZUV2ZW50TmFtZTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBuYW1lc3BhY2Ugb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgKi9cbiAgICAgIGdldE5hbWVzcGFjZTogZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLm5hbWVzcGFjZTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBsYW5nIGZvciB5b3VyIGFwcC5cbiAgICAgICAqIC0gWW91IGNhbiB1c2UgdGhlIHByb3ZpZGVyXG4gICAgICAgKiAtIFlvdSBjYW4gdXNlIGh0bWwgZGVmYXVsdCBhdHRyXG4gICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgKi9cbiAgICAgIGdldERlZmF1bHRMYW5nOiBmdW5jdGlvbiBnZXREZWZhdWx0TGFuZygpIHtcblxuICAgICAgICBpZiAoY29uZmlnLmxhbmcpIHtcbiAgICAgICAgICAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcgPSBjb25maWcubGFuZy5zcGxpdCgnLScpWzBdO1xuICAgICAgICAgIHJldHVybiBjb25maWcubGFuZztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcgKyAnLScgKyAkZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcudG9VcHBlckNhc2UoKTtcbiAgICAgIH0sXG5cbiAgICAgIGdldExhenlMYW5nQXZhaWxhYmxlOiBmdW5jdGlvbiBnZXRMYXp5TGFuZ0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHJldHVybiBpdGVtLmxhbmc7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIGxhenkgY29uZmlndXJhdGlvbiBmb3IgYW55IGxhbmdcbiAgICAgICAqIC0gRGVmYXVsdCBpcyB0aGUgY29uZmlnIGxhbmdcbiAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ0tleVxuICAgICAgICogQHJldHVybiB7T2JqZXR9XG4gICAgICAgKi9cbiAgICAgIGdldExhenlDb25maWc6IGZ1bmN0aW9uIGdldExhenlDb25maWcobGFuZ0tleSkge1xuXG4gICAgICAgIHZhciBsYW5nVG9GaW5kID0gbGFuZ0tleSB8fCB0aGlzLmdldERlZmF1bHRMYW5nKCk7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICByZXR1cm4gby5sYW5nID09PSBsYW5nVG9GaW5kO1xuICAgICAgICB9KVswXSB8fCB7fTtcbiAgICAgIH0sXG5cbiAgICAgIGdldExhenlDb25maWdCeVVybDogZnVuY3Rpb24gZ2V0TGF6eUNvbmZpZ0J5VXJsKHVybCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenlDb25maWcuZmlsdGVyKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgcmV0dXJuIG8gPT09IHVybDtcbiAgICAgICAgfSlbMF07XG4gICAgICB9LFxuXG4gICAgICBpc1ZlcmJvc2U6IGZ1bmN0aW9uIGlzVmVyYm9zZSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sb2c7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFNob3VsZCB3ZSB1c2UgdGhlIGxhenkgbW9kZSBmb3IgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAgICovXG4gICAgICBpc0xhenk6IGZ1bmN0aW9uIGlzTGF6eSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5O1xuICAgICAgfSxcblxuICAgICAgaXNCaW5kVG9TY29wZTogZnVuY3Rpb24gaXNCaW5kVG9TY29wZSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5iaW5kVG9TY29wZTtcbiAgICAgIH0sXG5cbiAgICAgIGlzU29sbzogZnVuY3Rpb24gaXNTb2xvKCkge1xuICAgICAgICBjb25zb2xlLmxvZygnW0B0b2RvXSBOZWVkIHRvIGltcGxlbWVudCBzb2xvIG1vZGUnKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH07fV07XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLnNlcnZpY2UoJ2JhYmVsZmlzaCcsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgJ2JhYmVsZmlzaExhbmcnLCAnbWFydmluVGFza3MnLCAnYmFiZWxmaXNoRXZlbnQnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnksIGJhYmVsZmlzaExhbmcsIG1hcnZpblRhc2tzLCBiYWJlbGZpc2hFdmVudCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgY3VycmVudCBzdGF0ZSB0cmFuc2xhdGlvblxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cblxuICBmdW5jdGlvbiBnZXQobGFuZykge1xuXG4gICAgdmFyIGN1cnJlbnRMYW5nID0gbW9kZWwuZGF0YVtsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudF0gfHwge30sXG4gICAgICAgIGNvbW1vbiA9IHt9O1xuXG4gICAgaWYgKCFjdXJyZW50TGFuZ1ttb2RlbC5zdGF0ZS5jdXJyZW50XSkge1xuXG4gICAgICBpZiAobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW25nQmFiZWxmaXNoLXRyYW5zbGF0b3JAZ2V0XSBObyB0cmFuc2xhdGlvbiBhdmFpbGFibGUgZm9yIHRoZSBwYWdlICVzIGZvciB0aGUgbGFuZyAlcycsIG1vZGVsLnN0YXRlLmN1cnJlbnQsIChsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudCkpO1xuICAgICAgfVxuICAgICAgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0gPSB7fTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLmV4dGVuZChjb21tb24sIHt9LCBjdXJyZW50TGFuZy5fY29tbW9uKTtcbiAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoY29tbW9uLCBjdXJyZW50TGFuZ1ttb2RlbC5zdGF0ZS5jdXJyZW50XSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCB0cmFuc2xhdGlvbnMgYXZhaWxhYmxlIGZvciBhIGxhbmdcbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gYWxsKGxhbmcpIHtcbiAgICByZXR1cm4gbW9kZWwuZGF0YVtsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudF07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGVhY2ggdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgeW91ciBhcHBcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmFuc2xhdGlvbnMoKSB7XG4gICAgcmV0dXJuIG1vZGVsLmRhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgeW91IGFscmVhZHkgbG9hZCB0aGlzIGxhbmdcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgbGFuZ1xuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cblxuICBmdW5jdGlvbiBpc0xhbmdMb2FkZWQobGFuZykge1xuICAgIHJldHVybiBtb2RlbC5kYXRhICYmICEhIG1vZGVsLmRhdGFbbGFuZ107XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IExhbmd1YWdlXG4gICAqIEByZXR1cm4ge1N0cmluZ30gbGFuZ1xuICAgKi9cblxuICBmdW5jdGlvbiBjdXJyZW50KCkge1xuICAgIHJldHVybiBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgd2UgaGF2ZSBsb2FkZWQgaTE4blxuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cblxuICBmdW5jdGlvbiBpc0xvYWRlZCgpIHtcbiAgICByZXR1cm4gbW9kZWwuYWN0aXZlO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgZWFjaCBsYW5ndWFnZSBhdmFpbGFibGUgaW4gYmFiZWxmaXNoXG4gICAqIEByZXR1cm4ge0FycmF5fVxuICAgKi9cblxuICBmdW5jdGlvbiBnZXRMYW5ndWFnZXMoKSB7XG5cbiAgICBpZiAobW9kZWwuYXZhaWxhYmxlLmluZGV4T2YoJ19jb21vbicpID4gLTEpIHtcbiAgICAgIG1vZGVsLmF2YWlsYWJsZS5zcGxpY2UobW9kZWwuYXZhaWxhYmxlLmluZGV4T2YoJ19jb21vbicpLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsLmF2YWlsYWJsZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxhbmcobGFuZykge1xuICAgIGJhYmVsZmlzaExhbmcuc2V0KGxhbmcsIG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXQsXG4gICAgYWxsOiBhbGwsXG4gICAgY3VycmVudDogY3VycmVudCxcbiAgICB0cmFuc2xhdGlvbnM6IHRyYW5zbGF0aW9ucyxcbiAgICBsYW5ndWFnZXM6IGdldExhbmd1YWdlcyxcbiAgICBpc0xhbmdMb2FkZWQ6IGlzTGFuZ0xvYWRlZCxcbiAgICBpc0xvYWRlZDogaXNMb2FkZWQsXG4gICAgdXBkYXRlTGFuZzogdXBkYXRlTGFuZyxcbiAgICBvbjogYmFiZWxmaXNoRXZlbnQuc2V0XG4gIH07fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLnNlcnZpY2UoJ2JhYmVsZmlzaExhbmcnLCBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdtYXJ2aW5UYXNrcycsIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnksIG1hcnZpblRhc2tzKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG4gICAgaW5pdChkYXRhLnN0YXRlLCBkYXRhLnVybCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGluaXQoc3RhdGVOYW1lLCB1cmwpIHtcbiAgICBtb2RlbC5zdGF0ZS5jdXJyZW50ID0gc3RhdGVOYW1lO1xuXG4gICAgaWYgKCFtYXJ2aW4uaXNCaW5kVG9TY29wZSgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgbG9hZCgpLnRoZW4obWFydmluVGFza3MuYmluZFRvU2NvcGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0TGFuZ3VhZ2UobGFuZywgY2IpIHtcbiAgICBjYiA9IGNiIHx8IGFuZ3VsYXIubm9vcDtcbiAgICBtb2RlbC5sYW5nLnByZXZpb3VzID0gYW5ndWxhci5jb3B5KG1vZGVsLmxhbmcuY3VycmVudCk7XG4gICAgbW9kZWwubGFuZy5jdXJyZW50ID0gbGFuZztcbiAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOnNldExhbmd1YWdlJywgbW9kZWwuY3VycmVudCk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWQodXJsKSB7XG5cbiAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcbiAgICB1cmwgPSB1cmwgfHwgbWFydmluLmdldENvbmZpZygpLnVybDtcblxuICAgIGlmIChtYXJ2aW4uaXNMYXp5KCkpIHtcbiAgICAgIHVybCA9IG1hcnZpbi5nZXRMYXp5Q29uZmlnKG1vZGVsLmxhbmcuY3VycmVudCB8fCBtYXJ2aW4uZ2V0Q29uZmlnKCkubGFuZykudXJsO1xuICAgIH1cblxuICAgIHJldHVybiAkaHR0cC5nZXQodXJsKS5lcnJvcihmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaExhbmdyQGxvYWRdIENhbm5vdCBsb2FkIHRoZSB0cmFuc2xhdGlvbiBmaWxlJyk7XG4gICAgICB9XG4gICAgfSkuc3VjY2Vzcyh0cmFuc2xhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhbnNsYXRlKGRhdGEpIHtcbiAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgIGlmIChtYXJ2aW4uaXNMYXp5KCkpIHtcbiAgICAgIG1vZGVsLmRhdGEgPSB7fTtcbiAgICAgIG1vZGVsLmRhdGFbbGFuZ10gPSBkYXRhO1xuXG4gICAgICBpZiAoLTEgPT09IG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKGxhbmcpKSB7XG4gICAgICAgIG1vZGVsLmF2YWlsYWJsZS5wdXNoKGxhbmcpO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGVsLmRhdGEgPSBkYXRhO1xuICAgICAgbW9kZWwuYXZhaWxhYmxlID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgfVxuXG4gICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCB7XG4gICAgICBsYW5nOiBsYW5nXG4gICAgfSk7XG4gIH1cblxuICB0aGlzLmluaXQgPSBpbml0O1xuICB0aGlzLmxvYWQgPSBsb2FkO1xuICB0aGlzLnRyYW5zbGF0ZSA9IHRyYW5zbGF0ZTtcbiAgdGhpcy5zZXQgPSBzZXRMYW5ndWFnZTtcblxuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuc2VydmljZSgnbWFydmluVGFza3MnLCBbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIG1hcnZpbk1lbW9yeSkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgZnVuY3Rpb24gYmluZFRvU2NvcGUoKSB7XG5cbiAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgIC8vIFdlIGRvIG5vdCB3YW50IHRvIGhhdmUgbXVsdGlwbGUgcmVsb2FkIGlmIHRoZSBsYW5nIGlzIGFscmVhZHkgcHJlc2VudFxuICAgIGlmIChtYXJ2aW4uaXNMYXp5KCkgJiYgIW1vZGVsLmRhdGFbbGFuZ10pIHtcbiAgICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLm1hcnZpbjpyZXF1ZXN0VHJhbnNsYXRpb24nLCB7XG4gICAgICAgIHN0YXRlOiBtb2RlbC5zdGF0ZS5jdXJyZW50LFxuICAgICAgICB1cmw6IG1hcnZpbi5nZXRMYXp5Q29uZmlnKGxhbmcpLnVybFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VHJhbnNsYXRpb24oKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKCkge1xuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuICAgIHZhciBzdGF0ZSA9IG1vZGVsLnN0YXRlLmN1cnJlbnQsXG4gICAgICAgIHN0YXRlSTE4biwgdHJhbnNsYXRpb24gPSB7fTtcblxuICAgIC8vIFByZXZlbnQgdG9vIG1hbnkgcmVsb2FkXG4gICAgaWYgKHN0YXRlID09PSBtb2RlbC5zdGF0ZS5wcmV2aW91cyAmJiBtb2RlbC5sYW5nLmN1cnJlbnQgPT09IG1vZGVsLmxhbmcucHJldmlvdXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIW1vZGVsLmRhdGFbbGFuZ10pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzdGF0ZUkxOG4gPSBtb2RlbC5kYXRhW2xhbmddW3N0YXRlXTtcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgdGhlIGVycm9yXG4gICAgICogICAgID4gVHlwZUVycm9yOiBDYW5ub3QgcmVhZCBwcm9wZXJ0eSAnJCRoYXNoS2V5JyBvZiB1bmRlZmluZWRcbiAgICAgKiBjZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Rob2tvL25nQmFiZWxmaXNoL2lzc3Vlcy81fVxuICAgICAqL1xuICAgIGlmICghc3RhdGVJMThuKSB7XG4gICAgICBtb2RlbC5kYXRhW2xhbmddW3N0YXRlXSA9IHt9O1xuXG4gICAgICBpZiAobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW21hcnZpblRhc2tzQHNldFRyYW5zbGF0aW9uXSBObyB0cmFuc2xhdGlvbiBhdmFpbGFibGUgZm9yIHRoZSBwYWdlICVzIGZvciB0aGUgbGFuZyAlcycsIHN0YXRlLCBsYW5nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLmV4dGVuZChcbiAgICB0cmFuc2xhdGlvbiwgYW5ndWxhci5leHRlbmQoe30sIG1vZGVsLmRhdGFbbGFuZ10uX2NvbW1vbiksIHN0YXRlSTE4bik7XG5cbiAgICBpZiAobWFydmluLmlzQmluZFRvU2NvcGUoKSkge1xuICAgICAgaWYgKG1hcnZpbi5nZXROYW1lc3BhY2UoKSkge1xuICAgICAgICAkcm9vdFNjb3BlW21hcnZpbi5nZXROYW1lc3BhY2UoKV0gPSB0cmFuc2xhdGlvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKCRyb290U2NvcGUsIHRyYW5zbGF0aW9uKTtcblxuICAgICAgICBpZiAobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbbWFydmluVGFza3NAc2V0VHJhbnNsYXRpb25dIEl0IGlzIGJldHRlciB0byBMb2FkIGkxOG4gaW5zaWRlIGEgbmFtZXNwYWNlLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywge1xuICAgICAgY3VycmVudFN0YXRlOiBzdGF0ZSxcbiAgICAgIGxhbmc6IGxhbmcsXG4gICAgICBwcmV2aW91c0xhbmc6IG1vZGVsLmxhbmcucHJldmlvdXNcbiAgICB9KTtcblxuICB9XG5cbiAgdGhpcy5iaW5kVG9TY29wZSA9IGJpbmRUb1Njb3BlO31dKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=