const request = require('request');
const fs = require('fs')
const path = require('path')
const Transform = require('stream').Transform
const StreamAnswer = require('./streamAnswer')

let _apiKey = '';
let _config = {
  carboneUrl: 'https://render.carbone.io/'
};

function parseResponse (response, body, wantedKey, callback) {
  try {
    body = JSON.parse(body);
  } catch (e) {
    // Return JSON parse error only if the request is expected to work well
    if (response.statusCode === 200) {
      console.error('Body parsed ', body);
      return callback(new Error('Cannot parse body'));
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

  return callback(null);
}

function parseStreamedResponse (response, callback) {
  if (response.statusCode === 404) {
    return callback(new Error('File not found'));
  } else if (response.statusCode !== 200) {
    return callback(new Error(`Error ${response.statusCode}: an error occured`));
  }

  return callback(null);
}

function returnStreamOrCallbackError (error, response, callback) {
  if (callback) {
    return callback(error);
  }

  return response.emit('error', error);
}

const sdkFunctions = {
  config: function (userConfig) {
    config = Object.assign(config, userConfig)
  },

  /**
   * Upload user template
   * @param {String} localPath User filepath
   * @param {String} payload User payload
   * @param {Function} callback
   * @param {Boolean} _retry False if the request has not been retry
   */
  addTemplate: function (localPath, payload, callback, _retry = false) {
    if (callback === undefined) {
      callback = payload;
      payload = '';
    }

    if (!checkPathIsAbsolute(localPath)) {
      return callback(new Error('Your path must be an absolute path'));
    }

    request({
      method: 'POST',
      uri: `${_config.carboneUrl}template`,
      formData: {
        payload: payload,
        template: fs.createReadStream(localPath)
      },
      headers: {
        authorization: `Bearer ${_apiKey}`
      }
    }, (err, response, body) => {
      if (err) {
        if (err.code === 'ECONNRESET' && !_retry) {
          return this.addTemplate(localPath, payload, callback, true);
        }

        return callback(err);
      }

      return parseResponse(response, body, 'templateId', callback);
    });
  },

  /**
   * Delete a template with the templateID
   * @param {String} templateId Template ID to delete
   * @param {Function} callback
   * @param {Boolean} _retry False if the request has not been retry
   */
  delTemplate: function (templateId, callback, _retry = false) {
    if (templateId == null) {
      return callback(new Error('Invalid template ID'));
    }

    request({
      method: 'DELETE',
      uri: `${_config.carboneUrl}template/${templateId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`
      }
    }, (err, response, body) => {
      if (err) {
        if (err.code === 'ECONNRESET' && !_retry) {
          return this.delTemplate(templateId, callback, true);
        }

        return callback(err);
      }

      return parseResponse(response, body, undefined, callback);
    });
  },

  /**
   * Return the content of the file if a callback is provided. Else it returns a stream with the file
   * @param {String} templateId Template Id to retrieve
   * @param {Function} callback
   */
  getTemplate: function (templateId, callback) {
    if (templateId == null) {
      return callback(new Error('Invalid template ID'));
    }

    // Create the stream before starting the request
    // So we can return it to the user
    let stream = StreamAnswer();

    request({
      method: 'GET',
      uri: `${_config.carboneUrl}template/${templateId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`
      }
    }).on('response', (response) => {
      parseStreamedResponse(response, (err) => {
        if (err) {
          return returnStreamOrCallbackError(err, stream, callback);
        }

        stream.setHeaders(response.headers);

        if (callback === undefined) {
          return response.pipe(stream);
        }

        let content = '';

        response.on('data', (chunk) => {
          content += chunk;
        });

        response.on('end', () => {
          return callback(null, content);
        });
      });
    }).on('error', (err) => {
      return returnStreamOrCallbackError(err, stream, callback);
    });

    return stream;
  },

  /**
   * Return the filename located in the headers response
   * @param {Object} streamedResponse Request response object
   */
  getTemplateFilename: function (streamedResponse) {
    if (streamedResponse.headers == null || streamedResponse.headers['content-disposition'] == null) {
      return null;
    }

    let contentDisposition = streamedResponse.headers['content-disposition'];
    let splitted = contentDisposition.split('=')

    if (splitted.length === 1) {
      return null;
    }

    let filename = splitted[1]
    filename = filename.substr(0, filename.length - 1);
    filename = filename.substr(1);
    return filename;
  }
};

module.exports = (apiKey) => {
  _apiKey = apiKey
  return sdkFunctions;
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
