// Functions to save and restore geometric state

var attributesToClone = [
    //"_traces", // internal
    //"_traces_index", // internal
    //"_traces_tick", // internal
    "alpha",
    "angle", // LineByFixedAngle, may need update once we have inspect
    //"antipodalPoint", // internal, PointOnCircle to OtherPointOnCircle
    "args",
    "arrow",
    "arrowposition",
    "arrowshape",
    "arrowsides",
    "arrowsize",
    //"behavior", // needs dedicated code
    "clip",
    "color",
    "dashtype",
    //"dir", // Through, not needed if we export pos
    //"dock", // needs dedicated code
    "drawtrace",
    //"dualMatrix", // output for conic
    //"endPoint", // output for arc
    //"endpos", // output for segment
    //"farpoint", // output for segment
    "filled", // drawgeoarc
    //"homog", // save as pos
    //"incidences", // internal
    //"index", // should not be used, select by pos
    //"isArc", // internal
    //"isshowing", // internal
    //"kind", // internal
    "labeled",
    "labelpos",
    //"mat1", // output of Möbius transformations
    //"mat2", // output of Möbius transformations
    //"matrix", // output of conic or transform
    //"movable", // internal
    "name",
    "overhang",
    //"param", // internal
    "pinned",
    //"pos", // needs dedicated code
    "printname",
    "radius", // CircleMr, does seem to update this
    //"results", // output of multi-valued operations
    //"rot", // internal, LineByFixedAngle
    //"sclRsq", // internal, TrReflectionC
    "size",
    //"startPoint", // output for arc
    //"startpos", // output for segment
    //"stateIdx", // internal
    "text_fontfamily",
    "textbold",
    "textitalics",
    "textsize",
    //"tooClose", // internal
    "tracedim",
    "tracelength",
    "traceskip",
    "tracing",
    "type",
    //"viaPoint", // output for arc
    "visible",
];

function savePos(el) {
    if (!(/^Select/.test(el.type) || geoOps[el.type].isMovable))
        return null; // Fully determined by arguments, no position needed
    var unwrap = General.unwrap;
    var sum = CSNumber.sum;
    switch (el.kind) {
        case "P":
        case "L":
            return unwrap(el.homog);
        case "C":
            var mat = el.mat.value;
            return {
                xx: unwrap(mat[0].value[0]),
                yy: unwrap(mat[1].value[1]),
                zz: unwrap(mat[2].value[2]),
                xy: unwrap(sum(mat[0].value[1], mat[1].value[0])),
                xz: unwrap(sum(mat[0].value[2], mat[2].value[0])),
                yz: unwrap(sum(mat[1].value[2], mat[2].value[1])),
            };
        default:
            return null;
    }
}

function saveDockingInfo(dock) {
    var res = {};
    res.offset = General.unwrap(dock.offset);
    if (dock.to) res.to = dock.to; // String
    if (dock.corner) res.corner = dock.corner; // String
    return res;
}

function saveGeoElement(el) {
    var res = {};
    attributesToClone.forEach(function(key) {
        if (!el.hasOwnProperty(key)) return;
        var val = General.unwrap(el[key]);
        if (val !== null && val !== undefined)
            res[key] = val;
    });
    var pos = savePos(el);
    if (pos) res.pos = pos;
    if (el.dock) res.dock = saveDockingInfo(el.dock);
    return res;
}

function saveGeoState() {
    var res = [];
    csgeo.gslp.forEach(function(el) {
        if (el.tmp) return;
        res.push(saveGeoElement(el));
    });
    return res;
}

globalInstance.saveState = function() {
    return {
        geometry: saveGeoState(),
    };
};
