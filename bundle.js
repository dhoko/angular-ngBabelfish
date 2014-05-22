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

        config.lang = i18n.current = lang;

        $rootScope.$emit('i18n:localize:changed', {
            previous: (old + '-' + old.toUpperCase()),
            value: lang
        });

        // Load the new language if we do not already have it
        if(config.lazy && !i18n.data[lang]) {
            service.load();
        }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL2hvbWUvYXVyZWxpZW4vZGV2L21lL3NlcnZhbC1pMThuL2kxOG4vZGlyZWN0aXZlcy9pMThuQmluZC5qcyIsIi9ob21lL2F1cmVsaWVuL2Rldi9tZS9zZXJ2YWwtaTE4bi9pMThuL2RpcmVjdGl2ZXMvaTE4bkxvYWQuanMiLCIvaG9tZS9hdXJlbGllbi9kZXYvbWUvc2VydmFsLWkxOG4vaTE4bi9maWx0ZXJzL3RyYW5zbGF0ZS5qcyIsIi9ob21lL2F1cmVsaWVuL2Rldi9tZS9zZXJ2YWwtaTE4bi9pMThuL2kxOG4uanMiLCIvaG9tZS9hdXJlbGllbi9kZXYvbWUvc2VydmFsLWkxOG4vaTE4bi9zZXJ2aWNlcy9sb2NhbGl6ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogaTE4bkJpbmQgZGlyZWN0aXZlXG4gKiBMb2FkIGEgdHJhbnNsYXRpb24gZm9yIGEgdmFyXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gWydsb2NhbGl6ZScsIGZ1bmN0aW9uKGxvY2FsaXplKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogXCJBXCIsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLGVsLGF0dHIpIHtcbiAgICAgICAgICAgIGVsLmFwcGVuZChsb2NhbGl6ZS5nZXQoYXR0ci5pMThuQmluZExhbmcgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcpW2F0dHIuaTE4bkJpbmRdKTtcbiAgICAgICAgfVxuICAgIH1cblxufV07IiwiLyoqXG4gKiBpMThuTG9hZCBkaXJlY3RpdmVcbiAqIExvYWQgYSB0cmFuc2xhdGlvbiBmcm9tIGEgY2xpY2sgb24gYSBidXR0b24gd2l0aCB0aGUgYXR0ciBpMThuLWxvYWRcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbJ2xvY2FsaXplJywgZnVuY3Rpb24obG9jYWxpemUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiBcIkFcIixcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsZWwsYXR0cikge1xuICAgICAgICAgICAgZWwub24oJ2NsaWNrJyxmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsaXplLnVwZGF0ZUxhbmcoYXR0ci5pMThuTG9hZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxufV07IiwiLyoqXG4gKiB0cmFuc2FsdGUgZmlsdGVyXG4gKiBUcmFuc2xhdGUgYSBzdHJpbmcgdG8gYW5vdGhlciBsYW5ndWFnZVxuICoge3sgbmFtZSB8IHRyYW5zbGF0ZTonZnItRlInOlwibmFtZVwifX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbJ2xvY2FsaXplJywgJyR0aW1lb3V0JywgZnVuY3Rpb24gKGxvY2FsaXplLCAkdGltZW91dCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpbnB1dCwgbGFuZywga2V5KSB7XG4gICAgICAgIHJldHVybiBsb2NhbGl6ZS5nZXQobGFuZylba2V5XTtcbiAgICB9XG5cbn1dOyIsIi8qKlxuICogSTE4biBtb2R1bGVcbiAqIFRyYW5zbGF0ZSB5b3VyIGFwcGxpY2F0aW9uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYW5ndWxhci5tb2R1bGUoJ3NlcnZhbEkxOG4nLCBbXSlcbiAgICAuZmFjdG9yeSgnbG9jYWxpemUnLCByZXF1aXJlKCcuL3NlcnZpY2VzL2xvY2FsaXplJykpXG4gICAgLmRpcmVjdGl2ZSgnaTE4bkxvYWQnLCByZXF1aXJlKCcuL2RpcmVjdGl2ZXMvaTE4bkxvYWQnKSlcbiAgICAuZGlyZWN0aXZlKCdpMThuQmluZCcsIHJlcXVpcmUoJy4vZGlyZWN0aXZlcy9pMThuQmluZCcpKVxuICAgIC5maWx0ZXIoJ3RyYW5zbGF0ZScsIHJlcXVpcmUoJy4vZmlsdGVycy90cmFuc2xhdGUnKSlcbiAgICAudmFsdWUoXCJjdXN0b21cIilcbiAgICAucnVuKFsnbG9jYWxpemUnLCAnJHN0YXRlJywnJHJvb3RTY29wZScsIGZ1bmN0aW9uKGxvY2FsaXplLCAkc3RhdGUsICRyb290U2NvcGUpIHtcblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHRyYW5zbGF0aW9uIHdoZW4geW91IGNoYW5nZSBhIHBhZ2VcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbihlLCB0b1N0YXRlKSB7XG5cbiAgICAgICAgICAgIC8vIFByZXZlbnQgcmVsb2FkIGZvciB0aGUgdGhlIGhvbWVcbiAgICAgICAgICAgIGlmKCFsb2NhbGl6ZS5pc0xvYWRlZCgpKSB7XG4gICAgICAgICAgICAgICAgbG9jYWxpemUudXBkYXRlU3RhdGUodG9TdGF0ZS5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbG9jYWxpemUubG9hZCgpO1xuICAgIH1dKTsiLCIvKipcbiAqIEkxOG4gU2VydmljZVxuICogTG9hZCB5b3VyIHRyYW5zbGF0aW9ucyBhbmQgdXBkYXRlICRyb290U2NvcGVcbiAqIEl0IGdpdmVzIHlvdSBhY2Nlc3MgdG8geW91ciB0cmFuc2xhdGlvbi5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBbJyRyb290U2NvcGUnLCAnJGh0dHAnLCdjdXN0b20nLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkaHR0cCwgY3VzdG9tKSB7XG5cbiAgICB2YXIgaTE4biA9IHtcbiAgICAgICAgY3VycmVudDogXCJcIixcbiAgICAgICAgZGF0YToge30sXG4gICAgICAgIGF2YWlsYWJsZTogW10sXG4gICAgICAgIGN1cnJlbnRTdGF0ZTogXCJcIixcbiAgICAgICAgYWN0aXZlOiBmYWxzZVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlZmF1bHQgY29uZmlndXJhdGlvbiBmb3IgdGhlIG1vZHVsZVxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgdmFyIGNvbmZpZyA9IHtcbiAgICAgICAgc3RhdGU6IFwiaG9tZVwiLFxuICAgICAgICBsYW5nOiBcImVuLUVOXCIsXG4gICAgICAgIHVybDogXCIvaTE4bi9sYW5ndWFnZXMuanNvblwiLFxuICAgICAgICBuYW1lc3BhY2U6IFwiXCIsXG4gICAgICAgIGxhenk6IGZhbHNlLFxuICAgICAgICB1cmxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbGFuZzogXCJcIixcbiAgICAgICAgICAgICAgICB1cmw6IFwiXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgY3VycmVudDogXCJcIlxuICAgIH07XG5cbiAgICBhbmd1bGFyLmV4dGVuZChjb25maWcsIGN1c3RvbSk7XG5cblxuICAgIC8qKlxuICAgICAqIExvYWQgYSB0cmFuc2xhdGlvbiB0byB0aGUgJHNjb3BlXG4gICAgICogLSBkb2MgQkNQIDQ3IHtAbGluayBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9iY3A0N31cbiAgICAgKiAtIGRvYyBWYWx1ZSBvZiBIVE1MNSBsYW5nIGF0dHIge0BsaW5rIGh0dHA6Ly93ZWJtYXN0ZXJzLnN0YWNrZXhjaGFuZ2UuY29tL3F1ZXN0aW9ucy8yODMwNy92YWx1ZS1vZi10aGUtaHRtbDUtbGFuZy1hdHRyaWJ1dGV9XG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGxhbmcgWW91ciBsYW5ndWFnZSBjZiBCQ1AgNDdcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBzZXRUcmFuc2xhdGlvbihwYWdlKSB7XG5cbiAgICAgICAgcGFnZSA9IHBhZ2UgfHwgY29uZmlnLnN0YXRlO1xuICAgICAgICBpMThuLmN1cnJlbnRTdGF0ZSA9IHBhZ2U7XG4gICAgICAgIGxhbmcgPSBpMThuLmN1cnJlbnQ7XG4gICAgICAgIGkxOG4uYWN0aXZlID0gdHJ1ZTtcblxuICAgICAgICBpZihpMThuLmRhdGFbbGFuZ10pIHtcbiAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGkxOG4uZGF0YVtsYW5nXVsnX2NvbW1vbiddLCB7bGFuZ3VhZ2VzOiBpMThuLmF2YWlsYWJsZX0pO1xuICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoaTE4bi5kYXRhW2xhbmddW3BhZ2VdLCBpMThuLmRhdGFbbGFuZ11bJ19jb21tb24nXSk7XG5cbiAgICAgICAgICAgIGlmKGNvbmZpZy5uYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlW2NvbmZpZy5uYW1lc3BhY2VdID0gaTE4bi5kYXRhW2xhbmddW3BhZ2VdO1xuICAgICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKCRyb290U2NvcGUsIGkxOG4uZGF0YVtsYW5nXVtwYWdlXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIltpMThuLWkxOG5Ac2V0VHJhbnNsYXRpb25dIExvYWQgeW91ciB0cmFuc2xhdGlvbiB3aXRoIHRoZSBjdXJyZW50IGxhbmcgOiBcIixpMThuLmN1cnJlbnQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExvYWQgYSB0cmFuc2xhdGlvbiB0byB0aGUgJHNjb3BlIGZvciBhIGxhbmd1YWdlXG4gICAgICogLSBkb2MgQkNQIDQ3IHtAbGluayBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9iY3A0N31cbiAgICAgKiAtIGRvYyBWYWx1ZSBvZiBIVE1MNSBsYW5nIGF0dHIge0BsaW5rIGh0dHA6Ly93ZWJtYXN0ZXJzLnN0YWNrZXhjaGFuZ2UuY29tL3F1ZXN0aW9ucy8yODMwNy92YWx1ZS1vZi10aGUtaHRtbDUtbGFuZy1hdHRyaWJ1dGV9XG4gICAgICogQHRyaWdnZXIge0V2ZW50fSBpMThuOmxvY2FsaXplOmNoYW5nZWQge3ByZXZpb3VzOlhYWCx2YWx1ZTpYWFgyfVxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBsYW5nIFlvdXIgbGFuZ3VhZ2UgY2YgQkNQIDQ3XG4gICAgICovXG4gICAgZnVuY3Rpb24gbG9hZExhbmd1YWdlKGxhbmcpIHtcblxuICAgICAgICB2YXIgb2xkID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lmxhbmc7XG4gICAgICAgIGlmKCFsYW5nKSB7XG4gICAgICAgICAgICBsYW5nID0gIChvbGQgKyAnLScgKyBvbGQudG9VcHBlckNhc2UoKSkgfHwgJ2VuLUVOJztcbiAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcgPSBsYW5nLnNwbGl0KCctJylbMF07XG4gICAgICAgIH1cblxuICAgICAgICBjb25maWcubGFuZyA9IGkxOG4uY3VycmVudCA9IGxhbmc7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kZW1pdCgnaTE4bjpsb2NhbGl6ZTpjaGFuZ2VkJywge1xuICAgICAgICAgICAgcHJldmlvdXM6IChvbGQgKyAnLScgKyBvbGQudG9VcHBlckNhc2UoKSksXG4gICAgICAgICAgICB2YWx1ZTogbGFuZ1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMb2FkIHRoZSBuZXcgbGFuZ3VhZ2UgaWYgd2UgZG8gbm90IGFscmVhZHkgaGF2ZSBpdFxuICAgICAgICBpZihjb25maWcubGF6eSAmJiAhaTE4bi5kYXRhW2xhbmddKSB7XG4gICAgICAgICAgICBzZXJ2aWNlLmxvYWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnNvbGUubG9nKCdbaTE4bi1pMThuQGxvYWRMYW5ndWFnZV0gVXBkYXRlIEFQUCBsYW5ndWFnZSBmcm9tICVzIHRvICVzJywgKG9sZCArICctJyArIG9sZC50b1VwcGVyQ2FzZSgpKSxsYW5nKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBMb2FkIHlvdXIgdXJsIGZyb20gbGF6eSBtb2RlXG4gICAgICogQHJldHVybiB7U3RyaW5nfSB1cmxcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBsb2FkTGF6eURlZmF1bHRVcmwoKSB7XG5cbiAgICAgICAgdmFyIHVybCA9IGNvbmZpZy51cmw7XG4gICAgICAgIGlmKGNvbmZpZy5sYXp5KSB7XG4gICAgICAgICAgICB1cmwgPSBjb25maWcudXJscy5maWx0ZXIoZnVuY3Rpb24gKG8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gby5sYW5nID09PSBjb25maWcubGFuZztcbiAgICAgICAgICAgIH0pWzBdLnVybDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEJ1aWxkIGkxOG4uZGF0YS5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IGRhdGEgRGF0YSBmcm9tIHRoZSB0cmFuc2xhdGlvbiBmaWxlXG4gICAgICovXG4gICAgZnVuY3Rpb24gYnVpbGRJMThuKGRhdGEpIHtcblxuICAgICAgICBpZighY29uZmlnLmxhenkpIHtcbiAgICAgICAgICAgIGkxOG4uZGF0YSA9IGRhdGE7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpMThuLmRhdGFbaTE4bi5jdXJyZW50XSA9IGRhdGE7XG4gICAgfVxuXG4gICAgLy8gTGlzdGVuIHdoZW4geW91IGNoYW5nZSB0aGUgbGFuZ3VhZ2UgaW4geW91ciBhcHBsaWNhdGlvblxuICAgICRyb290U2NvcGUuJG9uKCdpMThuOmxvY2FsaXplOmNoYW5nZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VHJhbnNsYXRpb24oaTE4bi5jdXJyZW50U3RhdGUpO1xuICAgIH0pO1xuXG4gICAgdmFyIHNlcnZpY2UgPSB7XG5cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gbG9hZCh1cmwsIG5hbWUpIHtcblxuICAgICAgICAgICAgdXJsID0gdXJsIHx8IGxvYWRMYXp5RGVmYXVsdFVybCgpO1xuXG4gICAgICAgICAgICB2YXIgbGFuZyA9IGNvbmZpZy5sYW5nIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5sYW5nICsgJy0nICsgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmxhbmcudG9VcHBlckNhc2UoKTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCh1cmwpXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcIkNhbm5vdCBsb2FkIGkxOG4gdHJhbnNsYXRpb24gZmlsZVwiKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoY29uZmlnLmxhenkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZy5jdXJyZW50ID0gbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpMThuLmN1cnJlbnQgPSBsYW5nO1xuICAgICAgICAgICAgICAgICAgICBidWlsZEkxOG4oZGF0YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoY29uZmlnLmxhenkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkxOG4uYXZhaWxhYmxlLnB1c2goaTE4bi5jdXJyZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaTE4bi5hdmFpbGFibGUgPSBPYmplY3Qua2V5cyhpMThuLmRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VHJhbnNsYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldChsYW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5leHRlbmQoaTE4bi5kYXRhW2xhbmcgfHwgaTE4bi5jdXJyZW50XVtpMThuLmN1cnJlbnRTdGF0ZV0gLCBpMThuLmRhdGFbbGFuZyB8fCBpMThuLmN1cnJlbnRdWydfY29tbW9uJ10pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFsbDogZnVuY3Rpb24gYWxsKGxhbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBpMThuLmRhdGFbbGFuZyB8fCBpMThuLmN1cnJlbnRdO1xuICAgICAgICB9LFxuXG4gICAgICAgIGN1cnJlbnQ6IGZ1bmN0aW9uIGN1cnJlbnQoKSB7XG4gICAgICAgICAgICByZXR1cm4gaTE4bi5jdXJyZW50O1xuICAgICAgICB9LFxuICAgICAgICB1cGRhdGVTdGF0ZTogc2V0VHJhbnNsYXRpb24sXG4gICAgICAgIHVwZGF0ZUxhbmc6IGxvYWRMYW5ndWFnZSxcbiAgICAgICAgaXNMb2FkZWQ6IGZ1bmN0aW9uIGlzTG9hZGVkKCkge1xuICAgICAgICAgICAgcmV0dXJuIGkxOG4uYWN0aXZlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufV07Il19
