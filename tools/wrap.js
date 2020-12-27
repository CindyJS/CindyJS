"use strict";
var fs = require("fs");

var needle = new RegExp(process.argv[2], "m"),
    filename = process.argv[3];
var haystack = fs.readFileSync(filename, { encoding: "utf8" });
var res = needle.exec(haystack);
if (!res) process.exit(1);
process.stdout.write(haystack.substr(0, res.index));
process.stdin.pipe(process.stdout);
process.stdin.on("end", function () {
    process.stdout.write(haystack.substr(res.index + res[0].length));
});
