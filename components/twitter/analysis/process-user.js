var _                       = require('lodash');
var url                     = require('url');

var config                  = require('../../../config');
var findIdentifiers         = require('../../find-identifiers');

var processPost             = require('./process-post');

let contentType = config.api.familiarContentTypes.user;
// let maxRetweetsInHtml = config.api.constraints.post.maxRetweetsInHtml;


function processUser(it, uurls = []) {
    // TODO : HERE!
    var itemUrl = config.api.formatAuthorUrl(it.screen_name);

    var identifiers = [
        { id_type: 'tw_user', id_val: it.screen_name },
        // { id_type: 'tw_userLink', id_val: itemUrl },
    ];

    handleUrlAndDescription(it);

    var snippetText;
    var richText;
    if (it.name) {
        identifiers.push({ id_type: 'name', id_val: it.name });
        snippetText = `<b>${it.name}</b> (@${it.screen_name})`;
        richText = `<h3>${it.name}</h3> (@${it.screen_name})`;
    }
    else {
        snippetText = `@${it.screen_name}`;
        richText = `<h3>@${it.screen_name}</h3>`;
    }

    if (it.description) {
        snippetText += `:<br><i>${it.description}</i>`;
        richText += `<br><i>${it.description}</i>`;
    }

    // var urlsResults = handleUrlAndDescription(it);
    // var urls = urlsResults.urls;
    // var urlsHtml = urlsResults.urlsHtml;
    // var it_url = urlsResults.it_url;
    
    if (it.url) {
        richText += `<br>${it.url}`;
        snippetText += `<br>${it.url}`;
        // identifiers.push({
        //     id_type: 'url',
        //     id_val: it.url
        // });
    }
    if (it.created_at) {
        richText += `<br>Присоединился ${it.created_at}`;
    }
    if (it.time_zone) {
        richText += `<br>Часовой пояс: ${it.time_zone}`;
    }

    var photos = _.get(it, 'entities.media', []);
    photos = _.map(photos, 'media_url');
    // var photosResults = handlePhotos(photos);
    // photos = photosResults.photos;
    // var photosHtml = photosResults.photosHtml;
    
    var idfsResults = handleIdentifiers(richText);
    identifiers = _.concat(identifiers, idfsResults.identifiers);
    var markedText = idfsResults.markedText;

    if (!it.statuses) {
        it.statuses = [];
    }
    if (it.status) {
        let i = _.findIndex(it.statuses, {'id_str': it.status.id_str});
        if (i < 0) {
            it.statuses.push(it.status);
        }
    }
    let user = JSON.parse(JSON.stringify(it));
    delete(user.status);
    let lastPosts = [];
    if (it.statuses.length > 0) {
        markedText += `<br><h3>Последние сообщения (${it.statuses.length}):</h3>`;
        it.statuses.forEach(status => {
            status.user = user;
            let post = processPost(status, uurls, true);
            let link = processPost.getStatusLink(status.user.screen_name, status.id_str);
            let linkHtml = processPost.getLinkHtml(link, status.created_at);
            markedText += `<br>${linkHtml}<br>${post.contentHtml}`;
            identifiers = _.concat(identifiers, post.identifiers);

            var statusPhotos = _.get(post, 'v.photos');
            if (statusPhotos) {
                photos = _.concat(photos, statusPhotos);
            }
        });
        photos = _.uniqWith(photos, _.isEqual);
        lastPosts = _.map(it.statuses, 'text');
    }
    identifiers = _.uniqWith(identifiers, _.isEqual);

    var avatarUrl = it.profile_image_url;
    avatarUrl = avatarUrl.replace('_normal', '_bigger');
    
    var urlIdentifiers = _.filter(identifiers, { 'id_type': 'url' });
    let domainIdentifiers = urlIdentifiers.map(it => {
        var u = url.parse(it.id_val);
        return {
            id_type: 'urlDomain',
            id_val: u.host
        };
    });
    domainIdentifiers = _.filter(domainIdentifiers, (it) => {
        return it.id_val != 't.co';
    });
    identifiers = _.concat(identifiers, domainIdentifiers);
    identifiers = _.uniqWith(identifiers, _.isEqual);

    // var avatarHtml = '<div class="row"><div class="col-md-12"><a href={0}><img src={0}></a></div></div>'
    var avatarHtml = `<div class="col-md-2"><img class="img-thumbnail img-responsive" src="${avatarUrl}"></div>`;

    var previewHtml = `<div class="row">${avatarHtml}<div class="col-md-8">${findIdentifiers(snippetText).markedText}</div></div>`;

    // var contentHtml = `<div class="row">${avatarHtml}<div class="col-md-8">${markedText}</div></div>`;
    let contentHtml = `${markedText}`;
    
    // if (photosHtml.length > 0) {
    //     contentHtml += photosHtml;
    // }
    // if (urlsHtml.length > 0) {
    //     contentHtml += urlsHtml;
    // }

    // delete(it.entities);
    return {
        itemId:         it.id_str,
        contentType:    contentType,
        text:           snippetText,
        textUrl:        itemUrl,
        previewHtml:    previewHtml,
        author:         it.screen_name,
        authorUrl:      itemUrl,
        dateCreated:    new Date(it.created_at.replace(/( \+)/, ' UTC$1')),
        dateSaved:      new Date().toISOString(),
        // geo:            '',
        // geoName:        '',
        title:          it.name,
        serviceShortName:   config.serviceShortName,
        // rawHtml:        '',
        rawJson:        it,
        identifiers:    identifiers,
        // cacheUrl:       '',
        siteUrl:        config.siteUrl,
        // hasContent:     true,
        hasContent:     false,
        contentHtml:    contentHtml,
        v:              {
            // TODO : отображать photos, urls ?
            photos:             photos,
            // urls:               urls,
            avatarUrl:      avatarUrl,
            postsCount:     it.statuses_count,
            lastPosts:      lastPosts,
            followersCount: it.followers_count,
            followers:      [],
            friendsCount:   it.friends_count,
            friends:        [],
            likesCount:     it.favourites_count
        }
    };
}

