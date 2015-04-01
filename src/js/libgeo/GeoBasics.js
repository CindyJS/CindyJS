var defaultAppearance = {};
defaultAppearance.clip = "none";
defaultAppearance.pointColor = [1, 0, 0];
defaultAppearance.lineColor = [0, 0, 1];
defaultAppearance.pointSize = 5;
defaultAppearance.lineSize = 2;
defaultAppearance.alpha = 1;
defaultAppearance.overhangLine = 1.1;
defaultAppearance.overhangSeg = 1;
defaultAppearance.dimDependent = 1;

function setDefaultAppearance(obj) {
    var key;
    for (key in obj)
        if (obj[key] !== null)
            defaultAppearance[key] = obj[key];
}
if (instanceInvocationArguments.defaultAppearance)
    setDefaultAppearance(instanceInvocationArguments.defaultAppearance);
else if (typeof window !== "undefined" && window.defaultAppearance)
    setDefaultAppearance(window.defaultAppearance);

function csinit(gslp) {

    //Main Data:
    //args          The arguments of the operator
    //type          The operator
    //kind          L,P,C, wird automatisch zugeordnet

    //Relevant fields for appearance:
    //color
    //size
    //alpha
    //overhang
    //clip
    //visible       zum ein und ausblenden
    //isshowing     das wird durch den Konstruktionsbaum vererbt
    //ismovable     


    // Setzen der Default appearance

    function pointDefault(el) {

        if (el.size === undefined) el.size = defaultAppearance.pointSize;
        el.size = CSNumber.real(el.size);
        if (el.type !== "Free") {
            el.color = List.realVector(el.color || defaultAppearance.pointColor);
            el.color = List.scalmult(CSNumber.real(defaultAppearance.dimDependent), el.color);
        } else {
            el.color = List.realVector(el.color || defaultAppearance.pointColor);
        }
        if (el.alpha === undefined) el.alpha = defaultAppearance.alpha;
        el.alpha = CSNumber.real(el.alpha);
    }

    function lineDefault(el) {
        if (el.size === undefined) el.size = defaultAppearance.lineSize;
        el.size = CSNumber.real(el.size);
        el.color = List.realVector(el.color || defaultAppearance.lineColor);
        if (el.alpha === undefined) el.alpha = defaultAppearance.alpha;
        el.alpha = CSNumber.real(el.alpha);
        el.clip = General.string(el.clip || defaultAppearance.clip);
        if (el.overhang === undefined)
            el.overhang = defaultAppearance.overhangLine;
        el.overhang = CSNumber.real(el.overhang);
    }

    function segmentDefault(el) {
        lineDefault(el);
        el.clip = General.string("end");
        if (el.overhang === undefined)
            el.overhang = defaultAppearance.overhangSeg;
        el.overhang = CSNumber.real(el.overhang);
    }

    csgeo.gslp = gslp;

    csgeo.csnames = {}; //Lookup für elemente mit über Namen


    var k, l, f;

    // Das ist für alle gleich
    for (k = 0; k < csgeo.gslp.length; k++) {
        var g = csgeo.gslp[k];
        csgeo.csnames[g.name] = g;
        g.kind = geoOpMap[g.type];
        g.incidences = [];
        g.isshowing = true;
        g.movable = false;
        g.inited = false;
    }

    csgeo.points = [];
    csgeo.lines = [];
    csgeo.conics = [];
    csgeo.free = [];
    csgeo.ctp = 0;
    csgeo.ctf = 0;
    csgeo.ctl = 0;
    csgeo.ctc = 0;
    var m = csport.drawingstate.matrix;

    for (k = 0; k < csgeo.gslp.length; k++) {
        if (csgeo.gslp[k].kind === "P") {
            var p = csgeo.gslp[k];
            csgeo.points[csgeo.ctp] = p;
            pointDefault(p);
            csgeo.ctp += 1;
        }
        if (csgeo.gslp[k].kind === "L") {
            l = csgeo.gslp[k];
            csgeo.lines[csgeo.ctl] = l;
            lineDefault(l);
            csgeo.ctl += 1;
        }
        if (csgeo.gslp[k].kind === "C") {
            l = csgeo.gslp[k];
            csgeo.conics[csgeo.ctc] = l;
            lineDefault(l);
            csgeo.ctc += 1;
        }
        if (csgeo.gslp[k].kind === "S") {
            l = csgeo.gslp[k];
            csgeo.lines[csgeo.ctl] = l;
            segmentDefault(l);
            csgeo.ctl += 1;
        }

        var ty = csgeo.gslp[k].type;
        if (ty === "Free" || ty === "PointOnLine" || ty === "PointOnCircle" || ty === "PointOnSegment") { //TODO generisch nach geoops ziehen
            f = csgeo.gslp[k];
            if (f.pos) {
                if (f.pos.length === 2) {
                    f.sx = f.pos[0];
                    f.sy = f.pos[1];
                    f.sz = 1;
                }
                if (f.pos.length === 3) {
                    f.sx = f.pos[0] / f.pos[2];
                    f.sy = f.pos[1] / f.pos[2];
                    f.sz = f.pos[2] / f.pos[2];
                }

            }
            f.homog = List.realVector([gslp[k].sx, gslp[k].sy, gslp[k].sz]);
            f.isfinite = (f.sz !== 0);
            f.ismovable = true;
            if (ty === "PointOnCircle") {
                f.angle = CSNumber.real(f.angle);

            }
            csgeo.free[csgeo.ctf] = f;
            csgeo.ctf += 1;
        }
        if (ty === "CircleMr" || ty === "CircleMFixedr") {
            f = csgeo.gslp[k];
            f.radius = CSNumber.real(f.radius);
            csgeo.free[csgeo.ctf] = f;
            csgeo.ctf += 1;
        }
        if (ty === "Through") {
            f = csgeo.gslp[k];
            f.dir = General.wrap(f.dir);
            csgeo.free[csgeo.ctf] = f;
            csgeo.ctf += 1;
        }


    }
    guessIncidences();
}

