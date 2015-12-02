"use strict";

/* Configuration settings.
 *
 * These settings can be overridden from the command line, and will
 * affect various aspects of the build process.
 */

var fs = require("fs");
var Q = require("q");

var tasks = require("./tasks");

var prevSettingsFile = "build/prev-settings.json";

var configSettings = {
    js_compiler: "closure",
    closure_urlbase: "http://dl.google.com/closure-compiler",
    closure_language: "ECMASCRIPT5_STRICT",
    closure_level: "SIMPLE",
    closure_version: "20150126",
    verbose: "true",
    c3d_closure_level: "ADVANCED",
    c3d_closure_warnings: "VERBOSE",
    gwt_version: "2.7.0",
    gwt_urlbase: "http://storage.googleapis.com/gwt-releases",
    gwt_args: "",
};

var perTaskSettings = {};

exports.use = function(key) {
    var val = configSettings[key];
    var currentTask = tasks.current();
    if (val !== undefined)
        currentTask.settings[key] = val;
    var name = currentTask.name;
    var task = perTaskSettings[name];
    var prev = task ? task[key] : undefined;
    if (prev !== val)
        currentTask.forceRun("setting '" + key + "' changed value");
    return val;
};

exports.get = function(key) {
    return configSettings[key];
};

exports.set = function(key, val) {
    configSettings[key] = val;
};

exports.store = function() {
    var json = JSON.stringify(perTaskSettings);
    // Can't use qfs: https://github.com/kriskowal/q-io/issues/149
    //return qfs.write(prevSettingsFile, json);
    return Q.nfcall(fs.writeFile, prevSettingsFile, json);
};

exports.load = function() {
    var json = fs.readFileSync(prevSettingsFile, "utf-8");
    perTaskSettings = JSON.parse(json) || {};
};

exports.remember = function(taskName, values) {
    if (Object.keys(values).length !== 0)
        perTaskSettings[taskName] = values;
};

exports.forget = function(taskName) {
    delete perTaskSettings[taskName];
};
