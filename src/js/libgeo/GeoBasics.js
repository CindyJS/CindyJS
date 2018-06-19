var defaultAppearance = {};
defaultAppearance.clip = "none";
defaultAppearance.pointColor = [1, 0, 0];
defaultAppearance.lineColor = [0, 0, 1];
defaultAppearance.pointSize = 5;
defaultAppearance.lineSize = 1;
defaultAppearance.alpha = 1;
defaultAppearance.overhangLine = 1;
defaultAppearance.overhangSeg = 1;
defaultAppearance.dimDependent = 0.7;
defaultAppearance.fontFamily = "sans-serif";
defaultAppearance.textColor = [0, 0, 0];
defaultAppearance.textsize = 20; // Cinderella uses 12 by default
defaultAppearance.noborder = false;

defaultAppearance.lineHeight = 1.45;
/* The value of 1.45 for the line height agrees reasonably well with
 * the default font and size in Cinderella on OS X, but it might well
 * be that the Java line height is read from the font file, so that
 * other fonts should use other line heights.
 * Not sure whether we can reasonably reproduce this.
 */

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
        assert(op.signature || opName === "_helper",
            opName + " has no signature");
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

    csgeo.gslp = [];
    csgeo.csnames = {}; // Map from name to geometric element
    csgeo.points = [];
    csgeo.lines = [];
    csgeo.conics = [];
    csgeo.texts = [];
    csgeo.free = [];
    csgeo.polygons = [];
    csgeo.ifs = [];

    gslp.forEach(addElementNoProof);
    checkConjectures();
}

// Setzen der Default appearance

function setupTraceDrawing(el) {
    if (typeof el.tracedim === "undefined") el.tracedim = 1;
    if (typeof el.tracelength === "undefined") el.tracelength = 100;
    if (typeof el.traceskip === "undefined") el.traceskip = 1;
    el._traces = new Array(el.tracelength);
    el._traces_index = 0;
    el._traces_tick = 0;
}

