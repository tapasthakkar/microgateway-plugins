'use strict';
/**
 *
 */

var debug = require('debug')('plugin:monitor');
var cm = require('volos-cache-memory');
const lynx = require('lynx');
const os = require('os');

module.exports.init = function(config, logger, stats) {

    var cachename = 'monitor' + Math.floor(Math.random() * 100) + 1; //to ensure there is a unique cache per worker
    var cache = cm.create(cachename, {
        ttl: 10000
    });//compute transactions per second
    cache.setEncoding('utf8');

    var host = config.host || 'localhost';
    var port = config.port || 8125;
    var key = config.Requestkey || 'mg';

    key = key + "." + os.hostname();
    debug('grafana: ' + host + ':' + port);
    
    const numcpus = os.cpus().length;

    const client = new lynx(host, port);

    client.gauge(key + '_cpu', 0);
    client.gauge(key + '_memory_rss', 0);
    client.gauge(key + '_memory_heapUsed', 0);

    var sc2xx = 'statusCode2xx';
    var sc3xx = 'statusCode3xx';
    var sc4xx = 'statusCode4xx';
    var sc5xx = 'statusCode5xx';
    var scNA =  'statusCodeNA';

    clearCache();

    function setGauge(statusCode) {
      var tmp = 0;
      if (statusCode >= 200 && statusCode < 300) { 
        cache.get(sc2xx, function(err, value) {
          if (value) {
            tmp = parseInt(value);
            tmp ++;
            cache.set(sc2xx, tmp.toString());
            client.gauge(key + '_'+sc2xx, tmp);
          } else {
            cache.set(sc2xx, '1');
            client.gauge(key + '_'+sc2xx, 1);
          }
          //debug('statusCode2xx ' + tmp);
        });
      } else if (statusCode >=300 && statusCode < 400) {
        cache.get(sc3xx, function(err, value) {
          if (value) {
            tmp = parseInt(value);
            tmp ++;
            cache.set(sc3xx, tmp.toString());
            client.gauge(key + '_'+sc3xx, tmp);
          } else {
            cache.set(sc3xx, 1);
            client.gauge(key + '_'+sc3xx, 1);
          }
          //debug('statusCode3xx ' + tmp);
        });
      } else if (statusCode >=400 && statusCode < 500) {
        cache.get(sc4xx, function(err, value) {
          if (value) {
            tmp = parseInt(value);
            tmp ++;
            cache.set(sc4xx, tmp.toString());
            client.gauge(key + '_'+sc4xx, tmp);
          } else {
            cache.set(sc4xx, 1);
            client.gauge(key + '_'+sc4xx, 1);
          }
          //debug('statusCode4xx ' + tmp);
        });
      } else if (statusCode >=500 && statusCode < 600) {
        cache.get(sc5xx, function(err, value) {
          if (value) {
            tmp = parseInt(value);
            tmp ++;
            cache.set(sc5xx, tmp.toString());
            client.gauge(key + '_'+sc5xx, tmp);
          } else {
            cache.set(sc5xx, 1);
            client.gauge(key + '_'+sc5xx, 1);
          }
          //debug('statusCode5xx ' + value);
        });
      } else {
        cache.get(scNA, function(err, value) {
          if (value) {
            cache.set(scNA, value ++);
            client.gauge(key + '_'+scNA, value);
          } else {
            cache.set(scNA, 1);
            client.gauge(key + '_'+scNA, 1);
          }
          //debug('statusCodeNA ' + tmp);
        });
      }
    }
    
    function clearCache() {
      cache.set(sc2xx,'0');
      cache.set(sc3xx,'0');
      cache.set(sc4xx,'0');
      cache.set(sc5xx,'0');
      cache.set(scNA,'0');    
      setTimeout(clearCache, 10000);
    }

    function sendEvent(statusCode) {
       setGauge(statusCode);
       //CPU and Memory
       client.gauge(key + '_cpu', process.cpuUsage().user);
       client.gauge(key + '_memory_rss', process.memoryUsage().rss);
       client.gauge(key + '_memory_heapUsed', process.memoryUsage().heapUsed);
    }

    return {
        onrequest: function(req, res, next) {
            debug('plugin onrequest');
            next();
        },
        onerror_request: function(req, res, data, next) {
            debug('plugin onerror');
            // Status Code
            var statusCode = res.statusCode || -1;
            sendEvent(statusCode);
            next();
        },
        onend_request: function(req, res, data, next) {
            debug('plugin onend_request');
            next();
        },
        onend_response: function(req, res, data, next) {
            debug('plugin onend_response');
            // Status Code
            var statusCode = res.statusCode || -1;
            sendEvent(statusCode);
            next();
        }
    };
}
