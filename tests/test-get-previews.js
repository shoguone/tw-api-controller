var amqp            = require('amqplib/callback_api');
var _               = require('lodash');

var config          = require('../config');

var data = {
    method: config.api.methods.getPreviews,
    args: {
        query: {
            // text: 'lang:ru',
            text: 'what a beautiful day',
            sources: [],
            // dateFrom: '2016-04-25',
            // dateTo: '2016-04-26'
            // TODO : добавить в сервис обработку следующих параметров
            // region - регион,
            // params {} - дополнительные параметры, JSON
        },
        limit: '5'
    }
};

amqp.connect(config.api.bus.connStr, function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue('', {exclusive:true}, function (err, privateQ) {
            var q = config.api.bus.commonQueue;
            var msg = JSON.stringify(data);

            var send = function () {
                var properties = {
                    replyTo: privateQ.queue,
                    correlationId: 'lalala_' + new Date().toISOString()
                };
                ch.sendToQueue(q, new Buffer(msg), properties);
                console.log(" [x] Sent '%s'", msg);
            };
            
            ch.consume(privateQ.queue, function (msg) {
                var jsonMsg = getJSONMessage(msg);
                var status = _.get(jsonMsg, 'status', 'continue');
                // console.log('status: ' + status);
                if (_.isArray(jsonMsg.data))
                {
                    jsonMsg.data.forEach(function(it) {
                        delete(it.rawJson);
                        delete(it.rawHtml);
                    });
                }
                switch (status) {
                    case 'continue':
                        console.log('got response (%d):', jsonMsg.data ? jsonMsg.data.length : 'null');
                        console.log(jsonMsg);
                        break;
                    case 'limit':
                    case 'last':
                        console.log('got response (%d):', jsonMsg.data ? jsonMsg.data.length : 'null');
                        console.log('Got `%s`. Message:', status);
                        console.log(jsonMsg);
                        setTimeout(function() { conn.close(); process.exit(0) }, 500);
                        console.log('\tQuiting.');
                        break;
                    case 'error':
                        console.log('Got error.');
                        console.log(jsonMsg.messages);
                        console.log('\tQuiting.');
                        setTimeout(function() { conn.close(); process.exit(0) }, 500);
                        break;
                    default:
                        console.log('Status error.');
                        setTimeout(function() { conn.close(); process.exit(0) }, 500);
                        break;
                }
            });
            
            // ch.assertQueue(q, {durable: true});
            ch.assertQueue(q);

            send();
        });
    });
});

function getJSONMessage(msg) {
    var content = _.get(msg, 'content', null);

    try {
        return JSON.parse(content);
    } catch (error) {
        console.log(error);
        return null;
    }
}

