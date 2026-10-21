var should = require("chai").should();
var rewire = require("rewire");

global.navigator = {};
var CindyJS = require("../build/js/Cindy.plain.js");
var cindyJS = rewire("../build/js/exposed.js");

var List = cindyJS.__get__("List");
var CSNumber = cindyJS.__get__("CSNumber");
var niceprint = cindyJS.__get__("niceprint");

// The `nsa` option: elements that come out undefined in a degenerate
// configuration show their limit, if the singularity is removable (see
// src/js/libgeo/Nsa.ts). Every case below moves `mover` from `from` to the
// degenerate position `to` and checks that
//   - without nsa, `target` is undefined (NaN or the zero vector),
//   - with nsa, it is defined,
//   - and it agrees with a witness: the plain construction evaluated at
//     to + h * (from - to), a small but finite step back along the path.

function P(name, x, y) {
    return { name: name, type: "Free", pos: [x, y] };
}

function widget(geometry, nsa) {
    return CindyJS({
        isNode: true,
        csconsole: false,
        nsa: nsa,
        geometry: JSON.parse(JSON.stringify(geometry)),
    });
}

function isUndefined(v) {
    return !v || v.ctype !== "list" || List._helper.isNaN(v) || List._helper.isAlmostZero(v);
}

function flat(v) {
    if (v.value[0].ctype !== "list") return v;
    return List.turnIntoCSList(
        [].concat.apply(
            [],
            v.value.map((r) => r.value)
        )
    );
}

function projectiveDistance(a, b) {
    return List.projectiveDistMinScal(flat(List.normalizeMax(a)), flat(List.normalizeMax(b)));
}

function evaluateAt(c, nsa, pos) {
    var cdy = widget(c.geometry, nsa);
    (c.setup || []).forEach(function (s) {
        cdy.evalcs(s);
    });
    cdy.evalcs(c.mover + ".xy=(" + c.from + ")");
    cdy.evalcs(c.mover + ".xy=(" + pos + ")");
    return cdy.evalcs(c.target);
}

// Free elements that meet: the limit along the path exists, but it depends on
// the direction they meet from, so it is not stable under perturbation of the
// free elements (thesis, Algorithm "Extended C0-Continuation"), and the
// singularity is not removable.
var notRemovable = [
    {
        // classifying the conics (ellipse or hyperbola) must work with infinitesimals
        name: "conics by two coinciding foci and a point",
        geometry: [
            P("F1", 0, 0),
            P("F2", 2, 0),
            P("Q", 1, 2),
            { name: "Cs", type: "ConicBy2Foci1P", args: ["F1", "F2", "Q"] },
            { name: "K", type: "SelectConic", args: ["Cs"], index: 2 },
        ],
        mover: "F2",
        from: [1, 0],
        to: [0, 0],
        target: "K.matrix",
    },
    {
        name: "join of coinciding points, approached vertically",
        geometry: [P("A", 0, 0), P("B", 1, 1), { name: "X", type: "Join", args: ["A", "B"] }],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
        expect: [1, 0, -1],
    },
    {
        name: "join of coinciding points, approached diagonally",
        geometry: [P("A", 0, 0), P("B", 1, 1), { name: "X", type: "Join", args: ["A", "B"] }],
        mover: "A",
        from: [0, 0],
        to: [1, 1],
        target: "X.homog",
        expect: [1, -1, 0],
    },
    {
        name: "meet of coinciding lines",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            P("C", 1, 0),
            P("D", 3, 1),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "m", type: "Join", args: ["C", "D"] },
            { name: "X", type: "Meet", args: ["l", "m"] },
        ],
        mover: "D",
        from: [3, 1],
        to: [3, 0],
        target: "X.homog",
    },
    {
        name: "perpendicular to a degenerate join",
        geometry: [
            P("A", 0, 0),
            P("B", 1, 1),
            P("C", 3, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "X", type: "Perp", args: ["l", "C"] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
    },
    {
        name: "parallel to a degenerate join",
        geometry: [
            P("A", 0, 0),
            P("B", 1, 1),
            P("C", 3, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "X", type: "Para", args: ["l", "C"] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
    },
    {
        name: "meet with a degenerate join",
        geometry: [
            P("A", 0, 0),
            P("B", 1, 1),
            P("C", 3, 0),
            P("D", 3, 5),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "m", type: "Join", args: ["C", "D"] },
            { name: "X", type: "Meet", args: ["l", "m"] },
        ],
        mover: "A",
        from: [0, 1],
        to: [1, 1],
        target: "X.homog",
    },
    {
        name: "point on a degenerate join",
        geometry: [
            P("A", 0, 0),
            P("B", 1, 1),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "X", type: "PointOnLine", args: ["l"], pos: [0.5, 0.5, 1] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
    },
    {
        name: "join through a midpoint",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 2),
            P("C", 1, 1),
            { name: "M", type: "Mid", args: ["A", "B"] },
            { name: "X", type: "Join", args: ["M", "C"] },
        ],
        mover: "A",
        from: [0, 1],
        to: [0, 0],
        target: "X.homog",
    },
    {
        name: "circle through two coinciding points",
        geometry: [P("A", 0, 0), P("B", 2, 0), P("C", 0, 2), { name: "X", type: "CircleBy3", args: ["A", "B", "C"] }],
        mover: "C",
        from: [1, 1],
        to: [0, 0],
        target: "X.matrix",
    },
    {
        name: "conic through two coinciding points",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            P("C", 3, 2),
            P("D", 1, 3),
            P("E", -1, 2),
            { name: "X", type: "ConicBy5", args: ["A", "B", "C", "D", "E"] },
        ],
        mover: "E",
        from: [-1, 2],
        to: [0, 0],
        target: "X.matrix",
    },
    {
        name: "center of a degenerate circle",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            P("C", 0, 2),
            { name: "c", type: "CircleBy3", args: ["A", "B", "C"] },
            { name: "X", type: "CenterOfConic", args: ["c"] },
        ],
        mover: "C",
        from: [1, 1],
        to: [0, 0],
        target: "X.homog",
    },
    {
        name: "polar with respect to a degenerate circle",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            P("C", 0, 2),
            P("Q", 5, 5),
            { name: "c", type: "CircleBy3", args: ["A", "B", "C"] },
            { name: "X", type: "PolarOfPoint", args: ["Q", "c"] },
        ],
        mover: "C",
        from: [1, 1],
        to: [0, 0],
        target: "X.homog",
    },
    {
        name: "intersection of a circle and a degenerate join",
        geometry: [
            P("A", 0, 0),
            P("B", 1, 1),
            P("M", 0, 0),
            P("R", 3, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "c", type: "CircleMP", args: ["M", "R"] },
            { name: "Is", type: "IntersectLC", args: ["l", "c"] },
            { name: "X", type: "SelectP", args: ["Is"], index: 1 },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
    },
];

// A point bound to a line (PointOnLine), at a position given as [x, y]
function L(name, line, x, y) {
    return { name: name, type: "PointOnLine", args: [line], pos: [x, y, 1] };
}

