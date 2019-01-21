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
    Render2D.handleModifs(modifs, df === "D" ? Render2D.lineModifs : Render2D.conicModifs);
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

    Render2D.handleModifs(modifs, df === "D" ? Render2D.lineModifs : Render2D.conicModifs);
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

        arr = List.turnIntoCSList([
            List.turnIntoCSList([a, b, d]),
            List.turnIntoCSList([b, c, e]),
            List.turnIntoCSList([d, e, f])
        ]);
    } else { // matrix case

        if (!(List.isNumberMatrix(arr).value &&
                arr.value.length === 3 &&
                arr.value[0].value.length === 3))
            return nada;

        var tarr = List.transpose(arr);
        if (!List.equals(arr, tarr).value) { // not symm case
            arr = List.add(tarr, arr);
        }

    }
    return eval_helper.drawconic(arr, modifs);
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
    var s1 = hom[0][0] / hom[0][1];
    var s2 = hom[1][0] / hom[1][1];
    return s2 < s1 ? [s2, s1] : [s1, s2];
}

function DbgCtx() {
    this.delegate = csctx;
    this.special = [];
    this.lines = [];
}
DbgCtx.prototype = {
    beginPath: function() {
        console.log("beginPath()");
        this.pts = [];
        this.ctls = [];
        this.delegate.beginPath();
    },
    moveTo: function(x, y) {
        console.log("moveTo(" + x + ", " + y + ")");
        this.pts.push([x, y]);
        this.delegate.moveTo(x, y);
    },
    lineTo: function(x, y) {
        console.log("lineTo(" + x + ", " + y + ")");
        this.pts.push([x, y]);
        this.delegate.lineTo(x, y);
    },
    quadraticCurveTo: function(x1, y1, x, y) {
        console.log("quadratocCurveTo(" + x1 + ", " + y1 + ", " + x + ", " + y + ")");
        this.ctls.push([x1, y1]);
        this.pts.push([x, y]);
        this.delegate.quadraticCurveTo(x1, y1, x, y);
    },
    closePath: function() {
        console.log("closePath()");
        this.delegate.closePath();
    },
    fillCircle: function(p) {
        this.delegate.beginPath();
        this.delegate.arc(p[0], p[1], 3, 0, 2 * Math.PI);
        this.delegate.fill();
    },
    stroke: function() {
        console.log("stroke()");
        this.delegate.stroke();
        var oldFill = this.delegate.fillStyle;
        this.delegate.fillStyle = "rgb(255,0,255)";
        this.pts.forEach(this.fillCircle, this);
        this.delegate.fillStyle = "rgb(0,255,255)";
        this.ctls.forEach(this.fillCircle, this);
        this.delegate.fillStyle = "rgb(64,0,255)";
        this.special.forEach(this.fillCircle, this);
        this.delegate.strokeStyle = "rgb(0,255,0)";
        this.lines.forEach(function(line) {
            this.delegate.beginPath();
            this.delegate.moveTo(line[0], line[1]);
            this.delegate.lineTo(line[2], line[3]);
            this.delegate.stroke();
        }, this);
        if (oldFill)
            this.delegate.fillStyle = oldFill;
    },
};

