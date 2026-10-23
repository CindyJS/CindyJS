// Levi-Civita numbers: truncated series  sum_k c_k * eps^q_k + O(eps^big)  with
// complex coefficients c_k and real exponents q_0 < q_1 < ... < big, where eps
// is a positive infinitesimal. They form an ordered (for real coefficients)
// field extension of the reals that contains infinitesimals (q_0 > 0) and
// infinite numbers (q_0 < 0). That lets us evaluate a construction "infinitely
// close" to a degenerate configuration and read off the limit as the standard
// part of the result.
//
// The O(eps^big) term records how far the series is known: exact values have
// big = Infinity, and every operation that has to cut an infinite expansion
// short (inversion, exp, ...) or that loses leading terms to cancellation
// lowers it accordingly. So the terms that are present are always correct, and
// a series whose known terms all cancelled says so (no terms, finite big)
// instead of presenting rounding garbage from the tail as its leading term.
//
// A series with a NaN coefficient is "invalid", the Levi-Civita counterpart of
// NaN (e.g. the result of dividing by zero).
//
// Everything here is pure: no module state. Series are never modified in
// place. The implementation sits inside a function because the sources are
// concatenated into one scope: its many short helper names (exp, add,
// compare, ...) must not clash with those of other files.

export interface LCTerm {
    q: number;
    re: number;
    im: number;
    // The magnitude of the summands the coefficient was computed from, if it
    // is larger than the coefficient's own (after cancellation): its rounding
    // noise is relative to that, not to the coefficient (see CANCEL_TOL).
    s?: number;
}

export interface LCSeries {
    terms: LCTerm[];
    big: number;
}

