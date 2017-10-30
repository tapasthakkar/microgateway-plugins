'use strict'
var debug = require('debug')('plugin:cors');

module.exports.init = function(config, logger, stats) {

  var methods = config['cors-methods'] || 'GET, PUT, POST, DELETE, PATCH, OPTIONS';
  var maxAge = config['cors-max-age'] || '3628800';
  var allowHeaders = config['cors-headers'] || 'Origin, x-requested-wuth, Accept, Content-Type, Accept-Encoding, Accept-Language, Host, Pragma, Referrer, User-Agent, Cache-Control, Authorization, x-api-key';

  return {
  	onrequest: function(req, res, next) {
	  if(req.method == 'OPTIONS') {
	    debug('settings cors headers');
	    res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
	    res.setHeader('Access-Control-Allow-Methods', methods);
       	    res.setHeader('Access-Control-Allow-Max-Age', maxAge);
	    res.setHeader('Access-Control-Allow-Headers', allowHeaders);
	    res.end();
	  } else {
	    debug('skipping cors plugin');
	    next();
	  }
    }
  }
}
