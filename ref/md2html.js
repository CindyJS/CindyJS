"use strict";

var fs = require("fs"), path = require("path"), marked = require("marked");

var tmpl = fs.readFileSync(path.join(__dirname, "template.html")).toString()
var md = fs.readFileSync(process.argv[2]).toString();
marked(md, function(err, html) {
    if (err) throw err;
    html = tmpl.replace(/<div id="content"><\/div>/, html);
    fs.writeFileSync(process.argv[3], html);
});
