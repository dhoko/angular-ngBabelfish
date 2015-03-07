angular.module('ngBabelfish')
  .factory('babelfishEvent', function ($rootScope) {

    'use strict';

    var events = {};

    /**
     * Execute an event
     * @param  {String} eventName
     * @return {void}
     */
    function trigger(eventName) {
      (events[eventName] || angular.noop)();
    }

    $rootScope.$on('ngBabelfish.translation:loaded', function (e, data) {
      if(data.previousLang !== data.lang) {
        trigger('change:language');
      }
    });

    return {
      /**
       * Record a eventListener
       * Event available:
       *   - change:language
       * @param {String}   eventName
       * @param {Function} cb        callback to record
       */
      set: function(eventName, cb) {
        events[eventName] = cb;
      }
    };
  });