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
      available: []
    };

    return {
      get: function() {
        return memory;
      },
      set: function(config) {
        angular.extend(memory, config);
      }
    };
  });
