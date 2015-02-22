angular.module('ngBabelfish')
  .service('marvinTasks', function ($rootScope, marvin, marvinMemory) {

    'use strict';

    var model = marvinMemory.get();

    function bindToScope() {

      var lang = model.lang.current;

      // We do not want to have multiple reload if the lang is already present
      if(marvin.isLazy() && !model.data[lang]) {
        return $rootScope.$emit('ngBabelfish.marvin:requestTranslation', {
          state: model.state.current,
          url: marvin.getLazyConfig(lang).url
        });
      }

      setTranslation();
    }

    function setTranslation() {

      var lang = model.lang.current;
      var state = model.state.current,
          stateI18n,
          translation = {};

      // Prevent too many reload
      if(state === model.state.previous && model.lang.current === model.lang.previous) {
        return;
      }

      if(!model.data[lang]) {
        return;
      }

      stateI18n = model.data[lang][state];

      /**
       * Prevent the error
       *     > TypeError: Cannot read property '$$hashKey' of undefined
       * cf {@link https://github.com/dhoko/ngBabelfish/issues/5}
       */
      if(!stateI18n) {
        model.data[lang][state] = {};

        if(marvin.isVerbose()) {
          console.warn('[marvinTasks@setTranslation] No translation available for the page %s for the lang %s',state, lang);
        }
      }

      angular.extend(
        translation,
        angular.extend({}, model.data[lang]._common),
        stateI18n
      );

      if(marvin.getNamespace()) {
        $rootScope[marvin.getNamespace()] = translation;
      }else {
        angular.extend($rootScope, translation);

        if(marvin.isVerbose()) {
          console.warn('[marvinTasks@setTranslation] It is better to Load i18n inside a namespace.');
        }
      }

      $rootScope.$emit('ngBabelfish.translation:loaded', {
        currentState: state,
        lang: lang
      });

    }
    this.bindToScope = bindToScope;
  });