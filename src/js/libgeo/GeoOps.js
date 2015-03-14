geoOps = {};
geoOps._helper = {};

var geoOps = {};
geoOps._helper = {};
var geoOpMap = {};


geoOps.Join = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Join = "L";


geoOps.Segment = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Segment = "S";


geoOps.Meet = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];
    el.homog = List.cross(el1.homog, el2.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Point";
};

geoOps.Meet.visiblecheck = function(el) {
    var visible = true;
    var el1 = csgeo.csnames[(el.args[0])];
    var el2 = csgeo.csnames[(el.args[1])];

    if (el1.type === "Segment") {
        visible = onSegment(el, el1);
    }
    if (visible && el1.type === "Segment") {
        visible = onSegment(el, el2);
    }
    el.isshowing = visible;
};

geoOpMap.Meet = "P";


geoOps.Mid = function(el) {
    var x = csgeo.csnames[(el.args[0])].homog;
    var y = csgeo.csnames[(el.args[1])].homog;

    var line = List.cross(x, y);
    var infp = List.cross(line, List.linfty);
    var ix = List.det3(x, infp, line);
    var iy = List.det3(y, infp, line);
    var z1 = List.scalmult(iy, x);
    var z2 = List.scalmult(ix, y);
    el.homog = List.add(z1, z2);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Point";
};
geoOpMap.Mid = "P";


geoOps.Perp = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    var inf = List.linfty;
    var tt = List.cross(inf, l);
    tt.value = [tt.value[1], CSNumber.neg(tt.value[0]), tt.value[2]];
    el.homog = List.cross(tt, p);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Perp = "L";


geoOps.Para = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    var inf = List.linfty;
    el.homog = List.cross(List.cross(inf, l), p);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Para = "L";

geoOps.Horizontal = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ex, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Horizontal = "L";

geoOps.Vertical = function(el) {
    var el1 = csgeo.csnames[(el.args[0])];
    el.homog = List.cross(List.ey, el1.homog);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Vertical = "L";


geoOps.Through = function(el) {
    var el1 = List.normalizeZ(csgeo.csnames[(el.args[0])].homog);

    if (move && move.mover === el) {
        var xx = el1.value[0].value.real - mouse.x + move.offset.x;
        var yy = el1.value[1].value.real - mouse.y + move.offset.y;
        el.dir = List.realVector([xx, yy, 0]);
    }

    el.homog = List.cross(el.dir, el1);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Line";
};
geoOpMap.Through = "L";


geoOps.Free = function(el) {

};
geoOpMap.Free = "P";

geoOps.PointOnLine = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var p = el.homog;
    var inf = List.linfty;
    var tt = List.cross(inf, l);
    tt.value = [tt.value[1], CSNumber.neg(tt.value[0]), tt.value[2]];
    var perp = List.cross(tt, p);
    el.homog = List.cross(perp, l);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Point";
    //TODO: Handle complex and infinite Points
    var x = CSNumber.div(el.homog.value[0], el.homog.value[2]);
    var y = CSNumber.div(el.homog.value[1], el.homog.value[2]);
    el.sx = x.value.real;
    el.sy = y.value.real;
    el.sz = 1;
};
geoOpMap.PointOnLine = "P";


