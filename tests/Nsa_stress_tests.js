// Random constructions with nsa, checked for what must hold whatever nsa
// computes:
// - no warnings (nsa reports its own failures as warnings) and no
//   Levi-Civita series outside of its evaluation;
// - the incidences that define the elements (a join contains its points, a
//   point on a circle lies on it, ...), as far as they hold without nsa in
//   the same frame;
// - a value that nsa shows where the element is undefined without it is the
//   limit: without nsa, close to the end of the move along its path, the
//   element has almost the same value.
// Three kinds of constructions: those of the tracing golden tests, which
// mostly degenerate in non-removable ways (free points meeting), those of
// fixtures/nsa-random.gen.js, built on points bound to common lines and
// circles, which mostly degenerate in removable ways, and those of
// fixtures/nsa-circles.gen.js, points on circles off the origin moved onto
// each other by scripts, so that they coincide up to rounding only.
//
// The unit tests run one seed of each; `node make nsafuzz` runs more
// (NSA_STRESS_SEEDS, comma separated; NSA_STRESS_TIMEOUT in ms per
// construction).

global.navigator = {};
var expect = require("chai").expect;
var corpora = {
    tracing: require("./fixtures/tracing-random.gen.js"),
    removable: require("./fixtures/nsa-random.gen.js"),
    circles: require("./fixtures/nsa-circles.gen.js"),
};
var CindyJS = require("../build/js/Cindy.plain.js");

var SEEDS = (process.env.NSA_STRESS_SEEDS || "11").split(",").map(Number);
var COUNT = 30;
// how close to the end of a move the limit is compared with the value there
var H = 1e-6;
var LIMIT_TOLERANCE = 1e-2;
// slow already without nsa: tracing (see Tracing_random_golden_tests.js), or
// the prover checking conjectures when loading (removable seed 11 #29: over
// 30 s per widget)
var SKIP = {
    tracing: ["seed 33 #10", "seed 33 #21", "seed 44 #24", "seed 44 #29", "seed 99 #29"],
    removable: ["seed 11 #29"],
    // seconds per move without nsa (tracing), and the prover at load
    circles: ["seed 11 #0", "seed 11 #8", "seed 11 #14", "seed 11 #24"],
};
var TOLERANCE = 1e-6;

function hasSeries(v, seen) {
    if (Array.isArray(v)) return v.some((w) => hasSeries(w, seen));
    if (!v || typeof v !== "object" || seen.has(v)) return false;
    seen.add(v);
    if (v.lc !== undefined) return true;
    return Object.keys(v).some((k) => hasSeries(v[k], seen));
}

// a CindyScript vector or matrix as an array of complex numbers [re, im], or
// null if it is undefined
function entries(v) {
    if (!v || v.ctype !== "list") return null;
    var out = [];
    var add = function (w) {
        if (w.ctype === "list") w.value.forEach(add);
        else out.push([w.value.real, w.value.imag]);
    };
    v.value.forEach(add);
    var finite = out.every((z) => isFinite(z[0]) && isFinite(z[1]));
    var zero = out.every((z) => z[0] === 0 && z[1] === 0);
    return finite && !zero ? out : null;
}

// sin of the angle between a and b as complex vectors: 0 if they are the
// same projective point (or line, conic)
function projectiveDistance(a, b) {
    var re = 0;
    var im = 0;
    for (var i = 0; i < a.length; i++) {
        re += a[i][0] * b[i][0] + a[i][1] * b[i][1];
        im += a[i][1] * b[i][0] - a[i][0] * b[i][1];
    }
    var c = (re * re + im * im) / Math.pow(norm(a) * norm(b), 2);
    return Math.sqrt(Math.max(0, 1 - c));
}

function norm(a) {
    return Math.sqrt(a.reduce((s, z) => s + z[0] * z[0] + z[1] * z[1], 0));
}

// |sum a_i b_i| / (|a| |b|): 0 if the point a lies on the line b
function onLine(p, l) {
    var re = 0;
    var im = 0;
    for (var i = 0; i < 3; i++) {
        re += p[i][0] * l[i][0] - p[i][1] * l[i][1];
        im += p[i][0] * l[i][1] + p[i][1] * l[i][0];
    }
    return Math.hypot(re, im) / (norm(p) * norm(l));
}

