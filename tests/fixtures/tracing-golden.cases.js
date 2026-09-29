// Constructions and moves for tests/Tracing_golden_tests.js. The expected
// coordinates in tracing-golden.json were recorded with the build before the
// non-standard analysis (nsa) work; see the test for how to regenerate them.

function P(name, x, y) {
    return { name: name, type: "Free", pos: [x, y] };
}

// moves of `name` through the given positions, in small steps like a drag
function drag(name, points, steps) {
    var moves = [];
    for (var k = 1; k < points.length; k++) {
        var a = points[k - 1];
        var b = points[k];
        for (var s = 1; s <= steps; s++) {
            var x = a[0] + ((b[0] - a[0]) * s) / steps;
            var y = a[1] + ((b[1] - a[1]) * s) / steps;
            moves.push(name + ".xy=(" + x + "," + y + ")");
        }
    }
    return moves;
}

module.exports = [
    {
        name: "circle intersections through tangency and complex",
        degenerate: false,
        geometry: [
            P("A", -2, 0),
            P("B", 2, 0),
            { name: "C0", type: "CircleMr", args: ["A"], radius: 3 },
            { name: "C1", type: "CircleMr", args: ["B"], radius: 3 },
            { name: "Ps", type: "IntersectCirCir", args: ["C0", "C1"] },
            { name: "X", type: "SelectP", args: ["Ps"], index: 1 },
            { name: "Y", type: "SelectP", args: ["Ps"], index: 2 },
            { name: "r", type: "Join", args: ["X", "Y"] },
        ],
        moves: drag(
            "B",
            [
                [2, 0],
                [4, 0],
                [6, 0],
                [4.5, 2],
                [0, 5],
                [-3, 1],
                [2, 0],
            ],
            7
        ),
    },
    {
        name: "points on moving line, circle and segment",
        degenerate: false,
        geometry: [
            P("A", 0, 0),
            P("B", 3, 1),
            P("M", 1, 1),
            P("R", 3, 2),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "c", type: "CircleMP", args: ["M", "R"] },
            { name: "s", type: "Segment", args: ["A", "B"] },
            { name: "PL", type: "PointOnLine", args: ["l"], pos: [1, 0.33, 1] },
            { name: "PC", type: "PointOnCircle", args: ["c"], pos: [3, 2, 1] },
            { name: "PS", type: "PointOnSegment", args: ["s"], pos: [1.5, 0.5, 1] },
            { name: "Is", type: "IntersectLC", args: ["l", "c"] },
            { name: "X", type: "SelectP", args: ["Is"], index: 1 },
            { name: "m", type: "Join", args: ["PL", "PC"] },
        ],
        moves: drag(
            "B",
            [
                [3, 1],
                [1, 4],
                [-2, 2],
                [-3, -2],
                [3, 1],
            ],
            8
        )
            .concat(
                drag(
                    "M",
                    [
                        [1, 1],
                        [4, -1],
                        [0, 3],
                    ],
                    6
                )
            )
            .concat(["PL.xy=(2,0.66)", "PC.xy=(-1,1)", "PS.xy=(2,0.66)"]),
    },
    {
        name: "conic intersections (tracing4) and conics through points and lines (tracingSesq)",
        degenerate: false,
        geometry: [
            P("A", 0, 0),
            P("B", 2, 0),
            P("C", 3, 2),
            P("D", 1, 3),
            P("E", -1, 2),
            P("M", 1, 1),
            P("R", 3.5, 1),
            P("F", -3, -1),
            P("G", 4, -2),
            P("H", 0, -3),
            { name: "c", type: "ConicBy5", args: ["A", "B", "C", "D", "E"] },
            { name: "k", type: "CircleMP", args: ["M", "R"] },
            { name: "Is", type: "IntersectConicConic", args: ["c", "k"] },
            { name: "X1", type: "SelectP", args: ["Is"], index: 1 },
            { name: "X2", type: "SelectP", args: ["Is"], index: 2 },
            { name: "X3", type: "SelectP", args: ["Is"], index: 3 },
            { name: "X4", type: "SelectP", args: ["Is"], index: 4 },
            { name: "l1", type: "Join", args: ["F", "G"] },
            { name: "l2", type: "Join", args: ["G", "H"] },
            { name: "Cs", type: "ConicBy3p2l", args: ["A", "B", "C", "l1", "l2"] },
            { name: "K1", type: "SelectConic", args: ["Cs"], index: 1 },
            { name: "K2", type: "SelectConic", args: ["Cs"], index: 2 },
        ],
        moves: drag(
            "R",
            [
                [3.5, 1],
                [2, 3],
                [1, 2.2],
                [-1, 1],
                [3.5, 1],
            ],
            8
        ).concat(
            drag(
                "G",
                [
                    [4, -2],
                    [3, -4],
                    [5, 0],
                ],
                6
            )
        ),
    },
    {
        name: "conic tangent to lines (tracing2Conics) and a line through a point",
        degenerate: false,
        geometry: [
            P("P", 0, 0),
            P("A", 3, 0),
            P("B", 0, 3),
            P("Q", 4, 4),
            P("S", -2, 1),
            { name: "p", type: "Join", args: ["A", "B"] },
            { name: "l", type: "Join", args: ["Q", "S"] },
            { name: "Cs", type: "ConicBy1Pol2P1L", args: ["P", "p", "Q", "S", "l"] },
            { name: "K1", type: "SelectConic", args: ["Cs"], index: 1 },
            { name: "K2", type: "SelectConic", args: ["Cs"], index: 2 },
            { name: "t", type: "Through", args: ["P"], pos: [1, 1, 0] },
        ],
        moves: drag(
            "Q",
            [
                [4, 4],
                [5, 1],
                [2, 5],
                [4, 4],
            ],
            8
        ).concat(["t.slope=0.5", "t.slope=-3"]),
    },
    {
        name: "joins and meets passing through degenerate positions",
        degenerate: true,
        geometry: [
            P("A", 0, 0),
            P("B", 1, 1),
            P("C", 3, 0),
            P("D", 3, 5),
            { name: "l", type: "Join", args: ["A", "B"] },
            { name: "m", type: "Join", args: ["C", "D"] },
            { name: "S", type: "Meet", args: ["l", "m"] },
            { name: "n", type: "Perp", args: ["l", "C"] },
        ],
        moves: ["A.xy=(1,0)", "A.xy=(1,1)", "A.xy=(1,2)", "D.xy=(3,1)", "D.xy=(1,1)", "A.xy=(0,0)"],
    },
];