geoOps.PointOnCircle = function(el) { //TODO was ist hier zu tun damit das stabil bei tracen bleibt

    var c = csgeo.csnames[(el.args[0])];
    var pts = geoOps._helper.IntersectLC(List.linfty, c.matrix);
    var ln1 = General.mult(c.matrix, pts[0]);
    var ln2 = General.mult(c.matrix, pts[1]);
    var mid = List.normalizeZ(List.cross(ln1, ln2));

    if (move && move.mover === el) {
        var xx = mid.value[0].value.real - mouse.x - move.offset.x;
        var yy = mid.value[1].value.real - mouse.y - move.offset.y;
        el.angle = CSNumber.real(Math.atan2(-yy, -xx));

    }

    var angle = el.angle;

    var pt = List.turnIntoCSList([CSNumber.cos(angle), CSNumber.sin(angle), CSNumber.real(0)]);
    pt = List.scalmult(CSNumber.real(10), pt);
    pt = List.add(mid, pt);

    var ln = List.cross(pt, mid);
    var ints = geoOps._helper.IntersectLC(ln, c.matrix); //TODO richtiges Tracing einbauen!!!
    var int1 = List.normalizeZ(ints[0]);
    var int2 = List.normalizeZ(ints[1]);
    var d1 = List.abs2(List.sub(pt, int1));
    var d2 = List.abs2(List.sub(pt, int2));

    var erg = ints[0];
    if (d1.value.real > d2.value.real) {
        erg = ints[1];
    }


    el.homog = erg;
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Point";


    //TODO: Handle complex and infinite Points
    var x = CSNumber.div(el.homog.value[0], el.homog.value[2]);
    var y = CSNumber.div(el.homog.value[1], el.homog.value[2]);

    el.sx = x.value.real;
    el.sy = y.value.real;
    el.sz = 1;
};
geoOpMap.PointOnCircle = "P";


geoOps.PointOnSegment = function(el) { //TODO was ist hier zu tun damit das stabil bei tracen bleibt

    var l = csgeo.csnames[(el.args[0])].homog;
    var el1 = csgeo.csnames[csgeo.csnames[(el.args[0])].args[0]].homog;
    var el2 = csgeo.csnames[csgeo.csnames[(el.args[0])].args[1]].homog;
    var elm = el.homog;

    var xx1 = CSNumber.div(el1.value[0], el1.value[2]);
    var yy1 = CSNumber.div(el1.value[1], el1.value[2]);
    var xx2 = CSNumber.div(el2.value[0], el2.value[2]);
    var yy2 = CSNumber.div(el2.value[1], el2.value[2]);
    var xxm = CSNumber.div(elm.value[0], elm.value[2]);
    var yym = CSNumber.div(elm.value[1], elm.value[2]);
    var par;
    if (!move || move.mover === el) {

        var p = el.homog;
        var inf = List.linfty;
        var tt = List.cross(inf, l);
        tt.value = [tt.value[1], CSNumber.neg(tt.value[0]), tt.value[2]];
        var perp = List.cross(tt, p);
        el.homog = List.cross(perp, l);
        el.homog = List.normalizeMax(el.homog);
        el.homog.usage = "Point";


        var x1 = xx1.value.real;
        var y1 = yy1.value.real;
        var x2 = xx2.value.real;
        var y2 = yy2.value.real;
        var xm = xxm.value.real;
        var ym = yym.value.real;
        var d12 = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        var d1m = Math.sqrt((x1 - xm) * (x1 - xm) + (y1 - ym) * (y1 - ym));
        var d2m = Math.sqrt((x2 - xm) * (x2 - xm) + (y2 - ym) * (y2 - ym));
        var dd = d12 - d1m - d2m;
        par = d1m / d12;
        if (d1m > d12) par = 1;
        if (d2m > d12) par = 0;
        el.param = CSNumber.real(par);

    }

    par = el.param;

    var diffx = CSNumber.sub(xx2, xx1);
    var ergx = CSNumber.add(xx1, CSNumber.mult(el.param, diffx));
    var diffy = CSNumber.sub(yy2, yy1);
    var ergy = CSNumber.add(yy1, CSNumber.mult(el.param, diffy));
    var ergz = CSNumber.real(1);
    el.homog = List.turnIntoCSList([ergx, ergy, ergz]);
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Point";


    //TODO: Handle complex and infinite Points
    var x = CSNumber.div(el.homog.value[0], el.homog.value[2]);
    var y = CSNumber.div(el.homog.value[1], el.homog.value[2]);

    el.sx = x.value.real;
    el.sy = y.value.real;
    el.sz = 1;
};
geoOpMap.PointOnSegment = "P";


