describe('ngBabelfish - i18n bind directive', function () {
    'use strict';
    var babelfish,el,compile,rootScope,scope;

    beforeEach(module('ui.router'));
    beforeEach(function() {
        module('ngBabelfish', function ($provide) {

            $provide.decorator('babelfish', function ($delegate) {

                $delegate.load = function(lang) {};
                $delegate.get = function(lang) {

                    var data = {
                        "en-EN": {
                            "home": "Home",
                            "currency": "$",
                            "welcome_cart": "Welcome to ngBabelfish"
                        },
                        "fr-FR": {
                            "home": "Maison",
                            "currency": "€",
                            "welcome_cart": "Bienvenue sur ngBabelfish"
                        }
                    };
                    return  data[lang || 'en-EN'];
                }
                return $delegate;
            })

        });

        inject(function (_babelfish_) {
            babelfish = _babelfish_;
        })
    })

    describe('Work with the default configuration', function() {
        beforeEach(inject(function ($injector) {
            el = angular.element('<h1 data-i18n-bind="home"></h1>');
            compile = $injector.get('$compile');
            rootScope = $injector.get('$rootScope');

            scope = rootScope.$new();

            compile(el)(scope);
            scope.$digest();
        }));

        it('should append the translation', function() {
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
            expect(el.text()).toBe('Maison');
        });
    });
});