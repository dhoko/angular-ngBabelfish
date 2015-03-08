angular.module('ngBabelfish', []).run(['$rootScope', 'marvin', 'babelfishLang', function ($rootScope, marvin, babelfishLang) {

  // Load translations onLoad
  babelfishLang.init();

  // Update the translation when you change a page
  $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
    babelfishLang.bindForState(toState.name);
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
angular.module('ngBabelfish').filter('translate', ['babelfish', function (babelfish) {

  'use strict';

  /**
   * transalte filter
   * Translate a string to another language
   * {{ name | translate:'fr-FR':"name"}}
   * @param {String} input Input value to transalte
   * @param {String} lang Lang to translate (optional)
   */

  function filter(input, lang) {
    return babelfish.get(lang)[input];
  }

  filter.$stateful = true;

  return filter;}]);
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
   * Set the route event Name to listen to
   * @default $stateChangeSuccess
   * @param  {String} eventName
   * @return {void}
   */
  this.routingEvent = function routingEvent(eventName) {
    config.routeEventName = eventName;
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

    setState(stateName);

    if (!marvin.isBindToScope()) {
      return;
    }

    load().then(marvinTasks.bindToScope);
  }

  function bindForState(stateName) {
    setState(stateName);

    if (!marvin.isBindToScope()) {
      return;
    }

    marvinTasks.bindToScope(stateName);
  }

  function setState(stateName) {
    model.state.current = stateName;
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
  this.bindForState = bindForState;
  this.setState = setState;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvYmFiZWxmaXNoRXZlbnRzLmpzIiwiZmFjdG9yaWVzL21hcnZpbk1lbW9yeS5qcyIsImZpbHRlcnMvdHJhbnNsYXRlLmpzIiwicHJvdmlkZXJzL21hcnZpbi5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaC5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaExhbmcuanMiLCJzZXJ2aWNlcy9tYXJ2aW5UYXNrcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJywgW10pLnJ1bihbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ2JhYmVsZmlzaExhbmcnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2hMYW5nKSB7XG5cbiAgLy8gTG9hZCB0cmFuc2xhdGlvbnMgb25Mb2FkXG4gIGJhYmVsZmlzaExhbmcuaW5pdCgpO1xuXG4gIC8vIFVwZGF0ZSB0aGUgdHJhbnNsYXRpb24gd2hlbiB5b3UgY2hhbmdlIGEgcGFnZVxuICAkcm9vdFNjb3BlLiRvbihtYXJ2aW4uZ2V0Um91dGVFdmVudCgpLCBmdW5jdGlvbiAoZSwgdG9TdGF0ZSkge1xuICAgIGJhYmVsZmlzaExhbmcuYmluZEZvclN0YXRlKHRvU3RhdGUubmFtZSk7XG4gIH0pO31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5kaXJlY3RpdmUoJ2kxOG5CaW5kJywgWyckcm9vdFNjb3BlJywgJ21hcnZpbicsICdiYWJlbGZpc2gnLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgbWFydmluLCBiYWJlbGZpc2gpIHtcblxuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICB0cmFuc2xhdGlvbktleTogJz1pMThuQmluZCcsXG4gICAgICB0cmFuc2xhdGlvbkxhbmc6ICdAaTE4bkJpbmRMYW5nJ1xuICAgIH0sXG4gICAgdGVtcGxhdGU6ICd7e3RyYW5zbGF0aW9uS2V5fX0nLFxuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcblxuICAgICAgdmFyIGtleSA9ICcnLFxuICAgICAgICAgIG5hbWVzcGFjZSA9IG1hcnZpbi5nZXROYW1lc3BhY2UoKTtcblxuICAgICAga2V5ID0gKG5hbWVzcGFjZSkgPyBhdHRyLmkxOG5CaW5kLnJlcGxhY2UobmFtZXNwYWNlICsgJy4nLCAnJykgOiBhdHRyLmkxOG5CaW5kO1xuXG4gICAgICAvLyBCZWNhdXNlIGl0IGJyZWFrcyBpZiB5b3UgdXBkYXRlIHRyYW5zbGF0aW9uS2V5Li4uXG4gICAgICBpZiAoYXR0ci5pMThuQmluZExhbmcpIHtcblxuICAgICAgICBpZiAoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChhdHRyLmkxOG5CaW5kTGFuZykpIHtcbiAgICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSBiYWJlbGZpc2guZ2V0KGF0dHIuaTE4bkJpbmRMYW5nKTtcbiAgICAgICAgICByZXR1cm4gZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdG9kbyBSZW1vdmUgZXZlbnQgbGlzdGVuZXIsIHRvbyBtYW55IGxpc3RlbmVycyAhXG4gICAgICAgICAqL1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgICAgICAgIGlmIChiYWJlbGZpc2guaXNMYW5nTG9hZGVkKGF0dHIuaTE4bkJpbmRMYW5nKSkge1xuICAgICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChhdHRyLmkxOG5CaW5kTGFuZyk7XG4gICAgICAgICAgICBlbC50ZXh0KHRyYW5zbGF0aW9uW2tleV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmRpcmVjdGl2ZSgnaTE4bkxvYWQnLCBbJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uIChiYWJlbGZpc2gpIHtcblxuICByZXR1cm4ge1xuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcbiAgICAgIGVsLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBiYWJlbGZpc2gudXBkYXRlTGFuZyhhdHRyLmkxOG5Mb2FkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pO1xuICAgIH1cbiAgfX1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5mYWN0b3J5KCdiYWJlbGZpc2hFdmVudCcsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBldmVudHMgPSB7fTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBhbiBldmVudFxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGV2ZW50TmFtZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50TmFtZSkge1xuICAgIChldmVudHNbZXZlbnROYW1lXSB8fCBhbmd1bGFyLm5vb3ApKCk7XG4gIH1cblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICBpZiAoZGF0YS5wcmV2aW91c0xhbmcgIT09IGRhdGEubGFuZykge1xuICAgICAgdHJpZ2dlcignY2hhbmdlOmxhbmd1YWdlJyk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIFJlY29yZCBhIGV2ZW50TGlzdGVuZXJcbiAgICAgKiBFdmVudCBhdmFpbGFibGU6XG4gICAgICogICAtIGNoYW5nZTpsYW5ndWFnZVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSAgIGV2ZW50TmFtZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiICAgICAgICBjYWxsYmFjayB0byByZWNvcmRcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uIChldmVudE5hbWUsIGNiKSB7XG4gICAgICBldmVudHNbZXZlbnROYW1lXSA9IGNiO1xuICAgIH1cbiAgfTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZmFjdG9yeSgnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbWVtb3J5ID0ge1xuICAgIHN0YXRlOiB7XG4gICAgICBjdXJyZW50OiAnJyxcbiAgICAgIGxvYWRlZDogZmFsc2VcbiAgICB9LFxuICAgIGxhbmc6IHtcbiAgICAgIHByZXZpb3VzOiAnZW4tRU4nLFxuICAgICAgY3VycmVudDogJ2VuLUVOJ1xuICAgIH0sXG4gICAgZGF0YTogbnVsbCxcbiAgICBhdmFpbGFibGU6IFtdLFxuICAgIGFjdGl2ZTogZmFsc2VcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1lbW9yeTtcbiAgICB9XG4gIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5maWx0ZXIoJ3RyYW5zbGF0ZScsIFsnYmFiZWxmaXNoJywgZnVuY3Rpb24gKGJhYmVsZmlzaCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogdHJhbnNhbHRlIGZpbHRlclxuICAgKiBUcmFuc2xhdGUgYSBzdHJpbmcgdG8gYW5vdGhlciBsYW5ndWFnZVxuICAgKiB7eyBuYW1lIHwgdHJhbnNsYXRlOidmci1GUic6XCJuYW1lXCJ9fVxuICAgKiBAcGFyYW0ge1N0cmluZ30gaW5wdXQgSW5wdXQgdmFsdWUgdG8gdHJhbnNhbHRlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBsYW5nIExhbmcgdG8gdHJhbnNsYXRlIChvcHRpb25hbClcbiAgICovXG5cbiAgZnVuY3Rpb24gZmlsdGVyKGlucHV0LCBsYW5nKSB7XG4gICAgcmV0dXJuIGJhYmVsZmlzaC5nZXQobGFuZylbaW5wdXRdO1xuICB9XG5cbiAgZmlsdGVyLiRzdGF0ZWZ1bCA9IHRydWU7XG5cbiAgcmV0dXJuIGZpbHRlcjt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykucHJvdmlkZXIoJ21hcnZpbicsIGZ1bmN0aW9uICgpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIERlZmF1bHQgY29uZmlndXJhdGlvbiBmb3IgdGhlIG1vZHVsZVxuICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgKi9cbiAgdmFyIGNvbmZpZyA9IHtcbiAgICBzdGF0ZTogJ2hvbWUnLFxuICAgIGxhbmc6ICdlbi1FTicsXG4gICAgdXJsOiAnL2kxOG4vbGFuZ3VhZ2VzLmpzb24nLFxuICAgIHJvdXRlRXZlbnROYW1lOiAnJHN0YXRlQ2hhbmdlU3VjY2VzcycsXG4gICAgbmFtZXNwYWNlOiAnaTE4bicsXG4gICAgbGF6eTogZmFsc2UsXG4gICAgbGF6eUNvbmZpZzogW10sXG4gICAgY3VycmVudDogJycsXG4gICAgbG9nOiB0cnVlLFxuICAgIGJpbmRUb1Njb3BlOiB0cnVlXG4gIH07XG5cbiAgLyoqXG4gICAqIENvbmZpZ3VyZSB0aGUgc2VydmljZSB3aXRoIGEgcHJvdmlkZXIgZnJvbSB0aGUgY29uZmlnIG9mIHlvdXIgbW9kdWxlXG4gICAqIEBwYXJhbSAge09iamVjdH0gcGFyYW1zIENvbmZpZ3VyYXRpb24gb2JqZWN0XG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICB0aGlzLmluaXQgPSBmdW5jdGlvbiBpbml0QmFiZWxmaXNoQ29uZmlnKHBhcmFtcykge1xuICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgcGFyYW1zKTtcbiAgfTtcblxuICAvKipcbiAgICogQWRkIGVhY2ggbGFuZ3VhZ2UgZm9yIHlvdXIgYXBwbGljYXRpb25cbiAgICogQHBhcmFtICB7T2JqZWN0fSBvcHQge2xhbmc6IFwiXCIsdXJsOiBcIlwifVxuICAgKiBAcmV0dXJuIHtiYWJlbGZpc2hQcm92aWRlcn1cbiAgICovXG4gIHRoaXMubGFuZyA9IGZ1bmN0aW9uIGxhbmcob3B0KSB7XG5cbiAgICBpZiAoIW9wdC5sYW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tiYWJlbGZpc2hQcm92aWRlckBsYW5nXSBZb3UgbXVzdCBzZXQgdGhlIGtleSBsYW5nJyk7XG4gICAgfVxuXG4gICAgaWYgKCFvcHQudXJsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tiYWJlbGZpc2hQcm92aWRlckBsYW5nXSBZb3UgbXVzdCBzZXQgdGhlIGtleSB1cmwnKTtcbiAgICB9XG5cbiAgICBjb25maWcubGF6eSA9IHRydWU7XG4gICAgY29uZmlnLmxhenlDb25maWcucHVzaChvcHQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBCaW5kIHRvIHRoZSBzY29wZSBhbGwgdHJhbnNsYXRpb25zXG4gICAqIEBkZWZhdWx0IHRydWVcbiAgICogQHBhcmFtICB7Qm9vbGVhbn0gaXNCaW5kXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICB0aGlzLmJpbmRUb1Njb3BlID0gZnVuY3Rpb24gYmluZFRvU2NvcGUoaXNCaW5kKSB7XG4gICAgY29uZmlnLmJpbmRUb1Njb3BlID0gaXNCaW5kO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHJvdXRlIGV2ZW50IE5hbWUgdG8gbGlzdGVuIHRvXG4gICAqIEBkZWZhdWx0ICRzdGF0ZUNoYW5nZVN1Y2Nlc3NcbiAgICogQHBhcmFtICB7U3RyaW5nfSBldmVudE5hbWVcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMucm91dGluZ0V2ZW50ID0gZnVuY3Rpb24gcm91dGluZ0V2ZW50KGV2ZW50TmFtZSkge1xuICAgIGNvbmZpZy5yb3V0ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcbiAgfTtcblxuICAvKipcbiAgICogTWFydmluIHNlcnZpY2VcbiAgICovXG4gIHRoaXMuJGdldCA9IFsnJGRvY3VtZW50JywgZnVuY3Rpb24gKCRkb2N1bWVudCkge1xuICAgIHJldHVybiB7XG5cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJuIGJhYmVsZmlzaCBjb25maWd1cmF0aW9uXG4gICAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICAgKi9cbiAgICAgIGdldENvbmZpZzogZnVuY3Rpb24gZ2V0Q29uZmlnKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm4gdGhlIGRlZmF1bHQgZXZlbnQgbmFtZSBpbiBvcmRlciB0byBsaXN0ZW4gYSBuZXcgc3RhdGV8fHJvdXRlXG4gICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgKi9cbiAgICAgIGdldFJvdXRlRXZlbnQ6IGZ1bmN0aW9uIGdldFJvdXRlRXZlbnQoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcucm91dGVFdmVudE5hbWU7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEdldCB0aGUgbmFtZXNwYWNlIG9mIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICovXG4gICAgICBnZXROYW1lc3BhY2U6IGZ1bmN0aW9uIGdldE5hbWVzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5uYW1lc3BhY2U7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEdldCB0aGUgbGFuZyBmb3IgeW91ciBhcHAuXG4gICAgICAgKiAtIFlvdSBjYW4gdXNlIHRoZSBwcm92aWRlclxuICAgICAgICogLSBZb3UgY2FuIHVzZSBodG1sIGRlZmF1bHQgYXR0clxuICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICovXG4gICAgICBnZXREZWZhdWx0TGFuZzogZnVuY3Rpb24gZ2V0RGVmYXVsdExhbmcoKSB7XG5cbiAgICAgICAgaWYgKGNvbmZpZy5sYW5nKSB7XG4gICAgICAgICAgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nID0gY29uZmlnLmxhbmcuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLmxhbmc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nICsgJy0nICsgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nLnRvVXBwZXJDYXNlKCk7XG4gICAgICB9LFxuXG4gICAgICBnZXRMYXp5TGFuZ0F2YWlsYWJsZTogZnVuY3Rpb24gZ2V0TGF6eUxhbmdBdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5sYW5nO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBsYXp5IGNvbmZpZ3VyYXRpb24gZm9yIGFueSBsYW5nXG4gICAgICAgKiAtIERlZmF1bHQgaXMgdGhlIGNvbmZpZyBsYW5nXG4gICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdLZXlcbiAgICAgICAqIEByZXR1cm4ge09iamV0fVxuICAgICAgICovXG4gICAgICBnZXRMYXp5Q29uZmlnOiBmdW5jdGlvbiBnZXRMYXp5Q29uZmlnKGxhbmdLZXkpIHtcblxuICAgICAgICB2YXIgbGFuZ1RvRmluZCA9IGxhbmdLZXkgfHwgdGhpcy5nZXREZWZhdWx0TGFuZygpO1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenlDb25maWcuZmlsdGVyKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgcmV0dXJuIG8ubGFuZyA9PT0gbGFuZ1RvRmluZDtcbiAgICAgICAgfSlbMF0gfHwge307XG4gICAgICB9LFxuXG4gICAgICBnZXRMYXp5Q29uZmlnQnlVcmw6IGZ1bmN0aW9uIGdldExhenlDb25maWdCeVVybCh1cmwpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLmZpbHRlcihmdW5jdGlvbiAobykge1xuICAgICAgICAgIHJldHVybiBvID09PSB1cmw7XG4gICAgICAgIH0pWzBdO1xuICAgICAgfSxcblxuICAgICAgaXNWZXJib3NlOiBmdW5jdGlvbiBpc1ZlcmJvc2UoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubG9nO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBTaG91bGQgd2UgdXNlIHRoZSBsYXp5IG1vZGUgZm9yIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAqL1xuICAgICAgaXNMYXp5OiBmdW5jdGlvbiBpc0xhenkoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eTtcbiAgICAgIH0sXG5cbiAgICAgIGlzQmluZFRvU2NvcGU6IGZ1bmN0aW9uIGlzQmluZFRvU2NvcGUoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcuYmluZFRvU2NvcGU7XG4gICAgICB9LFxuXG4gICAgICBpc1NvbG86IGZ1bmN0aW9uIGlzU29sbygpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tAdG9kb10gTmVlZCB0byBpbXBsZW1lbnQgc29sbyBtb2RlJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9O31dO1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdiYWJlbGZpc2gnLCBbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdiYWJlbGZpc2hMYW5nJywgJ21hcnZpblRhc2tzJywgJ2JhYmVsZmlzaEV2ZW50JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5LCBiYWJlbGZpc2hMYW5nLCBtYXJ2aW5UYXNrcywgYmFiZWxmaXNoRXZlbnQpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1vZGVsID0gbWFydmluTWVtb3J5LmdldCgpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgc3RhdGUgdHJhbnNsYXRpb25cbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gZ2V0KGxhbmcpIHtcblxuICAgIHZhciBjdXJyZW50TGFuZyA9IG1vZGVsLmRhdGFbbGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnRdIHx8IHt9LFxuICAgICAgICBjb21tb24gPSB7fTtcblxuICAgIGlmICghY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pIHtcblxuICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tuZ0JhYmVsZmlzaC10cmFuc2xhdG9yQGdldF0gTm8gdHJhbnNsYXRpb24gYXZhaWxhYmxlIGZvciB0aGUgcGFnZSAlcyBmb3IgdGhlIGxhbmcgJXMnLCBtb2RlbC5zdGF0ZS5jdXJyZW50LCAobGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnQpKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdID0ge307XG4gICAgfVxuXG4gICAgYW5ndWxhci5leHRlbmQoY29tbW9uLCB7fSwgY3VycmVudExhbmcuX2NvbW1vbik7XG4gICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKGNvbW1vbiwgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgYSBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFsbChsYW5nKSB7XG4gICAgcmV0dXJuIG1vZGVsLmRhdGFbbGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnRdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBlYWNoIHRyYW5zbGF0aW9ucyBhdmFpbGFibGUgZm9yIHlvdXIgYXBwXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gdHJhbnNsYXRpb25zKCkge1xuICAgIHJldHVybiBtb2RlbC5kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHlvdSBhbHJlYWR5IGxvYWQgdGhpcyBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gIGxhbmdcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG5cbiAgZnVuY3Rpb24gaXNMYW5nTG9hZGVkKGxhbmcpIHtcbiAgICByZXR1cm4gbW9kZWwuZGF0YSAmJiAhISBtb2RlbC5kYXRhW2xhbmddO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBMYW5ndWFnZVxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IGxhbmdcbiAgICovXG5cbiAgZnVuY3Rpb24gY3VycmVudCgpIHtcbiAgICByZXR1cm4gbW9kZWwubGFuZy5jdXJyZW50O1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHdlIGhhdmUgbG9hZGVkIGkxOG5cbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG5cbiAgZnVuY3Rpb24gaXNMb2FkZWQoKSB7XG4gICAgcmV0dXJuIG1vZGVsLmFjdGl2ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGVhY2ggbGFuZ3VhZ2UgYXZhaWxhYmxlIGluIGJhYmVsZmlzaFxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG5cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VzKCkge1xuXG4gICAgaWYgKG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKCdfY29tb24nKSA+IC0xKSB7XG4gICAgICBtb2RlbC5hdmFpbGFibGUuc3BsaWNlKG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKCdfY29tb24nKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiBtb2RlbC5hdmFpbGFibGU7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSBjdXJyZW50IGxhbmd1YWdlXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB1cGRhdGVMYW5nKGxhbmcpIHtcbiAgICBiYWJlbGZpc2hMYW5nLnNldChsYW5nLCBtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIGFsbDogYWxsLFxuICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgdHJhbnNsYXRpb25zOiB0cmFuc2xhdGlvbnMsXG4gICAgbGFuZ3VhZ2VzOiBnZXRMYW5ndWFnZXMsXG4gICAgaXNMYW5nTG9hZGVkOiBpc0xhbmdMb2FkZWQsXG4gICAgaXNMb2FkZWQ6IGlzTG9hZGVkLFxuICAgIHVwZGF0ZUxhbmc6IHVwZGF0ZUxhbmcsXG4gICAgb246IGJhYmVsZmlzaEV2ZW50LnNldFxuICB9O31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdiYWJlbGZpc2hMYW5nJywgWyckaHR0cCcsICckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCAnbWFydmluVGFza3MnLCBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5LCBtYXJ2aW5UYXNrcykge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLm1hcnZpbjpyZXF1ZXN0VHJhbnNsYXRpb24nLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgIGluaXQoZGF0YS5zdGF0ZSwgZGF0YS51cmwpO1xuICB9KTtcblxuXG4gIGZ1bmN0aW9uIGluaXQoc3RhdGVOYW1lLCB1cmwpIHtcblxuICAgIHNldFN0YXRlKHN0YXRlTmFtZSk7XG5cbiAgICBpZiAoIW1hcnZpbi5pc0JpbmRUb1Njb3BlKCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2FkKCkudGhlbihtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZSk7XG4gIH1cblxuICBmdW5jdGlvbiBiaW5kRm9yU3RhdGUoc3RhdGVOYW1lKSB7XG4gICAgc2V0U3RhdGUoc3RhdGVOYW1lKTtcblxuICAgIGlmICghbWFydmluLmlzQmluZFRvU2NvcGUoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlKHN0YXRlTmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZU5hbWUpIHtcbiAgICBtb2RlbC5zdGF0ZS5jdXJyZW50ID0gc3RhdGVOYW1lO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0TGFuZ3VhZ2UobGFuZywgY2IpIHtcblxuICAgIGNiID0gY2IgfHwgYW5ndWxhci5ub29wO1xuICAgIG1vZGVsLmxhbmcucHJldmlvdXMgPSBhbmd1bGFyLmNvcHkobW9kZWwubGFuZy5jdXJyZW50KTtcbiAgICBtb2RlbC5sYW5nLmN1cnJlbnQgPSBsYW5nO1xuICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLmxhbmc6c2V0TGFuZ3VhZ2UnLCBtb2RlbC5jdXJyZW50KTtcbiAgICBjYigpO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9hZCh1cmwpIHtcblxuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuICAgIHVybCA9IHVybCB8fCBtYXJ2aW4uZ2V0Q29uZmlnKCkudXJsO1xuXG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSkge1xuICAgICAgdXJsID0gbWFydmluLmdldExhenlDb25maWcobW9kZWwubGFuZy5jdXJyZW50IHx8IG1hcnZpbi5nZXRDb25maWcoKS5sYW5nKS51cmw7XG4gICAgfVxuXG4gICAgcmV0dXJuICRodHRwLmdldCh1cmwpLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbYmFiZWxmaXNoTGFuZ3JAbG9hZF0gQ2Fubm90IGxvYWQgdGhlIHRyYW5zbGF0aW9uIGZpbGUnKTtcbiAgICAgIH1cbiAgICB9KS5zdWNjZXNzKHRyYW5zbGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFuc2xhdGUoZGF0YSkge1xuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSkge1xuICAgICAgbW9kZWwuZGF0YSA9IHt9O1xuICAgICAgbW9kZWwuZGF0YVtsYW5nXSA9IGRhdGE7XG5cbiAgICAgIGlmICgtMSA9PT0gbW9kZWwuYXZhaWxhYmxlLmluZGV4T2YobGFuZykpIHtcbiAgICAgICAgbW9kZWwuYXZhaWxhYmxlLnB1c2gobGFuZyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgbW9kZWwuZGF0YSA9IGRhdGE7XG4gICAgICBtb2RlbC5hdmFpbGFibGUgPSBPYmplY3Qua2V5cyhkYXRhKTtcbiAgICB9XG5cbiAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOmxvYWRlZCcsIHtcbiAgICAgIGxhbmc6IGxhbmdcbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMuaW5pdCA9IGluaXQ7XG4gIHRoaXMubG9hZCA9IGxvYWQ7XG4gIHRoaXMudHJhbnNsYXRlID0gdHJhbnNsYXRlO1xuICB0aGlzLnNldCA9IHNldExhbmd1YWdlO1xuICB0aGlzLmJpbmRGb3JTdGF0ZSA9IGJpbmRGb3JTdGF0ZTtcbiAgdGhpcy5zZXRTdGF0ZSA9IHNldFN0YXRlO1xuXG4gIH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdtYXJ2aW5UYXNrcycsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAvKipcbiAgICogTG9hZCBhIHRyYW5zbGF0aW9uIHRvIHRoZSBzY29wZVxuICAgKiBAZXZlbnQgJ25iQmFsZWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicgaWYgd2UgYXJlIGluIGxhenkgbW9kZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiBiaW5kVG9TY29wZSgpIHtcblxuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgLy8gV2UgZG8gbm90IHdhbnQgdG8gaGF2ZSBtdWx0aXBsZSByZWxvYWQgaWYgdGhlIGxhbmcgaXMgYWxyZWFkeSBwcmVzZW50XG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSAmJiAhbW9kZWwuZGF0YVtsYW5nXSkge1xuICAgICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIHtcbiAgICAgICAgc3RhdGU6IG1vZGVsLnN0YXRlLmN1cnJlbnQsXG4gICAgICAgIHVybDogbWFydmluLmdldExhenlDb25maWcobGFuZykudXJsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRUcmFuc2xhdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgdHJhbnNsYXRpb25zIHRvIHRoZSBzY29wZSBvciB1cGRhdGUgdGhlIG1vZGVsIGlmIHlvdSBzZXQgY29uZmlnLmJpbmRUb1Njb3BlIHRvIGZhbHNlLlxuICAgKiBAZXZlbnQgbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKCkge1xuXG4gICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgdmFyIHN0YXRlID0gbW9kZWwuc3RhdGUuY3VycmVudCxcbiAgICAgICAgc3RhdGVJMThuLCB0cmFuc2xhdGlvbiA9IHt9O1xuXG4gICAgLy8gUHJldmVudCB0b28gbWFueSByZWxvYWRcbiAgICBpZiAoc3RhdGUgPT09IG1vZGVsLnN0YXRlLnByZXZpb3VzICYmIG1vZGVsLmxhbmcuY3VycmVudCA9PT0gbW9kZWwubGFuZy5wcmV2aW91cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbW9kZWwuZGF0YVtsYW5nXSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN0YXRlSTE4biA9IG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdO1xuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0aGUgZXJyb3JcbiAgICAgKiAgICAgPiBUeXBlRXJyb3I6IENhbm5vdCByZWFkIHByb3BlcnR5ICckJGhhc2hLZXknIG9mIHVuZGVmaW5lZFxuICAgICAqIGNmIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZGhva28vbmdCYWJlbGZpc2gvaXNzdWVzLzV9XG4gICAgICovXG4gICAgaWYgKCFzdGF0ZUkxOG4pIHtcbiAgICAgIG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdID0ge307XG5cbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbbWFydmluVGFza3NAc2V0VHJhbnNsYXRpb25dIE5vIHRyYW5zbGF0aW9uIGF2YWlsYWJsZSBmb3IgdGhlIHBhZ2UgJXMgZm9yIHRoZSBsYW5nICVzJywgc3RhdGUsIGxhbmcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIuZXh0ZW5kKFxuICAgIHRyYW5zbGF0aW9uLCBhbmd1bGFyLmV4dGVuZCh7fSwgbW9kZWwuZGF0YVtsYW5nXS5fY29tbW9uKSwgc3RhdGVJMThuKTtcblxuICAgIGlmIChtYXJ2aW4uaXNCaW5kVG9TY29wZSgpKSB7XG5cbiAgICAgIGlmIChtYXJ2aW4uZ2V0TmFtZXNwYWNlKCkpIHtcbiAgICAgICAgJHJvb3RTY29wZVttYXJ2aW4uZ2V0TmFtZXNwYWNlKCldID0gdHJhbnNsYXRpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkcm9vdFNjb3BlLCB0cmFuc2xhdGlvbik7XG5cbiAgICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignW21hcnZpblRhc2tzQHNldFRyYW5zbGF0aW9uXSBJdCBpcyBiZXR0ZXIgdG8gTG9hZCBpMThuIGluc2lkZSBhIG5hbWVzcGFjZS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLnRyYW5zbGF0aW9uOmxvYWRlZCcsIHtcbiAgICAgIGN1cnJlbnRTdGF0ZTogc3RhdGUsXG4gICAgICBsYW5nOiBsYW5nLFxuICAgICAgcHJldmlvdXNMYW5nOiBtb2RlbC5sYW5nLnByZXZpb3VzXG4gICAgfSk7XG5cbiAgfVxuXG4gIHRoaXMuYmluZFRvU2NvcGUgPSBiaW5kVG9TY29wZTt9XSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9