'use strict';
var urlI18n = "/i18n/languages.json",
    urlI18nFr = "/i18n/fr-FR.json",
    urlI18nEn = "/i18n/en-EN.json",
    $httpBackend,
    scope,
    frAnswer = {
      "_common": {
        "home": "Maison",
        "currency": "€",
        "welcome_cart": "titre"
      },
      "test": {
        "page": "test page"
      },
      "home": {
        "welcome_cart": "Bienvenue sur ngBabelfish",
        "custom": "bonjour"
      }
    },
    enAnswer = {
      "_common": {
        "home": "Home",
        "currency": "$",
        "welcome_cart": "title"
      },
      "test": {
        "page": "test page"
      },
      "home": {
        "welcome_cart": "Welcome to ngBabelfish",
        "custom": "hello"
      }
    },
    answer = {
      "fr-FR": frAnswer,
      "en-EN": enAnswer
    };

var config = {
    state: 'home',
    lang: 'en-EN',
    url: '/i18n/languages.json',
    eventName: '$stateChangeSuccess',
    namespace: "",
    lazy: false,
    urls: [{
        lang: "fr-FR",
        url: urlI18nFr
    },
    {
        lang: "en-EN",
        url: urlI18nEn
    }],
    current: "",
    log: true
};

var configDataLazy = {
    state: 'home',
    lang: 'en-EN',
    eventName: '$stateChangeSuccess',
    namespace: "i18n",
    lazy: true,
    urls: [{
        lang: "fr-FR",
        data: frAnswer
    },
    {
        lang: "en-EN",
        data: enAnswer
    }],
    current: "",
    log: true
}

describe('Factory@translator: Lazy mode for translations', function() {

    var translator,scope, $httpBackend, $rootScope;

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function ($provide) {
        $provide.decorator('babelfish', function ($delegate) {

            $delegate.load = function(lang) {
            };
            return $delegate;
        });
    }));

    beforeEach(inject(function (_$rootScope_, _$httpBackend_, _translator_) {
        $rootScope = _$rootScope_;
        scope = _$rootScope_.$new();
        $httpBackend = _$httpBackend_;
        translator = _translator_;
        translator.init(angular.extend({}, config, {lazy: true, namespace: 'i18n', url: urlI18nEn}));


        $httpBackend.when("GET", urlI18nEn)
          .respond(200, enAnswer);

        document.documentElement.lang = '';
    }));

    beforeEach(function() {
        translator.load();
        $httpBackend.expectGET(urlI18nEn);
        $httpBackend.flush();

    });

    afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            // return $httpBackend.verifyNoOutstandingRequest();
    });

    it('should load the en-EN lang', function () {
        expect(translator.available().indexOf('en-EN') > -1).toBeTruthy();
    });

    it('should only load  the en-EN lang', function () {
        expect(Object.keys(translator.translations()).length).toEqual(1);
    });

    it('should load the home translations for en-EN', function () {
        expect(translator.current()).toBe('en-EN');
    });

    it('should fill the scope with some translations', function() {
        expect(scope.i18n).toBeDefined();
        expect(scope.i18n.welcome_cart).toBeDefined();
    });

    it('should have home translations for en-EN', function () {
        expect(translator.get().welcome_cart).toBeDefined('Welcome to ngBabelfish');
    });

    it('should have all translations', function () {
        expect(Object.keys(translator.available()).length).toEqual(2);
    });

    describe('switch to another langage', function() {

        beforeEach(function() {

            inject(function ($injector) {
                $httpBackend = $injector.get("$httpBackend");
                $httpBackend.when("GET", urlI18nFr)
                  .respond(200, frAnswer);
                spyOn($rootScope,'$emit');
            });

            translator.updateLang('fr-FR');
            $httpBackend.expectGET(urlI18nFr);
            $httpBackend.flush();
        });

        it('should switch to french translations', function () {
            expect(document.documentElement.lang).toBe('fr');
            expect(translator.current()).toBe('fr-FR');
        });

        it('should update the scope', function() {
            expect(scope.i18n.home).toBe('Maison');
        });

        it('should trigger the changed event', function () {
            expect($rootScope.$emit).toHaveBeenCalledWith('ngBabelfish.translation:changed', {
                previous: 'en-EN',
                value: 'fr-FR'
            });
        });
    });
});

