var geoOps = {};
geoOps._helper = {};

/* Kinds of geometric elements:
 * P  - Point
 * L  - Line
 * S  - Segment
 * C  - Conic (including circle)
 * *s - Set of *
 * Tr - Projective transformation
 * Mt - Moebius transformation (or anti-Moebius)
 * V  - (numeric) value
 * Text - Text
 * "**" - arbitrary number of arguments with arbitrary types
 * Poly - Polygons
 */


////The RandomLine RandomPoint operators are used by Cinderellas
////Original Mirror Operations

geoOps.RandomLine = {};
geoOps.RandomLine.kind = "L";
geoOps.RandomLine.signature = [];
geoOps.RandomLine.updatePosition = function(el) {
    el.homog = List.realVector([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.FreeLine = {};
geoOps.FreeLine.kind = "L";
geoOps.FreeLine.signature = [];
geoOps.FreeLine.isMovable = true;
geoOps.FreeLine.initialize = function(el) {
    var pos = geoOps._helper.initializeLine(el);
    putStateComplexVector(pos);
};
geoOps.FreeLine.getParamForInput = function(el, pos, type) {
    var homog;
    if (type === "mouse") {
        homog = List.cross(pos, List.ez);
        homog = List.cross(homog, pos);
    } else if (type === "homog") {
        homog = pos;
    } else {
        homog = List.turnIntoCSList([CSNumber.zero, CSNumber.zero, CSNumber.zero]);
    }
    return List.normalizeMax(homog);
};
geoOps.FreeLine.getParamFromState = function(el) {
    return getStateComplexVector(3);
};
geoOps.FreeLine.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.FreeLine.updatePosition = function(el) {
    var param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Line");
};
geoOps.FreeLine.stateSize = 6;


geoOps.RandomPoint = {};
geoOps.RandomPoint.kind = "P";
geoOps.RandomPoint.signature = [];
geoOps.RandomPoint.updatePosition = function(el) {
    el.homog = List.realVector([100 * Math.random(), 100 * Math.random(), 100 * Math.random()]);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

///////////////////////////


geoOps.Join = {};
geoOps.Join.kind = "L";
geoOps.Join.signature = ["P", "P"];
geoOps.Join.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Segment = {};
geoOps.Segment.kind = "S";
geoOps.Segment.signature = ["P", "P"];
geoOps.Segment.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    geoOps.Segment.setSegmentPos(el,
        List.cross(el1.homog, el2.homog),
        List.scalmult(el2.homog.value[2], el1.homog),
        List.scalmult(el1.homog.value[2], el2.homog)
    );
};
geoOps.Segment.setSegmentPos = function(el, line, start, end) {
    line = List.normalizeMax(line);
    el.homog = General.withUsage(line, "Line");
    var startend = List.turnIntoCSList([start, end]);
    startend = List.normalizeMax(startend); // Normalize together!
    el.startpos = startend.value[0];
    el.endpos = startend.value[1];
    // So  midpoint = startpos + endpos
    // and farpoint = startpos - endpos
};


geoOps.Meet = {};
geoOps.Meet.kind = "P";
geoOps.Meet.signature = ["L", "L"];
geoOps.Meet.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps.Meet.visiblecheck = function(el) {
    var visible = true;
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];

    if (el1.kind === "S") {
        visible = onSegment(el, el1);
    }
    if (visible && el2.kind === "S") {
        visible = onSegment(el, el2);
    }
    el.isshowing = visible;
};

geoOps._helper.midpoint = function(a, b) {
    return List.normalizeMax(List.add(
        List.scalmult(b.value[2], a),
        List.scalmult(a.value[2], b)));
};

geoOps.Mid = {};
geoOps.Mid.kind = "P";
geoOps.Mid.signature = ["P", "P"];
geoOps.Mid.updatePosition = function(el) {
    var x = csgeo.csnames[(el.args[0])].homog;
    var y = csgeo.csnames[(el.args[1])].homog;
    var res = geoOps._helper.midpoint(x, y);
    el.homog = General.withUsage(res, "Point");
};


geoOps.Perp = {};
geoOps.Perp.kind = "L";
geoOps.Perp.signature = ["L", "P"];
geoOps.Perp.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    var tt = List.turnIntoCSList([l.value[0], l.value[1], CSNumber.zero]);
    el.homog = List.cross(tt, p);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Para = {};
geoOps.Para.kind = "L";
geoOps.Para.signature = ["L", "P"];
geoOps.Para.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    var inf = List.linfty;
    el.homog = List.cross(List.cross(inf, l), p);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

// Horizontal line through a point
geoOps.Horizontal = {};
geoOps.Horizontal.kind = "L";
geoOps.Horizontal.signature = ["P"];
geoOps.Horizontal.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ex, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


// Cinderella's freely movable HorizontalLine (Cinderella semantics)
geoOps.HorizontalLine = {};
geoOps.HorizontalLine.kind = "L";
geoOps.HorizontalLine.signature = [];
geoOps.HorizontalLine.isMovable = true;
geoOps.HorizontalLine.initialize = function(el) {
    var pos = geoOps._helper.initializeLine(el);
    pos = List.turnIntoCSList([CSNumber.zero, pos.value[1], pos.value[2]]);
    pos = List.normalizeMax(pos);
    putStateComplexVector(pos);
};
geoOps.HorizontalLine.getParamForInput = function(el, pos, type) {
    if (type === "mouse") {
        pos = List.cross(pos, List.ex);
    } else if (type === "homog") {
        if (pos.value[0].real !== 0 || pos.value[0].imag !== 0)
            pos = List.turnIntoCSList([
                CSNumber.zero, pos.value[1], pos.value[2]
            ]);
    } else {
        pos = List.turnIntoCSList([CSNumber.zero, CSNumber.zero, CSNumber.zero]);
    }
    return List.normalizeMax(pos);
};
geoOps.HorizontalLine.getParamFromState = function(el) {
    return getStateComplexVector(3);
};
geoOps.HorizontalLine.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.HorizontalLine.updatePosition = function(el) {
    var param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Line");
};
geoOps.HorizontalLine.stateSize = 6;


// Vertical line through a point
geoOps.Vertical = {};
geoOps.Vertical.kind = "L";
geoOps.Vertical.signature = ["P"];
geoOps.Vertical.updatePosition = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ey, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


// Cinderella's freely movable VerticalLine (Cinderella semantics)
geoOps.VerticalLine = {};
geoOps.VerticalLine.kind = "L";
geoOps.VerticalLine.signature = [];
geoOps.VerticalLine.isMovable = true;
geoOps.VerticalLine.initialize = function(el) {
    var pos = geoOps._helper.initializeLine(el);
    pos = List.turnIntoCSList([pos.value[0], CSNumber.zero, pos.value[2]]);
    pos = List.normalizeMax(pos);
    putStateComplexVector(pos);
};
geoOps.VerticalLine.getParamForInput = function(el, pos, type) {
    if (type === "mouse") {
        pos = List.cross(pos, List.ey);
    } else if (type === "homog") {
        if (pos.value[1].real !== 0 || pos.value[1].imag !== 0)
            pos = List.turnIntoCSList([
                pos.value[0], CSNumber.zero, pos.value[2]
            ]);
    } else {
        pos = List.turnIntoCSList([CSNumber.zero, CSNumber.zero, CSNumber.zero]);
    }
    return List.normalizeMax(pos);
};
geoOps.VerticalLine.getParamFromState = function(el) {
    return getStateComplexVector(3);
};
geoOps.VerticalLine.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.VerticalLine.updatePosition = function(el) {
    var param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Line");
};
geoOps.VerticalLine.stateSize = 6;


geoOps.LineByFixedAngle = {};
geoOps.LineByFixedAngle.kind = "L";
geoOps.LineByFixedAngle.signature = ["L", "P"];
geoOps.LineByFixedAngle.initialize = function(el) {
    var a = CSNumber._helper.input(el.angle);
    var c = CSNumber.cos(a);
    var s = CSNumber.sin(a);
    // Setup matrix for applying the angle rotation.
    // This will also map from line in the plane to point at infinity.
    // So it's a rotation combined with a projection and hence has det=0.
    // And the rotation is 90 degrees less than one might expect at first
    // due to the translation between line and point.
    el.rot = List.turnIntoCSList([
        List.turnIntoCSList([s, c, CSNumber.zero]),
        List.turnIntoCSList([CSNumber.neg(c), s, CSNumber.zero]),
        List.turnIntoCSList([CSNumber.zero, CSNumber.zero, CSNumber.zero])
    ]);
};
geoOps.LineByFixedAngle.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])];
    var p = csgeo.csnames[(el.args[1])];
    var dir = List.productMV(el.rot, l.homog);
    el.homog = List.cross(p.homog, dir);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Through = {};
geoOps.Through.kind = "L";
geoOps.Through.signature = ["P"];
geoOps.Through.isMovable = true;
geoOps.Through.initialize = function(el) {
    var dir;
    if (el.dir)
        dir = General.wrap(el.dir);
    else
        dir = List.realVector([el.pos[1], -el.pos[0], 0]);
    putStateComplexVector(dir);
};
geoOps.Through.getParamForInput = function(el, pos, type) {
    var l;
    if (type === "dir" || type === "mouse") {
        var p1 = csgeo.csnames[(el.args[0])].homog;
        l = List.cross(p1, pos);
    } else if (type === "homog") {
        l = pos;
    } else {
        l = List.turnIntoCSList([CSNumber.zero, CSNumber.zero, CSNumber.zero]);
    }
    var dir = List.cross(List.linfty, l);
    // The parameter is the point at infinity, without its last coordinate.
    return List.normalizeMax(dir);
};
geoOps.Through.getParamFromState = function(el) {
    return getStateComplexVector(3);
};
geoOps.Through.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.Through.updatePosition = function(el) {
    var dir = getStateComplexVector(3);
    putStateComplexVector(dir); // copy param
    var p1 = csgeo.csnames[el.args[0]].homog;
    var homog = List.cross(p1, dir);
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Line");
};
geoOps.Through.stateSize = 6;
geoOps.Through.set_angle = function(el, value) {
    if (value.ctype === "number") {
        var cc = CSNumber.cos(value);
        var ss = CSNumber.sin(value);
        var dir = List.turnIntoCSList([cc, ss, CSNumber.real(0)]);
        movepointscr(el, dir, "dir");
    }
};
geoOps.Through.set_slope = function(el, value) {
    if (value.ctype === "number") {
        var dir = List.turnIntoCSList(
            [CSNumber.real(1), value, CSNumber.real(0)]);
        movepointscr(el, dir, "dir");
    }
};


geoOps.Free = {};
geoOps.Free.kind = "P";
geoOps.Free.signature = [];
geoOps.Free.isMovable = true;
geoOps.Free.initialize = function(el) {
    var pos = geoOps._helper.initializePoint(el);
    putStateComplexVector(pos);
};
geoOps.Free.getParamForInput = function(el, pos, type) {
    if (type === "mouse" && cssnap && csgridsize !== 0) {
        pos = List.normalizeZ(pos);
        var sx = pos.value[0].value.real;
        var sy = pos.value[1].value.real;
        var rx = Math.round(sx / csgridsize) * csgridsize;
        var ry = Math.round(sy / csgridsize) * csgridsize;
        if (Math.abs(rx - sx) < 0.2 && Math.abs(ry - sy) < 0.2) {
            pos = List.realVector([rx, ry, 1]);
        }
    }
    return List.normalizeMax(pos);
};
geoOps.Free.getParamFromState = function(el) {
    return getStateComplexVector(3);
};
geoOps.Free.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.Free.updatePosition = function(el) {
    var param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Point");
};
geoOps.Free.stateSize = 6;

geoOps._helper.projectPointToLine = function(point, line) {
    var tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
    var perp = List.cross(tt, point);
    return List.normalizeMax(List.cross(perp, line));
};

geoOps.PointOnLine = {};
geoOps.PointOnLine.kind = "P";
geoOps.PointOnLine.signature = ["L"];
geoOps.PointOnLine.isMovable = true;
geoOps.PointOnLine.initialize = function(el) {
    var point = geoOps._helper.initializePoint(el);
    var line = csgeo.csnames[(el.args[0])].homog;
    point = geoOps._helper.projectPointToLine(point, line);
    point = List.normalizeMax(point);
    var other = List.cross(List.linfty, point);
    other = List.normalizeMax(other);
    putStateComplexVector(point);
    putStateComplexVector(line);
    tracingInitial = false; // force updatePosition to do proper matching
};
geoOps.PointOnLine.updatePosition = function(el, isMover) {
    var newPoint;
    var newLine = csgeo.csnames[(el.args[0])].homog;
    var oldPoint = getStateComplexVector(3);
    var oldLine = getStateComplexVector(3);

    if (isMover) {
        newPoint = oldPoint;
    } else {
        // Also read from last good, which is real,
        // instead of only stateIn which might be complex.
        stateInIdx = el.stateIdx;
        var tmpIn = stateIn;
        stateIn = stateLastGood;
        var realPoint = getStateComplexVector(3);
        var realLine = getStateComplexVector(3);
        stateIn = tmpIn;

        var center = List.cross(realLine, newLine);
        //if (CSNumber._helper.isAlmostZero(List.scalproduct(newLine, realPoint))) {
        if (List._helper.isAlmostZero(center)) {
            // line stayed (almost) the same, perform orthogonal projection
            center = List.cross(List.linfty, newLine);
        }
        // Note: center is NOT continuous in the parameter,
        // so refinements might cause it to jump between situations.
        // But refinement will bring lines close to one another,
        // in which case the exact location of center becomes less relevant
        var circle = geoOps._helper.CircleMP(center, realPoint);
        var newCandidates = geoOps._helper.IntersectLC(newLine, circle);
        var oldAntipode = geoOps._helper.pointReflection(center, oldPoint);
        var res = tracing2core(
            newCandidates[0], newCandidates[1],
            oldPoint, oldAntipode);
        newPoint = res[0];
    }
    newPoint = List.normalizeMax(newPoint);
    putStateComplexVector(newPoint);
    putStateComplexVector(newLine);
    el.homog = General.withUsage(newPoint, "Point");
};
geoOps.PointOnLine.getParamForInput = function(el, pos, type) {
    var line = csgeo.csnames[(el.args[0])].homog;
    pos = geoOps._helper.projectPointToLine(pos, line);
    // TODO: snap to grid
    return pos;
};
geoOps.PointOnLine.getParamFromState = function(el) {
    return getStateComplexVector(3); // point is first state element
};
geoOps.PointOnLine.putParamToState = function(el, param) {
    return putStateComplexVector(param);
};
geoOps.PointOnLine.stateSize = 12;


