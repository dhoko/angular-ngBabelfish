# Angular ngBabelfish - [![Build Status](https://api.travis-ci.org/dhoko/angular-ngBabelfish.svg)](https://travis-ci.org/dhoko/angular-ngBabelfish)

Internationalization module for angular.js, it's magic !

> It's working with [Angular UI-Router](https://github.com/angular-ui/ui-router/) (default, *but you can use ngRoute too*)

## Installation

It's available on both bower and npm.

```sh
$ npm install ng-babelfish
$ bower install ngBabelfish
```

In your html:

```html
<script src="bower_components/ngBabelfish/dist/bundle.js"></script>
<!-- or min version -->
<script src="bower_components/ngBabelfish/dist/bundle.min.js"></script>
```

Add the dependency to your module:

```js
angular.module('myApp',['ngBabelfish']);
```

## Developpment

### start dev mode

```sh
$ npm start
```

### Build the library

```sh
$ npm run build
```

> It creates `dist/bundle(.min).js` and update the version in  bower.json and package.json. It's a PATCH.

To create a major or a minor

```sh
$ npm run build -- [--minor|--major]
```
