var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
            ],
        });

function itCmd(command, expected) {
    it(command, function() {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("Operators: format", function(){
    itCmd('format(1.23456, 0)', '1');
    itCmd('format(1.23456, 1)', '1.2');

    itCmd('format(1.23456, -1)', '1');

    // modifiers
    itCmd('format(1.23456, 2, delimiter->",")', '1,23');
    itCmd('format(exp(2*pi*i), 2, delimiter->",", truncate->false)', '1,00');
    itCmd('format(exp(2*pi*i), 2, delimiter->",", truncate->true)', '1');
});
