"use strict";
var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy = CindyJS({
    isNode: true,
    csconsole: null,
    geometry: [
        { name: "A", type: "Free", pos: [0, 0] },
        { name: "B", type: "Free", pos: [1, 1] },
        { name: "C", type: "Free", pos: [1, 1] },
    ],
});

function itCmd(command, expected) {
    it(command, function () {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("ColonOp: Lists", function () {
    before(function () {
        cdy.evalcs(
            'lst = [1,2,3]; lst:"age"=17; lst:"list"=lst; lst:"pt" = B; lst:12.3 = 4.56; lst:1 = 1; lst:(1+i) = 2; lst:[1,2,3] = 10;'
        );
        cdy.evalcs('a = [1,2,3]; a:"bla"=23; a_2 = 34'); // assigntake
        cdy.evalcs('t1=[-54,12];t1:"color"="red";t2=t1;t2:"color"="blue";'); // assigntake
        cdy.evalcs("b = [1,2,3];"); // no userdata
    });

    itCmd('lst:"age"', "17");
    itCmd('lst:"list"', "[1, 2, 3]");
    itCmd('lst:"pt"', "[1, 1]");
    itCmd("lst:12.3", "4.56");
    itCmd("lst:1", "1");
    itCmd("lst:(1+i)", "2");
    itCmd("lst:[1,2,3]", "10");

    itCmd('lst:"undef"', "___");
    itCmd("lst:pii", "___");

    // assigntake
    itCmd('a:"bla"', "23");

    // references
    itCmd('t1:"color"', "red");
    itCmd('t2:"color"', "blue");

    // keys
    itCmd("keys(a)", "[bla]");
    itCmd("keys(b)", "[]");
    itCmd("keys(lst)", "[1, age, list, pt, 12.3, 1 + i*1, [1, 2, 3]]");
});

describe("ColonOp: GeoOps", function () {
    before(function () {
        cdy.evalcs('A:"age"=17; A:"list"=lst; A:"pt" = B');
    });

    itCmd('A:"age"', "17");
    itCmd('A:"list"', "[1, 2, 3]");
    itCmd('A:"pt"', "[1, 1]");

    itCmd('lst:"undef"', "___");
    itCmd("lst:pii", "___");

    itCmd("keys(A)", "[age, list, pt]");
    itCmd("keys(C)", "[]");
});

describe("UserData for Lists", function () {
    before(function () {
        cdy.evalcs('l=[1,2,3];l:"user"="data";');
        cdy.evalcs('l:"ref"="something";');
        cdy.evalcs('l:"list"=[4,5,6];');
        cdy.evalcs("m=l;m_2=3;n=l;");
        cdy.evalcs('m:"ref"="else";');
        cdy.evalcs('(l:"list")_2=0;');
        cdy.evalcs('A=createpoint("A",[0,0])');
        cdy.evalcs('A:"l" = [3,2,1];x=A;(A:"l")_1 = 1;');
        cdy.evalcs('n:"list"=[5,5,5];');
    });
    itCmd("l", "[1, 2, 3]");
    itCmd('l:"user"', "data");
    itCmd('m:"user"', "data");
    itCmd('m:"ref"', "else");
    itCmd('l:"ref"', "something");
    itCmd('l:"list"', "[4, 0, 6]");
    itCmd('m:"list"', "[4, 0, 6]");
    itCmd('A:"l"', "[1, 2, 1]");
    itCmd('x:"l"', "[1, 2, 1]");
    itCmd('n:"list"', "[5, 5, 5]");

    // make sure extracted lists behave the same like normal lists
    itCmd('ll = l:"list"; ll_2=-1; l:"list"', "[4, 0, 6]");
});

describe("Nested UserData for Lists", function () {
    before(function () {
        cdy.evalcs("m=[];");
        cdy.evalcs('m:"pos" = [1,2];');
        cdy.evalcs("y=m;");
        cdy.evalcs('y:"pos" = [2,1];');
    });
    itCmd('m:"pos"', "[1, 2]");
    itCmd('y:"pos"', "[2, 1]");
});

describe("Nested UserData for Lists", function () {
    before(function () {
        cdy.evalcs("l=[];");
        cdy.evalcs('l:"ref" = [];');
        cdy.evalcs('l:"ref":"pos" = [1,2];');
        cdy.evalcs("x = l;");
        cdy.evalcs('x:"ref":"pos" = [2,1];');
    });
    itCmd('l:"ref":"pos"', "[2, 1]");
    itCmd('x:"ref":"pos"', "[2, 1]");
});

describe("Assign code to JSON objects", function () {
    itCmd("obj={};obj.code:=(x=x+1);x=5;obj.code;obj.code;x", "7");
});
