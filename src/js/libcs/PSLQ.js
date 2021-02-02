class PSLQMatrix {
    // overloaded constructor
    constructor(m) {
        if (m) {
            this._e = [];
            this._e[0] = m[0][0];
            this._e[1] = m[1][0];
            this._e[2] = m[2][0];
            this._e[3] = m[0][1];
            this._e[4] = m[1][1];
            this._e[5] = m[2][1];
            this._e[6] = m[0][2];
            this._e[7] = m[1][2];
            this._e[8] = m[2][2];
        } else {
            this._e = [1, 0, 0, 0, 1, 0, 0, 0, 1];
        }
    }

    clone() {
        let coeff = [...this._e];
        let mat = new PSLQMatrix();
        mat.set(coeff);
        return mat;
    }

    get(idx) {
        return this._e[idx];
    }

    getRow(i) {
        let _e = this._e;
        return [_e[i], _e[3 + i], _e[6 + i]];
    }

    // overloaded
    // 1-ary set internal matrix _e with i
    // 2-ary set index i to value
    set(i, value) {
        if (arguments.length === 1) this._e = i;
        if (arguments.length === 2) this._e[i] = value;
    }

    // swap values in internal matrix
    exchange(idx1, idx2) {
        [this._e[idx1], this._e[idx2]] = [this._e[idx2], this._e[idx1]];
    }

    inverse() {
        let e = this._e;
        let det =
            -e[2] * e[4] * e[6] +
            e[1] * e[5] * e[6] +
            e[2] * e[3] * e[7] -
            e[0] * e[5] * e[7] -
            e[1] * e[3] * e[8] +
            e[0] * e[4] * e[8];

        let res = [
            -e[4] * e[7] + e[4] * e[8],
            e[5] * e[6] - e[3] * e[8],
            -e[4] * e[6] + e[3] * e[7],
            e[2] * e[7] - e[1] * e[8],
            -e[2] * e[6] + e[0] * e[8],
            e[1] * e[6] - e[0] * e[7],
            -e[2] * e[4] + e[1] * e[5],
            e[2] * e[3] - e[0] * e[5],
            -e[1] * e[3] + e[0] * e[4],
        ];

        if (Math.abs(det) < 1e-10) {
            console.log("PSLQ: inverting singular matrix!");
        }
        this._e = res.map((el) => el / det);
        return this;
    }

    swRow(a, b) {
        let offset = 0;
        while (offset < 9) {
            this.exchange(offset + a, offset + b);
            offset += 3;
        }
    }

    swCol(a, b) {
        for (let i = 0; i < 3; ++i) this.exchange(3 * a + i, 3 * b + i);
    }

    static mult(A, B, C) {
        let res = [
            A.get(0) * B.get(0) + A.get(3) * B.get(1) + A.get(6) * B.get(2),
            A.get(1) * B.get(0) + A.get(4) * B.get(1) + A.get(7) * B.get(2),
            A.get(2) * B.get(0) + A.get(5) * B.get(1) + A.get(8) * B.get(2),

            A.get(0) * B.get(3) + A.get(3) * B.get(4) + A.get(6) * B.get(5),
            A.get(1) * B.get(3) + A.get(4) * B.get(4) + A.get(7) * B.get(5),
            A.get(2) * B.get(3) + A.get(5) * B.get(4) + A.get(8) * B.get(5),

            A.get(0) * B.get(6) + A.get(3) * B.get(7) + A.get(6) * B.get(8),
            A.get(1) * B.get(6) + A.get(4) * B.get(7) + A.get(7) * B.get(8),
            A.get(2) * B.get(6) + A.get(5) * B.get(7) + A.get(8) * B.get(8),
        ];

        C.set(res);
    }

    getString() {
        let e = this._e;
        return (
            "/" +
            e[0] +
            "\t " +
            e[3] +
            "\t " +
            e[6] +
            "\\\n" +
            "|" +
            e[1] +
            "\t " +
            e[4] +
            "\t " +
            e[7] +
            "|\n" +
            "\\" +
            e[2] +
            "\t " +
            e[5] +
            "\t " +
            e[8] +
            "/\n"
        );
    }

    transpose() {
        this.exchange(1, 3);
        this.exchange(2, 6);
        this.exchange(5, 7);
        return this;
    }

    // v * M = u
    static VMmult(v, M, u) {
        u[0] = M.get(0) * v[0] + M.get(1) * v[1] + M.get(2) * v[2];
        u[1] = M.get(3) * v[0] + M.get(4) * v[1] + M.get(5) * v[2];
        u[2] = M.get(6) * v[0] + M.get(7) * v[1] + M.get(8) * v[2];
    }
}

class PSLQ {
    // real scalar product
    static dot(a, b) {
        let res = 0;
        for (let i = 0; i < a.length; i++) {
            res += a[i] * b[i];
        }
        return res;
    }

    // scale
    static scale(vec, c) {
        for (let i = 0; i < vec.length; ++i) vec[i] *= c;
    }

    static maxIndex(v) {
        let i = 0;
        for (let j = 1; j < v.length; ++j) {
            if (v[j] > v[i]) i = j;
        }
        return i;
    }

    static get MAX_ITER() {
        return 20;
    }

    static get GAMMA() {
        return 2 / Math.sqrt(3);
    }

    //    Hermite reduction of a 3x2 Matrix
    // 	  H is modified in place!
    static hermiteReduce(H) {
        let D = [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0],
        ];

        let n = H.length;

        // Clone H2
        let H2 = H.map((a) => [...a]);

