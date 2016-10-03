var async               = require('asyncawait/async');
var aw                  = require('asyncawait/await');

var Promise =   require('promise');
var Twitter =   require('twitter');
var moment  =   require('moment');
// var util    =   require('util');
var _       =   require('lodash');

var accountsService     = require('./accounts-service');
var TwitterError        = require('../common/error/TwitterError');

/**
 * Returns a collection of relevant Tweets matching a specified query
 * @param query A UTF-8, URL-encoded search query of 500 characters maximum, including operators. Queries may additionally be limited by complexity
 * @param count The number of tweets to return per page, up to a maximum of 100. Defaults to 15. This was formerly the “rpp” parameter in the old Search API
 * @param sinceId Returns results with an ID greater than (that is, more recent than) the specified ID. There are limits to the number of Tweets which can be accessed through the API. If the limit of Tweets has occured since the since_id, the since_id will be forced to the oldest ID available
 * @param maxId Returns results with an ID less than (that is, older than) or equal to the specified ID
 * @param since superhero since:2015-12-21 => containing “superhero” and sent since date “2015-12-21” (year-month-day)
 Интересно, что введённые несколько раз since/until обрабатываются корректно, причём выбирают самый узкий промежуток:
“since:2016-02-09 since:2016-02-20 until:2016-03-04 until:2016-03-14” приведёт к поиску с 20 февраля по 4 марта
* @param until puppy until:2015-12-21 => containing “puppy” and sent before the date “2015-12-21”
Интересно, что введённые несколько раз since/until обрабатываются корректно, причём выбирают самый узкий промежуток:
“since:2016-02-09 since:2016-02-20 until:2016-03-04 until:2016-03-14” приведёт к поиску с 20 февраля по 4 марта
 */
function searchTweets(
    query,
    count,
    sinceId,
    maxId,
    since,
    until
) {
    return async(() => {
        if (!_.isString(query)) {
            reject('`query` should be a String');
            return;
        }
        
        if (!_.isNumber(count)) {
            var parseResult = parseInt(count);
            if (_.isNumber(parseResult))
            {
                count = parseResult;
            }
            else
            {
                reject('`limit` should be a Number');
                return;
            }
        }
        if (count < 1) {
            reject('`limit` should be greater than 0');
            return;
        }
        if (!sinceId || sinceId == '0')
            sinceId = '';
        if (!maxId || maxId == '0')
            maxId = '';
        
        if (since) {
            var sinceDate = new Date(since);
            var sinceMoment = moment(sinceDate);
            if (sinceMoment.isValid()) {
                query += ' since:' + sinceMoment.format('YYYY-MM-DD');
            }
            else {
                sinceDate = moment(since);
                sinceMoment = moment(sinceDate);
                if (sinceMoment.isValid())
                {
                    query += ' since:' + sinceMoment.format('YYYY-MM-DD');
                }
            }
        }
        
        if (until) {
            var untilDate = new Date(until);
            var untilMoment = moment(untilDate);
            if (untilMoment.isValid()) {
                query += ' until:' + untilMoment.format('YYYY-MM-DD');
            }
            else {
                untilDate = moment(until);
                untilMoment = moment(untilDate);
                if (untilMoment.isValid()) {
                    query += ' until:' + untilMoment.format('YYYY-MM-DD');
                }
            }
        }
        
        var account = aw(accountsService.get());
        if (!account) {
            throw new Error('Querying the Tw requires an `account`!');
        }
        var twitterAccount = account.twitterAccount;

        var twitterClient = new Twitter(twitterAccount);
        var queryObject = {
            q: query, 
            since_id: sinceId, 
            max_id: maxId, 
            count: count
        };
        
        var data = aw(new Promise((resolve, reject) => {
            twitterClient.get('search/tweets', queryObject, function (err, data, response) {
                accountsService.release(account.id);
                if (err) {
                    // console.log('posts: ' + query + ' => fail');
                    reject(new TwitterError(err));
                }
                else {
                    let statuses = data.statuses;
                    if (!statuses) {
                        try {
                            let parsedData = JSON.parse(data);
                            statuses = parsedData.statuses;
                        } catch (error) {
                            statuses = [];
                        }
                    }
                    console.log('posts: ' + query + ' => ' + statuses.length + ' results');
                    resolve(data.statuses);
                }
            });
        }));
        return data;
    })();
}
module.exports = searchTweets;
