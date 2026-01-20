import { CSNumber } from "libcs/CSNumber";
import { niceprint } from "libcs/Essentials";
import { List } from "libcs/List";
import { General } from "libcs/General";
import { nada } from "expose";

const GEO_KINDS = ["P", "L", "S", "C", "G", "T"]; // known geo kinds

// Registry: maps inspect keys to a getter/setter and a declared value type.
// The optional ownerKinds limits a key to specific geo element kinds.
const registry = {
    alpha: {
        get: (el) => el.alpha,
        set: (el, v) => {
            el.alpha = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },

    anglemodulo: {
        get: (el) => el.anglemodulo,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    "axes.show": {
        get: (el) => el.axes && el.axes.show,
        set: null, // @TODO implement setter
        type: "bool",
        ownerTypes: ["port"],
    },
    backgroundimage: {
        get: (el) => el.backgroundimage,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    color: {
        get: (el) => el.color,
        set: (el, v) => {
            el.color = v;
        },
        type: "color",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    colorfill: {
        get: (el) => el.fillcolor,
        set: (el, v) => {
            el.fillcolor = v;
        },
        type: "color",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    darkenDependent: {
        get: (el) => el.darkenDependent,
        set: null,
        type: "bool",
        ownerTypes: ["port"],
    },
    dashType: {
        get: (el) => el.dashtype,
        set: (el, v) => {
            el.dashtype = v;
        },
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    drawtrace: {
        get: (el) => el.drawtrace,
        set: (el, v) => {
            el.drawtrace = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "euclideanport.origin.x": {
        get: (el) => el.euclideanport.origin.x,
        set: null,
        type: "number",
        ownerTypes: ["port"],
    },
    "euclideanport.origin.y": {
        get: (el) => el.euclideanport.origin.y,
        set: null,
        type: "number",
        ownerTypes: ["port"],
    },
    "euclideanport.scale": {
        get: (el) => el.euclideanport.scale,
        set: null,
        type: "number",
        ownerTypes: ["port"],
    },
    fillalpha: {
        get: (el) => el.fillalpha,
        set: (el, v) => {
            el.fillalpha = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    imagealpha: {
        get: (el) => el.imagealpha,
        set: null,
        type: "number",
        ownerTypes: ["port"],
    },
    imagescalemode: {
        get: (el) => el.imagescalemode,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    imagescalemodeint: {
        get: (el) => el.imagescalemodeint,
        set: null,
        type: "string", // String in Cinderella, is this correct? Could be number.
        ownerTypes: ["port"],
    },
    isvisible: {
        get: (el) => el.visible,
        set: (el, v) => {
            el.visible = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    linesize: {
        get: (el) => el.size,
        set: (el, v) => {
            el.size = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["L", "S", "C", "G"],
    },
    "mesh.density": {
        get: (el) => el.mesh.density,
        set: null,
        type: "number",
        ownerTypes: ["port"],
    },
    "mesh.rectangular": {
        get: (el) => el.mesh.rectangular,
        set: null,
        type: "bool",
        ownerTypes: ["port"],
    },
    "mesh.triangular": {
        get: (el) => el.mesh.triangular,
        set: null,
        type: "bool",
        ownerTypes: ["port"],
    },
    name: {
        get: (el) => el.name,
        set: (el, v) => {
            el.name = v;
        },
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    portheight: {
        get: (el) => el.portheight,
        set: null,
        type: "string", // String in Cinderella, is this correct? Could be number.
        ownerTypes: ["port"],
    },
    portwidth: {
        get: (el) => el.portwidth,
        set: null,
        type: "string", // String in Cinderella, is this correct? Could be number.
        ownerTypes: ["port"],
    },
    "precision.angle": {
        get: (el) => el.precision.angle,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    "precision.angle.int": {
        get: (el) => el.precision.angleInt,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    printname: {
        get: (el) => el.printname,
        set: (el, v) => {
            el.printname = v;
        },
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    printscale: {
        get: (el) => el.printscale,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    "printscale.int": {
        get: (el) => el.printscaleInt,
        set: null,
        type: "string",
        ownerTypes: ["port"],
    },
    ptsize: {
        get: (el) => el.size,
        set: (el, v) => {
            el.size = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["P"],
    },
    snap: {
        get: (el) => el.snap,
        set: null,
        type: "bool",
        ownerTypes: ["port"],
    },
    tracedim: {
        get: (el) => el.tracedim,
        set: (el, v) => {
            el.tracedim = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    tracelength: {
        get: (el) => el.tracelength,
        set: (el, v) => {
            el.tracelength = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    traceskip: {
        get: (el) => el.traceskip,
        set: (el, v) => {
            el.traceskip = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
};

// Placeholder for recursive traversal (Cinderella has algorithm/behavior/arrow children).
function getChildren(obj) {
    // @TODO minimal: none for now; later: algorithm/behavior/arrow analogs
    return [];
}

// Convert plain JS values to CindyScript values.
function toCindyValue(type, value) {
    if (value === undefined || value === null) return nada;

    // 1) If it already is a CindyScript value, return as is
    if (value.ctype) return value;

    // 2) Otherwise convert JS primitives
    switch (type) {
        case "string":
            return { ctype: "string", value: String(value) };
        case "number":
            return CSNumber.real(+value); // force numeric conversion
        case "bool":
            return General.bool(!!value); // force boolean conversion
        case "color":
            return List.realVector(value); // expects JS array [r,g,b]
        default:
            return nada;
    }
}

// Convert CindyScript values back to plain JS values for setters.
function fromCindyValue(type, cindyVal) {
    if (!cindyVal || cindyVal === nada) return null;

    // 1) Use CindyScript value as is if possible (ctype present)
    if (cindyVal.ctype) return cindyVal;

    // 2) Fallback: convert JS primitives to CindyScript values
    switch (type) {
        case "string":
            return General.string(String(cindyVal));
        case "number":
            return CSNumber.real(Number(cindyVal));
        case "bool":
            return General.bool(!!cindyVal);
        case "color":
            return List.realVector(cindyVal);
        default:
            return null;
    }
}

// Unwrap CindyJS inspectable object to get underlying element.
function unwrapInspectable(obj) {
    if (!obj || typeof obj !== "object") return obj;
    if ("value" in obj) {
        switch (obj.ctype) {
            case "geo":
                return obj.value;
            case "port":
                return obj.value;
        }
    }
    return obj;
}

// Unwrap CindyJS geo object to get underlying element.
function unwrapGeo(obj) {
    return obj && obj.ctype === "geo" ? obj.value : obj;
}

// Check whether object is a CindyJS geo object of known kind.
function isGeoKind(el) {
    return el && typeof el === "object" && GEO_KINDS.includes(el.kind);
}

// Determine owner type of object for inspection purposes.
function getOwnerType(obj) {
    if (obj && obj.ctype === "geo") return "geo";
    if (obj && obj.ctype === "port") return "port"; // does this even exist?

    // Fallback: Function failed to determine type; try duck-typing instead
    const el = unwrapInspectable(obj);
    if (el && typeof el === "object" && isGeoKind(el)) return "geo";
    if (obj && obj.__inspectOwner === "port") return "port";
    return "unknown";
}

// Check whether entry matches owner type (strict).
function matchesOwner(entry, ownerType) {
    // Require explicit ownerTypes for every entry
    if (!entry.ownerTypes || !Array.isArray(entry.ownerTypes)) return false;
    return entry.ownerTypes.includes(ownerType);
}

// Lightweight duck-typing check for CindyJS geo objects.
function isInspectable(obj) {
    const el = obj && obj.ctype === "geo" ? obj.value : obj;
    return isGeoKind(el);
}

// inspect(obj): return list of available keys for this object, including children.
function inspectEval1(obj) {
    const el = unwrapInspectable(obj); // unwrap inspectable object if needed
    const ownerType = getOwnerType(obj);

    // Fast fail for unknown owner types
    if (ownerType === "unknown") return nada;

    // Collect keys
    const keys = []; // Storage for valid keys
    for (const key in registry) {
        const entry = registry[key];

        // Check owner type restrictions
        if (!matchesOwner(entry, ownerType)) continue;

        // For geo objects, check kind restrictions
        if (entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) continue;

        // Key is valid
        keys.push({ ctype: "string", value: key });
    }

    // Handle children recursively
    for (const child of getChildren(el)) {
        const ckeys = inspectEval1(child);
        if (ckeys !== nada) keys.push(...ckeys.value);
    }

    // Return as CindyScript list
    return { ctype: "list", value: keys };
}

// inspect(obj, key): resolve key on object (or its children) and return value.
function inspectEval2(obj, keyCindy) {
    const el = unwrapInspectable(obj); // unwrap inspectable object if needed
    const ownerType = getOwnerType(obj);

    // Fast fail for unknown owner types
    if (ownerType === "unknown") return nada;

    // Get registry entry
    const key = niceprint(keyCindy);
    const entry = registry[key];
    if (entry) {
        // Check owner type restrictions
        if (!matchesOwner(entry, ownerType)) return nada;

        // For geo objects, check kind restrictions
        if (ownerType === "geo" && entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) return nada;

        // Key is valid; get value
        const v = entry.get(el);

        // Convert to CindyScript value and return
        return toCindyValue(entry.type, v);
    }

    // Handle children recursively if not found
    for (const child of getChildren(el)) {
        const v = inspectEval2(child, keyCindy);
        if (v !== nada) return v;
    }

    // Key not found; return nada
    return nada;
}

// inspect(obj, key, val): set key on object (or its children) and return nada.
function inspectEval3(obj, keyCindy, valCindy) {
    const el = unwrapInspectable(obj); // unwrap inspectable object if needed
    const ownerType = getOwnerType(obj);

    // Fast fail for unknown owner types
    if (ownerType === "unknown") return nada;

    const key = niceprint(keyCindy);
    const entry = registry[key];
    if (entry && entry.set) {
        if (!matchesOwner(entry, ownerType)) return nada;
        if (ownerType === "geo" && entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) return nada;
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
