"use strict";

/* Command line processing for the CindyJS build system.
 *
 * This file will process the command line arguments, apply settings
 * and execute requested tasks.
 */

var Q = require("q");
Q.longStackSupport = true;

var Settings = require("./Settings");
var Tasks = require("./Tasks");
var buildRules = require("./build");
var make = require("./make");

function main(args) {

    var settings = new Settings();
    var tasks = new Tasks();
    var tasksToRun = [];
    var doClean = false;

    args.forEach(function(arg) {
        var pos = arg.indexOf("=");
        if (pos !== -1) {
            settings.set(arg.substr(0, pos), arg.substr(pos + 1));
        } else if (arg === "clean") {
            doClean = true;
        } else {
            tasksToRun.push(arg);
        }
    });

    try {
        settings.load();
    } catch (err) {
        if (err.code !== "ENOENT")
            console.error("Problems with " + prevSettingsFile + ": " + err);
    }
    settings.set = null; // Safety precaution against later modification

    var tasks = new Tasks(settings);
    buildRules(settings, tasks.task); // Execute task definitions

    // Now run the selected tasks
    process.nextTick(make.bind(null, settings, tasks, tasksToRun, doClean));
}

if (require.main === module)
    main(process.argv.slice(2));
else
    module.exports = main;
