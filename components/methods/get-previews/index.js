var _               = require('lodash');

var config          = require('../../../config');
var generateMd5     = require('../../util/generateMd5LongByText');

let PostsHandler    = require('./PostsHandler');
let UsersHandler    = require('./UsersHandler');

let postsHandler = new PostsHandler();
let usersHandler = new UsersHandler();

let handlersByType = {
    post: postsHandler,
    user: usersHandler
};

function getPreviews(args, sendResultForCurrentMsg, insertPhotosIntoHtml = false, extendedReposts = false) {
    var requestCTs = _.get(args, 'contentTypes', []);
    if (!_.isArray(requestCTs)) {
        return Promise.reject(`Не удаётся прочитать contentTypes, т.к. ожидается тип Array!\nПолучен contentTypes: ${requestCTs}`);
    }
    if (requestCTs.length < 1) {
        requestCTs = config.api.defaultContentTypes;
    }

    var query = _.get(args, 'query');
    var queryTexts = _.get(args, 'query.text');
    if (!_.isArray(queryTexts)) {
        if (_.isString(queryTexts)) {
            queryTexts = [queryTexts];
        }
        else {
            return Promise.reject(`Не удаётся прочитать query.text, т.к. ожидается тип Array или String!\nПолучен query.text: ${queryTexts}`);
        }
    }
        
    var limit = _.get(args, 'limit');
    var contexts = _.get(args, 'context');
    var stopwords = _.get(args, 'query.params.stopwords');
    
    var promises = [];
    for (var familiarCT in config.api.familiarContentTypes) {
        var i = _.findIndex(requestCTs, function (it) {
            return it == familiarCT;
        });
        if (i >= 0) {
            // Найден знакомый `contentType`
            var previewsHandler = handlersByType[familiarCT];
            for (var j = 0; j < queryTexts.length; j++) {
                var queriesBuilt = previewsHandler.buildQueries(queryTexts[j], stopwords);
                queriesBuilt.forEach(function(queryText) {
                    var qry = JSON.parse(JSON.stringify(query));
                    qry.text = queryText;
                    var context = extractContext(contexts, queryText, familiarCT);
                    promises.push(previewsHandler.get(qry, limit, context, /*projectId,*/ sendResultForCurrentMsg, insertPhotosIntoHtml, extendedReposts));
                });
            }
        }
    }
    if (promises.length <= 0) {
        return Promise.reject(
            'Запрос (contentTypes:{2}) не содержит известных контроллеру {1} contentTypes ({0})'
                .format(JSON.stringify(config.api.defaultContentTypes),
                    config.serviceShortName,
                    JSON.stringify(requestCTs))
            );
    }
    return Promise.all(promises)
        .then((data) => {
            var ctxs = combineContexts(data);
            var status = combineStatuses(data);
            var response = {
                status: status,
                context: ctxs
            };
            return promiseWait(500)
                .then(() => {
                    return Promise.resolve(response);
                });
        });
}

function promiseWait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

/**
 * Объединяем статусы от разных типов контента:
 * если хотя бы один из статусов - `error`, то обобщённый будет `error`;
 * если хотя бы один - `limit`, то `limit`;
 * иначе - `last`
 * статусы берутся из [элемент массива].status
 */
function combineStatuses(data) {
    var status = 'last';
    if (_.isArray(data))
    {
        data.forEach(function(result) {
            if (status != 'error')
            {
                if (result.status == 'error' || result.status == 'limit')
                {
                    status = result.status;
                }
            } 
        });
    }
    return status;
}

/**
 * Объединяем контексты от разных запросов
 * контексты берутся из [элемент массива].context
 */
function combineContexts(data) {
    var contexts = null;
    if (_.isArray(data))
    {
        contexts = [];
        data.forEach(function(result) {
            if (result.context) {
                contexts.push(result.context);
            }
        });
    }
    return contexts;
}

/**
 * Вытаскиваем нужный контекст из массива contexts
 */
function extractContext(contexts, queryText, contentType) {
    var md5Hash = generateMd5('' + queryText + '_' + contentType, true);
    
    var i = _.findIndex(contexts, function (ctx) {
        return ctx.hash == md5Hash;
    });
    if (i >= 0) {
        // Найден знакомый `hash`
        return contexts[i];
    }
    return null;
}

module.exports = getPreviews;