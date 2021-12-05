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

function assume(command, expected) {
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

    assume('lst:"age"', "17");
    assume('lst:"list"', "[1, 2, 3]");
    assume('lst:"pt"', "[1, 1]");
    assume("lst:12.3", "4.56");
    assume("lst:1", "1");
    assume("lst:(1+i)", "2");
    assume("lst:[1,2,3]", "10");

    assume('lst:"undef"', "___");
    assume("lst:pii", "___");

    // assigntake
    assume('a:"bla"', "23");

    // references
    assume('t1:"color"', "red");
    assume('t2:"color"', "blue");

    // keys
    assume("keys(a)", "[bla]");
    assume("keys(b)", "[]");
    assume("keys(lst)", "[1, age, list, pt, 12.3, 1 + i*1, [1, 2, 3]]");
});

describe("ColonOp: GeoOps", function () {
    before(function () {
        cdy.evalcs('A:"age"=17; A:"list"=lst; A:"pt" = B');
    });

    assume('A:"age"', "17");
    assume('A:"list"', "[1, 2, 3]");
    assume('A:"pt"', "[1, 1]");

    assume('lst:"undef"', "___");
    assume("lst:pii", "___");

    assume("keys(A)", "[age, list, pt]");
    assume("keys(C)", "[]");
});

describe("UserData for Lists", function() {
    before(function() {
        cdy.evalcs('l=[1,2,3];l:"user"="data";');
        cdy.evalcs('l:"ref"="something";');
        cdy.evalcs('l:"list"=[4,5,6];')
        cdy.evalcs('m=l;m_2=3;n=l;');
        cdy.evalcs('m:"ref"="else";');
        cdy.evalcs('(l:"list")_2=0;');
        cdy.evalcs('A=createpoint("A",[0,0])');
        cdy.evalcs('A:"l" = [3,2,1];x=A;(A:"l")_1 = 1;')
        cdy.evalcs('n:"list"=[5,5,5];');
    });
    assume('l',"[1, 2, 3]");
    assume('l:"user"',"data");
    assume('m:"user"',"data");
    assume('m:"ref"',"else");
    assume('l:"ref"',"something");
    assume('l:"list"',"[4, 0, 6]");
    assume('m:"list"',"[4, 0, 6]");
    assume('A:"l"',"[1, 2, 1]");
    assume('x:"l"',"[1, 2, 1]");
    assume('n:"list"',"[5, 5, 5]");
});
