const Parser = require('./Parser');

exports.createParser = function(listeners, options) {
    const parser = new Parser(listeners, options || {});
    return parser;
};
