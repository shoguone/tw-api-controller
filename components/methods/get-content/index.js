var _               = require('lodash');

var config          = require('../../../config');

let PostsHandler    = require('./PostsHandler');
let UsersHandler    = require('./UsersHandler');

let postsHandler = new PostsHandler();
let usersHandler = new UsersHandler();

let handlersByType = {
    post: postsHandler,
    user: usersHandler
};
// let getContentUserUser = require('./get-content-user-user');

function getContent(args, isLoggingEnabled = true) {
    var requestCTs = _.get(args, 'contentTypes', []);
    if (!_.isArray(requestCTs)) {
        return Promise.reject(`Не удаётся прочитать contentTypes, т.к. ожидается тип Array!\nПолучен contentTypes: ${requestCTs}`);
    }
    if (requestCTs.length < 1) {
        requestCTs = config.api.defaultContentTypes;
    }

    var urls = _.get(args, 'urls');
    if (!_.isArray(urls)) {
        if (_.isObject(urls)) {
            urls = [urls];
        }
        else {
            return Promise.reject(`Не удаётся прочитать urls, т.к. ожидается тип Array или Object!\nПолучен urls: ${urls}`);
        }
    }
    urls = _.map(urls, 'textUrl');

    // TODO : обработка массивов. 
    // А сейчас только первого элемента...
    let url = urls[0];
    let cT = requestCTs[0];
    
    // считаем, что 'user'
    // return getContentUserUser(url);
    let handler = handlersByType[cT];
    return handler.get(url, isLoggingEnabled);
}

module.exports = getContent;