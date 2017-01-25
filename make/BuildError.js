"use strict";

var chalk = require("chalk");

function BuildError(message) {
    this.message = message;
}

BuildError.prototype.toString = function() {
    return chalk.bold.red(this.message);
};

module.exports = BuildError;
