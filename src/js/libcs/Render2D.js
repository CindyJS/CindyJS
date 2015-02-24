function handleModifs(modifs, handlers) {
    var key, handler;
    for (key in modifs) {
        handler = handlers[key];
        if (handler)
            handler(evaluate(modifs[key]));
    }
}

var Render2D = {};

Render2D.sin30deg = 0.5;
Render2D.cos30deg = Math.sqrt(0.75);

Render2D.reset = function() {
    Render2D.pointcolorraw = csport.drawingstate.pointcolorraw;
    Render2D.linecolorraw = csport.drawingstate.linecolorraw;
    Render2D.psize = csport.drawingstate.pointsize;
    Render2D.lsize = csport.drawingstate.linesize;
    if (Render2D.psize < 0) Render2D.psize = 0;
    if (Render2D.lsize < 0) Render2D.lsize = 0;
    Render2D.overhang = 1; //TODO Eventuell dfault setzen
    Render2D.dashing = false;
    Render2D.isArrow = false;
    Render2D.arrowSides = '==>';
    Render2D.arrowScaling = 1.0; // scale arrow length
    Render2D.headlen = 10; // arrow head length - perhaps set this relative to canvas size
    Render2D.arrowShape = 'default';
    Render2D.alpha = csport.drawingstate.alpha;
};

Render2D.modifHandlersPoints = {

    "size": function(v) {
        if (v.ctype === "number") {
            Render2D.psize = v.value.real;
            if (Render2D.psize < 0) Render2D.psize = 0;
            if (Render2D.psize > 1000) Render2D.psize = 1000;
        }
    },

    "color": function(v) {
        if (List.isNumberVector(v).value && v.value.length === 3) {
            Render2D.pointcolorraw = [
                v.value[0].value.real,
                v.value[1].value.real,
                v.value[2].value.real
            ];
        }
    },

    "alpha": function(v) {
        if (v.ctype === "number") {
            Render2D.alpha = v.value.real;
        }
    },

};

Render2D.modifHandlersLines = {

    "size": function(v) {
        if (v.ctype === "number") {
            Render2D.lsize = v.value.real;
            if (Render2D.lsize < 0) Render2D.lsize = 0;
            if (Render2D.lsize > 1000) Render2D.lsize = 1000;
        }
    },

    "color": function(v) {
        if (List.isNumberVector(v).value && v.value.length === 3) {
            Render2D.linecolorraw = [
                v.value[0].value.real,
                v.value[1].value.real,
                v.value[2].value.real
            ];
        }
    },

    "alpha": Render2D.modifHandlersPoints.alpha,

    "dashpattern": function(v) {
        if (v.ctype === "list") {
            var pat = [];
            for (var i = 0, j = 0; i < v.value.length; i++) {
                if (v.value[i].ctype === "number")
                    pat[j++] = v.value[i].value.real;
            }
            Render2D.setDash(pat, Render2D.lsize);
            Render2D.dashing = true;
        }
    },

    "dashtype": function(v) {
        if (v.ctype === "number") {
            var type = Math.floor(v.value.real);
            Render2D.setDashType(type, Render2D.lsize);
            Render2D.dashing = true;
        }
    },

    "dashing": function(v) {
        if (v.ctype === 'number') {
            var si = Math.floor(v.value.real);
            Render2D.setDash([si * 2, si], Render2D.lsize);
            Render2D.dashing = true;
        }
    },

    "overhang": function(v) {
        if (v.ctype === 'number') {
            Render2D.overhang = (v.value.real);
        }
    },

    "arrow": function(v) {
        if (v.ctype === 'boolean') {
            Render2D.isArrow = v.value;
        } else {
            console.error("arrow needs to be of type boolean");
        }
    },

    "arrowshape": function(v) {
        if (v.ctype === 'string') {
            Render2D.arrowShape = v.value;
            Render2D.isArrow = true;
        } else {
            console.error("arrowshape needs to be of type string");
        }
    },

    "arrowsides": function(v) {
        if (v.ctype !== 'string') {
            console.error('arrowsides is not of type string');
        } else if (!(v.value === '==>' || v.value === '<==>' || v.value === '<==')) {
            console.error("arrowsides is unknows");
        } else {
            Render2D.arrowSides = v.value;
            Render2D.isArrow = true;
        }
    },

    "arrowposition": function(v) {
        if (v.ctype !== "number") {
            console.error('arrowposition is not of type number');
        } else if (v.value.real < 0.0) {
            console.error("arrowposition has to be positive");
        } else {
            Render2D.arrowScaling = v.value.real;
            Render2D.isArrow = true;
        }
    },

    "arrowsize": function(v) {
        if (v.ctype !== "number") {
            console.error('arrowsize is not of type number');
        } else if (v.value.real < 0.0) {
            console.error("arrowsize has to be positive");
        } else {
            Render2D.headlen = Render2D.headlen * v.value.real;
        }
    },

};

