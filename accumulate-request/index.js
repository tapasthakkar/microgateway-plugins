'use strict';
const debug = require('debug')('plugin:accumulate-request');

const helperFunctions = require('../lib/helperFunctions');

/**
 * This plugin accumulates data chunks from the client into an array
 * property on the request, concats them on end and delivers the entire
 * accumulated request data as one big chunk to the next plugin in the
 * sequence. Since this plugin operates on requests, it should be the
 * first plugin in the sequence so that subsequent plugins receive the
 * accumulated request data.
 *
 * Users should be aware that buffering large requests or responses in
 * memory can cause Apigee Edge Microgateway to run out of memory under
 * high load or with a large number of concurrent requests. So this plugin
 * should only be used when it is known that request/response bodies are small.
 */
const LOG_TAG_COMP = 'accumulate-request';

module.exports.init = function(config, logger, stats) {
  function accumulate(req, data) {
    if (!req._chunks) req._chunks = [];
    req._chunks.push(data);
  }

  return {

    ondata_request: function(req, res, data, next) {
      data = helperFunctions.toBuffer(data);
      if (data && data.length > 0) accumulate(req, data);
      next(null, null);
    },

    onend_request: function(req, res, data, next) {
      if (data && data.length > 0) accumulate(req, data);
      var content = null;
      if (req._chunks && req._chunks.length) {
        try {
          content = Buffer.concat(req._chunks);
        } catch(err) {
          debug('Error in creating buffered content', err);
          content='';
          logger.eventLog({level:'warn', req: req, res: res, err:err, component:LOG_TAG_COMP }, "Error in creating buffered content");
        }
      }
      delete req._chunks;
      next(null, content);
    }
  };

}
