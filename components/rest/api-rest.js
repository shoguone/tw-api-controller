// var childProcess		    = require('child_process');
var _                       = require('underscore');

var commonExpress		    = require('../common/common-express');
var commonHttp			    = require('../common/common-http');
var config                  = require('../../config');
var PgFIFO			        = require('../pg/pg-fifo').PgFIFO;
var twitterSearchProvider 	= require('../twitter/twitter-search-provider');

var stringFormat            = require('string-format-dema');


var updateAccount = function(account)
{
    commonHttp.postJson(
        config.accountQueueServer.clientBaseUrl + '/update',
        account,
        function (err, data) {
            if (err || !data) {
                return;
            }
        });
}

var resetAccounts = function()
{
    updateAccount({ in_progress : false });
}

var releaseAccount = function(id)
{
    var account = {
        id : id,
        in_progress : false
    };
    updateAccount(account);
}

var createPreviewsHandler = function ()
{
    var accountsFifo = new PgFIFO(
        config.accountQueueServer.connectionString,
        config.accountQueueServer.tableName,
        [ 'screenName', 'consumerKey', 'consumerSecret', 'accessTokenKey', 'accessTokenSecret' ]
    );
    
    resetAccounts();
    
    var handler = function (req, res)
    {
        // req.body ~ { query, limit }
        
        console.info('\ngot a request:')
        console.info(req.body);
        
        if (req.body 
            && _.isObject(req.body)
            && req.body.query
            && req.body.limit)
        {
            accountsFifo.getNext()
                .then(function (accountsData)
                {
                    var limit = req.body.limit;
                    if (limit <= 0)
                    {
                        limit = config.twitterSearchProvider.count;
                    }
                    else if (limit > config.twitterSearchProvider.count)
                    {
                        // TODO : разбить на несколько запросов
                        limit = config.twitterSearchProvider.count;
                    }
                    
                    if (!accountsData)
                    {
                        // TODO : повтор?
                        commonExpress.sendError(res, 'Очередь учетных записей Twitter пуста');
                    }
                    
	                twitterSearchProvider.queryTwitter(
                        accountsData, 
                        req.body.query,
                        req.body.limit)
                        .then(function (searchData)
                        {
                            console.log('Получено %d сообщений', searchData.length)
                            var previews = searchData
                                .map(function (it)
                                {
                                    return {
                                        id:         it.id_str,
                                        text:       it.text,
                                        author:     it.user.screen_name,
                                        date:       it.created_at,
                                        urlText:    config.api.urlTextFormat.format(it.user.screen_name, it.id_str),
                                        urlAuthor:  config.api.urlAuthorFormat.format(it.user.screen_name)
                                    };
                                });
                            releaseAccount(accountsData.id)
                            res.json(previews);
                            res.end();
                        })
                        .catch(function (searchErr)
                        {
                            releaseAccount(accountsData.id)
                            // TODO : повтор?
                            commonExpress.sendError(res, 'Ошибка twitter: ' + searchErr);
                        });
                })
                .catch(function (accountsErr)
                {
                    // TODO : повтор?
                    commonExpress.sendError(res, 'Ошибка при получении следующего элемента очереди: ', accountsErr);
                });
        }
        else
        {
			// console.log('Запрос невалиден');
			commonExpress.sendError(res, 'Некорректный запрос, ожидался объект типа { query, limit }.');
        }
    };
    
    return handler;
};

var register = function (app)
{
	app.post(
        config.api.rest.getPreviewsPath,
        createPreviewsHandler()
    );
};


module.exports = {
	register: register
};
