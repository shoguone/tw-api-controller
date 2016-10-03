var _                       = require('lodash');
var url                     = require('url');

var config                  = require('../../../config');
var findIdentifiers         = require('../../find-identifiers');
var generateMd5             = require('../../util/generateMd5LongByText');

var contentType = config.api.familiarContentTypes.post;
let maxRetweetsInHtml = config.api.constraints.post.maxRetweetsInHtml;


function processPost(it, uurls = [], insertPhotosIntoHtml = false, extendedReposts = false) {
    var text = it.text;

    var urls = _.get(it, 'entities.urls');
    // var urlsHtml = '';
    // var urlsResults = handleUrls(urls, text);
    try {
        var urlsResults = handleUrls(urls, text, uurls);
        urls = urlsResults.urls;
        text = urlsResults.text;
    } catch (error) {
        console.error(error);
    }
    
    var identifiers = [{ id_type: 'tw_user', id_val: it.user.screen_name }];
    if (it.user.name && it.user.name != '')
        identifiers.push({ id_type: 'name', id_val: it.user.name});
    
    var idfsResults = handleIdentifiers(text);
    identifiers = _.concat(identifiers, idfsResults.identifiers);
    var urlIdentifiers = _.filter(identifiers, { 'id_type': 'url' });
    var domainIdentifiers = _.map(urlIdentifiers, (iu) => {
        var u = url.parse(iu.id_val);
        return {
            id_type: 'urlDomain',
            id_val: u.host
        };
    });
    domainIdentifiers = _.filter(domainIdentifiers, (it) => {
        return it.id_val != 't.co';
    });
    identifiers = _.concat(identifiers, domainIdentifiers);
    var markedText = idfsResults.markedText;
    
    let media = _.concat(
        _.get(it, 'entities.media', []),
        _.get(it, 'extended_entities.media', [])
    );
    let mediaResults = handleMedia(media);
    let {photos, videos, photosHtml, videosHtml} = mediaResults;

    // var likes = it.entities.user_mentions;
    var authorAvatarUrl = _.get(it, 'user.profile_image_url');
    authorAvatarUrl = authorAvatarUrl.replace('_normal', '_bigger');
    
    var likesHtml = '';
    if (it.favorite_count && it.favorite_count > 0) {
        likesHtml = `<div class="col-md-8">Лайков - ${it.favorite_count}</div>`;
    }

    var v = {
        photos:             photos,
        videos:             videos,
        urls:               urls,
        authorAvatarUrl:    authorAvatarUrl,
        orig:               it.orig,
    };

    var origHtml = '';
    if (it.orig > 0) {
        origHtml = `<div class="col-md-8">Оригинал</div>`;

    }
    if (it.origId) {
        v.origId = it.origId;
        v.origUserName = it.origUserName;
        v.origUserScreenName = it.origUserScreenName;
        v.origCreatedAt = it.origCreatedAt;

        origHtml = `<div class="col-md-8">Репост ${getLinkHtml(
            getStatusLink(it.origUserScreenName, it.origId),
            `сообщения`
        )} пользователя ${getLinkHtml(
            getUserLink(it.origUserScreenName),
            `@${it.origUserScreenName}`
        )} (${it.origCreatedAt})</div>`;
        identifiers.push({
            id_type: 'tw_user',
            id_val: it.origUserScreenName
        });
        identifiers.push({
            id_type: 'name',
            id_val: it.origUserName
        });
    }
    
    let retweetsPreviewHtml = '';
    let retweetsContentHtml = '';
    let retweetsCount = _.get(it.retweets, 'length', 0);
    if (retweetsCount > 0) {
        if (extendedReposts) {
            v.reposts = it.retweets;
        }
        else {
            v.reposts = _.map(it.retweets, 'userScreenName');
        }
        let actualCountText = '';
        if (retweetsCount > maxRetweetsInHtml) {
            actualCountText = `. Последние ${maxRetweetsInHtml}`;
        }
        retweetsPreviewHtml = `<div class="col-md-8">Репостов - ${retweetsCount}</div>`;

        retweetsContentHtml = `<div class="col-md-8">Репостов - ${retweetsCount + actualCountText}:</div><div class="col-md-8"><ul>`;
        let cnt = maxRetweetsInHtml;
        it.retweets.forEach((retweet) => {
            identifiers.push({
                id_type: 'tw_user',
                id_val: retweet.userScreenName
            });
            identifiers.push({
                id_type: 'name',
                id_val: retweet.userName
            });
            if (cnt > 0) {
                var link = getStatusLink(retweet.userScreenName, retweet.tweetId);
                var description = `${retweet.userName} (${retweet.createdAt})`;
                var linkHtml = getLinkHtml(link, description);
                retweetsContentHtml += `<li>${linkHtml}</li>`;

                cnt--;
            }
        });
        retweetsContentHtml += '</ul></div>';
        delete(it.retweets);
    }
    

    var previewHtml = `<div class="row"><div class="col-md-2"><img class="img-thumbnail img-responsive" src="${authorAvatarUrl}"></div><div class="col-md-8">${markedText}</div>${origHtml + retweetsPreviewHtml + likesHtml}</div>`;

    if (!insertPhotosIntoHtml) {
        photosHtml = '';
    }

    var contentHtml = `<div class="row"><div class="col-md-12">${markedText}</div>${videosHtml + photosHtml + origHtml + retweetsContentHtml + likesHtml}</div>`;
    
    // if (urlsHtml.length > 0)
    //     contentHtml += urlsHtml;
    
    identifiers = _.uniqWith(identifiers, _.isEqual);
    
    // delete(it.entities);
    return {
        itemId:         it.id_str,
        contentType:    contentType,
        text:           text,
        textUrl:        config.api.formatPostUrl(it.user.screen_name, it.id_str),
        previewHtml:    previewHtml,
        author:         it.user.screen_name,
        authorUrl:      config.api.formatAuthorUrl(it.user.screen_name),
        dateCreated:    new Date(it.created_at.replace(/( \+)/, ' UTC$1')),
        dateSaved:      new Date().toISOString(),
        // geo:            '',
        // geoName:        '',
        title:          it.user.name,
        // category:       '',
        serviceShortName:   config.serviceShortName,
        // rawHtml:        '',
        rawJson:        it,
        identifiers:    identifiers,
        // cacheUrl:       '',
        siteUrl:        config.siteUrl,
        // hasContent:     true,
        hasContent:     false,
        contentHtml:    contentHtml,
        v:              v
    };
}

