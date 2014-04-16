var ok = require('assert').ok;

var EventEmitter = require('events').EventEmitter;

function Site(dir, options) {
    ok(dir, '"dir" is required');
    
    Site.$super.call(this);
    
    this.dir = dir;
    this.options = options || {};
}

Site.prototype = {

};

require('raptor-util').inherit(Site, EventEmitter);

module.exports = Site;