# Angular ngBabelfish - [![Build Status](https://api.travis-ci.org/dhoko/ngBabelfish.png?branch=master)](https://travis-ci.org/dhoko/ngBabelfish)

Internationalization module for angular.js, it's magic !

> It's working with [Angular UI-Router](https://github.com/angular-ui/ui-router/)

## Install

`npm install ng-babelfish` or `bower install ngBabelfish`

In your html:

```html
<script src="bower_components/ngBabelfish/dist/bundle.js"></script>
```

Add the dependency to your module:

```JavaScript
angular.module('myApp',['ngBabelfish']);
```

## Translations

You have to create a json file, cf:

### Ex for a default JSON (lazy mode is off)

```json
{
  "fr-FR": {
    "_common": {
      "lang": "Français",
      "back": "Page précédente"
    },
    "home": {
      "title": "Bienvenue petit papillon de lumière !",
      "baseline": "Bienvenue sur",
      "baselineInfo": "NgServal",
      "includes": "Tu peux désormais coder. Tu disposes de :",
      "launchApp": "Ouvre une console et saisi cette commande :",
      "aboutTpl": "On utilise une  version customisée du template lodash cf:",
      "aboutTpl2": "Tu peux modifier ça dans la variable templateSettings, on trouve ça dans ce fichier",
      "aboutLink": "Tu peux aller à la page suivante avec ce lien : ",
      "aboutLink2": "ou, en utilisant ce bouton avec un event",
      "aboutAnchor": "avec une ancre",
      "buttonMsg": "Page suivante"
    },
    "welcome": {
      "message": "coucou"
    }
  },
  "en-EN": {
    "_common": {
      "lang": "English",
      "back": "Previous page"
    },
    "home": {
      "title": "Hi little butterfly !",
      "baseline": "Welcome to",
      "baselineInfo": "NgServal",
      "includes": "You're ready to code. It includes",
      "launchApp": "Open a terminal and run",
      "aboutTpl": "It uses a custom lodash templating cf:",
      "aboutTpl2": "You can of course remove these templateSettings, it's located inside",
      "aboutLink": "You can access to another page here ",
      "aboutLink2": "or, use a button with an event listener.",
      "aboutAnchor": "with an anchor",
      "buttonMsg": "Next page"
    },
    "welcome": {
      "message": "hey"
    }
  }
}
```

