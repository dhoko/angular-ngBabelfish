describe('marvinTasks service', function() {

  'use strict';

  var service, translations, marvin, marvinMemory, rootScope;

  beforeEach(module('ngBabelfish', 'i18nMock'));

  beforeEach(inject(function ($injector) {
    service        = $injector.get('marvinTasks');
    translations   = $injector.get('translations');
    rootScope      = $injector.get('$rootScope');
    marvin         = $injector.get('marvin');
    marvinMemory   = $injector.get('marvinMemory');

    spyOn(marvin, 'getLazyConfig').and.returnValue({
      url: 'lang.json'
    });

    spyOn(rootScope, '$emit');
  }));

  describe('set a translation', function() {

    beforeEach(function() {
      marvinMemory.set({
        state: {
          current: 'home',
          previous: 'config'
        },
        lang: {
          current: 'en-EN',
          previous: 'en-EN'
        },
        available: Object.keys(translations),
        data: angular.copy(translations)
      });
      spyOn(console, 'warn');
    });

    it('should trigger an event if states are not the same even if lang are', function() {
      service.setTranslation();
      expect(rootScope.$emit).toHaveBeenCalled();
    });

    it('should do nothing if the previous lang equal the current idem for state', function() {
      marvinMemory.set({
        state: {
          current: 'home',
          previous: 'home'
        }
      });
      service.setTranslation();
      expect(rootScope.$emit).not.toHaveBeenCalled();
    });

    it('should do nothing if the lang is not loaded', function() {
      marvinMemory.set({
        lang: {
          current: 'de-DE'
        }
      });
      service.setTranslation();
      expect(rootScope.$emit).not.toHaveBeenCalled();
    });

    it('should init the model to an empty Object if the state does not exist', function() {
      marvinMemory.set({
        state: {
          current: 'robert',
          previous: 'home'
        }
      });
      service.setTranslation();
      expect(marvinMemory.get().data['en-EN'].robert).toBeDefined();
    });

    it('should display a message if the state does not exist and isVerbose', function() {
      marvinMemory.set({
        state: {
          current: 'robert',
          previous: 'home'
        }
      });
      service.setTranslation();
      expect(console.warn).toHaveBeenCalledWith('[ngBabelfish.marvinTasks@setTranslation] No translation available for the page %s for the lang %s', 'robert', 'en-EN');
    });

    it('should not display a message if the state does not exist and !isVerbose', function() {
      marvinMemory.set({
        state: {
          current: 'robert',
          previous: 'home'
        }
      });
      spyOn(marvin, 'isVerbose').and.returnValue(false);
      service.setTranslation();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should fill the rootScope namespace', function() {
      expect(rootScope.i18n).not.toBeDefined();
      service.setTranslation();
      expect(rootScope.i18n).toBeDefined();
      expect(rootScope.i18n.about).toBe(translations['en-EN'].home.about);
    });

    it('should extend the rootScope if no namespace is set', function() {
      spyOn(marvin, 'getNamespace').and.returnValue(false);
      expect(rootScope.about).not.toBeDefined();
      service.setTranslation();
      expect(rootScope.about).toBeDefined();
      expect(rootScope.about).toBe(translations['en-EN'].home.about);
    });

    it('should display a message if isVerbose and no namespace', function() {
      spyOn(marvin, 'getNamespace').and.returnValue(false);
      spyOn(marvin, 'isVerbose').and.returnValue(true);

      service.setTranslation();
      expect(console.warn).toHaveBeenCalledWith('[ngBabelfish.marvinTasks@setTranslation] It is better to Load i18n inside a namespace.');
    });

    it('should  not display a message if !isVerbose and no namespace', function() {
      spyOn(marvin, 'getNamespace').and.returnValue(false);
      spyOn(marvin, 'isVerbose').and.returnValue(false);

      service.setTranslation();
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('should not bind to the scope if the config is false', function() {
      expect(rootScope.i18n).not.toBeDefined();
      spyOn(marvin, 'isBindToScope').and.returnValue(false);
      expect(rootScope.i18n).not.toBeDefined();
    });

  });

  describe('bind to the scope', function() {

    beforeEach(function() {
      marvinMemory.set({
        state: {
          current: 'home',
          previous: 'config'
        },
        lang: {
          current: 'en-EN',
          previous: 'en-EN'
        },
        available: Object.keys(translations),
        data: angular.copy(translations)
      });
    });

    it('should trigger an event as it translates', function() {
      service.bindToScope();
      expect(rootScope.$emit).toHaveBeenCalled();
    });

    it('should emit a custom event if we are lazy and the lang does not exist yet', function() {
      marvinMemory.set({
        lang: {
          current: 'de-DE',
          previous: 'en-EN'
        }
      });
      spyOn(marvin, 'isLazy').and.returnValue(true);

      service.bindToScope();
      expect(rootScope.$emit).toHaveBeenCalledWith('ngBabelfish.marvin:requestTranslation', {
        state: 'home',
        url: 'lang.json'
      });
    });

  });

});