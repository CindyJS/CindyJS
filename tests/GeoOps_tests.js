var assert = require("assert");
var should = require("should");
var rewire = require("rewire");

var cindyJS = rewire("../build/js/exposed.js");

var List = cindyJS.__get__("List");
var CSNumber = cindyJS.__get__("CSNumber");
var geoOps = cindyJS.__get__("geoOps");
var niceprint = cindyJS.__get__("niceprint");

describe("IntersectLC helper", function() {
  it("must not return null vector just because one result has x == 0", function() {
    var circle = List.turnIntoCSList([
      List.realVector([1, 0, 2]),
      List.realVector([0, 1, 3]),
      List.realVector([2, 3, 9])
    ]);
    var line = List.realVector([0, -2, -6]);
    var pts = geoOps._helper.IntersectLC(line, circle);
    pts.should.be.an.Array;
    pts.should.have.length(2);
    var p1 = List.normalizeZ(pts[0]);
    var p2 = List.normalizeZ(pts[1]);
    if (p1.value[0].value.real > p2.value[0].value.real) {
      var tmp = p2;
      p2 = p1;
      p1 = tmp;
    }
    p1.value[0].value.real.should.be.approximately(-4, 1e-12);
    p1.value[0].value.imag.should.be.approximately(0, 1e-12);
    p1.value[1].value.real.should.be.approximately(-3, 1e-12);
    p1.value[1].value.imag.should.be.approximately(0, 1e-12);
    p2.value[0].value.real.should.be.approximately(0, 1e-12);
    p2.value[0].value.imag.should.be.approximately(0, 1e-12);
    p2.value[1].value.real.should.be.approximately(-3, 1e-12);
    p2.value[1].value.imag.should.be.approximately(0, 1e-12);
  });
});
