//*******************************************************
// and here are the definitions of the image operators
//*******************************************************

function imageFromValue(val) {
    if (val.ctype === 'image') {
        return val.value;
    }
    if (val.ctype === 'string' && images.hasOwnProperty(val.value)) {
        return images[val.value].value;
    }
    return null;
}

evaluator.imagesize$1 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[0]));
    if (!img) {
        return nada;
    }
    return List.realVector([+img.width, +img.height]);
};

evaluator.imageready$1 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[0]));
    return General.bool(!!(img && img.ready));
};

function drawImageIndirection(img, x, y) {
    if (img.drawTo) {
        img.drawTo(csctx, x, y);
    } else {
        csctx.drawImage(img.img, x, y);
    }
}

evaluator.drawimage$2 = function(args, modifs) {

    function drawimg1() {


        function handleModifs() {
            var erg;
            if (modifs.angle !== undefined) {
                erg = evaluate(modifs.angle);
                if (erg.ctype === 'number') {
                    rot = erg.value.real;
                }
            }

            if (modifs.rotation !== undefined) {
                erg = evaluate(modifs.rotation);
                if (erg.ctype === 'number') {
                    rot = erg.value.real;
                }
            }

            if (modifs.scale !== undefined) {
                erg = evaluateAndVal(modifs.scale);
                if (erg.ctype === 'number') {
                    scax = erg.value.real;
                    scay = erg.value.real;
                }
                if (List.isNumberVector(erg).value && (erg.value.length === 2)) {
                    scax = erg.value[0].value.real;
                    scay = erg.value[1].value.real;
                }

            }

            if (modifs.scalex !== undefined) {
                erg = evaluate(modifs.scalex);
                if (erg.ctype === 'number') {
                    scax = erg.value.real;
                }
            }

            if (modifs.scaley !== undefined) {
                erg = evaluate(modifs.scaley);
                if (erg.ctype === 'number') {
                    scay = erg.value.real;
                }
            }

            if (modifs.flipx !== undefined) {
                erg = evaluate(modifs.flipx);
                if (erg.ctype === 'boolean') {
                    if (erg.value) {
                        flipx = -1;
                    }
                }
            }

            if (modifs.flipy !== undefined) {
                erg = evaluate(modifs.flipy);
                if (erg.ctype === 'boolean') {
                    if (erg.value) {
                        flipy = -1;
                    }
                }
            }


            if (modifs.alpha !== undefined) {
                erg = evaluate(modifs.alpha);
                if (erg.ctype === 'number') {
                    alpha = erg.value.real;
                }

            }

            csctx.imageSmoothingEnabled = true;
            if (modifs.interpolate !== undefined) {
                erg = evaluate(modifs.interpolate);
                if (erg.ctype === 'boolean') {
                    csctx.imageSmoothingEnabled = erg.value;
                }
            }


        }


        var scax = 1;
        var scay = 1;
        var flipx = 1;
        var flipy = 1;
        var rot = 0;
        var alpha = 1;

        var pt = eval_helper.extractPoint(v0);

        if (!pt.ok) {
            return nada;
        }

        img = imageFromValue(img);
        if (!img) {
            return nada;
        }

        csctx.save();
        handleModifs();


        var m = csport.drawingstate.matrix;
        var initm = csport.drawingstate.initialmatrix;


        var w = img.width;
        var h = img.height;

        //TODO das ist für die Drehungen im lokaen koordinatensystem
        //sollte eigentlich einfacher gehen

        var xx = pt.x * m.a - pt.y * m.b + m.tx;
        var yy = pt.x * m.c - pt.y * m.d - m.ty;

        var xx1 = (pt.x + 1) * m.a - pt.y * m.b + m.tx - xx;
        var yy1 = (pt.x + 1) * m.c - pt.y * m.d - m.ty - yy;

        var ixx = pt.x * initm.a - pt.y * initm.b + initm.tx;
        var iyy = pt.x * initm.c - pt.y * initm.d - initm.ty;

        var ixx1 = (pt.x + 1) * initm.a - pt.y * initm.b + initm.tx - ixx;
        var iyy1 = (pt.x + 1) * initm.c - pt.y * initm.d - initm.ty - iyy;

        var sc = Math.sqrt(xx1 * xx1 + yy1 * yy1) / Math.sqrt(ixx1 * ixx1 + iyy1 * iyy1);
        var ang = -Math.atan2(xx1, yy1) + Math.atan2(ixx1, iyy1);

        var viewScale = csport.drawingstate.matrix.sdet / 72;
        scax *= viewScale;
        scay *= viewScale;

        if (alpha !== 1)
            csctx.globalAlpha = alpha;

        csctx.translate(xx, yy);
        csctx.scale(scax * flipx * sc, scay * flipy * sc);


        csctx.rotate(rot + ang);


        csctx.translate(-xx, -yy);
        csctx.translate(-w / 2, -h / 2);

        drawImageIndirection(img, xx, yy);
        csctx.globalAlpha = 1;

        csctx.restore();


    }


    function drawimg3() {
        var alpha = 1;
        var flipx = 1;
        var flipy = 1;
        var aspect = 1;

        function handleModifs() {
            var erg;

            if (modifs.alpha !== undefined) {
                erg = evaluate(modifs.alpha);
                if (erg.ctype === 'number') {
                    alpha = erg.value.real;
                }

            }

            if (modifs.aspect !== undefined) {
                erg = evaluate(modifs.aspect);
                if (erg.ctype === 'number') {
                    aspect = erg.value.real;
                }

            }

            if (modifs.flipx !== undefined) {
                erg = evaluate(modifs.flipx);
                if (erg.ctype === 'boolean') {
                    if (erg.value) {
                        flipx = -1;
                    }
                }
            }

            if (modifs.flipy !== undefined) {
                erg = evaluate(modifs.flipy);
                if (erg.ctype === 'boolean') {
                    if (erg.value) {
                        flipy = -1;
                    }
                }
            }

            csctx.imageSmoothingEnabled = true;
            if (modifs.interpolate !== undefined) {
                erg = evaluate(modifs.interpolate);
                if (erg.ctype === 'boolean') {
                    csctx.imageSmoothingEnabled = erg.value;
                }
            }

        }


        var pt1 = eval_helper.extractPoint(v0);
        var pt2 = eval_helper.extractPoint(v1);
        var pt3;


        if (!pt1.ok || !pt2.ok) {
            return nada;
        }

        img = imageFromValue(img);
        if (!img) {
            return nada;
        }

        var w = img.width;
        var h = img.height;


        if (v2 === 0) {

            pt3 = {};
            pt3.x = pt1.x - (pt2.y - pt1.y);
            pt3.y = pt1.y + (pt2.x - pt1.x);
            aspect = h / w;

        } else {
            pt3 = eval_helper.extractPoint(v2);
            if (!pt1.ok) return nada;
        }

        csctx.save();
        handleModifs();


        var m = csport.drawingstate.matrix;
        var initm = csport.drawingstate.initialmatrix;


        if (alpha !== 1)
            csctx.globalAlpha = alpha;

        var xx1 = pt1.x * m.a - pt1.y * m.b + m.tx;
        var yy1 = pt1.x * m.c - pt1.y * m.d - m.ty;

        var xx2 = pt2.x * m.a - pt2.y * m.b + m.tx;
        var yy2 = pt2.x * m.c - pt2.y * m.d - m.ty;

        var xx3 = pt3.x * m.a - pt3.y * m.b + m.tx;
        var yy3 = pt3.x * m.c - pt3.y * m.d - m.ty;

        csctx.transform(xx2 - xx1, yy2 - yy1, xx3 - xx1, yy3 - yy1, xx1, yy1);
        csctx.scale(1 / w, -1 / h * aspect);

        csctx.translate(w / 2, -h / 2);
        csctx.scale(flipx, flipy);
        csctx.translate(-w / 2, h / 2);

        csctx.translate(0, -h);


        drawImageIndirection(img, 0, 0);
        csctx.globalAlpha = 1;

        csctx.restore();


    }


    var v0, v1, v2, img;

    if (args.length === 2) {
        v0 = evaluateAndVal(args[0]);
        img = evaluateAndVal(args[1]);

        return drawimg1();
    }

    if (args.length === 3) {
        v0 = evaluateAndVal(args[0]);
        v1 = evaluateAndVal(args[1]);
        v2 = 0;
        img = evaluateAndVal(args[2]);

        return drawimg3();
    }


    if (args.length === 4) {
        v0 = evaluateAndVal(args[0]);
        v1 = evaluateAndVal(args[1]);
        v2 = evaluateAndVal(args[2]);
        img = evaluateAndVal(args[3]);

        return drawimg3();
    }

    return nada;
};

