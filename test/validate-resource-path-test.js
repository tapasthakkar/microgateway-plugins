const checkIfAuthorized = require('../lib/validateResourcePath');
const assert = require('assert');
const denv = require('dotenv');

denv.config();

const coreObject = require('./microgateway-core');
const logger = coreObject.logger;

const apiProd = 'edgemicro_weather';
const apiName = 'weather';
const proxy = { name: apiProd, base_path: '/v1/weatheer' }
const token = { api_product_list: [apiName] }

function* testConfig() {
    let i = 0; while (i < 15) {
        i++; yield {
            "product_to_proxy": [apiName],
            "product_to_api_resource": {}
        }
    }
}

var [slash, slashStar, slashStarStar, slashStarStar2, customPattern, customPatternTest, aStar, aDoubleStar, bSlashStar,
    bSlashStarStar, withEndSlashStar, withEndSlashStarStar2, withSpecialSymbol, withStarAndSpecialSymbol, withLiteralAndTwoSlashStars] = [...testConfig()];
slash.product_to_api_resource[apiName] = ["/"];
slashStar.product_to_api_resource[apiName] = ["/*"];
slashStarStar.product_to_api_resource[apiName] = ["/**"];
slashStarStar2.product_to_api_resource[apiName] = ["/*/2/**"];
customPattern.product_to_api_resource[apiName] = ["/", "/*", "/**", "/a/b/c", "/a"];
customPatternTest.product_to_api_resource[apiName] = ["/a/b/c"];
aStar.product_to_api_resource[apiName] = ["/a*"];
aDoubleStar.product_to_api_resource[apiName] = ["/a**"];
bSlashStar.product_to_api_resource[apiName] = ["/a**/b/*"];
bSlashStarStar.product_to_api_resource[apiName] = ["/a**/b/**"];
withEndSlashStar.product_to_api_resource[apiName] = ["/*/"];
withEndSlashStarStar2.product_to_api_resource[apiName] = ["/*/2/**/"];
withSpecialSymbol.product_to_api_resource[apiName] = ["/a@@@@"];
withStarAndSpecialSymbol.product_to_api_resource[apiName] = ["/@@@@**"];
withLiteralAndTwoSlashStars.product_to_api_resource[apiName] = ["/a/*/users/*"];

var productOnly = true;

const getReqObject = (urlPath) => {
    return {
        reqUrl: {
            path: urlPath
        }
    }
}

var res = {
    proxy: proxy
}

