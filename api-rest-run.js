var bodyParser			= require('body-parser');
var express 			= require('express');

var config				= require('./config');

var apiRest             = require('./components/rest/api-rest');

var app = express();
app.use(bodyParser.json());

apiRest.register(app);

app.listen(config.api.rest.port);
console.log('Сервер запущен');