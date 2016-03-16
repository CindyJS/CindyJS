// JSHint doesn't like setters without getters, but we use them anyway

/*jshint -W078 */

// SVG Writer creates a string representation, as opposed to DOM manipulation.

function SvgWriterContext() {
    this._path = [];
    this._defs = ['<defs>'];
    this._imgcache = [];
    this._body = [];
    this._saveStack = [''];
    this._clipIndex = 0;
    this._fill = '#000';
    this._stroke = '#000';
    this._fillOpacity = null;
    this._strokeOpacity = null;

    this.width = 0;
    this.height = 0;
    this.lineWidth = 1;
    this.lineCap = 'butt';
    this.lineJoin = 'miter';
    this.miterLimit = 10;
}

SvgWriterContext.prototype = {

    set fillStyle(style) {
        var self = this;
        parseColor(style, function(r, g, b, a) {
            self._fill = '#' +
                padStr(r.toString(16), 2) +
                padStr(g.toString(16), 2) +
                padStr(b.toString(16), 2);
            self._fillOpacity = (a === 255 ? null : a);
        });
    },

    set strokeStyle(style) {
        var self = this;
        parseColor(style, function(r, g, b, a) {
            self._stroke = '#' +
                padStr(r.toString(16), 2) +
                padStr(g.toString(16), 2) +
                padStr(b.toString(16), 2);
            self._strokeOpacity = (a === 255 ? null : a);
        });
    },

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

    _cmd: function(op) {
        if (this.globalAlpha !== 1) {
            this._body.push('<g opacity="' + this.globalAlpha + '">');
            this._body.push(op);
            this._body.push('</g>');
        } else {
            this._body.push(op);
        }
    },

    _attrs: function(dict) {
        var res = '';
        for (var key in dict)
            if (dict[key] !== null)
                res += ' ' + key + '="' + dict[key] + '"';
        return res;
    },

    fill: function() {
        this._cmd('<path' + this._attrs({
            d: this._path.join(' '),
            fill: this._fill,
            'fill-opacity': this._fillOpacity,
        }) + '/>');
    },

    stroke: function() {
        this._cmd('<path' + this._attrs({
            d: this._path.join(' '),
            stroke: this._stroke,
            'stroke-opacity': this._strokeOpacity,
            'stroke-width': this.lineWidth,
            'stroke-linecap': this.lineCap,
            'stroke-linejoin': this.lineJoin,
            'stroke-miterlimit': (
                this.lineJoin === 'miter' ? this.miterLimit : null),
        }) + '/>');
    },

    clip: function() {
        ++this._clipIndex;
        this._body.push(
            '<clipPath id="clip' + this._clipIndex + '">' +
            '<path d="' + this._path.join(' ') + '"/>' +
            '</clipPath>',
            '<g clip-path="url(#clip' + this._clipIndex + ')">'
        );
        this._saveStack[this._saveStack.length - 1] += '</g>';
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

    drawImage: function(img, x, y) {
        if (arguments.length !== 3)
            throw Error('PdfWriterContext only supports ' +
                '3-argument version of drawImage');
        var idx = this._imgcache.indexOf(img);
        if (idx === -1) {
            idx = this._imgcache.length;
            var data;
            if (img.cachedDataURL) {
                data = img.cachedDataURL;
            } else {
                data = imageToDataURL(img);
                // Don't add as img.cachedDataURL since it might be
                // e.g. a video source, which we'd want to re-convert
            }
            this._defs.push(
                '<image id="img' + idx + '" x="0" y="0" width="' + img.width +
                '" height="' + img.height + '" xlink:href="' + data + '"/>');
            this._imgcache.push(img);
        }
        this._cmd(
            '<use x="' + x + '" y="' + y + '" xlink:href="#img' + idx + '"/>');
    },

    toBlob: function() {
        while (this._saveStack.length > 1 || this._saveStack[0] !== '')
            this.restore();
        var str = (
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
            '<svg xmlns="http://www.w3.org/2000/svg" ' +
            'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'version="1.1" ' +
            'width="' + this.width + 'px" ' +
            'height="' + this.height + 'px">\n' +
            this._defs.join('\n') + '\n</defs>\n' +
            '<g stroke="none" fill="none">\n' +
            this._body.join('\n') + '\n' +
            '</g>\n</svg>\n'
        );
        return new Blob([str], {
            type: 'image/svg+xml'
        });
    }

};

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
        var self = this;
        parseColor(style, function(r, g, b, a) {
            var av = Math.round(255 * a);
            var an = 'Af' + av;
            self._extGState[an] = '<< /ca ' + (av / 255) + ' >>';
            self._cmd(r / 255, g / 255, b / 255, 'rg');
            self._cmd(an, 'gs');
        });
    },

    set strokeStyle(style) {
        var self = this;
        parseColor(style, function(r, g, b, a) {
            var av = Math.round(255 * a);
            var an = 'As' + av;
            self._extGState[an] = '<< /CA ' + (av / 255) + ' >>';
            self._cmd(r / 255, g / 255, b / 255, 'RG');
            self._cmd(an, 'gs');
        });
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

    toBlob: function() {
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
            xref += padStr(String(offset), 10) + ' 00000 n \n';
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
        return new Blob([buf], {
            type: 'application/pdf'
        });
    }

};

