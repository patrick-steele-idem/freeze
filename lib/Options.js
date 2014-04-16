function Options(options) {
    options = options || {};
    this.includeUnpublished = options.includeUnpublished === true;
}

Options.prototype = {
    
};

module.exports = Options;