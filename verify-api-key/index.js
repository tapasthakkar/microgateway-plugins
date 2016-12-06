'use strict';
var request = require('request');
var util = require('util');
module.exports.init = function(config, logger, stats) {
  
  var apidUrl = (process.env.APID_ENDPOINT || 'http://localhost:9090') + '/verifiers/apikey';

  return {
    onrequest: function(req, res, data, next) {
      var scope = res.proxy.scope;
      var env= res.proxy.env;
      var base_path = res.proxy.base_path;
      var apiKey = req.headers['api-key-header'] || req.headers['x-api-key'];
      if (!apiKey) {
        logger.error("No API Key provided", 'oauth');
        res.statusCode = 401;
        next("No API Key Provided");
      }
      else {
        var options = {
          url: apidUrl,
          form: {
            key: apiKey,
            organization: scope,
            environment: env,
            uriPath: base_path,
            action: 'verify'
          }
        }
        request.post(options, function (err, resp, body) {
          var jsonBody = JSON.parse(body);
          if (err) {
            logger.error(err, 'verify-api-key');
            next(err, data);
          }
          else {
            if (jsonBody.type == 'ErrorResult') {
              logger.error(jsonBody.result.errorCode, 'verify-api-key');
              res.statusCode = 401;
              next (jsonBody.result.errorCode);
            }
            else if (jsonBody.result.status == 'REVOKED') {
              res.statusCode = 401;
              next("API Key has been revoked", data);
            }
            else {
              next(null, data);
            }
          }
        });
      }
    }
  }
}