geoOps.PointOnCircle = {};
geoOps.PointOnCircle.kind = "P";
geoOps.PointOnCircle.signature = ["C"];
geoOps.PointOnCircle.isMovable = true;
geoOps.PointOnCircle.initialize = function(el) {
    var circle = csgeo.csnames[el.args[0]];
    var pos = List.normalizeZ(geoOps._helper.initializePoint(el));
    var mid = List.normalizeZ(geoOps._helper.CenterOfConic(circle.matrix));
    var dir = List.sub(pos, mid);
    var param = List.turnIntoCSList([
        dir.value[1],
        CSNumber.neg(dir.value[0]),
        CSNumber.zero
    ]);
    // The parameter is the far point polar to the diameter through the point
    var diameter = List.cross(pos, mid);
    var candidates = geoOps._helper.IntersectLC(diameter, circle.matrix);
    var d0 = List.projectiveDistMinScal(pos, candidates[0]);
    var d1 = List.projectiveDistMinScal(pos, candidates[1]);
    var other;
    if (d1 < d0) {
        pos = candidates[1];
        other = candidates[0];
    } else {
        pos = candidates[0];
        other = candidates[1];
    }
    putStateComplexVector(param);
    putStateComplexVector(pos);
    putStateComplexVector(other);
    tracingInitial = false; // force updatePosition to do proper matching
};
geoOps.PointOnCircle.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.PointOnCircle.getParamFromState = function(el) {
    return getStateComplexVector(3);
};
geoOps.PointOnCircle.getParamForInput = function(el, pos, type) {
    var circle = csgeo.csnames[el.args[0]];
    var mid = List.normalizeZ(geoOps._helper.CenterOfConic(circle.matrix));
    var dir = List.sub(pos, mid);
    stateInIdx = el.stateIdx;
    var oldparam = getStateComplexVector(3);
    var oldpos = List.normalizeZ(getStateComplexVector(3));
    var olddir = List.sub(oldpos, mid);
    var oldSign = CSNumber.sub(
        CSNumber.mult(oldparam.value[0], olddir.value[1]),
        CSNumber.mult(oldparam.value[1], olddir.value[0]));
    if (oldSign.value.real < 0)
        dir = List.neg(dir);
    // if oldSign > 0 then oldparam[0], oldparam[1]
    // is a positive multiple of olddir[1], -olddir[0]
    return List.turnIntoCSList([
        dir.value[1],
        CSNumber.neg(dir.value[0]),
        CSNumber.zero
    ]);
};
geoOps.PointOnCircle.parameterPath = function(el, tr, tc, src, dst) {
    src = List.normalizeAbs(src);
    dst = List.normalizeAbs(dst);
    var sp = List.scalproduct(src, dst);
    if (sp.value.real >= 0)
        return defaultParameterPath(el, tr, tc, src, dst);
    // If we have more than half a turn, do two half-circle arcs
    // with a real position half way along the path.
    // This should ensure we get to the far intersection point when needed.
    var mid = List.turnIntoCSList([
        CSNumber.sub(src.value[1], dst.value[1]),
        CSNumber.sub(dst.value[0], src.value[0]),
        CSNumber.zero
    ]);
    sp = List.scalproduct(src, mid);
    if (sp.value.real < 0)
        mid = List.neg(mid);
    var t2, dt;
    if (tr < 0) {
        tr = 2 * tr + 1;
        t2 = tr * tr;
        dt = 0.25 / (1 + t2);
        tc = CSNumber.complex((2 * tr) * dt + 0.25, (1 - t2) * dt);
    } else {
        tr = 2 * tr - 1;
        t2 = tr * tr;
        dt = 0.25 / (1 + t2);
        tc = CSNumber.complex((2 * tr) * dt + 0.75, (1 - t2) * dt);
    }
    var uc = CSNumber.sub(CSNumber.real(1), tc);
    var tc2 = CSNumber.mult(tc, tc);
    var uc2 = CSNumber.mult(uc, uc);
    var tuc = CSNumber.mult(tc, uc);
    var res = List.scalmult(uc2, src);
    res = List.add(res, List.scalmult(tuc, mid));
    res = List.add(res, List.scalmult(tc2, dst));
    return res;
};
geoOps.PointOnCircle.updatePosition = function(el) {
    var param = getStateComplexVector(3);
    putStateComplexVector(param); // copy parameter
    var circle = csgeo.csnames[el.args[0]];
    var diameter = List.productMV(circle.matrix, param);
    var candidates = geoOps._helper.IntersectLC(diameter, circle.matrix);
    candidates = tracing2(candidates[0], candidates[1]);
    var pos = List.normalizeMax(candidates.value[0]);
    el.homog = General.withUsage(pos, "Point");
    el.antipodalPoint = candidates.value[1];
};
geoOps.PointOnCircle.stateSize = 6 + tracing2.stateSize;

geoOps.OtherPointOnCircle = {};
geoOps.OtherPointOnCircle.kind = "P";
geoOps.OtherPointOnCircle.signature = ["P"];
geoOps.OtherPointOnCircle.signatureConstraints = function(el) {
    return csgeo.csnames[el.args[0]].type === "PointOnCircle";
};
geoOps.OtherPointOnCircle.updatePosition = function(el) {
    var first = csgeo.csnames[el.args[0]];
    var pos = first.antipodalPoint;
    pos = List.normalizeMax(pos);
    el.homog = General.withUsage(pos, "Point");
};


// start and end assumed to be normalized at once!
geoOps._helper.projectPointToSegmentCR = function(seg, pos, infseg) {
    var line = seg.homog;
    var tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
    var farpoint = List.sub(seg.startpos, seg.endpos);
    var cr = List.crossratio3(
        farpoint, seg.startpos, seg.endpos, pos, tt);

    //handle case if segment passes through infinity
    if (infseg) {
        // probably needs tracing 
        if ((cr.value.real > 0) && (cr.value.real <= 0.5))
            cr = CSNumber.complex(0, cr.value.imag);
        if ((cr.value.real < 1) && (cr.value.real > 0.5))
            cr = CSNumber.complex(1, cr.value.imag);
    }
    // normal case
    else {
        if (cr.value.real < 0)
            cr = CSNumber.complex(0, cr.value.imag);
        if (cr.value.real > 1)
            cr = CSNumber.complex(1, cr.value.imag);
    }

    return cr;
};

geoOps._helper.projectPointToSegment = function(seg, param) {
    var start = seg.startpos;
    var end = seg.endpos;
    var far = List.sub(end, start);
    var homog = List.add(start, List.scalmult(param, far));
    return List.normalizeMax(homog);
};

geoOps.PointOnSegment = {};
geoOps.PointOnSegment.kind = "P";
geoOps.PointOnSegment.signature = ["S"];
geoOps.PointOnSegment.isMovable = true;
geoOps.PointOnSegment.initialize = function(el) {
    var pos = geoOps._helper.initializePoint(el);
    var cr = geoOps.PointOnSegment.getParamForInput(el, pos);
    putStateComplexNumber(cr);
};
geoOps.PointOnSegment.getParamForInput = function(el, pos) {
    var seg = csgeo.csnames[el.args[0]];
    return geoOps._helper.projectPointToSegmentCR(seg, pos);
};
geoOps.PointOnSegment.getParamFromState = function(el) {
    return getStateComplexNumber();
};
geoOps.PointOnSegment.putParamToState = function(el, param) {
    putStateComplexNumber(param);
};
geoOps.PointOnSegment.updatePosition = function(el) {
    var param = getStateComplexNumber();
    putStateComplexNumber(param); // copy parameter
    var seg = csgeo.csnames[el.args[0]];

    var homog = geoOps._helper.projectPointToSegment(seg, param);
    el.homog = General.withUsage(homog, "Point");
};
geoOps.PointOnSegment.stateSize = 2;

geoOps._helper.PointOnArcCr = function(arc, P) {
    var A = arc.startPoint,
        B = arc.viaPoint,
        C = arc.endPoint;
    var cr = List.crossratio3harm(P, A, B, C, List.ii);

    var m = cr.value[0];
    var n = cr.value[1];

    if (!CSNumber._helper.isAlmostZero(m)) {
        n = CSNumber.div(n, m);
        m = CSNumber.real(1);
    } else {
        m = CSNumber.div(m, n);
        n = CSNumber.real(1);
    }


    var prod = m.value.real * n.value.real;

    if (prod >= 0 && prod <= 1) {
        var d1 = List.projectiveDistMinScal(P, A);
        var d2 = List.projectiveDistMinScal(P, C);

        if (d1 < d2) {
            m = CSNumber.real(1);
            n = CSNumber.real(1);
        } else {
            m = CSNumber.real(1);
            n = CSNumber.real(0);
        }

    }

    return List.turnIntoCSList([m, n]);
};

geoOps._helper.projectPointToCircle = function(cir, P) {

    var cen = geoOps._helper.CenterOfConic(cir.matrix);
    cen = List.normalizeMax(cen);
    var l = List.normalizeMax(List.cross(P, cen));

    var isec = geoOps._helper.IntersectLC(l, cir.matrix);

    var d1 = List.projectiveDistMinScal(P, isec[0]);
    var d2 = List.projectiveDistMinScal(P, isec[1]);

    var erg = d1 < d2 ? isec[0] : isec[1];

    return erg;
};

geoOps._helper.projectPointToArc = function(arc, P) {
    var A = arc.startPoint;
    var C = arc.endPoint;
    var B = arc.viaPoint;

    var det = List.det(List.turnIntoCSList([A, B, C]));

    if (CSNumber._helper.isAlmostZero(det)) {
        // arc is segment
        var AA = List.scalmult(C.value[2], A);
        var CC = List.scalmult(A.value[2], C);
        var startend = List.turnIntoCSList([AA, CC]);
        startend = List.normalizeMax(startend); // Normalize together!

        var seg = {
            "startpos": startend.value[0],
            "endpos": startend.value[1],
            "homog": List.cross(A, C)
        };

        // segment passing through infinity?
        var far = List.sub(AA, CC);
        var tmpcr = List.crossratio3(A, C, B, far, List.ii).value.real;

        var infseg = tmpcr > 0;

        var cr = geoOps._helper.projectPointToSegmentCR(seg, P, infseg);
        return geoOps._helper.projectPointToSegment(seg, cr);

    } else {
        return geoOps._helper.projectPointToCircle(arc, P);
    }
};


geoOps.PointOnArc = {};
geoOps.PointOnArc.kind = "P";
geoOps.PointOnArc.signature = ["C"];
geoOps.PointOnArc.isMovable = true;
geoOps.PointOnArc.initialize = function(el) {
    var arc = csgeo.csnames[el.args[0]];
    var p = geoOps._helper.initializePoint(el);
    p = geoOps._helper.projectPointToArc(arc, p);

    var cr = geoOps._helper.PointOnArcCr(arc, p);
    putStateComplexVector(cr);
};
geoOps.PointOnArc.getParamForInput = function(el, pos) {
    var arc = csgeo.csnames[el.args[0]];
    var npos = geoOps._helper.projectPointToArc(arc, pos);
    var cr = geoOps._helper.PointOnArcCr(arc, npos);

    return cr;
};
geoOps.PointOnArc.getParamFromState = function(el) {
    return getStateComplexVector(2);
};
geoOps.PointOnArc.putParamToState = function(el, param) {
    putStateComplexVector(param);
};
geoOps.PointOnArc.updatePosition = function(el) {
    var arc = csgeo.csnames[el.args[0]];
    var A = arc.startPoint;
    var C = arc.endPoint;
    var B = arc.viaPoint;
    var II = List.ii;

    var conic = arc.matrix;

    var cr = getStateComplexVector(2);
    putStateComplexVector(cr);
    var cr1 = cr.value[0];
    var cr2 = cr.value[1];


    var erg;

    // l = ([A,C,I]*B-cr*[A,B,I]*C) x I
    var aciB = List.det(List.turnIntoCSList([A, C, II]));
    aciB = CSNumber.mult(cr2, aciB);
    aciB = List.scalmult(aciB, B);

    var dabiC = List.det(List.turnIntoCSList([A, B, II]));
    dabiC = CSNumber.mult(cr1, dabiC);
    dabiC = List.scalmult(dabiC, C);

    var ll = List.sub(aciB, dabiC);
    ll = List.normalizeMax(ll);
    ll = List.cross(ll, List.ii);
    ll = List.normalizeMax(ll);


    erg = geoOps._helper.IntersectLC(ll, arc.matrix);
    var d1 = List.projectiveDistMinScal(erg[0], II);
    var d2 = List.projectiveDistMinScal(erg[1], II);

    erg = d1 < d2 ? erg[1] : erg[0];
    erg = List.normalizeMax(erg);

    el.homog = General.withUsage(erg, "Point");
};
geoOps.PointOnArc.stateSize = 4;


geoOps._helper.CenterOfConic = function(c) {
    // The center is the pole of the dual conic of the line at infinity
    var adj = List.adjoint3(c);
    // return General.mult(adj, List.linfty);
    // do not use matrix vector multiplication, we know the result
    return {
        'ctype': 'list',
        'value': [adj.value[2].value[0], adj.value[2].value[1], adj.value[2].value[2]]
    };
};

