const debug = require('debug')('plugin:helperFunctions');

/**
 * If data is already an instance of buffer then return same and otherwise convert the data to buffer.
 * @param {*} data can be of type any.
 */
module.exports.toBuffer = function(data){
  if (Buffer.isBuffer(data)) {
    return data;
  }
  // if the data is number, boolean or object then convert it to string
  if (typeof data === 'object') {
    data = JSON.stringify(data);
  } else if (typeof data === 'number' || typeof data === 'boolean') {
    data += '';
  }
  // Now the data should be string, convert the string to buffer
  if (typeof data === 'string') {
    try {
      data = Buffer.from(data, 'utf-8');
    } catch (err) {
      debug('Error in converting to buffer')
    }
  }
  return data;
}