***You must respect a convention for the lang***
> Language are defined with a `-` as defined inside the [BCP 47](http://tools.ietf.org/html/bcp47). cf [Value of the HTML5 lang attribute](http://webmasters.stackexchange.com/questions/28307/value-of-the-html5-lang-attribute).


### JSON configuration with the lazy mode

```json
{
    "_common": {
      "lang": "English",
      "back": "Previous page"
    },
    "home": {
      "title": "Hi little butterfly !",
      "baseline": "Welcome to",
      "baselineInfo": "NgServal",
      "includes": "You're ready to code. It includes",
      "launchApp": "Open a terminal and run",
      "aboutTpl": "It uses a custom lodash templating cf:",
      "aboutTpl2": "You can of course remove these templateSettings, it's located inside",
      "aboutLink": "You can access to another page here ",
      "aboutLink2": "or, use a button with an event listener.",
      "aboutAnchor": "with an anchor",
      "buttonMsg": "Next page"
    },
    "welcome": {
      "message": "hey"
    }
  }
```

> FileName can be: "en-EN.json", we do not care. Look at the **Provider configuration**.

### How does it works

- **fr-FR** : French language (if no lazy mode)
- **_common**: Translation available in each state of your application
- **home**: Translation only for the state home

> So when ngBabelfish binds i18n, it extends _commom with home. So you can overide a translation from _common in a state.

## In my application

When you load the application, as *ngBabelfish* is a dependency, it loads its own configuration before your app's config.

Ex:

```JavaScript
run(['babelfish', '$state','$rootScope', function(babelfish, $state, $rootScope) {

    // Update the translation when you change a page
    $rootScope.$on('$stateChangeSuccess', function(e, toState) {
        babelfish.updateState(toState.name);
    });

    babelfish.load();
}]);
```

It loads the translation file, by default it's from `/i18n/languages.json`. But of course you can load only a file with one language, you have to configure the service. It's the lazy mode. (*unstable*).

So when the file is created, it binds the data from the default state (*home*) to your scope.

> *You can binds translation to a namespace*

### Configuration

```JavaScript
angular.module('myApp')
    .config(function(babelfishProvider) {

        // Configure the i18n for this app
        babelfishProvider.languages({
            state: "home", // Default state to load
            lang: "en-EN", // Default language
            url: "/i18n/languages.json", // Default url
            namespace: "", // Default namespace
            lazy: false, // Active lazy
            urls: [ // Files per lang when you are in lazy mode (so url is useless)
                {
                    lang: "", // fr-FR etc.
                    url: ""
                }
            ]
        });
    });
```

#### Default configuration

```json
{
    "state": "home",
    "lang": "en-EN",
    "url": "/i18n/languages.json",
    "namespace": "",
    "lazy": false,
    "urls": [
        {
            "lang": "",
            "url": ""
        }
    ],
}
```

So by default, babelfish will load your translation file from `/i18n/languages.json`. And load the lang `en-EN`, so you must have a key `en-EN` in the json. Then it says, your default state is home.

### Detect when you change the lang of your app

```JavaScript
$rootScope.$emit('ngBabelfish.translation:changed', {
    previous: (old + '-' + old.toUpperCase()),
    value: lang
});
```

So you have to listen the scope on `ngBabelfish.translation:changed`, it gives you access to an object with two keys:

- **previous** : Previous language
- **value** : Current language

### Detect when you load another/a new lang for your app

```JavaScript
$rootScope.$emit('ngBabelfish.translation:loaded', {
    currentState: page,
    lang: lang
});
```
So you have to listen the scope on `ngBabelfish.translation:loaded`, it gives you access to an object with two keys:

- **currentState**: current state
- **lang**: current lang for the application

## Lazy Loading

You can build a file per lang, so you can load only the current lang, and load another if you need to.

### Configuration

Configure the service from `babelfishProvider` in your app module

```JavaScript
angular.module('myApp')
    .config(function(babelfishProvider) {

        // Configure the i18n for this app
        babelfishProvider.languages({
            namespace: "", // Namespace to store your translations in the $scope
            state: "home", // Default state of your app
            lang: "fr-FR", // Default lang for the app
            lazy: true, // Activate lazy mode
            urls: [ // Store each translation
                {
                    lang: "fr-FR", // Name of your translation
                    url: "/i18n/fr-FR.json" // Path to the translation
                },{
                    lang: "en-EN",
                    url: "/i18n/en-EN.json"
                }
            ]
        });

    })
```

It's ready.


### A json for the lazy mode

```json
{
    "_common": {
      "lang": "English",
      "back": "Previous page"
    },
    "home": {
      "title": "Hi little butterfly !",
      "baseline": "Welcome to",
      "baselineInfo": "NgServal",
      "includes": "You're ready to code. It includes",
      "launchApp": "Open a terminal and run",
      "aboutTpl": "It uses a custom lodash templating cf:",
      "aboutTpl2": "You can of course remove these templateSettings, it's located inside",
      "aboutLink": "You can access to another page here ",
      "aboutLink2": "or, use a button with an event listener.",
      "aboutAnchor": "with an anchor",
      "buttonMsg": "Next page"
    },
    "welcome": {
      "message": "hey"
    }
  }
```

## API

### In a template

```html
<p>{{message}}</p>
```

Yup, message is from your i18n. KISS.

> You can configure ngBabelfish to use a namespace too.

### Service babelfish

API:

- `babelfish.load(url)` : Load a translation (default url = i18n/languages.json)
- `babelfish.get(lang)` : Return all translations for a lang per state
- `babelfish.all(lang)` : Return all translations for a lang
- `babelfish.current()` : Return the current lang
- `babelfish.updateLang(lang)` : Load new translation for a lang in your app
- `babelfish.updateState(state)` : Bind current translation for a state
- `babelfish.isLoaded()` : Detect if your i18n is loaded

### Filter translate

```html
<!-- Our current language is en-EN -->
<h1>{{ name | translate:'fr-FR':"name"}}</h1>
```
Display the french translation for this key

### Directives

#### i18nBind

```html
<!-- Our current language is en-EN -->
<h1 data-i18n-bind="name"></h1>
<h1 data-i18n-bind="name" data-i18n-bind-lang="fr-FR"></h1>
```

Ex 1: Display the english translation for name
Ex 2: Display the french translation for name

#### i18nLoad

Attach this directive to a button in order to load a translation, for your application.

```html
<button type="button" data-i18n-load="fr-FR">Load french translation for the app</button>
<button type="button" data-i18n-load="en-EN">Load english translation for the app</button>
```

### Events


#### ngBabelfish.translation:changed

When you change the language of your application.
Ex: `babelfish.updateLang('fr-FR');`

```
{
    previous: 'en-EN',
    value: 'fr-FR'
}
```

#### ngBabelfish.translation:loaded

When you change the current state.
Ex: `babelfish.updateState('test');`

```
{
    currentState: 'test',
    lang: 'en-EN'
}
```


## Development

> You can remove ngBabelfish warnings for your tests, just inject the provider and set the key log to false

```JavaScript
 beforeEach(module('ngBabelfish', function (babelfishProvider) {
    babelfishProvider.languages({
        log: false
    });
}));
```

### test

```sh
$ npm test
```

### Build

```sh
$ npm run build
```
