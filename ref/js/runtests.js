"use strict";

var fs = require("fs"), path = require("path");
var createCindy = require("../../build/js/Cindy.plain.js");

var refdir = path.dirname(__dirname);
var println = console.log;

var reTestLine = /^    ([<>!.] )?(.*)/mg;
var failures = 0, numtests = 0;
var cjs, fakeCanvas;

function runAllTests() {
  var files = process.argv.slice(2);
  if (files.length === 0) {
    files = [];
    fs.readdirSync(refdir).forEach(function(filename) {
      if (filename.match(/\.md$/))
        files.push(path.join(refdir, filename));
    });
  }
  files.forEach(runTestFile);
  if (failures === 0) {
    println("All " + numtests + " tests passed");
    process.exit(0);
  }
  else {
    println(failures + " of " + numtests + " tests failed");
    process.exit(1);
  }
}

function runTestFile(filename) {
  // println("File: " + filename);
  // println("");
  fakeCanvas = new FakeCanvas();
  cjs = createCindy({
    "isNode": true,
    "csconsole": null,
    "canvas": fakeCanvas,
  });
  fakeCanvas._log = [];
  var cases = [], curcase = null, ininput = false, lineno = 1;
  var anythingToCheck = false;
  var txt = fs.readFileSync(filename, {encoding: "utf-8"});
  txt.split("\n\n").forEach(function(block) {
    var lines, match;
    lines = block.split("\n");
    var n = lines.length, i, line;
    for (i = 0; i < n; ++i) {
      line = lines[i];
      if (line === "") continue;
      if (line.substr(0, 4) !== "    ") {
        lineno += n + 1;
        return;
      }
    }
    for (i = 0; i < n; ++i) {
      line = lines[i];
      var mark = line.substr(4, 2), rest = line.substr(6);
      if (mark === "> ") {
        if (ininput) {
          curcase.cmd += "\n" + rest;
        } else {
          curcase = new TestCase(rest, filename, lineno + i);
          cases.push(curcase);
          ++numtests;
          ininput = true;
        }
        continue;
      } else if (mark === "- " && rest.substr(0, 4) == "skip") {
        break;
      } else if (mark === "< ") {
        curcase.expectResult(rest);
        anythingToCheck = true;
      } else if (mark === "~ ") {
        curcase.expectPattern(new RegExp("^(?:" + rest + ")$"));
        anythingToCheck = true;
      } else if (mark === '! ') {
        curcase.expectException(rest);
        anythingToCheck = true;
      } else if (mark === '* ') {
        curcase.expectOutput(rest);
        anythingToCheck = true;
      } else if (mark === 'D ') {
        curcase.expectDraw(rest);
        anythingToCheck = true;
      } else if (mark === 'J ' || mark === 'T ') {
        // ignore
      } else if (line === "") {
        // ignore
      } else {
        console.log("Unexpected line " + path.basename(filename) + ":" +
                    (lineno + i) + ": " + line);
      }
      ininput = false;
    }
    lineno += n + 1;
  });
  if (!anythingToCheck)
    return;
  cases.forEach(function(c) {
    if (!c.run())
      ++failures;
  });
}

function TestCase(cmd, filename, lineno) {
  this.cmd = cmd;
  this.filename = filename;
  this.lineno = lineno;
}

TestCase.prototype.expected = null;
TestCase.prototype.pattern = null;
TestCase.prototype.output = null;
TestCase.prototype.draw = null;
TestCase.prototype.exception = null;

TestCase.prototype.expectResult = function(str) {
  if (this.expected !== null)
    console.err("Two results for command " + this.cmd);
  this.expected = str;
};

TestCase.prototype.expectPattern = function(re) {
  if (this.pattern !== null)
    console.err("Two patterns for command " + this.cmd);
  this.pattern = re;
};

TestCase.prototype.expectOutput = function(str) {
  if (this.output === null)
    this.output = [];
  this.output.push(str);
};

TestCase.prototype.expectDraw = function(str) {
  if (this.draw === null)
    this.draw = [];
  this.draw.push(str);
};

TestCase.prototype.expectException = function(str) {
  if (this.exception === null) this.exception = str;
  else this.exception += "\n" + str;
};

function myniceprint(val) {
  if (val.ctype === "string")
    return JSON.stringify(val.value);
  if (val.ctype === "list")
    return "[" + val.value.map(myniceprint).join(", ") + "]";
  return cjs.niceprint(val).toString();
};

