"use strict";
var fs = require("fs"),
    path = require("path");

var settings = {
    varname: "resources",
    strip: "yes",
    preserve_file_names: "no",
    output: null,
};
var data = {};
var inQueue = 0;

function stripCommentsAndSpaces(str) {
    return str
        .replace(/ *\/\/.*|\/\*(?:[^*]+|\*+(?![*\/]))*\*\//g, "")
        .replace(/\t/g, " ")
        .replace(/^ +/gm, "")
        .replace(/ +$/gm, "")
        .replace(/  +$/g, " ")
        .replace(/([A-Za-z0-9]) ([^.A-Za-z0-9])/g, "$1$2")
        .replace(/([^A-Za-z0-9.]) ([A-Za-z0-9])/g, "$1$2")
        .replace(/([(){}\[\]]) ([(){}\[\]])/g, "$1$2");
}

var strip = {
    glsl: stripCommentsAndSpaces,
};

function processCommandLine() {
    var argv = process.argv,
        n = argv.length,
        i,
        arg,
        key,
        val;
    for (i = 2; i < n; ++i) {
        arg = argv[i];
        if (/^-/.test(arg)) {
            val = /^-([^=]+)=(.*)$/.exec(arg);
            if (val) {
                key = val[1];
                val = val[2];
                if (settings.hasOwnProperty(key)) {
                    settings[key] = val;
                } else {
                    console.error("Unknown key: -" + key);
                    process.exit(2);
                }
            } else {
                console.error("Unknown flag: " + arg);
                process.exit(2);
            }
        } else {
            ++inQueue;
            readFile(arg);
        }
    }
}

function readFile(name) {
    fs.readFile(name, function (err, content) {
        if (err) throw err;
        var n = path.basename(name);
        var ext = n.replace(/.*\./, "");
        if (settings.preserve_file_names !== "yes" && settings.preserve_file_names !== "true") {
            n = n.replace(/\.[^.]+$/, "");
            n = n.replace(/[^A-Za-z0-9_]/g, "_");
        }
        content = content.toString();
        if (settings.strip !== "no" && settings.strip !== "false" && strip.hasOwnProperty(ext))
            content = strip[ext](content);
        data[n] = content;
        if (--inQueue == 0) {
            process.nextTick(finish);
        }
    });
}

function finish() {
    var str = "/** @enum {string} */\n";
    if (settings.varname.indexOf(".") === -1) str += "var ";
    str += settings.varname + "={";
    Object.getOwnPropertyNames(data)
        .sort()
        .forEach(function (key) {
            str += "\n" + JSON.stringify(key) + ":" + JSON.stringify(data[key]) + ",";
        });
    str = str.substr(0, str.length - 1) + "\n};";
    if (settings.output) fs.writeFileSync(settings.output, str);
    else console.log(str);
}

process.nextTick(processCommandLine);
