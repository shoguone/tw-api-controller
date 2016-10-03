var amqp            = require('amqplib/callback_api');
var util            = require('util');
var _               = require('lodash');

var config          = require('../config');

var data = {
    method: config.api.methods.getPostSpreading,
    url: "https://twitter.com/leprasorium/status/754577884484866048"
};

amqp.connect(config.api.bus.connStr, function(err, conn) {
    conn.createChannel(function(err, ch) {
        ch.assertQueue('', {exclusive:true}, function (err, privateQ) {
            ch.consume(privateQ.queue, function (msg) {
                var jsonMsg = getJSONMessage(msg);
                console.log(`Got: ${util.inspect(jsonMsg, {depth: 1})}`);
                process.exit();
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

