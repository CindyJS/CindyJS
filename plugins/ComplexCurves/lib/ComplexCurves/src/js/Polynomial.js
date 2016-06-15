/**
 * @param {Array<Term>} terms
 * @constructor
 */
function Polynomial(terms) {
    if (terms.length === 0)
        this.terms = [new Term(Complex.zero(), new Monomial({}))];
    else
        this.terms = Term.reduce(terms);
}

/**
 * @param {Polynomial} p
 * @param {Polynomial} q
 * @return {Polynomial}
 */
Polynomial.add = function(p, q) {
    return new Polynomial(Term.reduce(p.terms.concat(q.terms)));
};

/**
 * @param {Polynomial} p
 * @return {Polynomial}
 */
Polynomial.prototype.add = function(p) {
    return Polynomial.add(this, p);
};

/**
 * @param {Complex} z
 * @return {Polynomial}
 */
Polynomial.complex = function(z) {
    return new Polynomial([new Term(z, new Monomial({}))]);
};

/**
 * j-th coefficient of a Polynomial in a given variable
 * @param {string} v
 * @param {number} j
 * @return {Polynomial}
 */
Polynomial.prototype.coefficient = function(v, j) {
    var terms = this.terms;
    var ps = [];
    for (var i = 0, l = terms.length; i < l; i++) {
        var term = terms[i];
        if ((term.monomial.value[v] || 0) === j) {
            var m = Monomial.clone(term.monomial);
            delete m.value[v];
            ps.push(new Term(term.coefficient, m));
        }
    }
    return new Polynomial(ps);
};

/**
 * list of coefficients of a given variable
 * ordered from highest to lowest degree
 * @param {string} v
 * @return {Array<Polynomial>}
 */
Polynomial.prototype.coefficientList = function(v) {
    var n = this.degree(v);
    var cs = [];
    for (var i = 0; i <= n; i++)
        cs[i] = this.coefficient(v, n - i);
    return cs;
};

/**
 * list of coefficients of a univariate polynomial
 * ordered from highest to lowest degree
 * @return {Array<Complex>}
 */
Polynomial.prototype.coefficientList_ = function() {
    var vars = this.variableList();
    var l = vars.length;
    if (l > 1)
        console.error("Polynomial is not univariate");
    var v = l > 0 ? vars[0] : "x";
    var cs = this.coefficientList(v);
    var cs_ = [];
    for (var i = 0, k = cs.length; i < k; i++)
        cs_[i] = cs[i].constant();
    return cs_;
};

/**
 * constant term of Polynomial as number
 * @return {Complex}
 */
Polynomial.prototype.constant = function() {
    var c = Complex.zero();
    var terms = this.terms;
    for (var i = 0, l = terms.length; i < l; i++) {
        var term = terms[i];
        var m = term.monomial.value;
        if (m === null || Object.keys(m).length === 0)
            c = Complex.add(c, term.coefficient);
    }
    return c;
};

/**
 * deflate a Polynomial coefficient list by a monomial x - x0
 * using Horner's method
 * @param {Array<Complex>} cs
 * @param {Complex} x0
 * @return {Array<Complex>}
 */
Polynomial.deflate = function(cs, x0) {
    // deflate (p:ps) x0 = init $ scanl (\y c -> c + x0 * y) p ps
    var fx = [cs[0]];
    for (var i = 1, l = cs.length - 1; i < l; i++)
        fx[i] = Complex.add(cs[i], Complex.mul(fx[i - 1], x0));
    return fx;
};

/**
 * determine the degree of a Polynomial in a given variable
 * @param {string} v
 * @return {number}
 */
Polynomial.prototype.degree = function(v) {
    var n = 0;
    var terms = this.terms;
    for (var i = 0, l = terms.length; i < l; i++)
        n = Math.max(n, terms[i].monomial.value[v] || 0);
    return n;
};

/**
 * @param {string} v
 * @return {Polynomial}
 */
Polynomial.prototype.diff = function(v) {
    var terms = this.terms;
    var ps = [];
    for (var i = 0, l = terms.length; i < l; i++) {
        var m = terms[i].monomial;
        var e = m.value[v] || 0;
        if (e > 0) {
            var c = Complex.mul(terms[i].coefficient, Complex.real(e));
            m = Monomial.clone(m);
            m.value[v] = e - 1;
            ps.push(new Term(c, m));
        }
    }
    return new Polynomial(ps);
};

/**
 * discriminant of a Polynomial w.r.t. a given variable
 * @param {string} v
 * @return {Polynomial}
 */
