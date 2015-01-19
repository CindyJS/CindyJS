"use strict";

var fs = require("fs"), path = require("path"), marked = require("marked");

var tmpl = fs.readFileSync(path.join(__dirname, "template.html")).toString()
var md = fs.readFileSync(process.argv[2]).toString();

function escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var renderer = new marked.Renderer();

renderer.code = function(code, lang) {
  if (lang) return marked.Renderer.prototype.code(code, lang);
  // console.log("code='" + code + "'")
  var lines = code.split("\n");
  var n = lines.length, i;
  if (lines[n-1] === "") --n;
  var cls = {
    "> ": "code",
    "< ": "result",
    "* ": "output",
    "- ": "pragma",
  };
  var res = '<div class="codeblock"><pre class="fst ' +
            cls[lines[0].substr(0, 2)] + '">' + escape(lines[0].substr(2));
  for (i = 1; i < n; ++i) {
    if (lines[i].substr(0, 2) !== lines[i - 1].substr(0, 2))
      res += '</pre><pre class="' + cls[lines[i].substr(0, 2)] + '">';
    else
      res += '\n';
    res += escape(lines[i].substr(2));
  }
  res += '</pre></div>';
  return res;
};

var opts = {
  renderer: renderer
};

marked(md, opts, function(err, html) {
    if (err) throw err;
    html = tmpl.replace(/<div id="content"><\/div>/, html);
    fs.writeFileSync(process.argv[3], html);
});
