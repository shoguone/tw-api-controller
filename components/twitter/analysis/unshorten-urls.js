var async                   = require('asyncawait/async');
var aw                      = require('asyncawait/await');

var _                       = require('lodash');

var generateMd5             = require('../../util/generateMd5LongByText');

var rabbitWorkerPath        = '../../rabbit/worker';
var rabbitWorker            = require(rabbitWorkerPath);


/** Перевод `High resolution` формата времени в секунды */
let hrMs = function (hrTime) {
    return (hrTime[0] * 1e3 + hrTime[1] / 1e6).toFixed(2);
};

/**
 * it . entities.urls.[expanded_url] => разворачиваем и возвращаем ассоциативный массив:
 * @returns Promise<{ md5(originalUrl) -> unshortenedUrl }>
 */
function unshortenUrls(data) {
    return async(() => {
        if (!_.isArray(data)) {
            data = [data];
        }
        if (data.length < 1) {
            return {};
        }
        var shortUrls = data.map((it) => {
            var entitiesUrls = _.get(it, 'entities.urls');
            var expandedUrls = _.map(entitiesUrls, 'expanded_url');
            return expandedUrls;
        });
        shortUrls = _.flatten(shortUrls);
        var uurls = shortUrls;
        if (!rabbitWorker.unshortenUrls) {
            rabbitWorker = require(rabbitWorkerPath);
        }
        if (rabbitWorker.unshortenUrls) {
            let hrTime = process.hrtime();
            try {
                uurls = aw(rabbitWorker.unshortenUrls(shortUrls));
            } catch (error) {
                console.error(error);
            }
            let ms = hrMs(process.hrtime(hrTime));
            console.log('    %d urls unshortened in %sms', data.length, ms);
        }
        var uurlsFiltered = {};
        uurls.forEach((uurl) => {
            var md5 = generateMd5(uurl.originalUrl);
            if (!uurlsFiltered[md5]) {
                if (!uurl.unshortenedUrl || uurl.unshortenedUrl.length <= 0) {
                    uurlsFiltered[md5] = uurl.originalUrl;
                }
                else {
                    uurlsFiltered[md5] = uurl.unshortenedUrl;
                }
            }
        });
        return uurlsFiltered;
    })();
}


module.exports = unshortenUrls;