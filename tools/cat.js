"use strict";

var fs = require("fs");
var util = require("util");
var stream = require("stream");
var path = require("path");
var sourcemap = require("source-map");

function LineCounter(source) {
  stream.Transform.call(this, {});
  this.atLF = false;
  this.source = source;
  this.line = 0;
  this.col = 0;
}
util.inherits(LineCounter, stream.Transform);
LineCounter.prototype._transform = function (chunk, encoding, callback) {
  for (var i = 0; i < chunk.length; ++i) {
    var chr = chunk[i];
    ++this.col;
    if (this.atLF = (chr === 10)) {
      if (this.line !== 0)
        smg.addMapping({
          generated: { line: outLine, column: this.col },
          source: this.source,
          original: { line: this.line, column: this.col }
        });
      this.col = 0;
      smg.addMapping({
        generated: { line: ++outLine, column: 0 },
        source: this.source,
        original: { line: ++this.line, column: 0 }
      });
    }
  }
  this.push(chunk);
  callback();
};
LineCounter.prototype._flush = function (callback) {
  if (!this.atLF) {
    ++this.col;
    smg.addMapping({
      generated: { line: outLine, column: this.col },
      source: this.source,
      original: { line: this.line, column: this.col }
    });
    ++outLine;
    ++this.line;
    this.col = 0;
    this.push(this.NL);
  }
  callback();
};
LineCounter.prototype.NL = new Buffer([10]);

function relative(from, to) {
  return path.relative(path.dirname(from), to);
}

var inputs = [], lines = [], out = null, map = null;
var outStream, smg, outLine = 0;

function processCommandLine() {
  var args = process.argv, n = args.length, i, arg;
  for (i = 2; i < n; ++i) {
    arg = args[i];
    if (arg === "-o" && i + 1 < n) {
      out = args[i + 1];
      ++i;
    }
    else if (arg.substr(0, 2) === "-o") {
      out = arg.substr(2);
    }
    else if (arg === "-m" && i + 1 < n) {
      map = args[i + 1];
      ++i;
    }
    else if (arg.substr(0, 2) === "-m") {
      map = arg.substr(2);
    }
    else {
      inputs.push(arg);
    }
  }

  if (out !== null) {
    if (map === null)
      map = out + ".map";
  }
  smg = new sourcemap.SourceMapGenerator({file: relative(map, out)});
  outStream = out ? fs.createWriteStream(out) : process.stdout;
  more(0);
}

process.nextTick(processCommandLine);

function more(i) {
  if (i >= inputs.length) return done();
  var lct = new LineCounter(relative(map, inputs[i]));
  fs.createReadStream(inputs[i]).pipe(lct).pipe(outStream, {end:false});
  lct.on('end', more.bind(null, i + 1));
}

function done() {
  if (!out) return;
  outStream.write("//# sourceMappingURL=" + relative(out, map) + "\n");
  outStream.end();
  fs.writeFileSync(map, smg.toString());
}
