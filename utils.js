const path = require('path');
const URL  = require("url").URL;
const get  = require('simple-get');
const stream = require('stream');
const fs = require('fs');

const _utils = {
  /**
   * Return the absolute path of the file
   * @param {String} localPath User filepath
   */
  checkPathIsAbsolute: function (localPath) {
    if (path.isAbsolute(localPath)) {
      return true;
    }
    return false;
  },

  /**
   * Parse request response
   * @param {Object} response HTTP response object
   * @param {Object} body HTTP response body
   * @param {String} wantedKey The key that must be returned
   * @param {Function} callback
   */
  parseResponse: function (response, body, wantedKey, needParsing, callback) {
    if (needParsing) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // Return JSON parse error only if the request is expected to work well
        if (response.statusCode === 200) {
          return callback(new Error('Cannot parse body'));
        }
      }
    }

    if (response.statusCode !== 200) {
      if (body && body.success === false) {
        return callback(new Error(body.error));
      }
      return callback(new Error(response.statusMessage));
    }

    if (body.success === false) {
      return callback(new Error(body.error));
    }

    if (wantedKey !== undefined) {
      return callback(null, body.data[wantedKey]);
    }

    return callback(null, body.data);
  },

  /**
   * Parse reponse for streaming HTTP request
   * @param {Object} response HTTP response object
   * @param {Function} callback
   */
  parseStreamedResponse: function (response, callback) {
    if (response.statusCode === 404) {
      return callback(new Error('File not found'));
    } else if (response.statusCode !== 200) {
      return callback(new Error(`Error ${response.statusCode}: an error occured`));
    }

    return callback(null);
  },

  /**
   * Check if the user send a callback, if no callback has been provided, return a stream error
   * @param {Error} error Error that must be returned
   * @param {Stream} stream Stream if exists
   * @param {Function} callback Callback if exists
   */
  returnStreamOrCallbackError: function (error, stream, callback) {
    if (callback) {
      return callback(error);
    }
    return stream.emit('error', error);
  },
  /**
   * Verify if an URL is valid.
   * @param {string} URL
   * @returns 
   */
  validURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  },
  downloadFile: (url, callback) => {
    if (_utils.validURL(url) === false) {
      return callback(new Error('The template URL is not valid'));
    }
    return get.concat({
      url: url,
      method: 'GET',
      timeout : 10000
    }, function (err, res, buffer) {
      if (err) {
        return callback(err);
      } else  if (res.statusCode < 200 || res.statusCode >= 400) {
        return callback(new Error(`Downloading a template URL returned a ${res.statusCode} status code`));
      }
      return callback(null, buffer);
    })
  },
  bufferToBase64: function (buffer) {
    return Buffer.from(buffer).toString('base64')
  },
  bufferToReadStream: function (buffer) {
    return new stream.Readable({
      read() {
        this.push(buffer);
        this.push(null);
      }
    });
  },
  getTemplateAsBuffer: function (template, options, callback) {
    if (typeof template === 'string' && (template?.startsWith('https://') || template?.startsWith('http://'))) {
      return _utils.downloadFile(template, callback);
    }
    if (typeof template === 'string' && _utils.checkPathIsAbsolute(template) === true && 
        options && options?.headers && options?.headers?.['carbone-template-delete-after'] + '' === '0') {
      try {
        template = fs.readFileSync(template);
      } catch(err) {
        return callback(err);
      }
      return callback(null, template);
    }
    return callback(null, template);
  }
}

module.exports = _utils;