geoOps._helper.CenterOfConic = function(c) {
    var pts = geoOps._helper.IntersectLC(List.linfty, c);
    var ln1 = General.mult(c, pts[0]);
    var ln2 = General.mult(c, pts[1]);

    var erg = List.cross(ln1, ln2);

    return erg;
};

geoOps.CenterOfConic = function(el) {
    var c = csgeo.csnames[(el.args[0])].matrix;
    var erg = geoOps._helper.CenterOfConic(c);
    el.homog = erg;
    el.homog = List.normalizeMax(el.homog);
    el.homog.usage = "Point";


};
geoOpMap.CenterOfConic = "P";

geoOps._helper.CircleMP = function(m, p) {
    var l1 = List.crossOperator(m);
    var l2 = List.transpose(l1);


    var tang = General.mult(l2, General.mult(List.fundDual, l1));
    var mu = General.mult(General.mult(p, tang), p);
    var la = General.mult(General.mult(p, List.fund), p);
    var m1 = General.mult(mu, List.fund);
    var m2 = General.mult(la, tang);
    var erg = List.sub(m1, m2);
    return erg;
};

geoOps.CircleMP = function(el) { //TODO Performance Checken. Das ist jetzt der volle CK-ansatz
    //Weniger Allgemein geht das viiiiel schneller
    var m = csgeo.csnames[(el.args[0])].homog;
    var p = csgeo.csnames[(el.args[1])].homog;
    el.matrix = geoOps._helper.CircleMP(m, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix.usage = "Circle";

};
geoOpMap.CircleMP = "C";


geoOps.CircleMr = function(el) {
    var m = csgeo.csnames[(el.args[0])].homog;
    var mid = List.scaldiv(m.value[2], m);
    if (move && move.mover === el) {
        var xx = mid.value[0].value.real - mouse.x;
        var yy = mid.value[1].value.real - mouse.y;
        var rad = Math.sqrt(xx * xx + yy * yy); //+move.offsetrad;
        el.radius = CSNumber.real(rad + move.offsetrad);
    }
    var r = el.radius;
    var p = List.turnIntoCSList([r, CSNumber.real(0), CSNumber.real(0)]);
    p = List.add(p, mid);
    el.matrix = geoOps._helper.CircleMP(mid, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix.usage = "Circle";

};
geoOpMap.CircleMr = "C";


geoOps.CircleMFixedr = function(el) {
    var m = csgeo.csnames[(el.args[0])].homog;
    var mid = List.scaldiv(m.value[2], m);

    var r = el.radius;
    var p = List.turnIntoCSList([r, CSNumber.real(0), CSNumber.real(0)]);

    el.matrix = geoOps._helper.CircleMP(mid, p);
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix.usage = "Circle";

};
geoOpMap.CircleMFixedr = "C";


geoOps._helper.ConicBy5 = function(el, a, b, c, d, p) {

    var v23 = List.turnIntoCSList([List.cross(b, c)]);
    var v14 = List.turnIntoCSList([List.cross(a, d)]);
    var v12 = List.turnIntoCSList([List.cross(a, b)]);
    var v34 = List.turnIntoCSList([List.cross(c, d)]);
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


geoOps.ConicBy5 = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;
    var p = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);

    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix.usage = "Conic";
};
geoOpMap.ConicBy5 = "C";

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

    var idx = 0,
        k, l;
    var max = CSNumber.abs(adj_mat.value[0].value[0]).value.real;
    for (k = 1; k < 3; k++) {
        if (CSNumber.abs(adj_mat.value[k].value[k]).value.real > max) {
            idx = k;
            max = CSNumber.abs(adj_mat.value[k].value[k]).value.real;
        }
    }

    var beta = CSNumber.sqrt(CSNumber.mult(CSNumber.real(-1), adj_mat.value[idx].value[idx]));
    idx = CSNumber.real(idx + 1);
    var p = List.column(adj_mat, idx);
    if (CSNumber.abs(beta).value.real < 1e-8) {
        return nada;
    }

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
    var ii = 0,
        jj = 0;
    max = 0;
    for (k = 0; k < 3; k++)
        for (l = 0; l < 3; l++) {
            if (CSNumber.abs(C.value[k].value[l]).value.real > max) {
                ii = k;
                jj = l;
                max = CSNumber.abs(C.value[k].value[l]).value.real;
            }
        }


    var lg = C.value[ii];
    C = List.transpose(C);
    var lh = C.value[jj];

    lg.usage = "Line";
    lh.usage = "Line";

    return [lg, lh];
};

