/**
 * I18n module
 * Translate your application
 */
module.exports = angular.module('ngBabelfish.solo', [])
    .factory('translator', require('./factory/translator'));