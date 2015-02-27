//==========================================
//      Complex Numbers
//==========================================
var CSNumber = {};
CSNumber.niceprint = function(a) {
    if (a.value.imag === 0) {
        return "" + a.value.real;
    }

    if (a.value.imag > 0) {
        return "" + a.value.real + " + i*" + a.value.imag;
    } else {
        return "" + a.value.real + " - i*" + (-a.value.imag);
    }
};

CSNumber.complex = function(r, i) {
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };
};

CSNumber.real = function(r) {
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': 0
        }
    };
};


CSNumber.clone = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real,
            'imag': a.value.imag
        },
        "usage": a.usage
    };
};


CSNumber.argmax = function(a, b) { //Achtung: Gibt referenzen zurück, da 
    //nur für NormalizeMax verwendet

    var n1 = a.value.real * a.value.real + a.value.imag * a.value.imag;
    var n2 = b.value.real * b.value.real + b.value.imag * b.value.imag;
    return (n1 < n2 ? b : a);

};


CSNumber.max = function(a, b) {
    return {
        "ctype": "number",
        "value": {
            'real': Math.max(a.value.real, b.value.real),
            'imag': Math.max(a.value.imag, b.value.imag)
        }
    };
};


CSNumber.min = function(a, b) {
    return {
        "ctype": "number",
        "value": {
            'real': Math.min(a.value.real, b.value.real),
            'imag': Math.min(a.value.imag, b.value.imag)
        }
    };
};


CSNumber.add = function(a, b) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real + b.value.real,
            'imag': a.value.imag + b.value.imag
        }
    };
};

CSNumber.sub = function(a, b) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real - b.value.real,
            'imag': a.value.imag - b.value.imag
        }
    };
};

CSNumber.neg = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': -a.value.real,
            'imag': -a.value.imag
        }
    };
};


CSNumber.re = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real,
            'imag': 0
        }
    };
};

CSNumber.im = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.imag,
            'imag': 0
        }
    };
};

CSNumber.conjugate = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real,
            'imag': -a.value.imag
        }
    };
};


CSNumber.round = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': Math.round(a.value.real),
            'imag': Math.round(a.value.imag)
        }
    };
};

CSNumber.ceil = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': Math.ceil(a.value.real),
            'imag': Math.ceil(a.value.imag)
        }
    };
};

CSNumber.floor = function(a) {
    return {
        "ctype": "number",
        "value": {
            'real': Math.floor(a.value.real),
            'imag': Math.floor(a.value.imag)
        }
    };
};


CSNumber.mult = function(a, b) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real * b.value.real - a.value.imag * b.value.imag,
            'imag': a.value.real * b.value.imag + a.value.imag * b.value.real
        }
    };
};

CSNumber.multiMult = function(arr) {
    var erg = arr[0];
    if (erg.ctype !== "number") return nada;
    for (var i = 1; i < arr.length; i++) {
        if (arr[i].ctype !== "number") {
            return nada;
        }
        erg = CSNumber.mult(erg, arr[i]);
    }

    return erg;
};

// BUG?
// why do we have two argument but throw away the second argument?
CSNumber.abs2 = function(a, b) {
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real * a.value.real + a.value.imag * a.value.imag,
            'imag': 0
        }
    };
};

CSNumber.abs = function(a1) {
    return CSNumber.sqrt(CSNumber.abs2(a1));
};


CSNumber.inv = function(a) {
    var s = a.value.real * a.value.real + a.value.imag * a.value.imag;
    // BUG?
    // perhaps we should not only check for 0
    // if(Math.abs(s) < 1e32) {
    if (s === 0) {
        console.log("DIVISION BY ZERO");
        //        halt=immediately;

    }
    return {
        "ctype": "number",
        "value": {
            'real': a.value.real / s,
            'imag': -a.value.imag / s
        }
    };
};


CSNumber.div = function(a, b) {
    return CSNumber.mult(a, CSNumber.inv(b));
};


CSNumber.eps = 0.0000001;

