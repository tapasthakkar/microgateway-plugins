'use strict';

// var debug = require('debug')('plugin:analytics');
var volos = require('volos-analytics-apigee');
module.exports.init = function(config, logger /*, stats */) {

    config.finalizeRecord = function finalizeRecord(req, res, record, cb) {
        if (res.proxy) {
            //detect healthcheck paths; if detected, add -health to the proxy name so that ax 
            //can distinguish between healthcheck calls and regular apis calls.
            var proxyPath = req.url.split('?')[0];            
            if (config.proxyPath) {
                if (config.proxyPath === proxyPath) {
                    record.apiproxy = res.proxy.name + "-health";
                    record.apiproxy_revision = res.proxy.revision;
                }
            } else if (config.relativePath) {
                var relativePath = "/" + proxyPath.split('/')[2];
                if (config.relativePath === relativePath) {
                    record.apiproxy = res.proxy.name + "-health";
                    record.apiproxy_revision = res.proxy.revision; 
                }
            } else {
                record.apiproxy = res.proxy.name;
                record.apiproxy_revision = res.proxy.revision;
            }
        }

        if (config.mask_request_uri) {
            record.request_uri = config.mask_request_uri;
        }

        if (config.mask_request_path) {
            record.request_path = config.mask_request_path;
        }


        var xffHeader = req.headers['x-forwarded-for'];
        if (xffHeader) {
            record.client_ip = xffHeader;
        }

        record.client_received_start_timestamp = req.headers['client_received_start_timestamp'];
        record.client_received_end_timestamp = req.headers['client_received_end_timestamp'];

        record.target_sent_start_timestamp = req.headers['target_sent_start_timestamp'];
        record.target_sent_end_timestamp = req.headers['target_sent_end_timestamp'] + 1; //tmp hack

        record.target_received_start_timestamp = req.headers['target_received_start_timestamp'];
        record.target_received_end_timestamp = req.headers['target_received_end_timestamp'];

        record['target_basepath']   = req.targetPath;
        record['target_host']       = req.targetHostname;

        record['target_url']    = ( req.targetSecure ? 'https' : 'http' ) + 
                                '://' + req.targetHostname + 
                                ( req.targetPort ? ':' + req.targetPort : "") + req.targetPath;

        record['target_response_code'] = req.headers['target_response_code'];
        record.api_product = req.api_product || record.api_product;
        record['gateway_flow_id'] = req['correlationId'];
        try {
            cb(null, record);
        } catch (e) {
            logger.eventLog({level:'error', req: req, res: res, err:e, component:'analytics' },"Error encountered processing Apigee analytics.  Allowing request processing to continue");
        }
    };

    var analytics = volos.create(config);
    var middleware = analytics.expressMiddleWare().apply();

    return {

        testprobe: function() {
            return analytics
        },

        onrequest: function(req, res, next) {
            var timestamp = Date.now();
            req.headers['client_received_start_timestamp'] = req.reqStartTimestamp || timestamp;
            //do not send analytics for MG operating in local mode
            if (!process.env.EDGEMICRO_LOCAL) {
                middleware(req, res, next);
            } else {
                next();
            }
        },

        onend_request: function(req, res, next) {
            var timestamp = Date.now();
            req.headers['client_received_end_timestamp'] = timestamp;
            next();
        },

        onresponse: function(req, res, next) {
            var timestamp = Date.now();
            req.headers['target_received_start_timestamp'] = timestamp;
            next();
        },

        onend_response: function(req, res, next) {
            var timestamp = Date.now();
            req.headers['target_received_end_timestamp'] = timestamp;
            next();
        }

    };

}