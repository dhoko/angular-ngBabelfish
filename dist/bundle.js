angular.module('ngBabelfish', []).run(['$rootScope', 'marvin', 'babelfishLang', function ($rootScope, marvin, babelfishLang) {

  // Load translations onLoad
  babelfishLang.init();

  // Update the translation when you change a page
  $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
    babelfishLang.bindForState(toState.name);
  });}]);
angular.module('ngBabelfish').factory('babelfishEvent', ['$rootScope', function ($rootScope) {

  'use strict';

  var events = {};

  /**
   * Execute an event
   * @param  {String} eventName
   * @return {void}
   */

  function trigger(eventName, data) {
    (events[eventName] || []).forEach(function (eventRecord) {
      eventRecord(data);
    });
  }

  $rootScope.$on('ngBabelfish.translation:loaded', function (e, data) {
    if (data.previousLang !== data.lang) {
      trigger('change:language', data);
    }
  });

  $rootScope.$on('ngBabelfish.lang:loaded', function (e, data) {
    trigger('load:language', data);
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
      events[eventName] = events[eventName] || [];
      events[eventName].push(cb || angular.noop);
    }
  };}]);
angular.module('ngBabelfish').factory('marvinMemory', function () {

  'use strict';

  var memory = {
    state: {
      current: '',
      previous: '',
      loaded: false
    },
    lang: {
      previous: 'en-EN',
      current: 'en-EN'
    },
    data: null,
    available: []
  };

  return {
    get: function () {
      return memory;
    },
    set: function (config) {
      angular.extend(memory, config);
    }
  };
});
angular.module('ngBabelfish').directive('i18nBind', ['marvin', 'babelfish', function (marvin, babelfish) {

  'use strict';

  return {
    link: function (scope, el, attr) {

      var key = attr.i18nBind,
          lang = attr.i18nBindLang || marvin.getDefaultLang();

      if (babelfish.isLangLoaded(lang)) {
        var translation = babelfish.get(lang);
        return el.text(translation[key]);
      } else {
        (babelfish.current() !== lang) && babelfish.load(lang);
      }

      babelfish.on('change:language', function (data) {
        if (babelfish.isLangLoaded(data.lang)) {
          var translation = babelfish.get(data.lang);
          el.text(translation[key]);
        }
      });

      babelfish.on('load:language', function (data) {
        var translation = babelfish.get(data.lang);
        el.text(translation[key]);
      });

    }
  };}]);