// TODO: separate arities
evaluator.drawimage$3 = evaluator.drawimage$2;
evaluator.drawimage$4 = evaluator.drawimage$2;

evaluator.allimages$0 = function() {
    var lst = [];
    var keys = Object.keys(images);
    keys.forEach(function(e) {
        lst.push({
            ctype: "string",
            value: e
        });
    });
    return List.turnIntoCSList(lst);
};


var cameravideo = {};
evaluator.cameravideo$0 = function(args, modifs) {
    var maximal = true; //use maximal as default (if no other modifier is given)
    var constraints = {};

    function makeconstraints(width) {
        return {
            video: {
                width: width,
                advanced: [{
                    width: {
                        max: width, //see below for details
                        min: width
                    }
                }, {
                    width: {
                        ideal: width
                    }
                }]
            },
            audio: false
        };
    }

    if (modifs.resolution !== undefined) {
        var val = evaluate(modifs.resolution);
        if (val.ctype === 'string' && val.value === 'maximal') maximal = true;
        else {
            if (val.ctype === 'number') {
                maximal = false;
                constraints = makeconstraints(val.value.real);
            } else if (List._helper.isNumberVecN(val, 2)) {
                maximal = false;
                constraints = makeconstraints(val.value[0].value.real);
                var heightorratio = val.value[1].value.real;
                if (heightorratio < 10 || !Number.isInteger(heightorratio)) {
                    constraints.video.aspectRatio = heightorratio;
                    constraints.video.advanced[0].aspectRatio = {
                        min: heightorratio,
                        max: heightorratio
                    };
                    constraints.video.advanced[1].aspectRatio = {
                        ideal: heightorratio,
                    };
                } else {
                    constraints.video.height = heightorratio;
                    constraints.video.advanced[0].height = {
                        min: heightorratio,
                        max: heightorratio
                    };
                    constraints.video.advanced[1].height = {
                        ideal: heightorratio,
                    };
                }
            }
        }
    }
    if (maximal) {
        // As per https://bugs.chromium.org/p/chromium/issues/detail?id=543997#c47,
        // Chrome 54 doesn't actually honor ideal constraints yet, so we need
        // to explicitely list some common widths to control resolution selection.
        constraints = [320, 640, 1024, 1280, 1920, 2560];
        constraints = constraints.map(function(w) {
            return {
                width: {
                    min: w
                }
            };
        });
        // We'd like to also minimize aspect ratio i.e. maximize height for a given
        // width, but Chrome again appears to have a problem with this. See also
        // https://bugs.chromium.org/p/chromium/issues/detail?id=657145
        if (false) {
            constraints = constraints.concat([1.34, 1.59, 1.78, 2].map(function(a) {
                return {
                    aspectRatio: {
                        max: a
                    }
                };
            }));
        }
        constraints = {
            video: {
                width: 16000, // ideal dimensions, will
                height: 9000, // prefer big resolutions
                advanced: constraints
            },
            audio: false
        };
    }
    var constraintsstr = JSON.stringify(constraints);

    if (cameravideo[constraintsstr])
        return cameravideo[constraintsstr];

    var openVideoStream = null;

    var gum = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    if (gum) {
        openVideoStream = function(success, failure) {
            navigator.mediaDevices
                .getUserMedia(constraints)
                .then(success, failure);
        };
    } else {
        gum = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;
        if (gum) {
            openVideoStream = function(success, failure) {
                gum.call(navigator, constraints, success, failure);
            };
        }
    }
    if (!openVideoStream) {
        console.warn("getUserMedia call not supported");
        cameravideo[constraintsstr] = nada;
        return nada;
    }
    var video = document.createElement("video");
    video.autoplay = true;
    cameravideo[constraintsstr] = loadImage(video, true);
    console.log("Opening stream.");
    openVideoStream(function success(stream) {
        /* does not work in Safari 11.0 (beta)
        var url = window.URL.createObjectURL(stream);
        video.src = url;
        */
        video.srcObject = stream;
        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.play();
        video.addEventListener("loadeddata", csplay);
    }, function failure(err) {
        console.error("Could not get user video:", String(err), err);
    });
    return cameravideo[constraintsstr];
};

