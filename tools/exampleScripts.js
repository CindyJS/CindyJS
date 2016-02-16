"use strict";

const fs = require("fs");
const glob = require("glob");
const reftests = require("../ref/js/runtests.js");
const createCindy = require("../build/js/Cindy.js");
const cdy = createCindy({isNode: true});
const parse = cdy.parse;

let countdown = 2;
let scripts = {};

process.nextTick(collectReftests);

glob("examples/**/*.html", {}, (err, files) => {
    if (err) throw err;
    countdown += files.length - 1;
    for (let file of files) {
        fs.readFile(file, "utf8", (err, body) => {
            if (err) throw err;
            parseFile(file, body);
            if (--countdown === 0)
                finish();
        });
    }
});

function collectReftests() {
    let data = reftests.collectJSON();
    let res = [];
    for (let test of data)
        if (data.cmd)
            res.push({
                code: data.cmd,
                file: data.filename,
            });
    scripts["_"] = res;
    if (--countdown === 0)
        finish();
}

function parseFile(name, content) {
    const re = /<script[^>]*cindyscript[^>]>([^]*?)<\/script>/g;
    let match;
    const res = [];
    while (match = re.exec(content))
        res.push({
            code: match[1],
            file: name,
        });
    if (res.length !== 0)
        scripts[name] = res;
}

const strip = ["stack"];

function clean(elt) {
    if (elt && typeof elt === "object") {
        for (let key in elt) {
            if (strip.indexOf(key) !== -1)
                delete elt[key];
            else
                clean(elt[key]);
        }
    }
    return elt;
}

function finish() {
    let names = Object.keys(scripts).sort();
    scripts = Array.prototype.concat.apply(
        [], names.map(name => scripts[name]));
    for (let script of scripts) // warm cache and store data
        script.tree = clean(parse(script.code));
    let times = [];
    for (let i = 0; i < 5; ++i) {
        let start = process.hrtime();
        for (let script of scripts) // check performance
            parse(script.code);
        let end = process.hrtime();
        times.push((end[0] - start[0]) + (end[1] - start[1])*1e-9);
    }
    let median = times.slice().sort()[times.length >> 1];
    console.log("Parsed " + scripts.length + " scripts in " +
                median + "s [" + times.join(", ") + "]");
    scripts = JSON.stringify(scripts, null, 2);
    fs.writeFileSync("allScripts.json", scripts);
}
