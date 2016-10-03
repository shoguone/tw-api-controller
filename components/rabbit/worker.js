var amqp                = require('amqplib');
var EventEmitter 	    = require('events');
// var moment              = require('moment');
let Q                   = require('q');
var uuid 	            = require('node-uuid');
var _                   = require('lodash');

var util                = require('util');

var config              = require('../../config');
var getPreviews         = require('../methods/get-previews');
var getContent          = require('../methods/get-content');
var getCBQ              = require('../methods/get-content-by-query');
var getPostSpreading    = require('../methods/get-post-spreading');

var handleQueue = function () {
    var rabbit = {};
    var eventEmitter = new EventEmitter();
    var requestsCache = {};

    // Открываем соединение с шиной
    amqp.connect(config.api.bus.connStr)
        .then(function(conn) {
            // возвращает "канал",
            // количество максимально открытых - channelMax в конфигурации
            return conn.createChannel();
        })
        .then(function(ch) {
            // console.info('Открыто соединение с шиной');
            rabbit.channel = ch;
            // сколько запросов обрабатывать без подтверждения
            // 1 - пока не подтвердит текущий, новые не получает
            // на каждую очередь
            rabbit.channel.prefetch(1);
            
            /********************/
            // Создаём уникальную очередь
            // В неё будем просить отправлять ответы
            // exclusive: true - очередь привязана к подключению
            return rabbit.channel.assertQueue('', { exclusive: true });
        })
        .then(function(privateQ) {
            console.info('Создана приватная очередь %s', privateQ.queue);
            rabbit.replyTo = privateQ.queue;
            // Слушаем приватную очередь на предмет получаемых ответов
            rabbit.channel.consume(privateQ.queue, function (msg) {
                // Обрабатываем полученный ответ
                handleReplyMessage(msg)
                    .timeout(30000)
                    .then(() => {
                        rabbit.channel.ack(msg);
                    })
                    .catch((error) => {
                        rabbit.channel.nack(msg, false, false);
                        console.error(error);
                    });
            }, {noAck: false});
            /********************/
            
            let options = {
                durable: true,
                maxPriority: 10
            };
            // Проверяем, существует ли общая очередь `commonQueue`
            return rabbit.channel.assertQueue(config.api.bus.commonQueue, options);
        })
        .then(function(commonQ) {
            console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', commonQ.queue);
            // Слушаем общую очередь, в которую поступают задачи
            rabbit.channel.consume(commonQ.queue, function (msg) {
                var m = getJSONMessage(msg);
                console.log(' Получена задача: %s', util.inspect(m, {depth:3}));
                
                var replyTo = _.get(msg, 'properties.replyTo');
                if (!replyTo)
                {
                    // Если не указан "обратный адрес", удаляем сообщение из очереди,
                    // т.к. ничего не сможем с ним сделать
                    console.log(' В полученной задаче не указан обратный адрес (replyTo). Задача будет удалена.');
                    // 2й аргумент - allUpTo = false - не затрагивать остальные ожидающие сообщения
                    // 3й аргумент - requeue = false - не вернуть в очередь, а удалить
                    rabbit.channel.nack(msg, false, false);
                    return;
                }
                // Выполняем задачу
                handleRequestMessage(msg)
                    .timeout(600000)
                    .then(function () {
                        console.log('message handled');
                        rabbit.channel.ack(msg);
                    })
                    .catch(function (err) {
                        console.log('Ошибка обработки сообщения:');
                        console.log(err);
                        rabbit.channel.nack(msg, false, false);
                    });
            }, {noAck: false});
        })
        .catch(function(error) {
            console.error('catch error: ');
            console.error(error);
            process.exit(1);
        });

    /**
     * Функция обработки сообщения,
     * содержащего задачу для контроллера
     * @param msg
     * @returns Promise
     */
    function handleRequestMessage(msg) {
        return new Q.Promise(function (resolve, reject) {
            /** Отправляет ответ на полученное из очереди сообщение */
            function sendResultForCurrentMsg(response) {
                sendResult(response, msg);
            };
            
            /** Отправляет сообщение с ошибкой, а также отменяет сообщение в очереди (reject -> nack) */
            function sendErrorForCurrentMsg(errMsgText, msgStatus = 'error') {
                var err = {
                    status: 'error',
                    messages: [{
                        type: msgStatus,
                        text: errMsgText
                        // TODO : code: '101'
                    }]
                };
                sendResultForCurrentMsg(err);
                reject(errMsgText);
            };
            
            var msgJson = getJSONMessage(msg);
            if (!msgJson) {
                sendErrorForCurrentMsg('Не удается получить `content` из сообщения');
                return;
            }

            var methodName = msgJson.method;

            var args = _.get(msgJson, 'args');
            if (!args) {
                // spreading Без args?
                if (methodName == config.api.methods.getPostSpreading) {
                    args = _.get(msgJson, 'url');
                }
                else {
                    sendErrorForCurrentMsg('Не найдено необходимое поле `args`');
                    return;
                }
            }
            
            /** getPreviews | getContent | ... */
            var method;
            try {
                method = getSupportedMethod(methodName);
            } catch (error) {
                sendErrorForCurrentMsg(error);
                return;
            }
            
            method(args, sendResultForCurrentMsg)
                .then(function (data) {
                    sendResultForCurrentMsg(data);
                    resolve();
                })
                .catch(function (err) {
                    sendErrorForCurrentMsg(err);
                });        
        });
    }

    /**
     * не забываем про try -> catch
     * @param msg
     * @returns {null}
     */
    function getJSONMessage(msg) {
        var content = _.get(msg, 'content', null);

        try {
            return JSON.parse(content);
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    /**
     * Функция отправки результата по адресу replyTo
     * @param result - результат обработки, {}
     * @param msg
     * @param ch
     */
    function sendResult(result, msg) {
        var res = JSON.stringify(result);
        var replyTo = _.get(msg, 'properties.replyTo', null);
        var correlationId = _.get(msg, 'properties.correlationId', null);
        // var properties = {};
        var properties = {
            contentType: 'application/json',
            persistent: true
        };
        if (correlationId)
            properties.correlationId = correlationId;

        rabbit.channel.sendToQueue(replyTo, new Buffer(res), properties);
        var status = _.get(result, 'status');
        console.log('    -->> `{0}`\t`{1}`'
            .format(status, replyTo));
    }
    
    /** 
     * Возвращает метод для обработки полученного сообщения
     * Генерирует ответ об ошибке для неподдерживаемых методов (throw)
     */
    function getSupportedMethod(method) {
        switch (method) {
            case config.api.methods.getPreviews:
                return getPreviews;
            case config.api.methods.getContentByQuery:
                return getCBQ;
            case config.api.methods.getContent:
                return getContent;
            case config.api.methods.getPostSpreading:
                return getPostSpreading;
            default:
                throw new Error(`Метод (${method}) не известен контроллеру ${config.serviceShortName}`);
        }
    }

    /**
     * Функция обработки сообщения - ответа на запрос контроллера
     */
    function handleReplyMessage(msg) {
        // console.info('Получен ответ: %s', msg.content.toString());

        var cId = _.get(msg, 'properties.correlationId', null);

        if(cId === null) {
            return Q.reject(new Error('correlationId is null. Задача будет удалена'));
        } else {
            var request = requestsCache[cId];
            var method = request.method;
            var eventName = method + '_' + cId;

            // console.info('Получен ответ: %s', method);
            
            var content = getJSONMessage(msg);
            eventEmitter.emit(eventName, content);
            return Q.resolve(msg);
        }

    }

    /**
     * Отправляем запрос в очередь
     * @param queueName - название очереди
     * @param request - json запроса
     * @param uniqueKey - уникальный ключ запроса
     * @param params - дополнительные параметры запроса
     */
    function sendRequestToQueue(queueName, request, uniqueKey) {
        // логгируем для дебага
        // console.log(`отправляем запрос '${request.method}' в '${queueName}'`);
        // console.log(request, uniqueKey);

        rabbit.channel.sendToQueue(
            queueName,
            new Buffer(JSON.stringify(request)),
            {
                persistent: true,
                deliveryMode: 2,
                correlationId: uniqueKey,
                replyTo: rabbit.replyTo
            }
        );
    }

    /**
     * Отправляем запрос модулю аналитики на разворачивание ссылок
     * urls[] => Promise ( urls[] )
     */
    function unshortenUrls(urls) {
        if (!_.isArray(urls)) {
            if (!_.isString(urls)) {
                return Q.resolve([]);
            }
            urls = [urls];
        }

        var cId = uuid.v4();
        var queue = config.analytics.requestQueue;
        var method = config.analytics.methods.unshortenUrls;
        var eventName = method + '_' + cId;
        return new Q.Promise((resolve, reject) => {
            eventEmitter.addListener(eventName, (msg) => {
                var status = msg.status;
                var data = msg.data;
                if (status == 'error') {
                    console.error(data);
                    resolve(urls);
                }
                else {
                    // var uurls = data.map((uurl) => { return uurl.unshortenedUrl; });
                    var uurls = data;
                    resolve(uurls);
                }
                eventEmitter.removeAllListeners(eventName);
                delete(requestsCache[eventName]);
            });

            try {
                var request = {
                    method,
                    args: {
                        urls: urls
                    }
                };
                requestsCache[cId] = request;
                sendRequestToQueue(queue, request, cId);
            } catch (error) {
                eventEmitter.removeAllListeners(eventName);
                console.error(error);
                reject(error);
            }
        })
        .timeout(20000)
        .catch((err) => {
            eventEmitter.removeAllListeners(eventName);
            // throw err;
            // а лучше 
            console.error(err);
            return Q.resolve([]);
        })
        ;
    }

    module.exports.unshortenUrls = unshortenUrls;
};

module.exports = {
    handleQueue: handleQueue
};