evaluator.playvideo$1 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[0]));
    if (img.live && img.img.play) {
        img.img.play();
    }
    return nada;
};

evaluator.pausevideo$1 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[0]));
    if (img.live && img.img.pause) {
        img.img.pause();
    }
    return nada;
};

var helpercanvas; //invisible helper canvas.
function getHelperCanvas(width, height) {
    if (!helpercanvas) {
        //creating helpercanvas only once increases the running time
        helpercanvas = /** @type {HTMLCanvasElement} */ (document.createElement("canvas"));
    }
    helpercanvas.width = width;
    helpercanvas.height = height;
    return helpercanvas;
}

/**
 * reads a rectangular block of pixels from the upper left corner.
 * The colors are representent as a 4 component RGBA vector with entries in [0,1]
 */
function readPixelsIndirection(img, x, y, width, height) {
    var res = [];
    if (img.readPixels) {
        res = img.readPixels(x, y, width, height);
    } else { //use canvas-approach
        var data, ctx;
        if (img.img.getContext) { //img is a canvas
            ctx = img.img.getContext('2d');
            data = ctx.getImageData(x, y, width, height).data;
        } else { //copy corresponding subimage of img.img to temporary canvas
            try {
                var helpercanvas = getHelperCanvas(width, height);
                ctx = helpercanvas.getContext('2d');
                ctx.drawImage(img.img, x, y, width, height, 0, 0, width, height);
                data = ctx.getImageData(0, 0, width, height).data;
            } catch (exception) {
                console.log(exception);
            }

        }
        for (var i in data) res.push(data[i] / 255);
    }
    return res;
}

