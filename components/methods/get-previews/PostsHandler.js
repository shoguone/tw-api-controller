let moment              = require('moment');
var _                   = require('lodash');

let config              = require('../../../config');
let GetPreviewsHandler  = require('./GetPreviewsHandler');
let getPreviews         = require('./get-previews-posts');

let contentType = config.api.familiarContentTypes.post;
let limit = config.twitterApi.searchTweetsMax;

class PostsHandler extends GetPreviewsHandler {
    constructor(isGetCBQ = false) {
        super(getPreviews, contentType, limit, isGetCBQ);
    }

    computeEstimatedCount(items) {
        let itemsCount = _.get(items, 'length', 0);
        let dateTo = moment(items[0].dateCreated);
        let dateFrom = moment(items[itemsCount - 1].dateCreated);
        let ms = dateTo - dateFrom;

        let estimatedCountPerDay;
        estimatedCountPerDay = Math.round(itemsCount * config.msInDay / ms);
        if (!_.isFinite(estimatedCountPerDay)) {
            estimatedCountPerDay = 1;
        }
        return estimatedCountPerDay;
    }

    /**
     * Заменяем упоминания юзеров:
     * `^@user$` на `(from:user)`
     * `(by|автор|от):@user` на `(from:user)`
     * `(at|содержит|про):@user` на `(@user)`
     */
    replaceMention(query) {
        let subqueries = query.split(/("[^"]+?")/);
        let result = [];
        subqueries.forEach(subquery => {
            if (subquery[0] != '"') {
                let replaces = {
                    'from:': [
                        // 'from',
                        'by',
                        'автор',
                        'от'
                    ],
                    '@': [
                        'at',
                        'содержит',
                        'про'
                    ]
                };

                let re = /^@([\wа-яё]+)$/gi;
                subquery = subquery.replace(re, '(from:$1)');

                for (let key in replaces) {
                    let repls = replaces[key];
                    let reStr = `(?:${repls.join('|')}):@?([\\wа-яё]+)`;
                    re = new RegExp(reStr, 'gmi');
                    subquery = subquery.replace(re, `(${key}$1)`);
                }
            }
            result.push(subquery);
        });
        query = result.join('');

        // query = query.replace(re, '(@$1 OR from:$1)');
        return query;
    }

    /**
     * Разбиваем текст запроса на несколько кусков длины не больше заданной;
     * Заменяем упоминания юзеров (от:, про:, @, ...);
     * Добавляем стоп-слова
     */
    buildQueries (query, stopwords) {
        let that = this;

        let result = [];
        let tokens = [];
        let stopText = this.generateStopText(stopwords);
        let limit = config.twitterApi.maxQueryLength - stopText.length;
        
        // let subqueries = query.split(',');
        let subqueries = [query];
        subqueries.forEach(it => {
            let token = it.trim();
            token = that.replaceMention(token);
            tokens.push(token);
        });
        
        let lastQuery = '';
        let possibleNextQuery;
        
        for (let i = 0; i < tokens.length; ++i) {
            possibleNextQuery = lastQuery + (lastQuery.length ? ') OR (' : '(') + tokens[i];
            
            if (possibleNextQuery.length > limit) {
                result.push(lastQuery + ')' + stopText);
                lastQuery = '(' + tokens[i];
            }
            else {
                lastQuery = possibleNextQuery;
            }
        }
        
        if (lastQuery.length) {
            result.push(lastQuery + ')' + stopText);
        }
        
        return result;
    }
}

module.exports = PostsHandler;