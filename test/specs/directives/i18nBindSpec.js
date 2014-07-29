var frAnswer = {
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
    }

describe('Directive@i18nBind: append a translation', function () {
    'use strict';
    var babelfish,el,compile,rootScope,scope;

    beforeEach(module('ui.router'));
    beforeEach(function() {

        module('ngBabelfish', function ($provide) {


            $provide.decorator('babelfish', function ($delegate) {

                $delegate.load = function(lang) {
                };
                $delegate.get = function(lang) {

                    lang = lang || 'en-EN';
                    var data = angular.extend({},answer[lang]['_common'],answer[lang]['home']);
                    return data;
                };

                $delegate.current = function() {
                    return 'en-EN';
                };

                return $delegate;
            })

        });


        inject(function (_babelfish_, $rootScope) {
            babelfish = _babelfish_;
            rootScope = $rootScope;
        });

    });

    describe('Work with the default configuration', function() {
        beforeEach(inject(function ($injector) {
            el = angular.element('<h1 data-i18n-bind="home"></h1>');
            compile = $injector.get('$compile');
            scope = rootScope.$new();
            compile(el)(scope);
            scope.$digest();
        }));

        it('should append the translation', function () {
            scope.$emit('ngBabelfish.translation:loaded');
            expect(el.text()).toBe('Home');
        });
    });

    describe('Work with another language', function() {
        beforeEach(inject(function ($injector) {
            el = angular.element('<h1 data-i18n-bind="home" data-i18n-bind-lang="fr-FR"></h1>');
            compile = $injector.get('$compile');
            rootScope = $injector.get('$rootScope');

            scope = rootScope.$new();

            compile(el)(scope);
            scope.$digest();
        }));

        it('should append the translation of the custom language', function() {
            scope.$emit('ngBabelfish.translation:loaded');
            expect(el.text()).toBe('Maison');
        });
    });
});