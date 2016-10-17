function drawgeopoint(el) {
    if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog))
        return;
    var col = el.color;
    if (el.behavior) {
        col = el.color; //TODO Anpassen
        // col=List.realVector([0,0,1]);
    }
    evaluator.draw$1([el.homog], {
        size: el.size,
        color: col,
        alpha: el.alpha
    });
    if (el.labeled && !el.tmp) {
        var lbl = el.printname || el.name || "P";
        var lpos = el.labelpos || {
            'x': 3,
            'y': 3
        };
        var textsize = el.textsize || defaultAppearance.textsize;
        var bold = (el.textbold === true);
        var italics = (el.textitalics === true);
        var family = el.text_fontfamily || defaultAppearance.fontFamily;
        var dist = lpos.x * lpos.x + lpos.y * lpos.y;
        var factor = 1.0;
        if (dist > 0) {
            factor = 1.0 + el.size.value.real / Math.sqrt(dist);
        }
        eval_helper.drawtext(
            [el.homog, General.wrap(lbl)], {
                'x_offset': General.wrap(factor * lpos.x),
                'y_offset': General.wrap(factor * lpos.y),
                'size': General.wrap(textsize),
                'bold': General.wrap(bold),
                'italics': General.wrap(italics),
                'family': General.wrap(family)
            });
    }
}

function drawgeoarc(el) {
    if (!el.isshowing || el.visible === false)
        return;

    var modifs = {};
    modifs.color = el.color;
    modifs.alpha = el.alpha;
    modifs.size = el.size;

    // check if we have filled: true
    var df = el.filled ? "F" : "D";

    eval_helper.drawarc(el, modifs, df);
}


function drawgeoconic(el) {
    if (!el.isshowing || el.visible === false)
        return;

    var modifs = {};
    modifs.color = el.color;
    modifs.alpha = el.alpha;
    modifs.size = el.size;

    eval_helper.drawconic(el.matrix, modifs);


}

function drawgeoline(el) {
    var pt1, pt2;
    if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog))
        return;

    if (el.kind === "S") {
        var modifs = {
            overhang: el.overhang,
            dashtype: el.dashtype,
            size: el.size,
            color: el.color,
            alpha: el.alpha,
            arrow: el.arrow,
            arrowsize: el.arrowsize,
            arrowposition: el.arrowposition,
            arrowshape: el.arrowshape,
            arrowsides: el.arrowsides,
        };
        var zz = CSNumber.mult(el.startpos.value[2],
            CSNumber.conjugate(el.endpos.value[2]));
        if (zz.value.real >= 0) { // finite segment
            evaluator.draw$2(
                [el.startpos, el.endpos], modifs);
            return;
        } else { // transformed segment through infinity, consisting of 2 rays
            Render2D.handleModifs(modifs, Render2D.lineModifs);
            Render2D.drawRaySegment(el.startpos, el.endpos);
            return;
        }
    }
    if (el.clip.value === "end" && el.type === "Join") {
        // Lines clipped to their defining points join these.
        pt1 = csgeo.csnames[el.args[0]];
        pt2 = csgeo.csnames[el.args[1]];
        evaluator.draw$2(
            [pt1.homog, pt2.homog], {
                overhang: el.overhang,
                dashtype: el.dashtype,
                size: el.size,
                color: el.color,
                alpha: el.alpha
            });
        return;
    }
    if (el.clip.value === "inci") {
        // Figuring out incident points here.
        var li = [];
        var xmin = [+1000000, 0];
        var xmax = [-1000000, 0];
        var ymin = [+1000000, 0];
        var ymax = [-1000000, 0];
        for (var i = 0; i < el.incidences.length; i++) {
            var pt = csgeo.csnames[el.incidences[i]].homog;
            var x = pt.value[0];
            var y = pt.value[1];
            var z = pt.value[2];

            if (!CSNumber._helper.isAlmostZero(z)) {
                x = CSNumber.div(x, z);
                y = CSNumber.div(y, z);
                if (CSNumber._helper.isAlmostReal(x) && CSNumber._helper.isAlmostReal(y)) {
                    if (x.value.real < xmin[0]) {
                        xmin = [x.value.real, pt];
                    }
                    if (x.value.real > xmax[0]) {
                        xmax = [x.value.real, pt];
                    }
                    if (y.value.real < ymin[0]) {
                        ymin = [y.value.real, pt];
                    }
                    if (y.value.real > ymax[0]) {
                        ymax = [y.value.real, pt];
                    }
                }
            }
        }
        if ((xmax[0] - xmin[0]) > (ymax[0] - ymin[0])) {
            pt1 = xmin[1];
            pt2 = xmax[1];
        } else {
            pt1 = ymin[1];
            pt2 = ymax[1];

        }
        if (pt1 !== pt2) {
            evaluator.draw$2(
                [pt1, pt2], {
                    dashtype: el.dashtype,
                    size: el.size,
                    color: el.color,
                    alpha: el.alpha,
                    overhang: el.overhang
                });
            return;
        }
        // otherwise fall through
    }
    // Default: draw an unclipped line
    evaluator.draw$1([el.homog], {
        dashtype: el.dashtype,
        size: el.size,
        color: el.color,
        alpha: el.alpha
    });
}