CSNumber.snap = function(a) {
    var r = a.value.real;
    var i = a.value.imag;
    if (Math.floor(r + CSNumber.eps) !== Math.floor(r - CSNumber.eps)) {
        r = Math.round(r);
    }
    if (Math.floor(i + CSNumber.eps) !== Math.floor(i - CSNumber.eps)) {
        i = Math.round(i);
    }
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };

};

CSNumber.exp = function(a) {
    var n = Math.exp(a.value.real);
    var r = n * Math.cos(a.value.imag);
    var i = n * Math.sin(a.value.imag);
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };
};

CSNumber.cos = function(a) {
    var rr = a.value.real;
    var ii = a.value.imag;
    var n = Math.exp(ii);
    var imag1 = n * Math.sin(-rr);
    var real1 = n * Math.cos(-rr);
    n = Math.exp(-ii);
    var imag2 = n * Math.sin(rr);
    var real2 = n * Math.cos(rr);
    var i = (imag1 + imag2) / 2.0;
    var r = (real1 + real2) / 2.0;
    //  if (i * i < 1E-30) i = 0;
    //  if (r * r < 1E-30) r = 0;
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };
};

CSNumber.sin = function(a) {
    var rr = a.value.real;
    var ii = a.value.imag;
    var n = Math.exp(ii);
    var imag1 = n * Math.sin(-rr);
    var real1 = n * Math.cos(-rr);
    n = Math.exp(-ii);
    var imag2 = n * Math.sin(rr);
    var real2 = n * Math.cos(rr);
    var r = -(imag1 - imag2) / 2.0;
    var i = (real1 - real2) / 2.0;
    //  if (i * i < 1E-30) i = 0;
    //  if (r * r < 1E-30) r = 0;
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };
};

CSNumber.tan = function(a) {
    var s = CSNumber.sin(a);
    var c = CSNumber.cos(a);
    return CSNumber.div(s, c);
};

CSNumber.arccos = function(a) { //OK hässlich aber tuts.
    var t2 = CSNumber.mult(a, CSNumber.neg(a));
    var tmp = CSNumber.sqrt(CSNumber.add(CSNumber.real(1), t2));
    var tmp1 = CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), tmp);
    var erg = CSNumber.add(CSNumber.mult(CSNumber.log(tmp1), CSNumber.complex(0, 1)), CSNumber.real(Math.PI * 0.5));
    erg.usage = 'angle';
    return erg;
};

CSNumber.arcsin = function(a) { //OK hässlich aber tuts.
    var t2 = CSNumber.mult(a, CSNumber.neg(a));
    var tmp = CSNumber.sqrt(CSNumber.add(CSNumber.real(1), t2));
    var tmp1 = CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), tmp);
    var erg = CSNumber.mult(CSNumber.log(tmp1), CSNumber.complex(0, -1));
    erg.usage = 'angle';
    return erg;
};

CSNumber.arctan = function(a) { //OK hässlich aber tuts.
    var t1 = CSNumber.log(CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, -1)), CSNumber.real(1)));
    var t2 = CSNumber.log(CSNumber.add(CSNumber.mult(a, CSNumber.complex(0, 1)), CSNumber.real(1)));
    var erg = CSNumber.mult(CSNumber.sub(t1, t2), CSNumber.complex(0, 0.5));
    erg.usage = 'angle';
    return erg;
};


//Das ist jetzt genau so wie in Cindy.
//Da wurde das aber niemals voll auf complexe Zahlen umgestellt
//Bei Beiden Baustellen machen!!!
CSNumber.arctan2 = function(a, b) { //OK
    var erg = CSNumber.real(Math.atan2(b.value.real, a.value.real));
    erg.usage = 'angle';
    return erg;
};


CSNumber.sqrt = function(a) {
    var rr = a.value.real;
    var ii = a.value.imag;
    var n = Math.sqrt(Math.sqrt(rr * rr + ii * ii));
    var w = Math.atan2(ii, rr);
    var i = n * Math.sin(w / 2);
    var r = n * Math.cos(w / 2);
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };
};

