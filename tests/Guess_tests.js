let rewire = require("rewire");
let cindyJS = rewire('../build/js/exposed.js');

let List = cindyJS.__get__('List');
let CSNumber = cindyJS.__get__('CSNumber');
let PSLQMatrix = cindyJS.__get__('PSLQMatrix');
let PSLQ = cindyJS.__get__('PSLQ');
let assert = require("chai").assert;

let eps = 1e-8;

describe('PSLQ Matrix', function() {
    function compArr(arr1, arr2){
		const containsAll = (arr1, arr2) => 
                arr2.every(arr2Item => arr1.includes(arr2Item))

		const sameMembers = (arr1, arr2) => 
                        containsAll(arr1, arr2) && containsAll(arr2, arr1);

		return sameMembers(arr1, arr2); 
    }


	describe('initialization', function(){
    	it('initialization of PSLQMatrix object - unit matrix', function() {
    	    let pslqMat = new PSLQMatrix();
			assert(compArr(pslqMat._e, [ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]));
    	});

    	it('initialization of PSLQMatrix object - nonunit matrix', function() {
			let init = [[1,2,3], [4,5,6], [7,8,9]];
    	    let pslqMat = new PSLQMatrix(init);
			assert(compArr(pslqMat._e, [ 1, 4, 7, 2, 5, 8, 3, 6, 9 ]));
    	});
	});

	describe('basic methods', function(){
		let pslqMat;

   		beforeEach(function() {
			let init = [[1,2,3], [4,5,6], [7,8,9]];
    	    pslqMat = new PSLQMatrix(init);
   		});

    	it('get', function() {
			assert(pslqMat.get(0), 1);
			assert(pslqMat.get(1), 4);
			assert(pslqMat.get(8), 9);
    	});

    	it('exchange', function() {
			pslqMat.exchange(0,1);
			assert(compArr(pslqMat._e, [ 4, 1, 7, 2, 5, 8, 3, 6, 9 ]));
    	});

    	it('swapRow', function() {
			pslqMat.swRow(0,2);
			assert(compArr(pslqMat._e, [3, 6, 9, 2, 5, 8, 4, 1, 7, ]));
    	});

    	it('swapCol', function() {
			pslqMat.swCol(0,2);
			assert(compArr(pslqMat._e, [ 3, 2, 1, 6, 5, 4, 9, 8, 7 ]));
    	});

    	it('getRow', function() {
			assert(compArr(pslqMat.getRow(0), [ 1,2,3 ]));
			assert.deepEqual(pslqMat.getRow(0), [1,2,3]);
    	});

        it('set 1-ary', function(){
			pslqMat.set([5,5,5,5,5,5,5,5,5]);
			assert(compArr(pslqMat._e, [ 5,5,5,5,5,5,5,5 ]));
        })

        it('set 2-ary', function(){
			pslqMat.set(0,10);
			pslqMat.set(8,10);
			assert(compArr(pslqMat._e, [ 10, 4, 7, 2, 5, 8, 3, 6, 10 ]));
        })
	});


	describe('linear algebra', function(){
    	it('invert', function() {
			let init = [[1,0,0], [0,5,0], [0,0,8]];
    	    pslqMat = new PSLQMatrix(init);
			pslqMat.inverse();
			assert(compArr(pslqMat._e, [ 1, 0, 0, 0.2, 0, 0, 0, 0, 0.125 ]));
    	});

    	it('mult', function() {
			let initA = [[1,2,3], [4,5,6], [7,8,9]];
			let initB = [[9,8,7], [6,5,4], [3,2,1]];
    	    let matA= new PSLQMatrix(initA);
    	    let matB = new PSLQMatrix(initB);
    	    let matC = new PSLQMatrix();
            PSLQMatrix.mult(matA, matB, matC)

			assert(compArr(matC._e, [30, 84, 138, 24, 69, 114, 18, 54, 90]));
    	});

    	it('transpose', function() {
			let init = [[1,2,3], [4,5,6], [7,8,9]];
    	    let mat = new PSLQMatrix(init);
            mat.transpose();

			assert.deepEqual(mat._e, [1,2,3,4,5,6,7,8,9]);
    	});

    	it('VMmult', function() {
			let init = [[1,2,3], [4,5,6], [7,8,9]];
    	    let mat = new PSLQMatrix(init);
            let vec = [1,2,3];
            let u = [];
            PSLQMatrix.VMmult(vec, mat, u)

			assert.deepEqual(u, [30 , 36, 42]);
    	});
	});

});


describe('PSLQ', function() {
    	it('dot', function() {
            assert(PSLQ.dot([1,2,3], [3,2,1], 10));
    	});
    	it('scale', function() {
            let v = [1,2,3];
            PSLQ.scale(v,2);
			assert.deepEqual(v, [2,4,6]);
    	});
    	it('maxIdx', function() {
            let v = [1,8,3];
			assert.equal(PSLQ.maxIndex(v), 1);
    	});
    	it('constants', function() {
			assert.equal(PSLQ.MAX_ITER, 20);
			assert.equal(PSLQ.GAMMA, 2 / Math.sqrt(3));
    	});
    	it('Hermite Reduction', function() {
            let H = [[1,2],[3,4],[5,6]];
            // H is modified in place
            let res = PSLQ.hermiteReduce(H); 

            let H2 = [ [ 1, 2 ], [ 0, 4 ], [ 0, -2 ] ];
            assert.deepEqual(H, H2);
    	});

    	it('PSLQ', function() {
            let preci = 10;
            let coeff1 = [1,2,3];
            let coeff2 = [-1,10,2];
            let coeff3 = [-1,10,-3];

            let res1 = PSLQ.doPSLQ(coeff1, preci);
            let res2 = PSLQ.doPSLQ(coeff2, preci);
            let res3 = PSLQ.doPSLQ(coeff3, preci);

            assert.deepEqual(res1, [-3,0,1]);
            assert.deepEqual(res2, [2,1,-4]);
            assert.deepEqual(res3, [1,1,3]);
    	});
});

var CindyJS = require("../build/js/Cindy.plain.js");
var cdy = CindyJS({
            isNode: true,
            csconsole: null,
            geometry: [
            ],
        });

function itCmd(command, expected) {
    it(command, function() {
        String(cdy.niceprint(cdy.evalcs(command))).should.equal(expected);
    });
}

describe("Operators: guess", function(){
    itCmd('guess(8.125)', '65/8');
    itCmd('guess(0.774596669241483)', '1/5*sqrt(15)');
    itCmd('guess(2.2071067811865475)', '3/2+1/2*sqrt(2)');
    // no actual guess
    itCmd('guess(0.12392903240304034030403403403049034902349)', '0.12392903240304035');
    // no guess
    itCmd('guess(1/0)', '___');
    itCmd('guess(0/0)', '___');
    itCmd('guess(i*pi)', '0 + i*3.1416'); //same as Cinderella
});
