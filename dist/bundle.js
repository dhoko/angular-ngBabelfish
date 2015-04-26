angular.module('ngBabelfish', []).run(['$rootScope', 'marvin', 'babelfishLang', function ($rootScope, marvin, babelfishLang) {

  // Load translations onLoad
  babelfishLang.init();

  // Update the translation when you change a page
  $rootScope.$on(marvin.getRouteEvent(), function (e, toState) {
    babelfishLang.bindForState(toState.name);
  });}]);
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
        if (babelfish.isLangLoaded(data.lang) && !attr.i18nBindLang) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIiwiZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsImRpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCJmYWN0b3JpZXMvYmFiZWxmaXNoRXZlbnRzLmpzIiwiZmFjdG9yaWVzL21hcnZpbk1lbW9yeS5qcyIsImZpbHRlcnMvdHJhbnNsYXRlLmpzIiwicHJvdmlkZXJzL21hcnZpbi5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaC5qcyIsInNlcnZpY2VzL2JhYmVsZmlzaExhbmcuanMiLCJzZXJ2aWNlcy9tYXJ2aW5UYXNrcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJidW5kbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnLCBbXSkucnVuKFsnJHJvb3RTY29wZScsICdtYXJ2aW4nLCAnYmFiZWxmaXNoTGFuZycsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIGJhYmVsZmlzaExhbmcpIHtcblxuICAvLyBMb2FkIHRyYW5zbGF0aW9ucyBvbkxvYWRcbiAgYmFiZWxmaXNoTGFuZy5pbml0KCk7XG5cbiAgLy8gVXBkYXRlIHRoZSB0cmFuc2xhdGlvbiB3aGVuIHlvdSBjaGFuZ2UgYSBwYWdlXG4gICRyb290U2NvcGUuJG9uKG1hcnZpbi5nZXRSb3V0ZUV2ZW50KCksIGZ1bmN0aW9uIChlLCB0b1N0YXRlKSB7XG4gICAgYmFiZWxmaXNoTGFuZy5iaW5kRm9yU3RhdGUodG9TdGF0ZS5uYW1lKTtcbiAgfSk7fV0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmRpcmVjdGl2ZSgnaTE4bkJpbmQnLCBbJ21hcnZpbicsICdiYWJlbGZpc2gnLCBmdW5jdGlvbiAobWFydmluLCBiYWJlbGZpc2gpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgcmV0dXJuIHtcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsLCBhdHRyKSB7XG5cbiAgICAgIHZhciBrZXkgPSBhdHRyLmkxOG5CaW5kLFxuICAgICAgICAgIGxhbmcgPSBhdHRyLmkxOG5CaW5kTGFuZyB8fCBtYXJ2aW4uZ2V0RGVmYXVsdExhbmcoKTtcblxuICAgICAgaWYgKGJhYmVsZmlzaC5pc0xhbmdMb2FkZWQobGFuZykpIHtcbiAgICAgICAgdmFyIHRyYW5zbGF0aW9uID0gYmFiZWxmaXNoLmdldChsYW5nKTtcbiAgICAgICAgcmV0dXJuIGVsLnRleHQodHJhbnNsYXRpb25ba2V5XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoYmFiZWxmaXNoLmN1cnJlbnQoKSAhPT0gbGFuZykgJiYgYmFiZWxmaXNoLmxvYWQobGFuZyk7XG4gICAgICB9XG5cbiAgICAgIGJhYmVsZmlzaC5vbignY2hhbmdlOmxhbmd1YWdlJywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgaWYgKGJhYmVsZmlzaC5pc0xhbmdMb2FkZWQoZGF0YS5sYW5nKSAmJiAhYXR0ci5pMThuQmluZExhbmcpIHtcbiAgICAgICAgICB2YXIgdHJhbnNsYXRpb24gPSBiYWJlbGZpc2guZ2V0KGRhdGEubGFuZyk7XG4gICAgICAgICAgZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGJhYmVsZmlzaC5vbignbG9hZDpsYW5ndWFnZScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHZhciB0cmFuc2xhdGlvbiA9IGJhYmVsZmlzaC5nZXQoZGF0YS5sYW5nKTtcbiAgICAgICAgZWwudGV4dCh0cmFuc2xhdGlvbltrZXldKTtcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9O31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5kaXJlY3RpdmUoJ2kxOG5Mb2FkJywgWydiYWJlbGZpc2gnLCBmdW5jdGlvbiAoYmFiZWxmaXNoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHJldHVybiB7XG4gICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbCwgYXR0cikge1xuICAgICAgZWwub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGJhYmVsZmlzaC51cGRhdGVMYW5nKGF0dHIuaTE4bkxvYWQpO1xuICAgICAgICB9KTtcblxuICAgICAgfSk7XG4gICAgfVxuICB9O31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5mYWN0b3J5KCdiYWJlbGZpc2hFdmVudCcsIFsnJHJvb3RTY29wZScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBldmVudHMgPSB7fTtcblxuICAvKipcbiAgICogRXhlY3V0ZSBhbiBldmVudFxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IGV2ZW50TmFtZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgIChldmVudHNbZXZlbnROYW1lXSB8fCBbXSkuZm9yRWFjaChmdW5jdGlvbiAoZXZlbnRSZWNvcmQpIHtcbiAgICAgIGV2ZW50UmVjb3JkKGRhdGEpO1xuICAgIH0pO1xuICB9XG5cbiAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLnRyYW5zbGF0aW9uOmxvYWRlZCcsIGZ1bmN0aW9uIChlLCBkYXRhKSB7XG4gICAgaWYgKGRhdGEucHJldmlvdXNMYW5nICE9PSBkYXRhLmxhbmcpIHtcbiAgICAgIHRyaWdnZXIoJ2NoYW5nZTpsYW5ndWFnZScsIGRhdGEpO1xuICAgIH1cbiAgfSk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLmxhbmc6bG9hZGVkJywgZnVuY3Rpb24gKGUsIGRhdGEpIHtcbiAgICB0cmlnZ2VyKCdsb2FkOmxhbmd1YWdlJywgZGF0YSk7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogUmVjb3JkIGEgZXZlbnRMaXN0ZW5lclxuICAgICAqIEV2ZW50IGF2YWlsYWJsZTpcbiAgICAgKiAgIC0gY2hhbmdlOmxhbmd1YWdlXG4gICAgICogQHBhcmFtIHtTdHJpbmd9ICAgZXZlbnROYW1lXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgICAgICAgIGNhbGxiYWNrIHRvIHJlY29yZFxuICAgICAqL1xuICAgIHNldDogZnVuY3Rpb24gKGV2ZW50TmFtZSwgY2IpIHtcbiAgICAgIGV2ZW50c1tldmVudE5hbWVdID0gZXZlbnRzW2V2ZW50TmFtZV0gfHwgW107XG4gICAgICBldmVudHNbZXZlbnROYW1lXS5wdXNoKGNiIHx8IGFuZ3VsYXIubm9vcCk7XG4gICAgfVxuICB9O31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5mYWN0b3J5KCdtYXJ2aW5NZW1vcnknLCBmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtZW1vcnkgPSB7XG4gICAgc3RhdGU6IHtcbiAgICAgIGN1cnJlbnQ6ICcnLFxuICAgICAgcHJldmlvdXM6ICcnLFxuICAgICAgbG9hZGVkOiBmYWxzZVxuICAgIH0sXG4gICAgbGFuZzoge1xuICAgICAgcHJldmlvdXM6ICdlbi1FTicsXG4gICAgICBjdXJyZW50OiAnZW4tRU4nXG4gICAgfSxcbiAgICBkYXRhOiBudWxsLFxuICAgIGF2YWlsYWJsZTogW11cbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIG1lbW9yeTtcbiAgICB9LFxuICAgIHNldDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgYW5ndWxhci5leHRlbmQobWVtb3J5LCBjb25maWcpO1xuICAgIH1cbiAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCduZ0JhYmVsZmlzaCcpLmZpbHRlcigndHJhbnNsYXRlJywgWydiYWJlbGZpc2gnLCBmdW5jdGlvbiAoYmFiZWxmaXNoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiB0cmFuc2FsdGUgZmlsdGVyXG4gICAqIFRyYW5zbGF0ZSBhIHN0cmluZyB0byBhbm90aGVyIGxhbmd1YWdlXG4gICAqIHt7IG5hbWUgfCB0cmFuc2xhdGU6J2ZyLUZSJzpcIm5hbWVcIn19XG4gICAqIEBwYXJhbSB7U3RyaW5nfSBpbnB1dCBJbnB1dCB2YWx1ZSB0byB0cmFuc2FsdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGxhbmcgTGFuZyB0byB0cmFuc2xhdGUgKG9wdGlvbmFsKVxuICAgKi9cblxuICBmdW5jdGlvbiBmaWx0ZXIoaW5wdXQsIGxhbmcpIHtcbiAgICByZXR1cm4gYmFiZWxmaXNoLmdldChsYW5nKVtpbnB1dF07XG4gIH1cblxuICBmaWx0ZXIuJHN0YXRlZnVsID0gdHJ1ZTtcblxuICByZXR1cm4gZmlsdGVyO31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5wcm92aWRlcignbWFydmluJywgZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogRGVmYXVsdCBjb25maWd1cmF0aW9uIGZvciB0aGUgbW9kdWxlXG4gICAqIEB0eXBlIHtPYmplY3R9XG4gICAqL1xuICB2YXIgY29uZmlnID0ge1xuICAgIHN0YXRlOiAnaG9tZScsXG4gICAgbGFuZzogJ2VuLUVOJyxcbiAgICB1cmw6ICcvaTE4bi9sYW5ndWFnZXMuanNvbicsXG4gICAgcm91dGVFdmVudE5hbWU6ICckc3RhdGVDaGFuZ2VTdWNjZXNzJyxcbiAgICBuYW1lc3BhY2U6ICdpMThuJyxcbiAgICBsYXp5OiBmYWxzZSxcbiAgICBsYXp5Q29uZmlnOiBbXSxcbiAgICBjdXJyZW50OiAnJyxcbiAgICBsb2c6IHRydWUsXG4gICAgYmluZFRvU2NvcGU6IHRydWVcbiAgfTtcblxuICAvKipcbiAgICogQ29uZmlndXJlIHRoZSBzZXJ2aWNlIHdpdGggYSBwcm92aWRlciBmcm9tIHRoZSBjb25maWcgb2YgeW91ciBtb2R1bGVcbiAgICogQHBhcmFtICB7T2JqZWN0fSBwYXJhbXMgQ29uZmlndXJhdGlvbiBvYmplY3RcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uIGluaXRCYWJlbGZpc2hDb25maWcocGFyYW1zKSB7XG4gICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBwYXJhbXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIC8qKlxuICAgKiBBZGQgZWFjaCBsYW5ndWFnZSBmb3IgeW91ciBhcHBsaWNhdGlvblxuICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdCB7bGFuZzogXCJcIix1cmw6IFwiXCJ9XG4gICAqIEByZXR1cm4ge2JhYmVsZmlzaFByb3ZpZGVyfVxuICAgKi9cbiAgdGhpcy5sYW5nID0gZnVuY3Rpb24gbGFuZyhvcHQpIHtcblxuICAgIGlmICghb3B0LmxhbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignW21hcnZpblByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IGxhbmcnKTtcbiAgICB9XG5cbiAgICBpZiAoIW9wdC51cmwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignW21hcnZpblByb3ZpZGVyQGxhbmddIFlvdSBtdXN0IHNldCB0aGUga2V5IHVybCcpO1xuICAgIH1cblxuICAgIGNvbmZpZy5sYXp5ID0gdHJ1ZTtcbiAgICBjb25maWcubGF6eUNvbmZpZy5wdXNoKG9wdCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgdG8gdGhlIHNjb3BlIGFsbCB0cmFuc2xhdGlvbnNcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKiBAcGFyYW0gIHtCb29sZWFufSBpc0JpbmRcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMuYmluZFRvU2NvcGUgPSBmdW5jdGlvbiBiaW5kVG9TY29wZShpc0JpbmQpIHtcbiAgICBjb25maWcuYmluZFRvU2NvcGUgPSBpc0JpbmQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIEFjdGl2ZSB2ZXJib3NlIG1vZGVcbiAgICogQGRlZmF1bHQgdHJ1ZVxuICAgKiBAcGFyYW0gIHtCb29sZWFufSBpc1ZlcmJvc2VcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG4gIHRoaXMudmVyYm9zZSA9IGZ1bmN0aW9uIHZlcmJvc2UoaXNWZXJib3NlKSB7XG4gICAgY29uZmlnLmxvZyA9IGlzVmVyYm9zZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICAvKipcbiAgICogU2V0IHRoZSByb3V0ZSBldmVudCBOYW1lIHRvIGxpc3RlbiB0b1xuICAgKiBAZGVmYXVsdCAkc3RhdGVDaGFuZ2VTdWNjZXNzXG4gICAqIEBwYXJhbSAge1N0cmluZ30gZXZlbnROYW1lXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuICB0aGlzLnJvdXRpbmdFdmVudCA9IGZ1bmN0aW9uIHJvdXRpbmdFdmVudChldmVudE5hbWUpIHtcbiAgICBjb25maWcucm91dGVFdmVudE5hbWUgPSBldmVudE5hbWU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgLyoqXG4gICAqIE1hcnZpbiBzZXJ2aWNlXG4gICAqL1xuICB0aGlzLiRnZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcblxuICAgICAgLyoqXG4gICAgICAgKiBSZXR1cm4gYmFiZWxmaXNoIGNvbmZpZ3VyYXRpb25cbiAgICAgICAqIEByZXR1cm4ge09iamVjdH1cbiAgICAgICAqL1xuICAgICAgZ2V0Q29uZmlnOiBmdW5jdGlvbiBnZXRDb25maWcoKSB7XG4gICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIFJldHVybiB0aGUgZGVmYXVsdCBldmVudCBuYW1lIGluIG9yZGVyIHRvIGxpc3RlbiBhIG5ldyBzdGF0ZXx8cm91dGVcbiAgICAgICAqIEByZXR1cm4ge1N0cmluZ31cbiAgICAgICAqL1xuICAgICAgZ2V0Um91dGVFdmVudDogZnVuY3Rpb24gZ2V0Um91dGVFdmVudCgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yb3V0ZUV2ZW50TmFtZTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBuYW1lc3BhY2Ugb2YgdGhlIGFwcGxpY2F0aW9uXG4gICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgKi9cbiAgICAgIGdldE5hbWVzcGFjZTogZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLm5hbWVzcGFjZTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBsYW5nIGZvciB5b3VyIGFwcC5cbiAgICAgICAqIC0gWW91IGNhbiB1c2UgdGhlIHByb3ZpZGVyXG4gICAgICAgKiAtIFlvdSBjYW4gdXNlIGh0bWwgZGVmYXVsdCBhdHRyXG4gICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgKi9cbiAgICAgIGdldERlZmF1bHRMYW5nOiBmdW5jdGlvbiBnZXREZWZhdWx0TGFuZygpIHtcblxuICAgICAgICBpZiAoY29uZmlnLmxhbmcpIHtcbiAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQubGFuZyA9IGNvbmZpZy5sYW5nLnNwbGl0KCctJylbMF07XG4gICAgICAgICAgcmV0dXJuIGNvbmZpZy5sYW5nO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nICsgJy0nICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcudG9VcHBlckNhc2UoKTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogTGlzdCBlYWNoIGxhbmcgYXZhaWxhYmxlIGZvciBsYXp5IG1vZGVcbiAgICAgICAqIEByZXR1cm4ge0FycmF5fVxuICAgICAgICovXG4gICAgICBnZXRMYXp5TGFuZ0F2YWlsYWJsZTogZnVuY3Rpb24gZ2V0TGF6eUxhbmdBdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiBjb25maWcubGF6eUNvbmZpZy5tYXAoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgICByZXR1cm4gaXRlbS5sYW5nO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogR2V0IHRoZSBsYXp5IGNvbmZpZ3VyYXRpb24gZm9yIGFueSBsYW5nXG4gICAgICAgKiAtIERlZmF1bHQgaXMgdGhlIGNvbmZpZyBsYW5nXG4gICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGxhbmdLZXlcbiAgICAgICAqIEByZXR1cm4ge09iamV0fVxuICAgICAgICovXG4gICAgICBnZXRMYXp5Q29uZmlnOiBmdW5jdGlvbiBnZXRMYXp5Q29uZmlnKGxhbmdLZXkpIHtcblxuICAgICAgICB2YXIgbGFuZ1RvRmluZCA9IGxhbmdLZXkgfHwgdGhpcy5nZXREZWZhdWx0TGFuZygpO1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenlDb25maWcuZmlsdGVyKGZ1bmN0aW9uIChvKSB7XG4gICAgICAgICAgcmV0dXJuIG8ubGFuZyA9PT0gbGFuZ1RvRmluZDtcbiAgICAgICAgfSlbMF0gfHwge307XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIEZpbmQgYSBsYXp5IGNvbmZpZyBieSBpdHMgdXJsXG4gICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHVybFxuICAgICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAgICovXG4gICAgICBnZXRMYXp5Q29uZmlnQnlVcmw6IGZ1bmN0aW9uIGdldExhenlDb25maWdCeVVybCh1cmwpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5sYXp5Q29uZmlnLmZpbHRlcihmdW5jdGlvbiAobykge1xuICAgICAgICAgIHJldHVybiBvLnVybCA9PT0gdXJsO1xuICAgICAgICB9KVswXTtcbiAgICAgIH0sXG5cbiAgICAgIGlzVmVyYm9zZTogZnVuY3Rpb24gaXNWZXJib3NlKCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxvZztcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogU2hvdWxkIHdlIHVzZSB0aGUgbGF6eSBtb2RlIGZvciB0aGUgYXBwbGljYXRpb25cbiAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICAgKi9cbiAgICAgIGlzTGF6eTogZnVuY3Rpb24gaXNMYXp5KCkge1xuICAgICAgICByZXR1cm4gY29uZmlnLmxhenk7XG4gICAgICB9LFxuXG4gICAgICAvKipcbiAgICAgICAqIENoZWNrIGlmIHdlIG5lZWQgdG8gYmluZCBkYXRhIHRvIHRoZSBzY29wZVxuICAgICAgICogQGRlZmF1bHQgdHJ1ZVxuICAgICAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICAgICAqL1xuICAgICAgaXNCaW5kVG9TY29wZTogZnVuY3Rpb24gaXNCaW5kVG9TY29wZSgpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5iaW5kVG9TY29wZTtcbiAgICAgIH1cbiAgICB9O1xuICB9O1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdiYWJlbGZpc2gnLCBbJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCAnYmFiZWxmaXNoTGFuZycsICdtYXJ2aW5UYXNrcycsICdiYWJlbGZpc2hFdmVudCcsIGZ1bmN0aW9uIChtYXJ2aW4sIG1hcnZpbk1lbW9yeSwgYmFiZWxmaXNoTGFuZywgbWFydmluVGFza3MsIGJhYmVsZmlzaEV2ZW50KSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBtb2RlbCA9IG1hcnZpbk1lbW9yeS5nZXQoKTtcblxuICAvKipcbiAgICogUmV0dXJuIHRoZSBjdXJyZW50IHN0YXRlIHRyYW5zbGF0aW9uXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGdldChsYW5nKSB7XG5cbiAgICB2YXIgY3VycmVudExhbmcgPSBtb2RlbC5kYXRhW2xhbmcgfHwgbW9kZWwubGFuZy5jdXJyZW50XSB8fCB7fSxcbiAgICAgICAgY29tbW9uID0ge307XG5cbiAgICBpZiAoIWN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdKSB7XG5cbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbbmdCYWJlbGZpc2guYmFiZWxmaXNoQGdldF0gTm8gdHJhbnNsYXRpb24gYXZhaWxhYmxlIGZvciB0aGUgcGFnZSAlcyBmb3IgdGhlIGxhbmcgJXMnLCBtb2RlbC5zdGF0ZS5jdXJyZW50LCAobGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnQpKTtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnRMYW5nW21vZGVsLnN0YXRlLmN1cnJlbnRdID0ge307XG4gICAgfVxuXG4gICAgYW5ndWxhci5leHRlbmQoY29tbW9uLCB7fSwgY3VycmVudExhbmcuX2NvbW1vbik7XG4gICAgcmV0dXJuIGFuZ3VsYXIuZXh0ZW5kKGNvbW1vbiwgY3VycmVudExhbmdbbW9kZWwuc3RhdGUuY3VycmVudF0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgdHJhbnNsYXRpb25zIGF2YWlsYWJsZSBmb3IgYSBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFsbChsYW5nKSB7XG4gICAgcmV0dXJuIG1vZGVsLmRhdGFbbGFuZyB8fCBtb2RlbC5sYW5nLmN1cnJlbnRdO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiBlYWNoIHRyYW5zbGF0aW9ucyBhdmFpbGFibGUgZm9yIHlvdXIgYXBwXG4gICAqIEByZXR1cm4ge09iamVjdH1cbiAgICovXG5cbiAgZnVuY3Rpb24gdHJhbnNsYXRpb25zKCkge1xuICAgIHJldHVybiBtb2RlbC5kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHlvdSBhbHJlYWR5IGxvYWQgdGhpcyBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gIGxhbmdcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICovXG5cbiAgZnVuY3Rpb24gaXNMYW5nTG9hZGVkKGxhbmcpIHtcbiAgICByZXR1cm4gISFtb2RlbC5kYXRhICYmICEhIG1vZGVsLmRhdGFbbGFuZ107XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IExhbmd1YWdlXG4gICAqIEByZXR1cm4ge1N0cmluZ30gbGFuZ1xuICAgKi9cblxuICBmdW5jdGlvbiBjdXJyZW50KCkge1xuICAgIHJldHVybiBtb2RlbC5sYW5nLmN1cnJlbnQ7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBlYWNoIGxhbmd1YWdlIGF2YWlsYWJsZSBpbiBiYWJlbGZpc2hcbiAgICogQHJldHVybiB7QXJyYXl9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGdldExhbmd1YWdlcygpIHtcblxuICAgIGlmIChtb2RlbC5hdmFpbGFibGUuaW5kZXhPZignX2NvbW1vbicpID4gLTEpIHtcbiAgICAgIG1vZGVsLmF2YWlsYWJsZS5zcGxpY2UobW9kZWwuYXZhaWxhYmxlLmluZGV4T2YoJ19jb21tb24nKSwgMSk7XG4gICAgfVxuICAgIHJldHVybiBtb2RlbC5hdmFpbGFibGU7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIHRoZSBjdXJyZW50IGxhbmd1YWdlXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiB1cGRhdGVMYW5nKGxhbmcpIHtcbiAgICBiYWJlbGZpc2hMYW5nLnNldChsYW5nLCBtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZSk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhIGN1c3RvbSBsYW5nXG4gICAqIEBwYXJhbSAge1N0cmluZ30gbGFuZ1xuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiBsb2FkTGFuZ3VhZ2UobGFuZykge1xuICAgIHZhciBjb25maWcgPSBtYXJ2aW4uZ2V0TGF6eUNvbmZpZyhsYW5nKTtcbiAgICBiYWJlbGZpc2hMYW5nLmxvYWQoY29uZmlnLnVybCwgbGFuZyk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdldDogZ2V0LFxuICAgIGFsbDogYWxsLFxuICAgIGN1cnJlbnQ6IGN1cnJlbnQsXG4gICAgdHJhbnNsYXRpb25zOiB0cmFuc2xhdGlvbnMsXG4gICAgbGFuZ3VhZ2VzOiBnZXRMYW5ndWFnZXMsXG4gICAgaXNMYW5nTG9hZGVkOiBpc0xhbmdMb2FkZWQsXG4gICAgdXBkYXRlTGFuZzogdXBkYXRlTGFuZyxcbiAgICBsb2FkOiBsb2FkTGFuZ3VhZ2UsXG4gICAgb246IGJhYmVsZmlzaEV2ZW50LnNldFxuICB9O31dKTsiLCJhbmd1bGFyLm1vZHVsZSgnbmdCYWJlbGZpc2gnKS5zZXJ2aWNlKCdiYWJlbGZpc2hMYW5nJywgWyckaHR0cCcsICckcm9vdFNjb3BlJywgJ21hcnZpbicsICdtYXJ2aW5NZW1vcnknLCAnbWFydmluVGFza3MnLCBmdW5jdGlvbiAoJGh0dHAsICRyb290U2NvcGUsIG1hcnZpbiwgbWFydmluTWVtb3J5LCBtYXJ2aW5UYXNrcykge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgJHJvb3RTY29wZS4kb24oJ25nQmFiZWxmaXNoLm1hcnZpbjpyZXF1ZXN0VHJhbnNsYXRpb24nLCBmdW5jdGlvbiAoZSwgZGF0YSkge1xuICAgIGluaXQoZGF0YS5zdGF0ZSwgZGF0YS51cmwpO1xuICB9KTtcblxuICAvKipcbiAgICogTG9hZCBhIHRyYW5zbGF0aW9uIGFuZCBhdHRhY2ggaXQgdG8gdGhlIHNjb3BlIGlmIHdlIGNhblxuICAgKiBAcGFyYW0gIHtTdHJpbmd9IHN0YXRlTmFtZSBjdXJyZW50IHN0YXRlXG4gICAqIEBwYXJhbSAge1N0cmluZ30gdXJsICAgICAgIFVybCB0byBsb2FkXG4gICAqIEByZXR1cm4ge3ZvaWR9XG4gICAqL1xuXG4gIGZ1bmN0aW9uIGluaXQoc3RhdGVOYW1lLCB1cmwpIHtcbiAgICBzZXRTdGF0ZShzdGF0ZU5hbWUpO1xuXG4gICAgbG9hZCh1cmwpLnRoZW4obWFydmluLmlzQmluZFRvU2NvcGUoKSA/IG1hcnZpblRhc2tzLmJpbmRUb1Njb3BlIDogYW5ndWxhci5ub29wKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggYSB0cmFuc2xhdGlvbiBmb3IgYSBzdGF0ZSB0byB0aGUgc2NvcGUgaWYgd2UgY2FuXG4gICAqIEBwYXJhbSAge1N0cmluZ30gc3RhdGVOYW1lIEN1cnJlbnQgc3RhdGUgbmFtZVxuICAgKiBAcmV0dXJuIHt2b2lkfVxuICAgKi9cblxuICBmdW5jdGlvbiBiaW5kRm9yU3RhdGUoc3RhdGVOYW1lKSB7XG4gICAgc2V0U3RhdGUoc3RhdGVOYW1lKTtcblxuICAgIGlmIChtYXJ2aW4uaXNCaW5kVG9TY29wZSgpKSB7XG4gICAgICBtYXJ2aW5UYXNrcy5iaW5kVG9TY29wZShzdGF0ZU5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvcmQgdGhlIGN1cnJlbnQgc3RhdGVcbiAgICogQHBhcmFtIHtTdHJpbmd9IHN0YXRlTmFtZVxuICAgKi9cblxuICBmdW5jdGlvbiBzZXRTdGF0ZShzdGF0ZU5hbWUpIHtcbiAgICBtb2RlbC5zdGF0ZS5jdXJyZW50ID0gc3RhdGVOYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgY3VycmVudCBsYW5ndWFnZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gICBsYW5nIGN1cnJlbnQgbGFuZ1xuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYlxuICAgKiBAZXZlbnQgbmdCYWJlbGZpc2gubGFuZzpzZXRMYW5ndWFnZVxuICAgKi9cblxuICBmdW5jdGlvbiBzZXRMYW5ndWFnZShsYW5nLCBjYikge1xuXG4gICAgY2IgPSBjYiB8fCBhbmd1bGFyLm5vb3A7XG4gICAgbW9kZWwubGFuZy5wcmV2aW91cyA9IGFuZ3VsYXIuY29weShtb2RlbC5sYW5nLmN1cnJlbnQpO1xuICAgIG1vZGVsLmxhbmcuY3VycmVudCA9IGxhbmc7XG4gICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubGFuZzpzZXRMYW5ndWFnZScsIG1vZGVsLmxhbmcpO1xuICAgIGNiKCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZCBhIHRyYW5zbGF0aW9uXG4gICAqIEBwYXJhbSAge1N0cmluZ30gdXJsXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBMYW5nIGxvYWQgYSBjdXN0b20gbGFuZyAobGF6eSBtb2RlIG9ubHkpXG4gICAqIEByZXR1cm4ge3EuUHJvbWlzZX1cbiAgICovXG5cbiAgZnVuY3Rpb24gbG9hZCh1cmwsIGxhbmcpIHtcblxuICAgIHVybCA9IHVybCB8fCBtYXJ2aW4uZ2V0Q29uZmlnKCkudXJsO1xuXG4gICAgaWYgKG1hcnZpbi5pc0xhenkoKSAmJiAhbGFuZykge1xuICAgICAgdXJsID0gbWFydmluLmdldExhenlDb25maWcobW9kZWwubGFuZy5jdXJyZW50IHx8IG1hcnZpbi5nZXRDb25maWcoKS5sYW5nKS51cmw7XG4gICAgfVxuXG4gICAgcmV0dXJuICRodHRwLmdldCh1cmwpLmVycm9yKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdbbmdCYWJlbGZpc2guYmFiZWxmaXNoTGFuZ0Bsb2FkXSBDYW5ub3QgbG9hZCB0aGUgdHJhbnNsYXRpb24gZmlsZScpO1xuICAgICAgfVxuICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIHRyYW5zbGF0ZShkYXRhLCBsYW5nKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCdWlsZCB0cmFuc2xhdGlvbnMgb3IgYSBsYW5ndWFnZVxuICAgKiBAcGFyYW0gIHtPYmplY3R9IGRhdGFcbiAgICogQGV2ZW50ICduZ0JhYmVsZmlzaC5sYW5nOmxvYWRlZCdcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG5cbiAgZnVuY3Rpb24gdHJhbnNsYXRlKGRhdGEsIGxhbmcpIHtcblxuICAgIGxhbmcgPSBsYW5nIHx8IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgIGlmIChtYXJ2aW4uaXNMYXp5KCkpIHtcbiAgICAgIG1vZGVsLmRhdGEgPSBtb2RlbC5kYXRhIHx8IHt9O1xuICAgICAgbW9kZWwuZGF0YVtsYW5nXSA9IGRhdGE7XG5cbiAgICAgIGlmICgtMSA9PT0gbW9kZWwuYXZhaWxhYmxlLmluZGV4T2YobGFuZykpIHtcbiAgICAgICAgbW9kZWwuYXZhaWxhYmxlLnB1c2gobGFuZyk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgbW9kZWwuZGF0YSA9IGRhdGE7XG4gICAgICBtb2RlbC5hdmFpbGFibGUgPSBPYmplY3Qua2V5cyhkYXRhKTtcbiAgICB9XG4gICAgJHJvb3RTY29wZS4kZW1pdCgnbmdCYWJlbGZpc2gubGFuZzpsb2FkZWQnLCB7XG4gICAgICBsYW5nOiBsYW5nXG4gICAgfSk7XG4gIH1cblxuICB0aGlzLmluaXQgPSBpbml0O1xuICB0aGlzLmxvYWQgPSBsb2FkO1xuICB0aGlzLnRyYW5zbGF0ZSA9IHRyYW5zbGF0ZTtcbiAgdGhpcy5zZXQgPSBzZXRMYW5ndWFnZTtcbiAgdGhpcy5iaW5kRm9yU3RhdGUgPSBiaW5kRm9yU3RhdGU7XG4gIHRoaXMuc2V0U3RhdGUgPSBzZXRTdGF0ZTtcblxuICB9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ25nQmFiZWxmaXNoJykuc2VydmljZSgnbWFydmluVGFza3MnLCBbJyRyb290U2NvcGUnLCAnbWFydmluJywgJ21hcnZpbk1lbW9yeScsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBtYXJ2aW4sIG1hcnZpbk1lbW9yeSkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgbW9kZWwgPSBtYXJ2aW5NZW1vcnkuZ2V0KCk7XG5cbiAgLyoqXG4gICAqIExvYWQgYSB0cmFuc2xhdGlvbiB0byB0aGUgc2NvcGVcbiAgICogQGV2ZW50ICduYkJhbGViZWxmaXNoLm1hcnZpbjpyZXF1ZXN0VHJhbnNsYXRpb24nIGlmIHdlIGFyZSBpbiBsYXp5IG1vZGVcbiAgICogQHJldHVybiB7dm9pZH1cbiAgICovXG5cbiAgZnVuY3Rpb24gYmluZFRvU2NvcGUoKSB7XG5cbiAgICB2YXIgbGFuZyA9IG1vZGVsLmxhbmcuY3VycmVudDtcblxuICAgIC8vIFdlIGRvIG5vdCB3YW50IHRvIGhhdmUgbXVsdGlwbGUgcmVsb2FkIGlmIHRoZSBsYW5nIGlzIGFscmVhZHkgcHJlc2VudFxuICAgIGlmIChtYXJ2aW4uaXNMYXp5KCkgJiYgIW1vZGVsLmRhdGFbbGFuZ10pIHtcbiAgICAgICRyb290U2NvcGUuJGVtaXQoJ25nQmFiZWxmaXNoLm1hcnZpbjpyZXF1ZXN0VHJhbnNsYXRpb24nLCB7XG4gICAgICAgIHN0YXRlOiBtb2RlbC5zdGF0ZS5jdXJyZW50LFxuICAgICAgICB1cmw6IG1hcnZpbi5nZXRMYXp5Q29uZmlnKGxhbmcpLnVybFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgc2V0VHJhbnNsYXRpb24oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkIHRyYW5zbGF0aW9ucyB0byB0aGUgc2NvcGUgb3IgdXBkYXRlIHRoZSBtb2RlbCBpZiB5b3Ugc2V0IGNvbmZpZy5iaW5kVG9TY29wZSB0byBmYWxzZS5cbiAgICogQGV2ZW50IG5nQmFiZWxmaXNoLnRyYW5zbGF0aW9uOmxvYWRlZFxuICAgKi9cblxuICBmdW5jdGlvbiBzZXRUcmFuc2xhdGlvbigpIHtcblxuICAgIHZhciBsYW5nID0gbW9kZWwubGFuZy5jdXJyZW50O1xuICAgIHZhciBzdGF0ZSA9IG1vZGVsLnN0YXRlLmN1cnJlbnQsXG4gICAgICAgIHN0YXRlSTE4biwgdHJhbnNsYXRpb24gPSB7fTtcblxuICAgIC8vIFByZXZlbnQgdG9vIG1hbnkgcmVsb2FkXG4gICAgaWYgKHN0YXRlID09PSBtb2RlbC5zdGF0ZS5wcmV2aW91cyAmJiBtb2RlbC5sYW5nLmN1cnJlbnQgPT09IG1vZGVsLmxhbmcucHJldmlvdXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIW1vZGVsLmRhdGFbbGFuZ10pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzdGF0ZUkxOG4gPSBtb2RlbC5kYXRhW2xhbmddW3N0YXRlXTtcblxuICAgIC8qKlxuICAgICAqIFByZXZlbnQgdGhlIGVycm9yXG4gICAgICogICAgID4gVHlwZUVycm9yOiBDYW5ub3QgcmVhZCBwcm9wZXJ0eSAnJCRoYXNoS2V5JyBvZiB1bmRlZmluZWRcbiAgICAgKiBjZiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2Rob2tvL25nQmFiZWxmaXNoL2lzc3Vlcy81fVxuICAgICAqL1xuICAgIGlmICghc3RhdGVJMThuKSB7XG4gICAgICBtb2RlbC5kYXRhW2xhbmddW3N0YXRlXSA9IHt9O1xuXG4gICAgICBpZiAobWFydmluLmlzVmVyYm9zZSgpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignW25nQmFiZWxmaXNoLm1hcnZpblRhc2tzQHNldFRyYW5zbGF0aW9uXSBObyB0cmFuc2xhdGlvbiBhdmFpbGFibGUgZm9yIHRoZSBwYWdlICVzIGZvciB0aGUgbGFuZyAlcycsIHN0YXRlLCBsYW5nKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBhbmd1bGFyLmV4dGVuZChcbiAgICB0cmFuc2xhdGlvbiwgYW5ndWxhci5leHRlbmQoe30sIG1vZGVsLmRhdGFbbGFuZ10uX2NvbW1vbiksIHN0YXRlSTE4bik7XG5cbiAgICBpZiAobWFydmluLmlzQmluZFRvU2NvcGUoKSkge1xuXG4gICAgICBpZiAobWFydmluLmdldE5hbWVzcGFjZSgpKSB7XG4gICAgICAgICRyb290U2NvcGVbbWFydmluLmdldE5hbWVzcGFjZSgpXSA9IHRyYW5zbGF0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYW5ndWxhci5leHRlbmQoJHJvb3RTY29wZSwgdHJhbnNsYXRpb24pO1xuXG4gICAgICAgIGlmIChtYXJ2aW4uaXNWZXJib3NlKCkpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ1tuZ0JhYmVsZmlzaC5tYXJ2aW5UYXNrc0BzZXRUcmFuc2xhdGlvbl0gSXQgaXMgYmV0dGVyIHRvIExvYWQgaTE4biBpbnNpZGUgYSBuYW1lc3BhY2UuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAkcm9vdFNjb3BlLiRlbWl0KCduZ0JhYmVsZmlzaC50cmFuc2xhdGlvbjpsb2FkZWQnLCB7XG4gICAgICBjdXJyZW50U3RhdGU6IHN0YXRlLFxuICAgICAgbGFuZzogbGFuZyxcbiAgICAgIHByZXZpb3VzTGFuZzogbW9kZWwubGFuZy5wcmV2aW91c1xuICAgIH0pO1xuXG4gIH1cblxuICB0aGlzLmJpbmRUb1Njb3BlID0gYmluZFRvU2NvcGU7XG4gIHRoaXMuc2V0VHJhbnNsYXRpb24gPSBzZXRUcmFuc2xhdGlvbjt9XSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9