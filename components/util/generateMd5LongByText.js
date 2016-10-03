var md5                 = require('md5');

module.exports = function (text, isHex) {
	var md5Hash = md5(text, { encoding: 'binary' } );
	if (!md5Hash || md5Hash.length < 8) {
		// return 0;
        throw new Error('Не получается сгенерировать hash для текста:' + text);
	}	
	
	var resultString = md5Hash.substr(0, 8);
    
    if (isHex)
        return resultString;
    
    var result = parseInt(resultString, 16);
	return result;
};
