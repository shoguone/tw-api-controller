let async                   = require('asyncawait/async');
let aw                      = require('asyncawait/await');

let _                       = require('lodash');
let util                    = require('util');

let config                  = require('../../../config');
let RetriableError          = require('../../common/error/RetriableError');

let searchTweets 	        = require('../../twitter/search-tweets');

let findMinMaxIds           = require('../../util/find-min-max-field');
let filterOriginal          = require('../../twitter/analysis/filter-original');
let processPost             = require('../../twitter/analysis/process-post');
let unshortenUrls           = require('../../twitter/analysis/unshorten-urls');



/** Перевод `High resolution` формата времени в секунды */
let hrSeconds = function (hrTime) {
    return (hrTime[0] * 1e3 + hrTime[1] / 1e6).toFixed(2);
};

/**
 * ...
 * @param query : {
 *      text, 
 *      sources[], 
 *      dateFrom, 
 *      dateTo, 
 *      region, 
 *      params 
 *  }
 * @param limit - кол-во
 * @param ctx : {
 *      backwardsMinId,
 *      minId,
 *      maxId
 *  }
 * @returns {Promise} : {
 *      previews,
 *      ctx
 *  } 
 */
function getPreviews(query, limit, ctx, insertPhotosIntoHtml = false, extendedReposts = false) {
    return async(() => {
        let queryText = _.get(query, 'text');
        let since = _.get(query, 'dateFrom');
        let until = _.get(query, 'dateTo');
        // TODO : Добавить обработку полей query:
        // query.sources ?
        // query.region

        let sinceId = _.get(ctx, 'minId', 0);
        let maxId = _.get(ctx, 'maxId', 0);

        // Проверки аргументов
        if (!limit || limit < 1)
            throw new Error(`Некорректный запрос. 'limit': ${limit}`);
        if (limit > config.twitterApi.searchTweetsMax)
            limit = config.twitterApi.searchTweetsMax;
        let actualLimit = limit;
        if (limit < config.twitterApi.searchTweetsMin)
            actualLimit = config.twitterApi.searchTweetsMin;
        if (!queryText || queryText.length < 1)
            throw new Error(`Некорректный запрос. 'queryText': ${queryText}`);

        let result;
        try {
            result = aw(searchTweets(
                queryText,
                actualLimit,
                sinceId,
                maxId,
                since,
                until
            ));
        } catch (err) {
            throw new RetriableError(`Ошибка: ${util.inspect(err, {depth: 3})}`);
        }

        let filteredResult = [];
        try {
            filteredResult = aw(filterOriginal(result));
        } catch (error) {
            console.error(`почему-то не получилось отфильтровать лишние (${util.inspect(error, {depth: 3})})`);
            filteredResult = result;
        }
        if (filteredResult.length > limit)
            filteredResult = _.take(filteredResult, limit);
            
        // console.log('Получено %d сообщений', filteredResult.length)
        
        // let timeStart = process.hrtime();

        let uurls = [];
        try {
            uurls = aw(unshortenUrls(filteredResult));
        } catch (error) {
            console.error(error);
        }

        let previews = filteredResult.map(it => processPost(it, uurls, insertPhotosIntoHtml, extendedReposts));
        // console.log('\t%dms for mapping', hrSeconds(process.hrtime(timeStart)));
        
        ctx = updateContext(ctx, previews);

        let response = {
            previews: previews,
            ctx: ctx
        };
        return response;
    })();
}

/** Обновляет контекст */
function updateContext (context, previews) {
    let minMax = findMinMaxIds(previews, 'itemId');
    if (!minMax || !_.isArray(minMax))
        minMax = [];
    
    if(!context)
    {
        if (minMax.length >= 2)
        {
            context = {
                backwardsMinId: minMax[1],
                maxId: minMax[0],
            };
        }
        else
            context = {};
    }
    else
    {
        if (minMax.length <= 0)
        {
            if (context.backwardsMinId)
            {
                context.minId = context.backwardsMinId;
                delete(context.maxId);
            }
        }
        else
        {
            if (!context.maxId)
                context.backwardsMinId = minMax[1];
            context.maxId = minMax[0];
        }
    }
    return context;
}


module.exports = getPreviews;