geoOps.SelectConic = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    if (!el.inited) {
        el.inited = true;
    }
    el.matrix = set.results[el.index - 1];
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix.usage = "Conic";
};
geoOpMap.SelectConic = "C";

// conic by 4 Points and 1 line
geoOps._helper.ConicBy4p1l = function(el, a, b, c, d, l) {
    var a1 = List.cross(List.cross(a, c), l);
    var a2 = List.cross(List.cross(b, d), l);
    var b1 = List.cross(List.cross(a, b), l);
    var b2 = List.cross(List.cross(c, d), l);
    var o = List.realVector(csport.to(100 * Math.random(), 100 * Math.random()));

    var r1 = CSNumber.mult(List.det3(o, a2, b1), List.det3(o, a2, b2));
    r1 = CSNumber.sqrt(r1);
    var r2 = CSNumber.mult(List.det3(o, a1, b1), List.det3(o, a1, b2));
    r2 = CSNumber.sqrt(r2);

    var k1 = List.scalmult(r1, a1);
    var k2 = List.scalmult(r2, a2);

    var x = List.add(k1, k2);
    var y = List.sub(k1, k2);

    var t1 = geoOps._helper.ConicBy5(el, a, b, c, d, x);
    var t2 = geoOps._helper.ConicBy5(el, a, b, c, d, y);

    return [t1, t2];
};

geoOps.ConicBy4p1l = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;

    var l = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el, a, b, c, d, l);

    el.results = erg;

};
geoOpMap.ConicBy4p1l = "T";

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
        List.scalmult(s1.value[2], gh)]));
    var m3 = List.transpose(m2);
    var mul = CSNumber.mult;
    var aa = List.productMV(m3, a), a1 = aa.value[0], a2 = aa.value[1];
    var bb = List.productMV(m3, b), b1 = bb.value[0], b2 = bb.value[1];
    // assert: aa.value[2] and bb.value[2] are zero
    var a3a = CSNumber.sqrt(mul(a1, a2)), b3a = CSNumber.sqrt(mul(b1, b2));
    var signs, res = new Array(4);
    for (signs = 0; signs < 4; ++signs) {
        var sa = ((signs & 1) << 1) - 1, sb = (signs & 2) - 1;
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
        var xx = mul(p1, p1), yy = mul(p2, p2), zz = mul(p4, p4);
        var xy = mul(p1, p2), xz = mul(p1, p4), yz = mul(p2, p4);
        xy = CSNumber.sub(xy, mul(CSNumber.real(0.5), mul(p3, p3)));
        var mm = List.turnIntoCSList([
            List.turnIntoCSList([xx, xy, xz]),
            List.turnIntoCSList([xy, yy, yz]),
            List.turnIntoCSList([xz, yz, zz])
        ]);
        var cc = List.realVector([1,1,1]);
        mm = List.productMM(m2, List.productMM(mm, m3));
        res[signs] = mm;
    }
    return res;
    function det2(a, b, c, d) {
        return CSNumber.sub(CSNumber.mult(a, d), CSNumber.mult(b, c));
    }
};