Polynomial.prototype.discriminant = function(v) {
    return Polynomial.resultant(v, this, this.diff(v));
};

/** @return {boolean} */
Polynomial.prototype.isBivariate = function() {
    return this.variableList().length === 2;
};

/** @return {boolean} */
Polynomial.prototype.isConstant = function() {
    return this.variableList().length === 0 && this.terms.length !== 0;
};

/** @return {boolean} */
Polynomial.prototype.isUnivariate = function() {
    return this.variableList().length === 1;
};

/**
 * approximate one root of a given Polynomial up to given tolerance
 * using at most a given number of Laguerre iterations
 * Polynomial must be given as coefficient list
 * @param {Array<Complex>} cs
 * @param {Complex} x
 * @param {number} maxiter
 * @return {Complex}
 */
Polynomial.laguerre = function(cs, x, maxiter) {
    var n = cs.length - 1;
    var rand = [1.0, 0.3141, 0.5926, 0.5358, 0.9793, 0.2385, 0.6264, 0.3383,
        0.2795, 0.0288
    ];
    var a, p, q, s, g, g2, h, r, d1, d2;
    var tol = 1e-14;
    for (var iter = 1; iter <= maxiter; iter++) {
        s = Complex.zero();
        q = Complex.zero();
        p = cs[0];

        for (var i = 1; i <= n; i++) {
            s = Complex.add(q, Complex.mul(s, x));
            q = Complex.add(p, Complex.mul(q, x));
            p = Complex.add(cs[i], Complex.mul(p, x));
        }

        if (p.abs() < tol)
            return x;

        g = Complex.div(q, p);
        g2 = Complex.mul(g, g);
        h = Complex.sub(g2, Complex.div(Complex.mul(Complex.real(2), s), p));
        r = Complex.sqrt(Complex.mul(Complex.real(n - 1), Complex.sub(
            Complex.mul(Complex.real(n), h), g2)));
        d1 = Complex.add(g, r);
        d2 = Complex.sub(g, r);
        if (d1.abs() < d2.abs())
            d1 = d2;
        if (tol < d1.abs())
            a = Complex.div(Complex.real(n), d1);
        else
            a = Complex.mul(Complex.real(x.abs() + 1), new Complex(Math.cos(
                iter), Math.sin(iter)));
        if (a.abs() < tol)
            return x;
        if (iter % 20 === 0 && iter < maxiter - 19)
            a = Complex.mul(a, Complex.real(rand[Math.floor(iter / 20)]));
        x = Complex.sub(x, a);
    }
    return x;
};

/**
 * leading coefficient of a Polynomial in a given variable
 * @param {string} v
 * @return {Polynomial}
 */
Polynomial.prototype.leading = function(v) {
    return this.coefficient(v, this.degree(v));
};

/**
 * @param {Polynomial} p
 * @param {Polynomial} q
 * @return {Polynomial}
 */
Polynomial.mul = function(p, q) {
    var ps = p.terms,
        qs = q.terms;
    var terms = [];
    for (var i = 0, l = ps.length; i < l; i++)
        for (var j = 0, k = qs.length; j < k; j++)
            terms.push(Term.mul(ps[i], qs[j]));
    return new Polynomial(Term.reduce(terms));
};

/**
 * @param {Polynomial} p
 * @return {Polynomial}
 */
Polynomial.prototype.mul = function(p) {
    return Polynomial.mul(this, p);
};

/** @return {Polynomial} */
Polynomial.prototype.neg = function() {
    var terms = this.terms;
    var ts = [];
    for (var i = 0, l = terms.length; i < l; i++)
        ts.push(Term.neg(terms[i]));
    return new Polynomial(ts);
};

/**
 * @param {Polynomial} p
 * @param {number} e
 * @return {Polynomial}
 */
Polynomial.pow = function(p, e) {
    var res = Polynomial.real(1);
    if (!Number.isInteger(e))
        console.error("Non-integer power of Polynomial!");
    // TODO use fast exponentiation
    for (var i = e; i > 0; i--)
        res = Polynomial.mul(res, p);
    return res;
};

/**
 * @param {number} e
 * @return {Polynomial}
 */
Polynomial.prototype.pow = function(e) {
    return Polynomial.pow(this, e);
};

/**
 * @param {Array<Complex>} cs
 * @return {Array<Complex>}
 */
