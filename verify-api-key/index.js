'use strict';
var request = require('request');
var util = require('util');
const url = require('url');

module.exports.init = function(config, logger, stats) {
  
  var parsedUrl = url.parse((config.apidEndpoint || 'http://localhost:9090'));
  parsedUrl.pathname = '/verifiers/apikey';
  var apidUrl = url.format(parsedUrl);

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
            scopeuuid: scope,
            uriPath: base_path,
            action: 'verify'
          }
        }
        request.post(options, function (err, resp, body) {
          var jsonBody;
          try {
            jsonBody = JSON.parse(body);
          } catch (e) {
            logger.error(err, 'verify-api-key');
            next(err, data); 
          }

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
              logger.info('API key has been revoked.', 'verify-api-key');
              res.statusCode = 401;
              next("API Key has been revoked", data);
            }
            else {
              logger.info('API key has been verified.', 'verify-api-key');
              next(null, data);
            }
          }
        });
      }
    }
  }
}
