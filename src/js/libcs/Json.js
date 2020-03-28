// CindyScript JSON
var Json = {};
Json._helper = {};


Json.turnIntoCSJson = function(a) {
    return {
        "ctype": "JSON",
        "value": a
    };
};

Json._helper.ShallowClone = function(o) {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
        v = o[key];
        out[key] = v;
    }
    return out;
};

Json.getField = function(obj, key) {
    if (obj.value && obj.value[key]) {
        return obj.value[key];
    }
    return nada;
};

Json.setField = function(where, field, what) {
    if (what.ctype === 'undefined' && where[field]) {
        delete where[field];
    } else {
        where[field] = what;
    }
};

Json.GenFromUserDataEl = function(el) {
    // key/obj are reversed due to the semantics of the ":" operator in CindyScript
    var key = evaluate(el.obj);
    var obj = evaluate(el.key);

    if (!key || key.ctype !== "string") {
        console.log("Error: JSON keys have to be strings.");
        return nada;
    }
    if (!obj) {
        console.log("Warning: JSON object not defined.");
        return {
            "key": key.value,
            "val": nada,
        };
    } else return {
        "key": key.value,
        "val": evaluate(obj)
    };
};

Json._helper.GenJSONAtom = function(key, val) {
    return {
        "ctype": "JSON",
        "value": {
            'key': General.string(key),
            'value': val
        }
    };
};


Json._helper.forall = function(li, runVar, fct, modifs) { // JSON
    // default iterate over values in JSON
    var iteratorType = "value";
    var res;
    if (modifs.iterator !== undefined) {
        let it = evaluate(modifs.iterator);
        let iterTypes = ["key", "value", "pair"];
        if (it.ctype === 'string' && iterTypes.includes(it.value)) {
            iteratorType = it.value;
        }
    }
    // iterate over key, value or pair
    if (iteratorType === "value") {
        for (let k in li) {
            namespace.setvar(runVar, li[k]);
            res = evaluate(fct);
        }
    } else if (iteratorType === "key") {
        for (let k in li) {
            namespace.setvar(runVar, General.string(k));
            res = evaluate(fct);
        }
    } else { // pair
        for (let k in li) {
            namespace.setvar(runVar, Json._helper.GenJSONAtom(k, li[k]));
            res = evaluate(fct);
        }
    }

    return res;
};

Json._helper.niceprint = function(a, modifs, options) {
    if (a.ctype === "JSON") {
        return Json.niceprint(a, modifs, options);
    }

    return niceprint(a);
};

Json.niceprint = function(el, modifs, options) {
    if (!options) {
        options = {};
        options.printedWarning = false;
        // track depth
        options.visitedMap = {};
        options.visitedMap.tracker = new WeakMap();
        options.visitedMap.level = 0;
        options.visitedMap.maxLevel = 1000;
        options.visitedMap.maxElVisit = 5000;

        if (modifs) {
            if (modifs.maxDepth) {
                let depth = evaluate(modifs.maxDepth);
                if (depth.ctype === "number") options.visitedMap.maxLevel = depth.value.real;
            }
        }
    }

    var visitedMap = options.visitedMap;
    // track a new recursive call
    visitedMap.newLevel = true;
    visitedMap.level += 1;

    var keys = Object.keys(el.value).sort();
    var jsonString = "{" + keys.map(function(key) {
        // update visitedMap
        let elValKey = el.value[key];
        if (!visitedMap.tracker.has(elValKey)) {
            visitedMap.tracker.set(elValKey, 1);
        } else {
            if (visitedMap[elValKey] > visitedMap.maxElVisit || visitedMap.level > visitedMap.maxLevel) {
                //console.log([visitedMap[elValKey], visitedMap.level]);
                if (!options.printedWarning) {
                    console.log("Warning: We visited a key-value pair very often or encountered a very deeply nested dictionary. Dictionary is probably cyclic. Output will be probably incomplete.");
                    options.printedWarning = true;
                }

                return key + ":" + '...';
            }
            // update only once a recursive call
            if (visitedMap.newLevel) {
                visitedMap.tracker.set(elValKey, visitedMap.tracker.get(elValKey) + 1);
                // update only once each function call
                visitedMap.newLevel = false;
            }
        }
        return key + ":" + Json._helper.niceprint(elValKey, modifs, options);
    }).join(", ") + "}";


    return jsonString;
};

Json._helper.handlePrintException = function(e) {
    if (e instanceof RangeError) {
        console.log("Warning: Dictionary string could not be generated! Probably large cyclic Dictionary!");
    } else if (e instanceof SyntaxError) {
        console.log("Warning: Dictionary string could not be parsed!");
    } else {
        console.log("Warning: Dictionary printing failed!");
    }

};
