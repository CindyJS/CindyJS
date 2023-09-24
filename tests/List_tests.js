const assert = require("chai").assert;
const rewire = require("rewire");

global.navigator = {};
const cindyJS = rewire("../build/js/exposed.js");

const List = cindyJS.__get__("List");
const CSNumber = cindyJS.__get__("CSNumber");
const General = cindyJS.__get__("General");
const nada = cindyJS.__get__("nada");

const bigNum = 1e8;
const eps = 1e-8;
let factor;
function chooseFactor() {
    Math.random() < 0.5 ? (factor = bigNum) : (factor = eps);
}

chooseFactor();
const a_real = factor * (Math.random() - 0.5);
chooseFactor();
const a_imag = factor * (Math.random() - 0.5);
chooseFactor();
const b_real = factor * (Math.random() - 0.5);
chooseFactor();
const b_imag = factor * (Math.random() - 0.5);

const a = CSNumber.complex(a_real, a_imag);
const b = CSNumber.complex(b_real, b_imag);
const a_plus_b = CSNumber.complex(a_real + b_real, a_imag + b_imag);
const a_minus_b = CSNumber.complex(a_real - b_real, a_imag - b_imag);

// fixed numbers
const f_a = CSNumber.complex(100, -0.5);
const f_b = CSNumber.complex(-0.5, 1);
const f_a_plus_b = CSNumber.add(f_a, f_b);
const f_a_mult_f_b = CSNumber.complex(-49.5, 100.25);

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
});
