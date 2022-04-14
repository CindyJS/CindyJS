var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
    isNode: true,
    csconsole: null,
    geometry: [],
});

function itCmd(command, expected) {
    it(command, function () {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("Multiplication precision bug", function () {
    itCmd("z = 0; repeat(1001, z = z ^ 2 + i; z);", "0 - i*1");
    itCmd("z = 0; repeat(1000, z = z ^ 2 + i; z);", "-1 + i*1");
});
