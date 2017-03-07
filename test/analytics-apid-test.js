const assert = require('assert');
const plugin = require('../analytics-apid');
const http = require('http');
const zlib = require('zlib');

const mockLogger = {
  error: function() {
    return;
  },
  info: function() {
    return;
  }
}

const config = {
  apidEndpoint: 'http://localhost:9191',
  compress: false,
  flushInterval: 250
}

const stats = {};

const startAnalyticsServer = (handler, listenHandler) => {
  return http.createServer(handler).listen(9191, listenHandler); 
}


describe('analytics plugin', () => {
  var testPlugin;
  var analyticsServer;

  beforeEach(() => {
    testPlugin = plugin.init(config, mockLogger, stats);
  });

  afterEach(() => {
    testPlugin = null;

    if(analyticsServer) {
      analyticsServer.close();
    }
  });

  it('exposes full plugin lifecycle handlers', () => {
    assert.ok(testPlugin);
    assert.ok(testPlugin.onrequest);
    assert.ok(testPlugin.ondata_request);
    assert.ok(testPlugin.onend_request);
    assert.ok(testPlugin.ondata_response);
    assert.ok(testPlugin.onend_response);
    assert.ok(testPlugin.onresponse);   
  });  

  it('has onrequest take 6 arguments and will set client received', (done) => {
    assert.equal(testPlugin.onrequest.length, 6);
    var eventCalled;
    var req = {};

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.onrequest(req, res, {}, {}, {}, () => {
      assert.ok(req._clientReceived);
      assert.equal(eventCalled, 'finish');
      done(); 
    });
  });
  
  it('has ondata_request take 6 arguments and will set stream started', (done) => {
    assert.equal(testPlugin.ondata_request.length, 6);
    var eventCalled;
    var req = {};

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.ondata_request(req, res, {}, {}, 'foo', (err, data) => {
      assert.ok(req._streamStarted);
      assert.ok(!err);
      assert.equal(data, 'foo');
      done(); 
    });
  });

  it('has onend_request take 6 arguments and will set stream events', (done) => {
    assert.equal(testPlugin.onend_request.length, 6);
    var eventCalled;
    var req = {};

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.onend_request(req, res, {}, {}, 'foo', (err, data) => {
      assert.ok(req._streamStarted);
      assert.ok(req._streamEnded);
      assert.ok(req._clientReceivedEnd);
      assert.ok(!err);
      assert.equal(data, 'foo');
      done(); 
    });
  });

  it('has onend_request take 6 arguments and will not set stream started', (done) => {
    assert.equal(testPlugin.onend_request.length, 6);
    var eventCalled;
    var req = {
      _streamStarted: 'foobar'
    };

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.onend_request(req, res, {}, {}, 'foo', (err, data) => {
      assert.equal(req._streamStarted, 'foobar');
      assert.ok(req._streamEnded);
      assert.ok(req._clientReceivedEnd);
      assert.ok(!err);
      assert.equal(data, 'foo');
      done(); 
    });
  });

  it('has ondata_response take 6 arguments and will set stream events', (done) => {
    assert.equal(testPlugin.ondata_response.length, 6);
    var eventCalled;
    var targetReq = {};

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.ondata_response({}, res, targetReq, {}, 'foo', (err, data) => {
      assert.ok(targetReq._streamStarted);
      assert.ok(!err);
      assert.equal(data, 'foo');
      done(); 
    });
  });

  it('has onend_response take 6 arguments and will set stream events', (done) => {
    assert.equal(testPlugin.onend_response.length, 6);
    var eventCalled;
    var targetReq = {};

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.onend_response({}, res, targetReq, {}, 'foo', (err, data) => {
      assert.ok(targetReq._streamStarted);
      assert.ok(targetReq._streamEnded);
      assert.ok(!err);
      assert.equal(data, 'foo');
      done(); 
    });
  });

  it('has onend_response take 6 arguments and will set stream events, but not overwrite ones already set', (done) => {
    assert.equal(testPlugin.onend_response.length, 6);
    var eventCalled;
    var targetReq = {
      _streamStarted: 'foobar'
    };

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      }
    };

    testPlugin.onend_response({}, res, targetReq, {}, 'foo', (err, data) => {
      assert.equal(targetReq._streamStarted, 'foobar');
      assert.ok(targetReq._streamEnded);
      assert.ok(!err);
      assert.equal(data, 'foo');
      done(); 
    });
  });

  it('has onresponse take 6 arguments and will set stream events based on response write calls', (done) => {
    assert.equal(testPlugin.onresponse.length, 6);
    var eventCalled;

    var res = {
      on: (ev, hd) => {
        eventCalled = ev; 
      },
      write: () => {
        assert.ok(res._writeToClientStart);
        done();
      }
    };

    testPlugin.onresponse({}, res, {}, {}, 'foo', (err, data) => {
      res.write('foo', 'utf8'); 
    });
  });

  
  it('has onend_response take 6 arguments and will set stream events, but not overwrite ones already set', (done) => {
    assert.equal(testPlugin.onend_response.length, 6);
    
    var analyticsObject = testPlugin.testprobe();

    var eventCalled;
    var targetReq = {
      _streamStarted: 'foobar'
    };

    var finishFunc;
    var res = {
      on: (ev, hd) => {
        if(ev == 'finish') {
          finishFunc = hd;
        }
      },
      proxy: {
        scope: 'fooscope',
        target_name: 'footargetname',
        proxy_name: 'fooproxyname',
        revision: 'foorevision'
      },
      statusCode: 200,
      _writeToClientStart: 'fooclientstart',
      _writeToClientEnd: 'fooclientend',
    };

    var req = {
      connection: {
        remoteAddress: '127.0.0.1'
      },
      _clientReceived: 'fooclientreceived',
      _clientReceivedEnd: 'fooclientreceivedend',
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted',
      _gatewayFlowId: '1234',
      headers: {
        host: 'foo.host',
        'user-agent': 'curl!'
      },
      url: '/foo?bar=baz',
      method: 'GET'
    }

    var targetRes = {
      statusCode: 200
    }

    var targetReq = {
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted'
    }

    var testRecord = {
      apiproxy: 'fooproxyname',
      apiproxy_revision: 'foorevision',
      client_ip: '127.0.0.1',
      client_received_start_timestamp: 'fooclientreceived',
      client_received_end_timestamp: 'fooclientreceivedend',
      client_sent_start_timestamp: 'fooclientstart',
      client_sent_end_timestamp: 'fooclientend',
      gateway_flow_id: '1234',
      request_path: '/foo',
      request_uri: 'http://foo.host/foo?bar=baz' ,
      request_verb: 'GET',
      response_status_code: 200,
      useragent: 'curl!',
      target_received_end_timestamp: 'foostreamended',
      target_received_start_timestamp: 'foostreamstarted',
      target_response_code: 200,
      target_sent_end_timestamp: 'foostreamended',
      target_sent_start_timestamp: 'foostreamstarted',
      target: 'footargetname',
      recordType: 'APIAnalytics',
      scopeId: 'fooscope'
    };

    analyticsObject.push = (record) => {
      //iterate through each record key. 
      //Ensure they are equal
      Object.keys(testRecord).forEach((k) => {
        assert.equal(testRecord[k], record[k]);
      });
      done();
    };


    testPlugin.onend_response(req, res, targetReq, targetRes, 'foo', (err, data) => {
      finishFunc();
    });
  });

  it('will send an http request to analytics api server', (done) => {
    
    assert.equal(testPlugin.onend_response.length, 6);
    
    var analyticsObject = testPlugin.testprobe();
    var eventCalled;
    var targetReq = {
      _streamStarted: 'foobar'
    };

    var finishFunc;
    var res = {
      on: (ev, hd) => {
        if(ev == 'finish') {
          finishFunc = hd;
        }
      },
      proxy: {
        scope: 'fooscope',
        target_name: 'footargetname',
        proxy_name: 'fooproxyname',
        revision: 'foorevision'
      },
      statusCode: 200,
      _writeToClientStart: 'fooclientstart',
      _writeToClientEnd: 'fooclientend',
    };

    var req = {
      connection: {
        remoteAddress: '127.0.0.1'
      },
      _clientReceived: 'fooclientreceived',
      _clientReceivedEnd: 'fooclientreceivedend',
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted',
      _gatewayFlowId: '1234',
      headers: {
        host: 'foo.host',
        'user-agent': 'curl!'
      },
      url: '/foo?bar=baz',
      method: 'GET'
    }

    var targetRes = {
      statusCode: 200
    }

    var targetReq = {
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted'
    }

    var testRecord = {
      apiproxy: 'fooproxyname',
      apiproxy_revision: 'foorevision',
      client_ip: '127.0.0.1',
      client_received_start_timestamp: 'fooclientreceived',
      client_received_end_timestamp: 'fooclientreceivedend',
      client_sent_start_timestamp: 'fooclientstart',
      client_sent_end_timestamp: 'fooclientend',
      gateway_flow_id: '1234',
      request_path: '/foo',
      request_uri: 'http://foo.host/foo?bar=baz' ,
      request_verb: 'GET',
      response_status_code: 200,
      useragent: 'curl!',
      target_received_end_timestamp: 'foostreamended',
      target_received_start_timestamp: 'foostreamstarted',
      target_response_code: 200,
      target_sent_end_timestamp: 'foostreamended',
      target_sent_start_timestamp: 'foostreamstarted',
      target: 'footargetname',
      recordType: 'APIAnalytics',
      scopeId: 'fooscope'
    };

     const handler = (req, res) => {
      
      var buf = [];

      req.on('data', (d)=> {
        buf += d;
      });

      req.on('end', ()=>{
        //iterate through each record key. 
        //Ensure they are equal
        var records = JSON.parse(buf.toString());
        assert.ok(records.records);
        assert.equal(records.records.length, 1)
        var firstRecord = records.records[0];
        
        //assert that the records are sent to the proper path
        assert.equal(req.url, '/analytics/fooscope');

        Object.keys(firstRecord).forEach((k) => {
          assert.equal(firstRecord[k], testRecord[k]);
        });
        res.writeHead(200);
        res.end();
        done();
      })
      
    };

    analyticsServer = startAnalyticsServer(handler, () => {
      testPlugin.onend_response(req, res, targetReq, targetRes, 'foo', (err, data) => {
        finishFunc();
      });
    });
  });


  it('will send an http request payload that is gzipped to analytics api server', (done) => {
    
    assert.equal(testPlugin.onend_response.length, 6);
    const compressionConfig = {
      apidEndpoint: 'http://localhost:9191',
      compress: true,
      flushInterval: 10
    }
    testPlugin =  plugin.init(compressionConfig, mockLogger, stats);
    var analyticsObject = testPlugin.testprobe();
    analyticsObject.compress = true;

    var eventCalled;
    var targetReq = {
      _streamStarted: 'foobar'
    };

    var finishFunc;
    var res = {
      on: (ev, hd) => {
        if(ev == 'finish') {
          finishFunc = hd;
        }
      },
      proxy: {
        scope: 'fooscope',
        target_name: 'footargetname',
        proxy_name: 'fooproxyname',
        revision: 'foorevision'
      },
      statusCode: 200,
      _writeToClientStart: 'fooclientstart',
      _writeToClientEnd: 'fooclientend',
    };

    var req = {
      connection: {
        remoteAddress: '127.0.0.1'
      },
      _clientReceived: 'fooclientreceived',
      _clientReceivedEnd: 'fooclientreceivedend',
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted',
      _gatewayFlowId: '1234',
      headers: {
        host: 'foo.host',
        'user-agent': 'curl!'
      },
      url: '/foo?bar=baz',
      method: 'GET'
    }

    var targetRes = {
      statusCode: 200
    }

    var targetReq = {
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted'
    }

    var testRecord = {
      apiproxy: 'fooproxyname',
      apiproxy_revision: 'foorevision',
      client_ip: '127.0.0.1',
      client_received_start_timestamp: 'fooclientreceived',
      client_received_end_timestamp: 'fooclientreceivedend',
      client_sent_start_timestamp: 'fooclientstart',
      client_sent_end_timestamp: 'fooclientend',
      gateway_flow_id: '1234',
      request_path: '/foo',
      request_uri: 'http://foo.host/foo?bar=baz' ,
      request_verb: 'GET',
      response_status_code: 200,
      useragent: 'curl!',
      target_received_end_timestamp: 'foostreamended',
      target_received_start_timestamp: 'foostreamstarted',
      target_response_code: 200,
      target_sent_end_timestamp: 'foostreamended',
      target_sent_start_timestamp: 'foostreamstarted',
      target: 'footargetname',
      recordType: 'APIAnalytics',
      scopeId: 'fooscope'
    };

     const handler = (req, res) => {
      
      var buf = [];

      req.on('data', (d)=> {
        buf.push(d);
      });

      req.on('end', ()=>{
        //iterate through each record key. 
        //Ensure they are equal
        assert.ok(req.headers['content-encoding'])
        assert.ok(req.headers['content-encoding'], 'gzip');
        var dataBuffer = Buffer.concat(buf);
        var unzipped = zlib.gunzipSync(dataBuffer);
        var records = JSON.parse(unzipped.toString());
        assert.ok(records.records);
        assert.equal(records.records.length, 1)
        var firstRecord = records.records[0];
        
        //assert that the records are sent to the proper path
        assert.equal(req.url, '/analytics/fooscope');

        Object.keys(firstRecord).forEach((k) => {
          assert.equal(firstRecord[k], testRecord[k]);
        });
        res.writeHead(200);
        res.end();
        done();
      })
      
    };

    analyticsServer = startAnalyticsServer(handler, () => {
      testPlugin.onend_response(req, res, targetReq, targetRes, 'foo', (err, data) => {
        finishFunc();
      });
    });
  });

  it('will re-send an http request payload that receives a 500 response', (done) => {
    
    assert.equal(testPlugin.onend_response.length, 6);

    var analyticsObject = testPlugin.testprobe();
    var count = 0;

    var eventCalled;
    var targetReq = {
      _streamStarted: 'foobar'
    };

    var finishFunc;
    var testRes = {
      on: (ev, hd) => {
        if(ev == 'finish') {
          finishFunc = hd;
        }
      },
      proxy: {
        scope: 'fooscope',
        target_name: 'footargetname',
        proxy_name: 'fooproxyname',
        revision: 'foorevision'
      },
      statusCode: 200,
      _writeToClientStart: 'fooclientstart',
      _writeToClientEnd: 'fooclientend',
    };

    var testReq = {
      connection: {
        remoteAddress: '127.0.0.1'
      },
      _clientReceived: 'fooclientreceived',
      _clientReceivedEnd: 'fooclientreceivedend',
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted',
      _gatewayFlowId: '1234',
      headers: {
        host: 'foo.host',
        'user-agent': 'curl!'
      },
      url: '/foo?bar=baz',
      method: 'GET'
    }

    var targetRes = {
      statusCode: 200
    }

    var targetReq = {
      _streamEnded: 'foostreamended',
      _streamStarted: 'foostreamstarted'
    }

    var testRecord = {
      apiproxy: 'fooproxyname',
      apiproxy_revision: 'foorevision',
      client_ip: '127.0.0.1',
      client_received_start_timestamp: 'fooclientreceived',
      client_received_end_timestamp: 'fooclientreceivedend',
      client_sent_start_timestamp: 'fooclientstart',
      client_sent_end_timestamp: 'fooclientend',
      gateway_flow_id: '1234',
      request_path: '/foo',
      request_uri: 'http://foo.host/foo?bar=baz' ,
      request_verb: 'GET',
      response_status_code: 200,
      useragent: 'curl!',
      target_received_end_timestamp: 'foostreamended',
      target_received_start_timestamp: 'foostreamstarted',
      target_response_code: 200,
      target_sent_end_timestamp: 'foostreamended',
      target_sent_start_timestamp: 'foostreamstarted',
      target: 'footargetname',
      recordType: 'APIAnalytics',
      scopeId: 'fooscope'
    };

     const handler = (req, res) => {
      if(count == 0) {
        res.writeHead(500);
        count++;
        finishFunc();
        var respBody = JSON.stringify({
      "errrorCode":"INTERNAL_SERVER_ERROR",
      "reason":"Service is not initialized completely"});
        return res.end(respBody);
      } else {
        var buf = [];

        req.on('data', (d)=> {
          buf.push(d);
        });

        req.on('end', ()=>{
          //iterate through each record key. 
          //Ensure they are equal
          var records = JSON.parse(buf.toString());
          assert.ok(records.records);
          assert.equal(records.records.length, 1)
          var firstRecord = records.records[0];
          
          
          //assert that the records are sent to the proper path
          assert.equal(req.url, '/analytics/fooscope');

          Object.keys(firstRecord).forEach((k) => {
            assert.equal(firstRecord[k], testRecord[k]);
          });

          res.writeHead(200);
          res.end();
          done();
        })
      }
      
      
    };

    analyticsServer = startAnalyticsServer(handler, () => {
      testPlugin.onend_response(testReq, testRes, targetReq, targetRes, 'foo', (err, data) => {
        finishFunc();
      });
    });
  });
});
