angular.module('ngBabelfish')
  .directive('i18nBind', function (marvin, babelfish) {

    'use strict';

    return {
      link: function(scope, el, attr) {

        var key = attr.i18nBind,
            lang = attr.i18nBindLang || marvin.getDefaultLang();

        if(babelfish.isLangLoaded(lang)) {
          var translation = babelfish.get(lang);
          return el.text(translation[key]);
        }else {
          (babelfish.current() !== lang) && babelfish.load(lang);
        }

        babelfish.on('change:language', function (data) {
          if(babelfish.isLangLoaded(data.lang)) {
            var translation = babelfish.get(data.lang);
            el.text(translation[key]);
          }
        });

        babelfish.on('load:language', function (data) {
          var translation = babelfish.get(data.lang);
          el.text(translation[key]);
        });

      }
    };
  });
