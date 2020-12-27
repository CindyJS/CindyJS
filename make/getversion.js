"use strict";

var cp = require("child_process");
var Q = require("q");
var qfs = require("q-io/fs");

exports.factory = function (path, varname) {
    // Make sure we run this task only once for every instance of this factory
    var cache = null;
    return function (task) {
        task.addJob(function () {
            return cache || (cache = getVersion(path, varname, task));
        });
    };
};

function getVersion(path, varname, task) {
    var args = [
        "describe",
        "--match",
        "v[0-9]*.*", // annotated tags looking like a version
        "--always", // if none found, report abbreviated commit id instead
        "--long", // always include commit id and commit count since tag
        "--abbrev=7", // length of commit id to be included
        "--dirty=!", // append ! to git id if the working tree is unclean
    ];
    // git describe returns "v12.34.56-0-g1a2b3c4" or "v1.2.3-45-g6ace7bf!"
    // which we turn into e.g. [1, 2, 3, 45, "g6ace7bf!"].
    // The fourth entry indicates the number of commits since the given tag.
    // So a number of 0 means an official release.  That's the reason why
    // we use -1 instead of 0 when we don't have a tag to build on.
    return Q.Promise(function (resolve, reject) {
        cp.execFile("git", args, function (err, stdout, stderr) {
            if (stderr) task.log(stderr.replace(/\n$/, ""));
            if (err) {
                // Report problem but don't fail build
                task.log(err);
                resolve([0, 0, 0, -1, "?!"]);
            }
            var ver = stdout.toString().replace(/[\r\n][^]*$/, "");
            if (ver.charAt(0) === "v") {
                ver = ver.substring(1);
                var parts = ver.split(/[.-]/);
                parts = parts.map(function (part) {
                    if (/^[0-9]+$/.test(part)) return +part; // convert to number
                    return part;
                });
                resolve(parts);
            } else {
                // Commit id but no tag, default to version 0.0.0
                resolve([0, 0, 0, -1, "g" + ver]);
            }
        });
    }).then(function (parts) {
        var json = JSON.stringify(parts);
        task.log("Version: " + json);
        if (varname) json = varname + " = " + json + ";\n";
        return qfs.write(path, json);
    });
}
