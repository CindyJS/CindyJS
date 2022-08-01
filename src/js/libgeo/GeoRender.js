import { csgeo, vscale, csctx, csw, csh } from "Setup";
import { CSNumber } from "libcs/CSNumber";
import { List } from "libcs/List";
import { General } from "libcs/General";
import { eval_helper, evaluator, niceprint } from "libcs/Essentials";
import { textRendererHtml } from "libcs/OpDrawing";
import { Render2D } from "libcs/Render2D";
import { csport } from "libgeo/GeoState";
import { defaultAppearance } from "libgeo/GeoBasics";
import { geoOps, ifs } from "libgeo/GeoOps";

function drawlabel(el, lbl, pos, lpos, color) {
    const textsize = el.textsize || defaultAppearance.textsize;
    const bold = el.textbold === true;
    const italics = el.textitalics === true;
    const family = el.text_fontfamily || defaultAppearance.fontFamily;
    const dist = lpos.x * lpos.x + lpos.y * lpos.y;
    let factor = 1.0;
    if (dist > 0) {
        factor = 1.0 + el.size.value.real / Math.sqrt(dist);
    }

    const alpha = el.alpha || CSNumber.real(defaultAppearance.alpha);
    eval_helper.drawtext([pos, General.wrap(lbl)], {
        xoffset: General.wrap(factor * lpos.x),
        yoffset: General.wrap(factor * lpos.y),
        size: General.wrap(textsize),
        bold: General.wrap(bold),
        italics: General.wrap(italics),
        family: General.wrap(family),
        color,
        alpha,
    });
}

function drawgeopoint(el) {
    if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog)) return;
    let col = el.color;
    if (el.behavior) {
        col = el.color; //TODO Anpassen
        // col=List.realVector([0,0,1]);
    }
    evaluator.draw$1([el.homog], {
        size: el.size,
        color: col,
        alpha: el.alpha,
        noborder: el.noborder,
        border: el.border,
    });
    if (el.labeled && !el.tmp) {
        const lbl = el.printname || el.name || "P";
        const lpos = el.labelpos || {
            x: 3,
            y: 3,
        };
        let color = Render2D.makeColor(defaultAppearance.textColor);
        if (el.noborder.value === true || el.border.value === false) color = col;
        drawlabel(el, lbl, el.homog, lpos, color);
    }
}

function drawgeoarc(el) {
    if (!el.isshowing || el.visible === false) return;

    const modifs = {};
    modifs.color = el.color;
    modifs.alpha = el.alpha;
    modifs.size = el.size;

    // check if we have filled: true
    const df = el.filled ? "F" : "D";

    eval_helper.drawarc(el, modifs, df);
}

function drawgeoconic(el) {
    if (!el.isshowing || el.visible === false) return;

    const modifs = {};
    modifs.color = el.color;
    modifs.alpha = el.alpha;
    modifs.size = el.size;

    eval_helper.drawconic(el.matrix, modifs);
}

