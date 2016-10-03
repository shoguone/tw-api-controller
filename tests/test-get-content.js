var amqp            = require('amqplib/callback_api');
var _               = require('lodash');

var config          = require('../config');

var data = {
    method: config.api.methods.getContent,
    args: {
        urls: [
            'https://twitter.com/Kouhei_Wada_Bot/',
            'https://twitter.com/watermelonbread/status/715782184225935360',
            'https://twitter.com/28_ars/status/715781738648190977',
            'https://twitter.com/search?f=tweets&vertical=default&q=hello%20world%20OR%20code%20lang%3Aru&src=typd',
            'https://twitter.com/search?q=hello%20world%20OR%20code%20lang%3Aru&src=typd',
            'https://twitter.com/search?q=ассоциация',
            'https://twitter.com/search?f=users&vertical=default&q=hello%20world%20OR%20code%20lang%3Aru&src=typd'
        ],
        contentType: 'post',
        limit: 3
    }
};

amqp.connect(config.api.bus.connStr, function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue('', {exclusive:true}, function (err, privateQ) {
            ch.consume(privateQ.queue, function (msg) {
                var jsonMsg = getJSONMessage(msg);
                var status = _.get(jsonMsg, 'status', 'continue');
                // console.log('status: ' + status);
                switch (status) {
                    case 'continue':
                        console.log('got response (%d):', jsonMsg.data.length);
                        console.log(jsonMsg.data);
                        break;
                    case 'last':
                        console.log('got response (%d):', jsonMsg.data.length);
                        console.log('Done. quiting');
                        console.log(jsonMsg.data);
                        setTimeout(function() { conn.close(); process.exit(0) }, 500);
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
            
            var q = config.api.bus.commonQueue;
            var msg = JSON.stringify(data);
            
            // ch.assertQueue(q, {durable: true});
            ch.assertQueue(q);
            ch.sendToQueue(q, new Buffer(msg), { replyTo: privateQ.queue });
            console.log(" [x] Sent '%s'", msg);
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