geoOps.ConicBy3p2l = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var g = csgeo.csnames[(el.args[3])].homog;
    var h = csgeo.csnames[(el.args[4])].homog;
    el.results = geoOps._helper.ConicBy3p2l(a, b, c, g, h);
};
geoOpMap.ConicBy3p2l = "T";

geoOps.ConicBy2p3l = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var g = csgeo.csnames[(el.args[2])].homog;
    var h = csgeo.csnames[(el.args[3])].homog;
    var l = csgeo.csnames[(el.args[4])].homog;
    var dual = geoOps._helper.ConicBy3p2l(g, h, l, a, b);
    var res = new Array(4);
    for (var i = 0; i < 4; ++i)
        res[i] = List.normalizeMax(List.adjoint3(dual[i]));
    el.results = res;
};
geoOpMap.ConicBy2p3l = "T";

geoOps.ConicBy1p4l = function(el) {
    var l1 = csgeo.csnames[(el.args[0])].homog;
    var l2 = csgeo.csnames[(el.args[1])].homog;
    var l3 = csgeo.csnames[(el.args[2])].homog;
    var l4 = csgeo.csnames[(el.args[3])].homog;

    var p = csgeo.csnames[(el.args[4])].homog;

    var erg = geoOps._helper.ConicBy4p1l(el, l1, l2, l3, l4, p);
    var t1 = erg[0];
    var t2 = erg[1];
    t1 = List.adjoint3(t1);
    t2 = List.adjoint3(t2);

    erg = [t1, t2];
    el.results = erg;

};
geoOpMap.ConicBy1p4l = "T";


geoOps.ConicBy5lines = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = csgeo.csnames[(el.args[2])].homog;
    var d = csgeo.csnames[(el.args[3])].homog;
    var p = csgeo.csnames[(el.args[4])].homog;

    var erg_temp = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    var erg = List.adjoint3(erg_temp);
    el.matrix = erg;
    el.matrix = List.normalizeMax(el.matrix);
    el.matrix.usage = "Conic";
};
geoOpMap.ConicBy5lines = "C";

geoOps.CircleBy3 = function(el) {
    var a = csgeo.csnames[(el.args[0])].homog;
    var b = csgeo.csnames[(el.args[1])].homog;
    var c = List.ii;
    var d = List.jj;
    var p = csgeo.csnames[(el.args[2])].homog;
    var erg = geoOps._helper.ConicBy5(el, a, b, c, d, p);
    el.matrix = List.normalizeMax(erg);
    el.matrix.usage = "Circle";

};
geoOpMap.CircleBy3 = "C";


geoOps._helper.tracing2 = function(n1, n2, c1, c2, el) { //Billigtracing
    var OK = 0;
    var DECREASE_STEP = 1;
    var INVALID = 2;
    var tooClose = OK;
    var security = 3;

    var do1n1 = List.projectiveDistMinScal(c1, n1);
    var do1n2 = List.projectiveDistMinScal(c1, n2);
    var do2n1 = List.projectiveDistMinScal(c2, n1);
    var do2n2 = List.projectiveDistMinScal(c2, n2);


    if ((do1n1 + do2n2) < (do1n2 + do2n1)) {
        el.results = List.turnIntoCSList([n1, n2]); //Das ist "sort Output"
    } else {
        el.results = List.turnIntoCSList([n2, n1]); //Das ist "sort Output"

    }

};

