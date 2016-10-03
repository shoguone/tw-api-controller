var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Twitter             =   require('twitter');
var _                   =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

/**
 * Returns a single Tweet, specified by the id parameter. The Tweet’s author will also be embedded within the tweet.
 * @param id The numerical ID of the desired Tweet
 * @param trimUser When set to either true, t or 1, each tweet returned in a timeline will include a user object including only the status authors numerical ID. Omit this parameter to receive the complete user object
 * @param includeMyRetweet When set to either true, t or 1, any Tweets returned that have been retweeted by the authenticating user will include an additional current_user_retweet node, containing the ID of the source status for the retweet
 * @param includeEntities The entities node will be disincluded when set to false
 */
function statusesShow(
    id,
    trimUser = false,
    includeMyRetweet = false,
    includeEntities = true
) {
    return async(() => {
        if (!id || !_.isString(id)) {
            throw new Error('`id` should be a String');
        }
        
        var account = aw(accountsService.get());
        if (!account) {
            throw new Error('Querying the Tw requires an `account`!');
        }
        var twitterAccount = account.twitterAccount;

        var twitterClient = new Twitter(twitterAccount);
        var queryObject = {
            id: id,
            trim_user: trimUser,
            include_my_retweet: includeMyRetweet,
            include_entities: includeEntities
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get('statuses/show', queryObject, function (err, data, response) {
                accountsService.release(account.id);
                if (err) {
                    // console.log('posts: ' + query + ' => fail');
                    reject(new TwitterError(err));
                }
                else {
                    // console.log('statuses/show: ' + id + ' => ok');
                    resolve(data);
                }
            });
        }));
        return data;
    })();
}

module.exports = statusesShow;