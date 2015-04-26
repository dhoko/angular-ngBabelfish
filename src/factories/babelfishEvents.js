angular.module('ngBabelfish')
  .factory('babelfishEvent', function ($rootScope) {

    'use strict';

    var events = {};

    /**
     * Execute an event
     * @param  {String} eventName
     * @return {void}
     */
    function trigger(eventName, data) {
      (events[eventName] || []).forEach(function (eventRecord) {
        eventRecord(data);
      });
    }

    $rootScope.$on('ngBabelfish.translation:loaded', function (e, data) {
      if(data.previousLang !== data.lang) {
        trigger('change:language', data);
      }
    });

    $rootScope.$on('ngBabelfish.lang:loaded', function (e, data) {
      trigger('load:language', data);
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
        events[eventName] = events[eventName] || [];
        events[eventName].push(cb || angular.noop);
      }
    };
  });