/*jshint +W078 */

function imageToDataURL(img, type) {
    var w = img.width;
    var h = img.height;
    var c = document.createElement('canvas');
    c.setAttribute('width', w);
    c.setAttribute('height', h);
    c.setAttribute('style', 'display:none;');
    var mainCanvas = globalInstance.canvas;
    mainCanvas.parentNode.insertBefore(c, mainCanvas.nextSibling);
    try {
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        return c.toDataURL(type || "image/png");
    } finally {
        c.parentNode.removeChild(c);
    }
}

function parseColor(spec, cb) {
    var match;
    if ((match = /^rgba\(([0-9]+), *([0-9]+), *([0-9]+), *([0-9]+)\)$/
            .exec(spec))) {
        cb(+match[1], +match[2], +match[3], +match[4]);
    } else if ((match = /^rgb\(([0-9]+), *([0-9]+), *([0-9]+)\)$/
            .exec(spec))) {
        cb(+match[1], +match[2], +match[3], 1);
    } else {
        throw Error("Can't handle color style " + spec);
    }
}

function cacheImages(cb) {
    var toCache = 1;
    Object.keys(images).forEach(function(name) {
        var img = images[name];
        if (img.cachedDataURL !== undefined) return;
        if (!img.src) return;
        if (img.src.substr(0, 5) === 'data:') {
            img.cachedDataURL = img.src;
            return;
        }
        ++toCache;
        img.cachedDataURL = null;
        var req = new XMLHttpRequest();
        req.responseType = 'blob';
        req.onreadystatechange = function() {
            if (req.readyState !== XMLHttpRequest.DONE) return;
            if (req.status === 200) {
                var reader = new FileReader();
                reader.onloadend = function() {
                    img.cachedDataURL = reader.result;
                    console.log('Cached data for image ' + img.src);
                    if (--toCache === 0) cb();
                };
                reader.readAsDataURL(req.response);
            } else {
                console.error('Failed to load ' + img.src + ': ' +
                    req.statusText);
                if (--toCache === 0) cb();
            }
        };
        req.open('GET', img.src, true);
        req.send();
    });
    if (--toCache === 0) cb();
}

function padStr(str, len, chr) {
    if (!chr) chr = '0';
    while (str.length < len)
        str = chr + str;
    return str;
}

var exportedCanvasURL = null;

function releaseExportedObject() {
    if (exportedCanvasURL !== null) {
        window.URL.revokeObjectURL(exportedCanvasURL);
        exportedCanvasURL = null;
    }
}

shutdownHooks.push(releaseExportedObject);

// Export current contruction with given writer backend and open the
// result in a new tab.  Note that Chrome has some problems displaying
// PDF this way, while Firefox fails to show images embedded into an
// SVG.  So in the long run, saving is probably better than opening.
// Note: See https://github.com/eligrey/FileSaver.js/ for saving Blobs
function exportWith(Context) {
    cacheImages(function() {
        var origctx = csctx;
        try {
            csctx = new Context();
            csctx.width = csw;
            csctx.height = csh;
            updateCindy();
            var blob = csctx.toBlob();
            releaseExportedObject();
            exportedCanvasURL = window.URL.createObjectURL(blob);
            window.open(exportedCanvasURL, '_blank');
        } finally {
            csctx = origctx;
        }
    });
}

globalInstance.exportSVG = function() {
    exportWith(SvgWriterContext);
};

globalInstance.exportPDF = function() {
    exportWith(PdfWriterContext);
};
