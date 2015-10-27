"use strict";

var fs = require("fs");
var sourcemap = require('source-map');
var Consumer = sourcemap.SourceMapConsumer;
var Generator = sourcemap.SourceMapGenerator;

var n = 0, maps = [], file = null;

function processCommandLine() {
  for (var i = 2; i < process.argv.length; ++i) {
    var arg = process.argv[i];
    if (arg === "-f" && i + 1 < process.argv.length)
      file = process.argv[++i];
    else if (arg.substr(0, 2) === "-f")
      file = arg.substr(2);
    else
      open(arg);
  }
}

process.nextTick(processCommandLine);

function open(path) {
  var i = n++;
  fs.readFile(path, {encoding:"utf8"}, function(err, data) {
    if (err) throw err;
    maps[i] = new sourcemap.SourceMapConsumer(data);
    if (--n === 0) done();
  });
}

function done() {
  var i = maps.length - 1;
  var generator = Generator.fromSourceMap(maps[i]);
  while (i-- > 0) {
    generator.applySourceMap(maps[i]);
  }
  var map = generator.toJSON();
  if (file !== null)
    map.file = file;
  process.stdout.write(JSON.stringify(map));
}