// The same constructions with the elements that meet bound to a common line
// (as the centers in the thesis' "Unification of Circles (semi-free)"): every
// perturbation keeps them on it, so the limit is stable and the singularity
// removable.
var cases = [
    {
        // classifying the conics (ellipse or hyperbola) must work with infinitesimals
        name: "conics by two coinciding foci and a point",
        geometry: [
            { name: "g", type: "FreeLine", pos: [0, 1, 0] },
            L("F1", "g", 0, 0),
            L("F2", "g", 2, 0),
            P("Q", 1, 2),
            { name: "Cs", type: "ConicBy2Foci1P", args: ["F1", "F2", "Q"] },
            { name: "K", type: "SelectConic", args: ["Cs"], index: 2 },
        ],
        mover: "F2",
        from: [1, 0],
        to: [0, 0],
        target: "K.matrix",
    },
    {
        name: "join of coinciding points on a vertical line",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, 0, -1] },
            L("A", "g", 1, 0),
            L("B", "g", 1, 1),
            { name: "X", type: "Join", args: ["A", "B"] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
        expect: [1, 0, -1],
    },
    {
        name: "join of coinciding points on a diagonal line",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, -1, 0] },
            L("A", "g", 0, 0),
            L("B", "g", 1, 1),
            { name: "X", type: "Join", args: ["A", "B"] },
        ],
        mover: "A",
        from: [0, 0],
        to: [1, 1],
        target: "X.homog",
        expect: [1, -1, 0],
    },
    {
        name: "meet of coinciding lines through a point on both",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            L("C", "l", 1, 0),
            P("D", 3, 1),
            { name: "m", type: "Join", args: ["C", "D"] },
            { name: "X", type: "Meet", args: ["l", "m"] },
        ],
        mover: "D",
        from: [3, 1],
        to: [3, 0],
        target: "X.homog",
        expect: [1, 0, 1],
    },
    {
        name: "perpendicular to a degenerate join",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, 0, -1] },
            L("A", "g", 1, 0),
            L("B", "g", 1, 1),
            P("C", 3, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "X", type: "Perp", args: ["l", "C"] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
        expect: [0, 1, 0],
    },
    {
        name: "parallel to a degenerate join",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, 0, -1] },
            L("A", "g", 1, 0),
            L("B", "g", 1, 1),
            P("C", 3, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "X", type: "Para", args: ["l", "C"] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
        expect: [1, 0, -3],
    },
    {
        name: "meet with a degenerate join",
        geometry: [
            { name: "g", type: "FreeLine", pos: [0, 1, -1] },
            L("A", "g", 0, 1),
            L("B", "g", 1, 1),
            P("C", 3, 0),
            P("D", 3, 5),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "m", type: "Join", args: ["C", "D"] },
            { name: "X", type: "Meet", args: ["l", "m"] },
        ],
        mover: "A",
        from: [0, 1],
        to: [1, 1],
        target: "X.homog",
        expect: [3, 1, 1],
    },
    {
        name: "point on a degenerate join",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, 0, -1] },
            L("A", "g", 1, 0),
            L("B", "g", 1, 1),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "X", type: "PointOnLine", args: ["l"], pos: [1, 0.5, 1] },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
    },
    {
        name: "join through a midpoint",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, -1, 0] },
            L("A", "g", -1, -1),
            L("B", "g", 2, 2),
            L("C", "g", 1, 1),
            { name: "M", type: "Mid", args: ["A", "B"] },
            { name: "X", type: "Join", args: ["M", "C"] },
        ],
        mover: "A",
        from: [-1, -1],
        to: [0, 0],
        target: "X.homog",
    },
    {
        // the circle through B tangent to g at A
        name: "circle through two coinciding points",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, -1, 0] },
            L("A", "g", 0, 0),
            P("B", 2, 0),
            L("C", "g", 1, 1),
            { name: "X", type: "CircleBy3", args: ["A", "B", "C"] },
        ],
        mover: "C",
        from: [1, 1],
        to: [0, 0],
        target: "X.matrix",
    },
    {
        name: "conic through two coinciding points",
        geometry: [
            { name: "g", type: "FreeLine", pos: [2, 1, 0] },
            L("A", "g", 0, 0),
            P("B", 2, 0),
            P("C", 3, 2),
            P("D", 1, 3),
            L("E", "g", -1, 2),
            { name: "X", type: "ConicBy5", args: ["A", "B", "C", "D", "E"] },
        ],
        mover: "E",
        from: [-1, 2],
        to: [0, 0],
        target: "X.matrix",
    },
    {
        name: "center of a degenerate circle",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, -1, 0] },
            L("A", "g", 0, 0),
            P("B", 2, 0),
            L("C", "g", 1, 1),
            { name: "c", type: "CircleBy3", args: ["A", "B", "C"] },
            { name: "X", type: "CenterOfConic", args: ["c"] },
        ],
        mover: "C",
        from: [1, 1],
        to: [0, 0],
        target: "X.homog",
        expect: [1, -1, 1],
    },
    {
        name: "polar with respect to a degenerate circle",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, -1, 0] },
            L("A", "g", 0, 0),
            P("B", 2, 0),
            L("C", "g", 1, 1),
            P("Q", 5, 5),
            { name: "c", type: "CircleBy3", args: ["A", "B", "C"] },
            { name: "X", type: "PolarOfPoint", args: ["Q", "c"] },
        ],
        mover: "C",
        from: [1, 1],
        to: [0, 0],
        target: "X.homog",
    },
    {
        name: "intersection of a circle and a degenerate join",
        geometry: [
            { name: "g", type: "FreeLine", pos: [1, 0, -1] },
            L("A", "g", 1, 0),
            L("B", "g", 1, 1),
            P("M", 0, 0),
            P("R", 3, 0),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "c", type: "CircleMP", args: ["M", "R"] },
            { name: "Is", type: "IntersectLC", args: ["l", "c"] },
            { name: "X", type: "SelectP", args: ["Is"], index: 1 },
        ],
        mover: "A",
        from: [1, 0],
        to: [1, 1],
        target: "X.homog",
    },
    {
        // S and T are defined, they only coincide: the free points do not meet
        name: "join of two degenerate meets",
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            P("C", 1, 0),
            P("D", 3, 1),
            P("E", 0, 3),
            P("F", 2, 3),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "m", type: "Join", args: ["C", "D"] },
            { name: "S", type: "Meet", args: ["l", "m"] },
            { name: "n", type: "Join", args: ["E", "F"] },
            { name: "T", type: "Meet", args: ["n", "m"] },
            { name: "X", type: "Join", args: ["S", "T"] },
        ],
        mover: "D",
        from: [3, 1],
        to: [3, 0],
        target: "X.homog",
    },
];

describe("nsa: degenerate constructions", function () {
    cases.forEach(function (c) {
        it(c.name, function () {
            var plain = evaluateAt(c, false, c.to);
            isUndefined(plain).should.equal(true, "degenerate without nsa: " + niceprint(plain));
            var limit = evaluateAt(c, true, c.to);
            isUndefined(limit).should.equal(false, "resolved: " + niceprint(limit));
            var h = 1e-6;
            var witness = evaluateAt(c, false, [
                c.to[0] + h * (c.from[0] - c.to[0]),
                c.to[1] + h * (c.from[1] - c.to[1]),
            ]);
            projectiveDistance(limit, witness).should.be.below(1e-4, niceprint(limit) + " vs " + niceprint(witness));
            if (c.expect) projectiveDistance(limit, List.realVector(c.expect)).should.be.below(1e-12);
        });
    });

    it("is off unless requested", function () {
        var cdy = CindyJS({
            isNode: true,
            csconsole: false,
            geometry: cases[1].geometry,
        });
        cdy.evalcs("A.xy=(1,1)");
        isUndefined(cdy.evalcs("X.homog")).should.equal(true);
    });
});

describe("nsa: singularities that are not removable", function () {
    notRemovable.forEach(function (c) {
        it(c.name + ": undefined", function () {
            var limit = evaluateAt(c, true, c.to);
            isUndefined(limit).should.equal(true, niceprint(limit));
        });
    });
});

// A Levi-Civita series only exists inside the evaluation (see
// src/js/libcs/LeviCivitaMode.ts); outside it would compute as NaN.
function hasSeries(v) {
    if (Array.isArray(v)) return v.some(hasSeries);
    if (!v || typeof v !== "object") return false;
    if (v.lc !== undefined) return true;
    return Object.keys(v).some((k) => hasSeries(v[k]));
}

describe("nsa: no series leave the evaluation", function () {
    cases.forEach(function (c) {
        it(c.name, function () {
            var cdy = widget(c.geometry, true);
            (c.setup || []).forEach(function (s) {
                cdy.evalcs(s);
            });
            cdy.evalcs(c.mover + ".xy=(" + c.from + ")");
            cdy.evalcs(c.mover + ".xy=(" + c.to + ")");
            var fields = cdy.evalcs("apply(allelements(), [#.homog, #.matrix, #.radius])");
            fields.value.length.should.be.above(0);
            hasSeries(fields).should.equal(false);
            // and the arithmetic is the standard one again
            isNaN(cdy.evalcs("1 + 2").value.real).should.equal(false);
        });
    });
});

