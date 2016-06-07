/**
 * General helping functions
 */


/**
 * clones expression while ignoring  pointer-references to the same child
 */
function cloneExpression(obj) {
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;
    // Handle Object
    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = cloneExpression(obj[i]);
        }
        return copy;
    }

    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                if (['oper',
                        'impl',
                        'args',
                        'ctype',
                        'stack',
                        'name',
                        //'modifs',
                        'arglist',
                        'value',
                        'real',
                        'imag',
                        'key',
                        'obj',
                        'body'
                    ].indexOf(attr) >= 0)
                    copy[attr] = cloneExpression(obj[attr]);
                //else console.log("Did not clone " + attr);
                if (obj['modifs']) copy['modifs'] = obj['modifs']; //modifs cannot be handeled in recursion properly
            }
        }
        return copy;
    }
}

/**
 * checks recursively whether two expressions are equal
 */
function expressionsAreEqual(a, b) {
    if (null == a || "object" != typeof a) return a === b;
    if (a instanceof Array && b instanceof Array) {
        if (a.length != b.length) return false;
        for (var i = 0, len = a.length; i < len; i++) {
            if (!expressionsAreEqual(a[i], b[i])) return false;
        }
        return true;
    } else if (a instanceof Object && b instanceof Object) {
        let l = ['oper',
            'impl',
            'args',
            'ctype',
            'stack',
            'name',
            'modifs',
            'arglist',
            'value',
            'real',
            'imag',
            'key',
            'obj',
            'body'
        ]
        for (let i = 0; i < l.length; i++) {
            let attr = l[i];
            if (!expressionsAreEqual(a[attr], b[attr])) return false;
        }
        return true;
    }
    return false;
}


function isprimitive(a) {
    return (typeof(a) === 'number');
}

/** 
 * are two given signatures equal?
 */
function signaturesAreEqual(a, b) {
    if (a === b) return true;
    if (isprimitive(a) || isprimitive(b)) return a === b;

    for (let key in a)
        if (a.hasOwnProperty(key)) {
            if (!b.hasOwnProperty(key)) return false;
            if (!signaturesAreEqual(a[key], b[key])) return false;
        }

    for (let key in b)
        if (b.hasOwnProperty(key)) {
            if (!a.hasOwnProperty(key)) return false;
        }

    return true;
}


/**
 * converts opernames like re$1 to re
 */
function getPlainName(oper) {
    if (oper.indexOf('$') === -1) return oper;
    else return oper.substr(0, oper.indexOf('$'));
}


/**
 * guesses the type of an concrete value
 */
function guessTypeOfValue(tval) {
    if (tval['ctype'] === 'boolean') {
        return type.bool;
    } else if (tval['ctype'] === 'number') {
        let z = tval['value'];
        if (Math.abs(z['imag']) < 1e-10) { //eps test. for some reasons sin(1) might have some imag part of order e-17
            if ((z['real'] | 0) === z['real']) {
                return type.int;
            } else {
                return type.float;
            }
        } else {
            return type.complex;
        }
    } else if (tval['ctype'] === 'list') {
        let l = tval['value'];
        if (l.length > 0) {
            let ctype = guessTypeOfValue(l[0]);
            for (let i = 1; i < l.length; i++) {
                ctype = lca(ctype, guessTypeOfValue(l[i]));
            }
            //console.log("got lca " + typeToString(ctype));
            if (issubtypeof(ctype, type.float)) {
                if (l.length == 2) return type.vec2;
                if (l.length == 3) return type.vec3;
                if (l.length == 4) return type.vec4;
            }

            if (issubtypeof(ctype, type.complex)) {
                if (l.length == 2) return type.vec2complex;
            }

            if (ctype === type.vec2 && l.length == 2) return type.mat2;
            if (ctype === type.vec2complex && l.length == 2) return type.mat2complex;
            if (ctype === type.vec3 && l.length == 3) return type.mat3;
            if (ctype === type.vec4 && l.length == 4) return type.mat4;
            //TODO: do all other lists and other matrices
        }
    } else if (tval['ctype'] === 'string' || tval['ctype'] === 'image') {
        return type.image;
    }
    console.error("Cannot guess type of " + JSON.stringify(tval));
    return nada;
}


var helpercnt = 0;

function generateUniqueHelperString() {
    helpercnt++;
    return '_helper' + helpercnt;
}

function enlargeCanvasIfRequired(sizeX, sizeY) {
    if (sizeX > glcanvas.width || sizeY > glcanvas.height) {
        glcanvas.width = Math.ceil(sizeX);
        glcanvas.height = Math.ceil(sizeY);
    }
}

