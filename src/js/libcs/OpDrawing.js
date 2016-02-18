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


eval_helper.arcHelper = function(args) {
    var arc = {};
    arc.startPoint = evaluateAndHomog(args[0]);
    arc.viaPoint = evaluateAndHomog(args[1]);
    arc.endPoint = evaluateAndHomog(args[2]);
    return arc;
};

evaluator.fillcircle$2 = function(args, modifs) {
    return eval_helper.drawcircle(args, modifs, "F");
};

evaluator.drawarc$3 = function(args, modifs) {
    var arc = eval_helper.arcHelper(args);
    return eval_helper.drawarc(arc, modifs, "D");
};

evaluator.fillarc$3 = function(args, modifs) {
    var arc = eval_helper.arcHelper(args);
    return eval_helper.drawarc(arc, modifs, "F");
};


eval_helper.drawarc = function(args, modifs, df) {
    var a = args.startPoint;
    var b = args.viaPoint;
    var c = args.endPoint;

    // check for complex values
    if (!List._helper.isAlmostReal(List.turnIntoCSList([a, b, c]))) return nada;

    // modifs handling
    Render2D.handleModifs(modifs, Render2D.conicModifs);
    Render2D.preDrawCurve();

    var abcdet = List.det3(a, b, c);

    if (Math.abs(abcdet.value.real) > 1e-12) { // we have an arc, not segment
        var con = geoOps._helper.ConicBy5(null, a, b, c, List.ii, List.jj);
        var cen = geoOps._helper.CenterOfConic(con);
        cen = List.normalizeMax(cen);

        var zer = CSNumber.real(0);

        // move center of conic to origin
        var mat = List.turnIntoCSList([
            List.turnIntoCSList([cen.value[2], zer, CSNumber.neg(cen.value[0])]),
            List.turnIntoCSList([zer, cen.value[2], CSNumber.neg(cen.value[1])]),
            List.turnIntoCSList([zer, zer, cen.value[2]])
        ]);
        var aa = List.normalizeZ(General.mult(mat, a));
        var bb = List.normalizeZ(General.mult(mat, b));
        var cc = List.normalizeZ(General.mult(mat, c));


        // get angles of A and C 
        var startAngle = -Math.atan2(aa.value[1].value.real, aa.value[0].value.real);
        var endAngle = -Math.atan2(cc.value[1].value.real, cc.value[0].value.real);

        cen = List.normalizeZ(cen);
        a = List.normalizeZ(a);
        b = List.normalizeZ(b);
        c = List.normalizeZ(c);
        var arcDist = List.abs(List.sub(a, cen));

        // x, y vals of the center
        var pt = [cen.value[0].value.real, cen.value[1].value.real];

        // transform to canvas
        var m = csport.drawingstate.matrix;
        var xx = pt[0] * m.a - pt[1] * m.b + m.tx;
        var yy = pt[0] * m.c - pt[1] * m.d - m.ty;


        // check for counter clockwise drawing
        var cclock = List.det3(a, b, c).value.real > 0;

        csctx.save();

        // canvas circle radius 
        var rad = arcDist.value.real * m.sdet;

        csctx.beginPath();
        csctx.translate(xx, yy);

        // use the canvas arc function -- buggy in Chrome at least in Okt 15
        // looks fine in Sept 16
        var useArc = true;

        if (useArc) {
            csctx.arc(0, 0, arcDist.value.real * m.sdet, startAngle, endAngle, cclock);
        } else {
            var num = 500; // Number of segments

            //  mod 2 pi in case startAngle > endAngle
            if (startAngle > endAngle) endAngle = endAngle + Math.PI * 2;

            // divide segments --  rotate counterclockwise if necessary
            var ntler = !cclock ? (endAngle - startAngle) / num : -(2 * Math.PI - endAngle + startAngle) / num;

            // drawing
            csctx.moveTo(rad * Math.cos(startAngle), rad * Math.sin(startAngle));
            var angl;
            for (var ii = 0; ii <= num; ii++) {
                angl = startAngle + ii * ntler;
                csctx.lineTo(rad * Math.cos(angl), rad * Math.sin(angl));
            }
        }


        if (df === "F") {
            csctx.fillStyle = Render2D.lineColor;
            csctx.closePath();
            csctx.fill();
        }

        if (df === "D") {
            csctx.stroke();
        }
        csctx.restore();

    } else { // segment case
        if (df !== "D") return nada; // Nothing to fill in the degenerate case
        var ptA = eval_helper.extractPoint(a);
        var ptB = eval_helper.extractPoint(b);
        var ptC = eval_helper.extractPoint(c);
        if (!ptA.ok || !ptB.ok || !ptC.ok) return nada;

        // dists
        var dAB = (ptA.x - ptB.x) * (ptA.x - ptB.x) + (ptA.y - ptB.y) * (ptA.y - ptB.y);
        var dAC = (ptA.x - ptC.x) * (ptA.x - ptC.x) + (ptA.y - ptC.y) * (ptA.y - ptC.y);
        var dBC = (ptC.x - ptB.x) * (ptC.x - ptB.x) + (ptC.y - ptB.y) * (ptC.y - ptB.y);

        // if 2 points are the same return nada;
        if (dAB < 1e-12 || dAC < 1e-12 || dBC < 1e-12) return nada;

        // check by dets if B is in the middle
        var crossr = List.crossratio3(a, c, b, List.cross(List.cross(a, b), List.linfty), List.ii);
        var Bmiddle = crossr.value.real < 0;

        // if B is in the middle we are fine
        if (Bmiddle) {
            Render2D.drawsegcore(ptA, ptC);
        } else { // nasty case -- B not in the middle -- we have 2 ray to infinity
            Render2D.drawRaySegment(a, c);
        }
    }

    return nada;
};