Polynomial.quadratic_roots = function(cs) {
    var a = cs[0],
        b = cs[1],
        c = cs[2];
    if (c.re === 0 && c.im === 0)
        return [Complex.zero(), Complex.div(b, a).neg()];
    var r = Complex.sqrt(Complex.sub(Complex.mul(b, b),
        Complex.mul(Complex.real(4), Complex.mul(a, c))));
    if (b.re >= 0)
        r = r.neg();
    return [Complex.div(Complex.sub(r, b), Complex.mul(Complex.real(2), a)),
        Complex.div(Complex.mul(Complex.real(2), c), Complex.sub(r, b))
    ];
};

/**
 * @param {number} x
 * @return {Polynomial}
 */
Polynomial.real = function(x) {
    return new Polynomial([new Term(Complex.real(x), new Monomial({}))]);
};

/**
 * @param {string} v
 * @param {Polynomial} p
 * @param {Polynomial} q
 * @return {Polynomial}
 */
Polynomial.resultant = function(v, p, q) {
    var syl = /** @type {Matrix<Polynomial>} */ (Polynomial.sylvester(v, p, q));
    return syl.det();
};

/**
 * @param {Array<Complex>} cs
 * @return {Array<Complex>}
 */
Polynomial.roots = function(cs) {
    var roots = [];
    var cs_orig = cs;
    var n = cs.length - 1;
    if (n <= 0)
        return [];
    if (Complex.isZero(cs[0])) {
        roots = Polynomial.roots(cs.slice(1));
        roots.push(Complex.infinity);
        return roots;
    }
    if (n === 1)
        roots[0] = Complex.div(cs[1], cs[0]).neg();
    else if (n === 2)
        roots = Polynomial.quadratic_roots(cs);
    else {
        for (var i = 0; i < n - 2; i++) {
            roots[i] = Polynomial.laguerre(cs, Complex.zero(), 200);
            roots[i] = Polynomial.laguerre(cs_orig, roots[i], 1);
            cs = Polynomial.deflate(cs, roots[i]);
        }
        var qroots = Polynomial.quadratic_roots(cs);
        roots[n - 2] = qroots[0];
        roots[n - 1] = qroots[1];
    }
    return roots; // TODO sort?
};

/**
 * @param {Polynomial} p
 * @param {Polynomial} q
 * @return {Polynomial}
 */
Polynomial.sub = function(p, q) {
    return Polynomial.add(p, q.neg());
};

/**
 * @param {Polynomial} p
 * @return {Polynomial}
 */
Polynomial.prototype.sub = function(p) {
    return Polynomial.sub(this, p);
};

/**
 * @param {string} v
 * @param {Polynomial} p
 * @param {Polynomial} q
 * @return {Matrix}
 */
Polynomial.sylvester = function(v, p, q) {
    var m = p.degree(v);
    var n = q.degree(v);
    var p_ = p.coefficientList(v);
    var q_ = q.coefficientList(v);
    var ms = [];

    /**
     * @param {number} n
     * @return {Array<Polynomial>}
     */
    function zeros(n) {
        var zs = [];
        for (var i = 0; i < n; i++)
            zs[i] = Polynomial.zero();
        return zs;
    }

    /**
     * @param {Array<Polynomial>} f
     * @param {number} i
     * @return {Array<Polynomial>}
     */
    function shift(f, i) {
        return zeros(i).concat(f).concat(zeros(m + n - f.length - i));
    }
    for (var i = 0; i < n; i++)
        ms.push(shift(p_, i));
    for (var j = 0; j < m; j++)
        ms.push(shift(q_, j));
    return new Matrix(ms);
};

/** @type {Array<Term>} */
Polynomial.prototype.terms = null;

/**
 * @param {string} v
 * @return {Polynomial}
 */
Polynomial.variable = function(v) {
    var m = {};
    m[v] = 1;
    return new Polynomial([new Term(Complex.one, new Monomial(m))]);
};

/** @return {Array<string>} */
Polynomial.prototype.variableList = function() {
    var terms = this.terms;
    var vars = [];
    var hasVar = {};
    for (var i = 0, l = terms.length; i < l; i++) {
        var m = terms[i].monomial.value;
        for (var key in m) {
            if (!hasVar[key]) {
                vars.push(key);
                hasVar[key] = true;
            }
        }
    }
    vars.sort();
    return vars;
};

/** @return {Polynomial} */
Polynomial.zero = function() {
    return new Polynomial([]);
};

/** @return {Polynomial} */
Polynomial.prototype.zero = Polynomial.zero;
