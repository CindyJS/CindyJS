"use strict";

/* File watching for the CindyJS build system.
 *
 * This code implements the “live” view, where any change to one of
 * the source files triggers a recompile and, in case of success, a
 * reload of connected browsers.
 */

var Q = require("q");
var chalk = require("chalk");
var chokidar = require("chokidar");
var browserSync = require("browser-sync");

// The following files and directories will trigger a build & reload
var watchToBuild = [
    "images",
    "lib",
    "package.json",
    "plugins",
    "ref",
    "src",
    "tests",
    "tools",
];

// The following directories will trigger a reload only
var watchToReload = [
    "examples",
    "private_examples",
];

var ignored = [
    "**/.*", // hidden files, e.g. lock files or similar
    "**/*~", // backup files, used by some editors
    "**/#*#", // used by Emacs to autosave while editing
];

module.exports = function watch(makeOnce, doClean) {
    var deferred = Q.defer();
    var watcher;

    var bs = browserSync.create("CindyJS");
    bs.init({
        server: {
            baseDir: ".",
            directory: true,
        },
        port: 1337,
        startPath: "/examples/",
        files: watchToReload,
        watchOptions: {
            ignored: ignored,
        },
    }, function(err, instance) {
        if (err) return deferred.reject(err);
    });

    var building = 1;
    make(doClean);
    return deferred.promise;

    function make(doClean) {
        console.log(chalk.yellow("Starting build"));
        makeOnce(doClean).then(gotResult).catch(fail).done();
    }

    function fail(err) {
        bs.exit();
        if (watcher) watcher.close();
        deferred.reject(err);
    }

    function gotResult(result) {
        if (!watcher) {
            watcher = chokidar.watch(watchToBuild, {
                ignoreInitial: true,
                ignored: ignored,
            });
            watcher.on("error", deferred.reject);
            watcher.on("all", onChange);
        }
        if (bs) {
            if (result.success) {
                bs.reload();
            } else {
                var msg = String(result.error)
                    .replace(/\n[^]*/, "")
                    .replace(/\x1b\[[0-9,;]*m/g, "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .substr(0, 80);
                bs.notify("Build failed: " + msg);
            }
        }
        if (building > 1) {
            building = 1;
            console.log(chalk.yellow("Performing scheduled build"));
            make(false);
        } else {
            building = 0;
            console.log(chalk.yellow("Watching for changes"));
        }
    }

    function onChange(event, path) {
        console.log(chalk.yellow(event + " " + path));
        if (building === 0) { // need to trigger a build
            building = 1;
            console.log(chalk.yellow("Build triggered"));
            make(false);
        } else {
            console.log(chalk.yellow("Already building, build scheduled"));
            building = 2;
        }
    };

};