// |p^T C p| / (|p|^2 |C|): 0 if the point p lies on the conic C
function onConic(p, c) {
    var re = 0;
    var im = 0;
    for (var i = 0; i < 3; i++) {
        for (var j = 0; j < 3; j++) {
            var a = c[3 * i + j];
            // p_i * a * p_j
            var r1 = p[i][0] * a[0] - p[i][1] * a[1];
            var i1 = p[i][0] * a[1] + p[i][1] * a[0];
            re += r1 * p[j][0] - i1 * p[j][1];
            im += r1 * p[j][1] + i1 * p[j][0];
        }
    }
    var n = norm(p);
    return Math.hypot(re, im) / (n * n * norm(c));
}

// the adjugate of the 3x3 matrix c (9 complex entries, by rows)
function adjugate(c) {
    var mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
    var e = (i, j) => c[3 * (i % 3) + (j % 3)];
    var out = [];
    for (var i = 0; i < 3; i++)
        for (var j = 0; j < 3; j++) {
            // cofactor of (j, i)
            var x = mul(e(j + 1, i + 1), e(j + 2, i + 2));
            var y = mul(e(j + 1, i + 2), e(j + 2, i + 1));
            out.push([x[0] - y[0], x[1] - y[1]]);
        }
    return out;
}

// 0 if the line l touches the conic c (l^T adj(c) l = 0), or if c is
// degenerate (adj(c) all but zero), where tangency means little
function tangentTo(l, c) {
    var adj = adjugate(c);
    var n = norm(c);
    if (norm(adj) <= 1e-9 * n * n) return 0;
    return onConic(l, adj);
}

// the incidences of each element that its definition guarantees, as
// [description, point, line or conic]
function incidences(geometry, names) {
    var byName = {};
    geometry.forEach((g) => (byName[g.name] = g));
    var out = [];
    geometry.forEach(function (g) {
        var a = g.args || [];
        if (g.type === "Join" || g.type === "Segment") out.push([a[0], g.name], [a[1], g.name]);
        if (g.type === "Meet") out.push([g.name, a[0]], [g.name, a[1]]);
        if (g.type === "PointOnLine" || g.type === "PointOnSegment") out.push([g.name, a[0]]);
        if (g.type === "PointOnCircle") out.push([g.name, a[0]]);
        if (g.type === "CircleBy3" || g.type === "ConicBy5") a.forEach((p) => out.push([p, g.name]));
        if (g.type === "CircleMP") out.push([a[1], g.name]);
        if (g.type === "SelectP" && byName[a[0]]) {
            var set = byName[a[0]];
            if (/^Intersect(LC|CirCir|ConicConic)$/.test(set.type))
                out.push([g.name, set.args[0]], [g.name, set.args[1]]);
        }
        if (g.type === "SelectConic" && byName[a[0]]) {
            var family = byName[a[0]];
            var f = family.args;
            if (family.type === "ConicBy4p1l") {
                f.slice(0, 4).forEach((p) => out.push([p, g.name]));
                out.push([f[4], g.name, "tangent"]);
            }
            if (family.type === "ConicBy1p4l") {
                out.push([f[0], g.name]);
                f.slice(1).forEach((l) => out.push([l, g.name, "tangent"]));
            }
        }
    });
    return out.filter((i) => names.indexOf(i[0]) >= 0 && names.indexOf(i[1]) >= 0);
}

function violations(cdy, checks) {
    var bad = {};
    checks.forEach(function (c) {
        var p = entries(cdy.evalcs(c[0] + ".homog"));
        var target = cdy.evalcs(c[1]).value;
        var isConic = target.kind === "C";
        var t = entries(cdy.evalcs(c[1] + (isConic ? ".matrix" : ".homog")));
        if (!p || !t) return;
        var d = c[2] === "tangent" ? tangentTo(p, t) : isConic ? onConic(p, t) : onLine(p, t);
        if (!(d < TOLERANCE)) bad[c[0] + (c[2] === "tangent" ? " tangent to " : " on ") + c[1]] = d;
    });
    return bad;
}

// whether the element `name` depends on the element `on`
function dependsOn(geometry, name, on) {
    var byName = {};
    geometry.forEach((g) => (byName[g.name] = g));
    var visit = function (n) {
        return n === on || (byName[n] && (byName[n].args || []).some(visit));
    };
    return visit(name);
}

function value(cdy, name) {
    var el = cdy.evalcs(name).value;
    return entries(cdy.evalcs(name + (el.kind === "C" ? ".matrix" : ".homog")));
}

function position(cdy, name) {
    return cdy.evalcs(name + ".xy").value.map((z) => z.value.real);
}

