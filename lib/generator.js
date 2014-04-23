var util = require('./util');
var ok = require('assert').ok;
var nodePath = require('path');
var Feed = require('feed');
var extend = require('raptor-util/extend');
var async = require('async');
var fs = require('fs');
var walk = require('./walk');

function dateComparatorDescending(a, b) {
    a = a.date.getTime();
    b = b.date.getTime();

    return b - a;
}

function padTimeField(n){
    return n<10 ? '0'+n : n;
}


var createDefaultGenerator = function(site, callback) {
    var outputDir = site.outputDir;
    var logger = site.logger;

    return {
        before: function(callback) {
            callback();
        },

        after: function(callback) {
            callback();
        },

        log: function() {

        },

        createFeed: function() {
            return new Feed({
                    title: site.title,
                    description: site.description,
                    link: site.feedUrl,
                    image: site.feedImage,
                    copyright: site.copyright,
                    author: site.author
                });
        },

        feedAddPost: function(post, feed) {
            var bodyHtml = post.bodyHtml;
            var authors = post.authors || post.author;
            var contributors = post.contributors || post.contributor;

            feed.addItem({
                title: post.title,
                link: this.postUrl(post),
                description: bodyHtml,
                author: Array.isArray(authors) ? authors : [authors],
                contributor: Array.isArray(contributors) ? contributors : [contributors],
                date: post.date,
                image: post.image
            });
        },

        formattedDate: function(date) {
            return date.toLocaleDateString("en-US", {weekday: "long", year: "numeric", month: "long", day: "numeric"});
        },

        indexFile: function(post) {
            return nodePath.join(outputDir, 'index.html');
        },

        postFile: function(post) {
            if (post.isPublished) {
                return post.outputFile ||
                    (post.outputFile = nodePath.join(outputDir, post.name, 'index.html'));
            } else {
                return post.outputFile ||
                    (post.outputFile = nodePath.join(outputDir, post.draftUrl, 'index.html'));
            }
            
        },

        postCategoryFile: function(postCategory) {
            return postCategory.outputFile ||
                (postCategory.outputFile = nodePath.join(outputDir, 'category', postCategory.name, 'index.html'));
        },

        htmlFileUrl: function(file) {
            var relPath = nodePath.relative(outputDir, file);
            if (relPath.endsWith('/index.html')) {
                relPath = relPath.slice(0, 0-'index.html'.length);
            }

            return site.baseUrl + relPath;
        },

        postUrl: function(post) {
            return this.htmlFileUrl(this.postFile(post));
        },

        postCategoryUrl: function(postCategory) {
            return this.htmlFileUrl(this.postCategoryFile(postCategory));
        },

        machineDate: function(date) {
            return date.getUTCFullYear() + '-' +
               padTimeField(date.getUTCMonth()+1) + '-' +
               padTimeField(date.getUTCDate());
        },

        writeIndex: function(site, callback) {
            var outputFile = this.indexFile(site);
            var out = this.generateIndex();
            util.writeFile(
                outputFile,
                out,
                callback);
        },

        writePost: function(post, callback) {
            var outputFile = this.postFile(post);
            var out = this.generatePost(post);
            util.writeFile(
                outputFile,
                out,
                callback);
        },

        writePostCategory: function(postCategory, callback) {
            var outputFile = this.postCategoryFile(postCategory);
            var out = this.generatePostCategory(postCategory);
            util.writeFile(
                outputFile,
                out,
                callback);
        },

        generatePost: function(post) {
            throw new Error('generatePost(post) is not implemented');
        },

        generatePostCategory: function(postCategory) {
            throw new Error('generatePostCategory(postCategory) is not implemented');
        },

        generateIndex: function(site) {
            throw new Error('generateIndex(site) is not implemented');
        },

        writeAtomXml : function(feed, callback) {
            var atomXml = feed.render('atom-1.0');
            util.writeFile(nodePath.join(outputDir, 'atom.xml'), atomXml, callback);
        },

        writeRSSXml : function(feed, callback) {
            var rssXml = feed.render('rss-2.0');
            util.writeFile(nodePath.join(outputDir, 'rss.xml'), rssXml, callback);
        },

        copyStaticFiles: function(callback) {


            var staticDir = nodePath.join(site.dir, 'static');
            logger.info('Copying static files from "' + staticDir + '"...');

            var queue = util.queue(callback);

            queue.push(function(callback) {
                
                walk(
                    staticDir,
                    {
                        file: function(file) {
                            var relPath = nodePath.relative(staticDir, file);
                            var targetFile = nodePath.join(outputDir, relPath);

                            logger.info('Copying "' + relPath + '" to "' + targetFile + '"...');

                            queue.push(function(callback) {
                                async.map([file, targetFile], util.lastModified, function(err, results){
                                    console.log('results: ', results);
                                    if (results[1] === -1 || results[1] > results[0]) {
                                        var inStream = fs.createReadStream(file);
                                        var outStream = fs.createWriteStream(targetFile);
                                        inStream
                                            .pipe(outStream)
                                            .on('close', function() {
                                                callback();
                                            })
                                            .on('error', function(err) {
                                                callback(err);
                                            });
                                    } else {
                                        callback();
                                    }
                                });
                            });
                            
                        }
                    },
                    callback);
            });
            
        }

    };
};

