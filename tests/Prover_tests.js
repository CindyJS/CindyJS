var should = require("should");
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
        cdy.niceprint(cdy.evalcs(command)).should.equal(expected);
    });
}

describe("Prover: angle bisector test", function() {

    before(function() {
        // See examples/141_a_bisectors.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "A", type: "Free", pos: [ 2.2941176470588234, -4.0, -1.4705882352941175 ], color: [ 1.0, 0.0, 0.0 ], labeled: true }, 
		{ name: "B", type: "Free", pos: [ -2.0387096774193547, -4.0, -0.6451612903225806 ], color: [ 1.0, 0.0, 0.0 ], labeled: true }, 
		{ name: "C", type: "Free", pos: [ 4.0, 1.2071005917159765, 0.591715976331361 ], color: [ 1.0, 0.0, 0.0 ], labeled: true }, 
		{ name: "a", type: "Join", color: [ 0.0, 0.0, 1.0 ], args: [ "B", "C" ], labeled: true }, 
		{ name: "b", type: "Join", color: [ 0.0, 0.0, 1.0 ], args: [ "A", "C" ], labeled: true }, 
		{ name: "c", type: "Join", color: [ 0.0, 0.0, 1.0 ], args: [ "B", "A" ], labeled: true }, 
		{ name: "Collection__1", type: "AngularBisector", args: [ "b", "c", "A" ] }, 
		{ name: "d", type: "SelectL", pos: [ 0.35934685894347934, -1.2644922426647693, 4.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "Collection__1" ], labeled: true }, 
		{ name: "", type: "SelectL", pos: [ 4.0, 1.1367309242995318, 3.1480918859052696 ], color: [ 1.0, 1.0, 1.0 ], args: [ "Collection__1" ], size: 0 }, 
		{ name: "Collection__2", type: "AngularBisector", args: [ "a", "b", "C" ] }, 
		{ name: "e", type: "SelectL", pos: [ -0.37102114600759273, -0.7313220847983691, 4.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "Collection__2" ], labeled: true }, 
		{ name: "D", type: "Meet", color: [ 1.0, 0.0, 0.0 ], args: [ "d", "e" ], labeled: true }, 
		{ name: "Collection__3", type: "AngularBisector", args: [ "a", "c", "B" ] }, 
		{ name: "f", type: "SelectL", pos: [ -1.6203679158952222, 0.18070364745627465, 4.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "Collection__3" ], labeled: true } ], 
            behavior: [
                {behavior:{type:"Environment",gravity:-.2}},
                {name:"M", behavior:{type:"Mass",friction:0.1}},
                {name:"O", behavior:{type:"Mass",friction:0.1}},
                {name:"c", behavior:{type:"Spring"}}
            ],
        });
    });

    itCmd("alllines(D)", "[d, e, f]");
});


describe("Prover: Pappos", function() {

    before(function() {
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
  geometry: [
    {name: "A", type: "Free", pos: [4.0, -2.050420168067227, -0.8403361344537815], color: [1.0, 0.0, 0.0], labeled: true},
    {name: "B", type: "Free", pos: [0.2857142857142857, -4.0, 2.3809523809523814], color: [1.0, 0.0, 0.0], labeled: true},
    {name: "C", type: "Free", pos: [0.25396825396825395, -4.0, -0.5291005291005291], color: [1.0, 0.0, 0.0], labeled: true},
    {name: "D", type: "Free", pos: [4.0, 2.2010582010582014, 0.5291005291005291], color: [1.0, 0.0, 0.0], labeled: true},
    {name: "a", type: "Join", color: [0.0, 0.0, 1.0], args: ["A", "B"], labeled: true},
    {name: "b", type: "Join", color: [0.0, 0.0, 1.0], args: ["C", "D"], labeled: true},
    {name: "E", type: "PointOnLine", pos: [-1.656041868455039, -4.0, -0.6388890413716075], color: [1.0, 0.0, 0.0], args: ["b"], labeled: true},
    {name: "F", type: "PointOnLine", pos: [4.0, -0.801486761411016, -1.6314569839452548], color: [1.0, 0.0, 0.0], args: ["a"], labeled: true},
    {name: "c", type: "Join", color: [0.0, 0.0, 1.0], args: ["A", "D"], labeled: true},
    {name: "d", type: "Join", color: [0.0, 0.0, 1.0], args: ["A", "E"], labeled: true},
    {name: "e", type: "Join", color: [0.0, 0.0, 1.0], args: ["F", "C"], labeled: true},
    {name: "f", type: "Join", color: [0.0, 0.0, 1.0], args: ["B", "C"], labeled: true},
    {name: "g", type: "Join", color: [0.0, 0.0, 1.0], args: ["D", "F"], labeled: true},
    {name: "h", type: "Join", color: [0.0, 0.0, 1.0], args: ["E", "B"], labeled: true},
    {name: "G", type: "Meet", color: [1.0, 0.0, 0.0], args: ["g", "h"], labeled: true},
    {name: "H", type: "Meet", color: [1.0, 0.0, 0.0], args: ["d", "e"], labeled: true},
    {name: "k", type: "Join", color: [0.0, 0.0, 1.0], args: ["H", "G"], labeled: true},
    {name: "K", type: "Meet", color: [1.0, 0.0, 0.0], args: ["c", "f"], labeled: true}
  ],
            behavior: [
                {behavior:{type:"Environment",gravity:-.2}},
                {name:"M", behavior:{type:"Mass",friction:0.1}},
                {name:"O", behavior:{type:"Mass",friction:0.1}},
                {name:"c", behavior:{type:"Spring"}}
            ],
        });
    });

    itCmd("allpoints(k)", "[G, H, K]");
});

