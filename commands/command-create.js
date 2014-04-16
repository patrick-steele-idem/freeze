var File = require('raptor/files/File'),
    files = require('raptor/files'),
    path = require('path');

module.exports = {
    usage: 'Usage: $0 create [blog-name]',

    options: {
        'overwrite': {
            type: 'boolean',
            describe: 'Overwrite existing files'
        }
    },

    validate: function(args, rapido) {
        var name = args._[0];

        if (!name) {
            outputDir = new File(process.cwd());
            name = new File(process.cwd()).getName();
        }
        else {
            outputDir = path.join(process.cwd(), name);
        }

        return {
            name: name,
            outputDir: outputDir,
            overwrite: args['overwrite'] === true
        };
    },

    run: function(args, config, rapido) {
        var outputDir = args.outputDir,
            overwrite = args.overwrite;

        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var day = now.getDate();

        function padNum(num) {
            num = '' + num;
            if (num.length < 2) {
                num = '0' + num;
            }
            return num;
        }

        var today = year + '-' + padNum(month) + '-' + padNum(day);

        var prompt = rapido.prompt;
        prompt.start();
        prompt.get(
            {
                properties: {
                    'author': {
                        description: 'Author',
                        required: false
                    },
                    'title': {
                        description: 'Title',
                        required: false
                    },
                    'subtitle': {
                        description: 'Subtitle',
                        required: false
                    },
                    'description': {
                        description: 'Descriptioncat b',
                        required: false
                    }
                }       
            }
            , 
            function (err, result) {
                if (err) { 
                    rapido.log.error(err);
                    return;
                }
                
                var author = result.author;
                var title = result.title;
                var subtitle = result.subtitle;
                var description = result.description;
                
                if (!title && author) {
                    title = 'author';
                }

                rapido.scaffold(
                    {
                        scaffoldDirProperty: "scaffold.blog.dir",
                        outputDir: args.outputDir,
                        overwrite: true,
                        data: {
                            author: author,
                            title: title,
                            subtitle: subtitle,
                            description: description,
                            today: today
                        },
                        afterFile: function(outputFile) {
                            
                        },
                        beforeFile: function(outputFile, content) {
                            if (outputFile.exists()) {
                                if (outputFile.getName() === rapido.configFilename) {
                                    // File already exists... we need to merge
                                    var newConfig = JSON.parse(content);
                                    rapido.updateConfig(outputFile, newConfig);
                                    rapido.log.success('update', outputFile.getAbsolutePath());
                                    return false;
                                }
                                return overwrite;
                            }

                            return true;
                        }
                    });

                rapido.log.success('finished', 'Blog written to "' + outputDir + '"');
                rapido.log('To build your blog:');
                rapido.log.info('blog build');
                rapido.log('\nTo create a new post:');
                rapido.log.info('blog create post');
            });


        
    }
}