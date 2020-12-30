"use strict";

var fs = require("fs");
var util = require("util");
var stream = require("stream");
var path = require("path");
var createDummySourceMap = require("source-map-dummy");
var Concat = require("concat-with-sourcemaps");

const babel = require("@babel/core");

function relative(from, to) {
    if (typeof from !== "string") return to;
    return path.relative(path.dirname(from), to);
}

var inputs = [],
    nextInput = 0,
    concat = null,
    out = null,
    map = null;

function processCommandLine() {
    var args = process.argv,
        n = args.length,
        i,
        arg;
    for (i = 2; i < n; ++i) {
        arg = args[i];
        if (arg === "-o" && i + 1 < n) {
            out = args[i + 1];
            ++i;
        } else if (arg.substr(0, 2) === "-o") {
            out = arg.substr(2);
        } else if (arg === "-m" && i + 1 < n) {
            map = args[i + 1];
            ++i;
        } else if (arg.substr(0, 2) === "-m") {
            map = arg.substr(2);
        } else {
            inputs.push(arg);
        }
    }

    if (out !== null) {
        if (map === null) map = out + ".map";
    }
    concat = new Concat(true, relative(map, out) || "out.js", "");
    for (var i = 0; i < inputs.length; ++i) {
        fs.readFile(inputs[i], "utf8", inputRead.bind(null, i, inputs[i]));
        inputs[i] = null;
    }
}

process.nextTick(processCommandLine);

function inputRead(i, name, err, data) {
    if (err) throw err;
    inputs[i] = { name: name, src: data };
    while (nextInput < inputs.length) {
        var input = inputs[nextInput];
        if (input === null) return; // abort loop, wait till that input becomes available
        addInput(input.name, input.src);
        ++nextInput;
    }
    // loop terminated because we successfully processed all inputs
    writeOutput();
}

function addInput(name, inputSrc) {
    let src = removeImportExport(name, inputSrc);
    name = relative(map, name);

    if (!/\r?\n$/.test(src)) src += "\n";
    var sm = createDummySourceMap(src, {
        source: name,
        type: "js",
    });
    concat.add(name, src, sm);
}

function writeOutput() {
    var content = concat.content;
    if (!/\r?\n$/.test(content)) content += "\n";
    if (map) {
        content += "//# sourceMappingURL=" + relative(out, map) + "\n";
        fs.writeFile(map, concat.sourceMap, reportError);
    }
    if (out) fs.writeFile(out, content, reportError);
    else process.stdout.write(content);
}

function reportError(err) {
    if (err) throw err;
}

function removeImportExport(name, inputSrc) {
    const doNotTransformFiles = ["src/js/Head.js", "src/js/Tail.js"];

    const skip = doNotTransformFiles.includes(name) || !name.includes("src/js");

    function applyBabel(inputSrc) {
        return babel.transformSync(inputSrc, {
            plugins: ["remove-import-export"],
            retainLines: true,
        }).code;
    }

    const src = skip ? inputSrc : applyBabel(inputSrc);
    return src;
}
