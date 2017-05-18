'use strict';
var request = require('request');
var util = require('util');
const url = require('url');
const qs = require('querystring');

module.exports.init = function(config, logger, stats) {

    var parsedUrl = url.parse((config.apidEndpoint || 'http://localhost:9000'));
    parsedUrl.pathname = '/quota';
    var apidUrl = url.format(parsedUrl);

    return {
        onrequest: function(req, res, data, next) {
            var reqQuotaData = req.quota;

            if (!reqQuotaData.data.quota) {
                logger.error("no quota definition found for the request.")
                res.statusCode = 401;
                next ("no quota definition for request.");
            }
            else {

                var options = {
                    url: apidUrl,
                    body:JSON.stringify( {
                        'edgeOrgID': reqQuotaData.data.orgName,
                        'id': reqQuotaData.data.appId,
                        'interval': reqQuotaData.data.quotaInterval,
                        'timeUnit': reqQuotaData.data.quotaTimeUnit,
                        'maxCount': parseInt(reqQuotaData.data.quota),
                        'weight': 1,
                        'startTime': Date.now(),
                        'distributed': config.distributed,
                        'synchronous': config.synchronous,
                        'type': config.type,
                        'preciseAtSecondsLevel': config.preciseAtSecondsLevel,
                        'syncTimeInSec': config.asynchronousConfiguration.syncIntervalInSeconds
                    })
                }
                request.post(options, function (err, resp, body) {
                    if (err) {
                        if(err.code == 'ECONNREFUSED') {
                            err.message = util.format('Error connecting to apid at: %s to verify quota limit', apidUrl);
                        }
                        logger.error(err, 'quota-apid');
                        return next(err, data);
                    }
                    else if (resp.statusCode != 200){
                        var respBody =  JSON.parse(body)
                        logger.error(err, 'quota-apid');
                        return next('Error from quota service: ' + respBody.errorDescription, data);

                    }
                    else {
                        var jsonBody;
                        try {
                            jsonBody = JSON.parse(body);
                        } catch (e) {
                            logger.error(e, 'quota-apid');
                            return next(e, data);
                        }

                        if (jsonBody.exceeded) {
                            logger.error(jsonBody, jsonBody.exceeded, 'quota-apid');
                            res.statusCode = 401;
                            next ("quota limit exceeded");
                        }
                        else {
                            logger.info('quota verified.', 'quota-apid');
                            next(null, data);
                        }
                    }
                });
            }
        }
    }
}

