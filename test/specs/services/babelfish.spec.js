describe('babelfish service', function() {

  'use strict';

  var service, translations, marvin, marvinMemory, babelfishLang, babelfishEvent;

  beforeEach(module('ngBabelfish', 'i18nMock'));

  beforeEach(inject(function ($injector) {
    service        = $injector.get('babelfish');
    translations   = $injector.get('translations');
    marvin         = $injector.get('marvin');
    marvinMemory   = $injector.get('marvinMemory');
    babelfishLang  = $injector.get('babelfishLang');
    babelfishEvent = $injector.get('babelfishEvent');

    marvinMemory.set({
      available: Object.keys(translations),
      data: translations
    });

    spyOn(babelfishLang, 'set');
  }));

  it('should return all translations available', function() {
    var data = service.translations();
    var keys = Object.keys(data);

    expect(keys.indexOf('en-EN') > -1).toBe(true);
    expect(keys.indexOf('fr-FR') > -1).toBe(true);
    expect(keys.length).toBe(2);

    expect(data['en-EN'].home.about).toBe(translations['en-EN'].home.about);
    expect(data['fr-FR'].home.about).toBe(translations['fr-FR'].home.about);
  });

  it('should check if a lang is loaded', function() {
    expect(service.isLangLoaded('fr-FR')).toBe(true);
    marvinMemory.set({data: null});
    expect(service.isLangLoaded('fr-FR')).toBe(false);
  })

  it('should return the current lang', function() {
    expect(service.current()).toBe('en-EN');
    marvinMemory.set({lang: {current: 'fr-FR'}});
    expect(service.current()).toBe('fr-FR');
  });

  it('should list each languages loaded', function() {
    var list = service.languages();
    expect(list.indexOf('en-EN') > -1).toBe(true);
    expect(list.indexOf('fr-FR') > -1).toBe(true);
    expect(list.length).toBe(2);

    marvinMemory.set({
      available: [],
      data: null
    });

    list = service.languages();
    expect(list.length).toBe(0);

    marvinMemory.set({
      available: ['_common'],
      data: null
    });

    list = service.languages();
    expect(list.length).toBe(0);
  });

  it('should call babelfishLang if we try to update the lang', function() {
    service.updateLang('de-DE');
    expect(babelfishLang.set).toHaveBeenCalledWith('de-DE', jasmine.any(Function));
  });

  it('should return each translations for a lang', function() {
    var data = service.all();
    expect(data.home.about).toBe(translations['en-EN'].home.about);
    expect(Object.keys(data).length).toBe(2);
    expect(data._common).toBeDefined();

    data = service.all('en-EN');
    expect(data.home.about).toBe(translations['en-EN'].home.about);
    expect(Object.keys(data).length).toBe(2);
    expect(data._common).toBeDefined();

    data = service.all('fr-FR');
    expect(data.home.about).toBe(translations['fr-FR'].home.about);
    expect(Object.keys(data).length).toBe(2);
    expect(data._common).toBeDefined();
  });

  describe('get lang for a state', function() {

    beforeEach(function() {
      marvinMemory.set({
        state: {
          current: 'home'
        }
      });
      spyOn(console, 'warn').and.callThrough();
    });

    it('should build translations for a lang for a state', function() {
      var data = service.get();
      expect(data._common).toBeUndefined();
      expect(data.home).toBeUndefined();
      expect(data.about).toBe(translations['en-EN'].home.about);
    });

    it('should build translations for a lang for a state', function() {
      var data = service.get('fr-FR');
      expect(data._common).toBeUndefined();
      expect(data.home).toBeUndefined();
      expect(data.about).toBe(translations['fr-FR'].home.about);
    });

    it('should display a message if no translations is available if isVerbose', function() {

      marvinMemory.set({
        state: {
          current: 'search'
        }
      });
      spyOn(marvin, 'isVerbose').and.returnValue(true);
      var data = service.get('fr-FR');
      expect(marvin.isVerbose).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[ngBabelfish.babelfish@get] No translation available for the page %s for the lang %s', 'search', 'fr-FR');
    });

    it('should not display a message if no translations is available if isVerbose', function() {

      marvinMemory.set({
        state: {
          current: 'search'
        }
      });
      spyOn(marvin, 'isVerbose').and.returnValue(false);
      var data = service.get();
      expect(marvin.isVerbose).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should return empty Object if there are not lang', function() {
      spyOn(marvin, 'isVerbose').and.returnValue(false);
      var data = service.get('de-DE');
      expect(Object.keys(data).length).toBe(0);
    });

  });

});