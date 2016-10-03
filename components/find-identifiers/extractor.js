var _               = require('lodash');
var url             = require('url');
var stringFormat    = require('string-format-dema');

// function Extractor(openTag, closeTag, reStr) {
function Extractor(innerTag, reStr, isCaseInsensitive, isLink) {
    // if (_.isEmpty(openTag) || !_.isString(openTag)) {
    //     throw 'openTag argument is missing or is not a string.';
    // }
    
    // if (_.isEmpty(closeTag) || !_.isString(closeTag)) {
    //     throw 'closeTag argument is missing or is not a string.';
    // }
    
    if (_.isEmpty(innerTag) || !_.isString(innerTag)) {
        throw 'innerTag argument is missing or is not a string.';
    }
    
    if (_.isEmpty(reStr) || !_.isString(reStr)) {
        throw 'reStr argument is missing or is not a string.';
    }
    
    // this._openTag = openTag;
    // this._closeTag = closeTag;
    // this._innerTag = innerTag;
    // this._openTag = '<span {0}>'.format(this._innerTag);
    if (isLink)
    {
        this._openTag = '\<span {0}\>'.format(innerTag);
        this._closeTag = '\</span\>';
        this._isLink = isLink;
    }
    else
    {
        this._openTag = '\<span {0}\>'.format(innerTag);
        this._closeTag = '\</span\>';
    }
    if (isCaseInsensitive)
        this._re = new RegExp(reStr, 'gmi');
    else
        this._re = new RegExp(reStr, 'gm');
};

Extractor.prototype.getItems = function (text) {
    var items = [];
    var markups = [];

    var nextItem;
    while (nextItem = this._re.exec(text))
    {
        var index = nextItem.index;
        var item = nextItem[0];
        if (nextItem.length > 1 && nextItem[1])
        {
            item = nextItem[1];
            index += nextItem[0].indexOf(item);
        }
        items.push(item);
        var markup = {
            index: index,
            item: item,
            itemLength: item.length
        };
        if (this._isLink)
        {
            markup.openTag = '<a href="{0}">'.format(
                item
            );
            markup.closeTag = '</a>';
            let parsedItem = url.parse(item);
            if (parsedItem.host) {
                markup.urlHost = parsedItem.host;
            }
        }
        else
        {
            markup.openTag = this._openTag;
            markup.closeTag = this._closeTag;
        }
        markups.push(markup);
    }
    
    return {
        items: items,
        markups: markups
    };
};