geoOps.CenterOfConic = {};
geoOps.CenterOfConic.kind = "P";
geoOps.CenterOfConic.signature = ["C"];
geoOps.CenterOfConic.updatePosition = function(el) {
    var c = csgeo.csnames[(el.args[0])].matrix;
    var erg = geoOps._helper.CenterOfConic(c);
    el.homog = erg;
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps._helper.CircleMP = function(m, p) {
    var x = m.value[0];
    var y = m.value[1];
    var mz = CSNumber.neg(m.value[2]);
    var zero = CSNumber.zero;
    var tang = List.turnIntoCSList([
        List.turnIntoCSList([mz, zero, x]),
        List.turnIntoCSList([zero, mz, y]),
        List.turnIntoCSList([x, y, zero]),
    ]);
    var mu = General.mult(General.mult(p, tang), p);
    var la = General.mult(General.mult(p, List.fund), p);
    var m1 = General.mult(mu, List.fund);
    var m2 = General.mult(la, tang);
    var erg = List.sub(m1, m2);
    return erg;
};

geoOps.CircleMP = {};
geoOps.CircleMP.kind = "C";
geoOps.CircleMP.signature = ["P", "P"];
geoOps.CircleMP.updatePosition = function(el) { //TODO Performance Checken. Das ist jetzt der volle CK-ansatz
    //Weniger Allgemein geht das viiiiel schneller
    var m = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    el.matrix = geoOps._helper.CircleMP(m, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Circle");

};


geoOps.CircleMr = {};
geoOps.CircleMr.kind = "C";
geoOps.CircleMr.signature = ["P"];
geoOps.CircleMr.isMovable = true;
geoOps.CircleMr.initialize = function(el) {
    putStateComplexNumber(CSNumber.real(el.radius));
};
geoOps.CircleMr.getParamForInput = function(el, pos, type) {
    if (type === "radius") return pos;
    var m = csgeo.csnames[(el.args[0])].homog;
    m = List.normalizeZ(m);
    pos = List.normalizeZ(pos);
    var rad = List.sub(m, pos);
    rad = List.abs(rad);
    return rad;
};
geoOps.CircleMr.getParamFromState = function(el) {
    return getStateComplexNumber();
};
geoOps.CircleMr.putParamToState = function(el, param) {
    putStateComplexNumber(param);
};
geoOps.CircleMr.updatePosition = function(el) {
    var r = getStateComplexNumber();
    putStateComplexNumber(r); // copy param
    var m = csgeo.csnames[(el.args[0])].homog;
    /*
    The circle's radius value may take on values from zero to infinity.
    However since the squared radius value appears in the circle's matrix,
    a radius value of 2E+154 or more could also end up as an infinite value.
    Using List.normalizeMax elsewhere will limit the coordinate values of m
    to no more than 1.0, so that scaling the radius value by m's z-coordinate
    first here will not make the radius value any larger. Then by squaring the
    radius value, any infinity value produced can be caught here.
    */
    var sr = CSNumber.mult(m.value[2], r);
    var sr2 = CSNumber.mult(sr, sr);
    if (!CSNumber._helper.isFinite(sr2) && !CSNumber._helper.isNaN(sr2)) return List.fund;
    var matrix = geoOps._helper.ScaledCircleMrr(m, sr2);
    el.matrix = General.withUsage(matrix, "Circle");
    el.radius = r;
};
geoOps.CircleMr.stateSize = 2;
geoOps.CircleMr.set_radius = function(el, value) {
    if (value.ctype === "number") {
        movepointscr(el, value, "radius");
    }
};


geoOps._helper.ScaledCircleMrr = function(M, rr) {
    /*
    Given M as the circle's homogeneous center point coordinates [x, y, z] and
    rr as the circle's radius value squared scaled by M's z-coordinate squared,
    build the following matrix:
        ⎛   z*z      0      -z*x   ⎞
        ⎜    0      z*z     -z*y   ⎟
        ⎝  -z*x    -z*y  x*x+y*y-rr⎠
    */
    var x = M.value[0];
    var y = M.value[1];
    var mz = CSNumber.neg(M.value[2]); // minus z
    var v = List.scalmult(mz, List.turnIntoCSList([x, y, mz])).value;
    var vxy = List.turnIntoCSList([x, y]);
    var zz = CSNumber.sub(List.scalproduct(vxy, vxy), rr);
    var matrix = geoOps._helper.buildConicMatrix([v[2], CSNumber.zero, v[2], v[0], v[1], zz]);
    return List.normalizeMax(matrix);
};


geoOps.Compass = {};
geoOps.Compass.kind = "C";
geoOps.Compass.signature = ["P", "P", "P"];
geoOps.Compass.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var m = csgeo.csnames[(el.args[2])].homog;
    // Scale each point's homogeneous coordinates by the other two
    // point's z-value to allow addtion and subtraction to be valid.
    var aZ = a.value[2];
    var bZ = b.value[2];
    var mZ = m.value[2];
    a = List.scalmult(CSNumber.mult(bZ, mZ), a);
    b = List.scalmult(CSNumber.mult(aZ, mZ), b);
    m = List.scalmult(CSNumber.mult(aZ, bZ), m);
    // Setup circle's matrix with m as center and segment ab length as radius
    var d = List.sub(b, a);
    var matrix = geoOps._helper.ScaledCircleMrr(m, List.scalproduct(d, d));
    el.matrix = General.withUsage(matrix, "Circle");
};


geoOps._helper.getConicType = function(C) {
    var myEps = 1e-16;
    var adet = CSNumber.abs(List.det(C));

    if (adet.value.real < myEps) {
        return "degenerate";
    }

    var det = CSNumber.mult(C.value[0].value[0], C.value[1].value[1]);
    det = CSNumber.sub(det, CSNumber.pow(C.value[0].value[1], CSNumber.real(2)));

    det = det.value.real;

    if (Math.abs(det) < myEps) {
        return "parabola";
    } else if (det > myEps) {
        return "ellipsoid";
    } else {
        return "hyperbola";
    }
};


geoOps._helper.ConicBy5 = function(el, a, b, c, d, p) {

    var v23 = List.turnIntoCSList([List.cross(b, c)]);
    var v14 = List.turnIntoCSList([List.cross(a, d)]);
    var v12 = List.turnIntoCSList([List.cross(a, b)]);
    var v34 = List.turnIntoCSList([List.cross(c, d)]);

    var erg = geoOps._helper.conicFromTwoDegenerates(v23, v14, v12, v34, p);
    return erg;
};

geoOps._helper.conicFromTwoDegenerates = function(v23, v14, v12, v34, p) {
    var deg1 = General.mult(List.transpose(v14), v23);
    var deg2 = General.mult(List.transpose(v34), v12);
    deg1 = List.add(deg1, List.transpose(deg1));
    deg2 = List.add(deg2, List.transpose(deg2));
    var mu = General.mult(General.mult(p, deg1), p);
    var la = General.mult(General.mult(p, deg2), p);
    var m1 = General.mult(mu, deg2);
    var m2 = General.mult(la, deg1);

    var erg = List.sub(m1, m2);
    return erg;
};


geoOps.ConicBy5 = {};
geoOps.ConicBy5.kind = "C";
geoOps.ConicBy5.signature = ["P", "P", "P", "P", "P"];
geoOps.ConicBy5.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;
    var p = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);

    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps._helper.buildConicMatrix = function(arr) {
    var a = arr[0];
    var b = arr[1];
    var c = arr[2];
    var d = arr[3];
    var e = arr[4];
    var f = arr[5];

    var M = List.turnIntoCSList([
        List.turnIntoCSList([a, b, d]),
        List.turnIntoCSList([b, c, e]),
        List.turnIntoCSList([d, e, f])
    ]);
    return M;
};

geoOps._helper.splitDegenConic = function(mat) {
    var adj_mat = List.adjoint3(mat);

    var idx = 0;
    var k, l, abs2;
    var max = CSNumber.abs2(adj_mat.value[0].value[0]).value.real;
    for (k = 1; k < 3; k++) {
        abs2 = CSNumber.abs2(adj_mat.value[k].value[k]).value.real;
        if (abs2 > max) {
            idx = k;
            max = abs2;
        }
    }

    var beta = CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), adj_mat.value[idx].value[idx]));
    if (CSNumber.abs2(beta).value.real < 1e-16) {
        var zeros = List.turnIntoCSList([
            CSNumber.zero, CSNumber.zero, CSNumber.zero
        ]);
        return [zeros, zeros];
    }
    idx = CSNumber.real(idx + 1);
    var p = List.column(adj_mat, idx);

    p = List.scaldiv(beta, p);


    var lam = p.value[0],
        mu = p.value[1],
        tau = p.value[2];
    var M = List.turnIntoCSList([
        List.turnIntoCSList([CSNumber.real(0), tau, CSNumber.mult(CSNumber.real(-1), mu)]),
        List.turnIntoCSList([CSNumber.mult(CSNumber.real(-1), tau), CSNumber.real(0), lam]),
        List.turnIntoCSList([mu, CSNumber.mult(CSNumber.real(-1), lam), CSNumber.real(0)])
    ]);


    var C = List.add(mat, M);

    // get nonzero index
    var ii = 0;
    var jj = 0;
    max = 0;
    for (k = 0; k < 3; k++)
        for (l = 0; l < 3; l++) {
            abs2 = CSNumber.abs2(C.value[k].value[l]).value.real;
            if (abs2 > max) {
                ii = k;
                jj = l;
                max = abs2;
            }
        }


    var lg = C.value[ii];
    C = List.transpose(C);
    var lh = C.value[jj];
    lg = List.normalizeMax(lg);
    lh = List.normalizeMax(lh);

    lg = General.withUsage(lg, "Line");
    lh = General.withUsage(lh, "Line");


    return [lg, lh];
};

geoOps.SelectConic = {};
geoOps.SelectConic.kind = "C";
geoOps.SelectConic.signature = ["Cs"];
geoOps.SelectConic.initialize = function(el) {
    if (el.index !== undefined)
        return el.index - 1;
    var xx = CSNumber._helper.input(el.pos.xx);
    var yy = CSNumber._helper.input(el.pos.yy);
    var zz = CSNumber._helper.input(el.pos.zz);
    var xy = CSNumber.realmult(0.5, CSNumber._helper.input(el.pos.xy));
    var xz = CSNumber.realmult(0.5, CSNumber._helper.input(el.pos.xz));
    var yz = CSNumber.realmult(0.5, CSNumber._helper.input(el.pos.yz));
    var pos = List.turnIntoCSList([
        List.turnIntoCSList([xx, xy, xz]),
        List.turnIntoCSList([xy, yy, yz]),
        List.turnIntoCSList([xz, yz, zz])
    ]);
    var set = csgeo.csnames[(el.args[0])].results;
    var d1 = List.conicDist(pos, set[0]);
    var best = 0;
    for (var i = 1; i < set.length; ++i) {
        var d2 = List.conicDist(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectConic.updatePosition = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    el.matrix = set.results[el.param];
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

// conic by 4 Points and 1 line
geoOps._helper.ConicBy4p1l = function(el, a, b, c, d, l) {
    var al = List.scalproduct(a, l);
    var bl = List.scalproduct(b, l);
    var cl = List.scalproduct(c, l);
    var dl = List.scalproduct(d, l);
    var bcd = List.det3(b, c, d);
    var abd = List.det3(a, b, d);
    var acd = List.det3(a, c, d);
    var abc = List.det3(a, b, c);
    var mul = CSNumber.mult;
    var r1 = CSNumber.sqrt(mul(mul(bl, dl), mul(bcd, abd)));
    var r2 = CSNumber.sqrt(mul(mul(al, cl), mul(acd, abc)));
    var a1 = List.cross(List.cross(a, c), l);
    var a2 = List.cross(List.cross(b, d), l);
    var k1 = List.scalmult(r1, a1);
    var k2 = List.scalmult(r2, a2);
    var x = List.normalizeMax(List.add(k1, k2));
    var y = List.normalizeMax(List.sub(k1, k2));
    var xy = tracing2(x, y);
    var t1 = geoOps._helper.ConicBy5(el, a, b, c, d, xy.value[0]);
    var t2 = geoOps._helper.ConicBy5(el, a, b, c, d, xy.value[1]);
    return [List.normalizeMax(t1), List.normalizeMax(t2)];
};

geoOps.ConicBy4p1l = {};
geoOps.ConicBy4p1l.kind = "Cs";
geoOps.ConicBy4p1l.signature = ["P", "P", "P", "P", "L"];
geoOps.ConicBy4p1l.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;

    var l = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el, a, b, c, d, l);

    el.results = erg;

};
geoOps.ConicBy4p1l.stateSize = tracing2.stateSize;


geoOps._helper.ConicBy3p2l = function(a, b, c, g, h) {
    // see http://math.stackexchange.com/a/1187525/35416
    var l = List.cross(a, b);
    var gh = List.cross(g, h);
    var gl = List.cross(g, l);
    var hl = List.cross(h, l);
    var m1 = List.turnIntoCSList([gl, hl, gh]);
    var s1 = List.productVM(c, List.adjoint3(m1));
    var m2 = List.adjoint3(List.turnIntoCSList([
        List.scalmult(s1.value[0], gl),
        List.scalmult(s1.value[1], hl),
        List.scalmult(s1.value[2], gh)
    ]));
    var m3 = List.transpose(m2);
    var mul = CSNumber.mult;
    var aa = List.productMV(m3, a);
    var a1 = aa.value[0];
    var a2 = aa.value[1];
    var bb = List.productMV(m3, b);
    var b1 = bb.value[0];
    var b2 = bb.value[1];
    // assert: aa.value[2] and bb.value[2] are zero

    var a3a = CSNumber.sqrt(mul(a1, a2));
    var b3a = CSNumber.sqrt(mul(b1, b2));
    var signs, res = new Array(4);
    for (signs = 0; signs < 4; ++signs) {
        var sa = ((signs & 1) << 1) - 1;
        var sb = (signs & 2) - 1;
        var a3 = mul(CSNumber.real(sa), a3a);
        var b3 = mul(CSNumber.real(sb), b3a);
        var p1 = det2(a2, a3, b2, b3);
        var p2 = det2(b1, b3, a1, a3);
        var p3 = det2(a1, a2, b1, b2);
        var p4 = CSNumber.add(
            CSNumber.add(
                det2(b1, b2, a1, a2),
                det2(b2, b3, a2, a3)),
            det2(b3, b1, a3, a1));
        var xx = mul(p1, p1);
        var yy = mul(p2, p2);
        var zz = mul(p4, p4);
        var xy = mul(p1, p2);
        var xz = mul(p1, p4);
        var yz = mul(p2, p4);
        xy = CSNumber.sub(xy, mul(CSNumber.real(0.5), mul(p3, p3)));
        var mm = List.turnIntoCSList([
            List.turnIntoCSList([xx, xy, xz]),
            List.turnIntoCSList([xy, yy, yz]),
            List.turnIntoCSList([xz, yz, zz])
        ]);
        mm = List.productMM(m2, List.productMM(mm, m3));
        var vv = List.turnIntoCSList([
            mm.value[0].value[0],
            mm.value[0].value[1],
            mm.value[0].value[2],
            mm.value[1].value[1],
            mm.value[1].value[2],
            mm.value[2].value[2]
        ]);
        res[signs] = vv;
    }
    return res;

    function det2(a, b, c, d) {
        return CSNumber.sub(CSNumber.mult(a, d), CSNumber.mult(b, c));
    }
};

geoOps.ConicBy3p2l = {};
geoOps.ConicBy3p2l.kind = "Cs";
geoOps.ConicBy3p2l.signature = ["P", "P", "P", "L", "L"];
geoOps.ConicBy3p2l.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var g = csgeo.csnames[(el.args[3])].homog;
    var h = csgeo.csnames[(el.args[4])].homog;
    var newVecs = geoOps._helper.ConicBy3p2l(a, b, c, g, h);
    newVecs = tracingSesq(newVecs);
    var res = new Array(4);
    for (var i = 0; i < 4; ++i) {
        var v = newVecs[i].value;
        res[i] = List.turnIntoCSList([
            List.turnIntoCSList([v[0], v[1], v[2]]),
            List.turnIntoCSList([v[1], v[3], v[4]]),
            List.turnIntoCSList([v[2], v[4], v[5]])
        ]);
    }
    el.results = res;
};
geoOps.ConicBy3p2l.stateSize = 48;

