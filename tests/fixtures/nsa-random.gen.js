// Random constructions and moves for tests/Nsa_stress_tests.js, generated
// deterministically from a seed: points bound to common lines and circles
// that are moved onto each other along them, so that most degenerate
// positions are removable singularities, with joins, meets, circles and
// intersections built on them.

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
        // per carrier (line or circle), the points bound to it
        const on = {};
        const free = [];
        let n = 0;
        const nm = (p) => p + n++;
        const grid = () => [ri(-3, 3), ri(-3, 3)];

        const nlines = ri(1, 2);
        for (let i = 0; i < nlines; i++) {
            const [a, b] = [grid(), grid()];
            if (a[0] === b[0] && a[1] === b[1]) b[0] += 1;
            const name = nm("g");
            const pos = [a[1] - b[1], b[0] - a[0], a[0] * b[1] - a[1] * b[0]];
            g.push({ name, type: "FreeLine", pos });
            L.push(name);
            on[name] = [];
            for (let k = ri(2, 3); k > 0; k--) {
                const t = ri(-2, 2);
                const p = nm("E");
                g.push({
                    name: p,
                    type: "PointOnLine",
                    args: [name],
                    pos: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), 1],
                });
                P.push(p);
                on[name].push(p);
            }
        }
        const ncircles = ri(0, 1);
        for (let i = 0; i < ncircles; i++) {
            const m = nm("M");
            const center = grid();
            g.push({ name: m, type: "Free", pos: center });
            P.push(m);
            free.push(m);
            const name = nm("c");
            g.push({ name, type: "CircleMr", args: [m], radius: ri(1, 3) });
            C.push(name);
            on[name] = [];
            for (let k = ri(2, 3); k > 0; k--) {
                const p = nm("K");
                const phi = rnd() * 2 * Math.PI;
                g.push({
                    name: p,
                    type: "PointOnCircle",
                    args: [name],
                    pos: [center[0] + Math.cos(phi), center[1] + Math.sin(phi), 1],
                });
                P.push(p);
                on[name].push(p);
            }
        }
        for (let k = ri(1, 2); k > 0; k--) {
            const p = nm("P");
            g.push({ name: p, type: "Free", pos: grid() });
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
                "Para",
                "CircleMP",
                "CircleBy3",
                "IntersectLC",
                "IntersectCirCir",
            ]);
            let name;
            switch (t) {
                case "Join":
                case "Mid":
                case "CircleMP":
                    if (P.length < 2) break;
                    name = nm(t === "Join" ? "l" : t === "Mid" ? "D" : "k");
                    g.push({ name, type: t, args: [pick(P), pick(P)] });
                    (t === "Join" ? L : t === "Mid" ? P : C).push(name);
                    break;
                case "Meet":
                    if (L.length < 2) break;
                    name = nm("X");
                    g.push({ name, type: t, args: [pick(L), pick(L)] });
                    P.push(name);
                    break;
                case "Perp":
                case "Para":
                    name = nm("h");
                    g.push({ name, type: t, args: [pick(L), pick(P)] });
                    L.push(name);
                    break;
                case "CircleBy3":
                    if (P.length < 3) break;
                    name = nm("k");
                    g.push({ name, type: t, args: [pick(P), pick(P), pick(P)] });
                    C.push(name);
                    break;
                case "IntersectLC":
                case "IntersectCirCir": {
                    if (!C.length || (t === "IntersectCirCir" && C.length < 2)) break;
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

        // moves: mostly a bound point onto another one on the same carrier
        const carriers = Object.keys(on).filter((c) => on[c].length >= 2);
        const moves = [];
        for (let k = ri(12, 24); k > 0; k--) {
            const r = rnd();
            if (r < 0.55 && carriers.length) {
                const c = pick(carriers);
                const a = pick(on[c]);
                const b = pick(on[c].filter((x) => x !== a));
                moves.push(a + ".xy=" + b + ".xy");
            } else if (r < 0.8) {
                const c = pick(Object.keys(on));
                const [x, y] = grid();
                moves.push(pick(on[c]) + ".xy=(" + (x + rnd() * 0.5) + "," + (y + rnd() * 0.5) + ")");
            } else {
                const [x, y] = grid();
                moves.push(pick(free) + ".xy=(" + x + "," + y + ")");
            }
        }
        return { geometry: g, moves };
    }
    const out = [];
    for (let i = 0; i < count; i++) out.push(gen());
    return out;
};
