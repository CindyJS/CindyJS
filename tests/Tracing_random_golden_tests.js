// Random constructions and moves (tests/fixtures/tracing-random.gen.js),
// replayed and compared frame by frame with hashes recorded before the
// non-standard analysis (nsa) work: all coordinates and visibility must be
// bit-identical when nsa is off. Complements tests/Tracing_golden_tests.js
// with many more operations and coincidences.
//
// To regenerate tests/fixtures/tracing-random.json (only ever with a build
// that is known to trace correctly):
//     node tests/Tracing_random_golden_tests.js --record > tests/fixtures/tracing-random.json

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
    if (!v || typeof v !== "object") return String(v);
    if (v.ctype === "number") return v.value.real + "," + v.value.imag;
    if (v.ctype === "list") return "[" + v.value.map(exact).join(";") + "]";
    if (v.ctype === "boolean") return String(v.value);
    return v.ctype;
};

// per frame: a hash of all coordinates and visibility
function replay(c, index) {
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
        var cdy = CindyJS({ isNode: true, csconsole: false, geometry: JSON.parse(JSON.stringify(c.geometry)) });
        var names = c.geometry.map(function (g) {
            return g.name;
        });
        var frame = function () {
            var s = names
                .map(function (n) {
                    return (
                        n +
                        "=" +
                        exact(cdy.evalcs(n + ".homog")) +
                        exact(cdy.evalcs(n + ".matrix")) +
                        exact(cdy.evalcs(n + ".isshowing"))
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

if (require.main === module && process.argv[2] === "--record") {
    var out = {};
    allCases().forEach(function (c, i) {
        out[c.name] = replay(c.construction, i);
    });
    process.stdout.write(JSON.stringify(out, null, 0) + "\n");
} else {
    var expect = require("chai").expect;
    var golden = require("./fixtures/tracing-random.json");

    describe("Tracing golden values, random constructions", function () {
        this.timeout(20000);
        allCases().forEach(function (c, i) {
            it(c.name, function () {
                var hashes = replay(c.construction, i);
                hashes.forEach(function (h, k) {
                    expect(h).to.equal(
                        golden[c.name][k],
                        "frame " + k + (k ? " after " + c.construction.moves[k - 1] : "")
                    );
                });
            });
        });
    });
}
