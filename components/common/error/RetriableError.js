var util    = require('util');

function RetriableError(message) {
    this.message = message;
    this.retry = true;
    Error.captureStackTrace(this, RetriableError);
}

util.inherits(RetriableError, Error);
RetriableError.prototype.name = 'RetriableError';

module.exports = RetriableError;