"use strict";

var fs = require("fs");
var path = require("path");
var SourceMapConsumer = require("source-map").SourceMapConsumer;

var reSourceMappingURL = /\/\/# sourceMappingURL=(.*)/g;

module.exports = {
  reporter: function (results, data, opts) {
    var len = results.length;
    var str = '';
    var prevfile;
    var prevorig;
    var smc;

    opts = opts || {};

    results.forEach(function (result) {
      var file = result.file;
      var error = result.error;
      var line = error.line;
      var col = error.character;

      if (prevfile !== file) {
        smc = null;
        var js = fs.readFileSync(file, {encoding:"utf8"});
        var match, smf = null;
        while ((match = reSourceMappingURL.exec(js)) !== null)
          smf = match[1];
        if (smf) {
          smf = path.resolve(path.dirname(file), smf);
          var smt = fs.readFileSync(smf, {encoding:"utf8"});
          smc = new SourceMapConsumer(smt);
        }
      }
      prevfile = file;

      if (smc) {
        var orig = smc.originalPositionFor({
          line: line,
          column: col
        });
        if (orig.source) {
          file = orig.source;
          file = file.replace(/^\.\.\/\.\.\/src\/js\//, "");
          line = orig.line;
          col = orig.column;
        }
      }
      if (prevorig && prevorig !== file) {
        str += "\n";
      }

      str += file  + ': line ' + line + ', col ' +
        col + ', ' + error.reason;

      if (opts.verbose) {
        str += ' (' + error.code + ')';
      }

      str += '\n';
    });

    if (str) {
      console.log(str + "\n" + len + ' error' + ((len === 1) ? '' : 's'));
    }
  }
};
