'use strict';
/**
 *
 */

var debug = require('debug')('plugin:bauth');
const authHeaderRegex = /Basic (.+)/;

module.exports.init = function (config, logger, stats) {

	var keepAuthHeader = config['keep-authorization-header'] || false;

	return {
		onrequest: function(req, res, next) {
			debug('plugin onrequest');
			try {
				if (!req.headers['authorization']) {
				  debug('missing_authorization');
				  return sendError(req, res, next, logger, stats, 'missing_authorization', 'Missing Authorization header');
				} else {
					var b64string = authHeaderRegex.exec(req.headers['authorization']);
					if (!b64string || b64string.length < 2) {
						debug('Invalid Authorization Header');
						return sendError(req, res, next, logger, stats, 'invalid_request', 'Invalid Authorization header');						
					}
					var buf;
					if (typeof Buffer.from === "function") {
					    // Node 5.10+
					    buf = Buffer.from(b64string[1], 'base64').toString("ascii");
					} else {
					    // older Node versions
					    buf = new Buffer(b64string[1], 'base64').toString("ascii");
					}
					if (buf) {
						var parts = buf.split(":");
						req.username = parts[0];
						req.password = parts[1];
						if (!keepAuthHeader) {
						  delete (req.headers['authorization']); // don't pass this header to target
						}
					} else {
						debug('Invalid Authorization Header');
						return sendError(req, res, next, logger, stats, 'invalid_request', 'Invalid Authorization header');												
					}					
				}
			} catch (err) {
				debug("ERROR - " + err);
			}
			next();
		}
	};
}

function sendError(req, res, next, logger, stats, code, message) {

  switch (code) {
    case 'invalid_request':
      res.statusCode = 400;
      break;
    case 'access_denied':
      res.statusCode = 403;
      break;
    case 'missing_authorization':
    case 'invalid_authorization':
      res.statusCode = 401;
      break;
    case 'gateway_timeout':
      res.statusCode = 504;
      break;
    default:
      res.statusCode = 500;
  }

  var response = {
    error: code,
    error_description: message
  };

  debug('auth failure', res.statusCode, code, message ? message : '', req.headers, req.method, req.url);
  logger.error({ req: req, res: res }, 'oauth');

  if (!res.finished) res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(response));
  stats.incrementStatusCount(res.statusCode);
  next(code, message);
  return code;
}