CSNumber.pow2 = function(a, b) {
    var rr = a.value.real;
    var ii = a.value.imag;
    var n = Math.pow(Math.sqrt(rr * rr + ii * ii), b);
    var w = Math.atan2(ii, rr);
    var i = n * Math.sin(w * b);
    var r = n * Math.cos(w * b);
    return {
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    };
};

CSNumber.log = function(a) {
    var re = a.value.real;
    var im = a.value.imag;
    var s = Math.sqrt(re * re + im * im);
    var i = im;


    var imag = Math.atan2(im, re);
    if (i < 0) {
        imag += (2 * Math.PI);
    }
    if (i === 0 && re < 0) {
        imag = Math.PI;
    }
    if (imag > Math.PI) {
        imag -= (2 * Math.PI);
    }
    var real = Math.log(s);

    return CSNumber.snap({
        "ctype": "number",
        "value": {
            'real': real,
            'imag': imag
        }
    });
};


CSNumber.pow = function(a, b) {

    if (b.value.real === Math.round(b.value.real) && b.value.imag === 0) { //TODO später mal effizienter machen
        var erg = {
            "ctype": "number",
            "value": {
                'real': 1,
                'imag': 0
            }
        };
        for (var i = 0; i < Math.abs(b.value.real); i++) {
            erg = CSNumber.mult(erg, a);
        }
        if (b.value.real < 0) {
            return CSNumber.inv(erg);
        }
        return (erg);

    }
    var res = CSNumber.exp(CSNumber.mult(CSNumber.log(a), b));
    return res;
};


CSNumber.mod = function(a, b) {
    var a1 = a.value.real;
    var a2 = b.value.real;
    var b1 = a.value.imag;
    var b2 = b.value.imag;


    var r = a1 - Math.floor(a1 / a2) * a2;
    var i = b1 - Math.floor(b1 / b2) * b2;
    if (a2 === 0) r = 0;
    if (b2 === 0) i = 0;

    return CSNumber.snap({
        "ctype": "number",
        "value": {
            'real': r,
            'imag': i
        }
    });
};

CSNumber.solveCubic = function(a, b, c, d) {
    return CSNumber._helper.solveCubic(a.value.real, a.value.imag, b.value.real, b.value.imag, c.value.real, c.value.imag, d.value.real, d.value.imag);
};


CSNumber._helper = {};
CSNumber._helper.seed = 'NO';
CSNumber.eps = 0.0000000001;
CSNumber.epsbig = 0.000001;

CSNumber._helper.seedrandom = function(a) {
    a = a - Math.floor(a);
    a = a * 0.8 + 0.1;
    CSNumber._helper.seed = a;
};

CSNumber._helper.rand = function() {
    if (CSNumber._helper.seed === 'NO') {
        return Math.random();
    }
    var a = CSNumber._helper.seed;
    a = Math.sin(1000 * a) * 1000;
    a = a - Math.floor(a);
    CSNumber._helper.seed = a;
    return a;
};

CSNumber._helper.randnormal = function() {
    var a = CSNumber._helper.rand();
    var b = CSNumber._helper.rand();
    return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
};


CSNumber._helper.isEqual = function(a, b) {
    return (a.value.real === b.value.real) && (a.value.imag === b.value.imag);
};

CSNumber._helper.isLessThan = function(a, b) {

    return (a.value.real < b.value.real ||
        (a.value.real === b.value.real && a.value.imag < b.value.imag));
};

CSNumber._helper.compare = function(a, b) {
    if (CSNumber._helper.isLessThan(a, b)) {
        return -1;
    }
    if (CSNumber._helper.isEqual(a, b)) {
        return 0;
    }
    return 1;
};

CSNumber._helper.isAlmostEqual = function(a, b, preci) {
    var eps = CSNumber.eps;
    if (typeof(preci) !== 'undefined') {
        eps = preci;
    }
    var r = a.value.real - b.value.real;
    var i = a.value.imag - b.value.imag;
    return (r < eps) && (r > -eps) && (i < eps) && (i > -eps);
};