geoOps._helper.tracing2X = function(n1, n2, c1, c2, el) {
    var OK = 0;
    var DECREASE_STEP = 1;
    var INVALID = 2;
    var tooClose = OK;
    var security = 3;

    var do1n1 = List.projectiveDistMinScal(c1, n1);
    var do1n2 = List.projectiveDistMinScal(c1, n2);
    var do2n1 = List.projectiveDistMinScal(c2, n1);
    var do2n2 = List.projectiveDistMinScal(c2, n2);
    var do1o2 = List.projectiveDistMinScal(c1, c2);
    var dn1n2 = List.projectiveDistMinScal(n1, n2);

    //Das Kommt jetzt eins zu eins aus Cindy

    var care = (do1o2 > 0.000001);

    // First we try to assign the points

    if (do1o2 / security > do1n1 + do2n2 && dn1n2 / security > do1n1 + do2n2) {
        el.results = List.turnIntoCSList([n1, n2]); //Das ist "sort Output"
        return OK + tooClose;
    }

    if (do1o2 / security > do1n2 + do2n1 && dn1n2 / security > do1n2 + do2n1) {
        el.results = List.turnIntoCSList([n2, n1]); //Das ist "sort Output"
        return OK + tooClose;
    }

    //  Maybe they are too close?

    if (dn1n2 < 0.00001) {
        // They are. Do we care?
        if (care) {
            tooClose = INVALID;
            el.results = List.turnIntoCSList([n1, n2]);
            return OK + tooClose;
        } else {
            el.results = List.turnIntoCSList([n1, n2]);
            return OK + tooClose;
        }
    }

    // They are far apart. We care now.
    if (!care || tooClose === INVALID) {
        el.results = List.turnIntoCSList([n1, n2]); //Das ist "sort Output"
        return OK + tooClose;
    }
    return DECREASE_STEP + tooClose;

};

geoOps._helper.IntersectLC = function(l, c) {

    var N = CSNumber;
    var l1 = List.crossOperator(l);
    var l2 = List.transpose(l1);
    var s = General.mult(l2, General.mult(c, l1));

    var ax = s.value[0].value[0];
    var ay = s.value[0].value[1];
    var az = s.value[0].value[2];
    var bx = s.value[1].value[0];
    var by = s.value[1].value[1];
    var bz = s.value[1].value[2];
    var cx = s.value[2].value[0];
    var cy = s.value[2].value[1];
    var cz = s.value[2].value[2];

    var xx = l.value[0];
    var yy = l.value[1];
    var zz = l.value[2];


    var absx = N.abs(xx).value.real;
    var absy = N.abs(yy).value.real;
    var absz = N.abs(zz).value.real;

    var alp;
    if (absz >= absx && absz >= absy) {
        alp = N.div(N.sqrt(N.sub(N.mult(ay, bx), N.mult(ax, by))), zz);
    }
    if (absx >= absy && absx >= absz) {

        alp = N.div(N.sqrt(N.sub(N.mult(bz, cy), N.mult(by, cz))), xx);
    }
    if (absy >= absx && absy >= absz) {
        alp = N.div(N.sqrt(N.sub(N.mult(cx, az), N.mult(cz, ax))), yy);
    }
    var erg = List.add(s, List.scalmult(alp, l1));
    var erg1 = erg.value[0];
    erg1 = List.normalizeMax(erg1);
    erg1.usage = "Point";
    erg = List.transpose(erg);
    var erg2 = erg.value[0];
    erg2 = List.normalizeMax(erg2);
    erg2.usage = "Point";
    return [erg1, erg2];

};

geoOps.IntersectLC = function(el) {
    var l = csgeo.csnames[(el.args[0])].homog;
    var c = csgeo.csnames[(el.args[1])].matrix;

    var erg = geoOps._helper.IntersectLC(l, c);
    var erg1 = erg[0];
    var erg2 = erg[1];

    if (!el.inited) {
        el.check1 = erg1;
        el.check2 = erg2;
        el.inited = true;
        el.results = List.turnIntoCSList([erg1, erg2]);

    } else {
        var action = geoOps._helper.tracing2(erg1, erg2, el.check1, el.check2, el);
        if (!List._helper.isNaN(el.results.value[0]) && !List._helper.isNaN(el.results.value[1])) {
            el.check1 = el.results.value[0];
            el.check2 = el.results.value[1];
        }
    }
};
geoOpMap.IntersectLC = "T";