/**
 * imagergba(‹image›,x,y) implements imagergb(‹imagename›,x,y) from Cinderella, i.e.
 * returns a 4 component vector ranging from (0-255, 0-255, 0-255, 0-1)
 */
evaluator.imagergba$3 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[0]));
    var x = evaluateAndVal(args[1]);
    var y = evaluateAndVal(args[2]);

    if (!img || x.ctype !== 'number' || y.ctype !== 'number' || !img.ready) return nada;

    x = Math.round(x.value.real);
    y = Math.round(y.value.real);
    if (!isFiniteNumber(x) || !isFiniteNumber(y)) return nada;

    var rgba = readPixelsIndirection(img, x, y, 1, 1);
    return List.realVector([rgba[0] * 255, rgba[1] * 255, rgba[2] * 255, rgba[3]]);
};

evaluator.imagergb$3 = evaluator.imagergba$3; //According to reference

function readimgatcoord(img, coord, modifs) {
    if (!coord.ok) return nada;

    var w = img.width;
    var h = img.height;

    var interpolate = true; //default values
    var repeat = false;

    function handleModifs() {
        var erg;
        if (modifs.interpolate !== undefined) {
            erg = evaluate(modifs.interpolate);
            if (erg.ctype === 'boolean') {
                interpolate = (erg.value);
            }
        }

        if (modifs.repeat !== undefined) {
            erg = evaluate(modifs.repeat);
            if (erg.ctype === 'boolean') {
                repeat = (erg.value);
            }
        }
    }
    handleModifs();
    if (interpolate) {
        coord.x -= 0.5; //center of pixels are in the middle of them.
        coord.y -= 0.5; //Now pixel-centers have wlog integral coordinates
    }

    if (repeat) {
        coord.x = (coord.x % w + w) % w;
        coord.y = (coord.y % h + h) % h;
    }

    var xi = Math.floor(coord.x); //integral part
    var yi = Math.floor(coord.y);

    if (!isFiniteNumber(xi) || !isFiniteNumber(yi)) return nada;

    var rgba = [0, 0, 0, 0];
    if (interpolate) {
        var i, j;

        var xf = coord.x - xi; //fractional part
        var yf = coord.y - yi;

        var pixels = readPixelsIndirection(img, xi, yi, 2, 2);

        //modify pixels for boundary cases:
        if (repeat) { //read pixels at boundary seperately
            if (xi === w - 1 || yi === h - 1) {
                var p10 = readPixelsIndirection(img, (xi + 1) % w, yi, 1, 1);
                var p01 = readPixelsIndirection(img, xi, (yi + 1) % h, 1, 1);
                var p11 = readPixelsIndirection(img, (xi + 1) % w, (yi + 1) % h, 1, 1);
                pixels = pixels.slice(0, 4).concat(p10, p01, p11);
            }
        } else { //clamp to boundary
            if (xi === -1 || xi === w - 1) xf = Math.round(xf);
            if (yi === -1 || yi === h - 1) yf = Math.round(yf);
        }

        //bilinear interpolation for each component i
        for (i = 0; i < 4; i++)
            rgba[i] = (1 - yf) * ((1 - xf) * pixels[i] + xf * pixels[i + 4]) +
            yf * ((1 - xf) * pixels[i + 8] + xf * pixels[i + 12]);
    } else {
        rgba = readPixelsIndirection(img, xi, yi, 1, 1);
    }
    return List.realVector(rgba);
}

