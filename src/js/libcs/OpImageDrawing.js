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

evaluator.cameravideo$0 = function(args, modifs) {
    var maximal = true; //use maximal as default (if no other modifier is given)
    var constraints = {};

    if (modifs.resolution !== undefined) {
        maximal = false;
        var val = evaluate(modifs.resolution);
        if (val.ctype === 'string' && val.value === 'maximal') maximal = true;
        else {
            var width = null;
            var heightorratio = null;

            if (val.ctype === 'number') {
                width = val.value.real;
            } else if (List.isNumberVector(val).value && (val.value.length === 2)) {
                width = val.value[0].value.real;
                heightorratio = val.value[1].value.real;
            } else return nada;

            constraints = {
                video: {
                    width: width,
                    advanced: [{
                        width: {
                            max: width, //ideal or exact seem not be supported by Chrome yet
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
            if (heightorratio) {
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
            constraints = constraints.concat([1.34, 1.59, 1.78].map(function(a) {
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

    console.log(constraints);

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
        return nada;
    }
    var video = document.createElement("video");
    video.autoplay = true;
    var img = loadImage(video);
    console.log("Opening stream.");
    openVideoStream(function success(stream) {
        var url = window.URL.createObjectURL(stream);
        video.src = url;
        video.addEventListener("loadeddata", csplay);
    }, function failure(err) {
        console.error("Could not get user video:", String(err), err);
    });
    return img;
};