geoOps.IntersectCirCir = function(el) {
    var c1 = csgeo.csnames[(el.args[0])].matrix;
    var c2 = csgeo.csnames[(el.args[1])].matrix;

    var ct1 = c2.value[0].value[0];
    var line1 = List.scalmult(ct1, c1.value[2]);
    var ct2 = c1.value[0].value[0];
    var line2 = List.scalmult(ct2, c2.value[2]);
    var ll = List.sub(line1, line2);
    ll.value[2] = CSNumber.mult(CSNumber.real(0.5), ll.value[2]);
    ll = List.normalizeMax(ll);


    var erg = geoOps._helper.IntersectLC(ll, c1);
    var erg1 = erg[0];
    var erg2 = erg[1];

    if (!el.inited) {
        el.check1 = erg1;
        el.check2 = erg2;
        el.inited = true;
        el.results = List.turnIntoCSList([erg1, erg2]);

    } else {
        var action = geoOps._helper.tracing2(erg1, erg2, el.check1, el.check2, el);
        el.check1 = el.results.value[0];
        el.check2 = el.results.value[1];
    }

};
geoOpMap.IntersectCirCir = "T";


geoOps._helper.IntersectConicConic = function(AA, BB) {
    var p1, p2, p3, p4;

    var alpha = List.det(AA);

    // indexing
    var one = CSNumber.real(1);
    var two = CSNumber.real(2);
    var three = CSNumber.real(3);

    var b1 = List.det3(List.column(AA, one), List.column(AA, two), List.column(BB, three));
    b1 = CSNumber.add(b1, List.det3(List.column(AA, one), List.column(BB, two), List.column(AA, three)));
    b1 = CSNumber.add(b1, List.det3(List.column(BB, one), List.column(AA, two), List.column(AA, three)));
    var beta = CSNumber.clone(b1);

    // gamma
    var g1 = List.det3(List.column(AA, one), List.column(BB, two), List.column(BB, three));
    g1 = CSNumber.add(g1, List.det3(List.column(BB, one), List.column(AA, two), List.column(BB, three)));
    g1 = CSNumber.add(g1, List.det3(List.column(BB, one), List.column(BB, two), List.column(AA, three)));
    var gamma = CSNumber.clone(g1);

    var delta = List.det(BB);

    // degenrate Case
    var myeps = 1e-16;
    var AAdegen = (Math.abs(alpha.value.real) < myeps);
    var BBdegen = (Math.abs(delta.value.real) < myeps);

    var Alines, Blines, pts1, pts2;
    if (AAdegen && BBdegen) {
        Alines = geoOps._helper.splitDegenConic(AA);
        Blines = geoOps._helper.splitDegenConic(BB);
        p1 = List.cross(Alines[0], Blines[0]);
        p2 = List.cross(Alines[1], Blines[0]);
        p3 = List.cross(Alines[0], Blines[1]);
        p4 = List.cross(Alines[1], Blines[1]);
    } else if (AAdegen) {
        Alines = geoOps._helper.splitDegenConic(AA);
        pts1 = geoOps._helper.IntersectLC(List.normalizeMax(Alines[0]), BB);
        pts2 = geoOps._helper.IntersectLC(List.normalizeMax(Alines[1]), BB);
        p1 = pts1[0];
        p2 = pts1[1];
        p3 = pts2[0];
        p4 = pts2[1];

    } else if (BBdegen) {
        Blines = geoOps._helper.splitDegenConic(BB);
        pts1 = geoOps._helper.IntersectLC(List.normalizeMax(Blines[0]), AA);
        pts2 = geoOps._helper.IntersectLC(List.normalizeMax(Blines[1]), AA);
        p1 = pts1[0];
        p2 = pts1[1];
        p3 = pts2[0];
        p4 = pts2[1];

    } else {
        var e1 = CSNumber.complex(-0.5, 0.5 * Math.sqrt(3));
        var e2 = CSNumber.complex(-0.5, -0.5 * Math.sqrt(3));

        var solges = CSNumber.solveCubic(alpha, beta, gamma, delta);
        var sol1 = solges[0];
        var sol2 = solges[1];
        var sol3 = solges[2];

        var cvsol = List.turnIntoCSList([sol1, sol2, sol3]);
        var ssol = CSNumber.add(CSNumber.add(sol1, sol2), sol3);

        // produce degenrate Conic
        var CDeg = List.add(List.scalmult(ssol, AA), BB);

        var lines1 = geoOps._helper.splitDegenConic(CDeg);
        var l11 = lines1[0];
        var l12 = lines1[1];

        var cub2 = List.turnIntoCSList([e1, CSNumber.real(1), e2]);

        var solcub2 = List.scalproduct(cvsol, cub2);

        var CDeg2 = List.add(List.scalmult(solcub2, AA), BB);

        var lines2 = geoOps._helper.splitDegenConic(CDeg2);
        var l21 = lines2[0];
        var l22 = lines2[1];

        p1 = List.cross(l11, l21);
        p2 = List.cross(l12, l21);
        p3 = List.cross(l11, l22);
        p4 = List.cross(l12, l22);

    } // end else

    p1 = List.normalizeZ(p1);
    p2 = List.normalizeZ(p2);
    p3 = List.normalizeZ(p3);
    p4 = List.normalizeZ(p4);

    p1.usage = "Point";
    p2.usage = "Point";
    p3.usage = "Point";
    p4.usage = "Point";

    return [p1, p2, p3, p4];

};

