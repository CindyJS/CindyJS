var assert = require("chai").assert;
var rewire = require("rewire");

var cindyJS = rewire("../build/js/exposed.js");

var List = cindyJS.__get__("List");
var CSNumber = cindyJS.__get__("CSNumber");

var bigNum = 1e8;
var eps = 1e-8;
var factor;
function chooseFactor() {
Math.random() < 0.5 ? factor = bigNum : factor = eps;
}

chooseFactor();
var a_real = factor*(Math.random()-0.5);
chooseFactor();
var a_imag = factor*(Math.random()-0.5);
chooseFactor();
var b_real = factor*(Math.random()-0.5);
chooseFactor();
var b_imag = factor*(Math.random()-0.5);

var a = CSNumber.complex(a_real,a_imag);
var b = CSNumber.complex(b_real,b_imag);
var a_plus_b = CSNumber.complex(a_real+b_real,a_imag+b_imag);
var a_minus_b= CSNumber.complex(a_real-b_real,a_imag-b_imag);

// fixed numbers
var f_a = CSNumber.complex(100, -0.5);
var f_b = CSNumber.complex(-0.5, 1);
var f_a_plus_b = CSNumber.add(f_a, f_b);
var f_a_mult_f_b = CSNumber.complex(-49.5,100.25);


// basic operations
describe("Basic Operations", function() {
  it("a=a", function() {
    assert(CSNumber._helper.isEqual(a,a));
  });

  it("argmax", function() {
    var max = CSNumber.argmax(f_a,f_b);
    assert(CSNumber._helper.isEqual(max,f_a));
  });

  it("max", function() {
    var max = CSNumber.complex(f_a.value.real,f_b.value.imag);
    assert(CSNumber._helper.isEqual(max,CSNumber.max(f_a,f_b)));
  });

  it("min", function() {
    var max = CSNumber.complex(f_b.value.real,f_a.value.imag);
    assert(CSNumber._helper.isEqual(max,CSNumber.min(f_a,f_b)));
  });

  it("add", function() {
    assert(CSNumber._helper.isEqual(CSNumber.add(a,b),a_plus_b));
  });

  it("sub", function() {
    assert(CSNumber._helper.isEqual(CSNumber.sub(a,b),a_minus_b));
  });

  it("neg", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(-a_real,-a_imag),CSNumber.neg(a)));
  });

  it("re", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(a_real,0),CSNumber.re(a)));
  });

  it("im", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(a_imag,0),CSNumber.im(a)));
  });

  it("conjugate", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(a_real,-a_imag),CSNumber.conjugate(a)));
  });

  it("round", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(Math.round(a_real),Math.round(a_imag)),CSNumber.round(a)));
  });

  it("ceil", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(Math.ceil(a_real),Math.ceil(a_imag)),CSNumber.ceil(a)));
  });

  it("floor", function() {
    assert(CSNumber._helper.isEqual(CSNumber.complex(Math.floor(a_real),Math.floor(a_imag)),CSNumber.floor(a)));
  });

  it("mult", function() {
    var mult = CSNumber.mult(f_a,f_b);
    assert(CSNumber._helper.isEqual(f_a_mult_f_b,mult));
  });

  it("abs2", function() {
    var aabs = CSNumber.complex(a_real*a_real+a_imag*a_imag,0);
    assert(CSNumber._helper.isEqual(aabs,CSNumber.abs2(a)));
    // second argument should not matter? Perhaps a bug
    assert(CSNumber._helper.isEqual(aabs,CSNumber.abs2(a,CSNumber.complex(Math.random(),Math.random()))));
  });

  it("abs", function() {
    var aabs = CSNumber.complex(Math.sqrt(a_real*a_real+a_imag*a_imag),0);
    assert(CSNumber._helper.isEqual(aabs,CSNumber.abs(a)));
  });

  it("inv", function() {
    var f_a_inv = CSNumber.complex(0.009999750006249844,4.9998750031249224*1e-5);
    var f_b_inv = CSNumber.complex(-0.4,-0.8); 
    assert(CSNumber._helper.isAlmostEqual(f_a_inv, CSNumber.inv(f_a)));
    assert(CSNumber._helper.isAlmostEqual(f_b_inv, CSNumber.inv(f_b)));
  });

  it("snap", function() {
  var eps = 1e-20;
  var num = CSNumber.complex(1,1);
  var c_eps = CSNumber.complex(-eps, -eps);
  var d_num = CSNumber.add(num, c_eps);
  var snap = CSNumber.snap(d_num);

  assert(CSNumber._helper.isEqual(snap,num));

  });
}); // END basic operations

