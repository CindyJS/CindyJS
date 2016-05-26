var csgstorage = {};

var csport = {};
csport.drawingstate = {};
csport.drawingstate.linecolor = "rgb(0,0,255)";
csport.drawingstate.linecolorraw = [0, 0, 1];
csport.drawingstate.pointcolor = "rgb(0,255,0)";
csport.drawingstate.pointcolorraw = [0, 1, 0];
csport.drawingstate.textcolor = "rgb(0,0,0)";
csport.drawingstate.textcolorraw = [0, 0, 0];
csport.drawingstate.alpha = 1.0;
csport.drawingstate.pointsize = 4.0;
csport.drawingstate.linesize = 1.0;
csport.drawingstate.textsize = 20;

csport.drawingstate.matrix = {};
csport.drawingstate.matrix.a = 25;
csport.drawingstate.matrix.b = 0;
csport.drawingstate.matrix.c = 0;
csport.drawingstate.matrix.d = 25;
csport.drawingstate.matrix.tx = 250.5;
csport.drawingstate.matrix.ty = 250.5;
csport.drawingstate.matrix.det = csport.drawingstate.matrix.a * csport.drawingstate.matrix.d - csport.drawingstate.matrix.b * csport.drawingstate.matrix.c;

csport.drawingstate.matrix.sdet = Math.sqrt(csport.drawingstate.matrix.det);


csport.drawingstate.initialmatrix = {};
csport.drawingstate.initialmatrix.a = csport.drawingstate.matrix.a;
csport.drawingstate.initialmatrix.b = csport.drawingstate.matrix.b;
csport.drawingstate.initialmatrix.c = csport.drawingstate.matrix.c;
csport.drawingstate.initialmatrix.d = csport.drawingstate.matrix.d;
csport.drawingstate.initialmatrix.tx = csport.drawingstate.matrix.tx;
csport.drawingstate.initialmatrix.ty = csport.drawingstate.matrix.ty;
csport.drawingstate.initialmatrix.det = csport.drawingstate.matrix.det;
csport.drawingstate.initialmatrix.sdet = csport.drawingstate.matrix.sdet;

csport.clone = function(obj) {
    if (obj === null || typeof(obj) !== 'object')
        return obj;

    var temp = obj.constructor(); // changed

    for (var key in obj)
        temp[key] = csport.clone(obj[key]);
    return temp;
};

csgstorage.backup = csport.clone(csport.drawingstate);
csgstorage.stack = [];


var back = csport.clone(csport.drawingstate);


csport.reset = function() {
    csport.drawingstate.matrix.a = csport.drawingstate.initialmatrix.a;
    csport.drawingstate.matrix.b = csport.drawingstate.initialmatrix.b;
    csport.drawingstate.matrix.c = csport.drawingstate.initialmatrix.c;
    csport.drawingstate.matrix.d = csport.drawingstate.initialmatrix.d;
    csport.drawingstate.matrix.tx = csport.drawingstate.initialmatrix.tx;
    csport.drawingstate.matrix.ty = csport.drawingstate.initialmatrix.ty;
    csport.drawingstate.matrix.det = csport.drawingstate.initialmatrix.det;
    csport.drawingstate.matrix.sdet = csport.drawingstate.initialmatrix.sdet;
};

csport.from = function(x, y, z) { //Rechnet Homogene Koordinaten in Pixelkoordinaten um
    var xx = x / z;
    var yy = y / z;
    var m = csport.drawingstate.matrix;
    var xxx = xx * m.a - yy * m.b + m.tx;
    var yyy = xx * m.c - yy * m.d - m.ty;
    return [xxx, yyy];
};

csport.to = function(px, py) { //Rechnet Pixelkoordinaten in Homogene Koordinaten um
    var m = csport.drawingstate.matrix;
    var xx = px - m.tx;
    var yy = py + m.ty;
    var x = (xx * m.d - yy * m.b) / m.det;
    var y = -(-xx * m.c + yy * m.a) / m.det;
    return [x, y, 1];
};

csport.dumpTrafo = function() {

    function r(x) {
        return Math.round(x * 1000) / 1000;

    }
    var m = csport.drawingstate.matrix;

    console.log("a:" + r(m.a) + " " +
        "b:" + r(m.b) + " " +
        "c:" + r(m.c) + " " +
        "d:" + r(m.d) + " " +
        "tx:" + r(m.ty) + " " +
        "ty:" + r(m.tx)
    );

};

csport.setMat = function(a, b, c, d, tx, ty) {
    var m = csport.drawingstate.matrix;
    m.a = a;
    m.b = b;
    m.c = c;
    m.d = d;
    m.tx = tx;
    m.ty = ty;
    m.det = a * d - b * c;
    m.sdet = Math.sqrt(m.det);
};

csport.scaleAndOrigin = function(scale, originX, originY) {
    csport.setMat(scale, 0, 0, scale, originX, originY);
};

csport.visibleRect = function(left, top, right, bottom) {
    var width = right - left;
    var height = top - bottom;
    var scale;
    if (csw * height < csh * width)
        scale = csw / width;
    else
        scale = csh / height;
    var originX = (csw - scale * (left + right)) / 2;
    var originY = (csh - scale * (top + bottom)) / 2;
    csport.setMat(scale, 0, 0, scale, originX, originY);
};

