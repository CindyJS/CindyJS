// CSNumber and List on Levi-Civita numbers.
//
// A number value may carry a Levi-Civita series (libcs/LeviCivita.ts) in
// value.lc; its real and imag are NaN then, see CSNumber.ts.
//
// Why the operations are swapped at runtime: everything in CindyJS that does
// arithmetic goes through CSNumber and List, including tracing. Teaching those
// operations about series would put a check into every one of them, on the
// hottest paths of the engine, for a feature that is off by default. Instead
// the standard operations stay exactly as they are, and the ones below, with
// the same names, are substituted into CSNumber, CSNumber._helper and List
// only for the duration of a non-standard computation (withLeviCivita), and
// restored afterwards, also on exceptions. With the nsa option off this file
// never runs. A series that leaks out of such a window computes as NaN, i.e.
// undefined - never as a silently wrong standard number.
//
// Each substitute handles ordinary numbers by delegating to the standard
// implementation it replaced, so inside the window everything else works as
// before, and the standard operations that are built on others (pow, arctan2,
// List.cross, ...) work on series automatically. Code must therefore not keep
// references to CSNumber or List functions across calls (const add =
// CSNumber.add) where it may run inside the window.

import { nada } from "expose";
import { CSNumber } from "libcs/CSNumber";
// @ts-expect-error: Not yet typed
import { List } from "libcs/List";
import { LC, LCSeries } from "libcs/LeviCivita";
import { CSNum, CSList, CSMath } from "types";

