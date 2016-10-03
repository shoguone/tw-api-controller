var async           = require('asyncawait/async');
var aw              = require('asyncawait/await');

var _               = require('lodash');
var util            = require('util');

var config          = require('../../../config');
// var generateMd5     = require('../../util/generateMd5LongByText');

class GetContentHandler {
    /**
     * TODO : here
     */
    constructor(method, contentType) {
        if (!_.isFunction(method)) {
            throw new Error('Аргумент `method` должен быть функцией!');
        }
        if (!_.isString(contentType)) {
            throw new Error('Аргумент `contentType` должен быть строкой!');
        }

        this.getContent = method;
        this.contentType = contentType;
    }

    /**
     * TODO : here
     * Дай мне user'ов (или не юзеров, contentType'ов)
     */
    get(url, isLoggingEnabled = true) {
        let that = this;

        let log = console.info;
        if (!isLoggingEnabled) {
            log = () => {};
        }

        return new Promise((resolve, reject) => {
            var stop = false;
            var attempts = 0;

            /** resolve */
            function finishSendingWithSuccess(data, status) {
                stop = true;
                log(`  Закончили передачу 'content-${that.contentType}s' (${status})`);
                data.textUrl = url;
                var response = {
                    data: [data],
                    status: status,
                };
                resolve(response);
                return status;
            };
            
            /** reject */
            function finishSendingWithFail(failText) {
                var errMsg = {
                    type: 'error',
                    text: failText,
                    // code: '101'
                };
                var response = {
                    status: 'error',
                    messages: [errMsg]
                };
                // TODO : error here?
                reject(response);
            };
            
            if (!url) {
                finishSendingWithFail('Пустое поле `url`');
                return;
            }

            let urlType, itemId;
            try {
                ({urlType, itemId} = GetContentHandler.determineUrlType(url));
            } catch (error) {
                finishSendingWithFail(error);
            }

            if (urlType != that.contentType) {
                throw new Error('Not implemented yet');
            }

            async(() => {
                let getContentError = (err) => {
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
                        result = aw(that.getContent(itemId));
                    } catch (err) {
                        getContentError(err);
                        continue;
                    }

                    attempts = 0;
                    if (result) {
                        log(`  Получили content (${that.contentType})`);
                        finishSendingWithSuccess(result, 'last');
                    }
                    else {
                        finishSendingWithFail('getContent => null');
                    }
                }
            })();
        });
    }

    /**
     * TODO : описать
     */
    static determineUrlType(url) {
        let urlType = '';
        /** Либо id твита, либо screenName юзера */
        let itemId = '';
        let postId = config.api.reUrlText.exec(url);
        if (postId) {
            urlType = 'post';
            itemId = postId[1];
        }
        else {
            let userScreenName = config.api.reUrlAuthor.exec(url);
            if (userScreenName) {
                urlType = 'user';
                itemId = userScreenName[1];
            }
            else {
                throw new Error(`Не удаётся определить цель поиска (не выявлен тип контента по ссылке "${url}")`);
            }
        }
        return {
            urlType: urlType,
            itemId: itemId
        }
    }
}

module.exports = GetContentHandler;
