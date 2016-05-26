var rewire = require("rewire");

var cindyJS = rewire("../build/js/exposed.js");

var Vector = cindyJS.__get__("Vector");
var VO = cindyJS.__get__("VectorOperations");

describe("Vector operations", function() {
    var v1, v2, result, expected, s;

    describe("result is vector", function() {
        beforeEach(function() {
            v1 = new Vector(1, 2, 3);
            v2 = new Vector(0.5, 3, 7);
            s = 2;
        });

        afterEach(function() {
            result.x.should.equal(expected.x);
            result.y.should.equal(expected.y);
            result.z.should.equal(expected.z);
        });

        it('initialization', function() {
            result = new Vector(1, 2, 3);
            expected = { x: 1, y: 2, z: 3 };
        });

        it('add', function() {
            result = VO.add(v1, v2);
            expected = { x: 1.5, y: 5, z: 10 };
        });

        it('sub', function() {
            result = VO.sub(v1, v2);
            expected = { x: 0.5, y: -1, z: -4 };
        });

        it('scalmult', function() {
            result = VO.scalmult(s, v1);
            expected = {x:2, y: 4, z: 6};
        });

        it('scaldiv', function() {
            result = VO.scaldiv(s, v1);
            expected = {x:0.5, y: 1, z: 1.5};
        });

        it('normalize', function() {
            var norm = Math.sqrt(14);
            result = VO.normalize(v1);
            expected = {x: 1/norm, y: 2/norm, z: 3/norm};
        });

        it('try to normalize already normalized', function() {
            v1 = { x: 1 + 1e-16, y:0, z: 0 };
            result = VO.normalize(v1);
            expected = v1;
        });
        
        it('cross', function() {
            result = VO.cross(v1, v2);
            expected = { x: 5, y: -5.5, z: 2 };
        });

    });

    describe('result is scalar', function() {
        beforeEach(function() {
            v1 = new Vector(1, 2, 3);
            v2 = new Vector(0.5, 3, 7);
            s = 2;
        });

        afterEach(function() {
            result.should.equal(expected);
        });


        it('abs2', function() {
            result = VO.abs2(v1);
            expected = 14;
        });

        it('abs', function() {
            result = VO.abs(v1);
            expected = Math.sqrt(14);
        });

        it('distance2', function() {
            result = VO.distance2(v1, v2);
            expected = 17.25;
        });

        it('distance', function() {
            result = VO.distance(v1, v2);
            expected = Math.sqrt(17.25);
        });

        it('scalproduct', function() {
            result = VO.scalproduct(v1, v2);
            expected = 27.5;
        });
    });
});
