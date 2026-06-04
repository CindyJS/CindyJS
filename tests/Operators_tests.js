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

describe("Operators: format", function () {
    itCmd("format(1.23456, 0)", "1");
    itCmd("format(1.23456, 1)", "1.2");

    itCmd("format(1.23456, -1)", "1");

    // modifiers
    itCmd('format(1.23456, 2, delimiter->",")', "1,23");
    itCmd('format(exp(2*pi*i), 2, delimiter->",", truncate->false)', "1,00");
    itCmd('format(exp(2*pi*i), 2, delimiter->",", truncate->true)', "1");
});

describe("Operators: reverse", function () {
    itCmd("reverse([1, 2, 3])", "[3, 2, 1]");
    itCmd('reverse("Hello")', "olleH");
});

describe("Operators: if", function () {
    itCmd('isundefined(if(blabla,"a","b"))', "true");
    itCmd('if(true,"a","b")', "a");
    itCmd('if(false,"a","b")', "b");
});

describe("Operators: angles", function () {
    itCmd("-45°", "-45°");
    itCmd("round(37°/15°) * 15°", "30°");
    itCmd("mod(456°, 360°)", "96°");
});

describe("Operators: sequence", function () {
    itCmd("-2.5..2.5", "[-2, -1, 0, 1, 2]");
    itCmd("-1.1..1.4", "[-1, 0, 1]");
    itCmd("-1.9..1.6", "[-1, 0, 1]");
    itCmd("sum(1..10)", "55");
});

describe("Operators: length", function () {
    itCmd("length([1,2,3])", "3");
    itCmd('length("1234")', "4");
    itCmd("length(42)", "1");
    itCmd("length(var)", "0");
    itCmd("variable=1;length(variable)", "1");
});

describe("Operators: arithmetic", function () {
    itCmd("1+2*3", "7");
    itCmd("(1+2)*3", "9");
    itCmd("5-2-1", "2");
    itCmd("-(2+3)", "-5");
    itCmd("2^3", "8");
    itCmd("(-3)^2", "9");
    itCmd("7/2", "3.5");
});

describe("Operators: comparisons", function () {
    itCmd("1<2", "true");
    itCmd("2<=2", "true");
    itCmd("3>4", "false");
    itCmd("3>=2", "true");
});

describe("Operators: is...", function () {
    itCmd("isundefined(nada)", "true");
    itCmd("isundefined(5)", "false");
    itCmd("isbool(nada)", "false");
    itCmd("isbool(4)", "false");
    itCmd("isbool(isundefined(nada))", "true");
    itCmd("isbool(false)", "true");
    itCmd("iseven(0)", "true");
    itCmd("iseven(1)", "false");
    itCmd("iseven(-1)", "false");
    itCmd("iseven(1.5)", "false");
    itCmd("iseven(2)", "true");
    itCmd("iseven(-2)", "true");
    itCmd("isodd(0)", "false");
    itCmd("isodd(1)", "true");
    itCmd("isodd(-1)", "true");
    itCmd("isodd(1.5)", "false");
    itCmd("isodd(2)", "false");
    itCmd("isodd(-2)", "false");
    itCmd("isinteger(1)", "true");
    itCmd("isinteger(-0.0)", "true");
    itCmd("isinteger(i)", "false");
    itCmd("isinteger(pi)", "false");
    itCmd("isinteger(1.5)", "false");
    itCmd("isreal(pi)", "true");
    itCmd("isreal(i)", "false");
    itCmd("isreal(1)", "true");
    itCmd('isreal("1")', "false");
    itCmd("iscomplex(0)", "true");
    itCmd("iscomplex(i)", "true");
    itCmd('isstring("Test")', "true");
    itCmd('isstring(["1","2","3"])', "false");
    itCmd('islist("Test")', "false");
    itCmd('islist(["1","2","3"])', "true");
    itCmd("ismatrix([1,2,3])", "false");
    itCmd("ismatrix([[1,2],[4,5]])", "true");
    itCmd("ismatrix([[1,2],[4,5,6]])", "false");
    itCmd("ismatrix([[[1,2],[4,5]],[[5,6],[7,8]]])", "true");
    itCmd("isjson(nada)", "false");
    itCmd("isjson({})", "true");
    itCmd("isjson([])", "false");
    itCmd('isjson("Test")', "false");
    itCmd('isjson("0")', "false");
});

describe("Operators: removeAt", function () {
    before(function () {
        cdy.evalcs("aList = [1,2,3,4,5,6,7,8,9,10];");
    });

    itCmd("removeAt(aList,0)", "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]");
    itCmd("removeAt(aList,11)", "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]");
    itCmd("removeAt(aList,10)", "[1, 2, 3, 4, 5, 6, 7, 8, 9]");
    itCmd("removeAt(aList,1)", "[2, 3, 4, 5, 6, 7, 8, 9, 10]");
    itCmd("removeAt(aList,5)", "[1, 2, 3, 4, 6, 7, 8, 9, 10]");
    itCmd("removeAt(aList,3);aList", "[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]");
});
