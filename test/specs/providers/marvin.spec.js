describe('marvin provider', function() {

  'use strict';

  var service;

  describe('default config', function() {

    beforeEach(module('ngBabelfish', function (marvinProvider) {
      marvinProvider.init();
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('marvin');
    }));

    it('should be bind to the scope', function() {
      expect(service.isBindToScope()).toBe(true);
    });

    it('should be verbose', function() {
      expect(service.isVerbose()).toBe(true);
    });

    it('should not be lazy', function() {
      expect(service.isLazy()).toBe(false);
    });

    it('should return void 0 when we try to load lazy config via URL', function() {
      expect(service.getLazyConfigByUrl('toto.json')).toBe(void 0);
    });

    it('should return empty {} when we try to load lazy config via lang key', function() {
      expect(Object.keys(service.getLazyConfig('fr-FR')).length).toBe(0);
    });

    it('should return empty [] if we list lazy lang available', function() {
      expect(service.getLazyLangAvailable().length).toBe(0);
    });

    it('should return en-EN as default lang', function() {
      expect(service.getDefaultLang()).toBe('en-EN');
    });

    it('should return i18n as default namespace', function() {
      expect(service.getNamespace()).toBe('i18n');
    });

    it('should listen to ui.router event', function() {
      expect(service.getRouteEvent()).toBe('$stateChangeSuccess');
    });

  });

  describe('Change default event config', function() {

    beforeEach(module('ngBabelfish', function (marvinProvider) {
      marvinProvider
        .init()
        .routingEvent('$routeChangeSuccess');
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('marvin');
    }));

    it('should listen to $routeChangeSuccess event', function() {
      expect(service.getRouteEvent()).toBe('$routeChangeSuccess');
    });

  });

  describe('Verbose off config', function() {

    beforeEach(module('ngBabelfish', function (marvinProvider) {
      marvinProvider
        .init()
        .verbose(false);
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('marvin');
    }));

    it('should not be verbose', function() {
      expect(service.isVerbose()).toBe(false);
    });

  });

  describe('Bind to the scope off config', function() {

    beforeEach(module('ngBabelfish', function (marvinProvider) {
      marvinProvider
        .init()
        .bindToScope(false);
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('marvin');
    }));

    it('should not be bind to the scope', function() {
      expect(service.isBindToScope()).toBe(false);
    });

  });

  describe('Use dom lang config', function() {

    beforeEach(module('ngBabelfish', function (marvinProvider) {
      marvinProvider
        .init({lang: ''});
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('marvin');
      document.documentElement.lang = 'fr';
    }));

    it('should return the dom default lang', function() {
      expect(service.getDefaultLang()).toBe('fr-FR');
    });

  });

  describe('Lazy mode config', function() {

    beforeEach(module('ngBabelfish', function (marvinProvider) {
      marvinProvider
        .init()
        .lang({
          lang: 'en-EN',
          url: '../i18n/en-EN.json'
        })
        .lang({
          lang: 'fr-FR',
          url: '../i18n/fr-FR.json'
        });
    }));

    beforeEach(inject(function ($injector) {
      service = $injector.get('marvin');
    }));

    it('should be in lazy mode', function() {
      expect(service.isLazy()).toBe(true);
    });

    it('should list two lang as available', function() {
      var list = service.getLazyLangAvailable();
      expect(list.length).toBe(2);
      expect(list.indexOf('en-EN') > -1).toBe(true);
      expect(list.indexOf('fr-FR') > -1).toBe(true);
    });

    it('should load the default lang config', function() {
      var config = service.getLazyConfig();
      expect(config.lang).toBe('en-EN');
    });

    it('should load the french lang config', function() {
      var config = service.getLazyConfig('fr-FR');
      expect(config.lang).toBe('fr-FR');
    });

    it('should return the french config', function() {
      var config = service.getLazyConfigByUrl('../i18n/fr-FR.json');
      expect(config.lang).toBe('fr-FR');
    });

  });



});
