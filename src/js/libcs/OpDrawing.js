//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************


eval_helper.extractPoint = function(v1) {
    var erg = {};
    erg.ok = false;
    if (v1.ctype === 'geo') {
        var val = v1.value;
        if (val.kind === "P") {
            erg.x = Accessor.getField(val, "x").value.real;
            erg.y = Accessor.getField(val, "y").value.real;
            erg.ok = true;
            return erg;
        }

    }
    if (v1.ctype !== 'list') {
        return erg;
    }

    var pt1 = v1.value;
    var x = 0;
    var y = 0;
    var z = 0,
        n1, n2, n3;
    if (pt1.length === 2) {
        n1 = pt1[0];
        n2 = pt1[1];
        if (n1.ctype === 'number' && n2.ctype === 'number') {
            erg.x = n1.value.real;
            erg.y = n2.value.real;
            erg.ok = true;
            return erg;
        }
    }

    if (pt1.length === 3) {
        n1 = pt1[0];
        n2 = pt1[1];
        n3 = pt1[2];
        if (n1.ctype === 'number' && n2.ctype === 'number' && n3.ctype === 'number') {
            n1 = CSNumber.div(n1, n3);
            n2 = CSNumber.div(n2, n3);
            erg.x = n1.value.real;
            erg.y = n2.value.real;
            erg.ok = true;
            return erg;
        }
    }

    return erg;

};

evaluator.draw$1 = function(args, modifs) {

    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype === "shape") {
        eval_helper.drawshape(v1, modifs);
    } else if (v1.usage === "Line") {
        Render2D.handleModifs(modifs, Render2D.lineModifs);
        Render2D.drawline(v1);
    } else {
        var pt = eval_helper.extractPoint(v1);

        if (!pt.ok) {
            if (typeof(v1.value) !== "undefined") { //eventuell doch ein Segment
                if (v1.value.length === 2) {
                    return evaluator.draw$2(v1.value, modifs);
                }
            }
            return;
        }

        if (modifs !== null) {
            Render2D.handleModifs(modifs, Render2D.pointModifs);
        }
        Render2D.drawpoint(pt);
    }
    return nada;
};

evaluator.draw$2 = function(args, modifs) {
    var v1 = evaluateAndVal(args[0]);
    var v2 = evaluateAndVal(args[1]);
    var pt1 = eval_helper.extractPoint(v1);
    var pt2 = eval_helper.extractPoint(v2);
    if (!pt1.ok || !pt2.ok) {
        return nada;
    }
    if (modifs !== null) {
        Render2D.handleModifs(modifs, Render2D.lineModifs);
    }
    Render2D.drawsegcore(pt1, pt2);
    return nada;
};

evaluator.drawcircle$2 = function(args, modifs) {
    return eval_helper.drawcircle(args, modifs, "D");
};


evaluator.fillcircle$2 = function(args, modifs) {
    return eval_helper.drawcircle(args, modifs, "F");
};

eval_helper.drawcircle = function(args, modifs, df) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    function magic_circle(ctx, x, y, r) {
        m = 0.551784;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(r, r);

        ctx.beginPath();
        ctx.moveTo(1, 0);
        ctx.bezierCurveTo(1, -m, m, -1, 0, -1);
        ctx.bezierCurveTo(-m, -1, -1, -m, -1, 0);
        ctx.bezierCurveTo(-1, m, -m, 1, 0, 1);
        ctx.bezierCurveTo(m, 1, 1, m, 1, 0);
        ctx.closePath();
        ctx.restore();
    }


    var pt = eval_helper.extractPoint(v0);


    if (!pt.ok || v1.ctype !== 'number') {
        return nada;
    }
    var m = csport.drawingstate.matrix;

    var xx = pt.x * m.a - pt.y * m.b + m.tx;
    var yy = pt.x * m.c - pt.y * m.d - m.ty;

    Render2D.handleModifs(modifs, Render2D.conicModifs);
    var size = 4;
    if (Render2D.size !== null)
        size = Render2D.size;
    csctx.lineWidth = size * 0.4;

    csctx.beginPath();
    csctx.arc(xx, yy, v1.value.real * m.sdet, 0, 2 * Math.PI);
    //  magic_circle(csctx,xx,yy,v1.value.real*m.sdet);


    if (df === "D") {
        csctx.strokeStyle = Render2D.lineColor;
        csctx.stroke();
    }
    if (df === "F") {
        csctx.fillStyle = Render2D.lineColor;
        csctx.fill();
    }
    if (df === "C") {
        csctx.clip();
    }

    return nada;
};


