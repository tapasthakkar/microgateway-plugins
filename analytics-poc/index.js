'use strict';

var debug = require('debug')('plugin:new-analytics');
var volos = require('./analytics');
module.exports.init = function(config, logger, stats) {
  return {

    testprobe: function() { return analytics },
    onrequest: function(req, res, targetReq, targetRes, data, next) {
      console.log('Incoming request');
      if(!req._clientReceived) {
        req._clientReceived = Date.now();
      }
      next();
    },
    ondata_request:function(req, res, targetReq, targetRes, data, next) {
      console.log('data events');
      if(!req._streamStarted) {
        req._streamStarted = Date.now();
      } 
      next(null, data);
    },
    onend_request:function(req, res, targetReq, targetRes, data, next) {
      if(!req._streamStarted) {
        req._streamStarted = Date.now();
      } 

      if(!req._streamEnded) {
        req._streamEnded = Date.now();
      }

      if(!req._clientReceivedEnd) {
        req._clientReceivedEnd = Date.now();
      }
      next(null, data);
    },
    ondata_response:function(req, res, targetReq, targetRes, data, next) {

      if(!targetReq._streamStarted) {
        targetReq._streamStarted = Date.now();
      }
      next(null, data);
    },
    onend_response:function(req, res, targetReq, targetRes, data, next) {

      if(!targetReq._streamStarted) {
        targetReq._streamStarted = Date.now();
      }

      if(!targetReq._streamEnded) {
        targetReq._streamEnded = Date.now();
      }

      res.on('finish', () => {
        if(!res._writeToClientEnd) {
          res._writeToClientEnd = Date.now();
        }

        var recordAdditions = {
          target_received_end_timestamp: req._streamEnded,
          target_received_start_timestamp: req._streamStarted,
          target_response_code: targetRes.statusCode,
          target_sent_end_timestamp: targetReq._streamStarted,
          target_sent_start_timestamp: targetReq._streamEnded,
          recordType: 'APIAnalytics',
          apiproxy: 'foo',
          request_uri: (req.protocol || 'http') + '://' + req.headers.host + req.url,
          request_path: req.url.split('?')[0],
          request_verb: req.method,
          client_ip: req.connection.remoteAddress,
          useragent: req.headers['user-agent'],
          apiproxy_revision: '1',
          response_status_code: res.statusCode,
          client_send_start_timestamp: res._writeToClientStart,
          client_send_end_timestamp: res._writeToClientEnd,
          client_received_start_timestamp:req._clientReceived,
          client_received_end_timestamp:req._clientReceivedEnd
        };

        console.log(recordAdditions);
      });
      
      next(null, data);
    },
    onresponse: function(req, res, targetReq, targetRes, data,  next) {
      var writeToRes = res.write;

      res.write = (chunk, encoding, callback) => {
        if(!res._writeToClientStart) {
          res._writeToClientStart = Date.now();
        }
        writeToRes.call(res, chunk, encoding, callback);
      }

      
      next();
    }

  };

}