describe("nsa: von Staudt's construction of x + y", function () {
    // x + y on the line g by joins, meets and parallels, as in
    // examples/173_NSA.html. The construction degenerates whenever the
    // auxiliary point E lies on g, although the sum does not depend on E.
    var geometry = [
        { name: "g", type: "HorizontalLine", pos: [0, 1, 0] },
        { name: "O", type: "PointOnLine", args: ["g"], pos: [-4, 0, 1] },
        { name: "X", type: "PointOnLine", args: ["g"], pos: [1, 0, 1] },
        { name: "Y", type: "PointOnLine", args: ["g"], pos: [2, 0, 1] },
        P("E", -2, 3),
        { name: "c", type: "Para", args: ["g", "E"] },
        { name: "F", type: "PointOnLine", args: ["c"], pos: [2, 3, 1] },
        { name: "a", type: "Join", args: ["O", "E"] },
        { name: "d", type: "Join", args: ["Y", "F"] },
        { name: "G", type: "Meet", args: ["a", "d"] },
        { name: "e", type: "Para", args: ["g", "G"] },
        { name: "b", type: "Join", args: ["X", "E"] },
        { name: "H", type: "Meet", args: ["b", "e"] },
        { name: "f", type: "Join", args: ["H", "F"] },
        { name: "S", type: "Meet", args: ["f", "g"] },
    ];

    function check(cdy, moves) {
        moves.forEach(function (m) {
            cdy.evalcs(m[0]);
            var s = cdy.evalcs("S.homog");
            isUndefined(s).should.equal(false, m[0] + ": S undefined");
            cdy.evalcs("S.x - O.x").value.real.should.be.closeTo(m[1], 1e-9, m[0]);
        });
    }

    it("is undefined without nsa while E is on g", function () {
        var cdy = widget(geometry, false);
        cdy.evalcs("E.xy=(-2,0)");
        isUndefined(cdy.evalcs("S.homog")).should.equal(true);
    });

    it("resolves E on g, sliding along g, E on X, and X and Y moving meanwhile", function () {
        check(widget(geometry, true), [
            ["E.xy=(-2,1)", 11],
            ["E.xy=(-2,0)", 11], // onto g
            ["E.xy=(0,0)", 11], // along g
            ["E.xy=(1,0)", 11], // onto X
            ["Y.xy=(3,0)", 12], // with E parked on X
            ["X.xy=(-1,0)", 10], // with E parked on g
            ["E.xy=(0,2)", 10], // and away again
        ]);
    });

    it("resolves E on g approached from below", function () {
        check(widget(geometry, true), [
            ["E.xy=(-2,-1)", 11],
            ["E.xy=(-2,0)", 11],
        ]);
    });
});

describe("nsa leaves tracing alone", function () {
    // intersections of a circle with the join of A and B, where A passes over B
    var geometry = [
        P("A", 0, 0),
        P("B", 1, 1),
        P("M", 0, 0),
        P("R", 3, 0),
        { name: "l", type: "Join", args: ["A", "B"] },
        { name: "c", type: "CircleMP", args: ["M", "R"] },
        { name: "Is", type: "IntersectLC", args: ["l", "c"] },
        { name: "X", type: "SelectP", args: ["Is"], index: 1 },
        { name: "Y", type: "SelectP", args: ["Is"], index: 2 },
    ];
    var moves = [
        "A.xy=(1,0)",
        "A.xy=(1,1)",
        "A.xy=(1,2)",
        "A.xy=(0,2)",
        "A.xy=(-1,1)",
        "A.xy=(1,1)",
        "A.xy=(2,1)",
        "A.xy=(0,0)",
    ];
    function run(nsa) {
        var cdy = widget(geometry, nsa);
        return moves.map(function (m) {
            cdy.evalcs(m);
            return [cdy.evalcs("X.homog"), cdy.evalcs("Y.homog")];
        });
    }

    it("keeps branch choices, and continues them into degenerate positions", function () {
        var plain = run(false);
        var withNsa = run(true);
        moves.forEach(function (m, i) {
            if (isUndefined(plain[i][0])) {
                // A on B, arriving along the line of the previous move: the
                // limit is the previous position, in the same order
                niceprint(withNsa[i]).should.equal(niceprint(withNsa[i - 1]), m);
            } else {
                niceprint(withNsa[i]).should.equal(niceprint(plain[i]), m);
            }
        });
    });

    it("keeps branch choices at a tangency", function () {
        var geometry = [
            P("A", -2, 0),
            P("B", 2, 0),
            { name: "C0", type: "CircleMr", args: ["A"], radius: 3 },
            { name: "C1", type: "CircleMr", args: ["B"], radius: 3 },
            { name: "Ps", type: "IntersectCirCir", args: ["C0", "C1"] },
            { name: "P", type: "SelectP", args: ["Ps"], index: 1 },
        ];
        var moves = ["B.xy=(3,0)", "B.xy=(4,0)", "B.xy=(6,0)", "B.xy=(4,0)", "B.xy=(2,0)"];
        var run = function (nsa) {
            var cdy = widget(geometry, nsa);
            return moves.map(function (m) {
                cdy.evalcs(m);
                return niceprint(cdy.evalcs("P.homog"));
            });
        };
        run(true).should.eql(run(false));
    });

    it("restarts a failed move from the last good state, not from a limit", function () {
        // equal circles (the radius is the distance of U and V) whose centers
        // on g meet at B = -2, where tracing fails; the next move starts over
        // from the position before, with the state from before
        var geometry = [
            { name: "g", type: "FreeLine", pos: [0, 1, 0] },
            P("U", 5, 5),
            P("V", 8, 5),
            L("A", "g", -2, 0),
            L("B", "g", 2, 0),
            { name: "C0", type: "Compass", args: ["U", "V", "A"] },
            { name: "C1", type: "Compass", args: ["U", "V", "B"] },
            { name: "Ps", type: "IntersectCirCir", args: ["C0", "C1"] },
            { name: "X", type: "SelectP", args: ["Ps"], index: 1 },
        ];
        var moves = ["B.xy=(0,0)", "B.xy=(-2,0)", "B.xy=(-2.5,0)", "B.xy=(-3,0)", "B.xy=(-1,0)"];
        var exact = function (v) {
            return v.value
                .map(function (z) {
                    return z.value.real + "," + z.value.imag;
                })
                .join(";");
        };
        var run = function (nsa) {
            var cdy = widget(geometry, nsa);
            return moves.map(function (m) {
                cdy.evalcs(m);
                return cdy.evalcs("X.homog");
            });
        };
        var plain = run(false);
        var withNsa = run(true);
        moves.forEach(function (m, i) {
            if (isUndefined(plain[i])) isUndefined(withNsa[i]).should.equal(false, m);
            else exact(withNsa[i]).should.equal(exact(plain[i]), m);
        });
    });
});

