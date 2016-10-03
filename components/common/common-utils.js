var _ = require('underscore');

var callback = function (cb) {
	return cb || function () {};
};

var readStream = function (stream, cb) {
	var _callback = callback(cb);
	
	stream.on('error', function (err) {
		_callback(err);
	});
	
	var result = '';
	stream.on('data', function (data) {
		result += data;
	});
	
	stream.on('end', function () {
		_callback(null, result);
	});
};

var tryParseDate = function (str) {
	// dd.mm.yyyy
	// 0123456789
	
	if (!_.isString(str) || str.length < 10) {
		return null;
	}
	
	var day = parseInt(str.substr(0, 2));
	var month = parseInt(str.substr(3, 2));
	var year = parseInt(str.substr(6, 4));
	
	var localDate = new Date(year, month - 1, day, 0, 0, 0);
	var timestamp = localDate.getTime() - localDate.getTimezoneOffset() * 60 * 1000;
	var utcDate = new Date(timestamp);
	
	return utcDate;
};

var tryParseNullableDate = function (str) {
	if (!str) {
		return null;
	}
	
	return tryParseDate(str);
};

var padLeft = function (text, padChar, count) {
	var textValue = text || '';
	var padCharValue = padChar || '';
	
	var appendix = '';
	for (var i = textValue.length; i < count; ++i) {
		appendix += padCharValue;
	}
	
	return appendix + textValue;
};

var padRight = function (text, padChar, count) {
	var textValue = text || '';
	var padCharValue = padChar || '';
	
	var appendix = '';
	for (var i = textValue.length; i < count; ++i) {
		appendix += padCharValue;
	}
	
	return textValue + appendix;
};

var formatNullableDate = function (date) {
	if (!date) {
		return null;
	}
	
	if (!_.isDate(date)) {
		throw new TypeError('Expected date object.');
	}
	
	var day = padLeft(date.getDate().toString(), '0', 2);
	var month = padLeft((date.getMonth() + 1).toString(), '0', 2);
	var year = padLeft(date.getFullYear().toString(), '0', 4);
	
	return day + '.' + month + '.' + year; 
};

var formatNullableDateTime = function (date) {
	if (!date) {
		return null;
	}
	
	if (!_.isDate(date)) {
		throw new TypeError('Expected date object.');
	}
	
	var day = padLeft(date.getDate().toString(), '0', 2);
	var month = padLeft((date.getMonth() + 1).toString(), '0', 2);
	var year = padLeft(date.getFullYear().toString(), '0', 4);
	
	var hours = padLeft(date.getHours().toString(), '0', 2);
	var minutes = padLeft(date.getMinutes().toString(), '0', 2);
	var seconds = padLeft(date.getSeconds().toString(), '0', 2);
	
	return day + '.' + month + '.' + year
		+ ' ' + hours + ':' + minutes + ':' + seconds;
};

module.exports = {
	callback: callback,
	tryParseNullableDate: tryParseNullableDate,
	tryParseDate: tryParseDate,
	formatNullableDate: formatNullableDate,
	formatNullableDateTime: formatNullableDateTime,
	padLeft: padLeft,
	padRight: padRight,
	
	readStream: readStream
};