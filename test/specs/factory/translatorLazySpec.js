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