eval_helper.drawconic = function(conicMatrix, modifs) {
    //var csctx = new DbgCtx();
    Render2D.handleModifs(modifs, Render2D.conicModifs);
    if (Render2D.lsize === 0)
        return;
    Render2D.preDrawCurve();

    var maxError = 0.04; // squared distance in px^2
    var eps = 1e-14;
    var sol, x, y, i;

    // Transform matrix of conic to match canvas coordinate system
    var mat = List.normalizeMax(conicMatrix);
    if (!List._helper.isAlmostReal(mat))
        return;
    var tmat = csport.toMat();
    mat = List.mult(List.transpose(tmat), mat);
    mat = List.mult(mat, tmat);
    mat = List.normalizeMax(mat);

    // Using polynomial coefficients instead of matrix
    // since it generalizes to higher degrees more easily.
    // cij is the coefficient of the monomial x^i * y^j.
    var c20 = mat.value[0].value[0].value.real;
    var c11 = mat.value[0].value[1].value.real * 2;
    var c10 = mat.value[0].value[2].value.real * 2;
    var c02 = mat.value[1].value[1].value.real;
    var c01 = mat.value[1].value[2].value.real * 2;
    var c00 = mat.value[2].value[2].value.real;

    // The adjoint matrix k## values
    var k20 = 4 * c00 * c02 - c01 * c01;
    var k11 = c01 * c10 - 2 * c00 * c11;
    var k10 = c01 * c11 - 2 * c02 * c10;
    var k02 = 4 * c00 * c20 - c10 * c10;
    var k01 = c10 * c11 - 2 * c01 * c20;
    var k00 = 4 * c02 * c20 - c11 * c11;

    var discr = k00;
    var det = c02 * k02 + c11 * k11 + c20 * k20 - c00 * k00;

    // conic center
    var ccx = k10 / k00;
    var ccy = k01 / k00;

    if (det < 0) {
        c20 = -c20;
        c11 = -c11;
        c10 = -c10;
        c02 = -c02;
        c01 = -c01;
        c00 = -c00;
        det = -det;
    }

    // Check which side of the conic a given point is on.
    // Sign 1 means inside, i.e. polar has complex points of intersection.
    // Sign -1 means outside, i.e. polar has real points of intersection.
    // Sign 0 would be on conic, but numeric noise will drown those out.
    // Note that this distinction is arbitrary for degenerate conics.
    function sign(x, y) {
        var s = (c20 * x + c11 * y + c10) * x + (c02 * y + c01) * y + c00;
        if (s >= 0) return 1;
        if (s < 0) return -1;
        return NaN;
    }

    function mkp(x, y) {
        return {
            x: x,
            y: y,
        };
    }

    var margin = Render2D.lsize;
    var minx = -margin;
    var miny = -margin;
    var maxx = csw + margin;
    var maxy = csh + margin;
    var boundary = [];
    var dummy = {};
    var prev = dummy;

    function link(pt) {
        prev.next = pt;
        pt.prev = prev;
        prev = pt;
        return pt;
    }

    function verticalBoundary(x, y1, y2, index) {
        return {
            a: x,
            b1: y1,
            b2: y2,
            vertical: true,
            index: index,
            sign: function(y) {
                return sign(x, y);
            },
            mkp: function(y) {
                return mkp(x, y);
            },
            sol: solveRealQuadratic(
                c02, c11 * x + c01, (c20 * x + c10) * x + c00),
            discr: function() {
                // Compute the roots of the y discriminant
                // for points with vertical tangents
                return solveRealQuadratic(k00, -2 * k10, k20);
            },
            tpt: function(x) {
                // y coordinate of point with vertical tangent
                return mkp(x, -0.5 * (c11 * x + c01) / c02);
            },
        };
    }

    function horizontalBoundary(y, x1, x2, index) {
        return {
            a: y,
            b1: x1,
            b2: x2,
            vertical: false,
            index: index,
            sign: function(x) {
                return sign(x, y);
            },
            mkp: function(x) {
                return mkp(x, y);
            },
            sol: solveRealQuadratic(
                c20, c11 * y + c10, (c02 * y + c01) * y + c00),
            discr: function() {
                // Compute the roots of the x discriminant
                // for points with horizontal tangents
                return solveRealQuadratic(k00, -2 * k01, k02);
            },
            tpt: function(y) {
                // x coordinate of point with horizontal tangent
                return mkp(-0.5 * (c11 * y + c10) / c20, y);
            },
        };
    }

    function doBoundary(bd) {
        var bMin = Math.min(bd.b1, bd.b2);
        var bMax = Math.max(bd.b1, bd.b2);
        var sign1 = bd.sign(bMin);
        var sign2 = bd.sign(bMax);
        if (!isFinite(sign1 * sign2))
            return false;
        var sol = bd.sol;
        var b, signMid;
        if (sign1 !== sign2) { // we need exactly one point of intersection
            if (sol === null)
                return false; // don't have one, give up and don't draw
            b = 0.5 * (sol[0] + sol[1]);
            if (b > bMin && b < bMax) {
                // solutions might be close to opposite corners,
                // so we use the sign to pick the appropriate one
                signMid = bd.sign(b);
                // We have two possible arrangements or corners and crossings:
                //          sign1 == signMid != sign2
                //    sol[0]               sol[1]
                // sign1 != signMid == sign2
                b = sol[signMid === sign2 ? 0 : 1];
            } else {
                // solutions will be off to one side, so we pick the
                // one which is closer to the center of this egde
                var center = (bMin + bMax) * 0.5;
                var dist0 = Math.abs(center - sol[0]);
                var dist1 = Math.abs(center - sol[1]);
                b = sol[dist0 < dist1 ? 0 : 1];
            }
            boundary.push(link(bd.mkp(b)));
        } else { // we need zero or two points of intersection
            if (sol === null) { // have zero intersections
                if (discr <= 0) // not an ellipse
                    return true;
                sol = bd.discr();
                if (sol === null)
                    return true; // an ellipse without tangent?
                var pt = bd.tpt(sol[bd.index]);
                if (pt.x >= minx && pt.x <= maxx &&
                    pt.y >= miny && pt.y <= maxy)
                    link(pt); // link but don't add to boundary
                return true;
            }
            // have two points of intersection with line
            b = 0.5 * (sol[0] + sol[1]);
            if (!(b > bMin && b < bMax))
                return true; // both intersections off to one end
            signMid = bd.sign(b);
            if (signMid === sign1)
                return true; // one intersection outside each end
            if (isNaN(signMid))
                return true;
            // have two points of intersection with segment
            if (bd.b1 > bd.b2)
                sol = [sol[1], sol[0]];
            boundary.push(link(bd.mkp(sol[0])));
            boundary.push(link(bd.mkp(sol[1])));
        }
        return true;
    }

    if (!(doBoundary(verticalBoundary(minx, miny, maxy, 0)) &&
            doBoundary(horizontalBoundary(maxy, minx, maxx, 1)) &&
            doBoundary(verticalBoundary(maxx, maxy, miny, 1)) &&
            doBoundary(horizontalBoundary(miny, maxx, minx, 0))))
        return;

    if (prev === dummy)
        return; // no boundary or tangent points at all, nothing to draw
    // close the cycle
    prev.next = dummy.next;
    dummy.next.prev = prev;

    csctx.beginPath();
    var pt1, pt2, pt3;
    if (boundary.length === 0) {
        pt1 = prev;
        csctx.moveTo(pt1.x, pt1.y);
        do {
            pt2 = pt1.next;
            drawArc(pt1, pt2);
            pt1 = pt2;
        } while (pt1 !== prev);
        csctx.closePath();
    }
    var startIndex = (sign(minx, miny) === 1 ? 0 : 1);
    if (boundary.length === 4) {
        // We have 4 points of intersection.  For a hyperbola, these
        // may belong to different branches.  If the line joining them
        // intersects the line at infinity on the inside, they belong
        // to different branches and the boundary between the points
        // we want to connect is on the inside es well.  If the line
        // intersects infinity on the outside, they belong to the same
        // branch and we want to connect points which have some
        // outside boundary between them.  We do the computation twice
        // and take the stronger signal, i.e. larger absolute value.
        var best = 0;
        for (i = 0; i < 2; ++i) {
            pt1 = boundary[i];
            pt2 = boundary[i + 2];
            var dx = pt2.x - pt1.x;
            var dy = pt2.y - pt1.y;
            // compute sign at infinity
            var s = (c20 * dx + c11 * dy) * dx + c02 * dy * dy;
            if (Math.abs(s) > Math.abs(best))
                best = s;
        }
        if (isNaN(best))
            return;
        if (best >= 0)
            startIndex = 1 - startIndex;
    }

    for (i = startIndex; i < boundary.length; i += 2) {
        pt1 = boundary[i];
        pt3 = boundary[(i + 1) % boundary.length];
        csctx.moveTo(pt1.x, pt1.y);
        for (pt2 = pt1.next; pt1 !== pt3; pt2 = (pt1 = pt2).next) {
            drawArc(pt1, pt2);
        }
    }
    csctx.stroke();

    function drawArc(pt1, pt2) {
        refine(pt1.x, pt1.y, pt2.x, pt2.y, 0);
    }

    // Find the control points of a quadratic Bézier which at the
    // endpoints agrees with the conic in position and tangent direction.
    function refine(x1, y1, x2, y2, depth) {
        // u is the line joining pt1 and pt2
        var ux = y1 - y2;
        var uy = x2 - x1;
        var uz = x1 * y2 - y1 * x2;
        // c is the proposed control point, computed as pole of u
        var cz = k10 * ux + k01 * uy + k00 * uz;
        if (Math.abs(cz) < eps)
            return csctx.lineTo(x2, y2);
        var cx = (k20 * ux + k11 * uy + k10 * uz) / cz;
        var cy = (k11 * ux + k02 * uy + k01 * uz) / cz;
        if (!(isFinite(cx) && isFinite(cy))) // probably already linear
            return csctx.lineTo(x2, y2);
        var area = Math.abs(
            x1 * cy + cx * y2 + x2 * y1 -
            x2 * cy - cx * y1 - x1 * y2);
        if (area < maxError) // looks linear, too
            return csctx.lineTo(x2, y2);
        do { // so break defaults to single curve and return skips that
            if (depth > 10)
                break;
            // Compute pt3 as the intersection of the segment h-c and the conic
            var hx = 0.5 * (x1 + x2);
            var hy = 0.5 * (y1 + y2);
            var dx = cx - hx;
            var dy = cy - hy;
            if (dx * dx + dy * dy < maxError)
                break;
            // using d=(dx,dy,0) and h=(hx,hy,1) compute bilinear forms
            var dMd = c20 * dx * dx + c11 * dx * dy + c02 * dy * dy;
            var dMh = 2 * c20 * dx * hx + c11 * (dx * hy + dy * hx) +
                2 * c02 * dy * hy + c10 * dx + c01 * dy;
            var hMh = (c20 * hx + c11 * hy + c10) * hx +
                (c02 * hy + c01) * hy + c00;
            var sol = solveRealQuadratic(dMd, dMh, hMh);
            if (!sol) {
                // discriminant is probably slightly negative due to error.
                // The following values SHOULD be pretty much identical now.
                sol = [-0.5 * dMh / dMd, -2 * hMh / dMh];
            }
            // Now we have to points, h + sol[i] * d, and have to pick one.
            if (sol[0] > 0) {
                // both roots positive, so we pick the one which is closer
                sol = sol[0];
            } else if (sol[1] >= 0) {
                // one root negative one positive, so we pick the one
                // in the positive direction
                sol = sol[1];
            } else {
                // signs messed up somehow, so try to recover gracefully
                break;
            }
            var x3 = hx + sol * dx;
            var y3 = hy + sol * dy;
            // The point m = (c+h)/2 lies on the Bézier curve
            var mx = 0.5 * (cx + hx);
            var my = 0.5 * (cy + hy);
            var ex = x3 - mx;
            var ey = y3 - my;
            if (ex * ex + ey * ey < maxError)
                break;
            refine(x1, y1, x3, y3, depth + 1);
            refine(x3, y3, x2, y2, depth + 1);
            return;
        } while (false);
        csctx.quadraticCurveTo(cx, cy, x2, y2);
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
    Render2D.handleModifs(modifs, (df === "D" & !cycle) ? Render2D.lineModifs : Render2D.conicModifs);
    Render2D.preDrawCurve();


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
            csctx.fill(Render2D.fillrule);
        }
        csctx.stroke();
    }
    if (df === "F") {
        csctx.fillStyle = Render2D.lineColor;
        csctx.fill(Render2D.fillrule);
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

    if (!(CindyJS._pluginRegistry.katex) && typeof(txt) === "string") {
        // split string by "$", if we have latex $...$ then the length is >=3
        if (txt.split("$").length >= 3) {
            loadExtraPlugin("katex", "katex-plugin.js", true /*skipInit*/ );
        }
    }

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
    images[v0.value] = loadImage(canvas, false);

    return nada;
};


evaluator.clearimage$1 = function(args, modifs) {

    var name = evaluate(args[0]);

    if (!(name.ctype === 'string' || name.ctype === 'image')) {
        return nada;
    }

    var image = imageFromValue(name);
    if (!image)
        return nada;

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
