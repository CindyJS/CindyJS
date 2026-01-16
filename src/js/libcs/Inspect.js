import { CSNumber } from "libcs/CSNumber";
import { niceprint } from "libcs/Essentials";
import { List } from "libcs/List";
import { General } from "libcs/General";
import { nada } from "expose";
import { csport } from "libgeo/GeoState";
import { csw, csh } from "Setup";

// Registry: maps inspect keys to a getter/setter and a declared value type.
// The optional ownerKinds limits a key to specific geo element kinds.
const registry = {
    name: {
        // ATT: "name" -> el.name
        get: (el) => el.name,
        set: (el, v) => {
            el.name = v;
        },
        type: "string",
    },
    printname: {
        // ATT: "printname" -> el.printname
        get: (el) => el.printname,
        set: (el, v) => {
            el.printname = v;
        },
        type: "string",
    },
    color: {
        // ATT: "color" -> el.color
        get: (el) => el.color,
        set: (el, v) => {
            el.color = v;
        },
        type: "color",
    },
    alpha: {
        // ATT: "alpha" -> el.alpha
        get: (el) => el.alpha,
        set: (el, v) => {
            el.alpha = v;
        },
        type: "number",
    },
    ptsize: {
        // ATT: "ptsize" -> el.size
        get: (el) => el.size,
        set: (el, v) => {
            el.size = v;
        },
        type: "number",
        ownerKinds: ["P"],
    },
    linesize: {
        // ATT: "linesize" -> el.size
        get: (el) => el.size,
        set: (el, v) => {
            el.size = v;
        },
        type: "number",
        ownerKinds: ["L", "S", "C", "G"],
    },
    dashType: {
        // ATT: "dashType" -> el.dashtype
        get: (el) => el.dashtype,
        set: (el, v) => {
            el.dashtype = v;
        },
        type: "string",
    },
    colorfill: {
        // ATT: "colorfill" -> el.fillcolor
        get: (el) => el.fillcolor,
        set: (el, v) => {
            el.fillcolor = v;
        },
        type: "color",
    },
    fillalpha: {
        // ATT: "fillalpha" -> el.fillalpha
        get: (el) => el.fillalpha,
        set: (el, v) => {
            el.fillalpha = v;
        },
        type: "number",
    },
    isvisible: {
        // ATT: "isvisible" -> el.visible
        get: (el) => el.visible,
        set: (el, v) => {
            el.visible = v;
        },
        type: "bool",
    },
    drawtrace: {
        // ATT: "drawtrace" -> el.drawtrace
        get: (el) => el.drawtrace,
        set: (el, v) => {
            el.drawtrace = v;
        },
        type: "bool",
    },
    tracelength: {
        // ATT: "tracelength" -> el.tracelength
        get: (el) => el.tracelength,
        set: (el, v) => {
            el.tracelength = v;
        },
        type: "number",
    },
    traceskip: {
        // ATT: "traceskip" -> el.traceskip
        get: (el) => el.traceskip,
        set: (el, v) => {
            el.traceskip = v;
        },
        type: "number",
    },
    tracedim: {
        // ATT: "tracedim" -> el.tracedim
        get: (el) => el.tracedim,
        set: (el, v) => {
            el.tracedim = v;
        },
        type: "number",
    },

    // Minimal curview/viewport attributes (read-only for now).
    portwidth: {
        // ATT: "portwidth" -> csw (read-only)
        get: () => csw,
        set: null,
        type: "number",
        owner: "port",
    },
    portheight: {
        // ATT: "portheight" -> csh (read-only)
        get: () => csh,
        set: null,
        type: "number",
        owner: "port",
    },
    "euclideanport.scale": {
        // ATT: "euclideanport.scale" -> csport.drawingstate.matrix.a (read-only)
        get: () => csport.drawingstate.matrix.a,
        set: null,
        type: "number",
        owner: "port",
    },
    "euclideanport.origin.x": {
        // ATT: "euclideanport.origin.x" -> csport.drawingstate.matrix.tx (read-only)
        get: () => csport.drawingstate.matrix.tx,
        set: null,
        type: "number",
        owner: "port",
    },
    "euclideanport.origin.y": {
        // ATT: "euclideanport.origin.y" -> csport.drawingstate.matrix.ty (read-only)
        get: () => csport.drawingstate.matrix.ty,
        set: null,
        type: "number",
        owner: "port",
    },
};

