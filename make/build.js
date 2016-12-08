"use strict";

var glob = require("glob");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");

var getversion = require("./getversion");
var src = require("./sources");

module.exports = function build(settings, task) {

    function jsCompiler() {
        if ((/release/i).test(settings.get("build")))
            return "closure";
        return "plain";
    }

    //////////////////////////////////////////////////////////////////////
    // Download Closure Compiler
    //////////////////////////////////////////////////////////////////////

    var closure_zip = "compiler-" + settings.get("closure_version") + ".zip";
    var closure_url = settings.get("closure_urlbase") + "/" + closure_zip;
    var closure_archive = "download/arch/" + closure_zip;
    var closure_jar = "download/closure-compiler/closure-compiler-v" +
        settings.get("closure_version") + ".jar";

    task("closure-zip", [], function() {
        this.download(closure_url, closure_archive);
    });

    task("closure-jar", ["closure-zip"], function() {
        this.unzip(closure_archive, closure_jar, "closure-compiler-v" +
        settings.get("closure_version") + ".jar");
    });

    //////////////////////////////////////////////////////////////////////
    // Build different flavors of Cindy.js
    //////////////////////////////////////////////////////////////////////

    var version = getversion.factory("build/js/Version.js", "var version");

    task("cs2js", [], function() {
        this.input("tools/cs2js.js");
        var cssrc = this.input(src.cssrc);
        var dst = this.output("build/js/Compiled.js");
        this.addJob(function() {
            return require("../tools/cs2js").compileFiles(cssrc)
                .then(function(jscode) {
                    return qfs.write(dst, jscode);
                });
        });
    });

    task("plain", ["cs2js"], function() {
        version(this);
        this.concat(src.srcs, "build/js/Cindy.plain.js");
    });

    task("ours", ["cs2js"], function() {
        version(this);
        this.concat(src.ours, "build/js/ours.js");
    });

    task("exposed", ["cs2js"], function() {
        version(this);
        this.concat(
            src.lib.concat("src/js/expose.js", src.inclosure),
            "build/js/exposed.js");
    });

    task("closure", ["plain", "closure-jar"], function() {
        this.setting("closure_version");
        this.closureCompiler(closure_jar, {
            language_in: this.setting("closure_language"),
            compilation_level: this.setting("closure_level"),
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

    task("Cindy.js", [jsCompiler()], function() {
        this.setting("build");
        var base = "Cindy." + jsCompiler() + ".js";
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
    // Make sure all examples compile
    //////////////////////////////////////////////////////////////////////

    task("excomp", [], function() {
        this.excomp(
            "examples/**/*.html",
            "src/js/libcs/Parser.js",
            function(html, parser) {
                var re = /<script[^>]*type *= *['"]text\/x-cindyscript['"][^>]*>([^]*?)<\/script>/g;
                var match, count = 0;
                while (match = re.exec(html)) {
                    ++count;
                    var res = parser.parse(match[1]);
                    if (res.ctype === "error") throw res;
                }
                return count;
            });
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
        "excomp",
    ]);

    //////////////////////////////////////////////////////////////////////
    // Run separate unit tests to test various interna
    //////////////////////////////////////////////////////////////////////

    task("unittests", ["exposed", "plain"], function() {
        this.cmdscript("mocha", "tests");
    });

    //////////////////////////////////////////////////////////////////////
    // Check for forbidden patterns in certain files
    //////////////////////////////////////////////////////////////////////

    task("forbidden", [], function() {
        this.forbidden("examples/**/*", [
            // Correct MIME type is "text/x-cindyscript"
            /<script[^>]*type *= *["'][^"'\/]*["']/g,          // requires /
            /<script[^>]*type *= *["']text\/cindyscript["']/g, // requires x-
            /.*firstDrawing.*/g, // excessive copy & paste of old example
            /.*(cinderella\.de|cindyjs\.org)\/.*\/Cindy.*\.js.*/g, // remote
            /<canvas[^>]+id=['"]CSCanvas/g,                    // use <div>
        ]);
        this.forbidden("ref/**/*.md", [
            /^#.*`.*<[A-Za-z0-9]+>.*?`/mg, // use ‹…› instead
        ]);
        this.forbidden(null, [
            /createCind[y](?!\.md[)#])[.(]/g, // use CindyJS instead
        ]);
    });

    //////////////////////////////////////////////////////////////////////
    // Check that the code has been beautified
    //////////////////////////////////////////////////////////////////////

    task("alltests", [
        "tests",
        "jshint",
        "beautified",
        "deploy",
        "textattr",
        "forbidden",
        "ref",
    ]);
    
    task("beautified", [], function() {
        this.cmd("git", "diff", "--exit-code", "--name-only", {
            errorMessages: {
                "1": "Please stage the files listed above (e.g. using “git add -u”)"
            }
        });
        this.cmdscript("js-beautify", "--quiet", beautify_args);
        this.cmd("git", "diff", "--exit-code", {
            errorMessages: {
                "1": "Your code has been beautified. Please review these changes."
            }
        });
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
        this.input(["ref/js/template.html", "ref/js/md2html.js"]);
        this.input(refmd);
        this.output(refmd.map(function(input) {
            return path.join("build", input.replace(/\.md$/, ".html"));
        }));
        this.mkdir("build/ref");
        this.node("ref/js/md2html", "-o", "build/ref", refmd);
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
    var c3d_shaders = "lighting1.glsl lighting2.glsl common-frag.glsl"
        .split(" ")
        .concat(c3d_primitives.map(
            function(name) { return name + "-vert.glsl"; }))
        .concat(c3d_primitives.map(
            function(name) { return name + "-frag.glsl"; }));
    var c3d_str_res = c3d_shaders.map(function(name) {
        return "plugins/cindy3d/src/str/" + name;
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
        c3d_str_res.forEach(this.input, this);
        this.node(
            "tools/files2json.js",
            "-varname=c3d_resources",
            "-output=" + this.output("build/js/c3dres.js"),
            c3d_str_res);
    });

    task("cindy3d", ["c3dres", "closure-jar"], function() {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT5_STRICT",
            dependency_mode: "LOOSE",
            create_source_map: "build/js/Cindy3D.js.map",
            compilation_level: this.setting("c3d_closure_level"),
            warning_level: this.setting("c3d_closure_warnings"),
            source_map_format: "V3",
            source_map_location_mapping: [
                "build/js/|",
                "plugins/|../../plugins/",
            ],
            output_wrapper_file: "plugins/cindy3d/src/js/Cindy3D.js.wrapper",
            js_output_file: "build/js/Cindy3D.js",
            externs: "plugins/cindyjs.externs",
            js: ["build/js/c3dres.js"].concat(c3d_mods.map(function(name) {
                return "plugins/cindy3d/src/js/" + name + ".js";
            })),
        };
        if (this.setting("cindy3d-dbg") !== undefined) {
            opts.compilation_level = "WHITESPACE_ONLY";
            opts.formatting = "PRETTY_PRINT";
        }
        this.closureCompiler(closure_jar, opts);
    });

    task("cindy3d-dbg", [], function() {
        this.node(process.argv[1], "cindy3d", "cindy3d-dbg=true");
    });


    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of CindyGL
    //////////////////////////////////////////////////////////////////////

    var cgl_primitives = "sphere cylinder triangle texq".split(" ");

    var cgl_str_res = glob.sync("plugins/cindygl/src/str/*.glsl");
    
    var cgl_mods = [
        "Init",
        "General",
        "CanvasWrapper",
        "Renderer",
        "Plugin",
        "TypeHelper",
        "IncludeFunctions",
        "LinearAlgebra",
        "WebGL",
        "CodeBuilder",
        "TextureReader"
    ];

    var cgl_mods_from_c3d = [
        "Interface",
        "ShaderProgram"
    ];

    var cgl_mods_srcs = cgl_mods.map(function(name) {
        return "plugins/cindygl/src/js/" + name + ".js";
    });

    var cgl_mods_from_c3d_srcs = cgl_mods_from_c3d.map(function(name) {
        return "plugins/cindy3d/src/js/" + name + ".js";
    });

    task("cglres", [], function() {
        cgl_str_res.forEach(this.input, this);
        this.node(
            "tools/files2json.js",
            "-varname=cgl_resources",
            "-output=" + this.output("build/js/cglres.js"),
            cgl_str_res);
    });

    task("cindygl", ["cglres", "closure-jar"], function() {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT5_STRICT",
            dependency_mode: "LOOSE",
            create_source_map: "build/js/CindyGL.js.map",
            compilation_level: this.setting("cgl_closure_level"),
            warning_level: this.setting("cgl_closure_warnings"),
            source_map_format: "V3",
            source_map_location_mapping: [
                "build/js/|",
                "plugins/|../../plugins/",
            ],
            output_wrapper_file: "plugins/cindygl/src/js/CindyGL.js.wrapper",
            js_output_file: "build/js/CindyGL.js",
            externs: "plugins/cindyjs.externs",
            js: ["build/js/cglres.js"]
                .concat(cgl_mods_srcs)
                .concat(cgl_mods_from_c3d_srcs),
        };
        if (this.setting("cindygl-dbg") !== undefined) {
            opts.compilation_level = "WHITESPACE_ONLY";
            opts.formatting = "PRETTY_PRINT";
        }
        this.closureCompiler(closure_jar, opts);
    });

    task("cindygl-dbg", [], function() {
        this.node(process.argv[1], "cindygl", "cindygl-dbg=true");
    });
    
    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of Quick Hull 3D
    //////////////////////////////////////////////////////////////////////

    var fileNames = [
        "QuickHull3D",
        "Vector",
        "VertexList",
        "HalfEdge",
        "Vertex",
        "VertexList",
        "Face",
        "FaceList",
        "Plugin"
    ];

    var srcs = fileNames.map(function(fileName) {
        return "plugins/QuickHull3D/src/js/" + fileName + ".js";
    });

    task("quickhull3d", ["closure-jar"], function() {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT5_STRICT",
            dependency_mode: "LOOSE",
            create_source_map: "build/js/QuickHull3D.js.map",
            compilation_level: this.setting("qh3d_closure_level"),
            warning_level: this.setting("qh3d_closure_warnings"),
            source_map_format: "V3",
            source_map_location_mapping: [
                "build/js/|",
                "plugins/|../../plugins/",
            ],
            output_wrapper_file: "plugins/QuickHull3D/src/js/QuickHull3D.js.wrapper",
            js_output_file: "build/js/QuickHull3D.js",
            externs: "plugins/cindyjs.externs",
            js: srcs
        };
        this.closureCompiler(closure_jar, opts);
    });


    //////////////////////////////////////////////////////////////////////
    // Run js-beautify for consistent coding style
    //////////////////////////////////////////////////////////////////////

    var beautify_args = [
        "--replace",
        "--config", "Administration/beautify.conf",
        (src.ours).concat(cgl_mods_srcs).filter(function(name) {
            return !/^build\//.test(name);
        }),
    ];

    task("beautify", [], function() {
        this.cmdscript("js-beautify", beautify_args);
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
        return "gwt-" + settings.get("gwt_version") + "/" +
            name + ".jar";
    });
    var gwt_modules = glob.sync("src/java/cindyjs/*.gwt.xml")
        .map(function(name) {
            return path.basename(name, ".gwt.xml");
        });

    task("gwt-zip", [], function() {
        this.download(gwt_url, gwt_archive);
    });

    task("gwt-jars", ["gwt-zip"], function() {
        this.unzip(gwt_archive, "download", gwt_jars);
    });

    function extra_args(args) {
        if (args === "") return [];
        return args.split(" ");
    }

    gwt_modules.forEach(function(gwt_module) {
        task(gwt_module, ["gwt-jars"], function() {
            this.setting("gwt_version");
            var mainFile = "build/js/" + gwt_module + "/" +
                gwt_module + ".nocache.js";
            this.delete("build/js/" + gwt_module);
            this.output(mainFile);
            var cp = ["src/java/"].concat(gwt_jars.map(function(name) {
                return "download/" + name;
            })).join(path.delimiter);
            this.java(
                "-cp", cp,
                "com.google.gwt.dev.Compiler",
                "-war", "build/js",
                extra_args(this.setting("gwt_args")),
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
        this.copy("plugins/katex/src/js/katex-plugin.js", "build/js/katex-plugin.js");
    });

    task("katex", ["katex_src", "katex-plugin"]);

    //////////////////////////////////////////////////////////////////////
    // Compile SASS to CSS
    //////////////////////////////////////////////////////////////////////

    task("sass", [], function() {
        this.parallel(function() {
            src.scss.forEach(function(input) {
                var name = path.basename(input, ".scss") + ".css";
                this.sass(input, path.join("build", "js", name));
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Copy additional libraries used for some features
    //////////////////////////////////////////////////////////////////////

    var extra_libs = [
        "node_modules/pako/dist/pako.min.js",
    ];

    task("xlibs", [], function() {
        this.parallel(function() {
            extra_libs.forEach(function(input) {
                var output = path.join("build", "js", path.basename(input));
                this.copy(input, output);
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Copy images to build directory
    //////////////////////////////////////////////////////////////////////

    var images = glob.sync("images/*.{png,jpg,svg}");

    task("images", [], function() {
        this.parallel(function() {
            images.forEach(function(input) {
                this.copy(input, path.join("build", "js", input));
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Copy things which constitute a release
    //////////////////////////////////////////////////////////////////////

    task("deploy", ["all", "closure"], function() {
        this.delete("build/deploy");
        this.mkdir("build/deploy");
        this.node("tools/prepare-deploy.js", {
            errorMessages: {
                "2": "Unknown files; running “make clean” may help here"
            }
        });
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
        "cindygl",
        "quickhull3d",
        "katex",
        "xlibs",
        "images",
        "sass",
    ].concat(gwt_modules));

};
