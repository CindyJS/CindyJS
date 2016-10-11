"use strict";

var fs = require("fs");
var os = require("os");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");
var util = require("util");
var marked = require("marked");

function escape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

//////////////////////////////////////////////////////////////////////
// My Renderer: customize Markdown rendering

function MyRenderer(page) {
  this.cjsPage = page;
  this.cjsUsedAnchors = {};
}

util.inherits(MyRenderer, marked.Renderer);

MyRenderer.prototype.code = function(code, lang) {
  if (lang) {
    return '<pre class="block"><code class="lang-' + lang + '">' +
      escape(code) + '\n</code></pre>\n';
  }
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
    "G ": "geo",
    "- ": "pragma",
  };
  var bcls = {
    "T ": "txtblock",
    "J ": "jsblock",
    "> ": "codeblock",
    "< ": "codeblock",
    "* ": "codeblock",
    "D ": "codeblock",
    "G ": "codeblock",
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
  var ids = [];
  var re, match, cur, arity;
  re = /`([^`]*)`/g;
  while (match = re.exec(raw)) {
    cur = match[1];
    if (match = /(\w+)\(([^)]*)\)/.exec(cur)) {
      // normal named functions
      arity = 0;
      if (match[2] !== "")
        arity = match[2].split(",").length;
      ids.push(match[1] + "$" + arity);
    } else if (match = /`‹\w*›\s*(\S+)\s*‹\w*›`/.exec(cur)) {
      // infix operators
      ids.push(match[1].replace(/./g, function(char) {
        return "$" + char.charCodeAt(0).toString(16) + "u";
      }));
    } else {
      // other code constructs
      ids.push(cur
        .replace(/\s+/g, "")
        .replace(/\$/g, "$$24u")
        .replace(/_/g, "$$5fu")
        .replace(/‹[^‹›]*›/g, "_")
        .replace(/…/g, "__")
        .replace(/[^\w$]/g, function(char) {
          return "$" + char.charCodeAt(0).toString(16) + "u";
        }));
    }
  }
  if (!ids.length && (match = /(\w+)\(([^)]*)\)/.exec(raw))) {
    // normal named functions but not formatted as code
    arity = 0;
    if (match[2] !== "")
      arity = match[2].split(",").length;
    ids.push(match[1] + "$" + arity);
  }
  if (!ids.length && (match = /([\w.]+)\s*=.*‹/.exec(raw))) {
    // Named settings with structure specification
    ids.push(match[1]);
  }
  if (!ids.length && (match = /‹/.exec(raw))) {
    throw Error("Don't know how to create an ID for: " + raw);
  }
  if (!ids.length) {
    // Final fallback
    ids.push(raw.toLowerCase().replace(/[^\w.]+/g, '-'));
  }
  var usedAnchors = this.cjsUsedAnchors;
  ids = ids.map(function(id) {
    if (usedAnchors.hasOwnProperty(id)) {
      var idx = 9, id2;
      do {
        ++idx;
        id2 = id + idx.toString(36); // append a, b, …
      } while (usedAnchors.hasOwnProperty(id2));
      id = id2;
    }
    //console.log(id);
    usedAnchors[id] = raw;
    return id;
  });
  var id0 = ids[0];
  ids = ids.slice(1).map(function(id) {
    return '<a class="hlink" id="' + id + '" href="#' + id + '"></a>';
  }).join('');
  return '<h' + level + ' id="' + id0 + '">' + text +
    '<a class="hlink" href="#' + id0 + '"></a>' + ids + '</h' + level + '>\n';
};

MyRenderer.prototype.link = function(href, title, text) {
  if (href.indexOf("//") === -1)
    href = href.replace(/\.md($|#)/, ".html$1");
  return marked.Renderer.prototype.link.call(this, href, title, text);
};

MyRenderer.prototype.table = function() {
  // Omit empty table headers
  var html = marked.Renderer.prototype.table.apply(this, arguments);
  return html.replace(/<thead>\n<tr>\n(<th><\/th>\n)*<\/tr>\n<\/thead>/, "");
};

//////////////////////////////////////////////////////////////////////
// Page objects represent one MD or HTML page each

function Page(name) {
    this.name = name;
};

Page.prototype.toString = function() {
  return "[Page " + this.name + "]";
};

Page.prototype.makeOpts = function() {
  return {
    renderer: new MyRenderer(this)
  };
};

Page.prototype.renderBody = function() {
  var self = this;
  return Q.nfcall(marked, this.md, this.makeOpts())
    .then(function(html) {
      self.html = html;
      return self;
    });
};

Page.template = function(errorCallback) {
    var tpath = require.resolve("../template.html");
    var tmpl = fs.readFileSync(tpath, "utf-8");
    Page.template = function(errorCallback) {
        return tmpl;
    };
    return tmpl;
};

//////////////////////////////////////////////////////////////////////
// Pipelines: perform operations on a set of pages

/**
 * The in-memory pipeline does bare bones conversion,
 * with no file I/O and no templates applied to the documents.
 *
 * For each page:
 *   addPage(‹string›, ‹string›) called by external code, returns a promise
 *   pageRendered(‹Page›) called after marked is done, may change HTML
 *   writePage(‹Page›) to write a page to output file or similar
 * Global:
 *   done() called by external code after all pages were added, returns promise
 *   postprocess(‹Array of Page objects›) called after all pages are rendered
 */

function InMemoryPipeline() {
  this.pages = [];
}

InMemoryPipeline.prototype.createPage = function(name) {
  return new Page(name);
};

InMemoryPipeline.prototype.addPage = function(name, md) {
  var self = this;
  var page = this.createPage(name);
  var res = Q(md)
      .then(function(md) {
        page.md = md;
        return page.renderBody();
      })
      .then(this.pageRendered.bind(this, page))
      .then(this.writePage.bind(this, page))
      .thenResolve(page);
  this.pages.push(res);
  return res;
};

InMemoryPipeline.prototype.pageRendered = function(page) {
  // no-op, may be overwritten by derived classes
};

InMemoryPipeline.prototype.writePage = function(page) {
  // no-op, may be overwitten by derived classes
};

InMemoryPipeline.prototype.done = function() {
  return Q.all(this.pages)
    .then(this.postprocess.bind(this));
};

InMemoryPipeline.prototype.postprocess = function(pages) {
  this.checkLinks(pages);
  return this.createIndex(pages);
};

InMemoryPipeline.prototype.checkLinks = function(pages) {
  var targets = {
    "ref.css": true,
  };
  pages.forEach(function(page) {
    targets[page.name] = true;
    var re = /<[^>]+\sid=(["'])([^"'<>]+)\1[\s>]/g;
    var match;
    while (match = re.exec(page.html))
      targets[page.name + "#" + match[2]] = true;
  });
  var internal = {};
  var external = {};
  var broken = {};
  pages.forEach(function(page) {
    var re = /<[^>]+\shref\s*=\s*(["'])([^"'<>]+)\1[\s>]/g;
    var match;
    while (match = re.exec(page.html)) {
      var href = match[2];
      if (/^#/.test(href))
        href = page.name + href;
      if (targets.hasOwnProperty(href)) {
        internal[href] = true;
        continue;
      }
      var kind = broken;
      if (/^[a-z]+:\/\//.test(href))
        kind = external;
      if (!kind.hasOwnProperty(href))
        kind[href] = [];
      kind[href].push(page);
    }
  });
  external = Object.keys(external);
  if (external.length) {
    console.log("External links: ");
    external.sort().forEach(function(href) {
      console.log("  - " + href);
    });
  }
  if (Object.keys(broken).length) {
    console.log("Broken internal links: ");
    Object.keys(broken).sort().forEach(function(href) {
      console.log("  - " + href + " used by");
      broken[href].forEach(function(page) {
        console.log("    * " + page.name);
      });
    });
  }
};

InMemoryPipeline.prototype.createIndex = function(pages) {
  var indexPage = new Page("Alphabetical_Function_Index.html");
  indexPage.html = "<h1>Alphabetical Function Index</h1><table></table>";
  return Q(this.pageRendered(indexPage))
    .then(this.writePage.bind(this, indexPage))
    .delay(500)
    .thenResolve(indexPage);
};

/**
 * The file-based pipeline adds file I/O and templating to the above.
 */

function FileBasedPipeline(outdir) {
  InMemoryPipeline.call(this);
  this.outdir = outdir;
  this.tmpl = this.template();
}

util.inherits(FileBasedPipeline, InMemoryPipeline);

FileBasedPipeline.prototype.processFiles = function(names) {
  names.forEach(this.addFile, this);
  return this.done();
};

FileBasedPipeline.prototype.addFile = function(file) {
  var name = path.basename(file, ".md") + ".html";
  return this.addPage(name, qfs.read(file));
};

FileBasedPipeline.prototype.template = function() {
  var tpath = require.resolve("../template.html");
  return fs.readFileSync(tpath, "utf-8");
};

FileBasedPipeline.prototype.pageRendered = function(page) {
  var html = page.html;
  html = html.replace(/\$/g, "$$$$"); // to be used in String.replace
  html = this.tmpl.replace(/<div id="content"><\/div>/, html);
  page.html = html;
};

FileBasedPipeline.prototype.writePage = function(page) {
  return qfs.write(path.join(this.outdir, page.name), page.html);
};

//////////////////////////////////////////////////////////////////////
// Public API and command line

function main() {
  var exitStatus = 3;
  process.once("beforeExit", function() {
    process.exit(exitStatus);
  });

  var args = process.argv.slice(2);
  var outDir = "build/ref";
  if (args[0] === "-o") {
    outDir = args[1];
    args.splice(0, 2);
  }
  var pipeline = new FileBasedPipeline(outDir);
  pipeline.processFiles(args).done(function() {
    exitStatus = 0;
  }, function(err) {
    console.error(err + "\n" + err.stack);
    exitStatus = 1;
  });
}

// Backwards-compatibility since this was used in website creation
module.exports.renderBody = function(md, cb) {
  var page = new Page(null, md);
  page.then(function() {
    cb(null, page.html);
  }, function(err) {
    cb(err, null);
  });
}

module.exports.Page = Page;
module.exports.InMemoryPipeline = InMemoryPipeline;
module.exports.FileBasedPipeline = FileBasedPipeline;

if (require.main === module)
    main();