// draw circle with from alp to bet (for circle 0 to 2*pi)
eval_helper.drawcircle = function(args, modifs, df) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    var pt = eval_helper.extractPoint(v0);


    if (!pt.ok || v1.ctype !== 'number' || !CSNumber._helper.isAlmostReal(v1)) {
        return nada;
    }

    var m = csport.drawingstate.matrix;

    var xx = pt.x * m.a - pt.y * m.b + m.tx;
    var yy = pt.x * m.c - pt.y * m.d - m.ty;

    Render2D.handleModifs(modifs, Render2D.conicModifs);
    Render2D.preDrawCurve();

    csctx.lineJoin = "miter";
    csctx.beginPath();
    csctx.arc(xx, yy, Math.abs(v1.value.real) * m.sdet, 0, 2 * Math.PI);
    csctx.closePath();

    if (df === "D") {
        csctx.stroke();
    }
    if (df === "F") {
        csctx.fillStyle = Render2D.lineColor;
        csctx.fill();
    }
    if (df === "C") {
        csctx.clip();
    }

    /* CanvasRenderingContext2D.arc in Chrome is buggy. See #259
     * But drawconic doesn't handle filling, so it's no replacement.
    var xx = pt.x;
    var yy = pt.y;
    var rad = v1.value.real;


    var cMat = List.realMatrix([
        [1, 0, -xx],
        [0, 1, -yy],
        [-xx, -yy, xx * xx + yy * yy - rad * rad]
    ]);

    eval_helper.drawconic(cMat, modifs);
    */

    return nada;
};

evaluator.drawconic$1 = function(args, modifs) {
    var Conic = {};
    Conic.usage = "conic";

    var arr = evaluateAndVal(args[0]);

    if (arr.ctype !== "list" || arr.value.length !== 3 && arr.value.length !== 6) {
        console.error("could not parse conic");
        return nada;
    }

    if (arr.value.length === 6) { // array case

        for (var i = 0; i < 6; i++) // check for faulty arrays
            if (arr.value[i].ctype !== "number") {
                console.error("could not parse conic");
                return nada;
            }

        var half = CSNumber.real(0.5);

        var a = arr.value[0];
        var b = arr.value[2];
        b = CSNumber.mult(b, half);
        var c = arr.value[1];
        var d = arr.value[3];
        d = CSNumber.mult(d, half);
        var e = arr.value[4];
        e = CSNumber.mult(e, half);
        var f = arr.value[5];

        var mat = List.turnIntoCSList([
            List.turnIntoCSList([a, b, d]),
            List.turnIntoCSList([b, c, e]),
            List.turnIntoCSList([d, e, f])
        ]);
        Conic.matrix = mat;
    } else { // matrix case

        for (var ii = 0; ii < 3; ii++) // check for faulty arrays
            for (var jj = 0; jj < 3; jj++)
            if (arr.value[ii].value[jj].ctype !== "number") {
                console.error("could not parse conic");
                return nada;
            }

        if (!List.equals(arr, List.transpose(arr)).value) { // not symm case
            var aa = General.mult(arr, CSNumber.real(0.5));
            var bb = General.mult(List.transpose(arr), CSNumber.real(0.5));
            arr = List.add(aa, bb);
            Conic.matrix = arr;
        } else {
            Conic.matrix = arr;
        }


    }
    Conic.matrix = List.normalizeMax(Conic.matrix);
    return eval_helper.drawconic(Conic.matrix, modifs);
};

// See also eval_helper.quadratic_roots for the complex case
// Returns either null (if solutions would be complex or NaN)
// or two pairs [x, y] satisfying ax^2 + bxy + cy^2 = 0
function solveRealQuadraticHomog(a, b, c) {
    var d = b * b - 4 * a * c;
    /*jshint -W018 */
    if (!(d >= 0)) return null; // also return null if d is NaN
    /*jshint +W018 */
    var r = Math.sqrt(d);
    if (b > 0) r = -r;
    return [
        [r - b, 2 * a],
        [2 * c, r - b]
    ];
}

