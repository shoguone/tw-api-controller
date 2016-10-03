var _ = require('underscore');

var sendError = function (res, err) {
	console.log(err);
	
	res.writeHead(500, {'content-type': 'text/plain'});
	
	var errText;
	if (_.isString(err)) {
		errText = err;
	}
	else if (_.isObject(err) && err.message) {
		errText = err.message;
	}
	else {
		errText = 'Unhandled error occured.';
	}
	
	res.end(errText);
};

var sendNotFound = function (res) {	
	res.writeHead(404, {'content-type': 'text/plain'});
	res.end('Not found');
};

module.exports = {
	sendError: sendError,
	sendNotFound: sendNotFound
};
