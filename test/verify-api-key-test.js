const verifyApiKey = require('../verify-api-key/index');
const assert = require('assert');
const qs = require('querystring');

const accumulate = (req, cb) => {
  var buf = [];

  req.on('data', (d) => {
    buf += d;
  });

  req.on('end', () => {
    try {
      var obj = qs.parse(buf.toString());
      return cb(null, obj);
    } catch(e) {
      return cb(e);
    }
  });
}

describe('verify-api-key plugin', () => {
  var plugin = null;
  var proxy = {
    scope: 'testScope',
    env: 'testEnv',
    org: 'testOrg',
  }

  before(() => {
    var express = require('express')
    var app = express()

    app.post('/verifiers/apikey', function (req, res) {
      res.setHeader("content-type", "application/json")

      accumulate(req, function (err, body) {
        if (err) {
          res.statusCode = 500
          return res.end("Malformed post body.  Should not happen");
        }

        if (body.key === 'INVALID-KEY') {
          res.end(JSON.stringify({type: 'ErrorResult', result: {errorCode: "PROVIDED_ERROR_CODE"}}));
        } else if (body.key === 'REVOKED-KEY') {
          res.end(JSON.stringify({result:{status: 'REVOKED'}}))
        }
        else {
          res.end(JSON.stringify({result: {status: "valid"}}));
        }
      })
    })

    app.listen(9090);
  })

  beforeEach(() => {
    var config = {};
    var logger = {
      error: (data, err) => console.error(data, err),
      info: (data) => console.log(data)
    };
    var stats = {};

    plugin = verifyApiKey.init.apply(null, [config, logger, stats]);
  });

  it('exposes an onrequest handler', () => {
    assert.ok(plugin.onrequest);
  });

  it('returns 401 when x-api-key is absent', (done) => {
    var req = {
      headers: {
        'api-key-header-missing': true
      },
      url: '/foo'
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(err, "No API Key Provided");
      assert.equal(res.statusCode, 401);
      done();
    }

    plugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });

  it('returns 401 when x-api-key is revoked', (done) => {
    var req = {
      headers: {
        'x-api-key': 'REVOKED-KEY'
      },
      url: '/foo'
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(err, "API Key has been revoked");
      assert.equal(res.statusCode, 401);
      done();
    }

    plugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });

  it('returns 401 when x-api-key is invalid and calls next() with the error code', (done) => {
    var req = {
      headers: {
        'x-api-key': 'INVALID-KEY'
      },
      url: '/foo'
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(err, "PROVIDED_ERROR_CODE");
      assert.equal(res.statusCode, 401);
      done();
    }

    plugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });

  it('succeeds when x-api-key is valid', (done) => {
    var req = {
      headers: {
        'x-api-key': 'VALID-KEY'
      },
      url: '/foo'
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(res.statusCode, undefined);
      done();
    }

    plugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });

  it('succeeds when x-api-key is valid and in the query parameter', (done) => {
    var req = {
      headers: {
        
      },
      url: '/foo?apikey=VALID-KEY'
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(res.statusCode, undefined);
      done();
    }

    plugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });

  it('will send back an error if apid is inaccessible', (done) => {

    var config = {
      apidEndpoint: 'http://localhost:9091/'
    };
    var logger = {
      error: (data, err) => console.error(data, err),
      info: (data) => console.log(data)
    };
    var stats = {};

    badPlugin = verifyApiKey.init.apply(null, [config, logger, stats]);

    var req = {
      headers: {
      },
      url: '/foo?apikey=VALID-KEY'
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(err.code, 'ECONNREFUSED');
      assert.equal(err.message, 'Error connecting to apid at: http://localhost:9091/verifiers/apikey to verify api key');
      done();
    }

    badPlugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });
})
