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

  /**
   * Execute an event
   * @param  {String} eventName
   * @return {void}
   */

  function trigger(eventName) {
    (events[eventName] || angular.noop)();
  }

  $rootScope.$on('ngBabelfish.translation:loaded', function (e, data) {
    if (data.previousLang !== data.lang) {
      trigger('change:language');
    }
  });

  return {
    /**
     * Record a eventListener
     * Event available:
     *   - change:language
     * @param {String}   eventName
     * @param {Function} cb        callback to record
     */
    set: function (eventName, cb) {
      events[eventName] = cb;
    }
  };}]);
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

  /**
   * Load a translation to the scope
   * @event 'nbBalebelfish.marvin:requestTranslation' if we are in lazy mode
   * @return {void}
   */

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

  /**
   * Load translations to the scope or update the model if you set config.bindToScope to false.
   * @event ngBabelfish.translation:loaded
   */

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvYmFiZWxmaXNoRXZlbnRzLmpzIiwiZmFjdG9yaWVzL21hcnZpbk1lbW9yeS5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaC5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaExhbmcuanMiLCJzZXJ2aWNlcy9tYXJ2aW5UYXNrcy5qcyIsInByb3ZpZGVycy9tYXJ2aW4uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJywgW10pLnJ1bihbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ2JhYmVsZmlzaExhbmcnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2hMYW5nKSB7XG5cbiAgLy8gVXBkYXRlIHRoZSB0cmFuc2xhdGlvbiB3aGVuIHlvdSBjaGFuZ2UgYSBwYWdlXG4gICRyb290U2NvcGUuJG9uKG1hcnZpbi5nZXRSb3V0ZUV2ZW50KCksIGZ1bmN0aW9uIChlLCB0b1N0YXRlKSB7XG4gICAgYmFiZWxmaXNoTGFuZy5pbml0KHRvU3RhdGUubmFtZSk7XG4gIH0pO31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5kaXJlY3RpdmUoJ2kxOG5CaW5kJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdiYWJlbGZpc2gnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2gpIHtcblxuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICB0cmFuc2xhdGlvbktleTogJz1pMThuQmluZCcsXG4gICAgICB0cmFuc2xhdGlvbkxhbmc6ICdAaTE4bkJpbmRMYW5nJ1xuICAgIH0sXG4gICAgdGVtcGxhdGU6ICd7e3RyYW5zbGF0aW9uS2V5fX0nLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcblxuICAgICAgdmFyIGtleSA9ICcnLFxuICAgICAgICAgIG5hbWVzcGFjZSA9IG1hcnZpbi5nZXROYW1lc3BhY2UoKTtcblxuICAgICAga2V5ID0gKG5hbWVzcGFjZSkgPyBhdHRyLmkxOG5CaW5kLnJlcGxhY2UobmFtZXNwYWNlICsgJy4nLCAnJykgOiBhdHRyLmkxOG5CaW5kO1xuXG4gICAgICAvLyBCZWNhdXNlIGl0IGJyZWFrcyBpZiB5b3UgdXBkYXRlIHRyYW5zbGF0aW9uS2V5Li4uXG4gICAgICBpZiAoYXR0ci5pMThuQmluZExhbmcpIHtcblxuICAgICAgICBpZiAoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChhdHRyLmkxOG5CaW5kTGFuZykpIHtcbiAgICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSBiYWJlbGZpc2guZ2V0KGF0dHIuaTE4bkJpbmRMYW5nKTtcbiAgICAgICAgICByZXR1cm4gZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdG9kbyBSZW1vdmUgZXZlbnQgbGlzdGVuZXIsIHRvbyBtYW55IGxpc3RlbmVycyAhXG4gICAgICAgICAqL1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgICAgICAgIGlmIChiYWJlbGZpc2guaXNMYW5nTG9hZGVkKGF0dHIuaTE4bkJpbmRMYW5nKSkge1xuICAgICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChhdHRyLmkxOG5CaW5kTGFuZyk7XG4gICAgICAgICAgICBlbC50ZXh0KHRyYW5zbGF0aW9uW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmRpcmVjdGl2ZSgnaTE4bkxvYWQnLCBbJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uIChiYWJlbGZpc2gpIHtcblxuICByZXR1cm4ge1xuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcbiAgICAgIGVsLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBiYWJlbGZpc2gudXBkYXRlTGFuZyhhdHRyLmkxOG5Mb2FkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pO1xuICAgIH1cbiAgfX1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5mYWN0b3J5KCdiYWJlbGZpc2hFdmVudCcsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBldmVudHMgPSB7fTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBhbiBldmVudFxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGV2ZW50TmFtZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50TmFtZSkge1xuICAgIChldmVudHNbZXZlbnROYW1lXSB8fCBhbmd1bGFyLm5vb3ApKCk7XG4gIH1cblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICBpZiAoZGF0YS5wcmV2aW91c0xhbmcgIT09IGRhdGEubGFuZykge1xuICAgICAgdHJpZ2dlcignY2hhbmdlOmxhbmd1YWdlJyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIFJlY29yZCBhIGV2ZW50TGlzdGVuZXJcbiAgICAgKiBFdmVudCBhdmFpbGFibGU6XG4gICAgICogICAtIGNoYW5nZTpsYW5ndWFnZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgIGV2ZW50TmFtZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICAgICAgICBjYWxsYmFjayB0byByZWNvcmRcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uIChldmVudE5hbWUsIGNiKSB7XG4gICAgICBldmVudHNbZXZlbnROYW1lXSA9IGNiO1xuICAgIH1cbiAgfTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZmFjdG9yeSgnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbWVtb3J5ID0ge1xuICAgIHN0YXRlOiB7XG4gICAgICBjdXJyZW50OiAnJyxcbiAgICAgIGxvYWRlZDogZmFsc2VcbiAgICB9LFxuICAgIGxhbmc6IHtcbiAgICAgIHByZXZpb3VzOiAnZW4tRU4nLFxuICAgICAgY3VycmVudDogJ2VuLUVOJ1xuICAgIH0sXG4gICAgZGF0YTogbnVsbCxcbiAgICBhdmFpbGFibGU6IFtdLFxuICAgIGFjdGl2ZTogZmFsc2VcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1lbW9yeTtcbiAgICB9XG4gIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdiYWJlbGZpc2gnLCBbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdiYWJlbGZpc2hMYW5nJywgJ21hcnZpblRhc2tzJywgJ2JhYmVsZmlzaEV2ZW50JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5LCBiYWJlbGZpc2hMYW5nLCBtYXJ2aW5UYXNrcywgYmFiZWxmaXNoRXZlbnQpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1vZGVsID0gbWFydmluTWVtb3J5LmdldCgpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgc3RhdGUgdHJhbnNsYXRpb25cbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gZ2V0KGxhbmcpIHtcblxuICAgIHZhciBjdXJyZW50TGFuZyA9IG1vZGVsLmRhdGFbbGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnRdIHx8IHt9LFxuICAgICAgICBjb21tb24gPSB7fTtcblxuICAgIGlmICghY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pIHtcblxuICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tuZ0JhYmVsZmlzaC10cmFuc2xhdG9yQGdldF0gTm8gdHJhbnNsYXRpb24gYXZhaWxhYmxlIGZvciB0aGUgcGFnZSAlcyBmb3IgdGhlIGxhbmcgJXMnLCBtb2RlbC5zdGF0ZS5jdXJyZW50LCAobGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnQpKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdID0ge307XG4gICAgfVxuXG4gICAgYW5ndWxhci5leHRlbmQoY29tbW9uLCB7fSwgY3VycmVudExhbmcuX2NvbW1vbik7XG4gICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKGNvbW1vbiwgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgYSBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFsbChsYW5nKSB7XG4gICAgcmV0dXJuIG1vZGVsLmRhdGFbbGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnRdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBlYWNoIHRyYW5zbGF0aW9ucyBhdmFpbGFibGUgZm9yIHlvdXIgYXBwXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gdHJhbnNsYXRpb25zKCkge1xuICAgIHJldHVybiBtb2RlbC5kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHlvdSBhbHJlYWR5IGxvYWQgdGhpcyBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gIGxhbmdcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG5cbiAgZnVuY3Rpb24gaXNMYW5nTG9hZGVkKGxhbmcpIHtcbiAgICByZXR1cm4gbW9kZWwuZGF0YSAmJiAhISBtb2RlbC5kYXRhW2xhbmddO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBMYW5ndWFnZVxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IGxhbmdcbiAgICovXG5cbiAgZnVuY3Rpb24gY3VycmVudCgpIHtcbiAgICByZXR1cm4gbW9kZWwubGFuZy5jdXJyZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHdlIGhhdmUgbG9hZGVkIGkxOG5cbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG5cbiAgZnVuY3Rpb24gaXNMb2FkZWQoKSB7XG4gICAgcmV0dXJuIG1vZGVsLmFjdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGVhY2ggbGFuZ3VhZ2UgYXZhaWxhYmxlIGluIGJhYmVsZmlzaFxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG5cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VzKCkge1xuXG4gICAgaWYgKG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKCdfY29tb24nKSA+IC0xKSB7XG4gICAgICBtb2RlbC5hdmFpbGFibGUuc3BsaWNlKG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKCdfY29tb24nKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiBtb2RlbC5hdmFpbGFibGU7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSBjdXJyZW50IGxhbmd1YWdlXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB1cGRhdGVMYW5nKGxhbmcpIHtcbiAgICBiYWJlbGZpc2hMYW5nLnNldChsYW5nLCBtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIGFsbDogYWxsLFxuICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgdHJhbnNsYXRpb25zOiB0cmFuc2xhdGlvbnMsXG4gICAgbGFuZ3VhZ2VzOiBnZXRMYW5ndWFnZXMsXG4gICAgaXNMYW5nTG9hZGVkOiBpc0xhbmdMb2FkZWQsXG4gICAgaXNMb2FkZWQ6IGlzTG9hZGVkLFxuICAgIHVwZGF0ZUxhbmc6IHVwZGF0ZUxhbmcsXG4gICAgb246IGJhYmVsZmlzaEV2ZW50LnNldFxuICB9O31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdiYWJlbGZpc2hMYW5nJywgWyckaHR0cCcsICckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCAnbWFydmluVGFza3MnLCBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5LCBtYXJ2aW5UYXNrcykge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLm1hcnZpbjpyZXF1ZXN0VHJhbnNsYXRpb24nLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgIGluaXQoZGF0YS5zdGF0ZSwgZGF0YS51cmwpO1xuICB9KTtcblxuICBmdW5jdGlvbiBpbml0KHN0YXRlTmFtZSwgdXJsKSB7XG4gICAgbW9kZWwuc3RhdGUuY3VycmVudCA9IHN0YXRlTmFtZTtcblxuICAgIGlmICghbWFydmluLmlzQmluZFRvU2NvcGUoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxvYWQoKS50aGVuKG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldExhbmd1YWdlKGxhbmcsIGNiKSB7XG4gICAgY2IgPSBjYiB8fCBhbmd1bGFyLm5vb3A7XG4gICAgbW9kZWwubGFuZy5wcmV2aW91cyA9IGFuZ3VsYXIuY29weShtb2RlbC5sYW5nLmN1cnJlbnQpO1xuICAgIG1vZGVsLmxhbmcuY3VycmVudCA9IGxhbmc7XG4gICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubGFuZzpzZXRMYW5ndWFnZScsIG1vZGVsLmN1cnJlbnQpO1xuICAgIGNiKCk7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkKHVybCkge1xuXG4gICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgdXJsID0gdXJsIHx8IG1hcnZpbi5nZXRDb25maWcoKS51cmw7XG5cbiAgICBpZiAobWFydmluLmlzTGF6eSgpKSB7XG4gICAgICB1cmwgPSBtYXJ2aW4uZ2V0TGF6eUNvbmZpZyhtb2RlbC5sYW5nLmN1cnJlbnQgfHwgbWFydmluLmdldENvbmZpZygpLmxhbmcpLnVybDtcbiAgICB9XG5cbiAgICByZXR1cm4gJGh0dHAuZ2V0KHVybCkuZXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tiYWJlbGZpc2hMYW5nckBsb2FkXSBDYW5ub3QgbG9hZCB0aGUgdHJhbnNsYXRpb24gZmlsZScpO1xuICAgICAgfVxuICAgIH0pLnN1Y2Nlc3ModHJhbnNsYXRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYW5zbGF0ZShkYXRhKSB7XG4gICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG5cbiAgICBpZiAobWFydmluLmlzTGF6eSgpKSB7XG4gICAgICBtb2RlbC5kYXRhID0ge307XG4gICAgICBtb2RlbC5kYXRhW2xhbmddID0gZGF0YTtcblxuICAgICAgaWYgKC0xID09PSBtb2RlbC5hdmFpbGFibGUuaW5kZXhPZihsYW5nKSkge1xuICAgICAgICBtb2RlbC5hdmFpbGFibGUucHVzaChsYW5nKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBtb2RlbC5kYXRhID0gZGF0YTtcbiAgICAgIG1vZGVsLmF2YWlsYWJsZSA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgIH1cblxuICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLmxhbmc6bG9hZGVkJywge1xuICAgICAgbGFuZzogbGFuZ1xuICAgIH0pO1xuICB9XG5cbiAgdGhpcy5pbml0ID0gaW5pdDtcbiAgdGhpcy5sb2FkID0gbG9hZDtcbiAgdGhpcy50cmFuc2xhdGUgPSB0cmFuc2xhdGU7XG4gIHRoaXMuc2V0ID0gc2V0TGFuZ3VhZ2U7XG5cbiAgfV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLnNlcnZpY2UoJ21hcnZpblRhc2tzJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnkpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1vZGVsID0gbWFydmluTWVtb3J5LmdldCgpO1xuXG4gIC8qKlxuICAgKiBMb2FkIGEgdHJhbnNsYXRpb24gdG8gdGhlIHNjb3BlXG4gICAqIEBldmVudCAnbmJCYWxlYmVsZmlzaC5tYXJ2aW46cmVxdWVzdFRyYW5zbGF0aW9uJyBpZiB3ZSBhcmUgaW4gbGF6eSBtb2RlXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGJpbmRUb1Njb3BlKCkge1xuXG4gICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG5cbiAgICAvLyBXZSBkbyBub3Qgd2FudCB0byBoYXZlIG11bHRpcGxlIHJlbG9hZCBpZiB0aGUgbGFuZyBpcyBhbHJlYWR5IHByZXNlbnRcbiAgICBpZiAobWFydmluLmlzTGF6eSgpICYmICFtb2RlbC5kYXRhW2xhbmddKSB7XG4gICAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5tYXJ2aW46cmVxdWVzdFRyYW5zbGF0aW9uJywge1xuICAgICAgICBzdGF0ZTogbW9kZWwuc3RhdGUuY3VycmVudCxcbiAgICAgICAgdXJsOiBtYXJ2aW4uZ2V0TGF6eUNvbmZpZyhsYW5nKS51cmxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNldFRyYW5zbGF0aW9uKCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCB0cmFuc2xhdGlvbnMgdG8gdGhlIHNjb3BlIG9yIHVwZGF0ZSB0aGUgbW9kZWwgaWYgeW91IHNldCBjb25maWcuYmluZFRvU2NvcGUgdG8gZmFsc2UuXG4gICAqIEBldmVudCBuZ0JhYmVsZmlzaC50cmFuc2xhdGlvbjpsb2FkZWRcbiAgICovXG5cbiAgZnVuY3Rpb24gc2V0VHJhbnNsYXRpb24oKSB7XG5cbiAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcbiAgICB2YXIgc3RhdGUgPSBtb2RlbC5zdGF0ZS5jdXJyZW50LFxuICAgICAgICBzdGF0ZUkxOG4sIHRyYW5zbGF0aW9uID0ge307XG5cbiAgICAvLyBQcmV2ZW50IHRvbyBtYW55IHJlbG9hZFxuICAgIGlmIChzdGF0ZSA9PT0gbW9kZWwuc3RhdGUucHJldmlvdXMgJiYgbW9kZWwubGFuZy5jdXJyZW50ID09PSBtb2RlbC5sYW5nLnByZXZpb3VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFtb2RlbC5kYXRhW2xhbmddKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc3RhdGVJMThuID0gbW9kZWwuZGF0YVtsYW5nXVtzdGF0ZV07XG5cbiAgICAvKipcbiAgICAgKiBQcmV2ZW50IHRoZSBlcnJvclxuICAgICAqICAgICA+IFR5cGVFcnJvcjogQ2Fubm90IHJlYWQgcHJvcGVydHkgJyQkaGFzaEtleScgb2YgdW5kZWZpbmVkXG4gICAgICogY2Yge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9kaG9rby9uZ0JhYmVsZmlzaC9pc3N1ZXMvNX1cbiAgICAgKi9cbiAgICBpZiAoIXN0YXRlSTE4bikge1xuICAgICAgbW9kZWwuZGF0YVtsYW5nXVtzdGF0ZV0gPSB7fTtcblxuICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1ttYXJ2aW5UYXNrc0BzZXRUcmFuc2xhdGlvbl0gTm8gdHJhbnNsYXRpb24gYXZhaWxhYmxlIGZvciB0aGUgcGFnZSAlcyBmb3IgdGhlIGxhbmcgJXMnLCBzdGF0ZSwgbGFuZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgYW5ndWxhci5leHRlbmQoXG4gICAgdHJhbnNsYXRpb24sIGFuZ3VsYXIuZXh0ZW5kKHt9LCBtb2RlbC5kYXRhW2xhbmddLl9jb21tb24pLCBzdGF0ZUkxOG4pO1xuXG4gICAgaWYgKG1hcnZpbi5pc0JpbmRUb1Njb3BlKCkpIHtcblxuICAgICAgaWYgKG1hcnZpbi5nZXROYW1lc3BhY2UoKSkge1xuICAgICAgICAkcm9vdFNjb3BlW21hcnZpbi5nZXROYW1lc3BhY2UoKV0gPSB0cmFuc2xhdGlvbjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFuZ3VsYXIuZXh0ZW5kKCRyb290U2NvcGUsIHRyYW5zbGF0aW9uKTtcblxuICAgICAgICBpZiAobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdbbWFydmluVGFza3NAc2V0VHJhbnNsYXRpb25dIEl0IGlzIGJldHRlciB0byBMb2FkIGkxOG4gaW5zaWRlIGEgbmFtZXNwYWNlLicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywge1xuICAgICAgY3VycmVudFN0YXRlOiBzdGF0ZSxcbiAgICAgIGxhbmc6IGxhbmcsXG4gICAgICBwcmV2aW91c0xhbmc6IG1vZGVsLmxhbmcucHJldmlvdXNcbiAgICB9KTtcblxuICB9XG5cbiAgdGhpcy5iaW5kVG9TY29wZSA9IGJpbmRUb1Njb3BlO31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5wcm92aWRlcignbWFydmluJywgZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogRGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciB0aGUgbW9kdWxlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB2YXIgY29uZmlnID0ge1xuICAgIHN0YXRlOiAnaG9tZScsXG4gICAgbGFuZzogJ2VuLUVOJyxcbiAgICB1cmw6ICcvaTE4bi9sYW5ndWFnZXMuanNvbicsXG4gICAgcm91dGVFdmVudE5hbWU6ICckc3RhdGVDaGFuZ2VTdWNjZXNzJyxcbiAgICBuYW1lc3BhY2U6ICdpMThuJyxcbiAgICBsYXp5OiBmYWxzZSxcbiAgICBsYXp5Q29uZmlnOiBbXSxcbiAgICBjdXJyZW50OiAnJyxcbiAgICBsb2c6IHRydWUsXG4gICAgYmluZFRvU2NvcGU6IHRydWVcbiAgfTtcblxuICAvKipcbiAgICogQ29uZmlndXJlIHRoZSBzZXJ2aWNlIHdpdGggYSBwcm92aWRlciBmcm9tIHRoZSBjb25maWcgb2YgeW91ciBtb2R1bGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSBwYXJhbXMgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uIGluaXRCYWJlbGZpc2hDb25maWcocGFyYW1zKSB7XG4gICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBwYXJhbXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgZWFjaCBsYW5ndWFnZSBmb3IgeW91ciBhcHBsaWNhdGlvblxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdCB7bGFuZzogXCJcIix1cmw6IFwiXCJ9XG4gICAqIEByZXR1cm4ge2JhYmVsZmlzaFByb3ZpZGVyfVxuICAgKi9cbiAgdGhpcy5sYW5nID0gZnVuY3Rpb24gbGFuZyhvcHQpIHtcblxuICAgIGlmICghb3B0LmxhbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaFByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IGxhbmcnKTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdC51cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaFByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IHVybCcpO1xuICAgIH1cblxuICAgIGNvbmZpZy5sYXp5ID0gdHJ1ZTtcbiAgICBjb25maWcubGF6eUNvbmZpZy5wdXNoKG9wdCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgdG8gdGhlIHNjb3BlIGFsbCB0cmFuc2xhdGlvbnNcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKiBAcGFyYW0gIHtCb29sZWFufSBpc0JpbmRcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMuYmluZFRvU2NvcGUgPSBmdW5jdGlvbiBiaW5kVG9TY29wZShpc0JpbmQpIHtcbiAgICBjb25maWcuYmluZFRvU2NvcGUgPSBpc0JpbmQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1hcnZpbiBzZXJ2aWNlXG4gICAqL1xuICB0aGlzLiRnZXQgPSBbJyRkb2N1bWVudCcsIGZ1bmN0aW9uICgkZG9jdW1lbnQpIHtcbiAgICByZXR1cm4ge1xuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybiBiYWJlbGZpc2ggY29uZmlndXJhdGlvblxuICAgICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAgICovXG4gICAgICBnZXRDb25maWc6IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJuIHRoZSBkZWZhdWx0IGV2ZW50IG5hbWUgaW4gb3JkZXIgdG8gbGlzdGVuIGEgbmV3IHN0YXRlfHxyb3V0ZVxuICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICovXG4gICAgICBnZXRSb3V0ZUV2ZW50OiBmdW5jdGlvbiBnZXRSb3V0ZUV2ZW50KCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLnJvdXRlRXZlbnROYW1lO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIG5hbWVzcGFjZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0TmFtZXNwYWNlOiBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubmFtZXNwYWNlO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIGxhbmcgZm9yIHlvdXIgYXBwLlxuICAgICAgICogLSBZb3UgY2FuIHVzZSB0aGUgcHJvdmlkZXJcbiAgICAgICAqIC0gWW91IGNhbiB1c2UgaHRtbCBkZWZhdWx0IGF0dHJcbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0RGVmYXVsdExhbmc6IGZ1bmN0aW9uIGdldERlZmF1bHRMYW5nKCkge1xuXG4gICAgICAgIGlmIChjb25maWcubGFuZykge1xuICAgICAgICAgICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyA9IGNvbmZpZy5sYW5nLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyArICctJyArICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgfSxcblxuICAgICAgZ2V0TGF6eUxhbmdBdmFpbGFibGU6IGZ1bmN0aW9uIGdldExhenlMYW5nQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenlDb25maWcubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ubGFuZztcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEdldCB0aGUgbGF6eSBjb25maWd1cmF0aW9uIGZvciBhbnkgbGFuZ1xuICAgICAgICogLSBEZWZhdWx0IGlzIHRoZSBjb25maWcgbGFuZ1xuICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nS2V5XG4gICAgICAgKiBAcmV0dXJuIHtPYmpldH1cbiAgICAgICAqL1xuICAgICAgZ2V0TGF6eUNvbmZpZzogZnVuY3Rpb24gZ2V0TGF6eUNvbmZpZyhsYW5nS2V5KSB7XG5cbiAgICAgICAgdmFyIGxhbmdUb0ZpbmQgPSBsYW5nS2V5IHx8IHRoaXMuZ2V0RGVmYXVsdExhbmcoKTtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLmZpbHRlcihmdW5jdGlvbiAobykge1xuICAgICAgICAgIHJldHVybiBvLmxhbmcgPT09IGxhbmdUb0ZpbmQ7XG4gICAgICAgIH0pWzBdIHx8IHt9O1xuICAgICAgfSxcblxuICAgICAgZ2V0TGF6eUNvbmZpZ0J5VXJsOiBmdW5jdGlvbiBnZXRMYXp5Q29uZmlnQnlVcmwodXJsKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICByZXR1cm4gbyA9PT0gdXJsO1xuICAgICAgICB9KVswXTtcbiAgICAgIH0sXG5cbiAgICAgIGlzVmVyYm9zZTogZnVuY3Rpb24gaXNWZXJib3NlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxvZztcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogU2hvdWxkIHdlIHVzZSB0aGUgbGF6eSBtb2RlIGZvciB0aGUgYXBwbGljYXRpb25cbiAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgKi9cbiAgICAgIGlzTGF6eTogZnVuY3Rpb24gaXNMYXp5KCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenk7XG4gICAgICB9LFxuXG4gICAgICBpc0JpbmRUb1Njb3BlOiBmdW5jdGlvbiBpc0JpbmRUb1Njb3BlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmJpbmRUb1Njb3BlO1xuICAgICAgfSxcblxuICAgICAgaXNTb2xvOiBmdW5jdGlvbiBpc1NvbG8oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbQHRvZG9dIE5lZWQgdG8gaW1wbGVtZW50IHNvbG8gbW9kZScpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfTt9XTtcblxufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9