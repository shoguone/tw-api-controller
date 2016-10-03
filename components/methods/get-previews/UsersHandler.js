var config              = require('../../../config');
let GetPreviewsHandler  = require('./GetPreviewsHandler');
let getPreviews         = require('./get-previews-users');

let contentType = config.api.familiarContentTypes.user;
let limit = config.twitterApi.usersSearchMax;

class UsersHandler extends GetPreviewsHandler {
    constructor(isGetCBQ = false) {
        super(getPreviews, contentType, limit, isGetCBQ);
    }

    /**
     * Разбиваем текст запроса на слова, разделенные запятыми + строка стоп-слов
     * Пример: ('hello, world', ['привет', 'мир']) => ['hello -(привет) -(мир)', 'world -(привет) -(мир)']
     */
    buildQueries(query, stopwords) {
        var tokens = [];
        var stopText = this.generateStopText(stopwords);
        
        query
            .split(',')
            .forEach(it => tokens.push(it.trim() + stopText));
        
        return tokens;
    }
}

module.exports = UsersHandler;