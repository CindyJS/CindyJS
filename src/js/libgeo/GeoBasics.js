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


    var k, l, f, el;
    var totalStateSize = 0;

    csgeo.points = [];
    csgeo.lines = [];
    csgeo.conics = [];
    csgeo.free = [];
    var ctp = 0;
    var ctf = 0;
    var ctl = 0;
    var ctc = 0;

    // Das ist für alle gleich
    for (k = 0; k < gslp.length; k++) {
        el = gslp[k];
        var macro = geoMacros[el.type];
        if (macro) {
            var expansion = macro(el).slice();
            // Replace single element gslp[k] with all the elements
            // from expansion, using gslp.splice(k, 1, expansion[0], ...)
            expansion.splice(0, 0, k, 1);
            gslp.splice.apply(gslp, expansion);
            --k; // process the first expanded element
            continue;
        }
        csgeo.csnames[el.name] = el;
        var op = geoOps[el.type];
        el.kind = op.kind;
        el.stateIdx = totalStateSize;
        totalStateSize += op.tracingStateSize || 0;
        el.incidences = [];
        el.isshowing = true;
        el.movable = false;
        if (op.isMovable) {
            el.movable = true;
            csgeo.free[ctf++] = el;
        }

        if (el.kind === "P") {
            csgeo.points[ctp] = el;
            pointDefault(el);
            ctp += 1;
        }
        if (el.kind === "L") {
            csgeo.lines[ctl] = el;
            lineDefault(el);
            ctl += 1;
        }
        if (el.kind === "C") {
            csgeo.conics[ctc] = el;
            lineDefault(el);
            ctc += 1;
        }
        if (el.kind === "S") {
            csgeo.lines[ctl] = el;
            segmentDefault(el);
            ctl += 1;
        }

        var init = geoOps[el.type].computeParametersOnInit;
        if (init)
            init(el);
    }
    stateLastGood = stateIn = new Float64Array(totalStateSize);
    stateOut = new Float64Array(totalStateSize);
    stateSpare = new Float64Array(totalStateSize);
    tracingInitial = true;
    recalc();
    tracingInitial = false;
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
    noMoreRefinements = true;
    var gslp = csgeo.gslp;
    for (var k = 0; k < gslp.length; k++) {
        var el = gslp[k];
        var op = geoOps[el.type];
        if (!op) {
            console.error(el);
            console.error("Operation " + el.type + " not implemented yet");
        }
        stateInIdx = stateOutIdx = el.stateIdx;
        if (op.computeParameters)
            op.computeParameters(el);
        op.updatePosition(el);
        isShowing(el, op);
    }
    stateSwapGood(); // is this correct?
}

var geoDependantsCache = {};

function getGeoDependants(mover) {
    var deps = geoDependantsCache[mover.name];
    if (deps) return deps;
    var depSet = {};
    var k = 0;
    deps = [];
    depSet[mover.name] = mover;
    var gslp = csgeo.gslp;
    for (var i = 0; i < gslp.length; ++i) {
        var el = gslp[i];
        var args = el.args;
        if (!args) continue;
        for (var j = 0; j < args.length; ++j) {
            var arg = args[j];
            if (depSet.hasOwnProperty(arg)) {
                depSet[el.name] = el;
                deps[k++] = el;
            }
        }
    }
    geoDependantsCache[mover.name] = deps;
    return deps;
}

function guessIncidences() {

    var gslp = csgeo.gslp;
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
