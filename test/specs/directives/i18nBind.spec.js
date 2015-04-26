describe('babelfish service', function() {

  var babelfish, translations, marvin, dom, scope;
  beforeEach(module('ngBabelfish', 'i18nMock', function ($provide) {
    $provide.factory('babelfish', function() {

      var eventMap = {};
      return {
        isLangLoaded: angular.noop,
        get: function(lang) {
          var data = getTranslations();
          return angular.extend({}, data[lang]._common, data[lang]._home);
        },
        current: angular.noop,
        load: angular.noop,
        on: function(name, cb) {
          eventMap[name] = cb;
        },
        emit: function(name, data) {
          (eventMap[name] || angular.noop)(data);
        }
      };
    });
  }));

  beforeEach(inject(function ($injector) {
    var rootScope = $injector.get('$rootScope');
    translations = $injector.get('translations');
    babelfish = $injector.get('babelfish');
    marvin = $injector.get('marvin');
    compile = $injector.get('$compile');
    httpBackend = $injector.get('$httpBackend');

    scope = rootScope.$new();

    spyOn(marvin, 'getDefaultLang').and.returnValue('en-EN');
    spyOn(babelfish, 'on').and.callThrough();
    spyOn(babelfish, 'get').and.callThrough();
    spyOn(babelfish, 'load');

    httpBackend.expectGET('/i18n/languages.json').respond({});
    dom = compile('<div i18n-bind="text"></div>')(scope);
    scope.$digest();
  }));

  it('should not create an isolate scope', function() {
    expect(dom.isolateScope()).toBe(void 0);
  });

  it('should listen to change:language', function() {
    expect(babelfish.on.calls.argsFor(0)[0]).toBe('change:language');
  });

  it('should listen to load:language', function() {
    expect(babelfish.on.calls.argsFor(1)[0]).toBe('load:language');
  });

  describe('Lang is loaded', function() {

    beforeEach(function() {
      spyOn(babelfish, 'isLangLoaded').and.returnValue(true);
      dom = compile('<div i18n-bind="text"></div>')(scope);
      scope.$digest();
    });

    it('should check if a lang is loaded', function() {
      expect(babelfish.isLangLoaded).toHaveBeenCalledWith('en-EN');
    });

    it('should fetch lang details', function() {
      expect(babelfish.get).toHaveBeenCalledWith('en-EN');
    });

    it('should bind da content', function() {
      expect(dom.text()).toBe('common text');
    });

  });

  describe('Lang is not loaded', function() {

    beforeEach(function() {
      spyOn(babelfish, 'isLangLoaded').and.returnValue(false);
      dom = compile('<div i18n-bind="text"></div>')(scope);
      scope.$digest();
    });

    it('should check if a lang is loaded', function() {
      expect(babelfish.isLangLoaded).toHaveBeenCalledWith('en-EN');
    });

    it('should check if the current lang is the same', function() {
      spyOn(babelfish, 'current');
      dom = compile('<div i18n-bind="text"></div>')(scope);
      scope.$digest();
      expect(babelfish.current).toHaveBeenCalled();
    });

    it('should load if the current lang is not the same', function() {
      spyOn(babelfish, 'current').and.returnValue('fr-FR');
      dom = compile('<div i18n-bind="text"></div>')(scope);
      scope.$digest();
      expect(babelfish.load).toHaveBeenCalledWith('en-EN');
    });

  });

  describe('On change language', function() {

    it('should do nothing if the lang is lnot loaded yet', function() {
      spyOn(babelfish, 'isLangLoaded').and.returnValue(false);
      babelfish.emit('change:language', {lang: 'en-EN'});
      expect(babelfish.get).not.toHaveBeenCalled();
    });

    it('should load the lang data', function() {
      spyOn(babelfish, 'isLangLoaded').and.returnValue(true);
      babelfish.emit('change:language', {lang: 'en-EN'});
      expect(babelfish.get).toHaveBeenCalledWith('en-EN');
    });

    it('should bind the lang data', function() {
      spyOn(babelfish, 'isLangLoaded').and.returnValue(true);
      babelfish.emit('change:language', {lang: 'fr-FR'});
      expect(dom.text()).toBe('french text');
    });

  });

  describe('On load language', function() {

    it('should load the lang data', function() {
      babelfish.emit('load:language', {lang: 'en-EN'});
      expect(babelfish.get).toHaveBeenCalledWith('en-EN');
    });

    it('should bind the lang data', function() {
      expect(dom.text()).toBe('');
      babelfish.emit('load:language', {lang: 'fr-FR'});
      expect(dom.text()).toBe('french text');
    });

  });


});