"use strict";

var fs = require("fs");
var path = require("path");
var util = require("util");
var marked = require("marked");

function escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function MyRenderer() {
  this.cjsUsedAnchors = {};
}

util.inherits(MyRenderer, marked.Renderer);

MyRenderer.prototype.code = function(code, lang) {
  if (lang) return marked.Renderer.prototype.code.call(this, code, lang);
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

MyRenderer.prototype.heading = function(text, level, raw) {
  var id = null;
  var match;
  if (!id && (match = /(\w+)\(([^)]*)\)/.exec(raw))) {
    // normal named functions
    var arity = 0;
    if (match[2] !== "")
      arity = match[2].split(",").length;
    id = match[1] + "$" + arity;
  }
  if (!id && (match = /`‹\w*›\s*(\S+)\s*‹\w*›`/.exec(raw))) {
    // infix operators
    id = match[1].replace(/./g, function(char) {
      return "$" + char.charCodeAt(0).toString(16) + "u";
    });
  }
  if (!id && (match = /`([^`]*)`/.exec(raw))) {
    // other code constructs
    match = match[1];
    id = match
      .replace(/\s+/g, "")
      .replace(/\$/g, "\\$24u")
      .replace(/_/g, "\\$5fu")
      .replace(/‹[^‹›]*›/g, "_")
      .replace(/\W/g, function(char) {
        return "$" + char.charCodeAt(0).toString(16) + "u";
      });
  }
  if (!id && (match = /([\w.]+)\s*=.*‹/.exec(raw))) {
    // Named settings with structure specification
    id = match[1];
  }
  if (!id && (match = /\u2039/.exec(raw))) {
    throw Error("Don't know how to create an ID for: " + raw);
  }
  if (!id) {
    // Final fallback
    id = raw.toLowerCase().replace(/[^\w.]+/g, '-');
  }
  if (this.cjsUsedAnchors.hasOwnProperty(id)) {
    var idx = 9, id2;
    do {
      ++idx;
      id2 = id + idx.toString(36); // append a, b, …
    } while (this.cjsUsedAnchors.hasOwnProperty(id2));
    id = id2;
  }
  //console.log(id);
  this.cjsUsedAnchors[id] = raw;
  return '<h' + level + ' id="' + id + '">' + text +
    '<a class="hlink" href="#' + id + '"></a></h' + level + '>\n';
};

MyRenderer.prototype.link = function(href, title, text) {
  if (href.indexOf("//") === -1)
    href = href.replace(/\.md$/, ".html");
  return marked.Renderer.prototype.link.call(this, href, title, text);
};

function makeOpts() {
  return {
    renderer: new MyRenderer()
  };
}

function renderBody(md, cb) {
    marked(md, makeOpts(), cb);
}

var tmpl = null;

function renderHtml(md, cb) {
    if (tmpl === null) {
        try {
            var tpath = require.resolve("../template.html");
            tmpl = fs.readFileSync(tpath).toString();
        } catch(err) {
            return cb(err, null);
        }
    }
    renderBody(md, function(err, html) {
        if (err) return cb(err, null);
        html = tmpl.replace(/<div id="content"><\/div>/, html);
        cb(null, html);
    });
}

function renderFileSync(infile, outfile) {
    var md = fs.readFileSync(infile).toString();
    renderHtml(md, function(err, html) {
        if (err) throw err;
        fs.writeFileSync(outfile, html);
    });
}

module.exports.renderBody = renderBody;
module.exports.renderHtml = renderHtml;

if (require.main === module)
    renderFileSync(process.argv[2], process.argv[3]);
