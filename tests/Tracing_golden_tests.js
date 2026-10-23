// Tracing must behave exactly as before the non-standard analysis (nsa)
// support: nsa only runs after tracing is done and must not change anything
// tracing computes. These tests replay scripted moves and compare every
// coordinate bit for bit with values recorded before that work.
//
// The expected values must come from a build without the nsa work, never
// from this code: recording here would make the test pass by definition. To
// add a case or regenerate tests/fixtures/tracing-golden.json, check out the
// commit the nsa work is based on (git merge-base HEAD origin/main), build it
// (node make plain), copy this test and tests/fixtures/ there, run
//     node tests/Tracing_golden_tests.js --record > tests/fixtures/tracing-golden.json
// and check that the cases recorded before are unchanged.

global.navigator = {};
var cases = require("./fixtures/tracing-golden.cases.js");
var CindyJS = require("../build/js/Cindy.plain.js");

function snapshot(CindyJS, c, options) {
    // some operations use Math.random (e.g. ConicBy2Foci1P)
    var rs = 12345;
    var random = Math.random;
    Math.random = function () {
        rs = (rs * 16807) % 2147483647;
        return rs / 2147483647;
    };
    try {
        return replay(CindyJS, c, options);
    } finally {
        Math.random = random;
    }
}

function replay(CindyJS, c, options) {
    var cdy = CindyJS(
        Object.assign({ isNode: true, csconsole: false, geometry: JSON.parse(JSON.stringify(c.geometry)) }, options)
    );
    var names = c.geometry.map(function (g) {
        return g.name;
    });
    var exact = function (v) {
        if (Array.isArray(v)) return "(" + v.map(exact).join(";") + ")";
        if (!v || typeof v !== "object") return String(v);
        if (v.ctype === "number") return v.value.real + "," + v.value.imag;
        if (v.ctype === "list") return "[" + v.value.map(exact).join(";") + "]";
        return v.ctype;
    };
    var frame = function () {
        return names
            .map(function (n) {
                // the element itself, for what CindyScript has no accessor for:
                // all solutions of an intersection, the value of an angle
                var el = cdy.evalcs(n).value;
                var extra =
                    (el.results ? " results" + exact(el.results) : "") +
                    (el.kind === "V" ? " value" + exact(el.value) : "");
                return n + "=" + exact(cdy.evalcs(n + ".homog")) + exact(cdy.evalcs(n + ".matrix")) + extra;
            })
            .join(" ");
    };
    var frames = [frame()];
    c.moves.forEach(function (m) {
        cdy.evalcs(m);
        frames.push(frame());
    });
    return frames;
}

// With nsa, all frames are also compared with tests/fixtures/nsa-golden.json:
// unlike the values above, these are recorded from this code, to notice any
// change in what nsa computes. Regenerate them, after checking that a change
// is intended, with
//     node tests/Tracing_golden_tests.js --record-nsa > tests/fixtures/nsa-golden.json
var record = { "--record": {}, "--record-nsa": { nsa: true } }[process.argv[2]];
if (require.main === module && record) {
    var out = {};
    cases.forEach(function (c) {
        out[c.name] = snapshot(CindyJS, c, record);
    });
    process.stdout.write(JSON.stringify(out, null, 1) + "\n");
} else {
    var chai = require("chai");
    var expect = chai.expect;
    var golden = require("./fixtures/tracing-golden.json");
    var nsaGolden = require("./fixtures/nsa-golden.json");

    // whether a recorded frame contains an undefined (NaN or zero) vector or matrix
    var hasUndefined = function (frame) {
        if (frame.indexOf("NaN") >= 0) return true;
        return frame.split(" ").some(function (field) {
            var groups = field.match(/\[([^\[\]]*)\]/g) || [];
            var vectors = field.indexOf("[[") >= 0 ? [groups.join(";")] : groups;
            return vectors.some(function (g) {
                return g
                    .replace(/[\[\]]/g, "")
                    .split(";")
                    .every(function (e) {
                        return e === "0,0" || e === "-0,0" || e === "0,-0" || e === "-0,-0";
                    });
            });
        });
    };

    describe("Tracing golden values", function () {
        cases.forEach(function (c) {
            it(c.name, function () {
                var frames = snapshot(CindyJS, c, {});
                frames.forEach(function (f, i) {
                    expect(f).to.equal(golden[c.name][i], "frame " + i + (i ? " after " + c.moves[i - 1] : ""));
                });
            });
            if (!c.degenerate) {
                // nsa changes undefined elements only, and nothing that
                // tracing computes: all other frames stay identical
                it(c.name + ", with nsa", function () {
                    var frames = snapshot(CindyJS, c, { nsa: true });
                    frames.forEach(function (f, i) {
                        if (hasUndefined(golden[c.name][i])) return;
                        expect(f).to.equal(golden[c.name][i], "frame " + i + (i ? " after " + c.moves[i - 1] : ""));
                    });
                });
            }
            it(c.name + ", nsa golden values", function () {
                var frames = snapshot(CindyJS, c, { nsa: true });
                frames.forEach(function (f, i) {
                    expect(f).to.equal(nsaGolden[c.name][i], "frame " + i + (i ? " after " + c.moves[i - 1] : ""));
                });
            });
        });
    });
}
