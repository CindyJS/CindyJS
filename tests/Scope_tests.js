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

describe("Scope: argument", function () {
    itCmd("x=nada;x=0;f(x):=(x);f(3)", "3");
    itCmd("x=nada;f(x):=(x);f(3)", "3");
    itCmd("x=nada;x=0;f(x):=(x=2;);f(3);x", "0");
    itCmd("x=nada;f(x):=(x=2;);f(3);x", "___");
});

describe("Scope: modifier", function () {
    itCmd("x=0;f():=(x);f(x->11)", "11");
    itCmd("x=0;f():=(x=5);f(x->11)", "5");
    itCmd("x=0;f():=(x=5);f(x->11);x", "0");
});

describe("Scope: global vs regional", function () {
    itCmd("x=0;f():=(x=2);f();x", "2");
    itCmd("x=0;f():=(regional(x);x=5);f()", "5");
    itCmd("x=0;f():=(regional(x);x=5);f();x", "0");
    itCmd("x=0;f():=(x=2;regional(x);x=5);f();x", "2");
    itCmd("x=nada;f():=(regional(x);x=5);f();x", "___");
    itCmd("x=0;f():=(regional(x);g();x);g():=(x=11);f()", "11");
    itCmd("x=0;f():=(regional(x);g();x);g():=(x=11);f();x", "0");
});

describe("Scope: regional in loop", function () {
    itCmd("x=0;forall(1..10,regional(t);t=#*#;x=x+t);x", "385");
    itCmd("x=0;forall(1..10,regional(t);t=#*#;x=x+t);t", "___");
    itCmd("x=0;repeat(10,regional(t);t=#*#;x=x+t);x", "385");
    itCmd("x=0;repeat(10,regional(t);t=#*#;x=x+t);t", "___");
    itCmd("apply(1..5,regional(t);t=#*#;t)", "[1, 4, 9, 16, 25]");
    itCmd("apply(1..5,regional(t);t=#*#;t);t", "___");
    itCmd("select(1..5,regional(t);t=#*#;t<10)", "[1, 2, 3]");
    itCmd("select(1..5,regional(t);t=#*#;t<10);t", "___");
    itCmd("x=0;if(true,regional(x);x=2,x=5);x", "0");
    itCmd("x=0;if(false,regional(x);x=2,x=5);x", "5");
    itCmd("x=0;while(x=x+1;x<5,regional(x);x=10);x", "5");
    itCmd("x=0;sum(1..10,regional(x);x=#*#;x)", "385");
    itCmd("x=0;sum(1..10,regional(x);x=#*#;x);x", "0");
    itCmd("x=0;product(1..5,regional(x);x=#*#;x)", "14400");
    itCmd("x=0;product(1..5,regional(x);x=#*#;x);x", "0");
    itCmd("x=0;min(1..5,regional(x);x=#*#;x)", "1");
    itCmd("x=0;min(1..5,regional(x);x=#*#;x);x", "0");
    itCmd("x=0;max(1..5,regional(x);x=#*#;x)", "25");
    itCmd("x=0;max(1..5,regional(x);x=#*#;x);x", "0");
    itCmd("x=0;sort(1..10,regional(x);x=text(#))", "[1, 10, 2, 3, 4, 5, 6, 7, 8, 9]");
    itCmd("x=0;sort(1..10,regional(x);x=text(#));x", "0");
});
