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

Json._helper.DeepClone = function(o) {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
        v = o[key];
        out[key] = (typeof v === "object" && v !== null) ? Json._helper.DeepClone(v) : v;
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
    where[field] = what;
};

Json.GenFromUserDataEl = function(el) {
    // key/obj are reversed due to the semantics of the ":" operator in CindyScript
    var key = el.obj;
    var obj = el.key;

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

    if (options.printValidJSON) {
        if (a.ctype === "number" && a.value.imag === 0) {
            return a.value.real;
        }
        if ("boolean" === a.ctype) {
            return a.value;
        }
        if (a.ctype === 'list') {
            var erg = "[";
            for (var i = 0; i < a.value.length; i++) {
                erg = erg + Json._helper.niceprint(evaluate(a.value[i]), modifs, options);
                if (i !== a.value.length - 1) {
                    erg = erg + ', ';
                }

            }
            return erg + "]";
        }

        return "\"" + String(niceprint(a)) + "\"";
    }

    return niceprint(a);
};

Json.Atomniceprint = function(el) {
    return "\{" + el.value.key + ":" + niceprint(el.value.value) + "\}";
};

Json.niceprint = function(el, modifs, options) {
    if (!options) {
        options = {};
        options.printValidJSON = false;
        options.printedWarning = false;
        // track depth
        options.visitedMap = {};
        options.visitedMap.level = 0;
        options.visitedMap.maxLevel = 1000;
        options.visitedMap.maxElVisit = 5000;

        if (modifs) {
            if (modifs.JSON) {
                let jmodif = evaluate(modifs.JSON);
                if (jmodif.ctype === "boolean") options.printValidJSON = jmodif.value;
            }
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
        if (!visitedMap[elValKey]) {
            visitedMap[elValKey] = 1;
        } else {
            if (visitedMap[elValKey] > visitedMap.maxElVisit || visitedMap.level > visitedMap.maxLevel) {
                //console.log([visitedMap[elValKey], visitedMap.level]);
                if (!options.printedWarning) {
                    console.log("Warning: We visited a key-value pair very often or encountered a very deeply nested dictionary. Dictionary is probably cyclic. Output will be probably incomplete.");
                    options.printedWarning = true;
                }
                if (options.printValidJSON) {
                    return "\"" + key + "\"" + ":" + '"..."';
                } else {
                    return key + ":" + '...';
                }
            }
            // update only once a recursive call
            if (visitedMap.newLevel) {
                visitedMap[elValKey] += 1;
                // update only once each function call
                visitedMap.newLevel = false;
            }
        }
        if (options.printValidJSON) {
            return "\"" + key + "\"" + ":" + Json._helper.niceprint(elValKey, modifs, options);
        } else {
            return key + ":" + Json._helper.niceprint(elValKey, modifs, options);
        }
    }).join(", ") + "}";


    // pretty print 
    // to be valid JSON we need to replace single with double quotes
    if (options.printValidJSON) {
        jsonString = jsonString.replace(/'/g, '"');
        jsonString = JSON.stringify(JSON.parse(jsonString), null, 0);
    }

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