Render2D.handleModifsPoints = function(modifs) {
    handleModifs(modifs, Render2D.modifHandlersPoints);
    Render2D.pointColor = Render2D.makeColor(Render2D.pointcolorraw);
    Render2D.black = "rgba(0,0,0,"+Render2D.alpha+")";
};

Render2D.handleModifsLines = function(modifs) {
    handleModifs(modifs, Render2D.modifHandlersLines);
    Render2D.lineColor = Render2D.makeColor(Render2D.linecolorraw);
};

Render2D.makeColor = function(colorraw) {
    var alpha = Render2D.alpha;
    var r = Math.floor(colorraw[0] * 255);
    var g = Math.floor(colorraw[1] * 255);
    var b = Math.floor(colorraw[2] * 255);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
};

Render2D.drawsegcore = function(pt1, pt2) {
    var m = csport.drawingstate.matrix;
    var xx1 = pt1.x * m.a - pt1.y * m.b + m.tx;
    var yy1 = pt1.x * m.c - pt1.y * m.d - m.ty;
    var xx2 = pt2.x * m.a - pt2.y * m.b + m.tx;
    var yy2 = pt2.x * m.c - pt2.y * m.d - m.ty;

    var xxx1 = Render2D.overhang * xx1 + (1 - Render2D.overhang) * xx2;
    var yyy1 = Render2D.overhang * yy1 + (1 - Render2D.overhang) * yy2;
    var xxx2 = Render2D.overhang * xx2 + (1 - Render2D.overhang) * xx1;
    var yyy2 = Render2D.overhang * yy2 + (1 - Render2D.overhang) * yy1;

    csctx.beginPath();
    csctx.lineWidth = Render2D.lsize;
    csctx.lineCap = 'round';
    csctx.strokeStyle = Render2D.color;

    // save original x/y values
    var or_x1 = xxx1;
    var or_x2 = xxx2;
    var or_y1 = yyy1;
    var or_y2 = yyy2;
    var sinAngle, cosAngle, x30sub, x30add, y30sub, y30add;
    if (Render2D.isArrow) {
        var dx = xxx2 - xxx1, dy = yyy2 - yyy1;
        var norm = Math.sqrt(dx*dx + dy*dy);
        cosAngle = dx/norm;
        sinAngle = dy/norm;
        var sc_fac = 1 - Render2D.arrowScaling;
        xxx1 += sc_fac * dx;
        xxx2 -= sc_fac * dx;
        yyy1 += sc_fac * dy;
        yyy2 -= sc_fac * dy;
        var headlen = Render2D.headlen;
        var sin30 = Render2D.sin30deg, cos30 = Render2D.cos30deg;
        x30sub = headlen * (cosAngle*cos30 + sinAngle*sin30);
        x30add = headlen * (cosAngle*cos30 - sinAngle*sin30);
        y30sub = headlen * (sinAngle*cos30 - cosAngle*sin30);
        y30add = headlen * (sinAngle*cos30 + cosAngle*sin30);
    }
    csctx.moveTo(xxx1, yyy1);

    // shorten arrow for full arrow
    // Math.abs() for preventing bugs if points are the same
    if (Render2D.isArrow && Render2D.arrowShape === "full" &&
        (Math.abs(xxx1 - xxx2) + Math.abs(yyy1 - yyy2))) {

        var rx, ry, lx, ly;
        rx = xxx2 - x30sub;
        ry = yyy2 - y30sub;
        lx = xxx2 - x30add;
        ly = yyy2 - y30add;

        var t1 = xxx2;
        var t2 = yyy2;
        if (Render2D.arrowSides === '==>' || Render2D.arrowSides === '<==>') {
            t1 = (rx + lx) / 2;
            t2 = (ry + ly) / 2;
        }
        if (Render2D.arrowSides === "<==>" || Render2D.arrowSides === "<==") {
            rx = xxx1 + x30sub;
            ry = yyy1 + y30sub;
            lx = xxx1 + x30add;
            ly = yyy1 + y30add;

            var s1 = (rx + lx) / 2;
            var s2 = (ry + ly) / 2;
            csctx.moveTo(t1, t2);
            csctx.lineTo(s1, s2);
        } else {
            csctx.lineTo(t1, t2);
        }

    } else {
        csctx.lineTo(xxx2, yyy2);
    }

    csctx.stroke();

    if (Render2D.isArrow) {

        // draw arrow heads at desired positions
        var sign = 1;
        if (Render2D.arrowScaling < 0.5) {
            sign = -sign;
        }
        if (Render2D.arrowSides === '==>' || Render2D.arrowSides === '<==>') {
            draw_arrowhead(xxx1, xxx2, yyy1, yyy2, sign);
        }
        if (Render2D.arrowSides === '<==' || Render2D.arrowSides === '<==>') {
            draw_arrowhead(xxx2, xxx1, yyy2, yyy1, -sign);
        }

        // fix missing paths if we scale down arrows
        if (Render2D.arrowScaling < 1.0) {
            if (Render2D.arrowScaling > 0.5) {
                fixpaths(xxx1, yyy1, or_x1, or_y1);
                fixpaths(xxx2, yyy2, or_x2, or_y2);
            } else {
                fixpaths(xxx1, yyy1, or_x2, or_y2);
                fixpaths(xxx2, yyy2, or_x1, or_y1);
            }
        }

    } // end isArrow

    if (Render2D.dashing)
        Render2D.unSetDash();

    function draw_arrowhead(x1, x2, y1, y2, sign) {
        var rx = x2 - sign*x30sub;
        var ry = y2 - sign*y30sub;

        csctx.beginPath();
        if (Render2D.arrowShape === "full") {
            csctx.lineWidth = Render2D.lsize / 2;
        }
        var lx = x2 - sign*x30add;
        var ly = y2 - sign*y30add;
        csctx.moveTo(rx, ry);
        csctx.lineTo(x2, y2);
        csctx.lineTo(lx, ly);
        if (Render2D.arrowShape === "full") {
            csctx.fillStyle = Render2D.color;
            csctx.fill();
        } else if (Render2D.arrowShape !== "default") {
            console.error("arrowshape is unknown");
        }
        csctx.stroke();
    } // end draw_arrowhead

    function fixpaths(x1, y1, x2, y2) {
        csctx.beginPath();
        csctx.strokeStyle = Render2D.color;
        csctx.lineWidth = Render2D.lsize;
        csctx.lineCap = 'round';
        csctx.moveTo(x1, y1);
        csctx.lineTo(x2, y2);
        csctx.stroke();
    }

};

