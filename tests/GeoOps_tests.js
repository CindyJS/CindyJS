var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");
var cindyJS = rewire("../build/js/exposed.js");

var List = cindyJS.__get__("List");
var CSNumber = cindyJS.__get__("CSNumber");
var geoOps = cindyJS.__get__("geoOps");
var niceprint = cindyJS.__get__("niceprint");

function almostEqualVector(a, b) {
  return List._helper.isAlmostZero(a) == List._helper.isAlmostZero(b) &&
    List.projectiveDistMinScal(a, b) < 1e-8;
}

function homog(expected) {
  if (!expected.ctype)
    expected = List.realVector(expected);
  return function(el) {
    if (!almostEqualVector(el.homog, expected))
      niceprint(el.homog).should.equal(niceprint(expected));
  };
}

function homogPair(expected1, expected2) {
  if (!expected1.ctype)
    expected1 = List.realVector(expected1);
  if (!expected2.ctype)
    expected2 = List.realVector(expected2);
  return function(el) {
    var actual1 = el.results.value[0];
    var actual2 = el.results.value[1];
    if (!((almostEqualVector(actual1, expected1) &&
           almostEqualVector(actual2, expected2)) ||
          (almostEqualVector(actual1, expected2) &&
           almostEqualVector(actual2, expected1))))
      niceprint(el.results).should.equal(
        niceprint(List.turnIntoCSList([expected1, expected2])));
  };
}

function testGeo(geometry, verifier, done) {
  var initscript = 'use("verify");\nverify(' +
      geometry[geometry.length - 1].name + ')';
  function plugin(api) {
    api.defineFunction("verify", 1, function(args, modifs) {
      var el = api.evaluate(args[0]).value;
      try {
        verifier(el);
        done();
      } catch (err) {
        done(err);
      }
    });
  }
  plugin.apiVersion = 1;
  var data = {
    isNode: true,
    geometry: geometry,
    scripts: { init: initscript },
    plugins: { verify: plugin }
  };
  CindyJS(data);
}

//////////////////////////////////////////////////////////////////////
// Now come the test cases

describe("Free point", function() {
  it("must have the given coordinates", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[12,34]}
    ], homog([-120, -340, -10]), done);
  });
});

describe("Angle bisector", function() {
  it("generic input", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[3,2]},
      {name:"B", type:"Free", pos:[7,5]},
      {name:"C", type:"Free", pos:[-9,7]},
      {name:"a", type:"Join", args:["A","B"]},
      {name:"b", type:"Join", args:["A","C"]},
      {name:"cd", type:"AngleBisector", args:["a","b","A"]},
    ], homogPair([8,1,-26], [1,-8,13]), done);
  });
  it("finite identical", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[-3,2]},
      {name:"B", type:"Free", pos:[6,5]},
      {name:"C", type:"Free", pos:[3,4]},
      {name:"a", type:"Join", args:["A","B"]},
      {name:"b", type:"Join", args:["A","C"]},
      {name:"cd", type:"AngleBisector", args:["a","b","A"]},
    ], homogPair([1,-3,9], [3,1,7]), done);
  });
  it("parallel", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[3,2,0]},
      {name:"B", type:"Free", pos:[7,5]},
      {name:"C", type:"Free", pos:[-9,7]},
      {name:"a", type:"Join", args:["A","B"]},
      {name:"b", type:"Join", args:["A","C"]},
      {name:"cd", type:"AngleBisector", args:["a","b","A"]},
    ], homogPair([2,-3,20], [0,0,1]), done);
  });
  it("identical with far point", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[3,1,0]},
      {name:"B", type:"Free", pos:[6,5]},
      {name:"C", type:"Free", pos:[3,4]},
      {name:"a", type:"Join", args:["A","B"]},
      {name:"b", type:"Join", args:["A","C"]},
      {name:"cd", type:"AngleBisector", args:["a","b","A"]},
    ], homogPair([1,-3,9], [0,0,1]), done);
  });
  it("finite and infinite", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[3,1,0]},
      {name:"B", type:"Free", pos:[0,1,0]},
      {name:"C", type:"Free", pos:[3,4,1]},
      {name:"a", type:"Join", args:["A","B"]},
      {name:"b", type:"Join", args:["A","C"]},
      {name:"cd", type:"AngleBisector", args:["a","b","A"]},
    ], homogPair([0,0,1], [0,0,1]), done);
  });
  it("twice infinite", function(done) {
    testGeo([
      {name:"A", type:"Free", pos:[3,1,0]},
      {name:"B", type:"Free", pos:[4,5,0]},
      {name:"C", type:"Free", pos:[1,2,0]},
      {name:"a", type:"Join", args:["A","B"]},
      {name:"b", type:"Join", args:["A","C"]},
      {name:"cd", type:"AngleBisector", args:["a","b","A"]},
    ], homogPair([0,0,0], [0,0,0]), done);
  });
});

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
