'use strict';
const httpntlm = require('httpntlm');
const ntlm = httpntlm.ntlm;
const http = require('http');
let k=0;
module.exports.init = function(config, logger, stats) {
    return {
        onrequest: function(req, res, next) {
            // req.headers['httpLibrary'] = httpntlm;
            if(req.headers['ntlm']) {
                k+=1;
                                                console.log('k', process.pid,k);

                res.setHeader('connection','close');
                res.setHeader('connectionk',process.pid.toString()+k.toString());
                res.setHeader('ntlm',req.headers['ntlm']);

            req.httpLibrary = function(cb){

                var keepAliveAgent = new http.Agent({ 'keepAlive': true,maxSockets:2 });
                
                var options = {
                    url: '',
                    username: '',
                    password: '',
                    workstation: 'asdf',
                    domain: ''
                };
                
                // let r;
                let r= http.get(options.url, {
                    headers: {
                        'Connection': 'keep-alive',
                        'Authorization': ntlm.createType1Message(options)
                    },
                    agent: keepAliveAgent
                }, (resp) => {
                    resp.on('data', (d) => {
                        // console.log('d', d);
                    })
                    resp.on('end', () => {
                        // console.log('first', resp.headers);
                        var type2msg = ntlm.parseType2Message(resp.headers['www-authenticate']);
                        var type3msg = ntlm.createType3Message(type2msg, options);
                        setImmediate(() => {
                            http.get(options.url, {
                                headers: {
                                    'connection': 'close',
                                    'Authorization': type3msg
                                },
                                
                                agent: keepAliveAgent
                            },resp2=>{
                                // console.log('resp2.headers', resp2.headers);

                                // resp2.headers['connection']='close';
                                // resp2.headers['connectionk']=k.toString();
                                cb(resp2);
                                resp2.on('finish',()=>keepAliveAgent.destroy())
                            });
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
                })
                r.end();
                return r;
            }
        }
            next();
        },
        // onend
        onclose_response: function (params) {
            
        }
    }
}