eval_helper.drawconic = function(aConic, modifs) {

    Render2D.handleModifs(modifs, Render2D.conicModifs);
    var size = 4;
    if (Render2D.size !== null)
        size = Render2D.size;
    csctx.lineWidth = size * 0.4;

    var eps = 10e-16;
    var mat = aConic.matrix;

    // check for complex values
    for (var i = 0; i < 2; i++)
        for (var j = 0; j < 2; j++) {
            if (Math.abs(mat.value[i].value[j].value.imag) > eps) return;
        }

    var a = mat.value[0].value[0].value.real;
    var b = mat.value[1].value[0].value.real;
    var c = mat.value[1].value[1].value.real;
    var d = mat.value[2].value[0].value.real;
    var e = mat.value[2].value[1].value.real;
    var f = mat.value[2].value[2].value.real;

    var myMat = [
        [a, b, d],
        [b, c, e],
        [d, e, f]
    ];

    var det = a * c * f - a * e * e - b * b * f + 2 * b * d * e - c * d * d;
    var degen = Math.abs(det) < eps ? true : false;

    var cswh_max = csw > csh ? csw : csh;

    var x_zero = -cswh_max;
    var x_w = 2 * cswh_max;
    var y_zero = -cswh_max;
    var y_h = 2 * cswh_max;

    var useRot = 1;
    if (degen) { // since we split then - rotation unnecessary
        useRot = 0;
    }


    if (useRot) {
        var C = [a, b, c, d, e, f];
        var A = [
            [C[0], C[1]],
            [C[1], C[2]]
        ];
        var angle = 0;
        if (Math.abs(a - b) > eps) {
            angle = Math.atan(b / a - c) / 2;
        } else {
            angle = Math.PI / 4;
        }
        var get_rMat = function(angle) {
            return [
                [Math.cos(angle), -Math.sin(angle), 0],
                [Math.sin(angle), Math.cos(angle), 0],
                [0, 0, 1]
            ];
        };


        var rMat = get_rMat(angle);
        var TrMat = numeric.transpose(rMat);
        var tmp = numeric.dot(myMat, rMat);
        tmp = numeric.dot(TrMat, tmp);
        a = tmp[0][0];
        b = tmp[1][0];
        c = tmp[1][1];
        d = tmp[2][0];
        e = tmp[2][1];
        f = tmp[2][2];

    }

    var Conic = [a, b, c, d, e, f];

    // split degenerate conic into 1 or 2 lines
    var split_degen = function() {

        //modifs.size= CSNumber.real(2); // TODO fix this
        var erg = geoOps._helper.splitDegenConic(mat);
        if (erg === nada) return;
        var lg = erg[0];
        var lh = erg[1];

        var arg = [lg];
        evaluator.draw$1(arg, modifs);
        arg[0] = lh;
        evaluator.draw$1(arg, modifs);

    };

    var get_concic_type = function(C) {
        if (C === 'undefined' || C.length !== 6) {
            console.error("this does not define a Conic");
        }

        if (degen) return "degenerate";

        var det = C[0] * C[2] - C[1] * C[1];

        if (Math.abs(det) < eps) {
            return "parabola";
        } else if (det > eps) {
            return "ellipsoid";
        } else {
            return "hyperbola";
        }

    }; // end get_concic_type

    var type = get_concic_type(Conic);

    var norm = function(x0, y0, x1, y1) {
        var norm = Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2);
        return Math.sqrt(norm);
    };

    var is_inside = function(x, y) {
        return (x > 0 && x < csw && y > 0 && y < csh);
    };

    //    var drawRect = function(x,y, col){
    //    	csctx.strokeStyle = 'navy';
    //    	if(col !== 'undefined') csctx.strokeStyle = col;
    //    	csctx.beginPath();
    //    	csctx.rect(x,y, 10, 10);
    //    	csctx.stroke();
    //    };
    // arrays to save points on conic
    var arr_x1 = [];
    var arr_x2 = [];
    var arr_y1 = [];
    var arr_y2 = [];
    var arr_xg = [];
    var arr_yg = [];

    var resetArrays = function() {
        arr_x1 = [];
        arr_x2 = [];
        arr_y1 = [];
        arr_y2 = [];
        arr_xg = [];
        arr_yg = [];
    };

    var drawArray = function(x, y) {
        csctx.strokeStyle = Render2D.lineColor;
        csctx.lineWidth = size;

        csctx.beginPath();
        for (var i = 1; i < x.length; i++) {
            csctx.moveTo(x[i - 1], y[i - 1]);
            //csctx.fillRect(x[i],y[i],5,5);
            csctx.lineTo(x[i], y[i]);
        }
        csctx.stroke();
    }; // end drawArray


    var eval_conic_x = function(C, ymin, ymax) {
        var x1, x2;
        var type = get_concic_type(C);

        if (C.length !== 6) {
            console.error("Conic needs 6 Parameters");
            return;
        }

        var a = C[0];
        var b = C[1];
        var c = C[2];
        var d = C[3];
        var e = C[4];
        var f = C[5];


        var step;
        var ttemp; // trafo temp
        var perc = 0.05;
        var diff = ymax - ymin;
        var ssmall = perc * diff + ymin;
        var slarge = ymax - perc * diff;
        for (var y = ymin; y <= ymax; y += step) {
            if (y < ssmall || y > slarge) {
                step = 1 / 3;
            } else {
                step = 2;
            }
            var yback = y;
            ttemp = csport.to(0, y);
            y = ttemp[1];

            var inner = -a * c * Math.pow(y, 2) - 2 * a * e * y - a * f + Math.pow(b, 2) * Math.pow(y, 2) + 2 * b * d * y + Math.pow(d, 2);
            inner = Math.sqrt(inner);


            x1 = 1 / a * (-b * y - d + inner);
            x2 = -1 / a * (b * y + d + inner);


            var ya, yb, y1, y2;
            if (useRot) {
                var r1 = [x1, y, 1];
                var r2 = [x2, y, 1];
                r1 = numeric.dot(rMat, r1);
                r2 = numeric.dot(rMat, r2);
                x1 = r1[0];
                x2 = r2[0];
                ya = r1[1];
                yb = r2[1];
            } else {
                ya = y;
                yb = y;
            }

            // transform to canvas coordiantes
            if (!isNaN(x1)) {
                ttemp = csport.from(x1, ya, 1);
                x1 = ttemp[0];
                y1 = ttemp[1];
            }
            if (!isNaN(x2)) {
                ttemp = csport.from(x2, yb, 1);
                x2 = ttemp[0];
                y2 = ttemp[1];
            }

            // for ellipsoids we go out of canvas
            if (!isNaN(x1) && type === "ellipsoid") {
                arr_x1.push(x1);
                arr_y1.push(y1);
            } else if (!isNaN(x1) && x1 >= x_zero && x1 <= x_w) {
                arr_x1.push(x1);
                arr_y1.push(y1);
            }

            if (!isNaN(x2) && type === "ellipsoid") {
                arr_x2.push(x2);
                arr_y2.push(y2);
            } else if (!isNaN(x2) && x2 >= x_zero && x2 <= x_w) {
                arr_x2.push(x2);
                arr_y2.push(y2);
            }
            y = yback; // convert y back
        }
    }; // end eval_conic_x

    // calc and draw conic
    var calc_draw = function(C) {
        var ymin, ymax, y0, y1;
        var ttemp;

        var type = get_concic_type(C);


        if (C.length !== 6) {
            console.error("Conic needs 6 Parameters");
            return;
        }

        var a = C[0];
        var b = C[1];
        var c = C[2];
        var d = C[3];
        var e = C[4];
        var f = C[5];

        // these are the actual formulas - we use variables to speed up
        //y0 = (-a*e + b*d - Math.sqrt(a*(-a*c*f + a*Math.pow(e, 2) + Math.pow(b, 2)*f - 2*b*d*e + c*Math.pow(d,2))))/(a*c - Math.pow(b, 2));
        //y1 = (-a*e + b*d + Math.sqrt(a*(-a*c*f + a*Math.pow(e, 2) + Math.pow(b, 2)*f - 2*b*d*e + c*Math.pow(d,2))))/(a*c - Math.pow(b, 2));

        var aebd = -a * e + b * d;
        var largeSqrt = Math.sqrt(a * (-a * c * f + a * Math.pow(e, 2) + Math.pow(b, 2) * f - 2 * b * d * e + c * Math.pow(d, 2)));
        var deNom = a * c - Math.pow(b, 2);

        y0 = (aebd - largeSqrt) / deNom;
        y1 = (aebd + largeSqrt) / deNom;

        if (!isNaN(y0)) {
            ttemp = csport.from(0, y0, 1);
            y0 = ttemp[1];
        } else {
            y0 = y_zero;
        }

        if (!isNaN(y1)) {
            ttemp = csport.from(0, y1, 1);
            y1 = ttemp[1];
        } else {
            y1 = y_zero;
        }

        ymin = (y0 < y1 ? y0 : y1);
        ymax = (y0 > y1 ? y0 : y1);


        eval_conic_x(C, y_zero, ymin);
        arr_xg = arr_x1.concat(arr_x2.reverse());
        arr_yg = arr_y1.concat(arr_y2.reverse());
        //drawArray(arr_xg, arr_yg, "gold");
        drawArray(arr_xg, arr_yg);
        resetArrays();


        eval_conic_x(C, ymax, y_h);
        //drawArray(arr_x1, arr_y1, "orange");
        drawArray(arr_x1, arr_y1);
        // bridge branches
        if (is_inside(arr_x1[0], arr_y1[1]) || is_inside(arr_x2[0], arr_y2[0])) { // drawing bug fix
            csctx.beginPath();
            //csctx.strokeStyle = "pink";
            csctx.moveTo(arr_x1[0], arr_y1[0]);
            csctx.lineTo(arr_x2[0], arr_y2[0]);
            csctx.stroke();
        }
        //drawArray(arr_x2, arr_y2, "black");
        drawArray(arr_x2, arr_y2);
        resetArrays();


        eval_conic_x(C, ymin, ymax);
        //drawArray(arr_x1, arr_y1, "red");
        drawArray(arr_x1, arr_y1);
        // bridge branches
        if (type === "ellipsoid") {
            csctx.beginPath();
            csctx.moveTo(arr_x1[0], arr_y1[0]);
            csctx.lineTo(arr_x2[0], arr_y2[0]);
            csctx.stroke();
            csctx.beginPath();
            csctx.moveTo(arr_x1[arr_x1.length - 1], arr_y1[arr_y1.length - 1]);
            csctx.lineTo(arr_x2[arr_x2.length - 1], arr_y2[arr_y2.length - 1]);
            csctx.stroke();
            //}
        }
        //drawArray(arr_x2, arr_y2, "green");
        drawArray(arr_x2, arr_y2);
        resetArrays();
    }; // end calc_draw


    // actually start drawing
    if (!degen) {
        calc_draw(Conic);
    } else {
        split_degen();
    }

}; // end eval_helper.drawconic

