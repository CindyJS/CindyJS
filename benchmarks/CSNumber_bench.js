// See https://benchmarkjs.com/docs
var Benchmark = require('benchmark');


var rewire = require("rewire");

var cindyJS = rewire("../build/js/exposed.js");

var List = cindyJS.__get__("List");
var CSNumber = cindyJS.__get__("CSNumber");


// Complex Numbers as class as an example
class ClassComplex {
  constructor(re, im) {
    this.re = re;
    this.im = im;
  }
  get value() {
    return {
        "ctype": "number",
        "value": {
            'real': this.re,
            'imag': this.im
        }
  }
}
  add(valB){
	  return new ClassComplex(this.re+valB.re,this.im+valB.im);
  }
  div(valB){
    let ar = this.re;
    let ai = this.im;
    let br = valB.re;
    let bi = valB.im;
    let s = br * br + bi * bi;
return new ClassComplex((ar * br + ai * bi) / s, (ai * br - ar * bi) / s)
  }
}

// initialization benchmark
var init_suite = new Benchmark.Suite;
init_suite.add('CSNumber complex factory', function() {
	let a = CSNumber.complex(Math.random(), Math.random());
})
init_suite.add('CSNumber complex ES6 Class', function() {
	let b = new ClassComplex(Math.random(), Math.random());
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': false});


var access_suite = new Benchmark.Suite;
access_suite.add('CSNumber complex factory - access', function() {
	let a = CSNumber.complex(Math.random(), Math.random());
	let aa = a.value;
})
access_suite.add('CSNumber complex ES6 Class - access', function() {
	let b = new ClassComplex(Math.random(), Math.random());
	let bb = b.value;
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': false});

var add_suite = new Benchmark.Suite;
add_suite.add('CSNumber complex factory - add', function() {
	let a = CSNumber.complex(Math.random(), Math.random());
	let b = CSNumber.complex(Math.random(), Math.random());
	let c = CSNumber.add(a,b);
	let d = c.value;
})
add_suite.add('CSNumber complex ES6 Class - add', function() {
	let a = new ClassComplex(Math.random(), Math.random());
	let b = new ClassComplex(Math.random(), Math.random());
	let c = a.add(b);
	let d = c.value;
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': false});

// Division 
var div_suite = new Benchmark.Suite;
div_suite.add('CSNumber complex factory - div', function() {
	let a = CSNumber.complex(Math.random(), Math.random());
	let b = CSNumber.complex(Math.random(), Math.random());
	let c = CSNumber.div(a,b);
	let d = c.value;
})
div_suite.add('CSNumber complex ES6 Class - div', function() {
	let a = new ClassComplex(Math.random(), Math.random());
	let b = new ClassComplex(Math.random(), Math.random());
	let c = a.div(b);
	let d = c.value;
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': false});
