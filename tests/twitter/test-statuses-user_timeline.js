var async                   = require('asyncawait/async');
var aw                      = require('asyncawait/await');

// var _                       = require('lodash');
var util                    = require('util');

let timeline                = require('../../components/twitter/statuses-user_timeline');

var RetriableError          = require('../../components/common/error/RetriableError');


let userIdOrName = 'pasha_uvarov';

let test = async(() => {
    try {
        var result = aw(timeline(
                userIdOrName,
                10
            ));
        console.log('timeline: ' + userIdOrName + ' => ' + result.length + ' results');
    } catch (err) {
        throw new RetriableError('Ошибка: ' + util.inspect(err, {depth: 3}));
    }
});

test()
    .then(() => {
        console.log('ok');
    })
    .catch((err) => {
        console.error(err);
    });