evaluator.drawall$1 = function(args, modifs) {
    var v1 = evaluate(args[0]);
    if (v1.ctype === "list") {
        Render2D.handleModifs(modifs, Render2D.pointAndLineModifs);
        for (var i = 0; i < v1.value.length; i++) {
            evaluator.draw$1([v1.value[i]], null);
        }
    }
    return nada;
};

evaluator.connect$1 = function(args, modifs) {
    return eval_helper.drawpolygon(args, modifs, "D", false);
};


evaluator.drawpoly$1 = function(args, modifs) {
    return eval_helper.drawpolygon(args, modifs, "D", true);
};


evaluator.fillpoly$1 = function(args, modifs) {
    return eval_helper.drawpolygon(args, modifs, "F", true);
};

evaluator.drawpolygon$1 = function(args, modifs) {
    return eval_helper.drawpolygon(args, modifs, "D", true);
};


evaluator.fillpolygon$1 = function(args, modifs) {
    return eval_helper.drawpolygon(args, modifs, "F", true);
};


eval_helper.drawpolygon = function(args, modifs, df, cycle) {

    Render2D.handleModifs(modifs, Render2D.conicModifs);
    var size = 4;
    if (Render2D.size !== null)
        size = Render2D.size;
    csctx.lineWidth = size * 0.4;
    csctx.mozFillRule = 'evenodd';
    csctx.lineJoin = "round";

    var m = csport.drawingstate.matrix;

    function drawpolyshape() {
        var polys = v0.value;
        for (var j = 0; j < polys.length; j++) {
            var pol = polys[j];
            var i;
            for (i = 0; i < pol.length; i++) {
                var pt = pol[i];
                var xx = pt.X * m.a - pt.Y * m.b + m.tx;
                var yy = pt.X * m.c - pt.Y * m.d - m.ty;
                if (i === 0)
                    csctx.moveTo(xx, yy);
                else
                    csctx.lineTo(xx, yy);
            }
            csctx.closePath();
        }
    }

    function drawpoly() {
        var i;
        for (i = 0; i < v0.value.length; i++) {
            var pt = eval_helper.extractPoint(v0.value[i]);
            if (!pt.ok) {
                return;
            }
            var xx = pt.x * m.a - pt.y * m.b + m.tx;
            var yy = pt.x * m.c - pt.y * m.d - m.ty;
            if (i === 0)
                csctx.moveTo(xx, yy);
            else
                csctx.lineTo(xx, yy);
        }
        if (cycle)
            csctx.closePath();
    }

    var v0 = evaluate(args[0]);
    csctx.beginPath();
    if (v0.ctype === 'list') {
        drawpoly();
    }
    if (v0.ctype === 'shape') {
        drawpolyshape();
    }

    if (df === "D") {
        csctx.strokeStyle = Render2D.lineColor;
        csctx.stroke();
    }
    if (df === "F") {
        csctx.fillStyle = Render2D.lineColor;
        csctx.fill();
    }
    if (df === "C") {
        csctx.clip();
    }

    return nada;

};


