import { nada } from "expose";
import { csconsole } from "Setup";
import { CSNumber } from "libcs/CSNumber";
import { List } from "libcs/List";
import { Json } from "libcs/Json";
import { General } from "libcs/General";
import { eval_helper, niceprint, infixmap } from "libcs/Essentials";
import { namespace } from "libcs/Namespace";
import { Accessor } from "libcs/Accessors";
import { Parser } from "libcs/Parser";

//*******************************************
// this function evaluates an expression tree
//*******************************************

function evaluate(a) {
    if (a === undefined) {
        return nada;
    } else if (a.ctype === "infix") {
        return a.impl(a.args, {}, a);
    } else if (a.ctype === "variable") {
        return evaluate(namespace.getvar(a.name));
    } else if (a.ctype === "function") {
        callStack.push(a);
        a = eval_helper.evaluate(a.oper, a.args, a.modifs);
        callStack.pop();
        return a;
    } else if (a.ctype === "void") {
        return nada;
    } else if (a.ctype === "field") {
        const obj = evaluate(a.obj);
        if (obj.ctype === "geo") {
            let oldobject = Json._helper.self;
            Json._helper.self = obj;
            let result = evaluate(Accessor.getField(obj.value, a.key));
            Json._helper.self = oldobject;
            return result;
        } else if (obj.ctype === "list") {
            let oldobject = Json._helper.self;
            Json._helper.self = obj;
            let result = List.getField(obj, a.key);
            Json._helper.self = oldobject;
            return result;
        } else if (obj.ctype === "JSON") {
            let oldobject = Json._helper.self;
            Json._helper.self = obj;
            let result = evaluate(Json.getField(obj, a.key));
            Json._helper.self = oldobject;
            return result;
        } else {
            return nada;
        }
    } else if (a.ctype === "userdata") {
        const obj = evaluate(a.obj);
        let key = General.string(niceprint(evaluate(a.key)));
        if (key.value === "_?_") key = nada;
        if (obj.ctype === "geo") {
            let oldobject = Json._helper.self;
            Json._helper.self = obj;
            let result = evaluate(Accessor.getuserData(obj.value, key));
            Json._helper.self = oldobject;
            return result;
        } else if (obj.ctype === "list" || obj.ctype === "string") {
            let oldobject = Json._helper.self;
            Json._helper.self = obj;
            let result = evaluate(Accessor.getuserData(obj, key));
            Json._helper.self = oldobject;
            return result;
        } else if (obj.ctype === "JSON") {
            let oldobject = Json._helper.self;
            Json._helper.self = obj;
            let result = evaluate(Json.getField(obj, key.value));
            Json._helper.self = oldobject;
            return result;
        } else return nada;
    } else {
        return a;
    }
}

function evaluateAndVal(a) {
    const x = evaluate(a);
    if (x.ctype === "geo") {
        const val = x.value;
        if (val.kind === "P") {
            return Accessor.getField(val, "xy");
        }
        if (val.kind === "V") {
            return val.value;
        }
    }
    return x; //TODO Implement this
}

function evaluateAndHomog(a) {
    const x = evaluate(a);
    if (x.ctype === "geo") {
        const val = x.value;
        if (val.kind === "P") {
            return Accessor.getField(val, "homog");
        }
        if (val.kind === "L") {
            return Accessor.getField(val, "homog");
        }
    }
    if (List._helper.isNumberVecN(x, 3)) {
        return x;
    }

    if (List._helper.isNumberVecN(x, 2)) {
        let y = List.turnIntoCSList([x.value[0], x.value[1], CSNumber.real(1)]);
        if (x.usage) y = General.withUsage(y, x.usage);
        return y;
    }

    return nada;
}

//*******************************************************
// this function shows an expression tree on the console
//*******************************************************

function report(a, i) {
    const prep = new Array(i + 1).join(".");
    let els;
    let j;
    if (a.ctype === "infix") {
        console.log(prep + "INFIX: " + a.oper);
        console.log(prep + "ARG 1 ");
        report(a.args[0], i + 1);
        console.log(prep + "ARG 2 ");
        report(a.args[1], i + 1);
    }
    if (a.ctype === "number") {
        console.log(prep + "NUMBER: " + CSNumber.niceprint(a));
    }
    if (a.ctype === "variable") {
        console.log(prep + "VARIABLE: " + a.name);
    }
    if (a.ctype === "undefined") {
        console.log(prep + "UNDEF");
    }
    if (a.ctype === "void") {
        console.log(prep + "VOID");
    }
    if (a.ctype === "string") {
        console.log(prep + "STRING: " + a.value);
    }
    if (a.ctype === "shape") {
        console.log(prep + "SHAPE: " + a.type);
    }
    if (a.ctype === "modifier") {
        console.log(prep + "MODIF: " + a.key);
    }
    if (a.ctype === "list") {
        console.log(prep + "LIST ");
        els = a.value;
        for (j = 0; j < els.length; j++) {
            console.log(prep + "EL" + j);
            report(els[j], i + 1);
        }
    }
    if (a.ctype === "function") {
        console.log(prep + "FUNCTION: " + a.oper);
        els = a.args;
        for (j = 0; j < els.length; j++) {
            console.log(prep + "ARG" + j);
            report(els[j], i + 1);
        }
        els = a.modifs;
        for (const name in els) {
            console.log(prep + "MODIF:" + name);
            report(els[name], i + 1);
        }
    }
    if (a.ctype === "error") {
        console.log(prep + "ERROR: " + a.message);
    }
}

const usedFunctions = {};

function analyse(code) {
    const parser = new Parser();
    parser.usedFunctions = usedFunctions;
    parser.infixmap = infixmap;
    const res = parser.parse(code);
    for (const name in parser.usedVariables) namespace.create(name);
    return res;
}

var callStack = [];

function labelCode(code, label) {
    function run() {
        return evaluate(code);
    }

    return {
        ctype: "infix",
        args: [],
        impl: function () {
            callStack = [
                {
                    oper: label,
                },
            ];
            const res = evaluate(code);
            callStack = [];
            return res;
        },
    };
}

function printStackTrace(msg) {
    csconsole.err(
        msg +
            callStack
                .map(function (frame) {
                    return "  at " + frame.oper;
                })
                .join("\n")
    );
}

export { evaluate, analyse, labelCode, usedFunctions, evaluateAndVal, evaluateAndHomog, printStackTrace };
