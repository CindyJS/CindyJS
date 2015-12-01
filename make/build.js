"use strict";

var task = require("./tasks").task;
var src = require("./sources");
var settings = require("./settings");
var glob = require("glob");
var path = require("path");

//////////////////////////////////////////////////////////////////////
// Download Closure Compiler
//////////////////////////////////////////////////////////////////////

var closure_zip = "compiler-" + settings.get("closure_version") + ".zip";
var closure_url = settings.get("closure_urlbase") + "/" + closure_zip;
var closure_archive = "download/arch/" + closure_zip;
var closure_jar = "download/closure-compiler/compiler-" +
    settings.get("closure_version") + ".jar";

task("closure-zip", [], function() {
    this.download(closure_url, closure_archive);
});

task("closure-jar", ["closure-zip"], function() {
    this.unzip(closure_archive, closure_jar, "compiler.jar");
});

//////////////////////////////////////////////////////////////////////
// Build different flavors of Cindy.js
//////////////////////////////////////////////////////////////////////

task("plain", [], function() {
    this.concat(src.srcs, "build/js/Cindy.plain.js");
});

task("ours", [], function() {
    this.concat(src.ours, "build/js/ours.js");
});

task("exposed", [], function() {
    this.concat(
        src.lib.concat("src/js/expose.js", src.inclosure),
        "build/js/exposed.js");
});

task("closure", ["plain", "closure-jar"], function() {
    settings.use("closure_version");
    this.closureCompiler(closure_jar, {
	language_in: settings.use("closure_language"),
	compilation_level: settings.use("closure_level"),
	js_output_file: "build/js/Cindy.closure.js",
        js: ["build/js/Cindy.plain.js"],
	create_source_map: "build/js/Cindy.closure.js.tmp.map",
	source_map_format: "V3",
	source_map_location_mapping: [
            "build/js/|",
            "src/js/|../../src/js/",
        ],
	output_wrapper_file: "src/js/Cindy.js.wrapper",
	warning_level: "DEFAULT",
    });
    this.applySourceMap([
        "build/js/Cindy.plain.js.map",
        "build/js/Cindy.closure.js.tmp.map",
    ], "build/js/Cindy.closure.js");
});

task("Cindy.js", [settings.get("js_compiler")], function() {
    var base = "Cindy." + settings.use("js_compiler") + ".js";
    var js = base.replace(/\./g, "\\.");
    var map = (base + ".map").replace(/\./g, "\\.");
    this.replace("build/js/" + base, "build/js/Cindy.js", [{
        search: new RegExp("sourceMappingURL=" + map),
        replace: "sourceMappingURL=Cindy.js.map"
    }]);
    this.replace("build/js/" + base + ".map", "build/js/Cindy.js.map", [{
        search: new RegExp('("file": *)"' + js + '"'),
        replace: '$1"Cindy.js"'
    }]);
});

//////////////////////////////////////////////////////////////////////
// Run js-beautify for consistent coding style
//////////////////////////////////////////////////////////////////////

var beautify_args = [
    "--replace",
    "--config", "Administration/beautify.conf",
    src.ours,
];

task("beautify", [], function() {
    this.cmdscript("js-beautify", beautify_args);
});

//////////////////////////////////////////////////////////////////////
// Run jshint to detect syntax problems
//////////////////////////////////////////////////////////////////////

task("jshint", ["ours"], function() {
    this.cmdscript(
        "jshint",
        "-c", "Administration/jshint.conf",
        "--verbose",
        "--reporter", "tools/jshint-reporter.js",
        "build/js/ours.js");
});

//////////////////////////////////////////////////////////////////////
// Run test suite from reference manual using node
//////////////////////////////////////////////////////////////////////

task("nodetest", ["plain"], function() {
    this.node("ref/js/runtests.js");
});

task("tests", [
    "nodetest",
    "unittests",
]);

//////////////////////////////////////////////////////////////////////
// Run separate unit tests to test various interna
//////////////////////////////////////////////////////////////////////

task("unittests", ["exposed"], function() {
    this.cmdscript("mocha", "tests");
});

