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
 * guesses the general(non-constant) type of an concrete value
 */
function guessTypeOfValue(tval) {
    if (tval['ctype'] === 'boolean') {
        return type.bool;
    } else if (tval['ctype'] === 'number') {
        let z = tval['value'];
        if (Math.abs(z['imag']) < 1e-5) { //eps test. for some reasons sin(1) might have some imag part of order e-17
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
        if (l.length === 3) {
            if (tval["usage"] === "Point")
                return type.point;
            else if (tval["usage"] === "Line")
                return type.line
        }
        if (l.length > 0) {
            let ctype = guessTypeOfValue(l[0]);
            for (let i = 1; i < l.length; i++) {
                ctype = lca(ctype, guessTypeOfValue(l[i]));
            }
            if (ctype) return {
                type: 'list',
                length: l.length,
                parameters: ctype
            };
        }
    } else if (tval['ctype'] === 'string' || tval['ctype'] === 'image') {
        return type.image;
    } else if (tval['ctype'] === 'geo' && tval['value']['kind'] === 'L') {
        return type.line;
    }
    console.error(`Cannot guess type of the following type:`);
    console.log(tval);
    return false;
}


var helpercnt = 0;

function generateUniqueHelperString() {
    helpercnt++;
    return `_h${helpercnt}`;
}

function enlargeCanvasIfRequired(sizeX, sizeY) {
    if (sizeX > glcanvas.width || sizeY > glcanvas.height) {
        glcanvas.width = Math.ceil(sizeX);
        glcanvas.height = Math.ceil(sizeY);
    }
}

var parsecache = {};

function realfromCindyScriptCommand(api, cscmd) {
    if (!parsecache[cscmd])
        parsecache[cscmd] = api.instance.parse(cscmd);
    let val = api.evaluate(parsecache[cscmd]);
    if (val["ctype"] && val["ctype"] === "number") {
        return val["value"]["real"];
    } else {
        return 0;
    }
}

function computeLowerLeftCorner(api) {
    return {
        x: realfromCindyScriptCommand(api, "(screenbounds()_4).x"),
        y: realfromCindyScriptCommand(api, "(screenbounds()_4).y")
    };
}

function computeLowerRightCorner(api) {
    return {
        x: realfromCindyScriptCommand(api, "(screenbounds()_3).x"),
        y: realfromCindyScriptCommand(api, "(screenbounds()_3).y")
    };
}

function computeUpperLeftCorner(api) {
    return {
        x: realfromCindyScriptCommand(api, "(screenbounds()_1).x"),
        y: realfromCindyScriptCommand(api, "(screenbounds()_1).y")
    };
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

//from http://stackoverflow.com/questions/5678432/decompressing-half-precision-floats-in-javascript
function decodeFloat16(binary) {
    let exponent = (binary & 0x7C00) >> 10;
    let fraction = binary & 0x03FF;
    return (binary >> 15 ? -1 : 1) * (
        exponent ?
        (
            exponent === 0x1F ?
            fraction ? NaN : Infinity :
            Math.pow(2, exponent - 15) * (1 + fraction / 0x400)
        ) :
        6.103515625e-5 * (fraction / 0x400)
    );
};

var toByte = f => f * 255

/**
 * converts a float array to an array encoded in the internal type
 * @param {Array<number>} samples
 */
function createPixelArrayFromFloat(samples) {
    if (can_use_texture_float) return new Float32Array(samples);
    if (can_use_texture_half_float) { //return new Uint16Array(samples.map(toHalf)); <- does not work in recent safari
        let newsamples = new Uint16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            newsamples[i] = toHalf(samples[i]);
        }
        return newsamples;
    } else { //return new Uint8Array(samples.map(toByte)); <- does not work in recent safari
        let newsamples = new Uint8Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            newsamples[i] = toByte(samples[i]);
        }
        return newsamples;
    }
}

/**
 * converts a float array to an array encoded in the internal type
 * @param {Array<number>} samples
 */
function createPixelArrayFromUint8(samples) {
    if (can_use_texture_float) { //return (new Float32Array(samples)).map(x => x / 255.); <- does not work in recent safari
        let newsamples = new Float32Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            newsamples[i] = samples[i] / 255.;
        }
        return newsamples;
    }

    if (can_use_texture_half_float) { //return new Uint16Array((new Float32Array(samples)).map(x => x / 255.)); <- does not work in recent safari
        let newsamples = new Uint16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            newsamples[i] = toHalf(samples[i] / 255.);
        }
        return newsamples;
    } else return new Uint8Array(samples);
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

function toFloat(samples) {
    let res = [];
    for (let i = 0; i < samples.length; i++) {
        if (can_use_texture_float) res.push(samples[i]);
        else if (can_use_texture_half_float) res.push(decodeFloat16(samples[i]));
        else res.push(samples[i] / 255);
    }
    return res;
}

function smallestPowerOfTwoGreaterOrEqual(a) {
    let ans = 1;
    while (ans < a) ans <<= 1;
    return ans;
};
