var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");

var cdy;

function itCmd(command, expected) {
    it(command, function() {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("all* operations", function() {

    before(function() {
        // See examples/114_allops.html
        cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
	        { name: "A", type: "Free", pos: [ 2.6486486486486487, -4.0, -0.6756756756756757 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "B", type: "Free", pos: [ 4.0, -3.183673469387755, -1.0204081632653061 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "C", type: "Free", pos: [ 2.8888888888888893, -4.0, -2.7777777777777777 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "D", type: "Free", pos: [ -2.795180722891566, -4.0, -1.2048192771084338 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "E", type: "Free", pos: [ 0.20382165605095542, -4.0, -0.6369426751592356 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "F", type: "Free", pos: [ 4.0, 0.8928571428571428, 0.4464285714285714 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "C0", type: "CircleByRadius", color: [ 0.0, 0.0, 1.0 ], radius: 3.807571404451924, args: [ "F" ], size: 1, printname: "$C_{0}$" },
	        { name: "C1", type: "ConicBy5", color: [ 0.0, 0.0, 1.0 ], args: [ "A", "B", "C", "D", "E" ], size: 1, printname: "$C_{1}$" },
	        { name: "G", type: "Free", pos: [ -1.6536312849162011, -4.0, -0.5586592178770949 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "H", type: "Free", pos: [ -3.4254143646408846, -4.0, -0.5524861878453039 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "a", type: "Segment", pos: [ 0.013936311058462669, -0.5644205978677443, 4.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "G", "H" ], labeled: true, size: 1 },
	        { name: "K", type: "Free", pos: [ 4.0, 0.9929078014184397, -0.7092198581560284 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "b", type: "Through", pos: [ 0.694924364585733, 0.0575904169546188, 4.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "K" ], labeled: true, size: 1 },
	        { name: "L", type: "Free", pos: [ 4.0, 0.6588235294117648, -1.1764705882352942 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "M", type: "Free", pos: [ 0.8979591836734694, -4.0, 2.0408163265306123 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "c", type: "Segment", pos: [ 0.8103727714748782, 2.2227367446168094, 4.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "L", "M" ], render: true, labeled: true, size: 1 },
	        { name: "N", type: "Free", pos: [ 4.0, 0.7792207792207791, 1.2987012987012987 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "O", type: "Free", pos: [ 4.0, -0.6419753086419752, 1.2345679012345678 ], color: [ 1.0, 0.0, 0.0 ], labeled: true },
	        { name: "no", type: "Segment" , color: [ 0.0, 0.0, 1.0 ], args: [ "N", "O" ], render: true, labeled: true, size: 1 },
	        { name: "C2", type: "CircleBy3", color: [ 0.0, 0.0, 1.0 ], args: [ "G", "H", "F" ], size: 1, printname: "$C_{2}$" },
            ],
            behavior: [
                {behavior:{type:"Environment",gravity:-.2}},
                {name:"M", behavior:{type:"Mass",friction:0.1}},
                {name:"O", behavior:{type:"Mass",friction:0.1}},
                {name:"c", behavior:{type:"Spring"}}
            ],
        });
    });

    itCmd("allpoints()", "[A, B, C, D, E, F, G, H, K, L, M, N, O]");
    itCmd("alllines()", "[a, b, c, no]");
    itCmd("allsegments()", "[a, c, no]");
    itCmd("allconics()", "[C0, C1, C2]");
    itCmd("allcircles()", "[C0, C2]");
    itCmd("allmasses()", "[M, O]");
    itCmd("allsprings()", "[c]");
    itCmd("allelements()", // in the order in which they appear in the gslp
          "[A, B, C, D, E, F, C0, C1, G, H, a, K, b, L, M, c, N, O, no, C2]");
    itCmd("allpoints(b)", "[K]");
    itCmd("allpoints(C1)", "[A, B, C, D, E]");
    itCmd("alllines(K)", "[b]");
    itCmd("alllines(L)", "[c]"); // A segment is a special case of a line
    itCmd("allsegments(L)", "[c]");
    itCmd("allmasses(no)", "[O]");
    itCmd("allsprings(L)", "[c]");
    itCmd("allconics(A)", "[C1]");
    itCmd("allcircles(G)", "[C2]");
    itCmd("allelements(K)", "[b]");
    itCmd("x = C1; allpoints(x)", "[A, B, C, D, E]");
    itCmd("alllines(K.homog)", "[]");
    itCmd("K = [1,2,3]; alllines(K)", "[]");

});

describe("toString as a name", function() {

    before(function() {
        cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
                {name: "A", type: "Free", pos: [0, 0]},
            ]
        });
    });

    itCmd('isgeometric(toString)', 'false');
    itCmd('isundefined(toString)', 'true');
    itCmd('toString = 1; toString', '1');

});

describe("==", function() {

    before(function() {
        cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
                {name: "A", type: "Free", pos: [0, 0]},
            ]
        });
    });

    itCmd('A == A.xy', 'false');
    itCmd('A == A.homog', 'false');
    itCmd('A == A', 'true');
    itCmd('A == [0, 0]', 'false');

});

describe("element(‹string›)", function() {

    before(function() {
        cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
                {name: "A", type: "Free", pos: [0, 0]},
                {name: "B", type: "Free", pos: [1, 0]},
                {name: "i", type: "Join", args: ["A", "B"]}
            ]
        });
    });

    itCmd('element("i")', 'i');
    itCmd('element("i") == i', 'false');
    itCmd('alllines()_1', 'i');
    itCmd('element("i") == alllines()_1', 'true');
    itCmd('isgeometric(element("toString"))', 'false');

});

describe("algorithm(‹string›)", function() {

    before(function() {
        cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
                {name: "A", type: "Free", pos: [4.0, -0.8, -0.4], color: [1.0, 0.0, 0.0], labeled: true},
                {name: "B", type: "Free", pos: [4.0, -2.0, -0.5], color: [1.0, 0.0, 0.0], labeled: true},
                {name: "C0", type: "CircleMP", color: [0.0, 0.0, 1.0], args: ["A", "B"], printname: "$C_{0}$"},
                {name: "Tr0", type: "TrTranslation", color: [0.0, 0.0, 1.0], args: ["A", "B"], dock: {offset: [0.0, -0.0]}},
                {name: "C1", type: "TransformConic", color: [0.0, 0.0, 1.0], args: ["Tr0", "C0"], printname: "$C_{1}$"},
                {name: "a", type: "Join", color: [0.0, 0.0, 1.0], args: ["A", "B"], labeled: true},
                {name: "Collection__1", type: "IntersectionCircleCircle", args: ["C0", "C1"]},
                {name: "D", type: "SelectP", pos: [4.0, {r: -0.697830520748037, i: 2.2070588312056207E-15}, {r: -0.5503615798753269, i: 7.773440174097654E-17}], color: [1.0, 0.0, 0.0], args: ["Collection__1"], labeled: true},
                {name: "C", type: "SelectP", pos: [4.0, {r: -1.763707940790424, i: 4.712720986149987E-16}, {r: -0.37271534320159616, i: 6.194676430099382E-17}], color: [1.0, 0.0, 0.0], args: ["Collection__1"], labeled: true},
                {name: "b", type: "Orthogonal", color: [0.0, 0.0, 1.0], args: ["a", "C"], labeled: true},
                {name: "c", type: "Parallel", color: [0.0, 0.0, 1.0], args: ["a", "C"], labeled: true},
                {name: "E", type: "PointOnCircle", pos: [4.0, {r: 0.3313708498984757, i: 2.859510109139477E-18}, {r: -0.3999999999999999, i: -3.45173404361373E-18}], color: [1.0, 0.0, 0.0], args: ["C0"], labeled: true},
                {name: "F", type: "OtherPointOnCircle", pos: [4.0, {r: -1.9313708498984756, i: -2.687555184762981E-17}, {r: -0.3999999999999999, i: -5.566109035774775E-18}], color: [1.0, 0.0, 0.0], args: ["E"], pinned: true, labeled: true},
                {name: "d", type: "Join", color: [0.0, 0.0, 1.0], args: ["E", "A"], labeled: true},
                {name: "C2", type: "CircleByRadius", pos: {xx: {r: 0.010009171467685202, i: 1.7507477744037585E-19}, yy: {r: 0.010009171467685202, i: 1.7507477744037585E-19}, zz: 1.0, xy: 0.0, xz: {r: 0.20018342935370412, i: 1.7740456536387068E-18}, yz: {r: -0.0165837382801321, i: -2.9007338898102005E-19}}, color: [0.0, 0.0, 1.0], radius: 0.8819989450808214, args: ["E"], printname: "$C_{2}$"},
                {name: "C3", type: "CircleByFixedRadius", color: [0.0, 0.0, 1.0], args: ["E"], printname: "$C_{3}$"},
                {name: "Collection__2", type: "ConicBy2Foci1P", args: ["A", "B", "C"]},
                {name: "C4", type: "SelectConic", pos: {xx: {r: 0.0110062893081761, i: 1.5042710099323975E-19}, yy: {r: 0.011006289308176093, i: 1.0444210746176384E-17}, zz: 1.0, xy: {r: 0.0031446540880503146, i: -1.6870684997469983E-18}, xz: {r: 0.20754716981132076, i: -2.757195471369838E-18}, yz: {r: 0.0943396226415094, i: 4.465590344928506E-17}}, color: [0.0, 0.0, 1.0], args: ["Collection__2"], printname: "$C_{4}$"},
                {name: "Collection__3", type: "IntersectionConicLine", args: ["C4", "d"]},
                {name: "G", type: "SelectP", pos: [4.0, {r: -0.1731107000870203, i: -1.3032476807755926E-16}, {r: -0.3999999999999999, i: -1.9125958020581486E-18}], color: [1.0, 0.0, 0.0], args: ["Collection__3"], labeled: true},
                {name: "H", type: "SelectP", pos: [4.0, {r: -2.1126035856272667, i: 1.1047916970303941E-16}, {r: -0.4, i: 4.004662558422439E-18}], color: [1.0, 0.0, 0.0], args: ["Collection__3"], labeled: true},
                {name: "K", type: "PolarOfLine", color: [1.0, 0.0, 0.0], args: ["d", "C4"], labeled: true},
                {name: "e", type: "PolarOfPoint", color: [0.0, 0.0, 1.0], args: ["A", "C4"], labeled: true},
                {name: "C5", type: "ArcBy3", color: [0.0, 0.0, 1.0], args: ["E", "G", "D"], printname: "$C_{5}$"},
                {name: "L", type: "Meet", color: [1.0, 1.0, 1.0], args: ["a", "b"], size: 0.0},
                {name: "Collection__4", type: "AngularBisector", args: ["a", "b", "L"]},
                {name: "f", type: "SelectL", pos: [{r: 0.44444444444444453, i: -4.918226997824353E-17}, {r: 3.088189045145525E-17, i: -4.1175853935273646E-17}, 4.0], color: [0.0, 0.0, 1.0], args: ["Collection__4"], labeled: true}
            ],
            cinderella: {build: 1865, version: [2, 9, 1865]}
        });
    });

    itCmd('algorithm(A)', 'Free');
    itCmd('algorithm(C0)', 'CircleMP');
    itCmd('algorithm(Tr0)', 'TrTranslation');
    itCmd('algorithm(C1)', 'TransformC');
    itCmd('algorithm(a)', 'Join');
    itCmd('algorithm(b)', 'Perp');
    itCmd('algorithm(c)', 'Para');
    itCmd('algorithm(C)', 'SelectP');
    itCmd('algorithm(D)', 'SelectP');
    itCmd('algorithm(E)', 'PointOnCircle');
    itCmd('algorithm(F)', 'OtherPointOnCircle');
    itCmd('algorithm(C2)', 'CircleMr');
    itCmd('algorithm(C3)', 'CircleMr');
    itCmd('algorithm(C4)', 'SelectConic');
    itCmd('algorithm(G)', 'SelectP');
    itCmd('algorithm(H)', 'SelectP');
    itCmd('algorithm(K)', 'PolarOfLine');
    itCmd('algorithm(e)', 'PolarOfPoint');
    itCmd('algorithm(C5)', 'ArcBy3');
    itCmd('algorithm(L)', 'Meet');
    itCmd('algorithm(f)', 'SelectL');

    itCmd('algorithm(A, compatibility->"Cinderella")', 'FreePoint');
    itCmd('algorithm(C0, compatibility->"cinderella")', 'CircleMP');
    itCmd('algorithm(Tr0, compatibility->"Cinderella")', 'TrProjection');
    itCmd('algorithm(C1, compatibility->"cinderella")', 'Transform');
    itCmd('algorithm(a, compatibility->"Cinderella")', 'Join');
    itCmd('algorithm(b, compatibility->"cinderella")', 'Orthogonal');
    itCmd('algorithm(c, compatibility->"Cinderella")', 'Parallel');
    itCmd('algorithm(C, compatibility->"cinderella")', 'IntersectionCircleCircle');
    itCmd('algorithm(D, compatibility->"Cinderella")', 'IntersectionCircleCircle');
    itCmd('algorithm(E, compatibility->"cinderella")', 'PointOnCircle');
    itCmd('algorithm(F, compatibility->"Cinderella")', 'PointOnCircle');
    itCmd('algorithm(C2, compatibility->"cinderella")', 'CircleByRadius');
    itCmd('algorithm(C3, compatibility->"Cinderella")', 'CircleByFixedRadius');
    itCmd('algorithm(C4, compatibility->"cinderella")', 'ConicFoci');
    itCmd('algorithm(G, compatibility->"Cinderella")', 'IntersectionConicLine');
    itCmd('algorithm(H, compatibility->"cinderella")', 'IntersectionConicLine');
    itCmd('algorithm(K, compatibility->"Cinderella")', 'PolarLine');
    itCmd('algorithm(e, compatibility->"cinderella")', 'PolarPoint');
    itCmd('algorithm(C5, compatibility->"Cinderella")', 'Arc');
    itCmd('algorithm(L, compatibility->"cinderella")', 'Meet');
    itCmd('algorithm(f, compatibility->"Cinderella")', 'AngularBisector');
});
