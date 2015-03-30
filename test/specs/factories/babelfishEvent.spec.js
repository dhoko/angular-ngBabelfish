describe('babelfishEvent factory', function() {

  'use strict';

  var factory, rootScope;

  beforeEach(module('ngBabelfish'));
  beforeEach(inject(function ($injector) {
    factory = $injector.get('babelfishEvent');
    rootScope = $injector.get('$rootScope');
  }));


  it('should record an event an trigger it', function (done) {

    factory.set('change:language', function() {
      expect(true).toBe(true);
      done();
    });

    rootScope.$emit('ngBabelfish.translation:loaded', {
      previousLang: 'fr-FR',
      lang: 'en-EN'
    });
  });

});