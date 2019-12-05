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
  },

  /**
   * Remove a path with it's hash from cache
   * @param {String} path Path to remove from cache
   */
  clearTemplateCache: function (path) {
    if (cache !== null) {
      cache.delete(path);
    }
  }
}

module.exports = cacheFunctions;
