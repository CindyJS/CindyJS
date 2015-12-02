"use strict";

var cp = require("child_process");
var fs = require("fs");
var glob = require("glob");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");
var request = require("request");
var rimraf = require("rimraf");
var touch = require("touch");
var unzip = require("unzip");

var BuildError = require("./BuildError");

/**
 * Adds a job for running a node module or other command.
 * The first argument is the command, or null for node.
 * Other arguments are passed to that command.
 * Arrays in these positions will be flattened out by one level.
 */
exports.cmd = function(command) {
    var task = this;
    var args = Array.prototype.slice.call(arguments, 1);
    args = Array.prototype.concat.apply([], args); // flatten one level
    args = Array.prototype.concat.apply([], args); // flatten a second level
    var cmdline = [command || "node"].concat(args).join(" ");
    this.addJob(function() {
        return Q.Promise(function(resolve, reject) {
            task.log(cmdline);
            var opts = { stdio: "inherit" };
            if (!command) command = process.argv[0]; // node
            var child = cp.spawn(command, args, opts);
            child.on("error", reject);
            child.on("exit", function(code, signal) {
                if (code === 0) {
                    resolve(true);
                } else if (code !== null) {
                    reject(new BuildError(
                        cmdline + " exited with code " + code));
                } else {
                    reject(BuildError(
                        cmdline + " exited with signal " + signal));
                }
            });
        });
    });
};

exports.node = function(module) {
    var args = Array.prototype.slice.call(arguments);
    this.input(module);
    this.cmd.apply(this, [null].concat(args));
};

exports.cmdscript = function(script) {
    var args = Array.prototype.slice.call(arguments);
    if (process.platform.substr(0, 3) === "win")
        args[0] += ".cmd";
    this.cmd.apply(this, args);
};

exports.java = function() {
    var args = Array.prototype.slice.call(arguments);
    this.cmd.apply(this, ["java"].concat(args));
};

exports.sh = function(command, wincommand) {
    if (process.platform.substr(0, 3) === "win")
        this.cmd("cmd", "/c", wincommand || command);
    else
        this.cmd("sh", "-c", command);
};

exports.concat = function(srcs, dst) {
    this.node(
        "tools/cat.js",
        this.input(srcs),
        "-o", this.output(dst));
    this.output(dst + ".map");
};

exports.closureCompiler = function(jar, opts) {
    var args = [];
    var js = null;
    Object.keys(opts).forEach(function(key) {
        var val = opts[key];
        if (key === "js") {
            js = this.input(val);
            return;
        }
        if (Array.isArray(val)) {
            val.forEach(function(v) {
                args.push("--" + key);
                args.push(v);
            });
        } else {
            args.push("--" + key);
            if (val !== true) args.push(val);
        }
        if ([
            "output_wrapper_file",
        ].indexOf(key) !== -1)
            this.input(val);
        if ([
            "js_output_file",
            "create_source_map",
        ].indexOf(key) !== -1)
            this.output(val);
    }, this);
    if (js) {
        args.push("--js");
        args.push(js);
    }
    args = [].concat(args); // flatten one level
    this.java("-jar", jar, args);
};

exports.applySourceMap = function(maps, dst) {
    this.node(
        "tools/apply-source-map.js",
        "-f", path.basename(dst),
        this.input(maps),
        "-o", this.output(dst + ".map"));
};

exports.touch = function(dst) {
    this.output(dst);
    this.addJob(function() { return Q.nfcall(touch, dst); });
};

exports.copy = function(src, dst) {
    this.input(src);
    this.output(dst);
    this.addJob(function() { return qfs.copy(src, dst); });
};

exports.delete = function(name) {
    this.addJob(function() { return Q.nfcall(rimraf, name); });
};

exports.mkdir = function(name) {
    this.addJob(function() { return qfs.makeTree(name, 7*8*8 + 7*8 + 7); });
};

exports.process = function(src, dst, transformation) {
    var task = this;
    this.input(src);
    this.output(dst);
    this.addJob(function() {
        task.log(src + " \u219d " + dst);
        return qfs.read(src)
            .then(transformation)
            .then(qfs.write.bind(qfs, dst));
    });
};

exports.replace = function(src, dst, replacements) {
    this.process(src, dst, function(content) {
        replacements.forEach(function(replacement) {
            content = content.replace(
                replacement.search, replacement.replace);
        });
        return content;
    });
};

exports.forbidden = function(files, expressions) {
    var task = this;
    this.addJob(function() {
        var opts = { nodir: true };
        task.log("Looking for " + expressions.length + " forbidden pattern" +
                 (expressions.length === 1 ? "" : "s") + " in " + files);
        return Q.nfcall(glob, files, opts).then(function(files) {
            var errors = 0;
            return Q.all(files.map(function(path) {
                return qfs.read(path).then(function(content) {
                    expressions.forEach(function(expression) {
                        var match;
                        while ((match = expression.exec(content))) {
                            var lineno =
                                content.substr(0, match.index)
                                .split("\n").length;
                            console.error(path + ":" + lineno + ":" + match[0]);
                            ++errors;
                            if (!expression.global) break;
                        }
                    });
                });
            })).then(function() {
                if (errors !== 0) throw new BuildError(
                    "Forbidden pattern" + (errors === 1 ? "" : "s") +
                    " detected");
            });
        });
    });
};

exports.download = function(url, dst) {
    var task = this;
    this.output(dst);
    this.addJob(function() {
        return Q.Promise(function(resolve, reject) {
            task.log("Downloading " + url);
            var out = fs.createWriteStream(dst + ".part");
            request.get(url)
                .on("error", reject)
                .pipe(out);
            out.on("error", reject).on("finish", function() {
                Q.nfcall(fs.rename, dst + ".part", dst)
                    .then(resolve, reject);
            });
        })
    });
};

exports.unzip = function(src, dst, files) {
    var task = this;
    this.input(src);
    var outFile = path.join.bind(path, dst);
    if (files) {
        if (typeof files === "string") {
            // Passing a single file instead of an array means
            // that dst is the target file, not a directory
            files = [files];
            outFile = function() { return dst; }
        }
        files.forEach(function(name) {
            this.output(outFile(name));
        }, this);
    }
    this.addJob(function() {
        return Q.Promise(function(resolve, reject) {
            task.log("unzip " + src + " to " + dst);
            var countdown = 1;
            function done() {
                if (--countdown === 0)
                    resolve();
            }
            var out;
            if (files) {
                out = unzip.Parse({ path: dst })
                    .on("entry", function(entry) {
                        if (files.indexOf(entry.path) === -1) {
                            entry.autodrain();
                        } else {
                            ++countdown;
                            var out = fs.createWriteStream(
                                outFile(entry.path))
                                .on("error", reject)
                                .on("finish", done);
                            entry.on("error", reject).pipe(out);
                        }
                    });
            } else {
                out = unzip.Extract({ path: dst });
            }
            out.on("error", reject).on("close", done);
            fs.createReadStream(src)
                .on("error", reject)
                .pipe(out);
        });
    });
};
