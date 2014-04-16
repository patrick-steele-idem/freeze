var nodePath = require('path');
var fs = require('fs');
var async = require('async');
var ok = require('assert').ok;
var extend = require('raptor-util').extend;
var resolve = require('resolve');

require('raptor-ecma/es6');

module.exports = function(site, util, callback) {
    site.on('afterLoad', function() {
        var authorsById = site.authors.byId;
        var authorId = site.author;
        site.author = authorsById[authorId] || authorId;
    });


    var siteFile = nodePath.join(site.dir, 'site.json');
    util.readJsonFile(siteFile, function(err, siteMeta) {
        if (err) {
            return callback(err);
        }

        extend(site, siteMeta);


        var activeTheme = site.activeTheme;
        var themeModulePath;

        try {
            themeModulePath = resolve.sync(activeTheme, { basedir: site.dir });
        } catch(e) {
            try {
                themeModulePath = resolve.sync(activeTheme, { basedir: __dirname });    
            } catch(e) {
                throw new Error('Theme module not found: ' + activeTheme + ' - Has it been installed using "npm install ' + activeTheme + '"?');
            }
            
        }
        
        site.themeModule = require(themeModulePath);
        site.themeDir = nodePath.dirname(themeModulePath);

        

        callback();
    });
};