describe("nsa: continuation along the path of the move", function () {
    // X joins E and F, both on the line g; whenever E and F coincide, X must
    // be g. (Were they free, the line through them would depend on the
    // direction the last of them arrived from: not removable.)
    function through(name, p, q) {
        return {
            name: name,
            type: "FreeLine",
            pos: List.cross(List.realVector([p[0], p[1], 1]), List.realVector([q[0], q[1], 1])).value.map(
                (z) => z.value.real
            ),
        };
    }

    function expectLine(cdy, point, dir, label) {
        var x = cdy.evalcs("X.homog");
        isUndefined(x).should.equal(false, label + ": X undefined");
        var on = List.realVector([point[0], point[1], 1]);
        var along = List.realVector([point[0] + dir[0], point[1] + dir[1], 1]);
        projectiveDistance(x, List.cross(on, along)).should.be.below(1e-9, label + ": " + niceprint(x));
    }

    it("when the endpoint of the move is not exactly representable", function () {
        // coordinates > 1 and decimals: src + 1 * (dst - src) != dst in floating point
        [
            [0.3, 0.7],
            [-2.9, 4.1],
            [5.3, -1.7],
            [0.1, 0.2],
            [-3.3, -0.9],
        ].forEach(function (from) {
            var cdy = widget(
                [
                    through("g", from, [2.7, -1.3]),
                    L("E", "g", from[0], from[1]),
                    L("F", "g", 2.7, -1.3),
                    { name: "X", type: "Join", args: ["E", "F"] },
                ],
                true
            );
            cdy.evalcs("E.xy=(2.7,-1.3)");
            expectLine(cdy, [2.7, -1.3], [from[0] - 2.7, from[1] + 1.3], "from " + from);
        });
    });

    it("after the point that arrived stays and others move", function () {
        var cdy = widget(
            [
                P("A", -1, -8),
                P("B", 5, 1),
                { name: "g", type: "Join", args: ["A", "B"] },
                L("E", "g", 1, -5),
                L("F", "g", 3, -2),
                { name: "X", type: "Join", args: ["E", "F"] },
                P("U", 7, 7),
            ],
            true
        );
        cdy.evalcs("E.xy=(3,-2)"); // along g, direction (2, 3)
        expectLine(cdy, [3, -2], [2, 3], "arrived");
        cdy.evalcs("F.xy=(3,-2)"); // F moved without moving
        expectLine(cdy, [3, -2], [2, 3], "after F moved by zero");
        cdy.evalcs("U.xy=(8,6)"); // an unrelated point moved
        expectLine(cdy, [3, -2], [2, 3], "after U moved");
    });

    it("but not for free points: the line depends on where they met from", function () {
        var cdy = widget([P("E", 1, -5), P("F", 3, -2), { name: "X", type: "Join", args: ["E", "F"] }], true);
        cdy.evalcs("E.xy=(3,-2)");
        isUndefined(cdy.evalcs("X.homog")).should.equal(true, "arrived");
        cdy.evalcs("F.xy=(3,-2)");
        isUndefined(cdy.evalcs("X.homog")).should.equal(true, "after F moved by zero");
    });

    it("when the point that arrived is moved by zero", function () {
        var cdy = widget(
            [
                { name: "g", type: "FreeLine", pos: [1, 0, -2] },
                L("E", "g", 2, 5),
                L("F", "g", 2, 2),
                { name: "X", type: "Join", args: ["E", "F"] },
            ],
            true
        );
        cdy.evalcs("E.xy=(2,2)"); // arrives at F from above
        expectLine(cdy, [2, 2], [0, 1], "arrived from above");
        cdy.evalcs("E.xy=(2,2)");
        expectLine(cdy, [2, 2], [0, 1], "after E moved by zero");
    });

    it("is not disturbed by an unrelated undefined element", function () {
        var cdy = widget(
            [
                { name: "g", type: "FreeLine", pos: [0, 1, -1] },
                L("E", "g", 0, 1),
                L("F", "g", 2, 1),
                { name: "X", type: "Join", args: ["E", "F"] },
                { name: "K", type: "FreeConic" },
            ],
            true
        );
        cdy.evalcs("E.xy=(1,1)");
        cdy.evalcs("E.xy=(2,1)");
        expectLine(cdy, [2, 1], [1, 0], "arrived");
        cdy.evalcs("F.xy=(2,1)");
        expectLine(cdy, [2, 1], [1, 0], "after F moved by zero");
    });

    it("when nothing can be perturbed: pinned points moved by a script", function () {
        var cdy = widget(
            [
                { name: "g", type: "FreeLine", pos: [1, -1, 0], pinned: true },
                Object.assign(L("E", "g", 3, 3), { pinned: true }),
                Object.assign(L("F", "g", 1, 1), { pinned: true }),
                { name: "X", type: "Join", args: ["E", "F"] },
            ],
            true
        );
        cdy.evalcs("E.xy=(1,1)");
        expectLine(cdy, [1, 1], [1, 1], "arrived");
        cdy.evalcs("F.xy=(1,1)");
        expectLine(cdy, [1, 1], [1, 1], "after F moved by zero");
    });

    it("but not without a path: pinned points coinciding when loading", function () {
        var cdy = widget(
            [
                { name: "g", type: "FreeLine", pos: [1, -1, 0], pinned: true },
                Object.assign(L("E", "g", 1, 1), { pinned: true }),
                Object.assign(L("F", "g", 1, 1), { pinned: true }),
                { name: "X", type: "Join", args: ["E", "F"] },
            ],
            true
        );
        isUndefined(cdy.evalcs("X.homog")).should.equal(true);
    });

    it("leaves the join of free points coinciding when loading undefined", function () {
        var cdy = widget([P("E", 2, 1), P("F", 2, 1), { name: "X", type: "Join", args: ["E", "F"] }], true);
        isUndefined(cdy.evalcs("X.homog")).should.equal(true);
    });

    it("only in the widget that asked for it", function () {
        var geometry = [
            { name: "g", type: "FreeLine", pos: [0, 1, -1] },
            L("E", "g", 0, 1),
            L("F", "g", 2, 1),
            { name: "X", type: "Join", args: ["E", "F"] },
        ];
        var plain = widget(geometry, false);
        var nsa = widget(geometry, true);
        plain.evalcs("E.xy=(2,1)");
        nsa.evalcs("E.xy=(2,1)");
        isUndefined(plain.evalcs("X.homog")).should.equal(true);
        isUndefined(nsa.evalcs("X.homog")).should.equal(false);
    });
});

