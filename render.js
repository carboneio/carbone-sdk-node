const request           = require('request');
const fs                = require('fs');
const path              = require('path');
const Transform         = require('stream').Transform;
const StreamAnswer      = require('./streamAnswer');
const cache             = require('./cache');
const crypto            = require('crypto');
const utils             = require('./utils');
const sdkConfig         = require('./config');
const config            = sdkConfig.config;

let _apiKey = null;
let _cache = null;

const renderFunctions = {
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
   * Render a template
   * @param {String} pathOrId Template path or template ID
   * @param {Object} data Data to send to carbone render
   * @param {Function} callback
   */
  render: function (pathOrId, data, callback) {
    // Create stream if no callback is passed in parameter
    let stream = StreamAnswer();

    if (pathOrId.startsWith('/')) {
      this._calculateHash(pathOrId, data.payload, (err, hash) => {
        if (err) {
          return utils.returnStreamOrCallbackError(err, stream, callback);
        }

        this._renderWithTemplateId(hash, pathOrId, data, stream, callback);
      });
    } else {
      this._renderWithTemplateId(pathOrId, null, data, stream, callback);
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
  _renderWithTemplateId: function (templateId, filePath, data, stream, callback, _retry = false) {
    let _headers = {
      authorization: `Bearer ${_apiKey}`,
      'x-from-proxy': true
    };

    if (sdkConfig.getVersion() !== null) {
      _headers['carbone-version'] = sdkConfig.getVersion();
    }

    request({
      method: 'POST',
      uri: `${config.carboneUrl}render/${templateId}`,
      headers: _headers,
      json: true,
      body: data
    }, (err, response, body) => {
      if (err) {
        if (err.code === 'ECONNRESET' && _retry === false) {
          return this._renderWithTemplateId(templateId, null, data, stream, callback, true);
        }

        return utils.returnStreamOrCallbackError(err, stream, callback);
      }

      // Check the file exists, else upload it and render it
      if (response.statusCode === 404 && filePath !== null) {
        return this.addTemplate(filePath, data.payload, (err, newTemplateId) => {
          if (err) {
            return utils.returnStreamOrCallbackError(err, stream, callback);
          }

          this._renderWithTemplateId(newTemplateId, filePath, data, stream, callback, _retry);
        });
      }

      return utils.parseResponse(response, body, undefined, false, (err, data) => {
        if (err) {
          return utils.returnStreamOrCallbackError(err, stream, callback);
        }

        if (data == undefined) {
          return utils.returnStreamOrCallbackError(new Error('Invalid data'), stream, callback);
        }

        let filename = data.renderId + '.' + data.inputFileExtension;

        // If user gave a callback and wants a link, return it
        if (callback !== undefined && !config.isReturningBuffer) {
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
      uri: `${config.carboneUrl}render/${renderId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`
      }
    }).on('response', (response) => {
      utils.parseStreamedResponse(response, (err) => {
        if (err) {
          return utils.returnStreamOrCallbackError(err, stream, callback);
        }

        stream.setHeaders(response.headers);

        if (callback === undefined) {
          return response.pipe(stream);
        }

        let buffers = [];

        response.on('data', (chunk) => {
          buffers.push(chunk)
        });

        response.on('end', () => {
          return callback(null, Buffer.concat(buffers), this.getFilename({ headers: response.headers }));
        });
      });
    }).on('error', (err) => {
      if (err && err.code === 'ECONNRESET' && _retry === false) {
        return this._getRenderedReport(renderId, stream, callback, true);
      }

      return utils.returnStreamOrCallbackError(err, stream, callback);
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

    const fd = fs.createReadStream(filePath);

    let hash = crypto.createHash('sha256');
    hash.setEncoding('hex');

    if (payload != null && payload.length > 0) {
      hash = hash.update(new Buffer(payload));
    }

    fd.on('error', (err) => {
      return callback(err);
    });

    hash.on('finish', () => {
      hash = hash.read();
      _cache.set(_cacheKey, hash);
      return callback(null, hash);
    });

    fd.pipe(hash);
}
};

module.exports = (apiKey) => {
  _apiKey = apiKey;
  _cache = cache.getInstance();

  return renderFunctions;
}
