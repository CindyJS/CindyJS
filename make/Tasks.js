"use strict";

/* Registry of tasks.
 *
 * Tasks are identified by name.
 */

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
        var res = currentTask = new Task(settings, self, name, deps);
        if (definition)
            definition.call(res);
        tasks[name] = res;
        currentTask = null;
        return res;
    };

    /* Retrieve a task by name. Thows an error if no match is found.
     */
    this.get = function(name) {
        if(tasks.hasOwnProperty(name))
            return tasks[name];
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
