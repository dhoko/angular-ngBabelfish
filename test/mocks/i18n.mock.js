angular.module('i18nMock', [])
  .value('translations', {
    "en-EN": {
      "_common": {
        "version": "1.6.0",
        "text": "common text"
      },
      "home": {
        "title": "ngBabelfish demonstration",
        "about": "hello jeanne"
      }
    },
    "fr-FR": {
      "_common": {
        "version": "1.6.0",
        "text": "french text"
      },
      "home": {
        "title": "La démonstration ngBabelfish",
        "about": "bonjour maurice"
      }
    }
  });