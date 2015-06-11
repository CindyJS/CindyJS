"use strict";

var fs = require("fs");

module.exports = function(processFileData, files, callback) {

    if (!files) files = process.argv.slice(2);
    if (!callback) callback = process.exit;

    var countdown = 0;
    var exitStatus = 0;

    files.forEach(handleFileName);

    function handleFileName(path) {
        ++countdown;
        fs.readFile(path, {encoding: "utf-8"}, handleFileData.bind(null, path));
    }

    function oneDone(operation, path, err) {
        if (err) {
            console.error("Error " + operation + " " + path + ": " + err);
            if (operation === "processing")
                console.error(err.stack);
            exitStatus |= 1;
        }
        if (--countdown === 0) {
            callback(exitStatus);
        }
    }

    function handleFileData(path, err, str) {
        if (err) {
            oneDone("reading", path, err);
        }
        else {
            try {
                var modified = processFileData(path, str);
                if (modified)
                    fs.writeFile(path, modified, oneDone.bind(null, "writing", path));
                else
                    process.nextTick(oneDone);
            } catch (e) {
                oneDone("processing", path, e);
            }
        }
    }

};