        let q;
        for (let i = 1; i < n; i++) {
            for (let j = i - 1; j >= 0; j--) {
                q = Math.round(H[i][j] / H[j][j]);

                for (let k = 0; k <= j; k++) {
                    H2[i][k] -= q * H2[j][k];
                }
                for (let k = 0; k < n; k++) D[i][k] -= q * D[j][k];
            }
        }

        // copy back H2 to H
        for (let i = 0; i < 3; i++) {
            H[i] = H2[i];
        }

        return new PSLQMatrix(D);
    }

    //  PSLQ Algorithm
    //  Solve a_0*inx_0 + a_1*inx_1 + ... + a_n-1*inx_n-1=0
    //  only for n = 3
    //
    //  @param inx  Vector[x_0, x_1, ..., x_n-1]
    //  @param prec Floating point precision
    //  @return Vektor [a_0, a_1, ..., a_n-1], if converged undefined otherwise

    static doPSLQ(inx, prec) {
        var n = inx.length;

        // Initialize
        let x = [];
        let s = [];

        for (let k = 0; k < n; ++k) {
            x[k] = inx[k] / Math.sqrt(PSLQ.dot(inx, inx));

            let rdx = 0;
            for (let j = k; j < n; ++j) rdx += Math.pow(inx[j], 2);
            s[k] = Math.sqrt(rdx);
        }
        PSLQ.scale(s, 1 / s[0]);

        let A = new PSLQMatrix();
        let B = new PSLQMatrix();

        let H = [];
        for (let i = 0; i < n; i++) H[i] = [];

        for (let i = 0; i < n; ++i) {
            for (let j = 0; j < n - 1; ++j) {
                if (i > j) {
                    H[i][j] = (-x[i] * x[j]) / s[j] / s[j + 1];
                } else if (i === j) {
                    H[i][j] = s[i + 1] / s[i];
                } else {
                    H[i][j] = 0;
                }
            }
        }

        // Reduce H
        let D = PSLQ.hermiteReduce(H);
        let Dinv = D.clone().inverse().transpose();

        // Update
        PSLQMatrix.VMmult(x, Dinv, x);
        PSLQMatrix.mult(D, A, A);
        PSLQMatrix.mult(B, Dinv, B);

        //var gen2DArrays = (m,n) => [...Array(m)].map(x => Array(n));
        var gen2DArrays = function (m, n) {
            let arr = new Array(m);
            for (let i = 0; i < n; i++) arr[i] = [];
            return arr;
        };
        // Main Iteration
        for (let iter = 0; iter < PSLQ.MAX_ITER; ++iter) {
            // Step One (nur 3x3)
            let tr = [H[0][0], H[1][1]];
            let r = 0;
            if (Math.pow(this.GAMMA, 2) * Math.abs(tr[1]) > Math.pow(this.GAMMA, 1) * Math.abs(tr[0])) r = 1;

            let alpha = 0,
                beta = 0,
                lamda = 0,
                delta = 0;
            if (r < n - 2) {
                alpha = H[r][r];
                beta = H[r + 1][r];
                lamda = H[r + 1][r + 1];
                delta = Math.sqrt(Math.pow(beta, 2) + Math.pow(lamda, 2));
            }

            // swap row r with r + 1 in x, H, A and B
            let t = x[r];
            x[r] = x[r + 1];
            x[r + 1] = t;

            let zr = [...H[r]];
            H[r] = H[r + 1];
            H[r + 1] = zr;

            A.swRow(r, r + 1);
            B.swCol(r, r + 1);

            // Step Two (T => Table)
            let T = gen2DArrays(2, 3);
            if (r < n - 2) {
                for (let i = 0; i < n - 1; ++i) {
                    for (let j = 0; j < n - 1; ++j) {
                        if (i === r && j === r) T[i][j] = beta / delta;
                        else if (i === r && j === r + 1) T[i][j] = -lamda / delta;
                        else if (i === r + 1 && j === r) T[i][j] = lamda / delta;
                        else if (i === r + 1 && j === r + 1) T[i][j] = beta / delta;
                        else if ((i === j && j !== r) || (i === j && j !== r + 1)) T[i][j] = 1;
                        else T[i][j] = 0;
                    }
                }

                // Result of matrix multiplication
                H = [
                    [H[0][0] * T[0][0] + H[0][1] * T[1][0], H[0][0] * T[0][1] + H[0][1] * T[1][1]],
                    [H[1][0] * T[0][0] + H[1][1] * T[1][0], H[1][0] * T[0][1] + H[1][1] * T[1][1]],
                    [H[2][0] * T[0][0] + H[2][1] * T[1][0], H[2][0] * T[0][1] + H[2][1] * T[1][1]],
                ];
            }

            // Step Three
            D = PSLQ.hermiteReduce(H);

            Dinv = D.clone().inverse().transpose();

            // Update
            PSLQMatrix.VMmult(x, Dinv, x);
            PSLQMatrix.mult(D, A, A);
            PSLQMatrix.mult(B, Dinv, B);

            // Step Four (stop criterion)
            let crit = [x[0], x[1], x[2], H[0][0], H[1][1]];
            for (let i = 0; i < crit.length; ++i)
                if (Math.abs(crit[i]) <= Math.pow(10, -prec + 5)) {
                    // build return value
                    B.transpose();
                    for (let j = 0; j < x.length; ++j) x[j] = -Math.abs(x[j]);
                    return B.getRow(PSLQ.maxIndex(x));
                }
        } // Main Iteration

        // undefined if not converged
        return undefined;
    }
}

export { PSLQ };
