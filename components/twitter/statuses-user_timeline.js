var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Twitter             =   require('twitter');
var _                   =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

/**
 * Лента пользователя.
 * По убыванию даты постов.
 * Для произвольного авторизованного юзера доступны только публичные пользователи.
 * Доступны 3200 последних сообщений.
 * @param account Querying the Tw requires an `account`!
 * @param userIdOrName обязательных параметров нет, но необходимо указать либо user_id, либо screen_name (The ID of the user for whom to return results for || The screen name of the user for whom to return results for)
 * @param count Specifies the number of tweets to try and retrieve, up to a maximum of 200 per distinct request. The value of count is best thought of as a limit to the number of tweets to return because suspended or deleted content is removed after the count has been applied. We include retweets in the count, even if include_rts is not supplied. It is recommended you always send include_rts=1 when using this API method.
 * @param sinceId Returns results with an ID greater than (that is, more recent than) the specified ID. There are limits to the number of Tweets which can be accessed through the API. If the limit of Tweets has occured since the since_id, the since_id will be forced to the oldest ID available.
 * @param maxId Returns results with an ID less than (that is, older than) or equal to the specified ID.
 * @param trimUser When set to either true, t or 1, each tweet returned in a timeline will include a user object including only the status authors numerical ID. Omit this parameter to receive the complete user object.
 * @param excludeReplies This parameter will prevent replies from appearing in the returned timeline. Using exclude_replies with the count parameter will mean you will receive up-to count tweets — this is because the count parameter retrieves that many tweets before filtering out retweets and replies. This parameter is only supported for JSON and XML responses.
 * @param contributorDetails This parameter enhances the contributors element of the status response to include the screen_name of the contributor. By default only the user_id of the contributor is included.
 * @param includeRts When set to false, the timeline will strip any native retweets (though they will still count toward both the maximal length of the timeline and the slice selected by the count parameter). Note: If you’re using the trim_user parameter in conjunction with include_rts, the retweets will still contain a full user object.
 */
function statusesUserTimeline(
    userIdOrName,
    count = 200,
    sinceId,
    maxId,
    trimUser = true,
    excludeReplies = false,
    contributorDetails = true,
    includeRts = true
) {
    return async(() => {
        if (!userIdOrName || !_.isString(userIdOrName)) {
            throw new Error('`query` should be a String');
        }
        
        if (!_.isNumber(count)) {
            var parseResult = parseInt(count);
            if (_.isNumber(parseResult)) {
                count = parseResult;
            }
            else {
                throw new Error('`limit` should be a Number');
            }
        }
        if (count < 1) {
            throw new Error('`limit` should be greater than 0');
        }
        
        if (!(trimUser == 't' || trimUser == 'true' || trimUser == '1' || trimUser == true || trimUser == 1 || trimUser == 'f' || trimUser == 'false' || trimUser == '0' || trimUser == false || trimUser == 0)) {
            throw new Error('trimUser should be null or true/false');
        }

        if (!(excludeReplies == true || excludeReplies == false)) {
            throw new Error('excludeReplies should be null or true/false');
        }

        if (!(contributorDetails == true || contributorDetails == false)) {
            throw new Error('contributorDetails should be null or true/false');
        }

        if (!(includeRts == true || includeRts == false)) {
            throw new Error('includeRts should be null or true/false');
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
            since_id: sinceId, 
            max_id: maxId, 
            count: count,
            trim_user: trimUser,
            exclude_replies: excludeReplies,
            contributor_details: contributorDetails,
            include_rts: includeRts
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get('statuses/user_timeline', queryObject, function (err, data, response) {
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
                    // console.log('timeline: ' + userIdOrName + ' => ' + data.length + ' results');
                    resolve(data);
                }
            });
        }));
        return data;
    })();
}

module.exports = statusesUserTimeline;