var textCornerNames = {
    "UL": 0,
    "UR": 1,
    "LR": 2,
    "LL": 3
};

function drawgeotext(el) {
    el._bbox = null;
    if (!el.isshowing || el.visible === false) {
        if (el.html) {
            el.html.parentNode.parentNode.style.display = "none";
            el._textCache = {
                invisible: true
            };
        }
        return;
    }
    var opts = {
        "size": el.size,
    };
    var pos = el.homog;
    var text = el.text;
    var getText = geoOps[el.type].getText;
    if (getText) text = getText(el);
    else text = text.replace(/@[$#]"([^"\\]|\\.)*"/g, function(match) {
        var name, el2;
        try {
            name = JSON.parse(match.substring(2));
            el2 = csgeo.csnames[name];
            if (!el2) return "?";
        } catch (err) {
            return "?";
        }
        switch (match.charAt(1)) {
            case '$':
                return el2.printname || name;
            case '#':
                if (el2.kind !== "V") return "?";
                return niceprint(el2.value);
        }
    });
    var htmlCallback = null;
    if (el.html) {
        var cache = el._textCache || {
            text: false
        };
        var label = el.html;
        var inlinebox = label.parentNode;
        var outer = inlinebox.parentNode;
        htmlCallback = function(text, font, x, y, align) {
            if (cache.invisible)
                outer.style.removeProperty("display");
            if (text === cache.text && font === cache.font &&
                x === cache.x && y === cache.y && align === cache.align)
                return;
            if (font !== cache.font) {
                label.style.font = font;
                label.style.lineHeight = defaultAppearance.lineHeight;
            }
            if (text !== cache.text && text !== false)
                if (textRendererHtml(label, text, font) === false)
                    text = false; // Do not cache, must re-run
            outer.style.left = x + "px";
            outer.style.top = y + "px";
            if (align || inlinebox.style.transform)
                inlinebox.style.transform =
                "translateX(" + (-100 * align) + "%)";
            el._textCache = {
                text: text,
                font: font,
                x: x,
                y: y,
                align: align
            };
        };
    }
    text = General.string(text);
    if (el.dock) {
        if (el.dock.to) {
            pos = csgeo.csnames[el.dock.to].homog;
        } else if (textCornerNames.hasOwnProperty(el.dock.corner)) {
            pos = evaluator.screenbounds$0([], {});
            pos = pos.value[textCornerNames[el.dock.corner]];
        }
        opts.offset = el.dock.offset;
    }
    if (el.align)
        opts.align = General.string(el.align);
    if (pos)
        el._bbox = eval_helper.drawtext([pos, text], opts, htmlCallback);
}

function drawgeopolygon(el) {
    if (!el.isshowing || el.visible === false)
        return;
    var modifs = {
        color: el.color,
        alpha: el.alpha,
        fillcolor: el.fillcolor,
        fillalpha: el.fillalpha,
        size: el.size,
        lineJoin: General.string("miter"),
    };
    eval_helper.drawpolygon([el.vertices], modifs, "D", true);
}

function drawgeoifs(el) {
    if (!el._img) return;
    csctx.drawImage(el._img, 0, 0, csw, csh);
}

function render() {

    var i;

    for (i = 0; i < csgeo.polygons.length; i++) {
        drawgeopolygon(csgeo.polygons[i]);
    }

    for (i = 0; i < csgeo.conics.length; i++) {
        if (csgeo.conics[i].isArc) drawgeoarc(csgeo.conics[i]);
        else drawgeoconic(csgeo.conics[i]);
    }


    for (i = 0; i < csgeo.lines.length; i++) {
        drawgeoline(csgeo.lines[i]);
    }


    for (i = 0; i < csgeo.points.length; i++) {
        drawgeopoint(csgeo.points[i]);
    }

    for (i = 0; i < csgeo.texts.length; i++) {
        drawgeotext(csgeo.texts[i]);
    }

    for (i = 0; i < csgeo.ifs.length; i++) {
        drawgeoifs(csgeo.ifs[i]);
    }

}

// TODO Lines, ...
// TODO tracedim
function draw_traces() {
    for (var i = 0; i < csgeo.points.length; i++) {
        var el = csgeo.points[i];

        if (!el.drawtrace) continue;
        if (el._traces_tick === el.traceskip) {
            el._traces[el._traces_index] = el.homog;
            el._traces_index = (el._traces_index + 1) % el._traces.length;
            el._traces_tick = 0;
        } else {
            el._traces_tick++;
        }

        var elAlpha = el.alpha.value.real;
        var size = el.size.value.real;
        var dimfactor = 1;
        if (el.tracedim !== 1) {
            size *= el.tracedim;
            dimfactor = Math.pow(el.tracedim, -1 / el._traces.length);
        }
        var j, k = 0;
        for (j = el._traces_index; j < el._traces.length; ++j)
            drawIt();
        for (j = 0; j < el._traces_index; ++j)
            drawIt();
    }

    function drawIt() {
        var lev = k++/ el._traces.length;
        var pos = el._traces[j];
        if (pos) {
            var alpha = elAlpha * lev * lev * lev;
            evaluator.draw$1([pos], {
                size: CSNumber.real(size),
                color: el.color,
                alpha: CSNumber.real(alpha)
            });
        }
        size *= dimfactor;
    }
}