// In an IIFE: the classic build concatenates all sources into one scope.
const { withLeviCivita, inLeviCivitaMode } = (function () {
    type Helper = CSMath["_helper"];

    function lcOf(a: CSNum): LCSeries {
        return a.value.lc || LC.fromComplex(a.value.real, a.value.imag);
    }

    // Results that turn out to be standard are demoted back to plain numbers.
    function fromLC(s: LCSeries): CSNum {
        if (LC.isStandard(s)) {
            const sp = LC.standardPart(s);
            return CSNumber.complex(sp.re, sp.im);
        }
        return { ctype: "number", value: { real: NaN, imag: NaN, lc: s } };
    }

    function isLC(a: CSNum, b?: CSNum): boolean {
        return a.value.lc !== undefined || (b !== undefined && b.value.lc !== undefined);
    }

    // floor of the real part, taking the infinitesimal remainder into account:
    // floor(3 - eps) is 2, not 3.
    function lcFloorReal(a: LCSeries): number {
        const re = LC.realPart(a);
        const s = LC.standardPart(re).re;
        if (!isFinite(s)) return NaN;
        if (Number.isInteger(s) && LC.sign(LC.sub(re, LC.fromComplex(s, 0))) < 0) return s - 1;
        return Math.floor(s);
    }

    function lcFloor(a: LCSeries): CSNum {
        return CSNumber.complex(lcFloorReal(a), lcFloorReal(LC.imagPart(a)));
    }

    function lcCeil(a: LCSeries): CSNum {
        const f = lcFloor(LC.neg(a));
        return CSNumber.complex(-f.value.real, -f.value.imag);
    }

    function lcRound(a: LCSeries): CSNum {
        return lcFloor(LC.add(a, LC.fromComplex(0.5, 0.5)));
    }

    // a - floor(a / b) * b on real and imaginary part separately, like the
    // standard version, so that mod(3 - eps, 3) = 3 - eps agrees with floor.
    function lcMod(a: CSNum, b: CSNum): CSNum {
        const part = function (x: LCSeries, y: LCSeries): LCSeries {
            if (LC.isZero(y)) return LC.ZERO;
            const q = lcFloorReal(LC.div(x, y));
            return LC.sub(x, LC.scale(y, q, 0));
        };
        const sa = lcOf(a);
        const sb = lcOf(b);
        const re = part(LC.realPart(sa), LC.realPart(sb));
        const im = part(LC.imagPart(sa), LC.imagPart(sb));
        const res = fromLC(LC.add(re, LC.scale(im, 0, 1)));
        if (a.usage === "Angle" && b.usage === "Angle") res.usage = "Angle";
        return res;
    }

    // componentwise max/min on real and imaginary part, like the standard versions
    function lcComponentwise(a: CSNum, b: CSNum, pickFirst: (cmp: number) => boolean): CSNum {
        const sa = lcOf(a);
        const sb = lcOf(b);
        const ra = LC.realPart(sa);
        const rb = LC.realPart(sb);
        const ia = LC.imagPart(sa);
        const ib = LC.imagPart(sb);
        const re = pickFirst(LC.compare(ra, rb)) ? ra : rb;
        const im = pickFirst(LC.compare(ia, ib)) ? ia : ib;
        return fromLC(LC.add(re, LC.scale(im, 0, 1)));
    }

    // The standard implementations the substitutes replaced (set while the mode
    // is active); the substitutes delegate ordinary numbers to them.
    let std: CSMath = CSNumber;
    let stdHelper: Helper = CSNumber._helper;
    let stdList: Record<string, (...args: any[]) => any> = List;

    const helperOps: Partial<Helper> = {
        isReal: function (a) {
            return isLC(a) ? LC.isReal(lcOf(a)) : stdHelper.isReal(a);
        },
        isZero: function (a) {
            return isLC(a) ? LC.isZero(lcOf(a)) : stdHelper.isZero(a);
        },
        // An infinitesimal is not zero: that is the whole point of using one.
        isAlmostZero: function (a) {
            return isLC(a) ? LC.isZero(lcOf(a)) : stdHelper.isAlmostZero(a);
        },
        isAlmostReal: function (a) {
            if (!isLC(a)) return stdHelper.isAlmostReal(a);
            return lcOf(a).terms.every((t) => t.im < CSNumber.epsbig && t.im > -CSNumber.epsbig);
        },
        isAlmostImag: function (a) {
            if (!isLC(a)) return stdHelper.isAlmostImag(a);
            return lcOf(a).terms.every((t) => t.re < CSNumber.epsbig && t.re > -CSNumber.epsbig);
        },
        isNaN: function (a) {
            return isLC(a) ? !LC.isValid(lcOf(a)) : stdHelper.isNaN(a);
        },
        // Infinite Levi-Civita numbers are still field elements one can compute
        // with (e.g. the inverse of an infinitesimal).
        isFinite: function (a) {
            return isLC(a) ? LC.isValid(lcOf(a)) : stdHelper.isFinite(a);
        },
        // A Levi-Civita infinitesimal is never below a threshold: it stands for a
        // quantity that is exactly nonzero, just infinitely small.
        absBelow: function (a, eps) {
            if (!isLC(a)) return stdHelper.absBelow(a, eps);
            const s = lcOf(a);
            if (LC.isZero(s)) return true;
            if (LC.order(s) > 0) return false;
            const sp = LC.standardPart(s);
            return Math.hypot(sp.re, sp.im) < eps;
        },
        // Levi-Civita values are ordered by their leading term.
        realSign: function (a) {
            return isLC(a) ? LC.sign(LC.realPart(lcOf(a))) : stdHelper.realSign(a);
        },
        // equal as far as the series are known
        isEqual: function (a, b) {
            return isLC(a, b) ? LC.sub(lcOf(a), lcOf(b)).terms.length === 0 : stdHelper.isEqual(a, b);
        },
        isLessThan: function (a, b) {
            return isLC(a, b) ? LC.compare(lcOf(a), lcOf(b)) < 0 : stdHelper.isLessThan(a, b);
        },
        // numbers that differ infinitesimally are different
        isAlmostEqual: function (a, b, preci) {
            if (!isLC(a, b)) return stdHelper.isAlmostEqual(a, b, preci);
            const eps = preci === undefined ? CSNumber.eps : preci;
            const d = LC.sub(lcOf(a), lcOf(b));
            if (d.terms.length === 0) return true;
            if (LC.order(d) !== 0) return false;
            return Math.abs(d.terms[0].re) < eps && Math.abs(d.terms[0].im) < eps;
        },
    };

    // r = a + b or a - b of standard numbers, zero if it is rounding noise. The
    // series arithmetic drops such cancellations (LC.add), so standard values
    // must as well: otherwise the noise of a standard component outweighs the
    // infinitesimal ones of the others, and becomes the shadow.
    function cancelled(r: CSNum, a: CSNum, b: CSNum): CSNum {
        const size = Math.abs(a.value.real) + Math.abs(a.value.imag) + Math.abs(b.value.real) + Math.abs(b.value.imag);
        return LC.isCancellation(r.value.real, r.value.imag, size) ? std.zero : r;
    }

    const numberOps: Partial<CSMath> = {
        niceprint: function (a, roundingfactor = CSNumber._helper.roundingfactor) {
            return isLC(a) ? LC.niceprint(lcOf(a), roundingfactor) : std.niceprint(a, roundingfactor);
        },
        argmax: function (a, b) {
            return isLC(a, b) ? (LC.compareMagnitude(lcOf(a), lcOf(b)) < 0 ? b : a) : std.argmax(a, b);
        },
        max: function (a, b) {
            return isLC(a, b) ? lcComponentwise(a, b, (c) => c >= 0) : std.max(a, b);
        },
        min: function (a, b) {
            return isLC(a, b) ? lcComponentwise(a, b, (c) => c <= 0) : std.min(a, b);
        },
        add: function (a, b) {
            return isLC(a, b) ? fromLC(LC.add(lcOf(a), lcOf(b))) : cancelled(std.add(a, b), a, b);
        },
        sub: function (a, b) {
            return isLC(a, b) ? fromLC(LC.sub(lcOf(a), lcOf(b))) : cancelled(std.sub(a, b), a, b);
        },
        neg: function (a) {
            return isLC(a) ? { ...a, ...fromLC(LC.neg(lcOf(a))) } : std.neg(a);
        },
        re: function (a) {
            return isLC(a) ? fromLC(LC.realPart(lcOf(a))) : std.re(a);
        },
        im: function (a) {
            return isLC(a) ? fromLC(LC.imagPart(lcOf(a))) : std.im(a);
        },
        conjugate: function (a) {
            return isLC(a) ? fromLC(LC.conj(lcOf(a))) : std.conjugate(a);
        },
        round: function (a) {
            return isLC(a) ? lcRound(lcOf(a)) : std.round(a);
        },
        ceil: function (a) {
            return isLC(a) ? lcCeil(lcOf(a)) : std.ceil(a);
        },
        floor: function (a) {
            return isLC(a) ? lcFloor(lcOf(a)) : std.floor(a);
        },
        mult: function (a, b) {
            return isLC(a, b) ? fromLC(LC.mul(lcOf(a), lcOf(b))) : std.mult(a, b);
        },
        realmult: function (r, c) {
            return isLC(c) ? fromLC(LC.scale(lcOf(c), r, 0)) : std.realmult(r, c);
        },
        abs2: function (a) {
            return isLC(a) ? fromLC(LC.realPart(LC.mul(lcOf(a), LC.conj(lcOf(a))))) : std.abs2(a);
        },
        inv: function (a) {
            return isLC(a) ? fromLC(LC.inv(lcOf(a))) : std.inv(a);
        },
        div: function (a, b) {
            return isLC(a, b) ? fromLC(LC.div(lcOf(a), lcOf(b))) : std.div(a, b);
        },
        snap: function (a) {
            return isLC(a) ? a : std.snap(a);
        },
        exp: function (a) {
            return isLC(a) ? fromLC(LC.exp(lcOf(a))) : std.exp(a);
        },
        cos: function (a) {
            return isLC(a) ? fromLC(LC.cos(lcOf(a))) : std.cos(a);
        },
        sin: function (a) {
            return isLC(a) ? fromLC(LC.sin(lcOf(a))) : std.sin(a);
        },
        arctan2: function (a, b) {
            if (!isLC(a, b)) return std.arctan2(a, b);
            let erg: CSNum;
            if (b === undefined) {
                erg = CSNumber.mult(CSNumber.complex(0, -1), CSNumber.log(CSNumber.div(a, CSNumber.abs(a))));
            } else {
                const z = CSNumber.add(a, CSNumber.mult(CSNumber.complex(0, 1), b));
                const r = CSNumber.sqrt(CSNumber.add(CSNumber.mult(a, a), CSNumber.mult(b, b)));
                erg = CSNumber.mult(CSNumber.complex(0, -1), CSNumber.log(CSNumber.div(z, r)));
            }
            return { ...erg, usage: "Angle" };
        },
        sqrt: function (a) {
            return isLC(a) ? fromLC(LC.sqrt(lcOf(a))) : std.sqrt(a);
        },
        powRealExponent: function (a, b) {
            return isLC(a) ? fromLC(LC.powReal(lcOf(a), b)) : std.powRealExponent(a, b);
        },
        log: function (a) {
            return isLC(a) ? fromLC(LC.log(lcOf(a))) : std.log(a);
        },
        pow: function (a, n) {
            if (!isLC(a, n)) return std.pow(a, n);
            if (CSNumber._helper.isZero(n)) return CSNumber.one;
            if (CSNumber._helper.isZero(a)) return CSNumber.zero;
            if (!n.value.lc && n.value.imag === 0) {
                const nn = n.value.real;
                if (Number.isInteger(nn)) return CSNumber.powIntegerExponent(a, nn);
                return CSNumber.powRealExponent(a, nn);
            }
            return CSNumber.exp(CSNumber.mult(CSNumber.log(a), n));
        },
        mod: function (a, b) {
            return isLC(a, b) ? lcMod(a, b) : std.mod(a, b);
        },
    };

    // List has hand-expanded fast paths that read real and imag directly, which
    // compute NaN on series (see CSNumber.ts). On lists with series these
    // substitutes compute the value generically, through CSNumber.
    const hasLC = (...lists: CSList[]): boolean => lists.some((a) => List._helper.hasLC(a));

    // 1 / (c eps^q) for the leading term c eps^q of m, NaN if that is unknown.
    // Projective scaling only needs a scalar of the right order: this one brings
    // m to order 1 exactly and cheaply, while 1 / m needs a power series. The two
    // differ by a factor 1 + O(eps), so the projective point and the standard
    // part are the same.
    function leadingInverse(m: CSNum): CSNum {
        if (!isLC(m)) return CSNumber.inv(m);
        const s = lcOf(m);
        if (!LC.isValid(s) || s.terms.length === 0) return CSNumber.complex(NaN, NaN);
        const c = s.terms[0];
        const n = c.re * c.re + c.im * c.im;
        return fromLC(LC.monomial(-c.q, c.re / n, -c.im / n));
    }

    const listOps: Record<string, (...args: any[]) => any> = {
        abs2: function (a: CSList) {
            if (!hasLC(a)) return stdList.abs2(a);
            let sum = CSNumber.zero;
            for (const v of a.value)
                sum = CSNumber.add(sum, v.ctype === "number" ? CSNumber.abs2(v as CSNum) : List.abs2(v));
            return sum;
        },
        normSquared: function (a: CSList) {
            if (!hasLC(a)) return stdList.normSquared(a);
            let sum = CSNumber.zero;
            for (const v of a.value) sum = CSNumber.add(sum, CSNumber.abs2(v as CSNum));
            return sum;
        },
        // The standard products compute on real and imaginary parts directly;
        // these go through CSNumber.
        scalproduct: function (a: CSList, b: CSList) {
            if (!hasLC(a, b)) return stdList.scalproduct(a, b);
            if (a.value.length !== b.value.length) return nada;
            let sum = CSNumber.zero;
            for (let i = 0; i < b.value.length; i++) {
                if (a.value[i].ctype !== "number" || b.value[i].ctype !== "number") return nada;
                sum = CSNumber.add(sum, CSNumber.mult(a.value[i] as CSNum, b.value[i] as CSNum));
            }
            return sum;
        },
        productMV: function (a: CSList, b: CSList) {
            if (!hasLC(a, b)) return stdList.productMV(a, b);
            const li = [];
            for (const row of a.value as CSList[]) {
                if (row.ctype !== "list") return nada;
                const v = List.scalproduct(row, b);
                if (v.ctype !== "number") return nada;
                li.push(v);
            }
            return List.turnIntoCSList(li);
        },
        productVM: function (a: CSList, b: CSList) {
            if (!hasLC(a, b)) return stdList.productVM(a, b);
            return List.productMV(List.transpose(b), a);
        },
        productMM: function (a: CSList, b: CSList) {
            if (!hasLC(a, b)) return stdList.productMM(a, b);
            const bt = List.transpose(b);
            const rows = [];
            for (const row of a.value as CSList[]) {
                if (row.ctype !== "list") return nada;
                const r = List.productMV(bt, row);
                if (r.ctype !== "list") return nada;
                rows.push(r);
            }
            return List.turnIntoCSList(rows);
        },
        sesquilinearproduct: function (a: CSList, b: CSList) {
            if (!hasLC(a, b)) return stdList.sesquilinearproduct(a, b);
            let sum = CSNumber.zero;
            for (let i = 0; i < b.value.length; i++)
                sum = CSNumber.add(sum, CSNumber.mult(CSNumber.conjugate(a.value[i] as CSNum), b.value[i] as CSNum));
            return sum;
        },
        // Like the standard version, but scaled by leadingInverse (see there).
        normalizeMax: function (a: CSList) {
            if (!hasLC(a)) return stdList.normalizeMax(a);
            const s = leadingInverse(List.maxval(a));
            if (!CSNumber._helper.isFinite(s)) return a;
            return List.scalmult(s, a);
        },
        // The standard part of a projective quantity (vector or matrix, as a
        // whole): scaled by the largest entry first, so a vector of infinitesimals
        // becomes its limit direction instead of the zero vector. Entries are NaN
        // if that fails. Only exists in the Levi-Civita mode.
        standardPartProjective: function (a: CSList) {
            if (!hasLC(a)) return a;
            return List.standardPart(List.scalmult(leadingInverse(List.maxval(a)), a));
        },
        det3: function (p: CSList, q: CSList, r: CSList) {
            if (!hasLC(p, q, r)) return stdList.det3(p, q, r);
            return List.scalproduct(p, List.cross(q, r));
        },
        det4m: function (m: CSList) {
            if (!hasLC(m)) return stdList.det4m(m);
            // Laplace expansion along the first row
            const rows = m.value as CSList[];
            let det = CSNumber.zero;
            for (let j = 0; j < 4; j++) {
                const minor = [1, 2, 3].map((i) => List.turnIntoCSList(rows[i].value.filter((_, k) => k !== j)));
                const term = CSNumber.mult(rows[0].value[j] as CSNum, List.det3(minor[0], minor[1], minor[2]));
                det = j % 2 === 0 ? CSNumber.add(det, term) : CSNumber.sub(det, term);
            }
            return det;
        },
        adjoint3: function (a: CSList) {
            if (!hasLC(a)) return stdList.adjoint3(a);
            // columns of the adjoint are the cross products of the rows
            const [row1, row2, row3] = a.value;
            return List.transpose(
                List.turnIntoCSList([List.cross(row2, row3), List.cross(row3, row1), List.cross(row1, row2)])
            );
        },
    };

    // Sets the entries of `replacement` on `target`, returns the old ones - on
    // an object that inherits everything else from `target`, so that it serves
    // as the standard implementation while the replacements are in place. An
    // entry `target` does not have is saved as undefined, and an undefined
    // replacement removes the entry, so that restoring leaves nothing behind.
    function substitute<T extends object>(target: T, replacement: Partial<T>): T {
        const saved = Object.create(target) as T;
        for (const key of Object.keys(replacement) as Array<keyof T>) {
            saved[key] = target[key];
            if (replacement[key] === undefined) delete target[key];
            else target[key] = replacement[key] as T[keyof T];
        }
        return saved;
    }

    let depth = 0;

    // Runs fn with CSNumber and List computing on Levi-Civita numbers, and
    // restores the standard implementations afterwards, whatever happens. Nests.
    function withLeviCivita<T>(fn: () => T): T {
        if (depth++ > 0) {
            try {
                return fn();
            } finally {
                depth--;
            }
        }
        const savedNumber = substitute(CSNumber, numberOps);
        const savedHelper = substitute(CSNumber._helper, helperOps);
        const savedList = substitute(List, listOps);
        std = savedNumber;
        stdHelper = savedHelper;
        stdList = savedList;
        try {
            return fn();
        } finally {
            substitute(CSNumber, savedNumber);
            substitute(CSNumber._helper, savedHelper);
            substitute(List, savedList);
            depth--;
        }
    }

    // Whether the mode is active (for tests).
    function inLeviCivitaMode(): boolean {
        return depth > 0;
    }

    return { withLeviCivita, inLeviCivitaMode };
})();

export { withLeviCivita, inLeviCivitaMode };
