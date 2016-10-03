var Promise = require('promise');

var promiseWhile = function (condition, action) {
    return new Promise(function (resolve, reject) {
        var loop = function () {
            if (!condition()) {
                resolve();
                return;
            }
            return action()
                .then(function () {
                    return loop();
                });
        };
        loop();
    });
};

module.exports = promiseWhile;