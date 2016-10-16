var rewire = require("rewire");

var cindyJS = rewire("../build/js/exposed.js");

var Vector = cindyJS.__get__("Vector");
var VO = cindyJS.__get__("VectorOperations");
var CSNumber = cindyJS.__get__("CSNumber");
var List = cindyJS.__get__("List");
var QuickHull3D = cindyJS.__get__("QuickHull3D");

describe('Quick hull', function() {
    describe("Vector operations", function() {
        var v1, v2, result, expected, s;

        describe("with vector result", function() {
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

            it('normalize already normalized', function() {
                v1 = { x: 1 + 1e-16, y:0, z: 0 };
                result = VO.normalize(v1);
                expected = v1;
            });
            
            it('cross', function() {
                result = VO.cross(v1, v2);
                expected = { x: 5, y: -5.5, z: 2 };
            });

        });

        describe('with scalar result', function() {
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

    
//    describe('Build hull', function() {
//        var hull;
//        var gg = (1 - Math.sqrt(5)) / 2;
//        var result, expected, args;
//
//        beforeEach(function() {
//            hull = new QuickHull3D();
//        });
//
//        afterEach(function() {
//            result.should.deep.equal(expected);
//        });
//
//        var pointTests = [
//            {
//                args: [
//                    new Vector(-1,-1,-1),
//                    new Vector(-1,1,1),
//                    new Vector(1,-1,1),
//                    new Vector(1,1,-1)
//                ],
//                expected: {
//                    vertices: [
//                        [-1, -1, -1],
//                        [-1, 1, 1],
//                        [1, -1, 1],
//                        [1, 1, -1]
//                    ],
//                    faces: [[3, 2, 1], [4, 3, 1], [4, 1, 2], [4, 2, 3]]
//                }
//            },
//            {
//                args: [
//                    new Vector(1,0,0),
//                    new Vector(-1,0,0),
//                    new Vector(0,-1,0),
//                    new Vector(0,1,0),
//                    new Vector(0,0,-1),
//                    new Vector(0,0,1)
//                ],
//                expected: {
//                    vertices: [[1, 0, 0], [-1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]],
//                    faces: [[5, 3, 2], [5, 1, 3], [4, 1, 5], [4, 5, 2], [6, 1, 4], [6, 4, 2], [6, 2, 3], [6, 3, 1]]
//                }
//            },
//            {
//                args: [
//                    new Vector(3,3*gg,0),
//                    new Vector(3,-3*gg,0),
//                    new Vector(-3,3*gg,0),
//                    new Vector(-3,-3*gg,0),
//                    new Vector(0,3,3*gg),
//                    new Vector(0,3,-3*gg),
//                    new Vector(0,-3,3*gg),
//                    new Vector(0,-3,-3*gg),
//                    new Vector(3*gg,0,3),
//                    new Vector(-3*gg,0,3),
//                    new Vector(3*gg,0,-3),
//                    new Vector(-3*gg,0,-3)
//                ],
//                expected: {
//                    vertices: [
//                        [3, 3*gg, 0],
//                        [3, -3*gg, 0],
//                        [-3, 3*gg, 0],
//                        [-3, -3*gg, 0],
//                        [0, 3, 3*gg],
//                        [0, 3, -3*gg],
//                        [0, -3, 3*gg],
//                        [0, -3, -3*gg],
//                        [3*gg, 0, 3],
//                        [-3*gg, 0, 3],
//                        [3*gg, 0, -3],
//                        [-3*gg, 0, -3]
//                    ],
//                    faces: [[2, 5, 6], [4, 6, 5], [8, 3, 7], [8, 7, 1], [12, 1, 7], [12, 5, 2], [12, 2, 1], [10, 8, 1], [10, 1, 2], [10, 2, 6], [11, 5, 12], [11, 12, 7], [11, 7, 3], [11, 3, 4], [11, 4, 5], [9, 8, 10], [9, 10, 6], [9, 6, 4], [9, 4, 3], [9, 3, 8]]
//                }
//            },
//            {
//                args: [
//                    new Vector(2,0.2,0),
//                    new Vector(1,-0.2,0),
//                    new Vector(-1,0.2,0),
//                    new Vector(-1,-0.2,0),
//                    new Vector(0,4,0.2),
//                    new Vector(0,1,-0.2),
//                    new Vector(0,-1,4*0.2),
//                    new Vector(0,-1,-0.2),
//                    new Vector(-2*0.2,0,1),
//                    new Vector(-0.2-3,0,1),
//                    new Vector(0.2,0,-1),
//                    new Vector(-0.2-3,5,1),
//                    new Vector(-0.2+3,-2,1),
//                    new Vector(-0.2-1,0,-2),
//                    new Vector(-0.2,0,-1)
//                ],
//                expected: {
//                    vertices: [[2, 0.2, 0], [0, 4, 0.2], [0, -1, -0.2], [-3.2, 0, 1], [-3.2, 5, 1], [2.8, -2, 1], [-1.2, 0, -2]],
//                    faces: [[4, 6, 5], [4, 5, 7], [2, 7, 5], [2, 5, 6], [3, 6, 4], [3, 4, 7], [3, 7, 6], [1, 7, 2], [1, 2, 6], [1, 6, 7]]
//                }
//            }
//        ];
//
//        /** TODO */
//        var coordinateTests = [
//        ];
//        
//        pointTests.forEach(function(test) {
//            describe(test.args.length + ' points', function() {
//                beforeEach(function() {
//                    hull.build(test.args);
//                });
//                
////                it('check', function() {
////                    result = hull._check(1e-16);
////                    expected = true;
////                });
//
//                it('vertices', function() {
//                    result = hull.getVertices().map(function(point) {
//                        return [
//                            point.value[0].value.real,
//                            point.value[1].value.real,
//                            point.value[2].value.real
//                        ];
//                    });
//
//                    expected = test.expected.vertices;
//                });
//
//                it('faces', function() {
//                    result = hull.getFaces().map(function(face) {
//                        return face.value.map(function(vertex) {
//                            return vertex.value.real;
//                        });
//                    });
//
//                    expected = test.expected.faces;
//                });
//            });
//
//        });
//    });
});
