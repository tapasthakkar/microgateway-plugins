const verifyApiKey = require('../verify-api-key/index');
const assert = require('assert');
var formBody = require("body/form")

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

    app.post('/verifiers/verify', function (req, res) {
      res.setHeader("content-type", "application/json")

      formBody(req, res, function (err, body) {
        if (err) {
          res.statusCode = 500
          return res.end("Malformed post bosy.  Should not happen");
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
    var logger = {error: (data, err) => console.error(data, err)};
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
      }
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
      }
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
      }
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
      }
    }
    var res = {proxy: proxy};
    var cb = (err, result) => {
      assert.equal(res.statusCode, undefined);
      done();
    }

    plugin.onrequest.apply(null, [req, res, Buffer.alloc(5, 'a'), cb]);
  });
})