evaluator.drawtext$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluate(args[1]);
    var pt = eval_helper.extractPoint(v0);

    if (!pt.ok) {
        return nada;
    }

    var m = csport.drawingstate.matrix;

    var xx = pt.x * m.a - pt.y * m.b + m.tx;
    var yy = pt.x * m.c - pt.y * m.d - m.ty;

    var col = csport.drawingstate.textcolor;
    Render2D.handleModifs(modifs, Render2D.textModifs);
    var size = csport.drawingstate.textsize;
    if (Render2D.size !== null) size = Render2D.size;
    csctx.fillStyle = Render2D.textColor;

    csctx.font = Render2D.bold + Render2D.italics + Math.round(size * 10) / 10 + "px " + Render2D.family;
    var txt = niceprint(v1);
    var width = csctx.measureText(txt).width;
    csctx.fillText(
        txt,
        xx - width * Render2D.align + Render2D.xOffset,
        yy - Render2D.yOffset);

    return nada;

};

eval_helper.drawshape = function(shape, modifs) {
    if (shape.type === "polygon") {
        return eval_helper.drawpolygon([shape], modifs, "D", 1);
    }
    if (shape.type === "circle") {
        return eval_helper.drawcircle([shape.value.value[0], shape.value.value[1]], modifs, "D");
    }
    return nada;
};