//////////////////////////////////////////////////////////////////////
// Check for forbidden patterns in certain files
//////////////////////////////////////////////////////////////////////

/*
forbidden:
	! grep -Ero "<script[^>]*type *= *[\"'][^\"'/]*[\"']" examples
	! grep -Ero "<script[^>]*type *= *[\"']text/cindyscript[\"']" examples
	! grep -Er "firstDrawing" examples
	! grep -Er 'cinderella\.de/.* /Cindy.*\.js' examples
*/

//////////////////////////////////////////////////////////////////////
// Check that the code has been beautified
//////////////////////////////////////////////////////////////////////

task("alltests", [
    "tests",
    "jshint",
    "beautified",
    "deploy",
    "textattr",
]);
    
task("beautified", [], function() {
    this.cmd("git", "diff", "--exit-code", "--name-only");
    this.cmdscript("js-beautify", "--quiet", beautify_args);
    this.cmd("git", "diff", "--exit-code");
});

//////////////////////////////////////////////////////////////////////
// Check that the text property is set for all files
//////////////////////////////////////////////////////////////////////

task("textattr", [], function() {
    this.sh(
        "! git ls-files | git check-attr --stdin text | grep unspecified",
        "rem   check not performed on Windows"
    );
});

//////////////////////////////////////////////////////////////////////
// Format reference manual using markdown
//////////////////////////////////////////////////////////////////////

var refmd = glob.sync("ref/*.md");
var refimg = glob.sync("ref/img/*.png");
var refres = [
    "ref/ref.css"
];

task("refhtml", [], function() {
    this.parallel(function() {
        refmd.forEach(function(input) {
            var output = path.join("build", input.replace(/\.md$/, ".html"));
            this.node(
                "ref/js/md2html.js",
                this.input(input), this.output(output));
        }, this);
    });
});

task("refres", [], function() {
    this.parallel(function() {
        refres.forEach(function(input) {
            var output = path.join("build", input);
            this.copy(input, output);
        }, this);
    });
});

task("refimg", [], function() {
    this.parallel(function() {
        refimg.forEach(function(input) {
            var output = path.join("build", input);
            this.copy(input, output);
        }, this);
    });
});

task("ref", ["refhtml", "refres", "refimg"]);

//////////////////////////////////////////////////////////////////////
// Build JavaScript version of Cindy3D
//////////////////////////////////////////////////////////////////////

var c3d_primitives = "sphere cylinder triangle texq".split(" ");
var c3d_shaders = "lighting1.glsl lighting2.glsl common-frag.glsl".split(" ")
    .concat(c3d_primitives.map(function(name) { return name + "-vert.glsl"; }))
    .concat(c3d_primitives.map(function(name) { return name + "-frag.glsl"; }));
var c3d_str_res = c3d_shaders.map(function(name) {
    return "src/str/cindy3d/" + name;
});
var c3d_mods = [
    "ShaderProgram",
    "VecMat",
    "Camera",
    "Appearance",
    "Viewer",
    "Lighting",
    "PrimitiveRenderer",
    "Spheres",
    "Cylinders",
    "Triangles",
    "Interface",
    "Ops3D",
];

task("c3dres", [], function() {
    this.node(
        "tools/files2json.js",
        "-varname=c3d_resources",
        "-output=" + this.output("build/js/c3dres.js"),
        c3d_str_res);
});

task("cindy3d", ["c3dres", "closure-jar"], function() {
    settings.use("closure_version");
    var opts = {
	language_in: "ECMASCRIPT6_STRICT",
	language_out: "ECMASCRIPT5_STRICT",
	create_source_map: "build/js/Cindy3D.js.map",
	compilation_level: settings.use("c3d_closure_level"),
	warning_level: settings.use("c3d_closure_warnings"),
	source_map_format: "V3",
	source_map_location_mapping: [
            "build/js/|",
	    "src/js/|../../src/js/",
        ],
	output_wrapper_file: "src/js/cindy3d/Cindy3D.js.wrapper",
	js_output_file: "build/js/Cindy3D.js",
	externs: "src/js/cindy3d/cindyjs.externs",
	js: ["build/js/c3dres.js"].concat(c3d_mods.map(function(name) {
            return "src/js/cindy3d/" + name + ".js";
        })),
    };
    if (settings.use("cindy3d-dbg") !== undefined) {
        opts.transpile_only = true;
        opts.formatting = "PRETTY_PRINT";
    }
    this.closureCompiler(closure_jar, opts);
});

