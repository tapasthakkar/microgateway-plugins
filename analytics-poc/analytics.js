/****************************************************************************
 The MIT License (MIT)

 Copyright (c) 2014 Apigee Corporation

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
'use strict';

var onFinished = require('on-finished');

var MICROGATEWAY = 'microgateway';
var REMOTE_PROXY_PATH = '/v2/analytics/accept';

module.exports.makeRecord = function(req, resp, targetReq, targetRes, cb) {

  var now = Date.now();
  var record = {
    client_received_start_timestamp:  now,
    client_received_end_timestamp:    now + 1, // hack to avoid error in server calculations    
    recordType:                       'APIAnalytics',
    apiproxy:                         'foo-proxy',
    request_uri:                      (req.protocol || 'http') + '://' + req.headers.host + req.url,
    request_path:                     req.url.split('?')[0],
    request_verb:                     req.method,
    client_ip:                        req.connection.remoteAddress,
    useragent:                        req.headers['user-agent'],
    apiproxy_revision:                'foo'
  };

  var self = this;
  onFinished(resp, function() {
    var now = Date.now();
    record.response_status_code      = resp.statusCode;
    record.client_sent_start_timestamp = now;
    record.client_sent_end_timestamp = now+1;

    // oauth
    var token = req.token;
    if (token) {
      record.developer_email = token.developer_email;
      record.developer_app   = token.application_name;
      record.access_token    = token.access_token;
      record.client_id       = token.client_id;

      var prodList = token.api_product_list;
      if (prodList && prodList.length) {
        if (typeof prodList === 'string') { prodList = prodList.slice(1, -1).split(','); }
        // hack: analytics server only accepts a single product
        record.api_product = prodList[0];
      }
    }
 
    record.target_received_start_timestamp = targetReq.stream_start;
    record.target_received_end_timestamp = targetReq.stream_end;
    record.target_sent_start_timestamp = targetRes.stream_start;
    record.target_sent_end_timestamp = targetRes.stream_end;
    record.target_response_code = targetRes.statuscode;
    record.target = ''

  

    cb(null, record);
  });
};