var ageExtractor = function () {
    var className = 'markup-age';
    var color; // = 'red';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);
    var reStr = '\\D([2-6](?:(?:0\\s*лет)|(?:1\\s*год)|(?:[2-4]\\s*года)|(?:[5-9]\\s*лет)))';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var dateExtractor = function () {
    // var openTag = '<date>';
    // var closeTag = '</date>';
    var className = 'markup-date'; 
    var color; // = 'green';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    /*****/
    /** 0-31 */
    var d = '(?:(?:[0-2]?\\d)|(?:3[0-1]))';
    /** 1-12 | янвЫВАП */
    var m = '(?:(?:0?[1-9])|(?:1[0-2])|(?:(?:янв|фев|мар|апр|ма|июн|июл|авг|сен|окт|ноя|дек)[а-я]*))';
    /** янвЫВАП */
    var m1 = '(?:(?:янв|фев|мар|апр|ма[йяеё]|июн|июл|авг|сен|окт|ноя|дек)[а-я]*)';
    /** 1961 | 61 */
    var y = '(?:(?:1[3-9]|20)?\\d\\d)';
    /** 1961 */
    var y1 = '(?:(?:1[3-9]|20)\\d\\d)';
    /** \s./- */
    var s = '[\\.\\s\\/\\-]+';
    /** \s,./- */
    // var s = '[\\,\\.\\s\\/\\-]+';
    /** \s,.- | ^ */
    var s1 = '(?:[\\,\\.\\s\\-]|^)';
    /** \s,.- | $ */
    var s2 = '(?=[\\,\\.\\s\\-]|$)';
    var reStr = `${s1}(${d}${s}${m}${s}${y}|${y1}${s}${m}${s}${d}|${d}${s}${m1}|${m1}${s}${y}|${y1}|${m1})${s2}`;
    /*****
    var d = '[0-2]?\\d|3[0-1]';
    var m1 = '(?:янв|фев|мар|апр|ма|июн|июл|авг|сен|окт|ноя|дек)[а-яА-Я]*';
    var m = '(?:0?[1-9]|1[0-2]|{0})'.format(m1);
    var y = '(?:19|20)?\\d\\d';
    var y1 = '(?:19|20)\\d\\d';
    var s = '[\\,\\.\\s\\/\\-]+';
    // var reg.Pattern = '\b(' & d & s & m & s & y & ')|(' & m1 & s & y & ')|' & y1
    // var reStr = '(?<!\\d)({0}{5}{1}{5}{3}|{4}{5}{1}{5}{0}|{2}{5}{3}|{4})(?!\\d)'.format(d, m, m1, y, y1, s);
    var reStr = '({0}{5}{1}{5}{3}|{4}{5}{1}{5}{0}|{2}{5}{3}|{4})'.format(d, m, m1, y, y1, s);
    /*****/

    // console.log(new RegExp(reStr, 'gm'));

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var dnsExtractor = function () {
    throw new Error('Not implemented');
    // var openTag = '<dns>';
    // var closeTag = '</dns>';
    var className = 'markup-dns'; 
    var color; // = '#345678';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var d = '(([0-2]?\\d)|(3[0-1]))';
    var m = '((0?[1-9])|(1[0-2])|((янв|фев|мар|апр|ма|июн|июл|авг|сен|окт|ноя|дек)[а-я]*))';
    var m1 = '((янв|фев|мар|апр|ма|июн|июл|авг|сен|окт|ноя|дек)[а-я]*)';
    var y = '((19|20)?\\d\\d)';
    var y1 = '((19|20)\\d\\d)';
    var s = '[\\,\\.\\s/\\-]+';
    // var reg.Pattern = '\b(' & d & s & m & s & y & ')|(' & m1 & s & y & ')|' & y1
    var reStr = '\\b({0}{5}{1}{5}{3})|({4}{5}{1}{5}{0})|({2}{5}{3})|{4}'.format(d, m, m1, y, y1, s);

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var emailExtractor = function () {
    // var openTag = '<email>';
    // var closeTag = '</email>';
    var className = 'markup-email'; 
    var color; // = 'blue';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = '[a-zA-Zа-яА-Я0-9_\\.]+@[a-zA-Zа-яА-Я0-9_\\.]+\\.[a-zA-Zа-яА-Я0-9_\\.]+';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var hashtagExtractor = function () {
    // var openTag = '<mention>';
    // var closeTag = '</mention>';
    var className = 'markup-hashtag'; 
    var color; // = 'blue';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);
    
    // var reStr = '(?:^|\\W)(#\\w+)\\b|(?:^|[^а-я0-9_])(#[а-я0-9_]+)';
    var reStr = '(#[\\wа-я]+)';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr,
        true);
    return extractor;
};

var instagramExtractor = function () {
    // var openTag = '<instagram>';
    // var closeTag = '</instagram>';
    var className = 'markup-instagram'; 
    var color; // = '#56789A';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = 'instagram:([\\w\\.]+)';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var ipExtractor = function () {
    // var openTag = '<ip>';
    // var closeTag = '</ip>';
    var className = 'markup-ip'; 
    var color; // = '#56789A';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = '((?:(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(?:25[0-5]|2[0-4]\\d|[01]?\\d\\d?))';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var mentionExtractor = function () {
    // var openTag = '<mention>';
    // var closeTag = '</mention>';
    var className = 'markup-mention'; 
    var color; // = 'blue';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = '(?:^|\\W)@(\\w+)\\b';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var nameExtractor = function () {
    // TODO :
    // инициалы: либо оба с точками, либо оба без

    var ru = 'А-ЯЁ';
    var rl = 'а-яё';
    /**[А-ЯЁ] */
    var upper = '[{0}]'.format(ru);
    // console.log(upper);
    /**[а-яё] */
    var lower = '[{0}]'.format(rl);
    // console.log(lower);
    /**[А-ЯЁа-яё0-9_] */
    var letter = '[{0}{1}0-9_]'.format(ru, rl);
    // console.log(letter);
    /**[^А-ЯЁа-яё0-9_] */
    var nonLetter = '[^{0}{1}0-9_]'.format(ru, rl);
    // console.log(nonLetter);
    /**(?:^[А-ЯЁа-яё0-9_]|[А-ЯЁа-яё0-9_]$|[^А-ЯЁа-яё0-9_][А-ЯЁа-яё0-9_]|[А-ЯЁа-яё0-9_][^А-ЯЁа-яё0-9_]) */
    // var boundary = '(?:^{0}|{0}$|{1}{0}|{0}{1})'.format(letter, nonLetter);
    // console.log(boundary);
    var leftBoundary = `(?:^|[^${ru}${rl}"'»-]|\\s)`;
    var rightBoundary = `(?=$|[^${ru}${rl}"'»-]|\\s)`;

    var pretextUpper = '[АВИКОСУЯ]';
    var nonPretextUpper = '[БГ-ЗЛ-НПРТФ-Ю]';
    /**[А-ЯЁ][а-яё]+ */
    // var fullWord = '{2}{0}{1}+{3}'.format(upper, lower, leftBoundary, rightBoundary);
    var fullWord = '{0}{1}+'.format(upper, lower);
    // console.log(fullWord);
    /**[А-ЯЁ][а-яё]+(?:[\t ][А-ЯЁ][а-яё]+)? */
    var nameMiddleName = '{0}(?:[\\t ]{0})?'.format(fullWord);
    // console.log(nameMiddleName);
    /**[А-ЯЁ][а-яё]+[\t ][А-ЯЁ][а-яё]+(?:[\t ][А-ЯЁ][а-яё]+)? */
    var fullName = '{0}[\\t ]{1}'.format(fullWord, nameMiddleName);
    // console.log(fullName);

    // TODO : 
    // (?:\G|^|\W)([A-Z][a-z]+[\t ][A-Z][a-z]+)(?=$|\W)

    /** 
     * Буква инициала == предлог => обязательно должна быть точка; иначе - может быть, может не быть ("?")
     * (?:[АВИКОСУЯ]\.|[БГ-ЗЛ-НПРТФ-Ю]\.?)
     */
    var firstInitialLetter = '(?:{0}\\.|{1}\\.?)'.format(pretextUpper, nonPretextUpper);
    // console.log(firstInitialLetter);
    /**(?: ?[А-ЯЁ]\.?) */
    var secondInitialLetter = '(?: ?{0}\\.?)'.format(upper);
    // console.log(secondInitialLetter);
    /**(?:[АВИКОСУЯ]\.|[БГ-ЗЛ-НПРТФ-Ю]\.?)(?: ?[А-ЯЁ]\.?)? [А-ЯЁ][а-яё]+ */
    var initialsSecondName = '{0}{1}? {2}'.format(firstInitialLetter, secondInitialLetter, fullWord);
    // console.log(initialsSecondName);

    /**[А-ЯЁ][а-яё]+ [А-ЯЁ]\.?(?: ?[А-ЯЁ]\.?)? */
    var secondNameInitials = '{0} {1}\\.?{2}?'.format(fullWord, upper, secondInitialLetter);
    // console.log(secondNameInitials);

    /**[А-ЯЁ][а-яё]+[\t ][А-ЯЁ][а-яё]+(?:[\t ][А-ЯЁ][а-яё]+)?|(?:[АВИКОСУЯ]\.|[БГ-ЗЛ-НПРТФ-Ю]\.?)(?: ?[А-ЯЁ]\.?)? [А-ЯЁ][а-яё]+|[А-ЯЁ][а-яё]+ [А-ЯЁ]\.?(?: ?[А-ЯЁ]\.?)? */
    var fullNameOrWithInitials = `${leftBoundary}(${fullName}|${initialsSecondName}|${secondNameInitials})${rightBoundary}`;
    // var fullNameOrWithInitials = '{0}|{1}|{2}'.format(fullName, initialsSecondName, secondNameInitials);
    // console.log(fullNameOrWithInitials);


    // var openTag = '<name>';
    // var closeTag = '</name>';
    var className = 'markup-name'; 
    var color; // = 'orange';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = fullNameOrWithInitials;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var okIdExtractor = function () {
    throw new Error('Not implemented');
    // var openTag = '<ok>';
    // var closeTag = '</ok>';
    var className = 'markup-ok'; 
    var color; // = '#789ABC';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var d = '(([0-2]?\\d)|(3[0-1]))';
    var m = '((0?[1-9])|(1[0-2])|((янв|фев|мар|апр|ма|июн|июл|авг|сен|окт|ноя|дек)[а-я]*))';
    var m1 = '((янв|фев|мар|апр|ма|июн|июл|авг|сен|окт|ноя|дек)[а-я]*)';
    var y = '((19|20)?\\d\\d)';
    var y1 = '((19|20)\\d\\d)';
    var s = '[\\,\\.\\s/\\-]+';
    // var reg.Pattern = '\b(' & d & s & m & s & y & ')|(' & m1 & s & y & ')|' & y1
    var reStr = '\\b({0}{5}{1}{5}{3})|({4}{5}{1}{5}{0})|({2}{5}{3})|{4}'.format(d, m, m1, y, y1, s);

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var phoneExtractor = function () {
    // var openTag = '<phone>';
    // var closeTag = '</phone>';
    var className = 'markup-phone'; 
    var color; // = 'violet';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = 
        '(?:^|\s|[^\\/\\\\=&\\?])\\b(?:' + 
        '(\\+7[\\s-]?\\d\\d\\d[\\s-]?\\d[\\s-]?\\d[\\s-]?\\d[\\s-]?\\d[\\s-]?\\d[\\s-]?\\d[\\s-]?\\d)|' +
        '(8[\\s-]*\\d\\d\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d)|' +
        '([2-3][\\s-]*\\d\\d[\\s-]{1,2}\\d\\d[\\s-]+\\d\\d)|' +
        '([2-3][\\s-]*[1-9]\\d\\d[\\s-]{1,2}\\d\\d\\d)|' +
        '([2-3][\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d)|' +
        '([1-7]\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d)|' +
        '(9\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d)|' +
        '(\\(\\d\\d\\d\\)?[\\s-]*\\d\\)?[\\s-]*\\d\\)?[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d[\\s-]*\\d)' + 
        ')\\b(?![\\/\\\\=&\\?])'
        ;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var skypeExtractor = function () {
    // var openTag = '<skype>';
    // var closeTag = '</skype>';
    var className = 'markup-skype'; 
    var color; // = 'lime';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var reStr = 'skype\\s?:\\s?(\\w+)';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var twitterStatusIdsExtractor = function () {
    // var openTag = '<twitter-status-id>';
    // var closeTag = '</twitter-status-id>';
    var className = 'markup-twitter-status-id'; 
    var color; // = 'teal';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var mobile = '(?:mobile\\.)';
    var tw = 'https?://{0}?twitter\\.com/.+?/status/(\\d+)'.format(mobile);

    var reStr = tw;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var twitterUserIdsExtractor = function () {
    // var openTag = '<twitter-user-id>';
    // var closeTag = '</twitter-user-id>';
    var className = 'markup-twitter-user-id'; 
    var color; // = '#aadd00';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var mobile = '(?:mobile\\.)';
    var tw = 'https?://{0}?twitter\\.com/(.+?)/'.format(mobile);

    var reStr = tw;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var urlExtractor = function () {
    // var openTag = '<url>';
    // var closeTag = '</url>';
    var className = 'markup-url'; 
    var color; // = 'blue';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    // var reStr = '(?:^|[^@]\b)((?:https?:\/\/)?(?:[\w\.\-]+)\.(?:[a-z]{2,6}\.?)(?:\/[\w\.\-]*)*\/?(?:\?[\w\-]+)?(?:\&[\w\-]+)?)(?:$|\b[^@])';
    var reStr = '(https?://[\\wа-я][^\\s<>]+)';

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr,
        true,
        true);
    return extractor;
};

var vkGroupIdsExtractor = function () {
    // var openTag = '<vk-group-id>';
    // var closeTag = '</vk-group-id>';
    var className = 'markup-vk-group-id'; 
    var color; // = 'turquoise';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var mobile = '(?:m\\.)';
    var vk = 'https?://{0}?vk\\.com/(group[^/\\s]+)'.format(mobile);

    var reStr = vk;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var vkIdsExtractor = function () {
    // var openTag = '<vk-id>';
    // var closeTag = '</vk-id>';
    var className = 'markup-vk-id'; 
    var color; // = 'magenta';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var mobile = '(?:m\\.)';
    var vk = 'https?://{0}?vk\\.com/(?!id|group)([^/\\s]+)'.format(mobile);

    var reStr = vk;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var vkUserIdsExtractor = function () {
    // var openTag = '<vk-user-id>';
    // var closeTag = '</vk-user-id>';
    var className = 'markup-vk-user-id';
    var color; // = '#a0a0f0';
    var innerTag = 'class={0}'.format(className);
    if (color)
        innerTag += ' style="color:{1}"'.format(color);

    var mobile = '(?:m\\.)';
    var vk = 'https?://{0}?vk\\.com/(id[^/\\s]+)'.format(mobile);

    var reStr = vk;

    var extractor = new Extractor(
        // openTag,
        // closeTag,
        innerTag,
        reStr);
    return extractor;
};

var extractors = {
    // ageExtractor: ageExtractor(),
    // dateExtractor: dateExtractor(),
    // dnsExtractor: dnsExtractor(),
    emailExtractor: emailExtractor(),
    hashtagExtractor: hashtagExtractor(),
    instagramExtractor: instagramExtractor(),
    ipExtractor: ipExtractor(),
    mentionExtractor: mentionExtractor(),
    nameExtractor: nameExtractor(),
    // okIdExtractor: okIdExtractor(),
    phoneExtractor: phoneExtractor(),
    skypeExtractor: skypeExtractor(),
    // twitterStatusIdsExtractor: twitterStatusIdsExtractor(),
    // twitterUserIdsExtractor: twitterUserIdsExtractor(),
    urlExtractor: urlExtractor(),
    // vkGroupIdsExtractor: vkGroupIdsExtractor(),
    // vkIdsExtractor: vkIdsExtractor(),
    // vkUserIdsExtractor: vkUserIdsExtractor()
};



// module.exports = Extractor;
module.exports = extractors;