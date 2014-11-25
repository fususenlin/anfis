var fis = module.exports = require('fis');
fis.require.prefixes = ['anfis', 'fis'];
fis.cli.name = 'anfis';
fis.cli.info = fis.util.readJSON(__dirname + '/package.json');
fis.cli.version = require('./version.js');
fis.cli.help.commands = ['release', 'install', 'server', 'init'];

var defaultConfig = require('./configs/default.js');
fis.config.merge(defaultConfig);

fis.olpm = function (info) {
    if (typeof info === 'string') {
        info = {
            code: info,
            pack: arguments[1]
        };
    }
    info.pack = info.pack || fis.olpm.PACK_TYPE_EXTERNAL;
    fis.config.set('olpm', info);

    var domain = 'http://image.uc.cn';
    if (info.hasOwnProperty('domain') && info.domain) {
        domain = info.domain.replace(/\/$/, '');
    }
    fis.config.set('roadmap.domain', domain);
    fis.config.set('roadmap.path', require('./configs/olpm.js'));
    fis.config.set('modules.prepackager', require('./plugins/prepackager/olpm-pack.js'));
    fis.config.set('modules.postpackager', require('./plugins/postpackager/olpm-release.js'));
};

fis.olpm.PACK_TYPE_INLINE = 1;
fis.olpm.PACK_TYPE_EXTERNAL = 2;
//fis.olpm.PACK_TYPE_COMBO    = 3;

fis.lego = function (info) {
    if (typeof info === 'string') info = {
        code: info
    };
    info.hash = fis.util.md5(Date.now() + '-' + Math.random());
    fis.config.set('lego', info);
    if (!info.code) {
        fis.log.error('missing project code, use `fis.config.set("lego.code", value);` in fis-conf.js');
        return process.exit(1);
    }
    if (!info.version) info.version = '_';
    var domain = 'http://image.uc.cn';
    if (info.hasOwnProperty('domain') && info.domain) {
        domain = info.domain.replace(/\/$/, '');
    }
    fis.config.set('roadmap.domain', domain);
    fis.config.set('roadmap.path', require('./configs/lego'));
    fis.config.set('modules.preprocessor.css', require('./plugins/preprocessor/lego').CSS);
    fis.config.set('modules.preprocessor.js', require('./plugins/preprocessor/lego').JS);
    fis.config.set('modules.preprocessor.html', require('./plugins/preprocessor/lego').HTML);
    fis.config.set('modules.postprocessor.css', require('./plugins/postprocessor/lego').CSS);
    fis.config.set('modules.postprocessor.js', require('./plugins/postprocessor/lego').JS);
    fis.config.del('modules.postprocessor.html');
    fis.config.set('modules.prepackager', require('./plugins/prepackager/lego'));
    fis.config.del('modules.postpackager');
};

fis.seo = function (name) {
    if (typeof name === 'object') {
        fis.config.merge(name);
    } else {
        fis.config.set('name', name || '');
    }
    fis.config.set('roadmap.path', [
        {
            reg: 'map.json',
            release: 'config/map.json'
    },
        {
            reg: /\/(components|views)(?=\/).*\/_[^\/]+\.tpl$/,
            isHtmlLike: true,
            isJsLike: false,
            isSwig: true,
            release: false
    },
        {
            reg: /\/(components|views)(?=\/).*\/_[^\/]+$/,
            release: false
    },
        {
            reg: /\/readme\.md$/i,
            release: false
    },
        {
            reg: /^\/components\/(.*\.tpl)$/i,
            isHtmlLike: true,
            isJsLike: false,
            isSwig: true,
            useMap: true,
            useDomain: false,
            url: 'views/c/$1',
            release: '/views/c/$1'
    },
        {
            reg: /^\/components\/(.*)$/i,
            isMod: true,
            release: '/public/c/$1'
    },
        {
            reg: /^\/views\/(.*\.tpl)$/i,
            isHtmlLike: true,
            useMap: true,
            isSwig: true,
            useDomain: false,
            url: 'views/$1',
            release: '/views/$1'
    },
        {
            reg: /^\/views\/(.*)$/i,
            release: '/public/v/$1'
    },
        {
            reg: '**',
            useMap: false,
            useCompile: false
    }
  ]);
    fis.config.set('modules.packager', 'map');
    fis.config.set('modules.preprocessor.tpl', require('./plugins/preprocessor/swig.js'));
    fis.config.set('modules.postpackager', require('./plugins/postpackager/seo.js'));
};

//alias
Object.defineProperty(global, 'anfis', {
    enumerable: true,
    writable: false,
    value: fis
});