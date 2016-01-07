"use strict";

var stream = require("stream");
var util = require("util");

var Transform = stream.Transform;

var NL = 10;

function WholeLineStream(prefix) {
    Transform.call(this);
    this.prefix = prefix ? Buffer(prefix) : null;
    this.queued = null;
}

util.inherits(WholeLineStream, Transform);

WholeLineStream.prototype._transform = function(chunk, encoding, done) {
    if (!Buffer.isBuffer(chunk)) throw new Error("Only accepting buffers");
    if (this.queued) {
        chunk = Buffer.concat([this.queued, chunk]);
        this.queued = null;
    }
    var bol = 0, eol = 0;
    while (eol < chunk.length) {
        if (chunk[eol++] === NL) {
            if (this.prefix)
                this.push(this.prefix);
            this.push(chunk.slice(bol, eol));
            bol = eol;
        }
    }
    if (bol !== eol)
        this.queued = chunk.slice(bol);
    done();
};

WholeLineStream.prototype._flush = function(done) {
    if(this.queued)
        this._transform(Buffer.concat([this.queued, new Buffer("\n")]),
                        null, done);
    else
        done();
}

module.exports = WholeLineStream;
