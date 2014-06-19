describe('The test filter', function () {
    'use strict';

    var $filter;
    beforeEach(module('ui.router'));

    beforeEach(function () {

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


        inject(function (_$filter_) {
            $filter = _$filter_;
        });
    });

    it('should translate a string', function () {
        var string = 'home', result;
        result = $filter('translate')(string,'fr-FR','home');
        expect(result).toEqual('Maison');
    });
});