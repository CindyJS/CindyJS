var Render2D = {};

Render2D.handleModifs = function(modifs, handlers) {
    // Reset stuff first
    if (Render2D.dashing)
        Render2D.unSetDash();
    Render2D.colorraw = null;
    Render2D.fillcolorraw = null;
    Render2D.size = null;
    if (Render2D.psize <= 0) Render2D.psize = 0;
    if (Render2D.lsize <= 0) Render2D.lsize = 0;
    Render2D.overhang = 1; //TODO Maybe set default
    Render2D.dashing = false;
    Render2D.isArrow = false;
    Render2D.arrowSides = '==>';
    Render2D.arrowposition = 1.0; // position arrowhead along the line
    Render2D.headlen = 10; // arrow head length - perhaps set this relative to canvas size
    Render2D.arrowShape = Render2D.arrowShapes.line;
    Render2D.alpha = csport.drawingstate.alpha;
    Render2D.fillalpha = 0;
    Render2D.bold = "";
    Render2D.italics = "";
    Render2D.family = "sans-serif";
    Render2D.align = 0;
    Render2D.xOffset = 0;
    Render2D.yOffset = 0;
    Render2D.lineCap = "round";
    Render2D.lineJoin = "round";
    Render2D.miterLimit = 10;

    // Process handlers
    var key, handler;
    for (key in modifs) {
        var val = modifs[key];
        if (!val) continue; // may happen when called internally
        handler = handlers[key];
        if (!handler) {
            console.log("Modifier not supported: " + key);
            continue;
        }
        if (handler === true) {
            handler = Render2D.modifHandlers[key];
        }
        handler(evaluate(val));
    }

    // Post-process settings

    if (Render2D.size !== null) {
        Render2D.psize = Render2D.lsize = Render2D.size;
    } else {
        Render2D.psize = csport.drawingstate.pointsize;
        Render2D.lsize = csport.drawingstate.linesize;
    }
    if (Render2D.dashing) {
        Render2D.dashing(Render2D.lsize);
    }
    if (Render2D.colorraw !== null) {
        Render2D.pointColor = Render2D.lineColor = Render2D.textColor =
            Render2D.makeColor(Render2D.colorraw);
    } else if (Render2D.alpha === 1) {
        Render2D.pointColor = csport.drawingstate.pointcolor;
        Render2D.lineColor = csport.drawingstate.linecolor;
        Render2D.textColor = csport.drawingstate.textcolor;
    } else {
        Render2D.pointColor =
            Render2D.makeColor(csport.drawingstate.pointcolorraw);
        Render2D.lineColor =
            Render2D.makeColor(csport.drawingstate.linecolorraw);
        Render2D.textColor =
            Render2D.makeColor(csport.drawingstate.textcolorraw);
    }
    if (Render2D.alpha === 1) {
        Render2D.black = "rgb(0,0,0)";
    } else {
        Render2D.black = "rgba(0,0,0," + Render2D.alpha + ")";
    }
    if (Render2D.fillcolorraw && Render2D.fillalpha > 0) {
        Render2D.fillColor =
            Render2D.makeColor(Render2D.fillcolorraw, Render2D.fillalpha);
    } else {
        Render2D.fillColor = null;
    }

};

