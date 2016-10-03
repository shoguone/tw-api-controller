let async                   = require('asyncawait/async');
let aw                      = require('asyncawait/await');

let _                       = require('lodash');
let moment                  = require('moment');
let util                    = require('util');

let RetriableError          = require('../../common/error/RetriableError');

let statusesRetweets 	    = require('../../twitter/statuses-retweets');
let statusesShow 	        = require('../../twitter/statuses-show');

var filterOriginal          = require('../../twitter/analysis/filter-original');
let processPost             = require('../../twitter/analysis/process-post');
let unshortenUrls           = require('../../twitter/analysis/unshorten-urls');


function getPostContentFromPostUrl(statusId) {
    return async(() => {
        let requests;
        try {
            requests = aw([
                statusesRetweets(
                    statusId
                    // ,
                    // 10
                ),
                statusesShow(
                    statusId
                )
            ]);
        } catch (error) {
            throw new RetriableError(`Bad content/post request: ${util.inspect(error, {depth: 3})}`);
        }
        
        let retweets = requests[0];
        retweets = retweets.map(it => {
            let createdAt = moment(it.created_at, 'ddd MMM DD HH:mm:ss Z YYYY');
            return {
                tweetId: it.id_str,
                userScreenName: it.user.screen_name,
                userName: it.user.name,
                createdAt: createdAt.toISOString()
            };
        });

        let it = requests[1];

        let filteredResult = [];
        try {
            filteredResult = aw(filterOriginal(it));
        } catch (filterError) {
            console.error(`почему-то не получилось отфильтровать лишние (${util.inspect(filterError, {depth: 3})})`);
        }
        if (filteredResult.length > 0)
            it = filteredResult[0];
        
        if (!it.retweets) {
            it.retweets = [];
        }
        it.retweets = _.chain(it.retweets)
            .concat(retweets)
            .filter(_.isObject)
            .uniqWith(_.isEqual)
            .value();

        let uurls = {};
        try {
            uurls = aw(unshortenUrls(it));
        } catch (error) {
            console.error(error);
        }

        it = processPost(it, uurls);
        it.hasContent = true;
        return it;
    })();
}


module.exports = getPostContentFromPostUrl;
