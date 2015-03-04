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
    Render2D.arrowposition = 1.0; // position arrowhead along the line
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
            // Might combine with arrowposition, see there for details
            Render2D.overhang = Render2D.overhang * v.value.real +
                (1 - Render2D.overhang) * (1 - v.value.real);
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
        } else if (v.value.real > 1.0) {
            // Combine position into overhang to simplify things
            // Writing a for overhang and b for arrowposition, we have
            // q1 = b*(a*p1 + (1-a)*p2) + (1-b)*(a*p2 + (1-a)*p1)
            Render2D.overhang = Render2D.overhang * v.value.real +
                (1 - Render2D.overhang) * (1 - v.value.real);
        } else {
            Render2D.arrowposition = v.value.real;
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
    var endpoint1x = pt1.x * m.a - pt1.y * m.b + m.tx;
    var endpoint1y = pt1.x * m.c - pt1.y * m.d - m.ty;
    var endpoint2x = pt2.x * m.a - pt2.y * m.b + m.tx;
    var endpoint2y = pt2.x * m.c - pt2.y * m.d - m.ty;
    var overhang1 = Render2D.overhang, overhang2 = 1 - overhang1;
    var overhang1x = overhang1 * endpoint1x + overhang2 * endpoint2x;
    var overhang1y = overhang1 * endpoint1y + overhang2 * endpoint2y;
    var overhang2x = overhang1 * endpoint2x + overhang2 * endpoint1x;
    var overhang2y = overhang1 * endpoint2y + overhang2 * endpoint1y;

    csctx.lineWidth = Render2D.lsize;
    csctx.lineCap = 'round';
    csctx.strokeStyle = Render2D.lineColor;

    if (!Render2D.isArrow ||
        (endpoint1x == endpoint1y && endpoint2x == endpoint2y)) {
        // Fast path if we have no arrowheads
        csctx.beginPath();
        csctx.moveTo(overhang1x, overhang1y);
        csctx.lineTo(overhang2x, overhang2y);
        csctx.stroke();
        if (Render2D.dashing)
            Render2D.unSetDash();
        return;
    }

    var dx = endpoint2x - endpoint1x, dy = endpoint2y - endpoint1y;
    var norm = Math.sqrt(dx*dx + dy*dy);
    var cosAngle = dx/norm;
    var sinAngle = dy/norm;
    var pos_fac1 = Render2D.arrowposition, pos_fac2 = 1 - pos_fac1;
    var tip1x = pos_fac1 * overhang1x + pos_fac2 * overhang2x;
    var tip1y = pos_fac1 * overhang1y + pos_fac2 * overhang2y;
    var tip2x = pos_fac1 * overhang2x + pos_fac2 * overhang1x;
    var tip2y = pos_fac1 * overhang2y + pos_fac2 * overhang1y;
    var headlen = Render2D.headlen;
    var sin30 = Render2D.sin30deg, cos30 = Render2D.cos30deg;
    var x30sub = headlen * (cosAngle*cos30 + sinAngle*sin30);
    var x30add = headlen * (cosAngle*cos30 - sinAngle*sin30);
    var y30sub = headlen * (sinAngle*cos30 - cosAngle*sin30);
    var y30add = headlen * (sinAngle*cos30 + cosAngle*sin30);
    var arrowSides = Render2D.arrowSides;

    csctx.beginPath();

    // draw line in parts for full arrow
    if (Render2D.arrowShape === "full") {
        var rx, ry, lx, ly;
        if (arrowSides === "<==>" || arrowSides === "<==") {
            rx = tip1x + x30sub;
            ry = tip1y + y30sub;
            lx = tip1x + x30add;
            ly = tip1y + y30add;
            if (Render2D.arrowposition < 1.0) {
                csctx.moveTo(overhang1x, overhang1y);
                csctx.lineTo(tip1x, tip1y);
            }
            csctx.moveTo((rx + lx) / 2, (ry + ly) / 2);
        } else {
            csctx.moveTo(overhang1x, overhang1y);
        }
        if (arrowSides === '==>' || arrowSides === '<==>') {
            rx = tip2x - x30sub;
            ry = tip2y - y30sub;
            lx = tip2x - x30add;
            ly = tip2y - y30add;
            csctx.lineTo((rx + lx) / 2, (ry + ly) / 2);
            if (Render2D.arrowposition < 1.0) {
                csctx.moveTo(tip2x, tip2y);
                csctx.lineTo(overhang2x, overhang2y);
            }
        } else {
            csctx.lineTo(overhang2x, overhang2y);
        }
    } else {
        csctx.moveTo(overhang1x, overhang1y);
        csctx.lineTo(overhang2x, overhang2y);
    }

    csctx.stroke();

    // draw arrow heads at desired positions
    if (arrowSides === '==>' || arrowSides === '<==>') {
        draw_arrowhead(tip2x, tip2y, 1);
    }
    if (arrowSides === '<==' || arrowSides === '<==>') {
        draw_arrowhead(tip1x, tip1y, -1);
    }

    if (Render2D.dashing)
        Render2D.unSetDash();

    function draw_arrowhead(tipx, tipy, sign) {
        var rx = tipx - sign*x30sub;
        var ry = tipy - sign*y30sub;

        csctx.beginPath();
        if (Render2D.arrowShape === "full") {
            csctx.lineWidth = Render2D.lsize / 2;
        }
        var lx = tipx - sign*x30add;
        var ly = tipy - sign*y30add;
        csctx.moveTo(rx, ry);
        csctx.lineTo(tipx, tipy);
        csctx.lineTo(lx, ly);
        if (Render2D.arrowShape === "full") {
            csctx.fillStyle = Render2D.lineColor;
            csctx.closePath();
            csctx.fill();
        } else if (Render2D.arrowShape !== "default") {
            console.error("arrowshape is unknown");
        }
        csctx.stroke();
    } // end draw_arrowhead

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