eval_helper.fillshape = function(shape, modifs) {

    if (shape.type === "polygon") {
        return eval_helper.drawpolygon([shape], modifs, "F", 1);
    }
    if (shape.type === "circle") {
        return eval_helper.drawcircle([shape.value.value[0], shape.value.value[1]], modifs, "F");
    }
    return nada;
};


eval_helper.clipshape = function(shape, modifs) {
    if (shape.type === "polygon") {
        return eval_helper.drawpolygon([shape], modifs, "C", 1);
    }
    if (shape.type === "circle") {
        return eval_helper.drawcircle([shape.value.value[0], shape.value.value[1]], modifs, "C");
    }
    return nada;
};


evaluator.fill$1 = function(args, modifs) {
    var v1 = evaluate(args[0]);
    if (v1.ctype === "shape") {
        return eval_helper.fillshape(v1, modifs);
    }
    return nada;
};


evaluator.clip$1 = function(args, modifs) {
    var v1 = evaluate(args[0]);
    if (v1.ctype === "shape") {
        return eval_helper.clipshape(v1, modifs);
    }
    if (v1.ctype === "list") {
        var erg = evaluator.polygon$1(args, []);
        return evaluator.clip$1([erg], []);
    }
    return nada;
};

///////////////////////////////////////////////
////// FUNCTION PLOTTING    ///////////////////
///////////////////////////////////////////////