// Returns either null (if solutions would be complex or NaN)
// or two values x satisfying ax^2 + bx + c = 0
function solveRealQuadratic(a, b, c) {
    var hom = solveRealQuadraticHomog(a, b, c);
    if (hom === null) return null;
    return [hom[0][0] / hom[0][1], hom[1][0] / hom[1][1]];
}

eval_helper.drawconic = function(conicMatrix, modifs) {

    var debug = true;

    Render2D.handleModifs(modifs, Render2D.conicModifs);
    if (Render2D.lsize === 0)
        return;
    Render2D.preDrawCurve();

    if (debug)
        eval_helper.old_drawconic(conicMatrix, modifs); // for comparison

    var mat = List.normalizeMax(conicMatrix);
    var tmat = csport.toMat();
    mat = List.mult(List.transpose(tmat), mat);
    mat = List.mult(mat, tmat);
    mat = List.normalizeMax(mat);

    // cij is the coefficient of the monomial x^i * y^j
    var c20 = mat.value[0].value[0].value.real;
    var c11 = mat.value[0].value[1].value.real * 2;
    var c10 = mat.value[0].value[2].value.real * 2;
    var c02 = mat.value[1].value[1].value.real;
    var c01 = mat.value[1].value[2].value.real * 2;
    var c00 = mat.value[2].value[2].value.real;

    function refine(pt1, pt2) {
        csctx.lineTo(pt2.px, pt2.py);
    }

    // Assuming [x, y] is a point on the conic, return the second
    // point with the same x coordinate.
    // With conic matrix M and points p=(x,y,1), q=(0,1,0) we want
    // r = (q*M*q)*p - 2*(p*M*q)*q  or rather its coordinates,
    // ry = (2*c02)*y - 2*(x*c11 + y*(2*c02) + c01)  and
    // rz = 2*c02  so
    // ry/rz = - x*c11/c02 - y - c01/c02
    function secondPoint(x, y) {
        return -((x * c11 + c01) / c02 + y);
    }

    // Construct a point with given coordinates and tangent directions.
    function mkpt(px, py, tx, ty) {
        return {
            px: px,
            py: py,
            tx: tx,
            ty: ty,
        };
    }

    // Compute tangent directions for a given point on the conic.
    function mkp(x, y) {
        var dx = 2 * c20 * x + c11 * y + c10; // dQ/dx
        var dy = 2 * c02 * y + c11 * x + c01; // dQ/dy
        var f = 1 / Math.hypot(dx, dy); // Do we need unit length here?
        return mkpt(x, y, dy * f, -dx * f);
    }

    // Special points is a list of points on the conic which we want to match
    // in order to correctly connect them. Each entry is a list of points
    // sharing the same x coordinate, formatted by mkpt.
    var specialPoints = [];
    var i, j, x, y, y2, pt, sol;

    if (Math.abs(c02) < 1e-8 || Math.abs(c20) < 1e-8) {
        // TODO: Handle cases where (1,0,0) or (0,1,0) lie on the conic.
        if (!debug)
            eval_helper.old_drawconic(conicMatrix, modifs);
        return;
    } else {

        // Find points with horizontal or vertical tangents

        // Compute the roots of the y discriminant
        // for points with vertical tangents
        sol = solveRealQuadratic(
            c11 * c11 - 4 * c02 * c20,
            2 * c01 * c11 - 4 * c10 * c02,
            c01 * c01 - 4 * c00 * c02);
        if (sol)
            for (i = 0; i < 2; ++i) {
                x = sol[i];
                y = -0.5 * (c11 * x + c01) / c02;
                pt = mkpt(x, y, 0, 1);
                specialPoints.push([pt, pt]); // This is a double point
            }

        // Compute the roots of the x discriminant
        // for points with horizontal tangents
        sol = solveRealQuadratic(
            c11 * c11 - 4 * c02 * c20,
            2 * c10 * c11 - 4 * c01 * c20,
            c10 * c10 - 4 * c00 * c20);
        if (sol)
            for (i = 0; i < 2; ++i) {
                y = sol[i];
                x = -0.5 * (c11 * y + c10) / c20;
                y2 = secondPoint(x, y);
                specialPoints.push([
                    mkpt(x, y, 1, 0),
                    mkp(x, y2)
                ]);
            }

        // Intersect the conic with the boundaries of the canvas

        // left boundary: x = 0
        sol = solveRealQuadratic(c02, c01, c00);
        if (sol) specialPoints.push([mkp(0, sol[0]), mkp(0, sol[1])]);

        // right boundary: x = csw
        sol = solveRealQuadratic(
            c02, c11 * csw + c01, (c20 * csw + c10) * csw + c00);
        if (sol) specialPoints.push([mkp(csw, sol[0]), mkp(csw, sol[1])]);

        // top boundary: y = 0
        sol = solveRealQuadratic(c20, c10, c00);
        if (sol)
            for (i = 0; i < 2; ++i) {
                x = sol[i];
                y2 = secondPoint(x, 0);
                specialPoints.push([mkp(x, 0), mkp(x, y2)]);
            }

        // bottom boundary: y = csh
        sol = solveRealQuadratic(
            c20, c11 * csh + c10, (c02 * csh + c01) * csh + c00);
        if (sol)
            for (i = 0; i < 2; ++i) {
                x = sol[i];
                y2 = secondPoint(x, csh);
                specialPoints.push([mkp(x, csh), mkp(x, y2)]);
            }

        for (i = 0; i < specialPoints.length; ++i) {
            for (j = 0; j < 2; ++j) {
                pt = specialPoints[i][j];
                if (!(isFinite(pt.px) && isFinite(pt.py) &&
                        isFinite(pt.tx) && isFinite(pt.py)))
                    return; // Can't draw if numerics failed us
                if (debug) {
                    csctx.strokeStyle = "rgb(255,0,0)";
                    csctx.lineWidth = 3;
                    csctx.beginPath();
                    csctx.moveTo(pt.px - 10 * pt.tx, pt.py - 10 * pt.ty);
                    csctx.lineTo(pt.px + 10 * pt.tx, pt.py + 10 * pt.ty);
                    csctx.stroke();
                }
            }
        }

        function sortByX(a, b) {
            return a[0].px - b[0].px;
        }

        function sortByY(a, b) {
            return a.py - b.py;
        }
        specialPoints.sort(sortByX);

        // Drop out-of-canvas portions
        while (specialPoints.length && specialPoints[0].px < 0)
            specialPoints.shift();
        while (specialPoints.length &&
            specialPoints[specialPoints.length - 1].px > csw)
            specialPoints.pop();

        if (specialPoints.length === 0) return; // nothing to draw
        specialPoints[0].sort(sortByY);
        var starts = [specialPoints[0][0]];
        for (i = 1; i < specialPoints.length; ++i) {
            specialPoints[i].sort(sortByY);
            var p11 = specialPoints[i - 1][0];
            var p12 = specialPoints[i - 1][1];
            var p21 = specialPoints[i][0];
            var p22 = specialPoints[i][1];
            if (p11 === p12 && p21 === p22) {
                // gap region in hyperbola
                continue;
            }
            p11.next = p21;
            p21.prev = p11;
            p22.next = p12;
            p12.prev = p22;
        }
        pt = specialPoints[specialPoints.length - 1];
        if (pt[0] !== pt[1])
            starts.push(pt[1]);
        var csh2 = csh * 2;
        if (debug) {
            csctx.lineWidth = 1;
            csctx.strokeStyle = "rgb(0,255,0)";
        }
        csctx.beginPath();
        for (i = 0; i < starts.length; ++i) {
            var pt0 = (pt = starts[i]);
            var move = true;
            while (pt.next) {
                var ysum = pt.py + pt.next.py;
                if (ysum < 0 || ysum > csh2) {
                    // segment is not visible.
                    move = true;
                } else {
                    if (move)
                        csctx.moveTo(pt.px, pt.py);
                    refine(pt, pt.next);
                }
                pt = pt.next;
                if (pt === pt0) {
                    // completed the cycle
                    csctx.closePath();
                    break;
                }
            }
        }
        csctx.stroke();
    } // end of general case, neither (1,0,0) nor (0,1,0) on conic
};

