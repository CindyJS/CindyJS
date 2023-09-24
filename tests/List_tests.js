const assert = require("chai").assert;
const rewire = require("rewire");

global.navigator = {};
const cindyJS = rewire("../build/js/exposed.js");

const List = cindyJS.__get__("List");
const CSNumber = cindyJS.__get__("CSNumber");
const General = cindyJS.__get__("General");

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
});
