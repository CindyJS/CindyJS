const assert = require("chai").assert;
const rewire = require("rewire");

global.navigator = {};
const cindyJS = rewire("../build/js/exposed.js");

const List = cindyJS.__get__("List");
const CSNumber = cindyJS.__get__("CSNumber");
const General = cindyJS.__get__("General");
const nada = cindyJS.__get__("nada");
const niceprint = cindyJS.__get__("niceprint");

describe("List", function () {
    describe("#det()", function () {
        it("should compute the determinant of a matrix", function () {
            const a = List.turnIntoCSList([List.realVector([1, 2]), List.realVector([3, 4])]);
            const det = List.det(a);
            assert.deepStrictEqual(det, CSNumber.real(-2));
        });
    });

    describe("#LUdet()", function () {
        it("should compute the determinant of a matrix using LU decomposition", function () {
            const a = List.turnIntoCSList([List.realVector([1, 2]), List.realVector([3, 4])]);
            const det = List.LUdet(a);
            assert(CSNumber._helper.isEqual(det, CSNumber.real(-2)));
        });
    });

    describe("#getField()", function () {
        it("should return the homogenous coordinates of a 2D point", function () {
            const p = List.realVector([1, 2]);
            const homog = List.getField(p, "homog");
            assert.deepStrictEqual(homog, List.realVector([1, 2, 1]));
        });
    });

    describe("#sequence()", function () {
        it("should return a list of integers from a to b", function () {
            const a = CSNumber.real(1);
            const b = CSNumber.real(5);
            const expected = List.turnIntoCSList([
                CSNumber.real(1),
                CSNumber.real(2),
                CSNumber.real(3),
                CSNumber.real(4),
                CSNumber.real(5),
            ]);
            const actual = List.sequence(a, b);
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe("#pairs()", function () {
        it("should return a list of all pairs of elements in the input list", function () {
            const input = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]);
            const expected = List.turnIntoCSList([
                List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2)]),
                List.turnIntoCSList([CSNumber.real(1), CSNumber.real(3)]),
                List.turnIntoCSList([CSNumber.real(2), CSNumber.real(3)]),
            ]);
            const actual = List.pairs(input);
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe("#triples()", function () {
        it("should return a list of all triples of elements in the input list", function () {
            const input = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3), CSNumber.real(4)]);
            const expected = List.turnIntoCSList([
                List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]),
                List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(4)]),
                List.turnIntoCSList([CSNumber.real(1), CSNumber.real(3), CSNumber.real(4)]),
                List.turnIntoCSList([CSNumber.real(2), CSNumber.real(3), CSNumber.real(4)]),
            ]);
            const actual = List.triples(input);
            assert.deepStrictEqual(actual, expected);
        });
    });

    describe("#concat()", function () {
        it("should concatenate two lists", function () {
            const a = List.turnIntoCSList([1, 2, 3]);
            const b = List.turnIntoCSList([4, 5, 6]);
            const result = List.concat(a, b);
            assert.deepStrictEqual(result, List.turnIntoCSList([1, 2, 3, 4, 5, 6]));
        });
    });

    describe("#prepend()", function () {
        it("should prepend an element to a list", function () {
            const a = List.turnIntoCSList([1, 2, 3]);
            const b = 0;
            const result = List.prepend(b, a);
            assert.deepStrictEqual(result, List.turnIntoCSList([0, 1, 2, 3]));
        });
    });

    describe("#append()", function () {
        it("should append an element to a list", function () {
            const a = List.turnIntoCSList([1, 2, 3]);
            const b = 4;
            const result = List.append(a, b);
            assert.deepStrictEqual(result, List.turnIntoCSList([1, 2, 3, 4]));
        });
    });

    describe("#contains()", function () {
        it("should return true if a list contains an element", function () {
            const a = List.realVector([1, 2, 3]);
            const b = CSNumber.real(2);
            const result = List.contains(a, b);
            assert.deepStrictEqual(result, General.bool(true));
        });

        it("should return false if a list does not contain an element", function () {
            const a = List.realVector([1, 2, 3]);
            const b = 4;
            const result = List.contains(a, b);
            assert.deepStrictEqual(result, General.bool(false));
        });
    });

    describe("#common()", function () {
        it("should return a list of common elements between two lists", function () {
            const a = List.realVector([1, 2, 3, 4]);
            const b = List.realVector([3, 4, 5, 6]);
            const result = List.common(a, b);
            assert.deepStrictEqual(result, List.realVector([3, 4]));
        });
    });

    describe("#remove()", function () {
        it("should remove elements from a list", function () {
            const a = List.realVector([1, 2, 3, 4]);
            const b = List.realVector([2, 4]);
            const result = List.remove(a, b);
            assert.deepStrictEqual(result, List.realVector([1, 3]));
        });
    });

    describe("#sort1()", function () {
        it("should sort a list", function () {
            const a = List.realVector([3, 1, 4, 2]);
            const result = List.sort1(a);
            assert.deepStrictEqual(result, List.realVector([1, 2, 3, 4]));
        });
    });

    describe("#equals()", function () {
        it("should return true if two lists are equal", function () {
            const a1 = List.realVector([1, 2, 3]);
            const a2 = List.realVector([1, 2, 3]);
            const result = List.equals(a1, a2);
            assert.deepStrictEqual(result, General.bool(true));
        });

        it("should return false if two lists are not equal", function () {
            const a1 = List.realVector([1, 2, 3]);
            const a2 = List.realVector([1, 2, 4]);
            const result = List.equals(a1, a2);
            assert.deepStrictEqual(result, General.bool(false));
        });
    });

    describe("#almostequals()", function () {
        it("should return true if two lists are almost equal", function () {
            const a1 = List.realVector([1, 2, 3.0000000000001]);
            const a2 = List.realVector([1, 2, 3]);
            const result = List.almostequals(a1, a2);
            assert.deepStrictEqual(result, General.bool(true));
        });

        it("should return false if two lists are not almost equal", function () {
            const a1 = List.realVector([1, 2, 3.000000001]);
            const a2 = List.realVector([1, 2, 3]);
            const result = List.almostequals(a1, a2);
            assert.deepStrictEqual(result, General.bool(false));
        });
    });

    describe("#set()", function () {
        it("should remove duplicates from a list", function () {
            const a1 = List.realVector([1, 2, 3, 2, 1]);
            const result = List.set(a1);
            assert.deepStrictEqual(result, List.realVector([1, 2, 3]));
        });
    });

    describe("#isNumberVector()", function () {
        it("should return true for a number vector", function () {
            const a = List.realVector([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]);
            assert.strictEqual(List.isNumberVector(a).value, true);
        });
        it("should return false for a non-number vector", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), List.realVector([3, 4])]);
            assert.strictEqual(List.isNumberVector(a).value, false);
        });
    });

    describe("#isNumberMatrix()", function () {
        it("should return true for a number matrix", function () {
            const a = List.realMatrix([
                [CSNumber.real(1), CSNumber.real(2)],
                [CSNumber.real(3), CSNumber.real(4)],
            ]);
            assert.strictEqual(List.isNumberMatrix(a).value, true);
        });
        it("should return false for a non-number matrix", function () {
            const a = List.turnIntoCSList([
                List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2)]),
                List.turnIntoCSList([CSNumber.real(3), List.realVector([4, 5])]),
            ]);
            assert.strictEqual(List.isNumberMatrix(a).value, false);
        });
    });

    describe("#scalproduct()", function () {
        it("should return the scalar product of two vectors", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]);
            const b = List.turnIntoCSList([CSNumber.real(4), CSNumber.real(5), CSNumber.real(6)]);
            const expected = CSNumber.real(32);
            assert(CSNumber._helper.isAlmostEqual(List.scalproduct(a, b), expected));
        });
        it("should return nada for vectors of different lengths", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]);
            const b = List.turnIntoCSList([CSNumber.real(4), CSNumber.real(5)]);
            assert.deepStrictEqual(List.scalproduct(a, b), nada);
        });
    });

    describe("#sesquilinearproduct()", function () {
        it("should return the sesquilinear product of two vectors", function () {
            const a = List.turnIntoCSList([CSNumber.complex(1, 2), CSNumber.complex(3, 4)]);
            const b = List.turnIntoCSList([CSNumber.complex(5, 6), CSNumber.complex(7, 8)]);
            const expected = CSNumber.complex(70, -8);
            assert.deepStrictEqual(List.sesquilinearproduct(a, b), expected);
        });
        it("should return nada for vectors of different lengths", function () {
            const a = List.turnIntoCSList([CSNumber.complex(1, 2), CSNumber.complex(3, 4)]);
            const b = List.turnIntoCSList([CSNumber.complex(5, 6)]);
            assert.deepStrictEqual(List.sesquilinearproduct(a, b), nada);
        });
    });

    describe("#normSquared()", function () {
        it("should return the norm squared of a vector", function () {
            const a = List.turnIntoCSList([CSNumber.complex(1, 2), CSNumber.complex(3, 4)]);
            const expected = CSNumber.real(30);
            assert.deepStrictEqual(List.normSquared(a), expected);
        });
    });

    describe("#productMV()", function () {
        it("should return the matrix-vector product of a matrix and a vector", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const b = List.turnIntoCSList([CSNumber.real(5), CSNumber.real(6)]);
            const expected = List.turnIntoCSList([CSNumber.real(17), CSNumber.real(39)]);
            assert.deepStrictEqual(List.productMV(a, b), expected);
        });
        it("should return nada for incompatible matrix and vector", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const b = List.turnIntoCSList([CSNumber.real(5), CSNumber.real(6), CSNumber.real(7)]);
            assert.deepStrictEqual(List.productMV(a, b), nada);
        });
    });

    describe("#productVM()", function () {
        it("should return the vector-matrix product of a vector and a matrix", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2)]);
            const b = List.realMatrix([
                [3, 4],
                [5, 6],
            ]);
            const expected = List.turnIntoCSList([CSNumber.real(13), CSNumber.real(16)]);
            assert.deepStrictEqual(List.productVM(a, b), expected);
        });
        it("should return nada for incompatible vector and matrix", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]);
            const b = List.realMatrix([
                [4, 5],
                [6, 7],
            ]);
            assert.deepStrictEqual(List.productVM(a, b), nada);
        });
    });

    describe("#productMM()", function () {
        it("should return the matrix-matrix product of two matrices", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const b = List.realMatrix([
                [5, 6],
                [7, 8],
            ]);
            const expected = List.realMatrix([
                [19, 22],
                [43, 50],
            ]);
            assert.deepStrictEqual(List.productMM(a, b), expected);
        });
        it("should return nada for incompatible matrices", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const b = List.realMatrix([
                [5, 6],
                [7, 8],
                [9, 10],
            ]);
            assert.deepStrictEqual(List.productMM(a, b), nada);
        });
    });

    describe("#mult()", function () {
        it("should return the scalar product of two vectors", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2), CSNumber.real(3)]);
            const b = List.turnIntoCSList([CSNumber.real(4), CSNumber.real(5), CSNumber.real(6)]);
            const expected = CSNumber.real(32);
            assert.deepStrictEqual(List.mult(a, b), expected);
        });
        it("should return the matrix-vector product of a matrix and a vector", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const b = List.turnIntoCSList([CSNumber.real(5), CSNumber.real(6)]);
            const expected = List.turnIntoCSList([CSNumber.real(17), CSNumber.real(39)]);
            assert.deepStrictEqual(List.mult(a, b), expected);
        });
        it("should return the vector-matrix product of a vector and a matrix", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2)]);
            const b = List.realMatrix([
                [3, 4],
                [5, 6],
            ]);
            const expected = List.turnIntoCSList([CSNumber.real(13), CSNumber.real(16)]);
            assert.deepStrictEqual(List.mult(a, b), expected);
        });
        it("should return the matrix-matrix product of two matrices", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const b = List.realMatrix([
                [5, 6],
                [7, 8],
            ]);
            const expected = List.realMatrix([
                [19, 22],
                [43, 50],
            ]);
            assert.deepStrictEqual(List.mult(a, b), expected);
        });
        it("should return nada for incompatible inputs", function () {
            const a = List.turnIntoCSList([CSNumber.real(1), CSNumber.real(2)]);
            const b = List.realMatrix([
                [3, 4],
                [5, 6],
                [7, 8],
            ]);
            assert.deepStrictEqual(List.mult(a, b), nada);
        });
    });

    describe("#projectiveDistMinScal()", function () {
        it("should return the minimum projective distance between two vectors", function () {
            const a = List.turnIntoCSList([CSNumber.complex(1, 2), CSNumber.complex(3, 4)]);
            const b = List.turnIntoCSList([CSNumber.complex(5, 6), CSNumber.complex(7, 8)]);
            const expected = 0.22284218798065425;
            assert.closeTo(List.projectiveDistMinScal(a, b), expected, 1e-8);
        });
        it("should return 0 for zero vectors", function () {
            const a = List.turnIntoCSList([CSNumber.real(0), CSNumber.real(0)]);
            const b = List.turnIntoCSList([CSNumber.real(0), CSNumber.real(0)]);
            const expected = 0;
            assert.closeTo(List.projectiveDistMinScal(a, b), expected, 1e-8);
        });
    });
    it("should return the determinant of a 4x4 matrix", function () {
        const m = List.realMatrix([
            [3, 7, 3, 0],
            [0, 2, -1, 1],
            [5, 4, 3, 2],
            [6, 6, 4, -1],
        ]);
        const det = List.det4m(m);
        const expectedDet = CSNumber.real(105);
        assert.deepStrictEqual(det, expectedDet);
    });

    it("should return the determinant of another 4x4 matrix", function () {
        const m = List.realMatrix([
            [1, 2, 3, 4],
            [5, 6, 7, 8],
            [9, 10, 11, 12],
            [13, 14, 15, 17],
        ]);
        const det = List.det4m(m);
        const expectedDet = CSNumber.real(0);
        assert.deepStrictEqual(det, expectedDet);
    });

    it("should return the determinant of a 4x4 matrix with complex entries", function () {
        const m = List.turnIntoCSList([
            List.turnIntoCSList([
                CSNumber.complex(1, 2),
                CSNumber.complex(3, 4),
                CSNumber.complex(5, 6),
                CSNumber.complex(8, 8),
            ]),
            List.turnIntoCSList([
                CSNumber.complex(9, 10),
                CSNumber.complex(11, 12),
                CSNumber.complex(12, 14),
                CSNumber.complex(15, 16),
            ]),
            List.turnIntoCSList([
                CSNumber.complex(11, 18),
                CSNumber.complex(19, 20),
                CSNumber.complex(22, 22),
                CSNumber.complex(23, 24),
            ]),
            List.turnIntoCSList([
                CSNumber.complex(25, 26),
                CSNumber.complex(29, 28),
                CSNumber.complex(29, 30),
                CSNumber.complex(31, 32),
            ]),
        ]);
        const det = List.det4m(m);
        const expectedDet = CSNumber.complex(-50, -72);
        assert.deepStrictEqual(det, expectedDet);
    });

    describe("#eucangle()", function () {
        it("should return the Euclidean angle between two vectors", function () {
            const a = List.realVector([1, 2, 3]);
            const b = List.realVector([4, 5, 6]);
            const angle = List.eucangle(a, b);
            const { real, imag } = angle.value;
            assert.closeTo(real, -0.21109333322274654, 1e-8);
            assert.closeTo(imag, 0, 1e-8);
        });
    });

    describe("#zerovector()", function () {
        it("should return a zero vector of the given length", function () {
            const v = List.zerovector(CSNumber.real(3));
            assert.deepStrictEqual(v, List.realVector([0, 0, 0]));
        });
    });

    describe("#zeromatrix()", function () {
        it("should return a zero matrix of the given dimensions", function () {
            const m = List.zeromatrix(CSNumber.real(2), CSNumber.real(3));
            assert.deepStrictEqual(
                m,
                List.realMatrix([
                    [0, 0, 0],
                    [0, 0, 0],
                ])
            );
        });
    });

    describe("#vandermonde()", function () {
        it("should return the Vandermonde matrix of the given vector", function () {
            const v = List.realVector([1, 2, 3]);
            const m = List.vandermonde(v);
            assert.deepStrictEqual(
                m,
                List.realMatrix([
                    [1, 1, 1],
                    [1, 2, 4],
                    [1, 3, 9],
                ])
            );
        });
    });

    describe("#transpose()", function () {
        it("should return the transpose of the given matrix", function () {
            const m = List.realMatrix([
                [1, 2, 3],
                [4, 5, 6],
            ]);
            const t = List.transpose(m);
            assert.deepStrictEqual(
                t,
                List.realMatrix([
                    [1, 4],
                    [2, 5],
                    [3, 6],
                ])
            );
        });
    });

    describe("#row()", function () {
        it("should return the correct row of a matrix", function () {
            const a = List.realMatrix([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ]);
            const b = CSNumber.real(2);
            const expected = List.realVector([4, 5, 6]);
            assert.deepStrictEqual(List.row(a, b), expected);
        });
    });

    describe("#adjoint2()", function () {
        it("should return the adjoint of a 2x2 matrix", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const expected = List.realMatrix([
                [4, -2],
                [-3, 1],
            ]);
            assert(List.almostequals(List.adjoint2(a), expected));
        });
    });

    describe("#adjoint3()", function () {
        it("should return the adjoint of a 3x3 matrix", function () {
            const a = List.realMatrix([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ]);
            const expected = List.realMatrix([
                [-3, 6, -3],
                [6, -12, 6],
                [-3, 6, -3],
            ]);
            assert(List.almostequals(List.adjoint3(a), expected));
        });
    });

    describe("#inverse()", function () {
        it("should return the inverse of a 2x2 matrix", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
            ]);
            const expected = List.realMatrix([
                [-2, 1],
                [1.5, -0.5],
            ]);
            assert(List.almostequals(List.inverse(a), expected));
        });

        it("should return the inverse of a 3x3 matrix", function () {
            const a = List.realMatrix([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ]);
            const expected = List.realMatrix([
                [-0.5, 1, -0.5],
                [1, -2, 1],
                [-0.5, 1, -0.5],
            ]);
            assert(List.almostequals(List.inverse(a), expected));
        });

        it("should return nada for a non-square matrix", function () {
            const a = List.realMatrix([
                [1, 2],
                [3, 4],
                [5, 6],
            ]);
            assert.deepStrictEqual(List.inverse(a), nada);
        });
    });

    describe("#linearsolve()", function () {
        it("should solve a linear system using Cramer's rule for 2x2 matrices", function () {
            const A = List.realMatrix([
                [2, 3],
                [5, 7],
            ]);
            const b = List.realVector([11, 13]);
            const x = List.linearsolve(A, b);
            assert.deepStrictEqual(b, List.productMV(A, x));
        });
        it("should solve a linear system using Cramer's rule for 3x3 matrices", function () {
            const A = List.realMatrix([
                [2, 3, 4],
                [5, 7, 8],
                [9, 10, 11],
            ]);
            const b = List.realVector([11, 13, 14]);
            const x = List.linearsolve(A, b);
            assert(List.almostequals(b, List.productMV(A, x)));
        });
        it("should solve a linear system using LU decomposition for larger matrices", function () {
            const A = List.realMatrix([
                [2, 3, 4],
                [5, 7, 8],
                [9, 10, 11],
            ]);
            const b = List.realVector([11, 13, 14]);
            const x = List.linearsolve(A, b);
            assert(List.almostequals(b, List.productMV(A, x)));
        });
    });
    describe("#getDiag()", function () {
        it("should return the diagonal of a square matrix", function () {
            const A = List.realMatrix([
                [2, 3],
                [5, 7],
            ]);
            const diag = List.getDiag(A);
            assert.deepStrictEqual(diag, List.realVector([2, 7]));
        });
        it("should return nada for non-square matrices", function () {
            const A = List.realMatrix([
                [2, 3],
                [5, 7],
                [8, 9],
            ]);
            const diag = List.getDiag(A);
            assert.deepStrictEqual(diag, nada);
        });
    });
    describe("#getSubDiag()", function () {
        it("should return the subdiagonal of a square matrix", function () {
            const A = List.realMatrix([
                [2, 3, 4],
                [5, 7, 8],
                [9, 10, 11],
            ]);
            const subdiag = List.getSubDiag(A);
            assert.deepStrictEqual(subdiag, List.realVector([5, 10]));
        });
        it("should return nada for non-square matrices", function () {
            const A = List.realMatrix([
                [2, 3],
                [5, 7],
                [8, 9],
            ]);
            const subdiag = List.getSubDiag(A);
            assert.deepStrictEqual(subdiag, nada);
        });
    });
    describe("#eig2()", function () {
        it("should return the eigenvalues of a 2x2 matrix", function () {
            const A = List.realMatrix([
                [2, 3],
                [5, 7],
            ]);
            const eigvals = List.eig2(A);
            assert(List.almostequals(eigvals, List.realVector([9.109772228646444, -0.10977222864644354])));
        });
    });

    describe("#eig()", function () {
        it("should return the eigenvalues and eigenvectors of a matrix", function () {
            const A = List.realMatrix([
                [2, 0, 0, 0],
                [1, 2, 0, 0],
                [0, 1, 3, 0],
                [0, 0, 1, 3],
            ]);
            const [eigenvals, eigenvecs] = List.eig(A).value;

            for (const [i, v] of eigenvecs.value.entries()) {
                const s = eigenvals.value[i];
                assert(List.almostequals(List.scalmult(s, v), List.productMV(A, v)));
            }
        });
    });

    it("should return the rank of a square matrix", function () {
        const A = List.realMatrix([
            [1, 2],
            [3, 4],
        ]);
        assert.deepEqual(List.rank(A), CSNumber.real(2));

        const B = List.realMatrix([
            [1, 3, 2],
            [2, 4, 4],
            [3, 5, 6],
        ]);
        assert.deepEqual(List.rank(B), CSNumber.real(2));

        const C = List.realMatrix([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 7],
        ]);
        assert.deepEqual(List.rank(C), CSNumber.real(3));

        const D = List.realMatrix([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 10],
        ]);
        assert.deepEqual(List.rank(D), CSNumber.real(3));

        const E = List.realMatrix([
            [1, 1, 1],
            [4, 4, 4],
            [7, 7, 7],
        ]);
        assert.deepEqual(List.rank(E), CSNumber.real(1));
    });
});
