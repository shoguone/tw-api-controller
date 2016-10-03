var async                   = require('asyncawait/async');
var aw                      = require('asyncawait/await');

// var _                       = require('lodash');
var util                    = require('util');

let followers               = require('../../components/twitter/followers-list');

var RetriableError          = require('../../components/common/error/RetriableError');


// let userIdOrName = 'pasha_uvarov';
// let userIdOrName = 'Tombx7M';
// let userIdOrName = 'ghbdtn_z_vfylf';
let userIdOrName = 'kletnevapolina';//protected
// let followersType = 'followers';
let followersType = 'friends';

let test = async(() => {
    try {
        var result = aw(followers(
                userIdOrName,
                followersType,
                10
            ));
        console.log(`${followersType}: ${userIdOrName} => ${result.users.length} results`);
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

