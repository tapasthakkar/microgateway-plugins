'use strict'
var debug = require('debug')('plugin:corsfix');

module.exports.init = function(config, logger, stats) {
  return {
  	onrequest: function(req, res, next) {
	  if(req.method == 'OPTIONS') {
	    debug('settings cors headers);
	    res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
	    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, PATCH, OPTIONS');
       	    res.setHeader('Access-Control-Allow-Max-Age', '3628800');
	    //some browsers do not allow Authorization in the allow-headers response.
	    res.setHeader('Access-Control-Allow-Headers', 'Origin, x-requested-with, Accept, Content-Type, Accept, Accept-Encoding, Accept-Language, Host, Pragma, Referrer, User-Agent, Cache-Control, x-api-key, Authorization, X-NLSN-Authorization');
	    res.end();
	  } else {
	    debug('skipping cors plugin');
	    next();
	  }
    }
  }
}