eval_helper.old_drawconic = function(conicMatrix, modifs) {

    var eps = 1e-14; //JRG Hab ih von 1e-16 runtergesetzt
    var mat = List.normalizeMax(conicMatrix);
    var origmat = mat;

    // check for complex values
    for (var i = 0; i < 2; i++)
        for (var j = 0; j < 2; j++) {
            if (Math.abs(mat.value[i].value[j].value.imag) > CSNumber.eps) return;
        }

    // transform matrix to canvas coordiantes
    var tMatrix1 = List.turnIntoCSList([ // inverse of homog points (0,0), (1,0), (0, 1)
        List.realVector([-1, -1, 1]),
        List.realVector([1, 0, 0]),
        List.realVector([0, 1, 0])
    ]);

    // get canvas coordiantes
    var pt0 = csport.from(0, 0, 1);
    pt0[2] = 1;
    var pt1 = csport.from(1, 0, 1);
    pt1[2] = 1;
    var pt2 = csport.from(0, 1, 1);
    pt2[2] = 1;

    var tMatrix2 = List.turnIntoCSList([
        List.realVector(pt0),
        List.realVector(pt1),
        List.realVector(pt2)
    ]);
    tMatrix2 = List.transpose(tMatrix2);

    var ttMatrix = General.mult(tMatrix2, tMatrix1); // get transformation matrix

    var ittMatrix = List.inverse(ttMatrix);

    // transform Conic
    mat = General.mult(List.transpose(ittMatrix), mat);
    mat = General.mult(mat, ittMatrix);


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
    var degen = Math.abs(det) < eps;

    // check for circles with very large radius 
    if (degen && conicMatrix.usage === "Circle") {
        var cen = General.mult(List.adjoint3(origmat), List.linfty);
        var zabs = CSNumber.abs(cen.value[2]).value.real;
        // we are not a degenrate circle if our center is finite
        if (zabs > CSNumber.eps) degen = false;
    }

    var cswh_max = csw > csh ? csw : csh;

    var x_zero = -1.5 * cswh_max;
    var x_w = 1.5 * cswh_max; //2 * cswh_max;
    var y_zero = -1.5 * cswh_max;
    var y_h = 1.5 * cswh_max;

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
            var acos = Math.cos(angle);
            var asin = Math.sin(angle);
            return [
                [acos, -asin, 0],
                [asin, acos, 0],
                [0, 0, 1]
            ];
        };


        var rMat = get_rMat(angle);
        rMat = List.realMatrix(rMat);
        var TrMat = List.transpose(rMat);
        var tmp = General.mult(List.realMatrix(myMat), rMat);
        tmp = General.mult(TrMat, tmp);
        a = tmp.value[0].value[0].value.real;
        b = tmp.value[1].value[0].value.real;
        c = tmp.value[1].value[1].value.real;
        d = tmp.value[2].value[0].value.real;
        e = tmp.value[2].value[1].value.real;
        f = tmp.value[2].value[2].value.real;

    }

    var Conic = [a, b, c, d, e, f];

    // split degenerate conic into 1 or 2 lines
    var split_degen = function() {

        //modifs.size= CSNumber.real(2); // TODO fix this
        var erg = geoOps._helper.splitDegenConic(origmat);
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

    var drawRect = function(x, y, col) {
        csctx.strokeStyle = 'red';
        if (col !== 'undefined') csctx.strokeStyle = col;
        csctx.beginPath();
        csctx.rect(x, y, 10, 10);
        csctx.stroke();
    };
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
        csctx.beginPath();
        csctx.moveTo(x[0], y[0]);
        for (var i = 1; i < x.length; i++) {
            //csctx.moveTo(x[i - 1], y[i - 1]);
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
        var perc = 0.1;
        var diff = ymax - ymin;
        var ssmall = perc * diff + ymin;
        var slarge = ymax - perc * diff;
        for (var y = ymin; y <= ymax; y += step) {
            if (y < ssmall || y > slarge || Math.abs(ymax - ymin) < 100) {
                step = 1 / 2;
            } else if (y < 0 || y > csh) {
                step = 10;
            } else {
                step = 3;
            }

            var inner = -a * c * y * y - 2 * a * e * y - a * f + b * b * y * y + 2 * b * d * y + d * d;
            inner = Math.sqrt(inner);


            x1 = 1 / a * (-b * y - d + inner);
            x2 = -1 / a * (b * y + d + inner);


            var ya, yb, y1, y2;
            if (useRot) {
                var r1 = [x1, y, 1];
                var r2 = [x2, y, 1];
                r1 = General.mult(rMat, List.realVector(r1));
                r2 = General.mult(rMat, List.realVector(r2));
                x1 = r1.value[0].value.real;
                x2 = r2.value[0].value.real;
                y1 = r1.value[1].value.real;
                y2 = r2.value[1].value.real;
            } else {
                y1 = y;
                y2 = y;
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

        if (Math.abs(deNom) > eps) {
            y0 = (aebd - largeSqrt) / deNom;
            y1 = (aebd + largeSqrt) / deNom;
        } else {
            y0 = (-a * f + d * d) / (2 * a * e - 2 * b * d);
            y1 = y0;
        }

        if (!isNaN(y0) && y0 > y_zero && y0 < y_h) { // ungly but works
        } else {
            y0 = y_zero;
        }

        if (!isNaN(y1) && y1 > y_zero && y1 < y_h) {} else {
            y1 = y_zero;
        }

        ymin = (y0 < y1 ? y0 : y1);
        ymax = (y0 > y1 ? y0 : y1);


        eval_conic_x(C, y_zero, ymin);
        arr_xg = arr_x1.concat(arr_x2.reverse());
        arr_yg = arr_y1.concat(arr_y2.reverse());
        drawArray(arr_xg, arr_yg);
        resetArrays();


        eval_conic_x(C, ymax, y_h);
        drawArray(arr_x1, arr_y1);
        //drawRect(arr_x1[0], arr_y1[0], "red");
        //console.log(arr_x1, arr_y1);
        //drawRect(arr_x2[0], arr_y2[0], "green");
        // bridge branches
        if (is_inside(arr_x1[0], arr_y1[1]) || is_inside(arr_x2[0], arr_y2[0])) { // drawing bug fix
            csctx.beginPath();
            csctx.moveTo(arr_x1[0], arr_y1[0]);
            csctx.lineTo(arr_x2[0], arr_y2[0]);
            csctx.stroke();
        }
        drawArray(arr_x2, arr_y2);
        resetArrays();


        eval_conic_x(C, ymin, ymax);
        drawArray(arr_x1, arr_y1);
        // bridge branches
        // if (type === "ellipsoid") {
        csctx.beginPath();
        csctx.moveTo(arr_x1[0], arr_y1[0]);
        csctx.lineTo(arr_x2[0], arr_y2[0]);
        csctx.stroke();
        csctx.beginPath();
        csctx.moveTo(arr_x1[arr_x1.length - 1], arr_y1[arr_y1.length - 1]);
        csctx.lineTo(arr_x2[arr_x2.length - 1], arr_y2[arr_y2.length - 1]);
        csctx.stroke();
        //}
        // }
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
    Render2D.preDrawCurve();
    csctx.mozFillRule = 'evenodd';

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
        if (Render2D.fillColor) {
            csctx.fillStyle = Render2D.fillColor;
            csctx.fill();
        }
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

function defaultTextRendererCanvas(ctx, text, x, y, align, size, lineHeight) {
    if (text.indexOf("\n") !== -1) {
        var left = Infinity;
        var right = -Infinity;
        var top = Infinity;
        var bottom = -Infinity;
        text.split("\n").forEach(function(row) {
            var box = defaultTextRendererCanvas(ctx, row, x, y, align, size);
            if (left > box.left) left = box.left;
            if (right < box.right) right = box.right;
            if (top > box.top) top = box.top;
            if (bottom < box.bottom) bottom = box.bottom;
            y += lineHeight;
        });
        return {
            left: left,
            right: right,
            top: top,
            bottom: bottom
        };
    }
    var m = ctx.measureText(text);
    ctx.fillText(text, x - m.width * align, y);
    // We can't rely on advanced text metrics due to lack of browser support,
    // so we have to guess sizes, the vertical ones in particular.
    return {
        left: x - m.width * align,
        right: x + m.width * (1 - align),
        top: y - 0.7 * 1.2 * size,
        bottom: y + 0.3 * 1.2 * size
    };
}

// This is a hook: the following function may get replaced by a plugin.
var textRendererCanvas = defaultTextRendererCanvas;

// This is a hook: the following function may get replaced by a plugin.
var textRendererHtml = function(element, text, font) {
    if (text.indexOf("\n") !== -1) {
        // TODO: find a way to align the element by its FIRST row
        // as Cinderella does it, instead of by the last row as we do now.
        var rows = text.split("\n");
        element.textContent = rows[0];
        for (var i = 1; i < rows.length; ++i) {
            element.appendChild(document.createElement("br"));
            element.appendChild(document.createTextNode(rows[i]));
        }
        return;
    }
    element.textContent = text;
};

eval_helper.drawtext = function(args, modifs, callback) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluate(args[1]);
    var pt = eval_helper.extractPoint(v0);

    if (!pt.ok) {
        return null;
    }

    var col = csport.drawingstate.textcolor;
    Render2D.handleModifs(modifs, Render2D.textModifs);
    var size = csport.drawingstate.textsize;
    if (size === null) size = defaultAppearance.textsize;
    if (Render2D.size !== null) size = Render2D.size;
    csctx.fillStyle = Render2D.textColor;

    var m = csport.drawingstate.matrix;
    var xx = pt.x * m.a - pt.y * m.b + m.tx + Render2D.xOffset;
    var yy = pt.x * m.c - pt.y * m.d - m.ty - Render2D.yOffset;

    var txt = niceprint(v1);
    var font = (
        Render2D.bold + Render2D.italics +
        Math.round(size * 10) / 10 + "px " +
        Render2D.family);
    csctx.font = font;
    if (callback) {
        return callback(txt, font, xx, yy, Render2D.align, size);
    } else {
        return textRendererCanvas(
            csctx, txt, xx, yy, Render2D.align,
            size, size * defaultAppearance.lineHeight);
    }
};

evaluator.drawtext$2 = function(args, modifs) {
    eval_helper.drawtext(args, modifs, null);
    return nada;
};

evaluator.drawtable$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var pt = eval_helper.extractPoint(v0);
    if (!pt.ok) return nada;
    if (v1.ctype !== "list") return nada;
    var data = v1.value;
    var nr = data.length;
    var nc = -1;
    var r, c;
    for (r = 0; r < nr; ++r)
        if (data[r].ctype === "list" && data[r].value.length > nc)
            nc = data[r].value.length;
    if (nc === -1) { // depth 1, no nested lists
        data = data.map(function(row) {
            return [row];
        });
        nc = 1;
    } else {
        data = data.map(function(row) {
            return List.asList(row).value;
        });
    }

    // Modifier handling
    var sx = 100;
    var sy = null;
    var border = true;
    var color = csport.drawingstate.textcolor;
    Render2D.handleModifs(modifs, {
        "size": true,
        "color": function(v) {
            if (List._helper.isNumberVecN(v, 3))
                color = Render2D.makeColor([
                    v.value[0].value.real,
                    v.value[1].value.real,
                    v.value[2].value.real
                ]);
        },
        "alpha": true,
        "bold": true,
        "italics": true,
        "family": true,
        "align": true,
        "x_offset": true,
        "y_offset": true,
        "offset": true,
        "width": function(v) {
            if (v.ctype === "number")
                sx = v.value.real;
        },
        "height": function(v) {
            if (v.ctype === "number")
                sy = v.value.real;
        },
        "border": function(v) {
            if (v.ctype === "boolean")
                border = v.value;
        },
    });
    var size = csport.drawingstate.textsize;
    if (size === null) size = defaultAppearance.textsize;
    if (Render2D.size !== null) size = Render2D.size;
    if (sy === null) sy = 1.6 * size;

    var font = (
        Render2D.bold + Render2D.italics +
        Math.round(size * 10) / 10 + "px " +
        Render2D.family);
    csctx.font = font;
    var m = csport.drawingstate.matrix;
    var ww = nc * sx;
    var hh = nr * sy;
    var xx = pt.x * m.a - pt.y * m.b + m.tx + Render2D.xOffset;
    var yy = pt.x * m.c - pt.y * m.d - m.ty - Render2D.yOffset - hh;
    if (border) {
        Render2D.preDrawCurve();
        csctx.strokeStyle = Render2D.lineColor;
        csctx.beginPath();
        for (r = 1; r < nr; ++r) {
            csctx.moveTo(xx, yy + r * sy);
            csctx.lineTo(xx + ww, yy + r * sy);
        }
        for (c = 1; c < nc; ++c) {
            csctx.moveTo(xx + c * sx, yy);
            csctx.lineTo(xx + c * sx, yy + hh);
        }
        csctx.stroke();
        csctx.lineWidth = Render2D.lsize + 1;
        csctx.beginPath();
        csctx.rect(xx, yy, ww, hh);
        csctx.stroke();
    }
    xx += Render2D.align * sx + (1 - 2 * Render2D.align) * sy * 0.3;
    yy += sy * 0.7;
    csctx.fillStyle = color;
    for (r = 0; r < nr; ++r) {
        for (c = 0; c < nc; ++c) {
            var txt = niceprint(data[r][c]);
            textRendererCanvas(csctx, txt, xx + c * sx, yy + r * sy, Render2D.align);
        }
    }
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
    var step = 0.1;
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
        "lineCap": true,
        "lineJoin": true,
        "miterLimit": true,

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
    csctx.lineCap = Render2D.lineCap;
    csctx.lineJoin = Render2D.lineJoin;
    csctx.miterLimit = Render2D.miterLimit;

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
                ||
                a.oper === "select" || a.oper === "forall" || a.oper === "sum" || a.oper === "product" || a.oper === "repeat" || a.oper === "min" || a.oper === "max" || a.oper === "sort"
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
    scheduleUpdate();
    return nada;
};


evaluator.screenbounds$0 = function(args, modifs) {
    var pt1 = General.withUsage(List.realVector(csport.to(0, 0)), "Point");
    var pt2 = General.withUsage(List.realVector(csport.to(csw, 0)), "Point");
    var pt3 = General.withUsage(List.realVector(csport.to(csw, csh)), "Point");
    var pt4 = General.withUsage(List.realVector(csport.to(0, csh)), "Point");
    return (List.turnIntoCSList([pt1, pt2, pt3, pt4]));
};


evaluator.createimage$3 = function(args, modifs) {

    var v0 = evaluate(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var v2 = evaluateAndVal(args[2]);


    if (v1.ctype !== 'number' || v2.ctype !== 'number' || v0.ctype !== 'string') {
        return nada;
    }


    var canvas = document.createElement("canvas");
    canvas.id = v0.value;
    canvas.width = v1.value.real;
    canvas.height = v2.value.real;

    // canvas.style.border="1px solid #FF0000";
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    images[v0.value] = loadImage(canvas);

    return nada;
};


evaluator.clearimage$1 = function(args, modifs) {

    var name = evaluate(args[0]);

    if (!(name.ctype === 'string' || name.ctype === 'image')) {
        return nada;
    }

    var image = imageFromValue(name);
    var localcanvas = image.img;

    if (typeof(localcanvas) === "undefined" || localcanvas === null) {
        return nada;
    }
    var cw = image.width;
    var ch = image.height;
    var localcontext = localcanvas.getContext('2d');
    localcontext.clearRect(0, 0, cw, ch);
    image.generation++;

    return nada;
};


evaluator.canvas$4 = function(args, modifs) {
    var a = evaluateAndVal(args[0]);
    var b = evaluateAndVal(args[1]);
    var name = evaluate(args[2]);
    var prog = args[3];

    var pta = eval_helper.extractPoint(a);
    var ptb = eval_helper.extractPoint(b);
    if (!pta.ok || !ptb.ok || !(name.ctype === 'string' || name.ctype === 'image')) {
        return nada;
    }

    var image = imageFromValue(name);
    if (!image || !image.img.getContext) {
        return nada;
    }
    var localcanvas = image.img;

    var cw = image.width;
    var ch = image.height;

    var diffx = ptb.x - pta.x;
    var diffy = ptb.y - pta.y;

    var ptcx = pta.x - diffy * ch / cw;
    var ptcy = pta.y + diffx * ch / cw;
    var ptdx = ptb.x - diffy * ch / cw;
    var ptdy = ptb.y + diffx * ch / cw;

    var cva = csport.from(pta.x, pta.y, 1);
    var cvc = csport.from(ptcx, ptcy, 1);
    var cvd = csport.from(ptdx, ptdy, 1);

    var x11 = cva[0];
    var x12 = cva[1];
    var x21 = cvc[0];
    var x22 = cvc[1];
    var x31 = cvd[0];
    var x32 = cvd[1];
    var y11 = 0;
    var y12 = ch;
    var y21 = 0;
    var y22 = 0;
    var y31 = cw;
    var y32 = 0;

    var a1 = (cw * (x12 - x22)) / ((x11 - x21) * (x12 - x32) - (x11 - x31) * (x12 - x22));
    var a2 = (cw * (x11 - x21)) / ((x12 - x22) * (x11 - x31) - (x12 - x32) * (x11 - x21));
    var a3 = -a1 * x11 - a2 * x12;
    var a4 = (ch * (x12 - x32) - ch * (x12 - x22)) / ((x11 - x21) * (x12 - x32) - (x11 - x31) * (x12 - x22));
    var a5 = (ch * (x11 - x31) - ch * (x11 - x21)) / ((x12 - x22) * (x11 - x31) - (x12 - x32) * (x11 - x21));
    var a6 = ch - a4 * x11 - a5 * x12;

    var localcontext = localcanvas.getContext('2d');

    var backupctx = csctx;
    csctx = localcontext;
    csctx.save();

    csctx.transform(a1, a4, a2, a5, a3, a6);

    image.generation++;

    evaluate(prog);
    csctx.restore();
    csctx = backupctx;
};


evaluator.canvas$5 = function(args, modifs) {
    var a = evaluateAndVal(args[0]);
    var b = evaluateAndVal(args[1]);
    var c = evaluateAndVal(args[2]);
    var name = evaluate(args[3]);
    var prog = args[4];

    var pta = eval_helper.extractPoint(a);
    var ptb = eval_helper.extractPoint(b);
    var ptc = eval_helper.extractPoint(c);
    if (!pta.ok || !ptb.ok || !ptc.ok || !(name.ctype === 'string' || name.ctype === 'image')) {
        return nada;
    }

    var image = imageFromValue(name);
    if (!image || !image.img.getContext) {
        return nada;
    }
    var localcanvas = image.img;

    var cw = image.width;
    var ch = image.height;

    var cva = csport.from(pta.x, pta.y, 1);
    var cvb = csport.from(ptb.x, ptb.y, 1);
    var cvc = csport.from(ptc.x, ptc.y, 1);

    var x11 = cva[0];
    var x12 = cva[1];
    var x21 = cvb[0];
    var x22 = cvb[1];
    var x31 = cvc[0];
    var x32 = cvc[1];
    var y11 = 0;
    var y12 = ch;
    var y21 = cw;
    var y22 = ch;
    var y31 = 0;
    var y32 = 0;

    var a1 = ((y11 - y21) * (x12 - x32) - (y11 - y31) * (x12 - x22)) /
        ((x11 - x21) * (x12 - x32) - (x11 - x31) * (x12 - x22));
    var a2 = ((y11 - y21) * (x11 - x31) - (y11 - y31) * (x11 - x21)) /
        ((x12 - x22) * (x11 - x31) - (x12 - x32) * (x11 - x21));
    var a3 = y11 - a1 * x11 - a2 * x12;
    var a4 = ((y12 - y22) * (x12 - x32) - (y12 - y32) * (x12 - x22)) /
        ((x11 - x21) * (x12 - x32) - (x11 - x31) * (x12 - x22));
    var a5 = ((y12 - y22) * (x11 - x31) - (y12 - y32) * (x11 - x21)) /
        ((x12 - x22) * (x11 - x31) - (x12 - x32) * (x11 - x21));
    var a6 = y12 - a4 * x11 - a5 * x12;

    var localcontext = localcanvas.getContext('2d');

    var backupctx = csctx;
    csctx = localcontext;
    csctx.save();

    csctx.transform(a1, a4, a2, a5, a3, a6);

    image.generation++;

    evaluate(prog);
    csctx.restore();
    csctx = backupctx;
};

evaluator.screenresolution$0 = function(args, modifs) {
    var m = csport.drawingstate.matrix;
    return CSNumber.real(m.a);
};

evaluator.layer$1 = function(args, modifs) {
    // No-op to avoid error messages when exporting from Cinderella
    // See https://gitlab.cinderella.de:8082/cindyjs/cindyjs/issues/17
};
