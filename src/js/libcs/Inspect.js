import { CSNumber } from "libcs/CSNumber";
import { niceprint } from "libcs/Essentials";
import { List } from "libcs/List";
import { General } from "libcs/General";
import { nada } from "expose";

const GEO_KINDS = ["P", "L", "S", "C", "Poly", "Text"]; // known geo kinds, probably some missing, @TODO add missing

const CINDERELLA_PALETTE = [
    // copied from Cinderella, should be kept in sync
    null, // 0 (unused since Cinderella colors are 1-based)
    List.realVector([1.0, 1.0, 1.0]), // 1: white
    List.realVector([0.0, 0.0, 0.0]), // 2: black
    List.realVector([1.0, 0.0, 0.0]), // 3: red
    List.realVector([0.0, 0.0, 1.0]), // 4: blue
    List.realVector([0.0, 1.0, 0.0]), // 5: green
    List.realVector([1.0, 1.0, 0.0]), // 6: yellow
    List.realVector([1.0, 0.753, 0.796]), // 7: pink (Color.pink = 255,192,203)
    List.realVector([0.0, 1.0, 1.0]), // 8: cyan
    List.realVector([1.0, 0.647, 0.0]), // 9: orange (Color.orange = 255,165,0)
    List.realVector([0.098, 0.62, 0.306]), // 10: dark green (25,158,78)
    List.realVector([0.718, 0.333, 0.0]), // 11: brown (183,85,0)
    List.realVector([0.467, 0.0, 0.718]), // 12: purple (119,0,183)
    List.realVector([1.0, 0.498, 0.0]), // 13: orange (255,127,0)
    List.realVector([0.012, 0.655, 0.737]), // 14: bleu (3,167,188)
    List.realVector([0.757, 0.0, 0.0]), // 15: dark red (193,0,0)
    List.realVector([0.502, 0.502, 0.502]), // 16: (Color.gray = 128,128,128)
    List.realVector([1.0, 0.29, 0.29]), // 17: bright red (255,74,74)
    List.realVector([0.98, 1.0, 0.62]), // 18: bright yellow (250,255,158)
    List.realVector([0.714, 1.0, 0.667]), // 19: bright green (182,255,170)
    List.realVector([0.51, 0.949, 1.0]), // 20: bright blue (130,242,255)
    List.realVector([0.831, 0.639, 1.0]), // 21: bright purple(212,163,255)
    List.realVector([1.0, 0.741, 0.467]), // 22: bright orange(255,189,119)
];
const colorIndexMap = new WeakMap(); // Track palette index for geo elements
const colorFillIndexMap = new WeakMap(); // Track palette index for fillcolor of geo elements

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
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    "arrow.mode": {
        // @TODO fit to Cinderella semantics
        get: (el) => (el.arrow ? CSNumber.real(1) : CSNumber.real(0)),
        set: null,
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["S"],
    },
    "arrow.size": {
        // @TODO fit to Cinderella semantics
        get: (el) => (el.arrowsize !== undefined && el.arrowsize !== null ? el.arrowsize : CSNumber.real(8)),
        set: (el, v) => {
            el.arrowsize = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["S"],
    },
    "arrow.fraction": {
        // @TODO fit to Cinderella semantics
        get: (el) =>
            el.arrowposition !== undefined && el.arrowposition !== null ? el.arrowposition : CSNumber.real(100),
        set: (el, v) => {
            el.arrowposition = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["S"],
    },
    "arrow.type": {
        // @TODO fit to Cinderella semantics
        get: (el) => (el.arrowshape !== undefined && el.arrowshape !== null ? el.arrowshape : CSNumber.real(3)),
        set: (el, v) => {
            el.arrowshape = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["S"],
    },
    "axes.show": {
        get: (el) => el.axes && el.axes.show,
        set: null, // @TODO implement setter
        type: "bool",
        ownerTypes: ["port"],
    },
    backgroundimage: {
        get: (el) => el.backgroundimage,
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    "button.script": {
        get: (el) => {
            if (el.type !== "Button" && el.type !== "ToggleButton") return nada;
            return el.script ? String(el.script) : "";
        },
        set: (el, v) => {
            el.script = v;
        },
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: ["Text"],
    },
    clipline: {
        get: (el) => cliplineFromClip(el), // map, since Cinderella uses numbers 0,1,2
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["L"],
    },
    color: {
        get: (el) => {
            const index = colorIndexMap.get(el); // WeakMap to track assigned palette index
            if (index != null) return CSNumber.real(index);
            const list = el.color;
            const found = paletteIndexFromList(list);
            if (found != null) return CSNumber.real(found);
            return list; // AWT/List fallback
        },
        set: (el, v) => {
            if (v && v.ctype === "number") {
                const idx = Math.round(v.value.real); // palette index, round to integer, just in case
                const col = CINDERELLA_PALETTE[idx];
                if (col) {
                    el.color = col;
                    colorIndexMap.set(el, idx);
                    return;
                }
            }
            el.color = v; // if list or string etc.
        },
        type: "color", // can be number (palette index) or list (RGB)
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "color.blue": {
        get: (el) => {
            const v = getColorVector(el);
            return v ? v.value[2] : nada;
        },
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "color.green": {
        get: (el) => {
            const v = getColorVector(el);
            return v ? v.value[1] : nada;
        },
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "color.red": {
        get: (el) => {
            const v = getColorVector(el);
            return v ? v.value[0] : nada;
        },
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    colorfill: {
        get: (el) => {
            const idx = colorFillIndexMap.get(el);
            if (idx != null) return CSNumber.real(idx);
            const list = el.fillcolor;
            const found = paletteIndexFromList(list);
            if (found != null) return CSNumber.real(found);
            return list;
        },
        set: (el, v) => {
            if (v && v.ctype === "number") {
                const idx = Math.round(v.value.real);
                const col = CINDERELLA_PALETTE[idx];
                if (col) {
                    el.fillcolor = col;
                    colorFillIndexMap.set(el, idx);
                    return;
                }
            }
            el.fillcolor = v;
        },
        type: "color",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
    darkenDependent: {
        get: (el) => el.darkenDependent,
        set: null, // @TODO implement setter
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
        ownerKinds: ["L", "S", "C"],
    },
    definition: {
        // @TODO not the same as Cinderella's definition, close enough for now
        get: (el) => el.type || "",
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    drawtrace: {
        get: (el) => !!el.drawtrace, // ensure boolean
        set: (el, v) => {
            el.drawtrace = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "euclideanport.origin.x": {
        get: (el) => el.euclideanport.origin.x,
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["port"],
    },
    "euclideanport.origin.y": {
        get: (el) => el.euclideanport.origin.y,
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["port"],
    },
    "euclideanport.scale": {
        get: (el) => el.euclideanport.scale,
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["port"],
    },
    exerciseelement: {
        // placeholder, does not exist in CindyJS
        get: () => false,
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    fillalpha: {
        get: (el) => el.fillalpha,
        set: (el, v) => {
            el.fillalpha = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
    "fillcolor.red": {
        get: (el) => {
            const v = getFillColorVector(el);
            return v ? v.value[0] : nada;
        },
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
    "fillcolor.green": {
        get: (el) => {
            const v = getFillColorVector(el);
            return v ? v.value[1] : nada;
        },
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
    "fillcolor.blue": {
        get: (el) => {
            const v = getFillColorVector(el);
            return v ? v.value[2] : nada;
        },
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
    "freept.pos": {
        get: (child) => {
            const p = child.pos; // [x,y,z]
            if (!p || p.length < 2) return p;
            if (p.length >= 3 && p[2] !== 0) return [p[0] / p[2], p[1] / p[2]];
            return [p[0], p[1]];
        },
        set: (child, v) => nada, // read-only
        type: "list",
        ownerTypes: ["child"],
        ownerChildren: ["freept"],
    },
    imagealpha: {
        get: (el) => el.imagealpha,
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["port"],
    },
    imagescalemode: {
        get: (el) => el.imagescalemode,
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    imagescalemodeint: {
        get: (el) => el.imagescalemodeint,
        set: null, // @TODO implement setter
        type: "string", // String in Cinderella, is this correct? Could be number.
        ownerTypes: ["port"],
    },
    incidences: {
        get: (el) => (Array.isArray(el.incidences) ? el.incidences.join(", ") : ""),
        set: null, // Read-only
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: ["P", "L", "S"],
    },
    isvisible: {
        // for some reason both 'visible' and 'isshowing' are used in CindyJS
        get: (el) => {
            if (typeof el.visible === "boolean") return el.visible;
            if (typeof el.isshowing === "boolean") return el.isshowing;
            return false;
        },
        set: (el, v) => {
            if (typeof el.visible !== "undefined") el.visible = v;
            if (typeof el.isshowing !== "undefined") el.isshowing = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    labeled: {
        get: (el) => !!el.labeled, // ensure boolean
        set: (el, v) => {
            el.labeled = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["P", "L", "S", "C"],
    },
    "line.image": {
        get: (child) => child.value || "",
        set: null,
        type: "string",
        ownerTypes: ["child"],
        ownerChildren: ["line.image"],
    },
    "line.image.media": {
        get: (child) => child.media,
        set: null,
        type: "string",
        ownerTypes: ["child"],
        ownerChildren: ["line.image"],
    },
    "line.image.scalemode": {
        get: (child) => child.scalemode,
        set: null,
        type: "string",
        ownerTypes: ["child"],
        ownerChildren: ["line.image"],
    },
    lineborder: {
        // placeholder, does not exist in CindyJS, @TODO
        get: () => false,
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["L", "S"],
    },
    linesize: {
        get: (el) => el.size,
        set: (el, v) => {
            el.size = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["L", "S", "C", "Poly"],
    },
    linkvisibility: {
        // placeholder, does not exist in CindyJS, @TODO
        get: () => false,
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
    "mesh.density": {
        get: (el) => el.mesh.density,
        set: null, // @TODO implement setter
        type: "number",
        ownerTypes: ["port"],
    },
    "mesh.rectangular": {
        get: (el) => el.mesh.rectangular,
        set: null, // @TODO implement setter
        type: "bool",
        ownerTypes: ["port"],
    },
    "mesh.triangular": {
        get: (el) => el.mesh.triangular,
        set: null, // @TODO implement setter
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
    overlap: {
        get: (el) => (el.overhang !== undefined && el.overhang !== null ? el.overhang : CSNumber.real(0)),
        set: (el, v) => {
            el.overhang = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["L", "S"],
    },
    pinning: {
        get: (el) => !!el.pinned, // el.pinned == null when thing is not pinned, is that correct?
        set: (el, v) => {
            el.pinned = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["P", "Text"],
        ownerFilter: (el) => !!el.movable, // apply only for movable points/texts
    },
    plane: {
        // placeholder, does not exist in CindyJS, @TODO
        get: () => 0,
        set: null,
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "point.image": {
        // virtual child field for inspect compatibility
        get: (child) => child.value,
        set: null,
        type: "string",
        ownerTypes: ["child"],
        ownerChildren: ["point.image"],
    },
    "point.image.media": {
        // virtual child field for inspect compatibility
        get: (child) => child.media,
        set: null,
        type: "string",
        ownerTypes: ["child"],
        ownerChildren: ["point.image"],
    },
    "point.image.rotation": {
        // virtual child field for inspect compatibility
        get: (child) => child.rotation,
        set: null,
        type: "number",
        ownerTypes: ["child"],
        ownerChildren: ["point.image"],
    },
    pointborder: {
        // Why not just 'border'?
        get: (el) => {
            if (typeof el.noborder === "boolean") return !el.noborder;
            if (typeof el.border === "boolean") return el.border;
            return true;
        },
        set: (el, v) => {
            el.noborder = !v;
            el.border = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["P"],
    },
    portheight: {
        get: (el) => el.portheight,
        set: null, // @TODO implement setter
        type: "string", // String in Cinderella, is this correct? Could be number.
        ownerTypes: ["port"],
    },
    portwidth: {
        get: (el) => el.portwidth,
        set: null, // @TODO implement setter
        type: "string", // String in Cinderella, is this correct? Could be number.
        ownerTypes: ["port"],
    },
    "port.background.media": {
        get: (el) => el.portBackgroundMedia,
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    "precision.angle": {
        get: (el) => el.precision.angle,
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    "precision.angle.int": {
        get: (el) => el.precision.angleInt,
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    "precision.measure": {
        get: (el) => el.precision.measure,
        set: null, // @TODO implement setterpalette
        type: "string",
        ownerTypes: ["port"],
    },
    "precision.measure.int": {
        get: (el) => el.precision.measureInt,
        set: null, // @TODO implement setter
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
        ownerKinds: ["P", "L", "S", "C"],
    },
    printscale: {
        get: (el) => el.printscale,
        set: null, // @TODO implement setter
        type: "string",
        ownerTypes: ["port"],
    },
    "printscale.int": {
        get: (el) => el.printscaleInt,
        set: null, // @TODO implement setter
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
    render: {
        // placeholder, does not exist in CindyJS, @TODO
        get: () => false,
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    snap: {
        get: (el) => el.snap,
        set: null, // @TODO implement setter
        type: "bool",
        ownerTypes: ["port"],
    },
    "text.fontfamily": {
        // field missing in CindyJS geo elements, default to "SansSerif"
        get: (el) =>
            el.text_fontfamily !== undefined && el.text_fontfamily !== null ? el.text_fontfamily : "SansSerif",
        set: (el, v) => {
            el.text_fontfamily = v;
        },
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    "text.minwidth": {
        get: (el) => (el.minwidth !== undefined && el.minwidth !== null ? el.minwidth : CSNumber.real(0)),
        set: (el, v) => {
            el.minwidth = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["Text"],
    },
    "text.text": {
        get: (el) => (el.text !== undefined && el.text !== null ? String(el.text) : ""),
        set: (el, v) => {
            el.text = v;
        },
        type: "string",
        ownerTypes: ["geo"],
        ownerKinds: ["Text"],
    },
    textbold: {
        // field missing in CindyJS geo elements, default to false
        get: (el) => !!el.textbold,
        set: (el, v) => {
            el.textbold = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["P", "L", "S", "Text"],
    },
    textborder: {
        // field missing in CindyJS geo elements, default to false
        get: () => false,
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["Text"],
    },
    textbutton: {
        get: (el) => el.type === "Button",
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["Text"],
    },
    textitalics: {
        // field missing in CindyJS geo elements, default to false
        get: (el) => !!el.textitalics,
        set: (el, v) => {
            el.textitalics = v;
        },
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["P", "L", "S", "Text"],
    },
    textsize: {
        // field missing in CindyJS geo elements, default to 12
        get: (el) => (el.textsize !== undefined && el.textsize !== null ? el.textsize : CSNumber.real(12)),
        set: (el, v) => {
            el.textsize = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["P", "L", "S", "Text"],
    },
    texttoggle: {
        get: (el) => el.type === "ToggleButton",
        set: null,
        type: "bool",
        ownerTypes: ["geo"],
        ownerKinds: ["Text"],
    },
    tracedim: {
        // field missing in CindyJS geo elements, default to 1
        get: (el) => (el.tracedim !== undefined && el.tracedim !== null ? el.tracedim : CSNumber.real(1)),
        set: (el, v) => {
            el.tracedim = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    tracelength: {
        // field missing in CindyJS geo elements, default to 100
        get: (el) => (el.tracelength !== undefined && el.tracelength !== null ? el.tracelength : CSNumber.real(100)),
        set: (el, v) => {
            el.tracelength = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    traceskip: {
        get: (el) => (el.traceskip !== undefined && el.traceskip !== null ? el.traceskip : CSNumber.real(1)),
        set: (el, v) => {
            el.traceskip = v;
        },
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    visibility: {
        // deprecated in Cinderella, use 'alpha' instead
        get: () => 999,
        set: null,
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: GEO_KINDS,
    },
    visibilityfill: {
        // deprecated in Cinderella, use 'fillalpha' instead
        get: () => 999,
        set: null,
        type: "number",
        ownerTypes: ["geo"],
        ownerKinds: ["C", "Poly", "Text"],
    },
};

// Determine palette index from color list (Cinderella colors).
function paletteIndexFromList(list) {
    if (!list || list.ctype !== "list") return null;
    const vals = list.value;
    if (!vals || vals.length !== 3) return null;
    const r = vals[0].value.real;
    const g = vals[1].value.real;
    const b = vals[2].value.real;
    for (let i = 1; i < CINDERELLA_PALETTE.length; i++) {
        const p = CINDERELLA_PALETTE[i].value;
        if (
            Math.abs(p[0].value.real - r) < 1e-6 &&
            Math.abs(p[1].value.real - g) < 1e-6 &&
            Math.abs(p[2].value.real - b) < 1e-6
        )
            return i;
    }
    return null;
}

// Get color vector (list) from geo element, if possible.
function getColorVector(el) {
    const c = el.color;
    if (!c) return null;
    if (c.ctype === "list") return c;
    if (c.ctype === "number") {
        const idx = Math.round(c.value.real);
        return CINDERELLA_PALETTE[idx] || null;
    }
    return null;
}

function getFillColorVector(el) {
    const c = el.fillcolor;
    if (!c) return null;
    if (c.ctype === "list") return c;
    if (c.ctype === "number") {
        const idx = Math.round(c.value.real);
        return CINDERELLA_PALETTE[idx] || null;
    }
    return null;
}

function cliplineFromClip(el) {
    const clip = el && el.clip;
    const clipVal = clip && clip.value ? clip.value : clip;
    if (clipVal === "end") return CSNumber.real(1);
    if (clipVal === "inci") return CSNumber.real(2);
    return CSNumber.real(0);
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
        case "list":
            return List.realVector(value); // expects JS array
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
    if (cindyVal.ctype && type !== "list") return cindyVal;

    // 2) Fallback: convert JS primitives to CindyScript values
    switch (type) {
        case "string":
            return General.string(String(cindyVal));
        case "number":
            return CSNumber.real(Number(cindyVal));
        case "bool":
            return General.bool(!!cindyVal); // force boolean conversion
        case "list":
            if (cindyVal.ctype === "list") {
                return cindyVal.value.map((v) => (v.ctype === "number" ? v.value.real : v));
            }
            return null;

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
    if (obj && obj.__inspectChild) return "child"; // special case for child wrappers
    if (obj && obj.ctype === "geo") return "geo";
    if (obj && obj.ctype === "port") return "port";

    // Fallback: Function failed to determine type; try duck-typing instead
    const el = unwrapInspectable(obj);
    if (el && typeof el === "object" && isGeoKind(el)) return "geo";
    return "unknown";
}

// Check whether entry matches owner type (strict).
function matchesOwner(entry, ownerType, obj) {
    // Require explicit ownerTypes for every entry
    if (!entry.ownerTypes || !entry.ownerTypes.includes(ownerType)) return false;

    // Handle special case for 'child' owner type
    if (ownerType === "child") {
        if (!entry.ownerChildren) return false; // entry does not declare child namespaces
        if (!obj || obj.__inspectChild === undefined) return false; // caller didn't pass a child wrapper
        return entry.ownerChildren.includes(obj.__inspectChild); // child namespace must match
    }

    return true;
}

// Get child wrappers for recursive inspection.
function getChildren(el) {
    const children = []; // Storage for child wrappers

    // Point image child
    if (el.kind === "P") {
        children.push({
            __inspectChild: "point.image",
            get media() {
                return el.point_image_media || "";
            },
            set media(v) {
                el.point_image_media = v;
            },

            get rotation() {
                return el.point_image_rotation || 0;
            },
            set rotation(v) {
                el.point_image_rotation = v;
            },

            get value() {
                return el.point_image || "";
            },
            set value(v) {
                el.point_image = v;
            },
        });
    }

    // Free point child
    if (el.kind === "P" && el.type === "Free") {
        children.push({
            __inspectChild: "freept",
            get pos() {
                return el.pos;
            },
            set pos(v) {
                el.pos = v;
            },
        });
    }

    // Line image child (placeholder)
    if (el.kind === "L" || el.kind === "S" /* && ...probably others */) {
        children.push({
            __inspectChild: "line.image",
            get media() {
                return el.line_image_media || "";
            },
            set media(v) {
                el.line_image_media = v;
            },

            get scalemode() {
                return el.line_image_scalemode || "linescale.stretchx";
            },
            set scalemode(v) {
                el.line_image_scalemode = v;
            },

            get value() {
                return el.line_image || "";
            },
            set value(v) {
                el.line_image = v;
            },
        });
    }

    return children;
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
        if (!matchesOwner(entry, ownerType, obj)) continue;

        // For geo objects, check kind restrictions
        if (entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) continue;

        // Optional owner filter (e.g. Free points only)
        if (ownerType === "geo" && entry.ownerFilter && !entry.ownerFilter(el)) continue;

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

    // Direct hit: key found on this object
    if (entry && matchesOwner(entry, ownerType, obj)) {
        // For geo objects, check kind restrictions
        if (ownerType === "geo" && entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) return nada;

        // Optional owner filter (e.g. Free points only)
        if (ownerType === "geo" && entry.ownerFilter && !entry.ownerFilter(el)) return nada;

        // Key is valid; get value and convert to CindyScript value
        const v = entry.get(el);
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

    // Get registry entry
    const key = niceprint(keyCindy);
    const entry = registry[key];

    // Direct hit: key found on this object
    if (entry && entry.set && matchesOwner(entry, ownerType, obj)) {
        // For geo objects, check kind restrictions
        if (ownerType === "geo" && entry.ownerKinds && el.kind && !entry.ownerKinds.includes(el.kind)) return nada;

        // Optional owner filter (e.g. Free points only)
        if (ownerType === "geo" && entry.ownerFilter && !entry.ownerFilter(el)) return nada;

        // Key is valid; convert value and set
        const v = fromCindyValue(entry.type, valCindy);
        entry.set(el, v);
        return nada;
    }

    // Handle children recursively if not found
    for (const child of getChildren(el)) {
        inspectEval3(child, keyCindy, valCindy);
    }
    return nada;
}

export { inspectEval1, inspectEval2, inspectEval3 };