describe('validateResourcePath', function () {

    it('will not initialize without a well formed config',(done) => {
        
        var contains = checkIfAuthorized(undefined, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(contains === undefined)
    
        contains = checkIfAuthorized(null, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger)
        assert(contains === undefined)

        contains = checkIfAuthorized(slash, undefined, res, token, productOnly, logger);
        assert(contains === undefined)
    
        contains = checkIfAuthorized(slash, null, res, token, productOnly, logger)
        assert(contains === undefined)

        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}`), undefined, token, productOnly, logger);
        assert(contains === undefined)
    
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}`), null, token, productOnly, logger)
        assert(contains === undefined)
        done();
      })

    // check for / resource path.

    it('checkIfAuthorized for /', function (done) {
        var contains;
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/1`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/1/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/1/2`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/1/2/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/1/2/3/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slash, getReqObject(`${proxy.base_path}/1/a/2/3/`), res, token, productOnly, logger);
        assert(contains)
        done()
    })

    // check for /* resource path.

    it('checkIfAuthorized for /*', function (done) {
        var contains;
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/1`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/1/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/1/2`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/1/2/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/1/2/3/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStar, getReqObject(`${proxy.base_path}/1/a/2/3/`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for /** resource path.

    it('checkIfAuthorized for /**', function (done) {
        var contains;
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/1`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/1/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/1/2`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/1/2/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/1/2/3/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar, getReqObject(`${proxy.base_path}/1/a/2/3/`), res, token, productOnly, logger);
        assert(contains)
        done()

    })

    // check for /*/2/** resource path.

    it('checkIfAuthorized for  /*/2/**  ', function (done) {
        var contains;
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/2`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/2/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/2/3/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/2/3/4/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/s/2/3/4/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(slashStarStar2, getReqObject(`${proxy.base_path}/1/a/2/3/`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for /a/b/c resource path.

    it('checkIfAuthorized for /a/b/c', function (done) {
        var contains;
        contains = checkIfAuthorized(customPatternTest, getReqObject(`${proxy.base_path}/a/b/c`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPatternTest, getReqObject(`${proxy.base_path}/a`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(customPatternTest, getReqObject(`${proxy.base_path}/a/b`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(customPatternTest, getReqObject(`${proxy.base_path}/a/b/c/d`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for /*, /a resource path.

    it('checkIfAuthorized for /, /*, /**, /a/b/c, /a', function (done) {
        var contains;
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/a/b/c`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/a`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/a/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/b`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/b/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/a/b`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(customPattern, getReqObject(`${proxy.base_path}/a/b/c/d`), res, token, productOnly, logger);
        assert(contains)
        done()
    })

    // check for  /a** resource path.

    it('checkIfAuthorized for  /a**  ', function (done) {
        var contains;
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/a`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/a/ds/sd`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/asdas/b/c`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/b/c`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/#/b/c`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/asdfsdffsd/sasdas`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(aDoubleStar, getReqObject(`${proxy.base_path}/avvxd****/222/s/b`), res, token, productOnly, logger);
        assert(contains)
        done()
    })

    // check for  /a* resource path.

    it('checkIfAuthorized for  /a*  ', function (done) {
        var contains;
        contains = checkIfAuthorized(aStar, getReqObject(`${proxy.base_path}/a`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(aStar, getReqObject(`${proxy.base_path}/asdas/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(aStar, getReqObject(`${proxy.base_path}/asdas/s/v`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(aStar, getReqObject(`${proxy.base_path}/asdfsdffsd/sasdas`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(aStar, getReqObject(`${proxy.base_path}/avvxd****/222`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for  /a@@@@ resource path.

    it('checkIfAuthorized for  /a@@@@', function (done) {
        var contains;
        contains = checkIfAuthorized(withSpecialSymbol, getReqObject(`${proxy.base_path}/a`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withSpecialSymbol, getReqObject(`${proxy.base_path}/a@@@@`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withSpecialSymbol, getReqObject(`${proxy.base_path}/asdas/b/c`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withSpecialSymbol, getReqObject(`${proxy.base_path}/b/c`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withSpecialSymbol, getReqObject(`${proxy.base_path}/a@@@`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withSpecialSymbol, getReqObject(`${proxy.base_path}/@@@@`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for  /@@@@** resource path.

    it('checkIfAuthorized for  /@@@@**', function (done) {
        var contains;
        contains = checkIfAuthorized(withStarAndSpecialSymbol, getReqObject(`${proxy.base_path}/a`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withStarAndSpecialSymbol, getReqObject(`${proxy.base_path}/a@@@@`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withStarAndSpecialSymbol, getReqObject(`${proxy.base_path}/@@@@`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withStarAndSpecialSymbol, getReqObject(`${proxy.base_path}/@@@@/dsfsd/sdfsdf`), res, token, productOnly, logger);
        assert(contains)
        done()
    })

    // check for /a**/b/* resource path.

    it('checkIfAuthorized for  /a**/b/*  ', function (done) {
        var contains;
        contains = checkIfAuthorized(bSlashStar, getReqObject(`${proxy.base_path}/a/ds/b/c`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(bSlashStar, getReqObject(`${proxy.base_path}/a/ds/ba/c`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for /a**/b/** resource path.

    it('checkIfAuthorized for  /a**/b/**  ', function (done) {
        var contains;
        contains = checkIfAuthorized(bSlashStarStar, getReqObject(`${proxy.base_path}/a/ds/b/c`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(bSlashStarStar, getReqObject(`${proxy.base_path}/a/ds/ba/c`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

    // check for /*/ resource path.

    it('checkIfAuthorized for /*/', function (done) {
        var contains;
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/1`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/1/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/1/2`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/1/2/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/1/2/3/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStar, getReqObject(`${proxy.base_path}/1/a/2/3/`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })


    // check for /*/2/**/  resource path.

    it('checkIfAuthorized for  /*/2/**/', function (done) {
        var contains;
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1/2`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1/2/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1/2/3/`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1/2/3`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withEndSlashStarStar2, getReqObject(`${proxy.base_path}/1/a/2/3/`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })


      // check for /a/*/users/* resource path.

      it('checkIfAuthorized for  /a/*/users/*  ', function (done) {
        var contains;
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b/users/c`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b c/users/d`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b_c/users/d`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b-c/users/d`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b:c/users/d`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b=c/users/d`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b,c/users/d`), res, token, productOnly, logger);
        assert(contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b/users`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/users/c`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b c/users/d/`), res, token, productOnly, logger);
        assert(!contains)
        contains = checkIfAuthorized(withLiteralAndTwoSlashStars, getReqObject(`${proxy.base_path}/a/b c/users/d/e`), res, token, productOnly, logger);
        assert(!contains)
        done()
    })

}); 