let _config = {
  carboneUrl: 'https://render.carbone.io/',
  isReturningBuffer: true
};

module.exports = {
  config: _config,

  /**
   * Update the SDK configuration
   * @param {Object} userConfig User configuration
   */
  setOptions: function (userConfig) {
    _config = Object.assign(_config, userConfig)
  }
}
