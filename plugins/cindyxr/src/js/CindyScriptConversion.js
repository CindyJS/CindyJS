/**
 * Recursively converts a nested JavaScript array to a CindyScript list of the same structure.
 * This function only handles numbers at the final recursion step.
 * @param {Array|number} l The JavaScript list.
 * @return {CindyJS.anyval} The CindyScript representation of the list.
 */
function nestedArrayToCSList(l) {
    if (Array.isArray(l)) {
        return {
            ctype: "list",
            value: l.map((e) => nestedArrayToCSList(e)),
        };
    } else {
        return {
            ctype: "number",
            value: {
                real: l,
                imag: 0,
            },
        };
    }
}

/**
 * Converts a JavaScript object to a CindyScript JSON dictionary.
 * Strings, numbers, boolean values and arrays are also handled correctly.
 * Functions, as well as null and undefined values, are removed.
 * @param {object|string|number|boolean|function|null|undefined|Array} obj An arbitrary JavaScript object.
 * @param {Set<string>} blacklistNames A blacklist of properties to omit.
 * This is used for removing a reference to the frame data when converting the hand data.
 * @param {Map<object, object>} convertedObjectMap A map of already converted objects.
 * These are excluded when converting child properties/objects, i.e., to remove cyclic dependencies.
 * @return {object} A CindyScript object representing "obj".
 */
function convertObjectToCindyDict(obj, blacklistNames, convertedObjectMap) {
    if (obj instanceof Object) {
        // Cyclic dependency detected -> stop.
        if (convertedObjectMap.has(obj)) {
            return convertedObjectMap.get(obj);
        }
    }

    if (Array.isArray(obj)) {
        let cindyObjectList = [];
        obj.forEach(function (entry) {
            let cindyEntry = convertObjectToCindyDict(entry, blacklistNames, convertedObjectMap);
            if (cindyEntry != null) {
                cindyObjectList.push(cindyEntry);
            }
        });
        return {
            ctype: "list",
            value: cindyObjectList,
        };
    } else if (typeof obj === "string" || obj instanceof String) {
        return {
            ctype: "string",
            value: obj,
        };
    } else if (typeof obj === "number" && isFinite(obj)) {
        return {
            ctype: "number",
            value: {
                real: obj,
                imag: 0,
            },
        };
    } else if (typeof obj === "boolean") {
        return {
            ctype: "boolean",
            value: obj,
        };
    } else if (obj === null || typeof obj === "undefined") {
        // Null is removed in upper levels of recursion (see else section).
        return null;
    } else if (typeof obj === "function") {
        // Functions not supported. Null is removed in upper levels of recursion (see else section).
        return null;
    } else {
        // The CindyScript dictionary object.
        let dictionary = {};
        // Add this object to the set of the already converted objects visible for its properties.
        let convertedObjectMapChild = new Map(convertedObjectMap);
        convertedObjectMapChild.set(obj, dictionary);

        // Probably this is an object with key-value pairs.
        for (let key in obj) {
            if (blacklistNames.has(key)) {
                continue;
            }

            // No prototype?
            if (obj.hasOwnProperty(key)) {
                let value = obj[key];
                let cindyValue = convertObjectToCindyDict(value, blacklistNames, convertedObjectMapChild);
                dictionary[key] = cindyValue;
            }
        }

        return {
            ctype: "JSON",
            value: dictionary,
        };
    }
}
