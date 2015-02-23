"use strict";

var fs = require("fs"), path = require("path"), marked = require("marked");

var refdir = path.dirname(__dirname);
var tmpl = fs.readFileSync(path.join(refdir, "template.html")).toString()
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
    "T ": "txt",
    "J ": "js",
    "> ": "code",
    "< ": "result",
    "~ ": "regexp",
    "* ": "output",
    "D ": "draw2d",
    "- ": "pragma",
  };
  var bcls = {
    "T ": "txtblock",
    "J ": "jsblock",
    "> ": "codeblock",
    "< ": "codeblock",
    "* ": "codeblock",
    "D ": "codeblock",
    "~ ": "codeblock",
  };
  var outer = 'block', prevmark = '', res = '';
  for (i = 0; i < n; ++i) {
    var mark = lines[i].substr(0, 2);
    outer = bcls[mark] || outer;
    if (mark !== prevmark) {
      if (i === 0)
        res += '<pre class="fst ';
      else
        res += '</pre><pre class="';
      res += cls[mark] + '">';
      prevmark = mark;
    }
    else
      res += '\n';
    res += escape(lines[i].substr(2));
  }
  return '<div class="' + outer + '">' + res + '</pre></div>';
};

var opts = {
  renderer: renderer
};

marked(md, opts, function(err, html) {
    if (err) throw err;
    html = tmpl.replace(/<div id="content"><\/div>/, html);
    fs.writeFileSync(process.argv[3], html);
});
