'use strict';
/**
 * This plugin accumulates data chunks from the client into an array
 * property on the request or response, concats them on end. Then  
 * transforms the request or response based on 'accept' or 'content-type' 
 * headers. 
 * 
 * If the HTTP verb is GET and the Accept type does not match the 
 * response type, the plugin will attempt to transform it (from 
 * xml to json or vice versa).
 *
 * If the HTTP verb is NOT GET then the content-type is used. If the
 * content-type is set to 'json', then an attempt is made to transform to
 * 'xml' and vice-versa.
 *
 * This plugin can be disabled by sending the 'x-apigee-json2xml' http
 * header.
 *
 * Users should be aware that buffering large requests or responses in
 * memory can cause Apigee Edge Microgateway to run out of memory under
 * high load or with a large number of concurrent requests. So this plugin
 * should only be used when it is known that request/response bodies are small.
 */

var debug = require('debug')('plugin:json2xml');
//library to convert json to xml
var js2xmlparser = require("js2xmlparser");
//library to convert xml to json
var parseString = require("xml2js").parseString;
//var util = require("util");

module.exports.init = function (/*config, logger, stats*/) {

	//initialize the variables to false

	//variables to control whether request and/or response transformation should take place
	const getControlFlags = () => {
		return {
			requestXML : false,
			requestJSON : false,
			responseJSON : false,
			responseXML : false,
			responseIsXML : false,
			responseIsJSON : false,
			disable : false
		}
	}
	
	//method to accumulate responses
	function accumulateResponse(res, data) {
		debug('plugin accumulateResponse');
		if (!res._chunks) res._chunks = [];
		res._chunks.push(data);
	}

	//method to accumulate requests
	function accumulateRequest(req, data) {
		debug('plugin accumulateRequest');
		if (req.jsonXmlFlags.disable) return;
		if (!req._chunks) req._chunks = [];
		req._chunks.push(data);
	}
	
	return {

		onrequest: function(req, res, next) {
			debug('plugin onrequest');
			var method  = req.method.toLowerCase();
			var acceptType = req.headers['accept'];
			var contentType = req.headers['content-type'];

			req.jsonXmlFlags = getControlFlags();
			
			if (req.headers['x-apigee-json2xml-disable']) req.jsonXmlFlags.disable = true;

			debug("accept header: " + acceptType);
			debug("content-type header: " + contentType);

			//if plugin is disabled don't process headers.
			if (!req.jsonXmlFlags.disable) {
				if (method === "get" && acceptType.indexOf("application/xml") > -1) {
					req.jsonXmlFlags.responseXML = true;
				} else if (method === "get" && acceptType.indexOf("application/json") > -1) {
					req.jsonXmlFlags.responseJSON = true;
				} else if (method !== "get" && contentType.indexOf("application/json") > -1) {
					req.jsonXmlFlags.requestJSON = true;
					req.jsonXmlFlags.responseJSON = true;
					//set request content type.
					req.headers['content-type'] = 'application/xml';
				} else if (method !== "get" && contentType.indexOf("application/xml") > -1) {
					req.jsonXmlFlags.requestXML = true;
					req.jsonXmlFlags.responseXML = true;
					//set request content type.
					req.headers['content-type'] = 'application/json';
				}
			}
			
			debug("requestJSON flag is " + req.jsonXmlFlags.requestJSON);
			debug("responseJSON flag is " + req.jsonXmlFlags.responseJSON);

			debug("requestXML flag is " + req.jsonXmlFlags.requestXML);
			debug("responseXML flag is " + req.jsonXmlFlags.responseXML);

			debug("plugin disabled: " + req.jsonXmlFlags.disable);

			next();
		},
		// indicates start of target response
		// response headers and status code should be available at this time
		onresponse: function(req, res, next) {
			debug('plugin onresponse');
			//nothing to do on response
			next();
		},
		//
		ondata_request: function(req, res, data, next) {
			debug('plugin ondata_request');
			if (data && data.length > 0 && req.jsonXmlFlags.disable === false) accumulateRequest(req, data);
			next(null, null);
		},
		//
		//
		ondata_response: function(req, res, data, next) {
			debug('plugin ondata_response');
			if (data && data.length > 0 && req.jsonXmlFlags.disable === false) accumulateResponse(res, data);
			next(null, null);
		},
		//
		onend_request: function(req, res, data, next) {
			debug('plugin onend_request');
			if (data && data.length > 0 && req.jsonXmlFlags.disable === false) accumulateRequest(res, data);
			var content = null;
			if(req._chunks && req._chunks.length) {
				content = Buffer.concat(req._chunks);
			}
			delete req._chunks;

			//if pugin is disabled, don't do anything
			if (!req.jsonXmlFlags.disable) {
				if (req.jsonXmlFlags.requestJSON) {
					//the request needs to be transformed to xml before sending to 
					//the target server.
					next(null, js2xmlparser.parse("Root",JSON.parse(content)));
				} else if (req.jsonXmlFlags.requestXML) {
					parseString(content.toString(), function(err, js){
						if (err) next (err);
						next(null, JSON.stringify(js));
					});
				} else { //do nothing
					next(null, content);
				}
			} else {
				next(null, content);
			}
		},
		//
		onend_response: function(req, res, data, next) {
			debug('plugin onend_request');
			if (data && data.length > 0 && req.jsonXmlFlags.disable === false) accumulateResponse(res, data);

			var contentType = res.getHeader('content-type');
			if (contentType && contentType.indexOf("application/xml") > -1) {
				req.jsonXmlFlags.responseIsXML = true;
			} else if (contentType && contentType.indexOf("application/json") > -1) {
				req.jsonXmlFlags.responseIsJSON = true;
			}

			debug("responseIsJSON flag is " + req.jsonXmlFlags.responseIsJSON);
			debug("responseIsXML flag is" + req.jsonXmlFlags.responseIsXML);


			var content = null;
			if(res._chunks && res._chunks.length) {
				content = Buffer.concat(res._chunks);
			}
			delete res._chunks;

			//if disabled don't do anything.
			if (!req.jsonXmlFlags.disable) {
				if (req.jsonXmlFlags.responseXML && req.jsonXmlFlags.responseIsJSON) {
					res.setHeader('Content-Type', 'application/xml');
					next(null, js2xmlparser.parse("Root",JSON.parse(content)));
				} else if (req.jsonXmlFlags.responseJSON && req.jsonXmlFlags.responseIsXML) {
					res.setHeader('Content-Type', 'application/json');
					parseString(content.toString(), function(err, js){
						if (err) next (err);
						next(null, JSON.stringify(js));
					});
				} else {
					next(null, content);
				}
			} else {
				next(null, content);
			}
		}		
	};
}
