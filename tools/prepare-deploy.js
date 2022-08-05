"use strict";

var fs = require("fs");
var path = require("path");
var ppath = path.posix;
var url = require("url");
var child_process = require("child_process");

var inDir = "build/js";
var outDir = "build/deploy";
var head = null;

var handlers = {
    "Cindy.closure.js": false,
    "Cindy.closure.js.map": false,
    "Cindy.closure.js.tmp.map": false,
    "Cindy.js": subst,
    "Cindy.js.map": map,
    "Cindy.plain.js": false,
    "Cindy.plain.js.map": false,
    "Cindy3D.js": true,
    "Cindy3D.js.map": map,
    "CindyGL.js": true,
    "CindyGL.js.map": map,
    "CindyPrint.js": true,
    "CindyPrint.js.map": map,
    "CindyPrintWorker.js": true,
    "CindyPrintWorker.js.map": map,
    "csg.js": false,
    "CindyLeap.js": true,
    "CindyLeap.js.map": map,
    "leap-0.6.4.js": false,
    "CindyXR.js": true,
    "CindyXR.js.map": map,
    "QuickHull3D.js": true,
    "QuickHull3D.js.map": map,
    "CindyJS.css": true,
    "CindyJS.css.map": map,
    "Compiled.js": false,
    "ComplexCurves.js": true,
    "ComplexCurves.js.map": false,
    "ComplexCurves.plugin.js": false,
    "Version.js": false,
    "WEB-INF": false,
    "c3dres.js": false,
    "cglres.js": false,
    "exposed.js": false,
    "exposed.js.map": false,
    "ifs.js": true,
    "ifs.js.map": true,
    images: true,
    katex: true,
    "katex-plugin.js": true,
    midi: true,
    "midi-plugin.js": true,
    "ours.js": false,
    "ours.js.map": false,
    "pako.min.js": true,
    quickhull3d: true,
    soundfonts: true,
    "symbolic.js": true,
    "webfont.js": true,
};

var exitStatus = 0;

process.once("beforeExit", function () {
    process.exit(exitStatus);
});

function check(err) {
    if (err) {
        console.error(err.stack);
        exitStatus = 1;
    }
}

child_process.execFile("git", ["rev-parse", "HEAD"], function (err, stdout, stderr) {
    if (err) {
        console.log(stdout);
        console.error(stderr);
        throw err;
    }
    var match = /^([0-9a-f]{40})\r?\n?$/.exec(stdout);
    if (!match) throw Error("Not a valid commit id: " + stdout);
    head = match[1];
    fs.readdir(inDir, lsDir);
});

function lsDir(err, files) {
    if (err) throw err;
    files.forEach(function (filename) {
        var inFile = path.join(inDir, filename);
        var handler = handlers[filename];
        if (handler === undefined) {
            console.error("Don't know whether to keep " + filename);
            exitStatus = 2;
            return;
        }
        if (handler === false) return;
        if (handler === true) {
            fs.stat(inFile, copy.bind(null, inFile, path.join(outDir, filename)));
            return;
        }
        fs.readFile(inFile, handler.bind(null, filename));
    });
}

function subst(name, err, content) {
    if (err) throw err;
    content = content.toString();
    content = content.replace(/\$gitid\$/, head);
    fs.writeFile(path.join(outDir, name), content, check);
}

var mapKeys = ["version", "file", "sourceRoot", "sources", "sourcesContent", "names", "mappings"];
mapKeys.reverse(); // so that missing keys (indexOf returns -1) go to the end

function map(name, err, content) {
    if (err) throw err;
    var map = JSON.parse(content.toString());
    if ("lineCount" in map) {
        map.x_google_linecount = map.lineCount;
        delete map.lineCount;
    }
    var root = map.sourceRoot || ".";
    map.sourceRoot = "https://raw.githubusercontent.com/CindyJS/CindyJS/" + head + "/";
    map.sources = map.sources.map(function (src) {
        if (/^ \[synthetic:.*\] $/.test(src)) return src;
        if (/^lib|node_modules/.test(src)) return src;
        return ppath.normalize(ppath.join("build/js", root, src));
    });
    map.sourcesContent = map.sources.map(function (src) {
        if (!/^build/.test(src) || /^build\/js\/src\/com\/google/.test(src)) return null;
        return fs.readFileSync(src, "utf-8");
    });
    var keys = Object.keys(map);
    keys.sort(function (a, b) {
        return mapKeys.indexOf(b) - mapKeys.indexOf(a) || (a > b ? 1 : a < b ? -1 : 0);
    });
    content =
        "{" +
        keys
            .map(function (key) {
                return JSON.stringify(key) + ":" + JSON.stringify(map[key]);
            })
            .join(",\n ") +
        "}\n";
    fs.writeFile(path.join(outDir, name), content, check);
}

function copy(inPath, outPath, err, stats) {
    if (err) throw err;
    if (stats.isDirectory()) {
        copyDir(inPath, outPath);
    } else {
        fs.createReadStream(inPath).pipe(fs.createWriteStream(outPath));
    }
}

function copyDir(inPath, outPath) {
    var created = false,
        filesList = null;
    fs.mkdir(outPath, function (err) {
        if (err) throw err;
        created = true;
        if (filesList) next();
    });
    fs.readdir(inPath, function (err, files) {
        if (err) throw err;
        filesList = files;
        if (created) next();
    });
    function next() {
        filesList.forEach(function (filename) {
            var inFile = path.join(inPath, filename);
            var outFile = path.join(outPath, filename);
            fs.stat(inFile, copy.bind(null, inFile, outFile));
        });
    }
}
