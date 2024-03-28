const get               = require('simple-get');
const FormData          = require('form-data')
const utils             = require('./utils');
const sdkConfig         = require('./config');
const config            = sdkConfig.config;
const fs                = require('fs');
const StreamAnswer      = require('./streamAnswer');

let _apiKey = null;

const templateFunctions = {
    /**
   * Upload user template
   * @param {String} template User filepath
   * @param {String} payload User payload
   * @param {Function} callback
   * @param {Boolean} _retry False if the request has not been retry
   */
  addTemplate: function (template, payload, callback, _retry = false) {
    if (callback === undefined) {
      callback = payload;
      payload = '';
    }

    if (payload == null) {
      payload = '';
    }

    utils.getTemplateAsBuffer(template, null, (err, template) => {
      if (err) {
        return callback(err);
      }
  
      if (Buffer.isBuffer(template) === false && typeof template === 'string' && !utils.checkPathIsAbsolute(template)) {
        return callback(new Error('The template must be either: An absolute path, URL or a Buffer'));
      }

      const _readStream = Buffer.isBuffer(template) === true ? utils.bufferToReadStream(template) : fs.createReadStream(template);

      const form = new FormData()
      form.append('payload', payload)
      form.append('template', _readStream)

      return get.concat({
        method: 'POST',
        url: `${config.carboneUrl}template`,
        body: form,
        headers: {
          authorization: `Bearer ${_apiKey}`,
          "content-type": form.getHeaders()['content-type'],
          'carbone-version': sdkConfig.getVersion(),
          ...config.headers
        }
      }, function (err, response, body) {
        if (err) {
          if (err.code === 'ECONNRESET' && !_retry) {
            return templateFunctions.addTemplate(template, payload, callback, true);
          }
          return callback(err);
        }
        return utils.parseResponse(response, body, 'templateId', true, callback);
      })
    })
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

    get.concat({
      method: 'DELETE',
      url: `${config.carboneUrl}template/${templateId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`,
        'carbone-version': sdkConfig.getVersion(),
        ...config.headers
      }
    }, (err, response, body) => {
      if (err) {
        if (err.code === 'ECONNRESET' && !_retry) {
          return templateFunctions.delTemplate(templateId, callback, true);
        }
        return callback(err);
      }
      return utils.parseResponse(response, body, undefined, true, callback);
    })
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

    get({
      method: 'GET',
      url: `${config.carboneUrl}template/${templateId}`,
      headers: {
        authorization: `Bearer ${_apiKey}`,
        'carbone-version': sdkConfig.getVersion(),
        ...config.headers
      }
    }, function(err, response) {
      if (err) {
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
          buffers.push(chunk);
        });

        response.on('end', () => {
          return callback(null, Buffer.concat(buffers));
        });
      });
    })
    return stream;
  }
}

module.exports = (apiKey) => {
  _apiKey = apiKey;
  return templateFunctions;
}