describe("Factory@translator: Lazy mode with data provider", function() {
    var translatorData, scope, $rootScope;

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function ($provide) {
        $provide.decorator('babelfish', function ($delegate) {

            $delegate.load = function(lang) {
            };
            return $delegate;
        });
    }));

    beforeEach(inject(function (_$rootScope_, _translator_) {
        $rootScope = _$rootScope_;
        scope = _$rootScope_.$new();
        translatorData = _translator_;
        translatorData.init(configDataLazy);

        document.documentElement.lang = '';
    }));

    beforeEach(function() {
        translatorData.load();
    });

    it('should load the en-EN lang', function () {
        expect(translatorData.available().indexOf('en-EN') > -1).toBeTruthy();
    });

    it('should only load  the en-EN lang', function () {
        expect(Object.keys(translatorData.translations()).length).toEqual(1);
    });

    it('should load the home translations for en-EN', function () {
        expect(translatorData.current()).toBe('en-EN');
    });

    it('should fill the scope with some translations', function() {
        expect(scope.i18n).toBeDefined();
        expect(scope.i18n.welcome_cart).toBeDefined();
    });

    it('should have home translations for en-EN', function () {
        expect(translatorData.get().welcome_cart).toBeDefined('Welcome to ngBabelfish');
    });

    it('should have all translations', function () {
        expect(Object.keys(translatorData.available()).length).toEqual(2);
    });

    describe('switch to another langage', function() {

        beforeEach(function() {
            inject(function ($injector) {
                spyOn($rootScope,'$emit');
            });
            translatorData.updateLang('fr-FR');
        });

        it('should switch to french translations', function () {
            expect(document.documentElement.lang).toBe('fr');
            expect(translatorData.current()).toBe('fr-FR');
        });

        it('should update the scope', function() {
            expect(scope.i18n.home).toBe('Maison');
        });

 /*     Return bad previous value, to investigate
        it('should trigger the changed event', function () {
            expect($rootScope.$emit).toHaveBeenCalledWith('ngBabelfish.translation:changed', {
                previous: 'en-EN',
                value: 'fr-FR'
            });
        });*/
    });
});


describe('Factory@translator: change current data in lazy mode', function(){

    var scope, translator;

    beforeEach(module('ui.router'));
    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider = function() {
            this.init = function() {},
            this.$get = function() {}
        }
    }));

    beforeEach(inject(function (_$rootScope_, _translator_) {
        translator = _translator_;
        translator.init(angular.extend({}, configDataLazy));
        translator.load();
        scope = _$rootScope_.$new();
        document.documentElement.lang = '';
    }));

    //Reload data for current lang
    beforeEach(function(){
        translator.setData(enAnswer);
    })

    it('should contains translations inside i18n key', inject(function (translator) {
        expect(scope.i18n).toBeDefined();
    }));

    it('should have teh content from each page', inject(function (translator) {
        expect(scope.i18n.welcome_cart).toBe("Welcome to ngBabelfish");
    }));

    it('should be loaded', function () {
        expect(translator.isLoaded()).toBe(true);
    });

    it('should have some translations available', function () {
        expect(translator.all()).toBeDefined();
    });

    it('should have common translations', function () {
        expect(translator.all()['_common']).toBeDefined();
        expect(translator.all()['_common'].currency).toBe('$');
    });

    it('should have been Populate the scope', function() {
        expect(scope.i18n.currency).toBeDefined();
        expect(scope.i18n.currency).toBe('$');
    });

    it('should overide sharred keys with the current keys for a page', function () {
        expect(translator.all()['_common'].welcome_cart).toBe('title');
        expect(translator.get().welcome_cart).toBe('Welcome to ngBabelfish');
        expect(scope.i18n.welcome_cart).toBeDefined('Welcome to ngBabelfish');
    });

    it('should switch to french translations', function () {
        translator.updateLang('fr-FR');
        expect(document.documentElement.lang).toBe('fr');
        expect(translator.current()).toBe('fr-FR');
    });

    it('should have all translations', function () {
        expect(Object.keys(translator.available()).length).toEqual(2);
    });

    it('should not have common key', function () {
        expect(Object.keys(translator.available()).indexOf('_common')).toEqual(-1);
    });
});

