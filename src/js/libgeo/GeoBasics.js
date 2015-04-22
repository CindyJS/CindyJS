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

    // Das ist für alle gleich
    for (k = 0; k < gslp.length; k++) {
        el = gslp[k];
        csgeo.csnames[el.name] = el;
        var op = geoOps[el.type];
        el.kind = op.kind;
        el.stateIdx = totalStateSize;
        totalStateSize += op.tracingStateSize || 0;
        el.incidences = [];
        el.isshowing = true;
        el.movable = false;
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

    for (k = 0; k < gslp.length; k++) {
        el = gslp[k];

        if (el.kind === "P") {
            csgeo.points[csgeo.ctp] = el;
            pointDefault(el);
            csgeo.ctp += 1;
        }
        if (el.kind === "L") {
            csgeo.lines[csgeo.ctl] = el;
            lineDefault(el);
            csgeo.ctl += 1;
        }
        if (el.kind === "C") {
            csgeo.conics[csgeo.ctc] = el;
            lineDefault(el);
            csgeo.ctc += 1;
        }
        if (el.kind === "S") {
            csgeo.lines[csgeo.ctl] = el;
            segmentDefault(el);
            csgeo.ctl += 1;
        }

        var ty = el.type;
        if (ty === "Free" || ty === "PointOnLine" || ty === "PointOnCircle" || ty === "PointOnSegment") { //TODO generisch nach geoops ziehen
            var sx = el.sx || 0;
            var sy = el.sy || 0;
            var sz = el.sz || 1;
            if (el.pos) {
                if (el.pos.length === 2) {
                    sx = el.pos[0];
                    sy = el.pos[1];
                    sz = 1;
                }
                if (el.pos.length === 3) {
                    sx = el.pos[0] / el.pos[2];
                    sy = el.pos[1] / el.pos[2];
                    sz = el.pos[2] / el.pos[2];
                }
            }
            el.param = List.realVector([sx, sy, sz]);
            el.isfinite = (sz !== 0);
            el.ismovable = true;
            if (ty === "PointOnCircle") {
                el.angle = CSNumber.real(el.angle);
            }
            csgeo.free[csgeo.ctf] = el;
            csgeo.ctf += 1;
        }
        if (ty === "CircleMr" || ty === "CircleMFixedr") {
            el.radius = CSNumber.real(el.radius);
            csgeo.free[csgeo.ctf] = el;
            csgeo.ctf += 1;
        }
        if (ty === "Through") {
            el.param = General.wrap(el.dir);
            csgeo.free[csgeo.ctf] = el;
            csgeo.ctf += 1;
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

/* Thoughts about state handling.
 * - trace has to start from stateLastGood
 * - each trace step reads from stateIn and writes to stateOut
 * - if refinement is requested, we have to keep stateIn
 * - if a step is concluded (succeeded or failed, no refinement),
 *   then we want to use stateOut as the next stateIn
 *   and the intermediate parameter as the next start parameter
 * - after a whole trace run, if no step failed, stateOut
 *   becomes stateLastGood since everything is good
 * - on mouseup or after recalc, our stateOut becomes stateLastGood
 * - stateIn and stateLastGood sometimes refer to the same object
 * - we need at least three states and four variables for all of this
 * - we try to avoid copying data between arrays, and swap arrays instead
 */

/* Details on state handling:
 * Between traces, we have two possible situations.
 *
 * A) The current state is good.
 *    In this case, stateIn and stateLastGood point to the same array,
 *    representing the current state. stateOut and stateSpare point to
 *    two distinct arrays, the content of which is irrelevant.
 *
 * B) The current state is bad.
 *    In this case, stateIn points to the current state, and stateLastGood
 *    points to the last state which has been considered good. stateOut
 *    points to a third array with irrelevant content. stateSpare is null.
 *
 * There are a number of transition functions to switch between these
 * situations. These are called AFTER a tracing or recalc run, so that
 * things are already prepared for the next run in the way described
 * above.
 */

var stateIn, stateOut, stateLastGood, stateSpare;

/**
 * stateOut is a good state, make it the last good state as well as
 * the next stateIn. Ensure we don't loose any buffers.
 */
function stateSwapGood() {
    var resultState = stateOut;
    stateOut = stateIn;
    stateSpare = stateSpare || stateLastGood;
    stateLastGood = stateIn = resultState;
}

/**
 * stateOut is a bad (failed or incomplete) state, make it the next stateIn but
 * keep the current stateLastGood. Ensure we don't loose any buffers.
 */
function stateSwapBad() {
    var resultState = stateOut;
    stateOut = stateSpare || stateIn;
    stateSpare = null;
    stateIn = resultState;
}

/**
 * Current state (i.e. stateIn) is now deemed good, even in case it
 * wasn't considered good before. Make it the stateLastGood. If we
 * were in a good situation, there is nothing to do.
 */
function stateContinueFromHere() {
    if (!stateSpare) {
        stateSpare = stateLastGood;
        stateLastGood = stateIn;
        tracingStateReport(false);
    }
}

/**
 * Make stateIn point to the last good state.
 * If it already does, there is nothing to do.
 */
function stateRevertToGood() {
    if (!stateSpare) {
        stateSpare = stateIn;
        stateIn = stateLastGood;
    }
}

var stateInIdx, stateOutIdx;

var tracingInitial, tracingFailed, noMoreRefinements;

var RefineException = {
    toString: function() {
        return "RefineException";
    }
};

function requestRefinement() {
    // Call this whenever you would need exra refinement.
    // Possible outcomes: either an exception will be thrown to
    // request more refinements, or the tracingFailed flag will be set
    // and the function returns normally.
    if (noMoreRefinements) tracingFailed = true;
    else throw RefineException;
}

function defaultParameterPath(el, t, src, dst) {
    // src + t * (dst - src)
    el.param = General.add(src, General.mult(t, General.sub(dst, src)));
}

function trace() {
    //console.log(stateLastGood);
    var mover = move.mover;
    var deps = getGeoDependants(mover);
    var last = -1;
    var t = 1;
    var step = 2;
    var i, el, op;
    var opMover = geoOps[mover.type];
    var parameterPath = opMover.parameterPath || defaultParameterPath;
    stateRevertToGood();
    var lastGoodParam = move.lastGoodParam;
    opMover.computeParametersOnInput(mover, lastGoodParam);
    var targetParam = mover.param; // not cloning, must not get modified
    tracingFailed = false;
    while (last !== t) {
        if (traceLog) {
            traceLogRow = [];
            traceLog.push(traceLogRow);
            if (last === -1 && t === 1) {
                traceLogRow[0] = niceprint(lastGoodParam);
                traceLogRow[1] = niceprint(targetParam);
            }
            else {
                traceLogRow[0] = "";
                traceLogRow[1] = "";
            }
            traceLogRow[2] = last;
            traceLogRow[3] = t;
        }
        // Rational parametrization of semicircle,
        // see http://jsperf.com/half-circle-parametrization
        var t2 = t * t;
        var dt = 0.5 / (1 + t2);
        var tc = CSNumber.complex((2 * t) * dt + 0.5, (1 - t2) * dt);
        noMoreRefinements = (last + 0.5 * step <= last);
        try {
            stateInIdx = stateOutIdx = mover.stateIdx;
            parameterPath(mover, tc, lastGoodParam, targetParam);
            if (traceLog) traceLogRow[4] = niceprint(mover.param);
            opMover.updatePosition(mover);
            for (i = 0; i < deps.length; ++i) {
                el = deps[i];
                op = geoOps[el.type];
                stateInIdx = stateOutIdx = el.stateIdx;
                if (op.computeParameters)
                    op.computeParameters(el);
                op.updatePosition(el);
            }
            last = t; // successfully traced up to t
            step *= 1.25;
            t += step;
            if (t >= 1) t = 1;
            stateSwapBad(); // may become good if we complete without failing
        } catch (e) {
            if (e !== RefineException)
                throw e;
            step *= 0.5; // reduce step size
            t = last + step;
        }
    }
    if (!tracingFailed) {
        move.lastGoodParam = targetParam;
        stateContinueFromHere();
    }
    tracingStateReport(tracingFailed);
    for (i = 0; i < deps.length; ++i) {
        el = deps[i];
        op = geoOps[el.type];
        isShowing(el, op);
    }
}

function tracingStateReport(failed) {
    var arg = instanceInvocationArguments['tracingStateReport'];
    if (typeof arg === "string") {
        document.getElementById(arg).textContent =
            failed ? "BAD" : "GOOD";
    }
}

var traceLog = null, traceLogRow = [];

if (instanceInvocationArguments["enableTraceLog"]) {
    traceLog = [];
    globalInstance["formatTraceLog"] = formatTraceLog;
}

function formatTraceLog(save) {
    var tbody = '<tbody>' + traceLog.map(function(row) {
        var action = row[row.length - 1];
        var cls;
        if (/^Normal/.test(action))
            cls = "normal";
        else if (/refine.?$/.test(action))
            cls = "refine";
        else
            cls = "other";
        if (row[0] !== "")
            cls = "initial " + cls;
        else
            cls = "refined " + cls;
        return '<tr class="' + cls + '">' + row.map(function(cell) {
            return '<td>' + cell + '</td>';
        }).join('') + '</tr>\n';
    }).join('') + '</tbody>';
    var cols = ['lastGoodParam', 'targetParam', 'last', 't', 'param',
                'do1n1', 'do1n2', 'do2n1', 'do2n2', 'do1o2', 'dn1n2', 'cost',
                'n1', 'n2', 'o1', 'o2', 'case'];
    var thead = '<thead>' + cols.map(function(cell) {
        return '<th>' + cell + '</th>';
    }).join('') + '</thead>';
    var table1 = '<table id="t1">' + thead + tbody + '</table>';
    var css = [
        'html, body { margin: 0px; padding: 0px; }',
        'td { white-space: nowrap; border: 1px solid black; }',
        'table { border-collapse: collapse; margin: 0px; }',
        'thead th { background: #fff; }',
        'tr.initial.normal td { background: #0ff; }',
        'tr.refined.normal td { background: #0f0; }',
        'tr.initial.refine td { background: #f0f; }',
        'tr.refined.refine td { background: #ff0; }',
        'tr.other td { background: #f00; }',
    ].join('\n');
    var html = '<html><head><title>Tracing report</title>' +
        '<style type="text/css">' + css + '</style></head><body>' +
        table1 + '</body></html>';
    var type = save ? 'application/octet-stream' : 'text/html';
    var blob = new Blob([html], {'type': type});
    var uri = window.URL.createObjectURL(blob);
    // var uri = 'data:text/html;base64,' + window.btoa(html);
    return uri;
}

function getStateComplexNumber() {
    var i = stateInIdx;
    stateInIdx += 2;
    return CSNumber.complex(stateIn[i], stateIn[i + 1]);
}

function getStateComplexVector(n) {
    var lst = new Array(n);
    for (var i = 0; i < n; ++i)
        lst[i] = getStateComplexNumber();
    return List.turnIntoCSList(lst);
}

function putStateComplexNumber(c) {
    stateOut[stateOutIdx] = c.value.real;
    stateOut[stateOutIdx + 1] = c.value.imag;
    stateOutIdx += 2;
}

function putStateComplexVector(v) {
    for (var i = 0, n = v.value.length; i < n; ++i)
        putStateComplexNumber(v.value[i]);
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
