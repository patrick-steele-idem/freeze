var express = require('express');
var app = express();
var loader = require('./loader');
var generator = require('./generator');
var nodePath = require('path');
var port = 8080;

var dir = process.cwd();

var startTime = Date.now();
console.log('Generating site...');

var loadOptions = {
    includeUnpublished: true
};

loader.load(dir, loadOptions, function(err, site) {
    var outputDir = site.outputDir;
    app.use('/', express.static(outputDir));

    site.url = 'http://localhost:8080/';

    generator.generate(site, function(err) {

        if (err) {
            console.log('Failed to generate site. Error: ' + (err.stack || err));
            process.exit(1);
        } else {
            console.log('Site generated in ' + (Date.now() - startTime) + 'ms');
        }
        
        app.listen(port, function() {
            console.log('Listening on port %d', port);

            if (process.send) {
                process.send('online');
            }
        });
    });
});