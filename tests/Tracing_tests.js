var should = require("chai").should();
var rewire = require("rewire");

var cindyJS = rewire("../build/js/exposed.js");

var List = cindyJS.__get__("List");
var CSNumber = cindyJS.__get__("CSNumber");

describe("projectiveDistMinScal", function() {
    it("should match very similar vectors", function() {
        var n1 = List.turnIntoCSList([
            CSNumber.real(1),
            CSNumber.real(1),
            CSNumber.complex(0.5169502832574938, -0.1691485248960431)]);
        var o1 = List.turnIntoCSList([
            CSNumber.real(1),
            CSNumber.real(1),
            CSNumber.complex(0.5169502832574938, -0.16914852489604323)]);
        var d = List.projectiveDistMinScal(n1, o1);
        d.should.be.below(1e-14);
    });
    it("should match still similar vectors", function() {
        var n2 = List.turnIntoCSList([
            CSNumber.complex(0.9561948080148783, -0.29273108670824394),
            CSNumber.complex(0.9561948080148783, -0.29273108670824394),
            CSNumber.real(0.9999999999999999)]);
        var o2 = List.turnIntoCSList([
            CSNumber.real(1),
            CSNumber.real(1),
            CSNumber.complex(0.9561948080148786, 0.2927310867082442)]);
        var d = List.projectiveDistMinScal(n2, o2);
        d.should.be.below(1e-14);
    });
});

describe("Determinants", function() {
    it("List.det4m on random matrix", function() {
        var r = List.realMatrix([
            [38, 48, 52, 85],
            [78, 80, 20,  7],
            [46,  1,  0, 29],
            [69,  5, 50, 61]]);
        var i = List.realMatrix([
            [74, 35, 32, 73],
            [38, 22, 61, 92],
            [65, 84, 97,  4],
            [45, 89, 69, 47]]);
        var m = List.add(r, List.scalmult(CSNumber.complex(0, 1), i));
        var actual = List.det4m(m);
        actual.value.should.eql({real: -14134415, imag: -69048490});
    });
});
