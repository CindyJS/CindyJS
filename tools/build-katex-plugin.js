"use strict";

// Builds build/js/katex-plugin.js: the KaTeX plugin together with KaTeX
// itself (from its npm package) and the canvas backend, as one minified
// script. KaTeX's stylesheet and fonts are copied next to it by the
// "katex_src" make task, see make/build.js.
//
// Run: node tools/build-katex-plugin.js

const path = require("path");
const esbuild = require("esbuild");

const repoRoot = path.resolve(__dirname, "..");

esbuild
    .build({
        entryPoints: [path.join(repoRoot, "plugins/katex/src/js/katex-plugin.mjs")],
        outfile: path.join(repoRoot, "build/js/katex-plugin.js"),
        bundle: true,
        format: "iife",
        target: "es2018",
        minify: true,
        sourcemap: true,
        legalComments: "inline",
        logLevel: "warning",
    })
    .catch(() => process.exit(1));
