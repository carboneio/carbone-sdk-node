const request = require('request');
const fs = require('fs');
const path = require('path');
const Transform = require('stream').Transform;
const StreamAnswer = require('./streamAnswer');
const cache = require('./cache');
const crypto = require('crypto');

let _apiKey = '';
let _cache = null;
let _config = {
  carboneUrl: 'https://render.carbone.io/',
  isReturningBuffer: true
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

  return callback(null, body.data);
}

function parseStreamedResponse (response, callback) {
  if (response.statusCode === 404) {
    return callback(new Error('File not found'));
  } else if (response.statusCode !== 200) {
    return callback(new Error(`Error ${response.statusCode}: an error occured`));
  }

  return callback(null);
}

function returnStreamOrCallbackError (error, stream, callback) {
  if (callback) {
    return callback(error);
  }

  return stream.emit('error', error);
}

const sdkFunctions = {
  config: function (userConfig) {
    _config = Object.assign(_config, userConfig)
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
    // Create the stream before starting the request
    // So we can return it to the user
    let stream = StreamAnswer();

    if (templateId == null && callback !== undefined) {
      return callback(new Error('Invalid template ID'));
    }

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
  getFilename: function (streamedResponse) {
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
  },

  /**
   * Remove a path with it's hash from cache
   * @param {String} path Path to remove from cache
   */
  clearTemplateCache: function (path) {
    _cache.delete(path);
  },

  /**
   * Render a template
   * @param {String} pathOrId Template path or template ID
   * @param {Object} data Data to send to carbone render
   * @param {Function} callback
   */
  render: function (pathOrId, data, callback) {
    let stream;

    // Create stream if no callback is passed in parameter
    stream = StreamAnswer();

    if (pathOrId.startsWith('/')) {
      this._calculateHash(pathOrId, data.payload, (err, hash) => {
        if (err) {
          return returnStreamOrCallbackError(err, stream, callback);
        }

        this._renderWithTemplateId(hash, data, stream, callback);
      });
    } else {
      this._renderWithTemplateId(pathOrId, data, stream, callback);
    }

    return stream;
  },

  /**
   * Render a template with the template ID
   * @param {String} templateId Template ID
   * @param {Object} data Data to render with the template
   * @param {Stream} stream Stream response
   * @param {Function} callback
   * @param {Boolean} _retry Check if the request has already been retried
   */
  _renderWithTemplateId: function (templateId, data, stream, callback, _retry = false) {
    request({
      method: 'POST',
      uri: `${_config.carboneUrl}render/${templateId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`
      }
    }, (err, response, body) => {
      if (err) {
        if (err.code === 'ECONNRESET' && _retry === false) {
          return this._renderWithTemplateId(templateId, data, stream, callback, true);
        }

        return returnStreamOrCallbackError(err, stream, callback);
      }

      return parseResponse(response, body, undefined, (err, data) => {
        if (err) {
          return returnStreamOrCallbackError(err, stream, callback);
        }

        let filename = data.renderId + '.' + data.inputFileExtension;

        // If user gave a callback and wants a link, return it
        if (callback !== undefined && !_config.isReturningBuffer) {
          return callback(null, `https://render.carbone.io/render/${data.renderId}`, filename);
        }

        return this._getRenderedReport(data.renderId, stream, callback);
      });
    });

    if (callback === undefined) {
      return stream;
    }
  },

  /**
   * Return the content of the rendered report
   * @param {String} renderId Render ID return by the render function
   * @param {Stream} stream Stream response
   * @param {Function} callback
   * @param {Boolean} _retry Check if the request has already been retried
   */
  _getRenderedReport: function (renderId, stream, callback, _retry = false) {
    request({
      method: 'GET',
      uri: `${_config.carboneUrl}render/${renderId}`,
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
          return callback(null, content, this.getFilename({ headers: response.headers }));
        });
      });
    }).on('error', (err) => {
      if (err && err.code === 'ECONNRESET' && _retry === false) {
        return this._getRenderedReport(renderId, stream, callback, true);
      }

      return returnStreamOrCallbackError(err, stream, callback);
    });
  },

  /**
   * Return a hash of the file with the payload
   * @param {String} filePath File to read
   * @param {String} payload Hash payload
   * @param {Function} callback
   */
  _calculateHash: function (filePath, payload, callback) {
    if (payload == null) {
      payload = '';
    }

    let _cacheKey = filePath + payload

    if (_cache.has(_cacheKey)) {
      return callback(null, _cache.get(_cacheKey));
    }

    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return callback(err);
      }

      let hash = crypto.createHash('sha256');

      if (payload != null && payload.length > 0) {
        hash = hash.update(new Buffer(payload))
      }

      hash = hash.update(content)
        .digest('hex');
      _cache.set(_cacheKey, hash);
      return callback(null, hash)
    });
  },

  /**
   * Return the cache object (only for test purpose)
   */
  _getCache: function () {
    return _cache;
  }
};

module.exports = (apiKey) => {
  _apiKey = apiKey;
  _cache = cache.getInstance();
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
