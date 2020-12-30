"use strict";

var v = process.version;
v = v.replace(/^v/, "");
v = v.split(".");
v = v.map(function (s) {
    return parseInt(s);
});
var a = v[0],
    b = v[1],
    c = v[2];
if (a < 8 || (a == 8 && b < 11) || (a == 8 && b == 10 && c < 2)) {
    console.error("Node 8.11.2 or later required. Version " + process.version + " found");
    process.exit(1);
}
if (a == 6 && b == 2 && c >= 1) {
    console.error("Node version 6.2.x for x >= 1 have a bug,");
    console.error("likely causing the “forbidden” check to fail.");
    console.error("See https://github.com/nodejs/node/issues/7308");
    console.error("and https://github.com/CindyJS/CindyJS/pull/378 for details.");
}
