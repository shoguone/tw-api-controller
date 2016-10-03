var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Twitter             =   require('twitter');
var _                   =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

// TODO : working with cursor

/**
 * Возвращает подписчиков указанного пользователя в страничном (курсоровом) представлении.
 * Результаты в порядке убывания даты (времени) подписки последователя (самые новые - самые первые: Вася подписался вчера, Петя — позавчера, первым будет Вася, вторым — Петя).
 * Если "protected user", то возвращает ошибку "401	Unauthorized"
 * @param userIdOrName обязательных параметров нет, но необходимо указать либо user_id, либо screen_name
 * The ID of the user for whom to return results for
 * The screen name of the user for whom to return results for
 * @param followersType Кого хотим? 'followers' || 'friends'
 * @param count The number of users to return per page, up to a maximum of 200. Defaults to 20 (а у нас = 200)
 * @param cursor Causes the results to be broken into pages. If no cursor is provided, a value of -1 will be assumed, which is the first “page.”
 * The response from the API will include a previous_cursor and next_cursor to allow paging back and forth. See Using cursors to navigate collections for more information
 * @param skipStatus When set to either true, t or 1, statuses will not be included in the returned user objects. If set to any other value, statuses will be included
 * @param includeUserEntries The user object entities node will not be included when set to false
 */
function followersList(
    userIdOrName,
    followersType = 'followers',
    count = 200,
    cursor = -1,
    skipStatus = false,
    includeUserEntries = true
) {
    return async(() => {
        if (followersType != 'followers' && followersType != 'friends') {
            throw new Error('`followersType` should be either "followers" or "friends"!');
        }

        if (!userIdOrName || !_.isString(userIdOrName)) {
            throw new Error('`userIdOrName` should be a String');
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
        // TODO : если count > 200 ?!
        
        var userId;
        var userName;
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
            cursor: cursor, 
            count: count,
            skip_status: skipStatus,
            include_user_entities: includeUserEntries
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get(`${followersType}/list`, queryObject, function (err, data, response) {
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

module.exports = followersList;