describe("nsa: removable and non-removable singularities", function () {
    // The thesis' "unification of circles": two circles of equal radius whose
    // centers come together. The line through their intersections has a limit
    // if the centers are bound to a common line, and none if they are free.
    function circles(centers) {
        return centers.concat([
            { name: "c1", type: "CircleMr", args: ["A"], radius: 2 },
            { name: "c2", type: "CircleMr", args: ["C"], radius: 2 },
            { name: "Is", type: "IntersectCirCir", args: ["c1", "c2"] },
            { name: "X", type: "SelectP", args: ["Is"], index: 1 },
            { name: "Y", type: "SelectP", args: ["Is"], index: 2 },
            { name: "Z", type: "Join", args: ["X", "Y"] },
        ]);
    }

    it("unified circles with centers on a common line: the perpendicular through the center", function () {
        // the radius of c2 tied to that of c1, so that every perturbation
        // keeps the radii equal and both centers on g
        var tied = function (cx) {
            return [
                { name: "g", type: "HorizontalLine", pos: [0, 1, -1] },
                { name: "A", type: "PointOnLine", args: ["g"], pos: [0, 1, 1] },
                { name: "C", type: "PointOnLine", args: ["g"], pos: [cx, 1, 1] },
                P("B", 2, 1),
                { name: "c1", type: "CircleMP", args: ["A", "B"] },
                { name: "c2", type: "Compass", args: ["A", "B", "C"] },
                { name: "Is", type: "IntersectCirCir", args: ["c1", "c2"] },
                { name: "X", type: "SelectP", args: ["Is"], index: 1 },
                { name: "Y", type: "SelectP", args: ["Is"], index: 2 },
                { name: "Z", type: "Join", args: ["X", "Y"] },
            ];
        };
        var cdy = widget(tied(1), true);
        cdy.evalcs("C.xy=(0,1)");
        var z = cdy.evalcs("Z.homog");
        isUndefined(z).should.equal(false, "Z undefined");
        projectiveDistance(z, List.realVector([1, 0, 0])).should.be.below(1e-9, niceprint(z));
        var loaded = widget(tied(0), true).evalcs("Z.homog");
        isUndefined(loaded).should.equal(false, "Z undefined when loaded");
        projectiveDistance(loaded, List.realVector([1, 0, 0])).should.be.below(1e-9, niceprint(loaded));
        // CircleMr radii are free parameters of their own: the perturbations
        // change them independently and the radical axis is arbitrary
        var geometry = circles([
            { name: "g", type: "HorizontalLine", pos: [0, 1, -1] },
            { name: "A", type: "PointOnLine", args: ["g"], pos: [0, 1, 1] },
            { name: "C", type: "PointOnLine", args: ["g"], pos: [1, 1, 1] },
        ]);
        var free = widget(geometry, true);
        free.evalcs("C.xy=(0,1)");
        isUndefined(free.evalcs("Z.homog")).should.equal(true, "free radii, moved");
        geometry[2].pos = [0, 1, 1];
        isUndefined(widget(geometry, true).evalcs("Z.homog")).should.equal(true, "free radii, loaded");
    });

    it("unified circles with free centers: undefined", function () {
        var geometry = circles([P("A", 0, 1), P("C", 0, 1)]);
        isUndefined(widget(geometry, true).evalcs("Z.homog")).should.equal(true, "loaded");
        // also right after a move: the limit along the path depends on its direction
        geometry[1].pos = [3, 1];
        var cdy = widget(geometry, true);
        cdy.evalcs("C.xy=(0,1)");
        isUndefined(cdy.evalcs("Z.homog")).should.equal(true, "moved");
    });

    it("circles touching along the whole path: undefined", function () {
        // c2 always passes through the point where it touches c1, so the join
        // of the intersections vanishes all along the path
        var cdy = widget(
            [
                P("A", 0, 0),
                P("B", 2, 0),
                P("C", 1, 0),
                P("D", 2, 0),
                { name: "c1", type: "CircleMP", args: ["A", "B"] },
                { name: "c2", type: "CircleMP", args: ["C", "D"] },
                { name: "Is", type: "IntersectCirCir", args: ["c1", "c2"] },
                { name: "X", type: "SelectP", args: ["Is"], index: 1 },
                { name: "Y", type: "SelectP", args: ["Is"], index: 2 },
                { name: "Z", type: "Join", args: ["X", "Y"] },
            ],
            true
        );
        cdy.evalcs("C.xy=(0,0)");
        isUndefined(cdy.evalcs("Z.homog")).should.equal(true);
    });

    it("keeps points on their line when perturbing them", function () {
        // two points on g coinciding when loaded: their join is g, since every
        // admissible perturbation keeps them on g
        var cdy = widget(
            [
                P("A", -1, -1),
                P("B", 3, 1),
                { name: "g", type: "Join", args: ["A", "B"] },
                { name: "E", type: "PointOnLine", args: ["g"], pos: [1, 0, 1] },
                { name: "F", type: "PointOnLine", args: ["g"], pos: [1, 0, 1] },
                { name: "X", type: "Join", args: ["E", "F"] },
            ],
            true
        );
        var x = cdy.evalcs("X.homog");
        isUndefined(x).should.equal(false, "X undefined");
        projectiveDistance(x, cdy.evalcs("g.homog")).should.be.below(1e-9, niceprint(x));
    });

    it("resolves removable singularities present when loading", function () {
        // von Staudt with E on g from the start
        var geometry = [
            { name: "g", type: "HorizontalLine", pos: [0, 1, 0] },
            { name: "O", type: "PointOnLine", args: ["g"], pos: [-4, 0, 1] },
            { name: "X", type: "PointOnLine", args: ["g"], pos: [1, 0, 1] },
            { name: "Y", type: "PointOnLine", args: ["g"], pos: [2, 0, 1] },
            P("E", -2, 0),
            { name: "c", type: "Para", args: ["g", "E"] },
            { name: "F", type: "PointOnLine", args: ["c"], pos: [2, 0, 1] },
            { name: "a", type: "Join", args: ["O", "E"] },
            { name: "d", type: "Join", args: ["Y", "F"] },
            { name: "G", type: "Meet", args: ["a", "d"] },
            { name: "e", type: "Para", args: ["g", "G"] },
            { name: "b", type: "Join", args: ["X", "E"] },
            { name: "H", type: "Meet", args: ["b", "e"] },
            { name: "f", type: "Join", args: ["H", "F"] },
            { name: "S", type: "Meet", args: ["f", "g"] },
        ];
        var cdy = widget(geometry, true);
        isUndefined(cdy.evalcs("S.homog")).should.equal(false, "S undefined");
        cdy.evalcs("S.x - O.x").value.real.should.be.closeTo(11, 1e-9);
    });

    it("gives the same limit for exact and rounded coincidence", function () {
        // 0.1 + 0.2 is not 0.3 in floating point
        var geometry = [
            { name: "g", type: "FreeLine", pos: [10, -3, 0] },
            L("E", "g", 0, 0),
            L("F", "g", 0.3, 1),
            { name: "X", type: "Join", args: ["E", "F"] },
        ];
        var exact = widget(geometry, true);
        exact.evalcs("E.xy=(0.3,1)");
        var rounded = widget(geometry, true);
        rounded.evalcs("E.xy=(0.1+0.2,1)");
        var a = exact.evalcs("X.homog");
        var b = rounded.evalcs("X.homog");
        isUndefined(a).should.equal(false);
        projectiveDistance(a, b).should.be.below(1e-9, niceprint(a) + " vs " + niceprint(b));
    });

    it("gives the tangent when a point on a circle arrives at another one", function () {
        var cdy = widget(
            [
                P("M", 0, 0),
                P("R", 2, 0),
                { name: "c", type: "CircleMP", args: ["M", "R"] },
                { name: "Q", type: "PointOnCircle", args: ["c"], pos: [0, 2, 1] },
                { name: "X", type: "Join", args: ["Q", "R"] },
            ],
            true
        );
        cdy.evalcs("Q.xy=(1.4142135623730951,1.4142135623730951)");
        cdy.evalcs("Q.xy=(2,0)");
        var x = cdy.evalcs("X.homog");
        isUndefined(x).should.equal(false, "X undefined");
        // the tangent at R is x = 2
        projectiveDistance(x, List.realVector([1, 0, -2])).should.be.below(1e-6, niceprint(x));
    });

    it("is deterministic", function () {
        var geometry = [
            { name: "g", type: "HorizontalLine", pos: [0, 1, -1] },
            { name: "A", type: "PointOnLine", args: ["g"], pos: [0, 1, 1] },
            { name: "C", type: "PointOnLine", args: ["g"], pos: [0, 1, 1] },
            { name: "c1", type: "CircleMr", args: ["A"], radius: 2 },
            { name: "c2", type: "CircleMr", args: ["C"], radius: 2 },
            { name: "Is", type: "IntersectCirCir", args: ["c1", "c2"] },
            { name: "X", type: "SelectP", args: ["Is"], index: 1 },
        ];
        niceprint(widget(geometry, true).evalcs("X.homog")).should.equal(
            niceprint(widget(geometry, true).evalcs("X.homog"))
        );
    });
});

