'use strict';

module.exports = function( grunt ) {
    // load time-grunt and all grunt plugins found in the package.json
    require( 'time-grunt' )( grunt );
    require( 'load-grunt-tasks' )( grunt );
    grunt.initConfig({
        csslint : {
            test : {
                options : {
                    import : 2
                },
                src : [ 'css/main.css' ]
            }
        },

        concat : {
            dist : {
                src : [ 'css/normalize.css',
                        '_site/css/main.css'],
                dest : 'build/main.css'
            }
        },

        cssmin : {
            dist : {
                src : 'build/main.css',
                dest : '_site/css/main.min.css'
            }
        },

        shell : {
            jekyllBuild : {
                command : 'jekyll build'
            },
            jekyllServe : {
                command : 'jekyll serve'
            }
        },

        watch : {
            files : [ '_layouts/*.html',
                      '_posts/*.markdown',
                      'css/*.css',
                      '_config.yml',
                      'index.html'],
            tasks : [ 'concat',
                      'cssmin',
                      'shell:jekyllServe' ],
            options : {
                spawn : false,
                interrupt : true,
                atBegin : true,
                livereload : true
            }
        }
    });

    // register custom grunt tasks
    grunt.registerTask( 'test', [ 'csslint' ] );
    grunt.registerTask( 'deploy', [ 'concat', 'cssmin', 'shell:jekyllBuild' ] )
};