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
                 * cf {@link https://github.com/dhoko/serval-i18n/issues/5}
                 */
                if(!i18n.data[lang][page]) {
                    i18n.data[lang][page] = {};
                    console.warn('[serval-i18n-babelfish@setTranslation] No translation available for the page %s for the lang %s',page, lang);
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
            if(!lang) {
                lang =  (old + '-' + old.toUpperCase()) || 'en-EN';
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

};