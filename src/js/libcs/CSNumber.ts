// @ts-expect-error: Not yet typed
import { instanceInvocationArguments, nada } from "expose";
// @ts-expect-error: Not yet typed
import { List } from "libcs/List";
// @ts-expect-error: Not yet typed
import { General } from "libcs/General";

import { CindyNumber, Nada } from "types";

//==========================================
//      Complex Numbers
//==========================================
const CSNumber: Record<string, any> = {};
CSNumber._helper = {};
CSNumber._helper.roundingfactor = 1e4;
CSNumber._helper.angleroundingfactor = 1e1;

CSNumber._helper.niceround = function(a: number, roundingfactor: number) {
        return Math.round(a * roundingfactor) / roundingfactor;
};

CSNumber.niceprint = function(a: CindyNumber, roundingfactor: number) {
        roundingfactor = roundingfactor || CSNumber._helper.roundingfactor;
        if (a.usage === "Angle") {
                return CSNumber._helper.niceangle(a);
        }
        const real = CSNumber._helper.niceround(a.value.real, roundingfactor);
        const imag = CSNumber._helper.niceround(a.value.imag, roundingfactor);
        if (imag === 0) {
                return "" + real;
        }

        if (imag > 0) {
                return "" + real + " + i*" + imag;
        } else {
                return "" + real + " - i*" + -imag;
        }
};

const angleUnit = instanceInvocationArguments.angleUnit || "°";
const TWOPI = Math.PI * 2;
const PERTWOPI = 1 / TWOPI;
const angleUnits = {
        rad: TWOPI,
        "°": 360,
        deg: 360,
        degree: 360,
        gra: 400,
        grad: 400,
        turn: 1,
        cyc: 1,
        rev: 1,
        rot: 1,
        π: 2,
        pi: 2,
        quad: 4,
};

type AngleUnit = keyof typeof angleUnits;
const angleUnitName = angleUnit.replace(/\s+/g, "") as AngleUnit; // unit may contain space


CSNumber._helper.niceangle = function(a: CindyNumber): string {
        const unit = angleUnits[angleUnitName];
        if (!unit) return CSNumber.niceprint(General.withUsage(a, null));
        // if (typeof unit === "function") return unit(a);
        const num = CSNumber.niceprint(
                CSNumber.realmult(unit * PERTWOPI, a),
                unit > 200 ? CSNumber._helper.angleroundingfactor : null
        );
        if (!num.includes("i*")) return num + angleUnit;
        return "(" + num + ")" + angleUnit;
};

CSNumber.complex = function(r: number, i: number): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.real = function(r: number): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: 0,
                },
        };
};

CSNumber.zero = CSNumber.real(0);

CSNumber.one = CSNumber.real(1);

CSNumber.infinity = CSNumber.complex(Infinity, Infinity);

CSNumber.nan = CSNumber.complex(NaN, NaN);

CSNumber._helper.input = function(a: { r: object; i: object }) {
        if (a.r != undefined || a.i != undefined) return CSNumber.complex(+a.r, +a.i);
        else return CSNumber.real(+a);
};

CSNumber.argmax = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        const n1 = a.value.real * a.value.real + a.value.imag * a.value.imag;
        const n2 = b.value.real * b.value.real + b.value.imag * b.value.imag;
        return n1 < n2 ? b : a;
};

CSNumber.max = function(a: CindyNumber, b: CindyNumber) {
        return {
                ctype: "number",
                value: {
                        real: Math.max(a.value.real, b.value.real),
                        imag: Math.max(a.value.imag, b.value.imag),
                },
        };
};

CSNumber.min = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: Math.min(a.value.real, b.value.real),
                        imag: Math.min(a.value.imag, b.value.imag),
                },
        };
};

CSNumber.add = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.real + b.value.real,
                        imag: a.value.imag + b.value.imag,
                },
        };
};

CSNumber.sub = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.real - b.value.real,
                        imag: a.value.imag - b.value.imag,
                },
        };
};

CSNumber.neg = function(a: CindyNumber): CindyNumber {
        return {
                ...a,
                ctype: "number",
                value: {
                        real: -a.value.real,
                        imag: -a.value.imag,
                },
        };
};

