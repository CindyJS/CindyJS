// Random constructions and moves for tests/Tracing_random_golden_tests.js,
// generated deterministically from a seed: about 35 operation types (all
// tracers included) on integer grids, so that coincidences are frequent.

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
            C = [],
            movers = [];
        let n = 0;
        const nm = (p) => p + n++;
        const grid = () => [ri(-3, 3), ri(-3, 3)];
        const nfree = ri(3, 6);
        for (let i = 0; i < nfree; i++) {
            const name = nm("P");
            g.push({ name, type: "Free", pos: rnd() < 0.7 ? grid() : [rnd() * 6 - 3, rnd() * 6 - 3] });
            P.push(name);
            movers.push([name, "pt"]);
        }
        const nops = ri(4, 14);
        for (let i = 0; i < nops; i++) {
            const r = rnd();
            let name;
            const t = pick([
                "Join",
                "Join",
                "Meet",
                "Segment",
                "Mid",
                "Para",
                "Perp",
                "CircleMP",
                "CircleMr",
                "CircleBy3",
                "ConicBy5",
                "IntersectLC",
                "IntersectCirCir",
                "IntersectConicConic",
                "PointOnLine",
                "PointOnCircle",
                "PointOnSegment",
                "AngleBisector",
                "ConicBy3p2l",
                "ConicBy2p3l",
                "ConicBy4p1l",
                "ConicBy1p4l",
                "ConicBy1Pol2P1L",
                "ConicBy1Pol1P2L",
                "PolarOfPoint",
                "PolarOfLine",
                "CenterOfConic",
                "Through",
                "HorizontalLine",
                "VerticalLine",
                "FreeLine",
                "Angle",
                "ArcBy3",
                "ConicBy2Foci1P",
                "Compass",
                "Free",
            ]);
            const need = { P: (k) => P.length >= k, L: (k) => L.length >= k, C: (k) => C.length >= k };
            const ps = (k) => {
                const a = [];
                for (let j = 0; j < k; j++) a.push(pick(P));
                return a;
            };
            const ls = (k) => {
                const a = [];
                for (let j = 0; j < k; j++) a.push(pick(L));
                return a;
            };
            const selset = (setname, cnt, kindArr, selType) => {
                const idx = ri(1, cnt);
                const s = nm("X");
                g.push({ name: s, type: selType, args: [setname], index: idx });
                kindArr.push(s);
            };
            switch (t) {
                case "Join":
                case "Segment":
                case "Mid":
                case "CircleMP":
                    name = nm(t[0]);
                    g.push({ name, type: t, args: ps(2) });
                    (t === "Mid" ? P : t === "CircleMP" ? C : L).push(name);
                    break;
                case "Meet":
                    if (!need.L(2)) break;
                    name = nm("M");
                    g.push({ name, type: t, args: ls(2) });
                    P.push(name);
                    break;
                case "Para":
                case "Perp":
                    if (!need.L(1)) break;
                    name = nm("L");
                    g.push({ name, type: t, args: [pick(L), pick(P)] });
                    L.push(name);
                    break;
                case "CircleMr":
                    name = nm("C");
                    g.push({ name, type: t, args: [pick(P)], radius: ri(1, 3) });
                    C.push(name);
                    movers.push([name, "radius"]);
                    break;
                case "CircleBy3":
                case "ArcBy3":
                case "Compass":
                    name = nm("C");
                    g.push({ name, type: t, args: ps(3) });
                    C.push(name);
                    if (t === "ArcBy3" && rnd() < 0.7) {
                        const q = nm("Q");
                        g.push({ name: q, type: "PointOnArc", args: [name], pos: [rnd(), rnd(), 1] });
                        P.push(q);
                        movers.push([q, "pt"]);
                    }
                    break;
                case "ConicBy5":
                    name = nm("C");
                    g.push({ name, type: t, args: ps(5) });
                    C.push(name);
                    break;
                case "IntersectLC":
                    if (!need.L(1) || !need.C(1)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [pick(L), pick(C)] });
                    selset(name, 2, P, "SelectP");
                    break;
                case "IntersectCirCir":
                case "IntersectConicConic":
                    if (!need.C(2)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [pick(C), pick(C)] });
                    selset(name, t === "IntersectCirCir" ? 2 : 4, P, "SelectP");
                    if (rnd() < 0.5) selset(name, t === "IntersectCirCir" ? 2 : 4, P, "SelectP");
                    break;
                case "PointOnLine":
                    if (!need.L(1)) break;
                    name = nm("Q");
                    g.push({ name, type: t, args: [pick(L)], pos: [rnd() * 4 - 2, rnd() * 4 - 2, 1] });
                    P.push(name);
                    movers.push([name, "pt"]);
                    break;
                case "PointOnCircle":
                    if (!need.C(1)) break;
                    {
                        const c = pick(C);
                        const e = g.find((x) => x.name === c);
                        if (!["CircleMP", "CircleMr", "CircleBy3", "Compass"].includes(e.type)) break;
                        name = nm("Q");
                        g.push({ name, type: t, args: [c], pos: [rnd() * 4 - 2, rnd() * 4 - 2, 1] });
                        P.push(name);
                        movers.push([name, "pt"]);
                    }
                    break;
                case "PointOnSegment":
                    {
                        const s = g.filter((x) => x.type === "Segment");
                        if (!s.length) break;
                        name = nm("Q");
                        g.push({ name, type: t, args: [pick(s).name], pos: [0, 0, 1] });
                        P.push(name);
                        movers.push([name, "pt"]);
                    }
                    break;
                case "AngleBisector":
                    if (!need.L(2)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [...ls(2), pick(P)] });
                    selset(name, 2, L, "SelectL");
                    break;
                case "ConicBy3p2l":
                    if (!need.L(2)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [...ps(3), ...ls(2)] });
                    selset(name, 4, C, "SelectConic");
                    break;
                case "ConicBy2p3l":
                    if (!need.L(3)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [...ps(2), ...ls(3)] });
                    selset(name, 4, C, "SelectConic");
                    break;
                case "ConicBy4p1l":
                    if (!need.L(1)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [...ps(4), pick(L)] });
                    selset(name, 2, C, "SelectConic");
                    break;
                case "ConicBy1p4l":
                    if (!need.L(4)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [pick(P), ...ls(4)] });
                    selset(name, 2, C, "SelectConic");
                    break;
                case "ConicBy1Pol2P1L":
                    if (!need.L(2)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [pick(P), pick(L), pick(P), pick(P), pick(L)] });
                    selset(name, 2, C, "SelectConic");
                    break;
                case "ConicBy1Pol1P2L":
                    if (!need.L(3)) break;
                    name = nm("S");
                    g.push({ name, type: t, args: [pick(P), pick(L), pick(P), pick(L), pick(L)] });
                    selset(name, 2, C, "SelectConic");
                    break;
                case "ConicBy2Foci1P":
                    name = nm("S");
                    g.push({ name, type: t, args: ps(3) });
                    selset(name, 2, C, "SelectConic");
                    break;
                case "PolarOfPoint":
                    if (!need.C(1)) break;
                    name = nm("L");
                    g.push({ name, type: t, args: [pick(P), pick(C)] });
                    L.push(name);
                    break;
                case "PolarOfLine":
                    if (!need.C(1) || !need.L(1)) break;
                    name = nm("M");
                    g.push({ name, type: t, args: [pick(L), pick(C)] });
                    P.push(name);
                    break;
                case "CenterOfConic":
                    if (!need.C(1)) break;
                    name = nm("M");
                    g.push({ name, type: t, args: [pick(C)] });
                    P.push(name);
                    break;
                case "Through":
                    name = nm("L");
                    g.push({ name, type: t, args: [pick(P)], pos: [rnd(), rnd(), 0] });
                    L.push(name);
                    movers.push([name, "slope"]);
                    break;
                case "HorizontalLine":
                case "VerticalLine":
                    name = nm("L");
                    g.push({ name, type: t, args: [], pos: [0, 0, 1] });
                    L.push(name);
                    break;
                case "FreeLine":
                    name = nm("L");
                    g.push({ name, type: t, args: [], pos: [rnd(), rnd(), rnd()] });
                    L.push(name);
                    movers.push([name, "homog"]);
                    break;
                case "Angle":
                    if (!need.L(2)) break;
                    name = nm("A");
                    g.push({ name, type: t, args: [...ls(2), pick(P)] });
                    break;
                case "Free":
                    name = nm("P");
                    g.push({ name, type: "Free", pos: grid() });
                    P.push(name);
                    movers.push([name, "pt"]);
                    break;
            }
        }
        const moves = [];
        const nm2 = ri(10, 40);
        for (let i = 0; i < nm2; i++) {
            const [m, kind] = pick(movers);
            if (kind === "pt") {
                const r = rnd();
                if (r < 0.15) {
                    moves.push(m + ".xy=" + pick(P) + ".xy");
                } else if (r < 0.6) {
                    const [x, y] = [ri(-3, 3), ri(-3, 3)];
                    moves.push(m + ".xy=(" + x + "," + y + ")");
                } else {
                    moves.push(m + ".xy=(" + (rnd() * 6 - 3) + "," + (rnd() * 6 - 3) + ")");
                }
                // small drags
                if (rnd() < 0.3) {
                    for (let s = 0; s < 5; s++)
                        moves.push(m + ".xy=" + m + ".xy+(" + (rnd() * 0.4 - 0.2) + "," + (rnd() * 0.4 - 0.2) + ")");
                }
            } else if (kind === "radius")
                moves.push(m + ".radius=" + (rnd() < 0.2 ? 0 : ri(0, 4) + (rnd() < 0.5 ? 0 : rnd())));
            else if (kind === "slope") moves.push(m + ".slope=" + (ri(-2, 2) + (rnd() < 0.5 ? 0 : rnd())));
            else moves.push(m + ".homog=[" + [rnd() - 0.5, rnd() - 0.5, ri(-2, 2)].join(",") + "]");
        }
        return { geometry: g, moves };
    }
    const out = [];
    for (let i = 0; i < count; i++) out.push(gen());
    return out;
};