const LC = (function () {
    // How many orders of eps beyond the leading term a truncated expansion keeps.
    // Every degenerate operation in a construction (e.g. a cross product of two
    // infinitely close points) cancels the leading orders of its inputs, so this
    // bounds how deeply nested degeneracies can be resolved.
    const PRECISION = 12;

    // Hard cap on the number of terms, for series with many distinct exponents.
    const MAX_TERMS = 40;

    // Exponents are sums of small rationals like 1, 2, 1/2; treat those that agree
    // to this tolerance as the same exponent.
    const Q_TOL = 1e-9;

    // When two coefficients of the same exponent are added, a result this small
    // relative to the summands is rounding noise, not a genuine value. Without this,
    // cancellation in the standard part (e.g. the cross product of two equal points)
    // would leave a spurious 1e-17 * eps^0 term that hides the infinitesimal part.
    const CANCEL_TOL = 1e-12;

    // The same, relative to the summands of earlier operations, whose
    // cancellation left smaller coefficients behind, with the absolute rounding
    // noise of those summands (see LCTerm.s): a few roundings of them, and much
    // less than CANCEL_TOL, since a genuine coefficient can be that small after
    // several cancellations (the circle through three points at distances d
    // has coefficients of the order d^2 relative to them).
    const SCALE_TOL = 1e-14;

    function invalid(): LCSeries {
        return { terms: [{ q: 0, re: NaN, im: NaN }], big: Infinity };
    }

    const ZERO: LCSeries = Object.freeze({ terms: Object.freeze([]) as unknown as LCTerm[], big: Infinity });

    // ------------------------------------------------------------------------
    // Construction and inspection

    function fromComplex(re: number, im: number): LCSeries {
        if (re !== re || im !== im) return invalid();
        if (re === 0 && im === 0) return ZERO;
        return { terms: [{ q: 0, re, im }], big: Infinity };
    }

    // c * eps^q
    function monomial(q: number, re: number, im = 0): LCSeries {
        if (re === 0 && im === 0) return ZERO;
        return { terms: [{ q, re, im }], big: Infinity };
    }

    function isValid(a: LCSeries): boolean {
        for (const t of a.terms) {
            if (!(isFinite(t.re) && isFinite(t.im) && isFinite(t.q))) return false;
        }
        return a.big === a.big;
    }

    // Exactly zero. A series whose known terms all cancelled is not zero, it is
    // indeterminate (see isDeterminate).
    function isZero(a: LCSeries): boolean {
        return a.terms.length === 0 && a.big === Infinity;
    }

    // Whether the leading term is known: false for O(eps^big) with no terms.
    function isDeterminate(a: LCSeries): boolean {
        return a.terms.length > 0 || a.big === Infinity;
    }

    // True if the series is an ordinary complex number.
    function isStandard(a: LCSeries): boolean {
        if (a.big !== Infinity) return false;
        return a.terms.length === 0 || (a.terms.length === 1 && Math.abs(a.terms[0].q) <= Q_TOL);
    }

    function isReal(a: LCSeries): boolean {
        return a.terms.every((t) => t.im === 0);
    }

    // The exponent of the leading term: > 0 infinitesimal, < 0 infinite. For an
    // indeterminate series this is the known lower bound.
    function order(a: LCSeries): number {
        return a.terms.length === 0 ? a.big : a.terms[0].q;
    }

    // The standard part (the "limit") of a finite series. Infinite series map to
    // complex infinity, like CSNumber.infinity; invalid or indeterminate ones to NaN.
    function standardPart(a: LCSeries): { re: number; im: number } {
        if (!isValid(a)) return { re: NaN, im: NaN };
        if (a.terms.length === 0) return a.big > Q_TOL ? { re: 0, im: 0 } : { re: NaN, im: NaN };
        const t = a.terms[0];
        if (t.q < -Q_TOL) return { re: Infinity, im: Infinity };
        if (t.q > Q_TOL) return { re: 0, im: 0 };
        return { re: t.re, im: t.im };
    }

    // ------------------------------------------------------------------------
    // Normalization

    // The magnitude a term's rounding noise is relative to (see LCTerm.s).
    function scaleOf(t: LCTerm): number {
        return t.s === undefined ? magnitude(t.re, t.im) : t.s;
    }

    // |re + i im|; Math.hypot is much slower, and only needed where the squares
    // would overflow or underflow.
    function magnitude(re: number, im: number): number {
        const s = re * re + im * im;
        return s < 1e300 && s > 1e-300 ? Math.sqrt(s) : Math.hypot(re, im);
    }

    // The indices of `terms` by increasing exponent, stable. Term lists are
    // short, so insertion sort beats Array.prototype.sort with a comparator.
    function sortedByExponent(terms: LCTerm[]): number[] {
        const n = terms.length;
        const idx = new Array<number>(n);
        for (let i = 0; i < n; i++) idx[i] = i;
        if (n > 32) return idx.sort((i, j) => terms[i].q - terms[j].q);
        for (let i = 1; i < n; i++) {
            const k = idx[i];
            const q = terms[k].q;
            let j = i - 1;
            while (j >= 0 && terms[idx[j]].q > q) {
                idx[j + 1] = idx[j];
                j--;
            }
            idx[j + 1] = k;
        }
        return idx;
    }

    // Sort, merge equal exponents, drop zeros and everything at or beyond `big`.
    // `parts` holds, per term, the sum of the absolute values of everything that
    // was added into it, so cancellation can be judged relative to the summands,
    // and `scales` the same for their scales (see LCTerm.s).
    function tidy(terms: LCTerm[], big: number, parts?: number[], scales?: number[]): LCSeries {
        const idx = sortedByExponent(terms);
        const n = idx.length;
        const out: LCTerm[] = [];
        let bad = false;
        let k = 0;
        while (k < n) {
            // the terms whose exponent agrees with the first one's
            const first = terms[idx[k]];
            const q = first.q;
            let re = 0;
            let im = 0;
            let sum = 0;
            let scale = 0;
            do {
                const i = idx[k++];
                const t = terms[i];
                re += t.re;
                im += t.im;
                sum += parts ? parts[i] : magnitude(t.re, t.im);
                scale += scales ? scales[i] : scaleOf(t);
            } while (k < n && q === q && Math.abs(terms[idx[k]].q - q) <= Q_TOL);
            if (q !== q || q >= big - Q_TOL) continue;
            const mag = magnitude(re, im);
            // NaN, or an infinite coefficient: not a Levi-Civita number
            if (mag !== mag || mag === Infinity || sum === Infinity) bad = true;
            if (mag !== 0 && mag > CANCEL_TOL * sum && mag > SCALE_TOL * scale)
                out.push(scale > mag ? { q, re, im, s: scale } : { q, re, im });
        }
        if (bad) return invalid();
        if (out.length > MAX_TERMS) {
            big = out[MAX_TERMS].q;
            out.length = MAX_TERMS;
        }
        return { terms: out, big };
    }

    // Whether re + i im, a sum of summands whose magnitudes add up to `size`, is
    // rounding noise (see CANCEL_TOL); for sums of standard numbers.
    function isCancellation(re: number, im: number, size: number): boolean {
        return magnitude(re, im) <= CANCEL_TOL * size;
    }

    // ------------------------------------------------------------------------
    // Field operations

    function add(a: LCSeries, b: LCSeries): LCSeries {
        if (isZero(a)) return b;
        if (isZero(b)) return a;
        return tidy(a.terms.concat(b.terms), Math.min(a.big, b.big));
    }

    function neg(a: LCSeries): LCSeries {
        return { terms: a.terms.map((t) => withScale(t, { q: t.q, re: -t.re, im: -t.im }, 1)), big: a.big };
    }

    // `to`, with the scale of `from` (if it has one) times `factor`
    function withScale(from: LCTerm, to: LCTerm, factor: number): LCTerm {
        if (from.s !== undefined) to.s = from.s * factor;
        return to;
    }

    function sub(a: LCSeries, b: LCSeries): LCSeries {
        return add(a, neg(b));
    }

    function scale(a: LCSeries, re: number, im: number): LCSeries {
        if (re !== re || im !== im) return invalid();
        if (re === 0 && im === 0) return ZERO;
        return {
            terms: a.terms.map((t) =>
                withScale(t, { q: t.q, re: t.re * re - t.im * im, im: t.re * im + t.im * re }, magnitude(re, im))
            ),
            big: a.big,
        };
    }

    function mul(a: LCSeries, b: LCSeries): LCSeries {
        if (!isValid(a) || !isValid(b)) return invalid();
        if (isZero(a) || isZero(b)) return ZERO;
        // (A + O(eps^ba)) (B + O(eps^bb)) = AB + O(eps^(ba + ord B)) + O(eps^(bb + ord A))
        const big = Math.min(a.big + order(b), b.big + order(a));
        const terms: LCTerm[] = [];
        const parts: number[] = [];
        const scales: number[] = [];
        const bMag = b.terms.map((t) => magnitude(t.re, t.im));
        const bScale = b.terms.map(scaleOf);
        for (const s of a.terms) {
            const sMag = magnitude(s.re, s.im);
            const sScale = scaleOf(s);
            for (let j = 0; j < b.terms.length; j++) {
                const t = b.terms[j];
                if (s.q + t.q >= big - Q_TOL) continue;
                terms.push({ q: s.q + t.q, re: s.re * t.re - s.im * t.im, im: s.re * t.im + s.im * t.re });
                // the noise of a product: |s| noise(t) + noise(s) |t|, to first order
                parts.push(sMag * bMag[j]);
                scales.push(sMag * bScale[j] + sScale * bMag[j] - sMag * bMag[j]);
            }
        }
        return tidy(terms, big, parts, scales);
    }

    function shift(a: LCSeries, dq: number): LCSeries {
        if (dq === 0) return a;
        return { terms: a.terms.map((t) => withScale(t, { q: t.q + dq, re: t.re, im: t.im }, 1)), big: a.big + dq };
    }

    // Split a = c * eps^q * (1 + eta) with eta infinitesimal (relative precision
    // carried in eta.big). Requires a determinate, nonzero a.
    function splitLeading(a: LCSeries): { c: LCTerm; eta: LCSeries } {
        const c = a.terms[0];
        const s = c.re * c.re + c.im * c.im;
        const ire = c.re / s;
        const iim = -c.im / s;
        const terms: LCTerm[] = [];
        for (let k = 1; k < a.terms.length; k++) {
            const t = a.terms[k];
            terms.push(
                withScale(
                    t,
                    { q: t.q - c.q, re: t.re * ire - t.im * iim, im: t.re * iim + t.im * ire },
                    1 / Math.sqrt(s)
                )
            );
        }
        return { c, eta: { terms, big: a.big - c.q } };
    }

    // sum_n coeffs(n) * eta^n for an infinitesimal eta, to relative order
    // min(eta.big, PRECISION): eta^n has order n * ord(eta), so only finitely many
    // powers contribute.
    function powerSeries(eta: LCSeries, coeffs: (n: number) => { re: number; im: number }): LCSeries {
        const horizon = Math.min(eta.big, PRECISION);
        const c0 = coeffs(0);
        // eta = O(eps^big) without known terms (or exactly 0): f(1 + eta) = f(1) + O(eps^big)
        if (eta.terms.length === 0) return tidy([{ q: 0, re: c0.re, im: c0.im }], eta.big);
        const h = eta.terms[0].q;
        let sum: LCSeries = tidy([{ q: 0, re: c0.re, im: c0.im }], horizon);
        let pow: LCSeries = { terms: [{ q: 0, re: 1, im: 0 }], big: horizon };
        for (let n = 1; n * h < horizon - Q_TOL; n++) {
            pow = mul(pow, eta);
            pow = { terms: pow.terms.filter((t) => t.q < horizon - Q_TOL), big: Math.min(pow.big, horizon) };
            const c = coeffs(n);
            sum = add(sum, scale(pow, c.re, c.im));
        }
        return { terms: sum.terms, big: Math.min(sum.big, horizon) };
    }

    function inv(a: LCSeries): LCSeries {
        if (!isValid(a) || !isDeterminate(a) || isZero(a)) return invalid();
        const { c, eta } = splitLeading(a);
        // 1/(1+eta) = sum (-eta)^n
        const series = powerSeries(eta, (n) => ({ re: n % 2 === 0 ? 1 : -1, im: 0 }));
        const s = c.re * c.re + c.im * c.im;
        return shift(scale(series, c.re / s, -c.im / s), -c.q);
    }

    function div(a: LCSeries, b: LCSeries): LCSeries {
        return mul(a, inv(b));
    }

    function conj(a: LCSeries): LCSeries {
        return { terms: a.terms.map((t) => withScale(t, { q: t.q, re: t.re, im: -t.im }, 1)), big: a.big };
    }

    function realPart(a: LCSeries): LCSeries {
        return tidy(
            a.terms.map((t) => ({ q: t.q, re: t.re, im: 0 })),
            a.big
        );
    }

    function imagPart(a: LCSeries): LCSeries {
        return tidy(
            a.terms.map((t) => ({ q: t.q, re: t.im, im: 0 })),
            a.big
        );
    }

    // ------------------------------------------------------------------------
    // Ordering

    // Sign of a real series: the sign of its leading coefficient (0 if unknown).
    function sign(a: LCSeries): number {
        if (a.terms.length === 0) return 0;
        const re = a.terms[0].re;
        return re > 0 ? 1 : re < 0 ? -1 : 0;
    }

    // Lexicographic order on (real part, imaginary part), matching
    // CSNumber._helper.isLessThan for standard numbers.
    function compare(a: LCSeries, b: LCSeries): number {
        const d = sub(a, b);
        const r = sign(realPart(d));
        if (r !== 0) return r;
        return sign(imagPart(d));
    }

    // Compare absolute values: a lower leading exponent means a larger number.
    function compareMagnitude(a: LCSeries, b: LCSeries): number {
        if (isZero(a) || isZero(b)) return isZero(a) ? (isZero(b) ? 0 : -1) : 1;
        const qa = order(a);
        const qb = order(b);
        if (Math.abs(qa - qb) > Q_TOL) return qa < qb ? 1 : -1;
        if (!isDeterminate(a) || !isDeterminate(b)) return isDeterminate(a) ? 1 : isDeterminate(b) ? -1 : 0;
        const ma = Math.hypot(a.terms[0].re, a.terms[0].im);
        const mb = Math.hypot(b.terms[0].re, b.terms[0].im);
        return ma > mb ? 1 : ma < mb ? -1 : 0;
    }

    // ------------------------------------------------------------------------
    // Elementary functions
    //
    // For a finite a = s + eta (standard part s, infinitesimal part eta) an analytic
    // f has f(a) = sum_n f^(n)(s)/n! * eta^n, which converges in the Levi-Civita
    // sense. The standard part is evaluated in ordinary floating point, so there is
    // no accuracy loss compared to CSNumber.

    function splitStandard(a: LCSeries): { s: { re: number; im: number }; eta: LCSeries } | null {
        if (!isValid(a) || a.big <= Q_TOL) return null;
        if (a.terms.length > 0 && a.terms[0].q < -Q_TOL) return null; // infinite
        const s = standardPart(a);
        const eta = { terms: a.terms.filter((t) => t.q > Q_TOL), big: a.big };
        return { s, eta };
    }

    function taylor(a: LCSeries, deriv: (n: number) => { re: number; im: number }): LCSeries {
        const sp = splitStandard(a);
        if (!sp) return invalid();
        let fact = 1;
        return powerSeries(sp.eta, (n) => {
            if (n > 0) fact *= n;
            const d = deriv(n);
            return { re: d.re / fact, im: d.im / fact };
        });
    }

    function exp(a: LCSeries): LCSeries {
        const s = standardPart(a);
        const n = Math.exp(s.re);
        const e = { re: n * Math.cos(s.im), im: n * Math.sin(s.im) };
        return taylor(a, () => e);
    }

    // sin(s+eta) and cos(s+eta) from the derivatives of sin/cos at s.
    function trig(a: LCSeries, cosine: boolean): LCSeries {
        const { re, im } = standardPart(a);
        // sin(z) = sin(re)cosh(im) + i cos(re)sinh(im), cos(z) = cos(re)cosh(im) - i sin(re)sinh(im)
        const sinz = { re: Math.sin(re) * Math.cosh(im), im: Math.cos(re) * Math.sinh(im) };
        const cosz = { re: Math.cos(re) * Math.cosh(im), im: -Math.sin(re) * Math.sinh(im) };
        const msin = { re: -sinz.re, im: -sinz.im };
        const mcos = { re: -cosz.re, im: -cosz.im };
        // derivatives of sin: sin, cos, -sin, -cos, ...; of cos: cos, -sin, -cos, sin
        const cycle = cosine ? [cosz, msin, mcos, sinz] : [sinz, cosz, msin, mcos];
        return taylor(a, (n) => cycle[n % 4]);
    }

    function sin(a: LCSeries): LCSeries {
        return trig(a, false);
    }

    function cos(a: LCSeries): LCSeries {
        return trig(a, true);
    }

    // The argument of the leading coefficient c of a, in (-pi, pi]. On the
    // negative real axis the next term with an imaginary part decides the side:
    // -1 - i*eps lies just below the branch cut, so its argument is -pi.
    function leadingArg(a: LCSeries): number {
        const c = a.terms[0];
        if (c.im !== 0 || c.re >= 0) return Math.atan2(c.im, c.re);
        for (let k = 1; k < a.terms.length; k++) {
            const t = a.terms[k];
            // imaginary parts that are rounding noise of a real coefficient do not count
            if (Math.abs(t.im) > CANCEL_TOL * Math.abs(t.re)) return t.im < 0 ? -Math.PI : Math.PI;
        }
        return Math.PI;
    }

    // Principal logarithm, with the branch conventions of CSNumber.log. Only
    // defined for numbers that are neither infinitesimal nor infinite.
    function log(a: LCSeries): LCSeries {
        if (!isValid(a) || a.terms.length === 0) return invalid();
        if (Math.abs(a.terms[0].q) > Q_TOL) return invalid();
        const { c, eta } = splitLeading(a);
        const arg = leadingArg(a);
        // log(1+eta) = sum_{n>=1} (-1)^(n+1) eta^n / n
        const series = powerSeries(eta, (n) => ({ re: n === 0 ? 0 : (n % 2 === 1 ? 1 : -1) / n, im: 0 }));
        return add(fromComplex(Math.log(Math.hypot(c.re, c.im)), arg), series);
    }

    // a^p for a real exponent p, principal branch: c^p * eps^(p q) * (1+eta)^p.
    function powReal(a: LCSeries, p: number): LCSeries {
        if (!isValid(a) || p !== p) return invalid();
        if (p === 0) return fromComplex(1, 0);
        if (isZero(a)) return p > 0 ? ZERO : invalid();
        if (!isDeterminate(a)) return p > 0 ? { terms: [], big: a.big * p } : invalid();
        const { c, eta } = splitLeading(a);
        const r = Math.pow(Math.hypot(c.re, c.im), p);
        const w = leadingArg(a) * p;
        // binomial series (1+eta)^p = sum binom(p, n) eta^n
        let binom = 1;
        const series = powerSeries(eta, (n) => {
            if (n > 0) binom = (binom * (p - n + 1)) / n;
            return { re: binom, im: 0 };
        });
        return shift(scale(series, r * Math.cos(w), r * Math.sin(w)), c.q * p);
    }

    function sqrt(a: LCSeries): LCSeries {
        return powReal(a, 0.5);
    }

    // ------------------------------------------------------------------------
    // Printing

    function niceprint(a: LCSeries, roundingfactor = 1e4): string {
        if (!isValid(a)) return "NaN";
        const round = (x: number) => Math.round(x * roundingfactor) / roundingfactor;
        const power = (q: number) => {
            const r = Math.round(q * 1e6) / 1e6;
            return r === 1 ? "eps" : "eps^" + (r < 0 ? "(" + r + ")" : r);
        };
        let out = "";
        for (const t of a.terms) {
            const re = round(t.re);
            const im = round(t.im);
            if (re === 0 && im === 0) continue;
            let coeff: string;
            let negative = false;
            if (im === 0) {
                negative = re < 0;
                coeff = "" + Math.abs(re);
            } else if (re === 0) {
                negative = im < 0;
                coeff = "i*" + Math.abs(im);
            } else {
                coeff = "(" + re + (im > 0 ? " + i*" : " - i*") + Math.abs(im) + ")";
            }
            const atZero = Math.abs(t.q) <= Q_TOL;
            const body = atZero ? coeff : coeff === "1" ? power(t.q) : coeff + "*" + power(t.q);
            if (out === "") out = negative ? "-" + body : body;
            else out += (negative ? " - " : " + ") + body;
        }
        if (a.big !== Infinity) out += (out === "" ? "" : " + ") + "O(" + power(a.big) + ")";
        return out === "" ? "0" : out;
    }

    return {
        ZERO,
        fromComplex,
        monomial,
        isValid,
        isZero,
        isDeterminate,
        isStandard,
        isReal,
        order,
        standardPart,
        isCancellation,
        add,
        neg,
        sub,
        scale,
        mul,
        inv,
        div,
        shift,
        conj,
        realPart,
        imagPart,
        sign,
        compare,
        compareMagnitude,
        exp,
        log,
        sin,
        cos,
        powReal,
        sqrt,
        niceprint,
    };
})();

export { LC };
