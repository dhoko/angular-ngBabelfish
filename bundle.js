(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * i18nBind directive
 * Load a translation for a var
 */
module.exports = ['babelfish', function(babelfish) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.append(babelfish.get(attr.i18nBindLang || babelfish.current() )[attr.i18nBind]);
        }
    }

}];
},{}],2:[function(require,module,exports){
/**
 * i18nLoad directive
 * Load a translation from a click on a button with the attr i18n-load
 */
module.exports = ['babelfish', function(babelfish) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.on('click',function() {
                scope.$apply(function() {
                    babelfish.updateLang(attr.i18nLoad);
                });
            });
        }
    }

}];
},{}],3:[function(require,module,exports){
/**
 * transalte filter
 * Translate a string to another language
 * {{ name | translate:'fr-FR':"name"}}
 */
module.exports = ['babelfish', '$timeout', function (babelfish, $timeout) {

    return function (input, lang, key) {
        return babelfish.get(lang)[key];
    }

}];
},{}],4:[function(require,module,exports){
/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('ngBabelfish', [])
    .provider('babelfish', require('./providers/babelfish'))
    .directive('i18nLoad', require('./directives/i18nLoad'))
    .directive('i18nBind', require('./directives/i18nBind'))
    .filter('translate', require('./filters/translate'))
    .run(['babelfish', '$state','$rootScope', function(babelfish, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on('$stateChangeSuccess', function(e, toState) {
            babelfish.updateState(toState.name);
        });

        babelfish.load();
    }]);
},{"./directives/i18nBind":1,"./directives/i18nLoad":2,"./filters/translate":3,"./providers/babelfish":5}],5:[function(require,module,exports){
/**
 * I18n Service Provider
 * Load your translations and update $rootScope
 * It gives you access to your translation.
 */
module.exports = function() {

    var i18n = {
        current: "",
        data: {},
        available: [],
        currentState: "",
        active: false
    }

    /**
     * Default configuration for the module
     * @type {Object}
     */
    var config = {
        state: "home",
        lang: "en-EN",
        url: "/i18n/languages.json",
        namespace: "",
        lazy: false,
        urls: [
            {
                lang: "",
                url: ""
            }
        ],
        current: ""
    };

    /**
     * Load your url from lazy mode
     * @return {String} url
     */
    function loadLazyDefaultUrl() {

        var url = config.url;
        if(config.lazy) {
            url = config.urls.filter(function (o) {
                return o.lang === config.lang;
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
     * Configure the service with a provider from the config of your module
     * @param  {Object} params Configuration object
     * @return {void}
     */
    this.languages = function languagesConfig(params) {
        angular.extend(config, params);
    }

    /**
     * Babelfish service
     */
    this.$get = ['$rootScope', '$http', function($rootScope, $http) {

        /**
         * Load a translation to the $scope
         * - doc BCP 47 {@link http://tools.ietf.org/html/bcp47}
         * - doc Value of HTML5 lang attr {@link http://webmasters.stackexchange.com/questions/28307/value-of-the-html5-lang-attribute}
         * @param {String} lang Your language cf BCP 47
         */
        function setTranslation(page) {

            page = page || config.state;
            i18n.currentState = page;
            lang = i18n.current;
            i18n.active = true;

            if(i18n.data[lang]) {

                /**
                 * Prevent the error
                 *     > TypeError: Cannot read property '$$hashKey' of undefined
                 * cf {@link https://github.com/dhoko/ngBabelfish/issues/5}
                 */
                if(!i18n.data[lang][page]) {
                    i18n.data[lang][page] = {};
                    console.warn('[ngBabelfish-babelfish@setTranslation] No translation available for the page %s for the lang %s',page, lang);
                }

                angular.extend(i18n.data[lang]['_common'], {languages: i18n.available});
                angular.extend(i18n.data[lang][page], i18n.data[lang]['_common']);

                if(config.namespace) {
                    $rootScope[config.namespace] = i18n.data[lang][page];
                }else {
                    angular.extend($rootScope, i18n.data[lang][page]);
                }
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

            if(!lang) {
                lang = old + '-' + old.toUpperCase();
            }else {
                document.documentElement.lang = lang.split('-')[0];
            }

            config.lang = i18n.current = lang;

            $rootScope.$emit('i18n:babelfish:changed', {
                previous: (old + '-' + old.toUpperCase()),
                value: lang
            });

            // Load the new language if we do not already have it
            if(config.lazy && !i18n.data[lang]) {
                service.load();
            }

        }

        // Listen when you change the language in your application
        $rootScope.$on('i18n:babelfish:changed', function() {
            setTranslation(i18n.currentState);
        });

        var service = {

            load: function load(url, name) {

                url = url || loadLazyDefaultUrl();

                var lang = config.lang || document.documentElement.lang + '-' + document.documentElement.lang.toUpperCase();

                // Set the default lang for the html
                if(!document.documentElement.lang && config.lang) {
                    document.documentElement.lang = config.lang.split('-')[0];
                }

                if(i18n.data[i18n.current]) {
                    return;
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
                            i18n.available.push(i18n.current);
                        }else {
                            i18n.available = Object.keys(i18n.data);
                        }
                    })
                    .then(function() {
                        setTranslation();
                    });
            },

            get: function get(lang) {
                var currentLang = i18n.data[lang || i18n.current];

                if(!currentLang[i18n.currentState]) {
                    console.warn('[ngBabelfish-babelfish@get] No translation available for the page %s for the lang %s',i18n.currentState, (lang || i18n.current));
                    currentLang[i18n.currentState] = {};
                }

                return angular.extend(currentLang[i18n.currentState] , currentLang['_common']);
            },

            all: function all(lang) {
                return i18n.data[lang || i18n.current];
            },

            current: function current() {
                return i18n.current;
            },
            updateState: setTranslation,
            updateLang: loadLanguage,
            isLoaded: function isLoaded() {
                return i18n.active;
            }
        };

        return service;
    }];

};
},{}]},{},[4])