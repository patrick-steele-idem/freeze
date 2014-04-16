var fs = require('fs');
var shortstop = require('shortstop');
var nodePath = require('path');
var ok = require('assert').ok;
var mkdirp = require('mkdirp');

exports.Collection = require('./Collection');
exports.walk = require('./walk');
exports.MarkdownFile = require('./MarkdownFile');

exports.readJsonFile = function(path, callback) {

    var dirname = nodePath.dirname(path);
    

    var resolver = shortstop.create();
    resolver.use('path', function resolve(value) {
        return nodePath.resolve(dirname, value);
    });


    fs.readFile(path, 'utf8', function(err, json) {
        if (err) {
            return callback(err);
        }

        var o;

        try {
            o = JSON.parse(json);
        } catch(e) {
            return callback(new Error('Unable to parse JSON file "' + path + '". Exception: ' + (e.stack || e)));
        }

        resolver.resolve(o, function (err, o) {
            if (err) {
                return callback(err);
            }

            callback(null, o);
        });
    });
};

exports.writeFile = function(input, outputFile, callback) {
    ok(input != null, 'input is required');
    ok(typeof outputFile === 'string', 'output file should be a string path');
    ok(typeof callback === 'function', 'callback should be a function');

    var outDir = nodePath.dirname(outputFile);

    mkdirp(outDir, function(err) {
        if (err) {
            callback(err);
        }

        if (input.pipe) {
            var outStream = fs.createWriteStream(outputFile, {encoding: 'utf8'});
            input
                .pipe(outStream)
                .on('error', function(e) {
                    callback(e);
                })
                .on('close', function() {
                    callback();
                });
        } else {
            fs.writeFile(outputFile, input, {encoding: 'utf8'}, callback);
        }
    });
};

exports.safeFilename = function(str) {
    return str.replace(/^[^A-Za-z0-9_\.]+/g, '-');
};