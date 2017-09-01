"use strict";

var chalk = require("chalk");
var cp = require("child_process");
var fs = require("fs");
var glob = require("glob");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");
var request = require("request");
var rimraf = require("rimraf");
var stream = require("stream");
var touch = require("touch");
var WholeLineStream = require("whole-line-stream");

var BuildError = require("./BuildError");
var util = require("./util");

function cmdImpl(task, opts, command, args) {
    return Q.Promise(function(resolve, reject) {
        var cmdline = [command || "node"].concat(args).join(" ");
        task.log(cmdline);
        var spawnOpts = { stdio: ["ignore", "pipe", "pipe"] };
        if (!command) command = process.argv[0]; // node
        var child = cp.spawn(command, args, spawnOpts);
        var output = null;
        var wls = new WholeLineStream(task.prefix);
        wls.pipe(process.stdout);
        child.stderr.pipe(wls);
        if (!opts.returnOutput) {
            child.stdout.pipe(wls);
        } else {
            output = [];
            var collector = new stream.Writable();
            collector._write = function(chunk, encoding, callback) {
                output.push(chunk);
                if (typeof callback === "function")
                    callback();
            }
            child.stdout.pipe(collector);
        }
        child.on("error", function(err) {
            if (err.code === "ENOENT") {
                reject(new BuildError(
                    "Command " + JSON.stringify(command) + " not found"));
            } else {
                reject(err);
            }
        });
        child.on("exit", function(code, signal) {
            if (code === 0) {
                var res = true;
                if (opts.returnOutput)
                    res = Buffer.concat(output);
                resolve(res);
            } else if (code !== null) {
                if (opts.errorMessages && opts.errorMessages[code])
                    reject(new BuildError(opts.errorMessages[code]));
                reject(new BuildError(
                    cmdline + " exited with code " + code));
            } else {
                reject(BuildError(
                    cmdline + " exited with signal " + signal));
            }
        });
    });
}

function gitLsFiles(task) {
    var args = ["ls-files", "-z"];
    return cmdImpl(task, {returnOutput: true}, "git", args)
        .then(function(buf) {
            var lst = buf.toString().split("\0");
            if (lst.length && lst[lst.length - 1] === "")
                lst.pop();
            return lst;
        });
}

/**
 * Adds a job for running a node module or other command.
 * The first argument is the command, or null for node.
 * Other arguments are passed to that command.
 * Arrays in these positions will be flattened out by one level.
 */
exports.cmd = function(command) {
    var task = this;
    var args = Array.prototype.slice.call(arguments, 1);
    var opts = {};
    var last = args[args.length - 1];
    if (typeof last === "object" && !Array.isArray(last))
        opts = args.pop();
    args = Array.prototype.concat.apply([], args); // flatten one level
    args = Array.prototype.concat.apply([], args); // flatten a second level
    this.addJob(function() {
        return cmdImpl(task, opts, command, args);
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
            "externs",
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

exports.sass = function(src, dst) {
    var task = this;
    this.input(src);
    this.output(dst);
    this.output(dst + ".map");
    this.addJob(function() {
        task.log(src + " \u219d " + dst);
        var basename = path.basename(dst);
        return Q.fcall(require, "node-sass").ninvoke("render", {
            file: src,
            outFile: basename,
            sourceMap: basename + ".map",
            sourceMapRoot: path.relative(path.dirname(dst), ".")
        }).then(function(res) {
            return Q.all([
                qfs.write(dst, res.css),
                qfs.write(dst + ".map", res.map)
            ]);
        }, function(err) {
            throw new BuildError(
                "Error applying SASS to " + src + ": " + err.message);
        });
    });
}

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
        var listFiles;
        if (files === null) {
            listFiles = gitLsFiles(task);
            files = "all versioned files"
        } else {
            listFiles = Q.nfcall(glob, files, opts);
        }
        task.log("Looking for " + expressions.length + " forbidden pattern" +
                 (expressions.length === 1 ? "" : "s") + " in " + files);
        return listFiles.then(function(files) {
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
                }, function(err) {
                    if (err.code !== "ENOENT")
                        throw err;
                    return Q.nfcall(fs.lstat, path).then(function(stats) {
                        if (!stats.isSymbolicLink())
                            throw err;
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

exports.excomp = function(filesPattern, parserFile, checkfunc) {
    var task = this;
    this.addJob(function() {
        // load parser without caching
        var parser = qfs.read(parserFile)
            .then(function(body) {
                var exports = {};
                var module = {exports: {}};
                (new Function(
                    "module", "exports", "require", body))(
                    module, module.exports);
                return module.exports;
            });
        return Q.all([Q.nfcall(glob, filesPattern, { nodir: true }), parser])
            .spread(function(files, parser) {
                var failed = 0;
                var count = 0;
                task.log(
                    "Compiling example scripts from " +
                        files.length + " examples");
                return Q.all(files.map(function(file) {
                    return qfs.read(file).then(function(html) {
                        try {
                            count += checkfunc(html, parser) | 0;
                        } catch (err) {
                            task.log(
                                chalk.magenta(file) + ": " +
                                chalk.red(err));
                            failed++;
                        }
                    });
                })).then(function() {
                    task.log(count + " scripts compiled");
                    if (failed) throw new BuildError(
                        failed + " example script(s) failed to compile");
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
    var listed = function() { return true; }
    if (files) {
        listed = function(file) { return files.indexOf(file) !== -1; }
        if (typeof files === "string") {
            // Passing a single name instead of an array means
            // that the named file or subtree is extracted to dst,
            // possibly renaming it in the process
            if (files[files.length - 1] === "/") {
                // rename named subdirectory to dst
                outFile = function(file) {
                    return path.join(dst, file.substr(files[0].length));
                }
                listed = function(file) {
                    return file.substr(0, files[0].length) === files[0];
                }
            } else {
                outFile = function() { return dst; }
            }
            files = [files];
        }
        files.forEach(function(name) {
            this.output(outFile(name));
        }, this);
    }
    this.addJob(function() {
        task.log("unzip " + src + " to " + dst);
        var yauzl = require("yauzl"); // load lazily, only when needed
        var zipFile, readNext;
        return Q.nfcall(yauzl.open, src, {lazyEntries: true})
            .then(function(zf) {
                zipFile = zf;
                readNext = zipFile.readEntry.bind(zipFile);
                process.nextTick(readNext);
                return Q.Promise(function(resolve, reject) {
                    zipFile.on("error", reject);
                    zipFile.on("end", resolve);
                    zipFile.on("entry", function(entry) {
                        handleEntry(entry).then(readNext).catch(reject).done();
                    });
                });
            });
        function handleEntry(entry) {
            if (!listed(entry.fileName))
                return Q(); // skip this file
            var dst = outFile(entry.fileName);
            if (entry.fileName[entry.fileName.length - 1] === "/")
                return qfs.makeTree(dst, 7*8*8 + 7*8 + 7);
            return qfs
                .makeTree(path.dirname(dst), 7*8*8 + 7*8 + 7)
                .then(function() {
                    return Q.ninvoke(zipFile, "openReadStream", entry);
                }).then(function(inStream) {
                    return util.qpipe(inStream, fs.createWriteStream(dst));
                });
        }
    });
};

exports.git_submodule = function(path) {
    var task = this;
    this.addCondition(function() {
        var args = ["submodule", "status", path];
        return cmdImpl(task, {returnOutput: true}, "git", args)
            .then(function(buf) {
                return buf[0] !== 32;
            });
    });
    this.cmd("git", "submodule", "update", "--init", path);
};
