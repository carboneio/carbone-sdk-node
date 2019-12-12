module.exports = {
  /**
   * Return the absolute path of the file
   * @param {String} localPath User filepath
   */
  checkPathIsAbsolute: function (localPath) {
    if (localPath.startsWith('/')) {
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
          console.error('Body parsed ', body);
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
  }
}
