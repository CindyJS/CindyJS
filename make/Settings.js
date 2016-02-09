"use strict";

/* Configuration settings.
 *
 * These settings can be overridden from the command line, and will
 * affect various aspects of the build process.
 */

var fs = require("fs");
var Q = require("q");

var prevSettingsFile = "build/prev-settings.json";

module.exports = function Settings() {

    var configSettings = {
        build: "debug",
        closure_urlbase: "http://dl.google.com/closure-compiler",
        closure_language: "ECMASCRIPT5_STRICT",
        closure_level: "SIMPLE",
        closure_version: "20160208",
        verbose: "true",
        logprefix: "true",
        c3d_closure_level: "ADVANCED",
        c3d_closure_warnings: "VERBOSE",
        cgl_closure_level: "ADVANCED",
        cgl_closure_warnings: "VERBOSE",
        gwt_version: "2.7.0",
        gwt_urlbase: "http://storage.googleapis.com/gwt-releases",
        gwt_args: "",
    };

    var perTaskSettings = {};

    this.get = function(key) {
        return configSettings[key];
    };

    this.set = function(key, val) {
        configSettings[key] = val;
    };

    this.prevSetting = function(taskName, key) {
        var task = perTaskSettings[taskName];
        return task ? task[key] : undefined;
    };

    this.store = function() {
        var json = JSON.stringify(perTaskSettings);
        // Can't use qfs: https://github.com/kriskowal/q-io/issues/149
        //return qfs.write(prevSettingsFile, json);
        return Q.nfcall(fs.writeFile, prevSettingsFile, json);
    };

    this.load = function() {
        var json = fs.readFileSync(prevSettingsFile, "utf-8");
        perTaskSettings = JSON.parse(json) || {};
    };

    this.remember = function(taskName, values) {
        if (Object.keys(values).length !== 0)
            perTaskSettings[taskName] = values;
    };

    this.forget = function(taskName) {
        delete perTaskSettings[taskName];
    };

};
