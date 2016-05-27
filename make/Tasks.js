"use strict";

/* Registry of tasks.
 *
 * Tasks are identified by name.
 */

var chalk = require("chalk");
var Q = require("q");

var BuildError = require("./BuildError");
var Task = require("./Task");

module.exports = function Tasks(settings) {

    var self = this;

    var tasks = {};

    var currentTask = null;

    /* Define a new task. The definition is a function which describes the
     * task, without executing it yet. It should call the addJob method
     * and may also call input and output methods.
     */
    this.task = function(name, deps, definition) {
        if (["function", "undefined"].indexOf(typeof definition) === -1)
            throw Error("Invalid arguments for " + name);
        if (tasks.hasOwnProperty(name))
            throw Error("Dulicate name " + name);
        var res = new Task(settings, self, name, deps, definition);
        tasks[name] = res;
        return res;
    };

    /* Called when all tasks have been defined.
     */
    this.complete = function() {
        for (name in tasks) {
            if (tasks.hasOwnProperty(name)) {
                currentTask = tasks[name];
                if (currentTask.definition)
                    currentTask.definition();
                currentTask = null;
            }
        }
        if (settings.get("logprefix") === "true") {
            var name;
            var len = 0;
            for (name in tasks) {
                if (tasks.hasOwnProperty(name)) {
                    name = tasks[name].abbr || name;
                    if (len < name.length)
                        len = name.length;
                }
            }
            for (name in tasks) {
                if (tasks.hasOwnProperty(name)) {
                    var task = tasks[name];
                    name = task.abbr || name;
                    while (name.length < len)
                        name += " ";
                    task.prefix = chalk.blue("[" + name + "]") + " ";
                }
            }
        }
    };

    /* Retrieve a task by name. Thows an error if no match is found.
     */
    this.get = function(name) {
        if(tasks.hasOwnProperty(name))
            return tasks[name];
        var names = Object.keys(tasks);
        names.sort();
        console.log("Valid task names:");
        names.forEach(function(name) {
            console.log("- " + name);
        });
        throw new BuildError("No task named " + name);
    };

    /* Identify the task currently being defined.
     */
    this.current = function() {
        return currentTask;
    };

    /* Execute the named tasks sequentially or in parallel
     * depending on the “parallel” setting.
     * Returns an array of booleans indicating which tasks got run.
     */
    this.schedule = function(taskNames) {
        if (settings.get("parallel") === "true") {
            return Q.all(taskNames.map(function(name){
                return this.get(name).promise();
            }, this));
        }
        else {
            var results = [];
            var promise = Q(results);
            taskNames.forEach(function(name) {
                var task = this.get(name);
                promise = promise
                    .then(task.promise.bind(task))
                    .then(function(result) {
                        results.push(result);
                        return results;
                    });
            }, this);
            return promise;
        }
    };

};
