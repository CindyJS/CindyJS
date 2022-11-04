import { instanceInvocationArguments, nada } from "expose";
// @ts-expect-error: Not yet typed
import { List } from "libcs/List";
// @ts-expect-error: Not yet typed
import { General } from "libcs/General";

import { CSNum, Nada, CSMath, CSList } from "types";

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

//==========================================
//      Complex Numbers
//==========================================

const CSNumber: CSMath = {
    _helper: {
        roundingfactor: 1e4,
        angleroundingfactor: 1e1,
        niceround: function (a: number, roundingfactor: number) {
            return Math.round(a * roundingfactor) / roundingfactor;
        },
        niceangle: function (a: CSNum): string {
            const unit = angleUnits[angleUnitName];
            if (!unit) return CSNumber.niceprint(General.withUsage(a, undefined));
            // if (typeof unit === "function") return unit(a);
            const num = CSNumber.niceprint(
                CSNumber.realmult(unit * PERTWOPI, a),
                unit > 200 ? CSNumber._helper.angleroundingfactor : undefined
            );
            if (!num.includes("i*")) return num + angleUnit;
            return "(" + num + ")" + angleUnit;
        },

        input: function (a: { r: object; i: object }) {
            if (a.r != undefined || a.i != undefined) return CSNumber.complex(+a.r, +a.i);
            else return CSNumber.real(+a);
        },

        isReal: function (a: CSNum): boolean {
            return a.value.imag === 0;
        },

        isZero: function (a: CSNum): boolean {
            return a.value.real === 0 && a.value.imag === 0;
        },

        isAlmostZero: function (a: CSNum): boolean {
            const r = a.value.real;
            const i = a.value.imag;
            return r < CSNumber.eps && r > -CSNumber.eps && i < CSNumber.eps && i > -CSNumber.eps;
        },

        isAlmostReal: function (a: CSNum): boolean {
            const i = a.value.imag;
            // This implementation follows Cinderella
            return i < CSNumber.epsbig && i > -CSNumber.epsbig;
        },

        isNaN: function (a: CSNum): boolean {
            return isNaN(a.value.real) || isNaN(a.value.imag);
        },

        isFinite: function (z: CSNum): boolean {
            return isFinite(z.value.real) && isFinite(z.value.imag);
        },

        isAlmostImag: function (a: CSNum): boolean {
            const r = a.value.real;
            // This implementation follows Cinderella
            return r < CSNumber.epsbig && r > -CSNumber.epsbig;
        },

        seed: "NO",

        seedrandom: function (a: number) {
            a = a - Math.floor(a);
            a = a * 0.8 + 0.1;
            CSNumber._helper.seed = a;
        },

        rand: function () {
            if (CSNumber._helper.seed === "NO") {
                return Math.random();
            }
            let a = CSNumber._helper.seed;
            a = Math.sin(1000 * a) * 1000;
            a = a - Math.floor(a);
            CSNumber._helper.seed = a;
            return a;
        },

        randnormal: function () {
            const a = CSNumber._helper.rand();
            const b = CSNumber._helper.rand();
            return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
        },

        isEqual: function (a: CSNum, b: CSNum): boolean {
            return a.value.real === b.value.real && a.value.imag === b.value.imag;
        },

        isLessThan: function (a: CSNum, b: CSNum): boolean {
            return a.value.real < b.value.real || (a.value.real === b.value.real && a.value.imag < b.value.imag);
        },

        compare: function (a: CSNum, b: CSNum): number {
            if (CSNumber._helper.isLessThan(a, b)) {
                return -1;
            }
            if (CSNumber._helper.isEqual(a, b)) {
                return 0;
            }
            return 1;
        },

        isAlmostEqual: function (a: CSNum, b: CSNum, preci?: number): boolean {
            let eps = CSNumber.eps;
            if (typeof preci !== "undefined") {
                eps = preci;
            }
            const r = a.value.real - b.value.real;
            const i = a.value.imag - b.value.imag;
            return r < eps && r > -eps && i < eps && i > -eps;
        },

        get z3a() {
            return CSNumber.complex(-0.5, 0.5 * Math.sqrt(3));
        },
        get z3b() {
            return CSNumber.complex(-0.5, -0.5 * Math.sqrt(3));
        },
        get cub1(): CSList {
            return {
                ctype: "list",
                value: [CSNumber.one, CSNumber.one, CSNumber.one],
            };
        },
        get cub2(): CSList {
            return {
                ctype: "list",
                value: [CSNumber._helper.z3a, CSNumber.one, CSNumber._helper.z3b],
            };
        },
        get cub3(): CSList {
            return {
                ctype: "list",
                value: [CSNumber._helper.z3b, CSNumber.one, CSNumber._helper.z3a],
            };
        },

        /* Helps solving the cubic equation ax^3 + bx^2 + cx + d = 0.
         * The returned values are however NOT the solution itself.
         * If this function returns [y1, y2, y3] then the actual solutions are
         * x = z*y1 + y2 + z^2*y3 where z^3 = 1 i.e. z is any of three roots of unity
         */
        solveCubicHelper: function (a: CSNum, b: CSNum, c: CSNum, d: CSNum) {
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

            // return List.turnIntoCSList([CSNumber.complex(xr, xi), CSNumber.complex(yr, yi), CSNumber.complex(zr, zi)]);
            return {
                ctype: "list",
                value: [CSNumber.complex(xr, xi), CSNumber.complex(yr, yi), CSNumber.complex(zr, zi)],
            };
        },

        getRangeRand: function (min: number, max: number) {
            return Math.random() * (max - min) + min;
        },
    },

    niceprint: function (a: CSNum, roundingfactor: number = CSNumber._helper.roundingfactor) {
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
    },

    complex: function (r: number, i: number): CSNum {
        return {
            ctype: "number",
            value: {
                real: r,
                imag: i,
            },
        };
    },

    real: function (r: number): CSNum {
        return {
            ctype: "number",
            value: {
                real: r,
                imag: 0,
            },
        };
    },

    get zero() {
        return CSNumber.real(0);
    },

    get one() {
        return CSNumber.real(1);
    },

    get infinity() {
        return CSNumber.complex(Infinity, Infinity);
    },

    get nan() {
        return CSNumber.complex(NaN, NaN);
    },

    argmax: function (a: CSNum, b: CSNum): CSNum {
        const n1 = a.value.real * a.value.real + a.value.imag * a.value.imag;
        const n2 = b.value.real * b.value.real + b.value.imag * b.value.imag;
        return n1 < n2 ? b : a;
    },

    max: function (a: CSNum, b: CSNum) {
        return {
            ctype: "number",
            value: {
                real: Math.max(a.value.real, b.value.real),
                imag: Math.max(a.value.imag, b.value.imag),
            },
        };
    },

    min: function (a: CSNum, b: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: Math.min(a.value.real, b.value.real),
                imag: Math.min(a.value.imag, b.value.imag),
            },
        };
    },

    add: function (a: CSNum, b: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.real + b.value.real,
                imag: a.value.imag + b.value.imag,
            },
        };
    },

    sub: function (a: CSNum, b: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.real - b.value.real,
                imag: a.value.imag - b.value.imag,
            },
        };
    },

    neg: function (a: CSNum): CSNum {
        return {
            ...a,
            ctype: "number",
            value: {
                real: -a.value.real,
                imag: -a.value.imag,
            },
        };
    },

    re: function (a: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.real,
                imag: 0,
            },
        };
    },

    im: function (a: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.imag,
                imag: 0,
            },
        };
    },

    conjugate: function (a: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.real,
                imag: -a.value.imag,
            },
        };
    },

    round: function (a: CSNum) {
        return {
            ctype: "number",
            value: {
                real: Math.round(a.value.real),
                imag: Math.round(a.value.imag),
            },
        };
    },

    ceil: function (a: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: Math.ceil(a.value.real),
                imag: Math.ceil(a.value.imag),
            },
        };
    },

    floor: function (a: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: Math.floor(a.value.real),
                imag: Math.floor(a.value.imag),
            },
        };
    },

    mult: function (a: CSNum, b: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.real * b.value.real - a.value.imag * b.value.imag,
                imag: a.value.real * b.value.imag + a.value.imag * b.value.real,
            },
        };
    },

    realmult: function (r: number, c: CSNum) {
        return {
            ctype: "number",
            value: {
                real: r * c.value.real,
                imag: r * c.value.imag,
            },
        };
    },

    multiMult: function (arr: Array<CSNum>): Nada | CSNum {
        let erg = arr[0];
        if (erg.ctype !== "number") return nada;
        for (let i = 1; i < arr.length; i++) {
            if (arr[i].ctype !== "number") {
                return nada;
            }
            erg = CSNumber.mult(erg, arr[i]);
        }

        return erg;
    },

    abs2: function (a: CSNum): CSNum {
        return {
            ctype: "number",
            value: {
                real: a.value.real * a.value.real + a.value.imag * a.value.imag,
                imag: 0,
            },
        };
    },

    abs: function (a: CSNum): CSNum {
        return CSNumber.sqrt(CSNumber.abs2(a));
    },

    inv: function (a: CSNum): CSNum {
        const s = a.value.real * a.value.real + a.value.imag * a.value.imag;
        return {
            ctype: "number",
            value: {
                real: a.value.real / s,
                imag: -a.value.imag / s,
            },
        };
    },

    div: function (a: CSNum, b: CSNum) {
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
    },

    eps: 1e-10,
    epsbig: 1e-6,

    snap: function (a: CSNum): CSNum {
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
    },

    exp: function (a: CSNum): CSNum {
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
    },

    cos: function (a: CSNum): CSNum {
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
    },

    sin: function (a: CSNum): CSNum {
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
    },

    tan: function (a: CSNum): CSNum {
        const s = CSNumber.sin(a);
        const c = CSNumber.cos(a);
        return CSNumber.div(s, c);
    },

    arccos: function (a: CSNum): CSNum {
        //OK hässlich aber tuts.
        const t2 = CSNumber.mult(a, CSNumber.neg(a));
        const tmp = CSNumber.sqrt(CSNumber.add(CSNumber.real(1), t2));
        const tmp1 = CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), tmp);
        const erg = CSNumber.add(
            CSNumber.mult(CSNumber.log(tmp1), CSNumber.complex(0, 1)),
            CSNumber.real(Math.PI * 0.5)
        );
        return General.withUsage(erg, "Angle");
    },

    arcsin: function (a: CSNum): CSNum {
        //OK hässlich aber tuts.
        const t2 = CSNumber.mult(a, CSNumber.neg(a));
        const tmp = CSNumber.sqrt(CSNumber.add(CSNumber.real(1), t2));
        const tmp1 = CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), tmp);
        const erg = CSNumber.mult(CSNumber.log(tmp1), CSNumber.complex(0, -1));
        return General.withUsage(erg, "Angle");
    },

    arctan: function (a: CSNum): CSNum {
        //OK hässlich aber tuts.
        const t1 = CSNumber.log(CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, -1)), CSNumber.real(1)));
        const t2 = CSNumber.log(CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), CSNumber.real(1)));
        const erg = CSNumber.mult(CSNumber.sub(t1, t2), CSNumber.complex(0, 0.5));
        return General.withUsage(erg, "Angle");
    },

    arctan2: function (a: CSNum, b: CSNum): CSNum {
        let erg: CSNum;
        if (b === undefined) erg = CSNumber.real(Math.atan2(a.value.imag, a.value.real));
        else if (CSNumber._helper.isReal(a) && CSNumber._helper.isReal(b))
            erg = CSNumber.real(Math.atan2(b.value.real, a.value.real));
        else {
            const z = CSNumber.add(a, CSNumber.mult(CSNumber.complex(0, 1), b));
            const r = CSNumber.sqrt(CSNumber.add(CSNumber.mult(a, a), CSNumber.mult(b, b)));
            erg = CSNumber.mult(CSNumber.complex(0, -1), CSNumber.log(CSNumber.div(z, r)));
        }
        return General.withUsage(erg, "Angle");
    },

    sqrt: function (a: CSNum): CSNum {
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
    },

    powRealExponent: function (a: CSNum, b: number): CSNum {
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
    },

    powIntegerExponent: function (a: CSNum, nn: number): CSNum {
        const n = Math.round(nn);
        if (n < 0) return CSNumber.powIntegerExponent(CSNumber.inv(a), -n);
        if (n === 0) return CSNumber.one;
        if (n % 2 === 0) return CSNumber.powIntegerExponent(CSNumber.mult(a, a), n / 2);
        // must be n % 2 === 1
        return CSNumber.mult(a, CSNumber.powIntegerExponent(CSNumber.mult(a, a), (n - 1) / 2));
    },

    log: function (a: CSNum): CSNum {
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
    },

    pow: function (a: CSNum, n: CSNum): CSNum {
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
    },

    mod: function (a: CSNum, b: CSNum): CSNum {
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
    },
    solveCubic: function (a: CSNum, b: CSNum, c: CSNum, d: CSNum) {
        const help = CSNumber._helper.solveCubicHelper(a, b, c, d);
        return [
            List.scalproduct(CSNumber._helper.cub1, help),
            List.scalproduct(CSNumber._helper.cub2, help),
            List.scalproduct(CSNumber._helper.cub3, help),
        ] as Array<CSNum>;
    },

    getRandReal: function (min: number, max: number) {
        const real = CSNumber._helper.getRangeRand(min, max);
        return CSNumber.real(real);
    },

    getRandComplex: function (min: number, max: number) {
        const real = CSNumber._helper.getRangeRand(min, max);
        const imag = CSNumber._helper.getRangeRand(min, max);
        return CSNumber.complex(real, imag);
    },
};

export { CSNumber, TWOPI };
