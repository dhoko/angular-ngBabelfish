describe('translate filter', function() {

  'use strict';

  var filter, babelfish, translations;

  beforeEach(module('ngBabelfish', 'i18nMock'));

  beforeEach(inject(function ($injector) {
    filter = $injector.get('$filter');
    babelfish = $injector.get('babelfish');
    translations = $injector.get('translations');

    spyOn(babelfish, 'get').and.returnValue(translations['fr-FR'].home);

  }));

  it('should translate a string', function() {
    expect(filter('translate')('about','fr-FR')).toBe(translations['fr-FR'].home.about);
  });
});