// TODO: Dynamic Color and Alpha

evaluator.plot$1 = function(args, modifs) {
    return evaluator.plot$2([args[0], null], modifs);
};

evaluator.plot$2 = function(args, modifs) {
    var dashing = false;
    var connectb = false;
    var minstep = 0.001;
    var pxlstep = 0.2 / csscale; //TODO Anpassen auf PortScaling
    var count = 0;
    var stroking = false;
    var start = -10; //TODO Anpassen auf PortScaling
    var stop = 10;
    var step = 1;
    var steps = 1000;

    var v1 = args[0];
    var runv;
    if (args[1] !== null && args[1].ctype === 'variable') {
        runv = args[1].name;

    } else {
        var li = eval_helper.plotvars(v1);
        runv = "#";
        if (li.indexOf("t") !== -1) {
            runv = "t";
        }
        if (li.indexOf("z") !== -1) {
            runv = "z";
        }
        if (li.indexOf("y") !== -1) {
            runv = "y";
        }
        if (li.indexOf("x") !== -1) {
            runv = "x";
        }
    }

    namespace.newvar(runv);

    var m = csport.drawingstate.matrix;
    var col = csport.drawingstate.linecolor;
    var lsize = 1;

    Render2D.handleModifs(modifs, {
        "color": true,
        "alpha": true,
        "size": true,
        "dashpattern": true,
        "dashtype": true,
        "dashing": true,

        "connect": function(v) {
            if (v.ctype === 'boolean')
                connectb = v.value;
        },

        "start": function(v) {
            if (v.ctype === 'number')
                start = v.value.real;
        },

        "stop": function(v) {
            if (v.ctype === 'number')
                stop = v.value.real;
        },

        "steps": function(v) {
            if (v.ctype === 'number')
                steps = v.value.real;
        },
    });
    csctx.strokeStyle = Render2D.lineColor;
    csctx.lineWidth = Render2D.lsize;
    csctx.lineCap = 'round';
    csctx.lineJoin = 'round';

    function canbedrawn(v) {
        return v.ctype === 'number' && CSNumber._helper.isAlmostReal(v);
    }

    function limit(v) { //TODO: Die  muss noch geschreoben werden
        return v;

    }

    function drawstroke(x1, x2, v1, v2, step) {
        count++;
        //console.log(niceprint(x1)+"  "+niceprint(x2));
        //console.log(step);
        var xb = +x2.value.real;
        var yb = +v2.value.real;


        var xx2 = xb * m.a - yb * m.b + m.tx;
        var yy2 = xb * m.c - yb * m.d - m.ty;
        var xa = +x1.value.real;
        var ya = +v1.value.real;
        var xx1 = xa * m.a - ya * m.b + m.tx;
        var yy1 = xa * m.c - ya * m.d - m.ty;

        if (!stroking) {
            csctx.beginPath();
            csctx.moveTo(xx1, yy1);
            csctx.lineTo(xx2, yy2);
            stroking = true;
        } else {
            csctx.lineTo(xx1, yy1);

            csctx.lineTo(xx2, yy2);
        }

    }


    function drawrec(x1, x2, y1, y2, step) {

        var drawable1 = canbedrawn(y1);
        var drawable2 = canbedrawn(y2);


        if ((step < minstep)) { //Feiner wollen wir  nicht das muss wohl ein Sprung sein
            if (!connectb) {
                if (stroking) {
                    csctx.stroke();
                    stroking = false;
                }


            }
            return;
        }
        if (!drawable1 && !drawable2)
            return; //also hier gibt's nix zu malen, ist ja nix da

        var mid = CSNumber.real((x1.value.real + x2.value.real) / 2);
        namespace.setvar(runv, mid);
        var ergmid = evaluate(v1);

        var drawablem = canbedrawn(ergmid);

        if (drawable1 && drawable2 && drawablem) { //alles ist malbar ---> Nach Steigung schauen
            var a = limit(y1.value.real);
            var b = limit(ergmid.value.real);
            var c = limit(y2.value.real);
            var dd = Math.abs(a + c - 2 * b) / (pxlstep);
            var drawit = (dd < 1);
            if (drawit) { //Weiterer Qualitätscheck eventuell wieder rausnehmen.
                var mid1 = CSNumber.real((x1.value.real + mid.value.real) / 2);
                namespace.setvar(runv, mid1);
                var ergmid1 = evaluate(v1);

                var mid2 = CSNumber.real((mid.value.real + x2.value.real) / 2);
                namespace.setvar(runv, mid2);
                var ergmid2 = evaluate(v1);

                var ab = limit(ergmid1.value.real);
                var bc = limit(ergmid2.value.real);
                var dd1 = Math.abs(a + b - 2 * ab) / (pxlstep);
                var dd2 = Math.abs(b + c - 2 * bc) / (pxlstep);
                drawit = drawit && dd1 < 1 && dd2 < 1;


            }
            if (drawit) { // Refinement sieht gut aus ---> malen
                drawstroke(x1, mid, y1, ergmid, step / 2);
                drawstroke(mid, x2, ergmid, y2, step / 2);

            } else { //Refinement zu grob weiter verfeinern
                drawrec(x1, mid, y1, ergmid, step / 2);
                drawrec(mid, x2, ergmid, y2, step / 2);
            }
            return;
        }

        //Übergange con drawable auf nicht drawable

        drawrec(x1, mid, y1, ergmid, step / 2);

        drawrec(mid, x2, ergmid, y2, step / 2);


    }

    //Hier beginnt der Hauptteil
    var xo, vo, x, v, xx, yy;

    stroking = false;

    x = CSNumber.real(14.32);
    namespace.setvar(runv, x);
    v = evaluate(v1);
    if (v.ctype !== "number") {
        if (List.isNumberVector(v).value) {
            if (v.value.length === 2) { //Parametric Plot
                stroking = false;
                step = (stop - start) / steps;
                for (x = start; x < stop; x = x + step) {
                    namespace.setvar(runv, CSNumber.real(x));
                    var erg = evaluate(v1);
                    if (List.isNumberVector(erg).value && erg.value.length === 2) {
                        var x1 = +erg.value[0].value.real;
                        var y = +erg.value[1].value.real;
                        xx = x1 * m.a - y * m.b + m.tx;
                        yy = x1 * m.c - y * m.d - m.ty;

                        if (!stroking) {
                            csctx.beginPath();
                            csctx.moveTo(xx, yy);
                            stroking = true;
                        } else {
                            csctx.lineTo(xx, yy);
                        }

                    }


                }
                csctx.stroke();

                namespace.removevar(runv);

            }
        }
        return nada;
    }


    for (xx = start; xx < stop + step; xx = xx + step) {

        x = CSNumber.real(xx);
        namespace.setvar(runv, x);
        v = evaluate(v1);

        if (x.value.real > start) {
            drawrec(xo, x, vo, v, step);

        }
        xo = x;
        vo = v;


    }

    //    console.log(count);

    //   csctx.stroke();

    namespace.removevar(runv);
    if (stroking)
        csctx.stroke();

    return nada;
};