function onSegment(p, s) { //TODO was ist mit Fernpunkten
    // TODO das ist eine sehr teure implementiereung
    // Geht das einfacher?
    var el1 = csgeo.csnames[s.args[0]].homog;
    var el2 = csgeo.csnames[s.args[1]].homog;
    var elm = p.homog;

    var x1 = CSNumber.div(el1.value[0], el1.value[2]);
    var y1 = CSNumber.div(el1.value[1], el1.value[2]);
    var x2 = CSNumber.div(el2.value[0], el2.value[2]);
    var y2 = CSNumber.div(el2.value[1], el2.value[2]);
    var xm = CSNumber.div(elm.value[0], elm.value[2]);
    var ym = CSNumber.div(elm.value[1], elm.value[2]);

    if (CSNumber._helper.isAlmostReal(x1) &&
        CSNumber._helper.isAlmostReal(y1) &&
        CSNumber._helper.isAlmostReal(x2) &&
        CSNumber._helper.isAlmostReal(y2) &&
        CSNumber._helper.isAlmostReal(xm) &&
        CSNumber._helper.isAlmostReal(ym)) {
        x1 = x1.value.real;
        y1 = y1.value.real;
        x2 = x2.value.real;
        y2 = y2.value.real;
        xm = xm.value.real;
        ym = ym.value.real;
        var d12 = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        var d1m = Math.sqrt((x1 - xm) * (x1 - xm) + (y1 - ym) * (y1 - ym));
        var d2m = Math.sqrt((x2 - xm) * (x2 - xm) + (y2 - ym) * (y2 - ym));
        var dd = d12 - d1m - d2m;
        return dd * dd < 0.000000000000001;

    }
    return false;

}

