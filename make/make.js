"use strict";

/* Command line processing for the CindyJS build system.
 *
 * This file will process the command line arguments, apply settings
 * and execute requested tasks.
 */

var chalk = require("chalk");
var fs = require("fs");
var Q = require("q");
var qfs = require("q-io/fs");
var rimraf = require("rimraf");

var BuildError = require("./BuildError");
var buildRules = require("./build");
var Tasks = require("./Tasks");

module.exports = function make(settings, tasksToRun, doClean) {
    var tasks = new Tasks(settings);
    var error = null;
    buildRules(settings, tasks.task); // Execute task definitions
    tasks.complete();
    if (tasksToRun.length === 0 && !doClean)
        tasksToRun = ["all"];
    return Q.Promise(function(resolve, reject) {
        process.nextTick(resolve); // detach from call stack
    })
    .then(function() {
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
        return {
            success: true,
            error: null,
            tasks: tasks
        };
    })
    .catch(function(err) {
        if (err instanceof BuildError) {
            console.error(err.toString());
            return {
                success: false,
                error: err,
                tasks: tasks
            };
        } else {
            throw err;
        }
    })
    .finally(function() {
        return settings.store().catch(function(err) {
            console.error("Could not store settings: " + err);
        });
    });
};
