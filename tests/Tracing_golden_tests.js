// Tracing must behave exactly as before the non-standard analysis (nsa)
// support: nsa only runs after tracing is done and must not change anything
// tracing computes. These tests replay scripted moves and compare every
// coordinate bit for bit with values recorded before that work.
//
// To regenerate tests/fixtures/tracing-golden.json (only ever with a build
// that is known to trace correctly):
//     node tests/Tracing_golden_tests.js --record > tests/fixtures/tracing-golden.json

global.navigator = {};
var cases = require("./fixtures/tracing-golden.cases.js");
var CindyJS = require("../build/js/Cindy.plain.js");

function snapshot(CindyJS, c, options) {
    var cdy = CindyJS(
        Object.assign({ isNode: true, csconsole: false, geometry: JSON.parse(JSON.stringify(c.geometry)) }, options)
    );
    var names = c.geometry.map(function (g) {
        return g.name;
    });
    var exact = function (v) {
        if (!v || typeof v !== "object") return String(v);
        if (v.ctype === "number") return v.value.real + "," + v.value.imag;
        if (v.ctype === "list") return "[" + v.value.map(exact).join(";") + "]";
        return v.ctype;
    };
    var frame = function () {
        return names
            .map(function (n) {
                return n + "=" + exact(cdy.evalcs(n + ".homog")) + exact(cdy.evalcs(n + ".matrix"));
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

if (require.main === module && process.argv[2] === "--record") {
    var out = {};
    cases.forEach(function (c) {
        out[c.name] = snapshot(CindyJS, c, {});
    });
    process.stdout.write(JSON.stringify(out, null, 1) + "\n");
} else {
    var chai = require("chai");
    var expect = chai.expect;
    var golden = require("./fixtures/tracing-golden.json");

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
        });
    });
}
