"use strict";

/* Command line processing for the CindyJS build system.
 *
 * This file will process the command line arguments, apply settings
 * and execute requested tasks.
 */

var chalk = require("chalk");
var fs = require("fs");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");
var rimraf = require("rimraf");

var BuildError = require("./BuildError");

function addNodePath() {
    process.env.PATH =
        path.resolve(path.join("node_modules", ".bin")) +
        path.delimiter + process.env.PATH;
}

module.exports = function make(settings, tasks, tasksToRun, doClean) {
    addNodePath();
    if (tasksToRun.length === 0 && !doClean)
        tasksToRun = ["all"];
    Q
    .fcall(function() {
        if (!doClean) return;
        console.log("Deleting build directory");
        return Q.nfcall(rimraf, "build");
    })
    .then(function() {
        return qfs.makeTree("build", 7*8*8 + 7*8 + 7)
    })
    .then(function() {
        return tasks.schedule(tasksToRun);
    })
    .then(function(ran) {
        if (ran.indexOf(true) === -1 && settings.get("verbose") !== "") {
            console.log(chalk.green("Nothing to do, everything up to date"));
        }
        return true;
    })
    .catch(function(err) {
        if (err instanceof BuildError) {
            console.error(err.toString());
            return false;
        } else {
            throw err;
        }
    })
    .finally(function() {
        return settings.store().catch(function(err) {
            console.error("Could not store settings: " + err);
        });
    })
    .then(function(success) {
        process.exit(success ? 0 : 1);
    }, function(err) {
        var str = err.toString(), stack = err.stack;
        if (stack.substr(0, str.length) === str)
            stack = stack.substr(str.length);
        console.error(chalk.bold.red(str) + stack);
        process.exit(2);
    })
    .done();
};