Render2D.modifHandlers = {
    "size": function(v) {
        if (v.ctype === "number") {
            Render2D.size = v.value.real;
            if (Render2D.size < 0) Render2D.size = 0;
            if (Render2D.size > 1000) Render2D.size = 1000;
        }
    },

    "color": function(v) {
        if (List.isNumberVector(v).value && v.value.length === 3) {
            Render2D.colorraw = [
                v.value[0].value.real,
                v.value[1].value.real,
                v.value[2].value.real
            ];
        }
    },

    "fillcolor": function(v) {
        if (List.isNumberVector(v).value && v.value.length === 3) {
            Render2D.fillcolorraw = [
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

    "fillalpha": function(v) {
        if (v.ctype === "number") {
            Render2D.fillalpha = v.value.real;
        }
    },

    "dashpattern": function(v) {
        if (v.ctype === "list") {
            var pat = [];
            for (var i = 0, j = 0; i < v.value.length; i++) {
                if (v.value[i].ctype === "number")
                    pat[j++] = v.value[i].value.real;
            }
            Render2D.dashing = Render2D.setDash.bind(null, pat);
        }
    },

    "dashtype": function(v) {
        var type;
        if (v.ctype === "number") {
            type = Math.floor(v.value.real);
        } else if (v.ctype === "string") {
            type = v.value;
        } else {
            return;
        }
        var pat = Render2D.dashTypes[type];
        if (pat)
            Render2D.dashing = Render2D.setDash.bind(null, pat);
    },

    "dashing": function(v) {
        if (v.ctype === 'number') {
            var si = Math.floor(v.value.real);
            Render2D.dashing = Render2D.setDash.bind(null, [si * 2, si]);
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
        if (v.ctype !== 'string') {
            console.error("arrowshape needs to be of type string");
        } else if (!Render2D.arrowShapes.hasOwnProperty(v.value)) {
            var allowed = Object.keys(Render2D.arrowShapes);
            allowed.sort();
            allowed = allowed.join(", ");
            console.error("arrowshape needs to be one of " + allowed);
        } else {
            Render2D.arrowShape = Render2D.arrowShapes[v.value];
            Render2D.isArrow = true;
            if (Render2D.arrowShape.deprecated) {
                console.log("arrowshape " + v.value + " is deprecated, use " +
                    Render2D.arrowShape.deprecated + " instead.");
                Render2D.arrowShape.deprecated = null;
            }
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

    "bold": function(v) {
        if (v.ctype === "boolean" && v.value)
            Render2D.bold = "bold ";
    },

    "italics": function(v) {
        if (v.ctype === "boolean" && v.value)
            Render2D.italics = "italic ";
    },

    "family": function(v) {
        if (v.ctype === "string") {
            Render2D.family = v.value;
        }
    },

    "align": function(v) {
        if (v.ctype === "string") {
            var s = v.value;
            // TODO: Use values suitable for csctx.textAlign here
            if (s === "left")
                Render2D.align = 0;
            if (s === "right")
                Render2D.align = 1;
            if (s === "mid")
                Render2D.align = 0.5;
        }
    },

    "x_offset": function(v) {
        if (v.ctype === "number")
            Render2D.xOffset = v.value.real;
    },

    "y_offset": function(v) {
        if (v.ctype === "number")
            Render2D.yOffset = v.value.real;
    },

    "offset": function(v) {
        if (v.ctype === "list" && v.value.length === 2 &&
            v.value[0].ctype === "number" && v.value[1].ctype === "number") {
            Render2D.xOffset = v.value[0].value.real;
            Render2D.yOffset = v.value[1].value.real;
        }
    },

    "lineCap": function(v) {
        if (v.ctype === "string" && (v.value === "round" || v.value === "square" || v.value === "butt"))
            Render2D.lineCap = v.value;
    },

    "lineJoin": function(v) {
        if (v.ctype === "string" && (v.value === "round" || v.value === "bevel" || v.value === "miter"))
            Render2D.lineJoin = v.value;
    },

    "miterLimit": function(v) {
        if (v.ctype === "number" && v.value.real > 0) {
            Render2D.miterLimit = Math.round(v.value.real);
        }
    }
};

Render2D.lineModifs = {
    "size": true,
    "color": true,
    "alpha": true,
    "dashpattern": true,
    "dashtype": true,
    "dashing": true,
    "overhang": true,
    "arrow": true,
    "arrowshape": true,
    "arrowsides": true,
    "arrowposition": true,
    "arrowsize": true,
    "lineCap": true,
    "lineJoin": true,
    "miterLimit": true,
};

Render2D.pointModifs = {
    "size": true,
    "color": true,
    "alpha": true,
};

Render2D.pointAndLineModifs = Render2D.lineModifs;

Render2D.conicModifs = {
    "size": true,
    "color": true,
    "alpha": true,
    "fillcolor": true,
    "fillalpha": true,
    "lineCap": true,
    "lineJoin": true,
    "miterLimit": true
};

Render2D.textModifs = {
    "size": true,
    "color": true,
    "alpha": true,
    "bold": true,
    "italics": true,
    "family": true,
    "align": true,
    "x_offset": true,
    "y_offset": true,
    "offset": true,
};


Render2D.makeColor = function(colorraw, alpha) {
    if (alpha === undefined) alpha = Render2D.alpha;
    var r = Math.floor(colorraw[0] * 255);
    var g = Math.floor(colorraw[1] * 255);
    var b = Math.floor(colorraw[2] * 255);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
};

Render2D.preDrawCurve = function() {
    csctx.lineWidth = Render2D.lsize;
    csctx.lineCap = Render2D.lineCap;
    csctx.lineJoin = Render2D.lineJoin;
    csctx.miterLimit = Render2D.miterLimit;
    csctx.strokeStyle = Render2D.lineColor;
};

Render2D.arrowShapes = {
    "default": {
        close: false,
        fill: false,
        ratio: 1,
        deprecated: "line"
    },
    "line": {
        close: false,
        fill: false,
        ratio: 1
    },
    "empty": {
        close: true,
        fill: false,
        ratio: 1
    },
    "hollow": {
        close: true,
        fill: false,
        ratio: 1,
        deprecated: "empty"
    },
    "full": {
        close: true,
        fill: true,
        ratio: 1
    },
    "jet": {
        close: true,
        fill: true,
        ratio: 1.5
    },
    "delta": {
        close: true,
        fill: true,
        ratio: 1.5,
        deprecated: "jet"
    },
};

Render2D.clipSegment = function(pt1, pt2) {
    var dx = pt2.x - pt1.x;
    var dy = pt2.y - pt1.y;
    var clipPoints = Render2D.clipLineCore(-dy, dx, pt1.x * pt2.y - pt2.x * pt1.y);
    if (clipPoints.length !== 2) return [];
    var q1 = clipPoints[0];
    var q2 = clipPoints[1];
    var factor = 1 / (dx * dx + dy * dy);
    var dot1 = ((q1.x - pt1.x) * dx + (q1.y - pt1.y) * dy) * factor;
    var dot2 = ((q2.x - pt1.x) * dx + (q2.y - pt1.y) * dy) * factor;
    if (dot1 < 0) q1 = pt1;
    if (dot1 > 1) q1 = pt2;
    if (dot2 < 0) q2 = pt1;
    if (dot2 > 1) q2 = pt2;
    if (q1 === q2) return [];
    return [q1, q2];
};

Render2D.drawsegcore = function(pt1, pt2) {
    var m = csport.drawingstate.matrix;
    var endpoint1x = pt1.x * m.a - pt1.y * m.b + m.tx;
    var endpoint1y = pt1.x * m.c - pt1.y * m.d - m.ty;
    var endpoint2x = pt2.x * m.a - pt2.y * m.b + m.tx;
    var endpoint2y = pt2.x * m.c - pt2.y * m.d - m.ty;
    var overhang1 = Render2D.overhang;
    var overhang2 = 1 - overhang1;
    var overhang1x = overhang1 * endpoint1x + overhang2 * endpoint2x;
    var overhang1y = overhang1 * endpoint1y + overhang2 * endpoint2y;
    var overhang2x = overhang1 * endpoint2x + overhang2 * endpoint1x;
    var overhang2y = overhang1 * endpoint2y + overhang2 * endpoint1y;

    if (overhang1x < 0 || overhang1x > csw ||
        overhang1y < 0 || overhang1y > csh ||
        overhang2x < 0 || overhang2x > csw ||
        overhang2y < 0 || overhang2y > csh) {
        // clip to canvas boundary (up to line size)
        var res = Render2D.clipSegment({
            x: overhang1x,
            y: overhang1y
        }, {
            x: overhang2x,
            y: overhang2y
        });
        if (res.length !== 2 || Render2D.lsize < 0.01) return;
        overhang1x = res[0].x;
        overhang1y = res[0].y;
        overhang2x = res[1].x;
        overhang2y = res[1].y;
    }

    Render2D.preDrawCurve();

    if (!Render2D.isArrow ||
        (endpoint1x === endpoint1y && endpoint2x === endpoint2y)) {
        // Fast path if we have no arrowheads
        if (Render2D.lsize < 0.01) return;
        csctx.beginPath();
        csctx.moveTo(overhang1x, overhang1y);
        csctx.lineTo(overhang2x, overhang2y);
        csctx.stroke();
        return;
    }

    var dx = endpoint2x - endpoint1x;
    var dy = endpoint2y - endpoint1y;
    var hs = Render2D.headlen / Math.sqrt(dx * dx + dy * dy);
    var hx = dx * hs;
    var hy = dy * hs;
    var pos_fac1 = Render2D.arrowposition;
    var pos_fac2 = 1 - pos_fac1;
    var tip1x = pos_fac1 * overhang1x + pos_fac2 * overhang2x;
    var tip1y = pos_fac1 * overhang1y + pos_fac2 * overhang2y;
    var tip2x = pos_fac1 * overhang2x + pos_fac2 * overhang1x;
    var tip2y = pos_fac1 * overhang2y + pos_fac2 * overhang1y;
    var arrowSides = Render2D.arrowSides;

    csctx.beginPath();

    // draw line in parts for full arrow
    if (Render2D.arrowShape.close) {
        if (arrowSides === "<==>" || arrowSides === "<==") {
            if (Render2D.arrowposition < 1.0) {
                csctx.moveTo(overhang1x, overhang1y);
                csctx.lineTo(tip1x, tip1y);
            }
            csctx.moveTo(tip1x + hx, tip1y + hy);
        } else {
            csctx.moveTo(overhang1x, overhang1y);
        }
        if (arrowSides === '==>' || arrowSides === '<==>') {
            csctx.lineTo(tip2x - hx, tip2y - hy);
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
        draw_arrowhead(tip2x, tip2y, 1, Render2D.arrowShape.ratio);
    }
    if (arrowSides === '<==' || arrowSides === '<==>') {
        draw_arrowhead(tip1x, tip1y, -1, -Render2D.arrowShape.ratio);
    }

    function draw_arrowhead(tipx, tipy, sign, ratio) {
        var rx = tipx - ratio * hx + 0.5 * hy;
        var ry = tipy - ratio * hy - 0.5 * hx;
        var lx = tipx - ratio * hx - 0.5 * hy;
        var ly = tipy - ratio * hy + 0.5 * hx;

        csctx.beginPath();
        if (Render2D.arrowShape.fill) {
            csctx.lineWidth = Render2D.lsize / 2;
        }
        csctx.moveTo(rx, ry);
        csctx.lineTo(tipx, tipy);
        csctx.lineTo(lx, ly);
        if (Render2D.arrowShape.close) {
            csctx.fillStyle = Render2D.lineColor;
            csctx.lineTo(tipx - sign * hx, tipy - sign * hy);
            csctx.closePath();
            if (Render2D.arrowShape.fill) {
                csctx.fill();
            }
        }
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

Render2D.clipLineCore = function(a, b, c) {
    // clip to canvas boundary (up to line size)
    var margin = Math.SQRT1_2 * Render2D.lsize;
    var xMin = 0 - margin;
    var xMax = csw + margin;
    var yMax = 0 - margin;
    var yMin = csh + margin;
    var distNeg = function(x, y) {
        return x * a + y * b + c < 0;
    };
    var ul = distNeg(xMin, yMax);
    var ur = distNeg(xMax, yMax);
    var ll = distNeg(xMin, yMin);
    var lr = distNeg(xMax, yMin);
    var res = [];
    if (ul !== ur) res.push({
        x: (-c - b * yMax) / a,
        y: yMax
    });
    if (ur !== lr) res.push({
        x: xMax,
        y: (-c - a * xMax) / b
    });
    if (ll !== lr) res.push({
        x: (-c - b * yMin) / a,
        y: yMin
    });
    if (ul !== ll) res.push({
        x: xMin,
        y: (-c - a * xMin) / b
    });

    return res;
};

Render2D.clipLine = function(homog) {
    // transformation to canvas coordinates
    var n = List.normalizeMax(List.productVM(homog, csport.toMat()));
    var a = n.value[0].value.real;
    var b = n.value[1].value.real;
    var c = n.value[2].value.real;
    return Render2D.clipLineCore(a, b, c);
};

Render2D.drawline = function(homog) {
    if (!List._helper.isAlmostReal(homog))
        return;

    var res = Render2D.clipLine(homog);
    if (res.length === 2 && Render2D.lsize >= 0.01) {
        Render2D.preDrawCurve();
        csctx.beginPath();
        csctx.moveTo(res[0].x, res[0].y);
        csctx.lineTo(res[1].x, res[1].y);
        csctx.stroke();
    }
};

Render2D.dashTypes = {
    "solid": [],
    "dashed": [10, 10],
    "tightdash": [10, 4],
    "dotted": [1, 3],
    "dashdot": [10, 5, 1, 5],
    "dashvalue.solid": [],
    "dashvalue.dashed": [10, 10],
    "dashvalue.tightdash": [10, 4],
    "dashvalue.dotted": [1, 3],
    "dashvalue.dashdot": [10, 5, 1, 5],
    0: [],
    1: [10, 10],
    2: [10, 4],
    3: [1, 3],
    4: [10, 5, 1, 5],
};

Render2D.setDash = function(pattern, size) {
    var s = Math.sqrt(size);
    pattern = pattern.slice();
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
