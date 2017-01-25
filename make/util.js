"use strict";

var Q = require("q");

exports.qpipe = function(src, dst) {
    return Q.Promise(function(resolve, reject) {
        src.on("error", reject).pipe(
            dst.on("error", reject).on("finish", resolve));
    });
}