describe("Prover: free points", function() {

    before(function() {
        // See examples/141_b_false_conjecture_freepoint.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "A", type: "Free", pos: [ 4.0, -0.0, -2.0 ], color: [ 1.0, 0.0, 0.0 ], labeled: true }, 
		{ name: "B", type: "Free", pos: [ 4.0, -0.0, 1.0 ], color: [ 1.0, 0.0, 0.0 ], labeled: true }, 
		{ name: "C", type: "Free", pos: [ 4.0, -0.0, 4.0 ], color: [ 1.0, 0.0, 0.0 ], labeled: true }, 
		{ name: "a", type: "Join", color: [ 0.0, 0.0, 1.0 ], args: [ "A", "B" ], labeled: true } ], 
        });
    });

    itCmd("alllines(C)", "[]");
    itCmd("allpoints(a)", "[A, B]");
});


describe("Prover: free line", function() {

    before(function() {
        // See examples/141_c_false_conjecture_freeline.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "A", type: "Free", pos: [ 4.0, -4.0, -1.3333333333333333 ], color: [ 1.0, 0.0, 0.0 ], labeled: true, pinned: true }, 
		{ name: "B", type: "Free", pos: [ 4.0, 4.0, 1.3333333333333333 ], color: [ 1.0, 0.0, 0.0 ], labeled: true , pinned: true}, 
		{ name: "C", type: "Free", pos: [ 4.0, 1.7142857142857142, 0.5714285714285714 ], color: [ 1.0, 0.0, 0.0 ], labeled: true , pinned: true}, 
		{ name: "D", type: "Free", pos: [ 0.0, -4.0, -1.3333333333333333 ], color: [ 1.0, 0.0, 0.0 ], labeled: true , pinned: true}, 
		{ name: "a", type: "FreeLine", pos: [ 0.0, -1.3333333333333333, 4.0 ], color: [ 0.0, 0.0, 1.0 ], labeled: true } ], 
        });
    });

    itCmd("allpoints(a)", "[]");
    itCmd("alllines(A)", "[]");
    itCmd("alllines(B)", "[]");
    itCmd("alllines(C)", "[]");
    itCmd("alllines(D)", "[]");
});


describe("Prover: CircleMR", function() {

    before(function() {
        // See examples/141_d_false_conjecture_circle.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "A", type: "Free", pos: [ 4.0, 4.0, 1.3333333333333333 ], color: [ 1.0, 0.0, 0.0 ], labeled: true, pinned: true }, 
		{ name: "B", type: "Free", pos: [ 0.0, -0.0, 4.0 ], color: [ 1.0, 0.0, 0.0 ], labeled: true, pinned: true }, 
		{ name: "C0", type: "CircleByRadius", pos: { xx: -0.05555555555555555, yy: -0.05555555555555555, zz: 1.0, xy: 0.0, xz: 0.0, yz: 0.0 }, color: [ 0.0, 0.0, 1.0 ], radius: 4.242640687119285, args: [ "B" ], printname: "$C_{0}$" } ], 
        });
    });

    itCmd("allelements(A)", "[]");
    itCmd("allelements(C0)", "[]");
});


describe("Prover: HorizontalLine VerticalLine", function() {

    before(function() {
        // See examples/141_e_horizontal_vertical.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "a", type: "VerticalLine", pos: [ -2.0, -0.0, 4.0 ], color: [ 0.0, 0.0, 1.0 ], labeled: true }, 
		{ name: "A", type: "Free", pos: [ -2.0, -4.0, -1.0 ], color: [ 1.0, 0.0, 0.0 ], pinned: true, labeled: true }, 
		{ name: "b", type: "HorizontalLine", pos: [ 0.0, -1.0, 4.0 ], color: [ 0.0, 0.0, 1.0 ], labeled: true } ], 
    });
    });

    itCmd("allpoints(a)", "[]");
    itCmd("allpoints(b)", "[]");
    itCmd("alllines(A)", "[]");
});