evaluator.plotX$1 = function(args, modifs) { //OK


    var v1 = args[0];
    var li = eval_helper.plotvars(v1);
    var runv = "#";
    if (li.indexOf("t") !== -1) {
        runv = "t";
    }
    if (li.indexOf("z") !== -1) {
        runv = "z";
    }
    if (li.indexOf("y") !== -1) {
        runv = "y";
    }
    if (li.indexOf("x") !== -1) {
        runv = "x";
    }


    namespace.newvar(runv);
    var start = -10;
    var stop = 10;
    var step = 0.01;
    var m = csport.drawingstate.matrix;
    var col = csport.drawingstate.linecolor;
    csctx.fillStyle = col;
    csctx.lineWidth = 1;
    csctx.lineCap = 'round';

    var stroking = false;

    for (var x = start; x < stop; x = x + step) {
        namespace.setvar(runv, CSNumber.real(x));

        var erg = evaluate(v1);
        if (erg.ctype === "number") {
            var y = +erg.value.real;
            var xx = x * m.a - y * m.b + m.tx;
            var yy = x * m.c - y * m.d - m.ty;
            if (!stroking) {
                csctx.beginPath();
                csctx.moveTo(xx, yy);
                stroking = true;
            } else {
                csctx.lineTo(xx, yy);
            }

        }


    }
    csctx.stroke();

    namespace.removevar(runv);


    return nada;

};