CSNumber._helper.isZero = function(a) {
    return (a.value.real === 0) && (a.value.imag === 0);
};

CSNumber._helper.isAlmostZero = function(a) {
    var r = a.value.real;
    var i = a.value.imag;
    return (r < CSNumber.eps) && (r > -CSNumber.eps) && (i < CSNumber.eps) && (i > -CSNumber.eps);
};


CSNumber._helper.isReal = function(a) {
    return (a.value.imag === 0);
};

CSNumber._helper.isAlmostReal = function(a) {
    var i = a.value.imag;
    return (i < CSNumber.epsbig) && (i > -CSNumber.epsbig); //So gemacht wie in Cindy
};

CSNumber._helper.isNaN = function(a) {
    return (isNaN(a.value.real)) || (isNaN(a.value.imag));
};


CSNumber._helper.isAlmostImag = function(a) {
    var r = a.value.real;
    return (r < CSNumber.epsbig) && (r > -CSNumber.epsbig); //So gemacht wie in Cindy
};


CSNumber._helper.solveCubic = function(ar, ai, br, bi, cr, ci, dr, di) {
    // dreist direkt aus dem cinderella2 sourcecode geklaut

    var c1 = 1.25992104989487316476721060727822835057025; //2^(1/3)
    var c2 = 1.58740105196819947475170563927230826039149; //2^(2/3)

    // t1 = (4ac - b^2)

    var acr = ar * cr - ai * ci;
    var aci = ar * ci + ai * cr;

    var t1r = 4 * acr - (br * br - bi * bi);
    var t1i = 4 * aci - 2 * br * bi;

    // ab = ab
    var abr = ar * br - ai * bi;
    var abi = ar * bi + ai * br;

    // t3 = t1 *c - 18 ab * d = (4 ac - b*b)*c - 18 abd
    var t3r = t1r * cr - t1i * ci - 18 * (abr * dr - abi * di);
    var t3i = (t1r * ci + t1i * cr) - 18 * (abr * di + abi * dr);

    // aa = 27  a*a
    var aar = 27 * (ar * ar - ai * ai);
    var aai = 54 * (ai * ar);

    // aad =  aa *d = 27 aad
    var aadr = aar * dr - aai * di;
    var aadi = aar * di + aai * dr;

    // t1 = b^2
    var bbr = br * br - bi * bi;
    var bbi = 2 * br * bi;

    // w = b^3
    var wr = bbr * br - bbi * bi;
    var wi = bbr * bi + bbi * br;

    // t2 = aad + 4w = 27aad + 4bbb
    var t2r = aadr + 4 * wr;
    var t2i = aadi + 4 * wi;

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
    var radius = Math.exp(Math.log(Math.sqrt(wr * wr + wi * wi)) / 3.0);
    var phi = Math.atan2(wi, wr);
    var w1i = radius * Math.sin(phi / 3);
    var w1r = radius * Math.cos(phi / 3);

    radius *= radius;
    phi *= 2;

    var w2i = radius * Math.sin(phi / 3);
    var w2r = radius * Math.cos(phi / 3);

    // x = 2 b^2
    // x = x - 6 ac
    var xr = 2 * bbr - 6 * acr;
    var xi = 2 * bbi - 6 * aci;

    //y.assign(-c2).mul(b).mul(w1);
    var yr = -c2 * (br * w1r - bi * w1i);
    var yi = -c2 * (br * w1i + bi * w1r);

    //    z.assign(c1).mul(w2);
    var zr = c1 * w2r;
    var zi = c1 * w2i;

    //w1.mul(a).mul(3).mul(c2);
    t1r = c2 * 3 * (w1r * ar - w1i * ai);
    t1i = c2 * 3 * (w1r * ai + w1i * ar);

    var s = t1r * t1r + t1i * t1i;

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


    return [CSNumber.complex(xr, xi), CSNumber.complex(yr, yi), CSNumber.complex(zr, zi)];
};