exports.generate = function(site, callback) {
    var outputDir = site.outputDir = site.outputDir || nodePath.join(process.cwd(), 'public');
    if (!site.baseUrl.endsWith('/')) {
        site.baseUrl = site.baseUrl + '/';
    }

    ok(site != null, 'site is required');
    ok(typeof callback === 'function', 'callback should be a function');

    var callbackInvoked = false;
    function callbackWrapper(e) {
        if (callbackInvoked) {
            throw new Error('Callback invoked multiple times');
        }

        callbackInvoked = true;

        callback(e, {
            outputDir: outputDir
        });
    }

    var themeModule = site.themeModule;

    var defaultGenerator = createDefaultGenerator(site, util);
    
    var themeGenerator = themeModule(site, util);

    var generator = Object.create(defaultGenerator);
    extend(generator, themeGenerator);
    generator.$super = defaultGenerator;
    site.generator = generator;

    var feed = generator.createFeed();

    site.posts.all.sort(dateComparatorDescending);

    var posts = site.posts.all;
    
    function writeHtml(callback) {    
        var queue = util.queue(callback);

        queue.push(function writeIndex(callback) {
            generator.writeIndex(site, callback);
        });

        posts.forEach(function(post, i) {
            var newerPost = i > 0 ? posts[i-1] : null;
            var olderPost = i < posts.length - 1 ? posts[i+1] : null;
            post.nextNewerPost = newerPost;
            post.nextOlderPost = olderPost;

            queue.push(function writeIndex(callback) {
                post.markdownFile.readBodyHtml(function(err, bodyHtml) {
                    post.bodyHtml = bodyHtml;
                    generator.feedAddPost(post, feed);
                    generator.writePost(post, function(err) {
                            delete post.bodyHtml; // Save memory in case there are lots of posts...

                            if (err) {
                                return err(callback);
                            }

                            callback();
                        });
                });
            });
        });

        site.draftPosts.all.forEach(function(post, i) {
            if (!post.draftUrl) {
                // Skip draft posts that don't have a URL
                return;
            }

            queue.push(function writeIndex(callback) {
                post.markdownFile.readBodyHtml(function(err, bodyHtml) {
                    post.bodyHtml = bodyHtml;
                    generator.writePost(post, function(err) {
                            delete post.bodyHtml; // Save memory in case there are lots of posts...

                            if (err) {
                                return err(callback);
                            }

                            callback();
                        });
                });
            });
        });

        site.postCategories.all.forEach(function(postCategory) {

            queue.push(function writeIndex(callback) {
                generator.writePostCategory(postCategory, callback);
            });
        });
    }

    async.series([
        function before(callback) {
            generator.before(callback);
        },

        function writeAtomXml(callback) {
            generator.writeAtomXml(feed, callback);
        },

        writeHtml,

        function writeRSSXml(callback) {
            generator.writeRSSXml(feed, callback);
        },

        function copyStaticFiles(callback) {
            generator.copyStaticFiles(callback);
        },
        
        function after(callback) {
            generator.after(callback);
        },
    ], callbackWrapper);

    
};


