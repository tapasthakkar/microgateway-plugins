const assert = require('assert');
const fs = require('fs');

const json2xml = require('../json2xml/index');
const coreObject = require('./microgateway-core');
const logger = coreObject.logger;
const stats = coreObject.stats;

describe('json2xml plugin', () => {
  let plugin = null;

  beforeEach(() => {
    let config = {};

    plugin = json2xml.init.apply(null, [config, logger, stats]);
  });

  it('exposes an ondata_request handler', (done) => {
    assert.ok(plugin.onrequest);
    done()
  });

  it('exposes an ondata_request handler', (done) => {
    assert.ok(plugin.ondata_request);
    done()
  });

  it('exposes an onend_request handler', (done) => {
    assert.ok(plugin.onend_request);
    done()
  });

  it('exposes an ondata_response handler', (done) => {
    assert.ok(plugin.ondata_response);
    done()
  });

  it('exposes an onend_response handler', (done) => {
    assert.ok(plugin.onend_response);
    done()
  });

  it('Converts json data to xml before sending to target', (done) => {

    const desiredResult = fs.readFileSync('test/json2xml-json-data.xml');

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/json',
        'accept': 'application/json'
      }
    };
    const res = {
      setHeader: (headerName, value) => { }
    };

    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(req._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    let fileReader = fs.createReadStream('test/json2xml-json-data.json');

    plugin.onrequest.apply(null, [req, res, onreq_cb]);
  
    fileReader.on('data', (data) => {
      plugin.ondata_request.apply(null, [req, res, data, ondata_cb]);
    });

    fileReader.on('end', () => {
      plugin.onend_request.apply(null, [req, res, null, onend_cb]);  
    });
  
  });


  it('Converts xml data to json before sending to target', (done) => {

    const desiredResult = fs.readFileSync('test/json2xml-json-data.json');

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/xml',
        'accept': 'application/xml'
      }
    };
    const res = {
      setHeader: (headerName, value) => { }
    };

    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(req._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(Object.keys(JSON.parse(result).Root.SN1983V[0]).sort().join(''), 
      Object.keys(JSON.parse(desiredResult).SN1983V).sort().join('')); 
      done();
    } 

    let fileReader = fs.createReadStream('test/json2xml-json-data.xml');

    plugin.onrequest.apply(null, [req, res, onreq_cb]);
  
    fileReader.on('data', (data) => {
      plugin.ondata_request.apply(null, [req, res, data, ondata_cb]);
    });

    fileReader.on('end', () => {
      plugin.onend_request.apply(null, [req, res, null, onend_cb]);  
    });
  
  });


  it('Converts json data from target to xml before sending to client', (done) => {

    const desiredResult = fs.readFileSync('test/json2xml-json-data.xml');

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/xml',
        'accept': 'application/xml'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };

    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(res._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    let fileReader = fs.createReadStream('test/json2xml-json-data.json');

    plugin.onrequest.apply(null, [req, res, onreq_cb]);
  
    fileReader.on('data', (data) => {
      plugin.ondata_response.apply(null, [req, res, data, ondata_cb]);
    });

    fileReader.on('end', () => {
      plugin.onend_response.apply(null, [req, res, null, onend_cb]);  
    });
  
  });


  it('Converts xml data from target to json before sending to client', (done) => {

    const desiredResult = fs.readFileSync('test/json2xml-json-data.json');

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/json',
        'accept': 'application/json'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };

    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(res._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, undefined);
      assert.notStrictEqual(result, null);
      assert.equal(Object.keys(JSON.parse(result).Root.SN1983V[0]).sort().join(''),
        Object.keys(JSON.parse(desiredResult).SN1983V).sort().join(''));
      done();
    } 

    let fileReader = fs.createReadStream('test/json2xml-json-data.xml');

    plugin.onrequest.apply(null, [req, res, onreq_cb]);
  
    fileReader.on('data', (data) => {
      plugin.ondata_response.apply(null, [req, res, data, ondata_cb]);
    });

    fileReader.on('end', () => {
      plugin.onend_response.apply(null, [req, res, null, onend_cb]);  
    });
  
  });

  it('json2xml Will process string data in ondata_request handler ', (done) => {

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/text',
        'accept': 'application/text'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };
    
    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const desiredResult = 'aaa';
    
    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(req._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    plugin.onrequest.apply(null, [req, res, onreq_cb]);

    plugin.ondata_request.apply(null, [req, res,'a', ondata_cb]);
    plugin.ondata_request.apply(null, [req, res,'a', ondata_cb]);
    plugin.ondata_request.apply(null, [req, res,'a', ondata_cb]);
    
    plugin.onend_request.apply(null, [req, res, null, onend_cb]);  
  });

  it('json2xml Will process string data in ondata_response handler ', (done) => {

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/text',
        'accept': 'application/text'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };
    
    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const desiredResult = 'aaa';
    
    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(res._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    plugin.onrequest.apply(null, [req, res, onreq_cb]);

    plugin.ondata_response.apply(null, [req, res,'a', ondata_cb]);
    plugin.ondata_response.apply(null, [req, res,'a', ondata_cb]);
    plugin.ondata_response.apply(null, [req, res,'a', ondata_cb]);
    
    plugin.onend_response.apply(null, [req, res, null, onend_cb]);  
  });

  it('json2xml Will process number data in ondata_request handler ', (done) => {

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/text',
        'accept': 'application/text'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };
    
    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const desiredResult = '123';
    
    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(req._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    plugin.onrequest.apply(null, [req, res, onreq_cb]);

    plugin.ondata_request.apply(null, [req, res, 1, ondata_cb]);
    plugin.ondata_request.apply(null, [req, res, 2, ondata_cb]);
    plugin.ondata_request.apply(null, [req, res, 3, ondata_cb]);
    
    plugin.onend_request.apply(null, [req, res, null, onend_cb]);  
  });

  it('json2xml Will process numeric data in ondata_response handler ', (done) => {

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/text',
        'accept': 'application/text'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };
    
    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const desiredResult = '123';
    
    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(res._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    plugin.onrequest.apply(null, [req, res, onreq_cb]);

    plugin.ondata_response.apply(null, [req, res, 1, ondata_cb]);
    plugin.ondata_response.apply(null, [req, res, 2, ondata_cb]);
    plugin.ondata_response.apply(null, [req, res, 3, ondata_cb]);
    
    plugin.onend_response.apply(null, [req, res, null, onend_cb]);  
  });

  it('json2xml Will process boolean data in ondata_request handler ', (done) => {

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/text',
        'accept': 'application/text'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };
    
    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const desiredResult = 'truefalsetrue';
    
    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(req._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    plugin.onrequest.apply(null, [req, res, onreq_cb]);

    plugin.ondata_request.apply(null, [req, res, true, ondata_cb]);
    plugin.ondata_request.apply(null, [req, res, false, ondata_cb]);
    plugin.ondata_request.apply(null, [req, res, true, ondata_cb]);
    
    plugin.onend_request.apply(null, [req, res, null, onend_cb]);  
  });

  it('json2xml Will process numeric data in ondata_response handler ', (done) => {

    const req = {
      method: 'POST',
      headers:{
        'content-type': 'application/text',
        'accept': 'application/text'
      }
    };
    const res = {
      setHeader: (headerName, value) => { },
      getHeader: (headerName, value) => req.headers[headerName]
    };
    
    const onreq_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
    }

    const desiredResult = 'truefalsetrue';
    
    const ondata_cb = (err, result) => {
      assert.equal(err, null);
      assert.equal(result, null);
      assert.ok(res._chunks);
    }

    const onend_cb = (err, result) => {
      assert.equal(err, null);
      assert.notStrictEqual(result, null);
      assert.equal(result.toString(), desiredResult); 
      done();
    } 

    plugin.onrequest.apply(null, [req, res, onreq_cb]);

    plugin.ondata_response.apply(null, [req, res, true, ondata_cb]);
    plugin.ondata_response.apply(null, [req, res, false, ondata_cb]);
    plugin.ondata_response.apply(null, [req, res, true, ondata_cb]);
    
    plugin.onend_response.apply(null, [req, res, null, onend_cb]);  
  });

  });