/**
 * imagergba(<point1>, <point2>, ‹image›, <point3>) returns the color at the coordinate
 * <point3> assuming that the left/right lower corner is <point1>/<point2> resp.
 */
evaluator.imagergba$4 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[2]));
    if (!img || !img.ready) return nada;

    var w = img.width;
    var h = img.height;

    var w0 = evaluateAndHomog(args[0]);
    var w1 = evaluateAndHomog(args[1]);
    var v0 = evaluateAndHomog(List.realVector([0, h, 1]));
    var v1 = evaluateAndHomog(List.realVector([w, h, 1]));

    if (w0 === nada || w1 === nada || p === nada) return nada;

    //create an orientation-reversing similarity transformation that maps w0->v0, w1->v1
    var ii = List.ii;
    var jj = List.jj;

    var m1 = eval_helper.basismap(v0, v1, ii, jj); //interchange I and J,
    var m2 = eval_helper.basismap(w0, w1, jj, ii); //see Thm. 18.4 of Perspectives on Projective Geometry
    var p = evaluateAndHomog(args[3]);
    var coord = eval_helper.extractPoint(General.mult(m1, General.mult(List.adjoint3(m2), p)));
    return readimgatcoord(img, coord, modifs);
};


evaluator.imagergb$4 = function(args, modifs) {
    var rgba = evaluator.imagergba$4(args, modifs);
    if (rgba === nada) return nada;
    return List.turnIntoCSList(rgba.value.slice(0, 3));
};

evaluator.readpixels$1 = function(args, modifs) {
    var img = imageFromValue(evaluateAndVal(args[0]));
    var data = readPixelsIndirection(img, 0, 0, img.width, img.height);
    var pixels = [];
    for (var i = 0; i + 3 < data.length; i += 4) {
        pixels.push(List.turnIntoCSList([CSNumber.real(data[i + 0]), CSNumber.real(data[i + 1]), CSNumber.real(data[i + 2]), CSNumber.real(data[i + 3])]));
    }
    return List.turnIntoCSList(pixels);
};
