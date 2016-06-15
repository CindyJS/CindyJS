/**
 * @param {number} re
 * @param {number} im
 * @constructor
 */
function Complex(re, im) {
    this.re = re;
    this.im = im;
}

/** @return {number} */
Complex.prototype.abs = function() {
    return Math.sqrt(this.abs2());
};

/** @return {number} */
Complex.prototype.abs2 = function() {
    return this.re * this.re + this.im * this.im;
};

/**
 * @param {Complex} a
 * @param {Complex} b
 * @return {Complex}
 */
Complex.add = function(a, b) {
    return new Complex(a.re + b.re, a.im + b.im);
};

/**
 * @param {Complex} b
 * @return {Complex}
 */
Complex.prototype.add = function(b) {
    return Complex.add(this, b);
};

/**
 * @param {Complex} a
 * @param {Complex} b
 * @return {Complex}
 */
Complex.div = function(a, b) {
    var abs2 = b.abs2();
    var re = a.re * b.re + a.im * b.im;
    var im = a.im * b.re - a.re * b.im;
    return new Complex(re / abs2, im / abs2);
};

/** @type {number} */
Complex.prototype.im = 0;

/** @type {Complex} */
Complex.infinity = new Complex(Infinity, Infinity);

/**
 * @param {Complex} z
 * @return {Complex}
 */
Complex.inv = function(z) {
    var abs2 = z.abs2();
    return new Complex(z.re / abs2, -z.im / abs2);
};

/**
 * @param {Complex} z
 *  @return {boolean}
 */
Complex.isZero = function(z) {
    return z.re === 0 && z.im === 0;
};

/**
 * @param {Complex} a
 * @param {Complex} b
 * @return {Complex}
 */
Complex.mul = function(a, b) {
    return new Complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
};

/**
 * @param {Complex} b
 * @return {Complex}
 */
Complex.prototype.mul = function(b) {
    return Complex.mul(this, b);
};

/** @return {Complex} */
Complex.prototype.neg = function() {
    return new Complex(-this.re, -this.im);
};

/** @type {Complex} */
Complex.one = new Complex(1, 0);

/** @type {number} */
Complex.prototype.re = 0;

/**
 * @param {number} re
 * @return {Complex}
 */
Complex.real = function(re) {
    return new Complex(re, 0);
};

/**
 * @param {Complex} z
 * @return {Complex}
 */
Complex.sqrt = function(z) {
    if (Complex.isZero(z))
        return Complex.zero();
    var r = z.abs();
    var s = Math.sign(z.im) || 1;
    return new Complex(Math.sqrt((r + z.re) * 0.5), s * Math.sqrt((r - z.re) *
        0.5));
};

/**
 * @param {Complex} a
 * @param {Complex} b
 * @return {Complex}
 */
Complex.sub = function(a, b) {
    return new Complex(a.re - b.re, a.im - b.im);
};

/** @return {Complex} */
Complex.zero = function() {
    return new Complex(0, 0);
};

/** @return {Complex} */
Complex.prototype.zero = Complex.zero;
