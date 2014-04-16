if( !process.env.NODE_ENV ) process.env.NODE_ENV = 'development';

var path = require('path');

require('rapido').run(process.argv, {
    title: 'Freeze Command Line Tools',
    configFilename: 'freeze.json',
    stackDirs: [
        path.join(__dirname, '..')
    ],
    nodeModulesDirs: [
        path.join(__dirname, '../node_modules')
    ],
    enabledStacks: [
        'freeze'
    ],
    version: function() {
        return require('../package.json').version;
    }
});