function run(c, index) {
    var rs = 12345 + index * 7919;
    var random = Math.random;
    Math.random = function () {
        rs = (rs * 16807) % 2147483647;
        return rs / 2147483647;
    };
    // the value of n with nsa after the first k moves and then `last`,
    // replayed in a fresh widget with fresh random numbers
    var replay = function (k, last, n) {
        var saved = rs;
        rs = 54321 + index * 7919;
        try {
            var cdy = make(true);
            c.moves
                .slice(0, k)
                .concat([last])
                .forEach((m) => apply(cdy, m));
            return value(cdy, n);
        } finally {
            rs = saved;
        }
    };
    var warn = console.warn;
    var log = console.log;
    var error = console.error;
    var warnings = [];
    console.log = console.error = function () {};
    console.warn = function () {
        var msg = Array.prototype.join.call(arguments, " ");
        if (msg.indexOf("nsa") >= 0) warnings.push(msg);
    };
    var problems = [];
    try {
        var names = c.geometry.map((g) => g.name);
        var checks = incidences(c.geometry, names);
        var make = (nsa) =>
            CindyJS({ isNode: true, csconsole: false, nsa: nsa, geometry: JSON.parse(JSON.stringify(c.geometry)) });
        var plain = make(false);
        var withNsa = make(true);
        var frame = function (label) {
            var off = violations(plain, checks);
            var on = violations(withNsa, checks);
            Object.keys(on).forEach(function (k) {
                if (!(k in off)) problems.push(label + ": " + k + " off by " + on[k]);
            });
            names.forEach(function (n) {
                if (hasSeries(withNsa.evalcs(n).value, new Set())) problems.push(label + ": series in " + n);
            });
        };
        // Two more widgets follow the moves, without and with nsa, stopping
        // shortly before the end of each move: there, without nsa, an element
        // whose limit nsa shows at the end must have almost the same value -
        // if it is regular there, i.e. nsa leaves it alone (not if it stays
        // degenerate, e.g. two coinciding points that this move does not
        // separate).
        var nearOff = make(false);
        var nearOn = make(true);
        var apply = function (cdy, m) {
            try {
                cdy.evalcs(m);
            } catch (e) {
                // the same move fails without nsa: not nsa's problem
            }
        };
        frame("loaded");
        c.moves.forEach(function (m, k) {
            var moved = /^(\w+)\.xy=/.exec(m);
            var mover = moved && moved[1];
            var from = mover && position(withNsa, mover);
            apply(plain, m);
            withNsa.evalcs(m);
            frame("after " + m);
            if (mover) {
                var to = position(withNsa, mover);
                var near = [0, 1].map((i) => to[i] + H * (from[i] - to[i]));
                apply(nearOff, mover + ".xy=(" + near[0] + "," + near[1] + ")");
                apply(nearOn, mover + ".xy=(" + near[0] + "," + near[1] + ")");
                if (Math.hypot(to[0] - from[0], to[1] - from[1]) > 0) {
                    names.forEach(function (n) {
                        if (!dependsOn(c.geometry, n, mover)) return;
                        var limit = value(withNsa, n);
                        if (!limit || value(plain, n)) return;
                        var close = value(nearOff, n);
                        var closeNsa = value(nearOn, n);
                        if (!close || !closeNsa || projectiveDistance(close, closeNsa) > 1e-12) return;
                        if (projectiveDistance(limit, close) < LIMIT_TOLERANCE) return;
                        // The followers may have taken another branch (of a
                        // conic, an intersection) than withNsa: compare again
                        // on one history.
                        var nearMove = mover + ".xy=(" + near[0] + "," + near[1] + ")";
                        var limit2 = replay(k, m, n);
                        var close2 = replay(k, nearMove, n);
                        if (!limit2 || !close2) return;
                        var d = projectiveDistance(limit2, close2);
                        if (!(d < LIMIT_TOLERANCE))
                            problems.push("move " + k + ", " + m + ": " + n + " is no limit, off by " + d);
                    });
                }
            }
            apply(nearOff, m);
            apply(nearOn, m);
        });
    } catch (e) {
        problems.push("exception: " + e);
    } finally {
        Math.random = random;
        console.warn = warn;
        console.log = log;
        console.error = error;
    }
    return problems.concat(warnings);
}

Object.keys(corpora).forEach(function (corpus) {
    describe("nsa stress test, random constructions: " + corpus, function () {
        this.timeout(+process.env.NSA_STRESS_TIMEOUT || 60000);
        SEEDS.forEach(function (seed) {
            corpora[corpus](seed, COUNT).forEach(function (c, i) {
                var name = "seed " + seed + " #" + i;
                if (SKIP[corpus].indexOf(name) >= 0) return;
                it(name, function () {
                    expect(run(c, i)).to.deep.equal([]);
                });
            });
        });
    });
});
