function mockHttp(loadRequest) {
  var promise = loadRequest.promise;

  /**
   * Emulate $http promise for a succes call
   * @param  {Function} cb Callback
   * @return {$q.Promise}
   */
  promise.success = function (cb) {
    promise.then(function(data) {
      cb(data);
    });
    return promise;
  };
  /**
   * Emulate $http promise for an error call
   * @param  {Function} cb Callback
   * @return {$q.Promise}
   */
  promise.error = function (cb) {
    promise.then(null, function(data) {
      cb(data);
    });
    return promise;
  };
}
