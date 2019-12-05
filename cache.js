const Cache = require('kitten-cache');

let cache = null;

const cacheFunctions = {
  /**
   * Return an instance of kitten cache
   */
  getInstance: function () {
    if (cache === null) {
      cache = new Cache();
    }

    return cache;
  }
}

module.exports = cacheFunctions;
