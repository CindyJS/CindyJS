var rewire = require("rewire");
var expect = require('chai').expect;
var should = require("chai").should();

var cindyJS = rewire("../build/js/exposed.js");

var CSNumber = cindyJS.__get__("CSNumber");
var List = cindyJS.__get__("List");

var QH = rewire('../plugins/QuickHull3D/src/js/QuickHull3D.js');
var VL = rewire('../plugins/QuickHull3D/src/js/VertexList.js');
var V = rewire('../plugins/QuickHull3D/src/js/Vertex.js');
V.__set__("turnIntoCSList", QH.__get__("turnIntoCSList"));
var F = rewire('../plugins/QuickHull3D/src/js/Face.js');
var HE = rewire('../plugins/QuickHull3D/src/js/HalfEdge.js');
var VOps = rewire('../plugins/QuickHull3D/src/js/Vector.js');
var Vector = VOps.__get__("Vector"); 
var VO = VOps.__get__("VectorOperations"); 

QH.__set__("VertexList", VL.__get__("VertexList"));
QH.__set__("Vertex", V.__get__("Vertex"));
QH.__set__("VectorOperations", VO);
QH.__set__("FO", F.__get__("FO"));
QH.__set__("HalfEdge", HE.__get__("HalfEdge"));
QH.__set__("HEO", HE.__get__("HEO"));

var QuickHull3D = QH.__get__("QuickHull3D");


describe('Quick hull', function() {
    var hull;
    
    describe('build from points', function() {
        var gg = (1 - Math.sqrt(5)) / 2;
        var vertices, faces;
        console.log("qh", QH);

        beforeEach(function() {
            hull = new QuickHull3D();
        });

        var tests = [
            {
                args: [
                    new Vector(-1,-1,-1),
                    new Vector(-1,1,1),
                    new Vector(1,-1,1),
                    new Vector(1,1,-1)
                ],
                expected: {
                    vertices: [
                        [-1, -1, -1],
                        [-1, 1, 1],
                        [1, -1, 1],
                        [1, 1, -1]
                    ],
                    faces: [[3, 2, 1], [4, 3, 1], [4, 1, 2], [4, 2, 3]]
                }
            },
            {
                args: [
                    new Vector(1,0,0),
                    new Vector(-1,0,0),
                    new Vector(0,-1,0),
                    new Vector(0,1,0),
                    new Vector(0,0,-1),
                    new Vector(0,0,1)
                ],
                expected: {
                    vertices: [[1, 0, 0], [-1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]],
                    faces: [[5, 3, 2], [5, 1, 3], [4, 1, 5], [4, 5, 2], [6, 1, 4], [6, 4, 2], [6, 2, 3], [6, 3, 1]]
                }
            },
            {
                args: [
                    new Vector(3,3*gg,0),
                    new Vector(3,-3*gg,0),
                    new Vector(-3,3*gg,0),
                    new Vector(-3,-3*gg,0),
                    new Vector(0,3,3*gg),
                    new Vector(0,3,-3*gg),
                    new Vector(0,-3,3*gg),
                    new Vector(0,-3,-3*gg),
                    new Vector(3*gg,0,3),
                    new Vector(-3*gg,0,3),
                    new Vector(3*gg,0,-3),
                    new Vector(-3*gg,0,-3)
                ],
                expected: {
                    vertices: [
                        [3, 3*gg, 0],
                        [3, -3*gg, 0],
                        [-3, 3*gg, 0],
                        [-3, -3*gg, 0],
                        [0, 3, 3*gg],
                        [0, 3, -3*gg],
                        [0, -3, 3*gg],
                        [0, -3, -3*gg],
                        [3*gg, 0, 3],
                        [-3*gg, 0, 3],
                        [3*gg, 0, -3],
                        [-3*gg, 0, -3]
                    ],
                    faces: [[2, 5, 6], [4, 6, 5], [8, 3, 7], [8, 7, 1], [12, 1, 7], [12, 5, 2], [12, 2, 1], [10, 8, 1], [10, 1, 2], [10, 2, 6], [11, 5, 12], [11, 12, 7], [11, 7, 3], [11, 3, 4], [11, 4, 5], [9, 8, 10], [9, 10, 6], [9, 6, 4], [9, 4, 3], [9, 3, 8]]
                }
            },
            {
                args: [
                    new Vector(2,0.2,0),
                    new Vector(1,-0.2,0),
                    new Vector(-1,0.2,0),
                    new Vector(-1,-0.2,0),
                    new Vector(0,4,0.2),
                    new Vector(0,1,-0.2),
                    new Vector(0,-1,4*0.2),
                    new Vector(0,-1,-0.2),
                    new Vector(-2*0.2,0,1),
                    new Vector(-0.2-3,0,1),
                    new Vector(0.2,0,-1),
                    new Vector(-0.2-3,5,1),
                    new Vector(-0.2+3,-2,1),
                    new Vector(-0.2-1,0,-2),
                    new Vector(-0.2,0,-1)
               ],
                expected: {
                    vertices: [[2, 0.2, 0], [0, 4, 0.2], [0, -1, -0.2], [-3.2, 0, 1], [-3.2, 5, 1], [2.8, -2, 1], [-1.2, 0, -2]],
                    faces: [[4, 6, 5], [4, 5, 7], [2, 7, 5], [2, 5, 6], [3, 6, 4], [3, 4, 7], [3, 7, 6], [1, 7, 2], [1, 2, 6], [1, 6, 7]]
                }
            }
        ];

        var permutationEquality = function(f1, f2) {
            if (f1.length !== f2.length) {
                return false;
            }

            var i2 = f2.indexOf(f1[0]);

            if (i2 === -1) {
                return false;
            }
            
            for (var i1 = 1; i1 < f1.length; i1++) {
                i2 = (i2 + 1) % f1.length;

                if (f1[i1] !== f2[i2]) {
                    return false;
                }
            }

            return true;
        };

        tests.forEach(function(test) {
            var result, expected;

           describe(test.args.length + ' points', function() {
               it('Resulting vertices', function() {
                   hull.build(test.args);

                   result = hull.getVertices().map(function(point) {
                       return [
                           point.value[0].value.real,
                           point.value[1].value.real,
                           point.value[2].value.real
                       ];
                   });

                   expected = test.expected.vertices; 
                   expect(result).to.deep.equal(expected);

               });

               it('Resulting faces', function() {
                   var sorting = function(a, b) {
                       return a > b ? 1 : a < b ? -1 : 0;
                   };

                   hull.build(test.args);

                   result = hull.getFaces().map(function(face) {
                       return face.value.map(function(vertex) {
                           return vertex.value.real;
                       });
                   });

                   expected = test.expected.faces;

                   var t = true;
                   var t1, i,j, face;
                   var corresponding;

                   for (i=0; i<result.length; i++) {
                       face = result[i];
                       t1 = false;
                       
                       for (j=0; j < expected.length; j++) {
                           if (permutationEquality(face, expected[j])) {
                               t1 = true;
                               break;
                           }
                       }

                       if (! t1) {
                           t = false;
                           break;
                       }
                   };

                   t.should.equal(true);
               });
            });

        });
    });
});
