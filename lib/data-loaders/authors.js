var nodePath = require('path');
var fs = require('fs');
var async = require('async');
var ok = require('assert').ok;

require('raptor-ecma/es6');

module.exports = function(site, util, callback) {
    ok(site && typeof site === 'object', '"site" expected');
    ok(util && typeof util === 'object', '"site" expected');
    ok(site.dir, 'site.dir expected');
    ok(typeof callback === 'function', 'callback function expected');

    var queue = async.queue(
        function (task, callback) {
            task(callback);
        },
        5 /* concurrency */);


    queue.drain = callback;

    var authors = site.authors  = new util.Collection();

    var authorsDir = nodePath.join(site.dir, 'authors');

    queue.push(function(callback) {
        util.walk(
            authorsDir,
            {
                file: function(file) {
                    var basename = nodePath.basename(file);
                    if (basename.endsWith('.json')) {
                        var id = basename.slice(0, 0-'.json'.length);

                        queue.push(function(callback) {
                            util.readJsonFile(file, function(err, author) {
                                if (err) {
                                    return callback(err);
                                }

                                author.id = id;
                                authors.add(id, author);
                                callback();
                            });
                        });
                    }
                }
            },
            function(err) {
                callback(err);
            });
    });
};