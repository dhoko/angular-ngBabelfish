describe('babelfishLang service', function() {

  'use strict';

  var translations, service, http, rootScope, marvin, marvinMemory, marvinTasks, loadRequest, httpBackend;

  beforeEach(module('ngBabelfish', 'i18nMock'));

  beforeEach(inject(function ($injector) {
    var $q = $injector.get('$q');

    httpBackend  = $injector.get('$httpBackend');
    translations = $injector.get('translations');
    service      = $injector.get('babelfishLang');
    http         = $injector.get('$http');
    rootScope    = $injector.get('$rootScope');
    marvin       = $injector.get('marvin');
    marvinMemory = $injector.get('marvinMemory');
    marvinTasks  = $injector.get('marvinTasks');

    loadRequest = $q.defer();
    mockHttp(loadRequest);

    marvinMemory.set({
      available: Object.keys(translations),
      data: translations
    });

    spyOn(rootScope, '$on').and.callThrough();
    spyOn(marvinTasks, 'bindToScope');
    spyOn(http, 'get').and.returnValue(loadRequest.promise);
    spyOn(marvin, 'getLazyConfig').and.returnValue({
      url: 'lang.json'
    });
    httpBackend.when('GET', '/i18n/languages.json').respond({});

    marvinMemory.set({
      available: [],
      data: null
    });

  }));

  afterEach(function() {
    httpBackend.flush();
  });

  it('should listen to ngBabelfish.marvin:requestTranslation', function() {
    rootScope.$emit('ngBabelfish.marvin:requestTranslation', {state: 'test', url: 'test.json'});
    loadRequest.resolve({});
    rootScope.$digest();
    expect(marvinTasks.bindToScope).toHaveBeenCalled();
  });

  describe('init process', function() {

    it('load the translations on init', function() {
      service.init('config');
      expect(http.get).toHaveBeenCalled();
    });

    it('load the translations on init with an url', function() {
      service.init('config', 'toto.json');
      expect(http.get).toHaveBeenCalledWith('toto.json');
    });

    it('should bind to the scope if the config allows binding', function() {
      spyOn(marvin, 'isBindToScope').and.returnValue(true);

      service.init('config');
      loadRequest.resolve({});
      rootScope.$digest();
      expect(marvinTasks.bindToScope).toHaveBeenCalled();
    });

    it('should not bind to the scope if the config does not allow binding', function() {
      spyOn(marvin, 'isBindToScope').and.returnValue(false);

      service.init('config');
      loadRequest.resolve({});
      rootScope.$digest();
      expect(marvinTasks.bindToScope).not.toHaveBeenCalled();
    });

    it('should set the state', function() {
      service.init('config');
      expect(marvinMemory.get().state.current).toBe('config');
    });

  });

  describe('bind for a state', function() {

    it('should set the state', function() {
      service.bindForState('config');
      expect(marvinMemory.get().state.current).toBe('config');
    });

    it('should bind to the scope if the config allows binding', function() {
      spyOn(marvin, 'isBindToScope').and.returnValue(true);
      service.bindForState('config');
      expect(marvinTasks.bindToScope).toHaveBeenCalled();
    });

    it('should not bind to the scope if the config does not allow binding', function() {
      spyOn(marvin, 'isBindToScope').and.returnValue(false);
      service.bindForState('config');
      expect(marvinTasks.bindToScope).not.toHaveBeenCalled();
    });

  });

  it('should set the state', function() {
    service.setState('robert');
    expect(marvinMemory.get().state.current).toBe('robert');
  });

  describe('change current language', function() {

    beforeEach(function() {
      spyOn(rootScope, '$emit');
    });

    it('should update the current lang', function() {
      expect(marvinMemory.get().lang.current).toBe('en-EN');
      service.set('fr-FR');
      expect(marvinMemory.get().lang.current).toBe('fr-FR');
      expect(marvinMemory.get().lang.previous).toBe('en-EN');
    });

    it('should emit an event', function() {
      service.set('fr-FR');
      expect(rootScope.$emit).toHaveBeenCalledWith('ngBabelfish.lang:setLanguage', marvinMemory.get().lang);
    });

    it('should have a callback as the second argument', function (done) {
      service.set('fr-FR', function() {
        expect(marvinMemory.get().lang.current).toBe('fr-FR');
        done();
      });
    });

  });

  describe('loading a translation', function() {

    it('should use the default url with no argument', function() {
      service.load();
      expect(http.get).toHaveBeenCalledWith('/i18n/languages.json');
    });

    it('should use the argument for URL', function() {
      service.load('toto.json');
      expect(http.get).toHaveBeenCalledWith('toto.json');
    });

    it('should find the url if we using the lazy mode', function() {
      spyOn(marvin, 'isLazy').and.returnValue(true);

      service.load();
      expect(http.get).toHaveBeenCalledWith('lang.json');

      marvinMemory.get().lang.current = '';
      service.load();
      expect(http.get).toHaveBeenCalledWith('lang.json');
    });

    it('should throw a message onError if isVerbose', function() {
      spyOn(marvin, 'isVerbose');
      service.load();
      loadRequest.reject(new Error('bad request'));
      rootScope.$apply();

      expect(marvin.isVerbose).toHaveBeenCalled();
    });


    xit('should throw a message onError if isVerbose', function() {
      spyOn(marvin, 'isVerbose').and.returnValue(true);
      loadRequest.reject();
      rootScope.$digest();
      expect(function() {
        service.load();
      }).toThrowError('[ngBabelfish.babelfishLang@load] Cannot load the translation file');

    });

    it('should emit an event onSuccess', function() {

      spyOn(rootScope, '$emit');
      service.load();
      loadRequest.resolve({});
      rootScope.$apply();
      expect(rootScope.$emit).toHaveBeenCalled();
    });

  });

  describe('build a translation', function() {

    it('should set data from marvinMemory with our translations', function() {

      service.translate(translations);
      var data = marvinMemory.get().data;
      var keys = Object.keys(data);
      expect(keys.length).toBe(2);
      expect(keys.indexOf('en-EN') > -1).toBe(true);
      expect(keys.indexOf('fr-FR') > -1).toBe(true);
    });

    it('should set available from marvinMemory with our translations available', function() {

      service.translate(translations);
      var keys = marvinMemory.get().available;
      expect(keys.length).toBe(2);
      expect(keys.indexOf('en-EN') > -1).toBe(true);
      expect(keys.indexOf('fr-FR') > -1).toBe(true);
    });

    it('should emit an event', function() {
      spyOn(rootScope, '$emit');
      service.translate(translations);
      expect(rootScope.$emit).toHaveBeenCalledWith('ngBabelfish.lang:loaded', {lang: 'en-EN'});
    });

    describe('lazy mode', function() {

      beforeEach(function() {
        spyOn(marvin, 'isLazy').and.returnValue(true);
        service.translate(translations['en-EN']);
      });

      it('should bind for a lang', function() {
        var keys = marvinMemory.get().available;
        expect(keys.length).toBe(1);
        expect(keys.indexOf('en-EN') > -1).toBe(true);
      });

      it('should bind for a lang, en-EN', function() {
        var keys = Object.keys(marvinMemory.get().data);
        expect(keys.length).toBe(1);
        expect(keys.indexOf('en-EN') > -1).toBe(true);
      });

      it('should attach for only a lang', function() {

        marvinMemory.set({lang: {current: 'fr-FR'}});
        service.translate(translations['fr-FR']);

        var keys = Object.keys(marvinMemory.get().data);
        expect(keys.length).toBe(2);
        expect(keys.indexOf('fr-FR') > -1).toBe(true);

        expect(marvinMemory.get().available.length).toBe(2);
        expect(marvinMemory.get().available.indexOf('fr-FR') > -1).toBe(true);
      });
    })

  });

});
