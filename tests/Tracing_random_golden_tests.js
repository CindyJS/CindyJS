// Random constructions and moves (tests/fixtures/tracing-random.gen.js),
// replayed and compared frame by frame with hashes recorded before the
// non-standard analysis (nsa) work: all coordinates and visibility must be
// bit-identical when nsa is off. Complements tests/Tracing_golden_tests.js
// with many more operations and coincidences.
//
// The expected values must come from a build without the nsa work, never
// from this code: recording here would make the test pass by definition. To
// add a case or regenerate tests/fixtures/tracing-random.json, check out the
// commit the nsa work is based on (git merge-base HEAD origin/main), build it
// (node make plain), copy this test and tests/fixtures/ there, run
//     node tests/Tracing_random_golden_tests.js --record > tests/fixtures/tracing-random.json
// and check that the cases recorded before are unchanged.

global.navigator = {};
var crypto = require("crypto");
var generate = require("./fixtures/tracing-random.gen.js");
var CindyJS = require("../build/js/Cindy.plain.js");

var SEEDS = [11, 22, 33];
var COUNT = 30;
// constructions where a single move takes seconds (the tracer refining up
// to its limit), with or without nsa
var SKIP = ["seed 33 #10", "seed 33 #21"];

var exact = function (v) {
    if (Array.isArray(v)) return "(" + v.map(exact).join(";") + ")";
    if (!v || typeof v !== "object") return String(v);
    if (v.ctype === "number") return v.value.real + "," + v.value.imag;
    if (v.ctype === "list") return "[" + v.value.map(exact).join(";") + "]";
    if (v.ctype === "boolean") return String(v.value);
    return v.ctype;
};

// per frame: a hash of all coordinates and visibility
function replay(c, index, options) {
    // some operations use Math.random (e.g. ConicBy2Foci1P)
    var rs = 12345 + index * 7919;
    var random = Math.random;
    Math.random = function () {
        rs = (rs * 16807) % 2147483647;
        return rs / 2147483647;
    };
    var log = console.log;
    var warn = console.warn;
    var error = console.error;
    console.log = console.warn = console.error = function () {};
    var hashes = [];
    try {
        var cdy = CindyJS(
            Object.assign({ isNode: true, csconsole: false, geometry: JSON.parse(JSON.stringify(c.geometry)) }, options)
        );
        var names = c.geometry.map(function (g) {
            return g.name;
        });
        var frame = function () {
            var s = names
                .map(function (n) {
                    // the element itself, for what CindyScript has no accessor
                    // for: all solutions of an intersection, the value of an angle
                    var el = cdy.evalcs(n).value;
                    return (
                        n +
                        "=" +
                        exact(cdy.evalcs(n + ".homog")) +
                        exact(cdy.evalcs(n + ".matrix")) +
                        exact(cdy.evalcs(n + ".isshowing")) +
                        (el.results ? " results" + exact(el.results) : "") +
                        (el.kind === "V" ? " value" + exact(el.value) : "")
                    );
                })
                .join(" ");
            return crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
        };
        hashes.push(frame());
        c.moves.forEach(function (m) {
            try {
                cdy.evalcs(m);
                hashes.push(frame());
            } catch (e) {
                hashes.push("error " + e);
            }
        });
    } finally {
        Math.random = random;
        console.log = log;
        console.warn = warn;
        console.error = error;
    }
    return hashes;
}

function allCases() {
    var cases = [];
    SEEDS.forEach(function (seed) {
        generate(seed, COUNT).forEach(function (c, i) {
            var name = "seed " + seed + " #" + i;
            if (SKIP.indexOf(name) < 0) cases.push({ name: name, construction: c });
        });
    });
    return cases;
}

// The same constructions with nsa, compared with tests/fixtures/nsa-random.json:
// unlike the values above, these are recorded from this code, to notice any
// change in what nsa computes. Regenerate them, after checking that a change
// is intended, with
//     node tests/Tracing_random_golden_tests.js --record-nsa > tests/fixtures/nsa-random.json
var record = { "--record": {}, "--record-nsa": { nsa: true } }[process.argv[2]];
if (require.main === module && record) {
    var out = {};
    allCases().forEach(function (c, i) {
        out[c.name] = replay(c.construction, i, record);
    });
    process.stdout.write(JSON.stringify(out, null, 0) + "\n");
} else {
    var expect = require("chai").expect;
    var compare = function (title, fixture, options) {
        var golden = require(fixture);
        describe(title, function () {
            this.timeout(20000);
            allCases().forEach(function (c, i) {
                it(c.name, function () {
                    var hashes = replay(c.construction, i, options);
                    hashes.forEach(function (h, k) {
                        expect(h).to.equal(
                            golden[c.name][k],
                            "frame " + k + (k ? " after " + c.construction.moves[k - 1] : "")
                        );
                    });
                });
            });
        });
    };
    compare("Tracing golden values, random constructions", "./fixtures/tracing-random.json", {});
    compare("nsa golden values, random constructions", "./fixtures/nsa-random.json", { nsa: true });
}
