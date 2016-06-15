/**
 * @param {Complex} coefficient
 * @param {Monomial} monomial
 * @constructor
 */
function Term(coefficient, monomial) {
    this.coefficient = coefficient;
    this.monomial = monomial;
}

/**
 * @param {Term} a
 * @param {Term} b
 * @return {Term}
 */
Term.add = function(a, b) {
    if (!Monomial.is(a.monomial, b.monomial))
        console.error('Monomials do not match');
    return new Term(Complex.add(a.coefficient, b.coefficient), a.monomial);
};

/** @type {Complex} */
Term.prototype.coefficient = null;

/** @type {Monomial} */
Term.prototype.monomial = null;

/**
 * @param {Term} a
 * @param {Term} b
 * @return {Term}
 */
Term.mul = function(a, b) {
    var monomial = {};
    var oa = a.monomial.value,
        ob = b.monomial.value,
        key;
    for (key in oa) {
        monomial[key] = oa[key] + (ob[key] || 0);
    }
    for (key in ob) {
        monomial[key] = ob[key] + (oa[key] || 0);
    }
    return new Term(Complex.mul(a.coefficient, b.coefficient),
        new Monomial(monomial));
};

/**
 * @param {Term} a
 * @return {Term}
 */
Term.neg = function(a) {
    return new Term(a.coefficient.neg(), a.monomial);
};

/**
 * @param {Array<Term>} terms
 * @return {Array<Term>}
 */
Term.reduce = function(terms) {
    /**
     * @param {Array<Term>} ps
     * @param {Array<Term>} qs
     * @return {Array<Term>}
     */
    function reduce_(ps, qs) {
        if (qs.length === 0)
            return ps;
        else if (qs.length === 1) {
            ps.push(qs[0]);
            return ps;
        } else {
            var q = qs.pop();
            var c = q.coefficient;
            var m = q.monomial;
            var otherTerms = [];
            for (var i = 0, l = qs.length; i < l; i++) {
                if (Monomial.is(m, qs[i].monomial))
                    c = Complex.add(c, qs[i].coefficient);
                else
                    otherTerms.push(qs[i]);
            }
            ps.push(new Term(c, m));
            return reduce_(ps, otherTerms);
        }
    }
    return reduce_([], terms);
};
