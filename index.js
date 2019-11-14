const request = require('request');
const fs = require('fs')
const path = require('path')

module.exports = (apiKey) => {
  return {
    addTemplate: (localPath, payload, callback) => {
      if (!checkPathIsAbsolute(localPath)) {
        return callback(new Error('You path must be an absolute path'));
      }

      request({
        method: 'POST',
        uri: 'http://localhost:3000/template',
        formData: {
          payload: payload,
          template: fs.createReadStream(localPath)
        },
        headers: {
          authorization: `Bearer ${apiKey}`
        }
      }, (err, res, body) => {
        if (err) {
          return callback(err);
        }

        return callback(null, body);
      });
    }
  }
}

/**
 * Return the absolute path of the file
 * @param {String} localPath User filepath
 */
function checkPathIsAbsolute(localPath) {
  if (localPath.startsWith('/')) {
    return true;
  }

  return false;
}
