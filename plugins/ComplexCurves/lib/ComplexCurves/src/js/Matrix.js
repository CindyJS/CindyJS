/**
 * @param {Array<Array<Polynomial>>} m
 * @constructor
 */
function Matrix(m) {
    this.values = m;
}

/**
 * Richard S. Bird
 * A simple division-free algorithm for computing determinants
 * @return {Polynomial}
 */
Matrix.prototype.det = function() {
    var as = this.values;
    var n = as.length;
    if (n === 0)
        console.error('matrix must be non-empty');
    for (var i = 0; i < n; i++)
        if (as[i].length !== n)
            console.error('matrix must be square');
    var a = this;
    for (var j = 1; j < n; j++)
        a = Matrix.mul(Matrix.mu(a), this);
    var d = a.values[0][0];
    return n % 2 === 0 ? d.neg() : d;
};

/**
 * @param {Matrix} x
 * @return {Matrix}
 */
Matrix.mu = function(x) {
    var xs = x.values;
    var zero = xs[0][0].zero();
    var ms = [];
    for (var i = 0, l = xs.length; i < l; i++) {
        ms[i] = [];
        for (var j = 0; j < l; j++) {
            if (j < i) {
                ms[i][j] = zero;
            } else if (j === i) {
                var sum = zero;
                for (var k = j + 1; k < l; k++)
                    sum = sum.add(xs[k][k].neg());
                ms[i][j] = sum;
            } else {
                ms[i][j] = xs[i][j];
            }
        }
    }
    return new Matrix(ms);
};

/**
 * @param {Matrix} a
 * @param {Matrix} b
 * @return {Matrix}
 */
Matrix.mul = function(a, b) {
    var as = a.values,
        bs = b.values;
    if (as[0].length !== bs.length)
        console.error('matrix dimensions must match');
    var cs = [];
    var rows = as.length,
        cols = bs[0].length,
        zero = as[0][0].zero();
    for (var i = 0; i < rows; i++) {
        cs[i] = [];
        for (var j = 0; j < cols; j++) {
            var sum = zero;
            for (var k = 0, l = as[0].length; k < l; k++)
                sum = sum.add(as[i][k].mul(bs[k][j]));
            cs[i][j] = sum;
        }
    }
    return new Matrix(cs);
};

/** @type {Array<Array<Polynomial>>} */
Matrix.prototype.values = null;
