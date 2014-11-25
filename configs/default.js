var plugins = {
    define : require('../plugins/postprocessor/define.js'),
    uaeConf : require('../plugins/prepackager/uae-conf.js'),
    frameworkConf : require('../plugins/prepackager/framework-conf.js')
};
module.exports = {
    urlPrefix : '',
    project : {
        fileType : {
            text : 'handlebars, jade, ejs, jsx, styl'
        }
    },
    modules : {
        parser : {
            handlebars : 'handlebars',
            styl       : 'stylus',
            md         : 'marked'
        },
        lint : {
            js: 'jshint'
        },
        postprocessor : {
            js : [ plugins.define ]
        },
        prepackager : [ plugins.uaeConf ],
        postpackager: [ plugins.frameworkConf ]
    },
    roadmap : {
        ext : {
            jsx : 'js',
            styl : 'css'
        },
        path : [
            {
                reg : '**.handlebars',
                release : false,
                isJsLike : true
            },
            {
                reg : '**.md',
                release : false,
                isHtmlLike : true
            },
            {
                reg : /\.inline\.\w+$/i,
                release : false
            },
            {
                reg : '**.jade'
            },
            {
                reg : /^\/component_modules\/(.*\.tpl)$/i,
                isHtmlLike : true,
                release : '/views/c/$1'
            },
            {
                reg : /^\/components\/(.*\.tpl)$/i,
                isHtmlLike : true,
                release : '/views/c/${name}/${version}/$1'
            },
            {
                reg : /^\/views\/(.*\.tpl)$/,
                useCache : false,
                isViews : true,
                isHtmlLike : true,
                release : '/views/${name}/${version}/$1'
            },
            {
                reg : /^\/component_modules\/(.*)\.(styl|css)$/i,
                id : '$1.css',
                isMod : true,
                useSprite : true,
                useHash : false,
                url : '${urlPrefix}/c/$1.$2',
                release : '/public/c/$1.$2'
            },
            {
                reg : /^\/component_modules\/(.*\.js)$/i,
                id : '$1',
                isMod : true,
                useHash : false,
                url : '${urlPrefix}/c/$1',
                release : '/public/c/$1'
            },
            {
                reg : /^\/component_modules\/(.*)$/i,
                url : '${urlPrefix}/c/$1',
                release : '/public/c/$1'
            },
            {
                reg : /^\/components\/(.*)\.(styl|css)$/i,
                id : '${name}/${version}/$1.css',
                isMod : true,
                useSprite : true,
                useHash : false,
                url : '${urlPrefix}/c/${name}/${version}/$1.$2',
                release : '/public/c/${name}/${version}/$1.$2'
            },
            {
                reg : /^\/components\/(.*\.js)$/i,
                id : '${name}/${version}/$1',
                isMod : true,
                isComponent : true,
                useHash : false,
                url : '${urlPrefix}/c/${name}/${version}/$1',
                release : '/public/c/${name}/${version}/$1'
            },
            {
                reg : /^\/components\/(.*)$/i,
                url : '${urlPrefix}/c/${name}/${version}/$1',
                release : '/public/c/${name}/${version}/$1'
            },
            {
                reg : /^\/views\/(.*\.(?:html?|js))$/,
                useCache : false,
                isViews : true,
                url : '${urlPrefix}/${name}/${version}/$1',
                release : '/public/${name}/${version}/$1'
            },
            {
                reg : /^\/views\/(.*)$/,
                useSprite : true,
                isViews : true,
                url : '${urlPrefix}/${name}/${version}/$1',
                release : '/public/${name}/${version}/$1'
            },
            {
                reg : /^\/public\/(.*)$/,
                useSprite : true,
                url : '${urlPrefix}/${name}/${version}/$1',
                release : '/public/${name}/${version}/$1'
            },
            {
                reg : 'map.json',
                release : false
            },
            {
                reg : '**',
                useHash : false,
                useCompile : false
            }
        ]
    },
    uae_conf : {
        config : {
            description: 'UAE 会自动修改这个文件中的配置，请勿手工修改',
            memcached : [
                {
                    name : '',
                    host : '127.0.0.1',
                    port : 11211
                }
            ]
        }
    },
    settings: {
        spriter: {
            csssprites: {
                htmlUseSprite: true,
                styleReg: /(<style(?:(?=\s)[\s\S]*?["'\s\w\/\-]>|>))([\s\S]*?)(<\/style\s*>|$)/ig
            }
        }
    }
};