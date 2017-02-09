const util = require('util')
const request = require('request');
const async = require('async');
const Analytics = require('volos-analytics-common');


var create = function(options) {
   var spi = new ApidAnalytics(options);
   return new Analytics(spi, options);
}
module.exports.create = create;

var ApidAnalytics = function(options) {
  this.apidEndpoint = options.apidEndpoint;
  this.formattedApidUriTemplate = this.apidEndpoint +'/analytics/%s';
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
            self.send(k, data, (err, scopeId, data) => {
              if(err) {
                return callback(err);
              } else {
                callback(null, data);
              }
            })
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

    console.log(JSON.stringify(data));
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
            return cb(err);
        }

        console.log(res.statusCode);
        console.log(res.body);
        if(res.statusCode == 400) {
            return cb(null, scopeId, data)
        } else {
            return cb(null, scopeId, [])
        }
    });
};