function transf(api, px, py) { //copied from Operators.js
    let m = api.getInitialMatrix();
    let xx = px - m.tx;
    let yy = py + m.ty;
    let x = (xx * m.d - yy * m.b) / m.det;
    let y = -(-xx * m.c + yy * m.a) / m.det;
    return {
        x: x,
        y: y
    };
};

function computeLowerLeftCorner(api) {
    let ch = api.instance['canvas']['clientHeight'];
    return transf(api, 0, ch);
}

function computeLowerRightCorner(api) {
    let cw = api.instance['canvas']['clientWidth'];
    let ch = api.instance['canvas']['clientHeight'];
    return transf(api, cw, ch);
}

function computeUpperLeftCorner(api) {
    return transf(api, 0, 0);
}

//from http://stackoverflow.com/questions/6162651/half-precision-floating-point-in-java/6162687#6162687
var floatView = new Float32Array(1);
var int32View = new Int32Array(floatView.buffer);

function toHalf(fval) {
    floatView[0] = fval;
    var fbits = int32View[0];
    var sign = (fbits >> 16) & 0x8000; // sign only
    var val = (fbits & 0x7fffffff) + 0x1000; // rounded value

    if (val >= 0x47800000) { // might be or become NaN/Inf
        if ((fbits & 0x7fffffff) >= 0x47800000) {
            // is or must become NaN/Inf
            if (val < 0x7f800000) { // was value but too large
                return sign | 0x7c00; // make it +/-Inf
            }
            return sign | 0x7c00 | // remains +/-Inf or NaN
                (fbits & 0x007fffff) >> 13; // keep NaN (and Inf) bits
        }
        return sign | 0x7bff; // unrounded not quite Inf
    }
    if (val >= 0x38800000) { // remains normalized value
        return sign | val - 0x38000000 >> 13; // exp - 127 + 15
    }
    if (val < 0x33000000) { // too small for subnormal
        return sign; // becomes +/-0
    }
    val = (fbits & 0x7fffffff) >> 23; // tmp exp for subnormal calc
    return sign | ((fbits & 0x7fffff | 0x800000) // add subnormal bit
        +
        (0x800000 >>> val - 102) // round depending on cut off
        >>
        126 - val); // div by 2^(1-(exp-127+15)) and >> 13 | exp=0
};

var toByte = function(f) {
    return f * 255;
}

/**
 * converts a float array to an array encoded in the internal type
 * @param {Array<number>} pixels
 */
function createPixelArrayFromFloat(pixels) {
    if (can_use_texture_float) return new Float32Array(pixels);
    if (can_use_texture_half_float) { //return new Uint16Array(pixels.map(toHalf)); <- does not work in recent safari
        let newpixels = new Uint16Array(pixels.length);
        for (let i = 0; i < pixels.length; i++) {
            newpixels[i] = toHalf(pixels[i]);
        }
        return newpixels;
    } else { //return new Uint8Array(pixels.map(toByte)); <- does not work in recent safari
        let newpixels = new Uint8Array(pixels.length);
        for (let i = 0; i < pixels.length; i++) {
            newpixels[i] = toByte(pixels[i]);
        }
        return newpixels;
    }
}

/**
 * converts a float array to an array encoded in the internal type
 * @param {Array<number>} pixels
 */
function createPixelArrayFromUint8(pixels) {
    if (can_use_texture_float) { //return (new Float32Array(pixels)).map(x => x / 255.); <- does not work in recent safari
        let newpixels = new Float32Array(pixels.length);
        for (let i = 0; i < pixels.length; i++) {
            newpixels[i] = pixels[i] / 255.;
        }
        return newpixels;
    }

    if (can_use_texture_half_float) { //return new Uint16Array((new Float32Array(pixels)).map(x => x / 255.)); <- does not work in recent safari
        let newpixels = new Uint16Array(pixels.length);
        for (let i = 0; i < pixels.length; i++) {
            newpixels[i] = toHalf(pixels[i] / 255.);
        }
        return newpixels;
    } else return new Uint8Array(pixels);
}

/**
 * creates pixel array for black image
 */
function createPixelArray(size) {
    if (can_use_texture_float) return new Float32Array(size);
    if (can_use_texture_half_float) return new Uint16Array(size);
    else return new Uint8Array(size);
}


function getPixelType() {
    if (can_use_texture_float) return gl.FLOAT;
    if (can_use_texture_half_float) return halfFloat.HALF_FLOAT_OES
    else return gl.UNSIGNED_BYTE;
}

function smallestPowerOfTwoGreaterOrEqual(a) {
    let ans = 1;
    while (ans < a) ans <<= 1;
    return ans;
};
