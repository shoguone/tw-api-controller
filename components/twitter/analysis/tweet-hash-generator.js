var generateMd5 = require('../../util/generateMd5LongByText');


var computeTweet = function (tweet) {
	var re = /(?:RT\s.*?:\s)?(.{0,50}).*?(?:https?:)?.*/gi;
	var reResult = re.exec(tweet);
	
	if (!reResult || !reResult[1]) {
		return null;
	}
	
    var tweetText = reResult[1];
    // re = /(.*) [a-zа-яё0-9]*?/gi;
    // reResult = re.exec(tweetText);
    
    // if (reResult && reResult[1])
    //     tweetText = reResult[1];
    
	try {
		var result = generateMd5(tweetText);
		return result;
	} catch (error) {
		return null;
	}
};

module.exports = {
	computeTweet: computeTweet
};
