const Transform = require('stream').Transform
const util = require('util')

function StreamAnswer (options) {
  this.content = '';
  this.headers = {};

  if (!(this instanceof StreamAnswer)) {
    return new StreamAnswer(options);
  }

  Transform.call(this, options);
}

util.inherits(StreamAnswer, Transform);

StreamAnswer.prototype.setHeaders = function (headers) {
  this.headers = headers;
}

StreamAnswer.prototype._transform = function (chunk, enc, callback) {
  this.push(chunk);
  return callback();
}

module.exports = StreamAnswer;
