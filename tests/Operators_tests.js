var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
    isNode: true,
    csconsole: null,
    geometry: [],
});

function assume(command, expected) {
    it(command+" evaluates to ", function () {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("Operators: format", function () {
    assume("format(1.23456, 0)", "1");
    assume("format(1.23456, 1)", "1.2");

    assume("format(1.23456, -1)", "1");

    // modifiers
    assume('format(1.23456, 2, delimiter->",")', "1,23");
    assume('format(exp(2*pi*i), 2, delimiter->",", truncate->false)', "1,00");
    assume('format(exp(2*pi*i), 2, delimiter->",", truncate->true)', "1");
});

describe("Reverse", function () {
    assume("reverse([1, 2, 3])", "[3, 2, 1]");
    assume('reverse("Hello")', "olleH");
});

describe("Reference or Value", function() {
    before(function () {
        cdy.evalcs('l=[1,2,3];x=[];x:"a"=[2,3,4];m=l;m_1=2;');
    });
    assume("l","[1, 2, 3]");
    assume("m","[2, 2, 3]");
});