describe("Prover: Through", function() {

    before(function() {
        // See examples/141_f_through.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "A", type: "Free", pos: [ 0.0, -0.0, 4.0 ], color: [ 1.0, 0.0, 0.0 ], labeled: true, pinned: true }, 
		{ name: "B", type: "Free", pos: [ 4.0, 4.0, 1.0 ], color: [ 1.0, 0.0, 0.0 ], labeled: true, pinned: true }, 
		{ name: "a", type: "Through", pos: [ 4.0, -4.0, 0.0 ], color: [ 0.0, 0.0, 1.0 ], args: [ "B" ], labeled: true } ], 
    });
    });

    itCmd("allpoints(a)", "[B]");
    itCmd("alllines(A)", "[]");
});


describe("Prover: points on l_infty", function() {

    before(function() {
        // See examples/141_f_through.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),

	geometry: [ 
        {name:"A", type:"Free", pos:[1,0,0], pinned:true},
        {name:"B", type:"Free", pos:[1,1,0], pinned:true},
        {name:"l", type:"Join", args:["A", "B"]},
        {name:"C", type:"Free", pos:[1,2,0]}
            ]
    });
    });

    itCmd("allpoints(l)", "[A, B]");
    itCmd("alllines(C)", "[]");
});

describe("Prover: PointOn*", function() {

    before(function() {
        // See examples/141_f_through.html
        cdy = createCindy({
            isNode: true,
            csconsole: null,
            canvas: new FakeCanvas(),
	geometry: [ 
		{ name: "A", type: "Free", pos: [ -2.2857142857142856, -4.0, -0.5714285714285714 ], color: [ 1.0, 0.0, 0.0 ], pinned: true, labeled: true }, 
		{ name: "B", type: "Free", pos: [ 4.0, 3.5, 0.5 ], color: [ 1.0, 0.0, 0.0 ], pinned: true, labeled: true }, 
		{ name: "a", type: "Segment", color: [ 0.0, 0.0, 1.0 ], args: [ "A", "B" ], labeled: true }, 
		{ name: "C", type: "Free", pos: [ 0.0, -0.0, 4.0 ], color: [ 1.0, 0.0, 0.0 ], pinned: true, labeled: true }, 
		{ name: "C0", type: "CircleByRadius", pos: { xx: -0.1111111111111111, yy: -0.1111111111111111, zz: 1.0, xy: 0.0, xz: 0.0, yz: 0.0 }, color: [ 0.0, 0.0, 1.0 ], radius: 3.0, args: [ "C" ], pinned: true, printname: "$C_{0}$" }, 
		{ name: "D", type: "PointOnCircle", pos: [ { r: 1.3357992207441945E-15, i: -2.5649992745898987E-16 }, -4.0, { r: -1.3333333333333333, i: 2.8552700268388423E-32 } ], color: [ 1.0, 0.0, 0.0 ], args: [ "C0" ], labeled: true }, 
		{ name: "b", type: "FreeLine", pos: [ 0.0, -0.8, 4.0 ], color: [ 0.0, 0.0, 1.0 ], pinned: true, labeled: true }, 
		{ name: "F", type: "PointOnSegment", pos: [ -3.428571428571429, -4.0, -0.5714285714285714 ], color: [ 1.0, 0.0, 0.0 ], args: [ "a" ], labeled: true }, 
		{ name: "d", type: "HorizontalLine", pos: [ 0.0, -1.3333333333333333, 4.0 ], color: [ 0.0, 0.0, 1.0 ], pinned: true, labeled: true }, 
		{ name: "E", type: "PointOnLine", pos: [ 4.0, 3.3333333333333335, 0.6666666666666666 ], color: [ 1.0, 0.0, 0.0 ], args: [ "b" ], labeled: true }, 
		{ name: "c", type: "VerticalLine", pos: [ -0.6666666666666666, -0.0, 4.0 ], color: [ 0.0, 0.0, 1.0 ], pinned: true, labeled: true } ], 
    });
    });

    itCmd("allelements(C0)", "[D]");
    itCmd("allelements(D)", "[C0]");
    itCmd("allelements(E)", "[b]");
    itCmd("allelements(F)", "[a]");
    itCmd("allelements(c)", "[]");
});
