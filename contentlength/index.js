'use strict';
const debug = require('debug')('plugins:contentlength');
/**
 * This plugin accumulates data chunks from the client into an array
 * property on the request, concats them on end, then reads this
 * concatenated buffer to set the Content-Length header before sending
 * to the target request. Since this plugin requires the final payload 
 * size, it should be the final plugin in the sequence.
 *
 * Users should be aware that buffering large requests or responses in
 * memory can cause Apigee Edge Microgateway to run out of memory under
 * high load or with a large number of concurrent requests. So this plugin
 * should only be used when it is known that request/response bodies are small.
 */

module.exports.init = function(config, logger, stats) {
  function accumulateLength(req, data) {
    if (!req._chunksContentLength) req._chunksContentLength = [];
    req._chunksContentLength.push(data);
  }

  return {
    onrequest: function(req, res, next) {
      if(typeof req.headers['transfer-encoding'] !== 'undefined') delete req.headers['transfer-encoding'];
      next(null, req, res, next);
    },

    ondata_request: function(req, res, data, next) {
      if (data && data.length > 0) accumulateLength(req, data);
      next(null, null);
    },

    onend_request: function(req, res, data, next) {
      if (data && data.length > 0) accumulateLength(req, data);
      var content = null;
      if (req._chunksContentLength && req._chunksContentLength.length) {
        content = Buffer.concat(req._chunksContentLength);
      }
      delete req._chunksContentLength;
      next(null, content);
    }
  };
};
