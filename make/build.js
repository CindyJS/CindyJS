"use strict";

var fs = require("fs");
var glob = require("glob");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");

var getversion = require("./getversion");
var src = require("./sources");

var soundfonts = require("./soundfonts");

module.exports = function build(settings, task) {
    function jsCompiler() {
        if (/release/i.test(settings.get("build"))) return "closure";
        return "plain";
    }

    function emDep() {
        if (settings.get("em")) return Array.prototype.slice.call(arguments);
        return [];
    }

    //////////////////////////////////////////////////////////////////////
    // Download Closure Compiler
    //////////////////////////////////////////////////////////////////////

    const closure_url = `${settings.get("closure_urlbase")}/${settings.get(
        "closure_version"
    )}/closure-compiler-${settings.get("closure_version")}.jar`;

    const closure_jar = `download/closure-compiler/closure-compiler-${settings.get("closure_version")}.jar`;

    task("closure-jar", [], function () {
        this.download(closure_url, closure_jar);
    });

    //////////////////////////////////////////////////////////////////////
    // Run TypeScript Compiler
    //////////////////////////////////////////////////////////////////////

    task("typescript", [], function () {
        this.cmdscript("tsc");
    });

    //////////////////////////////////////////////////////////////////////
    // Build different flavors of Cindy.js
    //////////////////////////////////////////////////////////////////////

    var version = getversion.factory("build/js/Version.js", "var version");

    task("cs2js", [], function () {
        this.input("tools/cs2js.js");
        var cssrc = this.input(src.cssrc);
        var dst = this.output("build/js/Compiled.js");
        this.addJob(function () {
            return require("../tools/cs2js")
                .compileFiles(cssrc)
                .then(function (jscode) {
                    return qfs.write(dst, jscode);
                });
        });
    });

    task("plain", ["cs2js", "typescript"], function () {
        version(this);
        this.concat(src.srcs, "build/js/Cindy.plain.js");
    });

    task("ifs", emDep("em.ifs"), function () {
        this.concat(src.ifs, "build/js/ifs.js");
    });

    task("em.ifs", [], function () {
        var settings = {
            ONLY_MY_CODE: 1,
            EXPORTED_FUNCTIONS: ["_real", "_init", "_setIFS", "_setProj", "_setMoebius"],
        };
        var args = [
            "--std=c++11",
            "-Wall",
            "-O3",
            "-g1",
            "--separate-asm",
            "-o",
            this.output("src/js/ifs/ifs.js"),
            this.input("src/c/ifs/ifs.cc"),
        ];
        for (var key in settings) {
            args.push("-s", key + "=" + JSON.stringify(settings[key]));
        }
        this.cmd("em++", args);
    });

    task("ours", ["cs2js", "typescript"], function () {
        version(this);
        this.concat(src.ours, "build/js/ours.js");
    });

    task("exposed", ["cs2js", "typescript"], function () {
        version(this);
        this.concat(src.lib.concat("build/ts/expose.js", src.inclosure), "build/js/exposed.js");
    });

    task("closure", ["plain", "closure-jar"], function () {
        this.setting("closure_version");
        this.closureCompiler(closure_jar, {
            language_in: this.setting("closure_language_in"),
            language_out: this.setting("closure_language_out"),
            compilation_level: this.setting("closure_level"),
            js_output_file: "build/js/Cindy.closure.js",
            js: ["build/js/Cindy.plain.js"],
            create_source_map: "build/js/Cindy.closure.js.tmp.map",
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "src/js/|../../src/js/"],
            output_wrapper_file: "src/js/Cindy.js.wrapper",
            warning_level: "DEFAULT",
        });
        this.applySourceMap(
            ["build/js/Cindy.plain.js.map", "build/js/Cindy.closure.js.tmp.map"],
            "build/js/Cindy.closure.js"
        );
    });

    task("Cindy.js", [jsCompiler()], function () {
        this.setting("build");
        var base = "Cindy." + jsCompiler() + ".js";
        var js = base.replace(/\./g, "\\.");
        var map = (base + ".map").replace(/\./g, "\\.");
        this.replace("build/js/" + base, "build/js/Cindy.js", [
            {
                search: new RegExp("sourceMappingURL=" + map),
                replace: "sourceMappingURL=Cindy.js.map",
            },
        ]);
        this.replace("build/js/" + base + ".map", "build/js/Cindy.js.map", [
            {
                search: new RegExp('("file": *)"' + js + '"'),
                replace: '$1"Cindy.js"',
            },
        ]);
    });

    //////////////////////////////////////////////////////////////////////
    // Run eslint to detect syntax problems
    //////////////////////////////////////////////////////////////////////

    task("eslint", ["ours"], callEslint);
    task("jshint", ["ours"], callEslint);

    function callEslint() {
        this.cmdscript("eslint", "src/js/**/*.[jt]s");
        this.cmdscript("eslint", "-f", "tools/eslint-reporter.js", "build/js/ours.js");
    }

    //////////////////////////////////////////////////////////////////////
    // Make sure all examples compile
    //////////////////////////////////////////////////////////////////////

    task("excomp", [], function () {
        this.excomp("examples/**/*.html", "src/js/libcs/Parser.js", function (html, parser) {
            var re = /<script[^>]*type *= *['"]text\/x-cindyscript['"][^>]*>([^]*?)<\/script>/g;
            var match,
                count = 0;
            while ((match = re.exec(html))) {
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

    task("nodetest", ["plain"], function () {
        this.node("ref/js/runtests.js");
    });

    task("tests", ["closure", "nodetest", "unittests", "excomp"]);

    //////////////////////////////////////////////////////////////////////
    // Run separate unit tests to test various interna
    //////////////////////////////////////////////////////////////////////

    task("unittests", ["exposed", "plain"], function () {
        this.cmdscript("mocha", "tests");
    });

    //////////////////////////////////////////////////////////////////////
    // Check for forbidden patterns in certain files
    //////////////////////////////////////////////////////////////////////

    task("forbidden", [], function () {
        this.forbidden("examples/**/*.html", [
            // Correct MIME type is "text/x-cindyscript"
            /<script[^>]*type *= *["'][^"'\/]*["']/g, // requires /
            /<script[^>]*type *= *["']text\/cindyscript["']/g, // requires x-
            /firstDrawing/g, // excessive copy & paste of old example
            /(cinderella\.de|cindyjs\.org)\/.*\/Cindy.*\.js/g, // remote
            /<canvas[^>]+id=['"]CSCanvas/g, // use <div>
            /quickhull3d\.nocache\.js/g, // use of JAVA-Version of quickhull
        ]);
        this.forbidden("ref/**/*.md", [
            /^#.*`.*<[A-Za-z0-9]+>.*?`/gm, // use ‹…› instead
        ]);
        this.forbidden(null, [
            /createCind[y](?!\.md[)#])[.(]/g, // use CindyJS instead
        ]);
    });

    task("alltests", ["tests", "eslint", "deploy", "textattr", "forbidden", "ref"]);

    //////////////////////////////////////////////////////////////////////
    // Check that the text property is set for all files
    //////////////////////////////////////////////////////////////////////

    task("textattr", [], function () {
        this.sh(
            "! git ls-files | git check-attr --stdin text | grep unspecified",
            "rem   check not performed on Windows"
        );
    });

    //////////////////////////////////////////////////////////////////////
    // Format reference manual using markdown
    //////////////////////////////////////////////////////////////////////

    var refmd = glob.sync("ref/*.md");
    var refimg = glob.sync("ref/img/**/*.png");
    var refres = ["ref/ref.css"];

    task("refhtml", [], function () {
        this.input(["ref/js/template.html", "ref/js/md2html.js"]);
        this.input(refmd);
        this.output(
            refmd.map(function (input) {
                return path.join("build", input.replace(/\.md$/, ".html"));
            })
        );
        this.mkdir("build/ref");
        this.node("ref/js/md2html", "-o", "build/ref", refmd);
    });

    task("refres", [], function () {
        this.parallel(function () {
            refres.forEach(function (input) {
                var output = path.join("build", input);
                this.copy(input, output);
            }, this);
        });
    });

    task("refimg", [], function () {
        this.parallel(function () {
            refimg.forEach(function (input) {
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
        .concat(
            c3d_primitives.map(function (name) {
                return name + "-vert.glsl";
            })
        )
        .concat(
            c3d_primitives.map(function (name) {
                return name + "-frag.glsl";
            })
        );
    var c3d_str_res = c3d_shaders.map(function (name) {
        return "plugins/cindy3d/src/str/" + name;
    });
    var c3d_mods = [
        "ShaderProgram",
        "VecMat",
        "Camera",
        "Appearance",
        "Viewer",
        "Controls",
        "Lighting",
        "PrimitiveRenderer",
        "Spheres",
        "Cylinders",
        "Triangles",
        "Interface",
        "Ops3D",
    ];

    task("c3dres", [], function () {
        c3d_str_res.forEach(this.input, this);
        this.node(
            "tools/files2json.js",
            "-varname=c3d_resources",
            "-output=" + this.output("build/js/c3dres.js"),
            c3d_str_res
        );
    });

    task("cindy3d", ["c3dres", "closure-jar"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6_STRICT",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/Cindy3D.js.map",
            compilation_level: this.setting("c3d_closure_level"),
            warning_level: this.setting("c3d_closure_warnings"),
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            output_wrapper_file: "plugins/cindy3d/src/js/Cindy3D.js.wrapper",
            js_output_file: "build/js/Cindy3D.js",
            externs: "plugins/cindyjs.externs",
            js: ["build/js/c3dres.js"].concat(
                c3d_mods.map(function (name) {
                    return "plugins/cindy3d/src/js/" + name + ".js";
                })
            ),
        };
        if (this.setting("cindy3d-dbg") !== undefined) {
            opts.compilation_level = "WHITESPACE_ONLY";
            opts.formatting = "PRETTY_PRINT";
        }
        this.closureCompiler(closure_jar, opts);
    });

    task("cindy3d-dbg", [], function () {
        this.node(process.argv[1], "cindy3d", "cindy3d-dbg=true");
    });

    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of CindyGL
    //////////////////////////////////////////////////////////////////////

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
        "Sorter",
        "WebGL",
        "CodeBuilder",
        "TextureReader",
    ];

    var cgl_mods_from_c3d = ["Interface", "ShaderProgram"];

    var cgl_mods_srcs = cgl_mods.map(function (name) {
        return "plugins/cindygl/src/js/" + name + ".js";
    });

    var cgl_mods_from_c3d_srcs = cgl_mods_from_c3d.map(function (name) {
        return "plugins/cindy3d/src/js/" + name + ".js";
    });

    task("cglres", [], function () {
        cgl_str_res.forEach(this.input, this);
        this.node(
            "tools/files2json.js",
            "-varname=cgl_resources",
            "-output=" + this.output("build/js/cglres.js"),
            cgl_str_res
        );
    });

    task("cindygl", ["cglres", "closure-jar"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6_STRICT",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/CindyGL.js.map",
            compilation_level: this.setting("cgl_closure_level"),
            warning_level: this.setting("cgl_closure_warnings"),
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            output_wrapper_file: "plugins/cindygl/src/js/CindyGL.js.wrapper",
            js_output_file: "build/js/CindyGL.js",
            externs: "plugins/cindyjs.externs",
            js: ["build/js/cglres.js"].concat(cgl_mods_srcs).concat(cgl_mods_from_c3d_srcs),
        };
        if (this.setting("cindygl-dbg") !== undefined) {
            opts.compilation_level = "WHITESPACE_ONLY";
            opts.formatting = "PRETTY_PRINT";
        }
        this.closureCompiler(closure_jar, opts);
    });

    task("cindygl-dbg", [], function () {
        this.node(process.argv[1], "cindygl", "cindygl-dbg=true");
    });

    //////////////////////////////////////////////////////////////////////
    // Build ComplexCurves plugin
    //////////////////////////////////////////////////////////////////////

    var cc_get_commit = function () {
        var commit = fs.readFileSync("plugins/ComplexCurves/lib/ComplexCurves.commit", "utf8");
        commit = commit.replace(/\s+/, "");
        cc_get_commit = function () {
            // cache result
            return commit;
        };
        return commit;
    };
    var cc_lib_dir = "plugins/ComplexCurves/lib/ComplexCurves/";

    task("ComplexCurves.get", [], function () {
        var id = cc_get_commit();
        this.download(
            "https://github.com/ComplexCurves/ComplexCurves/archive/" + id + ".zip",
            "download/arch/ComplexCurves-" + id + ".zip"
        );
    });

    task("ComplexCurves.unzip", ["ComplexCurves.get"], function () {
        var id = cc_get_commit();
        this.input("plugins/ComplexCurves/lib/ComplexCurves.commit");
        this.delete("plugins/ComplexCurves/lib/ComplexCurves");
        this.unzip(
            "download/arch/ComplexCurves-" + id + ".zip",
            "plugins/ComplexCurves/lib/ComplexCurves",
            "ComplexCurves-" + id + "/"
        );
    });

    task("ComplexCurves.lib", ["ComplexCurves.unzip"], function () {
        this.sh("cd " + cc_lib_dir + "; npm install; npm run-script prepare");
        this.output(cc_lib_dir + "build/ComplexCurves.js");
    });

    task("ComplexCurves.plugin", ["closure-jar"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6_STRICT",
            compilation_level: this.setting("cc_closure_level"),
            rewrite_polyfills: false,
            warning_level: this.setting("cc_closure_warnings"),
            output_wrapper_file: "plugins/ComplexCurves/src/js/Plugin.js.wrapper",
            js_output_file: "build/js/ComplexCurves.plugin.js",
            externs: ["plugins/cindyjs.externs", "plugins/ComplexCurves/ComplexCurves.externs"],
            js: ["plugins/ComplexCurves/src/js/Plugin.js", "plugins/cindy3d/src/js/Interface.js"],
        };
        this.closureCompiler(closure_jar, opts);
    });

    task("ComplexCurves", ["ComplexCurves.lib", "ComplexCurves.plugin"], function () {
        this.concat(
            [cc_lib_dir + "build/ComplexCurves.js", "build/js/ComplexCurves.plugin.js"],
            "build/js/ComplexCurves.js"
        );
    });

    //////////////////////////////////////////////////////////////////////
    // Build symbolic-plugin
    //////////////////////////////////////////////////////////////////////
    task("symbolic", ["closure-jar"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6_STRICT",
            dependency_mode: "PRUNE_LEGACY",
            compilation_level: "SIMPLE",
            rewrite_polyfills: false,
            warning_level: "DEFAULT",
            output_wrapper_file: "plugins/symbolic/src/js/symbolic.js.wrapper",
            js_output_file: "build/js/symbolic.js",
            externs: "plugins/cindyjs.externs",
            js: ["plugins/symbolic/src/js/symbolic.js"],
        };
        this.closureCompiler(closure_jar, opts);
    });

    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of Quick Hull 3D
    //////////////////////////////////////////////////////////////////////

    var fileNames = ["QuickHull3D", "Vector", "HalfEdge", "Vertex", "VertexList", "Face", "FaceList", "Plugin"];

    var srcs = fileNames.map(function (fileName) {
        return "plugins/QuickHull3D/src/js/" + fileName + ".js";
    });

    task("quickhull3d", ["closure-jar"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6_STRICT",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/QuickHull3D.js.map",
            compilation_level: this.setting("qh3d_closure_level"),
            warning_level: this.setting("qh3d_closure_warnings"),
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            output_wrapper_file: "plugins/QuickHull3D/src/js/QuickHull3D.js.wrapper",
            js_output_file: "build/js/QuickHull3D.js",
            externs: "plugins/cindyjs.externs",
            js: srcs,
        };
        this.closureCompiler(closure_jar, opts);
    });

    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of CindyPrint
    //////////////////////////////////////////////////////////////////////

    var fileNamesPrint = [
        "BinaryFileWriter",
        "Cindy3DPrintData",
        "Cindy3DPrint",
        "CindyGLPrint",
        "DownloadFile",
        "IndexMesh",
        "KDTree",
        "MeshGraph",
        "PrintPreview",
        "PrintSettings",
        "TriangleMesh",
        "Vector",
        "csg/csg",
        "csg/SimpleShell",
        "csg/Tube",
        "isosurface/IsoSurface",
        "isosurface/MarchingCubes",
        "isosurface/SnapMC",
    ];

    var srcsPrint = fileNamesPrint.map(function (fileName) {
        return "plugins/cindyprint/src/js/" + fileName + ".js";
    });

    function browserify(o, standaloneName, inFile, outFile) {
        let browserifySrc = !fs.existsSync(outFile);
        if (!browserifySrc) {
            let timeModifiedSrc = fs.statSync(inFile).mtime;
            let timeModifiedBuild = fs.statSync(outFile).mtime;
            if (timeModifiedSrc > timeModifiedBuild) {
                browserifySrc = true;
            }
        }
        if (browserifySrc) {
            if (standaloneName) {
                o.node("node_modules/browserify/bin/cmd.js", inFile, "--standalone", standaloneName, "-o", outFile);
            } else {
                o.node("node_modules/browserify/bin/cmd.js", inFile, "-o", outFile);
            }
        }
    }

    task("browserify-csg", [], function () {
        browserify(this, "csg", "node_modules/@jscad/csg/csg.js", "build/js/csg.js");
    });

    task("cindyprint", ["closure-jar", "browserify-csg"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT_2018",
            language_out: "ECMASCRIPT_2016",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/CindyPrint.js.map",
            compilation_level: "SIMPLE",
            warning_level: "DEFAULT",
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            source_map_input: "Cindy3D.js|Cindy3D.js.map",
            output_wrapper_file: "plugins/cindyprint/src/js/CindyPrint.js.wrapper",
            js_output_file: "build/js/CindyPrint.js",
            externs: "plugins/cindyjs.externs",
            js: [
                "plugins/cindy3d/src/js/Interface.js",
                "plugins/cindy3d/src/js/VecMat.js",
                "plugins/cindy3d/src/js/ShaderProgram.js",
                "build/js/csg.js",
            ].concat(srcsPrint),
        };
        this.closureCompiler(closure_jar, opts);
    });

    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of certain files from CindyPrint for web workers
    //////////////////////////////////////////////////////////////////////

    var fileNamesPrintWorker = [
        "BinaryFileWriter",
        "Cindy3DPrintData",
        "IndexMesh",
        "KDTree",
        "MeshGraph",
        "PrintSettings",
        "TriangleMesh",
        "Vector",
        "PrintWorker",
        "csg/csg",
        "csg/SimpleShell",
        "csg/Tube",
        "isosurface/IsoSurface",
        "isosurface/MarchingCubes",
        "isosurface/SnapMC",
    ];

    var srcsPrintWorker = fileNamesPrintWorker.map(function (fileName) {
        return "plugins/cindyprint/src/js/" + fileName + ".js";
    });

    task("cindyprintworker", ["closure-jar", "browserify-csg"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT_2018",
            language_out: "ECMASCRIPT_2016",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/CindyPrintWorker.js.map",
            compilation_level: "SIMPLE",
            warning_level: "DEFAULT",
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            source_map_input: "Cindy3D.js|Cindy3D.js.map",
            output_wrapper_file: "plugins/cindyprint/src/js/CindyPrint.js.wrapper",
            js_output_file: "build/js/CindyPrintWorker.js",
            externs: "plugins/cindyjs.externs",
            js: [
                "plugins/cindy3d/src/js/VecMat.js",
                "plugins/cindy3d/src/js/ShaderProgram.js",
                "build/js/csg.js",
            ].concat(srcsPrintWorker),
        };
        this.closureCompiler(closure_jar, opts);
    });

    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of CindyLeap
    //////////////////////////////////////////////////////////////////////

    var fileNamesLeap = ["CindyLeap", "LeapMotion", "leap-0.6.4"];

    var srcsLeap = fileNamesLeap.map(function (fileName) {
        return "plugins/cindyleap/src/js/" + fileName + ".js";
    });

    task("browserify-leapjs", [], function () {
        browserify(this, "Leap", "node_modules/leapjs/lib/index.js", "build/js/leap-0.6.4.js");
    });

    task("cindyleap", ["closure-jar", "browserify-leapjs"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT6_STRICT",
            language_out: "ECMASCRIPT6_STRICT",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/CindyLeap.js.map",
            compilation_level: "SIMPLE",
            // leap.js compilation throws lots of warnings not in our responsibility
            warning_level: "QUIET",
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            output_wrapper_file: "plugins/cindyleap/src/js/CindyLeap.js.wrapper",
            js_output_file: "build/js/CindyLeap.js",
            externs: "plugins/cindyjs.externs",
            js: [
                "plugins/cindy3d/src/js/Interface.js",
                "plugins/cindy3d/src/js/VecMat.js",
                "plugins/cindyxr/src/js/CindyScriptConversion.js",
                "build/js/leap-0.6.4.js",
            ].concat(srcsLeap),
        };
        this.closureCompiler(closure_jar, opts);
    });

    //////////////////////////////////////////////////////////////////////
    // Build JavaScript version of CindyXR
    //////////////////////////////////////////////////////////////////////

    var fileNamesXR = [
        "CindyScriptConversion",
        "CindyXR",
        "webxr-button",
        "inline-viewer-helper",
        "WebXRHelper",
        "WebXREvents",
        "WebXRScalingHelper",
    ];

    var srcsXR = fileNamesXR.map(function (fileName) {
        return "plugins/cindyxr/src/js/" + fileName + ".js";
    });

    task("cindyxr", ["closure-jar"], function () {
        this.setting("closure_version");
        var opts = {
            language_in: "ECMASCRIPT_2018",
            language_out: "ECMASCRIPT_2018",
            dependency_mode: "PRUNE_LEGACY",
            create_source_map: "build/js/CindyXR.js.map",
            compilation_level: "SIMPLE",
            warning_level: "DEFAULT",
            source_map_format: "V3",
            source_map_location_mapping: ["build/js/|", "plugins/|../../plugins/"],
            output_wrapper_file: "plugins/cindyxr/src/js/CindyXR.js.wrapper",
            js_output_file: "build/js/CindyXR.js",
            externs: "plugins/cindyjs.externs",
            js: [
                "plugins/cindy3d/src/js/Interface.js",
                "plugins/cindy3d/src/js/VecMat.js",
                "plugins/cindy3d/src/js/ShaderProgram.js",
                "node_modules/gl-matrix/dist/gl-matrix.js",
                "node_modules/webxr-polyfill/build/webxr-polyfill.js",
            ].concat(srcsXR),
        };
        this.closureCompiler(closure_jar, opts);
    });

    //////////////////////////////////////////////////////////////////////
    // Run GWT for each listed GWT module
    //////////////////////////////////////////////////////////////////////

    var gwt_zip = "gwt-" + settings.get("gwt_version") + ".zip";
    var gwt_url = settings.get("gwt_urlbase") + "/" + gwt_zip;
    var gwt_archive = "download/arch/" + gwt_zip;
    var gwt_parts = ["gwt-dev", "gwt-user", "validation-api-1.0.0.GA", "validation-api-1.0.0.GA-sources"];
    var gwt_jars = gwt_parts.map(function (name) {
        return "gwt-" + settings.get("gwt_version") + "/" + name + ".jar";
    });
    var gwt_modules = glob.sync("src/java/cindyjs/*.gwt.xml").map(function (name) {
        return path.basename(name, ".gwt.xml");
    });

    task("gwt-zip", [], function () {
        this.download(gwt_url, gwt_archive);
    });

    task("gwt-jars", ["gwt-zip"], function () {
        this.unzip(gwt_archive, "download", gwt_jars);
    });

    function extra_args(args) {
        if (args === "") return [];
        return args.split(" ");
    }

    gwt_modules.forEach(function (gwt_module) {
        task(gwt_module, ["gwt-jars"], function () {
            this.setting("gwt_version");
            var mainFile = "build/js/" + gwt_module + "/" + gwt_module + ".nocache.js";
            this.delete("build/js/" + gwt_module);
            this.output(mainFile);
            var cp = ["src/java/"]
                .concat(
                    gwt_jars.map(function (name) {
                        return "download/" + name;
                    })
                )
                .join(path.delimiter);
            this.java(
                "-cp",
                cp,
                "com.google.gwt.dev.Compiler",
                "-war",
                "build/js",
                extra_args(this.setting("gwt_args")),
                "cindyjs." + gwt_module
            );
            this.touch(mainFile);
        });
    });

    task("gwt_modules", gwt_modules);

    //////////////////////////////////////////////////////////////////////
    // Copy KaTeX to build directory
    //////////////////////////////////////////////////////////////////////

    var katex_src = glob.sync("lib/katex/*.*").concat(glob.sync("lib/katex/fonts/*.*"), "lib/webfont.js");

    task("katex_src", [], function () {
        this.parallel(function () {
            katex_src.forEach(function (input) {
                this.copy(input, path.join("build", "js", input.substr(4)));
            }, this);
        });
    });

    task("katex-plugin", [], function () {
        this.copy("plugins/katex/src/js/katex-plugin.js", "build/js/katex-plugin.js");
    });

    task("katex", ["katex_src", "katex-plugin"]);

    //////////////////////////////////////////////////////////////////////
    // Copy MIDI to build directory
    //////////////////////////////////////////////////////////////////////

    var midi_src = glob.sync("lib/midi/*.*");

    task("midi_src", [], function () {
        this.parallel(function () {
            midi_src.forEach(function (input) {
                this.copy(input, path.join("build", "js", input.substr(4)));
            }, this);
        });
    });

    task("midi-plugin", [], function () {
        this.copy("plugins/midi/src/js/midi-plugin.js", "build/js/midi-plugin.js");
    });

    task("midi", ["midi_src", "midi-plugin"]);

    //////////////////////////////////////////////////////////////////////
    // Download the soundfonts
    //////////////////////////////////////////////////////////////////////

    task("soundfonts.get", [], function () {
        this.download(soundfonts.url, "download/arch/midi-js-soundfonts.zip");
    });

    task("soundfonts.unzip", ["soundfonts.get"], function () {
        //this.delete("download/midi-js-soundfonts");
        this.unzip(
            "download/arch/midi-js-soundfonts.zip",
            "download/midi-js-soundfonts",
            soundfonts.files.map(function (file) {
                return soundfonts.basepath + file;
            })
        );
    });

    task("soundfonts", ["soundfonts.unzip"], function () {
        this.parallel(function () {
            soundfonts.files.forEach(function (file) {
                this.copy(
                    "download/midi-js-soundfonts/" + soundfonts.basepath + file,
                    path.join("build", "js", "soundfonts", path.basename(file))
                );
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Compile SASS to CSS
    //////////////////////////////////////////////////////////////////////

    task("sass", [], function () {
        this.parallel(function () {
            src.scss.forEach(function (input) {
                var name = path.basename(input, ".scss") + ".css";
                this.sass(input, path.join("build", "js", name));
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Copy additional libraries used for some features
    //////////////////////////////////////////////////////////////////////

    var extra_libs = ["node_modules/pako/dist/pako.min.js"];

    task("xlibs", [], function () {
        this.parallel(function () {
            extra_libs.forEach(function (input) {
                var output = path.join("build", "js", path.basename(input));
                this.copy(input, output);
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Copy images to build directory
    //////////////////////////////////////////////////////////////////////

    var images = glob.sync("images/*.{png,jpg,svg}");
    var imagesCindyPrint = glob.sync("plugins/cindyprint/images/*.{png,jpg,svg}");

    task("images", [], function () {
        this.parallel(function () {
            images.forEach(function (input) {
                this.copy(input, path.join("build", "js", input));
            }, this);
            imagesCindyPrint.forEach(function (input) {
                this.copy(input, path.join("build", "js", "images", "cindyprint", path.basename(input)));
            }, this);
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Copy things which constitute a release
    //////////////////////////////////////////////////////////////////////

    task("deploy", ["all", "ComplexCurves", "soundfonts", "closure"], function () {
        this.delete("build/deploy");
        this.mkdir("build/deploy");
        this.node("tools/prepare-deploy.js", {
            errorMessages: {
                2: "Unknown files; running “make clean” may help here",
            },
        });
    });

    //////////////////////////////////////////////////////////////////////
    // Help debugging a remote site
    //////////////////////////////////////////////////////////////////////

    task("proxy", [], function () {
        this.addJob(function () {
            console.log("Configure browser for host 127.0.0.1 port 8080.");
            console.log("Press Ctrl+C to interrupt once you are done.");
        });
        this.node("tools/CindyReplacingProxy.js");
    });

    //////////////////////////////////////////////////////////////////////
    // Main target, build all common
    //////////////////////////////////////////////////////////////////////

    task(
        "all",
        [
            "Cindy.js",
            "ifs",
            "cindy3d",
            "cindygl",
            "cindyprint",
            "cindyprintworker",
            "cindyleap",
            "cindyxr",
            "quickhull3d",
            "katex",
            "midi",
            "xlibs",
            "images",
            "sass",
            "symbolic",
        ].concat(gwt_modules)
    );
};