function isShowing(el, op) {
    el.isshowing = true;
    if (el.args) {
        for (var i = 0; i < el.args.length; i++) {
            if (!csgeo.csnames[el.args[i]].isshowing) {
                el.isshowing = false;
                return;
            }
        }
    }
    /*    if (el.kind==="P" ||el.kind==="L"){
        
            if(!List.helper.isAlmostReal(el.homog)){
                el.isshowing=false;
                return;
            }
        }*/

    if (op.visiblecheck) {
        op.visiblecheck(el);
    }

}

function recalc() {

    csport.reset();
    var gslp = csgeo.gslp;
    for (var k = 0; k < gslp.length; k++) {
        var el = gslp[k];
        var op = geoOps[el.type];
        if (!op) {
            console.error(el);
            console.error("Operation " + el.type + " not implemented yet");
        }
        op(el);
        isShowing(el, op);

    }
}


function guessIncidences() {

    var gslp = csgeo.gslp;
    recalc();
    for (var i = 0; i < csgeo.lines.length; i++) {
        var l = csgeo.lines[i];
        for (var j = 0; j < csgeo.points.length; j++) {
            var p = csgeo.points[j];
            var pn = List.scaldiv(List.abs(p.homog), p.homog);
            var ln = List.scaldiv(List.abs(l.homog), l.homog);
            var prod = CSNumber.abs(List.scalproduct(pn, ln));
            if (prod.value.real < 0.0000000000001) {
                p.incidences.push(l.name);
                l.incidences.push(p.name);

            }

        }
    }


}


function render() {

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
        if (el.labeled) {
            var lbl = el.printname || el.name || "P";
            var lpos = el.labelpos || {
                'x': 3,
                'y': 3
            };
            var textsize = el.textsize || 12;
            var bold = (el.textbold === true);
            var italics = (el.textitalics === true);
            var family = el.text_fontfamily || "Sans Serif";
            var dist = lpos.x * lpos.x + lpos.y * lpos.y;
            var factor = 1.0;
            if (dist > 0) {
                factor = 1.0 + el.size.value.real / Math.sqrt(dist);
            }
            evaluator.drawtext$2(
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


    function drawgeoconic(el) {
        if (!el.isshowing || el.visible === false)
            return;

        var modifs = {};
        modifs.color = el.color;
        modifs.alpha = el.alpha;
        modifs.size = el.size;

        var args = el;
        eval_helper.drawconic(args, modifs);


    }

    function drawgeoline(el) {
        var pt1, pt2;
        if (!el.isshowing || el.visible === false || !List._helper.isAlmostReal(el.homog))
            return;

        if (el.clip.value === "none") {
            evaluator.draw$1([el.homog], {
                size: el.size,
                color: el.color,
                alpha: el.alpha
            });
        } else if (el.clip.value === "end") {
            pt1 = csgeo.csnames[el.args[0]];
            pt2 = csgeo.csnames[el.args[1]];
            evaluator.draw$2(
                [pt1.homog, pt2.homog], {
                    size: el.size,
                    color: el.color,
                    alpha: el.alpha
                });
        } else if (el.clip.value === "inci") {
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
                        size: el.size,
                        color: el.color,
                        alpha: el.alpha,
                        overhang: el.overhang
                    });
            } else {
                evaluator.draw$1(
                    [el.homog], {
                        size: el.size,
                        color: el.color,
                        alpha: el.alpha
                    });
            }
        } else {
            console.error(["Bad clip: ", el.clip]);
        }

    }

    var i;

    for (i = 0; i < csgeo.conics.length; i++) {
        drawgeoconic(csgeo.conics[i]);
    }


    for (i = 0; i < csgeo.lines.length; i++) {
        drawgeoline(csgeo.lines[i]);
    }


    for (i = 0; i < csgeo.points.length; i++) {
        drawgeopoint(csgeo.points[i]);
    }


}
