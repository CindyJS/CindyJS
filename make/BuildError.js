"use strict";

function BuildError(message) {
    this.message = message;
}

BuildError.prototype.toString = function() {
    return this.message;
};

module.exports = BuildError;