/**
 * Вытаскивает все ссылки, 
 * приводит их к нужному формату (expanded_url);
 * Заменяет эти ссылки в тексте 
 */
function handleUrls(urls, text, uurls) {
    if (urls && urls.length > 0)
    {
        // Для замены коротких ссылок в тексте нужно, чтобы они точно были упорядочены
        urls = _.sortBy(urls, function (it) { return it.indices[0]; });
        var i = 0;
        var textPieces = [];
        urls = urls.map(function (u) {
            var url = u.expanded_url;
            // TODO : попробовать её ещё развернуть
            if (uurls) {
                var md5 = generateMd5(url);
                url = uurls[md5];
            }
            
            // TODO : добавлять ли их в идентификаторы?
            // identifiers.push({
            //     id_type: 'url',
            //     id_val: url
            // });
            
            // TODO : нужно вставлять линк в findIdentifiers
            // var link = '<a href={0}>{0}</a>'
            //     .format(url);
            
            // Заполнение массива для вставки ссылок в текст
            var sub = text.substring(i, u.indices[0]);
            textPieces.push(sub);
            // textPieces.push(link);
            textPieces.push(url);
            i = u.indices[1];

            // urlsHtml += '<div class="row"><div class="col-md-12">{0}</div></div>'
            //     .format(link);
            return url;
        });
        
        if (i < text.length)
        {
            var sub = text.substring(i);
            textPieces.push(sub);
        }
        text = textPieces.join('');
    }
    return {
        urls: urls,
        text: text
    };
}

/** Оборачивает screen_name юзера в ссылку на него */
function getUserLink(user) {
    return `http://twitter.com/${user}/`;
}

/** Оборачивает id твита в ссылку на твит */
function getStatusLink(user, status) {
    return `${getUserLink(user)}status/${status}`;
}

/** Оборачивает ссылку в тег <a> */
function getLinkHtml(link, description) {
    if (!description) {
        description = link;
    }
    return `<a href="${link}">${description}</a>`;
}

/**
 * Производит поиск идентификаторов в тексте 
 * и возвращает массив идентификаторов и размеченный текст
 * @returns {identifiers[], markedText}
 */
function handleIdentifiers(text) {
    var identifiers = [];
    var identifiersFound = findIdentifiers(text);
    var markedText = identifiersFound.markedText;
    for(var idfType in identifiersFound)
    {
        if (idfType != 'markedText')
        {
            identifiersFound[idfType].forEach(function(idf) {
                identifiers.push({ id_type: idfType, id_val: idf.item});
            });
        }
    }
    return {
        identifiers: identifiers,
        markedText: markedText
    };    
}

/**
 * Получает все изображения и видео, 
 * приводит их к нужному формату (ссылка на фото media_url либо video_info.variants.0.url);
 * Создаёт html для отображения медиа-информации
 * @returns {photos[], videos[], photosHtml, photosHtml}
 */
function handleMedia(entities) {
    entities = _.uniqBy(entities, it => {
        return `${it.media_url}_${it.type}`;
    });
    let photos = [];
    let videos = [];
    let photosHtml = '';
    let videosHtml = '';
    if (entities && entities.length > 0) {
        entities.forEach(e => {
            let videoUrl = _.get(e, 'video_info.variants.0.url');
            if (videoUrl) {
                videosHtml += `<div class="row"><div class="col-md-12"><video controls="" autoplay="" name="media"><source src="${videoUrl}" type="video/mp4"></video></div></div>`;
                videos.push(videoUrl);
            }
            else {
                let photoLink = e.media_url;
                photosHtml += `<div class="row"><div class="col-md-12"><a href=${photoLink}><img class="img-responsive" src=${photoLink}></a></div></div>`;
                photos.push(photoLink);
            }
        });
    }
    return {
        photos: photos,
        videos: videos,
        photosHtml: photosHtml,
        videosHtml: videosHtml
    };
}


module.exports = processPost;
module.exports.getStatusLink = getStatusLink;
module.exports.getLinkHtml = getLinkHtml;