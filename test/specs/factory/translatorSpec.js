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
}

describe('Factory@translator: Sir can you translate this application ?', function() {

    var scope, translator;

    beforeEach(module('ui.router'));
    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider = function() {
            this.init = function() {},
            this.$get = function() {}
        }
    }));

    beforeEach(inject(function ($injector) {
        translator = $injector.get('translator');
        translator.init(config);
        translator.load();
        $httpBackend = $injector.get("$httpBackend");
        $httpBackend.when("GET", urlI18n)
          .respond(200, answer);

        scope = $injector.get('$rootScope');
    }));

    beforeEach(function() {
        $httpBackend.expectGET(urlI18n);
        $httpBackend.flush();
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
    });


    describe('Populate translations', function() {

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
            expect(scope.currency).toBeDefined();
            expect(scope.currency).toBe('$');
        });

        it('should have en-EN translations', function () {
            expect(translator.current()).toBe('en-EN');
            expect(translator.get('en-EN')).toBeDefined();
        });

        it('should overide sharred keys with the current keys for a page', function () {
            expect(translator.all()['_common'].welcome_cart).toBe('title');
            expect(translator.get().welcome_cart).toBe('Welcome to ngBabelfish');
            expect(scope.welcome_cart).toBeDefined('Welcome to ngBabelfish');
        });

        it('should switch to french translations', function () {
            translator.updateLang('fr-FR');
            expect(document.documentElement.lang).toBe('fr');
            expect(translator.current()).toBe('fr-FR');
        });

        it('should have all translations', function () {
            expect(Object.keys(translator.available()).length).toEqual(2);
        });
    });

    describe('When we change a state', function() {

        it('should be defined for an unknown state', inject(function (translator) {

            console.warn = function() {};

            translator.updateState('test');

            translator.updateState('test');
            expect(translator.get()).toBeDefined();
            expect(Object.keys(translator.get()).length).toBeGreaterThan(0);
        }));

        it('should contains our data for an known state', inject(function (translator) {
            translator.updateState('home');
            expect(translator.get().welcome_cart).toBeDefined('Welcome to ngBabelfish');
            expect(Object.keys(translator.get()).length).toBeGreaterThan(0);
        }));

        it('should show a warning for an unknown state one change', inject(function (translator) {
            console.warn = function(message,replace1, replace2) {
                expect(replace1).toBe('test');
            };

            translator.updateState('test');

        }));
    });



    describe('Are you listening to me ?', function() {

        beforeEach(inject(function ($injector) {
            scope = $injector.get('$rootScope');
            spyOn(scope, '$emit');
            document.documentElement.lang = '';
        }));

        it('should trigger en event when we change the lang', inject(function (translator) {

            translator.updateLang('fr-FR');
            expect(scope.$emit).toHaveBeenCalledWith('ngBabelfish.translation:changed', {
                previous: 'en-EN',
                value: 'fr-FR'
            });
        }));

        it('should trigger en event when we change the lang and its not defined', inject(function (translator) {

            translator.updateLang();
            expect(scope.$emit).toHaveBeenCalledWith('ngBabelfish.translation:changed', {
                previous: 'en-EN',
                value: 'en-EN'
            });
        }));


        it('should trigger en event when we load another language', inject(function (translator) {

            translator.updateState('test');
            expect(scope.$emit).toHaveBeenCalledWith('ngBabelfish.translation:loaded', {
                currentState: 'test',
                lang: 'en-EN'
            });
        }));

    });
});

describe('Factory@translator: Loading a wrong file', function(){

    var translator;

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider = function() {
            this.init = function() {},
            this.$get = function() {}
        }
    }));

    beforeEach(inject(function ($injector) {
        spyOn(window,'alert');
        $httpBackend = $injector.get("$httpBackend");
        $httpBackend.when("GET", urlI18n)
          .respond(400, answer);

        translator = $injector.get('translator');
        translator.init(config);
        translator.load();
    }));

    beforeEach(function() {
        $httpBackend.expectGET(urlI18n);
        $httpBackend.flush();
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should pop an alert', function() {
        expect(window.alert).toHaveBeenCalledWith('Cannot load i18n translation file');
    });
});

describe('Factory@translator: Add a namespace', function(){

    var scope, translator;

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider = function() {
            this.init = function() {},
            this.$get = function() {}
        }
    }));

    beforeEach(inject(function ($injector) {
        scope = $injector.get('$rootScope');
        translator = $injector.get('translator');
        translator.init(angular.extend({},config,{namespace: 'i18n'}));
        translator.load();
        $httpBackend = $injector.get("$httpBackend");
        $httpBackend.when("GET", urlI18n)
          .respond(200, answer);

        document.documentElement.lang = '';
    }));

    beforeEach(function() {
        $httpBackend.expectGET(urlI18n);
        $httpBackend.flush();
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
        $httpBackend.resetExpectations();
    });

    it('should contains translations inside i18n key', inject(function (translator) {
        expect(scope.i18n).toBeDefined();
    }));

    it('should have teh content from each page', inject(function (translator) {
        expect(scope.i18n.welcome_cart).toBe("Welcome to ngBabelfish");
    }));
});
