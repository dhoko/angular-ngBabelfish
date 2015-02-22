angular.module('ngBabelfish')
  .factory('marvinMemory', function() {

    'use strict';

    var memory = {
      state: {
        current: '',
        loaded: false
      },
      lang: {
        previous: 'en-EN',
        current: 'en-EN'
      },
      data: null,
      available: [],
      active: false
    };

    return {
      get: function() {
        return memory;
      }
    };
  });