function pointDefault(el) {

    if (el.size === undefined) el.size = defaultAppearance.pointSize;
    el.size = CSNumber.real(el.size);
    if (!el.movable || el.pinned) {
        el.color = List.realVector(el.color || defaultAppearance.pointColor);
        el.color = List.scalmult(CSNumber.real(defaultAppearance.dimDependent), el.color);
    } else {
        el.color = List.realVector(el.color || defaultAppearance.pointColor);
    }
    if (el.alpha === undefined) el.alpha = defaultAppearance.alpha;
    el.alpha = CSNumber.real(el.alpha);

    if (typeof(el.noborder) !== 'boolean') el.noborder = defaultAppearance.noborder;
    el.noborder = General.bool(el.noborder);

    if (typeof(el.border) !== 'boolean') el.border = !(defaultAppearance.noborder);
    el.border = General.bool(el.border);

    if (el.drawtrace) {
        setupTraceDrawing(el);
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
    if (el.dashtype)
        el.dashtype = General.wrap(el.dashtype);
}

function segmentDefault(el) {
    if (el.overhang === undefined)
        el.overhang = defaultAppearance.overhangSeg;
    if (el.arrow)
        el.arrow = General.bool(el.arrow);
    if (el.arrowsize)
        el.arrowsize = CSNumber.real(el.arrowsize);
    if (el.arrowposition)
        el.arrowposition = CSNumber.real(el.arrowposition);
    if (el.arrowshape)
        el.arrowshape = General.string(el.arrowshape);
    if (el.arrowsides)
        el.arrowsides = General.string(el.arrowsides);
    lineDefault(el);
    el.clip = General.string("end");
}

function textDefault(el) {
    var size;
    if (el.textsize !== undefined) el.size = el.textsize;
    else if (el.size !== undefined) el.size = el.size;
    else el.size = defaultAppearance.textsize;
    el.size = CSNumber.real(+el.size);
}

function polygonDefault(el) {
    el.filled = (el.filled !== undefined ? General.bool(el.filled) : General.bool(true));
    if (el.fillcolor === undefined) el.fillcolor = nada;
    else el.fillcolor = List.realVector(el.fillcolor);
    if (el.fillalpha === undefined) el.fillalpha = 0;
    el.fillalpha = CSNumber.real(el.fillalpha);

    lineDefault(el);
}

function addElement(el, removeDuplicates) {
    el = addElementNoProof(el);
    checkConjectures();

    // remove element if it's a proven duplicate
    if (typeof removeDuplicates === 'boolean' && removeDuplicates && el.Duplicate) {
        var dup = el.Duplicate;
        console.log("duplication detected: removing " + el.name + " (duplicate of " + dup.name + ").");
        removeElement(el.name);
        return dup;
    }

    return el;
}

function addElementNoProof(el) {
    var i;

    // Adding an existing element moves that element to the given position
    if (csgeo.csnames[el.name] !== undefined) {
        console.log("Element name '" + el.name + "' already exists");

        var existingEl = csgeo.csnames[el.name];
        if (geoOps[existingEl.type].isMovable &&
            geoOps[existingEl.type].kind === "P")
            movepointscr(existingEl, el.pos, "homog");

        return existingEl;
    }

    // Recursively apply aliases
    while (geoAliases.hasOwnProperty(el.type)) {
        el.type = geoAliases[el.type];
    }

    // Expand macros
    var macro = geoMacros[el.type];
    if (macro) {
        var expansion = macro(el);
        var res = null;
        for (i = 0; i < expansion.length; ++i) {
            res = addElement(expansion[i]);
        }
        return res;
    }

    // Detect unsupported operations or missing or incorrect arguments
    var op = geoOps[el.type];
    var isSet = false;
    var getKind = function(name) {
        return csgeo.csnames[name].kind;
    };

    if (!op) {
        console.error(el);
        console.error("Operation " + el.type + " not implemented yet");
        return null;
    }
    if (op.signature !== "**") {
        // check for sets
        if (!Array.isArray(op.signature) && op.signature.charAt(1) === "*") {
            isSet = true;
            el.args.forEach(function(val) {
                if (csgeo.csnames[val].kind !== op.signature.charAt(0)) {
                    console.error(
                        "Not all elements in set are of same type: " +
                        el.name + " expects " + op.signature +
                        " but " + val + " is of kind " +
                        csgeo.csnames[val].kind);
                    if (typeof window !== "undefined")
                        window.alert("Not all elements in set are of same type: " + el.name);
                    return null;
                }
            });
        } else if (op.signature.length !== (el.args ? el.args.length : 0)) {
            console.error(
                "Wrong number of arguments for " + el.name +
                " of type " + el.type);
            if (typeof window !== "undefined")
                window.alert("Wrong number of arguments for " + el.name);
            return null;
        }
    }
    if (el.args) {
        for (i = 0; i < el.args.length; ++i) {
            if (!csgeo.csnames.hasOwnProperty(el.args[i])) {
                console.log(
                    "Dropping " + el.name +
                    " due to missing argument " + el.args[i]);
                return null;
            }
            if (op.signature !== "**" && !isSet) {
                var argKind = csgeo.csnames[el.args[i]].kind;
                if (!(op.signature[i] === argKind || (argKind === "S" &&
                        op.signature[i] ===
                        "L"))) {
                    window.alert("Wrong argument kind " + argKind +
                        " as argument " + i + " to element " +
                        el.name + " of type " + el.type);
                    return null;
                }
            }
        }
    }
    if (op.signatureConstraints && !op.signatureConstraints(el)) {
        window.alert("signature constraints violated for element " + el.name);
    }

    csgeo.gslp.push(el);
    csgeo.csnames[el.name] = el;
    var totalStateSize = stateLastGood.length;
    el.kind = op.kind;
    el.stateIdx = totalStateSize;
    totalStateSize += op.stateSize;
    el.incidences = [];
    el.isshowing = true;
    el.movable = false;

    if (op.isMovable) {
        el.movable = true;
        csgeo.free.push(el);
    }

    if (el.kind === "P") {
        csgeo.points.push(el);
        pointDefault(el);
    }
    if (el.kind === "L") {
        csgeo.lines.push(el);
        lineDefault(el);
    }
    if (el.kind === "C") {
        csgeo.conics.push(el);
        lineDefault(el);
    }
    if (el.kind === "S") {
        csgeo.lines.push(el);
        segmentDefault(el);
    }
    if (el.kind === "Text") {
        csgeo.texts.push(el);
        textDefault(el);
    }
    if (el.kind === "Poly") {
        csgeo.polygons.push(el);
        polygonDefault(el);
    }
    if (el.kind === "IFS") {
        csgeo.ifs.push(el);
    }

    if (true || op.stateSize !== 0) {
        stateAlloc(totalStateSize);
        stateIn = stateOut = stateLastGood;
        // initially, stateIn and stateOut are the same, so that initialize can
        // write some state and updatePosition can immediately use it
        tracingInitial = true;
        if (op.initialize) {
            stateInIdx = stateOutIdx = el.stateIdx;
            el.param = op.initialize(el);
            assert(stateOutIdx === el.stateIdx + op.stateSize,
                "State fully initialized");
        }
        stateInIdx = stateOutIdx = el.stateIdx;
        op.updatePosition(el, false);
        assert(stateInIdx === el.stateIdx + op.stateSize,
            "State fully consumed");
        assert(stateOutIdx === el.stateIdx + op.stateSize,
            "State fully updated");
        tracingInitial = false;
        stateIn = stateArrays.in;
        stateIn.set(stateLastGood);
        stateOut = stateArrays.out;
    } else {
        // Do the updatePosition call with correct state handling around it.
    }
    isShowing(el, op);

    geoDependantsCache = {};
    guessDuplicate(el);
    guessIncidences(el);

    return csgeo.csnames[el.name];
}

// TODO Remove dependencies also
function removeElement(name) {
    var i, el, debug = false;
    if (debug) console.log("Remove element " + name);

    // TODO Check if name exists
    delete csgeo.csnames[name];

    for (i = 0; i < csgeo.gslp.length; i++) {
        el = csgeo.gslp[i];

        if (el.name === name) {
            if (debug) console.log("Removed element from gslp " + name);
            csgeo.gslp.splice(i, 1);
        }
    }

    for (i = 0; i < csgeo.free.length; i++) {
        el = csgeo.free[i];

        if (el.name === name) {
            if (debug) console.log("Removed element from free " + name);
            csgeo.free.splice(i, 1);
        }
    }

    for (i = 0; i < csgeo.points.length; i++) {
        el = csgeo.points[i];

        if (el.name === name) {
            if (debug) console.log("Removed element from points " + name);
            csgeo.points.splice(i, 1);
        }
    }

    for (i = 0; i < csgeo.lines.length; i++) {
        el = csgeo.lines[i];

        if (el.name === name) {
            if (debug) console.log("Removed element from lines " + name);
            csgeo.lines.splice(i, 1);
        }
    }

    for (i = 0; i < csgeo.conics.length; i++) {
        el = csgeo.conics[i];

        if (el.name === name) {
            if (debug) console.log("Removed element from conics " + name);
            csgeo.conics.splice(i, 1);
        }
    }

    geoDependantsCache = {};
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
    /*
    console.log("getGeoDependants(" + mover.name + ") := [" +
                deps.map(function(el) { return el.name; }).join(",") + "]");
    */
    return deps;
}
