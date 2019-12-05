const request           = require('request');
const fs                = require('fs');
const path              = require('path');
const Transform         = require('stream').Transform;
const StreamAnswer      = require('./streamAnswer');
const cache             = require('./cache');
const crypto            = require('crypto');
const templatesFunction = require('./templates');
const renderFunctions   = require('./render');
const utils             = require('./utils');
const sdkConfig         = require('./config');
const config            = sdkConfig.config;

module.exports = (apiKey) => {
  let _cache = cache.getInstance();

  let allFunctions = Object.assign({}, templatesFunction(apiKey));

  allFunctions = Object.assign(allFunctions, renderFunctions(apiKey));

  allFunctions.setOptions = sdkConfig.setOptions;
  allFunctions.clearTemplateCache = cache.clearTemplateCache;

  // Only for test purpose
  allFunctions._getCache = function () {
    return _cache;
  };

  return allFunctions;
}
