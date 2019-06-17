const oauth = require('../oauth/index');
const oauthv2 = require('../oauthv2/index');
const assert = require('assert');

const logger = {}
const stats = {}

describe('oauth plugins', function() {

// should be identical for these tests
var modules = { oauth, oauthv2 }
for (var name in modules) {

  describe(name, function() {

    var package = modules[name]

    it('exposes an onrequest handler', function() {
        var config = {}
        var plugin = package.init.apply(null, [config, logger, stats]);
        assert.ok(plugin.onrequest);
      });
    
      it('ejectToken where gracePeriod == 0', function() {
        var config = {
            allowOAuthOnly: true,
            allowNoAuthorization: true,
            gracePeriod: 0,
        }
        var plugin = package.init.apply(null, [config, logger, stats])
            
        var cb = (err) => {}
        var req = {headers: {}}
        var res = {}
        plugin.onrequest.apply(null, [req, res, cb]); // called to init vars

        // not expired
        var exp = (new Date().getTime() / 1000) + 5
        assert.ok(!plugin.testing.ejectToken(exp), "should not eject")
    
        // expired
        var exp = new Date().getTime() / 1000 - 5
        assert.ok(plugin.testing.ejectToken(exp), "should eject")
      });
    
      it('ejectToken where gracePeriod != 0', function() {
        var config = {
            allowOAuthOnly: true,
            allowNoAuthorization: true,
            gracePeriod: 5,
        }
        var plugin = package.init.apply(null, [config, logger, stats])
    
        var cb = (err) => {}
        var req = {headers: {}}
        var res = {}
        plugin.onrequest.apply(null, [req, res, cb]); // called to init vars
    
        // not expired
        var exp = (new Date().getTime() / 1000) + 5
        assert.ok(!plugin.testing.ejectToken(exp), "should not eject")
    
        // expired, inside of grace period
        var exp = new Date().getTime() / 1000 - 3
        assert.ok(!plugin.testing.ejectToken(exp), "should not eject")
    
        // expired, outside of grace period
        var exp = new Date().getTime() / 1000 - 6
        assert.ok(plugin.testing.ejectToken(exp), "should eject")
      });
  })
}
})
