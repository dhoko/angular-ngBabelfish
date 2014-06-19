describe('ngBabelfish - i18n bind directive', function () {
    'use strict';
    var babelfish,el,compile,rootScope,scope;

    beforeEach(module('ui.router'));
    beforeEach(function() {
        module('ngBabelfish', function ($provide) {

            $provide.decorator('babelfish', function ($delegate) {

                $delegate.load = function(lang) {};
                return $delegate;
            })

        });

        inject(function (_babelfish_) {
            babelfish = _babelfish_;
            spyOn(babelfish,'updateLang');
        })
    })

    describe('Work with the default configuration', function() {
        beforeEach(inject(function ($injector) {
            el = angular.element('<h1 data-i18n-load="fr-FR"></h1>');
            compile = $injector.get('$compile');
            rootScope = $injector.get('$rootScope');

            scope = rootScope.$new();

            compile(el)(scope);
            scope.$digest();
            //
        }));

        it('should change the language on click', function () {

            function click(el) {
                var ev = document.createEvent("MouseEvent");
                ev.initMouseEvent(
                    "click",
                    true /* bubble */, true /* cancelable */,
                    window, null,
                    0, 0, 0, 0, /* coordinates */
                    false, false, false, false, /* modifier keys */
                    0 /*left*/, null
                );
                el.dispatchEvent(ev);
            }

            click(el[0]);
            expect(babelfish.updateLang).toHaveBeenCalledWith('fr-FR');
        });
    });
});