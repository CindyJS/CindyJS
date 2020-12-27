"use strict";

/* Command line processing for the CindyJS build system.
 *
 * This file will process the command line arguments, apply settings
 * and execute requested tasks.
 */

var chalk = require("chalk");
var path = require("path");
var Q = require("q");
Q.longStackSupport = true;

var Settings = require("./Settings");
var make = require("./make");

function addNodePath() {
    process.env.PATH = path.resolve(path.join("node_modules", ".bin")) + path.delimiter + process.env.PATH;
}

function main(args) {
    var settings = new Settings();
    var tasksToRun = [];
    var doClean = false;
    var watch = false;

    args.forEach(function (arg) {
        var pos = arg.indexOf("=");
        if (pos !== -1) {
            settings.set(arg.substr(0, pos), arg.substr(pos + 1));
        } else if (arg === "clean") {
            doClean = true;
        } else if (arg === "live") {
            watch = true;
        } else {
            tasksToRun.push(arg);
        }
    });

    try {
        settings.load();
    } catch (err) {
        if (err.code !== "ENOENT") console.error("Problems with " + prevSettingsFile + ": " + err);
    }
    settings.set = null; // Safety precaution against later modification

    var makeOnce = make.bind(null, settings, tasksToRun);

    addNodePath();
    var exitStatus = 3;
    process.once("beforeExit", function () {
        if (exitStatus === 3) console.error(chalk.bold.red("Event loop drained unexpectedly!"));
        process.exit(exitStatus);
    });
    var promise;
    if (watch) {
        promise = require("./watch")(makeOnce, doClean);
    } else {
        promise = makeOnce(doClean);
    }
    promise
        .then(
            function (result) {
                exitStatus = result.success ? 0 : 1;
            },
            function (err) {
                var str = err.toString(),
                    stack = err.stack;
                if (stack.substr(0, str.length) === str) stack = stack.substr(str.length);
                console.error(chalk.bold.red(str) + stack);
                return 2;
            }
        )
        .catch(function (err) {
            // Failed to print the error above
            process.exit(2);
        })
        .done();
}

if (require.main === module) main(process.argv.slice(2));
else module.exports = main;
