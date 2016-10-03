var _               = require('lodash');
var stringFormat    = require('string-format-dema');

var extractor       = require('./extractor');

var extractors = [
    // extractor.addressExtractor,
    // extractor.ageExtractor,
    // extractor.dateExtractor,
    // extractor.dnsExtractor,
    extractor.emailExtractor,
    extractor.hashtagExtractor,
    // extractor.icqIds,
    extractor.instagramExtractor,
    extractor.ipExtractor,
    extractor.mentionExtractor,
    extractor.nameExtractor,
    // extractor.okIdExtractor,
    extractor.phoneExtractor,
    extractor.skypeExtractor,
    // extractor.twitterStatusIdsExtractor,
    // extractor.twitterUserIdsExtractor,
    extractor.urlExtractor,
    // extractor.vkGroupIdsExtractor,
    // extractor.vkIdsExtractor,
    // extractor.vkUserIdsExtractor
];

var findIdentifiers = function (text) {
    var extractedItems = {};
    var markups = [];
    extractors.forEach(function(extr) {
        var result = extr.getItems(text);
        // extractedItems[extr._openTag] = result.items;
        extractedItems[extr._openTag] = result.markups.map(function (it) {
            return {
                indices: [ 
                    it.index, 
                    it.index + it.itemLength
                ],
                item: it.item
            };
        });
        /*result.markups ~ [ {
            closeTag: "</span>",
            index: 8536,
            item: "Сергей Сергеевич",
            openTag: "<span class="markup-name">"
        } ]*/
        markups = _.concat(markups, result.markups);
    });
    
    var i = 0;
    var textPieces = [];

    markups = _.sortBy(markups, function (it) { return it.index; });
    markups.forEach(function(it) {
        var sub = text.substring(i, it.index);
        textPieces.push(sub);
        let item = it.item;
        if (it.urlHost) {
            item = `${it.urlHost}/...`;
        }
        var itemWithTags = '{0}{1}{2}'.format(it.openTag, item, it.closeTag);
        textPieces.push(itemWithTags);
        i = it.index + it.itemLength;
    });
    if (i < text.length)
    {
        var sub = text.substring(i);
        textPieces.push(sub);
    }
    var markedText = textPieces.join('');
    
    return {
        // address: [],
        // age: extractedItems[extractor.ageExtractor._openTag],
        // date: extractedItems[extractor.dateExtractor._openTag],
        // dns: [],
        email: extractedItems[extractor.emailExtractor._openTag],
        hashtag: extractedItems[extractor.hashtagExtractor._openTag],
        // icqId: [],
        instagram: extractedItems[extractor.instagramExtractor._openTag],
        ip: extractedItems[extractor.ipExtractor._openTag],
        mention: extractedItems[extractor.mentionExtractor._openTag],
        name: extractedItems[extractor.nameExtractor._openTag],
        // okId: [],
        phone: extractedItems[extractor.phoneExtractor._openTag],
        skype: extractedItems[extractor.skypeExtractor._openTag],
        // twStatusIds: extractedItems[extractor.twitterStatusIdsExtractor._openTag],
        // twUserScreenName: extractedItems[extractor.twitterUserIdsExtractor._openTag],
        url: extractedItems[extractor.urlExtractor._openTag],
        // vkGroupId: extractedItems[extractor.vkGroupIdsExtractor._openTag],
        // vkId: extractedItems[extractor.vkIdsExtractor._openTag],
        // vkUserId: extractedItems[extractor.vkUserIdsExtractor._openTag],
        markedText: markedText
    };
};

module.exports = findIdentifiers;

