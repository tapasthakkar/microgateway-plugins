'use strict';
const debug = require('debug')('plugin:metrics');
const onFinished = require('on-finished');

module.exports.init = function(config, logger, stats ) {
    
    const finalizeRecord  = function finalizeRecord(req, res){
        onFinished(res, function(err, res) {
            if(req.headers['metrics_record']){
                let timestamp = Date.now();
                const metricsRecord = req.headers['metrics_record'];
                req.headers['client_sent_end_timestamp'] = timestamp;
                metricsRecord['postflow_time'] = req.headers['client_sent_end_timestamp'] - req.headers['target_received_end_timestamp']; 
                metricsRecord['target_time'] = req.headers['target_received_end_timestamp'] - req.headers['target_sent_start_timestamp']; 
                metricsRecord['proxy_time'] = req.headers['client_sent_end_timestamp'] - req.headers['client_received_start_timestamp']; 
                debug('Metrics finalize record', req.headers['metrics_record']);
            }
        });
    }

    return {
        onrequest: function(req, res, next) {
            let record = {};
            record['proxy_name'] = res.proxy.name;
            record['proxy_url'] = res.proxy.url;
            record['proxy_basepath'] = res.proxy.base_path;
            record['target_host'] = req.targetHostname;
            record['target_url'] = ( req.targetSecure ? 'https' : 'http' ) + 
                                    '://' + req.targetHostname + 
                                    ( req.targetPort ? ':' + req.targetPort : "") + req.targetPath;
            record['proxy_status_code'] = res.statusCode;
            req.headers['metrics_record'] = record;
            logger.eventLog({level:'info',res:res,req:req,component:'metrics'});
            next();
        },

        onresponse: function(req, res, next) {
            req.headers['metrics_record']['target_status_code'] = res.statusCode;
            req.headers['metrics_record']['target_received_timestamp'] = req.headers['target_received_start_timestamp'];
            req.headers['metrics_record']['target_sent_timestamp'] = req.headers['target_sent_start_timestamp'];
            req.headers['metrics_record']['preflow_time'] = req.headers['target_sent_start_timestamp'] - req.headers['client_received_start_timestamp'];
            next();
        },

        onend_response: function(req, res, next) {
            finalizeRecord(req, res);
            next();
        }
    };

}