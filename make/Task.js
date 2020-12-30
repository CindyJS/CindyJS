"use strict";

/* Internal logic for tasks.
 *
 * A task has a name, a bunch of dependencies and a sequence of jobs.
 * This file here takes care of the internal logic of the tasks, while
 * the actual task definitions are contained in build.js and make use
 * of commands defined in commands.js.
 */

var chalk = require("chalk");
var fs = require("fs");
var path = require("path");
var Q = require("q");
var qfs = require("q-io/fs");

var commands = require("./commands");

module.exports = Task;

/* Constructor for task objects.
 */
function Task(settings, tasks, name, deps, definition) {
    this.settings = settings;
    this.tasks = tasks;
    this.name = name;
    this.deps = deps;
    this.definition = definition;
    this.outputs = [];
    this.inputs = [];
    this.conditions = [];
    this.mySettings = {};
    this.jobs = [];
    this.prefix = "";
}

/* Adopt all commands as methods.
 */
for (var cmd in commands) {
    Task.prototype[cmd] = commands[cmd];
}

Task.prototype.setting = function (key) {
    var val = this.settings.get(key);
    if (val !== undefined) this.mySettings[key] = val;
    var prev = this.settings.prevSetting(this.name, key);
    if (prev !== val) this.forceRun("setting '" + key + "' changed value");
    return val;
};

Task.prototype.log = function () {
    if (this.settings.get("verbose") !== "") {
        var args = Array.prototype.slice.call(arguments);
        if (this.prefix !== "") {
            if (args.length === 1 && typeof args[0] === "string") args[0] = this.prefix + args[0];
            else args.unshift(this.prefix);
        }
        console.log.apply(console, args);
    }
};

/* Add a new job. The provided function will be called when the task
 * is run, and should return a promise. By default jobs are executed
 * sequentially.
 */
Task.prototype.addJob = function (job) {
    this.jobs.push(job);
};

/* Add a new condition. The provided function will be called when the task
 * dependencies are calculated, and should return a promise.
 * The jobs of this task will only be executed if at least one condition
 * evaluates to true.
 */
Task.prototype.addCondition = function (condition) {
    this.conditions.push(condition);
};

/* Run a bunch of jobs in parallel. This collects all job definitions
 * which occur from within the callback and executes those jobs in
 * parallel.
 */
Task.prototype.parallel = function (callback) {
    if (this.settings.get("parallel") === "false") {
        callback.call(this);
        return;
    }
    var backup = this.jobs;
    var lst = (this.jobs = []);
    callback.call(this);
    this.jobs = backup;
    this.addJob(function () {
        return Q.all(
            lst.map(function (job) {
                return job();
            })
        );
    });
};

/* Register one or more input files. These will be compared against
 * the outputs to see whether the targets are up to date.
 */
Task.prototype.input = function (file) {
    if (Array.isArray(file)) {
        file.forEach(this.input, this);
    } else if (this.outputs.indexOf(file) === -1) {
        this.inputs.push(file);
    }
    return file;
};

/* Register one or more output files.These will be compared against
 * the inputs to see whether the targets are up to date.
 */
Task.prototype.output = function (file) {
    if (Array.isArray(file)) {
        file.forEach(this.output, this);
    } else {
        this.outputs.push(file);
    }
    return file;
};

Task.prototype.forceRun = function (message) {
    this.runForced = message || "it was requested";
};

Task.prototype.allDeps = function (f) {
    var tasks = this.tasks;
    return Q.all(
        this.deps.map(function (name) {
            return f(tasks.get(name));
        })
    );
};

function times(files) {
    return Q.all(
        files.map(function (path) {
            return qfs.stat(path).then(
                function (stat) {
                    return stat.lastModified().getTime();
                },
                function (err) {
                    if (err.code === "ENOENT") return null;
                    throw err;
                }
            );
        })
    );
}

/* Returns a promise indicating whether this task should be run or
 * skipped.
 */
Task.prototype.mustRun = function () {
    if (this.mustRunCache) return this.mustRunCache;
    var task = this;
    var log = function () {};
    if (this.settings.get("debug"))
        log = function (msg) {
            console.log(chalk.gray(task.name + " " + msg));
        };
    if (this.outputs.length === 0 && this.conditions.length === 0 && this.jobs.length !== 0) {
        // There are no outputs, so this task runs for its side effects.
        // This avoids having to declare all such tasks as PHONY.
        log("has no outputs; run it");
        return (this.mustRunCache = Q(true));
    }
    if (this.runForced) {
        this.log("Forcing run of " + this.name + " since " + this.runForced);
        return (this.mustRunCache = Q(true));
    }
    return (this.mustRunCache = this.allDeps(function (dep) {
        return dep.mustRun();
    })
        .then(function (depsMustRun) {
            if (depsMustRun.indexOf(true) !== -1) {
                // There is one dependency which will be run,
                // so we need to run ourselves
                log("has a running dependency; run it");
                return true;
            }
            if (task.conditions.length === 0) {
                return false; // check times
            }
            return Q.all(
                task.conditions.map(function (condition) {
                    return condition();
                })
            ).then(function (conditionResults) {
                if (conditionResults.indexOf(true) !== -1) {
                    log("has a positive check; run it");
                    return true;
                } else {
                    return false; // check times
                }
            });
        })
        .then(function (runByCondition) {
            if (runByCondition) return true;
            return Q.all([times(task.inputs), times(task.outputs)]).spread(function (inTimes, outTimes) {
                if (outTimes.indexOf(null) !== -1) {
                    // At least one output file missing, so run
                    log("has missing output; run it");
                    return true;
                }
                var inTime = Math.max.apply(null, inTimes);
                var outTime = Math.min.apply(null, outTimes);
                if (inTime <= outTime) {
                    // All outputs are up to date, don't run
                    log("is up to date; skip it");
                    return false;
                }
                log("is outdated; run it");
                return true;
            });
        }));
};

/* Returns a promise representing the complete execution of this task.
 * This means running all dependencies, checking whether targets are
 * up to date, if not running the jobs. The result is a promise which
 * resolves to true if the task actually ran, or to false otherwise.
 */
Task.prototype.promise = function () {
    if (this.promiseCache) return this.promiseCache;
    var task = this;
    return (this.promiseCache = this.mustRun().then(function (doRun) {
        if (!doRun) return false;
        return task.tasks
            .schedule(task.deps)
            .then(task.mkdirs.bind(task))
            .then(task.run.bind(task))
            .then(
                function () {
                    // successful run: remember the settings in use
                    task.settings.remember(task.name, task.mySettings);
                    return true;
                },
                function (err) {
                    // failed run: forget all settings just to be safe
                    task.settings.forget(task.name);
                    // try to delete all outputs, but ignore any errors
                    function rethrow() {
                        throw err;
                    }
                    return Q.allSettled(
                        task.outputs.forEach(function (name) {
                            return Q.nfcall(fs.unlink, name);
                        })
                    ).then(rethrow, rethrow);
                }
            );
    }));
};

Task.prototype.mkdirs = function () {
    var dirs = {};
    this.outputs.forEach(function (name) {
        dirs[path.dirname(name)] = true;
    });
    dirs = Object.keys(dirs);
    dirs.sort(function (a, b) {
        return a.length - b.length;
    });
    return Q.all(
        dirs.map(function (name) {
            return qfs.makeTree(name, 7 * 8 * 8 + 7 * 8 + 7);
        })
    );
};

Task.prototype.run = function () {
    return this.jobs.reduce(Q.when, Q());
};
