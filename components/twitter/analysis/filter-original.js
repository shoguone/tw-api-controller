var _                       = require('lodash');
var moment                  = require('moment');

var tweetHashGenerator      = require('./tweet-hash-generator');

/**
 * Записываем tweetHash, orig, origId, origUserScreenName, origUserName;
 * Если встречаются одинаковые твиты, все повторы записываются в retweets оригинального (самого раннего)
 * @param {any} tweets массив статусов или один статус (твит)
 * @returns Promise: [tweets]
 */
function filterOriginal (tweets) {
    return new Promise(function (resolve, reject) {
        // console.log('matchHashesInHotStorage : ' + tweets.length + ' tweets');
        if (!tweets) {
            resolve([]);
            return;
        }
        else {
            if (!_.isArray(tweets)) {
                tweets = [tweets];
            }
            else if (tweets.length <= 0) {
                resolve([]);
                return;
            }
        }
        
        var tweetsByHashes = {};
        var hashesArray = [];
        tweets.forEach(function(tweet)
        {
            var hash = tweetHashGenerator.computeTweet(tweet.text);
            tweet.tweetHash = hash;
            if (!tweetsByHashes[hash])
            {
                tweetsByHashes[hash] = [];
                hashesArray.push(hash);
            }
            tweetsByHashes[hash].push(tweet);
        });
        
        // console.log('Получилось %d различных сообщений', hashesArray.length);
        
        var result = [];
        // console.log('Цикл по различным сообщениям (фактически, различным хешам)');
        for (var i = 0; i < hashesArray.length; i++) {
            var hash = hashesArray[i];
            // var origId = data[i];
            // console.log('для hash `%s` имеем origId `%s` и %d твитов', hash, origId, tweetsByHashes[hash].length);
            var earliestTweetFound = null;
            // console.log('Цикл по твитам, имеющим один хеш');
            for (var j = tweetsByHashes[hash].length - 1; j >= 0; j--) {
                var tweet = tweetsByHashes[hash][j];
                if (earliestTweetFound) 
                {
                    // console.log('самый ранний уже найден => этот неоригинален')
                    // console.log(tweet.id_str);
                    if (!earliestTweetFound.origId 
                        && tweet.retweeted_status
                        && tweet.retweeted_status.id_str != earliestTweetFound.id_str)
                    {
                        earliestTweetFound.origId = tweet.retweeted_status.id_str;
                        earliestTweetFound.origUserScreenName = tweet.retweeted_status.user.screen_name;
                        earliestTweetFound.origUserName = tweet.retweeted_status.user.name;
                        let createdAt = moment(tweet.retweeted_status.created_at, 'ddd MMM DD HH:mm:ss Z YYYY');
                        earliestTweetFound.origCreatedAt = createdAt.toISOString();
                    }
                    // tweet.orig = 0;
                    var createdAt = moment(tweet.created_at, 'ddd MMM DD HH:mm:ss Z YYYY');
                    var retweet = {
                        tweetId: tweet.id_str,
                        userScreenName: tweet.user.screen_name,
                        userName: tweet.user.name,
                        createdAt: createdAt.toISOString()
                    };
                    // tweet.orig_id = earliestTweet.id_str;
                    if (!earliestTweetFound.retweets || earliestTweetFound.retweets.length < 1)
                    {
                        earliestTweetFound.retweets = [];
                        earliestTweetFound.retweetsCount = 0;
                    }
                    earliestTweetFound.retweets.push(retweet);
                    earliestTweetFound.retweetsCount++;
                } 
                else 
                {
                    // console.log('самый ранний:')
                    // console.log(tweet.id_str);
                    // Является ли явным ретвитом?
                    if (tweet.retweeted_status) 
                    {
                        tweet.origId = tweet.retweeted_status.id_str;
                        tweet.origUserScreenName = tweet.retweeted_status.user.screen_name;
                        tweet.origUserName = tweet.retweeted_status.user.name;
                        let createdAt = moment(tweet.retweeted_status.created_at, 'ddd MMM DD HH:mm:ss Z YYYY');
                        tweet.origCreatedAt = createdAt.toISOString();
                        tweet.orig = 0;
                    }
                    else 
                    {
                        tweet.orig = 100;
                    }
                    earliestTweetFound = tweet;
                }
            }
            result.push(earliestTweetFound);
            // var logStr = 'твит является '
            //     + (earliestTweetFound.origId ? 'ретвитом' : 'локально оригинальным'); 
            // if (earliestTweetFound.retweets)
            //     logStr += ' и имеет ' + earliestTweetFound.retweetsCount + ' локальных ретвитов';
            // logStr += ', а также имеет ' + earliestTweetFound.retweet_count + ' заявленных ретвитов';
            // console.log(logStr);
        }
        resolve(result);
    });
};

module.exports = filterOriginal;