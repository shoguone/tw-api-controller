var config              = require('../../../config');
let GetContentHandler   = require('./GetContentHandler');

let getContentUser      = require('./get-content-user-user');
// TODO : getContentPost
// let getContentPost      = require('./get-content-user-post');

let contentType = config.api.familiarContentTypes.user;

class UsersHandler extends GetContentHandler {
    constructor() {
        super(getContentUser, contentType);
    }
}

module.exports = UsersHandler;