var util    = require('util');

function TwitterError(array, message) {
    if (!message) {
        if (array && array.length == 1) {
            this.message = array[0].message;
        }
        else {
            this.message = 'Ошибка Twitter';
        }
    }
    this.errors = array;
    Error.captureStackTrace(this, TwitterError);
}

util.inherits(TwitterError, Error);
TwitterError.prototype.name = 'TwitterError';

module.exports = TwitterError;