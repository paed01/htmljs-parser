const openTagOnly = {
    base: true,
    br: true,
    col: true,
    hr: true,
    embed: true,
    img: true,
    input: true,
    keygen: true,
    link: true,
    meta: true,
    param: true,
    source: true,
    track: true,
    wbr: true,
};

exports.isOpenTagOnly = function(tagName) {
    return tagName in openTagOnly;
};