geoOps.IntersectConicConic = function(el) {
    var AA = csgeo.csnames[(el.args[0])].matrix;
    var BB = csgeo.csnames[(el.args[1])].matrix;

    var erg = geoOps._helper.IntersectConicConic(AA, BB);
    el.inited = true;
    el.results = List.turnIntoCSList(erg);

};
geoOpMap.IntersectConicConic = "T";


geoOps.SelectP = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    if (!el.inited) {
        el.inited = true;
    }
    el.homog = set.results.value[el.index - 1];
};
geoOpMap.SelectP = "P";

geoOps.SelectL = function(el) {
    var set = csgeo.csnames[(el.args[0])];
    if (!el.inited) {
        el.inited = true;
    }
    el.homog = set.results.value[el.index - 1];
    el.homog.usage = "Line";
};
geoOpMap.SelectL = "L";


// Define a projective transformation given four points and their images
geoOps.TrProjection = function(el) {
    function oneStep(offset) {
        var tmp,
            a = csgeo.csnames[el.args[0 + offset]].homog,
            b = csgeo.csnames[el.args[2 + offset]].homog,
            c = csgeo.csnames[el.args[4 + offset]].homog,
            d = csgeo.csnames[el.args[6 + offset]].homog;
        // Note: this duplicates functionality from evaluator._helper.basismap
        tmp = List.adjoint3(List.turnIntoCSList([a, b, c]));
        tmp = List.productVM(d, tmp).value;
        tmp = List.transpose(List.turnIntoCSList([
            List.scalmult(tmp[0], a),
            List.scalmult(tmp[1], b),
            List.scalmult(tmp[2], c)
        ]));
        return tmp;
    }
    var m = List.productMM(oneStep(1), List.adjoint3(oneStep(0)));
    m = List.normalizeMax(m);
    el.matrix = m;
};
geoOpMap.TrProjection = "Tr";

// Apply a projective transformation to a point
geoOps.TransformP = function(el) {
    var m = csgeo.csnames[(el.args[0])].matrix;
    var p = csgeo.csnames[(el.args[1])].homog;
    el.homog = List.normalizeMax(List.productMV(m, p));
    el.homog.usage = "Point";
};
geoOpMap.TransformP = "P";
