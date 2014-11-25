'use strict';

var DOMParser = require('xmldom').DOMParser;
var forEach = Array.prototype.forEach;

function getDeps(file, files, appendSelf, deps) {
    appendSelf = appendSelf !== false;
    deps = deps || {css: {}, js: {}};

    file.requires.forEach(function (id) {
        var f = files.ids[id];
        if (!f) fis.log.warning('module [' + id + '] not found');
        else getDeps(f, files, true, deps);
    });

    var id = file.getId().replace(file.rExt, '');
    var type = file.rExt.slice(1);
    if (appendSelf && deps[type] && !deps[type][id]) deps[type][id] = 1;
    return {css: Object.keys(deps.css), js: Object.keys(deps.js)};
}

var liveHost, livePort;
var defaultLiveHost = (function () {
    var net = require('os').networkInterfaces();
    for (var key in net) {
        if (net.hasOwnProperty(key)) {
            var details = net[key];
            if (details && details.length) {
                for (var i = 0, len = details.length; i < len; i++) {
                    var ip = String(details[i].address).trim();
                    if (ip && /^\d+(?:\.\d+){3}$/.test(ip) && ip !== '127.0.0.1') {
                        return ip;
                    }
                }
            }
        }
    }
    return '127.0.0.1';
})();

module.exports = function (ret, conf, settings, opt) {
    var lego = fis.config.get('lego');
    var map = ret.lego = {
        code: lego.code,
        views: [],
        units: []
    };
    var units = {};

    fis.util.map(ret.src, function (subpath, file) {
        // 发布包装后的 CSS 文件
        if (file.isCssLike && file.isWrapped) ret.pkg[subpath + '.js'] = file.isWrapped;

        var obj, meta;
        if (file.isView) {
            var doc = new DOMParser({
                errorHandler: {warning: null}
            }).parseFromString(file.getContent());
            obj = {
                code: lego.code + '_container_' + file.filename,
                name: file.filename,
                description: '',
                head: {
                    metas: [],
                    styles: [],
                    scripts: []
                },
                body: {
                    units: [],
                    styles: [],
                    scripts: []
                }
            };

            // 解析 view.json，提取 name、description 等信息
            if (fis.util.exists(file.dirname + '/view.json')) {
                meta = fis.file(file.dirname + '/view.json');
                meta = JSON.parse(meta.getContent());
                fis.util.merge(obj, meta);
                meta = null;
            }

            // 解析 head，提取 META、TITLE 及非组件化资源
            fis.util.map(doc.getElementsByTagName('head')[0].childNodes, function (_, node) {
                if (!node.tagName) return;
                switch (node.tagName.toUpperCase()) {
                case 'META':
                    if (node.getAttribute('name')) {
                        obj.head.metas.push({
                            name: node.getAttribute('name'),
                            content: node.getAttribute('content')
                        });
                    }
                    break;
                case 'TITLE':
                    if (node.childNodes) {
                        obj.head.title = node.childNodes[0].data;
                    }
                    break;
                case 'LINK':
                    if (node.getAttribute('rel') === 'stylesheet') {
                        obj.head.styles.push({
                            url: node.getAttribute('href')
                        });
                    }
                    break;
                case 'STYLE':
                    if (node.childNodes) {
                        obj.head.styles.push({
                            content: node.childNodes[0].data
                        });
                    }
                    break;
                case 'SCRIPT':
                    if (node.getAttribute('src')) {
                        obj.head.scripts.push({
                            url: node.getAttribute('src')
                        });
                    } else if (node.childNodes) {
                        obj.head.scripts.push({
                            content: node.childNodes[0].data
                        });
                    }
                    break;
                }
            });

            // 解析 body，提取布局、单元及非组件化资源
            fis.util.map(doc.getElementsByTagName('body')[0].childNodes, function (_, node) {
                if (!node.tagName) return;
                switch (node.tagName.toUpperCase()) {
                case 'LINK':
                    var item;
                    switch (node.getAttribute('rel').toLowerCase()) {
                    case 'layout':
                        // TODO 此处只是提取布局配置，暂不实现布局支持
                        item = {};
                        forEach.call(node.attributes, function (attr) {
                            item[attr.name] = attr.value;
                        });
                        if (item.name) {
                            delete item.rel;
                            item.code = lego.code + '_layout_' + item.name;
                            obj.body.layouts.push(item);
                        }
                        break;
                    case 'unit':
                        item = {};
                        forEach.call(node.attributes, function (attr) {
                            item[attr.name] = attr.value;
                        });
                        if (item.name) {
                            item.code = lego.code + '_unit_' + item.name;
                            delete item.name;
                            delete item.rel;
                            obj.body.units.push(item);
                        }
                        break;
                    case 'stylesheet':
                        obj.body.styles.push({
                            url: node.getAttribute('href')
                        });
                        break;
                    }
                    break;
                case 'STYLE':
                    if (node.childNodes) {
                        obj.body.styles.push({
                            content: node.childNodes[0].data
                        });
                    }
                    break;
                case 'SCRIPT':
                    if (node.getAttribute('src')) {
                        obj.body.scripts.push({
                            url: node.getAttribute('src')
                        });
                    } else if (node.childNodes) {
                        obj.body.scripts.push({
                            content: node.childNodes[0].data
                        });
                    }
                    break;
                }
            });

            // 增加 livereload 支持
            if (opt.live) {
                liveHost = liveHost || fis.config.get('livereload.hostname', defaultLiveHost);
                livePort = livePort || fis.config.get('livereload.port', 8132);
                obj.body.scripts.push({
                    url: 'http://' + liveHost + ':' + livePort + '/livereload.js'
                });
            }

            map.views.push(obj);
            delete ret.src[file.subpath];
            file.release = false;
        } else if (file.isUnit) {
            // 与目录同名的 ejs、js、css 文件都可以成为单元
            obj = units[file.filename];
            if (!obj) {
                obj = units[file.filename] = {
                    code: lego.code + '_unit_' + file.filename,
                    name: file.filename,
                    description: ''
                };
                map.units.push(obj);

                // 解析 unit.json，提取 name、description 等信息
                if (fis.util.exists(file.dirname + '/unit.json')) {
                    meta = fis.file(file.dirname + '/unit.json');
                    meta = JSON.parse(meta.getContent());
                    fis.util.merge(obj, meta);
                    meta = null;
                }
            }

            if (file.isHtmlLike) {
                obj.source = file.getContent();
                var data = ret.src[file.subdirname + '/data.js'];
                if (data) {
                    obj.data = data.getContent();
                    delete ret.src[data.subpath];
                    data.release = false;
                } else {
                    obj.data = '{}';
                }
                // 以 HTML 为单元入口计算依赖
                delete obj.css;
                delete obj.js;
                obj = fis.util.merge(obj, getDeps(file, ret));

                delete ret.src[file.subpath];
                file.release = false;
            } else if (file.isCssLike && !obj.source && !obj.js) {
                // 单元无 HTML 入口和 JS 入口，以 CSS 为入口计算依赖
                obj = fis.util.merge(obj, getDeps(file, ret));
            } else if (file.isJsLike && !obj.source) {
                // 单元无 HTML 入口，以 JS 为入口计算依赖
                delete obj.css;
                obj = fis.util.merge(obj, getDeps(file, ret));
            }

            var thumb = ret.src[file.subdirname + '/thumb.png'];
            if (thumb) obj.thumb = thumb.getUrl(opt.md5, opt.domain);
        } else if (file.isOther && opt.dest !== 'preview') {
            delete ret.src[file.subpath];
            file.release = false;
        }
    });

    var file = fis.file(fis.project.getProjectPath('release.json'));
    file.setContent(JSON.stringify(map, null, 2));
    file.compiled = true;
    ret.pkg[file.subpath] = file;
};