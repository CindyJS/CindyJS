// Microbenchmark for List.js matrix hot paths.
// Usage: node benchmarks/list_matrix.js <path-to-exposed.js> [label] [--json]
//   or:  make benchmark
const rewire = require("rewire");
const path = require("path");
if (typeof navigator === "undefined") global.navigator = {};

const exposedPath = path.resolve(process.argv[2]); // resolve relative to cwd, not this script
const label = process.argv[3] || exposedPath;
const cjs = rewire(exposedPath);
const List = cjs.__get__("List");
const CSNumber = cjs.__get__("CSNumber");

// deterministic, diagonally dominant => non-singular & stable LU
function realMat(n) {
    const rows = new Array(n);
    for (let i = 0; i < n; i++) {
        const row = new Array(n);
        for (let j = 0; j < n; j++) {
            row[j] = CSNumber.real(((i * 31 + j * 17) % 7) - 3 + (i === j ? 6 * n : 0));
        }
        rows[i] = List.turnIntoCSList(row);
    }
    return List.turnIntoCSList(rows);
}
function complexMat(n) {
    const rows = new Array(n);
    for (let i = 0; i < n; i++) {
        const row = new Array(n);
        for (let j = 0; j < n; j++) {
            const re = ((i * 31 + j * 17) % 7) - 3 + (i === j ? 6 * n : 0);
            const im = ((i * 13 + j * 23) % 5) - 2;
            row[j] = CSNumber.complex(re, im);
        }
        rows[i] = List.turnIntoCSList(row);
    }
    return List.turnIntoCSList(rows);
}
function vec(n, complex) {
    const a = new Array(n);
    for (let i = 0; i < n; i++) {
        a[i] = complex ? CSNumber.complex(((i * 7) % 5) - 2, ((i * 11) % 3) - 1) : CSNumber.real(((i * 7) % 5) - 2);
    }
    return List.turnIntoCSList(a);
}

// auto-calibrating: grow iters until a batch is >= 40ms, then best-of-5 (best-of-3 for very heavy ops)
function bench(fn) {
    fn();
    let iters = 1;
    for (;;) {
        const s = process.hrtime.bigint();
        for (let i = 0; i < iters; i++) fn();
        const ms = Number(process.hrtime.bigint() - s) / 1e6;
        if (ms >= 40 || iters > 5000000) break;
        iters = Math.max(iters * 2, Math.ceil((iters * 45) / Math.max(ms, 0.001)));
    }
    const trials = iters <= 2 ? 3 : 5;
    let best = Infinity;
    for (let t = 0; t < trials; t++) {
        const s = process.hrtime.bigint();
        for (let i = 0; i < iters; i++) fn();
        const ns = Number(process.hrtime.bigint() - s) / iters;
        if (ns < best) best = ns;
    }
    return best; // ns/op
}

const cases = [];
// size sweep on real diagonally-dominant matrices
for (const n of [6, 16, 32]) {
    const m = realMat(n);
    const b = vec(n, false);
    cases.push([`mult MM      ${n}x${n}`, () => List.mult(m, m)]);
    cases.push([`det          ${n}x${n}`, () => List.det(m)]);
    cases.push([`linearsolve  ${n}x${n}`, () => List.linearsolve(m, b)]);
    cases.push([`inverse      ${n}x${n}`, () => List.inverse(m)]);
}
// "real example" — 88_LA_Tests.html: 100x100 COMPLEX matrix
{
    const n = 100;
    const m = complexMat(n);
    const b = vec(n, true);
    cases.push([`linearsolve  ${n}x${n} cplx (88_LA_Tests)`, () => List.linearsolve(m, b)]);
    cases.push([`inverse      ${n}x${n} cplx (88_LA_Tests)`, () => List.inverse(m)]);
    cases.push([`det          ${n}x${n} cplx (88_LA_Tests)`, () => List.det(m)]);
    cases.push([`mult MV      ${n}x${n} cplx (|A*x|)`, () => List.mult(m, b)]);
}

const out = {};
for (const [name, fn] of cases) out[name] = bench(fn);

if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ label, results: out }));
} else {
    const fmt = (n) =>
        n >= 1e6 ? (n / 1e6).toFixed(2) + " ms" : n >= 1e3 ? (n / 1e3).toFixed(1) + " µs" : n.toFixed(0) + " ns";
    console.log(`\nList matrix benchmark [${label}] — best of 5\n`);
    for (const [name, t] of Object.entries(out)) console.log("  " + name.padEnd(36) + fmt(t).padStart(10));
    console.log("");
}
