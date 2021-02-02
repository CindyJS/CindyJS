/* CindyJS - (C) 2014-2016  The CindyJS Project
 * IFS rendering subcomponent licensed under the Apache License 2.0.
 * See https://github.com/CindyJS/CindyJS/tree/$gitid$/src/js/ifs
 * for corresponding sources.
 */
var nextInit = null;
var asm = null;
var buffer = null;
var imgSize = 0;
var imgPtr = null;
var imgData = null;
var imgTransfer = null;
var width = 0;
var height = 0;
var Module = {};
var generation = null;
var age = 0;

// check for imul support, and also for correctness
// ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math.imul || Math.imul(0xffffffff, 5) !== -5)
    Math.imul = function imul(a, b) {
        var ah = a >>> 16;
        var al = a & 0xffff;
        var bh = b >>> 16;
        var bl = b & 0xffff;
        return (al * bl + ((ah * bl + al * bh) << 16)) | 0;
    };

onmessage = function (event) {
    var d = event.data;
    if (d.cmd === "init") {
        nextInit = d;
        if (generation === null) {
            next(d);
        }
    }
    if (d.cmd === "next") next(d);
};

function link() {
    asm = Module.asm(
        self,
        {
            _dbglog: function (i, d) {
                console.log(i, d);
            },
        },
        buffer
    );
}

function init(d) {
    age = 2; // start with 100 points
    generation = d.generation;
    width = d.width;
    height = d.height;
    var numIFS = d.systems.length;
    var numTrafos = 0;
    var i, j;
    for (i = 0; i < numIFS; ++i) numTrafos += d.systems[i].trafos.length;
    var fixedSize = 8 + 48;
    var ifsSize = 56 * numIFS;
    var trafoSize = (112 + 4) * numTrafos;
    if (trafoSize % 8) trafoSize += 8 - (trafoSize % 8);
    imgSize = width * height * 4;
    var minSize = fixedSize + ifsSize + trafoSize + imgSize;
    var bufferSize = 1 << 16;
    while (bufferSize < minSize) bufferSize <<= 1;
    if (asm === null || buffer.byteLength < bufferSize) {
        buffer = new ArrayBuffer(bufferSize);
        link();
    }
    imgPtr = asm._init(numIFS, numTrafos, width, height);
    if (imgPtr !== fixedSize + ifsSize + trafoSize)
        throw Error(
            "Buffer size calculation out of sync: expected " +
                fixedSize +
                " + " +
                ifsSize +
                " + " +
                trafoSize +
                " = " +
                (fixedSize + ifsSize + trafoSize) +
                " but got " +
                imgPtr
        );
    var imgBytes = new Uint8ClampedArray(buffer, imgPtr, imgSize);
    if (typeof imgBytes.fill === "function") imgBytes.fill(0);
    // clear image
    else for (var addr = 0; addr < imgBytes.length; ++addr) imgBytes[addr] = 0;
    imgData = new ImageData(imgBytes, width, height);
    for (i = 0; i < numIFS; ++i) {
        var trafos = d.systems[i].trafos;
        asm._setIFS(i, trafos.length);
        for (j = 0; j < trafos.length; ++j) {
            var tr = trafos[j];
            if (tr.kind === "Tr") {
                asm._setProj(
                    i,
                    j,
                    tr.prob,
                    tr.color[0] * 255,
                    tr.color[1] * 255,
                    tr.color[2] * 255,
                    tr.mat[0][0],
                    tr.mat[0][1],
                    tr.mat[0][2],
                    tr.mat[1][0],
                    tr.mat[1][1],
                    tr.mat[1][2],
                    tr.mat[2][0],
                    tr.mat[2][1],
                    tr.mat[2][2]
                );
            } else if (tr.kind === "Mt") {
                asm._setMoebius(
                    i,
                    j,
                    tr.prob,
                    tr.color[0] * 255,
                    tr.color[1] * 255,
                    tr.color[2] * 255,
                    tr.moebius.sign,
                    tr.moebius.ar,
                    tr.moebius.ai,
                    tr.moebius.br,
                    tr.moebius.bi,
                    tr.moebius.cr,
                    tr.moebius.ci,
                    tr.moebius.dr,
                    tr.moebius.di
                );
            }
        }
    }
    asm._real(1000, 1);
}

function next(d) {
    if (d.buffer) {
        if (imgTransfer) {
            imgTransfer = d.buffer;
        } else {
            buffer = d.buffer;
            link();
            imgData = null; // won't be needing this
        }
    }
    if (nextInit) {
        init(nextInit);
        nextInit = null;
    }

    asm._real(Math.pow(10, age) | 0, 0);
    if (age < 5) ++age;

    var ff = /Firefox\/(\d+)\.(\d+)/.exec(navigator.userAgent);
    if (ff) {
        // current versions of Firefox have serious problems with ImageBitmaps:
        // bug 1271504: will pre-multiply ImageBitmap repeatedly
        // bug 1312148: massive memory leak creating ImageBitmap instances
        // Furthermore bug 1312139 prevents us from using the fallback
        // since we cannot transfer a buffer which has been used by asm.js.
        // So we use a separate buffer (and one more copy step) for transfer.
        if (!imgTransfer || imgTransfer.byteLength < imgSize) imgTransfer = new ArrayBuffer(imgSize);
        var t = new Uint8ClampedArray(imgTransfer);
        t.set(imgData.data);
        postMessage(
            {
                generation: generation,
                buffer: imgTransfer,
                imgPtr: 0,
                width: width,
                height: height,
            },
            [imgTransfer]
        );
    } else if (typeof createImageBitmap === "function") {
        createImageBitmap(imgData).then(function (bmp) {
            postMessage(
                {
                    generation: generation,
                    img: bmp,
                },
                [bmp]
            );
        });
    } else {
        postMessage(
            {
                generation: generation,
                buffer: buffer,
                imgPtr: imgPtr,
                width: width,
                height: height,
            },
            [buffer]
        );
    }
}

// Code below was generated by emscripten, see ifs.cc for source code

export { Module };
