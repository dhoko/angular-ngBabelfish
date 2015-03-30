describe('marvinMemory factory', function() {

  'use strict';

  var factory;

  beforeEach(module('ngBabelfish'));

  beforeEach(inject(function ($injector) {
    factory = $injector.get('marvinMemory');
    factory.set({
      state: {
        current: '',
        previous: '',
        loaded: false
      },
      lang: {
        previous: 'en-EN',
        current: 'en-EN'
      },
      data: null,
      available: []
    });
  }));

  it('should return the model', function() {

    var model = factory.get();

    expect(model.state.current).toBe('');
    expect(model.state.previous).toBeDefined();
    expect(model.lang.current).toBeDefined();
    expect(model.lang.previous).toBeDefined();
    expect(model.data).toBe(null);
    expect(model.available).toEqual([]);
  });
});
