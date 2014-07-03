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
            i18n.active = true,
            common = {}, currentPageTranslation = {};

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

                angular.extend(common, i18n.data[lang]['_common']);
                currentPageTranslation = angular.extend(common, {languages: i18n.available}, i18n.data[lang][page]);

                if(config.namespace) {
                    $rootScope[config.namespace] = currentPageTranslation;
                }else {
                    angular.extend($rootScope, currentPageTranslation);
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

                // Set the default lang for the html
                if(!document.documentElement.lang && config.lang) {
                    document.documentElement.lang = config.lang.split('-')[0];
                }

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
                        setTranslation(i18n.currentState);
                    });
            },

            /**
             * Return the current state translation
             * @param  {String} lang
             * @return {Object}
             */
            get: function get(lang) {
                var currentLang = i18n.data[lang || i18n.current] || {},
                    common = {}, currentStateTranslations = {};

                if(!currentLang[i18n.currentState]) {
                    console.warn('[ngBabelfish-babelfish@get] No translation available for the page %s for the lang %s',i18n.currentState, (lang || i18n.current));
                    currentLang[i18n.currentState] = {};
                }

                angular.extend(common, {}, currentLang['_common']);
                return angular.extend(common, currentLang[i18n.currentState]);;
            },

            /**
             * Get all traductions available for a lang
             * @param  {String} lang
             * @return {Object}
             */
            all: function all(lang) {
                return i18n.data[lang || i18n.current];
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
            }
        };

        return service;
    }];

};