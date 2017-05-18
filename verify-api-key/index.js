'use strict';
var request = require('request');
var util = require('util');
const url = require('url');
const qs = require('querystring');

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
      var parsedRequestUrl = url.parse(req.url);

      if(parsedRequestUrl.query) {
        var parsedQuery = qs.parse(parsedRequestUrl.query);
        apiKey = parsedQuery.apikey;
      }
      
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
            uriPath: parsedRequestUrl.pathname,
            action: 'verify'
          }
        }
        request.post(options, function (err, resp, body) {

          if (err) {
            if(err.code == 'ECONNREFUSED') {
              err.message = util.format('Error connecting to apid at: %s to verify api key', apidUrl);
            }
            logger.error(err, 'verify-api-key');
            return next(err, data);
          }
          else {
            var jsonBody;
            try {
              jsonBody = JSON.parse(body);
            } catch (e) {
              logger.error(e, 'verify-api-key');
              return next(e, data); 
            }

            if (jsonBody.type == 'ErrorResult') {
              logger.error(jsonBody.result, jsonBody.result.reason, 'verify-api-key');
              res.statusCode = 401;
              next (jsonBody.result.reason);
            }
            else if (jsonBody.result.status == 'REVOKED') {
              logger.info('API key has been revoked.', 'verify-api-key');
              res.statusCode = 401;
              next("API Key has been revoked", data);
            }
            else {
              logger.info('API key has been verified.', 'verify-api-key');

              var quotaData = {
                data: {
                    orgName: jsonBody.result.org,
                    appId: "edgemicro@@@" + jsonBody.result.appId,
                    quota: jsonBody.result.quota,
                    quotaTimeUnit: jsonBody.result.quotaTimeUnit,
                    quotaInterval: jsonBody.result.quotaInterval
                  }
                }
                req.quota = quotaData;
              next(null,data);
            }
          }
        });
      }
    }
  }
}
