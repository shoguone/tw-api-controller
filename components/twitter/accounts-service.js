var async                   = require('asyncawait/async');
var aw                      = require('asyncawait/await');

let util                    = require('util');

var commonHttp			    = require('../../components/common/common-http');
var PgFIFO			        = require('../../components/pg/pg-fifo').PgFIFO;

var config                  = require('../../config');

var updateAccount = function(account)
{
    return new Promise((resolve, reject) => {
        commonHttp.postJson(
            config.accountQueueServer.clientBaseUrl + '/update',
            account,
            function (err, data) {
                if (err || !data) {
                    reject(new Error('Can\'t update an account (' + JSON.stringify(account) + ')!\n' + err.toString()));
                    // return;
                }
                else {
                    resolve(data);
                }
            });
    });
};

var resetAccounts = function()
{
    return updateAccount({ in_progress : false });
};

/**
 * Освобождаем занятый аккаунт
 */
function release(id) {
    var account = {
        id : id,
        in_progress : false
    };
    updateAccount(account);
};

var accountsFifo = new PgFIFO(
    config.accountQueueServer.connectionString,
    config.accountQueueServer.tableName,
    [ 'screenName', 'consumerKey', 'consumerSecret', 'accessTokenKey', 'accessTokenSecret' ]
);

let startReset = false;
resetAccounts()
    .then(() => {
        startReset = true;
    })
    .catch(err => {
        console.error(err);
        process.exit();
    });

let waitTime = 250;
let getTimeout = 10000;

/**
 * Получаем очередной свободный аккаунт
 */
function get () {
    return async(() => {
        while (startReset != true) {
            aw(promiseWait(waitTime));
        }

        let accountsData;
        let success = false;
        let timeout = getTimeout;
        let error;
        while(!success) {
            try {
                accountsData = aw(accountsFifo.getNext());
                if (accountsData) {
                    success = true;
                }
                else {
                    error = 'Очередь учетных записей Twitter пуста';
                }
            } catch (err) {
                error = err;
            } finally {
                if (!success) {
                    if (timeout > 0) {
                        aw(promiseWait(waitTime));
                        timeout -= waitTime;
                    }
                    else {
                        throw new Error(`Очередь учетных записей Twitter пуста и не освобождается в течение ${getTimeout} мс. Текст последней ошибки: ${util.inspect(error, {depth: 3})}`);
                    }
                }
            }
        }
        let twitterAccount = {
            consumer_key: accountsData.consumerKey,
            consumer_secret: accountsData.consumerSecret,
            access_token_key: accountsData.accessTokenKey,
            access_token_secret: accountsData.accessTokenSecret
        };
        accountsData.twitterAccount = twitterAccount;

        return(accountsData);
    })();
};

function promiseWait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

exports.get = get;
exports.release = release;