CSNumber.re = function(a: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.real,
                        imag: 0,
                },
        };
};

CSNumber.im = function(a: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.imag,
                        imag: 0,
                },
        };
};

CSNumber.conjugate = function(a: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.real,
                        imag: -a.value.imag,
                },
        };
};

CSNumber.round = function(a: CindyNumber) {
        return {
                ctype: "number",
                value: {
                        real: Math.round(a.value.real),
                        imag: Math.round(a.value.imag),
                },
        };
};

CSNumber.ceil = function(a: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: Math.ceil(a.value.real),
                        imag: Math.ceil(a.value.imag),
                },
        };
};

CSNumber.floor = function(a: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: Math.floor(a.value.real),
                        imag: Math.floor(a.value.imag),
                },
        };
};

CSNumber.mult = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.real * b.value.real - a.value.imag * b.value.imag,
                        imag: a.value.real * b.value.imag + a.value.imag * b.value.real,
                },
        };
};

CSNumber.realmult = function(r: number, c: CindyNumber) {
        return {
                ctype: "number",
                value: {
                        real: r * c.value.real,
                        imag: r * c.value.imag,
                },
        };
};

CSNumber.multiMult = function(arr: Array<CindyNumber>): Nada | CindyNumber {
        let erg = arr[0];
        if (erg.ctype !== "number") return nada;
        for (let i = 1; i < arr.length; i++) {
                if (arr[i].ctype !== "number") {
                        return nada;
                }
                erg = CSNumber.mult(erg, arr[i]);
        }

        return erg;
};

CSNumber.abs2 = function(a: CindyNumber): CindyNumber {
        return {
                ctype: "number",
                value: {
                        real: a.value.real * a.value.real + a.value.imag * a.value.imag,
                        imag: 0,
                },
        };
};

CSNumber.abs = function(a: CindyNumber): CindyNumber {
        return CSNumber.sqrt(CSNumber.abs2(a));
};

CSNumber.inv = function(a: CindyNumber): CindyNumber {
        const s = a.value.real * a.value.real + a.value.imag * a.value.imag;
        return {
                ctype: "number",
                value: {
                        real: a.value.real / s,
                        imag: -a.value.imag / s,
                },
        };
};

CSNumber.div = function(a: CindyNumber, b: CindyNumber) {
        const ar = a.value.real;
        const ai = a.value.imag;
        const br = b.value.real;
        const bi = b.value.imag;
        const s = br * br + bi * bi;
        return {
                ctype: "number",
                value: {
                        real: (ar * br + ai * bi) / s,
                        imag: (ai * br - ar * bi) / s,
                },
        };
};

CSNumber.eps = 1e-10;
CSNumber.epsbig = 1e-6;

