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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvYmFiZWxmaXNoRXZlbnRzLmpzIiwiZmFjdG9yaWVzL21hcnZpbk1lbW9yeS5qcyIsInByb3ZpZGVycy9tYXJ2aW4uanMiLCJzZXJ2aWNlcy9iYWJlbGZpc2guanMiLCJzZXJ2aWNlcy9iYWJlbGZpc2hMYW5nLmpzIiwic2VydmljZXMvbWFydmluVGFza3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJywgW10pLnJ1bihbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ2JhYmVsZmlzaExhbmcnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2hMYW5nKSB7XG5cbiAgLy8gVXBkYXRlIHRoZSB0cmFuc2xhdGlvbiB3aGVuIHlvdSBjaGFuZ2UgYSBwYWdlXG4gICRyb290U2NvcGUuJG9uKG1hcnZpbi5nZXRSb3V0ZUV2ZW50KCksIGZ1bmN0aW9uIChlLCB0b1N0YXRlKSB7XG4gICAgYmFiZWxmaXNoTGFuZy5pbml0KHRvU3RhdGUubmFtZSk7XG4gIH0pO31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5kaXJlY3RpdmUoJ2kxOG5CaW5kJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdiYWJlbGZpc2gnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2gpIHtcblxuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICB0cmFuc2xhdGlvbktleTogJz1pMThuQmluZCcsXG4gICAgICB0cmFuc2xhdGlvbkxhbmc6ICdAaTE4bkJpbmRMYW5nJ1xuICAgIH0sXG4gICAgdGVtcGxhdGU6ICd7e3RyYW5zbGF0aW9uS2V5fX0nLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcblxuICAgICAgdmFyIGtleSA9ICcnLFxuICAgICAgICAgIG5hbWVzcGFjZSA9IG1hcnZpbi5nZXROYW1lc3BhY2UoKTtcblxuICAgICAga2V5ID0gKG5hbWVzcGFjZSkgPyBhdHRyLmkxOG5CaW5kLnJlcGxhY2UobmFtZXNwYWNlICsgJy4nLCAnJykgOiBhdHRyLmkxOG5CaW5kO1xuXG4gICAgICAvLyBCZWNhdXNlIGl0IGJyZWFrcyBpZiB5b3UgdXBkYXRlIHRyYW5zbGF0aW9uS2V5Li4uXG4gICAgICBpZiAoYXR0ci5pMThuQmluZExhbmcpIHtcblxuICAgICAgICBpZiAoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChhdHRyLmkxOG5CaW5kTGFuZykpIHtcbiAgICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSBiYWJlbGZpc2guZ2V0KGF0dHIuaTE4bkJpbmRMYW5nKTtcbiAgICAgICAgICByZXR1cm4gZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdG9kbyBSZW1vdmUgZXZlbnQgbGlzdGVuZXIsIHRvbyBtYW55IGxpc3RlbmVycyAhXG4gICAgICAgICAqL1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgICAgICAgIGlmIChiYWJlbGZpc2guaXNMYW5nTG9hZGVkKGF0dHIuaTE4bkJpbmRMYW5nKSkge1xuICAgICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChhdHRyLmkxOG5CaW5kTGFuZyk7XG4gICAgICAgICAgICBlbC50ZXh0KHRyYW5zbGF0aW9uW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmRpcmVjdGl2ZSgnaTE4bkxvYWQnLCBbJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uIChiYWJlbGZpc2gpIHtcblxuICByZXR1cm4ge1xuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcbiAgICAgIGVsLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBiYWJlbGZpc2gudXBkYXRlTGFuZyhhdHRyLmkxOG5Mb2FkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pO1xuICAgIH1cbiAgfX1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5mYWN0b3J5KCdiYWJlbGZpc2hFdmVudCcsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBldmVudHMgPSB7fTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBhbiBldmVudFxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGV2ZW50TmFtZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50TmFtZSkge1xuICAgIChldmVudHNbZXZlbnROYW1lXSB8fCBhbmd1bGFyLm5vb3ApKCk7XG4gIH1cblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICBpZiAoZGF0YS5wcmV2aW91c0xhbmcgIT09IGRhdGEubGFuZykge1xuICAgICAgdHJpZ2dlcignY2hhbmdlOmxhbmd1YWdlJyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIFJlY29yZCBhIGV2ZW50TGlzdGVuZXJcbiAgICAgKiBFdmVudCBhdmFpbGFibGU6XG4gICAgICogICAtIGNoYW5nZTpsYW5ndWFnZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgIGV2ZW50TmFtZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICAgICAgICBjYWxsYmFjayB0byByZWNvcmRcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uIChldmVudE5hbWUsIGNiKSB7XG4gICAgICBldmVudHNbZXZlbnROYW1lXSA9IGNiO1xuICAgIH1cbiAgfTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZmFjdG9yeSgnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbWVtb3J5ID0ge1xuICAgIHN0YXRlOiB7XG4gICAgICBjdXJyZW50OiAnJyxcbiAgICAgIGxvYWRlZDogZmFsc2VcbiAgICB9LFxuICAgIGxhbmc6IHtcbiAgICAgIHByZXZpb3VzOiAnZW4tRU4nLFxuICAgICAgY3VycmVudDogJ2VuLUVOJ1xuICAgIH0sXG4gICAgZGF0YTogbnVsbCxcbiAgICBhdmFpbGFibGU6IFtdLFxuICAgIGFjdGl2ZTogZmFsc2VcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1lbW9yeTtcbiAgICB9XG4gIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5wcm92aWRlcignbWFydmluJywgZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogRGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciB0aGUgbW9kdWxlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB2YXIgY29uZmlnID0ge1xuICAgIHN0YXRlOiAnaG9tZScsXG4gICAgbGFuZzogJ2VuLUVOJyxcbiAgICB1cmw6ICcvaTE4bi9sYW5ndWFnZXMuanNvbicsXG4gICAgcm91dGVFdmVudE5hbWU6ICckc3RhdGVDaGFuZ2VTdWNjZXNzJyxcbiAgICBuYW1lc3BhY2U6ICdpMThuJyxcbiAgICBsYXp5OiBmYWxzZSxcbiAgICBsYXp5Q29uZmlnOiBbXSxcbiAgICBjdXJyZW50OiAnJyxcbiAgICBsb2c6IHRydWUsXG4gICAgYmluZFRvU2NvcGU6IHRydWVcbiAgfTtcblxuICAvKipcbiAgICogQ29uZmlndXJlIHRoZSBzZXJ2aWNlIHdpdGggYSBwcm92aWRlciBmcm9tIHRoZSBjb25maWcgb2YgeW91ciBtb2R1bGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSBwYXJhbXMgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uIGluaXRCYWJlbGZpc2hDb25maWcocGFyYW1zKSB7XG4gICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBwYXJhbXMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgZWFjaCBsYW5ndWFnZSBmb3IgeW91ciBhcHBsaWNhdGlvblxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdCB7bGFuZzogXCJcIix1cmw6IFwiXCJ9XG4gICAqIEByZXR1cm4ge2JhYmVsZmlzaFByb3ZpZGVyfVxuICAgKi9cbiAgdGhpcy5sYW5nID0gZnVuY3Rpb24gbGFuZyhvcHQpIHtcblxuICAgIGlmICghb3B0LmxhbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaFByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IGxhbmcnKTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdC51cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignW2JhYmVsZmlzaFByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IHVybCcpO1xuICAgIH1cblxuICAgIGNvbmZpZy5sYXp5ID0gdHJ1ZTtcbiAgICBjb25maWcubGF6eUNvbmZpZy5wdXNoKG9wdCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgdG8gdGhlIHNjb3BlIGFsbCB0cmFuc2xhdGlvbnNcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKiBAcGFyYW0gIHtCb29sZWFufSBpc0JpbmRcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMuYmluZFRvU2NvcGUgPSBmdW5jdGlvbiBiaW5kVG9TY29wZShpc0JpbmQpIHtcbiAgICBjb25maWcuYmluZFRvU2NvcGUgPSBpc0JpbmQ7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1hcnZpbiBzZXJ2aWNlXG4gICAqL1xuICB0aGlzLiRnZXQgPSBbJyRkb2N1bWVudCcsIGZ1bmN0aW9uICgkZG9jdW1lbnQpIHtcbiAgICByZXR1cm4ge1xuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybiBiYWJlbGZpc2ggY29uZmlndXJhdGlvblxuICAgICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAgICovXG4gICAgICBnZXRDb25maWc6IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJuIHRoZSBkZWZhdWx0IGV2ZW50IG5hbWUgaW4gb3JkZXIgdG8gbGlzdGVuIGEgbmV3IHN0YXRlfHxyb3V0ZVxuICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICovXG4gICAgICBnZXRSb3V0ZUV2ZW50OiBmdW5jdGlvbiBnZXRSb3V0ZUV2ZW50KCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLnJvdXRlRXZlbnROYW1lO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIG5hbWVzcGFjZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0TmFtZXNwYWNlOiBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubmFtZXNwYWNlO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIGxhbmcgZm9yIHlvdXIgYXBwLlxuICAgICAgICogLSBZb3UgY2FuIHVzZSB0aGUgcHJvdmlkZXJcbiAgICAgICAqIC0gWW91IGNhbiB1c2UgaHRtbCBkZWZhdWx0IGF0dHJcbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0RGVmYXVsdExhbmc6IGZ1bmN0aW9uIGdldERlZmF1bHRMYW5nKCkge1xuXG4gICAgICAgIGlmIChjb25maWcubGFuZykge1xuICAgICAgICAgICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyA9IGNvbmZpZy5sYW5nLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyArICctJyArICRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgfSxcblxuICAgICAgZ2V0TGF6eUxhbmdBdmFpbGFibGU6IGZ1bmN0aW9uIGdldExhenlMYW5nQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenlDb25maWcubWFwKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZW0ubGFuZztcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEdldCB0aGUgbGF6eSBjb25maWd1cmF0aW9uIGZvciBhbnkgbGFuZ1xuICAgICAgICogLSBEZWZhdWx0IGlzIHRoZSBjb25maWcgbGFuZ1xuICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nS2V5XG4gICAgICAgKiBAcmV0dXJuIHtPYmpldH1cbiAgICAgICAqL1xuICAgICAgZ2V0TGF6eUNvbmZpZzogZnVuY3Rpb24gZ2V0TGF6eUNvbmZpZyhsYW5nS2V5KSB7XG5cbiAgICAgICAgdmFyIGxhbmdUb0ZpbmQgPSBsYW5nS2V5IHx8IHRoaXMuZ2V0RGVmYXVsdExhbmcoKTtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLmZpbHRlcihmdW5jdGlvbiAobykge1xuICAgICAgICAgIHJldHVybiBvLmxhbmcgPT09IGxhbmdUb0ZpbmQ7XG4gICAgICAgIH0pWzBdIHx8IHt9O1xuICAgICAgfSxcblxuICAgICAgZ2V0TGF6eUNvbmZpZ0J5VXJsOiBmdW5jdGlvbiBnZXRMYXp5Q29uZmlnQnlVcmwodXJsKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICByZXR1cm4gbyA9PT0gdXJsO1xuICAgICAgICB9KVswXTtcbiAgICAgIH0sXG5cbiAgICAgIGlzVmVyYm9zZTogZnVuY3Rpb24gaXNWZXJib3NlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxvZztcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogU2hvdWxkIHdlIHVzZSB0aGUgbGF6eSBtb2RlIGZvciB0aGUgYXBwbGljYXRpb25cbiAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgKi9cbiAgICAgIGlzTGF6eTogZnVuY3Rpb24gaXNMYXp5KCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenk7XG4gICAgICB9LFxuXG4gICAgICBpc0JpbmRUb1Njb3BlOiBmdW5jdGlvbiBpc0JpbmRUb1Njb3BlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmJpbmRUb1Njb3BlO1xuICAgICAgfSxcblxuICAgICAgaXNTb2xvOiBmdW5jdGlvbiBpc1NvbG8oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbQHRvZG9dIE5lZWQgdG8gaW1wbGVtZW50IHNvbG8gbW9kZScpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfTt9XTtcblxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuc2VydmljZSgnYmFiZWxmaXNoJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCAnYmFiZWxmaXNoTGFuZycsICdtYXJ2aW5UYXNrcycsICdiYWJlbGZpc2hFdmVudCcsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIG1hcnZpbk1lbW9yeSwgYmFiZWxmaXNoTGFuZywgbWFydmluVGFza3MsIGJhYmVsZmlzaEV2ZW50KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBjdXJyZW50IHN0YXRlIHRyYW5zbGF0aW9uXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGdldChsYW5nKSB7XG5cbiAgICB2YXIgY3VycmVudExhbmcgPSBtb2RlbC5kYXRhW2xhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50XSB8fCB7fSxcbiAgICAgICAgY29tbW9uID0ge307XG5cbiAgICBpZiAoIWN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdKSB7XG5cbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbbmdCYWJlbGZpc2gtdHJhbnNsYXRvckBnZXRdIE5vIHRyYW5zbGF0aW9uIGF2YWlsYWJsZSBmb3IgdGhlIHBhZ2UgJXMgZm9yIHRoZSBsYW5nICVzJywgbW9kZWwuc3RhdGUuY3VycmVudCwgKGxhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50KSk7XG4gICAgICB9XG4gICAgICBjdXJyZW50TGFuZ1ttb2RlbC5zdGF0ZS5jdXJyZW50XSA9IHt9O1xuICAgIH1cblxuICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbW1vbiwge30sIGN1cnJlbnRMYW5nLl9jb21tb24pO1xuICAgIHJldHVybiBhbmd1bGFyLmV4dGVuZChjb21tb24sIGN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYWxsIHRyYW5zbGF0aW9ucyBhdmFpbGFibGUgZm9yIGEgbGFuZ1xuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cblxuICBmdW5jdGlvbiBhbGwobGFuZykge1xuICAgIHJldHVybiBtb2RlbC5kYXRhW2xhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50XTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gZWFjaCB0cmFuc2xhdGlvbnMgYXZhaWxhYmxlIGZvciB5b3VyIGFwcFxuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIHRyYW5zbGF0aW9ucygpIHtcbiAgICByZXR1cm4gbW9kZWwuZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB5b3UgYWxyZWFkeSBsb2FkIHRoaXMgbGFuZ1xuICAgKiBAcGFyYW0gIHtTdHJpbmd9ICBsYW5nXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGlzTGFuZ0xvYWRlZChsYW5nKSB7XG4gICAgcmV0dXJuIG1vZGVsLmRhdGEgJiYgISEgbW9kZWwuZGF0YVtsYW5nXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgTGFuZ3VhZ2VcbiAgICogQHJldHVybiB7U3RyaW5nfSBsYW5nXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIG1vZGVsLmxhbmcuY3VycmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB3ZSBoYXZlIGxvYWRlZCBpMThuXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGlzTG9hZGVkKCkge1xuICAgIHJldHVybiBtb2RlbC5hY3RpdmU7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBlYWNoIGxhbmd1YWdlIGF2YWlsYWJsZSBpbiBiYWJlbGZpc2hcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGdldExhbmd1YWdlcygpIHtcblxuICAgIGlmIChtb2RlbC5hdmFpbGFibGUuaW5kZXhPZignX2NvbW9uJykgPiAtMSkge1xuICAgICAgbW9kZWwuYXZhaWxhYmxlLnNwbGljZShtb2RlbC5hdmFpbGFibGUuaW5kZXhPZignX2NvbW9uJyksIDEpO1xuICAgIH1cbiAgICByZXR1cm4gbW9kZWwuYXZhaWxhYmxlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgY3VycmVudCBsYW5ndWFnZVxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG5cbiAgZnVuY3Rpb24gdXBkYXRlTGFuZyhsYW5nKSB7XG4gICAgYmFiZWxmaXNoTGFuZy5zZXQobGFuZywgbWFydmluVGFza3MuYmluZFRvU2NvcGUpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQ6IGdldCxcbiAgICBhbGw6IGFsbCxcbiAgICBjdXJyZW50OiBjdXJyZW50LFxuICAgIHRyYW5zbGF0aW9uczogdHJhbnNsYXRpb25zLFxuICAgIGxhbmd1YWdlczogZ2V0TGFuZ3VhZ2VzLFxuICAgIGlzTGFuZ0xvYWRlZDogaXNMYW5nTG9hZGVkLFxuICAgIGlzTG9hZGVkOiBpc0xvYWRlZCxcbiAgICB1cGRhdGVMYW5nOiB1cGRhdGVMYW5nLFxuICAgIG9uOiBiYWJlbGZpc2hFdmVudC5zZXRcbiAgfTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuc2VydmljZSgnYmFiZWxmaXNoTGFuZycsIFsnJGh0dHAnLCAnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgJ21hcnZpblRhc2tzJywgZnVuY3Rpb24gKCRodHRwLCAkcm9vdFNjb3BlLCBtYXJ2aW4sIG1hcnZpbk1lbW9yeSwgbWFydmluVGFza3MpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1vZGVsID0gbWFydmluTWVtb3J5LmdldCgpO1xuXG4gICRyb290U2NvcGUuJG9uKCduZ0JhYmVsZmlzaC5tYXJ2aW46cmVxdWVzdFRyYW5zbGF0aW9uJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICBpbml0KGRhdGEuc3RhdGUsIGRhdGEudXJsKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gaW5pdChzdGF0ZU5hbWUsIHVybCkge1xuICAgIG1vZGVsLnN0YXRlLmN1cnJlbnQgPSBzdGF0ZU5hbWU7XG5cbiAgICBpZiAoIW1hcnZpbi5pc0JpbmRUb1Njb3BlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2FkKCkudGhlbihtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRMYW5ndWFnZShsYW5nLCBjYikge1xuICAgIGNiID0gY2IgfHwgYW5ndWxhci5ub29wO1xuICAgIG1vZGVsLmxhbmcucHJldmlvdXMgPSBhbmd1bGFyLmNvcHkobW9kZWwubGFuZy5jdXJyZW50KTtcbiAgICBtb2RlbC5sYW5nLmN1cnJlbnQgPSBsYW5nO1xuICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLmxhbmc6c2V0TGFuZ3VhZ2UnLCBtb2RlbC5jdXJyZW50KTtcbiAgICBjYigpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZCh1cmwpIHtcblxuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuICAgIHVybCA9IHVybCB8fCBtYXJ2aW4uZ2V0Q29uZmlnKCkudXJsO1xuXG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSkge1xuICAgICAgdXJsID0gbWFydmluLmdldExhenlDb25maWcobW9kZWwubGFuZy5jdXJyZW50IHx8IG1hcnZpbi5nZXRDb25maWcoKS5sYW5nKS51cmw7XG4gICAgfVxuXG4gICAgcmV0dXJuICRodHRwLmdldCh1cmwpLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbYmFiZWxmaXNoTGFuZ3JAbG9hZF0gQ2Fubm90IGxvYWQgdGhlIHRyYW5zbGF0aW9uIGZpbGUnKTtcbiAgICAgIH1cbiAgICB9KS5zdWNjZXNzKHRyYW5zbGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFuc2xhdGUoZGF0YSkge1xuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSkge1xuICAgICAgbW9kZWwuZGF0YSA9IHt9O1xuICAgICAgbW9kZWwuZGF0YVtsYW5nXSA9IGRhdGE7XG5cbiAgICAgIGlmICgtMSA9PT0gbW9kZWwuYXZhaWxhYmxlLmluZGV4T2YobGFuZykpIHtcbiAgICAgICAgbW9kZWwuYXZhaWxhYmxlLnB1c2gobGFuZyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgbW9kZWwuZGF0YSA9IGRhdGE7XG4gICAgICBtb2RlbC5hdmFpbGFibGUgPSBPYmplY3Qua2V5cyhkYXRhKTtcbiAgICB9XG5cbiAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOmxvYWRlZCcsIHtcbiAgICAgIGxhbmc6IGxhbmdcbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMuaW5pdCA9IGluaXQ7XG4gIHRoaXMubG9hZCA9IGxvYWQ7XG4gIHRoaXMudHJhbnNsYXRlID0gdHJhbnNsYXRlO1xuICB0aGlzLnNldCA9IHNldExhbmd1YWdlO1xuXG4gIH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdtYXJ2aW5UYXNrcycsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAvKipcbiAgICogTG9hZCBhIHRyYW5zbGF0aW9uIHRvIHRoZSBzY29wZVxuICAgKiBAZXZlbnQgJ25iQmFsZWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicgaWYgd2UgYXJlIGluIGxhenkgbW9kZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiBiaW5kVG9TY29wZSgpIHtcblxuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgLy8gV2UgZG8gbm90IHdhbnQgdG8gaGF2ZSBtdWx0aXBsZSByZWxvYWQgaWYgdGhlIGxhbmcgaXMgYWxyZWFkeSBwcmVzZW50XG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSAmJiAhbW9kZWwuZGF0YVtsYW5nXSkge1xuICAgICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIHtcbiAgICAgICAgc3RhdGU6IG1vZGVsLnN0YXRlLmN1cnJlbnQsXG4gICAgICAgIHVybDogbWFydmluLmdldExhenlDb25maWcobGFuZykudXJsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRUcmFuc2xhdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgdHJhbnNsYXRpb25zIHRvIHRoZSBzY29wZSBvciB1cGRhdGUgdGhlIG1vZGVsIGlmIHlvdSBzZXQgY29uZmlnLmJpbmRUb1Njb3BlIHRvIGZhbHNlLlxuICAgKiBAZXZlbnQgbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKCkge1xuXG4gICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgdmFyIHN0YXRlID0gbW9kZWwuc3RhdGUuY3VycmVudCxcbiAgICAgICAgc3RhdGVJMThuLCB0cmFuc2xhdGlvbiA9IHt9O1xuXG4gICAgLy8gUHJldmVudCB0b28gbWFueSByZWxvYWRcbiAgICBpZiAoc3RhdGUgPT09IG1vZGVsLnN0YXRlLnByZXZpb3VzICYmIG1vZGVsLmxhbmcuY3VycmVudCA9PT0gbW9kZWwubGFuZy5wcmV2aW91cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbW9kZWwuZGF0YVtsYW5nXSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN0YXRlSTE4biA9IG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdO1xuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0aGUgZXJyb3JcbiAgICAgKiAgICAgPiBUeXBlRXJyb3I6IENhbm5vdCByZWFkIHByb3BlcnR5ICckJGhhc2hLZXknIG9mIHVuZGVmaW5lZFxuICAgICAqIGNmIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZGhva28vbmdCYWJlbGZpc2gvaXNzdWVzLzV9XG4gICAgICovXG4gICAgaWYgKCFzdGF0ZUkxOG4pIHtcbiAgICAgIG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdID0ge307XG5cbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbbWFydmluVGFza3NAc2V0VHJhbnNsYXRpb25dIE5vIHRyYW5zbGF0aW9uIGF2YWlsYWJsZSBmb3IgdGhlIHBhZ2UgJXMgZm9yIHRoZSBsYW5nICVzJywgc3RhdGUsIGxhbmcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIuZXh0ZW5kKFxuICAgIHRyYW5zbGF0aW9uLCBhbmd1bGFyLmV4dGVuZCh7fSwgbW9kZWwuZGF0YVtsYW5nXS5fY29tbW9uKSwgc3RhdGVJMThuKTtcblxuICAgIGlmIChtYXJ2aW4uaXNCaW5kVG9TY29wZSgpKSB7XG5cbiAgICAgIGlmIChtYXJ2aW4uZ2V0TmFtZXNwYWNlKCkpIHtcbiAgICAgICAgJHJvb3RTY29wZVttYXJ2aW4uZ2V0TmFtZXNwYWNlKCldID0gdHJhbnNsYXRpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkcm9vdFNjb3BlLCB0cmFuc2xhdGlvbik7XG5cbiAgICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignW21hcnZpblRhc2tzQHNldFRyYW5zbGF0aW9uXSBJdCBpcyBiZXR0ZXIgdG8gTG9hZCBpMThuIGluc2lkZSBhIG5hbWVzcGFjZS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLnRyYW5zbGF0aW9uOmxvYWRlZCcsIHtcbiAgICAgIGN1cnJlbnRTdGF0ZTogc3RhdGUsXG4gICAgICBsYW5nOiBsYW5nLFxuICAgICAgcHJldmlvdXNMYW5nOiBtb2RlbC5sYW5nLnByZXZpb3VzXG4gICAgfSk7XG5cbiAgfVxuXG4gIHRoaXMuYmluZFRvU2NvcGUgPSBiaW5kVG9TY29wZTt9XSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9