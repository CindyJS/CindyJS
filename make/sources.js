"use strict";

exports.libcs = [
    "src/js/libcs/CSNumber.js",
    "src/js/libcs/List.js",
    "src/js/libcs/General.js",
    "src/js/libcs/Essentials.js",
    "src/js/libcs/Namespace.js",
    "build/js/Compiled.js",
    "src/js/libcs/Accessors.js",
    "src/js/libcs/Operators.js",
    "src/js/libcs/OpDrawing.js",
    "src/js/libcs/OpImageDrawing.js",
    "src/js/libcs/Parser.js",
    "src/js/libcs/Evaluator.js",
    "src/js/libcs/OpSound.js",
    "src/js/libcs/CSad.js",
    "src/js/libcs/Render2D.js",
];

exports.libgeo = [
    "src/js/libgeo/GeoState.js",
    "src/js/libgeo/GeoBasics.js",
    "src/js/libgeo/GeoRender.js",
    "src/js/libgeo/Tracing.js",
    "src/js/libgeo/Prover.js",
    "src/js/libgeo/GeoOps.js",
    "src/js/libgeo/GeoScripts.js",
    "src/js/libgeo/StateIO.js",
];

exports.liblab = [
    "src/js/liblab/LabBasics.js",
    "src/js/liblab/LabObjects.js",
];

exports.lib = [
    "lib/clipper/clipper.js",
];

exports.cssrc = [
    "src/cs/drawgrid.cs",
];

exports.inclosure = [
    "src/js/Setup.js",
    "src/js/Events.js",
    "src/js/Timer.js",
    "build/js/Version.js",
].concat(exports.libcs, exports.libgeo, exports.liblab);

exports.ours = ["src/js/Head.js"].concat(exports.inclosure, "src/js/Tail.js");

exports.srcs = exports.lib.concat(exports.ours);