geoOps.ConicBy2p3l = {};
geoOps.ConicBy2p3l.kind = "Cs";
geoOps.ConicBy2p3l.signature = ["P", "P", "L", "L", "L"];
geoOps.ConicBy2p3l.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var g = csgeo.csnames[(el.args[2])].homog;
    var h = csgeo.csnames[(el.args[3])].homog;
    var l = csgeo.csnames[(el.args[4])].homog;
    var oldVecs = el.tracing;
    var newVecs = geoOps._helper.ConicBy3p2l(g, h, l, a, b);
    newVecs = tracingSesq(newVecs);
    var res = new Array(4);
    for (var i = 0; i < 4; ++i) {
        var v = newVecs[i].value;
        var dual = List.turnIntoCSList([
            List.turnIntoCSList([v[0], v[1], v[2]]),
            List.turnIntoCSList([v[1], v[3], v[4]]),
            List.turnIntoCSList([v[2], v[4], v[5]])
        ]);
        res[i] = List.normalizeMax(List.adjoint3(dual));
    }
    el.results = res;
};
geoOps.ConicBy2p3l.stateSize = 48;

geoOps.ConicBy1p4l = {};
geoOps.ConicBy1p4l.kind = "Cs";
geoOps.ConicBy1p4l.signature = ["P", "L", "L", "L", "L"];
geoOps.ConicBy1p4l.updatePosition = function(el) {
    var p = csgeo.csnames[(el.args[0])].homog;
    var l1 = csgeo.csnames[(el.args[1])].homog;
    var l2 = csgeo.csnames[(el.args[2])].homog;
    var l3 = csgeo.csnames[(el.args[3])].homog;
    var l4 = csgeo.csnames[(el.args[4])].homog;


    var erg = geoOps._helper.ConicBy4p1l(el, l1, l2, l3, l4, p);
    var t1 = erg[0];
    var t2 = erg[1];
    t1 = List.adjoint3(t1);
    t2 = List.adjoint3(t2);

    erg = [t1, t2];
    el.results = erg;

};
geoOps.ConicBy1p4l.stateSize = tracing2.stateSize;

geoOps.ConicParabolaPL = {};
geoOps.ConicParabolaPL.kind = "C";
geoOps.ConicParabolaPL.signature = ["P", "L"];
geoOps.ConicParabolaPL.updatePosition = function(el) {
    var F = csgeo.csnames[(el.args[0])].homog.value; // focus point
    var d = csgeo.csnames[(el.args[1])].homog.value; // directrix line
    /* Desired outcome:
     * [[Fz^2*dy^2, -Fz^2*dx*dy, -(Fx*dx^2 + Fx*dy^2 + Fz*dx*dz)*Fz],
     *  [-Fz^2*dx*dy, Fz^2*dx^2, -(Fy*dx^2 + Fy*dy^2 + Fz*dy*dz)*Fz],
     *  [-(Fx*dx^2 + Fx*dy^2 + Fz*dx*dz)*Fz,
     *   -(Fy*dx^2 + Fy*dy^2 + Fz*dy*dz)*Fz,
     *   Fx^2*dx^2 + Fy^2*dx^2 + Fx^2*dy^2 + Fy^2*dy^2 - Fz^2*dz^2]]
     * For derivation see https://github.com/CindyJS/CindyJS/pull/126
     * or http://math.stackexchange.com/a/1557496/35416
     * or https://gist.github.com/gagern/5a1d6d4663c3da6f52dd
     */
    var mult = CSNumber.mult;
    var neg = CSNumber.neg;
    var add = CSNumber.add;
    var sub = CSNumber.sub;
    var Fx = F[0];
    var Fy = F[1];
    var Fz = F[2];
    var dx = d[0];
    var dy = d[1];
    var dz = d[2];
    var Fz2 = mult(Fz, Fz);
    var dx2 = mult(dx, dx);
    var dy2 = mult(dy, dy);
    var Fzdz = mult(Fz, dz);
    var nFz = neg(Fz);
    var dx2pdy2 = add(dx2, dy2);
    var xx = mult(Fz2, dy2);
    var yy = mult(Fz2, dx2);
    var xy = mult(neg(Fz2), mult(dx, dy));
    var xz = mult(nFz, add(mult(Fx, dx2pdy2), mult(Fzdz, dx)));
    var yz = mult(nFz, add(mult(Fy, dx2pdy2), mult(Fzdz, dy)));
    var zz = sub(
        mult(add(mult(Fx, Fx), mult(Fy, Fy)), dx2pdy2),
        mult(Fz2, mult(dz, dz)));
    var m = geoOps._helper.buildConicMatrix([xx, xy, yy, xz, yz, zz]);
    m = List.normalizeMax(m);
    el.matrix = General.withUsage(m, "Conic");
};

geoOps.ConicBy2Foci1P = {};
geoOps.ConicBy2Foci1P.kind = "Cs";
geoOps.ConicBy2Foci1P.signature = ["P", "P", "P"];
geoOps.ConicBy2Foci1P.updatePosition = function(el) {
    var F1 = csgeo.csnames[(el.args[0])].homog;
    var F2 = csgeo.csnames[(el.args[1])].homog;
    var PP = csgeo.csnames[(el.args[2])].homog;

    // i and j
    var II = List.ii;
    var JJ = List.jj;

    var b1 = List.normalizeMax(List.cross(F1, PP));
    var b2 = List.normalizeMax(List.cross(F2, PP));
    var a1 = List.normalizeMax(List.cross(PP, II));
    var a2 = List.normalizeMax(List.cross(PP, JJ));

    var har = geoOps._helper.coHarmonic(a1, a2, b1, b2);
    var e1 = List.normalizeMax(har[0]);
    var e2 = List.normalizeMax(har[1]);

    // lists for transposed
    var lII = List.turnIntoCSList([II]);
    var lJJ = List.turnIntoCSList([JJ]);
    var lF1 = List.turnIntoCSList([F1]);
    var lF2 = List.turnIntoCSList([F2]);

    var co1 = geoOps._helper.conicFromTwoDegenerates(lII, lJJ, lF1, lF2, e1);
    co1 = List.normalizeMax(co1);
    var co2 = geoOps._helper.conicFromTwoDegenerates(lII, lJJ, lF1, lF2, e2);
    co2 = List.normalizeMax(co2);

    // adjoint
    co1 = List.normalizeMax(List.adjoint3(co1));
    co2 = List.normalizeMax(List.adjoint3(co2));

    // return ellipsoid first 
    if (geoOps._helper.getConicType(co1) !== "ellipsoid") {
        var temp = co1;
        co1 = co2;
        co2 = temp;
    }

    // remove hyperbola in limit case
    if (List.almostequals(F1, F2).value) {
        var three = CSNumber.real(3);
        co2 = List.zeromatrix(three, three);
    }

    var erg = [co1, co2];
    el.results = erg;

};

// Given (A, a, B, b, C), compute conic such that
// 1. (A, a) and (B, b) are pole-polar pairs and
// 2. C is incident with the conic
geoOps.ConicBy2Pol1P = {};
geoOps.ConicBy2Pol1P.kind = "C";
geoOps.ConicBy2Pol1P.signature = ["P", "L", "P", "L", "P"];
geoOps.ConicBy2Pol1P.updatePosition = function(el) {
    var A = csgeo.csnames[(el.args[0])].homog;
    var a = csgeo.csnames[(el.args[1])].homog;
    var B = csgeo.csnames[(el.args[2])].homog;
    var b = csgeo.csnames[(el.args[3])].homog;
    var C = csgeo.csnames[(el.args[4])].homog;

    var sp = List.scalproduct;
    var sm = List.scalmult;
    var sub = List.sub;
    var mm = List.productMM;
    var rm = CSNumber.realmult;
    var transpose = List.transpose;
    var asList = List.turnIntoCSList;

    // D = ⟨a,A⟩⋅C − 2⟨a,C⟩⋅A, E = ⟨b,B⟩⋅C − 2⟨b,C⟩⋅B
    var D = sub(sm(sp(a, A), C), sm(rm(2, sp(a, C)), A));
    var E = sub(sm(sp(b, B), C), sm(rm(2, sp(b, C)), B));
    var AC = asList([List.cross(A, C)]);
    var BC = asList([List.cross(B, C)]);
    var M1 = mm(transpose(AC), asList([List.cross(A, E)]));
    var M2 = mm(transpose(BC), asList([List.cross(B, D)]));
    var M3 = mm(transpose(AC), BC);
    var Ab = sp(A, b);
    var Ba = sp(B, a);
    // M = Ba * M1 + Ab * M2 - 2 * Ab * Ba * M3
    var M = List.add(sm(Ba, M1), sm(Ab, M2));
    M = sub(M, sm(rm(2, CSNumber.mult(Ab, Ba)), M3));
    M = List.add(M, transpose(M));
    M = List.normalizeMax(M);
    M = General.withUsage(M, "Conic");
    el.matrix = M;
};

// Given (A, a, B, b, c), compute conic such that
// 1. (A, a) and (B, b) are pole-polar pairs and
// 2. c is a tangent to the conic
geoOps.ConicBy2Pol1L = {};
geoOps.ConicBy2Pol1L.kind = "C";
geoOps.ConicBy2Pol1L.signature = ["P", "L", "P", "L", "L"];
geoOps.ConicBy2Pol1L.updatePosition = function(el) {
    var A = csgeo.csnames[(el.args[0])].homog;
    var a = csgeo.csnames[(el.args[1])].homog;
    var B = csgeo.csnames[(el.args[2])].homog;
    var b = csgeo.csnames[(el.args[3])].homog;
    var c = csgeo.csnames[(el.args[4])].homog;

    var sp = List.scalproduct;
    var sm = List.scalmult;
    var mm = List.productMM;
    var mul = CSNumber.mult;
    var rm = CSNumber.realmult;
    var transpose = List.transpose;
    var asList = List.turnIntoCSList;

    var aA = sp(a, A);
    var aB = sp(a, B);
    var bA = sp(b, A);
    var bB = sp(b, B);
    var cA = sp(c, A);
    var cB = sp(c, B);
    var v = asList([List.sub(sm(mul(bA, cB), a), sm(mul(aB, cA), b))]);

    var M = List.add(
        mm(
            transpose(asList([sm(mul(bA, aB), c)])),
            asList([List.sub(
                List.add(
                    sm(CSNumber.sub(mul(aA, cB), mul(aB, cA)), b),
                    sm(CSNumber.sub(mul(bB, cA), mul(bA, cB)), a)
                ),
                sm(List.det3(a, b, c), List.cross(A, B))
            )])
        ),
        mm(transpose(v), v)
    );
    M = List.add(M, transpose(M));
    M = List.normalizeMax(M);
    M = General.withUsage(M, "Conic");
    el.matrix = M;
};

// Conic by one polar pair and three incident flats
geoOps._helper.conic1Pol3Inc = function(A, a, B, C, D) {
    var sp = List.scalproduct;
    var sm = List.scalmult;
    var mm = List.productMM;
    var cp = List.cross;
    var rm = CSNumber.realmult;
    var mult = CSNumber.mult;
    var transpose = List.transpose;
    var asList = List.turnIntoCSList;
    var det3 = List.det3;

    var ABC = det3(A, B, C);
    var BD = asList([cp(B, D)]);
    var AD = asList([cp(A, D)]);
    var BC = asList([cp(B, C)]);
    var aA = sp(a, A);
    var aB = sp(a, B);
    var aD = sp(a, D);
    var v = asList([cp(C, List.sub(sm(aA, D), sm(rm(2, aD), A)))]);
    var M = sm(ABC, mm(transpose(BD), v));
    var f = rm(2, CSNumber.add(mult(det3(A, C, D), aB), mult(ABC, aD)));
    f = CSNumber.sub(mult(det3(B, C, D), aA), f);
    M = List.add(M, sm(f, mm(transpose(AD), BC)));
    M = List.add(M, transpose(M));
    M = List.normalizeMax(M);
    return M;
};

// Given (A, a, B, C, D), compute conic such that
// 1. (A, a) is a pole-polar pair and
// 2. B, C, D are incident with the conic
geoOps.ConicBy1Pol3P = {};
geoOps.ConicBy1Pol3P.kind = "C";
geoOps.ConicBy1Pol3P.signature = ["P", "L", "P", "P", "P"];
geoOps.ConicBy1Pol3P.updatePosition = function(el) {
    var A = csgeo.csnames[(el.args[0])].homog;
    var a = csgeo.csnames[(el.args[1])].homog;
    var B = csgeo.csnames[(el.args[2])].homog;
    var C = csgeo.csnames[(el.args[3])].homog;
    var D = csgeo.csnames[(el.args[4])].homog;

    var M = geoOps._helper.conic1Pol3Inc(A, a, B, C, D);
    M = General.withUsage(M, "Conic");
    el.matrix = M;
};

// Given (A, a, b, c, d), compute conic such that
// 1. (A, a) is a pole-polar pair and
// 2. b, c, d are tangents to the conic
geoOps.ConicBy1Pol3L = {};
geoOps.ConicBy1Pol3L.kind = "C";
geoOps.ConicBy1Pol3L.signature = ["P", "L", "L", "L", "L"];
geoOps.ConicBy1Pol3L.updatePosition = function(el) {
    var A = csgeo.csnames[(el.args[0])].homog;
    var a = csgeo.csnames[(el.args[1])].homog;
    var b = csgeo.csnames[(el.args[2])].homog;
    var c = csgeo.csnames[(el.args[3])].homog;
    var d = csgeo.csnames[(el.args[4])].homog;

    var M = geoOps._helper.conic1Pol3Inc(a, A, b, c, d);
    M = List.normalizeMax(List.adjoint3(M));
    M = General.withUsage(M, "Conic");
    el.matrix = M;
};