CSNumber.snap = function(a: CindyNumber): CindyNumber {
        let r = a.value.real;
        let i = a.value.imag;
        if (Math.floor(r + CSNumber.eps) !== Math.floor(r - CSNumber.eps)) {
                r = Math.round(r);
        }
        if (Math.floor(i + CSNumber.eps) !== Math.floor(i - CSNumber.eps)) {
                i = Math.round(i);
        }
        return {
                ...a,
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.exp = function(a: CindyNumber): CindyNumber {
        const n = Math.exp(a.value.real);
        const r = n * Math.cos(a.value.imag);
        const i = n * Math.sin(a.value.imag);
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.cos = function(a: CindyNumber): CindyNumber {
        const rr = a.value.real;
        const ii = a.value.imag;
        let n = Math.exp(ii);
        const imag1 = n * Math.sin(-rr);
        const real1 = n * Math.cos(-rr);
        n = Math.exp(-ii);
        const imag2 = n * Math.sin(rr);
        const real2 = n * Math.cos(rr);
        const i = (imag1 + imag2) / 2.0;
        const r = (real1 + real2) / 2.0;
        //  if (i * i < 1E-30) i = 0;
        //  if (r * r < 1E-30) r = 0;
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.sin = function(a: CindyNumber): CindyNumber {
        const rr = a.value.real;
        const ii = a.value.imag;
        let n = Math.exp(ii);
        const imag1 = n * Math.sin(-rr);
        const real1 = n * Math.cos(-rr);
        n = Math.exp(-ii);
        const imag2 = n * Math.sin(rr);
        const real2 = n * Math.cos(rr);
        const r = -(imag1 - imag2) / 2.0;
        const i = (real1 - real2) / 2.0;
        //  if (i * i < 1E-30) i = 0;
        //  if (r * r < 1E-30) r = 0;
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.tan = function(a: CindyNumber): CindyNumber {
        const s = CSNumber.sin(a);
        const c = CSNumber.cos(a);
        return CSNumber.div(s, c);
};

CSNumber.arccos = function(a: CindyNumber): CindyNumber {
        //OK hässlich aber tuts.
        const t2 = CSNumber.mult(a, CSNumber.neg(a));
        const tmp = CSNumber.sqrt(CSNumber.add(CSNumber.real(1), t2));
        const tmp1 = CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), tmp);
        const erg = CSNumber.add(CSNumber.mult(CSNumber.log(tmp1), CSNumber.complex(0, 1)), CSNumber.real(Math.PI * 0.5));
        return General.withUsage(erg, "Angle");
};

CSNumber.arcsin = function(a: CindyNumber): CindyNumber {
        //OK hässlich aber tuts.
        const t2 = CSNumber.mult(a, CSNumber.neg(a));
        const tmp = CSNumber.sqrt(CSNumber.add(CSNumber.real(1), t2));
        const tmp1 = CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), tmp);
        const erg = CSNumber.mult(CSNumber.log(tmp1), CSNumber.complex(0, -1));
        return General.withUsage(erg, "Angle");
};

CSNumber.arctan = function(a: CindyNumber): CindyNumber {
        //OK hässlich aber tuts.
        const t1 = CSNumber.log(CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, -1)), CSNumber.real(1)));
        const t2 = CSNumber.log(CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), CSNumber.real(1)));
        const erg = CSNumber.mult(CSNumber.sub(t1, t2), CSNumber.complex(0, 0.5));
        return General.withUsage(erg, "Angle");
};

CSNumber.arctan2 = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        let erg;
        if (b === undefined) erg = CSNumber.real(Math.atan2(a.value.imag, a.value.real));
        else if (CSNumber._helper.isReal(a) && CSNumber._helper.isReal(b))
                erg = CSNumber.real(Math.atan2(b.value.real, a.value.real));
        else {
                const z = CSNumber.add(a, CSNumber.mult(CSNumber.complex(0, 1), b));
                const r = CSNumber.sqrt(CSNumber.add(CSNumber.mult(a, a), CSNumber.mult(b, b)));
                erg = CSNumber.mult(CSNumber.complex(0, -1), CSNumber.log(CSNumber.div(z, r)));
        }
        return General.withUsage(erg, "Angle");
};

