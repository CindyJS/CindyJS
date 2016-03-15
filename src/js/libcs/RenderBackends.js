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

/*jshint -W078 */

function PdfWriterContext() {
    this._body = [];
    this._xPos = NaN;
    this._yPos = NaN;
    this._extGState = {
        Af255: '<< /ca 1 >>',
        As255: '<< /CA 1 >>'
    };

    this.width = 0;
    this.height = 0;
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 10;
}

PdfWriterContext.prototype = {

    _cmd: function() {
        this._body.push(Array.prototype.join.call(arguments, ' '));
    },

    set fillStyle(style) {
        var match;
        if ((match = /^rgba\(([0-9]+), *([0-9]+), *([0-9]+), *([0-9]+)\)$/
                .exec(style))) {
            this._cmd(match[1] / 255, match[2] / 255, match[3] / 255, 'rg');
            var alphaName = 'Af' + (+match[4]);
            this._extGState[alphaName] =
                '<< /ca ' + (match[4] / 255) + ' >>';
            this._cmd('/' + alphaName, 'gs');
        } else if ((match = /^rgb\(([0-9]+), *([0-9]+), *([0-9]+)\)$/
                .exec(style))) {
            this._cmd(match[1] / 255, match[2] / 255, match[3] / 255, 'rg');
            this._cmd('/Af255', 'gs');
        } else {
            throw Error("Can't handle fillStyle " + style);
        }
    },

    set strokeStyle(style) {
        var match;
        if ((match = /^rgba\(([0-9]+), *([0-9]+), *([0-9]+), *([0-9]+)\)$/
                .exec(style))) {
            this._cmd(match[1] / 255, match[2] / 255, match[3] / 255, 'RG');
            var alphaName = 'As' + (+match[4]);
            this._extGState[alphaName] =
                '<< /CA ' + (match[4] / 255) + ' >>';
            this._cmd('/' + alphaName, 'gs');
        } else if ((match = /^rgb\(([0-9]+), *([0-9]+), *([0-9]+)\)$/
                .exec(style))) {
            this._cmd(match[1] / 255, match[2] / 255, match[3] / 255, 'RG');
            this._cmd('/As255', 'gs');
        } else {
            throw Error("Can't handle strokeStyle " + style);
        }
    },

    set lineWidth(width) {
        this._cmd(width, 'w');
    },

    set lineCap(style) {
        this._cmd({
            butt: 0,
            round: 1,
            square: 2
        }[style], 'J');
    },

    set lineJoin(style) {
        this._cmd({
            miter: 0,
            round: 1,
            bevel: 2
        }[style], 'j');
    },

    set miterLimit(limit) {
        this._cmd(limit, 'M');
    },

    clearRect: function() {
        // Presumably this just clears everything in an already empty state.
        // But we already might have some transformations applied.
        // So let's just ignore this for now.
    },

    beginPath: function() {
        // PDF paths start after the previous stroke or fill command
    },

    closePath: function() {
        this._cmd('h');
    },

    moveTo: function(x, y) {
        this._cmd(this._xPos = x, this._yPos = -y, 'm');
    },

    lineTo: function(x, y) {
        this._cmd(this._xPos = x, this._yPos = -y, 'l');
    },

    bezierCurveTo: function(x1, y1, x2, y2, x3, y3) {
        this._cmd(x1, -y1, x2, -y2, this._xPos = x3, this._yPos = -y3, 'c');
    },

    quadraticCurveTo: function(x1, y1, x2, y2) {
        this.bezierCurveTo(
            (2 * x1 + this._xPos) / 3, (2 * y1 - this._yPos) / 3,
            (x2 + 2 * x1) / 3, (y2 + 2 * y1) / 3, x2, y2);
    },

    _kappa: 0.55228474983079340, // 4 * (Math.sqrt(2) - 1) / 3

    arc: function(x, y, r, a1, a2, dir) {
        if (a1 === 0 && a2 === 2 * Math.PI) {
            var k = this._kappa * r;
            this.moveTo(x + r, y);
            this.bezierCurveTo(x + r, y + k, x + k, y + r, x, y + r);
            this.bezierCurveTo(x - k, y + r, x - r, y + k, x - r, y);
            this.bezierCurveTo(x - r, y - k, x - k, y - r, x, y - r);
            this.bezierCurveTo(x + k, y - r, x + r, y - k, x + r, y);
            return;
        }
        throw Error('PdfWriterContext.arc only supports full circles');
    },

    rect: function(x, y, w, h) {
        this._cmd(x, -y, w, -h, 're');
    },

    fill: function() {
        this._cmd('f');
    },

    stroke: function() {
        this._cmd('S');
    },

    save: function() {
        this._cmd('q');
    },

    restore: function() {
        this._cmd('Q');
    },

    translate: function(x, y) {
        this.transform(1, 0, 0, 1, x, y);
    },

    rotate: function(rad) {
        var c = Math.cos(rad);
        var s = Math.sin(rad);
        this.transform(c, s, -s, c, 0, 0);
    },

    scale: function(x, y) {
        this.transform(x, 0, 0, y, 0, 0);
    },

    transform: function(a, b, c, d, e, f) {
        this._cmd(a, -b, -c, d, e, -f, 'cm');
    },

    _dict: function(dict) {
        var res = '<<';
        for (var key in dict)
            res += ' /' + key + ' ' + dict[key];
        return res + ' >>';
    },

    _obj: function(idx, dict) {
        return idx + ' 0 obj\n' + this._dict(dict) + '\nendobj\n';
    },

    _strm: function(idx, dict, data) {
        dict.Length = data.length;
        return idx + ' 0 obj\n' + this._dict(dict) + '\nstream\n' +
            data + '\nendstream\nendobj\n';
    },

    toArray: function() {
        // See PDF reference 1.7 Appendix G
        var head = '%PDF-1.4\n';
        var mediaBox = '[' + [0, -this.height, this.width, 0].join(' ') + ']';
        var objects = [
            null,
            this._obj(1, {
                Type: '/Catalog',
                Pages: '2 0 R'
            }),
            this._obj(2, {
                Type: '/Pages',
                Kids: '[3 0 R]',
                Count: 1
            }),
            this._obj(3, {
                Type: '/Page',
                Parent: '2 0 R',
                MediaBox: mediaBox,
                Contents: '4 0 R',
                Resources: this._dict({
                    ProcSet: '[/PDF /Text /ImageB /ImageC /ImageI]',
                    ExtGState: this._extGState
                })
            }),
            this._strm(4, {}, this._body.join('\n'))
        ];
        var xref = 'xref\n0 ' + objects.length + '\n0000000000 65535 f \n';
        var offset = head.length;
        for (var i = 1; i < objects.length; ++i) {
            var off = offset.toString();
            while (off.length < 10)
                off = '0' + off;
            xref += off + ' 00000 n \n';
            offset += objects[i].length;
        }
        var trailer = 'trailer\n' + this._dict({
            Size: objects.length,
            Root: '1 0 R'
        }) + '\nstartxref\n' + offset + '\n%%EOF\n';
        var str = head + objects.join('') + xref + trailer;
        var buf = new Uint8Array(str.length);
        for (var j = 0; j < str.length; ++j)
            buf[j] = str.charCodeAt(j); // simple latin1 encoding
        return buf;
    }

};

/*jshint +W078 */

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

globalInstance.exportPDF = function() {
    var origctx = csctx;
    try {
        csctx = new PdfWriterContext();
        csctx.width = csw;
        csctx.height = csh;
        updateCindy();
        exportAsObject('application/pdf', csctx.toArray());
    } finally {
        csctx = origctx;
    }
};