function drawgeoline(el) {
    let pt1, pt2;
    if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog)) return;

    if (el.kind === "S") {
        const modifs = {
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
        const zz = CSNumber.mult(el.startpos.value[2], CSNumber.conjugate(el.endpos.value[2]));
        if (zz.value.real >= 0) {
            // finite segment
            evaluator.draw$2([el.startpos, el.endpos], modifs);
            if (el.labeled && !el.tmp) {
                const lbl = el.printname || el.name || "S";
                const orientedline = List.scalmult(
                    CSNumber.real(
                        Math.sign(el.startpos.value[2].value.real) * Math.sign(el.endpos.value[2].value.real)
                    ),
                    List.cross(el.startpos, el.endpos)
                );

                let npos = {
                    x: orientedline.value[0].value.real,
                    y: orientedline.value[1].value.real,
                };

                //normalize npos
                const nposlength = Math.sqrt(npos.x * npos.x + npos.y * npos.y);

                // TODO: synchronize these constants with Cinderella
                npos = {
                    x: (8 * npos.x) / nposlength - 3,
                    y: (8 * npos.y) / nposlength - 3,
                };
                const lpos = el.labelpos || npos;
                const color = Render2D.makeColor(defaultAppearance.textColor);

                // TODO: synchronize these constants with Cinderella
                const pos = geoOps._helper.midpoint(geoOps._helper.midpoint(el.startpos, el.endpos), el.endpos);
                drawlabel(el, lbl, pos, lpos, color);
            }
            return;
        } else {
            // transformed segment through infinity, consisting of 2 rays
            Render2D.handleModifs(modifs, Render2D.lineModifs);
            Render2D.drawRaySegment(el.startpos, el.endpos);
            return;
        }
    }
    if (el.clip.value === "end" && el.type === "Join") {
        // Lines clipped to their defining points join these.
        pt1 = csgeo.csnames[el.args[0]];
        pt2 = csgeo.csnames[el.args[1]];
        evaluator.draw$2([pt1.homog, pt2.homog], {
            overhang: el.overhang,
            dashtype: el.dashtype,
            size: el.size,
            color: el.color,
            alpha: el.alpha,
        });
        return;
    }
    if (el.clip.value === "inci") {
        // Figuring out incident points here.
        const li = [];
        let xmin = [+1000000, 0];
        let xmax = [-1000000, 0];
        let ymin = [+1000000, 0];
        let ymax = [-1000000, 0];
        for (let i = 0; i < el.incidences.length; i++) {
            const pt = csgeo.csnames[el.incidences[i]].homog;
            let x = pt.value[0];
            let y = pt.value[1];
            const z = pt.value[2];

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
        if (xmax[0] - xmin[0] > ymax[0] - ymin[0]) {
            pt1 = xmin[1];
            pt2 = xmax[1];
        } else {
            pt1 = ymin[1];
            pt2 = ymax[1];
        }
        if (pt1 !== pt2) {
            evaluator.draw$2([pt1, pt2], {
                dashtype: el.dashtype,
                size: el.size,
                color: el.color,
                alpha: el.alpha,
                overhang: el.overhang,
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
        alpha: el.alpha,
    });
}

const textCornerNames = {
    UL: 0,
    UR: 1,
    LR: 2,
    LL: 3,
};

function drawgeotext(el) {
    el._bbox = null;
    if (!el.isshowing || el.visible === false) {
        if (el.html) {
            el.html.parentNode.parentNode.style.display = "none";
            el._textCache = {
                invisible: true,
            };
        }
        return;
    }
    const opts = {
        size: el.size,
    };
    let pos = el.homog;
    let text = el.text;
    const getText = geoOps[el.type].getText;
    if (getText) text = getText(el);
    else
        text = text.replace(/@[$#]"([^"\\]|\\.)*"/g, function (match) {
            let name, el2;
            try {
                name = JSON.parse(match.substring(2));
                el2 = csgeo.csnames[name];
                if (!el2) return "?";
            } catch (err) {
                return "?";
            }
            switch (match.charAt(1)) {
                case "$":
                    return el2.printname || name;
                case "#":
                    if (el2.kind !== "V") return "?";
                    return niceprint(el2.value);
            }
        });
    let htmlCallback = null;
    if (el.html) {
        const cache = el._textCache || {
            text: false,
        };
        const label = el.html;
        const inlinebox = label.parentNode;
        const outer = inlinebox.parentNode;
        htmlCallback = function (text, x, y, align, size) {
            x /= vscale;
            y /= vscale;
            const font =
                Render2D.bold + Render2D.italics + Math.round((size / vscale) * 10) / 10 + "px " + Render2D.family;

            if (cache.invisible) outer.style.removeProperty("display");
            if (text === cache.text && font === cache.font && x === cache.x && y === cache.y && align === cache.align)
                return;
            if (font !== cache.font) {
                label.style.font = font;
                label.style.lineHeight = defaultAppearance.lineHeight;
            }
            if (text !== cache.text && text !== false) if (textRendererHtml(label, text, font) === false) text = false; // Do not cache, must re-run
            outer.style.left = x + "px";
            outer.style.top = y + "px";
            if (align || inlinebox.style.transform) inlinebox.style.transform = "translateX(" + -100 * align + "%)";
            el._textCache = {
                text,
                font,
                x,
                y,
                align,
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
    if (el.align) opts.align = General.string(el.align);
    if (pos) el._bbox = eval_helper.drawtext([pos, text], opts, htmlCallback);
}

function drawgeopolygon(el) {
    if (!el.isshowing || el.visible === false) return;
    const modifs = {
        color: el.color,
        alpha: el.alpha,
        fillcolor: el.fillcolor,
        fillalpha: el.fillalpha,
        size: el.size,
        lineJoin: General.string("miter"),
        fillrule: General.string(el.fillrule),
    };
    eval_helper.drawpolygon([el.vertices], modifs, "D", true);
}

function drawgeoifs() {
    if (ifs.dirty || !General.deeplyEqual(ifs.mat, csport.drawingstate.matrix)) {
        geoOps.IFS.updateParameters();
        ifs.dirty = false;
    }
    if (ifs.img) {
        csctx.drawImage(ifs.img, 0, 0, csw, csh);
    }
}

function render() {
    let i;

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

    if (csgeo.ifs.length) {
        drawgeoifs();
    }
}

// TODO Lines, ...
// TODO tracedim
function draw_traces() {
    for (let i = 0; i < csgeo.points.length; i++) {
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
            dimfactor = el.tracedim ** (-1 / el._traces.length);
        }
        var j,
            k = 0;
        for (j = el._traces_index; j < el._traces.length; ++j) drawIt();
        for (j = 0; j < el._traces_index; ++j) drawIt();
    }

    function drawIt() {
        const lev = k++ / el._traces.length;
        const pos = el._traces[j];
        if (pos) {
            const alpha = elAlpha * lev * lev * lev;
            evaluator.draw$1([pos], {
                size: CSNumber.real(size),
                color: el.color,
                alpha: CSNumber.real(alpha),
            });
        }
        size *= dimfactor;
    }
}

export { draw_traces, render };
