var bodyParser			= require('body-parser');
var express 			= require('express');

var config				= require('./config');
var pgFIFORest		    = require('./components/pg/pg-fifo-rest');
var pgRuRest            = require('./components/pg/pg-read-update-rest');

var PgFIFO			    = require('./components/pg/pg-fifo').PgFIFO;


var app = express();
app.use(bodyParser.json());

var accountsFIFO = new PgFIFO(
    config.accountQueueServer.connectionString,
    config.accountQueueServer.tableName,
    [ 'screenName', 'consumerKey', 'consumerSecret', 'accessTokenKey', 'accessTokenSecret' ]
);
pgFIFORest.register(app, accountsFIFO);

pgRuRest.register(
    app, 
    config.accountQueueServer.connectionString,
    config.accountQueueServer.tableName);

app.listen(config.accountQueueServer.port);
console.log('Сервер запущен.');