Render2D.drawpoint = function(pt) {
    var m = csport.drawingstate.matrix;

    var xx = pt.x * m.a - pt.y * m.b + m.tx;
    var yy = pt.x * m.c - pt.y * m.d - m.ty;

    csctx.lineWidth = Render2D.psize * 0.3;
    csctx.beginPath();
    csctx.arc(xx, yy, Render2D.psize, 0, 2 * Math.PI);
    csctx.fillStyle = Render2D.pointColor;

    csctx.fill();

    csctx.beginPath();
    csctx.arc(xx, yy, Render2D.psize * 1.15, 0, 2 * Math.PI);
    csctx.fillStyle = Render2D.black;
    csctx.strokeStyle = Render2D.black;
    csctx.stroke();
};

Render2D.drawline = function(homog) {
    var na = CSNumber.abs(homog.value[0]).value.real;
    var nb = CSNumber.abs(homog.value[1]).value.real;
    var nc = CSNumber.abs(homog.value[2]).value.real;
    var divi;

    if (na >= nb && na >= nc) {
        divi = homog.value[0];
    }
    if (nb >= na && nb >= nc) {
        divi = homog.value[1];
    }
    if (nc >= nb && nc >= na) {
        divi = homog.value[2];
    }
    var a = CSNumber.div(homog.value[0], divi);
    var b = CSNumber.div(homog.value[1], divi);
    var c = CSNumber.div(homog.value[2], divi); //TODO Realitycheck einbauen

    var l = [
        a.value.real,
        b.value.real,
        c.value.real
    ];
    var b1, b2;
    if (Math.abs(l[0]) < Math.abs(l[1])) {
        b1 = [1, 0, 30];
        b2 = [-1, 0, 30];
    } else {
        b1 = [0, 1, 30];
        b2 = [0, -1, 30];
    }
    var erg1 = [
        l[1] * b1[2] - l[2] * b1[1],
        l[2] * b1[0] - l[0] * b1[2],
        l[0] * b1[1] - l[1] * b1[0]
    ];
    var erg2 = [
        l[1] * b2[2] - l[2] * b2[1],
        l[2] * b2[0] - l[0] * b2[2],
        l[0] * b2[1] - l[1] * b2[0]
    ];

    var pt1 = {
        x: erg1[0] / erg1[2],
        y: erg1[1] / erg1[2]
    };
    var pt2 = {
        x: erg2[0] / erg2[2],
        y: erg2[1] / erg2[2]

    };

    Render2D.drawsegcore(pt1, pt2);
};

Render2D.setDash = function(pattern, size) {
    var s = Math.sqrt(size);
    for (var i = 0; i < pattern.length; i++) {
        pattern[i] *= s;
    }
    csctx.webkitLineDash = pattern; //Safari
    csctx.setLineDash(pattern); //Chrome
    csctx.mozDash = pattern; //FFX
};

Render2D.unSetDash = function() {
    csctx.webkitLineDash = []; //Safari
    csctx.setLineDash([]); //Chrome
    csctx.mozDash = []; //FFX
};

Render2D.setDashType = function(type, s) {

    if (type === 0) {
        Render2D.setDash([]);
    }
    if (type === 1) {
        Render2D.setDash([10, 10], s);
    }
    if (type === 2) {
        Render2D.setDash([10, 4], s);
    }
    if (type === 3) {
        Render2D.setDash([1, 3], s);
    }
    if (type === 4) {
        Render2D.setDash([10, 5, 1, 5], s);
    }

};
