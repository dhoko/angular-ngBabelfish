(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * i18nBind directive
 * Load a translation for a var
 *
 * If you do not provide any lang (i18n-bind-lang), we will compile the directive, else it will update the textContent.
 *
 * We do not update the translationKey's value because it will change the reference key from i18n-bind. Yup that's weird.
 *
 * Isolate scope FTW
 */
module.exports = ['translator', function (translator) {

    'use strict';


    return {
        restrict: "A",
        scope: {
            translationKey: "=i18nBind",
            translationLang: "@i18nBindLang"
        },
        template: "{{translationKey}}",

        link: function(scope,el,attr) {

            var key = '',
                namespace = translator.getNamespace();

            key = (namespace) ? attr.i18nBind.replace(namespace + '.', '') : attr.i18nBind;

            // Because it breaks if you update translationKey...
            if(attr.i18nBindLang) {

                if(!translator.isLangLoaded(attr.i18nBindLang)) {
                    translator.loadTranslation(attr.i18nBindLang)
                        .then(function() {
                            el.text(translator.get(attr.i18nBindLang || translator.current())[key]);
                        });
                }else{
                    el.text(translator.get(attr.i18nBindLang || translator.current())[key]);
                }

            }

        }
    };

}];

},{}],2:[function(require,module,exports){
/**
 * i18nLoad directive
 * Load a translation from a click on a button with the attr i18n-load
 */
module.exports = ['translator', function (translator) {

    "use strict";

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.on('click',function() {
                scope.$apply(function() {
                    translator.updateLang(attr.i18nLoad);
                });
            });
        }
    };

}];
},{}],3:[function(require,module,exports){
module.exports = ['$rootScope', '$http', function ($rootScope, $http) {

    var config = {};
    var i18n = {
        current: "",
        data: {},
        available: [],
        currentState: "",
        active: false,
        previousLang: config.lang,
        stateLoaded: false
    };

    /**
     * Load your url from lazy mode
     * @return {String} url
     */
    function loadLazyDefaultUrl(customLang) {

        var url = config.url;
        var matchLang = customLang || config.lang;

        if(config.lazy) {
            url = config.urls.filter(function (o) {
                return o.lang === matchLang;
            })[0].url;
        }
        return url;
    }

    /**
     * Build i18n.data.
     * @param  {Object} data Data from the translation file
     */
    function buildI18n(data) {

        if(!config.lazy) {
            i18n.data = data;
            return;
        }

        i18n.data[i18n.current] = data;
    }

    /**
     * Load a translation to the $scope
     * - doc BCP 47 {@link http://tools.ietf.org/html/bcp47}
     * - doc Value of HTML5 lang attr {@link http://webmasters.stackexchange.com/questions/28307/value-of-the-html5-lang-attribute}
     * @param {String} lang Your language cf BCP 47
     */
    function setSoloTranslation() {

        // Prevent too many digest
        if(i18n.current === i18n.previousLang) {
          return;
        }

        i18n.active = true;

        var lang = i18n.current;
        var common = {}, currentPageTranslation = {};

        if(i18n.data[lang]) {

            angular.extend(common, i18n.data._common || {});
            currentPageTranslation = angular.extend(common, i18n.data[lang]);

            if(config.namespace) {
                $rootScope[config.namespace] = currentPageTranslation;
            }else {
                angular.extend($rootScope, currentPageTranslation);
            }

            $rootScope.$emit('ngBabelfish.translation:loaded', {
                lang: lang
            });
        }
    }

    /**
     * Load a translation to the $scope
     * - doc BCP 47 {@link http://tools.ietf.org/html/bcp47}
     * - doc Value of HTML5 lang attr {@link http://webmasters.stackexchange.com/questions/28307/value-of-the-html5-lang-attribute}
     * @param {String} lang Your language cf BCP 47
     */
    function setTranslation(page) {

        page = page || config.state;

        // Prevent too many digest
        if(i18n.currentState === page && i18n.stateLoaded && i18n.current === i18n.previousLang) {
          return;
        }

        i18n.currentState = page;
        i18n.active = true;

        var lang = i18n.current;
        var common = {}, currentPageTranslation = {};

        if(i18n.data[lang]) {

            /**
             * Prevent the error
             *     > TypeError: Cannot read property '$$hashKey' of undefined
             * cf {@link https://github.com/dhoko/ngBabelfish/issues/5}
             */
            if(!i18n.data[lang][page]) {
                i18n.data[lang][page] = {};

                if(config.log) {
                    console.warn('[ngBabelfish-translator@setTranslation] No translation available for the page %s for the lang %s',page, lang);
                }
            }

            angular.extend(common, i18n.data[lang]._common);
            currentPageTranslation = angular.extend(common, i18n.data[lang][page]);

            if(config.namespace) {
                $rootScope[config.namespace] = currentPageTranslation;
            }else {
                angular.extend($rootScope, currentPageTranslation);
            }

            $rootScope.$emit('ngBabelfish.translation:loaded', {
                currentState: page,
                lang: lang
            });

            i18n.stateLoaded = true;
        } else if (config.lazy) {

            angular.extend(common, i18n.data[lang]._common);
            currentPageTranslation = angular.extend(common, i18n.data[page]);

            if(config.namespace) {
                $rootScope[config.namespace] = currentPageTranslation;
            }else {
                angular.extend($rootScope, currentPageTranslation);
            }

            $rootScope.$emit('ngBabelfish.translation:loaded', {
                currentState: page,
                lang: lang
            });
        }
    }

    /**
     * Load a translation to the $scope for a language
     * - doc BCP 47 {@link http://tools.ietf.org/html/bcp47}
     * - doc Value of HTML5 lang attr {@link http://webmasters.stackexchange.com/questions/28307/value-of-the-html5-lang-attribute}
     * @trigger {Event} i18n:babelfish:changed {previous:XXX,value:XXX2}
     * @param {String} lang Your language cf BCP 47
     */
    function loadLanguage(lang) {

        var old = document.documentElement.lang;

        if(!old) {
            old = 'en';
        }

        // Find the current lang if it doesn't exist. Store the previous one too
        if(!lang) {
            lang = old + '-' + old.toUpperCase();
            i18n.previousLang = lang;
        }else {
            document.documentElement.lang = lang.split('-')[0];
            i18n.previousLang = old + '-' + old.toUpperCase();
        }

        config.lang = i18n.current = lang;

        $rootScope.$emit('ngBabelfish.translation:changed', {
            previous: (old + '-' + old.toUpperCase()),
            value: lang
        });

        // Load the new language if we do not already have it
        if(config.lazy && !i18n.data[lang]) {
            service.load();
        }

    }

    // Listen when you change the language in your application
    $rootScope.$on('ngBabelfish.translation:changed', function() {
        if(!config.isSolo) {
            setTranslation(i18n.currentState);
        }else{
            setSoloTranslation();
        }
    });

    var service = {

        setData: function setData(data) {

            i18n.stateLoaded = false;
            buildI18n(data);
            setTranslation();

        },

        /**
         * Configure this factory
         *
         * Available configuration:
         *
         *     var config = {
         *          state: 'home',
         *          lang: 'en-EN',
         *          url: '/i18n/languages.json',
         *          eventName: '$stateChangeSuccess',
         *          namespace: "",
         *          lazy: false,
         *          urls: [],
         *          current: "",
         *          log: true
         *      };
         * @param  {Object} customConfig
         */
        init: function init(customConfig) {
            config = customConfig;
        },

        /**
         * Load the module to be in solo mode without translations per state
         * @param  {Object} customConfig
         */
        initSolo: function initSolo(customConfig) {
            config = customConfig;
            config.isSolo = true;
        },

        /**
         * Load a translation file
         * @param  {String} url  URL for the current translation
         * @param  {String} name State's name
         */
        load: function load(url, name) {

            var lazyLang = false;
            if(config.lazy) {
                lazyLang = config.urls.filter(function (o) {
                    return o.lang === config.lang;
                })[0] || {};
            }

            url = url || loadLazyDefaultUrl();

            // Set the default lang for the html
            if(!document.documentElement.lang && config.lang) {
                document.documentElement.lang = config.lang.split('-')[0];
            }

            var lang = config.lang || document.documentElement.lang + '-' + document.documentElement.lang.toUpperCase();

            if(lazyLang && lazyLang.data) { //Lazy mode and data give directly
                i18n.current = lang;
                i18n.available = config.urls.map(function (item) {return item.lang;});

                config.current = name;

                buildI18n(lazyLang.data);
                setTranslation(i18n.currentState);

                return ;
            }
            else {

                if(i18n.data[i18n.current]) {
                    return;
                }

                if(config.data) { //data provider
                    i18n.current = lang;
                    buildI18n(config.data);
                    i18n.available = Object.keys(i18n.data);

                    if(config.isSolo && i18n.available.indexOf('_comon') > -1) {
                        i18n.available.splice(i18n.available.indexOf('_comon'),1);
                    }

                    if(!config.isSolo) {
                        setTranslation(i18n.currentState);
                    }else{
                        setSoloTranslation();
                    }

                    return ;
                }

                return $http.get(url)
                    .error(function() {
                        alert("Cannot load i18n translation file");
                    })
                    .success(function (data) {

                        if(config.lazy) {
                            config.current = name;
                        }
                        i18n.current = lang;
                        buildI18n(data);

                        if(config.lazy) {
                            i18n.available = config.urls.map(function (item) {return item.lang;});
                        }else {
                            i18n.available = Object.keys(i18n.data);

                            if(config.isSolo && i18n.available.indexOf('_comon') > -1) {
                                i18n.available.splice(i18n.available.indexOf('_comon'),1);
                            }
                        }
                    })
                    .then(function() {

                        if(!config.isSolo) {
                            setTranslation(i18n.currentState);
                        }else{
                            setSoloTranslation();
                        }
                    });
            }
        },

        /**
         * Load a new translation
         * @param {String} lang Lang to load
         * @param  {String} url  URL for the current translation
         */
        loadTranslation: function loadTranslation(lang, url) {

            url = url || loadLazyDefaultUrl(lang);

            if(!url) {
                throw new Error('[ngBabelfish-translator@loadTranslation] You want to load ' + lang + ' but you do not set an url for this lang (as a second argument)');
            }

            return $http.get(url)
                .error(function() {
                    alert("Cannot load i18n translation file");
                })
                .success(function (data) {

                    i18n.data[lang] = data;

                    if(config.lazy) {
                        i18n.available = config.urls.map(function (item) {return item.lang;});
                    }else {
                        i18n.available = Object.keys(i18n.data);
                    }
                });
        },

        /**
         * Return the current state translation
         * @param  {String} lang
         * @return {Object}
         */
        get: function get(lang) {
            var currentLang = i18n.data[lang || i18n.current] || {},
                common = {};


            if(config.isSolo) {
                return angular.extend({}, i18n.data._common || {}, currentLang);
            }


            if(!currentLang[i18n.currentState]) {

                if(config.log) {
                    console.warn('[ngBabelfish-translator@get] No translation available for the page %s for the  lang %s',i18n.currentState, (lang || i18n.current));
                }
                currentLang[i18n.currentState] = {};
            }

            angular.extend(common, {}, currentLang._common);
            return angular.extend(common, currentLang[i18n.currentState]);
        },

        /**
         * Get all translations available for a lang
         * @param  {String} lang
         * @return {Object}
         */
        all: function all(lang) {

            if(config.isSolo) {
                return angular.extend({}, i18n.data._common || {}, i18n.data[lang || i18n.current] || {});
            }

            return i18n.data[lang || i18n.current];
        },

        /**
         * Return each translations available for your app
         * @return {Object}
         */
        translations: function translations() {
          return i18n.data;
        },

        /**
         * Check if you already load this lang
         * @param  {String}  lang
         * @return {Boolean}
         */
        isLangLoaded: function isLangLoaded(lang) {
            return !!i18n.data[lang];
        },

        /**
         * Get the current Language
         * @return {String} lang
         */
        current: function current() {
            return i18n.current;
        },

        /**
         * Update translations for a state
         * @param  {String} state
         */
        updateState: setTranslation,

        /**
         * Update the lang for the application
         * It will load a new language
         * @param  {String} lang
         */
        updateLang: loadLanguage,

        /**
         * Check if we have loaded i18n
         * @return {Boolean}
         */
        isLoaded: function isLoaded() {
            return i18n.active;
        },

        /**
         * List each languages available for the application
         * @return {Array}
         */
        available: function available(){
            return i18n.available;
        },

        /**
         * Return the default event name in order to listen a new state||route
         * @return {String}
         */
        getEvent: function getEvent() {
            return config.eventName;
        },

        /**
         * Get the namespace of the application
         * @return {String}
         */
        getNamespace: function getNamespace() {
            return config.namespace;
        }
    };

    return service;
}];

},{}],4:[function(require,module,exports){
/**
 * transalte filter
 * Translate a string to another language
 * {{ name | translate:'fr-FR':"name"}}
 */
module.exports = ['babelfish', function (babelfish) {

    "use strict";

    return function (input, lang, key) {
        return babelfish.get(lang)[key];
    }

}];
},{}],5:[function(require,module,exports){
/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('ngBabelfish.solo', [])
    .factory('translator', require('./factory/translator'))
    .directive('i18nLoad', require('./directives/i18nLoad'))
    .directive('i18nBind', require('./directives/i18nBind'));

},{"./directives/i18nBind":1,"./directives/i18nLoad":2,"./factory/translator":3}],6:[function(require,module,exports){
require('./i18n-solo');

/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('ngBabelfish', ['ngBabelfish.solo'])
    .provider('babelfish', require('./providers/babelfish'))
    .filter('translate', require('./filters/translate'))
    .run(['babelfish', '$state','$rootScope', function(babelfish, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on(babelfish.getEvent(), function(e, toState) {
            babelfish.updateState(toState.name);
        });
        babelfish.load();
    }]);
},{"./filters/translate":4,"./i18n-solo":5,"./providers/babelfish":7}],7:[function(require,module,exports){
/**
 * I18n Service Provider
 * Load your translations and update $rootScope
 * It gives you access to your translation.
 */
module.exports = function() {

    "use strict";

    /**
     * Default configuration for the module
     * @type {Object}
     */
    var config = {
        state: 'home',
        lang: 'en-EN',
        url: '/i18n/languages.json',
        eventName: '$stateChangeSuccess',
        namespace: "",
        lazy: false,
        urls: [],
        current: "",
        log: true
    };

    /**
     * Configure the service with a provider from the config of your module
     * @param  {Object} params Configuration object
     * @return {void}
     */
    this.languages = function languagesConfig(params) {
        angular.extend(config, params);
        console.warn('[ngBabelfish-babelfishProvider@languages] Deprecated call, you should use babelfishProvider.init(). Will be removed in 2.0');
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
     * Babelfish service
     */
    this.$get = ['translator', function (translator) {
        translator.init(config);
        return Object.create(translator);
    }];
};
},{}]},{},[6])