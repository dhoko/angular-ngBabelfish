'use strict';
var urlI18n = "/i18n/languages.json",
    $httpBackend,
    scope,
    answer = {
          "fr-FR": {
            "_common": {
              "home": "Maison",
              "currency": "€"
            },
            "home": {
              "welcome_cart": "Bienvenue sur ngBabelfish"
            }
          },
          "en-EN": {
            "_common": {
              "home": "Home",
              "currency": "$"
            },
            "home": {
              "welcome_cart": "Welcome to ngBabelfish"
            }
          }
        };

describe('ngBabelfish, please translate them all', function() {

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider.languages();
    }));

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get("$httpBackend");
        $httpBackend.when("GET", urlI18n)
          .respond(200, answer);
    }));

    beforeEach(function() {
        $httpBackend.expectGET(urlI18n);
        $httpBackend.flush();
    });

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
    });


    describe('Populate translations', function() {

        it('should be loaded', inject(function (babelfish) {
            expect(babelfish.isLoaded()).toBe(true);
            expect(babelfish.all()).toBeDefined();
            expect(babelfish.all()['_common']).toBeDefined();
        }));

        it('should have some translations available', inject(function (babelfish) {
            expect(babelfish.all()).toBeDefined();
        }));

        it('should have common translations', inject(function (babelfish) {
            expect(babelfish.all()['_common']).toBeDefined();
            expect(babelfish.all()['_common'].currency).toBe('$');
        }));

        it('should have en-EN translations', inject(function (babelfish) {
            expect(babelfish.current()).toBe('en-EN');
            expect(babelfish.get('en-EN')).toBeDefined();
            expect(babelfish.get().welcome_cart).toBeDefined('Welcome to ngBabelfish');
        }));

        it('should switch to french translations', inject(function (babelfish) {
            babelfish.updateLang('fr-FR');
            expect(document.documentElement.lang).toBe('fr');
            expect(babelfish.current()).toBe('fr-FR');
        }));
    });

    describe('When we change a state', function() {

        it('should be defined for an unknown state', inject(function (babelfish) {

            console.warn = function() {};

            babelfish.updateState('test');

            babelfish.updateState('test');
            expect(babelfish.get()).toBeDefined();
            expect(Object.keys(babelfish.get()).length).toBeGreaterThan(0);
        }));

        it('should contains our data for an known state', inject(function (babelfish) {
            babelfish.updateState('home');

            expect(babelfish.get().welcome_cart).toBeDefined();
            expect(babelfish.get().welcome_cart).toBeDefined('Welcome to ngBabelfish');
            expect(Object.keys(babelfish.get()).length).toBeGreaterThan(0);
        }));

        it('should show a warning for an unknown state one change', inject(function (babelfish) {
            console.warn = function(message,replace1, replace2) {
                expect(replace1).toBe('test');
            };

            babelfish.updateState('test');

        }));
    });



    describe('Are you listening to me ?', function() {

        beforeEach(inject(function ($injector) {
            scope = $injector.get('$rootScope');
            spyOn(scope, '$emit');
            document.documentElement.lang = '';
        }));

        it('should trigger en event when we change the lang', inject(function (babelfish) {

            babelfish.updateLang('fr-FR');
            expect(scope.$emit).toHaveBeenCalledWith('i18n:babelfish:changed', {
                previous: 'en-EN',
                value: 'fr-FR'
            });
        }));

        it('should trigger en event when we change the lang and its not defined', inject(function (babelfish) {

            babelfish.updateLang();
            expect(scope.$emit).toHaveBeenCalledWith('i18n:babelfish:changed', {
                previous: 'en-EN',
                value: 'en-EN'
            });
        }));

    });
});

describe('Loading a wrong file', function(){

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider.languages();
    }));

    beforeEach(inject(function ($injector) {
        spyOn(window,'alert');
        $httpBackend = $injector.get("$httpBackend");
        $httpBackend.when("GET", urlI18n)
          .respond(400, answer);
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

describe('Add a namespace', function(){

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function (babelfishProvider) {
        babelfishProvider.languages({
            namespace: 'i18n'
        });
    }));

    beforeEach(inject(function ($injector) {
        scope = $injector.get('$rootScope');
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
    });

    it('should contains translations inside i18n key', inject(function (babelfish) {
        expect(scope.i18n).toBeDefined();
        expect(scope.i18n.welcome_cart).toBeDefined();
    }));
});