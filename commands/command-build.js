var cwd = process.cwd();
var freeze = require('../');

module.exports = {
    usage: 'Usage: $0 build',

    options: {
        'unpublished': {
            type: 'boolean',
            describe: 'Include unpublished posts'
        }
    },

    validate: function(args, rapido) {
        var dir = args._[0] || cwd;


        return {
            includeUnpublished: args.unpublished === true,
            dir: dir
        };
    },

    run: function(args, config, rapido) {

        var startTime = Date.now();
        console.log('Generating site...');

        var options = {
            includeUnpublished: args.includeUnpublished === true
        };

        freeze.generate(args.dir, options, function(err) {
            if (err) {
                console.log('Failed to generate site. Error: ' + (err.stack || err));
                process.exit(1);
            } else {
                console.log('Site generated in ' + (Date.now() - startTime) + 'ms');
            }
        });
    }
};