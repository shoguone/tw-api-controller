var http			= require('http');
var url				= require('url');

var commonUtils 	= require('./common-utils');


var requestJson = function (urlStr, data, method, cb) {
	var callback = commonUtils.callback(cb);
	
	var body = data ? JSON.stringify(data) : null;
	
	var urlObj = url.parse(urlStr);
	var options = {
		hostname: urlObj.hostname,
		port: parseInt(urlObj.port),
		method: method,
		path: urlObj.path,
		headers: {
			'Content-Type': 'application/json'
		}
	};
	
	if (body) {
		options.headers['Content-Length'] = Buffer.byteLength(body);
	}
	else {
		options.headers['Content-Length'] = 0;
	}
	
	var req = http.request(options, function (res) {
		res.setEncoding('utf8');
		
		var resCallback = function (err, dataStr) {		
			if (err) { callback(err); return; }
			
			var jsonObject;
			try {
				jsonObject = JSON.parse(dataStr);
			}
			catch (e) {
				console.log('Failed to parse JSON data: ');
				console.log(dataStr);
				
				jsonObject = null;
			}
			
			callback(null, jsonObject);
		};
		
		commonUtils.readStream(res, resCallback);
	});
	
	req.on('error', function (err) {
		callback(err);
	});
	
	if (body) {
		req.end(body);	
	}
	else {
		req.end();
	}
};

var postJson = function (urlStr, data, cb) {
	requestJson(urlStr, data, 'POST', cb);
};

var putJson = function (urlStr, data, cb) {
	requestJson(urlStr, data, 'PUT', cb);
};

var deleteJson = function (urlStr, data, cb) {
	requestJson(urlStr, data, 'DELETE', cb);
};

var getJson = function (urlStr, cb) {
	requestJson(urlStr, null, 'GET', cb);
};


module.exports = {
	postJson: postJson,
	putJson: putJson,
	deleteJson: deleteJson,
	getJson: getJson,
	requestJson: requestJson
};
