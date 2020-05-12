var rs = require('jsrsasign');


class AuthorizationHelper {

    constructor(debug){
        this.debug = debug;
    }

    getPEM(decodedToken, keys) {
        var i = 0;
        this.debug('jwk kid ' + decodedToken.headerObj.kid);
        for (; i < keys.keys.length; i++) {
            if (keys.keys[i].kid === decodedToken.headerObj.kid) {
                break;
            }
        }
        var publickey = rs.KEYUTIL.getKey(keys.keys[i]);
        return rs.KEYUTIL.getPEM(publickey);
    }

    setResponseCode(res,code) {
        switch ( code ) {
            case 'invalid_request': {
                res.statusCode = 400;
                break;
            }
            case 'access_denied':{
                res.statusCode = 403;
                break;
            }
            case 'invalid_token':
            case 'missing_authorization':
            case 'invalid_authorization': {
                res.statusCode = 401;
                break;
            }
            case 'gateway_timeout': {
                res.statusCode = 504;
                break;
            }
            default: {
                res.statusCode = 500;
                break;
            }
        }
    }
    
}

module.exports = AuthorizationHelper;