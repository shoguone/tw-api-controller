var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Twitter             =   require('twitter');
var _                   =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

/**
 * Returns a variety of information about the user specified by the required user_id or screen_name parameter. The author’s most recent Tweet will be returned inline when possible.
 * @param userIdOrName обязательных параметров нет, но необходимо указать либо user_id, либо screen_name
 * @param includeEntities The entities node will be disincluded when set to false
 */
function usersShow(
    userIdOrName,
    includeEntities = true
) {
    return async(() => {
        if (!userIdOrName || !_.isString(userIdOrName)) {
            throw new Error('`query` should be a String');
        }
        
        var userId = '';
        var userName = '';
        var isName = /[^\d]/.test(userIdOrName);
        if (isName) {
            userName = userIdOrName;
        }
        else {
            userId = userIdOrName;
        }

        var account = aw(accountsService.get());
        if (!account) {
            throw new Error('Querying the Tw requires an `account`!');
        }
        var twitterAccount = account.twitterAccount;

        var twitterClient = new Twitter(twitterAccount);
        var queryObject = {
            user_id: userId,
            screen_name: userName, 
            include_entities: includeEntities
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get('users/show', queryObject, function (err, data, response) {
                accountsService.release(account.id);
                if (err) {
                    // console.log('posts: ' + query + ' => fail');
                    reject(new TwitterError(err));
                }
                else {
                    // console.log('timeline: ' + userIdOrName + ' => ' + data.length + ' results');
                    resolve(data);
                }
            });
        }));
        return data;
    })();
}

module.exports = usersShow;