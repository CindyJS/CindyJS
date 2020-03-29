const geoOps = {};
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
 * Poly - Polygon
 * IFS  - Iterated Function System
 */


////The RandomLine RandomPoint operators are used by Cinderellas
////Original Mirror Operations

geoOps.RandomLine = {};
geoOps.RandomLine.kind = "L";
geoOps.RandomLine.signature = [];
geoOps.RandomLine.updatePosition = el => {
    el.homog = List.realVector([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

geoOps._helper.getRandMove = el => {
    const l = el.homog;
    const rand = List.getRandComplexVec3(-0.05, 0.05);
    const move = List.add(l, rand);

    return {
        type: "homog",
        value: move
    };
};

geoOps._helper.getRandPointMove = el => {
    const oldpos = List.normalizeMax(el.homog);
    let oz = oldpos.value[2];
    const ozabs = CSNumber.abs(oz).value.real;

    let rZ = CSNumber.real(0);
    // far points
    if (ozabs < CSNumber.eps) {
        rZ = CSNumber.getRandComplex(-0.05, 0.05);
        oz = CSNumber.real(1);
    }

    const rvect = List.turnIntoCSList([CSNumber.getRandComplex(-0.1, 0.1), CSNumber.getRandComplex(-0.1, 0.1), rZ]);

    let move = List.scalmult(oz, rvect);

    move = List.add(oldpos, move);
    return {
        type: "homog",
        value: move
    };
};


geoOps.FreeLine = {};
geoOps.FreeLine.kind = "L";
geoOps.FreeLine.signature = [];
geoOps.FreeLine.isMovable = true;
geoOps.FreeLine.initialize = el => {
    const pos = geoOps._helper.initializeLine(el);
    putStateComplexVector(pos);
};
geoOps.FreeLine.getParamForInput = (el, pos, type) => {
    let homog;
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
geoOps.FreeLine.getParamFromState = el => getStateComplexVector(3);
geoOps.FreeLine.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.FreeLine.updatePosition = el => {
    const param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Line");
};
geoOps.FreeLine.getRandomMove = geoOps._helper.getRandMove;
geoOps.FreeLine.stateSize = 6;


geoOps.RandomPoint = {};
geoOps.RandomPoint.kind = "P";
geoOps.RandomPoint.signature = [];
geoOps.RandomPoint.updatePosition = el => {
    el.homog = List.realVector([100 * Math.random(), 100 * Math.random(), 100 * Math.random()]);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

///////////////////////////


geoOps.Join = {};
geoOps.Join.kind = "L";
geoOps.Join.signature = ["P", "P"];
geoOps.Join.updatePosition = el => {
    const el1 = csgeo.csnames[(el.args[0])];
    const el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Segment = {};
geoOps.Segment.kind = "S";
geoOps.Segment.signature = ["P", "P"];
geoOps.Segment.updatePosition = el => {
    const el1 = csgeo.csnames[(el.args[0])];
    const el2 = csgeo.csnames[(el.args[1])];
    geoOps.Segment.setSegmentPos(el,
        List.cross(el1.homog, el2.homog),
        List.scalmult(el2.homog.value[2], el1.homog),
        List.scalmult(el1.homog.value[2], el2.homog)
    );
};
geoOps.Segment.setSegmentPos = (el, line, start, end) => {
    line = List.normalizeMax(line);
    el.homog = General.withUsage(line, "Line");
    let startend = List.turnIntoCSList([start, end]);
    startend = List.normalizeMax(startend); // Normalize together!
    el.startpos = startend.value[0];
    el.endpos = startend.value[1];
    // So  midpoint = startpos + endpos
    // and farpoint = startpos - endpos
};


geoOps.Meet = {};
geoOps.Meet.kind = "P";
geoOps.Meet.signature = ["L", "L"];
geoOps.Meet.updatePosition = el => {
    const el1 = csgeo.csnames[(el.args[0])];
    const el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps.Meet.visiblecheck = el => {
    let visible = true;
    const el1 = csgeo.csnames[(el.args[0])];
    const el2 = csgeo.csnames[(el.args[1])];

    if (el1.kind === "S") {
        visible = onSegment(el, el1);
    }
    if (visible && el2.kind === "S") {
        visible = onSegment(el, el2);
    }
    el.isshowing = visible;
};

geoOps._helper.midpoint = (a, b) => List.normalizeMax(List.add(
    List.scalmult(b.value[2], a),
    List.scalmult(a.value[2], b)));

geoOps.Mid = {};
geoOps.Mid.kind = "P";
geoOps.Mid.signature = ["P", "P"];
geoOps.Mid.updatePosition = el => {
    const x = csgeo.csnames[(el.args[0])].homog;
    const y = csgeo.csnames[(el.args[1])].homog;
    const res = geoOps._helper.midpoint(x, y);
    el.homog = General.withUsage(res, "Point");
};


geoOps.Perp = {};
geoOps.Perp.kind = "L";
geoOps.Perp.signature = ["L", "P"];
geoOps.Perp.updatePosition = el => {
    const l = csgeo.csnames[(el.args[0])].homog;
    const p = csgeo.csnames[(el.args[1])].homog;
    const tt = List.turnIntoCSList([l.value[0], l.value[1], CSNumber.zero]);
    el.homog = List.cross(tt, p);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Para = {};
geoOps.Para.kind = "L";
geoOps.Para.signature = ["L", "P"];
geoOps.Para.updatePosition = el => {
    const l = csgeo.csnames[(el.args[0])].homog;
    const p = csgeo.csnames[(el.args[1])].homog;
    const inf = List.linfty;
    el.homog = List.cross(List.cross(inf, l), p);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

// Horizontal line through a point
geoOps.Horizontal = {};
geoOps.Horizontal.kind = "L";
geoOps.Horizontal.signature = ["P"];
geoOps.Horizontal.updatePosition = el => {
    const el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ex, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};

// Cinderella's freely movable HorizontalLine (Cinderella semantics)
geoOps.HorizontalLine = {};
geoOps.HorizontalLine.kind = "L";
geoOps.HorizontalLine.signature = [];
geoOps.HorizontalLine.isMovable = true;
geoOps.HorizontalLine.initialize = el => {
    let pos = geoOps._helper.initializeLine(el);
    pos = List.turnIntoCSList([CSNumber.zero, pos.value[1], pos.value[2]]);
    pos = List.normalizeMax(pos);
    putStateComplexVector(pos);
};
geoOps.HorizontalLine.getParamForInput = (el, pos, type) => {
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
geoOps.HorizontalLine.getParamFromState = el => getStateComplexVector(3);
geoOps.HorizontalLine.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.HorizontalLine.updatePosition = el => {
    const param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Line");
};
geoOps.HorizontalLine.getRandomMove = geoOps._helper.getRandMove;
geoOps.HorizontalLine.stateSize = 6;


// Vertical line through a point
geoOps.Vertical = {};
geoOps.Vertical.kind = "L";
geoOps.Vertical.signature = ["P"];
geoOps.Vertical.updatePosition = el => {
    const el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ey, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


// Cinderella's freely movable VerticalLine (Cinderella semantics)
geoOps.VerticalLine = {};
geoOps.VerticalLine.kind = "L";
geoOps.VerticalLine.signature = [];
geoOps.VerticalLine.isMovable = true;
geoOps.VerticalLine.initialize = el => {
    let pos = geoOps._helper.initializeLine(el);
    pos = List.turnIntoCSList([pos.value[0], CSNumber.zero, pos.value[2]]);
    pos = List.normalizeMax(pos);
    putStateComplexVector(pos);
};
geoOps.VerticalLine.getParamForInput = (el, pos, type) => {
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
geoOps.VerticalLine.getParamFromState = el => getStateComplexVector(3);
geoOps.VerticalLine.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.VerticalLine.updatePosition = el => {
    const param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Line");
};
geoOps.VerticalLine.getRandomMove = geoOps._helper.getRandMove;
geoOps.VerticalLine.stateSize = 6;


geoOps.LineByFixedAngle = {};
geoOps.LineByFixedAngle.kind = "L";
geoOps.LineByFixedAngle.signature = ["L", "P"];
geoOps.LineByFixedAngle.initialize = el => {
    const a = CSNumber._helper.input(el.angle);
    const c = CSNumber.cos(a);
    const s = CSNumber.sin(a);
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
geoOps.LineByFixedAngle.updatePosition = el => {
    const l = csgeo.csnames[(el.args[0])];
    const p = csgeo.csnames[(el.args[1])];
    const dir = List.productMV(el.rot, l.homog);
    el.homog = List.cross(p.homog, dir);
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Line");
};


geoOps.Through = {};
geoOps.Through.kind = "L";
geoOps.Through.signature = ["P"];
geoOps.Through.isMovable = true;
geoOps.Through.initialize = el => {
    let dir;
    if (el.dir)
        dir = General.wrap(el.dir);
    else
        dir = List.realVector([el.pos[1], -el.pos[0], 0]);
    putStateComplexVector(dir);
};
geoOps.Through.getParamForInput = (el, pos, type) => {
    let l;
    if (type === "dir" || type === "mouse") {
        const p1 = csgeo.csnames[(el.args[0])].homog;
        l = List.cross(p1, pos);
    } else if (type === "homog") {
        l = pos;
    } else {
        l = List.turnIntoCSList([CSNumber.zero, CSNumber.zero, CSNumber.zero]);
    }
    const dir = List.cross(List.linfty, l);
    // The parameter is the point at infinity, without its last coordinate.
    return List.normalizeMax(dir);
};
geoOps.Through.getParamFromState = el => getStateComplexVector(3);
geoOps.Through.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.Through.updatePosition = el => {
    const dir = getStateComplexVector(3);
    putStateComplexVector(dir); // copy param
    const p1 = csgeo.csnames[el.args[0]].homog;
    let homog = List.cross(p1, dir);
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Line");
};
geoOps.Through.getRandomMove = geoOps._helper.getRandMove;
geoOps.Through.stateSize = 6;
geoOps.Through.set_angle = (el, value) => {
    if (value.ctype === "number") {
        const cc = CSNumber.cos(value);
        const ss = CSNumber.sin(value);
        const dir = List.turnIntoCSList([cc, ss, CSNumber.real(0)]);
        movepointscr(el, dir, "dir");
    }
};
geoOps.Through.set_slope = (el, value) => {
    if (value.ctype === "number") {
        const dir = List.turnIntoCSList(
            [CSNumber.real(1), value, CSNumber.real(0)]);
        movepointscr(el, dir, "dir");
    }
};


geoOps.Free = {};
geoOps.Free.kind = "P";
geoOps.Free.signature = [];
geoOps.Free.isMovable = true;
geoOps.Free.initialize = el => {
    const pos = geoOps._helper.initializePoint(el);
    putStateComplexVector(pos);
};
geoOps.Free.getParamForInput = (el, pos, type) => {
    if (type === "mouse" && cssnap && csgridsize !== 0) {
        pos = List.normalizeZ(pos);
        const sx = pos.value[0].value.real;
        const sy = pos.value[1].value.real;
        const rx = Math.round(sx / csgridsize) * csgridsize;
        const ry = Math.round(sy / csgridsize) * csgridsize;
        if (Math.abs(rx - sx) < cssnapDistance && Math.abs(ry - sy) < cssnapDistance) {
            pos = List.realVector([rx, ry, 1]);
        }
    }
    return List.normalizeMax(pos);
};
geoOps.Free.getParamFromState = el => getStateComplexVector(3);
geoOps.Free.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.Free.updatePosition = el => {
    const param = getStateComplexVector(3);
    putStateComplexVector(param); // copy param
    el.homog = General.withUsage(param, "Point");
};
geoOps.Free.getRandomMove = geoOps._helper.getRandPointMove;

geoOps.Free.stateSize = 6;

geoOps._helper.projectPointToLine = (point, line) => {
    const tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
    const perp = List.cross(tt, point);
    return List.normalizeMax(List.cross(perp, line));
};

geoOps.PointOnLine = {};
geoOps.PointOnLine.kind = "P";
geoOps.PointOnLine.signature = ["L"];
geoOps.PointOnLine.isMovable = true;
geoOps.PointOnLine.initialize = el => {
    let point = geoOps._helper.initializePoint(el);
    const line = csgeo.csnames[(el.args[0])].homog;
    point = geoOps._helper.projectPointToLine(point, line);
    point = List.normalizeMax(point);
    let other = List.cross(List.linfty, point);
    other = List.normalizeMax(other);
    putStateComplexVector(point);
    putStateComplexVector(line);
    tracingInitial = false; // force updatePosition to do proper matching
};
geoOps.PointOnLine.updatePosition = (el, isMover) => {
    let newPoint;
    const newLine = csgeo.csnames[(el.args[0])].homog;
    const oldPoint = getStateComplexVector(3);
    const oldLine = getStateComplexVector(3);

    if (isMover) {
        newPoint = oldPoint;
    } else {
        // Also read from last good, which is real,
        // instead of only stateIn which might be complex.
        stateInIdx = el.stateIdx;
        const tmpIn = stateIn;
        stateIn = stateLastGood;
        const realPoint = getStateComplexVector(3);
        const realLine = getStateComplexVector(3);
        stateIn = tmpIn;

        let center = List.cross(realLine, newLine);
        //if (CSNumber._helper.isAlmostZero(List.scalproduct(newLine, realPoint))) {
        if (List._helper.isAlmostZero(center)) {
            // line stayed (almost) the same, perform orthogonal projection
            center = List.cross(List.linfty, newLine);
        }
        // Note: center is NOT continuous in the parameter,
        // so refinements might cause it to jump between situations.
        // But refinement will bring lines close to one another,
        // in which case the exact location of center becomes less relevant
        const circle = geoOps._helper.CircleMP(center, realPoint);
        const newCandidates = geoOps._helper.IntersectLC(newLine, circle);
        const oldAntipode = geoOps._helper.pointReflection(center, oldPoint);
        const res = tracing2core(
            newCandidates[0], newCandidates[1],
            oldPoint, oldAntipode);
        newPoint = res[0];
    }
    newPoint = List.normalizeMax(newPoint);
    putStateComplexVector(newPoint);
    putStateComplexVector(newLine);
    el.homog = General.withUsage(newPoint, "Point");
};
geoOps.PointOnLine.getParamForInput = (el, pos, type) => {
    const line = csgeo.csnames[(el.args[0])].homog;
    pos = geoOps._helper.projectPointToLine(pos, line);
    if (type === "mouse" && cssnap && csgridsize !== 0) {
        pos = geoOps._helper.snapPointToLine(pos, line);
    }
    return pos;
};
geoOps.PointOnLine.getParamFromState = el => // point is first state element
    getStateComplexVector(3);
geoOps.PointOnLine.putParamToState = (el, param) => putStateComplexVector(param);
geoOps.PointOnLine.getRandomMove = geoOps._helper.getRandPointMove;
geoOps.PointOnLine.stateSize = 12;


geoOps.PointOnCircle = {};
geoOps.PointOnCircle.kind = "P";
geoOps.PointOnCircle.signature = ["C"];
geoOps.PointOnCircle.isMovable = true;
geoOps.PointOnCircle.initialize = el => {
    const circle = csgeo.csnames[el.args[0]];
    let pos = List.normalizeZ(geoOps._helper.initializePoint(el));
    const mid = List.normalizeZ(geoOps._helper.CenterOfCircle(circle.matrix));
    const dir = List.sub(pos, mid);
    const param = List.turnIntoCSList([
        dir.value[1],
        CSNumber.neg(dir.value[0]),
        CSNumber.zero
    ]);
    // The parameter is the far point polar to the diameter through the point
    const diameter = List.cross(pos, mid);
    const candidates = geoOps._helper.IntersectLC(diameter, circle.matrix);
    const d0 = List.projectiveDistMinScal(pos, candidates[0]);
    const d1 = List.projectiveDistMinScal(pos, candidates[1]);
    let other;
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
geoOps.PointOnCircle.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.PointOnCircle.getParamFromState = el => getStateComplexVector(3);
geoOps.PointOnCircle.getParamForInput = (el, pos, type) => {
    const circle = csgeo.csnames[el.args[0]];
    const mid = List.normalizeZ(geoOps._helper.CenterOfCircle(circle.matrix));
    let dir = List.sub(pos, mid);
    stateInIdx = el.stateIdx;
    const oldparam = getStateComplexVector(3);
    const oldpos = List.normalizeZ(getStateComplexVector(3));
    const olddir = List.sub(oldpos, mid);
    const oldSign = CSNumber.sub(
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
geoOps.PointOnCircle.parameterPath = (el, tr, tc, src, dst) => {
    src = List.normalizeAbs(src);
    dst = List.normalizeAbs(dst);
    let sp = List.scalproduct(src, dst);
    if (sp.value.real >= 0)
        return defaultParameterPath(el, tr, tc, src, dst);
    // If we have more than half a turn, do two half-circle arcs
    // with a real position half way along the path.
    // This should ensure we get to the far intersection point when needed.
    let mid = List.turnIntoCSList([
        CSNumber.sub(src.value[1], dst.value[1]),
        CSNumber.sub(dst.value[0], src.value[0]),
        CSNumber.zero
    ]);
    sp = List.scalproduct(src, mid);
    if (sp.value.real < 0)
        mid = List.neg(mid);
    let t2;
    let dt;
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
    const uc = CSNumber.sub(CSNumber.real(1), tc);
    const tc2 = CSNumber.mult(tc, tc);
    const uc2 = CSNumber.mult(uc, uc);
    const tuc = CSNumber.mult(tc, uc);
    let res = List.scalmult(uc2, src);
    res = List.add(res, List.scalmult(tuc, mid));
    res = List.add(res, List.scalmult(tc2, dst));
    return res;
};
geoOps.PointOnCircle.updatePosition = el => {
    const param = getStateComplexVector(3);
    putStateComplexVector(param); // copy parameter
    const circle = csgeo.csnames[el.args[0]];
    const diameter = List.productMV(circle.matrix, param);
    let candidates = geoOps._helper.IntersectLC(diameter, circle.matrix);
    candidates = tracing2(candidates[0], candidates[1]);
    const pos = List.normalizeMax(candidates.value[0]);
    el.homog = General.withUsage(pos, "Point");
    el.antipodalPoint = candidates.value[1];
};
geoOps.PointOnCircle.getRandomMove = geoOps._helper.getRandPointMove;
geoOps.PointOnCircle.stateSize = 6 + tracing2.stateSize;
geoOps.PointOnCircle.get_angle = el => {
    const circle = csgeo.csnames[el.args[0]];
    let mid = geoOps._helper.CenterOfCircle(circle.matrix);

    const isFP = List._helper.isAlmostFarpoint;
    if (isFP(el.homog) || isFP(mid)) return nada;

    const pos = List.normalizeZ(el.homog);
    mid = List.normalizeZ(mid);
    const dir = List.sub(pos, mid);
    let angle = CSNumber.arctan2(dir.value[0], dir.value[1]); //lives in [-pi, pi)
    //technically, we are done here. But we like to have the same behavior as Cinderella:
    const twpopi = CSNumber.real(TWOPI);
    angle = CSNumber.mod(CSNumber.add(angle, twpopi), twpopi); //lives in [0, 2*pi)
    return General.withUsage(angle, "Angle");
};
geoOps.PointOnCircle.set_angle = (el, value) => {
    if (value.ctype === "number") {
        const circle = csgeo.csnames[el.args[0]];
        let mid = geoOps._helper.CenterOfCircle(circle.matrix);

        if (!List._helper.isAlmostFarpoint(mid)) {
            mid = List.normalizeZ(mid);

            const cc = CSNumber.cos(value);
            const ss = CSNumber.sin(value);
            const dir = List.turnIntoCSList([CSNumber.mult(cc, circle.radius), CSNumber.mult(ss, circle.radius), CSNumber.real(0)]);

            movepointscr(el, List.add(mid, dir), "homog");
        }
    }
    return nada;
};

geoOps.OtherPointOnCircle = {};
geoOps.OtherPointOnCircle.kind = "P";
geoOps.OtherPointOnCircle.signature = ["P"];
geoOps.OtherPointOnCircle.signatureConstraints = el => csgeo.csnames[el.args[0]].type === "PointOnCircle";
geoOps.OtherPointOnCircle.updatePosition = el => {
    const first = csgeo.csnames[el.args[0]];
    let pos = first.antipodalPoint;
    pos = List.normalizeMax(pos);
    el.homog = General.withUsage(pos, "Point");
};

geoOps.PointOnSegment = {};
geoOps.PointOnSegment.kind = "P";
geoOps.PointOnSegment.signature = ["S"];
geoOps.PointOnSegment.isMovable = true;
geoOps.PointOnSegment.initialize = el => {
    const pos = geoOps._helper.initializePoint(el);
    const cr = geoOps.PointOnSegment.getParamForInput(el, pos);
    putStateComplexNumber(cr);
};
geoOps.PointOnSegment.getParamForInput = (el, pos, type) => {
    const seg = csgeo.csnames[el.args[0]];
    const line = seg.homog;

    // snap to grid
    if (type === "mouse" && cssnap && csgridsize !== 0) {
        pos = geoOps._helper.snapPointToLine(pos, line);
    }

    const tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
    const farpoint = List.sub(seg.startpos, seg.endpos);
    let cr = List.crossratio3(
        farpoint, seg.startpos, seg.endpos, pos, tt);
    if (cr.value.real < 0)
        cr = CSNumber.complex(0, cr.value.imag);
    if (cr.value.real > 1)
        cr = CSNumber.complex(1, cr.value.imag);
    return cr;
};
geoOps.PointOnSegment.getParamFromState = el => getStateComplexNumber();
geoOps.PointOnSegment.putParamToState = (el, param) => {
    putStateComplexNumber(param);
};
geoOps.PointOnSegment.updatePosition = el => {
    const param = getStateComplexNumber();
    putStateComplexNumber(param); // copy parameter
    const seg = csgeo.csnames[el.args[0]];
    const start = seg.startpos;
    const end = seg.endpos;
    const far = List.sub(end, start);
    let homog = List.add(start, List.scalmult(param, far));
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Point");
};
geoOps.PointOnSegment.getRandomMove = geoOps._helper.getRandPointMove;
geoOps.PointOnSegment.stateSize = 2;

geoOps._helper.projectPointToCircle = (cir, P) => {
    let cen = geoOps._helper.CenterOfCircle(cir.matrix);
    cen = List.normalizeMax(cen);
    const l = List.normalizeMax(List.cross(P, cen));
    const isec = geoOps._helper.IntersectLC(l, cir.matrix);
    const d1 = List.projectiveDistMinScal(P, isec[0]);
    const d2 = List.projectiveDistMinScal(P, isec[1]);
    const erg = d1 < d2 ? isec[0] : isec[1];
    return erg;
};

geoOps.PointOnArc = {};
geoOps.PointOnArc.kind = "P";
geoOps.PointOnArc.signature = ["C"];
geoOps.PointOnArc.signatureConstraints = el => csgeo.csnames[el.args[0]].isArc;
geoOps.PointOnArc.isMovable = true;
geoOps.PointOnArc.initialize = el => {
    const pos = geoOps._helper.initializePoint(el);
    const cr = geoOps.PointOnArc.getParamForInput(el, pos);
    putStateComplexVector(cr);
};
geoOps.PointOnArc.getParamForInput = (el, pos) => {
    const arc = csgeo.csnames[el.args[0]];
    const P = geoOps._helper.projectPointToCircle(arc, pos);
    const A = arc.startPoint;
    const B = arc.viaPoint;
    const C = arc.endPoint;
    let crh = List.normalizeMax(List.crossratio3harm(A, C, B, P, List.ii));
    // Now restrict cross ratio to the range [0,∞]
    const cr = CSNumber.div(crh.value[0], crh.value[1]);
    if (cr.value.real < 0) {
        if (cr.value.real < -1) {
            crh = List.realVector([1, 0]); // ∞, use end point
        } else {
            crh = List.realVector([0, 1]); // 0, use start point
        }
    }
    return crh;
};
geoOps.PointOnArc.getParamFromState = el => getStateComplexVector(2);
geoOps.PointOnArc.putParamToState = (el, param) => {
    putStateComplexVector(param);
};
geoOps.PointOnArc.updatePosition = el => {
    const arc = csgeo.csnames[el.args[0]];
    const A = arc.startPoint;
    const B = arc.viaPoint;
    const C = arc.endPoint;
    const I = List.ii;
    const AI = List.cross(A, I);
    const BI = List.cross(B, I);
    const CI = List.cross(C, I);
    // Now we want to scale AI and CI such that λ⋅BI = AI + CI.
    // a*AI + c*CI = BI => [AI, CI]*(a,c) = BI but [AI, CI] is not square so
    // we solve this least-squares-style (see Moore-Penrose pseudoinverse),
    // multiplying both sides by M2x3c and then using the adjoint to solve.
    const M2x3 = List.turnIntoCSList([AI, CI]);
    const M3x2 = List.transpose(M2x3);
    const M2x3c = List.conjugate(M2x3);
    const M2x2 = List.productMM(M2x3c, M3x2);
    const v2x1 = List.productMV(M2x3c, BI);
    const ab = List.productMV(List.adjoint2(M2x2), v2x1);
    const a = ab.value[0];
    const c = ab.value[1];
    const crh = getStateComplexVector(2);
    putStateComplexVector(crh);
    const Q = List.normalizeMax(List.add(
        List.scalmult(CSNumber.mult(a, crh.value[0]), A),
        List.scalmult(CSNumber.mult(c, crh.value[1]), C)));
    const P = geoOps._helper.conicOtherIntersection(arc.matrix, I, Q);
    el.homog = General.withUsage(P, "Point");
};
geoOps.PointOnArc.getRandomMove = geoOps._helper.getRandPointMove;
geoOps.PointOnArc.stateSize = 4;

geoOps._helper.CenterOfCircle = c => // Treating this special case of CenterOfConic avoids some computation
    // and also allows dealing with the degenerate case of center at infinity
    List.turnIntoCSList([
        c.value[2].value[0],
        c.value[2].value[1],
        CSNumber.neg(c.value[0].value[0])
    ]);

geoOps._helper.CenterOfConic = c => {
    // The center is the pole of the dual conic of the line at infinity
    const adj = List.adjoint3(c);
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
geoOps.CenterOfConic.updatePosition = el => {
    const c = csgeo.csnames[(el.args[0])].matrix;
    const erg = geoOps._helper.CenterOfConic(c);
    el.homog = erg;
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps._helper.CircleMP = (m, p) => {
    const x = m.value[0];
    const y = m.value[1];
    const mz = CSNumber.neg(m.value[2]);
    const zero = CSNumber.zero;
    const tang = List.turnIntoCSList([
        List.turnIntoCSList([mz, zero, x]),
        List.turnIntoCSList([zero, mz, y]),
        List.turnIntoCSList([x, y, zero]),
    ]);
    const mu = General.mult(General.mult(p, tang), p);
    const la = General.mult(General.mult(p, List.fund), p);
    const m1 = General.mult(mu, List.fund);
    const m2 = General.mult(la, tang);
    const erg = List.sub(m1, m2);
    return erg;
};

geoOps.CircleMP = {};
geoOps.CircleMP.kind = "C";
geoOps.CircleMP.signature = ["P", "P"];
geoOps.CircleMP.updatePosition = el => { //TODO Performance Checken. Das ist jetzt der volle CK-ansatz
    //Weniger Allgemein geht das viiiiel schneller
    const m = csgeo.csnames[(el.args[0])].homog;
    const p = csgeo.csnames[(el.args[1])].homog;
    el.matrix = geoOps._helper.CircleMP(m, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Circle");

};


geoOps.CircleMr = {};
geoOps.CircleMr.kind = "C";
geoOps.CircleMr.signature = ["P"];
geoOps.CircleMr.isMovable = true;
geoOps.CircleMr.initialize = el => {
    putStateComplexNumber(CSNumber.real(el.radius));
};
geoOps.CircleMr.getParamForInput = (el, pos, type) => {
    if (type === "radius") return pos;
    let m = csgeo.csnames[(el.args[0])].homog;
    m = List.normalizeZ(m);
    pos = List.normalizeZ(pos);
    let rad = List.sub(m, pos);
    rad = List.abs(rad);
    return rad;
};
geoOps.CircleMr.getParamFromState = el => getStateComplexNumber();
geoOps.CircleMr.putParamToState = (el, param) => {
    putStateComplexNumber(param);
};
geoOps.CircleMr.updatePosition = el => {
    const r = getStateComplexNumber();
    putStateComplexNumber(r); // copy param
    const m = csgeo.csnames[(el.args[0])].homog;
    /*
    The circle's radius value may take on values from zero to infinity.
    However since the squared radius value appears in the circle's matrix,
    a radius value of 2E+154 or more could also end up as an infinite value.
    Using List.normalizeMax elsewhere will limit the coordinate values of m
    to no more than 1.0, so that scaling the radius value by m's z-coordinate
    first here will not make the radius value any larger. Then by squaring the
    radius value, any infinity value produced can be caught here.
    */
    const sr = CSNumber.mult(m.value[2], r);
    const sr2 = CSNumber.mult(sr, sr);
    if (!CSNumber._helper.isFinite(sr2) && !CSNumber._helper.isNaN(sr2)) return List.fund;
    const matrix = geoOps._helper.ScaledCircleMrr(m, sr2);
    el.matrix = General.withUsage(matrix, "Circle");
    el.radius = r;
};
geoOps.CircleMr.getRandomMove = el => {
    // radius
    let r;
    const oldr = el.radius;
    const oabs = CSNumber.abs(oldr).value.real;

    // if radius was small we want something larger and if not we scale the old one
    if (oabs < CSNumber.eps) {
        r = CSNumber.getRandComplex(0.05, 0.10);
    } else {
        r = CSNumber.mult(oldr, CSNumber.getRandReal(0.95, 1.05));
    }

    const rad = {
        type: "radius",
        value: r
    };

    return rad;
};
geoOps.CircleMr.stateSize = 2;
geoOps.CircleMr.set_radius = (el, value) => {
    if (value.ctype === "number") {
        movepointscr(el, value, "radius");
    }
};


geoOps._helper.ScaledCircleMrr = (M, rr) => {
    /*
    Given M as the circle's homogeneous center point coordinates [x, y, z] and
    rr as the circle's radius value squared scaled by M's z-coordinate squared,
    build the following matrix:
        ⎛   z*z      0      -z*x   ⎞
        ⎜    0      z*z     -z*y   ⎟
        ⎝  -z*x    -z*y  x*x+y*y-rr⎠
    */
    const x = M.value[0];
    const y = M.value[1];
    const mz = CSNumber.neg(M.value[2]); // minus z
    const v = List.scalmult(mz, List.turnIntoCSList([x, y, mz])).value;
    const vxy = List.turnIntoCSList([x, y]);
    const zz = CSNumber.sub(List.scalproduct(vxy, vxy), rr);
    const matrix = geoOps._helper.buildConicMatrix([v[2], CSNumber.zero, v[2], v[0], v[1], zz]);
    return List.normalizeMax(matrix);
};


geoOps.Compass = {};
geoOps.Compass.kind = "C";
geoOps.Compass.signature = ["P", "P", "P"];
geoOps.Compass.updatePosition = el => {
    let a = csgeo.csnames[(el.args[0])].homog;
    let b = csgeo.csnames[(el.args[1])].homog;
    let m = csgeo.csnames[(el.args[2])].homog;
    // Scale each point's homogeneous coordinates by the other two
    // point's z-value to allow addtion and subtraction to be valid.
    const aZ = a.value[2];
    const bZ = b.value[2];
    const mZ = m.value[2];
    a = List.scalmult(CSNumber.mult(bZ, mZ), a);
    b = List.scalmult(CSNumber.mult(aZ, mZ), b);
    m = List.scalmult(CSNumber.mult(aZ, bZ), m);
    // Setup circle's matrix with m as center and segment ab length as radius
    const d = List.sub(b, a);
    const matrix = geoOps._helper.ScaledCircleMrr(m, List.scalproduct(d, d));
    el.matrix = General.withUsage(matrix, "Circle");
};


geoOps._helper.getConicType = C => {
    const myEps = 1e-16;
    const adet = CSNumber.abs(List.det(C));

    if (adet.value.real < myEps) {
        return "degenerate";
    }

    let det = CSNumber.mult(C.value[0].value[0], C.value[1].value[1]);
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


geoOps._helper.ConicBy5 = (el, a, b, c, d, p) => {

    const v23 = List.turnIntoCSList([List.cross(b, c)]);
    const v14 = List.turnIntoCSList([List.cross(a, d)]);
    const v12 = List.turnIntoCSList([List.cross(a, b)]);
    const v34 = List.turnIntoCSList([List.cross(c, d)]);

    const erg = geoOps._helper.conicFromTwoDegenerates(v23, v14, v12, v34, p);
    return erg;
};

geoOps._helper.conicFromTwoDegenerates = (v23, v14, v12, v34, p) => {
    let deg1 = General.mult(List.transpose(v14), v23);
    let deg2 = General.mult(List.transpose(v34), v12);
    deg1 = List.add(deg1, List.transpose(deg1));
    deg2 = List.add(deg2, List.transpose(deg2));
    const mu = General.mult(General.mult(p, deg1), p);
    const la = General.mult(General.mult(p, deg2), p);
    const m1 = General.mult(mu, deg2);
    const m2 = General.mult(la, deg1);

    const erg = List.sub(m1, m2);
    return erg;
};


geoOps.ConicBy5 = {};
geoOps.ConicBy5.kind = "C";
geoOps.ConicBy5.signature = ["P", "P", "P", "P", "P"];
geoOps.ConicBy5.updatePosition = el => {
    const a = csgeo.csnames[(el.args[0])].homog;
    const b = csgeo.csnames[(el.args[1])].homog;
    const c = csgeo.csnames[(el.args[2])].homog;
    const d = csgeo.csnames[(el.args[3])].homog;
    const p = csgeo.csnames[(el.args[4])].homog;

    const erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);

    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps.FreeConic = {};
geoOps.FreeConic.kind = "C";
geoOps.FreeConic.signature = [];
geoOps.FreeConic.initialize = el => {
    let pos;
    if (el.pos)
        pos = geoOps._helper.inputConic(el.pos);
    else
        pos = List.zeromatrix(CSNumber.real(3), CSNumber.real(3));
    geoOps.FreeConic.putParamToState(el, pos);
};
geoOps.FreeConic.getParamForInput = (el, pos, type) => List.normalizeMax(pos);
geoOps.FreeConic.getParamFromState = el => geoOps._helper.buildConicMatrix(getStateComplexVector(6).value);
geoOps.FreeConic.putParamToState = (el, param) => {
    for (let i = 0; i < 3; ++i)
        for (let j = 0; j <= i; ++j)
            putStateComplexNumber(param.value[i].value[j]);
};
geoOps.FreeConic.updatePosition = el => {
    const pos = getStateComplexVector(6);
    putStateComplexVector(pos);
    el.matrix = geoOps._helper.buildConicMatrix(pos.value);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};
geoOps.FreeConic.set_matrix = (el, value) => {
    if (List._helper.isNumberMatrixMN(value, 3, 3))
        movepointscr(el, List.add(value, List.transpose(value)), "matrix");
};
geoOps.FreeConic.stateSize = 6 * 2;

geoOps._helper.buildConicMatrix = arr => {
    const a = arr[0];
    const b = arr[1];
    const c = arr[2];
    const d = arr[3];
    const e = arr[4];
    const f = arr[5];

    const M = List.turnIntoCSList([
        List.turnIntoCSList([a, b, d]),
        List.turnIntoCSList([b, c, e]),
        List.turnIntoCSList([d, e, f])
    ]);
    return M;
};

geoOps._helper.flattenConicMatrix = mat => List.turnIntoCSList([
    mat.value[0].value[0],
    mat.value[0].value[1],
    mat.value[1].value[1],
    mat.value[0].value[2],
    mat.value[1].value[2],
    mat.value[2].value[2]
]);

geoOps._helper.splitDegenConic = mat => {
    const adj_mat = List.adjoint3(mat);

    let idx = 0;
    let k;
    let l;
    let abs2;
    let max = CSNumber.abs2(adj_mat.value[0].value[0]).value.real;
    for (k = 1; k < 3; k++) {
        abs2 = CSNumber.abs2(adj_mat.value[k].value[k]).value.real;
        if (abs2 > max) {
            idx = k;
            max = abs2;
        }
    }

    const beta = CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), adj_mat.value[idx].value[idx]));
    if (CSNumber.abs2(beta).value.real < 1e-16) {
        const zeros = List.turnIntoCSList([
            CSNumber.zero, CSNumber.zero, CSNumber.zero
        ]);
        return [zeros, zeros];
    }
    idx = CSNumber.real(idx + 1);
    let p = List.column(adj_mat, idx);

    p = List.scaldiv(beta, p);


    const lam = p.value[0];
    const mu = p.value[1];
    const tau = p.value[2];
    const M = List.turnIntoCSList([
        List.turnIntoCSList([CSNumber.real(0), tau, CSNumber.mult(CSNumber.real(-1), mu)]),
        List.turnIntoCSList([CSNumber.mult(CSNumber.real(-1), tau), CSNumber.real(0), lam]),
        List.turnIntoCSList([mu, CSNumber.mult(CSNumber.real(-1), lam), CSNumber.real(0)])
    ]);


    let C = List.add(mat, M);

    // get nonzero index
    let ii = 0;
    let jj = 0;
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


    let lg = C.value[ii];
    C = List.transpose(C);
    let lh = C.value[jj];
    lg = List.normalizeMax(lg);
    lh = List.normalizeMax(lh);

    lg = General.withUsage(lg, "Line");
    lh = General.withUsage(lh, "Line");


    return [lg, lh];
};

geoOps._helper.inputConic = pos => {
    const v = "xx xy yy xz yz zz".split(" ").map(name => {
        let num = CSNumber._helper.input(pos[name]);
        if (name[0] !== name[1]) num = CSNumber.realmult(0.5, num);
        return num;
    });
    return geoOps._helper.buildConicMatrix(v);
};

geoOps.SelectConic = {};
geoOps.SelectConic.kind = "C";
geoOps.SelectConic.signature = ["Cs"];
geoOps.SelectConic.initialize = el => {
    if (el.index !== undefined)
        return el.index - 1;
    const pos = geoOps._helper.inputConic(el.pos);
    const set = csgeo.csnames[(el.args[0])].results;
    let d1 = List.conicDist(pos, set[0]);
    let best = 0;
    for (let i = 1; i < set.length; ++i) {
        const d2 = List.conicDist(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectConic.updatePosition = el => {
    const set = csgeo.csnames[(el.args[0])];
    el.matrix = set.results[el.param];
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

// conic by 4 Points and 1 line
geoOps._helper.ConicBy4p1l = (el, a, b, c, d, l) => {
    const al = List.scalproduct(a, l);
    const bl = List.scalproduct(b, l);
    const cl = List.scalproduct(c, l);
    const dl = List.scalproduct(d, l);
    const bcd = List.det3(b, c, d);
    const abd = List.det3(a, b, d);
    const acd = List.det3(a, c, d);
    const abc = List.det3(a, b, c);
    const mul = CSNumber.mult;
    const r1 = CSNumber.sqrt(mul(mul(bl, dl), mul(bcd, abd)));
    const r2 = CSNumber.sqrt(mul(mul(al, cl), mul(acd, abc)));
    const a1 = List.cross(List.cross(a, c), l);
    const a2 = List.cross(List.cross(b, d), l);
    const k1 = List.scalmult(r1, a1);
    const k2 = List.scalmult(r2, a2);
    const x = List.normalizeMax(List.add(k1, k2));
    const y = List.normalizeMax(List.sub(k1, k2));
    const xy = tracing2(x, y);
    const t1 = geoOps._helper.ConicBy5(el, a, b, c, d, xy.value[0]);
    const t2 = geoOps._helper.ConicBy5(el, a, b, c, d, xy.value[1]);
    return [List.normalizeMax(t1), List.normalizeMax(t2)];
};

geoOps.ConicBy4p1l = {};
geoOps.ConicBy4p1l.kind = "Cs";
geoOps.ConicBy4p1l.signature = ["P", "P", "P", "P", "L"];
geoOps.ConicBy4p1l.updatePosition = el => {
    const a = csgeo.csnames[(el.args[0])].homog;
    const b = csgeo.csnames[(el.args[1])].homog;
    const c = csgeo.csnames[(el.args[2])].homog;
    const d = csgeo.csnames[(el.args[3])].homog;

    const l = csgeo.csnames[(el.args[4])].homog;

    const erg = geoOps._helper.ConicBy4p1l(el, a, b, c, d, l);

    el.results = erg;

};
geoOps.ConicBy4p1l.stateSize = tracing2.stateSize;


geoOps._helper.ConicBy3p2l = (a, b, c, g, h) => {
    // see http://math.stackexchange.com/a/1187525/35416
    const l = List.cross(a, b);
    const gh = List.cross(g, h);
    const gl = List.cross(g, l);
    const hl = List.cross(h, l);
    const m1 = List.turnIntoCSList([gl, hl, gh]);
    const s1 = List.productVM(c, List.adjoint3(m1));
    const m2 = List.adjoint3(List.turnIntoCSList([
        List.scalmult(s1.value[0], gl),
        List.scalmult(s1.value[1], hl),
        List.scalmult(s1.value[2], gh)
    ]));
    const m3 = List.transpose(m2);
    const mul = CSNumber.mult;
    const aa = List.productMV(m3, a);
    const a1 = aa.value[0];
    const a2 = aa.value[1];
    const bb = List.productMV(m3, b);
    const b1 = bb.value[0];
    const b2 = bb.value[1];
    // assert: aa.value[2] and bb.value[2] are zero

    const a3a = CSNumber.sqrt(mul(a1, a2));
    const b3a = CSNumber.sqrt(mul(b1, b2));
    let signs;
    const res = new Array(4);
    for (signs = 0; signs < 4; ++signs) {
        const sa = ((signs & 1) << 1) - 1;
        const sb = (signs & 2) - 1;
        const a3 = mul(CSNumber.real(sa), a3a);
        const b3 = mul(CSNumber.real(sb), b3a);
        const p1 = det2(a2, a3, b2, b3);
        const p2 = det2(b1, b3, a1, a3);
        const p3 = det2(a1, a2, b1, b2);
        const p4 = CSNumber.add(
            CSNumber.add(
                det2(b1, b2, a1, a2),
                det2(b2, b3, a2, a3)),
            det2(b3, b1, a3, a1));
        const xx = mul(p1, p1);
        const yy = mul(p2, p2);
        const zz = mul(p4, p4);
        let xy = mul(p1, p2);
        const xz = mul(p1, p4);
        const yz = mul(p2, p4);
        xy = CSNumber.sub(xy, mul(CSNumber.real(0.5), mul(p3, p3)));
        let mm = List.turnIntoCSList([
            List.turnIntoCSList([xx, xy, xz]),
            List.turnIntoCSList([xy, yy, yz]),
            List.turnIntoCSList([xz, yz, zz])
        ]);
        mm = List.productMM(m2, List.productMM(mm, m3));
        const vv = List.turnIntoCSList([
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
geoOps.ConicBy3p2l.updatePosition = el => {
    const a = csgeo.csnames[(el.args[0])].homog;
    const b = csgeo.csnames[(el.args[1])].homog;
    const c = csgeo.csnames[(el.args[2])].homog;
    const g = csgeo.csnames[(el.args[3])].homog;
    const h = csgeo.csnames[(el.args[4])].homog;
    let newVecs = geoOps._helper.ConicBy3p2l(a, b, c, g, h);
    newVecs = tracingSesq(newVecs);
    const res = new Array(4);
    for (let i = 0; i < 4; ++i) {
        const v = newVecs[i].value;
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
geoOps.ConicBy2p3l.updatePosition = el => {
    const a = csgeo.csnames[(el.args[0])].homog;
    const b = csgeo.csnames[(el.args[1])].homog;
    const g = csgeo.csnames[(el.args[2])].homog;
    const h = csgeo.csnames[(el.args[3])].homog;
    const l = csgeo.csnames[(el.args[4])].homog;
    const oldVecs = el.tracing;
    let newVecs = geoOps._helper.ConicBy3p2l(g, h, l, a, b);
    newVecs = tracingSesq(newVecs);
    const res = new Array(4);
    for (let i = 0; i < 4; ++i) {
        const v = newVecs[i].value;
        const dual = List.turnIntoCSList([
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
geoOps.ConicBy1p4l.updatePosition = el => {
    const p = csgeo.csnames[(el.args[0])].homog;
    const l1 = csgeo.csnames[(el.args[1])].homog;
    const l2 = csgeo.csnames[(el.args[2])].homog;
    const l3 = csgeo.csnames[(el.args[3])].homog;
    const l4 = csgeo.csnames[(el.args[4])].homog;


    let erg = geoOps._helper.ConicBy4p1l(el, l1, l2, l3, l4, p);
    let t1 = erg[0];
    let t2 = erg[1];
    t1 = List.adjoint3(t1);
    t2 = List.adjoint3(t2);

    erg = [t1, t2];
    el.results = erg;

};
geoOps.ConicBy1p4l.stateSize = tracing2.stateSize;

geoOps.ConicParabolaPL = {};
geoOps.ConicParabolaPL.kind = "C";
geoOps.ConicParabolaPL.signature = ["P", "L"];
geoOps.ConicParabolaPL.updatePosition = el => {
    const F = csgeo.csnames[(el.args[0])].homog.value; // focus point
    const d = csgeo.csnames[(el.args[1])].homog.value; // directrix line
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
    const mult = CSNumber.mult;
    const neg = CSNumber.neg;
    const add = CSNumber.add;
    const sub = CSNumber.sub;
    const Fx = F[0];
    const Fy = F[1];
    const Fz = F[2];
    const dx = d[0];
    const dy = d[1];
    const dz = d[2];
    const Fz2 = mult(Fz, Fz);
    const dx2 = mult(dx, dx);
    const dy2 = mult(dy, dy);
    const Fzdz = mult(Fz, dz);
    const nFz = neg(Fz);
    const dx2pdy2 = add(dx2, dy2);
    const xx = mult(Fz2, dy2);
    const yy = mult(Fz2, dx2);
    const xy = mult(neg(Fz2), mult(dx, dy));
    const xz = mult(nFz, add(mult(Fx, dx2pdy2), mult(Fzdz, dx)));
    const yz = mult(nFz, add(mult(Fy, dx2pdy2), mult(Fzdz, dy)));
    const zz = sub(
        mult(add(mult(Fx, Fx), mult(Fy, Fy)), dx2pdy2),
        mult(Fz2, mult(dz, dz)));
    let m = geoOps._helper.buildConicMatrix([xx, xy, yy, xz, yz, zz]);
    m = List.normalizeMax(m);
    el.matrix = General.withUsage(m, "Conic");
};

geoOps.ConicBy2Foci1P = {};
geoOps.ConicBy2Foci1P.kind = "Cs";
geoOps.ConicBy2Foci1P.signature = ["P", "P", "P"];
geoOps.ConicBy2Foci1P.updatePosition = el => {
    const F1 = csgeo.csnames[(el.args[0])].homog;
    const F2 = csgeo.csnames[(el.args[1])].homog;
    const PP = csgeo.csnames[(el.args[2])].homog;

    // i and j
    const II = List.ii;
    const JJ = List.jj;

    const b1 = List.normalizeMax(List.cross(F1, PP));
    const b2 = List.normalizeMax(List.cross(F2, PP));
    const a1 = List.normalizeMax(List.cross(PP, II));
    const a2 = List.normalizeMax(List.cross(PP, JJ));

    const har = geoOps._helper.coHarmonic(a1, a2, b1, b2);
    const e1 = List.normalizeMax(har[0]);
    const e2 = List.normalizeMax(har[1]);

    // lists for transposed
    const lII = List.turnIntoCSList([II]);
    const lJJ = List.turnIntoCSList([JJ]);
    const lF1 = List.turnIntoCSList([F1]);
    const lF2 = List.turnIntoCSList([F2]);

    let co1 = geoOps._helper.conicFromTwoDegenerates(lII, lJJ, lF1, lF2, e1);
    co1 = List.normalizeMax(co1);
    let co2 = geoOps._helper.conicFromTwoDegenerates(lII, lJJ, lF1, lF2, e2);
    co2 = List.normalizeMax(co2);

    // adjoint
    co1 = List.normalizeMax(List.adjoint3(co1));
    co2 = List.normalizeMax(List.adjoint3(co2));

    // return ellipsoid first
    if (geoOps._helper.getConicType(co1) !== "ellipsoid") {
        const temp = co1;
        co1 = co2;
        co2 = temp;
    }

    // remove hyperbola in limit case
    if (List.almostequals(F1, F2).value) {
        const three = CSNumber.real(3);
        co2 = List.zeromatrix(three, three);
    }

    const erg = [co1, co2];
    el.results = erg;

};

// Given (A, a, B, b, C), compute conic such that
// 1. (A, a) and (B, b) are pole-polar pairs and
// 2. C is incident with the conic
geoOps.ConicBy2Pol1P = {};
geoOps.ConicBy2Pol1P.kind = "C";
geoOps.ConicBy2Pol1P.signature = ["P", "L", "P", "L", "P"];
geoOps.ConicBy2Pol1P.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const a = csgeo.csnames[(el.args[1])].homog;
    const B = csgeo.csnames[(el.args[2])].homog;
    const b = csgeo.csnames[(el.args[3])].homog;
    const C = csgeo.csnames[(el.args[4])].homog;

    const sp = List.scalproduct;
    const sm = List.scalmult;
    const sub = List.sub;
    const mm = List.productMM;
    const rm = CSNumber.realmult;
    const transpose = List.transpose;
    const asList = List.turnIntoCSList;

    // D = ⟨a,A⟩⋅C − 2⟨a,C⟩⋅A, E = ⟨b,B⟩⋅C − 2⟨b,C⟩⋅B
    const D = sub(sm(sp(a, A), C), sm(rm(2, sp(a, C)), A));
    const E = sub(sm(sp(b, B), C), sm(rm(2, sp(b, C)), B));
    const AC = asList([List.cross(A, C)]);
    const BC = asList([List.cross(B, C)]);
    const M1 = mm(transpose(AC), asList([List.cross(A, E)]));
    const M2 = mm(transpose(BC), asList([List.cross(B, D)]));
    const M3 = mm(transpose(AC), BC);
    const Ab = sp(A, b);
    const Ba = sp(B, a);
    // M = Ba * M1 + Ab * M2 - 2 * Ab * Ba * M3
    let M = List.add(sm(Ba, M1), sm(Ab, M2));
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
geoOps.ConicBy2Pol1L.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const a = csgeo.csnames[(el.args[1])].homog;
    const B = csgeo.csnames[(el.args[2])].homog;
    const b = csgeo.csnames[(el.args[3])].homog;
    const c = csgeo.csnames[(el.args[4])].homog;

    const sp = List.scalproduct;
    const sm = List.scalmult;
    const mm = List.productMM;
    const mul = CSNumber.mult;
    const rm = CSNumber.realmult;
    const transpose = List.transpose;
    const asList = List.turnIntoCSList;

    const aA = sp(a, A);
    const aB = sp(a, B);
    const bA = sp(b, A);
    const bB = sp(b, B);
    const cA = sp(c, A);
    const cB = sp(c, B);
    const v = asList([List.sub(sm(mul(bA, cB), a), sm(mul(aB, cA), b))]);

    let M = List.add(
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
geoOps._helper.conic1Pol3Inc = (A, a, B, C, D) => {
    const sp = List.scalproduct;
    const sm = List.scalmult;
    const mm = List.productMM;
    const cp = List.cross;
    const rm = CSNumber.realmult;
    const mult = CSNumber.mult;
    const transpose = List.transpose;
    const asList = List.turnIntoCSList;
    const det3 = List.det3;

    const ABC = det3(A, B, C);
    const BD = asList([cp(B, D)]);
    const AD = asList([cp(A, D)]);
    const BC = asList([cp(B, C)]);
    const aA = sp(a, A);
    const aB = sp(a, B);
    const aD = sp(a, D);
    const v = asList([cp(C, List.sub(sm(aA, D), sm(rm(2, aD), A)))]);
    let M = sm(ABC, mm(transpose(BD), v));
    let f = rm(2, CSNumber.add(mult(det3(A, C, D), aB), mult(ABC, aD)));
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
geoOps.ConicBy1Pol3P.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const a = csgeo.csnames[(el.args[1])].homog;
    const B = csgeo.csnames[(el.args[2])].homog;
    const C = csgeo.csnames[(el.args[3])].homog;
    const D = csgeo.csnames[(el.args[4])].homog;

    let M = geoOps._helper.conic1Pol3Inc(A, a, B, C, D);
    M = General.withUsage(M, "Conic");
    el.matrix = M;
};

// Given (A, a, b, c, d), compute conic such that
// 1. (A, a) is a pole-polar pair and
// 2. b, c, d are tangents to the conic
geoOps.ConicBy1Pol3L = {};
geoOps.ConicBy1Pol3L.kind = "C";
geoOps.ConicBy1Pol3L.signature = ["P", "L", "L", "L", "L"];
geoOps.ConicBy1Pol3L.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const a = csgeo.csnames[(el.args[1])].homog;
    const b = csgeo.csnames[(el.args[2])].homog;
    const c = csgeo.csnames[(el.args[3])].homog;
    const d = csgeo.csnames[(el.args[4])].homog;

    let M = geoOps._helper.conic1Pol3Inc(a, A, b, c, d);
    M = List.normalizeMax(List.adjoint3(M));
    M = General.withUsage(M, "Conic");
    el.matrix = M;
};

// Given (A, a, B, C, d), compute conic such that
// 1. (A, a) is a pole-polar pair,
// 2. B, C are incident with the conic and
// 3. d is a tangent to the conic
geoOps.ConicBy1Pol2P1L = {};
geoOps.ConicBy1Pol2P1L.kind = "Cs";
geoOps.ConicBy1Pol2P1L.signature = ["P", "L", "P", "P", "L"];
geoOps.ConicBy1Pol2P1L.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const a = csgeo.csnames[(el.args[1])].homog;
    const B = csgeo.csnames[(el.args[2])].homog;
    const C = csgeo.csnames[(el.args[3])].homog;
    const d = csgeo.csnames[(el.args[4])].homog;

    const add = CSNumber.add;
    const asList = List.turnIntoCSList;
    const cp = List.cross;
    const mm = List.productMM;
    const mul = CSNumber.mult;
    const rm = CSNumber.realmult;
    const sm = List.scalmult;
    const sp = List.scalproduct;
    const sub = CSNumber.sub;
    const transpose = List.transpose;

    const aA = sp(a, A);
    const aB = sp(a, B);
    const aC = sp(a, C);
    const dA = sp(d, A);
    const dB = sp(d, B);
    const dC = sp(d, C);
    const AB = asList([cp(A, B)]);
    const AC = asList([cp(A, C)]);
    const BC = asList([cp(B, C)]);
    const r = CSNumber.sqrt(mul(mul(dB, dC), mul(
        sub(mul(aA, dB), rm(2, mul(dA, aB))),
        sub(mul(aA, dC), rm(2, mul(dA, aC))))));
    const ABAC = mm(transpose(AB), AC);
    const M1 = sm(r, List.add(ABAC, transpose(ABAC)));
    let M2 = sm(
        sub(mul(aA, mul(dB, dC)),
            add(mul(dA, mul(aB, dC)),
                mul(dA, mul(dB, aC)))),
        ABAC);
    const v = List.add(
        List.sub(sm(aC, AB), sm(aB, AC)),
        sm(rm(0.5, aA), BC));
    M2 = List.add(M2, sm(mul(dA, dA), mm(transpose(BC), v)));
    M2 = List.add(M2, transpose(M2));
    const res1 = List.normalizeMax(List.add(M1, M2));
    const res2 = List.normalizeMax(List.sub(M1, M2));
    el.results = tracing2Conics(res1, res2).value;
};
geoOps.ConicBy1Pol2P1L.stateSize = tracing2Conics.stateSize;

// Given (A, a, B, c, d), compute conic such that
// 1. (A, a) is a pole-polar pair,
// 2. B is incident with the conic and
// 3. c, d are tangents to the conic
geoOps.ConicBy1Pol1P2L = {};
geoOps.ConicBy1Pol1P2L.kind = "Cs";
geoOps.ConicBy1Pol1P2L.signature = ["P", "L", "P", "L", "L"];
geoOps.ConicBy1Pol1P2L.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const a = csgeo.csnames[(el.args[1])].homog;
    const B = csgeo.csnames[(el.args[2])].homog;
    const c = csgeo.csnames[(el.args[3])].homog;
    const d = csgeo.csnames[(el.args[4])].homog;

    const add = CSNumber.add;
    const asList = List.turnIntoCSList;
    const cp = List.cross;
    const mm = List.productMM;
    const mul = CSNumber.mult;
    const rm = CSNumber.realmult;
    const sm = List.scalmult;
    const sp = List.scalproduct;
    const sub = CSNumber.sub;
    const transpose = List.transpose;

    const aA = sp(a, A);
    const aB = sp(a, B);
    const cA = sp(c, A);
    const cB = sp(c, B);
    const dA = sp(d, A);
    const dB = sp(d, B);
    const aAA = mul(aA, aA);
    const aAB = mul(aA, aB);
    const aBB = mul(aB, aB);
    const cAA = mul(cA, cA);
    const cAB = mul(cA, cB);
    const cBB = mul(cB, cB);
    const dAA = mul(dA, dA);
    const dAB = mul(dA, dB);
    const dBB = mul(dB, dB);
    let fa = mul(mul(aAA, cBB), dBB);
    fa = sub(fa, rm(2, mul(mul(aAB, cAB), dBB)));
    fa = sub(fa, rm(2, mul(mul(aAB, cBB), dAB)));
    fa = add(fa, rm(0.5, mul(mul(aBB, cAA), dBB)));
    fa = add(fa, rm(3, mul(mul(aBB, cAB), dAB)));
    fa = add(fa, rm(0.5, mul(mul(aBB, cBB), dAA)));
    let fc = mul(mul(aA, cB), dB);
    fc = sub(fc, mul(mul(aB, cA), dB));
    fc = sub(fc, mul(mul(aB, cB), dA));
    fc = mul(fc, mul(aBB, dA));
    let fd = sub(mul(aA, cB), rm(2, mul(aB, cA)));
    fd = mul(fd, mul(aBB, mul(cB, dA)));
    let M1 = mm(transpose(asList([a])), asList([List.add(List.add(
        sm(fa, a), sm(fc, c)), sm(fd, d))]));
    const cv = asList([c]);
    M1 = List.add(M1, sm(
        rm(0.5, mul(mul(aBB, aBB), dAA)), mm(transpose(cv), cv)));
    M1 = List.add(M1, sm(aBB, mm(transpose(asList([d])), asList([
        List.add(
            sm(sub(
                sub(rm(2, mul(aAB, cAB)), mul(aAA, cBB)),
                rm(0.5, mul(aBB, cAA))), d),
            sm(
                mul(List.det3(a, c, d), sub(mul(aA, cB), mul(aB, cA))),
                cp(A, B)))
    ]))));
    M1 = List.add(M1, transpose(M1));
    const r = CSNumber.sqrt(mul(mul(cB, dB), mul(
        sub(mul(aA, cB), rm(2, mul(aB, cA))),
        sub(mul(aA, dB), rm(2, mul(aB, dA))))));
    let M2 = mm(transpose(asList([a])), asList([List.sub(
        sm(sub(
            mul(aB, add(mul(cA, dB), mul(cB, dA))),
            mul(aA, mul(cB, dB))), a),
        sm(aBB, List.add(sm(dA, c), sm(cA, d))))]));
    M2 = List.add(M2, sm(mul(aA, aBB), mm(
        transpose(asList([c])), asList([d]))));
    M2 = sm(r, M2);
    M2 = List.add(M2, transpose(M2));
    const res1 = List.normalizeMax(List.add(M1, M2));
    const res2 = List.normalizeMax(List.sub(M1, M2));
    el.results = tracing2Conics(res1, res2).value;
};
geoOps.ConicBy1Pol1P2L.stateSize = tracing2Conics.stateSize;

geoOps._helper.coHarmonic = (a1, a2, b1, b2) => {
    const poi = List.realVector([100 * Math.random(), 100 * Math.random(), 1]);

    const ix = List.det3(poi, b1, a1);
    const jx = List.det3(poi, b1, a2);
    const iy = List.det3(poi, b2, a1);
    const jy = List.det3(poi, b2, a2);

    const sqj = CSNumber.sqrt(CSNumber.mult(jy, jx));
    const sqi = CSNumber.sqrt(CSNumber.mult(iy, ix));

    const mui = General.mult(a1, sqj);
    const tauj = General.mult(a2, sqi);

    const out1 = List.add(mui, tauj);
    const out2 = List.sub(mui, tauj);

    return [out1, out2];
};

geoOps.ConicInSquare = {};
geoOps.ConicInSquare.kind = "C";
geoOps.ConicInSquare.signature = ["P", "P", "P", "P"];
geoOps.ConicInSquare.updatePosition = el => {
    const A = csgeo.csnames[(el.args[0])].homog;
    const B = csgeo.csnames[(el.args[1])].homog;
    const C = csgeo.csnames[(el.args[2])].homog;
    const D = csgeo.csnames[(el.args[3])].homog;
    // Compute projective transformation from basis to given points (A, B, C, D)
    const m1 = eval_helper.basismap(A, B, C, D);
    // Compute projective transformation from basis to the corners of a square
    // tangent to a unit circle combined with applying this to the unit circle
    // matrix. The pre-computed constant result scaled by 1/16 is created here.
    const o = CSNumber.one;
    const m2Tucm2 = geoOps._helper.buildConicMatrix([o, o, o, CSNumber.real(-3), o, o]);
    // Complete transformation using m1 and m2Tucm2
    const m1a = List.adjoint3(m1);
    let mC = List.productMM(List.productMM(List.transpose(m1a), m2Tucm2), m1a);
    mC = List.normalizeMax(mC);
    el.matrix = General.withUsage(mC, "Conic");
};

geoOps.ConicBy5lines = {};
geoOps.ConicBy5lines.kind = "C";
geoOps.ConicBy5lines.signature = ["L", "L", "L", "L", "L"];
geoOps.ConicBy5lines.updatePosition = el => {
    const a = csgeo.csnames[(el.args[0])].homog;
    const b = csgeo.csnames[(el.args[1])].homog;
    const c = csgeo.csnames[(el.args[2])].homog;
    const d = csgeo.csnames[(el.args[3])].homog;
    const p = csgeo.csnames[(el.args[4])].homog;

    const erg_temp = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    const erg = List.adjoint3(erg_temp);
    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps.ConicFromPrincipalDirections = {};
geoOps.ConicFromPrincipalDirections.kind = "C";
geoOps.ConicFromPrincipalDirections.signature = ["P", "P", "P"];
geoOps.ConicFromPrincipalDirections.updatePosition = el => {
    const M = csgeo.csnames[(el.args[0])].homog;
    const P1 = csgeo.csnames[(el.args[1])].homog;
    const P2 = csgeo.csnames[(el.args[2])].homog;
    const P3 = geoOps._helper.pointReflection(M, P1);
    const P1M = List.cross(P1, M);
    // Extract perpendicular direction from line P1M
    const perpDirP1M = List.turnIntoCSList([P1M.value[0], P1M.value[1], CSNumber.zero]);
    // A pair of duplicate P1M lines serves as the first degenerate conic
    const vP1M = List.turnIntoCSList([P1M]);
    // The perpendicular lines to P1M through P1 and its antipodal P3 serve as the second
    const vPP1MTP1 = List.turnIntoCSList([List.cross(P1, perpDirP1M)]);
    const vPP1MTP3 = List.turnIntoCSList([List.cross(P3, perpDirP1M)]);
    el.matrix = geoOps._helper.conicFromTwoDegenerates(vP1M, vP1M, vPP1MTP1, vPP1MTP3, P2);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix = General.withUsage(el.matrix, "Conic");
};

geoOps.CircleBy3 = {};
geoOps.CircleBy3.kind = "C";
geoOps.CircleBy3.signature = ["P", "P", "P"];
geoOps.CircleBy3.updatePosition = el => {
    const a = csgeo.csnames[(el.args[0])].homog;
    const b = csgeo.csnames[(el.args[1])].homog;
    const c = List.ii;
    const d = List.jj;
    const p = csgeo.csnames[(el.args[2])].homog;

    const erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    el.matrix = List.normalizeMax(erg);
    el.matrix = General.withUsage(el.matrix, "Circle");

};

geoOps.ArcBy3 = {};
geoOps.ArcBy3.kind = "C";
geoOps.ArcBy3.signature = ["P", "P", "P"];
geoOps.ArcBy3.updatePosition = el => {
    geoOps.CircleBy3.updatePosition(el);
    el.startPoint = csgeo.csnames[(el.args[0])].homog;
    el.viaPoint = csgeo.csnames[(el.args[1])].homog;
    el.endPoint = csgeo.csnames[(el.args[2])].homog;
};
geoOps.ArcBy3.initialize = el => {
    el.startPoint = csgeo.csnames[(el.args[0])].homog;
    el.viaPoint = csgeo.csnames[(el.args[1])].homog;
    el.endPoint = csgeo.csnames[(el.args[2])].homog;
    el.isArc = true;
};

geoOps.PolarOfPoint = {};
geoOps.PolarOfPoint.kind = "L";
geoOps.PolarOfPoint.signature = ["P", "C"];
geoOps.PolarOfPoint.updatePosition = el => {
    const point = csgeo.csnames[(el.args[0])];
    const conic = csgeo.csnames[(el.args[1])];
    let homog = General.mult(conic.matrix, point.homog);
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Line");
};

geoOps.PolarOfLine = {};
geoOps.PolarOfLine.kind = "P";
geoOps.PolarOfLine.signature = ["L", "C"];
geoOps.PolarOfLine.updatePosition = el => {
    const line = csgeo.csnames[(el.args[0])];
    const conic = csgeo.csnames[(el.args[1])];
    const dualMatrix = List.adjoint3(conic.matrix);
    let homog = General.mult(dualMatrix, line.homog);
    homog = List.normalizeMax(homog);
    el.homog = General.withUsage(homog, "Point");
};


geoOps.AngleBisector = {};
geoOps.AngleBisector.kind = "Ls";
geoOps.AngleBisector.signature = ["L", "L", "P"];
geoOps.AngleBisector.updatePosition = el => {
    const a = csgeo.csnames[el.args[0]].homog;
    const b = csgeo.csnames[el.args[1]].homog;
    const p = csgeo.csnames[el.args[2]].homog;
    const add = List.add;
    const sub = List.sub;
    const abs = List.abs;
    const cross = List.cross;
    const sm = List.scalmult;
    const nm = List.normalizeMax;
    const isAlmostZero = List._helper.isAlmostZero;
    const linfty = List.linfty;
    const na = sm(abs(cross(cross(linfty, b), linfty)), a);
    const nb = sm(abs(cross(cross(linfty, a), linfty)), b);
    let res1 = sub(na, nb);
    let res2 = add(na, nb);
    if (isAlmostZero(res1)) res1 = cross(cross(cross(linfty, res2), linfty), p);
    if (isAlmostZero(res2)) res2 = cross(cross(cross(linfty, res1), linfty), p);
    el.results = tracing2(nm(res1), nm(res2));
};
geoOps.AngleBisector.stateSize = tracing2.stateSize;

geoOps._helper.IntersectLC = (l, c) => {
    const N = CSNumber;
    const l1 = List.crossOperator(l);
    const l2 = List.transpose(l1);
    const s = General.mult(l2, General.mult(c, l1));

    let maxidx = List.maxIndex(l, CSNumber.abs2);
    let a11;
    let a12;
    let a21;
    let a22;
    let b;
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
    const alp = N.div(N.sqrt(N.sub(N.mult(a12, a21), N.mult(a11, a22))), b);
    let erg = List.add(s, List.scalmult(alp, l1));

    maxidx = List.maxIndex(erg, List.abs2);
    let erg1 = erg.value[maxidx];
    erg1 = List.normalizeMax(erg1);
    erg1 = General.withUsage(erg1, "Point");
    erg = List.transpose(erg);
    maxidx = List.maxIndex(erg, List.abs2);
    let erg2 = erg.value[maxidx];
    erg2 = List.normalizeMax(erg2);
    erg2 = General.withUsage(erg2, "Point");
    return [erg1, erg2];
};

geoOps.IntersectLC = {};
geoOps.IntersectLC.kind = "Ps";
geoOps.IntersectLC.signature = ["L", "C"];
geoOps.IntersectLC.updatePosition = el => {
    const l = csgeo.csnames[(el.args[0])].homog;
    const c = csgeo.csnames[(el.args[1])].matrix;

    const erg = geoOps._helper.IntersectLC(l, c);
    const erg1 = erg[0];
    const erg2 = erg[1];
    el.results = tracing2(erg1, erg2);
};
geoOps.IntersectLC.stateSize = tracing2.stateSize;

geoOps.OtherIntersectionCL = {};
geoOps.OtherIntersectionCL.kind = "P";
geoOps.OtherIntersectionCL.signature = ["C", "L", "P"];
geoOps.OtherIntersectionCL.updatePosition = el => {
    const l = csgeo.csnames[(el.args[1])].homog;
    const c = csgeo.csnames[(el.args[0])].matrix;
    const p = csgeo.csnames[(el.args[2])].homog;

    const erg = geoOps._helper.IntersectLC(l, c);
    const erg1 = erg[0];
    const erg2 = erg[1];
    const d1 = List.projectiveDistMinScal(erg1, p);
    const d2 = List.projectiveDistMinScal(erg2, p);
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
geoOps.IntersectCirCir.updatePosition = el => {
    const c1 = csgeo.csnames[(el.args[0])].matrix;
    const c2 = csgeo.csnames[(el.args[1])].matrix;

    const ct1 = c2.value[0].value[0];
    const line1 = List.scalmult(ct1, c1.value[2]);
    const ct2 = c1.value[0].value[0];
    const line2 = List.scalmult(ct2, c2.value[2]);
    let ll = List.sub(line1, line2);
    ll = List.turnIntoCSList([
        ll.value[0], ll.value[1], CSNumber.realmult(0.5, ll.value[2])
    ]);
    ll = List.normalizeMax(ll);


    const erg = geoOps._helper.IntersectLC(ll, c1);
    const erg1 = erg[0];
    const erg2 = erg[1];
    el.results = tracing2(erg1, erg2);
};
geoOps.IntersectCirCir.stateSize = tracing2.stateSize;


geoOps.OtherIntersectionCC = {};
geoOps.OtherIntersectionCC.kind = "P";
geoOps.OtherIntersectionCC.signature = ["C", "C", "P"];
geoOps.OtherIntersectionCC.updatePosition = el => {
    const c1 = csgeo.csnames[(el.args[0])].matrix;
    const c2 = csgeo.csnames[(el.args[1])].matrix;
    const p = csgeo.csnames[(el.args[2])].homog;

    const ct1 = c2.value[0].value[0];
    const line1 = List.scalmult(ct1, c1.value[2]);
    const ct2 = c1.value[0].value[0];
    const line2 = List.scalmult(ct2, c2.value[2]);
    let ll = List.sub(line1, line2);
    ll = List.turnIntoCSList([
        ll.value[0], ll.value[1], CSNumber.realmult(0.5, ll.value[2])
    ]);
    ll = List.normalizeMax(ll);


    const erg = geoOps._helper.IntersectLC(ll, c1);
    const erg1 = erg[0];
    const erg2 = erg[1];
    const d1 = List.projectiveDistMinScal(erg1, p);
    const d2 = List.projectiveDistMinScal(erg2, p);
    if (d1 < d2) {
        el.homog = erg2;
    } else {
        el.homog = erg1;
    }
    el.homog = List.normalizeMax(el.homog);
    el.homog = General.withUsage(el.homog, "Point");

};


geoOps._helper.IntersectConicConic = (A, B) => {
    const myeps = 1e-24;

    const A1 = A.value[0];
    const A2 = A.value[1];
    const A3 = A.value[2];
    const B1 = B.value[0];
    const B2 = B.value[1];
    const B3 = B.value[2];

    let c3 = List.det3(A1, A2, A3);
    let c2 = CSNumber.add(CSNumber.add(
        List.det3(A1, A2, B3), List.det3(A1, B2, A3)), List.det3(B1, A2, A3));
    let c1 = CSNumber.add(CSNumber.add(
        List.det3(A1, B2, B3), List.det3(B1, A2, B3)), List.det3(B1, B2, A3));
    let c0 = List.det3(B1, B2, B3);
    // det(a*A + b*B) = a^3*c3 + a^2*b*c2 + a*b^2*c1 + b^3*c0 = 0

    let Aabs2 = CSNumber.abs2(c3).value.real;
    let Babs2 = CSNumber.abs2(c0).value.real;
    if (Aabs2 < Babs2) {
        // ensure |c3| > |c0| so if only one is singular, it's B = (0*A + B)
        let tmp = A;
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

    let CDeg1;
    let CDeg2;
    if (Aabs2 < myeps) { // both are degenerate
        CDeg1 = A;
        CDeg2 = B;
    } else {
        // produce two DISTINCT degenerate Conics
        const sols = CSNumber.solveCubic(c3, c2, c1, c0);
        const d01 = CSNumber.abs2(CSNumber.sub(sols[0], sols[1])).value.real;
        const d02 = CSNumber.abs2(CSNumber.sub(sols[0], sols[2])).value.real;
        const d12 = CSNumber.abs2(CSNumber.sub(sols[1], sols[2])).value.real;
        let sol1;
        let sol2;
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
    const lines1 = geoOps._helper.splitDegenConic(CDeg1);
    const l11 = lines1[0];
    const l12 = lines1[1];

    const lines2 = geoOps._helper.splitDegenConic(CDeg2);
    const l21 = lines2[0];
    const l22 = lines2[1];

    let p1 = List.cross(l11, l21);
    let p2 = List.cross(l12, l21);
    let p3 = List.cross(l11, l22);
    let p4 = List.cross(l12, l22);

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
geoOps.IntersectConicConic.updatePosition = el => {
    const AA = csgeo.csnames[(el.args[0])].matrix;
    const BB = csgeo.csnames[(el.args[1])].matrix;

    let erg = geoOps._helper.IntersectConicConic(AA, BB);
    erg = tracing4(erg[0], erg[1], erg[2], erg[3]);
    el.results = erg;
    //    el.results = List.turnIntoCSList(erg);
};
geoOps.IntersectConicConic.stateSize = tracing4.stateSize;


geoOps.SelectP = {};
geoOps.SelectP.kind = "P";
geoOps.SelectP.signature = ["Ps"];
geoOps.SelectP.initialize = el => {
    if (el.index !== undefined)
        return el.index - 1;
    const set = csgeo.csnames[(el.args[0])].results.value;
    const pos = geoOps._helper.initializePoint(el);
    let d1 = List.projectiveDistMinScal(pos, set[0]);
    let best = 0;
    for (let i = 1; i < set.length; ++i) {
        const d2 = List.projectiveDistMinScal(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectP.updatePosition = el => {
    const set = csgeo.csnames[(el.args[0])];
    el.homog = set.results.value[el.param];
};

geoOps.SelectL = {};
geoOps.SelectL.kind = "L";
geoOps.SelectL.signature = ["Ls"];
geoOps.SelectL.initialize = el => {
    if (el.index !== undefined)
        return el.index - 1;
    const set = csgeo.csnames[(el.args[0])].results.value;
    const pos = geoOps._helper.initializeLine(el);
    let d1 = List.projectiveDistMinScal(pos, set[0]);
    let best = 0;
    for (let i = 1; i < set.length; ++i) {
        const d2 = List.projectiveDistMinScal(pos, set[i]);
        if (d2 < d1) {
            d1 = d2;
            best = i;
        }
    }
    return best;
};
geoOps.SelectL.updatePosition = el => {
    const set = csgeo.csnames[(el.args[0])];
    el.homog = set.results.value[el.param];
    el.homog = General.withUsage(el.homog, "Line");
};

geoOps._helper.moebiusStep = (a, b, c) => {
    const add = CSNumber.add;
    const sub = CSNumber.sub;
    const mult = CSNumber.mult;
    const ax = a.value[0];
    const ay = a.value[1];
    const az = a.value[2];
    const bx = b.value[0];
    const by = b.value[1];
    const bz = b.value[2];
    const cx = c.value[0];
    const cy = c.value[1];
    const cz = c.value[2];
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
    const d1 = sub(mult(bz, cx), mult(bx, cz));
    const d2 = sub(mult(bz, cy), mult(by, cz));
    const d3 = sub(mult(ax, cz), mult(az, cx));
    const d4 = sub(mult(ay, cz), mult(az, cy));
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
geoOps.TrMoebius.updatePosition = el => {
    const neg = CSNumber.neg;
    const A1 = (csgeo.csnames[el.args[0]]).homog;
    const A2 = (csgeo.csnames[el.args[2]]).homog;
    const A3 = (csgeo.csnames[el.args[4]]).homog;
    const A = geoOps._helper.moebiusStep(A1, A2, A3);
    const B1 = (csgeo.csnames[el.args[1]]).homog;
    const B2 = (csgeo.csnames[el.args[3]]).homog;
    const B3 = (csgeo.csnames[el.args[5]]).homog;
    const B = geoOps._helper.moebiusStep(B1, B2, B3);

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
    const mB = List.normalizeMax(List.matrix([
        [B[0], neg(B[1]), B[4], neg(B[5])],
        [B[1], B[0], B[5], B[4]],
        [B[2], neg(B[3]), B[6], neg(B[7])],
        [B[3], B[2], B[7], B[6]]
    ]));
    const mAa = List.normalizeMax(List.matrix([
        [A[6], neg(A[4])],
        [A[7], neg(A[5])],
        [neg(A[2]), A[0]],
        [neg(A[3]), A[1]]
    ]));
    const C = List.normalizeMax(List.productMM(mB, mAa));

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

geoOps._helper.moebiusPair = el => {
    /*
    Build two matrices with the interesting property that for pxy = px + i*py
    this essentially encodes a Möbius transformation including division:

                                ⎛Re((a*pxy + b*pz)*conj(c*pxy + d*pz))⎞
    cross(mat1 * p, mat2 * p) = ⎜Im((a*pxy + b*pz)*conj(c*pxy + d*pz))⎟
                                ⎝   (c*pxy + d*pz)*conj(c*pxy + d*pz) ⎠
    */
    const m = el.moebius;
    const neg = CSNumber.neg;
    const flip = m.anti ? neg : General.identity;
    const mats = List.normalizeMax(List.turnIntoCSList([List.matrix([
        [neg(m.cr), flip(m.ci), neg(m.dr)],
        [m.ci, flip(m.cr), m.di],
        [m.ar, neg(flip(m.ai)), m.br]
    ]), List.matrix([
        [neg(m.ci), neg(flip(m.cr)), neg(m.di)],
        [neg(m.cr), flip(m.ci), neg(m.dr)],
        [m.ai, flip(m.ar), m.bi]
    ])]));
    el.mat1 = mats.value[0];
    el.mat2 = mats.value[1];
};

geoOps._helper.inverseMoebius = m => {
    const neg = CSNumber.neg;
    const flip = m.anti ? neg : General.identity;
    return {
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
};

geoOps.TrInverseMoebius = {};
geoOps.TrInverseMoebius.kind = "Mt";
geoOps.TrInverseMoebius.signature = ["Mt"];
geoOps.TrInverseMoebius.updatePosition = el => {
    const m = csgeo.csnames[el.args[0]].moebius;
    el.moebius = geoOps._helper.inverseMoebius(m);
    geoOps._helper.moebiusPair(el);
};

geoOps.TrMoebiusP = {};
geoOps.TrMoebiusP.kind = "P";
geoOps.TrMoebiusP.signature = ["Mt", "P"];
geoOps.TrMoebiusP.updatePosition = el => {
    const t = csgeo.csnames[(el.args[0])];
    const p = csgeo.csnames[(el.args[1])].homog;
    const l1 = List.productMV(t.mat1, p);
    const l2 = List.productMV(t.mat2, p);
    el.homog = List.normalizeMax(List.cross(l1, l2));
    el.homog = General.withUsage(el.homog, "Point");
};

geoOps._helper.TrMoebiusP = (p, Tr) => {
    const l1 = List.productMV(Tr.mat1, p);
    const l2 = List.productMV(Tr.mat2, p);
    return List.normalizeMax(List.cross(l1, l2));
};

geoOps.TrMoebiusL = {};
geoOps.TrMoebiusL.kind = "C";
geoOps.TrMoebiusL.signature = ["Mt", "L"];
geoOps.TrMoebiusL.updatePosition = el => {
    const t = csgeo.csnames[(el.args[0])];
    const l = csgeo.csnames[(el.args[1])].homog;

    const getRandLine = () => {
        const rline = List.realVector([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
        return List.normalizeMax(rline);
    };

    const a1 = List.cross(getRandLine(), l);
    const a2 = List.cross(getRandLine(), l);
    const a3 = List.cross(getRandLine(), l);

    const b1 = geoOps._helper.TrMoebiusP(a1, t);
    const b2 = geoOps._helper.TrMoebiusP(a2, t);
    const b3 = geoOps._helper.TrMoebiusP(a3, t);

    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

geoOps.TrMoebiusS = {};
geoOps.TrMoebiusS.kind = "C";
geoOps.TrMoebiusS.signature = ["Mt", "S"];
geoOps.TrMoebiusS.updatePosition = el => {
    const tr = csgeo.csnames[(el.args[0])];
    const s = csgeo.csnames[(el.args[1])];

    const a1 = s.startpos;
    const a3 = s.endpos;
    const a2 = List.add(a1, a3);

    const b1 = geoOps._helper.TrMoebiusP(a1, tr);
    const b2 = geoOps._helper.TrMoebiusP(a2, tr);
    const b3 = geoOps._helper.TrMoebiusP(a3, tr);
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
geoOps.TrMoebiusC.signatureConstraints = el => csgeo.csnames[el.args[1]].matrix.usage === "Circle";
geoOps.TrMoebiusC.updatePosition = el => {
    const t = csgeo.csnames[(el.args[0])];
    const cir = csgeo.csnames[(el.args[1])].matrix;

    const getRandLine = () => {
        const rline = List.realVector([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
        return List.normalizeMax(rline);
    };

    const pts1 = geoOps._helper.IntersectLC(getRandLine(), cir);
    const pts2 = geoOps._helper.IntersectLC(getRandLine(), cir);

    const a1 = pts1[0];
    const a2 = pts1[1];
    const a3 = pts2[1];

    const b1 = geoOps._helper.TrMoebiusP(a1, t);
    const b2 = geoOps._helper.TrMoebiusP(a2, t);
    const b3 = geoOps._helper.TrMoebiusP(a3, t);

    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

geoOps.TrMoebiusArc = {};
geoOps.TrMoebiusArc.kind = "C";
geoOps.TrMoebiusArc.signature = ["Mt", "C"];
geoOps.TrMoebiusArc.signatureConstraints = el => csgeo.csnames[el.args[1]].isArc;
geoOps.TrMoebiusArc.updatePosition = el => {
    const t = csgeo.csnames[(el.args[0])];
    const Arc = csgeo.csnames[(el.args[1])];

    const a1 = Arc.startPoint;
    const a2 = Arc.viaPoint;
    const a3 = Arc.endPoint;

    const b1 = geoOps._helper.TrMoebiusP(a1, t);
    const b2 = geoOps._helper.TrMoebiusP(a2, t);
    const b3 = geoOps._helper.TrMoebiusP(a3, t);
    el.startPoint = b1;
    el.viaPoint = b2;
    el.endPoint = b3;

    el.isArc = true;
    el.matrix = List.normalizeMax(geoOps._helper.ConicBy5(null, b1, b2, b3, List.ii, List.jj));
    el.matrix = General.withUsage(el.matrix, "Circle");
};

// Produces the transformation matrix and its dual
geoOps._helper.trBuildMatrix = (el, oneStep) => {
    const m0 = oneStep(0);
    const m1 = oneStep(1);
    let m = List.productMM(m1, List.adjoint3(m0));
    el.matrix = List.normalizeMax(m);
    m = List.transpose(List.productMM(m0, List.adjoint3(m1)));
    el.dualMatrix = List.normalizeMax(m);
};

// Define a projective transformation given four points and their images
geoOps.TrProjection = {};
geoOps.TrProjection.kind = "Tr";
geoOps.TrProjection.signature = ["P", "P", "P", "P", "P", "P", "P", "P"];
geoOps.TrProjection.initialize = el => {
    el.isEuclidean = 0;
};
geoOps.TrProjection.updatePosition = el => {
    geoOps._helper.trBuildMatrix(el, offset => eval_helper.basismap(
        csgeo.csnames[el.args[0 + offset]].homog,
        csgeo.csnames[el.args[2 + offset]].homog,
        csgeo.csnames[el.args[4 + offset]].homog,
        csgeo.csnames[el.args[6 + offset]].homog
    ));
};

// Define an affine transformation given three points and their images
// see https://github.com/CindyJS/CindyJS/pull/148 and
// https://gist.github.com/elkins0/f5a98a5ae98b8a8c7571
// https://github.com/CindyJS/CindyJS/files/65335/TrAffine.pdf
geoOps.TrAffine = {};
geoOps.TrAffine.kind = "Tr";
geoOps.TrAffine.signature = ["P", "P", "P", "P", "P", "P"];
geoOps.TrAffine.initialize = el => {
    el.isEuclidean = 0;
};
geoOps.TrAffine.updatePosition = el => {
    const mult = CSNumber.mult;
    const sm = List.scalmult;
    const mat = List.turnIntoCSList;
    const t = List.transpose;
    const nm = List.normalizeMax;
    const mm = List.productMM;
    const adj = List.adjoint3;
    // Get the set of points
    const ps1 = mat([
        csgeo.csnames[el.args[0]].homog,
        csgeo.csnames[el.args[2]].homog,
        csgeo.csnames[el.args[4]].homog
    ]);
    // Get the set of thier images
    const ps2 = mat([
        csgeo.csnames[el.args[1]].homog,
        csgeo.csnames[el.args[3]].homog,
        csgeo.csnames[el.args[5]].homog
    ]);
    const ps1t = t(ps1);
    const ps2t = t(ps2);
    const z1 = ps1t.value[2].value;
    const z2 = ps2t.value[2].value;
    const u = [mult(z1[0], z2[2]), mult(z1[1], z2[0]), mult(z1[2], z2[1])];
    let w = adj(ps1t).value;
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
geoOps.TrSimilarity.initialize = el => {
    el.isEuclidean = 1;
};
geoOps.TrSimilarity.updatePosition = el => {
    geoOps._helper.trBuildMatrix(el, offset => {
        const a = csgeo.csnames[el.args[0 + offset]].homog;
        const b = csgeo.csnames[el.args[2 + offset]].homog;
        return eval_helper.basismap(a, b, List.ii, List.jj);
    });
};

// Define a translation transformation given one point and its image
geoOps.TrTranslation = {};
geoOps.TrTranslation.kind = "Tr";
geoOps.TrTranslation.signature = ["P", "P"];
geoOps.TrTranslation.initialize = el => {
    el.isEuclidean = 1;
};
geoOps.TrTranslation.updatePosition = el => {
    /*
        Build this matrix when a is [aX, aY, aZ] and  b is [bX, bY, bZ]:
            ⎛aZ*bZ   0    aZ*bX-bZ*aX⎞
        m = ⎜  0   aZ*bZ  aZ*bY-bZ*aY⎟
            ⎝  0     0       aZ*bZ   ⎠
    */
    const a = csgeo.csnames[el.args[0]].homog;

    const b = csgeo.csnames[el.args[1]].homog;
    const c = List.cross(a, b).value;
    let n = CSNumber.mult(a.value[2], b.value[2]);
    const mat = List.turnIntoCSList;
    const neg = CSNumber.neg;
    const zero = CSNumber.zero;

    let m = mat([
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

// Define a rotation transformation given the center of rotation point and an angle
geoOps.TrRotationPNumb = {};
geoOps.TrRotationPNumb.kind = "Tr";
geoOps.TrRotationPNumb.signature = ["P", "V"];
geoOps.TrRotationPNumb.updatePosition = el => {
    /*
        Given a point p as [x, y, z] and an angle θ, where c is cos(θ)
        and s is sin(θ), build this matrix:
        ⎛    c*z        -s*z     (1-c)*x+s*y⎞
        ⎜    s*z         c*z     (1-c)*y-s*x⎟
        ⎝     0           0           z     ⎠
        and its dual:
        ⎛    c*z        -s*z          0     ⎞
        ⎜    s*z         c*z          0     ⎟
        ⎝(1-c)*x-s*y (1-c)*y+s*x      z     ⎠
        Based on the matrix formula in terms of θ and pivot [x/z, y/z, 1]:
        z*translate([x/z, y/z, 1])·rotate(θ)·translate([-x/z, -y/z, 1]).
    */
    const p = csgeo.csnames[el.args[0]].homog.value;
    const th = csgeo.csnames[el.args[1]].value;
    const mult = CSNumber.mult;
    const add = CSNumber.add;
    const sub = CSNumber.sub;
    const mat = List.turnIntoCSList;
    const nm = List.normalizeMax;
    const zero = CSNumber.zero;
    const x = p[0];
    const y = p[1];
    const z = p[2];
    const c = CSNumber.cos(th);
    const s = CSNumber.sin(th);
    const t = sub(CSNumber.real(1), c);
    const tx = mult(t, x);
    const ty = mult(t, y);
    const sx = mult(s, x);
    const sy = mult(s, y);
    const cz = mult(c, z);
    const sz = mult(s, z);
    const nsz = CSNumber.neg(sz);
    el.matrix = nm(mat([
        mat([cz, nsz, add(tx, sy)]),
        mat([sz, cz, sub(ty, sx)]),
        mat([zero, zero, z])
    ]));
    el.dualMatrix = nm(mat([
        mat([cz, nsz, zero]),
        mat([sz, cz, zero]),
        mat([sub(tx, sy), add(ty, sx), z])
    ]));
};

// Define a reflective transformation given a point
geoOps.TrReflectionP = {};
geoOps.TrReflectionP.kind = "Tr";
geoOps.TrReflectionP.signature = ["P"];
geoOps.TrReflectionP.initialize = el => {
    el.isEuclidean = 1;
};
geoOps.TrReflectionP.updatePosition = el => {
    /*
        Build this matrix when p is [x, y, z]:

        ⎛-z/2  0   x ⎞
        ⎜  0 -z/2  y ⎟
        ⎝  0   0  z/2⎠
    */
    const p = csgeo.csnames[el.args[0]].homog.value;
    const n = CSNumber.realmult(-0.5, p[2]);
    const zero = CSNumber.zero;
    let m = List.turnIntoCSList([
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
geoOps.TrReflectionL.initialize = el => {
    el.isEuclidean = -1;
};
geoOps.TrReflectionL.updatePosition = el => {
    /*
        Build this matrix when l is [x, y, z]:

        ⎛(x^2-y^2)/2     x*y         x*z    ⎞
        ⎜    x*y    -(x^2-y^2)/2     y*z    ⎟
        ⎝     0           0     -(x^2+y^2)/2⎠
    */
    const mult = CSNumber.mult;

    const realmult = CSNumber.realmult;
    const zero = CSNumber.zero;
    const l = csgeo.csnames[el.args[0]].homog.value;
    const x = l[0];
    const y = l[1];
    const z = l[2];
    const xx = mult(x, x);
    const yy = mult(y, y);
    const pm = realmult(-0.5, CSNumber.sub(xx, yy));
    const txy = mult(x, y);

    let m = List.turnIntoCSList([
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
geoOps.TrReflectionC.signatureConstraints = el => csgeo.csnames[el.args[0]].matrix.usage === "Circle";
geoOps.TrReflectionC.updatePosition = el => {
    const m = csgeo.csnames[(el.args[0])].matrix;
    // m = [[a, 0, b], [0, a, c], [b, c, d]]
    const a = m.value[0].value[0];
    const b = m.value[0].value[2];
    const c = m.value[1].value[2];
    const d = m.value[2].value[2];
    const neg = CSNumber.neg;
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
geoOps.TrInverse.initialize = el => {
    const tr = csgeo.csnames[(el.args[0])];
    el.isEuclidean = tr.isEuclidean;
};
geoOps.TrInverse.updatePosition = el => {
    const tr = csgeo.csnames[(el.args[0])];
    const m = tr.matrix;
    el.dualMatrix = List.transpose(tr.matrix);
    el.matrix = List.transpose(tr.dualMatrix);
};

// Apply a projective transformation to a conic
geoOps.TransformC = {};
geoOps.TransformC.kind = "C";
geoOps.TransformC.signature = ["Tr", "C"];
geoOps.TransformC.updatePosition = el => {
    const d = csgeo.csnames[(el.args[0])].dualMatrix;
    const c = csgeo.csnames[(el.args[1])].matrix;
    let m = List.productMM(List.productMM(d, c), List.transpose(d));
    m = List.normalizeMax(m);
    el.matrix = General.withUsage(m, "Conic");
};


geoOps.TransformArc = {};
geoOps.TransformArc.kind = "C";
geoOps.TransformArc.signature = ["Tr", "C"];
geoOps.TransformArc.signatureConstraints = el => csgeo.csnames[el.args[0]].isArc;
geoOps.TransformArc.updatePosition = el => {
    const t = csgeo.csnames[(el.args[0])].matrix;
    const Arc = csgeo.csnames[(el.args[1])];

    const a1 = Arc.startPoint;
    const a2 = Arc.viaPoint;
    const a3 = Arc.endPoint;

    const b1 = List.normalizeMax(List.productMV(t, a1));
    const b2 = List.normalizeMax(List.productMV(t, a2));
    const b3 = List.normalizeMax(List.productMV(t, a3));

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
geoOps.TransformP.updatePosition = el => {
    const m = csgeo.csnames[(el.args[0])].matrix;
    const p = csgeo.csnames[(el.args[1])].homog;
    el.homog = List.normalizeMax(List.productMV(m, p));
    el.homog = General.withUsage(el.homog, "Point");
};

// Apply a projective transformation to a line
geoOps.TransformL = {};
geoOps.TransformL.kind = "L";
geoOps.TransformL.signature = ["Tr", "L"];
geoOps.TransformL.updatePosition = el => {
    const m = csgeo.csnames[(el.args[0])].dualMatrix;
    const l = csgeo.csnames[(el.args[1])].homog;
    el.homog = List.normalizeMax(List.productMV(m, l));
    el.homog = General.withUsage(el.homog, "Line");
};

// Apply a projective transformation to a line segment
geoOps.TransformS = {};
geoOps.TransformS.kind = "S";
geoOps.TransformS.signature = ["Tr", "S"];
geoOps.TransformS.updatePosition = el => {
    const tr = csgeo.csnames[(el.args[0])];
    const s = csgeo.csnames[(el.args[1])];
    geoOps.Segment.setSegmentPos(el,
        List.productMV(tr.dualMatrix, s.homog),
        List.productMV(tr.matrix, s.startpos),
        List.productMV(tr.matrix, s.endpos)
    );
};

geoOps.TransformPolygon = {};
geoOps.TransformPolygon.kind = "Poly";
geoOps.TransformPolygon.signature = ["Tr", "Poly"];
geoOps.TransformPolygon.updatePosition = el => {
    const m = csgeo.csnames[(el.args[0])].matrix;
    const ps = csgeo.csnames[(el.args[1])].vertices.value;
    el.vertices = List.turnIntoCSList(ps.map(p => {
        let homog = List.normalizeMax(List.productMV(m, p));
        homog = General.withUsage(homog, "Point");
        return homog;
    }));
};

geoOps.TrComposeTrTr = {};
geoOps.TrComposeTrTr.kind = "Tr";
geoOps.TrComposeTrTr.signature = ["Tr", "Tr"];
geoOps.TrComposeTrTr.initialize = el => {
    const a = csgeo.csnames[el.args[0]];
    const b = csgeo.csnames[el.args[1]];
    el.isEuclidean = a.isEuclidean * b.isEuclidean;
};
geoOps.TrComposeTrTr.updatePosition = el => {
    const a = csgeo.csnames[el.args[0]];
    const b = csgeo.csnames[el.args[1]];
    el.matrix = List.normalizeMax(List.productMM(b.matrix, a.matrix));
    el.dualMatrix = List.normalizeMax(List.productMM(b.dualMatrix, a.dualMatrix));
};

geoOps._helper.composeMtMt = (el, m, n) => {
    const add = CSNumber.add;
    const sub = CSNumber.sub;
    const mult = CSNumber.mult;

    function f1(a, b, c, d) { // a*b + c*d
        return add(mult(a, b), mult(c, d));
    }

    function f2(a, b, c, d, e, f, g, h) {
        return add(f1(a, b, c, d), f1(e, f, g, h));
    }

    function f3(a, b, c, d, e, f, g, h) {
        return sub(f1(a, b, c, d), f1(e, f, g, h));
    }

    const addsub = n.anti ? f3 : f2;
    const subadd = n.anti ? f2 : f3;
    const v = List.normalizeMax(List.turnIntoCSList([
        subadd(m.ar, n.ar, m.cr, n.br, m.ai, n.ai, m.ci, n.bi),
        addsub(m.ar, n.ai, m.cr, n.bi, m.ai, n.ar, m.ci, n.br),
        subadd(m.br, n.ar, m.dr, n.br, m.bi, n.ai, m.di, n.bi),
        addsub(m.br, n.ai, m.dr, n.bi, m.bi, n.ar, m.di, n.br),
        subadd(m.ar, n.cr, m.cr, n.dr, m.ai, n.ci, m.ci, n.di),
        addsub(m.ar, n.ci, m.cr, n.di, m.ai, n.cr, m.ci, n.dr),
        subadd(m.br, n.cr, m.dr, n.dr, m.bi, n.ci, m.di, n.di),
        addsub(m.br, n.ci, m.dr, n.di, m.bi, n.cr, m.di, n.dr)
    ])).value;
    el.moebius = {
        anti: m.anti !== n.anti,
        ar: v[0],
        ai: v[1],
        br: v[2],
        bi: v[3],
        cr: v[4],
        ci: v[5],
        dr: v[6],
        di: v[7]
    };
    geoOps._helper.moebiusPair(el);
};

geoOps._helper.euc2moeb = el => {
    const m = el.matrix.value;
    return {
        anti: el.isEuclidean < 0,
        ar: m[0].value[0],
        ai: m[1].value[0],
        br: m[0].value[2],
        bi: m[1].value[2],
        cr: CSNumber.zero,
        ci: CSNumber.zero,
        dr: m[2].value[2],
        di: CSNumber.zero
    };
};

geoOps.TrComposeMtMt = {};
geoOps.TrComposeMtMt.kind = "Mt";
geoOps.TrComposeMtMt.signature = ["Mt", "Mt"];
geoOps.TrComposeMtMt.updatePosition = el => {
    geoOps._helper.composeMtMt(
        el,
        csgeo.csnames[el.args[0]].moebius,
        csgeo.csnames[el.args[1]].moebius);
};

geoOps.TrComposeTrMt = {};
geoOps.TrComposeTrMt.kind = "Mt";
geoOps.TrComposeTrMt.signature = ["Tr", "Mt"];
geoOps.TrComposeTrMt.signatureConstraints = el => !!csgeo.csnames[el.args[0]].isEuclidean;
geoOps.TrComposeTrMt.updatePosition = el => {
    geoOps._helper.composeMtMt(
        el,
        geoOps._helper.euc2moeb(csgeo.csnames[el.args[0]]),
        csgeo.csnames[el.args[1]].moebius);
};

geoOps.TrComposeMtTr = {};
geoOps.TrComposeMtTr.kind = "Mt";
geoOps.TrComposeMtTr.signature = ["Mt", "Tr"];
geoOps.TrComposeMtTr.signatureConstraints = el => !!csgeo.csnames[el.args[1]].isEuclidean;
geoOps.TrComposeMtTr.updatePosition = el => {
    geoOps._helper.composeMtMt(
        el,
        csgeo.csnames[el.args[0]].moebius,
        geoOps._helper.euc2moeb(csgeo.csnames[el.args[1]]));
};

geoOps._helper.pointReflection = (center, point) => // If center is at infinity, the result will be center unless point
    // is also at infinity, then the result is the ideal point [0, 0, 0].
    List.normalizeMax(List.sub(
        List.scalmult(CSNumber.realmult(2, point.value[2]), center),
        List.scalmult(center.value[2], point)));

geoOps._helper.conicOtherIntersection = (conic, a, b) => {
    // With A a point on conic M, find the point on
    // line AB which also lies on that conic.
    // return BMB*A - 2*AMB*B
    const mb = List.productMV(conic, b);
    const bmb = List.scalproduct(b, mb);
    const amb = List.scalproduct(a, mb);
    const amb2 = CSNumber.realmult(-2, amb);
    const bmba = List.scalmult(bmb, a);
    const amb2b = List.scalmult(amb2, b);
    let res = List.add(bmba, amb2b);
    res = List.normalizeMax(res);
    return res;
};

geoOps.Dist = {};
geoOps.Dist.kind = "V";
geoOps.Dist.signature = ["P", "P"];
geoOps.Dist.updatePosition = el => {
    const a = csgeo.csnames[el.args[0]].homog;
    const b = csgeo.csnames[el.args[1]].homog;
    el.value = List.abs(List.sub(List.normalizeZ(a), List.normalizeZ(b)));
};

geoOps.Angle = {};
geoOps.Angle.kind = "V";
geoOps.Angle.signature = ["L", "L", "P"];
geoOps.Angle.initialize = el => {
    if (el.angle === undefined)
        el.angle = 0.5 * Math.PI;
    putStateComplexNumber(CSNumber._helper.input(el.angle));
};
geoOps.Angle.updatePosition = el => {
    const a = csgeo.csnames[el.args[0]].homog;
    const b = csgeo.csnames[el.args[1]].homog;
    const p = csgeo.csnames[el.args[2]].homog;
    const ap = List.cross(a, List.linfty);
    const bp = List.cross(b, List.linfty);
    const cr = List.crossratio3(ap, bp, List.ii, List.jj, p);
    let ang = CSNumber.mult(CSNumber.complex(0, 0.5), CSNumber.log(cr));
    const prev = getStateComplexNumber();
    const diff = (prev.value.real - ang.value.real) / Math.PI;
    const winding = Math.round(diff);
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
geoOps.Text.initialize = el => {
    el.text = String(el.text);
    if (el.pos) el.homog = geoOps._helper.initializePoint(el);
    if (el.dock) {
        if (el.dock.offset && el.dock.offset.length === 2)
            el.dock.offset = List.realVector([+el.dock.offset[0], +el.dock.offset[1]]);
        else
            el.dock.offset = List.realVector([0, 0]);
    }
};
geoOps.Text.getParamForInput = (el, pos, type) => geoOps.Free.getParamForInput(el, pos, type);
geoOps.Text.getParamFromState = el => el.homog;
geoOps.Text.putParamToState = (el, param) => {
    el.homog = param;
};

geoOps.Calculation = {};
geoOps.Calculation.kind = "Text";
geoOps.Calculation.signature = "**";
geoOps.Calculation.isMovable = true;
geoOps.Calculation.updatePosition = noop;
geoOps.Calculation.initialize = el => {
    geoOps.Text.initialize(el);
    el.calculation = analyse(el.text);
};
geoOps.Calculation.getText = el => niceprint(evaluate(el.calculation));
geoOps.Calculation.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Calculation.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Calculation.putParamToState = geoOps.Text.putParamToState;

geoOps.Equation = {};
geoOps.Equation.kind = "Text";
geoOps.Equation.isMovable = true;
geoOps.Equation.signature = "**";
geoOps.Equation.updatePosition = noop;
geoOps.Equation.initialize = el => {
    geoOps.Text.initialize(el);
    el.calculation = analyse(el.text);
};
geoOps.Equation.getText = el => el.text + " = " + niceprint(evaluate(el.calculation));
geoOps.Equation.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Equation.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Equation.putParamToState = geoOps.Text.putParamToState;

geoOps.Evaluate = {};
geoOps.Evaluate.kind = "Text";
geoOps.Evaluate.isMovable = true;
geoOps.Evaluate.signature = "**";
geoOps.Evaluate.updatePosition = noop;
geoOps.Evaluate.initialize = el => {
    geoOps.Text.initialize(el);
    el.calculation = analyse(el.text);
};
geoOps.Evaluate.getText = el => {
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
geoOps.Plot.initialize = el => {
    geoOps.Text.initialize(el);
    // Parenthesize expression to avoid modifier injection
    el.calculation = analyse("plot((" + el.text + "))");
};
geoOps.Plot.getText = el => {
    evaluate(el.calculation);
    return el.text;
};
geoOps.Plot.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Plot.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Plot.putParamToState = geoOps.Text.putParamToState;

function commonButton(el, event, button) {
    const outer = document.createElement("div");
    const img = document.createElement("img");
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUh" +
        "EUgAAAAEAAAPoCAQAAAC1v1zVAAAAGklEQVR42u3BMQEAAA" +
        "DCoPVPbQ0PoAAAgHcDC7gAAVI8ZnwAAAAASUVORK5CYII=";
    outer.className = "CindyJS-baseline";
    outer.appendChild(img);
    const inlinebox = document.createElement("div");
    inlinebox.className = "CindyJS-button";
    outer.appendChild(inlinebox);
    for (let i = 2; i < arguments.length; ++i)
        inlinebox.appendChild(arguments[i]);
    canvas.parentNode.appendChild(outer);
    el.html = arguments[arguments.length - 1];
    if (!isFiniteNumber(el.fillalpha))
        el.fillalpha = 1.0;
    if (el.fillcolor) {
        el.html.style.backgroundColor =
            Render2D.makeColor(el.fillcolor, el.fillalpha);
    }
    if (!isFiniteNumber(el.alpha))
        el.alpha = 1.0;
    if (el.color) {
        el.html.style.color =
            Render2D.makeColor(el.color, el.alpha);
    }
    let onEvent = scheduleUpdate;
    if (el.script) {
        const code = analyse(el.script);
        onEvent = () => {
            evaluate(code);
            scheduleUpdate();
        };
    }
    button.addEventListener(event, onEvent);
    if (!instanceInvocationArguments.keylistener &&
        (cscompiled.keydown || cscompiled.keyup || cscompiled.keytyped)) {
        button.addEventListener("keydown", e => {
            if (e.keyCode === 9 /* tab */ ) return;
            cs_keydown(e);
        });
        button.addEventListener("keyup", e => {
            cs_keyup(e);
        });
        button.addEventListener("keypress", e => {
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
geoOps.Button.initialize = el => {
    const button = document.createElement("button");
    commonButton(el, "click", button);
};
geoOps.Button.getParamForInput = geoOps.Text.getParamForInput;
geoOps.Button.getParamFromState = geoOps.Text.getParamFromState;
geoOps.Button.putParamToState = geoOps.Text.putParamToState;
geoOps.Button.set_fillcolor = (el, value) => {
    if (List._helper.isNumberVecN(value, 3)) {
        el.fillcolor = value.value.map(i => i.value.real);
        el.html.style.backgroundColor =
            Render2D.makeColor(el.fillcolor, el.fillalpha);
    }
};
geoOps.Button.set_color = (el, value) => {
    if (List._helper.isNumberVecN(value, 3)) {
        el.color = value.value.map(i => i.value.real);
        el.html.style.color =
            Render2D.makeColor(el.color, el.alpha);
    }
};

geoOps.ToggleButton = {};
geoOps.ToggleButton.kind = "Text";
geoOps.ToggleButton.signature = "**";
geoOps.ToggleButton.isMovable = true; // not using mouse, only via scripts
geoOps.ToggleButton.updatePosition = noop;
geoOps.ToggleButton.initialize = el => {
    const id = generateId();
    const checkbox = document.createElement("input");
    const label = document.createElement("label");
    checkbox.setAttribute("id", id);
    label.setAttribute("for", id);
    checkbox.setAttribute("type", "checkbox");
    if (el.pressed)
        checkbox.checked = true;
    el.checkbox = checkbox;
    commonButton(el, "change", checkbox, label);
};
geoOps.ToggleButton.get_text = el => General.string(String(el.text));

geoOps.ToggleButton.set_currenttext = (el, value) => {
    el.html.value = el.text = niceprint(value);
};

geoOps.ToggleButton.getParamForInput = geoOps.Text.getParamForInput;
geoOps.ToggleButton.getParamFromState = geoOps.Text.getParamFromState;
geoOps.ToggleButton.putParamToState = geoOps.Text.putParamToState;
geoOps.ToggleButton.set_fillcolor = geoOps.Button.set_fillcolor;
geoOps.ToggleButton.set_color = geoOps.Button.set_color;


geoOps.ToggleButton.set_text = geoOps.ToggleButton.set_currenttext;
geoOps.ToggleButton.get_val = geoOps.ToggleButton.get_text;
geoOps.ToggleButton.set_val = geoOps.ToggleButton.set_currenttext;

geoOps.EditableText = {};
geoOps.EditableText.kind = "Text";
geoOps.EditableText.isMovable = true; // not using mouse, only via scripts
geoOps.EditableText.signature = [];
geoOps.EditableText.updatePosition = noop;
geoOps.EditableText.initialize = el => {
    const textbox = document.createElement("input");
    textbox.setAttribute("type", "text");
    textbox.className = "CindyJS-editabletext";
    if (isFiniteNumber(el.minwidth))
        textbox.style.width = (el.minwidth - 3) + "px";
    if (typeof el.text === "string")
        textbox.value = el.text;
    textbox.addEventListener("keydown", event => {
        if (event.keyCode === 13) {
            el.text = el.html.value;
            textbox.blur();
        }
    });
    textbox.addEventListener("change", event => {
        el.text = el.html.value;
    });
    commonButton(el, "change", textbox);
};
geoOps.EditableText.getText = el => false;
geoOps.EditableText.getParamForInput = geoOps.Text.getParamForInput;
geoOps.EditableText.getParamFromState = geoOps.Text.getParamFromState;
geoOps.EditableText.putParamToState = geoOps.Text.putParamToState;
geoOps.EditableText.set_fillcolor = geoOps.Button.set_fillcolor;
geoOps.EditableText.set_color = geoOps.Button.set_color;
geoOps.EditableText.get_currenttext = el => General.string(String(el.html.value));

geoOps.EditableText.get_text = geoOps.ToggleButton.get_text;
geoOps.EditableText.set_currenttext = geoOps.ToggleButton.set_currenttext;
geoOps.EditableText.set_text = geoOps.EditableText.set_currenttext;
geoOps.EditableText.get_val = geoOps.EditableText.get_text;
geoOps.EditableText.set_val = geoOps.EditableText.set_currenttext;

function noop() {}

geoOps._helper.initializePoint = el => {
    let sx = 0;
    let sy = 0;
    let sz = 0;
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
    let pos = List.turnIntoCSList([
        CSNumber._helper.input(sx),
        CSNumber._helper.input(sy),
        CSNumber._helper.input(sz)
    ]);
    pos = List.normalizeMax(pos);
    return pos;
};

geoOps._helper.initializeLine = el => {
    let sx = 0;
    let sy = 0;
    let sz = 0;
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
    let pos = List.turnIntoCSList([
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
geoOps.Poly.updatePosition = el => {
    el.vertices = List.turnIntoCSList(el.args.map(x => csgeo.csnames[x].homog));
};

let ifs = null;

geoOps.IFS = {};
geoOps.IFS.kind = "IFS";
geoOps.IFS.signature = "**"; // (Tr|Mt)*
geoOps.IFS.signatureConstraints = el => {
    for (let i = 0; i < el.args.length; ++i) {
        const kind = csgeo.csnames[el.args[i]].kind;
        if (kind !== "Tr" && kind !== "Mt")
            return false;
    }
    return el.args.length > 0;
};
geoOps.IFS.initialize = el => {
    if (ifs) {
        ifs.dirty = true;
        return;
    }
    const baseDir = CindyJS.getBaseDir();
    if (baseDir === false)
        return;
    ifs = {
        dirty: false,
        params: {
            generation: 0
        },
    };
    const worker = ifs.worker = new Worker(baseDir + "ifs.js");
    worker.onmessage = msg => {
        if (ifs.img && typeof ifs.img.close === "function")
            ifs.img.close();
        if (isShutDown) return;
        const d = msg.data;
        if (d.generation === ifs.params.generation) {
            if (d.buffer) {
                if (!ifs.canvas) {
                    ifs.canvas = document.createElement("canvas");
                    ifs.ctx = ifs.canvas.getContext("2d");
                }
                ifs.canvas.width = d.width;
                ifs.canvas.height = d.height;
                const imgSize = d.width * d.height * 4;
                const imgBytes = new Uint8ClampedArray(
                    d.buffer, d.imgPtr, imgSize);
                const imgData = new ImageData(imgBytes, d.width, d.height);
                ifs.ctx.putImageData(imgData, 0, 0);
                ifs.img = ifs.canvas;
            } else {
                ifs.img = d.img;
            }
            scheduleUpdate();
        } else {
            ifs.img = null;
        }
        if (d.buffer) {
            worker.postMessage({
                cmd: "next",
                buffer: d.buffer
            }, [d.buffer]);
        } else {
            worker.postMessage({
                cmd: "next",
            });
        }
    };
    shutdownHooks.push(worker.terminate.bind(worker));
};
geoOps.IFS.updatePosition = el => {
    ifs.dirty = true;
};
geoOps.IFS.updateParameters = () => {
    if (!ifs.worker)
        return; // no worker, nothing we can do
    const supersampling = 4;
    const msg = {
        cmd: "init",
        generation: ifs.params.generation,
        width: Math.round(csw * supersampling),
        height: Math.round(csh * supersampling)
    };
    msg.systems = csgeo.ifs.map(el => {
        let sum = 0;
        let i;
        const params = el.ifs || [];
        const trs = el.args.map((name, i) => {
            const p = params[i] || {};
            return {
                prob: p.prob || 1,
                color: p.color || [0, 0, 0]
            };
        });
        for (i = 0; i < trs.length; ++i)
            sum += trs[i].prob;
        const scale = List.realMatrix([
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, supersampling]
        ]);
        const px2hom = List.productMM(csport.toMat(), scale);
        for (i = 0; i < el.args.length; ++i) {
            const trel = csgeo.csnames[el.args[i]];
            const kind = trel.kind;
            const tr = trs[i];
            tr.kind = kind;
            tr.prob /= sum;
            if (kind === "Tr") {
                const mat = List.normalizeMax(List.productMM(
                    List.adjoint3(px2hom),
                    List.productMM(trel.matrix, px2hom)));
                if (!List._helper.isAlmostReal(mat)) {
                    tr.kind = "cplx";
                    continue;
                }
                tr.mat = mat.value.map(row => row.value.map(entry => entry.value.real));
            } else if (kind === "Mt") {
                // drawingstate matrix as a Möbius transformation
                // from homogeneous coordinates to pixels
                let view = csport.drawingstate.matrix;
                view = {
                    anti: view.det > 0,
                    ar: CSNumber.real(view.a),
                    ai: CSNumber.real(view.c),
                    br: CSNumber.real(view.tx),
                    bi: CSNumber.real(-view.ty),
                    cr: CSNumber.zero,
                    ci: CSNumber.zero,
                    dr: CSNumber.real(1 / supersampling),
                    di: CSNumber.zero
                };
                // now compose view * trel * view^{-1}
                const elLike = {};
                geoOps._helper.composeMtMt(elLike, trel.moebius, view);
                view = geoOps._helper.inverseMoebius(view);
                geoOps._helper.composeMtMt(elLike, view, elLike.moebius);
                let moeb = elLike.moebius;
                moeb = List.turnIntoCSList([
                    moeb.ar,
                    moeb.ai,
                    moeb.br,
                    moeb.bi,
                    moeb.cr,
                    moeb.ci,
                    moeb.dr,
                    moeb.di
                ]);
                if (!List._helper.isAlmostReal(moeb)) {
                    tr.kind = "cplx";
                    continue;
                }
                moeb = moeb.value;
                tr.moebius = {
                    ar: moeb[0].value.real,
                    ai: moeb[1].value.real,
                    br: moeb[2].value.real,
                    bi: moeb[3].value.real,
                    cr: moeb[4].value.real,
                    ci: moeb[5].value.real,
                    dr: moeb[6].value.real,
                    di: moeb[7].value.real,
                    sign: trel.moebius.anti ? -1 : 1
                };
            }
        }
        return {
            trafos: trs
        };
    });
    if (General.deeplyEqual(msg, ifs.params)) {
        // console.log("IFS not modified");
        return;
    }
    ++msg.generation;
    ifs.img = null;
    ifs.params = msg;
    ifs.mat = csport.drawingstate.matrix;
    // console.log(msg);
    ifs.worker.postMessage(msg);
};
geoOps.IFS.probSetter = (i, el, value) => {
    if (value.ctype === "number") {
        el.ifs[i].prob = value.value.real;
        ifs.dirty = true;
    }
};
(() => {
    for (let i = 0; i < 10; ++i)
        geoOps.IFS["set_prob" + i] = geoOps.IFS.probSetter.bind(null, i);
})();

geoOps._helper.snapPointToLine = (pos, line) => {
    // fail safe for far points
    if (CSNumber._helper.isAlmostZero(pos.value[2])) return pos;
    // project point to line - useful for semi free elements
    let projPos = geoOps._helper.projectPointToLine(pos, line);
    projPos = List.normalizeZ(projPos);

    const sx = projPos.value[0].value.real;
    const sy = projPos.value[1].value.real;
    const rx = Math.round(sx / csgridsize) * csgridsize;
    const ry = Math.round(sy / csgridsize) * csgridsize;
    const newpos = List.realVector([rx, ry, 1]);
    if (Math.abs(rx - sx) < cssnapDistance && Math.abs(ry - sy) < cssnapDistance &&
        CSNumber._helper.isAlmostZero(List.scalproduct(line, newpos))) {
        pos = geoOps._helper.projectPointToLine(newpos, line);
    }
    return pos;
};


const geoAliases = {
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

const geoMacros = {};

/* Note: currently the expansion of a macro is simply included in the
 * gslp.  This means that objects from the expansion will currently
 * end up in the allpoints() resp. alllines() results.  It might make
 * sense to actively excude elements from these by setting some flag,
 * but that hasn't been implemented yet.
 */

geoMacros.CircleMFixedr = el => {
    el.pinned = true;
    el.type = "CircleMr";
    return [el];
};

geoMacros.CircleByFixedRadius = el => {
    el.pinned = true;
    el.type = "CircleMr";
    return [el];
};

geoMacros.IntersectionConicLine = el => {
    el.args = [el.args[1], el.args[0]];
    el.type = "IntersectLC";
    return [el];
};

geoMacros.angleBisector = el => {
    const point = {
        name: el.name + "_Intersection",
        type: "Meet",
        args: el.args,
        visible: false
    };
    el.type = "AngleBisector";
    el.args = [el.args[0], el.args[1], point.name];
    return [point, el];
};

geoMacros.Transform = el => {
    const arg = csgeo.csnames[el.args[1]];
    const tr = csgeo.csnames[el.args[0]];
    // workaround for Arcs since we treat them as circles
    const akind = arg.isArc ? "Arc" : arg.kind;

    const map = {
        Tr: "Transform",
        Mt: "TrMoebius"
    };
    const op = map[tr.kind] + akind;
    if (geoOps.hasOwnProperty(op)) {
        el.type = op;
        return [el];
    } else {
        console.log(op + " not implemented yet");
        return [];
    }
};

geoMacros.TrReflection = el => {
    const op = "TrReflection" + csgeo.csnames[el.args[0]].kind;
    if (geoOps.hasOwnProperty(op)) {
        el.type = op;
        return [el];
    } else {
        console.log(op + " not implemented yet");
        return [];
    }
};

geoMacros.TrCompose = el => {
    const op = "TrCompose" + el.args.map(name => csgeo.csnames[name].kind).join("");
    if (geoOps.hasOwnProperty(op)) {
        el.type = op;
        return [el];
    } else {
        console.log(op + " not implemented yet");
        return [];
    }
};