eval_helper.plotvars = function(a) {
    function merge(x, y) {
        var obj = {},
            i;
        for (i = x.length - 1; i >= 0; --i)
            obj[x[i]] = x[i];
        for (i = y.length - 1; i >= 0; --i)
            obj[y[i]] = y[i];
        var res = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) // <-- optional
                res.push(obj[k]);
        }
        return res;
    }

    function remove(x, y) {

        for (var i = 0; i < x.length; i++) {
            if (x[i] === y) {
                x.splice(i, 1);
                i--;
            }
        }
        return x;
    }

    var l1, l2, li, els, j;

    if (a.ctype === "variable") {
        return [a.name];
    }

    if (a.ctype === 'infix') {
        l1 = eval_helper.plotvars(a.args[0]);
        l2 = eval_helper.plotvars(a.args[1]);
        return merge(l1, l2);
    }

    if (a.ctype === 'list') {
        els = a.value;
        li = [];
        for (j = 0; j < els.length; j++) {
            l1 = eval_helper.plotvars(els[j]);
            li = merge(li, l1);
        }
        return li;
    }

    if (a.ctype === 'function') {
        els = a.args;
        li = [];
        for (j = 0; j < els.length; j++) {
            l1 = eval_helper.plotvars(els[j]);
            li = merge(li, l1);

        }
        if ((a.oper === "apply" //OK, das kann man eleganter machen, TODO: irgendwann
                || a.oper === "select" || a.oper === "forall" || a.oper === "sum" || a.oper === "product" || a.oper === "repeat" || a.oper === "min" || a.oper === "max" || a.oper === "sort"
            ) && a.args[1].ctype === "variable") {
            li = remove(li, a.args[1].name);
        }
        return li;
    }

    return [];


};


evaluator.clrscr$0 = function(args, modifs) {
    if (typeof csw !== 'undefined' && typeof csh !== 'undefined') {
        csctx.clearRect(0, 0, csw, csh);
    }
    return nada;
};

evaluator.repaint$0 = function(args, modifs) {
    updateCindy();
    return nada;
};


evaluator.screenbounds$0 = function(args, modifs) {
    var pt1 = List.realVector(csport.to(0, 0));
    pt1.usage = "Point";
    var pt2 = List.realVector(csport.to(csw, 0));
    pt2.usage = "Point";
    var pt3 = List.realVector(csport.to(csw, csh));
    pt3.usage = "Point";
    var pt4 = List.realVector(csport.to(0, csh));
    pt4.usage = "Point";
    return (List.turnIntoCSList([pt1, pt2, pt3, pt4]));
};
