'use strict';
const http = require('http');
const assert = require('assert');
let k = 0;
let k2 = 0;
let k3 = 0;
let k4 = 0;
let k5 = 0;
let k6 = 0;
let k7 = 0;
let k8 = 0;
let k9 = 0;
let uniqId = {};
function requersive(count) {
  let r = http.request(
    'http://localhost:8000/edgemicro_ntlm',
    {
      headers: {
        ntlm: process.env.ntlmCreds,
        connection: 'close'
      },
      method: 'GET'
    },
    resp => {
      let dStr = '';
      resp.on('data', d => {
        dStr += d;
      });
      resp.on('end', () => {
        console.log('end', dStr);
        console.log(count, resp.statusCode, 'resp.headers', resp.headers);
        assert.deepStrictEqual(resp.statusCode, 200);
        assert.deepStrictEqual(resp.headers['ntlm'], count.toString());
        if (++count < 100) requersive(count);
      });
    }
  );

  r.end();
}
console.time('asdf');
requersive(k);
requersive(k2);
requersive(k3);
// requersive(k4);
// requersive(k5);
// requersive(k6);
// requersive(k7);
// requersive(k8);
// requersive(k9);

process.on('exit', () => {
  console.timeEnd('asdf');
});

// ('use strict');

// const httpntlm = require('httpntlm');
// const ntlm = httpntlm.ntlm;
// const http = require('http');
// const agentkeepalive = require('agentkeepalive');

// console.log('agentkeepalive', agentkeepalive);
// // var HttpAgent = require('agentkeepalive').HttpAgent;
// module.exports = function(cb){

//     var keepAliveAgent = new http.Agent({ 'keepAlive': true });

//     var options = {
//         url: "",
//         username: '',
//         password: '',
//         workstation: 'asdf',
//         domain: ''
//     };

//     http.get(options.url, {
//         headers: {
//             'Connection': 'keep-alive',
//             'Authorization': ntlm.createType1Message(options)
//         },
//         agent: keepAliveAgent
//     }, (resp) => {
//         resp.on('data', (d) => {
//             console.log('d', d);
//         })
//         resp.on('end', () => {
//             console.log('first', resp.headers);
//             var type2msg = ntlm.parseType2Message(resp.headers['www-authenticate']);
//             var type3msg = ntlm.createType3Message(type2msg, options);
//             setImmediate(() => {
//                 http.get(options.url, {
//                     headers: {
//                         'connection': 'close',
//                         'Authorization': type3msg
//                     },

//                     agent: keepAliveAgent
//                 }, (resp2) => {
//                     console.log('resp2.headers', resp2.headers);
//                     // let dBuf = [];
//                     // resp2.on('data', (d) => {
//                     //     dBuf.push(d);
//                     // })
//                     // resp2.on('end', () => {
//                     //     let dBod = Buffer.concat(dBuf).toString();
//                     //     console.log('end', dBod);
//                     // })
//                     cb(null, resp2);
//                 })
//             });
//         });
//     })

// }
// // // httpntlm.get(options,(err,resp)=>{
// // //     if(err) console.error(err);
// // //     else {
// // //         console.log('resp.headers', resp.headers);
// // //         console.log('resp.body', resp.body);
// // //     }
// // // })
