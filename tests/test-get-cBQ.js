var amqp            = require('amqplib/callback_api');
var _               = require('lodash');

var config          = require('../config');
var generateMd5     = require('../components/util/generateMd5LongByText');

var contentTypesArray = {
    post: 5,
    user: 3,
    empty: 5,
    page: 4,
    adv: 2,
    media: 1
};

var typesFreqs = 0;
for (var prop in contentTypesArray) {
    typesFreqs += contentTypesArray[prop];
}

var generateContentTypes = function () {
    var rnd = Math.random() * typesFreqs;
    var contentTypes = [];
    for (var prop in contentTypesArray) {
        if (contentTypesArray[prop] < rnd) {
            rnd -= contentTypesArray[prop];
        }
        else {
            rnd = Math.random() * typesFreqs;
            if (prop != 'empty') {
                contentTypes.push(prop);
                // return prop;
            }
            // break;
        }
    }
    return contentTypes;
};

var queryTexts = [
    'what a beautiful day',
    'привет мир'
];

var data = {
    method: config.api.methods.getContentByQuery,
    args: {
        query: {
            // text: 'lang:ru',
            text: queryTexts,
            sources: [],
            dateFrom: '2016-04-25T12:00:00.0T+06:0025',
            dateTo: '2016-04-28T12:00:00.0T+06:0028',
            // TODO : добавить в сервис обработку следующих параметров
            // region - регион,
            // params {} - дополнительные параметры, JSON
        },
        // contentTypes: [ 'post', 'user' ],
        contentTypes: generateContentTypes(),
        limit: '2',
        context: [{
            hash: generateMd5('' + queryTexts[0] + '_' + 'post', true),
            backwardsMinId: '727858426915762177',
            maxId: '727858325153583103'
        },{
            hash: generateMd5('' + queryTexts[1] + '_' + 'user', true),
            offset: 15
        }]
    }
};

amqp.connect(config.api.bus.connStr, function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue('', {exclusive:true}, function (err, privateQ) {
            var triesCount = 2;
            
            var q = config.api.bus.commonQueue;

            var send = function () {
                var msg = JSON.stringify(data);
                var properties = {
                    replyTo: privateQ.queue,
                    correlationId: 'lalala_' + new Date().toISOString()
                };
                ch.sendToQueue(q, new Buffer(msg), properties);
                console.log(` [x] Sent '${msg}'`);
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
                        console.log('jsonMsg.context');
                        console.log(jsonMsg.context);
                        if (--triesCount < 1) {
                            setTimeout(function() { conn.close(); process.exit(0); }, 500);
                            console.log('\tQuiting.');
                        } else {
                            console.log('Once again!');
                            data.args.context = jsonMsg.context;
                            send();
                        }
                        break;
                    case 'error':
                        console.log('Got error.');
                        console.log(jsonMsg.messages);
                        console.log('\tQuiting.');
                        setTimeout(function() { conn.close(); process.exit(0); }, 500);
                        break;
                    default:
                        console.log('Status error.');
                        setTimeout(function() { conn.close(); process.exit(0); }, 500);
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