describe("nsa: review regressions", function () {
    it("lets tracing continue from a limit", function () {
        // X is an intersection of a circle with the join of A and B, where A
        // was moved onto B; then the circle moves along random paths. X must
        // follow the same branch as for A merely close to B.
        function run(nsa, finalA, path) {
            var cdy = widget(
                [
                    { name: "g", type: "FreeLine", pos: [1, 5, 0] },
                    L("A", "g", -1, 0.2),
                    L("B", "g", 0, 0),
                    P("M", 0.3, 1),
                    P("R", 0.3, 3),
                    { name: "l", type: "Join", args: ["A", "B"] },
                    { name: "k", type: "CircleMP", args: ["M", "R"] },
                    { name: "S", type: "IntersectLC", args: ["l", "k"] },
                    { name: "X", type: "SelectP", args: ["S"], index: 1 },
                ],
                nsa
            );
            cdy.evalcs("A.xy=(-0.5,0.1)");
            cdy.evalcs("A.xy=" + finalA);
            return path.map(function (p) {
                cdy.evalcs("M.xy=(" + p[0] + "," + p[1] + ")");
                return cdy.evalcs("X.homog");
            });
        }
        var seed = 3;
        var rnd = function () {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };
        for (var trial = 0; trial < 30; trial++) {
            var corners = [
                [0.3, 1],
                [rnd() * 8 - 4, rnd() * 8 - 4],
                [rnd() * 8 - 4, rnd() * 8 - 4],
            ];
            var path = [];
            for (var k = 1; k < corners.length; k++) {
                for (var i = 1; i <= 15; i++) {
                    path.push([
                        corners[k - 1][0] + ((corners[k][0] - corners[k - 1][0]) * i) / 15,
                        corners[k - 1][1] + ((corners[k][1] - corners[k - 1][1]) * i) / 15,
                    ]);
                }
            }
            var limit = run(true, "(0,0)", path);
            var reference = run(false, "(-1e-7,2e-8)", path);
            limit.forEach(function (x, f) {
                projectiveDistance(x, reference[f]).should.be.below(
                    1e-3,
                    "trial " + trial + ", frame " + f + ": " + niceprint(x) + " vs " + niceprint(reference[f])
                );
            });
        }
    });

    it("keeps properties set by scripts", function () {
        var cdy = widget(
            [
                { name: "g", type: "FreeLine", pos: [0, 1, 0] },
                L("A", "g", -1, 0),
                L("B", "g", 0, 0),
                { name: "l", type: "Join", args: ["A", "B"] },
            ],
            true
        );
        cdy.evalcs("A.xy=(0,0)");
        cdy.evalcs("l.color=[1,0,0]; l.size=7");
        cdy.evalcs("A.xy=(0,0)");
        niceprint(cdy.evalcs("l.color")).should.equal("[1, 0, 0]");
        niceprint(cdy.evalcs("l.size")).should.equal("7");
        niceprint(cdy.evalcs("l.homog")).should.equal("[0, 1, 0]");
    });

    it("keeps limits while other parts of the construction change", function () {
        var cdy = widget(
            [
                { name: "g", type: "FreeLine", pos: [0, 1, 0] },
                L("A", "g", -1, 0),
                L("B", "g", 0, 0),
                P("C", 2, -1),
                P("E", 1, 1),
                { name: "l", type: "Join", args: ["A", "B"] },
                { name: "m", type: "Join", args: ["C", "E"] },
                { name: "D", type: "Meet", args: ["l", "m"] },
            ],
            true
        );
        cdy.evalcs("A.xy=(0,0)"); // l is g, the x axis
        niceprint(cdy.evalcs("D.xy")).should.equal("[1.5, 0]");
        cdy.evalcs("C.xy=(2.5,-1)"); // D is recomputed from the limit l
        niceprint(cdy.evalcs("D.xy")).should.equal("[1.75, 0]");
        cdy.evalcs("A.xy=(0,0)"); // a click on A
        niceprint(cdy.evalcs("l.homog")).should.equal("[0, 1, 0]");
        niceprint(cdy.evalcs("D.xy")).should.equal("[1.75, 0]");
        cdy.evalcs('create("Z", "Free", [3, 3])'); // adding an element
        niceprint(cdy.evalcs("l.homog")).should.equal("[0, 1, 0]");
        niceprint(cdy.evalcs("D.xy")).should.equal("[1.75, 0]");
    });

    it("continues along the path of a point on a circle moved by more than a quarter turn", function () {
        [
            [0.8, 0.6],
            [0.6, -0.8],
            [-0.8, 0.6],
            [-0.6, -0.8],
        ].forEach(function (from) {
            var cdy = widget(
                [
                    P("M", 0, 0),
                    P("R", 1, 0),
                    // through R, also when R is perturbed
                    { name: "c", type: "CircleMP", args: ["M", "R"] },
                    { name: "Q", type: "PointOnCircle", args: ["c"], pos: [from[0], from[1], 1] },
                    { name: "l", type: "Join", args: ["Q", "R"] },
                ],
                true
            );
            cdy.evalcs("Q.xy=(1,0)");
            var l = cdy.evalcs("l.homog");
            isUndefined(l).should.equal(false, "from " + from);
            // the tangent at R
            projectiveDistance(l, List.realVector([1, 0, -1])).should.be.below(
                1e-6,
                "from " + from + ": " + niceprint(l)
            );
        });
    });
});

describe("nsa: Pappus at degenerate positions", function () {
    // A, B, C on g and D, E, F on h, both through O; X = AE.BD, Y = AF.CD,
    // Z = BF.CE are collinear, p = XZ.
    function PL(name, line, x, y) {
        return { name: name, type: "PointOnLine", args: [line], pos: [x, y, 1] };
    }
    function J(name, p, q) {
        return { name: name, type: "Join", args: [p, q] };
    }
    function M(name, l, m) {
        return { name: name, type: "Meet", args: [l, m] };
    }
    var geometry = [
        P("O", 4, 1),
        P("G", -8, -2),
        P("H", -8, 7),
        J("g", "O", "G"),
        J("h", "O", "H"),
        PL("A", "g", -6, -1.5),
        PL("B", "g", -3, -0.75),
        PL("C", "g", 0, 0),
        PL("D", "h", -6, 6),
        PL("E", "h", -3, 4.5),
        PL("F", "h", 0, 3),
        J("ae", "A", "E"),
        J("bd", "B", "D"),
        J("af", "A", "F"),
        J("cd", "C", "D"),
        J("bf", "B", "F"),
        J("ce", "C", "E"),
        M("X", "ae", "bd"),
        M("Y", "af", "cd"),
        M("Z", "bf", "ce"),
        J("p", "X", "Z"),
    ];

    function incidence(cdy, point, line) {
        var x = cdy.evalcs(point + ".homog");
        var l = cdy.evalcs(line + ".homog");
        return CSNumber.abs(List.scalproduct(x, l)).value.real / (List.abs(x).value.real * List.abs(l).value.real);
    }

    [
        ["B.xy=O.xy"],
        ["B.xy=O.xy", "E.xy=O.xy"],
        ["G.xy=H.xy"],
        // X = Z = E during the whole move of F: the join of the two, computed
        // from standard values that coincide up to rounding, is noise, not the
        // limit (which is CE)
        ["B.xy=O.xy", "F.xy=O.xy"],
    ].forEach(function (moves) {
        it(moves.join(", ") + ": Y lies on p", function () {
            var cdy = widget(geometry, true);
            moves.forEach(function (m) {
                cdy.evalcs(m);
            });
            isUndefined(cdy.evalcs("p.homog")).should.equal(false);
            incidence(cdy, "Y", "p").should.be.below(1e-12);
            incidence(cdy, "X", "p").should.be.below(1e-12);
        });
    });

    it("D.xy=E.xy, A.xy=B.xy: p undefined", function () {
        // AE and BD both become AD, and where X lies on it depends on how the
        // two coincidences are approached, independently of each other
        var cdy = widget(geometry, true);
        cdy.evalcs("D.xy=E.xy");
        cdy.evalcs("A.xy=B.xy");
        isUndefined(cdy.evalcs("p.homog")).should.equal(true);
    });

    it("B dragged onto O, then E dragged along h: Y stays on p", function () {
        // B ends up on O only up to rounding, so the targets of E's moves
        // differ from their origins by rounding in some coordinates
        var cdy = widget(geometry, true);
        var i, t;
        for (i = 1; i <= 24; i++) {
            t = i / 24;
            cdy.evalcs("B.xy=(" + (-3 + 7 * t) + "," + (-0.75 + 1.75 * t) + ")");
        }
        for (i = 1; i <= 24; i++) {
            t = i / 24;
            cdy.evalcs("E.xy=(" + (-3 + 7 * t) + "," + (4.5 - 3.5 * t) + ")");
            isUndefined(cdy.evalcs("p.homog")).should.equal(false);
            incidence(cdy, "Y", "p").should.be.below(1e-12);
        }
    });

    it("off the grid: B dragged onto O, then E dragged along h: Y stays on p", function () {
        // no coordinate is exact in binary: the points are on their lines only
        // up to rounding, and so X - Z is rounding noise at standard order
        var G = [-8, -2];
        var H = [-8, 7];
        var at = function (name, line, Q, f) {
            return PL(name, line, Q[0] * f, Q[1] * f);
        };
        var cdy = widget(
            [P("O", 0, 0), P("G", G[0], G[1]), P("H", H[0], H[1])].concat(
                [J("g", "O", "G"), J("h", "O", "H")],
                [at("A", "g", G, 0.3), at("B", "g", G, 0.5), at("C", "g", G, 0.7)],
                [at("D", "h", H, 0.3), at("E", "h", H, 0.5), at("F", "h", H, 0.7)],
                geometry.slice(11)
            ),
            true
        );
        var i, t;
        for (i = 1; i <= 24; i++) {
            t = 1 - i / 24;
            cdy.evalcs("B.xy=(" + G[0] * 0.5 * t + "," + G[1] * 0.5 * t + ")");
        }
        for (i = 1; i <= 12; i++) {
            t = 0.5 * (1 - i / 30);
            cdy.evalcs("E.xy=(" + H[0] * t + "," + H[1] * t + ")");
            isUndefined(cdy.evalcs("p.homog")).should.equal(false);
            incidence(cdy, "Y", "p").should.be.below(1e-12);
        }
    });
});