CSNumber.sqrt = function(a: CindyNumber): CindyNumber {
        const rr = a.value.real;
        const ii = a.value.imag;
        const n = Math.sqrt(Math.sqrt(rr * rr + ii * ii));
        const w = Math.atan2(ii, rr);
        const i = n * Math.sin(w / 2);
        const r = n * Math.cos(w / 2);
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.powRealExponent = function(a: CindyNumber, b: number): CindyNumber {
        const rr = a.value.real;
        const ii = a.value.imag;
        const n = Math.sqrt(rr * rr + ii * ii) ** b;
        const w = Math.atan2(ii, rr);
        const i = n * Math.sin(w * b);
        const r = n * Math.cos(w * b);
        return {
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        };
};

CSNumber.powIntegerExponent = function(a: CindyNumber, n: number) {
        if (n < 0) return CSNumber.powIntegerExponent(CSNumber.inv(a), -n);
        if (n === 0) return CSNumber.one;
        if (n % 2 === 0) return CSNumber.powIntegerExponent(CSNumber.mult(a, a), n / 2);
        if (n % 2 === 1) return CSNumber.mult(a, CSNumber.powIntegerExponent(CSNumber.mult(a, a), (n - 1) / 2));
        // should never happen
        return nada;
};

CSNumber.log = function(a: CindyNumber): CindyNumber {
        const re = a.value.real;
        const im = a.value.imag;
        const s = Math.sqrt(re * re + im * im);
        const i = im;

        let imag = Math.atan2(im, re);
        if (i < 0) {
                imag += 2 * Math.PI;
        }
        if (i === 0 && re < 0) {
                imag = Math.PI;
        }
        if (imag > Math.PI) {
                imag -= 2 * Math.PI;
        }
        const real = Math.log(s);

        return CSNumber.snap({
                ctype: "number",
                value: {
                        real,
                        imag,
                },
        });
};

CSNumber.pow = function(a: CindyNumber, n: CindyNumber): CindyNumber {
        if (CSNumber._helper.isZero(n)) return CSNumber.one;
        if (CSNumber._helper.isZero(a)) return CSNumber.zero;
        if ([a, n].every(CSNumber._helper.isReal)) {
                return CSNumber.real(a.value.real ** n.value.real);
        }
        if (CSNumber._helper.isReal(n)) {
                const nn = n.value.real;
                if (Number.isInteger(nn)) {
                        return CSNumber.powIntegerExponent(a, nn);
                }

                return CSNumber.powRealExponent(a, nn);
        }
        return CSNumber.exp(CSNumber.mult(CSNumber.log(a), n));
};

CSNumber.mod = function(a: CindyNumber, b: CindyNumber): CindyNumber {
        const a1 = a.value.real;
        const a2 = b.value.real;
        const b1 = a.value.imag;
        const b2 = b.value.imag;

        let r = a1 - Math.floor(a1 / a2) * a2;
        let i = b1 - Math.floor(b1 / b2) * b2;
        if (a2 === 0) r = 0;
        if (b2 === 0) i = 0;

        return CSNumber.snap({
                ...([a, b].every((x) => x.usage === "Angle") && { usage: "Angle" }),
                ctype: "number",
                value: {
                        real: r,
                        imag: i,
                },
        });
};

CSNumber._helper.seed = "NO";

CSNumber._helper.seedrandom = function(a: number) {
        a = a - Math.floor(a);
        a = a * 0.8 + 0.1;
        CSNumber._helper.seed = a;
};

CSNumber._helper.rand = function() {
        if (CSNumber._helper.seed === "NO") {
                return Math.random();
        }
        let a = CSNumber._helper.seed;
        a = Math.sin(1000 * a) * 1000;
        a = a - Math.floor(a);
        CSNumber._helper.seed = a;
        return a;
};

CSNumber._helper.randnormal = function() {
        const a = CSNumber._helper.rand();
        const b = CSNumber._helper.rand();
        return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
};

CSNumber._helper.isEqual = function(a: CindyNumber, b: CindyNumber): boolean {
        return a.value.real === b.value.real && a.value.imag === b.value.imag;
};

CSNumber._helper.isLessThan = function(a: CindyNumber, b: CindyNumber): boolean {
        return a.value.real < b.value.real || (a.value.real === b.value.real && a.value.imag < b.value.imag);
};

CSNumber._helper.compare = function(a: CindyNumber, b: CindyNumber): number {
        if (CSNumber._helper.isLessThan(a, b)) {
                return -1;
        }
        if (CSNumber._helper.isEqual(a, b)) {
                return 0;
        }
        return 1;
};

CSNumber._helper.isAlmostEqual = function(a: CindyNumber, b: CindyNumber, preci: number): boolean {
        let eps = CSNumber.eps;
        if (typeof preci !== "undefined") {
                eps = preci;
        }
        const r = a.value.real - b.value.real;
        const i = a.value.imag - b.value.imag;
        return r < eps && r > -eps && i < eps && i > -eps;
};

CSNumber._helper.isZero = function(a: CindyNumber): boolean {
        return a.value.real === 0 && a.value.imag === 0;
};

CSNumber._helper.isAlmostZero = function(a: CindyNumber): boolean {
        const r = a.value.real;
        const i = a.value.imag;
        return r < CSNumber.eps && r > -CSNumber.eps && i < CSNumber.eps && i > -CSNumber.eps;
};

CSNumber._helper.isReal = function(a: CindyNumber): boolean {
        return a.value.imag === 0;
};

CSNumber._helper.isAlmostReal = function(a: CindyNumber): boolean {
        const i = a.value.imag;
        // This implementation follows Cinderella
        return i < CSNumber.epsbig && i > -CSNumber.epsbig;
};

CSNumber._helper.isNaN = function(a: CindyNumber): boolean {
        return isNaN(a.value.real) || isNaN(a.value.imag);
};

CSNumber._helper.isFinite = function(z: CindyNumber): boolean {
        return isFinite(z.value.real) && isFinite(z.value.imag);
};

CSNumber._helper.isAlmostImag = function(a: CindyNumber): boolean {
        const r = a.value.real;
        // This implementation follows Cinderella
        return r < CSNumber.epsbig && r > -CSNumber.epsbig;
};

CSNumber._helper.z3a = CSNumber.complex(-0.5, 0.5 * Math.sqrt(3));
CSNumber._helper.z3b = CSNumber.complex(-0.5, -0.5 * Math.sqrt(3));
CSNumber._helper.cub1 = {
        ctype: "list",
        value: [CSNumber.one, CSNumber.one, CSNumber.one],
};
CSNumber._helper.cub2 = {
        ctype: "list",
        value: [CSNumber._helper.z3a, CSNumber.one, CSNumber._helper.z3b],
};
CSNumber._helper.cub3 = {
        ctype: "list",
        value: [CSNumber._helper.z3b, CSNumber.one, CSNumber._helper.z3a],
};

/* Solve the cubic equation ax^3 + bx^2 + cx + d = 0.
 * The result is a JavaScript array of three complex numbers satisfying that equation.
 */
CSNumber.solveCubic = function(a: CindyNumber, b: CindyNumber, c: CindyNumber, d: CindyNumber) {
        const help = CSNumber._helper.solveCubicHelper(a, b, c, d);
        return [
                List.scalproduct(CSNumber._helper.cub1, help),
                List.scalproduct(CSNumber._helper.cub2, help),
                List.scalproduct(CSNumber._helper.cub3, help),
        ];
};

/* Helps solving the cubic equation ax^3 + bx^2 + cx + d = 0.
 * The returned values are however NOT the solution itself.
 * If this function returns [y1, y2, y3] then the actual solutions are
 * x = z*y1 + y2 + z^2*y3 where z^3 = 1 i.e. z is any of three roots of unity
 */
CSNumber._helper.solveCubicHelper = function(a: CindyNumber, b: CindyNumber, c: CindyNumber, d: CindyNumber) {
        // mostly adapted from the cinderella2 source code

        const ar = a.value.real;
        const ai = a.value.imag;
        const br = b.value.real;
        const bi = b.value.imag;
        const cr = c.value.real;
        const ci = c.value.imag;
        const dr = d.value.real;
        const di = d.value.imag;

        const c1 = 1.2599210498948732; //2^(1/3)
        const c2 = 1.5874010519681994; //2^(2/3) 

        // t1 = (4ac - b^2)

        const acr = ar * cr - ai * ci;
        const aci = ar * ci + ai * cr;

        let t1r = 4 * acr - (br * br - bi * bi);
        let t1i = 4 * aci - 2 * br * bi;

        // ab = ab
        const abr = ar * br - ai * bi;
        const abi = ar * bi + ai * br;

        // t3 = t1 *c - 18 ab * d = (4 ac - b*b)*c - 18 abd
        const t3r = t1r * cr - t1i * ci - 18 * (abr * dr - abi * di);
        const t3i = t1r * ci + t1i * cr - 18 * (abr * di + abi * dr);

        // aa = 27  a*a
        const aar = 27 * (ar * ar - ai * ai);
        const aai = 54 * (ai * ar);

        // aad =  aa *d = 27 aad
        const aadr = aar * dr - aai * di;
        const aadi = aar * di + aai * dr;

        // t1 = b^2
        const bbr = br * br - bi * bi;
        const bbi = 2 * br * bi;

        // w = b^3
        let wr = bbr * br - bbi * bi;
        let wi = bbr * bi + bbi * br;

        // t2 = aad + 4w = 27aad + 4bbb
        let t2r = aadr + 4 * wr;
        let t2i = aadi + 4 * wi;

        // t1 = 27 *(t3 * c + t2 *d)
        t1r = t3r * cr - t3i * ci + t2r * dr - t2i * di;
        t1i = t3r * ci + t3i * cr + t2r * di + t2i * dr;

        // DIS OK!!

        // w = -2 b^3
        wr *= -2;
        wi *= -2;

        // w = w + 9 a b c
        wr += 9 * (abr * cr - abi * ci);
        wi += 9 * (abr * ci + abi * cr);

        // w = w + -27 a*a d
        wr -= aadr;
        wi -= aadi;

        // t1 = (27 dis).Sqrt()
        t1r *= 27;
        t1i *= 27;
        t2r = Math.sqrt(Math.sqrt(t1r * t1r + t1i * t1i));
        t2i = Math.atan2(t1i, t1r);
        t1i = t2r * Math.sin(t2i / 2);
        t1r = t2r * Math.cos(t2i / 2);

        // w = w + a * dis // sqrt war schon oben
        wr += t1r * ar - t1i * ai;
        wi += t1r * ai + t1i * ar;

        // w ausgerechnet. Jetz w1 und w2
        //     w1.assign(wr,wi);
        //     w2.assign(wr,wi);
        //     w1.sqrt1_3();
        //     w2.sqrt2_3();
        let radius = Math.exp(Math.log(Math.sqrt(wr * wr + wi * wi)) / 3.0);
        let phi = Math.atan2(wi, wr);
        const w1i = radius * Math.sin(phi / 3);
        const w1r = radius * Math.cos(phi / 3);

        radius *= radius;
        phi *= 2;

        const w2i = radius * Math.sin(phi / 3);
        const w2r = radius * Math.cos(phi / 3);

        // x = 2 b^2
        // x = x - 6 ac
        let xr = 2 * bbr - 6 * acr;
        let xi = 2 * bbi - 6 * aci;

        //y.assign(-c2).mul(b).mul(w1);
        let yr = -c2 * (br * w1r - bi * w1i);
        let yi = -c2 * (br * w1i + bi * w1r);

        //    z.assign(c1).mul(w2);
        let zr = c1 * w2r;
        let zi = c1 * w2i;

        //w1.mul(a).mul(3).mul(c2);
        t1r = c2 * 3 * (w1r * ar - w1i * ai);
        t1i = c2 * 3 * (w1r * ai + w1i * ar);

        const s = t1r * t1r + t1i * t1i;

        t2r = (xr * t1r + xi * t1i) / s;
        t2i = (-xr * t1i + xi * t1r) / s;
        xr = t2r;
        xi = t2i;

        t2r = (yr * t1r + yi * t1i) / s;
        t2i = (-yr * t1i + yi * t1r) / s;
        yr = t2r;
        yi = t2i;

        t2r = (zr * t1r + zi * t1i) / s;
        t2i = (-zr * t1i + zi * t1r) / s;
        zr = t2r;
        zi = t2i;

        return List.turnIntoCSList([CSNumber.complex(xr, xi), CSNumber.complex(yr, yi), CSNumber.complex(zr, zi)]);
};

CSNumber._helper.getRangeRand = function(min: number, max: number) {
        return Math.random() * (max - min) + min;
};

CSNumber.getRandReal = function(min: number, max: number) {
        const real = CSNumber._helper.getRangeRand(min, max);
        return CSNumber.real(real);
};

CSNumber.getRandComplex = function(min: number, max: number) {
        const real = CSNumber._helper.getRangeRand(min, max);
        const imag = CSNumber._helper.getRangeRand(min, max);
        return CSNumber.complex(real, imag);
};

export { CSNumber, TWOPI }
