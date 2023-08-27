import { nada } from "expose";
// @ts-expect-error: Not yet typed
import { General } from "libcs/General";
// @ts-expect-error: Not yet typed
import { niceprint } from "libcs/Essentials";
// @ts-expect-error: Not yet typed
import { namespace } from "libcs/Namespace";
// @ts-expect-error: Not yet typed
import { evaluate } from "libcs/Evaluator";
import { CSJsonValue, CSJsonKey, Nada, Json, JsonNicePrintOptions, CSType } from "types";

const Json: Json = {
    _helper: {
        GenJSONAtom(key: string, val: CSType) {
            return {
                ctype: "JSON",
                value: {
                    key: General.string(key),
                    value: val,
                },
            };
        },

        forall(
            li: Record<string, CSType>,
            runVar: string,
            fct: () => CSJsonValue,
            modifs: { iterator?: "key" | "value" | "pair" }
        ) {
            // JSON
            // default iterate over values in JSON
            let iteratorType = "value";
            let res: CSJsonValue | undefined;
            if (modifs.iterator !== undefined) {
                const it = evaluate(modifs.iterator);
                const iterTypes = ["key", "value", "pair"];
                if (it.ctype === "string" && iterTypes.includes(it.value)) {
                    iteratorType = it.value;
                }
            }
            // iterate over key, value or pair
            if (iteratorType === "value") {
                for (const k in li) {
                    namespace.setvar(runVar, li[k]);
                    res = evaluate(fct);
                }
            } else if (iteratorType === "key") {
                for (const k in li) {
                    namespace.setvar(runVar, General.string(k));
                    res = evaluate(fct);
                }
            } else {
                // pair
                for (const k in li) {
                    namespace.setvar(runVar, this.GenJSONAtom(k, li[k]));
                    res = evaluate(fct);
                }
            }

            return res;
        },

        niceprint(a: CSJsonValue, modifs: any, options: JsonNicePrintOptions) {
            if (a.ctype === "JSON") {
                return Json.niceprint(a, modifs, options);
            }

            return niceprint(a);
        },

        handlePrintException(e: Error) {
            if (e instanceof RangeError) {
                console.log("Warning: Dictionary string could not be generated! Probably large cyclic Dictionary!");
            } else if (e instanceof SyntaxError) {
                console.log("Warning: Dictionary string could not be parsed!");
            } else {
                console.log("Warning: Dictionary printing failed!");
            }
        },
    },

    turnIntoCSJson(a: CSType) {
        return {
            ctype: "JSON",
            value: a,
        };
    },

    getField(obj: CSJsonValue, key: string) {
        if (obj.value && obj.value[key]) {
            return obj.value[key];
        }
        return nada;
    },

    setField(where: any, field: string, what: CSJsonValue) {
        if (what.ctype === "undefined" && where[field]) {
            delete where[field];
        } else {
            where[field] = what;
        }
    },

    GenFromUserDataEl(el: { key: CSJsonKey; value: CSJsonValue }): Nada | { key: Nada | CSJsonValue; val: CSType } {
        const key = el.key;
        const obj = el.value;

        if (!key || key.ctype !== "string") {
            console.log("Error: JSON keys have to be strings.");
            return nada;
        }
        if (!obj) {
            console.log("Warning: JSON object not defined.");
            return {
                key: key.value,
                val: nada,
            };
        }
        return {
            key: key.value,
            val: evaluate(obj),
        };
    },

    niceprint(el: CSJsonValue, modifs?: any, options?: JsonNicePrintOptions) {
        const niceprintOptions = options ?? {
            printedWarning: false,
            visitedMap: {
                tracker: new WeakMap(),
                level: 0,
                maxLevel: 1000,
                maxElVisit: 5000,
                newLevel: false,
                printedWarning: false,
            },
        };

        if (modifs) {
            if (modifs.maxDepth) {
                const depth = evaluate(modifs.maxDepth);
                if (depth.ctype === "number") niceprintOptions.visitedMap.maxLevel = depth.value.real;
            }
        }

        const visitedMap = niceprintOptions.visitedMap;
        // track a new recursive call
        visitedMap.newLevel = true;
        visitedMap.level += 1;

        const keys = Object.keys(el.value).sort();
        const jsonString =
            "{" +
            keys
                .map(function (key) {
                    // update visitedMap
                    const elValKey = el.value[key];
                    if (!visitedMap.tracker.has(elValKey)) {
                        visitedMap.tracker.set(elValKey, 1);
                    } else {
                        if (visitedMap[elValKey] > visitedMap.maxElVisit || visitedMap.level > visitedMap.maxLevel) {
                            if (niceprintOptions && !niceprintOptions.printedWarning) {
                                console.log(
                                    "Warning: We visited a key-value pair very often or encountered a very deeply nested dictionary. Dictionary is probably cyclic. Output will be probably incomplete."
                                );
                                niceprintOptions.printedWarning = true;
                            }

                            return key + ":" + "...";
                        }
                        // update only once a recursive call
                        if (visitedMap.newLevel) {
                            visitedMap.tracker.set(elValKey, visitedMap.tracker.get(elValKey) + 1);
                            // update only once each function call
                            visitedMap.newLevel = false;
                        }
                    }
                    return key + ":" + Json._helper.niceprint(elValKey, modifs, niceprintOptions);
                })
                .join(", ") +
            "}";

        return jsonString;
    },
};