describe("nsa: curves through coinciding input", function () {
    // The given points lie on the limit; without nsa the curves are rounding
    // noise (or undefined).
    function J(name, p, q) {
        return { name: name, type: "Join", args: [p, q] };
    }
    function conics(type, args) {
        return [
            { name: "S", type: type, args: args },
            { name: "X", type: "SelectConic", args: ["S"], index: 1 },
            { name: "Y", type: "SelectConic", args: ["S"], index: 2 },
        ];
    }
    function incidence(cdy, point, curve) {
        var x = cdy.evalcs(point + ".homog");
        var M = cdy.evalcs(curve + ".matrix");
        if (M.ctype !== "list") {
            var l = cdy.evalcs(curve + ".homog");
            return CSNumber.abs(List.scalproduct(x, l)).value.real / (List.abs(x).value.real * List.abs(l).value.real);
        }
        var v = List.scalproduct(x, List.productMV(M, x));
        return CSNumber.abs(v).value.real / (List.abs2(x).value.real * List.abs(M).value.real);
    }

    [
        {
            name: "arc through three points, B onto A along a line",
            geometry: [
                { name: "g", type: "FreeLine", pos: [0.1, 1, -0.31] },
                L("A", "g", 0.1, 0.3),
                L("B", "g", 1.1, 0.2),
                P("C", 0.4, 1.7),
                { name: "k", type: "ArcBy3", args: ["A", "B", "C"] },
            ],
            moves: ["B.xy=(0.6,0.3)", "B.xy=A.xy"],
            curves: ["k"],
            points: ["A", "C"],
        },
        {
            name: "segment, B onto A along a line",
            geometry: [
                { name: "g", type: "FreeLine", pos: [0.1, 1, -0.31] },
                L("A", "g", 0.1, 0.3),
                L("B", "g", 1.1, 0.2),
                { name: "s", type: "Segment", args: ["A", "B"] },
            ],
            moves: ["B.xy=(0.6,0.3)", "B.xy=A.xy"],
            curves: ["s"],
            points: ["A"],
        },
        {
            name: "conics through a point, tangent to four lines, two of them coinciding",
            geometry: [
                P("Q", 0.2, 0.3),
                P("A", -1.1, -1),
                P("B", 1.3, -0.9),
                P("C", 1.2, 1.4),
                P("D", -0.9, 1.1),
                P("E", 0.1, 2.3),
                J("a", "A", "B"),
                J("b", "B", "C"),
                J("c", "C", "D"),
                J("e", "D", "E"),
            ].concat(conics("ConicBy1p4l", ["Q", "a", "b", "c", "e"])),
            moves: ["E.xy=(0.9,1.3)", "E.xy=C.xy"],
            curves: ["X", "Y"],
            points: ["Q"],
        },
        {
            name: "conics with pole and polar through two coinciding points",
            geometry: [
                P("A", 0.1, 3.1),
                P("A1", 1.2, 2.1),
                { name: "a", type: "HorizontalLine", pos: [0, 1, 0] },
                P("B", 1.1, 0.1),
                P("C", -1.1, 1.2),
                J("d", "A1", "C"),
            ].concat(conics("ConicBy1Pol2P1L", ["A", "a", "B", "C", "d"])),
            moves: ["C.xy=(0.3,0.7)", "C.xy=B.xy"],
            curves: ["X", "Y"],
            points: ["B"],
        },
        {
            // d turns about D1 on c until it coincides with c
            name: "conics with pole and polar tangent to two coinciding lines",
            geometry: [
                P("A", 0.1, 2.1),
                { name: "a", type: "HorizontalLine", pos: [0, 1, 0] },
                P("B", 1.6, 1.1),
                P("C1", -2.1, -3.1),
                P("C2", 2.2, -2.9),
                J("c", "C1", "C2"),
                L("D1", "c", -1.1, -3.05),
                P("D2", 4.2, -3.2),
                J("d", "D1", "D2"),
            ].concat(conics("ConicBy1Pol1P2L", ["A", "a", "B", "c", "d"])),
            moves: ["D2.xy=(2.3,-2.5)", "D2.xy=C2.xy"],
            curves: ["X", "Y"],
            points: ["B"],
        },
    ].forEach(function (c) {
        it(c.name, function () {
            var cdy = widget(c.geometry, true);
            c.moves.forEach(function (m) {
                cdy.evalcs(m);
            });
            c.curves.forEach(function (k) {
                var m = cdy.evalcs(k + ".matrix");
                isUndefined(m.ctype === "list" ? m : cdy.evalcs(k + ".homog")).should.equal(false, k);
                c.points.forEach(function (p) {
                    incidence(cdy, p, k).should.be.below(1e-9, p + " on " + k);
                });
            });
        });
    });
});

describe("nsa: circle through two coinciding points, off the grid", function () {
    // With coordinates that are not exact in binary, the circle through A,
    // B = A and C is rounding noise without nsa, not even through A. With nsa
    // it is the limit: through A and C, tangent at A to the line that A and B
    // are bound to (horizontal here).
    var geometry = [
        { name: "g", type: "FreeLine", pos: [0, 1, -0.3] },
        L("A", "g", 0.1, 0.3),
        L("B", "g", 2.1, 0.3),
        P("C", 3.1, -1.7),
        { name: "k", type: "CircleBy3", args: ["A", "B", "C"] },
    ];

    function onCircle(cdy, point) {
        var x = cdy.evalcs(point + ".homog");
        var M = cdy.evalcs("k.matrix");
        var v = List.scalproduct(x, List.productMV(M, x));
        return CSNumber.abs(v).value.real / (List.abs2(x).value.real * List.abs(M).value.real);
    }

    it("is the limit along the approach", function () {
        var cdy = widget(geometry, true);
        cdy.evalcs("B.xy=(1.1,0.3)");
        cdy.evalcs("B.xy=A.xy");
        isUndefined(cdy.evalcs("k.matrix")).should.equal(false);
        onCircle(cdy, "A").should.be.below(1e-12);
        onCircle(cdy, "C").should.be.below(1e-12);
        // the tangent at A, M A, is horizontal: its x component vanishes
        var t = List.productMV(cdy.evalcs("k.matrix"), cdy.evalcs("A.homog"));
        (CSNumber.abs(t.value[0]).value.real / List.abs(t).value.real).should.be.below(1e-9);
    });
});

