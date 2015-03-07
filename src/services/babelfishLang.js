angular.module('ngBabelfish')
  .service('babelfishLang', function ($http, $rootScope, marvin, marvinMemory, marvinTasks) {

    'use strict';

    var model = marvinMemory.get();

    $rootScope.$on('ngBabelfish.marvin:requestTranslation', function (e, data) {
      init(data.state, data.url);
    });

    function init(stateName, url) {
      model.state.current = stateName;

      if(!marvin.isBindToScope()) {
        return;
      }

      load().then(marvinTasks.bindToScope);
    }

    function setLanguage(lang, cb) {
      cb = cb || angular.noop;
      model.lang.previous = angular.copy(model.lang.current);
      model.lang.current = lang;
      $rootScope.$emit('ngBabelfish.lang:setLanguage', model.current);
      cb();
    }

    function load(url) {

      var lang = model.lang.current;
      url = url || marvin.getConfig().url;

      if(marvin.isLazy()) {
        url = marvin.getLazyConfig(model.lang.current || marvin.getConfig().lang).url;
      }

      return $http
        .get(url)
        .error(function() {
          if(marvin.isVerbose()) {
            throw new Error('[babelfishLangr@load] Cannot load the translation file');
          }
        })
        .success(translate);
    }

    function translate(data) {
      var lang = model.lang.current;

      if(marvin.isLazy()) {
        model.data = {};
        model.data[lang] = data;

        if(-1 === model.available.indexOf(lang)) {
          model.available.push(lang);
        }

      }else {
        model.data = data;
        model.available = Object.keys(data);
      }

      $rootScope.$emit('ngBabelfish.lang:loaded', {
        lang: lang
      });
    }

    this.init = init;
    this.load = load;
    this.translate = translate;
    this.set = setLanguage;

  });