describe("Trigonometry", function() {
  it("exp", function() {
    // not testing a because numbers are too large

    var exp_f_b = CSNumber.complex(0.32770991402245986,0.51037795154457277);
    var cs_exp_b = CSNumber.exp(f_b);
    assert(CSNumber._helper.isAlmostEqual(exp_f_b, cs_exp_b, 1e-8));
  });

  it("cos", function() {
    var cos_f_a = CSNumber.complex(0.97237315067907726,-0.26386475844562701);
    var cos_f_b = CSNumber.complex(1.3541806567045842,0.5634214652309818);
    assert(CSNumber._helper.isAlmostEqual(cos_f_a, CSNumber.cos(f_a)));
    assert(CSNumber._helper.isAlmostEqual(cos_f_b, CSNumber.cos(f_b)));
  });

  it("sin", function() {
    var sin_f_a = CSNumber.complex(-0.57099104480373952,-0.44935031618777438);
    var sin_f_b = CSNumber.complex(-0.73979226445601376,1.0313360742545512);
    assert(CSNumber._helper.isAlmostEqual(sin_f_a, CSNumber.sin(f_a)));
    assert(CSNumber._helper.isAlmostEqual(sin_f_b, CSNumber.sin(f_b)));
  });

  it("tan", function() {
    var tan_f_a = CSNumber.complex(-0.43013886045950833,-0.57884033748558616);
    var tan_f_b = CSNumber.complex(-0.19557731006593401,0.84296620484578333);
    assert(CSNumber._helper.isAlmostEqual(tan_f_a, CSNumber.tan(f_a)));
    assert(CSNumber._helper.isAlmostEqual(tan_f_b, CSNumber.tan(f_b)));
  });

  it("arccos", function() {
    var arccos_f_a = CSNumber.complex(0.0050002083402176838,5.2983048673281212);
    var arccos_f_b = CSNumber.complex(1.9202353896521098,-0.92613303135018255);

    assert(CSNumber._helper.isAlmostEqual(arccos_f_a, CSNumber.arccos(f_a)));
    assert(CSNumber._helper.isAlmostEqual(arccos_f_b, CSNumber.arccos(f_b)));
  });

  it("arcsin", function() {
    var arcsin_f_a = CSNumber.complex(1.5657961184546887,-5.298304867329394);
    var arcsin_f_b = CSNumber.complex(-0.34943906285721327,0.92613303135018232);

    assert(CSNumber._helper.isAlmostEqual(arcsin_f_a, CSNumber.arcsin(f_a)));
    assert(CSNumber._helper.isAlmostEqual(arcsin_f_b, CSNumber.arcsin(f_b)));
  });

  it("arctan", function() {
    var arctan_f_a = CSNumber.complex(1.5607969100519921,-4.9993750947774925e-05);
    var arctan_f_b = CSNumber.complex(-0.90788749496088039,0.70830333601405404);

    assert(CSNumber._helper.isAlmostEqual(arctan_f_a, CSNumber.arctan(f_a)));
    assert(CSNumber._helper.isAlmostEqual(arctan_f_b, CSNumber.arctan(f_b)));
  });

  it("arctan2", function() {
    var f_x = CSNumber.real(4);
    var f_y = CSNumber.real(3);
    // CSNumber.arctan2 uses the following formula for complex arguments
    function arctan2(a, b) {
        var z = CSNumber.add(a, CSNumber.mult(CSNumber.complex(0, 1), b));
        var r = CSNumber.sqrt(CSNumber.add(CSNumber.mult(a, a), CSNumber.mult(b, b)));
        erg = CSNumber.mult(CSNumber.complex(0, -1), CSNumber.log(CSNumber.div(z, r)));
        return erg;
    }
    // test whether this formula is compatible with Math.atan2
    // for 4 pairs of real values in the different quadrants
    var erg1 = CSNumber.arctan2(f_x, f_y);
    var erg2 = arctan2(f_x, f_y);
    assert(CSNumber._helper.isAlmostEqual(erg1, erg2));
    erg1 = CSNumber.arctan2(CSNumber.neg(f_x), f_y);
    erg2 = arctan2(CSNumber.neg(f_x), f_y);
    assert(CSNumber._helper.isAlmostEqual(erg1, erg2));
    erg1 = CSNumber.arctan2(f_x, CSNumber.neg(f_y));
    erg2 = arctan2(f_x, CSNumber.neg(f_y));
    assert(CSNumber._helper.isAlmostEqual(erg1, erg2));
    erg1 = CSNumber.arctan2(CSNumber.neg(f_x), CSNumber.neg(f_y));
    erg2 = arctan2(CSNumber.neg(f_x), CSNumber.neg(f_y));
    assert(CSNumber._helper.isAlmostEqual(erg1, erg2));
  });

  it("sqrt", function() {
    var sqrt_f_a = CSNumber.complex(10.000031249755862,-0.024999921875854481);
    var sqrt_f_b = CSNumber.complex(0.55589297025142115,0.89945371997393364);

    assert(CSNumber._helper.isAlmostEqual(sqrt_f_a, CSNumber.sqrt(f_a)));
    assert(CSNumber._helper.isAlmostEqual(sqrt_f_b, CSNumber.sqrt(f_b)));
  });

  it("log", function() {
    var log_f_a = CSNumber.complex(4.6051826858318439,-0.0049999583339583225);
    var log_f_b = CSNumber.complex(0.11157177565710488,2.0344439357957027);

    assert(CSNumber._helper.isAlmostEqual(log_f_a, CSNumber.log(f_a)));
    assert(CSNumber._helper.isAlmostEqual(log_f_b, CSNumber.log(f_b)));
  });

  it("pow", function() {
    var erg =CSNumber.complex(-0.010503832039336254,-0.099950208042515698);

    assert(CSNumber._helper.isAlmostEqual(erg, CSNumber.pow(f_a,f_b)));
  });

  it("mod", function() {
    var a1 = CSNumber.complex(10,5);
    var a2 = CSNumber.complex(3,3);
    var erg = CSNumber.complex(1,2);

    assert(CSNumber._helper.isEqual(erg, CSNumber.mod(a1,a2)));
  });

});