function sanityCheck(val) {
  if (typeof val !== "object")
    throw Error("value must be an object, is " + typeof(val));
  if (!val.hasOwnProperty("ctype"))
    throw Error("value must have a ctype");
  if (typeof val.ctype !== "string")
    throw Error("ctype is not a string");
  switch (val.ctype) {
  case "string":
    if (typeof val.value !== "string")
      throw Error("not a string");
    break;
  case "number":
    if (typeof val.value !== "object")
      throw Error("not a complex number object");
    if (typeof val.value.real !== "number")
      throw Error("real part is not a number");
    if (typeof val.value.imag !== "number")
      throw Error("imaginary part is not a number");
    break;
  case "boolean":
    if (typeof val.value !== "boolean")
      throw Error("not a boolean");
    break;
  case "list":
    if (!Array.isArray(val.value))
      throw Error("not an array");
    val.value.forEach(sanityCheck);
    break;
  case "undefined":
    break;
  default:
    throw Error("Unknown ctype: " + val.ctype);
  }
};

TestCase.prototype.run = function() {
  var val, actual, expected, clog = [], matches, expstr;
  var conlog = console.log;
  var conerr = console.error;
  console.log = function(str) { clog.push(str); };
  console.error = console.log;
  try {
    val = cjs.evalcs(this.cmd);
    sanityCheck(val);
  }
  catch (e) {
    if (this.exception !== null) {
      actual = e.toString();
      if (this.exception === actual)
        return true;
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Expected:  ! " + this.exception);
      println("Actual:    ! " + actual);
    } else {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Exception: ! " + e);
    }
    if (e.stack) println(e.stack);
    println("");
    return false;
  }
  finally {
    console.log = conlog;
    console.error = conerr;
  }
  if (this.output !== null || clog.length !== 0) {
    expected = this.output;
    if (expected === null) expected = [];
    if (expected.join("\n") !== clog.join("\n")) {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Expected:  * " + expected.join("\n           * "));
      println("Actual:    * " + clog.join("\n           * "));
      println("");
      return false;
    }
  }
  if (this.draw !== null) {
    expected = this.draw;
    if (expected.join("\n") !== fakeCanvas._log.join("\n")) {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Expected:  D " + expected.join("\n           D "));
      println("Actual:    D " + fakeCanvas._log.join("\n           D "));
      println("");
      return false;
    }
    fakeCanvas._log = [];
  }
  expected = this.expected;
  if (this.pattern !== null) {
    if (this.expected === null) {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("No nicely formatted result included with pattern.");
      println("");
    }
    else if (!this.pattern.test(this.expected)) {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Expected pattern does not match example expected result.");
      println("");
      return false;
    }
    expected = this.pattern;
  }
  if (expected !== null) {
    actual = myniceprint(val);
    if (expected instanceof RegExp) {
      expstr = expected.toString();
      expstr = "~ " + expstr.substring(1, expstr.length - 1);
      matches = expected.test(actual);
    }
    else {
      expstr = "< " + expected;
      matches = expected === actual;
    }
    if (!matches) {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Expected:  " + expstr);
      println("Actual:    < " + actual);
      println("");
      return false;
    }
  }
  return true;
};

function FakeCanvas() {
  this.width = 640;
  this.height = 480;
  this._log = [];
  this._unchanged = {width: this.width, height: this.height};
};
FakeCanvas.prototype.addEventListener = function() { };
FakeCanvas.prototype.removeEventListener = function() { };
FakeCanvas.prototype.writeLog = function(methodName, args) {
  var keys = Object.keys(this), map = Array.prototype.map;
  keys.sort();
  keys.forEach(function(k) {
    if (k.substr(0,1) === "_") return;
    if (this[k] !== this._unchanged[k]) {
      this._unchanged[k] = this[k];
      this._log.push(k + " = " + JSON.stringify(this[k]));
    }
  }, this);
  this._log.push(methodName + "(" +
                 map.call(args, JSON.stringify).join(", ") + ")");
};
FakeCanvas.prototype.measureText = function(txt) {
  return {
      width: 8*txt.length,
  };
};
[ "arc",
  "beginPath",
  "clearRect",
  "clip",
  "fill",
  "getContext",
  "lineTo",
  "moveTo",
  "restore",
  "save",
  "stroke",
  "strokeText",
  "fillText",
].forEach(function(m) {
  FakeCanvas.prototype[m] = function() {
    this.writeLog(m, arguments);
    return this;
  };
});

runAllTests();
