var async           = require('asyncawait/async');
var aw              = require('asyncawait/await');

var _               = require('lodash');
var util            = require('util');

var config          = require('../../../config');
var generateMd5     = require('../../util/generateMd5LongByText');

let getContentBase  = require('../get-content');

class GetPreviewsHandler {
    /**
     * TODO : here
     */
    constructor(method, contentType, limit, isGetCBQ = false) {
        if (!_.isFunction(method)) {
            throw new Error('Аргумент `method` должен быть функцией!');
        }
        if (!_.isString(contentType)) {
            throw new Error('Аргумент `contentType` должен быть строкой!');
        }
        if (!_.isNumber(limit)) {
            throw new Error('Аргумент `limit` должен быть числом!');
        }

        this.getPreviews = method;
        this.contentType = contentType;
        this.limit = limit;
        this.isGetCBQ = isGetCBQ;
    }

    /**
     * TODO : here
     */
    get(query, limit, context, /*projectId,*/ sendResult, insertPhotosIntoHtml = false, extendedReposts = false) {
        let that = this;
        return new Promise((resolve, reject) => {
            var stop = false;
            var attempts = 0;

            /** resolve */
            var finishSendingWithSuccess = status => {
                stop = true;
                console.info(`  Закончили передачу 'previews-${that.contentType}s' (${status})`);
                var response = {
                    // data: [],
                    status: status,
                };
                if (context)
                    response.context = context;
                resolve(response);
                return status;
            };
            
            /** reject */
            var finishSendingWithFail = failText => {
                var errMsg = {
                    type: 'error',
                    text: failText,
                    // code: '101'
                };
                var response = {
                    // data: previews,
                    status: 'error',
                    messages: [errMsg]
                };
                if (context)
                    response.context = context;
                reject(response);
            };
            
            if (!query) {
                finishSendingWithFail('Пустое поле `query`');
                return;
            }
            var queryText = _.get(query, 'text');
            if (!queryText ||  queryText === '') {
                finishSendingWithFail('Пустое поле `query.text`');
                return;
            }
            let limitLeft = that.limit;
            if (limit)
                limitLeft = limit;
            var hash = generateMd5(`${queryText}_${that.contentType}`, true);

            async(() => {
                let getPreviewsError = (err) => {
                    // console.dir(err);
                    var errText = err.message ? err.message : err;
                    var retry = _.get(err, 'retry');
                    if (retry == true) {
                        // error и retry => штанга, попробуй ещё!
                        attempts++;
                        if (attempts >= config.api.maxRequestAttempts) {
                            stop = true;
                            errText = `Превышен лимит повторных запросов (${config.api.maxRequestAttempts}). Текст последней ошибки: ${util.inspect(errText, {depth:3})}`;
                        }
                    }
                    else {
                        // error и не retry => всё плохо, 
                        // возвращаем отправителю и reject'им
                        stop = true;
                    }
                    if (stop) {
                        finishSendingWithFail(errText);
                    }
                };

                while (!stop) {
                    let result;
                    try {
                        result = aw(that.getPreviews(query, limitLeft, context, insertPhotosIntoHtml, extendedReposts));
                    } catch (err) {
                        getPreviewsError(err);
                        continue;
                    }

                    var previews = _.get(result, 'previews', []);
                    var ctx = _.get(result, 'ctx');
                    if (ctx) {
                        context = ctx;
                        context.hash = hash;
                    }
                    
                    attempts = 0;
                    var previewsCount = _.get(previews, 'length', 0);

                    if (that.isGetCBQ) {
                        for (let i = 0; i < previewsCount; i++) {
                            let item = previews[i];
                            let url = item.textUrl;
                            let itemWithContent = aw(that.getContent(url));
                            item.hasContent = true;
                            previews[i] = _.get(itemWithContent, 'data.0', item);
                        }
                    }

                    limitLeft -= previewsCount;
                    console.info(`  Получили ${previewsCount} previews (${that.contentType}), осталось ${limitLeft}`);
                    var status = 'continue';
                    
                    if (previewsCount <= 0) {
                        finishSendingWithSuccess('last');
                    }
                    else
                    {
                        // Формируем ответ
                        var response = {
                            data: previews,
                            status: status,
                            // messages: []
                        };
                        
                        response.estimatedCountPerDay = that.computeEstimatedCount(previews);
                        
                        
                        // console.info('Возвращаем результат: %s', response);
                        sendResult(response);

                        if (limitLeft <= 0) {
                            finishSendingWithSuccess('limit');
                        }
                    }
                }
            })();
        });
    }

    getContent(url) {
        let that = this;

        let args = {
            contentTypes: [that.contentType],
            urls: [{
                textUrl: url
            }]
        };
        return getContentBase(args, false);
    }

    /**
     * Склеивает стоп-слова с минусами и скобками
     * ['привет', 'мир'] => ' -(привет) -(мир)'
     */
    generateStopText(stopwords) {
        var stopText = '';
        if (stopwords && _.isArray(stopwords) && stopwords.length > 0)
            stopText = ` -(${stopwords.join(') -(')})`;
        return stopText;
    }

    /**
     * virtual
     * Разбиваем текст запроса на подзапросы, если это необходимо
     * Добавляем стоп-слова
     */
    buildQueries(query, stopwords) {
        let stopText = this.generateStopText(stopwords);
        return query + stopText;
    }

    /**
     * virtual
     * Вычисляет приблизительное количество результатов в день 
     */
    computeEstimatedCount(items) {
        return items.length;
    }
}

module.exports = GetPreviewsHandler;
