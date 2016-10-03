let async                   = require('asyncawait/async');
let aw                      = require('asyncawait/await');

let _                       = require('lodash');
let util                    = require('util');

let config                  = require('../../../config');
let RetriableError          = require('../../common/error/RetriableError');

let usersSearch 	        = require('../../twitter/users-search');

let processUser             = require('../../twitter/analysis/process-user');


/** Перевод `High resolution` формата времени в секунды */
let hrSeconds = function (hrTime) {
    return (hrTime[0] * 1e3 + hrTime[1] / 1e6).toFixed(2);
};

/**
 * ...
 * @param query : {
 *      text, 
 *      sources[], 
 *      dateFrom, 
 *      dateTo, 
 *      region, 
 *      params 
 *  }
 * @param limit - кол-во
 * @param ctx : {
 *      offset
 *  }
 * @returns {Promise} : {
 *      previews,
 *      ctx
 *  } 
 */
function getPreviews(query, limit, ctx) {
    return async(() => {
        let queryText = _.get(query, 'text');
        // TODO : Добавить обработку полей query:
        // query.sources ?
        // query.region

        let offset = _.get(ctx, 'offset', 0);
        let page = Math.floor(offset / limit) + 1;
        let offsetInPage = offset - (page - 1) * limit;

        // Проверки аргументов
        if (!limit || limit < 1)
            throw new Error('Некорректный запрос. `limit`: ' + limit);
        if (limit > config.twitterApi.searchTweetsMax)
            limit = config.twitterApi.searchTweetsMax;
        if (!queryText || queryText.length < 1)
            throw new Error('Некорректный запрос. `queryText`: ' + queryText);
        
        let result;
        try {
            result = aw(usersSearch(
                queryText,
                limit,
                page
            ));
        } catch (err) {
            throw new RetriableError('Ошибка: ' + util.inspect(err, {depth: 3}));
        }

        // console.log('Получено %d сообщений', searchData.length)
        
        // let timeStart = process.hrtime();

        /*******
        user: {
            "id": 14927800,
            // "id_str": "14927800",
            //"name": "Jason Costa",
            // "screen_name": "jasoncosta",
            "location": "",
            // "description": "Product at Pinterest. Previously, APIs at Google & Twitter.",
            "url": "https://t.co/UoqBHYyOAq",
            "entities": {
                "url": {
                    "urls": [
                    {
                        "url": "https://t.co/UoqBHYyOAq",
                        "expanded_url": "https://www.snapchat.com/add/jasoncosta",
                        "display_url": "snapchat.com/add/jasoncosta",
                        "indices": [
                        0,
                        23
                        ]
                    }
                    ]
                },
                "description": {
                    "urls": []
                }
            },
            "protected": false,
            // "followers_count": 45316,
            // "friends_count": 339,
            "listed_count": 357,
            // "created_at": "Wed May 28 00:20:15 +0000 2008",
            // "favourites_count": 6369,
            "utc_offset": -25200,
            "time_zone": "Pacific Time (US & Canada)",
            "geo_enabled": true,
            "verified": false,
            // "statuses_count": 8170,
            "lang": "en",
            "status": {
                "created_at": "Tue May 10 19:38:20 +0000 2016",
                "id": 730119800433713200,
                "id_str": "730119800433713152",
                "text": "So smart. \"Slack launches 'Sign in with Slack', with partners such as Quip, Figma, Office Vibes, Smooz\" https://t.co/cFm5AbFOQl",
                "entities": {
                    "hashtags": [],
                    "symbols": [],
                    "user_mentions": [],
                    "urls": [
                    {
                        "url": "https://t.co/cFm5AbFOQl",
                        "expanded_url": "http://techcrunch.com/2016/05/10/slack-debuts-sign-in-with-slack-the-collaboration-platforms-answer-to-facebook-connect/",
                        "display_url": "techcrunch.com/2016/05/10/sla…",
                        "indices": [
                        104,
                        127
                        ]
                    }
                    ]
                },
                "truncated": false,
                "source": "<a href=\"http://twitter.com\" rel=\"nofollow\">Twitter Web Client</a>",
                "in_reply_to_status_id": null,
                "in_reply_to_status_id_str": null,
                "in_reply_to_user_id": null,
                "in_reply_to_user_id_str": null,
                "in_reply_to_screen_name": null,
                "geo": null,
                "coordinates": null,
                "place": {
                    "id": "5a110d312052166f",
                    "url": "https://api.twitter.com/1.1/geo/id/5a110d312052166f.json",
                    "place_type": "city",
                    "name": "San Francisco",
                    "full_name": "San Francisco, CA",
                    "country_code": "US",
                    "country": "United States",
                    "contained_within": [],
                    "bounding_box": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                        [
                            -122.514926,
                            37.708075
                        ],
                        [
                            -122.357031,
                            37.708075
                        ],
                        [
                            -122.357031,
                            37.833238
                        ],
                        [
                            -122.514926,
                            37.833238
                        ]
                        ]
                    ]
                    },
                    "attributes": {}
                },
                "contributors": null,
                "is_quote_status": false,
                "retweet_count": 2,
                "favorite_count": 8,
                "favorited": false,
                "retweeted": false,
                "possibly_sensitive": false,
                "lang": "en"
            },
            "contributors_enabled": false,
            "is_translator": false,
            "is_translation_enabled": false,
            "profile_background_color": "709397",
            "profile_background_image_url": "http://abs.twimg.com/images/themes/theme6/bg.gif",
            "profile_background_image_url_https": "https://abs.twimg.com/images/themes/theme6/bg.gif",
            "profile_background_tile": false,
            // "profile_image_url": "http://pbs.twimg.com/profile_images/721230235979517952/oe0MZK43_normal.jpg",
            "profile_image_url_https": "https://pbs.twimg.com/profile_images/721230235979517952/oe0MZK43_normal.jpg",
            "profile_banner_url": "https://pbs.twimg.com/profile_banners/14927800/1460910096",
            "profile_link_color": "FF3300",
            "profile_sidebar_border_color": "86A4A6",
            "profile_sidebar_fill_color": "A0C5C7",
            "profile_text_color": "333333",
            "profile_use_background_image": true,
            "has_extended_profile": false,
            "default_profile": false,
            "default_profile_image": false,
            "following": false,
            "follow_request_sent": false,
            "notifications": false
        },
        /*******/;
            
        if (offsetInPage > 0) {
            if (result.length >= offsetInPage)
                result = _.drop(result, offsetInPage);
        }

        // TODO : unshorten?

        let previews = result.map(it => { return processUser(it); });
        // console.log('\t%dms for mapping', hrSeconds(process.hrtime(timeStart)));
        
        ctx = updateContext(page, limit, previews);
        
        let response = {
            previews: previews,
            ctx: ctx
        };
        return response;
    })();
}

/** Обновляет контекст */
function updateContext (page, limit, previews) {
    let count = _.get(previews, 'length', 0);

    let offset = 0;
    if (count > 0)
        offset = (page - 1) * limit + count;
    
    context = {
        offset: offset
    };
    return context;
}


module.exports = getPreviews;
