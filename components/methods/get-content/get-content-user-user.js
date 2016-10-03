var async                   = require('asyncawait/async');
var aw                      = require('asyncawait/await');

var _                       = require('lodash');
var url                     = require('url');
var util                    = require('util');

var config                  = require('../../../config');
var findIdentifiers         = require('../../find-identifiers');
var RetriableError          = require('../../common/error/RetriableError');

var followersList 	        = require('../../twitter/followers-list');
var statusesUserTimeline	= require('../../twitter/statuses-user_timeline');
var usersShow 	            = require('../../twitter/users-show');

let filterOriginal          = require('../../twitter/analysis/filter-original');
let processUser             = require('../../twitter/analysis/process-user');
let unshortenUrls           = require('../../twitter/analysis/unshorten-urls');

let timelineLimit = config.api.constraints.user.timelineLimit;

function getUserContentFromUserUrl(userScreenName) {
    return async(() => {
        var requests;
        // Выполняем необходимые запросы
        try {
            requests = aw([
                statusesUserTimeline(
                    userScreenName
                    // TODO : всё -> в конфиги!
                    ,
                    timelineLimit
                ),
                followersList(
                    userScreenName,
                    'followers'
                    // ,
                    // 10
                ),
                followersList(
                    userScreenName,
                    'friends'
                    // ,
                    // 10
                ),
                usersShow(
                    userScreenName
                )
            ]);
        } catch (error) {
            throw new RetriableError(`Bad content/user request: ${util.inspect(error, {depth: 3})}`);
        }
        let [timeline, followers, friends, it] = requests;
        
        // Предварительная обработка полученной ленты (с тем, чтобы по всей этой ленте вызвать обработку каждого поста processPost'ом)
        let isProtected = false;
        let uurls = [];
        if (timeline.error) {
            if (timeline.code == 401) {
                isProtected = true;
            }
        }
        else {
            // Записываем всякие параметры типа tweetHash, orig, retweets и тд
            let filteredResult = [];
            try {
                filteredResult = aw(filterOriginal(timeline));
            } catch (error) {
                console.error(`почему-то не получилось отфильтровать лишние (${util.inspect(error, {depth: 3})})`);
                filteredResult = timeline;
            }
                
            // Разворачиваем ссылки
            try {
                uurls = aw(unshortenUrls(filteredResult));
            } catch (error) {
                console.error(error);
            }

            it.statuses = filteredResult;
        }
        // Обрабатываем посты (генерируем item установленного формата)
        it = processUser(it, uurls);
        delete(it.rawJson.statuses);

        // Заполняем поля v.
        // Добавляем identifiers из подписчиков и друзей
        let collectionName = '';
        let connectRelatedUsers = user => {
            it.identifiers.push({
                id_type: 'tw_user',
                id_val: user.screen_name
            });
            it.identifiers.push({
                id_type: 'name',
                id_val: user.name
            });
            it.v[collectionName].push(user.screen_name);
        };
        // Подписчиков
        if (followers.error) {
            if (followers.code == 401) {
                isProtected = true;
            }
        }
        else {
            collectionName = 'followers';
            followers.users.forEach(connectRelatedUsers);
        }
        // Друзей
        if (friends.error) {
            if (friends.code == 401) {
                isProtected = true;
            }
        }
        else {
            collectionName = 'friends';
            friends.users.forEach(connectRelatedUsers);
        }
        it.identifiers = _.uniqWith(it.identifiers, _.isEqual);

        // Если protected user, добавляем соответствующее сообщение
        if (isProtected) {
            it.contentHtml += `<h3>Доступ к твитам @${it.author} ограничен</h3>`;
        }

        it.hasContent = true;
        return it;
    })();
}


module.exports = getUserContentFromUserUrl;
