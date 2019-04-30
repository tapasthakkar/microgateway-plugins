'use strict';
// const httpntlm = require('httpntlm');
const ntlm = require('./ntlm.js');
const http = require('http');
let k = 0;
let pidStr = process.pid.toString();
module.exports.init = function(config, logger, stats) {
  return {
    onrequest: function(req, res, next) {
      // console.log('sourceRequest', Date.now());
      // req.headers['httpLibrary'] = httpntlm;
      if (req.headers['ntlm']) {
        k += 1;
        console.log('k', process.pid, k);

        res.setHeader('connection', 'close');
        res.setHeader('connectionk', pidStr + k.toString());
        // res.setHeader('ntlm', req.headers['ntlm']);

        req.httpLibrary = function(cb, payload) {
          var keepAliveAgent = new http.Agent({ keepAlive: true, maxSockets: 2 });
          let [usernameNTLM, passwordNTLM] = req.headers['ntlm'].split(':');
          console.log('usernameNTLM', usernameNTLM);
          console.log('passwordNTLM', passwordNTLM);
          console.log('req.targetPath', req.targetPath);
          console.log('res.proxy', res.proxy);
          var options = {
            url: res.proxy.url,
            username: usernameNTLM,
            password: passwordNTLM,
            workstation: pidStr,
            domain: ''
          };

          // let r;
          let r = http.get(
            options.url,
            {
              headers: {
                Connection: 'keep-alive',
                Authorization: ntlm.createType1Message(options)
              },
              agent: keepAliveAgent
            },
            resp => {
              console.log('resp.statusCode1111', resp.statusCode);
              resp.on('data', d => {
                // console.log('d', d);
              });
              resp.on('end', () => {
                // console.log('first', resp.headers);
                var type2msg = ntlm.parseType2Message(resp.headers['www-authenticate']);
                var type3msg = ntlm.createType3Message(type2msg, options);
                setImmediate(() => {
                  let r2 = http.request(
                    options.url,
                    {
                      method: req.method,
                      headers: {
                        connection: 'close',
                        Authorization: type3msg
                      },

                      agent: keepAliveAgent
                    },
                    resp2 => {
                      console.log('resp2.statusCode', resp2.statusCode);

                      // resp2.headers['connection']='close';
                      // resp2.headers['connectionk']=k.toString();
                      cb(resp2);
                      // resp2.on('finish', () => keepAliveAgent.destroy());
                    }
                  );
                  if (payload) r2.write(payload);
                  r2.end();
                  // return r;
                  // http.get(options.url, {
                  //     headers: {
                  //         'connection': 'close',
                  //         'Authorization': type3msg
                  //     },

                  //     agent: keepAliveAgent
                  // }, (resp2) => {
                  //     // console.log('resp2.headers', resp2.headers);
                  //     // let dBuf = [];
                  //     // resp2.on('data', (d) => {
                  //     //     dBuf.push(d);
                  //     // })
                  //     // resp2.on('end', () => {
                  //     //     let dBod = Buffer.concat(dBuf).toString();
                  //     //     console.log('end', dBod);
                  //     // })
                  //     cb(null, resp2);
                  //     // next();
                  // })
                });
              });
            }
          );
          r.end();
          return r;
        };
      }
      next();
    },

    // onend
    onclose_response: function(params) {
      console.log('close response');
    }
  };
};
