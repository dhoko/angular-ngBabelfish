(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * i18nBind directive
 * Load a translation for a var
 */
module.exports = ['localize', function(localize) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.append(localize.get(attr.i18nBindLang || document.documentElement.lang)[attr.i18nBind]);
        }
    }

}];
},{}],2:[function(require,module,exports){
/**
 * i18nLoad directive
 * Load a translation from a click on a button with the attr i18n-load
 */
module.exports = ['localize', function(localize) {

    return {
        restrict: "A",
        link: function(scope,el,attr) {
            el.on('click',function() {
                scope.$apply(function() {
                    localize.updateLang(attr.i18nLoad);
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
module.exports = ['localize', '$timeout', function (localize, $timeout) {

    return function (input, lang, key) {
        return localize.get(lang)[key];
    }

}];
},{}],4:[function(require,module,exports){
/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('servalI18n', [])
    .factory('localize', require('./services/localize'))
    .directive('i18nLoad', require('./directives/i18nLoad'))
    .directive('i18nBind', require('./directives/i18nBind'))
    .filter('translate', require('./filters/translate'))
    .value("custom")
    .run(['localize', '$state','$rootScope', function(localize, $state, $rootScope) {

        // Update the translation when you change a page
        $rootScope.$on('$stateChangeSuccess', function(e, toState) {

            // Prevent reload for the the home
            if(!localize.isLoaded()) {
                localize.updateState(toState.name);
            }
        });

        localize.load();
    }]);
},{"./directives/i18nBind":1,"./directives/i18nLoad":2,"./filters/translate":3,"./services/localize":5}],5:[function(require,module,exports){
/**
 * I18n Service
 * Load your translations and update $rootScope
 * It gives you access to your translation.
 */
module.exports = ['$rootScope', '$http','custom', function($rootScope, $http, custom) {

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

    angular.extend(config, custom);


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
            angular.extend(i18n.data[lang]['_common'], {languages: i18n.available});
            angular.extend(i18n.data[lang][page], i18n.data[lang]['_common']);

            if(config.namespace) {
                $rootScope[config.namespace] = i18n.data[lang][page];
            }else {
                angular.extend($rootScope, i18n.data[lang][page]);
            }
            console.log("[i18n-i18n@setTranslation] Load your translation with the current lang : ",i18n.current);
        }
    }

    /**
     * Load a translation to the $scope for a language
     * - doc BCP 47 {@link http://tools.ietf.org/html/bcp47}
     * - doc Value of HTML5 lang attr {@link http://webmasters.stackexchange.com/questions/28307/value-of-the-html5-lang-attribute}
     * @trigger {Event} i18n:localize:changed {previous:XXX,value:XXX2}
     * @param {String} lang Your language cf BCP 47
     */
    function loadLanguage(lang) {

        var old = document.documentElement.lang;
        if(!lang) {
            lang =  (old + '-' + old.toUpperCase()) || 'en-EN';
        }else {
            document.documentElement.lang = lang.split('-')[0];
        }

        i18n.current = lang;

        $rootScope.$emit('i18n:localize:changed', {
            previous: (old + '-' + old.toUpperCase()),
            value: lang
        });

        console.log('[i18n-i18n@loadLanguage] Update APP language from %s to %s', (old + '-' + old.toUpperCase()),lang);
    }

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

    // Listen when you change the language in your application
    $rootScope.$on('i18n:localize:changed', function() {
        setTranslation(i18n.currentState);
    });

    var service = {

        load: function load(url, name) {

            url = url || loadLazyDefaultUrl();

            var lang = config.lang || document.documentElement.lang + '-' + document.documentElement.lang.toUpperCase();

            return $http.get(url)
                .error(function() {
                    alert("Cannot load i18n translation file");
                })
                .success(function (data) {

                    if(config.lazy) {
                        config.current = name;
                    }
                    i18n.data = data;
                    i18n.current = lang;

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
            return angular.extend(i18n.data[lang || i18n.current][i18n.currentState] , i18n.data[lang || i18n.current]['_common']);
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
},{}]},{},[4])