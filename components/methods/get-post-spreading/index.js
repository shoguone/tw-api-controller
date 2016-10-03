var async           = require('asyncawait/async');
var aw              = require('asyncawait/await');

var _               = require('lodash');
var moment          = require('moment');
// var util            = require('util');

// var config          = require('../../../config');
var generateMd5     = require('../../util/generateMd5LongByText');
let processPost     = require('../../twitter/analysis/process-post');

let getPreviewsBase = require('../get-previews');
let getContentBase  = require('../get-content');
let GetContentHandler = require('../get-content/GetContentHandler');

/**
 * {
 *  "method":"getPostSpreading",
 *  "url":"https://twitter.com/leprasorium/status/754577884484866048",
 *  "uuid":"6c41e585-63d1-4b84-ab96-87e9370a216f"
 * }
 * args: {url, contentType}
 */
function getPostSpreading(args) {
    let responses = [];

    function getPreviews(text, contentType) {
        let args = {
            contentTypes: [contentType],
            limit: 10000,
            query: {
                text: text
            }
        };
        return getPreviewsBase(args, remember, false, true);
    }

    function remember(response) {
        responses.push(response);
    }

    return async(() => {
        let url = args;
        let {urlType, itemId} = GetContentHandler.determineUrlType(url);

        let contentResponse = aw(getContent(url, urlType));
        let item = _.get(contentResponse, 'data.0');

        let itemText = getText(item);
        let itemHash = generateMd5(itemText);
        itemText = `"${itemText}"`;
        let itemAuthor = getAuthor(item);
        let sameTextItems = aw(getPreviews(itemText, urlType));

        let relations = [];
        let relationsRequests = [];
        let addToRelations = (re, tweet) => {
            if (!tweet) {
                relationsRequests.push(re);
            }
            else if (re.userId != itemAuthor) {
                relations.push({
                    sourceUser: tweet.userId,
                    targetUser: re.userId,
                    relType: 'repost'
                });
            }
        };
        let checkPostedAt = tweet => {
            if (!_.isString(tweet.postedAt)) {
                tweet.postedAt = tweet.postedAt.toISOString();
            }
        };

        let origins = [];
        let authors = _.chain(responses)
            .map('data')
            .flatten()
            .uniqBy('textUrl')
            .filter(post => {
                let text = getText(post);
                // Из текста запроса мы убрали запятые и тире, так что тут тоже:
                // text = escapeText(text);
                let hash = generateMd5(text);
                return hash == itemHash;
            })
            .map(it => {
                let tweet = {
                    userId: it.author,
                    userName: it.title,
                    postedAt: it.dateCreated,
                    postUrl: it.textUrl
                };
                checkPostedAt(tweet);
                let origUserScreenName = _.get(it, 'v.origUserScreenName');
                let origin;
                if (origUserScreenName) {
                    let createdAt;
                    let screenName;
                    let name;
                    let postId;
                    if (it.retweeted_status) {
                        createdAt = _.get(it, 'retweeted_status.created_at');
                        createdAt = moment(createdAt, 'ddd MMM DD HH:mm:ss Z YYYY').toISOString();
                        screenName = _.get(it, 'retweeted_status.user.screen_name');
                        name = _.get(it, 'retweeted_status.user.name');
                        postId = _.get(it, 'retweeted_status.id_str');
                    }
                    else {
                        createdAt = _.get(it, 'v.origCreatedAt');
                        screenName = _.get(it, 'v.origUserScreenName');
                        name = _.get(it, 'v.origUserName');
                        postId = _.get(it, 'v.origId');
                    }
                    let postUrl = processPost.getStatusLink(screenName, postId);
                    origin = {
                        userId: screenName,
                        userName: name,
                        postedAt: createdAt,
                        postUrl: postUrl
                    };
                    origins.push(origin);
                    addToRelations(tweet, origin);
                    checkPostedAt(origin);
                }
                else {
                    addToRelations(tweet);
                }

                let reposts = _.chain(it)
                    .get('v.reposts', [])
                    .map(r => {
                        let postUrl = processPost.getStatusLink(r.userScreenName, r.tweetId);
                        let repost = {
                            userId: r.userScreenName,
                            userName: r.userName,
                            postedAt: r.createdAt,
                            postUrl: postUrl
                        };
                        if (origin) {
                            addToRelations(repost, origin);
                        }
                        else {
                            addToRelations(repost);
                        }
                        checkPostedAt(repost);
                        return repost;
                    })
                    .value();
                let tweets = _.concat([tweet], reposts);
                return tweets;
            })
            .flatten()
            .sortBy('postedAt')
            .value();

        // Найденные оригинальные твиты (origins): если их не было в массиве, добавляем. Если были, проверяем, чтобы дата репоста была правильной
        origins.forEach(origin => {
            checkPostedAt(origin);
            let index = _.findIndex(authors, {userId: origin.userId});
            if (index >= 0) {
                let author = authors[index];
                if (origin.postedAt < author.postedAt) {
                    authors.splice(index, 1);
                    let newIndex = _.findIndex(authors, {postedAt: origin.postedAt});
                    authors.splice(newIndex, 0, origin);
                }
            }
            else {
                index = _.sortedIndexBy(authors, origin, 'postedAt');
                authors.splice(index, 0, origin);
            }
        });

        let first = authors[0];
        relationsRequests.forEach(request => addToRelations(request, first));

        // authors = _.sortBy(authors, 'postedAt');
        
        /***
        {
            authors: [{
                userId: '',
                userName: '',
                postedAt: ''
            }],
            relations: [{
                sourceUser: 'кто опубликовал',
                targetUser: 'кто сделал репост',
                relType: 'repost'
            }]
        }
        /***/
        // let initialIndex = _.findIndex(authors, {textUrl: url});
        return {
            authors: authors,
            relations: relations
        };
    })();
}

function escapeText(text) {
    // Убираем из текста запятые, чтобы не подставлялось OR
    // text = text.replace(/,|-|\n|:/gmi, ' ');
    // Убираем из текста тире, чтобы не подставлялось -()
    // text = text.replace('-', '');
    text = text.replace(/\n/gi, ' ');
    // text = text.replace('\\n', '');
    return text;
}

function getAuthor(item) {
    return _.get(item, 'author');
}

function getText(item) {
    let text = _.get(item, 'text');
    if (!text) {
        text = _.get(item, 'status.text');
    }
    text = escapeText(text);

    let re = /(?:RT\s.*?:\s)?(.{0,50}).*?(?:https?:)?.*/gmi;
    let reResult = re.exec(text);

    if (!reResult || !reResult[1]) {
        return text;
    }

    let tweetText = reResult[1];
    re = /(.*) [a-zа-яё0-9]*?/gi;
    reResult = re.exec(tweetText);
    
    if (reResult && reResult[1])
        tweetText = reResult[1];
    
    return tweetText;
}

function getContent(url, contentType) {
    let args = {
        contentTypes: [contentType],
        urls: [{
            textUrl: url
        }]
    };
    return getContentBase(args);
}



module.exports = getPostSpreading;