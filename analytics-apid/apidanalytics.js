const util = require('util');
const zlib = require('zlib');
const request = require('request');
const async = require('async');
const Analytics = require('volos-analytics-common');


var create = function(options, logger) {
   var spi = new ApidAnalytics(options, logger);
   return new Analytics(spi, options);
}
module.exports.create = create;

var ApidAnalytics = function(options, logger) {
  this.apidEndpoint = options.apidEndpoint;
  this.formattedApidUriTemplate = this.apidEndpoint +'/analytics/%s';
  this.compress = options.compress;
  this.logger = logger;
}

ApidAnalytics.prototype.flush = function(recordsQueue, flushCallback) {
    var recordsPerScope = {}
    var self = this;
    recordsQueue.forEach((r) => {
        if(r.scopeId) {
            if(recordsPerScope[r.scopeId]) {
                recordsPerScope[r.scopeId].push(r);
            } else {
                recordsPerScope[r.scopeId] = [r];
            }
            delete r.scopeId;
        }
    });


    var parallelArgs = {};
    Object.keys(recordsPerScope).forEach((k) => {
        var data = recordsPerScope[k];
        parallelArgs[k] = (callback) => {
          if(self.compress) {
            self.sendCompressed(k, data, (err, scopeId, data) => {
              if(err) {
                return callback(err);
              } else {
                callback(null, data);
              }
            })
          } else {
            self.send(k, data, (err, scopeId, data) => {
              if(err) {
                return callback(err);
              } else {
                callback(null, data);
              }
            })
          }
        }
    });

    async.parallel(parallelArgs, (err, results)=>{
      
      if(err) {
        return flushCallback(err)
      }

      var retryRecords = [];
      Object.keys(results).forEach((scope)=> {
        const data = results[scope];
        if(data.length) {
          data.forEach((d) => {
            d.scopeId = scope;
          });

          retryRecords = retryRecords.concat(data);
        }
      });

      return flushCallback(null, retryRecords)
    });
}

ApidAnalytics.prototype.send = function(scopeId, data, cb) {
    const formattedUri = util.format(this.formattedApidUriTemplate, scopeId);
    var self = this;
    const opts = {
        uri: formattedUri,
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        json: {
          records: data      
        }
    };


    request(opts, (err, res, body) => {
        if(err) {
          self.logger.error(err, 'analytics');
          return cb(err);
        }

        if(res.statusCode == 500) {
          self.logger.error(JSON.parse(body), 'Error flushing analytics records. Retrying...', 'analytics');  
          return cb(null, scopeId, data)
        } else if(res.statusCode == 400) {
          self.logger.error(JSON.parse(body), 'Error flushing analytics records. Not retrying.', 'analytics');  
          return cb(null, scopeId, []);
        } else {
          self.logger.info('Analytics records flushed successfully', 'analytics');
          return cb(null, scopeId, [])
        }
    });
};


ApidAnalytics.prototype.sendCompressed = function(scopeId, data, cb) {
  var recordsObject = {records: data}
  const formattedUri = util.format(this.formattedApidUriTemplate, scopeId);
  var self = this;

  const zipper = zlib.createGzip();

  const opts = {
    uri: formattedUri,
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Content-Encoding': 'gzip'
    }
  };

  var req = request(opts, (err, res, body) => {
      if(err) {
        self.logger.error(err, 'analytics');
        return cb(err);
      }

      if(res.statusCode == 500) {
        self.logger.error(JSON.parse(body), 'Error flushing analytics records. Retrying...', 'analytics');  
        return cb(null, scopeId, data)
      } else if(res.statusCode == 400) {
        self.logger.error(JSON.parse(body), 'Error flushing analytics records. Not retrying.', 'analytics');  
        return cb(null, scopeId, []);
      } else {
        self.logger.info('Analytics records flushed successfully', 'analytics');
        return cb(null, scopeId, [])
      }
      
  });

  zipper.pipe(req);
  zipper.end(JSON.stringify(recordsObject));
};

