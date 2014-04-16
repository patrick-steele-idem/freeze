var titleRegExp = /^\s*([^=\n]+)\s*[=]{4,}/;
var titleBodyRegExp = /^\s*([^=\n]+)\s*[=]{3,}[=]+\s*([^=][^]*)\s*$/;
var marked = require('marked');
var frontMatter = require('front-matter');
var fs = require('fs');
var ok = require('assert').ok;

marked.setOptions({
    highlight: function (code, lang) {
        return require('highlight.js').highlightAuto(code).value;
    }
});

function MarkdownFile(file) {
    this.file = file;
    this._frontMatter = null;
}

MarkdownFile.prototype = {
    loadFrontMatter: function(callback) {
        if (this._frontMatter) {
            return callback(null, this._frontMatter);
        }

        var _this = this;

        fs.readFile(this.file, 'utf8', function(err, data) {
            if (err) {
                return callback(err);
            }            
            
            var fm = frontMatter(data);

            var attributes = fm.attributes || {};
            _this._frontMatter = attributes;

            if (!attributes.title) {
                var titleMatches = titleRegExp.exec(fm.body);
                
                if (titleMatches) {
                    attributes.title = titleMatches[1];
                }
            }
            
            callback(null, attributes);
        });
    },

    readBodyHtml: function(options, callback) {
        
        if (arguments.length === 1) {
            callback = options;
            options = {};
        }
        
        ok(typeof callback === 'function', 'callback should be a function');

        fs.readFile(this.file, 'utf8', function(err, data) {
            if (err) {
                return callback(err);
            }            
            
            var fm = frontMatter(data);

            var titleBodyMatches = titleBodyRegExp.exec(fm.body);
            
            if (titleBodyMatches) {
                var body = titleBodyMatches[2] || '';
                var bodyHtml = marked(body);
                callback(null, bodyHtml);
            } else {
                callback(null, '');
            }
        });
    }
};

module.exports = MarkdownFile;
