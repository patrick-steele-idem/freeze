var util = require('./util');
var ok = require('assert').ok;

exports.generate = function(site, callback) {

    ok(site != null, 'site is required');
    ok(typeof callback === 'function', 'callback should be a function');

    var callbackInvoked = false;
    function callbackWrapper(e) {
        if (callbackInvoked) {
            throw new Error('Callback invoked multiple times');
        }

        callbackInvoked = true;

        callback(e);
    }

    var themeModule = site.themeModule;
    try {
        themeModule.generate(site, util, callbackWrapper);    
    } catch(e) {
        callbackWrapper(e);
    }
};


