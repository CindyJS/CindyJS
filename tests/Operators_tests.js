var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
            isNode: true,
            csconsole: null,
        });

function itCmd(command, expected) {
    it(command, function() {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("Operators: format", function(){
    itCmd('format(1.23456, 0)', '1');
    itCmd('format(1.23456, 1)', '1.2');
    itCmd('format(1234567.89, 1)', '1234567.9');
    itCmd('format(1.23456, -1)', '1');

    itCmd('format(123456.000, 2)', '123456');

    // modifiers
    itCmd('format(1.23456, 2, locale->"de")', '1,23');
    itCmd('format(exp(2*pi*i), 2, locale->"de", truncate->false)', '1,00');
    itCmd('format(exp(2*pi*i), 2, locale->"de", truncate->true)', '1');
    itCmd('format(1234567.89, 1, locale->"de")', '1234567,9');
    itCmd('format(123456.000, 2, truncate->false)', '123456.00');

    // fancy stuff
    itCmd('format(123456.789, 3, locale->"zh-Hans-CN-u-nu-hanidec")', '一二三四五六.七八九');
    itCmd('format(123456.789, 3, locale->"ar")', '١٢٣٤٥٦٫٧٨٩');
});
