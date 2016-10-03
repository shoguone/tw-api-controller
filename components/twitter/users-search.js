var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Promise =   require('promise');
var Twitter =   require('twitter');
var _       =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

/**
 * Только публичные аккаунты.
Поиск по точному соответствию не поддерживается.
Досутпны первые 1000 результатов
 * @param query The search query to run against people search
 * @param count The number of potential user results to retrieve per page. This value has a maximum of 20
 * @param page Specifies the page of results to retrieve
 */
function usersSearch(
    query,
    count,
    page
) {
    return async(() => {
        if (!_.isString(query)) {
            reject('`query` should be a String');
            return;
        }
        
        if (!_.isNumber(count)) {
            var parseResult = parseInt(count);
            if (_.isNumber(parseResult)) {
                count = parseResult;
            }
            else {
                reject('`limit` should be a Number');
                return;
            }
        }
        if (count < 1) {
            reject('`limit` should be greater than 0');
            return;
        }
        
        if (!_.isNumber(page)) {
            var parseResult = parseInt(page);
            if (_.isNumber(parseResult)) {
                page = parseResult;
            }
            else {
                reject('`page` should be a Number');
                return;
            }
        }
        if (page < 0) {
            reject('`page` can\'t be less than 0');
            return;
        }
        
        var account = aw(accountsService.get());
        if (!account) {
            throw new Error('Querying the Tw requires an `account`!');
        }
        var twitterAccount = account.twitterAccount;

        var twitterClient = new Twitter(twitterAccount);
        var queryObject = {
            q: query,
            page: page,
            count: count
            // include_entities: false
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get('users/search', queryObject, function (err, data, response) {
                accountsService.release(account.id);
                if (err) {
                    // console.log('users: ' + query + ' => fail');
                    reject(new TwitterError(err));
                }
                else {
                    console.log('users: ' + query + ' => ' + data.length + ' results');
                    resolve(data);
                }
            });
        }));
        return data;
    })();
}

module.exports = usersSearch;
