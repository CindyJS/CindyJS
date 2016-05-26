var should = require("chai").should();
var rewire = require("rewire");

var createCindy = require("../build/js/Cindy.plain.js");

function FakeCanvas() {
  this.width = 640;
  this.height = 480;
};
FakeCanvas.prototype.measureText = function(txt) {
  return { width: 8*txt.length };
};
function dummy() { return this; }
[
    "addEventListener",
    "removeEventListener",
    "arc",
    "beginPath",
    "clearRect",
    "clip",
    "fill",
    "getContext",
    "lineTo",
    "moveTo",
    "restore",
    "save",
    "stroke",
    "strokeText",
    "fillText",
].forEach(function(m) {
    FakeCanvas.prototype[m] = dummy;
});

var cdy;

function itCmd(command, expected) {
    it(command, function() {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("all* operations", function() {

    before(function() {
        // See examples/114_allops.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
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
        cdy = createCindy({
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
        cdy = createCindy({
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
        cdy = createCindy({
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