geoOps._helper.coHarmonic = function(a1, a2, b1, b2) {
    var poi = List.realVector([100 * Math.random(), 100 * Math.random(), 1]);

    var ix = List.det3(poi, b1, a1);
    var jx = List.det3(poi, b1, a2);
    var iy = List.det3(poi, b2, a1);
    var jy = List.det3(poi, b2, a2);

    var sqj = CSNumber.sqrt(CSNumber.mult(jy, jx));
    var sqi = CSNumber.sqrt(CSNumber.mult(iy, ix));

    var mui = General.mult(a1, sqj);
    var tauj = General.mult(a2, sqi);

    var out1 = List.add(mui, tauj);
    var out2 = List.sub(mui, tauj);

    return [out1, out2];
};

geoOps.ConicInSquare = {};
geoOps.ConicInSquare.kind = "C";
geoOps.ConicInSquare.signature = ["P", "P", "P", "P"];
geoOps.ConicInSquare.updatePosition = function(el) {
    var A = csgeo.csnames[(el.args[0])].homog;
    var B = csgeo.csnames[(el.args[1])].homog;
    var C = csgeo.csnames[(el.args[2])].homog;
    var D = csgeo.csnames[(el.args[3])].homog;
    // Compute projective transformation from basis to given points (A, B, C, D)
    var m1 = eval_helper.basismap(A, B, C, D);
    // Compute projective transformation from basis to the corners of a square
    // tangent to a unit circle combined with applying this to the unit circle
    // matrix. The pre-computed constant result scaled by 1/16 is created here.
    var o = CSNumber.one;
    var m2Tucm2 = geoOps._helper.buildConicMatrix([o, o, o, CSNumber.real(-3), o, o]);
    // Complete transformation using m1 and m2Tucm2
    var m1a = List.adjoint3(m1);
    var mC = List.productMM(List.productMM(List.transpose(m1a), m2Tucm2), m1a);
    mC = List.normalizeMax(mC);
    el.matrix = General.withUsage(mC, "Conic");
};

geoOps.ConicBy5lines = {};
geoOps.ConicBy5lines.kind = "C";
geoOps.ConicBy5lines.signature = ["L", "L", "L", "L", "L"];
geoOps.ConicBy5lines.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;
    var p = csgeo.csnames[(el.args[4])].homog;

    var erg_temp = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    var erg = List.adjoint3(erg_temp);
    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps.ConicFromPrincipalDirections = {};
geoOps.ConicFromPrincipalDirections.kind = "C";
geoOps.ConicFromPrincipalDirections.signature = ["P", "P", "P"];
geoOps.ConicFromPrincipalDirections.updatePosition = function(el) {
    var M = csgeo.csnames[(el.args[0])].homog;
    var P1 = csgeo.csnames[(el.args[1])].homog;
    var P2 = csgeo.csnames[(el.args[2])].homog;
    var P3 = geoOps._helper.pointReflection(M, P1);
    var P1M = List.cross(P1, M);
    // Extract perpendicular direction from line P1M
    var perpDirP1M = List.turnIntoCSList([P1M.value[0], P1M.value[1], CSNumber.zero]);
    // A pair of duplicate P1M lines serves as the first degenerate conic
    var vP1M = List.turnIntoCSList([P1M]);
    // The perpendicular lines to P1M through P1 and its antipodal P3 serve as the second
    var vPP1MTP1 = List.turnIntoCSList([List.cross(P1, perpDirP1M)]);
    var vPP1MTP3 = List.turnIntoCSList([List.cross(P3, perpDirP1M)]);
    el.matrix = geoOps._helper.conicFromTwoDegenerates(vP1M, vP1M, vPP1MTP1, vPP1MTP3, P2);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps.CircleBy3 = {};
geoOps.CircleBy3.kind = "C";
geoOps.CircleBy3.signature = ["P", "P", "P"];
geoOps.CircleBy3.updatePosition = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = List.ii;
    var d = List.jj;
    var p = csgeo.csnames[(el.args[2])].homog;

    var erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    el.matrix = List.normalizeMax(erg);
    el.matrix = General.withUsage(el.matrix, "Circle");

};

geoOps.ArcBy3 = {};
geoOps.ArcBy3.kind = "C";
geoOps.ArcBy3.signature = ["P", "P", "P"];
geoOps.ArcBy3.updatePosition = function(el) {
    geoOps.CircleBy3.updatePosition(el);
    el.startPoint = csgeo.csnames[(el.args[0])].homog;
    el.viaPoint = csgeo.csnames[(el.args[1])].homog;
    el.endPoint = csgeo.csnames[(el.args[2])].homog;
};
geoOps.ArcBy3.initialize = function(el) {
    el.startPoint = csgeo.csnames[(el.args[0])].homog;
    el.viaPoint = csgeo.csnames[(el.args[1])].homog;
    el.endPoint = csgeo.csnames[(el.args[2])].homog;
    el.isArc = true;
};

geoOps.PolarOfPoint = {};
geoOps.PolarOfPoint.kind = "L";
geoOps.PolarOfPoint.signature = ["P", "C"];
geoOps.PolarOfPoint.updatePosition = function(el) {
    var point = csgeo.csnames[(el.args[0])];
    var conic = csgeo.csnames[(el.args[1])];
    var homog = General.mult(conic.matrix, point.homog);
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Line");
};

geoOps.PolarOfLine = {};
geoOps.PolarOfLine.kind = "P";
geoOps.PolarOfLine.signature = ["L", "C"];
geoOps.PolarOfLine.updatePosition = function(el) {
    var line = csgeo.csnames[(el.args[0])];
    var conic = csgeo.csnames[(el.args[1])];
    var dualMatrix = List.adjoint3(conic.matrix);
    var homog = General.mult(dualMatrix, line.homog);
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Point");
};


geoOps.AngleBisector = {};
geoOps.AngleBisector.kind = "Ls";
geoOps.AngleBisector.signature = ["L", "L", "P"];
geoOps.AngleBisector.updatePosition = function(el) {
    var a = csgeo.csnames[el.args[0]].homog;
    var b = csgeo.csnames[el.args[1]].homog;
    var p = csgeo.csnames[el.args[2]].homog;
    var add = List.add;
    var sub = List.sub;
    var abs = List.abs;
    var cross = List.cross;
    var sm = List.scalmult;
    var nm = List.normalizeMax;
    var isAlmostZero = List._helper.isAlmostZero;
    var linfty = List.linfty;
    var na = sm(abs(cross(cross(linfty, b), linfty)), a);
    var nb = sm(abs(cross(cross(linfty, a), linfty)), b);
    var res1 = sub(na, nb);
    var res2 = add(na, nb);
    if (isAlmostZero(res1)) res1 = cross(cross(cross(linfty, res2), linfty), p);
    if (isAlmostZero(res2)) res2 = cross(cross(cross(linfty, res1), linfty), p);
    el.results = tracing2(nm(res1), nm(res2));
};
geoOps.AngleBisector.stateSize = tracing2.stateSize;

geoOps._helper.IntersectLC = function(l, c) {

    var N = CSNumber;
    var l1 = List.crossOperator(l);
    var l2 = List.transpose(l1);
    var s = General.mult(l2, General.mult(c, l1));

    var maxidx = List.maxIndex(l, CSNumber.abs2);
    var a11, a12, a21, a22, b;
    if (maxidx === 0) { // x is maximal
        a11 = s.value[1].value[1];
        a12 = s.value[1].value[2];
        a21 = s.value[2].value[1];
        a22 = s.value[2].value[2];
        b = l.value[0];
    } else if (maxidx === 1) { // y is maximal
        a11 = s.value[0].value[0];
        a12 = s.value[0].value[2];
        a21 = s.value[2].value[0];
        a22 = s.value[2].value[2];
        b = l.value[1];
    } else { // z is maximal
        a11 = s.value[0].value[0];
        a12 = s.value[0].value[1];
        a21 = s.value[1].value[0];
        a22 = s.value[1].value[1];
        b = l.value[2];
    }
    var alp = N.div(N.sqrt(N.sub(N.mult(a12, a21), N.mult(a11, a22))), b);
    var erg = List.add(s, List.scalmult(alp, l1));

    maxidx = List.maxIndex(erg, List.abs2);
    var erg1 = erg.value[maxidx];
    erg1 = List.normalizeMax(erg1);
    erg1 = General.withUsage(erg1, "Point");
    erg = List.transpose(erg);
    maxidx = List.maxIndex(erg, List.abs2);
    var erg2 = erg.value[maxidx];
    erg2 = List.normalizeMax(erg2);
    erg2 = General.withUsage(erg2, "Point");
    return [erg1, erg2];
};

geoOps.IntersectLC = {};
geoOps.IntersectLC.kind = "Ps";
geoOps.IntersectLC.signature = ["L", "C"];
geoOps.IntersectLC.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var c = csgeo.csnames[(el.args[1])].matrix;

    var erg = geoOps._helper.IntersectLC(l, c);
    var erg1 = erg[0];
    var erg2 = erg[1];
    el.results = tracing2(erg1, erg2);
};
geoOps.IntersectLC.stateSize = tracing2.stateSize;

geoOps.OtherIntersectionCL = {};
geoOps.OtherIntersectionCL.kind = "P";
geoOps.OtherIntersectionCL.signature = ["C", "L", "P"];
geoOps.OtherIntersectionCL.updatePosition = function(el) {
    var l = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[0])].matrix;
    var p = csgeo.csnames[(el.args[2])].homog;

    var erg = geoOps._helper.IntersectLC(l, c);
    var erg1 = erg[0];
    var erg2 = erg[1];
    var d1 = List.projectiveDistMinScal(erg1, p);
    var d2 = List.projectiveDistMinScal(erg2, p);
    if (d1 < d2) {
        el.homog = erg2;
    } else {
        el.homog = erg1;
    }
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");

};


geoOps.IntersectCirCir = {};
geoOps.IntersectCirCir.kind = "Ps";
geoOps.IntersectCirCir.signature = ["C", "C"];
geoOps.IntersectCirCir.updatePosition = function(el) {
    var c1 = csgeo.csnames[(el.args[0])].matrix;
    var c2 = csgeo.csnames[(el.args[1])].matrix;

    var ct1 = c2.value[0].value[0];
    var line1 = List.scalmult(ct1, c1.value[2]);
    var ct2 = c1.value[0].value[0];
    var line2 = List.scalmult(ct2, c2.value[2]);
    var ll = List.sub(line1, line2);
    ll = List.turnIntoCSList([
        ll.value[0], ll.value[1], CSNumber.realmult(0.5, ll.value[2])
    ]);
    ll = List.normalizeMax(ll);


    var erg = geoOps._helper.IntersectLC(ll, c1);
    var erg1 = erg[0];
    var erg2 = erg[1];
    el.results = tracing2(erg1, erg2);
};
geoOps.IntersectCirCir.stateSize = tracing2.stateSize;


geoOps.OtherIntersectionCC = {};
geoOps.OtherIntersectionCC.kind = "P";
geoOps.OtherIntersectionCC.signature = ["C", "C", "P"];
geoOps.OtherIntersectionCC.updatePosition = function(el) {
    var c1 = csgeo.csnames[(el.args[0])].matrix;
    var c2 = csgeo.csnames[(el.args[1])].matrix;
    var p = csgeo.csnames[(el.args[2])].homog;

    var ct1 = c2.value[0].value[0];
    var line1 = List.scalmult(ct1, c1.value[2]);
    var ct2 = c1.value[0].value[0];
    var line2 = List.scalmult(ct2, c2.value[2]);
    var ll = List.sub(line1, line2);
    ll = List.turnIntoCSList([
        ll.value[0], ll.value[1], CSNumber.realmult(0.5, ll.value[2])
    ]);
    ll = List.normalizeMax(ll);


    var erg = geoOps._helper.IntersectLC(ll, c1);
    var erg1 = erg[0];
    var erg2 = erg[1];
    var d1 = List.projectiveDistMinScal(erg1, p);
    var d2 = List.projectiveDistMinScal(erg2, p);
    if (d1 < d2) {
        el.homog = erg2;
    } else {
        el.homog = erg1;
    }
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");

};


geoOps._helper.IntersectConicConic = function(A, B) {
    var myeps = 1e-24;

    var A1 = A.value[0];
    var A2 = A.value[1];
    var A3 = A.value[2];
    var B1 = B.value[0];
    var B2 = B.value[1];
    var B3 = B.value[2];

    var c3 = List.det3(A1, A2, A3);
    var c2 = CSNumber.add(CSNumber.add(
        List.det3(A1, A2, B3), List.det3(A1, B2, A3)), List.det3(B1, A2, A3));
    var c1 = CSNumber.add(CSNumber.add(
        List.det3(A1, B2, B3), List.det3(B1, A2, B3)), List.det3(B1, B2, A3));
    var c0 = List.det3(B1, B2, B3);
    // det(a*A + b*B) = a^3*c3 + a^2*b*c2 + a*b^2*c1 + b^3*c0 = 0

    var Aabs2 = CSNumber.abs2(c3).value.real;
    var Babs2 = CSNumber.abs2(c0).value.real;
    if (Aabs2 < Babs2) {
        // ensure |c3| > |c0| so if only one is singular, it's B = (0*A + B)
        var tmp = A;
        A = B;
        B = tmp;

        tmp = c0;
        c0 = c3;
        c3 = tmp;

        tmp = c1;
        c1 = c2;
        c2 = tmp;

        tmp = Aabs2;
        Aabs2 = Babs2;
        Babs2 = tmp;
    }

    var CDeg1, CDeg2;
    if (Aabs2 < myeps) { // both are degenerate
        CDeg1 = A;
        CDeg2 = B;
    } else {
        // produce two DISTINCT degenerate Conics
        var sols = CSNumber.solveCubic(c3, c2, c1, c0);
        var d01 = CSNumber.abs2(CSNumber.sub(sols[0], sols[1])).value.real;
        var d02 = CSNumber.abs2(CSNumber.sub(sols[0], sols[2])).value.real;
        var d12 = CSNumber.abs2(CSNumber.sub(sols[1], sols[2])).value.real;
        var sol1, sol2;
        if (d01 > d02) {
            sol1 = sols[1];
            if (d01 > d12) { // d01 > {d02, d12}
                sol2 = sols[0];
            } else { // d12 >= d01 > d02
                sol2 = sols[2];
            }
        } else { // d02 >= d01
            sol1 = sols[2];
            if (d02 > d12) { // d02 >= {d01, d12}
                sol2 = sols[0];
            } else { // d12 >= d02 >= d01
                sol2 = sols[1];
            }
        }
        CDeg1 = List.add(List.scalmult(sol1, A), B);
        CDeg2 = List.add(List.scalmult(sol2, A), B);
    }
    var lines1 = geoOps._helper.splitDegenConic(CDeg1);
    var l11 = lines1[0];
    var l12 = lines1[1];

    var lines2 = geoOps._helper.splitDegenConic(CDeg2);
    var l21 = lines2[0];
    var l22 = lines2[1];

    var p1 = List.cross(l11, l21);
    var p2 = List.cross(l12, l21);
    var p3 = List.cross(l11, l22);
    var p4 = List.cross(l12, l22);

    p1 = List.normalizeMax(p1);
    p2 = List.normalizeMax(p2);
    p3 = List.normalizeMax(p3);
    p4 = List.normalizeMax(p4);

    p1 = General.withUsage(p1, "Point");
    p2 = General.withUsage(p2, "Point");
    p3 = General.withUsage(p3, "Point");
    p4 = General.withUsage(p4, "Point");

    return [p1, p2, p3, p4];
};

