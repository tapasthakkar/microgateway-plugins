'use strict';
/**
 * This plugin whitelists or blacklists source ip addresses
 */

var debug = require('debug')('plugin:accesscontrol');
var util = require("util");
const dns = require('dns');

module.exports.init = function (config , logger/*, stats */) {

	if (config === null) debug('WARNING: insufficient information to run accesscontrol');
	else if (config.allow === null && config.deny === null) debug('WARNING: insufficient information to run accesscontrol');
	const confOrderFirst = Object.keys(config).filter( key => key === 'allow' || key === 'deny')[0]; 
	const getAccessFlags = () => {
		return {
			allow : false,
			deny : false,
		}
	}
	
	/**
	* This method reads allow and/or deby lists from the config.yaml
	* applies the appropriate rule on the incoming message
	*/
	function checkAccessControlInfo(sourceIP,flags) {
		debug(sourceIP);		
		if (config.allow !==  null) {
			debug ('allow list: ' + util.inspect(config.allow, 2, true));
			if (scanIP(config.allow, sourceIP)) {
				flags.allow = true;
			}			
		}
		if (config.deny !==  null) { //&& flags.allow!=true) {
			debug ('deny list: ' + util.inspect(config.deny, 2, true));
			if (scanIP(config.deny, sourceIP)) {
				debug ('deny incoming message');
				flags.deny = true;
			}			
		}
		
	}

	/**
	* check if the parameter is valid IPv4 address
	*/ 
	function checkIsIPV4(entry) {
	  var blocks = entry.split(".");
	  if(blocks.length === 4) {
	    return blocks.every(function(block) {
	      	return (block === '*' || (parseInt(block,10) >=0 && parseInt(block,10) <= 255));
	    });
	  }
	  return false;
	}

	/** 
	* for each list in the allow and deny, make sure they are proper
	* IPv4 addresses
	*/
	/*   never used
	function validateIPList(list) {
		list.forEach(function(entry){
			if (!checkIsIPV4(entry)) return false;
		});
		return true;
	}
	*/

	/** 
	* Check the final value of the flags, if both are true get action value from config and take action accordingly, else take action based on the flags
	*/
	function processActionFlow(res, req, logger,next){
		var flags = req.accessFlags;
		if(flags.allow === true && flags.deny === true){
			if(confOrderFirst === "deny"){
				sendError(res, req, logger, null, next);
			}
		}
		else if(flags.allow === false && flags.deny === false){
			if(Object.keys(config).indexOf("noRuleMatchAction") !== -1){
				if(config.noRuleMatchAction!== null ){
					if(config.noRuleMatchAction === "deny" || config.noRuleMatchAction !== "allow"){
						sendError(res, req, logger,  null,next);	
					}
				}else{
					sendError(res, req, logger,  null,next);
				}
			}
		}
		else if (flags.allow === false || flags.deny === true){
			sendError(res, req, logger,  null,next);
		}
		
		if(flags.deny !== true || (flags.allow === true && flags.deny === true && (confOrderFirst !== "deny"))){
			next();
		}
	}

	function scanIP(list, sourceIP) {
		
		var sourceOctets = sourceIP.split('.');	
		//no wildcard
		for (var i=0; i < list.length; i++) {
			//no wildcard
			if (list[i].indexOf('*') === -1 && list[i] === sourceIP) {
				return true;
			} else if (list[i].indexOf('*') !==  -1) { //contains wildcard
				var listOctets = list[i].split('.');
				if (octetCompare(listOctets, sourceOctets)) return true;			
			}
		}
		//did not match any in the list
		return false;
	}

	/**
	* the allow or deny list contains a wildcard. perform octet level
	* comparision
	*/
	function octetCompare (listOctets, sourceOctets) {
		var compare = false;
		for (var i=0; i < listOctets.length; i++) {
			//debug('list ' + listOctets[i] + ' sourceOctets ' + sourceOctets[i]);
			if (listOctets[i] !==  '*' && parseInt(listOctets[i]) === parseInt(sourceOctets[i])) {
				compare = true;
			} else if (listOctets[i] !==  '*' && parseInt(listOctets[i]) !==  parseInt(sourceOctets[i])) {
				return false;
			} 
		}
		return compare;
	}

	/** 
	* send error message to the user
	*/
	function sendError(res,req,logger,err=null,next) {
		var errorInfo = {
			"code": "403",
			"message": "Forbidden"
		};
		res.statusCode = 403;
		req.accessFlags.deny = true;
		
		const errout = Error('access control failure',err);
		logger.eventLog({level:'error', req: req, res: res, err:errout, component:'accesscontrol' }, 'accesscontrol');
		res.writeHead(403, { 'Content-Type': 'application/json' });
		res.write(JSON.stringify(errorInfo));
		res.end();
		next(errorInfo.code,errorInfo.message);
	}

	return {

		onrequest: function(req, res, next) {
			
			debug('plugin onrequest');
			var host = req.headers.host;
			debug ("source ip " + host);
			req.accessFlags = getAccessFlags();
			var sourceIP = host.split(":");

			if (checkIsIPV4(sourceIP[0])) {
				checkAccessControlInfo(sourceIP[0],req.accessFlags);
				processActionFlow(res,req,logger,next);
			} else {
				dns.lookup(sourceIP[0], (err, address, family) => {
				  	debug('address: %j family: IPv%s', address, family);
					if (err) {
						debug(err);
						sendError(res,req,logger,err,next);
					}
					checkAccessControlInfo(address,req.accessFlags);
					processActionFlow(res,req,logger,next);
				  
				  				  
				});
			}
		}		
	};
}