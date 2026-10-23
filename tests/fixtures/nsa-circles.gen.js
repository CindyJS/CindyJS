// Random constructions and moves for tests/Nsa_stress_tests.js, generated
// deterministically from a seed: points on circles around centers off the
// origin, at grid points of the circle, moved onto each other along it by
// scripts (which leaves them coinciding only up to rounding), and centers
// moving, with joins, meets, circles and conics built on them.

// the grid points on a circle of radius 5 around the origin, by angle
var RING = [
    [5, 0],
    [4, 3],
    [3, 4],
    [0, 5],
    [-3, 4],
    [-4, 3],
    [-5, 0],
    [-4, -3],
    [-3, -4],
    [0, -5],
    [3, -4],
    [4, -3],
];

module.exports = function generate(seed0, count) {
    let seed = seed0;
    function rnd() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    }
    function ri(a, b) {
        return a + Math.floor(rnd() * (b - a + 1));
    }
    function pick(a) {
        return a[Math.floor(rnd() * a.length)];
    }
    function gen() {
        const g = [];
        const P = [],
            L = [],
            C = [];
        // per circle, its center and the points on it
        const centers = {};
        const on = {};
        const free = [];
        let n = 0;
        const nm = (p) => p + n++;

        const ncircles = ri(1, 2);
        for (let i = 0; i < ncircles; i++) {
            const m = nm("M");
            const center = [ri(-3, 3), ri(-3, 3)];
            if (center[0] === 0 && center[1] === 0) center[1] = -2;
            g.push({ name: m, type: "Free", pos: center });
            free.push(m);
            const name = nm("c");
            g.push({ name, type: "CircleMr", args: [m], radius: 5 });
            C.push(name);
            centers[name] = m;
            on[name] = [];
            const spots = RING.slice();
            for (let k = ri(3, 5); k > 0; k--) {
                const [x, y] = spots.splice(Math.floor(rnd() * spots.length), 1)[0];
                const p = nm("K");
                g.push({ name: p, type: "PointOnCircle", args: [name], pos: [center[0] + x, center[1] + y, 1] });
                P.push(p);
                on[name].push(p);
            }
        }
        if (rnd() < 0.5) {
            const p = nm("P");
            g.push({ name: p, type: "Free", pos: [ri(-4, 4), ri(-4, 4)] });
            P.push(p);
            free.push(p);
        }

        const nops = ri(4, 10);
        for (let i = 0; i < nops; i++) {
            const t = pick([
                "Join",
                "Join",
                "Join",
                "Meet",
                "Mid",
                "Perp",
                "CircleBy3",
                "ConicBy5",
                "PolarOfPoint",
                "IntersectLC",
                "IntersectCirCir",
            ]);
            let name;
            switch (t) {
                case "Join":
                case "Mid":
                    name = nm(t === "Join" ? "l" : "D");
                    g.push({ name, type: t, args: [pick(P), pick(P)] });
                    (t === "Join" ? L : P).push(name);
                    break;
                case "Meet":
                    if (L.length < 2) break;
                    name = nm("X");
                    g.push({ name, type: t, args: [pick(L), pick(L)] });
                    P.push(name);
                    break;
                case "Perp":
                    if (!L.length) break;
                    name = nm("h");
                    g.push({ name, type: t, args: [pick(L), pick(P)] });
                    L.push(name);
                    break;
                case "PolarOfPoint":
                    name = nm("h");
                    g.push({ name, type: t, args: [pick(P), pick(C)] });
                    L.push(name);
                    break;
                case "CircleBy3":
                    name = nm("k");
                    g.push({ name, type: t, args: [pick(P), pick(P), pick(P)] });
                    C.push(name);
                    break;
                case "ConicBy5":
                    if (P.length < 5) break;
                    name = nm("q");
                    g.push({ name, type: t, args: [pick(P), pick(P), pick(P), pick(P), pick(P)] });
                    break;
                case "IntersectLC":
                case "IntersectCirCir": {
                    if (t === "IntersectLC" && !L.length) break;
                    if (t === "IntersectCirCir" && C.length < 2) break;
                    const s = nm("S");
                    g.push({ name: s, type: t, args: t === "IntersectLC" ? [pick(L), pick(C)] : [pick(C), pick(C)] });
                    for (const index of [1, 2]) {
                        name = nm("Y");
                        g.push({ name, type: "SelectP", args: [s], index });
                        P.push(name);
                    }
                    break;
                }
            }
        }

        // moves: mostly a point onto another one on the same circle
        const circles = Object.keys(on);
        const moves = [];
        for (let k = ri(12, 24); k > 0; k--) {
            const r = rnd();
            const c = pick(circles);
            if (r < 0.6) {
                const a = pick(on[c]);
                const b = pick(on[c].filter((x) => x !== a));
                moves.push(a + ".xy=" + b + ".xy");
            } else if (r < 0.8) {
                const [x, y] = pick(RING);
                moves.push(pick(on[c]) + ".xy=" + centers[c] + ".xy+(" + x + "," + y + ")");
            } else {
                moves.push(pick(free) + ".xy=(" + ri(-3, 3) + "," + ri(-3, 3) + ")");
            }
        }
        return { geometry: g, moves };
    }
    const out = [];
    for (let i = 0; i < count; i++) out.push(gen());
    return out;
};
