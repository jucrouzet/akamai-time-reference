'use strict';

var Promise = require('bluebird');
var request = require('request');

var pjson = require('./package.json');

var options = {
  cacheTTL: 5000,
  useHTTP: false,
  timeout: 2000,
};

var cache = {
  localTimestamp: 0,
  akamaiTimestamp: 0,
};

/**
 * Generate request's options.
 *
 * @return {object} Options.
 * @private
 */
function _getRequestOptions() {
  var requestOptions = {
    headers: {
      'User-Agent': 'Node.js/akamai-time-reference ' +
        pjson.version +
        ' https://github.com/jucrouzet/akamai-time-reference',
    },
    timeout: options.timeout,
  };

  if (options.useHTTP) {
    requestOptions.url = 'http://time.akamai.com';
  } else {
    requestOptions.url = 'https://time.akamai.com';
  }
  return (requestOptions);
}

/**
 * Do the call and parses answer.
 *
 * @return {Promise} Promise of current time's Date.
 * @private
 */
function _getNow() {
  return (new Promise(function _resolvePromise(resolve, reject) {
    request(_getRequestOptions(), function _requestCallback(error, response, body) {
      var akamaiTimestamp;

      if (error) {
        return (reject(new Error('Request error : ' + error)));
      }
      if (response.statusCode !== 200) {
        return (reject(new Error('HTTP error, status code : ' + response.statusCode)));
      }
      if (!response.headers || response.headers.server !== 'Akamai/Time Server') {
        return (reject(new Error('Invalid return from server of not Akamai Time Server')));
      }
      if (!/^\d+$/.exec(body)) {
        return (reject(new Error('Invalid return from Akamai Time Server')));
      }
      akamaiTimestamp = parseInt(body, 10) * 1000;
      cache = {
        localTimestamp: (new Date()).getTime(),
        akamaiTimestamp: akamaiTimestamp,
      };
      resolve(new Date(akamaiTimestamp));
    });
  }));
}

/**
 * Compute time from cache + local time delta from cache write.
 *
 * @return {Promise} Promise of current time's Date.
 * @private
 */
function _getCachedNow() {
  return (Promise.resolve(new Date(
    cache.akamaiTimestamp +
    ((new Date()).getTime() - cache.localTimestamp)
  )));
}

/**
 * Tells if I should use cache or make the request.
 *
 * @return {boolean}
 * @private
 */
function _shouldIUseCache(skipCache) {
  return (
    !skipCache &&
    cache.localTimestamp &&
    (((new Date()).getTime() - cache.localTimestamp) < options.cacheTTL)
  );
}

/**
 * Checks if object is valid options, then save it.
 *
 * @param {Object} _options New options object.
 * @private
 * @throw {Error} If not valid.
 */
function _setOptions(_options) {
  if (typeof _options !== 'object') {
    throw new Error('Invalid options object');
  }
  if (_options.hasOwnProperty('cacheTTL')) {
    if (typeof _options.cacheTTL !== 'number') {
      throw new Error('Invalid cacheTTL option value');
    }
    options.cacheTTL = _options.cacheTTL;
  }
  if (_options.hasOwnProperty('timeout')) {
    if (typeof _options.timeout !== 'number') {
      throw new Error('Invalid timeout option value');
    }
    options.timeout = _options.timeout;
  }
  if (_options.hasOwnProperty('useHTTP')) {
    options.useHTTP = !!_options.useHTTP;
  }
  return (options);
}

module.exports = {
  now: function now(skipCache) {
    return (
      _shouldIUseCache(skipCache) ?
        _getCachedNow() :
        _getNow()
    );
  },
  setOptions: _setOptions,
};

