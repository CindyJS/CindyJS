// SVG Writer creates a string representation, as opposed to DOM manipulation.

function SvgWriterContext() {
    this._path = [];
    this._body = [];
    this._saveStack = [''];

    this.fillStyle = '#000';
    this.strokeStyle = '#000';
    this.width = 0;
    this.height = 0;
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 10;
}

SvgWriterContext.prototype = {

    clearRect: function() {
        // Presumably this just clears everything in an already empty state.
        // But we already might have some transformations applied.
        // So let's just ignore this for now.
    },

    beginPath: function() {
        this._path = [];
    },

    _pathcmd: function() {
        this._path.push.apply(this._path, arguments);
    },

    closePath: function() {
        this._pathcmd('Z');
    },

    moveTo: function(x, y) {
        this._pathcmd('M', x, y);
    },

    lineTo: function(x, y) {
        this._pathcmd('L', x, y);
    },

    bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
        this._pathcmd('C', x1, y1, x2, y2, x3, y3);
    },

    quadraticCurveTo: function(x1, y1, x2, y2) {
        this._pathcmd('Q', x1, y1, x2, y2);
    },

    arc: function(x, y, r, a1, a2, dir) {
        var x1 = r * Math.cos(a1) + x;
        var y1 = r * Math.sin(a1) + y;
        var x2 = r * Math.cos(a2) + x;
        var y2 = r * Math.sin(a2) + y;
        var covered = dir ? a1 - a2 : a2 - a1;
        if (covered >= 2 * Math.PI) {
            // draw in two arcs since the endpoints of a single arc
            // must not coincide as they would in this case
            this._pathcmd(
                this._path.length ? 'L' : 'M', x1, y1,
                'A', r, r, 0, 0, dir ? 1 : 0,
                x - r * Math.cos(a1), y - r * Math.sin(a1),
                'A', r, r, 0, 0, dir ? 1 : 0, x1, y1);
        } else {
            var largeArc = covered > Math.PI ? 1 : 0;
            this._pathcmd(
                this._path.length ? 'L' : 'M', x1, y1,
                'A', r, r, 0, largeArc, dir ? 1 : 0, x2, y2);
        }
    },

    rect: function(x, y, w, h) {
        this._pathcmd('M', x, y, 'h', w, 'v', h, 'h', -w, 'z');
    },

    fill: function() {
        this._body.push(
            '<path d="' + this._path.join(' ') + '"' +
            ' fill="' + this.fillStyle + '"' +
            '/>'
        );
    },

    stroke: function() {
        this._body.push(
            '<path d="' + this._path.join(' ') + '"' +
            ' stroke="' + this.strokeStyle + '"' +
            ' stroke-width="' + this.lineWidth + '"' +
            ' stroke-linecap="' + this.lineCap + '"' +
            ' stroke-linejoin="' + this.lineJoin + '"' +
            ' stroke-miterlimit="' + this.miterLimit + '"' +
            '/>'
        );
    },

    save: function() {
        this._saveStack.push('');
    },

    restore: function() {
        this._body.push(this._saveStack.pop());
        if (this._saveStack.length === 0)
            this._saveStack.push('');
    },

    _transform: function(tr) {
        this._body.push('<g transform="' + tr + '">');
        this._saveStack[this._saveStack.length - 1] += '</g>';
    },

    translate: function(x, y) {
        this._transform('translate(' + x + ' ' + y + ')');
    },

    rotate: function(rad) {
        this._transform('rotate(' + rad * (Math.PI / 180) + ')');
    },

    scale: function(x, y) {
        this._transform('scale(' + x + ' ' + y + ')');
    },

    transform: function(a, b, c, d, e, f) {
        this._transform('matrix(' + [a, b, c, d, e, f].join(' ') + ')');
    },

    toString: function() {
        while (this._saveStack.length > 1 || this._saveStack[0] !== '')
            this.restore();
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" ' +
            'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'version="1.1" ' +
            'width="' + this.width + 'px" ' +
            'height="' + this.height + 'px">\n' +
            '<g stroke="none" fill="none">\n' +
            this._body.join('\n') +
            '</g>\n</svg>\n'
        );
    }

};

var exportedCanvasURL = null;

function releaseExportedObject() {
    if (exportedCanvasURL !== null) {
        window.URL.revokeObjectURL(exportedCanvasURL);
        exportedCanvasURL = null;
    }
}

shutdownHooks.push(releaseExportedObject);

function exportAsObject(type, data) {
    releaseExportedObject();
    var blob = new Blob([data], {
        type: type
    });
    exportedCanvasURL = window.URL.createObjectURL(blob);
    window.open(exportedCanvasURL, '_blank');
}

globalInstance.exportSVG = function() {
    var origctx = csctx;
    try {
        csctx = new SvgWriterContext();
        csctx.width = csw;
        csctx.height = csh;
        updateCindy();
        exportAsObject('image/svg+xml', csctx.toString());
    } finally {
        csctx = origctx;
    }
};
