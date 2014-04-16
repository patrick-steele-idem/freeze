var browserRefresh = require('browser-refresh');
var nodePath = require('path');
var fs = require('fs');
var resolve = require('resolve');

module.exports = {
    usage: 'Usage: $0 $commandName [dir]',

    options: {
        'watch-theme': {
            description: 'Watch the theme directory for changes',
            type: 'boolean'
        }
    },

    validate: function(args, rapido) {
        var dir = args._[0];
        if (dir) {
            dir = nodePath.resolve(process.cwd(), dir);
        }
        else {
            dir = process.cwd();
        }
        
        return {
            dir: dir,
            watchTheme: args['watch-theme'] === true
        };
    },

    run: function(args, config, rapido) {
        var dir = args.dir;

        var watch = [dir];

        if (args.watchTheme) {
            var siteFile = nodePath.join(dir, 'site.json');
            var siteMeta = JSON.parse(fs.readFileSync(siteFile, 'utf8'));
            var activeTheme = siteMeta.activeTheme;
            var themeModulePath = resolve.sync(activeTheme, { basedir: dir });
            var themeDir = nodePath.dirname(themeModulePath);
            watch.push(themeDir);
        }

        browserRefresh.start({
            script: require.resolve('../lib/server'),
            args: [dir],
            delay: 0,
            ignore: ['/public','/node_modules', '.*', '*.rhtml.js'],
            watch: watch
        });
    }
};
