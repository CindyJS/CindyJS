"use strict";

/* Command line processing for the CindyJS build system.
 *
 * This file will process the command line arguments, apply settings
 * and execute requested tasks.
 */

var Q = require("q");
var qfs = require("q-io/fs");
var fs = require("fs");
var path = require("path");

var settings = require("./settings");
var tasks = require("./tasks");
var BuildError = require("./BuildError");

var alreadyRun = false;

function main(args) {

    if (alreadyRun)
        throw Error("This code is not designed to be executed more than once.");
    alreadyRun = true;

    var tasksToRun = [];
    var doClean = false;

    Q.longStackSupport = true;

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

    var prevSettingsFile = "build/prev-settings.json";
    try {
        settings.load(fs.readFileSync(prevSettingsFile, "utf-8"));
    } catch (err) {
        if (err.code !== "ENOENT")
            console.error("Problems with " + prevSettingsFile + ": " + err);
    }
    settings.set = null; // Safety precaution against later modification

    // Must require this after finishing the settings, since it uses them
    require("./build");

    function addNodePath() {
        process.env.PATH =
            path.resolve(path.join("node_modules", ".bin")) +
            path.delimiter + process.env.PATH;
    }

    function runTasks() {
        addNodePath();
        if (tasksToRun.length === 0 && !doClean)
            tasksToRun = ["all"];
        Q
        .fcall(function() {
            if (!doClean) return;
            console.log("Deleting build directory");
            return qfs.removeTree("build");
        })
        .then(function() {
            return qfs.makeTree("build", 7*8*8 + 7*8 + 7)
        })
        .then(function() {
            return Q.all(tasksToRun.map(function(name) {
                return tasks.get(name).promise();
            }))
        })
        .then(function(ran) {
            if (ran.indexOf(true) === -1 && settings.get("verbose") !== "") {
                console.log("Nothing to do, everything up to date");
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
            var settingsJson = settings.store();
            // Can't use qfs: https://github.com/kriskowal/q-io/issues/149
            //return qfs.write(prevSettingsFile, settingsJson);
            return Q.nfcall(fs.writeFile, prevSettingsFile, settingsJson);
        })
        .then(function(success) {
            process.exit(success ? 0 : 1);
        }, function(err) {
            console.error(err.stack);
            process.exit(2);
        })
        .done();
    }

    process.nextTick(runTasks);

}

if (require.main === module)
    main(process.argv.slice(2));
else
    module.exports = main;