// TODO: This function looks broken. It seems as if the linear
// portion of the matrix is multiplied from the left, but the
// translation is multiplied from the right. Very confusing!
csport.applyMat = function(a, b, c, d, tx, ty) {
    var m = csport.drawingstate.matrix;
    csport.setMat(
        m.a * a + m.c * b,
        m.b * a + m.d * b,
        m.a * c + m.c * d,
        m.b * c + m.d * d,
        m.a * tx + m.c * ty + m.tx,
        m.b * tx + m.d * ty + m.ty);
};

csport.translate = function(tx, ty) {
    csport.applyMat(1, 0, 0, 1, tx, ty);
};

csport.rotate = function(w) {
    var c = Math.cos(w);
    var s = Math.sin(w);
    csport.applyMat(c, s, -s, c, 0, 0);
};

csport.scale = function(s) {
    csport.applyMat(s, 0, 0, s, 0, 0);
};

csport.gsave = function() {
    csgstorage.stack.push(csport.clone(csport.drawingstate));

};

csport.grestore = function() {
    if (csgstorage.stack.length !== 0) {
        csport.drawingstate = csgstorage.stack.pop();
    }
};

csport.greset = function() {
    csport.drawingstate = csport.clone(csgstorage.backup);
    csport.drawingstate.matrix.ty = csport.drawingstate.matrix.ty - csh;
    csport.drawingstate.initialmatrix.ty = csport.drawingstate.initialmatrix.ty - csh;
    csgstorage.stack = [];

};

csport.createnewbackup = function() {
    csport.drawingstate.initialmatrix.a = csport.drawingstate.matrix.a;
    csport.drawingstate.initialmatrix.b = csport.drawingstate.matrix.b;
    csport.drawingstate.initialmatrix.c = csport.drawingstate.matrix.c;
    csport.drawingstate.initialmatrix.d = csport.drawingstate.matrix.d;
    csport.drawingstate.initialmatrix.tx = csport.drawingstate.matrix.tx;
    csport.drawingstate.initialmatrix.ty = csport.drawingstate.matrix.ty;
    csport.drawingstate.initialmatrix.det = csport.drawingstate.matrix.det;
    csport.drawingstate.initialmatrix.sdet = csport.drawingstate.matrix.sdet;
    csgstorage.backup = csport.clone(csport.drawingstate);

};

csport.makecolor = function(r, g, b) {
    var rv = Math.floor(r * 255);
    var gv = Math.floor(g * 255);
    var bv = Math.floor(b * 255);
    if (csport.drawingstate.alpha === 1) {
        return "rgb(" + rv + "," + gv + "," + bv + ")";
    } else {
        return "rgba(" + rv + "," + gv + "," + bv +
            "," + csport.drawingstate.alpha + ")";
    }
};

csport.setcolor = function(co) {
    var r = co.value[0].value.real;
    var g = co.value[1].value.real;
    var b = co.value[2].value.real;
    csport.drawingstate.linecolor =
        csport.drawingstate.pointcolor = csport.makecolor(r, g, b);
    csport.drawingstate.linecolorraw =
        csport.drawingstate.pointcolorraw = [r, g, b];
};

csport.setlinecolor = function(co) {
    var r = co.value[0].value.real;
    var g = co.value[1].value.real;
    var b = co.value[2].value.real;
    csport.drawingstate.linecolor = csport.makecolor(r, g, b);
    csport.drawingstate.linecolorraw = [r, g, b];
};

csport.settextcolor = function(co) {
    var r = co.value[0].value.real;
    var g = co.value[1].value.real;
    var b = co.value[2].value.real;
    csport.drawingstate.textcolor = csport.makecolor(r, g, b);
    csport.drawingstate.textcolorraw = [r, g, b];
};


csport.setpointcolor = function(co) {
    var r = co.value[0].value.real;
    var g = co.value[1].value.real;
    var b = co.value[2].value.real;
    csport.drawingstate.pointcolor = csport.makecolor(r, g, b);
    csport.drawingstate.pointcolorraw = [r, g, b];
};

csport.setalpha = function(al) {
    csport.drawingstate.alpha = al.value.real;
    csport.drawingstate.linecolor = csport.makecolor(
        csport.drawingstate.linecolorraw[0],
        csport.drawingstate.linecolorraw[1],
        csport.drawingstate.linecolorraw[2]);
    csport.drawingstate.pointcolor = csport.makecolor(
        csport.drawingstate.pointcolorraw[0],
        csport.drawingstate.pointcolorraw[1],
        csport.drawingstate.pointcolorraw[2]);
    csport.drawingstate.textcolor = csport.makecolor(
        csport.drawingstate.textcolorraw[0],
        csport.drawingstate.textcolorraw[1],
        csport.drawingstate.textcolorraw[2]);
};

csport.setpointsize = function(si) {
    csport.drawingstate.pointsize = si.value.real;
};


csport.setlinesize = function(si) {
    csport.drawingstate.linesize = si.value.real;
};

csport.settextsize = function(si) {
    csport.drawingstate.textsize = si.value.real;
};
