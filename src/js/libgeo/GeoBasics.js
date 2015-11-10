var defaultAppearance = {};
defaultAppearance.clip = "none";
defaultAppearance.pointColor = [1, 0, 0];
defaultAppearance.lineColor = [0, 0, 1];
defaultAppearance.pointSize = 5;
defaultAppearance.lineSize = 1;
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

function csinit(gslp) {

    // establish defaults for geoOps
    Object.keys(geoOps).forEach(function(opName) {
        var op = geoOps[opName];
        if (op.updatePosition !== undefined && op.stateSize === undefined)
            op.stateSize = 0;
    });

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
    //movable

    csgeo.gslp = gslp;

    csgeo.csnames = {}; //Lookup für elemente mit über Namen


    var k, l, f, el, op;
    var totalStateSize = 0;

    csgeo.points = [];
    csgeo.lines = [];
    csgeo.conics = [];
    csgeo.free = [];
    var ctp = 0;
    var ctf = 0;
    var ctl = 0;
    var ctc = 0;
    var dropped = {};

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
        op = geoOps[el.type];
        if (!op) {
            console.error(el);
            console.error("Operation " + el.type + " not implemented yet");
            dropped[el.name] = true;
            gslp.splice(k, 1);
            k--;
            continue;
        }
        if (el.args) {
            for (l = 0; l < el.args.length; ++l) {
                if (dropped.hasOwnProperty(el.args[l]))
                    break;
            }
            if (l < el.args.length) { // we did break
                console.log("Dropping " + el.name +
                    " due to dropped argument " + el.args[l]);
                dropped[el.name] = true;
                gslp.splice(k, 1);
                k--;
                continue;
            }
        }
        el.kind = op.kind;
        el.stateIdx = totalStateSize;
        totalStateSize += op.stateSize;
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
    }
    stateLastGood = stateIn = stateOut = new Float64Array(totalStateSize);
    // initially, stateIn and stateOut are the same, so that initialize can
    // write some state and updatePosition can immediately use it
    for (k = 0; k < gslp.length; k++) {
        el = gslp[k];
        op = geoOps[el.type];
        tracingInitial = true; // might get reset by initialize
        if (op.initialize) {
            stateInIdx = stateOutIdx = el.stateIdx;
            el.param = op.initialize(el);
            assert(stateOutIdx === el.stateIdx + op.stateSize, "State fully initialized");
        }
        stateInIdx = stateOutIdx = el.stateIdx;
        op.updatePosition(el, false);
        assert(stateInIdx === el.stateIdx + op.stateSize, "State fully consumed");
        assert(stateOutIdx === el.stateIdx + op.stateSize, "State fully updated");
        isShowing(el, op);
    }
    stateLastGood = new Float64Array(totalStateSize);
    stateOut = new Float64Array(totalStateSize);
    stateContinueFromHere();
    tracingInitial = false;
    guessIncidences();
}

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

    if (el.trace) {
        el._traces = [];
        el._traces_tick = 0;

        if (typeof el.tracedim === "undefined") el.tracedim = 1;
        if (typeof el.tracelength === "undefined") el.tracelength = 100;
        if (typeof el.traceskip === "undefined") el.traceskip = 1;
    }
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