/** 
 * Из массива урлов в твиттере делаем ассоциативный 
 * массив развёрнутых урлов (field || expanded_url) 
 * (с индексами) по ключу короткий урл (url) 
 * @returns {
 *  'short': {
 *      expanded: u[field],
 *      indices: u.indices
 *  }
 * }
 * */
function createUrlsDictionary(urls, field) {
    if (!field) {
        field = 'expanded_url';
    }
    let urlsDictionary = {};
    urls.forEach(function(u) {
        urlsDictionary[u.url] = {
            expanded: u[field],
            indices: u.indices
        };
    });
    return urlsDictionary;
}

/**
 * Вытаскивает все ссылки, 
 * приводит их к нужному формату (expanded_url);
 */
function handleUrlAndDescription(it) {
    let extractUrlDictionary = (name) => {
        let urls = _.get(it, `entities.${name}.urls`, []);
        return createUrlsDictionary(urls);
    };

    let urlUrls = extractUrlDictionary('url');
    let descriptionUrls = extractUrlDictionary('description');

    it.url = replacePiecesInText(urlUrls, it.url, 'expanded');
    it.description = replacePiecesInText(descriptionUrls, it.description, 'expanded');
}

/**
 * Заменяет в тексте text подстроки на позициях indices
 * на поле field (по умолчанию .text) объекта pieces
 */
function replacePiecesInText(pieces, text, field) {
    if (pieces)
    {
        if (!field) {
            field = 'text';
        }
        if (!_.isArray(pieces)) {
            pieces = _.values(pieces);
        }
        if (pieces.length <= 0) {
            return text;
        }

        // Для замены кусочков в тексте нужно, чтобы они точно были упорядочены
        pieces = _.sortBy(pieces, (it) => { return it.indices[0]; });

        let i = 0;
        let textPieces = [];
        pieces = pieces.forEach((it) => {
            let piece = it[field];
            // Заполнение массива для вставки кусочков в текст
            let sub = text.substring(i, it.indices[0]);
            textPieces.push(sub);
            textPieces.push(piece);
            i = it.indices[1];
        });
        
        if (i < text.length)
        {
            let sub = text.substring(i);
            textPieces.push(sub);
        }
        text = textPieces.join('');
    }
    return text;
}

/**
 * Вытаскивает все ссылки, 
 * приводит их к нужному формату (expanded_url);
 * Заменяет эти ссылки в тексте 
 */
// function handleUrlsInPost(urls, text) {
function handleUrlsInPost(status) {
    let entities = _.get(status, 'entities', {});
    // entities = _.filter(entities, (e) => {
    //     return e.length > 0;
    // });

    let dictionary = {};
    for (let key in entities) {
        let urls = entities[key];
        if (urls.length >= 0) {
            let field = null;
            if (key == 'media') {
                // field = 'media_url';
                field = 'none';
            }
            urlsDictionary = createUrlsDictionary(urls, field);
            dictionary = _.assign(dictionary, urlsDictionary);
            // text = replacePiecesInText(urlsDictionary, text, 'expanded');
            // urls = _.mapValues(urlsDictionary, 'expanded');
        }
    }

    let text = replacePiecesInText(dictionary, status.text, 'expanded');
    // return {
    //     urls: urls,
    //     text: text
    // };
    return text;
}

/**
 * Производит поиск идентификаторов в тексте 
 * и возвращает массив идентификаторов и размеченный текст
 * @returns {identifiers[], markedText}
 */
function handleIdentifiers(text) {
    let identifiers = [];
    let identifiersFound = findIdentifiers(text);
    let markedText = identifiersFound.markedText;
    for(let idfType in identifiersFound)
    {
        if (idfType != 'markedText')
        {
            identifiersFound[idfType].forEach(function(idf) {
                identifiers.push({ id_type: idfType, id_val: idf.item });
            });
        }
    }
    return {
        identifiers: identifiers,
        markedText: markedText
    };    
}

/**
 * Получает все изображения, 
 * приводит их к нужному формату (ссылка на фото media_url);
 * Создаёт html для отображения изображений
 * @returns {photos[], photosHtml}
 */
function handlePhotos(photos) {
    let photosHtml = '';
    if (photos && photos.length > 0)
    {
        photos = photos.map(function (p) {
            let photoLink = p.media_url;
            photosHtml += `<div class="row"><div class="col-md-12"><a href={0}><img src=${photoLink}></a></div></div>`;
            return photoLink;
        });
    }
    return {
        photos: photos,
        photosHtml: photosHtml
    };
}


module.exports = processUser;