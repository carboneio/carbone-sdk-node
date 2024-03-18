const templates = require('./templates');
const render    = require('./render');

let templatesFunction = null;
let renderFunction = null;

const templatePromiseFunctions = {
  /**
   * Add a template on Carbone engine
   * @param {String} localPath User filepath
   * @param {String} payload User payload
   */
  addTemplatePromise: function (localPath, payload) {
    return new Promise((resolve, reject) => {
      templatesFunction.addTemplate(localPath, payload, (err, templateId) => {
        if (err) {
          return reject(err);
        }

        return resolve(templateId);
      });
    });
  },

  /**
   * Return the content of the file
   * @param {String} templateId Template Id to retrieve
   */
  getTemplatePromise: function (templateId) {
    return new Promise((resolve, reject) => {
      templatesFunction.getTemplate(templateId, (err, content) => {
        if (err) {
          return reject(err);
        }

        return resolve(content);
      });
    });
  },

  /**
   * Delete a template with the templateID
   * @param {String} templateId Template ID to delete
   */
  delTemplatePromise: function (templateId) {
    return new Promise((resolve, reject) => {
      templatesFunction.delTemplate(templateId, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve()
      })
    });
  },

  /**
   * Render a template
   * @param {String} pathOrId Template path or template ID
   * @param {Object} data Data to send to carbone render
   * @param {Object} [options] optional object to overwrite global options: { "headers" : { "carbone-webhook-url" : "https://" }
   */
  renderPromise: function (pathOrId, data, options) {
    return new Promise((resolve, reject) => {
      renderFunction.render(pathOrId, data, options, (err, content, filename) => {
        if (err) {
          return reject(err);
        }

        return resolve({
          content: content,
          filename: filename
        });
      });
    });
  }
}

module.exports = (apiKey) => {
  templatesFunction = templates(apiKey);
  renderFunction = render(apiKey);
  return templatePromiseFunctions;
}
