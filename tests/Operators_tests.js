var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
                {name:"A", type:"Free", pos:[0,0,1]},
                {name:"B", type:"Free", pos:[1,0,0]},
                {name:"a", type:"Join", args:["A","B"]},
                {name:"linf", type:"FreeLine", pos:[0,0,4]},
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

describe("Operators: halfplane", function(){
    itCmd('halfplane(A,a)', 'polygon');
    // farpoint input
    itCmd('halfplane(B,a)', '___');
    // farpoint input
    itCmd('halfplane(A,linf)', '___');
    // nada input
    itCmd('halfplane(BBB,a)', '___');
});
