'use strict';

describe('ngBabelfish, please translate them all', function() {
    var urlI18n = "/i18n/languages.json",
        $httpBackend,
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

    beforeEach(module('ui.router'));

    beforeEach(module('ngBabelfish', function (babelfishProvider) {
            babelfishProvider.languages({
                state: "home", // Default state to load
                lang: "en-EN", // Default language
                url: urlI18n, // Default url
                namespace: "", // Default namespace
                lazy: false, // Active lazy
                urls: [ // Files per lang when you are in lazy mode (so url is useless)
                    {
                        lang: "", // fr-FR etc.
                        url: ""
                    }
                ]
            });
    }));


    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get("$httpBackend");
        $httpBackend.when("GET", urlI18n)
          .respond(200, answer);
    }));

    afterEach(function () {
          $httpBackend.verifyNoOutstandingExpectation();
          // $httpBackend.verifyNoOutstandingRequest();
        });

    it('should be loaded', inject(function (babelfish) {
        expect(babelfish).toBeDefined();
    }));

    describe('Populate translations', function() {

        beforeEach(function() {
            $httpBackend.expectGET(urlI18n);
            $httpBackend.flush();
        });

        it('should be loaded', inject(function (babelfish) {
            expect(babelfish.isLoaded()).toBe(true);
        }));


        it('should be loaded', inject(function (babelfish) {
            expect(babelfish.isLoaded()).toBe(true);
        }));
    })
});