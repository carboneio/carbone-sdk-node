const get               = require('simple-get');
const templates         = require('./templates');
const fs                = require('fs');
const StreamAnswer      = require('./streamAnswer');
const cache             = require('./cache');
const crypto            = require('crypto');
const utils             = require('./utils');
const sdkConfig         = require('./config');
const config            = sdkConfig.config;

let _apiKey = null;
let _cache = null;
let _templatesFunction = null;

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
   * @param {String} template Template ID, or Path, or URL, or Buffer
   * @param {Object} data Data to send to carbone render
   * @param {Object} [options] optional object to overwrite global options: { "headers" : { "carbone-webhook-url" : "https://" }
   * @param {Function} callback
   */
  render: function (template, data, options, callback) {
    if (options instanceof Function) {
      callback = options;
      options = {};
    }
    // Create stream if no callback is passed in parameter
    let stream = StreamAnswer();
    
    utils.getTemplateAsBuffer(template, options, function(err, template) {
      if (err) {
        return utils.returnStreamOrCallbackError(err, stream, callback);
      }
      if (Buffer.isBuffer(template) === true && options?.headers?.['carbone-template-delete-after'] + '' === '0') {
        data.template = utils.bufferToBase64(template);
        renderFunctions._renderWithTemplateId('template', null, data, stream, callback, options);
      } else if (Buffer.isBuffer(template) === true) {
        _templatesFunction.addTemplate(template, data.payload, (err, templateID) => {
          if (err) {
            return utils.returnStreamOrCallbackError(err, stream, callback);
          }
          renderFunctions._renderWithTemplateId(templateID, null, data, stream, callback, options);
        });
      } else if (typeof template === 'string' && utils.checkPathIsAbsolute(template)) {
        renderFunctions._calculateHash(template, data.payload, (err, hash) => {
          if (err) {
            return utils.returnStreamOrCallbackError(err, stream, callback);
          }

          renderFunctions._renderWithTemplateId(hash, template, data, stream, callback, options);
        });
      } else if (typeof template === 'string' && template.length === 64) {
        renderFunctions._renderWithTemplateId(template, null, data, stream, callback, options);
      } else {
        return utils.returnStreamOrCallbackError(new Error('The template must be: a template ID, or template URL, or template absolute path, or a template as Buffer'), stream, callback);
      }

    })
    return stream;
  },
  /**
   * Render a template with the template ID
   * @param {String} templateId Template ID
   * @param {Object} data Data to render with the template
   * @param {Stream} stream Stream response
   * @param {Function} callback
   * @param {Object} options overwrite global options. Example : { headers : { carbone-webhook-url : 'https://' }
   * @param {Boolean} _retry Check if the request has already been retried
   */
  _renderWithTemplateId: function (templateId, filePath, data, stream, callback, options = {}, _retries = 0) {
    get.concat({
      method: 'POST',
      url: `${config.carboneUrl}render/${templateId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`,
        'carbone-version': sdkConfig.getVersion(),
        'content-type': 'application/json',
        ...config.headers,
        ...options.headers
      },
      json: false, // if true, simple-get tries to Parse the response
      body: JSON.stringify(data)
    }, (err, response, body) => {
      if (err) {
        if ( _retries < config.retriesOnError &&
          (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT' ||
           err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'EPIPE')) {
          return setTimeout(() => {
            renderFunctions._renderWithTemplateId(templateId, filePath, data, stream, callback, options, _retries + 1);
          }, config.retriesIntervalOnError);
        }
        return utils.returnStreamOrCallbackError(err, stream, callback);
      }

      // Check the file exists, else upload it and render it
      if (response.statusCode === 404 && filePath !== null) {

        return _templatesFunction.addTemplate(filePath, data.payload, (err, newTemplateId) => {
          if (err) {
            return utils.returnStreamOrCallbackError(err, stream, callback);
          }

          renderFunctions._renderWithTemplateId(newTemplateId, filePath, data, stream, callback, options, _retries);
        });
      }

      if (options?.headers?.['carbone-webhook-url']?.length > 0 || config?.headers?.['carbone-webhook-url']?.length) {
        if (callback) {
          return callback(null, 'A render ID will be sent to your webhook URL when the document is generated.', '');
        }
        return stream.end();
      }
      return utils.parseResponse(response, body, undefined, true, (err, data) => {
        if (err) {
          return utils.returnStreamOrCallbackError(err, stream, callback);
        }

        if (data == undefined) {
          return utils.returnStreamOrCallbackError(new Error('Invalid data'), stream, callback);
        }

        let filename = data.renderId;
        // If user gave a callback and wants a link, return it
        if (callback !== undefined && !config.isReturningBuffer) {
          return callback(null, `https://api.carbone.io/render/${data.renderId}`, filename);
        }
        return renderFunctions._getRenderedReport(data.renderId, stream, callback);
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
    get({
      method: 'GET',
      url: `${config.carboneUrl}render/${renderId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`,
        'carbone-version': sdkConfig.getVersion()
      }
    }, function(err, response) {
      if (err) {
        if (err.code === 'ECONNRESET' && _retry === false) {
          return renderFunctions._getRenderedReport(renderId, stream, callback, true);
        }
        return utils.returnStreamOrCallbackError(err, stream, callback);
      }
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
          return callback(null, Buffer.concat(buffers), renderFunctions.getFilename({ headers: response.headers }));
        });
      });
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
      hash = hash.update(Buffer.from(payload));
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
  _templatesFunction = templates(apiKey);
  return renderFunctions;
}