angular.module('ngBabelfish').directive('i18nLoad', ['babelfish', function (babelfish) {

  'use strict';

  return {
    link: function (scope, el, attr) {
      el.on('click', function () {
        scope.$apply(function () {
          babelfish.updateLang(attr.i18nLoad);
        });

      });
    }
  };}]);
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
    return this;
  };

  /**
   * Add each language for your application
   * @param  {Object} opt {lang: "",url: ""}
   * @return {babelfishProvider}
   */
  this.lang = function lang(opt) {

    if (!opt.lang) {
      throw new Error('[marvinProvider@lang] You must set the key lang');
    }

    if (!opt.url) {
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
  this.$get = function () {
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
angular.module('ngBabelfish').service('babelfish', ['marvin', 'marvinMemory', 'babelfishLang', 'marvinTasks', 'babelfishEvent', function (marvin, marvinMemory, babelfishLang, marvinTasks, babelfishEvent) {

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
        console.warn('[ngBabelfish.babelfish@get] No translation available for the page %s for the lang %s', model.state.current, (lang || model.lang.current));
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
    return !!model.data && !! model.data[lang];
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

    if (model.available.indexOf('_common') > -1) {
      model.available.splice(model.available.indexOf('_common'), 1);
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

  /**
   * Load a custom lang
   * @param  {String} lang
   * @return {void}
   */

  function loadLanguage(lang) {
    var config = marvin.getLazyConfig(lang);
    babelfishLang.load(config.url, lang);
  }

  return {
    get: get,
    all: all,
    current: current,
    translations: translations,
    languages: getLanguages,
    isLangLoaded: isLangLoaded,
    updateLang: updateLang,
    load: loadLanguage,
    on: babelfishEvent.set
  };}]);
angular.module('ngBabelfish').service('babelfishLang', ['$http', '$rootScope', 'marvin', 'marvinMemory', 'marvinTasks', function ($http, $rootScope, marvin, marvinMemory, marvinTasks) {

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

    load(url).then(marvin.isBindToScope() ? marvinTasks.bindToScope : angular.noop);
  }

  /**
   * Attach a translation for a state to the scope if we can
   * @param  {String} stateName Current state name
   * @return {void}
   */

  function bindForState(stateName) {
    setState(stateName);

    if (marvin.isBindToScope()) {
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

    if (marvin.isLazy() && !lang) {
      url = marvin.getLazyConfig(model.lang.current || marvin.getConfig().lang).url;
    }

    return $http.get(url).error(function () {
      if (marvin.isVerbose()) {
        throw new Error('[ngBabelfish.babelfishLang@load] Cannot load the translation file');
      }
    }).success(function (data) {
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

    if (marvin.isLazy()) {
      model.data = model.data || {};
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
        console.warn('[ngBabelfish.marvinTasks@setTranslation] No translation available for the page %s for the lang %s', state, lang);
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
          console.warn('[ngBabelfish.marvinTasks@setTranslation] It is better to Load i18n inside a namespace.');
        }
      }
    }

    $rootScope.$emit('ngBabelfish.translation:loaded', {
      currentState: state,
      lang: lang,
      previousLang: model.lang.previous
    });

  }

  this.bindToScope = bindToScope;
  this.setTranslation = setTranslation;}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZmFjdG9yaWVzL2JhYmVsZmlzaEV2ZW50cy5qcyIsImZhY3Rvcmllcy9tYXJ2aW5NZW1vcnkuanMiLCJkaXJlY3RpdmVzL2kxOG5CaW5kLmpzIiwiZGlyZWN0aXZlcy9pMThuTG9hZC5qcyIsImZpbHRlcnMvdHJhbnNsYXRlLmpzIiwicHJvdmlkZXJzL21hcnZpbi5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaC5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaExhbmcuanMiLCJzZXJ2aWNlcy9tYXJ2aW5UYXNrcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnLCBbXSkucnVuKFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnYmFiZWxmaXNoTGFuZycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIGJhYmVsZmlzaExhbmcpIHtcblxuICAvLyBMb2FkIHRyYW5zbGF0aW9ucyBvbkxvYWRcbiAgYmFiZWxmaXNoTGFuZy5pbml0KCk7XG5cbiAgLy8gVXBkYXRlIHRoZSB0cmFuc2xhdGlvbiB3aGVuIHlvdSBjaGFuZ2UgYSBwYWdlXG4gICRyb290U2NvcGUuJG9uKG1hcnZpbi5nZXRSb3V0ZUV2ZW50KCksIGZ1bmN0aW9uIChlLCB0b1N0YXRlKSB7XG4gICAgYmFiZWxmaXNoTGFuZy5iaW5kRm9yU3RhdGUodG9TdGF0ZS5uYW1lKTtcbiAgfSk7fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmZhY3RvcnkoJ2JhYmVsZmlzaEV2ZW50JywgWyckcm9vdFNjb3BlJywgZnVuY3Rpb24gKCRyb290U2NvcGUpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGV2ZW50cyA9IHt9O1xuXG4gIC8qKlxuICAgKiBFeGVjdXRlIGFuIGV2ZW50XG4gICAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnROYW1lXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIHRyaWdnZXIoZXZlbnROYW1lLCBkYXRhKSB7XG4gICAgKGV2ZW50c1tldmVudE5hbWVdIHx8IFtdKS5mb3JFYWNoKGZ1bmN0aW9uIChldmVudFJlY29yZCkge1xuICAgICAgZXZlbnRSZWNvcmQoZGF0YSk7XG4gICAgfSk7XG4gIH1cblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICBpZiAoZGF0YS5wcmV2aW91c0xhbmcgIT09IGRhdGEubGFuZykge1xuICAgICAgdHJpZ2dlcignY2hhbmdlOmxhbmd1YWdlJywgZGF0YSk7XG4gICAgfVxuICB9KTtcblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgIHRyaWdnZXIoJ2xvYWQ6bGFuZ3VhZ2UnLCBkYXRhKTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICAvKipcbiAgICAgKiBSZWNvcmQgYSBldmVudExpc3RlbmVyXG4gICAgICogRXZlbnQgYXZhaWxhYmxlOlxuICAgICAqICAgLSBjaGFuZ2U6bGFuZ3VhZ2VcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gICBldmVudE5hbWVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAgICAgICAgY2FsbGJhY2sgdG8gcmVjb3JkXG4gICAgICovXG4gICAgc2V0OiBmdW5jdGlvbiAoZXZlbnROYW1lLCBjYikge1xuICAgICAgZXZlbnRzW2V2ZW50TmFtZV0gPSBldmVudHNbZXZlbnROYW1lXSB8fCBbXTtcbiAgICAgIGV2ZW50c1tldmVudE5hbWVdLnB1c2goY2IgfHwgYW5ndWxhci5ub29wKTtcbiAgICB9XG4gIH07fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmZhY3RvcnkoJ21hcnZpbk1lbW9yeScsIGZ1bmN0aW9uICgpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1lbW9yeSA9IHtcbiAgICBzdGF0ZToge1xuICAgICAgY3VycmVudDogJycsXG4gICAgICBwcmV2aW91czogJycsXG4gICAgICBsb2FkZWQ6IGZhbHNlXG4gICAgfSxcbiAgICBsYW5nOiB7XG4gICAgICBwcmV2aW91czogJ2VuLUVOJyxcbiAgICAgIGN1cnJlbnQ6ICdlbi1FTidcbiAgICB9LFxuICAgIGRhdGE6IG51bGwsXG4gICAgYXZhaWxhYmxlOiBbXVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gbWVtb3J5O1xuICAgIH0sXG4gICAgc2V0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICBhbmd1bGFyLmV4dGVuZChtZW1vcnksIGNvbmZpZyk7XG4gICAgfVxuICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZGlyZWN0aXZlKCdpMThuQmluZCcsIFsnbWFydmluJywgJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uIChtYXJ2aW4sIGJhYmVsZmlzaCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICByZXR1cm4ge1xuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcblxuICAgICAgdmFyIGtleSA9IGF0dHIuaTE4bkJpbmQsXG4gICAgICAgICAgbGFuZyA9IGF0dHIuaTE4bkJpbmRMYW5nIHx8IG1hcnZpbi5nZXREZWZhdWx0TGFuZygpO1xuXG4gICAgICBpZiAoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChsYW5nKSkge1xuICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSBiYWJlbGZpc2guZ2V0KGxhbmcpO1xuICAgICAgICByZXR1cm4gZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChiYWJlbGZpc2guY3VycmVudCgpICE9PSBsYW5nKSAmJiBiYWJlbGZpc2gubG9hZChsYW5nKTtcbiAgICAgIH1cblxuICAgICAgYmFiZWxmaXNoLm9uKCdjaGFuZ2U6bGFuZ3VhZ2UnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICBpZiAoYmFiZWxmaXNoLmlzTGFuZ0xvYWRlZChkYXRhLmxhbmcpKSB7XG4gICAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChkYXRhLmxhbmcpO1xuICAgICAgICAgIGVsLnRleHQodHJhbnNsYXRpb25ba2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBiYWJlbGZpc2gub24oJ2xvYWQ6bGFuZ3VhZ2UnLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSBiYWJlbGZpc2guZ2V0KGRhdGEubGFuZyk7XG4gICAgICAgIGVsLnRleHQodHJhbnNsYXRpb25ba2V5XSk7XG4gICAgICB9KTtcblxuICAgIH1cbiAgfTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZGlyZWN0aXZlKCdpMThuTG9hZCcsIFsnYmFiZWxmaXNoJywgZnVuY3Rpb24gKGJhYmVsZmlzaCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICByZXR1cm4ge1xuICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWwsIGF0dHIpIHtcbiAgICAgIGVsLm9uKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBiYWJlbGZpc2gudXBkYXRlTGFuZyhhdHRyLmkxOG5Mb2FkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0pO1xuICAgIH1cbiAgfTt9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuZmlsdGVyKCd0cmFuc2xhdGUnLCBbJ2JhYmVsZmlzaCcsIGZ1bmN0aW9uIChiYWJlbGZpc2gpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIHRyYW5zYWx0ZSBmaWx0ZXJcbiAgICogVHJhbnNsYXRlIGEgc3RyaW5nIHRvIGFub3RoZXIgbGFuZ3VhZ2VcbiAgICoge3sgbmFtZSB8IHRyYW5zbGF0ZTonZnItRlInOlwibmFtZVwifX1cbiAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0IElucHV0IHZhbHVlIHRvIHRyYW5zYWx0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gbGFuZyBMYW5nIHRvIHRyYW5zbGF0ZSAob3B0aW9uYWwpXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGZpbHRlcihpbnB1dCwgbGFuZykge1xuICAgIHJldHVybiBiYWJlbGZpc2guZ2V0KGxhbmcpW2lucHV0XTtcbiAgfVxuXG4gIGZpbHRlci4kc3RhdGVmdWwgPSB0cnVlO1xuXG4gIHJldHVybiBmaWx0ZXI7fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLnByb3ZpZGVyKCdtYXJ2aW4nLCBmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBtb2R1bGVcbiAgICogQHR5cGUge09iamVjdH1cbiAgICovXG4gIHZhciBjb25maWcgPSB7XG4gICAgc3RhdGU6ICdob21lJyxcbiAgICBsYW5nOiAnZW4tRU4nLFxuICAgIHVybDogJy9pMThuL2xhbmd1YWdlcy5qc29uJyxcbiAgICByb3V0ZUV2ZW50TmFtZTogJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLFxuICAgIG5hbWVzcGFjZTogJ2kxOG4nLFxuICAgIGxhenk6IGZhbHNlLFxuICAgIGxhenlDb25maWc6IFtdLFxuICAgIGN1cnJlbnQ6ICcnLFxuICAgIGxvZzogdHJ1ZSxcbiAgICBiaW5kVG9TY29wZTogdHJ1ZVxuICB9O1xuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgdGhlIHNlcnZpY2Ugd2l0aCBhIHByb3ZpZGVyIGZyb20gdGhlIGNvbmZpZyBvZiB5b3VyIG1vZHVsZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9IHBhcmFtcyBDb25maWd1cmF0aW9uIG9iamVjdFxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cbiAgdGhpcy5pbml0ID0gZnVuY3Rpb24gaW5pdEJhYmVsZmlzaENvbmZpZyhwYXJhbXMpIHtcbiAgICBhbmd1bGFyLmV4dGVuZChjb25maWcsIHBhcmFtcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFkZCBlYWNoIGxhbmd1YWdlIGZvciB5b3VyIGFwcGxpY2F0aW9uXG4gICAqIEBwYXJhbSAge09iamVjdH0gb3B0IHtsYW5nOiBcIlwiLHVybDogXCJcIn1cbiAgICogQHJldHVybiB7YmFiZWxmaXNoUHJvdmlkZXJ9XG4gICAqL1xuICB0aGlzLmxhbmcgPSBmdW5jdGlvbiBsYW5nKG9wdCkge1xuXG4gICAgaWYgKCFvcHQubGFuZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdbbWFydmluUHJvdmlkZXJAbGFuZ10gWW91IG11c3Qgc2V0IHRoZSBrZXkgbGFuZycpO1xuICAgIH1cblxuICAgIGlmICghb3B0LnVybCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdbbWFydmluUHJvdmlkZXJAbGFuZ10gWW91IG11c3Qgc2V0IHRoZSBrZXkgdXJsJyk7XG4gICAgfVxuXG4gICAgY29uZmlnLmxhenkgPSB0cnVlO1xuICAgIGNvbmZpZy5sYXp5Q29uZmlnLnB1c2gob3B0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQmluZCB0byB0aGUgc2NvcGUgYWxsIHRyYW5zbGF0aW9uc1xuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqIEBwYXJhbSAge0Jvb2xlYW59IGlzQmluZFxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cbiAgdGhpcy5iaW5kVG9TY29wZSA9IGZ1bmN0aW9uIGJpbmRUb1Njb3BlKGlzQmluZCkge1xuICAgIGNvbmZpZy5iaW5kVG9TY29wZSA9IGlzQmluZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogQWN0aXZlIHZlcmJvc2UgbW9kZVxuICAgKiBAZGVmYXVsdCB0cnVlXG4gICAqIEBwYXJhbSAge0Jvb2xlYW59IGlzVmVyYm9zZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cbiAgdGhpcy52ZXJib3NlID0gZnVuY3Rpb24gdmVyYm9zZShpc1ZlcmJvc2UpIHtcbiAgICBjb25maWcubG9nID0gaXNWZXJib3NlO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHJvdXRlIGV2ZW50IE5hbWUgdG8gbGlzdGVuIHRvXG4gICAqIEBkZWZhdWx0ICRzdGF0ZUNoYW5nZVN1Y2Nlc3NcbiAgICogQHBhcmFtICB7U3RyaW5nfSBldmVudE5hbWVcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMucm91dGluZ0V2ZW50ID0gZnVuY3Rpb24gcm91dGluZ0V2ZW50KGV2ZW50TmFtZSkge1xuICAgIGNvbmZpZy5yb3V0ZUV2ZW50TmFtZSA9IGV2ZW50TmFtZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogTWFydmluIHNlcnZpY2VcbiAgICovXG4gIHRoaXMuJGdldCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybiBiYWJlbGZpc2ggY29uZmlndXJhdGlvblxuICAgICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAgICovXG4gICAgICBnZXRDb25maWc6IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogUmV0dXJuIHRoZSBkZWZhdWx0IGV2ZW50IG5hbWUgaW4gb3JkZXIgdG8gbGlzdGVuIGEgbmV3IHN0YXRlfHxyb3V0ZVxuICAgICAgICogQHJldHVybiB7U3RyaW5nfVxuICAgICAgICovXG4gICAgICBnZXRSb3V0ZUV2ZW50OiBmdW5jdGlvbiBnZXRSb3V0ZUV2ZW50KCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLnJvdXRlRXZlbnROYW1lO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIG5hbWVzcGFjZSBvZiB0aGUgYXBwbGljYXRpb25cbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0TmFtZXNwYWNlOiBmdW5jdGlvbiBnZXROYW1lc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubmFtZXNwYWNlO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIGxhbmcgZm9yIHlvdXIgYXBwLlxuICAgICAgICogLSBZb3UgY2FuIHVzZSB0aGUgcHJvdmlkZXJcbiAgICAgICAqIC0gWW91IGNhbiB1c2UgaHRtbCBkZWZhdWx0IGF0dHJcbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0RGVmYXVsdExhbmc6IGZ1bmN0aW9uIGdldERlZmF1bHRMYW5nKCkge1xuXG4gICAgICAgIGlmIChjb25maWcubGFuZykge1xuICAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nID0gY29uZmlnLmxhbmcuc3BsaXQoJy0nKVswXTtcbiAgICAgICAgICByZXR1cm4gY29uZmlnLmxhbmc7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcgKyAnLScgKyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBMaXN0IGVhY2ggbGFuZyBhdmFpbGFibGUgZm9yIGxhenkgbW9kZVxuICAgICAgICogQHJldHVybiB7QXJyYXl9XG4gICAgICAgKi9cbiAgICAgIGdldExhenlMYW5nQXZhaWxhYmxlOiBmdW5jdGlvbiBnZXRMYXp5TGFuZ0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICAgIHJldHVybiBpdGVtLmxhbmc7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBHZXQgdGhlIGxhenkgY29uZmlndXJhdGlvbiBmb3IgYW55IGxhbmdcbiAgICAgICAqIC0gRGVmYXVsdCBpcyB0aGUgY29uZmlnIGxhbmdcbiAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ0tleVxuICAgICAgICogQHJldHVybiB7T2JqZXR9XG4gICAgICAgKi9cbiAgICAgIGdldExhenlDb25maWc6IGZ1bmN0aW9uIGdldExhenlDb25maWcobGFuZ0tleSkge1xuXG4gICAgICAgIHZhciBsYW5nVG9GaW5kID0gbGFuZ0tleSB8fCB0aGlzLmdldERlZmF1bHRMYW5nKCk7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICByZXR1cm4gby5sYW5nID09PSBsYW5nVG9GaW5kO1xuICAgICAgICB9KVswXSB8fCB7fTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogRmluZCBhIGxhenkgY29uZmlnIGJ5IGl0cyB1cmxcbiAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gdXJsXG4gICAgICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAgICAgKi9cbiAgICAgIGdldExhenlDb25maWdCeVVybDogZnVuY3Rpb24gZ2V0TGF6eUNvbmZpZ0J5VXJsKHVybCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenlDb25maWcuZmlsdGVyKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgcmV0dXJuIG8udXJsID09PSB1cmw7XG4gICAgICAgIH0pWzBdO1xuICAgICAgfSxcblxuICAgICAgaXNWZXJib3NlOiBmdW5jdGlvbiBpc1ZlcmJvc2UoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubG9nO1xuICAgICAgfSxcblxuICAgICAgLyoqXG4gICAgICAgKiBTaG91bGQgd2UgdXNlIHRoZSBsYXp5IG1vZGUgZm9yIHRoZSBhcHBsaWNhdGlvblxuICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAqL1xuICAgICAgaXNMYXp5OiBmdW5jdGlvbiBpc0xhenkoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogQ2hlY2sgaWYgd2UgbmVlZCB0byBiaW5kIGRhdGEgdG8gdGhlIHNjb3BlXG4gICAgICAgKiBAZGVmYXVsdCB0cnVlXG4gICAgICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgICAgICovXG4gICAgICBpc0JpbmRUb1Njb3BlOiBmdW5jdGlvbiBpc0JpbmRUb1Njb3BlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmJpbmRUb1Njb3BlO1xuICAgICAgfVxuICAgIH07XG4gIH07XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLnNlcnZpY2UoJ2JhYmVsZmlzaCcsIFsnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdiYWJlbGZpc2hMYW5nJywgJ21hcnZpblRhc2tzJywgJ2JhYmVsZmlzaEV2ZW50JywgZnVuY3Rpb24gKG1hcnZpbiwgbWFydmluTWVtb3J5LCBiYWJlbGZpc2hMYW5nLCBtYXJ2aW5UYXNrcywgYmFiZWxmaXNoRXZlbnQpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIG1vZGVsID0gbWFydmluTWVtb3J5LmdldCgpO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGN1cnJlbnQgc3RhdGUgdHJhbnNsYXRpb25cbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gZ2V0KGxhbmcpIHtcblxuICAgIHZhciBjdXJyZW50TGFuZyA9IG1vZGVsLmRhdGFbbGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnRdIHx8IHt9LFxuICAgICAgICBjb21tb24gPSB7fTtcblxuICAgIGlmICghY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pIHtcblxuICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1tuZ0JhYmVsZmlzaC5iYWJlbGZpc2hAZ2V0XSBObyB0cmFuc2xhdGlvbiBhdmFpbGFibGUgZm9yIHRoZSBwYWdlICVzIGZvciB0aGUgbGFuZyAlcycsIG1vZGVsLnN0YXRlLmN1cnJlbnQsIChsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudCkpO1xuICAgICAgfVxuICAgICAgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0gPSB7fTtcbiAgICB9XG5cbiAgICBhbmd1bGFyLmV4dGVuZChjb21tb24sIHt9LCBjdXJyZW50TGFuZy5fY29tbW9uKTtcbiAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoY29tbW9uLCBjdXJyZW50TGFuZ1ttb2RlbC5zdGF0ZS5jdXJyZW50XSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCB0cmFuc2xhdGlvbnMgYXZhaWxhYmxlIGZvciBhIGxhbmdcbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gYWxsKGxhbmcpIHtcbiAgICByZXR1cm4gbW9kZWwuZGF0YVtsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudF07XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJuIGVhY2ggdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgeW91ciBhcHBcbiAgICogQHJldHVybiB7T2JqZWN0fVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmFuc2xhdGlvbnMoKSB7XG4gICAgcmV0dXJuIG1vZGVsLmRhdGE7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgeW91IGFscmVhZHkgbG9hZCB0aGlzIGxhbmdcbiAgICogQHBhcmFtICB7U3RyaW5nfSAgbGFuZ1xuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKi9cblxuICBmdW5jdGlvbiBpc0xhbmdMb2FkZWQobGFuZykge1xuICAgIHJldHVybiAhIW1vZGVsLmRhdGEgJiYgISEgbW9kZWwuZGF0YVtsYW5nXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgTGFuZ3VhZ2VcbiAgICogQHJldHVybiB7U3RyaW5nfSBsYW5nXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGN1cnJlbnQoKSB7XG4gICAgcmV0dXJuIG1vZGVsLmxhbmcuY3VycmVudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGVhY2ggbGFuZ3VhZ2UgYXZhaWxhYmxlIGluIGJhYmVsZmlzaFxuICAgKiBAcmV0dXJuIHtBcnJheX1cbiAgICovXG5cbiAgZnVuY3Rpb24gZ2V0TGFuZ3VhZ2VzKCkge1xuXG4gICAgaWYgKG1vZGVsLmF2YWlsYWJsZS5pbmRleE9mKCdfY29tbW9uJykgPiAtMSkge1xuICAgICAgbW9kZWwuYXZhaWxhYmxlLnNwbGljZShtb2RlbC5hdmFpbGFibGUuaW5kZXhPZignX2NvbW1vbicpLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIG1vZGVsLmF2YWlsYWJsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIGN1cnJlbnQgbGFuZ3VhZ2VcbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxhbmcobGFuZykge1xuICAgIGJhYmVsZmlzaExhbmcuc2V0KGxhbmcsIG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGEgY3VzdG9tIGxhbmdcbiAgICogQHBhcmFtICB7U3RyaW5nfSBsYW5nXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGxvYWRMYW5ndWFnZShsYW5nKSB7XG4gICAgdmFyIGNvbmZpZyA9IG1hcnZpbi5nZXRMYXp5Q29uZmlnKGxhbmcpO1xuICAgIGJhYmVsZmlzaExhbmcubG9hZChjb25maWcudXJsLCBsYW5nKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXQsXG4gICAgYWxsOiBhbGwsXG4gICAgY3VycmVudDogY3VycmVudCxcbiAgICB0cmFuc2xhdGlvbnM6IHRyYW5zbGF0aW9ucyxcbiAgICBsYW5ndWFnZXM6IGdldExhbmd1YWdlcyxcbiAgICBpc0xhbmdMb2FkZWQ6IGlzTGFuZ0xvYWRlZCxcbiAgICB1cGRhdGVMYW5nOiB1cGRhdGVMYW5nLFxuICAgIGxvYWQ6IGxvYWRMYW5ndWFnZSxcbiAgICBvbjogYmFiZWxmaXNoRXZlbnQuc2V0XG4gIH07fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLnNlcnZpY2UoJ2JhYmVsZmlzaExhbmcnLCBbJyRodHRwJywgJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsICdtYXJ2aW5UYXNrcycsIGZ1bmN0aW9uICgkaHR0cCwgJHJvb3RTY29wZSwgbWFydmluLCBtYXJ2aW5NZW1vcnksIG1hcnZpblRhc2tzKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAkcm9vdFNjb3BlLiRvbignbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG4gICAgaW5pdChkYXRhLnN0YXRlLCBkYXRhLnVybCk7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBMb2FkIGEgdHJhbnNsYXRpb24gYW5kIGF0dGFjaCBpdCB0byB0aGUgc2NvcGUgaWYgd2UgY2FuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gc3RhdGVOYW1lIGN1cnJlbnQgc3RhdGVcbiAgICogQHBhcmFtICB7U3RyaW5nfSB1cmwgICAgICAgVXJsIHRvIGxvYWRcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG5cbiAgZnVuY3Rpb24gaW5pdChzdGF0ZU5hbWUsIHVybCkge1xuICAgIHNldFN0YXRlKHN0YXRlTmFtZSk7XG5cbiAgICBsb2FkKHVybCkudGhlbihtYXJ2aW4uaXNCaW5kVG9TY29wZSgpID8gbWFydmluVGFza3MuYmluZFRvU2NvcGUgOiBhbmd1bGFyLm5vb3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCBhIHRyYW5zbGF0aW9uIGZvciBhIHN0YXRlIHRvIHRoZSBzY29wZSBpZiB3ZSBjYW5cbiAgICogQHBhcmFtICB7U3RyaW5nfSBzdGF0ZU5hbWUgQ3VycmVudCBzdGF0ZSBuYW1lXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGJpbmRGb3JTdGF0ZShzdGF0ZU5hbWUpIHtcbiAgICBzZXRTdGF0ZShzdGF0ZU5hbWUpO1xuXG4gICAgaWYgKG1hcnZpbi5pc0JpbmRUb1Njb3BlKCkpIHtcbiAgICAgIG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlKHN0YXRlTmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlY29yZCB0aGUgY3VycmVudCBzdGF0ZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gc3RhdGVOYW1lXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNldFN0YXRlKHN0YXRlTmFtZSkge1xuICAgIG1vZGVsLnN0YXRlLmN1cnJlbnQgPSBzdGF0ZU5hbWU7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSBjdXJyZW50IGxhbmd1YWdlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSAgIGxhbmcgY3VycmVudCBsYW5nXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNiXG4gICAqIEBldmVudCBuZ0JhYmVsZmlzaC5sYW5nOnNldExhbmd1YWdlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNldExhbmd1YWdlKGxhbmcsIGNiKSB7XG5cbiAgICBjYiA9IGNiIHx8IGFuZ3VsYXIubm9vcDtcbiAgICBtb2RlbC5sYW5nLnByZXZpb3VzID0gYW5ndWxhci5jb3B5KG1vZGVsLmxhbmcuY3VycmVudCk7XG4gICAgbW9kZWwubGFuZy5jdXJyZW50ID0gbGFuZztcbiAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOnNldExhbmd1YWdlJywgbW9kZWwubGFuZyk7XG4gICAgY2IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIGEgdHJhbnNsYXRpb25cbiAgICogQHBhcmFtICB7U3RyaW5nfSB1cmxcbiAgICogQHBhcmFtIHtTdHJpbmd9IExhbmcgbG9hZCBhIGN1c3RvbSBsYW5nIChsYXp5IG1vZGUgb25seSlcbiAgICogQHJldHVybiB7cS5Qcm9taXNlfVxuICAgKi9cblxuICBmdW5jdGlvbiBsb2FkKHVybCwgbGFuZykge1xuXG4gICAgdXJsID0gdXJsIHx8IG1hcnZpbi5nZXRDb25maWcoKS51cmw7XG5cbiAgICBpZiAobWFydmluLmlzTGF6eSgpICYmICFsYW5nKSB7XG4gICAgICB1cmwgPSBtYXJ2aW4uZ2V0TGF6eUNvbmZpZyhtb2RlbC5sYW5nLmN1cnJlbnQgfHwgbWFydmluLmdldENvbmZpZygpLmxhbmcpLnVybDtcbiAgICB9XG5cbiAgICByZXR1cm4gJGh0dHAuZ2V0KHVybCkuZXJyb3IoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1tuZ0JhYmVsZmlzaC5iYWJlbGZpc2hMYW5nQGxvYWRdIENhbm5vdCBsb2FkIHRoZSB0cmFuc2xhdGlvbiBmaWxlJyk7XG4gICAgICB9XG4gICAgfSkuc3VjY2VzcyhmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgdHJhbnNsYXRlKGRhdGEsIGxhbmcpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEJ1aWxkIHRyYW5zbGF0aW9ucyBvciBhIGxhbmd1YWdlXG4gICAqIEBwYXJhbSAge09iamVjdH0gZGF0YVxuICAgKiBAZXZlbnQgJ25nQmFiZWxmaXNoLmxhbmc6bG9hZGVkJ1xuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmFuc2xhdGUoZGF0YSwgbGFuZykge1xuXG4gICAgbGFuZyA9IGxhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSkge1xuICAgICAgbW9kZWwuZGF0YSA9IG1vZGVsLmRhdGEgfHwge307XG4gICAgICBtb2RlbC5kYXRhW2xhbmddID0gZGF0YTtcblxuICAgICAgaWYgKC0xID09PSBtb2RlbC5hdmFpbGFibGUuaW5kZXhPZihsYW5nKSkge1xuICAgICAgICBtb2RlbC5hdmFpbGFibGUucHVzaChsYW5nKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBtb2RlbC5kYXRhID0gZGF0YTtcbiAgICAgIG1vZGVsLmF2YWlsYWJsZSA9IE9iamVjdC5rZXlzKGRhdGEpO1xuICAgIH1cbiAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC5sYW5nOmxvYWRlZCcsIHtcbiAgICAgIGxhbmc6IGxhbmdcbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMuaW5pdCA9IGluaXQ7XG4gIHRoaXMubG9hZCA9IGxvYWQ7XG4gIHRoaXMudHJhbnNsYXRlID0gdHJhbnNsYXRlO1xuICB0aGlzLnNldCA9IHNldExhbmd1YWdlO1xuICB0aGlzLmJpbmRGb3JTdGF0ZSA9IGJpbmRGb3JTdGF0ZTtcbiAgdGhpcy5zZXRTdGF0ZSA9IHNldFN0YXRlO1xuXG4gIH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdtYXJ2aW5UYXNrcycsIFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnbWFydmluTWVtb3J5JywgZnVuY3Rpb24gKCRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAvKipcbiAgICogTG9hZCBhIHRyYW5zbGF0aW9uIHRvIHRoZSBzY29wZVxuICAgKiBAZXZlbnQgJ25iQmFsZWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicgaWYgd2UgYXJlIGluIGxhenkgbW9kZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiBiaW5kVG9TY29wZSgpIHtcblxuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuXG4gICAgLy8gV2UgZG8gbm90IHdhbnQgdG8gaGF2ZSBtdWx0aXBsZSByZWxvYWQgaWYgdGhlIGxhbmcgaXMgYWxyZWFkeSBwcmVzZW50XG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSAmJiAhbW9kZWwuZGF0YVtsYW5nXSkge1xuICAgICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubWFydmluOnJlcXVlc3RUcmFuc2xhdGlvbicsIHtcbiAgICAgICAgc3RhdGU6IG1vZGVsLnN0YXRlLmN1cnJlbnQsXG4gICAgICAgIHVybDogbWFydmluLmdldExhenlDb25maWcobGFuZykudXJsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZXRUcmFuc2xhdGlvbigpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWQgdHJhbnNsYXRpb25zIHRvIHRoZSBzY29wZSBvciB1cGRhdGUgdGhlIG1vZGVsIGlmIHlvdSBzZXQgY29uZmlnLmJpbmRUb1Njb3BlIHRvIGZhbHNlLlxuICAgKiBAZXZlbnQgbmdCYWJlbGZpc2gudHJhbnNsYXRpb246bG9hZGVkXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNldFRyYW5zbGF0aW9uKCkge1xuXG4gICAgdmFyIGxhbmcgPSBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gICAgdmFyIHN0YXRlID0gbW9kZWwuc3RhdGUuY3VycmVudCxcbiAgICAgICAgc3RhdGVJMThuLCB0cmFuc2xhdGlvbiA9IHt9O1xuXG4gICAgLy8gUHJldmVudCB0b28gbWFueSByZWxvYWRcbiAgICBpZiAoc3RhdGUgPT09IG1vZGVsLnN0YXRlLnByZXZpb3VzICYmIG1vZGVsLmxhbmcuY3VycmVudCA9PT0gbW9kZWwubGFuZy5wcmV2aW91cykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghbW9kZWwuZGF0YVtsYW5nXSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHN0YXRlSTE4biA9IG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdO1xuXG4gICAgLyoqXG4gICAgICogUHJldmVudCB0aGUgZXJyb3JcbiAgICAgKiAgICAgPiBUeXBlRXJyb3I6IENhbm5vdCByZWFkIHByb3BlcnR5ICckJGhhc2hLZXknIG9mIHVuZGVmaW5lZFxuICAgICAqIGNmIHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vZGhva28vbmdCYWJlbGZpc2gvaXNzdWVzLzV9XG4gICAgICovXG4gICAgaWYgKCFzdGF0ZUkxOG4pIHtcbiAgICAgIG1vZGVsLmRhdGFbbGFuZ11bc3RhdGVdID0ge307XG5cbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbbmdCYWJlbGZpc2gubWFydmluVGFza3NAc2V0VHJhbnNsYXRpb25dIE5vIHRyYW5zbGF0aW9uIGF2YWlsYWJsZSBmb3IgdGhlIHBhZ2UgJXMgZm9yIHRoZSBsYW5nICVzJywgc3RhdGUsIGxhbmcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFuZ3VsYXIuZXh0ZW5kKFxuICAgIHRyYW5zbGF0aW9uLCBhbmd1bGFyLmV4dGVuZCh7fSwgbW9kZWwuZGF0YVtsYW5nXS5fY29tbW9uKSwgc3RhdGVJMThuKTtcblxuICAgIGlmIChtYXJ2aW4uaXNCaW5kVG9TY29wZSgpKSB7XG5cbiAgICAgIGlmIChtYXJ2aW4uZ2V0TmFtZXNwYWNlKCkpIHtcbiAgICAgICAgJHJvb3RTY29wZVttYXJ2aW4uZ2V0TmFtZXNwYWNlKCldID0gdHJhbnNsYXRpb247XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbmd1bGFyLmV4dGVuZCgkcm9vdFNjb3BlLCB0cmFuc2xhdGlvbik7XG5cbiAgICAgICAgaWYgKG1hcnZpbi5pc1ZlcmJvc2UoKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignW25nQmFiZWxmaXNoLm1hcnZpblRhc2tzQHNldFRyYW5zbGF0aW9uXSBJdCBpcyBiZXR0ZXIgdG8gTG9hZCBpMThuIGluc2lkZSBhIG5hbWVzcGFjZS4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLnRyYW5zbGF0aW9uOmxvYWRlZCcsIHtcbiAgICAgIGN1cnJlbnRTdGF0ZTogc3RhdGUsXG4gICAgICBsYW5nOiBsYW5nLFxuICAgICAgcHJldmlvdXNMYW5nOiBtb2RlbC5sYW5nLnByZXZpb3VzXG4gICAgfSk7XG5cbiAgfVxuXG4gIHRoaXMuYmluZFRvU2NvcGUgPSBiaW5kVG9TY29wZTtcbiAgdGhpcy5zZXRUcmFuc2xhdGlvbiA9IHNldFRyYW5zbGF0aW9uO31dKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=