geoOps.IntersectConicConic = {};
geoOps.IntersectConicConic.kind = "Ps";
geoOps.IntersectConicConic.signature = ["C", "C"];
geoOps.IntersectConicConic.updatePosition = function(el) {
    var AA = csgeo.csnames[(el.args[0])].matrix;
    var BB = csgeo.csnames[(el.args[1])].matrix;

    var erg = geoOps._helper.IntersectConicConic(AA, BB);
    erg = tracing4(erg[0], erg[1], erg[2], erg[3]);
    el.results = erg;
    //    el.results = List.turnIntoCSList(erg);
};
geoOps.IntersectConicConic.stateSize = tracing4.stateSize;


geoOps.SelectP = {};
geoOps.SelectP.kind = "P";
geoOps.SelectP.signature = ["Ps"];
geoOps.SelectP.initialize = function(el) {
    if (el.index !== undefined)
        return el.index - 1;
    var set = csgeo.csnames[(el.args[0])].results.value;
    var pos = geoOps._helper.initializePoint(el);
    var d1 = List.projectiveDistMinScal(pos, set[0]);
    var best = 0;
    for (var i = 1; i < set.length; ++i) {
        var d2 = List.projectiveDistMinScal(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectP.updatePosition = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    el.homog = set.results.value[el.param];
};

geoOps.SelectL = {};
geoOps.SelectL.kind = "L";
geoOps.SelectL.signature = ["Ls"];
geoOps.SelectL.initialize = function(el) {
    if (el.index !== undefined)
        return el.index - 1;
    var set = csgeo.csnames[(el.args[0])].results.value;
    var pos = geoOps._helper.initializeLine(el);
    var d1 = List.projectiveDistMinScal(pos, set[0]);
    var best = 0;
    for (var i = 1; i < set.length; ++i) {
        var d2 = List.projectiveDistMinScal(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectL.updatePosition = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    el.homog = set.results.value[el.param];
    el.homog = General.withUsage(el.homog, "Line");
};

geoOps._helper.moebiusStep = function(a, b, c) {
    var add = CSNumber.add;
    var sub = CSNumber.sub;
    var mult = CSNumber.mult;
    var ax = a.value[0];
    var ay = a.value[1];
    var az = a.value[2];
    var bx = b.value[0];
    var by = b.value[1];
    var bz = b.value[2];
    var cx = c.value[0];
    var cy = c.value[1];
    var cz = c.value[2];
    /*
    Building the matrix [[ax + i*ay, az], [bx + i*by, bz]].transpose()
    using matrices to represent the complex numbers yields this:

        ⎛ ax -ay  bx -by⎞
    m = ⎜ ay  ax  by  bx⎟
        ⎜ az   0  bz   0⎟
        ⎝  0  az   0  bz⎠

    We want to solve that up to a scalar multiple for [cx + i*xy, cz]
    using the same representation.  We avoid inversion and use the 2×2
    adjoint. Since the adjoint of [[a,b],[c,d]] is [[d,-b],[-c,a]] we have

    ⎛ bz   0 -bx  by⎞ ⎛ cx -cy⎞   ⎛ bz*cx - bx*cz -bz*cy + by*cz⎞
    ⎜  0  bz -by -bx⎟ ⎜ cy  cx⎟ = ⎜ bz*cy - by*cz  bz*cx - bx*cz⎟
    ⎜-az   0  ax -ay⎟ ⎜ cz   0⎟   ⎜-az*cx + ax*cz  az*cy - ay*cz⎟
    ⎝  0 -az  ay  ax⎠ ⎝  0  cz⎠   ⎝-az*cy + ay*cz -az*cx + ax*cz⎠

    Let's save the first column of that.
    */
    var d1 = sub(mult(bz, cx), mult(bx, cz));
    var d2 = sub(mult(bz, cy), mult(by, cz));
    var d3 = sub(mult(ax, cz), mult(az, cx));
    var d4 = sub(mult(ay, cz), mult(az, cy));
    /*
    Now we turn that into a diagonal matrix, and multiply m with that.

    ⎛ ax -ay  bx -by⎞ ⎛ d1 -d2   0   0⎞
    ⎜ ay  ax  by  bx⎟ ⎜ d2  d1   0   0⎟ =
    ⎜ az   0  bz   0⎟ ⎜  0   0  d3 -d4⎟
    ⎝  0  az   0  bz⎠ ⎝  0   0  d4  d3⎠
      ⎛ ax*d1 - ay*d2 -ay*d1 - ax*d2  bx*d3 - by*d4 -by*d3 - bx*d4⎞
      ⎜ ay*d1 + ax*d2  ax*d1 - ay*d2  by*d3 + bx*d4  bx*d3 - by*d4⎟
      ⎜         az*d1         -az*d2          bz*d3         -bz*d4⎟
      ⎝         az*d2          az*d1          bz*d4          bz*d3⎠

    We return the first and third column of that. In essence these are
    the real and imaginary parts of the four entries of a 2×2 matrix.
    */
    return [
        sub(mult(ax, d1), mult(ay, d2)),
        add(mult(ay, d1), mult(ax, d2)),
        mult(az, d1),
        mult(az, d2),
        sub(mult(bx, d3), mult(by, d4)),
        add(mult(by, d3), mult(bx, d4)),
        mult(bz, d3),
        mult(bz, d4)
    ];
};

geoOps.TrMoebius = {};
geoOps.TrMoebius.kind = "Mt";
geoOps.TrMoebius.signature = ["P", "P", "P", "P", "P", "P"];
geoOps.TrMoebius.updatePosition = function(el) {
    var neg = CSNumber.neg;
    var A1 = (csgeo.csnames[el.args[0]]).homog;
    var A2 = (csgeo.csnames[el.args[2]]).homog;
    var A3 = (csgeo.csnames[el.args[4]]).homog;
    var A = geoOps._helper.moebiusStep(A1, A2, A3);
    var B1 = (csgeo.csnames[el.args[1]]).homog;
    var B2 = (csgeo.csnames[el.args[3]]).homog;
    var B3 = (csgeo.csnames[el.args[5]]).homog;
    var B = geoOps._helper.moebiusStep(B1, B2, B3);

    /*
    Now we conceptually want B * A.adjoint()

    ⎛ B0 -B1  B4 -B5⎞ ⎛ A6 -A7 -A4  A5⎞   ⎛ ar -ai  br -bi⎞
    ⎜ B1  B0  B5  B4⎟ ⎜ A7  A6 -A5 -A4⎟ = ⎜ ai  ar  bi  br⎟
    ⎜ B2 -B3  B6 -B7⎟ ⎜-A2  A3  A0 -A1⎟   ⎜ cr -ci  dr -di⎟
    ⎝ B3  B2  B7  B6⎠ ⎝-A3 -A2  A1  A0⎠   ⎝ ci  cr  di  dr⎠

    But since we only care about two columns of the result, it's
    enough to use two columns of the adjoint of A, namely the first
    and the third.
    */
    var mB = List.normalizeMax(List.matrix([
        [B[0], neg(B[1]), B[4], neg(B[5])],
        [B[1], B[0], B[5], B[4]],
        [B[2], neg(B[3]), B[6], neg(B[7])],
        [B[3], B[2], B[7], B[6]]
    ]));
    var mAa = List.normalizeMax(List.matrix([
        [A[6], neg(A[4])],
        [A[7], neg(A[5])],
        [neg(A[2]), A[0]],
        [neg(A[3]), A[1]]
    ]));
    var C = List.normalizeMax(List.productMM(mB, mAa));

    // Read from that the (doubly) complex matrix [[a, b], [c, d]]
    el.moebius = {
        anti: false,
        ar: C.value[0].value[0],
        ai: C.value[1].value[0],
        br: C.value[0].value[1],
        bi: C.value[1].value[1],
        cr: C.value[2].value[0],
        ci: C.value[3].value[0],
        dr: C.value[2].value[1],
        di: C.value[3].value[1]
    };
    geoOps._helper.moebiusPair(el);
};

geoOps._helper.moebiusPair = function(el) {
    /*
    Build two matrices with the interesting property that for pxy = px + i*py
    this essentially encodes a Möbius transformation including division:

                                ⎛Re((a*pxy + b*pz)*conj(c*pxy + d*pz))⎞
    cross(mat1 * p, mat2 * p) = ⎜Im((a*pxy + b*pz)*conj(c*pxy + d*pz))⎟
                                ⎝   (c*pxy + d*pz)*conj(c*pxy + d*pz) ⎠
    */
    var m = el.moebius;
    var neg = CSNumber.neg;
    var flip = m.anti ? neg : General.identity;
    el.mat1 = List.normalizeMax(List.matrix([
        [neg(m.cr), flip(m.ci), neg(m.dr)],
        [m.ci, flip(m.cr), m.di],
        [m.ar, neg(flip(m.ai)), m.br]
    ]));
    el.mat2 = List.normalizeMax(List.matrix([
        [neg(m.ci), neg(flip(m.cr)), neg(m.di)],
        [neg(m.cr), flip(m.ci), neg(m.dr)],
        [m.ai, flip(m.ar), m.bi]
    ]));
};

geoOps.TrInverseMoebius = {};
geoOps.TrInverseMoebius.kind = "Mt";
geoOps.TrInverseMoebius.signature = ["Mt"];
geoOps.TrInverseMoebius.updatePosition = function(el) {
    var m = csgeo.csnames[el.args[0]].moebius;
    var neg = CSNumber.neg;
    var flip = m.anti ? neg : General.identity;
    el.moebius = {
        anti: m.anti,
        ar: m.dr,
        ai: flip(m.di),
        br: neg(m.br),
        bi: neg(flip(m.bi)),
        cr: neg(m.cr),
        ci: neg(flip(m.ci)),
        dr: m.ar,
        di: flip(m.ai)
    };
    geoOps._helper.moebiusPair(el);
};

geoOps.TrMoebiusP = {};
geoOps.TrMoebiusP.kind = "P";
geoOps.TrMoebiusP.signature = ["Mt", "P"];
geoOps.TrMoebiusP.updatePosition = function(el) {
    var t = csgeo.csnames[(el.args[0])];
    var p = csgeo.csnames[(el.args[1])].homog;
    var l1 = List.productMV(t.mat1, p);
    var l2 = List.productMV(t.mat2, p);
    el.homog = List.normalizeMax(List.cross(l1, l2));
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps._helper.TrMoebiusP = function(p, Tr) {
    var l1 = List.productMV(Tr.mat1, p);
    var l2 = List.productMV(Tr.mat2, p);
    return List.normalizeMax(List.cross(l1, l2));
};

geoOps.TrMoebiusL = {};
geoOps.TrMoebiusL.kind = "C";
geoOps.TrMoebiusL.signature = ["Mt", "L"];
geoOps.TrMoebiusL.updatePosition = function(el) {
    var t = csgeo.csnames[(el.args[0])];
    var l = csgeo.csnames[(el.args[1])].homog;

    var getRandLine = function() {
        var rline = List.realVector([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
        return List.normalizeMax(rline);
    };

    var a1 = List.cross(getRandLine(), l);
    var a2 = List.cross(getRandLine(), l);
    var a3 = List.cross(getRandLine(), l);

    var b1 = geoOps._helper.TrMoebiusP(a1, t);
    var b2 = geoOps._helper.TrMoebiusP(a2, t);
    var b3 = geoOps._helper.TrMoebiusP(a3, t);

    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

geoOps.TrMoebiusS = {};
geoOps.TrMoebiusS.kind = "C";
geoOps.TrMoebiusS.signature = ["Mt", "S"];
geoOps.TrMoebiusS.updatePosition = function(el) {
    var tr = csgeo.csnames[(el.args[0])];
    var s = csgeo.csnames[(el.args[1])];

    var a1 = s.startpos;
    var a3 = s.endpos;
    var a2 = List.add(a1, a3);

    var b1 = geoOps._helper.TrMoebiusP(a1, tr);
    var b2 = geoOps._helper.TrMoebiusP(a2, tr);
    var b3 = geoOps._helper.TrMoebiusP(a3, tr);
    el.startPoint = b1;
    el.viaPoint = b2;
    el.endPoint = b3;

    el.isArc = true;
    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};


geoOps.TrMoebiusC = {};
geoOps.TrMoebiusC.kind = "C";
geoOps.TrMoebiusC.signature = ["Mt", "C"];
geoOps.TrMoebiusC.signatureConstraints = function(el) {
    return csgeo.csnames[el.args[1]].matrix.usage === "Circle";
};
geoOps.TrMoebiusC.updatePosition = function(el) {
    var t = csgeo.csnames[(el.args[0])];
    var cir = csgeo.csnames[(el.args[1])].matrix;

    var getRandLine = function() {
        var rline = List.realVector([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
        return List.normalizeMax(rline);
    };

    var pts1 = geoOps._helper.IntersectLC(getRandLine(), cir);
    var pts2 = geoOps._helper.IntersectLC(getRandLine(), cir);

    var a1 = pts1[0];
    var a2 = pts1[1];
    var a3 = pts2[1];

    var b1 = geoOps._helper.TrMoebiusP(a1, t);
    var b2 = geoOps._helper.TrMoebiusP(a2, t);
    var b3 = geoOps._helper.TrMoebiusP(a3, t);

    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

geoOps.TrMoebiusArc = {};
geoOps.TrMoebiusArc.kind = "C";
geoOps.TrMoebiusArc.signature = ["Mt", "C"];
geoOps.TrMoebiusArc.updatePosition = function(el) {
    var t = csgeo.csnames[(el.args[0])];
    var Arc = csgeo.csnames[(el.args[1])];

    var a1 = Arc.startPoint;
    var a2 = Arc.viaPoint;
    var a3 = Arc.endPoint;

    var b1 = geoOps._helper.TrMoebiusP(a1, t);
    var b2 = geoOps._helper.TrMoebiusP(a2, t);
    var b3 = geoOps._helper.TrMoebiusP(a3, t);
    el.startPoint = b1;
    el.viaPoint = b2;
    el.endPoint = b3;

    el.isArc = true;
    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

// Produces the transformation matrix and its dual
geoOps._helper.trBuildMatrix = function(el, oneStep) {
    var m0 = oneStep(0);
    var m1 = oneStep(1);
    var m = List.productMM(m1, List.adjoint3(m0));
    el.matrix = List.normalizeMax(m);
    m = List.transpose(List.productMM(m0, List.adjoint3(m1)));
    el.dualMatrix = List.normalizeMax(m);
};

// Define a projective transformation given four points and their images
geoOps.TrProjection = {};
geoOps.TrProjection.kind = "Tr";
geoOps.TrProjection.signature = ["P", "P", "P", "P", "P", "P", "P", "P"];
geoOps.TrProjection.updatePosition = function(el) {
    geoOps._helper.trBuildMatrix(el, function(offset) {
        return eval_helper.basismap(
            csgeo.csnames[el.args[0 + offset]].homog,
            csgeo.csnames[el.args[2 + offset]].homog,
            csgeo.csnames[el.args[4 + offset]].homog,
            csgeo.csnames[el.args[6 + offset]].homog
        );
    });
};

// Define an affine transformation given three points and their images
// see https://github.com/CindyJS/CindyJS/pull/148 and
// https://gist.github.com/elkins0/f5a98a5ae98b8a8c7571
// https://github.com/CindyJS/CindyJS/files/65335/TrAffine.pdf
geoOps.TrAffine = {};
geoOps.TrAffine.kind = "Tr";
geoOps.TrAffine.signature = ["P", "P", "P", "P", "P", "P"];
geoOps.TrAffine.updatePosition = function(el) {
    var mult = CSNumber.mult;
    var sm = List.scalmult;
    var mat = List.turnIntoCSList;
    var t = List.transpose;
    var nm = List.normalizeMax;
    var mm = List.productMM;
    var adj = List.adjoint3;
    // Get the set of points
    var ps1 = mat([
        csgeo.csnames[el.args[0]].homog,
        csgeo.csnames[el.args[2]].homog,
        csgeo.csnames[el.args[4]].homog
    ]);
    // Get the set of thier images
    var ps2 = mat([
        csgeo.csnames[el.args[1]].homog,
        csgeo.csnames[el.args[3]].homog,
        csgeo.csnames[el.args[5]].homog
    ]);
    var ps1t = t(ps1);
    var ps2t = t(ps2);
    var z1 = ps1t.value[2].value;
    var z2 = ps2t.value[2].value;
    var u = [mult(z1[0], z2[2]), mult(z1[1], z2[0]), mult(z1[2], z2[1])];
    var w = adj(ps1t).value;
    el.matrix = nm(mm(ps2t, mat([
        sm(mult(u[0], z2[1]), w[0]),
        sm(mult(u[1], z2[2]), w[1]),
        sm(mult(u[2], z2[0]), w[2])
    ])));
    w = ps1.value;
    el.dualMatrix = nm(mm(adj(ps2), mat([
        sm(mult(z1[2], u[1]), w[0]),
        sm(mult(z1[0], u[2]), w[1]),
        sm(mult(z1[1], u[0]), w[2])
    ])));
};

// Define a similarity transformation given two points and their images
geoOps.TrSimilarity = {};
geoOps.TrSimilarity.kind = "Tr";
geoOps.TrSimilarity.signature = ["P", "P", "P", "P"];
geoOps.TrSimilarity.updatePosition = function(el) {
    geoOps._helper.trBuildMatrix(el, function(offset) {
        var a = csgeo.csnames[el.args[0 + offset]].homog,
            b = csgeo.csnames[el.args[2 + offset]].homog;
        return eval_helper.basismap(a, b, List.ii, List.jj);
    });
};

// Define a translation transformation given one point and its image
geoOps.TrTranslation = {};
geoOps.TrTranslation.kind = "Tr";
geoOps.TrTranslation.signature = ["P", "P"];
geoOps.TrTranslation.updatePosition = function(el) {
    /*
        Build this matrix when a is [aX, aY, aZ] and  b is [bX, bY, bZ]:
            ⎛aZ*bZ   0    aZ*bX-bZ*aX⎞
        m = ⎜  0   aZ*bZ  aZ*bY-bZ*aY⎟
            ⎝  0     0       aZ*bZ   ⎠
    */
    var a = csgeo.csnames[el.args[0]].homog,
        b = csgeo.csnames[el.args[1]].homog,
        c = List.cross(a, b).value,
        n = CSNumber.mult(a.value[2], b.value[2]),
        mat = List.turnIntoCSList,
        neg = CSNumber.neg,
        zero = CSNumber.zero,
        m = mat([
            mat([n, zero, c[1]]),
            mat([zero, n, neg(c[0])]),
            mat([zero, zero, n])
        ]);
    m = List.normalizeMax(m);
    el.matrix = m;
    // Transpose using already normalized values, negate diagonal values
    // Matrix may end up scaled by -1 if n was the max value
    n = neg(m.value[0].value[0]);
    m = mat([
        mat([n, zero, zero]),
        mat([zero, n, zero]),
        mat([m.value[0].value[2], m.value[1].value[2], n])
    ]);
    el.dualMatrix = m;
};

// Define a reflective transformation given a point
geoOps.TrReflectionP = {};
geoOps.TrReflectionP.kind = "Tr";
geoOps.TrReflectionP.signature = ["P"];
geoOps.TrReflectionP.updatePosition = function(el) {
    /*
        Build this matrix when p is [x, y, z]:

        ⎛-z/2  0   x ⎞
        ⎜  0 -z/2  y ⎟
        ⎝  0   0  z/2⎠
    */
    var p = csgeo.csnames[el.args[0]].homog.value;
    var n = CSNumber.realmult(-0.5, p[2]);
    var zero = CSNumber.zero;
    var m = List.turnIntoCSList([
        List.turnIntoCSList([n, zero, p[0]]),
        List.turnIntoCSList([zero, n, p[1]]),
        List.turnIntoCSList([zero, zero, CSNumber.neg(n)])
    ]);
    m = List.normalizeMax(m);
    el.matrix = m;
    el.dualMatrix = List.transpose(m);
};

// Define a reflective transformation given a line
geoOps.TrReflectionL = {};
geoOps.TrReflectionL.kind = "Tr";
geoOps.TrReflectionL.signature = ["L"];
geoOps.TrReflectionL.updatePosition = function(el) {
    /*
        Build this matrix when l is [x, y, z]:

        ⎛(x^2-y^2)/2     x*y         x*z    ⎞
        ⎜    x*y    -(x^2-y^2)/2     y*z    ⎟
        ⎝     0           0     -(x^2+y^2)/2⎠
    */
    var mult = CSNumber.mult,
        realmult = CSNumber.realmult,
        zero = CSNumber.zero,
        l = csgeo.csnames[el.args[0]].homog.value,
        x = l[0],
        y = l[1],
        z = l[2],
        xx = mult(x, x),
        yy = mult(y, y),
        pm = realmult(-0.5, CSNumber.sub(xx, yy)),
        txy = mult(x, y),
        m = List.turnIntoCSList([
            List.turnIntoCSList([CSNumber.neg(pm), txy, mult(x, z)]),
            List.turnIntoCSList([txy, pm, mult(y, z)]),
            List.turnIntoCSList([zero, zero, realmult(-0.5, CSNumber.add(xx, yy))])
        ]);
    m = List.normalizeMax(m);
    el.matrix = m;
    el.dualMatrix = List.transpose(m);
};

// Define a reflective transformation given a segment
geoOps.TrReflectionS = {};
geoOps.TrReflectionS.kind = "Tr";
geoOps.TrReflectionS.signature = ["S"];
geoOps.TrReflectionS.updatePosition = geoOps.TrReflectionL.updatePosition;

// Define a reflective transformation given a circle (not a general conic)
geoOps.TrReflectionC = {};
geoOps.TrReflectionC.kind = "Mt";
geoOps.TrReflectionC.signature = ["C"];
geoOps.TrReflectionC.signatureConstraints = function(el) {
    return csgeo.csnames[el.args[0]].matrix.usage === "Circle";
};
geoOps.TrReflectionC.updatePosition = function(el) {
    var m = csgeo.csnames[(el.args[0])].matrix;
    // m = [[a, 0, b], [0, a, c], [b, c, d]]
    var a = m.value[0].value[0];
    var b = m.value[0].value[2];
    var c = m.value[1].value[2];
    var d = m.value[2].value[2];
    var neg = CSNumber.neg;
    el.moebius = {
        anti: true,
        ar: b,
        ai: c,
        br: d,
        bi: CSNumber.zero,
        cr: neg(a),
        ci: CSNumber.zero,
        dr: neg(b),
        di: c
    };
    geoOps._helper.moebiusPair(el);
};

geoOps.TrInverse = {};
geoOps.TrInverse.kind = "Tr";
geoOps.TrInverse.signature = ["Tr"];
geoOps.TrInverse.updatePosition = function(el) {
    var tr = csgeo.csnames[(el.args[0])];
    var m = tr.matrix;
    el.dualMatrix = List.transpose(tr.matrix);
    el.matrix = List.transpose(tr.dualMatrix);
};

// Apply a projective transformation to a conic
geoOps.TransformC = {};
geoOps.TransformC.kind = "C";
geoOps.TransformC.signature = ["Tr", "C"];
geoOps.TransformC.updatePosition = function(el) {
    var d = csgeo.csnames[(el.args[0])].dualMatrix;
    var c = csgeo.csnames[(el.args[1])].matrix;
    var m = List.productMM(List.productMM(d, c), List.transpose(d));
    m = List.normalizeMax(m);
    el.matrix = General.withUsage(m, "Conic");
};


geoOps.TransformArc = {};
geoOps.TransformArc.kind = "C";
geoOps.TransformArc.signature = ["Tr", "C"];
geoOps.TransformArc.updatePosition = function(el) {
    var t = csgeo.csnames[(el.args[0])].matrix;
    var Arc = csgeo.csnames[(el.args[1])];

    var a1 = Arc.startPoint;
    var a2 = Arc.viaPoint;
    var a3 = Arc.endPoint;

    var b1 = List.normalizeMax(List.productMV(t, a1)),
        b2 = List.normalizeMax(List.productMV(t, a2)),
        b3 = List.normalizeMax(List.productMV(t, a3));

    el.startPoint = b1;
    el.viaPoint = b2;
    el.endPoint = b3;

    el.isArc = true;
    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

// Apply a projective transformation to a point
geoOps.TransformP = {};
geoOps.TransformP.kind = "P";
geoOps.TransformP.signature = ["Tr", "P"];
geoOps.TransformP.updatePosition = function(el) {
    var m = csgeo.csnames[(el.args[0])].matrix;
    var p = csgeo.csnames[(el.args[1])].homog;
    el.homog = List.normalizeMax(List.productMV(m, p));
    el.homog = General.withUsage(el.homog, "Point");
};

// Apply a projective transformation to a line
geoOps.TransformL = {};
geoOps.TransformL.kind = "L";
geoOps.TransformL.signature = ["Tr", "L"];
geoOps.TransformL.updatePosition = function(el) {
    var m = csgeo.csnames[(el.args[0])].dualMatrix;
    var l = csgeo.csnames[(el.args[1])].homog;
    el.homog = List.normalizeMax(List.productMV(m, l));
    el.homog = General.withUsage(el.homog, "Line");
};

// Apply a projective transformation to a line segment
geoOps.TransformS = {};
geoOps.TransformS.kind = "S";
geoOps.TransformS.signature = ["Tr", "S"];
geoOps.TransformS.updatePosition = function(el) {
    var tr = csgeo.csnames[(el.args[0])];
    var s = csgeo.csnames[(el.args[1])];
    geoOps.Segment.setSegmentPos(el,
        List.productMV(tr.dualMatrix, s.homog),
        List.productMV(tr.matrix, s.startpos),
        List.productMV(tr.matrix, s.endpos)
    );
};

geoOps.TransformPolygon = {};
geoOps.TransformPolygon.kind = "Poly";
geoOps.TransformPolygon.signature = ["Tr", "Poly"];
geoOps.TransformPolygon.updatePosition = function(el) {
    var m = csgeo.csnames[(el.args[0])].matrix;
    var ps = csgeo.csnames[(el.args[1])].vertices.value;
    el.vertices = List.turnIntoCSList(ps.map(function(p) {
        var homog = List.normalizeMax(List.productMV(m, p));
        homog = General.withUsage(homog, "Point");
        return homog;
    }));
};

geoOps._helper.pointReflection = function(center, point) {
    // If center is at infinity, the result will be center unless point
    // is also at infinity, then the result is the ideal point [0, 0, 0].
    return List.normalizeMax(List.sub(
        List.scalmult(CSNumber.realmult(2, point.value[2]), center),
        List.scalmult(center.value[2], point)));
};

geoOps._helper.conicOtherIntersection = function(conic, a, b) {
    // With A a point on conic M, find the point on
    // line AB which also lies on that conic.
    // return BMB*A - 2*AMB*B
    var mb = List.productMV(conic, b);
    var bmb = List.scalproduct(b, mb);
    var amb = List.scalproduct(a, mb);
    var amb2 = CSNumber.realmult(-2, amb);
    var bmba = List.scalmult(bmb, a);
    var amb2b = List.scalmult(amb2, b);
    var res = List.add(bmba, amb2b);
    res = List.normalizeMax(res);
    return res;
};

geoOps.Dist = {};
geoOps.Dist.kind = "V";
geoOps.Dist.signature = ["P", "P"];
geoOps.Dist.updatePosition = function(el) {
    var a = csgeo.csnames[el.args[0]].homog;
    var b = csgeo.csnames[el.args[1]].homog;
    el.value = List.abs(List.sub(List.normalizeZ(a), List.normalizeZ(b)));
};

geoOps.Angle = {};
geoOps.Angle.kind = "V";
geoOps.Angle.signature = ["L", "L", "P"];
geoOps.Angle.initialize = function(el) {
    if (el.angle === undefined)
        el.angle = 0.5 * Math.PI;
    putStateComplexNumber(CSNumber._helper.input(el.angle));
};
geoOps.Angle.updatePosition = function(el) {
    var a = csgeo.csnames[el.args[0]].homog;
    var b = csgeo.csnames[el.args[1]].homog;
    var p = csgeo.csnames[el.args[2]].homog;
    var ap = List.cross(a, List.linfty);
    var bp = List.cross(b, List.linfty);
    var cr = List.crossratio3(ap, bp, List.ii, List.jj, p);
    var ang = CSNumber.mult(CSNumber.complex(0, 0.5), CSNumber.log(cr));
    var prev = getStateComplexNumber();
    var diff = (prev.value.real - ang.value.real) / Math.PI;
    var winding = Math.round(diff);
    if (!tracingInitial && Math.abs(winding - diff) > 1e-2)
        requestRefinement();
    ang = CSNumber.complex(winding * Math.PI + ang.value.real, ang.value.imag);
    putStateComplexNumber(ang);
    el.value = General.withUsage(ang, "Angle");
};
geoOps.Angle.stateSize = 2;

geoOps.Text = {};
geoOps.Text.kind = "Text";
geoOps.Text.signature = "**";
geoOps.Text.isMovable = true;
geoOps.Text.updatePosition = noop;
geoOps.Text.initialize = function(el) {
    el.text = String(el.text);
    if (el.pos) el.homog = geoOps._helper.initializePoint(el);
    if (el.dock) {
        if (el.dock.offset && el.dock.offset.length === 2)
            el.dock.offset = List.realVector([+el.dock.offset[0], +el.dock.offset[1]]);
        else
            el.dock.offset = List.realVector([0, 0]);
    }
};
geoOps.Text.getParamForInput = function(el, pos, type) {
    return geoOps.Free.getParamForInput(el, pos, type);
};
geoOps.Text.getParamFromState = function(el) {
    return el.homog;
};
geoOps.Text.putParamToState = function(el, param) {
    el.homog = param;
};

geoOps.Calculation = {};
geoOps.Calculation.kind = "Text";
geoOps.Calculation.signature = "**";
geoOps.Calculation.isMovable = true;
geoOps.Calculation.updatePosition = noop;
geoOps.Calculation.initialize = function(el) {
    geoOps.Text.initialize(el);
    el.calculation = analyse(el.text);
};
geoOps.Calculation.getText = function(el) {
    return niceprint(evaluate(el.calculation));
};
geoOps.Calculation.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Calculation.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Calculation.putParamToState = geoOps.Text.putParamToState;

geoOps.Equation = {};
geoOps.Equation.kind = "Text";
geoOps.Equation.isMovable = true;
geoOps.Equation.signature = "**";
geoOps.Equation.updatePosition = noop;
geoOps.Equation.initialize = function(el) {
    geoOps.Text.initialize(el);
    el.calculation = analyse(el.text);
};
geoOps.Equation.getText = function(el) {
    return el.text + " = " + niceprint(evaluate(el.calculation));
};
geoOps.Equation.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Equation.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Equation.putParamToState = geoOps.Text.putParamToState;

geoOps.Evaluate = {};
geoOps.Evaluate.kind = "Text";
geoOps.Evaluate.isMovable = true;
geoOps.Evaluate.signature = "**";
geoOps.Evaluate.updatePosition = noop;
geoOps.Evaluate.initialize = function(el) {
    geoOps.Text.initialize(el);
    el.calculation = analyse(el.text);
};
geoOps.Evaluate.getText = function(el) {
    evaluate(el.calculation); // ugly: side effects in draw
    return el.text;
};
geoOps.Evaluate.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Evaluate.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Evaluate.putParamToState = geoOps.Text.putParamToState;

geoOps.Plot = {};
geoOps.Plot.kind = "Text";
geoOps.Plot.isMovable = true;
geoOps.Plot.signature = "**";
geoOps.Plot.updatePosition = noop;
geoOps.Plot.initialize = function(el) {
    geoOps.Text.initialize(el);
    // Parenthesize expression to avoid modifier injection
    el.calculation = analyse("plot((" + el.text + "))");
};
geoOps.Plot.getText = function(el) {
    evaluate(el.calculation);
    return el.text;
};
geoOps.Plot.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Plot.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Plot.putParamToState = geoOps.Text.putParamToState;

function commonButton(el, event, button) {
    var outer = document.createElement("div");
    var img = document.createElement("img");
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUh" +
        "EUgAAAAEAAAPoCAQAAAC1v1zVAAAAGklEQVR42u3BMQEAAA" +
        "DCoPVPbQ0PoAAAgHcDC7gAAVI8ZnwAAAAASUVORK5CYII=";
    outer.className = "CindyJS-baseline";
    outer.appendChild(img);
    var inlinebox = document.createElement("div");
    inlinebox.className = "CindyJS-button";
    outer.appendChild(inlinebox);
    for (var i = 2; i < arguments.length; ++i)
        inlinebox.appendChild(arguments[i]);
    canvas.parentNode.appendChild(outer);
    el.html = arguments[arguments.length - 1];
    if (!isFiniteNumber(el.fillalpha))
        el.fillalpha = 1.0;
    if (el.fillcolor) {
        el.html.style.backgroundColor =
            Render2D.makeColor(el.fillcolor, el.fillalpha);
    }
    var onEvent = scheduleUpdate;
    if (el.script) {
        var code = analyse(el.script);
        onEvent = function() {
            evaluate(code);
            scheduleUpdate();
        };
    }
    button.addEventListener(event, onEvent);
    if (!instanceInvocationArguments.keylistener &&
        (cscompiled.keydown || cscompiled.keyup || cscompiled.keytyped)) {
        button.addEventListener("keydown", function(e) {
            if (e.keyCode === 9 /* tab */ ) return;
            cs_keydown(e);
        });
        button.addEventListener("keyup", function(e) {
            cs_keyup(e);
        });
        button.addEventListener("keypress", function(e) {
            if (e.keyCode === 9 /* tab */ ) return;
            cs_keytyped(e);
        });
    }
    geoOps.Text.initialize(el);
}

geoOps.Button = {};
geoOps.Button.kind = "Text";
geoOps.Button.signature = "**";
geoOps.Button.isMovable = true; // not using mouse, only via scripts
geoOps.Button.updatePosition = noop;
geoOps.Button.initialize = function(el) {
    var button = document.createElement("button");
    commonButton(el, "click", button);
};
geoOps.Button.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Button.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Button.putParamToState = geoOps.Text.putParamToState;
geoOps.Button.set_fillcolor = function(el, value) {
    if (List._helper.isNumberVecN(value, 3)) {
        el.fillcolor = value.value.map(function(i) {
            return i.value.real;
        });
        el.html.style.backgroundColor =
            Render2D.makeColor(el.fillcolor, el.fillalpha);
    }
};

geoOps.ToggleButton = {};
geoOps.ToggleButton.kind = "Text";
geoOps.ToggleButton.signature = "**";
geoOps.ToggleButton.isMovable = true; // not using mouse, only via scripts
geoOps.ToggleButton.updatePosition = noop;
geoOps.ToggleButton.initialize = function(el) {
    var id = generateId();
    var checkbox = document.createElement("input");
    var label = document.createElement("label");
    checkbox.setAttribute("id", id);
    label.setAttribute("for", id);
    checkbox.setAttribute("type", "checkbox");
    if (el.pressed)
        checkbox.checked = true;
    el.checkbox = checkbox;
    commonButton(el, "change", checkbox, label);
};
geoOps.ToggleButton.getParamForInput = geoOps.Text.getParamForInput;
geoOps.ToggleButton.getParamFromState = geoOps.Text.getParamFromState;
geoOps.ToggleButton.putParamToState = geoOps.Text.putParamToState;
geoOps.ToggleButton.set_fillcolor = geoOps.Button.set_fillcolor;

geoOps.EditableText = {};
geoOps.EditableText.kind = "Text";
geoOps.EditableText.isMovable = true; // not using mouse, only via scripts
geoOps.EditableText.signature = [];
geoOps.EditableText.updatePosition = noop;
geoOps.EditableText.initialize = function(el) {
    var textbox = document.createElement("input");
    textbox.setAttribute("type", "text");
    textbox.className = "CindyJS-editabletext";
    if (isFiniteNumber(el.minwidth))
        textbox.style.width = (el.minwidth - 3) + "px";
    if (typeof el.text === "string")
        textbox.value = el.text;
    textbox.addEventListener("keydown", function(event) {
        if (event.keyCode === 13)
            textbox.blur();
    });
    commonButton(el, "change", textbox);
};
geoOps.EditableText.getText = function(el) {
    return false;
};
geoOps.EditableText.getParamForInput = geoOps.Text.getParamForInput;
geoOps.EditableText.getParamFromState = geoOps.Text.getParamFromState;
geoOps.EditableText.putParamToState = geoOps.Text.putParamToState;
geoOps.EditableText.set_fillcolor = geoOps.Button.set_fillcolor;
geoOps.EditableText.get_currenttext = function(el) {
    return General.string(String(el.html.value));
};
geoOps.EditableText.set_currenttext = function(el, value) {
    el.html.value = niceprint(value);
};
geoOps.EditableText.get_text = geoOps.EditableText.get_currenttext;
geoOps.EditableText.set_text = geoOps.EditableText.set_currenttext;

function noop() {}

geoOps._helper.initializePoint = function(el) {
    var sx = 0;
    var sy = 0;
    var sz = 0;
    if (el.pos) {
        if (el.pos.ctype === "list" && List.isNumberVector(el.pos)) {
            return el.pos;
        }
        if (el.pos.length === 2) {
            sx = el.pos[0];
            sy = el.pos[1];
            sz = 1;
        }
        if (el.pos.length === 3) {
            sx = el.pos[0];
            sy = el.pos[1];
            sz = el.pos[2];
        }
    }
    var pos = List.turnIntoCSList([
        CSNumber._helper.input(sx),
        CSNumber._helper.input(sy),
        CSNumber._helper.input(sz)
    ]);
    pos = List.normalizeMax(pos);
    return pos;
};

geoOps._helper.initializeLine = function(el) {
    var sx = 0;
    var sy = 0;
    var sz = 0;
    if (el.pos) {
        if (el.pos.ctype === "list" && List.isNumberVector(el.pos)) {
            return el.pos;
        }
        if (el.pos.length === 3) {
            sx = el.pos[0];
            sy = el.pos[1];
            sz = el.pos[2];
        }
    }
    var pos = List.turnIntoCSList([
        CSNumber._helper.input(sx),
        CSNumber._helper.input(sy),
        CSNumber._helper.input(sz)
    ]);
    pos = List.normalizeMax(pos);
    return pos;
};


geoOps.Poly = {};
geoOps.Poly.kind = "Poly";
geoOps.Poly.signature = "P*";
geoOps.Poly.updatePosition = function(el) {
    el.vertices = List.turnIntoCSList(el.args.map(function(x) {
        return csgeo.csnames[x].homog;
    }));
};


var geoAliases = {
    "CircleByRadius": "CircleMr",
    "IntersectionCircleCircle": "IntersectCirCir",
    "IntersectionConicConic": "IntersectConicConic",
    "FreePoint": "Free",
    "Orthogonal": "Perp",
    "Parallel": "Para",
    "Pole": "PolarOfLine",
    "Polar": "PolarOfPoint",
    "Arc": "ArcBy3",
    "EuclideanMid": "Mid",
    "AngularBisector": "AngleBisector",
    "TransformConic": "TransformC",
    "TransformSegment": "TransformS",
    "TrMoebiusSegment": "TrMoebiusS",
    "ReflectCC": "TrMoebiusC",
    "ReflectCL": "TrMoebiusL",
    "ReflectCP": "TrMoebiusP",
    "ReflectCArc": "TrMoebiusArc",
    "ReflectCS": "TrMoebiusS",
    "TrMoebiusCircle": "TrMoebiusC"
};

var geoMacros = {};

/* Note: currently the expansion of a macro is simply included in the
 * gslp.  This means that objects from the expansion will currently
 * end up in the allpoints() resp. alllines() results.  It might make
 * sense to actively excude elements from these by setting some flag,
 * but that hasn't been implemented yet.
 */

geoMacros.CircleMFixedr = function(el) {
    el.pinned = true;
    el.type = "CircleMr";
    return [el];
};

geoMacros.CircleByFixedRadius = function(el) {
    el.pinned = true;
    el.type = "CircleMr";
    return [el];
};

geoMacros.IntersectionConicLine = function(el) {
    el.args = [el.args[1], el.args[0]];
    el.type = "IntersectLC";
    return [el];
};

geoMacros.angleBisector = function(el) {
    var point = {
        name: el.name + "_Intersection",
        type: "Meet",
        args: el.args,
        visible: false
    };
    el.type = "AngleBisector";
    el.args = [el.args[0], el.args[1], point.name];
    return [point, el];
};

geoMacros.Transform = function(el) {
    var arg = csgeo.csnames[el.args[1]];
    var tr = csgeo.csnames[el.args[0]];
    // workaround for Arcs since we treat them as circles
    var akind = arg.isArc ? "Arc" : arg.kind;

    var map = {
        Tr: "Transform",
        Mt: "TrMoebius"
    };
    var op = map[tr.kind] + akind;
    if (geoOps.hasOwnProperty(op)) {
        el.type = op;
        return [el];
    } else {
        console.log(op + " not implemented yet");
        return [];
    }
};

geoMacros.TrReflection = function(el) {
    var op = "TrReflection" + csgeo.csnames[el.args[0]].kind;
    if (geoOps.hasOwnProperty(op)) {
        el.type = op;
        return [el];
    } else {
        console.log(op + " not implemented yet");
        return [];
    }
};
