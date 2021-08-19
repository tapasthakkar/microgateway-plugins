'use strict';

const _ = require('lodash')
var cluster = require('cluster');
const memored = require('../third_party/memored');

if (!cluster.isMaster)
{
	process.on('message', function(message) {
        if (message.request_disconnect) {
            process.env.request_disconnect = message.request_disconnect;
            console.log(`[${process.pid}] disconnecting request -> ${process.env.request_disconnect}`);
            process.send('disconnect');
        }
    });
}

for (const callee of Object.keys(memored)) 
{
    exports[callee] = function () {
        validateAndExecute(callee, arguments);
    }
} 

function validateAndExecute(callee, args)
{
    let callback = null;
        
    if(args) {
        let lastArg = _.last(args);
        callback = _.isFunction(lastArg) ?  lastArg : null;
    }
    
    if (!process.env.request_disconnect && memored[callee]) {
        memored[callee](...args);
    } 
    else if (callback) {
        let error = new Error("IPC disconnect, unable to retrieve cache from master process")
        callback(error);
    }
}