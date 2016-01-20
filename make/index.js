#!/usr/bin/env node
"use strict";

/* Main entry point to the CindyJS build system.
 *
 * The main purpose of this file is to reinstall all node modules if
 * the package.json file got modified.  It does so with no dependency
 * on any packages except those shipped with node.
 *
 * If you are looking for an overview over the build system,
 * read the README file in this directory or look at build.js.
 */

var fs = require("fs");
var cp = require("child_process");

require("./check-node-version");

var stampFile = "build/node_modules.stamp";
var packageStat = null;
var stampStat = null;

var npm = process.platform.substr(0, 3) === "win" ? "npm.cmd" : "npm";

process.nextTick(begin);

function begin() {
    if (process.env.CINDYJS_SKIP_PREPUBLISH === "true") {
        // This is the build system calling npm calling the build
        // system. Break the loop now, since all we wanted was getting
        // our dependencies installed.
        process.exit(0);
    }
    if (process.argv.indexOf("call_npm=false") !== -1) {
        // When called from npm, don't do a timestamp check since that
        // would lead to us calling npm again in an infinite recursion
        process.nextTick(proceed);
        return;
    }
    fs.stat("package.json", function(err, stat) {
        packageStat = err ? false : stat;
        haveStat();
    });
    fs.stat(stampFile, function(err, stat) {
        stampStat = err ? false : stat;
        haveStat();
    });
}

function haveStat() {
    if (packageStat === null || stampStat === null) return;
    if (packageStat !== false && stampStat !== false &&
        packageStat.mtime.getTime() <= stampStat.mtime.getTime()) {
        process.nextTick(proceed);
        return;
    }
    console.log("Running npm install to make sure we have all dependencies");
    var env = {};
    for (var key in process.env)
        env[key] = process.env[key];
    env.CINDYJS_SKIP_PREPUBLISH = "true";
    var child = cp.spawn(npm, ["install"], {stdio: "inherit", env: env});
    child.on("error", function(err) {
        throw err;
    });
    child.on("exit", function(code, signal) {
        if (signal !== null) {
            throw Error("npm terminated by signal " + signal);
        } else if (code !== 0) {
            throw Error("npm terminated with code " + code);
        } else {
            fs.mkdir("build", function(err) {
                fs.writeFile(stampFile, "", function(err) {
                    if (err) throw err;
                    process.nextTick(restart);
                });
            });
        }
    });
}

function proceed() {
    require("./cli")(process.argv.slice(2));
}

function restart() {
    console.log("required modules installed, resuming command");
    var args = process.argv.slice(1).concat("call_npm=false");
    var child = cp.spawn(process.argv[0], args, {stdio: "inherit"});
    child.on("error", function(err) {
        throw err;
    });
    child.on("exit", function(code, signal) {
        if (signal !== null) {
            process.exit(1);
        } else {
            process.exit(code);
        }
    });
}
