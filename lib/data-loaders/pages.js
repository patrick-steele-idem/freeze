var nodePath = require('path');
var fs = require('fs');
var async = require('async');
var ok = require('assert').ok;
var extend = require('raptor-util').extend;

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

    var pages = site.pages  = new util.Collection();

    var pagesDir = nodePath.join(site.dir, 'pages');


    function getPage(name) {
        var page = pages.byId[name];
        if (!page) {
            page = {
                name: name,
                files: [],
                markdownFiles: {}
            };

            pages.add(name, page);
        }

        return page;
    }

    queue.push(function(callback) {
        util.walk(
            pagesDir,
            {
                file: function(file) {

                    var dirname = nodePath.dirname(file);
                    var pageName = dirname.substring(pagesDir.length);
                    var page = getPage(pageName);
                    page.files.push(file);

                    var basename = nodePath.basename(file);
                    var extname = nodePath.extname(basename);
                    var nameNoExt = basename.slice(0, 0-extname.length);

                    if (file.endsWith('.md')) {
                        var markdownFile = page.markdownFiles[nameNoExt] = new util.MarkdownFile(file);

                        queue.push(function(callback) {
                            markdownFile.loadFrontMatter(function(err, frontMatter) {
                                if (err) {
                                    return callback(err);
                                }

                                if (frontMatter) {
                                    extend(page, frontMatter);    
                                }
                                
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