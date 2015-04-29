"use strict";

var fs = require("fs");

var data = fs.readFileSync(process.argv[2], {encoding: "utf-8"});
var match = data.match(/var data = (\{[^]*^\});$/m);
data = JSON.parse(match[1]);

var geometry = data.geometry.map(function(elt) {
    return "\n    {" + Object.keys(elt).map(function(key) {
        return key + ":" + JSON.stringify(elt[key]);
    }).join(", ") + "}";
}).join(",");

var res =
    ('var cdy = createCindy({\n  canvasname: "CSCanvas",\n' +
     '  scripts: "cs*",\n  language: "en",\n  defaultAppearance: {},\n' +
     '  transform: [{ scaleAndOrigin: [' + data.scale + ', ' + data.originX +
     ', ' + data.originY + '] }],\n' +
     '  geometry: [' + geometry + '\n  ] // End of geometry array.\n});')
console.log(res);
