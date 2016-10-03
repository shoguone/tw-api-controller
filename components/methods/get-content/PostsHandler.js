var config              = require('../../../config');
let GetContentHandler   = require('./GetContentHandler');

let getContentPost      = require('./get-content-post-post');
// TODO : getContentUser
// let getContentUser      = require('./get-content-post-user');

let contentType = config.api.familiarContentTypes.post;

class PostsHandler extends GetContentHandler {
    constructor() {
        super(getContentPost, contentType);
    }
}

module.exports = PostsHandler;