// Lightweight duck-typing check for CindyJS geo objects.
function isInspectable(obj) {
    const el = obj && obj.ctype === "geo" ? obj.value : obj;
    return el && typeof el === "object" && (el.kind || el.isGeo);
}

// Placeholder for recursive traversal (Cinderella has algorithm/behavior/arrow children).
function getChildren(obj) {
    // minimal: none for now; later: algorithm/behavior/arrow analogs
    return [];
}

// Convert plain JS values to CindyScript values.
function toCindyValue(type, value) {
    if (value === undefined || value === null) return nada;
    switch (type) {
        case "string":
            return { ctype: "string", value: String(value) };
        case "number":
            return CSNumber.real(+value);
        case "bool":
            return General.bool(value) ? { ctype: "boolean", value: true } : { ctype: "boolean", value: false };
        case "color":
            return List.realVector(value);
        default:
            return nada;
    }
}

function unwrapGeo(obj) {
    return obj && obj.ctype === "geo" ? obj.value : obj;
}

// Convert CindyScript values back to plain JS values for setters.
function fromCindyValue(type, cindyVal) {
    if (!cindyVal || cindyVal === nada) return null;
    switch (type) {
        case "string":
            return cindyVal.ctype === "string" ? cindyVal.value : niceprint(cindyVal);
        case "number":
            if (cindyVal.ctype === "number") return cindyVal.value.real;
            if (cindyVal.ctype === "string") {
                const n = Number(cindyVal.value);
                return Number.isNaN(n) ? null : n;
            }
            return null;
        case "bool":
            if (cindyVal.ctype === "boolean") return cindyVal.value;
            if (cindyVal.ctype === "number") return cindyVal.value.real !== 0;
            return !!niceprint(cindyVal);
        case "color":
            if (cindyVal.ctype === "list") {
                return cindyVal.value.map((v) => (v.ctype === "number" ? v.value.real : Number(niceprint(v)) || 0));
            }
            return null;
        default:
            return null;
    }
}

// inspect(obj): return list of available keys for this object, including children.
function inspectEval1(obj) {
    const el = unwrapGeo(obj); // unwrap geo object if needed
    if (el === nada || !isInspectable(el)) return nada;
    const keys = [];
    for (const k in registry) {
        const entry = registry[k];
        if (entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) continue;
        keys.push({ ctype: "string", value: k });
    }
    // children recursively
    for (const child of getChildren(el)) {
        const ckeys = inspectEval1(child);
        if (ckeys !== nada) keys.push(...ckeys.value);
    }
    return { ctype: "list", value: keys };
}

// inspect(obj, key): resolve key on object (or its children) and return value.
function inspectEval2(obj, keyCindy) {
    const el = unwrapGeo(obj); // unwrap geo object if needed
    if (el === nada || !isInspectable(el)) return nada;
    const key = niceprint(keyCindy);
    const entry = registry[key];
    if (entry) {
        if (entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) return nada;
        const v = entry.get(el);
        return toCindyValue(entry.type, v);
    }
    for (const child of getChildren(el)) {
        const v = inspectEval2(child, keyCindy);
        if (v !== nada) return v;
    }
    return nada;
}

// inspect(obj, key, val): set key on object (or its children) and return nada.
function inspectEval3(obj, keyCindy, valCindy) {
    const el = unwrapGeo(obj); // unwrap geo object if needed
    if (el === nada || !isInspectable(el)) return nada;
    const key = niceprint(keyCindy);
    const entry = registry[key];
    if (entry && entry.set) {
        const v = fromCindyValue(entry.type, valCindy);
        entry.set(el, v);
        return nada;
    }
    for (const child of getChildren(el)) {
        inspectEval3(child, keyCindy, valCindy);
    }
    return nada;
}

export { inspectEval1, inspectEval2, inspectEval3 };
