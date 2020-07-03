const cache             = require('./cache');
const templatesFunction = require('./templates');
const renderFunctions   = require('./render');
const promiseFunctions  = require('./promise');
const sdkConfig         = require('./config');

module.exports = (apiKey) => {
  let _cache = cache.getInstance();

  let allFunctions = Object.assign({}, templatesFunction(apiKey));

  allFunctions = Object.assign(allFunctions, renderFunctions(apiKey));
  allFunctions = Object.assign(allFunctions, promiseFunctions(apiKey));

  allFunctions.setOptions = sdkConfig.setOptions;
  allFunctions.setApiVersion = sdkConfig.setApiVersion;
  allFunctions.clearTemplateCache = cache.clearTemplateCache;

  // Only for test purpose
  allFunctions._getCache = function () {
    return _cache;
  };

  return allFunctions;
}
