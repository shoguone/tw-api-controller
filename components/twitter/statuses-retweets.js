var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Twitter             =   require('twitter');
var _                   =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

// TODO : working with cursor

/**
 * Returns a collection of the 100 most recent retweets of the tweet specified by the id parameter
 * @param id The numerical ID of the desired status.
 * @param count Specifies the number of records to retrieve. Must be less than or equal to 100
 * @param trimUser When set to either true, t or 1, each tweet returned in a timeline will include a user object including only the status authors numerical ID. Omit this parameter to receive the complete user object
 */
function statusesRetweets(
    id,
    count = 100,
    trimUser = false
) {
    return async(() => {
        if (!id || !_.isString(id)) {
            throw new Error('`id` should be a String');
        }
        
        if (!_.isNumber(count)) {
            var parseResult = parseInt(count);
            if (_.isNumber(parseResult)) {
                count = parseResult;
            }
            else {
                throw new Error('`count` should be a Number');
            }
        }
        if (count < 1) {
            throw new Error('`count` should be greater than 0');
        }
        // TODO : если count > 100 ?!
        
        var account = aw(accountsService.get());
        if (!account) {
            throw new Error('Querying the Tw requires an `account`!');
        }
        var twitterAccount = account.twitterAccount;

        var twitterClient = new Twitter(twitterAccount);
        var queryObject = {
            // id: id,
            count: count,
            trim_user: trimUser
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get(`statuses/retweets/${id}`, queryObject, function (err, data, response) {
                accountsService.release(account.id);
                if (err) {
                    if (err.message == 'Status Code: 401') {
                        data.code = 401;
                        resolve(data);
                    }
                    else {
                        // console.log('posts: ' + query + ' => fail');
                        reject(new TwitterError(err));
                    }
                }
                else {
                    resolve(data);
                }
            });
        }));
        return data;
    })();
}

module.exports = statusesRetweets;