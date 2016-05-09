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
    this.globalAlpha = 1;
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
            throw Error('SvgWriterContext only supports ' +
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

// A PDF file writer, currently creating uncompressed PDF.
// See https://www.adobe.com/devnet/pdf/pdf_reference_archive.html.

function PdfWriterContext() {
    this._body = [];
    this._xPos = NaN;
    this._yPos = NaN;
    this._extGState = {
        Af255: '<< /ca 1 >>',
        As255: '<< /CA 1 >>'
    };
    this._objects = [
        ['%PDF-1.4\n']
    ];
    this._offset = this._objects[0][0].length;
    this._nextIndex = 5;
    this._imgcache = [];
    this._xobjects = {};
    this._pathUsed = -1;
    this._globalAlpha = 1;
    this._strokeAlpha = 1;
    this._fillAlpha = 1;

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

    _setAlpha: function(alpha, prefix, param) {
        var val = Math.round(255 * alpha * this._globalAlpha);
        var name = prefix + val;
        this._extGState[name] = '<< /' + param + ' ' + (val / 255) + ' >>';
        this._cmd('/' + name, 'gs');
        return alpha;
    },

    set globalAlpha(alpha) {
        this._globalAlpha = alpha;
        this._setAlpha(this._strokeAlpha, 'As', 'CA');
        this._setAlpha(this._fillAlpha, 'Af', 'ca');
    },

    set fillStyle(style) {
        var self = this;
        parseColor(style, function(r, g, b, a) {
            self._cmd(r / 255, g / 255, b / 255, 'rg');
            self._setAlpha(self._fillAlpha = a, 'Af', 'ca');
        });
    },

    set strokeStyle(style) {
        var self = this;
        parseColor(style, function(r, g, b, a) {
            self._cmd(r / 255, g / 255, b / 255, 'RG');
            self._setAlpha(self._strokeAlpha = a, 'As', 'CA');
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
        this._pathUsed = false;
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
            (2 * x1 + this._xPos) / 3, (2 * y1 - this._yPos) / 3, (x2 + 2 * x1) / 3, (y2 + 2 * y1) / 3, x2, y2);
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

    _usePath: function(cmd) {
        if (this._pathUsed) {
            var prev = this._body[this._pathUsed];
            var combined = {
                'S + f': 'B',
                'f + S': 'B',
                'W n + S': 'W S',
                'W n + f': 'W f',
                'S + W n': 'W S',
                'f + W n': 'W f',
                'B + W n': 'W B',
                'W S + f': 'W B',
                'W f + S': 'W B',
            }[prev + ' + ' + cmd];
            if (!combined)
                throw Error("Don't know how to combine '" +
                    prev + "' and '" + cmd + "'");
            this._body.splice(this._pathUsed, 1);
            cmd = combined;
        }
        this._pathUsed = this._body.length;
        this._cmd(cmd);
    },

    fill: function() {
        this._usePath('f');
    },

    stroke: function() {
        this._usePath('S');
    },

    clip: function() {
        this._usePath('W n');
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

    _png: function(dataURL) {
        if (dataURL.substr(0, 22) !== 'data:image/png;base64,')
            return {
                error: 'Not a base64-encoded PNG file'
            };
        var bytes = base64Decode(dataURL.substr(22));
        var chunks = pngChunks(bytes);
        console.log('PNG chunks:',
            chunks.map(function(chunk) {
                return chunk.type;
            }));

        // Read header
        if (chunks[0].type !== 'IHDR')
            throw Error('Image does not start with an IHDR');
        var ihdr = chunks[0].data;
        var width = ((ihdr[0] << 24) | (ihdr[1] << 16) |
            (ihdr[2] << 8) | (ihdr[3])) >>> 0;
        var height = ((ihdr[4] << 24) | (ihdr[5] << 16) |
            (ihdr[6] << 8) | (ihdr[7])) >>> 0;
        var bitDepth = ihdr[8];
        var colorType = ihdr[9];
        var palette = (colorType & 1) !== 0;
        var grayscale = (colorType & 2) === 0;
        var alpha = (colorType & 4) !== 0;
        var compressionMethod = ihdr[10];
        var filterMethod = ihdr[11];
        var interlaceMethod = ihdr[12];
        if (compressionMethod !== 0)
            throw Error('Unsupported PNG compression method: ' +
                compressionMethod);
        if (filterMethod !== 0)
            throw Error('Unsupported PNG filter method: ' +
                filterMethod);
        if (interlaceMethod !== 0)
            return {
                error: 'Interlaced image not supported'
            };
        if (palette)
            return {
                error: 'Indexed PNG image not supported'
            };

        var smask = null;
        var numColors = grayscale ? 1 : 3;
        var idats = chunks.filter(function(chunk) {
            return chunk.type === 'IDAT';
        }).map(function(chunk) {
            return chunk.data;
        });
        if (alpha) {
            var pako = window.pako;
            var inflate = new pako.Inflate();
            var i;
            for (i = 0; i < idats.length; ++i)
                inflate.push(idats[i], i + 1 === idats.length);
            if (inflate.err) throw Error(inflate.err);
            var rgba = inflate.result;
            var bytesPerComponent = bitDepth >>> 3;
            var bytesPerPixel = (numColors + 1) * bytesPerComponent;
            var bytesPerLine = width * bytesPerPixel + 1;
            if (rgba.length !== height * bytesPerLine)
                throw Error("Data length mismatch");
            var colorBytesPerPixel = numColors * bytesPerComponent;
            var rgb = new Uint8Array(height * (width * colorBytesPerPixel + 1));
            var mask = new Uint8Array(height * (width * bytesPerComponent + 1));
            var a = 0;
            var b = 0;
            var c = 0;
            for (var y = 0; y < height; ++y) {
                rgb[b++] = mask[c++] = rgba[a++];
                for (var x = 0; x < width; ++x) {
                    for (i = 0; i < colorBytesPerPixel; ++i)
                        rgb[b++] = rgba[a++];
                    for (i = 0; i < bytesPerComponent; ++i)
                        mask[c++] = rgba[a++];
                }
            }
            if (a !== rgba.length || b !== rgb.length || c !== mask.length)
                throw Error("Seems we garbled our index computation somehow");
            mask = pako.deflate(mask);
            smask = this._strm({
                Type: '/XObject',
                Subtype: '/Image',
                Width: width,
                Height: height,
                ColorSpace: '/DeviceGray',
                BitsPerComponent: bitDepth,
                Filter: '/FlateDecode',
                DecodeParms: this._dict({
                    Predictor: 15,
                    Colors: 1,
                    BitsPerComponent: bitDepth,
                    Columns: width
                })
            }, mask).ref;
            idats = [pako.deflate(rgb)]; // continue with color only
        }

        var len = 0;
        idats.forEach(function(chunk) {
            len += chunk.length;
        });
        var xobj = this._obj([this._dict({
            Type: '/XObject',
            Subtype: '/Image',
            Name: '/img' + this._imgcache.length,
            Width: width,
            Height: height,
            ColorSpace: grayscale ? '/DeviceGray' : '/DeviceRGB',
            SMask: smask,
            BitsPerComponent: bitDepth,
            Length: len,
            Filter: '/FlateDecode',
            DecodeParms: this._dict({
                Predictor: 15,
                Colors: numColors,
                BitsPerComponent: bitDepth,
                Columns: width
            })
        }), '\nstream\n'].concat(idats, ['\nendstream']));
        return xobj;
    },

    drawImage: function(img, x, y) {
        if (arguments.length !== 3)
            throw Error('PdfWriterContext only supports ' +
                '3-argument version of drawImage');
        var idx = this._imgcache.indexOf(img);
        if (idx === -1) {
            idx = this._imgcache.length;
            this._imgcache.push(img);
            var xobj = this._png(img.cachedDataURL || '');
            if (xobj.hasOwnProperty('error'))
                xobj = this._png(imageToDataURL(img));
            if (xobj.hasOwnProperty('error'))
                throw Error(xobj.error);
            this._xobjects['img' + idx] = xobj.ref;
        }
        this._cmd('q');
        this._setAlpha(1, 'Af', 'ca');
        this._cmd(img.width, 0, 0, img.height, x, -y - img.height, 'cm');
        this._cmd('/img' + idx, 'Do');
        this._cmd('Q');
    },

    _dict: function(dict) {
        var res = '<<';
        for (var key in dict)
            res += ' /' + key + ' ' + dict[key];
        return res + ' >>';
    },

    // obj is either an array, or an object which will be treated as a dict.
    // This adds some fields to the object, to facilitate offset computations.
    // Elements of obj should be ASCII-only strings or typed arrays.
    _obj: function(obj, idx) {
        if (!idx) idx = this._nextIndex++;
        if (!Array.isArray(obj))
            obj = [this._dict(obj)];
        obj.index = idx;
        obj.ref = idx + ' 0 R';
        obj.offset = this._offset;
        var len = 0;
        obj.unshift(idx + ' 0 obj\n');
        obj.push('\nendobj\n');
        for (var i = 0; i < obj.length; ++i)
            len += obj[i].length;
        this._offset += len;
        this._objects.push(obj);
        return obj;
    },

    _strm: function(dict, data, idx) {
        dict.Length = data.length;
        return this._obj([
            this._dict(dict),
            '\nstream\n', data, '\nendstream'
        ], idx);
    },

    toBlob: function() {
        // See PDF reference 1.7 Appendix G
        var i;
        var mediaBox = '[' + [0, -this.height, this.width, 0].join(' ') + ']';
        this._obj({
            Type: '/Catalog',
            Pages: '2 0 R'
        }, 1);
        this._obj({
            Type: '/Pages',
            Kids: '[3 0 R]',
            Count: 1
        }, 2);
        this._obj({
            Type: '/Page',
            Parent: '2 0 R',
            MediaBox: mediaBox,
            Contents: '4 0 R',
            Resources: this._dict({
                ProcSet: '[/PDF /Text /ImageB /ImageC /ImageI]',
                XObject: this._dict(this._xobjects),
                ExtGState: this._dict(this._extGState)
            })
        }, 3);
        var body = this._body.join('\n');
        var buf = new Uint8Array(body.length);
        for (i = 0; i < body.length; ++i)
            buf[i] = body.charCodeAt(i) & 0xff;
        body = window.pako.deflate(buf);
        this._strm({
            Filter: '/FlateDecode'
        }, body, 4);
        var objects = this._objects;
        var byIndex = [];
        for (i = 1; i < objects.length; ++i)
            byIndex[objects[i].index] = objects[i];
        var xref = 'xref\n0 ' + byIndex.length + '\n';
        for (i = 0; i < byIndex.length; ++i) {
            if (!byIndex[i])
                xref += '0000000000 65535 f \n';
            else
                xref += padStr(String(byIndex[i].offset), 10) + ' 00000 n \n';
        }
        var trailer = 'trailer\n' + this._dict({
            Size: byIndex.length,
            Root: '1 0 R'
        }) + '\nstartxref\n' + this._offset + '\n%%EOF\n';
        objects = Array.prototype.concat.apply([], objects);
        objects.push(xref, trailer);
        return new Blob(objects, {
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

function base64Decode(str) {
    var alphabet =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    str = str.replace(new RegExp('[^' + alphabet + ']+', 'g'), '');
    var bytes = new Uint8Array(str.length * 3 >> 2);
    var i, j, a, b, c, d;
    for (i = 0, j = 0; i + 3 < str.length; i += 4) {
        a = alphabet.indexOf(str.charAt(i));
        b = alphabet.indexOf(str.charAt(i + 1));
        c = alphabet.indexOf(str.charAt(i + 2));
        d = alphabet.indexOf(str.charAt(i + 3));
        bytes[j++] = (a << 2) | (b >> 4);
        bytes[j++] = (b << 4) | (c >> 2);
        bytes[j++] = (c << 6) | d;
    }
    switch (str.length - i) {
        case 0:
            break;
        case 2:
            a = alphabet.indexOf(str.charAt(i));
            b = alphabet.indexOf(str.charAt(i + 1));
            bytes[j++] = (a << 2) | (b >> 4);
            break;
        case 3:
            a = alphabet.indexOf(str.charAt(i));
            b = alphabet.indexOf(str.charAt(i + 1));
            c = alphabet.indexOf(str.charAt(i + 2));
            bytes[j++] = (a << 2) | (b >> 4);
            bytes[j++] = (b << 4) | (c >> 2);
            break;
        default:
            throw Error('Malformed Base64 input: ' +
                (str.length - i) + ' chars left: ' + str.substr(i));
    }
    if (j !== bytes.length)
        throw Error('Failed assertion: ' + j + ' should be ' + bytes.length);
    return bytes;
}

// See PNG specification at e.g. http://www.libpng.org/pub/png/
function pngChunks(bytes) {
    function u32be(offset) {
        return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) |
            (bytes[offset + 2] << 8) | (bytes[offset + 3])) >>> 0;
    }
    if (bytes.length < 57)
        throw Error('Too short to be a PNG file');
    if (u32be(0) !== 0x89504e47 || u32be(4) !== 0x0d0a1a0a)
        throw Error('PNG signature missing');
    var chunks = [];
    var pos = 8;
    while (pos < bytes.length) {
        if (pos + 12 > bytes.length)
            throw Error('Incomplete chunk at offset 0x' + pos.toString(16));
        var len = u32be(pos);
        if (len >= 0x80000000)
            throw Error('Chunk too long');
        var end = pos + 12 + len;
        if (end > bytes.length)
            throw Error('Incomplete chunk at offset 0x' + pos.toString(16));
        var type = bytes.subarray(pos + 4, pos + 8);
        type = String.fromCharCode.apply(String, type);
        chunks.push({
            len: len,
            type: type,
            data: bytes.subarray(pos + 8, pos + 8 + len),
            crc: u32be(pos + 8 + len)
        });
        pos = end;
    }
    return chunks;
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
        var img = images[name].value.img;
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
// result in a new tab.  Note that Firefox fails to show images embedded
// into an SVG.  So in the long run, saving is probably better than opening.
// Note: See https://github.com/eligrey/FileSaver.js/ for saving Blobs
function exportWith(Context, wnd) {
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
            wnd.location.href = exportedCanvasURL;
        } finally {
            csctx = origctx;
        }
    });
}

globalInstance.exportSVG = function() {
    exportWith(SvgWriterContext, window.open('about:blank', '_blank'));
};

globalInstance.exportPDF = function() {
    var wnd = window.open('about:blank', '_blank');
    createCindy.loadScript('pako', 'pako.min.js', function() {
        exportWith(PdfWriterContext, wnd);
    });
};
