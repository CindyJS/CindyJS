"use strict";

var fs = require("fs"), path = require("path");
var createCindy = require("../build/js/Cindy.plain.js");
var println = console.log;

var reTestLine = /^    ([<>!.] )?(.*)/mg;
var failures = 0, numtests = 0;
var cjs = createCindy({
  "isNode": true,
  "csconsole": null,
});

function runAllTests() {
  var files = process.argv.slice(2);
  if (files.length === 0) {
    files = [];
    fs.readdirSync(__dirname).forEach(function(filename) {
      if (filename.match(/\.md$/))
        files.push(path.join(__dirname, filename));
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
  var cases = [], curcase = null, ininput = false, lineno = 1;
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
      } else if (mark === '! ') {
        curcase.expectException(rest);
      } else if (mark === '* ') {
        curcase.expectOutput(rest);
      } else if (mark === 'J ' || mark === 'T ') {
        // ignore
      } else {
        console.log("Unexpected line " + (lineno + i) + ": " + line);
      }
      ininput = false;
    }
    lineno += n + 1;
  });
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
TestCase.prototype.output = null;
TestCase.prototype.exception = null;

TestCase.prototype.expectResult = function(str) {
  if (this.expected !== null)
    console.err("Two results for command " + this.cmd);
  this.expected = str;
};

TestCase.prototype.expectOutput = function(str) {
  if (this.output === null)
    this.output = [];
  this.output.push(str);
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

TestCase.prototype.run = function() {
  var val, actual, expected, conlog, clog = [];
  conlog = console.log;
  console.log = function(str) { clog.push(str); }
  try {
    val = cjs.evalcs(this.cmd);
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
    println("");
    return false;
  }
  finally {
    console.log = conlog;
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
  if (this.expected !== null) {
    expected = this.expected;
    actual = myniceprint(val);
    if (expected !== actual) {
      println("Location:  " + this.filename + ":" + this.lineno);
      println("Input:     > " + this.cmd.replace(/\n/g, "\n           > "));
      println("Expected:  < " + expected);
      println("Actual:    < " + actual);
      println("");
      return false;
    }
  }
  return true;
};

runAllTests();
