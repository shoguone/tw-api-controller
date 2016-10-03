var util    = require('util');

function MessageError(array, message) {
    if (!message) {
        if (array && array.length == 1) {
            this.message = array[0].message;
        }
        else {
            this.message = 'Ошибка Twitter';
        }
    }
    this.errors = array;
    Error.captureStackTrace(this, MessageError);
}

util.inherits(MessageError, Error);
MessageError.prototype.name = 'MessageError';

module.exports = MessageError;