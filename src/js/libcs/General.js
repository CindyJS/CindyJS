import { nada } from "expose";
import { CSNumber } from "libcs/CSNumber";
import { List } from "libcs/List";
import { Dict } from "libcs/Dict";
import { niceprint } from "libcs/Essentials";

//==========================================
//      Things that apply to several types
//==========================================
const General = {};
General._helper = {};

General.order = {
    undefined: 0,
    boolean: 1,
    number: 2,
    term: 3,
    atomic: 4,
    variable: 5,
    geo: 6,
    string: 7,
    list: 8,
};

General.string = function (s) {
    return {
        ctype: "string",
        value: s,
    };
};

General.bool = function (b) {
    return {
        ctype: "boolean",
        value: b,
    };
};

General.not = function (v) {
    return General.bool(!v.value);
};

General.isLessThan = function (a, b) {
    return General.compare(a, b) === -1;
};

General.isEqual = function (a, b) {
    return General.compare(a, b) === 0;
};

General.compareResults = function (a, b) {
    return General.compare(a.result, b.result);
};

General.compare = function (a, b) {
    if (a.ctype !== b.ctype) {
        return General.order[a.ctype] - General.order[b.ctype];
    }
    if (a.ctype === "number") {
        return CSNumber._helper.compare(a, b);
    }
    if (a.ctype === "list") {
        return List._helper.compare(a, b);
    }
    if (a.ctype === "geo") {
        if (a.value.name === b.value.name) {
            return 0;
        }
        if (a.value.name < b.value.name) {
            return -1;
        }
        return 1;
    }
    if (a.ctype === "string") {
        if (a.value === b.value) {
            return 0;
        }
        if (a.value < b.value) {
            return -1;
        }
        return 1;
    }
    if (a.ctype === "boolean") {
        if (a.value === b.value) {
            return 0;
        }
        if (a.value === false) {
            return -1;
        }
        return 1;
    }
};

General.add = function (v0, v1) {
    if (v0.ctype === "void" && v1.ctype === "number") {
        // unary plus
        return v1;
    }
    if (v0.ctype === "void" && v1.ctype === "list") {
        // unary plus
        return v1;
    }
    if (v0.ctype === "number" && v1.ctype === "number") {
        return CSNumber.add(v0, v1);
    }
    if (v0.ctype === "string" || v1.ctype === "string") {
        return {
            ctype: "string",
            value: niceprint(v0) + niceprint(v1),
        };
    }

    if (v0.ctype === "list" && v1.ctype === "list") {
        return List.add(v0, v1);
    }
    return nada;
};

General.sub = function (v0, v1) {
    if (v0.ctype === "void" && v1.ctype === "number") {
        // unary minus
        return CSNumber.neg(v1);
    }
    if (v0.ctype === "void" && v1.ctype === "list") {
        // unary minus
        return List.neg(v1);
    }
    if (v0.ctype === "number" && v1.ctype === "number") {
        return CSNumber.sub(v0, v1);
    }
    if (v0.ctype === "list" && v1.ctype === "list") {
        return List.sub(v0, v1);
    }
    return nada;
};

General.mult = function (v0, v1) {
    if (v0.ctype === "number" && v1.ctype === "number") {
        return CSNumber.mult(v0, v1);
    }
    if (v0.ctype === "number" && v1.ctype === "list") {
        return List.scalmult(v0, v1);
    }
    if (v0.ctype === "list" && v1.ctype === "number") {
        return List.scalmult(v1, v0);
    }
    if (v0.ctype === "list" && v1.ctype === "list") {
        return List.mult(v0, v1);
    }
    return nada;
};

General.div = function (v0, v1) {
    if (v0.ctype === "number" && v1.ctype === "number") {
        return CSNumber.div(v0, v1);
    }
    if (v0.ctype === "list" && v1.ctype === "number") {
        return List.scaldiv(v1, v0);
    }
    return nada;
};

General.max = function (v0, v1) {
    if (v0.ctype === "number" && v1.ctype === "number") {
        return CSNumber.max(v0, v1);
    }
    if (v0.ctype === "list" && v1.ctype === "list") {
        return List.max(v0, v1);
    }
    return nada;
};

General.min = function (v0, v1) {
    if (v0.ctype === "number" && v1.ctype === "number") {
        return CSNumber.min(v0, v1);
    }
    if (v0.ctype === "list" && v1.ctype === "list") {
        return List.min(v0, v1);
    }
    return nada;
};

General.wrap = function (v) {
    if (typeof v === "number") {
        return CSNumber.real(v);
    }
    if (typeof v === "object" && v.length !== undefined) {
        //evtl in List ziehen
        const li = [];
        for (let i = 0; i < v.length; i++) {
            li[i] = General.wrap(v[i]);
        }
        return List.turnIntoCSList(li);
    }
    if (typeof v === "string") {
        return {
            ctype: "string",
            value: v,
        };
    }
    if (typeof v === "boolean") {
        return {
            ctype: "boolean",
            value: v,
        };
    }
    return nada;
};

General.unwrap = function (v) {
    if (typeof v !== "object" || v === null) {
        return v;
    }
    if (Array.isArray(v)) {
        return v.map(General.unwrap);
    }
    switch (v.ctype) {
        case "string":
        case "boolean":
            return v.value;
        case "number":
            if (v.value.imag === 0) return v.value.real;
            return {
                r: v.value.real,
                i: v.value.imag,
            };
        case "list":
            return v.value.map(General.unwrap);
        default:
            return null;
    }
};

General.withUsage = function (v, usage) {
    // shallow copy with possibly new usage
    return {
        ctype: v.ctype,
        value: v.value,
        usage,
    };
};

General.wrapJSON = function (data) {
    switch (typeof data) {
        case "number":
            return CSNumber.real(data);
        case "string":
            return General.string(data);
        case "boolean":
            return General.bool(data);
        case "object": {
            if (data === null) return nada;
            if (Array.isArray(data)) return List.turnIntoCSList(data.map(General.wrapJSON));
            const d = Dict.create();
            for (const k in data) Dict.put(d, General.string(k), General.wrapJSON(data[k]));
            return d;
        }
        default:
            console.log("Failed to convert " + typeof data + " to CindyJS data type");
            return nada;
    }
};

General.identity = function (x) {
    return x;
};

General.deeplyEqual = function (a, b) {
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return a === b;
    let cnt = 0;
    let k;
    for (k in a) {
        ++cnt;
        if (!(k in b && General.deeplyEqual(a[k], b[k]))) return false;
    }
    for (k in b) --cnt;
    return cnt === 0;
};

export { General };