describe("nsa: join of two coinciding points on a moving circle", function () {
    // B is moved onto A on the circle k, then the center moves, and A and B
    // with it. Their join is the tangent at A. Intersecting the diameter
    // through A and B with k, in the evaluation with infinitesimals, must
    // divide by the largest coordinate of the diameter (List.maxIndex on
    // series), not by one that is infinitesimal: with the center moved by
    // (0, 1), that loses enough digits for the samples to disagree.
    var geometry = [
        P("O", 0, 0),
        { name: "k", type: "CircleMr", args: ["O"], radius: 5 },
        { name: "A", type: "PointOnCircle", args: ["k"], pos: [5, 0, 1] },
        { name: "B", type: "PointOnCircle", args: ["k"], pos: [3, 4, 1] },
        { name: "ab", type: "Join", args: ["A", "B"] },
    ];

    [
        [0, 1],
        [1, 1],
        [1, 0],
    ].forEach(function (d) {
        it("is the tangent at A after moving the center by (" + d + ")", function () {
            var cdy = widget(geometry, true);
            cdy.evalcs("B.xy=A.xy");
            cdy.evalcs("O.xy=O.xy+(" + d + ")");
            // the vertical line x = 5 + d[0]
            var l = cdy.evalcs("ab.homog").value.map((z) => z.value.real);
            Math.abs(l[1] / l[0]).should.be.below(1e-9);
            Math.abs(l[2] / l[0] + 5 + d[0]).should.be.below(1e-9);
        });
    });

    // Off the origin, B moved onto A = (4, 0) by a script coincides with A
    // only up to rounding (A carries some 1e-16 in its y coordinate, B not):
    // along the path of B, the standard part of the join is that rounding
    // noise, which must not hide the tangent 4x + 3y = 16.
    it("is the tangent at A after moving B onto it, off the origin", function () {
        var cdy = widget(
            [
                P("O", 0, -3),
                { name: "k", type: "CircleMr", args: ["O"], radius: 5 },
                { name: "A", type: "PointOnCircle", args: ["k"], pos: [4, 0, 1] },
                { name: "B", type: "PointOnCircle", args: ["k"], pos: [3, 1, 1] },
                { name: "ab", type: "Join", args: ["A", "B"] },
            ],
            true
        );
        cdy.evalcs("B.xy=A.xy");
        var l = cdy.evalcs("ab.homog").value.map((z) => z.value.real);
        Math.abs(l[1] / l[0] - 3 / 4).should.be.below(1e-9);
        Math.abs(l[2] / l[0] + 4).should.be.below(1e-9);
    });

    // B dragged onto A with the mouse lands there up to rounding only, e.g. at
    // (5, 1e-12): the coordinates of the diameter through B are not exactly
    // zero then, but all but zero, which must not be taken for the largest.
    ["-7.3e-16", "1e-12"].forEach(function (y) {
        it("is the tangent at A with B at (5, " + y + ")", function () {
            var cdy = widget(geometry, true);
            cdy.evalcs("B.xy=(4.9,0.5)");
            cdy.evalcs("B.xy=(5," + y + ")");
            var l = cdy.evalcs("ab.homog").value.map((z) => z.value.real);
            Math.abs(l[1] / l[0]).should.be.below(1e-9);
            Math.abs(l[2] / l[0] + 5).should.be.below(1e-9);
        });
    });
});

describe("nsa: conics by four points and a line, two points coinciding", function () {
    // D is moved onto C, then A moves: all the while the conics are only
    // determined as limits. The evaluation along A's move must not take the
    // rounding noise of D = C (both standard) for a limit: whatever is shown
    // passes through A, B, C. With D = C, tracing refines the noise of the
    // undetermined conics up to its limit, as it does without nsa: slow, and
    // it logs every time.
    this.timeout(60000);
    var geometry = [
        P("A", -1.1, 0.3),
        P("B", 1.3, 0.7),
        P("C", 0.1, 2.3),
        P("D", 0.9, -1.3),
        P("L1", -2.1, -2.3),
        P("L2", 2.3, -1.9),
        { name: "l", type: "Join", args: ["L1", "L2"] },
        { name: "S", type: "ConicBy4p1l", args: ["A", "B", "C", "D", "l"] },
        { name: "X", type: "SelectConic", args: ["S"], index: 1 },
        { name: "Y", type: "SelectConic", args: ["S"], index: 2 },
    ];

    function onConic(cdy, point, conic) {
        var x = cdy.evalcs(point + ".homog");
        var M = cdy.evalcs(conic + ".matrix");
        var v = List.scalproduct(x, List.productMV(M, x));
        return CSNumber.abs(v).value.real / (List.abs2(x).value.real * List.abs(M).value.real);
    }

    it("shows limits through the given points, or nothing", function () {
        var cdy = widget(geometry, true);
        var log = console.log;
        console.log = function () {};
        try {
            cdy.evalcs("D.xy=(0.5,0.5)");
            cdy.evalcs("D.xy=C.xy");
            cdy.evalcs("A.xy=(-1.3,0.2)");
            cdy.evalcs("A.xy=(-1.5,-0.1)");
        } finally {
            console.log = log;
        }
        ["X", "Y"].forEach(function (k) {
            if (isUndefined(cdy.evalcs(k + ".matrix"))) return;
            ["A", "B", "C"].forEach(function (p) {
                onConic(cdy, p, k).should.be.below(1e-9, p + " on " + k);
            });
        });
    });
});

// The shipped build is compiled by the Closure Compiler at ADVANCED level,
// may rename or inline what the plain build keeps. Only available after
// `node make closure`, as in `node make tests`.
describe("nsa: free conics", function () {
    // E and F are pinned to the polars of A and B with respect to the free
    // conic K, and E is moved onto F along its polar by a script. Only K can
    // be perturbed: that moves the polars, and with them E and F, apart in
    // directions that depend on the perturbation, so their join has no limit.
    // (Were K not perturbed, nothing could be, and the path would decide:
    // the polar of A.)
    var geometry = [
        {
            name: "K",
            type: "FreeConic",
            pos: { xx: 1, xy: 0, yy: 1, xz: 0, yz: 0, zz: -4 },
        },
        Object.assign(P("A", 1, 3), { pinned: true }),
        Object.assign(P("B", 3, 1), { pinned: true }),
        { name: "a", type: "PolarOfPoint", args: ["A", "K"] },
        { name: "b", type: "PolarOfPoint", args: ["B", "K"] },
        Object.assign(L("E", "a", 4, 0), { pinned: true }),
        Object.assign(L("F", "b", 1, 1), { pinned: true }),
        { name: "X", type: "Join", args: ["E", "F"] },
    ];

    it("are perturbed as well", function () {
        var cdy = widget(geometry, true);
        // a: x + 3y = 4, b: 3x + y = 4, meeting in (1, 1)
        cdy.evalcs("E.xy=(1,1)");
        isUndefined(cdy.evalcs("X.homog")).should.equal(true, niceprint(cdy.evalcs("X.homog")));
    });

    it("unless pinned", function () {
        var pinned = JSON.parse(JSON.stringify(geometry));
        pinned[0].pinned = true;
        var cdy = widget(pinned, true);
        cdy.evalcs("E.xy=(1,1)");
        projectiveDistance(cdy.evalcs("X.homog"), List.realVector([1, 3, -4])).should.be.below(1e-9);
    });
});

describe("nsa: Closure-compiled build", function () {
    var closurePath = require("path").join(__dirname, "../build/js/Cindy.closure.js");
    var CindyJSClosure = require("fs").existsSync(closurePath) ? require(closurePath) : null;

    before(function () {
        if (!CindyJSClosure) this.skip();
    });

    cases.forEach(function (c) {
        it(c.name, function () {
            var cdy = CindyJSClosure({
                isNode: true,
                csconsole: false,
                nsa: true,
                geometry: JSON.parse(JSON.stringify(c.geometry)),
            });
            (c.setup || []).forEach(function (s) {
                cdy.evalcs(s);
            });
            cdy.evalcs(c.mover + ".xy=(" + c.from + ")");
            cdy.evalcs(c.mover + ".xy=(" + c.to + ")");
            var limit = cdy.evalcs(c.target);
            isUndefined(limit).should.equal(false, "resolved: " + niceprint(limit));
            var plain = evaluateAt(c, true, c.to);
            projectiveDistance(limit, plain).should.be.below(1e-12, niceprint(limit) + " vs " + niceprint(plain));
            hasSeries(cdy.evalcs("apply(allelements(), [#.homog, #.matrix, #.radius])")).should.equal(false);
        });
    });
});