task("cindy3d-dbg", [], function() {
    this.node(process.argv[1], "cindy3d", "cindy3d-dbg=true");
});

//////////////////////////////////////////////////////////////////////
// Run GWT for each listed GWT module
//////////////////////////////////////////////////////////////////////

var gwt_zip = "gwt-" + settings.get("gwt_version") + ".zip";
var gwt_url = settings.get("gwt_urlbase") + "/" + gwt_zip;
var gwt_archive = "download/arch/" + gwt_zip;
var gwt_parts = [
    "gwt-dev",
    "gwt-user",
    "validation-api-1.0.0.GA",
    "validation-api-1.0.0.GA-sources",
];
var gwt_jars = gwt_parts.map(function(name) {
    return "download/gwt-" + settings.get("gwt_version") + "/" + name + ".jar";
});
var gwt_modules = glob.sync("src/java/cindyjs/*.gwt.xml").map(function(name) {
    return path.basename(name, ".gwt.xml");
});

task("gwt-zip", [], function() {
    this.download(gwt_url, gwt_archive);
});

task("gwt-jars", ["gwt-zip"], function() {
    this.unzip(gwt_archive, "download");
    this.parallel(function() {
        gwt_jars.forEach(function(name) {
            this.touch(name);
        }, this);
    });
});

function extra_args(args) {
    if (args === "") return [];
    return args.split(" ");
}

gwt_modules.forEach(function(gwt_module) {
    task(gwt_module, ["gwt-jars"], function() {
        settings.use("gwt_version");
        var mainFile = "build/js/" + gwt_module + "/" +
            gwt_module + ".nocache.js";
        this.delete("build/js/" + gwt_module);
        this.output(mainFile);
        var cp = ["src/java/"].concat(gwt_jars).join(path.delimiter);
        this.java(
            "-cp", cp,
            "com.google.gwt.dev.Compiler",
            "-war", "build/js",
            extra_args(settings.use("gwt_args")),
            "cindyjs." + gwt_module);
        this.touch(mainFile);
    });
});

task("gwt_modules", gwt_modules);

//////////////////////////////////////////////////////////////////////
// Copy KaTeX to build directory
//////////////////////////////////////////////////////////////////////

var katex_src = glob.sync("lib/katex/*.*")
    .concat(glob.sync("lib/katex/fonts/*.*"), "lib/webfont.js");

task("katex_src", [], function() {
    this.parallel(function() {
        katex_src.forEach(function(input) {
            this.copy(input, path.join("build", "js", input.substr(4)));
        }, this);
    });
});

task("katex-plugin", [], function() {
    this.copy("src/js/katex/katex-plugin.js", "build/js/katex-plugin.js");
});

task("katex", ["katex_src", "katex-plugin"]);

//////////////////////////////////////////////////////////////////////
// Copy things which constitute a release
//////////////////////////////////////////////////////////////////////

task("deploy", ["all", "closure"], function() {
    this.delete("build/deploy");
    this.mkdir("build/deploy");
    this.node("tools/prepare-deploy.js");
});

//////////////////////////////////////////////////////////////////////
// Help debugging a remote site
//////////////////////////////////////////////////////////////////////

task("proxy", [], function() {
    this.addJob(function() {
        console.log("Configure browser for host 127.0.0.1 port 8080.");
        console.log("Press Ctrl+C to interrupt once you are done.");
    });
    this.node("tools/CindyReplacingProxy.js");
});

//////////////////////////////////////////////////////////////////////
// Main target, build all common
//////////////////////////////////////////////////////////////////////

task("all", [
    "Cindy.js",
    "cindy3d",
    "katex",
].concat(gwt_modules));
