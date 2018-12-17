//*******************************************************
// and here are the definitions of the operators
//*******************************************************

evaluator.version$0 = function(args, modifs) {
    var ver = ["CindyJS"].concat(version);
    return List.turnIntoCSList(ver.map(General.wrap));
};

evaluator.clearconsole$0 = function(args, modifs) {
    csconsole.clear();
};

evaluator.err$1 = function(args, modifs) { //OK
    var varname = '',
        s;
    if (args[0].ctype === 'variable') {
        varname = args[0].name;
        s = namespace.getvar(args[0].name);
    } else {
        s = args[0];
    }
    s = varname + " ===> " + niceprint(evaluate(s));

    printStackTrace(s);

    return nada;
};

evaluator.errc$1 = function(args, modifs) { //OK
    var s;
    if (args[0].ctype === 'variable') {
        // var s=evaluate(args[0].value[0]);
        s = evaluate(namespace.getvar(args[0].name));
        console.log(args[0].name + " ===> " + niceprint(s));

    } else {
        s = evaluate(args[0]);
        console.log(" ===> " + niceprint(s));

    }
    return nada;
};

evaluator.print$1 = function(args, modifs) {
    csconsole.out(niceprint(evaluate(args[0])), true);
    return nada;
};

evaluator.println$1 = function(args, modifs) {
    csconsole.out(niceprint(evaluate(args[0])));
    return nada;
};

evaluator.assert$2 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'boolean') {
        if (v0.value === false)
            return evaluator.println$1([args[1]], modifs);
    } else {
        printStackTrace("Condition for assert is not boolean");
    }
    return nada;
};

evaluator.dump$1 = function(args, modifs) {

    dump(args[0]);
    return nada;
};


evaluator.repeat$2 = function(args, modifs) { //OK
    return evaluator.repeat$3([args[0], null, args[1]], modifs);
};

evaluator.repeat$3 = function(args, modifs) { //OK
    function handleModifs() {
        var erg;

        if (modifs.start !== undefined) {
            erg = evaluate(modifs.start);
            if (erg.ctype === 'number') {
                startb = true;
                start = erg.value.real;
            }
        }
        if (modifs.step !== undefined) {
            erg = evaluate(modifs.step);
            if (erg.ctype === 'number') {
                stepb = true;
                step = erg.value.real;
            }
        }
        if (modifs.stop !== undefined) {
            erg = evaluate(modifs.stop);
            if (erg.ctype === 'number') {
                stopb = true;
                stop = erg.value.real;
            }
        }


        if (startb && !stopb && !stepb) {
            stop = step * n + start;
        }

        if (!startb && stopb && !stepb) {
            start = -step * (n - 1) + stop;
            stop += step;
        }

        if (!startb && !stopb && stepb) {
            stop = step * n + start;
        }

        if (startb && stopb && !stepb) {
            step = (stop - start) / (n - 1);
            stop += step;
        }

        if (startb && !stopb && stepb) {
            stop = step * n + start;
        }

        if (!startb && stopb && stepb) {
            start = -step * (n - 1) + stop;
            stop += step;
        }

        if (startb && stopb && stepb) {
            stop += step;
        }
    }


    var v1 = evaluateAndVal(args[0]);

    var lauf = '#';
    if (args[1] !== null) {
        if (args[1].ctype === 'variable') {
            lauf = args[1].name;
        }
    }
    if (v1.ctype !== 'number') {
        return nada;
    }
    var n = Math.round(v1.value.real); //TODO: conversion to real!!!
    var step = 1;
    var start = 1;
    var stop = n + 1;
    var startb = false;
    var stopb = false;
    var stepb = false;
    handleModifs();
    if ((start <= stop && step > 0) || (start >= stop && step < 0))
        if (startb && stopb && stepb) {
            n = Math.floor((stop - start) / step);
        }

    namespace.newvar(lauf);
    var erg = nada;
    for (var i = 0; i < n; i++) {
        namespace.setvar(lauf, {
            'ctype': 'number',
            'value': {
                'real': i * step + start,
                'imag': 0
            }
        });
        erg = evaluate(args[2]);
    }
    namespace.removevar(lauf);

    return erg;

};


evaluator.while$2 = function(args, modifs) { //OK

    var prog = args[1];
    var test = args[0];
    var bo = evaluate(test);
    var erg = nada;
    while (bo.ctype !== 'list' && bo.value) {
        erg = evaluate(prog);
        bo = evaluate(test);
    }

    return erg;

};


evaluator.apply$2 = function(args, modifs) { //OK
    return evaluator.apply$3([args[0], null, args[1]], modifs);
};

evaluator.apply$3 = function(args, modifs) { //OK

    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype !== 'list') {
        return nada;
    }

    var lauf = '#';
    if (args[1] !== null) {
        if (args[1].ctype === 'variable') {
            lauf = args[1].name;
        }
    }

    var li = v1.value;
    var erg = [];
    namespace.newvar(lauf);
    for (var i = 0; i < li.length; i++) {
        namespace.setvar(lauf, li[i]);
        erg[i] = evaluate(args[2]);
    }
    namespace.removevar(lauf);

    return {
        'ctype': 'list',
        'value': erg
    };

};

evaluator.forall$2 = function(args, modifs) { //OK
    return evaluator.forall$3([args[0], null, args[1]], modifs);
};

evaluator.forall$3 = function(args, modifs) { //OK

    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype !== 'list') {
        return nada;
    }

    var lauf = '#';
    if (args[1] !== null) {
        if (args[1].ctype === 'variable') {
            lauf = args[1].name;
        }
    }

    var li = v1.value;
    var erg = [];
    namespace.newvar(lauf);
    var res;
    for (var i = 0; i < li.length; i++) {
        namespace.setvar(lauf, li[i]);
        res = evaluate(args[2]);
        erg[i] = res;
    }
    namespace.removevar(lauf);

    return res;

};

evaluator.select$2 = function(args, modifs) { //OK
    return evaluator.select$3([args[0], null, args[1]], modifs);
};

evaluator.select$3 = function(args, modifs) { //OK

    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype !== 'list') {
        return nada;
    }

    var lauf = '#';
    if (args[1] !== null) {
        if (args[1].ctype === 'variable') {
            lauf = args[1].name;
        }
    }

    var li = v1.value;
    var erg = [];
    namespace.newvar(lauf);
    var ct = 0;
    for (var i = 0; i < li.length; i++) {
        namespace.setvar(lauf, li[i]);
        var res = evaluate(args[2]);
        if (res.ctype === 'boolean') {
            if (res.value === true) {
                erg[ct] = li[i];
                ct++;
            }
        }
    }
    namespace.removevar(lauf);

    return {
        'ctype': 'list',
        'value': erg
    };

};


evaluator.flatten$1 = function(args, modifs) {
    function recurse(lst, level) {
        if (level === -1 || lst.ctype !== "list")
            return lst;
        return [].concat.apply([], lst.value.map(function(elt) {
            return recurse(elt, level - 1);
        }));
    }
    var lst = evaluateAndVal(args[0]);
    if (lst.ctype !== "list")
        return lst;
    var levels = modifs.levels;
    if (levels === undefined) {
        levels = 1;
    } else {
        levels = evaluate(levels);
        if (levels.ctype === "number")
            levels = levels.value.real;
        else if (levels.ctype === "string" && levels.value === "all")
            levels = -2;
        else
            levels = 1;
    }
    return {
        'ctype': 'list',
        'value': recurse(lst, levels)
    };
};


function infix_semicolon(args, modifs) { //OK
    var u0 = (args[0].ctype === 'void');
    var u1 = (args[1].ctype === 'void');

    if (u0 && u1) {
        return nada;
    }
    if (!u0 && u1) {
        return evaluate(args[0]);
    }
    if (!u0 && !u1) {
        evaluate(args[0]); //Wegen sideeffects
    }
    if (!u1) {
        return evaluate(args[1]);
    }
    return nada;
}


evaluator.createvar$1 = function(args, modifs) { //OK
    if (args[0].ctype === 'variable') {
        var v = args[0].name;
        namespace.newvar(v);
    }
    return nada;
};

evaluator.local = function(args, modifs) { //VARIADIC!

    for (var i = 0; i < args.length; i++) {
        if (args[i].ctype === 'variable') {
            var v = args[i].name;
            namespace.newvar(v);
        }
    }

    return nada;

};


evaluator.removevar$1 = function(args, modifs) { //OK
    var ret = evaluate(args[0]);
    if (args[0].ctype === 'variable') {
        var v = args[0].name;
        namespace.removevar(v);
    }
    return ret;
};


evaluator.release = function(args, modifs) { //VARIADIC!

    if (args.length === 0)
        return nada;


    var ret = evaluate(args[args.length - 1]);

    for (var i = 0; i < args.length; i++) {
        if (args[i].ctype === 'variable') {
            var v = args[i].name;
            namespace.removevar(v);
        }
    }

    return ret;

};

evaluator.regional = function(args, modifs) { //VARIADIC!

    for (var i = 0; i < args.length; i++) {
        if (args[i].ctype === 'variable') {
            var v = args[i].name;
            namespace.newvar(v);
            namespace.pushVstack(v);
        }
    }
    return nada;

};


evaluator.genList = function(args, modifs) { //VARIADIC!
    return List.turnIntoCSList(args.map(evaluate));
};


eval_helper.assigntake = function(data, what) { //TODO: Bin nicht ganz sicher obs das so tut
    var lhs = data.args[0];
    var where = evaluate(lhs);
    var ind = evaluateAndVal(data.args[1]);
    var rhs = nada;

    if (where.ctype === 'list' || where.ctype === 'string') {
        var ind1 = Math.floor(ind.value.real);
        if (ind1 < 0) {
            ind1 = where.value.length + ind1 + 1;
        }
        if (ind1 > 0 && ind1 <= where.value.length) {
            if (where.ctype === 'list') {
                var lst = where.value.slice();
                lst[ind1 - 1] = evaluate(what);
                rhs = List.turnIntoCSList(lst);
                // update colon op
                if (where.userData) rhs.userData = where.userData;
            } else {
                var str = where.value;
                str = str.substring(0, ind1 - 1) +
                    niceprint(evaluate(what)) +
                    str.substring(ind1, str.length);
                rhs = General.string(str);
            }
        }
    }
    infix_assign([lhs, rhs]);
};


eval_helper.assigndot = function(data, what) {
    var where = evaluate(data.obj);
    var field = data.key;

    if (where.ctype === 'geo' && field) {
        Accessor.setField(where.value, field, evaluateAndVal(what));
    }

    return nada;
};

eval_helper.assigncolon = function(data, what) {
    var lhs = data.obj;
    var where = evaluate(lhs);

    var key = niceprint(evaluate(data.key));
    if (key === "_?_") key = undefined;

    if (where.ctype === 'geo' && key) {
        Accessor.setuserData(where.value, key, evaluateAndVal(what));
    } else if (where.ctype === 'list' || where.ctype === 'string' && key) {
        // copy object
        var rhs = {};
        for (var i in where) rhs[i] = where[i];

        if (!rhs.userData) rhs.userData = {};
        else { // avoid reference copy
            var tmpObj = {};
            for (var j in rhs.userData) tmpObj[j] = rhs.userData[j];
            rhs.userData = tmpObj;
        }

        rhs.userData[key] = evaluateAndVal(what);

        infix_assign([lhs, rhs]);
    } else {
        if (!key) console.log("Key is undefined");
        else console.log("User data can only be assigned to geo objects and lists.");
    }

    return nada;
};


evaluator.keys$1 = function(args, modifs) {
    var obj = evaluate(args[0]);
    var ctype = obj.ctype;
    if (ctype === "geo" || ctype === "list") {
        var keys = [];

        var data = ctype === "geo" ? obj.value.userData : obj.userData;
        if (data) {
            keys = Object.keys(data).map(General.string);
        }
        return List.turnIntoCSList(keys);
    }

    return nada;
};


eval_helper.assignlist = function(vars, vals) {
    var n = vars.length;
    var m = vals.length;
    if (m < n) n = m;

    for (var i = 0; i < n; i++) {
        var name = vars[i];
        var val = vals[i];
        infix_assign([name, val], []);

    }


};


function infix_assign(args, modifs) {

    var u0 = (args[0].ctype === 'undefined');
    var u1 = (args[1].ctype === 'undefined');
    var v1 = evaluate(args[1]);
    if (u0 || u1) {
        return nada;
    }
    if (args[0].ctype === 'variable') {
        namespace.setvar(args[0].name, v1);
    } else if (args[0].ctype === 'infix') {
        if (args[0].oper === '_') {
            // Copy on write
            eval_helper.assigntake(args[0], v1);
        } else {
            printStackTrace("Can't use infix expression as lvalue");
        }
    } else if (args[0].ctype === 'field') {
        eval_helper.assigndot(args[0], v1);
    } else if (args[0].ctype === 'userdata') {
        eval_helper.assigncolon(args[0], v1);
    } else if (args[0].ctype === 'function' && args[0].oper === 'genList') {
        if (v1.ctype === "list") {
            eval_helper.assignlist(args[0].args, v1.value);
        } else {
            printStackTrace("Expected list in rhs of assignment");
        }
    } else {
        printStackTrace("Left hand side of assignment is not a recognized lvalue");
    }
    return v1;
}


function infix_define(args, modifs, self) {

    var u0 = (args[0].ctype === 'undefined');
    var u1 = (args[1].ctype === 'undefined');

    if (u0 || u1) {
        return nada;
    }
    if (args[0].ctype === 'function') {
        var fname = args[0].oper;
        var ar = args[0].args;
        var body = args[1];
        var generation = 1;
        if (myfunctions.hasOwnProperty(fname)) {
            var previous = myfunctions[fname];
            if (previous.definer === self) {
                // Redefinition using the same piece of code changes nothing.
                // This needs some work once we have closures.
                return nada;
            }
            generation = previous.generation + 1;
        }
        myfunctions[fname] = {
            'oper': fname,
            'body': body,
            'arglist': ar,
            'definer': self,
            'generation': generation
        };
    }
    if (args[0].ctype === 'variable') {
        namespace.setvar(args[0].name, args[1]);
    }

    return nada;
}


function postfix_undefine(args, modifs) {
    if (args[1].ctype !== 'void') {
        return nada;
    }
    if (args[0].ctype === 'function') {
        delete myfunctions[args[0].oper];
    }
    return nada;
}


evaluator.if$2 = function(args, modifs) { //OK
    return evaluator.if$3(args, modifs);
};

evaluator.if$3 = function(args, modifs) { //OK

    var u0 = (args[0].ctype === 'undefined');
    var u1 = (args[1].ctype === 'undefined');

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'boolean') {
        if (v0.value === true) {
            return evaluate(args[1]);
        } else if (args.length === 3) {
            return evaluate(args[2]);
        }
    } else {
        printStackTrace("Condition for if is not boolean");
    }

    return nada;

};

function comp_equals(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);

    if (v0.ctype === v1.ctype) {
        if (v0.ctype === 'number') {
            return General.bool(
                v0.value.real === v1.value.real &&
                v0.value.imag === v1.value.imag
            );
        }
        if (v0.ctype === 'string') {
            return General.bool(v0.value === v1.value);
        }
        if (v0.ctype === 'boolean') {
            return General.bool(v0.value === v1.value);
        }
        if (v0.ctype === 'list') {
            return List.equals(v0, v1);
        }
        if (v0.ctype === 'geo') {
            return General.bool(v0.value === v1.value);
        }
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
}

function comp_notequals(args, modifs) {
    return General.not(comp_equals(args, modifs));
}

function comp_almostequals(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return {
            'ctype': 'boolean',
            'value': CSNumber._helper.isAlmostEqual(v0, v1)
        };
    }
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        return {
            'ctype': 'boolean',
            'value': (v0.value === v1.value)
        };
    }
    if (v0.ctype === 'boolean' && v1.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (v0.value === v1.value)
        };
    }
    if (v0.ctype === 'list' && v1.ctype === 'list') {
        var erg = List.almostequals(v0, v1);
        return erg;
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
}


evaluator.and$2 = infix_and;

function infix_and(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'boolean' && v1.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (v0.value && v1.value)
        };
    }

    return nada;
}


evaluator.or$2 = infix_or;

function infix_or(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'boolean' && v1.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (v0.value || v1.value)
        };
    }

    return nada;
}


evaluator.xor$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'boolean' && v1.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (v0.value !== v1.value)
        };
    }

    return nada;
};


evaluator.not$1 = function(args, modifs) {
    var v = evaluateAndVal(args[0]);

    if (v.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (!v.value)
        };
    }

    return nada;
};

function prefix_not(args, modifs) {
    var v1 = evaluateAndVal(args[1]);

    if (args[0].ctype === 'void' && v1.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (!v1.value)
        };
    }

    return nada;
}


function postfix_numb_degree(args, modifs) {
    var v0 = evaluateAndVal(args[0]);

    if (v0.ctype === 'number' && args[1].ctype === 'void') {
        return General.withUsage(CSNumber.realmult(Math.PI / 180, v0), "Angle");
    }

    return nada;
}


function comp_notalmostequals(args, modifs) {
    return General.not(comp_almostequals(args, modifs));
}


function comp_ugt(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real - v1.value.real >= CSNumber.eps)
            };
    }
    return nada;
}

function comp_uge(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real - v1.value.real > -CSNumber.eps)
            };
    }
    return nada;
}

function comp_ult(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real - v1.value.real <= -CSNumber.eps)
            };
    }
    return nada;
}

function comp_ule(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real - v1.value.real < CSNumber.eps)
            };
    }
    return nada;
}


function comp_gt(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real > v1.value.real)
            };
    }
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        return {
            'ctype': 'boolean',
            'value': (v0.value > v1.value)
        };
    }
    return nada;
}


function comp_ge(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real >= v1.value.real)
            };
    }
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        return {
            'ctype': 'boolean',
            'value': (v0.value >= v1.value)
        };
    }
    return nada;
}


function comp_le(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real <= v1.value.real)
            };
    }
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        return {
            'ctype': 'boolean',
            'value': (v0.value <= v1.value)
        };
    }
    return nada;
}

function comp_lt(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) && CSNumber._helper.isAlmostReal(v1))
            return {
                'ctype': 'boolean',
                'value': (v0.value.real < v1.value.real)
            };
    }
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        return {
            'ctype': 'boolean',
            'value': (v0.value < v1.value)
        };
    }
    return nada;
}


function infix_sequence(args, modifs) { //OK
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return List.sequence(v0, v1);
    }
    return nada;
}

eval_helper.genericListMathGen = function(name, op, emptyval) {
    evaluator[name + "$1"] = function(args, modifs) {
        var v0 = evaluate(args[0]);
        if (v0.ctype !== 'list') {
            return nada;
        }
        var li = v0.value;
        if (li.length === 0) {
            return emptyval;
        }

        var erg = li[0];
        for (var i = 1; i < li.length; i++) {
            erg = op(erg, li[i]);
        }
        return erg;
    };
    var name$3 = name + "$3";
    evaluator[name + "$2"] = function(args, modifs) {
        return evaluator[name$3]([args[0], null, args[1]]);
    };
    evaluator[name$3] = function(args, modifs) {
        var v0 = evaluateAndVal(args[0]);
        if (v0.ctype !== 'list') {
            return nada;
        }
        var li = v0.value;
        if (li.length === 0) {
            return emptyval;
        }

        var lauf = '#';
        if (args[1] !== null) {
            if (args[1].ctype === 'variable') {
                lauf = args[1].name;
            }
        }

        namespace.newvar(lauf);
        namespace.setvar(lauf, li[0]);
        var erg = evaluate(args[2]);
        for (var i = 1; i < li.length; i++) {
            namespace.setvar(lauf, li[i]);
            var b = evaluate(args[2]);
            erg = op(erg, b);
        }
        namespace.removevar(lauf);
        return erg;
    };
};

eval_helper.genericListMathGen("product", General.mult, CSNumber.real(1));
eval_helper.genericListMathGen("sum", General.add, CSNumber.real(0));
eval_helper.genericListMathGen("max", General.max, nada);
eval_helper.genericListMathGen("min", General.min, nada);

evaluator.max$2 = function(args, modifs) {
    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype === "list")
        return evaluator.max$3([v1, null, args[1]]);
    var v2 = evaluateAndVal(args[1]);
    return evaluator.max$1([List.turnIntoCSList([v1, v2])]);
};

evaluator.min$2 = function(args, modifs) {
    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype === "list")
        return evaluator.min$3([v1, null, args[1]]);
    var v2 = evaluateAndVal(args[1]);
    return evaluator.min$1([List.turnIntoCSList([v1, v2])]);
};

evaluator.add$2 = infix_add;

function infix_add(args, modifs) {
    var v0 = args[0];
    if (v0.ctype !== "void")
        v0 = evaluateAndVal(v0);
    var v1 = evaluateAndVal(args[1]);
    var erg = General.add(v0, v1);
    if (v0.usage === "Angle" && v1.usage === "Angle")
        erg = General.withUsage(erg, "Angle");
    return erg;
}

evaluator.sub$2 = infix_sub;

function infix_sub(args, modifs) {
    var v0 = args[0];
    if (v0.ctype !== "void")
        v0 = evaluateAndVal(v0);
    var v1 = evaluateAndVal(args[1]);
    var erg = General.sub(v0, v1);
    if (v0.usage === "Angle" && v1.usage === "Angle")
        erg = General.withUsage(erg, "Angle");
    return erg;
}

evaluator.mult$2 = infix_mult;

function infix_mult(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var erg = General.mult(v0, v1);
    if (v0.usage === "Angle" && !v1.usage)
        erg = General.withUsage(erg, "Angle");
    else if (v1.usage === "Angle" && !v0.usage)
        erg = General.withUsage(erg, "Angle");
    return erg;
}

evaluator.div$2 = infix_div;

function infix_div(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v1.ctype === "number" && CSNumber._helper.isZero(v1))
        printStackTrace("WARNING: Division by zero!");
    var erg = General.div(v0, v1);
    if (v0.usage === "Angle" && !v1.usage)
        erg = General.withUsage(erg, "Angle");
    else if (v1.usage === "Angle" && !v0.usage)
        erg = General.withUsage(erg, "Angle");
    return erg;
}


evaluator.mod$2 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return CSNumber.mod(v0, v1);
    }
    return nada;

};

evaluator.pow$2 = infix_pow;

function infix_pow(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return CSNumber.pow(v0, v1);
    }
    return nada;

}


///////////////////////////////
//     UNARY MATH OPS        //
///////////////////////////////


evaluator.exp$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.exp(v0);
    }
    return nada;
};

evaluator.sin$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.sin(v0);
    }
    return nada;
};

evaluator.sqrt$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.sqrt(v0);
    }
    return nada;
};

function infix_sqrt(args, modifs) {
    if (args[0].ctype === 'void')
        return evaluator.sqrt$1([args[1]], modifs);
    return nada;
}

eval_helper.laguerre = function(cs, x, maxiter) {
    if (cs.ctype !== 'list')
        return nada;
    var n = cs.value.length - 1,
        i;
    for (i = 0; i <= n; i++)
        if (cs.value[i].ctype !== 'number')
            return nada;
    if (x.ctype !== 'number')
        return nada;
    var rand = [1.0, 0.3141, 0.5926, 0.5358, 0.9793, 0.2385, 0.6264, 0.3383, 0.2795, 0.0288];
    var a, p, q, s, g, g2, h, r, d1, d2;
    var tol = 1e-14;
    for (var iter = 1; iter <= maxiter; iter++) {
        s = CSNumber.zero;
        q = CSNumber.zero;
        p = cs.value[n];

        for (i = n - 1; i >= 0; i--) {
            s = CSNumber.add(q, CSNumber.mult(s, x));
            q = CSNumber.add(p, CSNumber.mult(q, x));
            p = CSNumber.add(cs.value[i], CSNumber.mult(p, x));
        }

        if (CSNumber._helper.isLessThan(CSNumber.abs(p), CSNumber.real(tol)))
            return x;

        g = CSNumber.div(q, p);
        g2 = CSNumber.mult(g, g);
        h = CSNumber.sub(g2, CSNumber.div(CSNumber.mult(CSNumber.real(2.0), s), p));
        r = CSNumber.sqrt(CSNumber.mult(CSNumber.real(n - 1), CSNumber.sub(CSNumber.mult(CSNumber.real(n), h), g2)));
        d1 = CSNumber.add(g, r);
        d2 = CSNumber.sub(g, r);
        if (CSNumber._helper.isLessThan(CSNumber.abs(d1), CSNumber.abs(d2)))
            d1 = d2;
        if (CSNumber._helper.isLessThan(CSNumber.real(tol), CSNumber.abs(d1)))
            a = CSNumber.div(CSNumber.real(n), d1);
        else
            a = CSNumber.mult(CSNumber.add(CSNumber.abs(x), CSNumber.one), CSNumber.complex(Math.cos(iter), Math.sin(iter)));
        if (CSNumber._helper.isLessThan(CSNumber.abs(a), CSNumber.real(tol)))
            return x;
        if (iter % 20 === 0 && iter < maxiter - 19)
            a = CSNumber.mult(a, CSNumber.real(rand[Math.floor(iter / 20)]));
        x = CSNumber.sub(x, a);
    }
    return x;
};

// maybe this should become CSNumber._helper.solveQuadratic?
eval_helper.quadratic_roots = function(cs) {
    if (cs.ctype !== 'list')
        return nada;
    var a = cs.value[2],
        b = cs.value[1],
        c = cs.value[0];
    if (CSNumber._helper.isZero(c))
        return [CSNumber.zero, CSNumber.neg(CSNumber.div(b, a))];
    var r = CSNumber.sqrt(CSNumber.sub(CSNumber.mult(b, b), CSNumber.mult(CSNumber.real(4.0), CSNumber.mult(a, c))));
    if (CSNumber.re(b) >= 0.0)
        r = CSNumber.neg(r);
    return [CSNumber.div(CSNumber.sub(r, b), CSNumber.mult(CSNumber.real(2.0), a)), CSNumber.div(CSNumber.mult(CSNumber.real(2.0), c), CSNumber.sub(r, b))];
};

eval_helper.roots = function(cs) {
    var roots = [];
    var cs_orig = cs;
    var n = cs.value.length - 1;
    if (n <= 0)
        return List.turnIntoCSList([]);
    if (CSNumber._helper.isZero(cs.value[n])) {
        roots = eval_helper.roots(List.turnIntoCSList(cs.value.slice(0, n)));
        return List.append(roots, CSNumber.infinity);
    }
    if (n === 1)
        roots[0] = CSNumber.neg(CSNumber.div(cs.value[0], cs.value[1]));
    else if (n === 2)
        roots = eval_helper.quadratic_roots(cs);
    else {
        for (var i = 0; i < n - 2; i++) {
            roots[i] = eval_helper.laguerre(cs, CSNumber.zero, 200);
            roots[i] = eval_helper.laguerre(cs_orig, roots[i], 1);
            var fx = [];
            fx[n - i] = cs.value[n - i];
            for (var j = n - i; j > 0; j--)
                fx[j - 1] = CSNumber.add(cs.value[j - 1], CSNumber.mult(fx[j], roots[i]));
            fx.shift();
            cs = List.turnIntoCSList(fx);
        }
        var qroots = eval_helper.quadratic_roots(cs);
        roots[n - 2] = qroots[0];
        roots[n - 1] = qroots[1];
    }
    return List.turnIntoCSList(roots);
};

evaluator.roots$1 = function(args, modifs) {
    var cs = evaluateAndVal(args[0]);
    if (cs.ctype === 'list') {
        for (var i = 0; i < cs.value.length; i++)
            if (cs.value[i].ctype !== 'number')
                return nada;
        var roots = eval_helper.roots(cs);
        return List.sort1(roots);
    }
    return nada;
};

evaluator.autodiff$3 = function(args, modifs) {
    var varname = "x"; // fix this later
    var ffunc;
    if (args[0].ctype === "function") {
        ffunc = myfunctions[args[0].oper].body;
        varname = args[0].args[0].name;
    } else if (typeof(args[0].impl) === "function")
        ffunc = args[0];
    else {
        printStackTrace("could not parse function");
        return nada;
    }
    var xarr = evaluateAndVal(args[1]);
    var grade = evaluateAndVal(args[2]);

    if (grade.value.real < 1) {
        printStackTrace("grade cant be < 1");
        return nada;
    }

    grade = CSNumber.add(grade, CSNumber.real(1));
    var erg = CSad.autodiff(ffunc, varname, xarr, grade);
    return erg;
};

evaluator.cos$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.cos(v0);
    }
    return nada;
};


evaluator.tan$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.tan(v0);
    }
    return nada;
};

evaluator.arccos$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.arccos(v0);
    }
    return nada;
};


evaluator.arcsin$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.arcsin(v0);
    }
    return nada;
};


evaluator.arctan$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.arctan(v0);
    }
    return nada;
};

evaluator.arctan2$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return CSNumber.arctan2(v0, v1);
    }
    return nada;
};

evaluator.arctan2$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list' && v0.value.length === 2) {
        var tmp = v0.value;
        if (tmp[0].ctype === 'number' && tmp[1].ctype === 'number') {
            return evaluator.arctan2$2(tmp, modifs);
        }
    } else if (v0.ctype === 'number')
        return CSNumber.arctan2(v0);
    return nada;
};


evaluator.log$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.log(v0);
    }
    return nada;

};


eval_helper.recursiveGen = function(op) {
    var numOp = CSNumber[op],
        listOp = List[op];
    evaluator[op + "$1"] = function(args, modifs) {
        var v0 = evaluateAndVal(args[0]);
        if (v0.ctype === 'number') {
            return numOp(v0);
        }
        if (v0.ctype === 'list') {
            return listOp(v0);
        }
        return nada;
    };
};

eval_helper.recursiveGen("im");
eval_helper.recursiveGen("re");
eval_helper.recursiveGen("conjugate");
eval_helper.recursiveGen("round");
eval_helper.recursiveGen("ceil");
eval_helper.recursiveGen("floor");
eval_helper.recursiveGen("abs");
evaluator.abs_infix = evaluator.abs$1;

///////////////////////////////
//        RANDOM             //
///////////////////////////////

evaluator.random$0 = function(args, modifs) {
    return CSNumber.real(CSNumber._helper.rand());
};

evaluator.random$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return CSNumber.complex(v0.value.real * CSNumber._helper.rand(), v0.value.imag * CSNumber._helper.rand());
    }
    return nada;
};

evaluator.seedrandom$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        CSNumber._helper.seedrandom(v0.value.real);
    }
    return nada;

};

evaluator.randomnormal$0 = function(args, modifs) {
    return CSNumber.real(CSNumber._helper.randnormal());
};

evaluator.randominteger$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        var r = v0.value.real | 0,
            i = v0.value.imag | 0;
        r = (r * CSNumber._helper.rand()) | 0;
        i = (i * CSNumber._helper.rand()) | 0;
        return CSNumber.complex(r, i);
    }
    return nada;
};

evaluator.randomint$1 = evaluator.randominteger$1;

evaluator.randombool$0 = function(args, modifs) {
    if (CSNumber._helper.rand() > 0.5) {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


///////////////////////////////
//        TYPECHECKS         //
///////////////////////////////

evaluator.isreal$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0)) {
            return {
                'ctype': 'boolean',
                'value': true
            };
        }
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.isinteger$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) &&
            v0.value.real === Math.floor(v0.value.real)) {
            return {
                'ctype': 'boolean',
                'value': true
            };
        }
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.iseven$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) &&
            v0.value.real / 2 === Math.floor(v0.value.real / 2)) {
            return {
                'ctype': 'boolean',
                'value': true
            };
        }
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.isodd$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        if (CSNumber._helper.isAlmostReal(v0) &&
            (v0.value.real - 1) / 2 === Math.floor((v0.value.real - 1) / 2)) {
            return {
                'ctype': 'boolean',
                'value': true
            };
        }
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.iscomplex$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.isstring$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'string') {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.islist$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.ismatrix$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if ((List._helper.colNumb(v0)) !== -1) {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.iscircle$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo" && v0.value.kind === "C" && v0.value.matrix.usage === "Circle") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.isconic$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo" && v0.value.kind === "C") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.isline$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo" && v0.value.kind === "L") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.ispoint$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo" && v0.value.kind === "P") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.isgeometric$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.isnumbermatrix$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    return List.isNumberMatrix(v0);
};

evaluator.isnumbervector$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    return List.isNumberVector(v0);
};


evaluator.issun$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'geo' && v0.value.behavior !== undefined && v0.value.behavior.type === "Sun") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.ismass$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'geo' && v0.value.behavior !== undefined && v0.value.behavior.type === "Mass") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.isspring$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'geo' && v0.value.behavior !== undefined && v0.value.behavior.type === "Spring") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};


evaluator.isbouncer$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'geo' && v0.value.behavior !== undefined && v0.value.behavior.type === "Bouncer") {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

evaluator.isundefined$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'undefined') {
        return {
            'ctype': 'boolean',
            'value': true
        };
    }
    return {
        'ctype': 'boolean',
        'value': false
    };
};

// See AlgoMap.java in the Cinderella codebase, but also geoMacros in GeoOps.js
var cinderellaAlgoNames = {
    ArcBy3: "Arc",
    CenterOfConic: "Center",
    ConicBy1p4l: "Conic1P4L",
    ConicBy4p1l: "Conic4P1L",
    ConicBy5lines: "Conic5L",
    ConicBy2Foci1P: "ConicFoci", // sometimes "ConicFociH" instead
    ConicFromPrincipalDirections: "ConicPrincipleDirs",
    // Mid: "EuclideanMid", (only sometimes)
    Free: "FreePoint",
    PolarOfLine: "PolarLine",
    PolarOfPoint: "PolarPoint",
    PointOnSegment: "PointOnLine",
    Button: "Text",
    ToggleButton: "Text",
    TrReflectionL: "TrReflection",
    TrReflectionP: "TrReflection",
    TrReflectionC: "TrReflection",
    TrTranslation: "TrProjection", // or TrTranslationPP?
    TrSimilarity: "TrProjection",
    TrAffine: "TrProjection",
    TransformP: "Transform",
    TransformL: "Transform",
    TransformSegment: "Transform",
    TransformS: "Transform",
    TransformPolygon: "Transform",
    TransformArc: "Transform",
    TransformConic: "Transform",
    TransformC: "Transform",
    TrMoebiusP: "Transform",
    TrMoebiusL: "Transform",
    TrMoebiusSegment: "Transform",
    TrMoebiusS: "Transform",
    TrMoebiusPolygon: "Transform",
    TrMoebiusArc: "Transform",
    TrMoebiusCircle: "Transform",
    TrMoebiusC: "Transform",
    TrInverseMoebius: "TrInverse",
    Perp: "Orthogonal",
    Para: "Parallel",
    AngleBisector: "AngularBisector",
    IntersectLC: "IntersectionConicLine",
    IntersectCirCir: "IntersectionCircleCircle",
    OtherPointOnCircle: "PointOnCircle",
};

evaluator.algorithm$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo") {
        var el = v0.value;
        var type = el.type;
        var compat = evaluateAndVal(modifs.compatibility);
        if (compat.ctype === "string" &&
            (/^cinderella$/i).test(compat.value)) {
            if (/^Select/.test(type)) {
                el = csgeo.csnames[el.args[0]];
                type = el.type;
            }
            if (cinderellaAlgoNames.hasOwnProperty(type))
                type = cinderellaAlgoNames[type];
            else if (type === "CircleMr")
                type = el.pinned ? "CircleByFixedRadius" : "CircleByRadius";
        }
        return General.string(type);
    }
    return nada;
};

evaluator.inputs$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "geo") {
        var el = v0.value;
        var type = el.type;
        var res = [];
        if (el.args) res = el.args.map(function(name) {
            return {
                ctype: "geo",
                value: csgeo.csnames[name]
            };
        });
        if (/^Select/.test(type) || geoOps[type].isMovable) {
            switch (el.kind) { // compare savePos in StateIO
                case "P":
                case "L":
                    res.push(el.homog);
                    break;
                case "C":
                    res.push(el.matrix);
                    break;
            }
        }
        return List.turnIntoCSList(res);
    }
    return nada;
};

evaluator.moveto$2 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === "geo") {
        var el = v0.value;
        if (List._helper.isNumberVecN(v1, 2)) {
            Accessor.setField(el, "xy", v1);
        } else if (List._helper.isNumberVecN(v1, 3)) {
            Accessor.setField(el, "homog", v1);
        }
    }
    return nada;
};

evaluator.continuefromhere$0 = function(args, modifs) {
    stateContinueFromHere();
    return nada;
};

evaluator.matrixrowcolumn$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var n = List._helper.colNumb(v0);
    if (n !== -1) {
        return List.realVector([v0.value.length, v0.value[0].value.length]);
    }
    return nada;
};

evaluator.rowmatrix$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "list")
        return List.turnIntoCSList([v0]);
    return nada;
};

evaluator.columnmatrix$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === "list")
        return List.turnIntoCSList(v0.value.map(function(elt) {
            return List.turnIntoCSList([elt]);
        }));
    return nada;
};

evaluator.submatrix$3 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    var v2 = evaluate(args[2]);
    if (v0.ctype === "list" && v1.ctype === "number" && v2.ctype === "number") {
        var col = Math.round(v1.value.real);
        var row = Math.round(v2.value.real);
        var mat = v0.value.slice();
        if (row > 0 && row <= mat.length)
            mat.splice(row - 1, 1);
        var sane = true;
        var erg = mat.map(function(row1) {
            if (row1.ctype !== "list") {
                sane = false;
                return;
            }
            var row2 = row1.value.slice();
            if (col > 0 && col <= row2.length)
                row2.splice(col - 1, 1);
            return List.turnIntoCSList(row2);
        });
        if (!sane)
            return nada;
        return List.turnIntoCSList(erg);
    }
    return nada;
};


///////////////////////////////
//         GEOMETRY          //
///////////////////////////////


evaluator.complex$1 = function(args, modifs) {
    var a, b, c, v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        if (List.isNumberVector(v0)) {
            if (v0.value.length === 2) {
                a = v0.value[0];
                b = v0.value[1];
                return CSNumber.complex(a.value.real - b.value.imag, b.value.real + a.value.imag);
            }
            if (v0.value.length === 3) {
                a = v0.value[0];
                b = v0.value[1];
                c = v0.value[2];
                a = CSNumber.div(a, c);
                b = CSNumber.div(b, c);
                return CSNumber.complex(a.value.real - b.value.imag, b.value.real + a.value.imag);
            }
        }
    }
    return nada;
};

evaluator.gauss$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return List.realVector([v0.value.real, v0.value.imag]);
    }
    return nada;
};


evaluator.cross$2 = infix_cross;

function infix_cross(args, modifs) {
    var v0 = evaluateAndHomog(args[0]);
    var v1 = evaluateAndHomog(args[1]);
    if (v0 !== nada && v1 !== nada) {
        var erg = List.cross(v0, v1);
        if (v0.usage === "Point" && v1.usage === "Point") {
            erg = General.withUsage(erg, "Line");
        }
        if (v0.usage === "Line" && v1.usage === "Line") {
            erg = General.withUsage(erg, "Point");
        }
        return erg;
    }
    return nada;
}

evaluator.crossratio$4 = function(args, modifs) {
    var a0 = evaluate(args[0]);
    var a1 = evaluate(args[1]);
    var a2 = evaluate(args[2]);
    var a3 = evaluate(args[3]);

    var v0 = evaluateAndHomog(a0);
    var v1 = evaluateAndHomog(a1);
    var v2 = evaluateAndHomog(a2);
    var v3 = evaluateAndHomog(a3);
    if (v0 !== nada && v1 !== nada && v2 !== nada && v3 !== nada) {
        // TODO: can't handle four collinear points at infinity
        return List.crossratio3(v0, v1, v2, v3, List.ii);
    }

    if (a0.ctype === "number" && a1.ctype === "number" &&
        a2.ctype === "number" && a3.ctype === "number") {
        return CSNumber.div(
            CSNumber.mult(
                CSNumber.sub(a0, a2),
                CSNumber.sub(a1, a3)
            ), CSNumber.mult(
                CSNumber.sub(a0, a3),
                CSNumber.sub(a1, a2)
            )
        );
    }

    return nada;
};

evaluator.para$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var w0 = evaluateAndHomog(v0);
    var w1 = evaluateAndHomog(v1);

    if (v0 !== nada && v1 !== nada) {
        var u0 = v0.usage;
        var u1 = v1.usage;
        var p = w0;
        var l = w1;
        if (u0 === "Line" || u1 === "Point") {
            p = w1;
            l = w0;
        }
        var inf = List.linfty;
        var erg = List.cross(List.cross(inf, l), p);
        return General.withUsage(erg, "Line");
    }
    return nada;
};


evaluator.perp$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var w0 = evaluateAndHomog(v0);
    var w1 = evaluateAndHomog(v1);
    if (v0 !== nada && v1 !== nada) {
        var u0 = v0.usage || w0.usage;
        var u1 = v1.usage || w1.usage;
        var p = w0;
        var l = w1;
        if (u0 === "Line" || u1 === "Point") {
            p = w1;
            l = w0;
        }
        var tt = List.turnIntoCSList([l.value[0], l.value[1], CSNumber.zero]);
        var erg = List.cross(tt, p);
        return General.withUsage(erg, "Line");
    }
    return nada;
};

evaluator.perp$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (List._helper.isNumberVecN(v0, 2)) {
        var erg = List.turnIntoCSList([CSNumber.neg(v0.value[1]), v0.value[0]]);
        return erg;
    }
    return nada;
};

evaluator.parallel$2 = evaluator.para$2;

evaluator.perpendicular$2 = evaluator.perp$2;

evaluator.perpendicular$1 = evaluator.perp$1;

evaluator.meet$2 = function(args, modifs) {
    var v0 = evaluateAndHomog(args[0]);
    var v1 = evaluateAndHomog(args[1]);
    if (v0 !== nada && v1 !== nada) {
        var erg = List.cross(v0, v1);
        return General.withUsage(erg, "Point");
    }
    return nada;
};


evaluator.join$2 = function(args, modifs) {
    var v0 = evaluateAndHomog(args[0]);
    var v1 = evaluateAndHomog(args[1]);
    if (v0 !== nada && v1 !== nada) {
        var erg = List.cross(v0, v1);
        return General.withUsage(erg, "Line");
    }
    return nada;
};


evaluator.dist$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var diff = infix_sub([v0, v1], []);
    return evaluator.abs$1([diff], []);
};

evaluator.dist_infix = evaluator.dist$2;


evaluator.point$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (List._helper.isNumberVecN(v0, 3) || List._helper.isNumberVecN(v0, 2)) {
        return General.withUsage(v0, "Point");
    }
    return v0;
};

evaluator.line$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (List._helper.isNumberVecN(v0, 3)) {
        return General.withUsage(v0, "Line");
    }
    return v0;
};

evaluator.det$3 = function(args, modifs) {
    var v0 = evaluateAndHomog(args[0]);
    var v1 = evaluateAndHomog(args[1]);
    var v2 = evaluateAndHomog(args[2]);
    if (v0 !== nada && v1 !== nada && v2 !== nada) {
        var erg = List.det3(v0, v1, v2);
        return erg;
    }
};

evaluator.det$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            return List.det(v0);
        }
    }
    return nada;
};


evaluator.eig$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            return List.eig(v0);
        }
    }
    return nada;
};


evaluator.eigenvalues$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            var erg = List.eig(v0, false);
            return erg.value[0]; // return only eigenvals
        }
    }
    return nada;
};


evaluator.rank$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            return List.rank(v0, modifs.precision);
        }
    }
    return nada;
};


evaluator.kernel$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            var erg = List.nullSpace(v0, modifs.precision);
            return List.transpose(erg);
        }
    }
    return nada;
};


evaluator.eigenvectors$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            var erg = List.eig(v0);
            return erg.value[1]; // return only eigenvecs
        }
    }
    return nada;
};


evaluator.area$3 = function(args, modifs) {
    var v0 = evaluateAndHomog(args[0]);
    var v1 = evaluateAndHomog(args[1]);
    var v2 = evaluateAndHomog(args[2]);
    if (v0 !== nada && v1 !== nada && v2 !== nada) {
        var z0 = v0.value[2];
        var z1 = v1.value[2];
        var z2 = v2.value[2];
        if (!CSNumber._helper.isAlmostZero(z0) && !CSNumber._helper.isAlmostZero(z1) && !CSNumber._helper.isAlmostZero(z2)) {
            v0 = List.scaldiv(z0, v0);
            v1 = List.scaldiv(z1, v1);
            v2 = List.scaldiv(z2, v2);
            var erg = List.det3(v0, v1, v2);
            return CSNumber.realmult(0.5, erg);
        }
    }
    return nada;
};


evaluator.inverse$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length) {
            return List.inverse(v0);
        }
    }
    return nada;
};


evaluator.linearsolve$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'list') {
        var n = List._helper.colNumb(v0);
        if (n !== -1 && n === v0.value.length && List._helper.isNumberVecN(v1, n)) {
            return List.linearsolve(v0, v1);
        }
    }
    return nada;
};

var permutationsFixedList = [
    [ // 0
        []
    ],
    [ // 1
        [0]
    ],
    [ // 2,
        [0, 1],
        [1, 0]
    ],
    [ // 3
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0]
    ],
    [ // 4
        [0, 1, 2, 3],
        [0, 1, 3, 2],
        [0, 2, 1, 3],
        [0, 2, 3, 1],
        [0, 3, 1, 2],
        [0, 3, 2, 1],
        [1, 0, 2, 3],
        [1, 0, 3, 2],
        [1, 2, 0, 3],
        [1, 2, 3, 0],
        [1, 3, 0, 2],
        [1, 3, 2, 0],
        [2, 0, 1, 3],
        [2, 0, 3, 1],
        [2, 1, 0, 3],
        [2, 1, 3, 0],
        [2, 3, 0, 1],
        [2, 3, 1, 0],
        [3, 0, 1, 2],
        [3, 0, 2, 1],
        [3, 1, 0, 2],
        [3, 1, 2, 0],
        [3, 2, 0, 1],
        [3, 2, 1, 0]
    ]
];

function minCostMatching(w) {
    var n = w.length;
    if (n === 0) return [];
    if (n === 1) return [0];
    if (n === 2) {
        if (w[0][0] + w[1][1] <= w[0][1] + w[1][0]) return [0, 1];
        else return [1, 0];
    }
    if (n > 4)
        return hungarianMethod(w);
    var perms = permutationsFixedList[n];
    var bc = Number.POSITIVE_INFINITY;
    var bp = perms[0];
    for (var i = 0; i < perms.length; ++i) {
        var p = perms[i];
        var c = 0;
        for (var j = 0; j < n; ++j)
            c += w[j][p[j]];
        if (c < bc) {
            bc = c;
            bp = p;
        }
    }
    return bp;
}

function hungarianMethod(w) {
    // Hungarian Algorithm to determine a min-cost matching
    // for a square cost matrix given as JavaScript arrays (not Lists)
    // of floating point numbers (not CSNumbers).
    // The invariant v1[i1].cost + v2[i2].cost <= w[i1][i2] will be maintained.
    // The result is the matched column (inner index) for every row
    // (outer index) of the supplied weight matrix.

    var abs = Math.abs;
    var n = w.length;
    var i1, i2;
    var v1 = new Array(n);
    var v2 = new Array(n); // the two partitions
    var e = new Array(n); // excess matrix, zero indicates edge in eq. subgr.
    for (i1 = 0; i1 < n; ++i1)
        e[i1] = new Array(n);

    function mkVertex() {
        return {
            matched: -1, // index of partner in matching
            prev: -1, // previous node in alternating tree
            start: -1, // root of alternating path
            cost: 0, // vertex cost for hungarian method
            used: false, // flag used for matching and vertex cover
            leaf: false // indicates queued item for matching computation
        };
    }

    for (i1 = 0; i1 < n; ++i1) {
        v1[i1] = mkVertex();
        v2[i1] = mkVertex();
        v1[i1].cost = w[i1][0];
        for (i2 = 1; i2 < n; ++i2) {
            if (v1[i1].cost > w[i1][i2])
                v1[i1].cost = w[i1][i2];
        }
    }

    for (;;) {

        // Step 1: update excess matrix: edge cost minus sum of vertex costs
        for (i1 = 0; i1 < n; ++i1) {
            for (i2 = 0; i2 < n; ++i2) {
                e[i1][i2] = w[i1][i2] - v1[i1].cost - v2[i2].cost;
                if (e[i1][i2] < (abs(w[i1][i2]) + abs(v1[i1].cost) +
                        abs(v2[i2].cost)) * 1e-14)
                    e[i1][i2] = 0;
            }
        }

        // Step 2: find a maximal matching in the equality subgraph
        for (i1 = 0; i1 < n; ++i1)
            v1[i1].matched = v2[i1].matched = -1; // reset
        var matchsize = 0;
        for (;;) {
            for (i1 = 0; i1 < n; ++i1) {
                v1[i1].used = v1[i1].leaf = v2[i1].used = v2[i1].leaf = false;
                if (v1[i1].matched !== -1) continue;
                v1[i1].start = i1;
                v1[i1].used = v1[i1].leaf = true;
                v1[i1].prev = -1;
            }
            var haspath = false;
            var empty = false;
            while (!empty) {

                // follow edges not in matching
                for (i1 = 0; i1 < n; ++i1) {
                    if (!v1[i1].leaf) continue;
                    v1[i1].leaf = false;
                    for (i2 = 0; i2 < n; ++i2) {
                        if (v2[i2].used || e[i1][i2] > 0)
                            continue;
                        if (v1[i1].matched === i2)
                            continue;
                        v2[i2].prev = i1;
                        v2[i2].start = v1[i1].start;
                        v2[i2].used = v2[i2].leaf = true;
                        if (v2[i2].matched === -1) {
                            v1[v2[i2].start].prev = i2;
                            haspath = true;
                            break;
                        }
                    } // for i2
                } // for i1

                if (haspath) break;
                empty = true;

                // follow edge in matching
                for (i2 = 0; i2 < n; ++i2) {
                    if (!v2[i2].leaf) continue;
                    v2[i2].leaf = false;
                    i1 = v2[i2].matched;
                    if (v1[i1].used) continue;
                    v1[i1].prev = i2;
                    v1[i1].start = v2[i2].start;
                    v1[i1].used = v1[i1].leaf = true;
                    empty = false;
                } // for i2

            } // while !empty
            if (!haspath) break;

            // now augment every path found
            for (var start = 0; start < n; ++start) {
                if (v1[start].matched !== -1 || v1[start].prev === -1) continue;
                i2 = v1[start].prev;
                do {
                    i1 = v2[i2].prev;
                    v2[i2].matched = i1;
                    v1[i1].matched = i2;
                    i2 = v1[i1].prev;
                } while (i1 !== start);
                ++matchsize;
            }
        } // for(;;)

        if (matchsize === n) break; // found maximum weight matching

        // Step 3: find vertex cover on equality subgraph
        for (i1 = 0; i1 < n; ++i1) {
            v1[i1].used = v1[i1].leaf = v2[i1].used = v2[i1].leaf = false;
        }
        for (i1 = 0; i1 < n; ++i1) {
            if (v1[i1].matched === -1) notincover1(i1);
        }
        for (i2 = 0; i2 < n; ++i2) {
            if (v2[i2].matched === -1) notincover2(i2);
        }
        for (i1 = 0; i1 < n; ++i1) {
            if (v1[i1].matched === -1) continue;
            if (v1[i1].used || v2[v1[i1].matched].used) continue;
            v1[i1].used = true;
        }

        // Step 4: adjust costs.
        // cost change is minimal cost in the part not covered
        var eps = Number.POSITIVE_INFINITY;
        for (i1 = 0; i1 < n; ++i1) {
            if (v1[i1].used) continue;
            for (i2 = 0; i2 < n; ++i2) {
                if (v2[i2].used) continue;
                if (eps > e[i1][i2]) eps = e[i1][i2];
            }
        }
        // assert(eps>0);
        // reduce total cost by applying cost change
        for (i1 = 0; i1 < n; ++i1) {
            if (!v1[i1].used) v1[i1].cost += eps;
            if (v2[i1].used) v2[i1].cost -= eps;
        }
    }

    // We have a result, so let's format it appropriately
    var res = new Array(n);
    for (i1 = 0; i1 < n; ++i1) {
        i2 = v1[i1].matched;
        res[i1] = i2;
    }
    return res;

    // v1[i1] is definitely not in the cover
    //  => all edges must have their opposite endpoint covered
    function notincover1(i1) {
        for (var i2 = 0; i2 < n; ++i2) {
            if (e[i1][i2] > 0 || v2[i2].used) continue;
            v2[i2].used = true;
            notincover1(v2[i2].matched);
        }
    }

    // symmetric to the above
    function notincover2(i2) {
        for (var i1 = 0; i1 < n; ++i1) {
            if (e[i1][i2] > 0 || v1[i1].used) continue;
            v1[i1].used = true;
            notincover2(v1[i1].matched);
        }
    }

}

evaluator.mincostmatching$1 = function(args, modifs) {
    var costMatrix = evaluate(args[0]);
    if (List.isNumberMatrix(costMatrix).value) {
        var nr = costMatrix.value.length;
        var nc = List._helper.colNumb(costMatrix);
        var size = (nr < nc ? nc : nr);
        var i, j;
        var w = new Array(size);
        for (i = 0; i < size; ++i) {
            w[i] = new Array(size);
            for (j = 0; j < size; ++j) {
                if (i < nr && j < nc)
                    w[i][j] = costMatrix.value[i].value[j].value.real;
                else
                    w[i][j] = 0;
            }
        }
        var matching = minCostMatching(w);
        var res = new Array(nr);
        for (i = 0; i < nr; ++i) {
            j = matching[i];
            if (j < nc)
                res[i] = CSNumber.real(j + 1);
            else
                res[i] = CSNumber.real(0);
        }
        return List.turnIntoCSList(res);
    }
    return nada;
};

///////////////////////////////
//    List Manipulations     //
///////////////////////////////

function infix_take(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype !== 'string') {
        v0 = List.asList(v0);
    }
    if (v1.ctype === 'number') {
        var ind = Math.floor(v1.value.real);
        if (ind < 0) {
            ind = v0.value.length + ind + 1;
        }
        if (ind > 0 && ind < v0.value.length + 1) {
            if (v0.ctype === 'list') {
                return v0.value[ind - 1];
            }
            return {
                "ctype": "string",
                "value": v0.value.charAt(ind - 1)
            };
        } else {
            printStackTrace("WARNING: Index out of range!");
            return nada;
        }
    }
    if (v1.ctype === 'list') { // This is recursive, different from Cinderella
        var li = [];
        for (var i = 0; i < v1.value.length; i++) {
            var v1i = evaluateAndVal(v1.value[i]);
            li[i] = infix_take([v0, v1i], []);
        }
        return List.turnIntoCSList(li);
    }
    return nada;
}

evaluator.take$2 = infix_take;

evaluator.length$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list' || v0.ctype === 'string') {
        return CSNumber.real(v0.value.length);
    }
    return nada;
};


evaluator.pairs$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.pairs(v0);
    }
    return nada;
};

evaluator.triples$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.triples(v0);
    }
    return nada;
};

evaluator.cycle$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.cycle(v0);
    }
    return nada;
};

evaluator.consecutive$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.consecutive(v0);
    }
    return nada;
};


evaluator.reverse$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.reverse(v0);
    }
    return nada;
};

evaluator.directproduct$2 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'list' && v1.ctype === 'list') {
        return List.directproduct(v0, v1);
    }
    return nada;
};

evaluator.concat$2 = infix_concat;

function infix_concat(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'shape' && v1.ctype === 'shape') {
        return eval_helper.shapeconcat(v0, v1);
    }
    var l0 = List.asList(v0);
    var l1 = List.asList(v1);
    if (l0.ctype === 'list' && l1.ctype === 'list') {
        return List.concat(l0, l1);
    }
    return nada;
}

evaluator.common$2 = infix_common;

function infix_common(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'list' && v1.ctype === 'list') {
        return List.set(List.common(v0, v1));
    }
    if (v0.ctype === 'shape' && v1.ctype === 'shape') {
        return eval_helper.shapecommon(v0, v1);
    }
    return nada;
}

evaluator.remove$2 = infix_remove;

function infix_remove(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'list' && v1.ctype === 'list') {
        return List.remove(v0, v1);
    }
    if (v0.ctype === 'shape' && v1.ctype === 'shape') {
        return eval_helper.shaperemove(v0, v1);
    }
    return nada;
}


evaluator.append$2 = infix_append;

function infix_append(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'list') {
        return List.append(v0, v1);
    }
    return nada;
}

evaluator.prepend$2 = infix_prepend;

function infix_prepend(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v1.ctype === 'list') {
        return List.prepend(v0, v1);
    }
    return nada;
}

evaluator.contains$2 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'list') {
        return List.contains(v0, v1);
    }
    return nada;
};

function infix_in(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v1.ctype === 'list') {
        return List.contains(v1, v0);
    }
    return nada;
}

function infix_nin(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v1.ctype === 'list') {
        return General.not(List.contains(v1, v0));
    }
    return nada;
}

evaluator.sort$2 = function(args, modifs) {
    return evaluator.sort$3([args[0], null, args[1]], modifs);
};

evaluator.sort$3 = function(args, modifs) { //OK
    var v1 = evaluateAndVal(args[0]);
    if (v1.ctype !== 'list') {
        return nada;
    }

    var lauf = '#';
    if (args[1] !== null) {
        if (args[1].ctype === 'variable') {
            lauf = args[1].name;
        }
    }

    var li = v1.value;
    var erg = [];
    namespace.newvar(lauf);
    var i;
    for (i = 0; i < li.length; i++) {
        namespace.setvar(lauf, li[i]);
        erg[i] = {
            val: li[i],
            result: evaluate(args[2])
        };
    }
    namespace.removevar(lauf);

    erg.sort(General.compareResults);
    var erg1 = [];
    for (i = 0; i < li.length; i++) {
        erg1[i] = erg[i].val;
    }

    return {
        'ctype': 'list',
        'value': erg1
    };
};

evaluator.sort$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.sort1(v0);
    }
    return nada;
};

evaluator.set$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        return List.set(v0);
    }
    return nada;
};

function gcd(a, b) {
    a = a | 0;
    b = b | 0;
    if (a === 0 && b === 0)
        return 0;
    while (b !== 0) {
        var c = a;
        a = b;
        b = (c % b) | 0;
    }
    return a;
}

evaluator.combinations$2 = function(args, modifs) {
    var base = evaluate(args[0]);
    var count = evaluate(args[1]);
    var n, k, current, res;

    if (count.ctype === 'number') {
        k = count.value.real | 0;
        if (base.ctype === 'number') {
            n = base.value.real | 0;
            if (n - k < k) k = n - k;
            if (k < 0) return CSNumber.real(0);
            if (k === 0) return CSNumber.real(1);
            if (k === 1) return base;
            // compute (n! / (n-k)!) / k! efficiently
            var numer = 1;
            var denom = 1;
            for (var i = 1; i <= k; ++i) {
                // Use "| 0" to indicate integer arithmetic
                var x = (n - k + i) | 0;
                var y = i | 0;
                var g = gcd(x, y) | 0;
                x = (x / g) | 0;
                y = (y / g) | 0;
                g = gcd(numer, y) | 0;
                numer = (numer / g) | 0;
                y = (y / g) | 0;
                g = gcd(x, denom) | 0;
                x = (x / g) | 0;
                denom = (denom / g) | 0;
                numer = (numer * x) | 0;
                denom = (denom * y) | 0;
            }
            return CSNumber.real(numer / denom);
        }
        if (base.ctype === 'list') {
            n = base.value.length;
            if (k < 0 || k > n)
                return List.turnIntoCSList([]);
            if (k === 0)
                return List.turnIntoCSList([List.turnIntoCSList([])]);
            if (k === n)
                return List.turnIntoCSList([base]);
            res = [];
            current = new Array(k);
            pick(0, 0);
            return List.turnIntoCSList(res);
        }
    }
    return nada;

    function pick(i, s) {
        if (i === k) {
            res.push(List.turnIntoCSList(current.slice()));
        } else if (s < n) {
            current[i] = base.value[s];
            pick(i + 1, s + 1);
            pick(i, s + 1);
        }
    }
};

evaluator.zeromatrix$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return List.zeromatrix(v0, v1);
    }
    return nada;
};


evaluator.zerovector$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        return List.zerovector(v0);
    }
    return nada;
};

evaluator.transpose$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list' && List._helper.colNumb(v0) !== -1) {
        return List.transpose(v0);
    }
    return nada;
};

evaluator.row$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v1.ctype === 'number' && v0.ctype === 'list' && List._helper.colNumb(v0) !== -1) {
        return List.row(v0, v1);
    }
    return nada;
};

evaluator.column$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    if (v1.ctype === 'number' && v0.ctype === 'list' && List._helper.colNumb(v0) !== -1) {
        return List.column(v0, v1);
    }
    return nada;
};


///////////////////////////////
//        DICTIONARIES       //
///////////////////////////////

evaluator.dict$0 = function(args, modifs) {
    var d = Dict.create();
    for (var key in modifs)
        if (modifs.hasOwnProperty(key))
            Dict.put(d, General.string(key), evaluate(modifs[key]));
    return d;
};

evaluator.put$3 = function(args, modifs) {
    var d = evaluate(args[0]);
    var k = evaluate(args[1]);
    var v = evaluate(args[2]);
    if (d.ctype === "dict") {
        d = Dict.clone(d);
        Dict.put(d, k, v);
        return d;
    }
    return nada;
};

evaluator.get$2 = function(args, modifs) {
    var d = evaluate(args[0]);
    var k = evaluate(args[1]);
    if (d.ctype === "dict") {
        return Dict.get(d, k, nada);
    }
    return nada;
};


///////////////////////////////
//         COLOR OPS         //
///////////////////////////////

evaluator.red$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        var c = Math.min(1, Math.max(0, v0.value.real));
        return List.realVector([c, 0, 0]);
    }
    return nada;
};

evaluator.green$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        var c = Math.min(1, Math.max(0, v0.value.real));
        return List.realVector([0, c, 0]);
    }
    return nada;
};

evaluator.blue$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        var c = Math.min(1, Math.max(0, v0.value.real));
        return List.realVector([0, 0, c]);
    }
    return nada;
};

evaluator.gray$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        var c = Math.min(1, Math.max(0, v0.value.real));
        return List.realVector([c, c, c]);
    }
    return nada;
};

evaluator.grey$1 = evaluator.gray$1;

eval_helper.HSVtoRGB = function(h, s, v) {

    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s;
        v = h.v;
        h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return List.realVector([r, g, b]);
};

evaluator.hue$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'number') {
        var c = v0.value.real;
        c = c - Math.floor(c);
        return eval_helper.HSVtoRGB(c, 1, 1);
    }
    return nada;
};

///////////////////////////////
//      shape booleans       //
///////////////////////////////


eval_helper.shapeconvert = function(a) {
    var i, li;
    if (a.type === "circle") {
        var pt = a.value.value[0];
        var aa = General.div(pt, pt.value[2]);
        var mx = aa.value[0].value.real;
        var my = aa.value[1].value.real;
        var r = a.value.value[1].value.real;
        var n = 125;
        li = new Array(n);
        var d = Math.PI * 2 / n;
        for (i = 0; i < n; i++) {
            li[i] = {
                X: (mx + Math.cos(i * d) * r),
                Y: (my + Math.sin(i * d) * r)
            };
        }

        return [li];
    }
    if (a.type === "polygon") {
        var erg = [];
        for (i = 0; i < a.value.length; i++) {
            var pol = a.value[i];
            li = [];
            for (var j = 0; j < pol.length; j++) {
                li[j] = {
                    X: pol[j].X,
                    Y: pol[j].Y
                };
            }
            erg[i] = li;
        }
        return erg;
    }


};


eval_helper.shapeop = function(a, b, op) {

    var convert;
    var aa = eval_helper.shapeconvert(a);
    var bb = eval_helper.shapeconvert(b);
    var scale = 1000;
    ClipperLib.JS.ScaleUpPaths(aa, scale);
    ClipperLib.JS.ScaleUpPaths(bb, scale);
    var cpr = new ClipperLib.Clipper();
    cpr.AddPaths(aa, ClipperLib.PolyType.ptSubject, true);
    cpr.AddPaths(bb, ClipperLib.PolyType.ptClip, true);
    var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
    var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
    var clipType = op;
    var solution_paths = new ClipperLib.Paths();
    cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
    ClipperLib.JS.ScaleDownPaths(solution_paths, scale);
    //    console.log(JSON.stringify(solution_paths));
    return {
        ctype: "shape",
        type: "polygon",
        value: solution_paths
    };

};

eval_helper.shapecommon = function(a, b) {
    return eval_helper.shapeop(a, b, ClipperLib.ClipType.ctIntersection);
};

eval_helper.shaperemove = function(a, b) {
    return eval_helper.shapeop(a, b, ClipperLib.ClipType.ctDifference);
};

eval_helper.shapeconcat = function(a, b) {
    return eval_helper.shapeop(a, b, ClipperLib.ClipType.ctUnion);
};


///////////////////////////////
//            IO             //
///////////////////////////////

evaluator.key$0 = function(args, modifs) { //OK
    return {
        ctype: "string",
        value: cskey
    };
};


evaluator.keycode$0 = function(args, modifs) { //OK
    return CSNumber.real(cskeycode);
};


evaluator.mouse$0 = function(args, modifs) { //OK
    var x = csmouse[0];
    var y = csmouse[1];
    return List.realVector([x, y]);
};

evaluator.mover$0 = function(args, modifs) { //OK
    if (move && move.mover)
        return {
            ctype: "geo",
            value: move.mover
        };
    return nada;
};


///////////////////////////////
//      Graphic State        //
///////////////////////////////

evaluator.translate$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list') {
        if (List.isNumberVector(v0)) {
            if (v0.value.length === 2) {
                var a = v0.value[0];
                var b = v0.value[1];
                csport.translate(a.value.real, b.value.real);
                return nada;
            }
        }
    }
    return nada;
};


evaluator.rotate$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        csport.rotate(v0.value.real);
        return nada;
    }
    return nada;
};


evaluator.scale$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        csport.scale(v0.value.real);
        return nada;
    }
    return nada;
};


evaluator.greset$0 = function(args, modifs) {
    var n = csgstorage.stack.length;
    csport.greset();
    for (var i = 0; i < n; i++) {
        csctx.restore();
    }
    return nada;
};


evaluator.gsave$0 = function(args, modifs) {
    csport.gsave();
    csctx.save();
    return nada;
};


evaluator.grestore$0 = function(args, modifs) {
    csport.grestore();
    csctx.restore();
    return nada;
};


evaluator.color$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list' && List.isNumberVector(v0).value) {
        csport.setcolor(v0);
    }
    return nada;
};


evaluator.linecolor$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list' && List.isNumberVector(v0).value) {
        csport.setlinecolor(v0);
    }
    return nada;
};


evaluator.pointcolor$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'list' && List.isNumberVector(v0).value) {
        csport.setpointcolor(v0);
    }
    return nada;
};

evaluator.alpha$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        csport.setalpha(v0);
    }
    return nada;
};

evaluator.pointsize$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        csport.setpointsize(v0);
    }
    return nada;
};

evaluator.linesize$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        csport.setlinesize(v0);
    }
    return nada;
};

evaluator.textsize$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        csport.settextsize(v0);
    }
    return nada;
};


//////////////////////////////////////////
//          Animation control           //
//////////////////////////////////////////

evaluator.playanimation$0 = function(args, modifs) {
    csplay();
    return nada;
};

evaluator.pauseanimation$0 = function(args, modifs) {
    cspause();
    return nada;
};

evaluator.stopanimation$0 = function(args, modifs) {
    csstop();
    return nada;
};


///////////////////////////////
//          String           //
///////////////////////////////


evaluator.text$1 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]); // Cinderella compatible
    // if (v0 === nada) return nada; // Cinderella compatible
    return General.string(niceprint(v0));
};

evaluator.replace$3 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    var v2 = evaluate(args[2]);
    if (v0.ctype === 'string' && v1.ctype === 'string' && v2.ctype === 'string') {
        var str0 = v0.value;
        var str1 = v1.value.replace(/[^A-Za-z0-9]/g, "\\$&");
        var str2 = v2.value.replace(/\$/g, "$$$$");
        var regex = new RegExp(str1, "g");
        str0 = str0.replace(regex, str2);
        return {
            ctype: "string",
            value: str0
        };
    }
};

evaluator.replace$2 = function(args, modifs) {
    var ind;
    var repl;
    var keyind;
    var from;

    /////HELPER/////
    function getReplStr(str, keys, from) {
        var s = "";
        ind = -1;
        keyind = -1;
        for (var i = 0; i < keys.length; i++) {
            var s1 = keys[i][0];
            var a = str.indexOf(s1, from);
            if (a !== -1) {
                if (ind === -1) {
                    s = s1;
                    ind = a;
                    keyind = i;
                } else if (a < ind) {
                    s = s1;
                    ind = a;
                    keyind = i;
                }
            }
        }
        return s;
    }

    ////////////////

    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'string' && v1.ctype === 'list') {
        var s = v0.value;
        var rules = [];
        for (var i = 0; i < v1.value.length; i++) {
            var el = v1.value[i];
            if (el.ctype === "list" &&
                el.value.length === 2 &&
                el.value[0].ctype === "string" &&
                el.value[1].ctype === "string") {
                rules[rules.length] = [el.value[0].value, el.value[1].value];
            }

        }
        ind = -1;
        from = 0;
        var srep = getReplStr(s, rules, from);
        while (ind !== -1) {
            s = s.substring(0, ind) +
                (rules[keyind][1]) +
                s.substring(ind + (srep.length), s.length);
            from = ind + rules[keyind][1].length;
            srep = getReplStr(s, rules, from);
        }

        return {
            ctype: "string",
            value: s
        };
    }

    return nada;
};


evaluator.substring$3 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var v2 = evaluateAndVal(args[2]);
    if (v0.ctype === 'string' && v1.ctype === 'number' && v2.ctype === 'number') {
        var s = v0.value;
        return {
            ctype: "string",
            value: s.substring(Math.floor(v1.value.real),
                Math.floor(v2.value.real))
        };
    }
    return nada;
};


evaluator.tokenize$2 = function(args, modifs) {
    var li, i;
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        return evaluator.tokenize$2([v0, List.turnIntoCSList([v1])], modifs);
    }
    if (v0.ctype === 'string' && v1.ctype === 'list') {
        var str = v0.value;

        if (v1.value.length === 0) {
            // This is a leaf
            var convert = true;
            if (modifs.autoconvert !== undefined) {
                var erg = evaluate(modifs.autoconvert);
                if (erg.ctype === 'boolean') {
                    convert = erg.value;
                }
            }
            if (convert && str !== "") {
                var fl = Number(str);
                if (!isNaN(fl)) {
                    return CSNumber.real(fl);
                }
            }
            return General.string(str);
        }

        var head = v1.value[0];
        var tail = List.turnIntoCSList(v1.value.slice(1));
        var tokens = str.split(head.value);
        return List.turnIntoCSList(tokens.map(function(token) {
            return evaluator.tokenize$2([General.string(token), tail], modifs);
        }));
    }
    return nada;
};

evaluator.indexof$2 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        var str = v0.value;
        var code = v1.value;
        var i = str.indexOf(code);
        return CSNumber.real(i + 1);
    }
    return nada;
};

evaluator.indexof$3 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    var v2 = evaluate(args[2]);
    if (v0.ctype === 'string' && v1.ctype === 'string' && v2.ctype === 'number') {
        var str = v0.value;
        var code = v1.value;
        var start = Math.round(v2.value.real);
        var i = str.indexOf(code, start - 1);
        return CSNumber.real(i + 1);
    }
    return nada;
};

evaluator.parse$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'string') {
        var code = v0.value;
        var prog = analyse(code);
        return evaluate(prog);
    }
    return nada;
};

evaluator.unicode$1 = function(args, modifs) {
    var codepoint, str;
    var arg = evaluate(args[0]);
    var base = 16;
    if (modifs.base) {
        var b = evaluate(modifs.base);
        if (b.ctype === 'number')
            base = b.value.real;
    }
    if (arg.ctype === 'string') {
        codepoint = parseInt(arg.value, base);
    } else if (arg.ctype === 'number') {
        codepoint = arg.value.real;
    } else {
        return nada;
    }
    if (typeof String.fromCodePoint !== "undefined") {
        str = String.fromCodePoint(codepoint);
    } else if (codepoint <= 0xffff) {
        str = String.fromCharCode(codepoint);
    } else {
        var cp = codepoint - 0x10000;
        var hi = (cp >> 10) + 0xd800;
        var lo = (cp & 0x3ff) + 0xdc00;
        str = String.fromCharCode(hi, lo);
    }
    return General.string(str);
};

evaluator.international$1 = function(args, modifs) {
    return evaluator.international$2([args[0], null], modifs);
};

function defaultPluralForm(cnt) {
    return cnt === 1 ? 0 : 1;
}

evaluator.international$2 = function(args, modifs) {
    var arg = evaluate(args[0]);
    if (arg.ctype !== "string") return nada;
    var language = instanceInvocationArguments.language || "en";
    var tr = instanceInvocationArguments.translations || {};
    var trl = tr[language] || {};
    if (!trl.hasOwnProperty(arg.value)) return arg;
    var entry = trl[arg.value];
    if (typeof entry === "string")
        return General.string(entry);
    var pluralform = 0;
    if (args[1] === null)
        return arg;
    var count = evaluate(args[1]);
    if (count.ctype === "number")
        count = count.value.real;
    else
        count = 0;
    var pluralFormFunction = trl._pluralFormFunction || defaultPluralForm;
    var pluralForm = pluralFormFunction(count);
    if (pluralForm < entry.length)
        return General.string(entry[pluralForm]);
    return arg;
};

evaluator.currentlanguage$0 = function(args, modifs) {
    return General.string(instanceInvocationArguments.language || "en");
};

///////////////////////////////
//     Transformations       //
///////////////////////////////

eval_helper.basismap = function(a, b, c, d) {
    var mat = List.turnIntoCSList([a, b, c]);
    mat = List.adjoint3(List.transpose(mat));
    var vv = General.mult(mat, d);
    mat = List.turnIntoCSList([
        General.mult(vv.value[0], a),
        General.mult(vv.value[1], b),
        General.mult(vv.value[2], c)
    ]);
    return List.transpose(mat);

};

evaluator.map$8 = function(args, modifs) {
    var w0 = evaluateAndHomog(args[0]);
    var w1 = evaluateAndHomog(args[1]);
    var w2 = evaluateAndHomog(args[2]);
    var w3 = evaluateAndHomog(args[3]);
    var v0 = evaluateAndHomog(args[4]);
    var v1 = evaluateAndHomog(args[5]);
    var v2 = evaluateAndHomog(args[6]);
    var v3 = evaluateAndHomog(args[7]);
    if (v0 !== nada && v1 !== nada && v2 !== nada && v3 !== nada &&
        w0 !== nada && w1 !== nada && w2 !== nada && w3 !== nada) {
        var m1 = eval_helper.basismap(v0, v1, v2, v3);
        var m2 = eval_helper.basismap(w0, w1, w2, w3);
        var erg = General.mult(m1, List.adjoint3(m2));
        return List.normalizeMax(erg);
    }
    return nada;
};

evaluator.map$6 = function(args, modifs) {
    var w0 = evaluateAndHomog(args[0]);
    var w1 = evaluateAndHomog(args[1]);
    var w2 = evaluateAndHomog(args[2]);
    var inf = List.realVector([0, 0, 1]);
    var cc = List.cross;

    var w3 = cc(cc(w2, cc(inf, cc(w0, w1))),
        cc(w1, cc(inf, cc(w0, w2))));

    var v0 = evaluateAndHomog(args[3]);
    var v1 = evaluateAndHomog(args[4]);
    var v2 = evaluateAndHomog(args[5]);
    var v3 = cc(cc(v2, cc(inf, cc(v0, v1))),
        cc(v1, cc(inf, cc(v0, v2))));

    if (v0 !== nada && v1 !== nada && v2 !== nada && v3 !== nada &&
        w0 !== nada && w1 !== nada && w2 !== nada && w3 !== nada) {
        var m1 = eval_helper.basismap(v0, v1, v2, v3);
        var m2 = eval_helper.basismap(w0, w1, w2, w3);
        var erg = General.mult(m1, List.adjoint3(m2));
        return List.normalizeMax(erg);
    }
    return nada;
};

evaluator.map$4 = function(args, modifs) {
    var ii = List.ii;
    var jj = List.jj;

    var w0 = evaluateAndHomog(args[0]);
    var w1 = evaluateAndHomog(args[1]);
    var v0 = evaluateAndHomog(args[2]);
    var v1 = evaluateAndHomog(args[3]);

    if (v0 !== nada && v1 !== nada &&
        w0 !== nada && w1 !== nada) {
        var m1 = eval_helper.basismap(v0, v1, ii, jj);
        var m2 = eval_helper.basismap(w0, w1, ii, jj);
        var erg = General.mult(m1, List.adjoint3(m2));
        return List.normalizeMax(erg);
    }
    return nada;
};

evaluator.map$2 = function(args, modifs) {
    var ii = List.ii;
    var jj = List.jj;
    var w0 = evaluateAndHomog(args[0]);
    var w1 = General.add(List.realVector([1, 0, 0]), w0);
    var v0 = evaluateAndHomog(args[1]);
    var v1 = General.add(List.realVector([1, 0, 0]), v0);

    if (v0 !== nada && v1 !== nada &&
        w0 !== nada && w1 !== nada) {
        var m1 = eval_helper.basismap(v0, v1, ii, jj);
        var m2 = eval_helper.basismap(w0, w1, ii, jj);
        var erg = General.mult(m1, List.adjoint3(m2));
        return List.normalizeMax(erg);
    }
    return nada;
};

evaluator.pointreflect$1 = function(args, modifs) {
    var ii = List.ii;
    var jj = List.jj;

    var w0 = evaluateAndHomog(args[0]);
    var w1 = General.add(List.realVector([1, 0, 0]), w0);
    var v1 = General.add(List.realVector([-1, 0, 0]), w0);

    if (v1 !== nada && w0 !== nada && w1 !== nada) {
        var m1 = eval_helper.basismap(w0, v1, ii, jj);
        var m2 = eval_helper.basismap(w0, w1, ii, jj);
        var erg = General.mult(m1, List.adjoint3(m2));
        return List.normalizeMax(erg);
    }
    return nada;
};


evaluator.linereflect$1 = function(args, modifs) {
    var ii = List.ii;
    var jj = List.jj;

    var w0 = evaluateAndHomog(args[0]);
    var r0 = List.realVector([Math.random(), Math.random(), Math.random()]);
    var r1 = List.realVector([Math.random(), Math.random(), Math.random()]);
    var w1 = List.cross(r0, w0);
    var w2 = List.cross(r1, w0);

    if (w0 !== nada && w1 !== nada) {
        var m1 = eval_helper.basismap(w1, w2, ii, jj);
        var m2 = eval_helper.basismap(w1, w2, jj, ii);
        var erg = General.mult(m1, List.adjoint3(m2));
        return List.normalizeMax(erg);
    }
    return nada;
};


///////////////////////////////
//         Shapes            //
///////////////////////////////


eval_helper.extractPointVec = function(v1) { //Eventuell Homogen machen
    var erg = {};
    erg.ok = false;
    if (v1.ctype === 'geo') {
        var val = v1.value;
        if (val.kind === "P") {
            erg.x = Accessor.getField(val, "x");
            erg.y = Accessor.getField(val, "y");
            erg.z = CSNumber.real(1);
            erg.ok = true;
            return erg;
        }

    }
    if (v1.ctype !== 'list') {
        return erg;
    }

    var pt1 = v1.value;
    var x = 0;
    var y = 0;
    var z = 0;
    var n1, n2, n3;
    if (pt1.length === 2) {
        n1 = pt1[0];
        n2 = pt1[1];
        if (n1.ctype === 'number' && n2.ctype === 'number') {
            erg.x = n1;
            erg.y = n2;
            erg.z = CSNumber.real(1);
            erg.ok = true;
            return erg;
        }
    }

    if (pt1.length === 3) {
        n1 = pt1[0];
        n2 = pt1[1];
        n3 = pt1[2];
        if (n1.ctype === 'number' && n2.ctype === 'number' && n3.ctype === 'number') {
            erg.x = CSNumber.div(n1, n3);
            erg.y = CSNumber.div(n2, n3);
            erg.z = CSNumber.real(1);
            erg.ok = true;
            return erg;
        }
    }

    return erg;

};


evaluator.polygon$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        var li = [];
        for (var i = 0; i < v0.value.length; i++) {
            var pt = eval_helper.extractPoint(v0.value[i]);
            if (!pt.ok) {
                return nada;
            }
            li[i] = {
                X: pt.x,
                Y: pt.y
            };
        }
        return {
            ctype: "shape",
            type: "polygon",
            value: [li]
        };
    }
    return nada;
};

evaluator.circle$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var pt = eval_helper.extractPointVec(v0);

    if (!pt.ok || v1.ctype !== 'number') {
        return nada;
    }
    var pt2 = List.turnIntoCSList([pt.x, pt.y, pt.z]);
    return {
        ctype: "shape",
        type: "circle",
        value: List.turnIntoCSList([pt2, v1])
    };
};

evaluator.screen$0 = function(args, modifs) {
    var m = csport.drawingstate.initialmatrix;
    var transf = function(px, py) {
        var xx = px - m.tx;
        var yy = py + m.ty;
        var x = (xx * m.d - yy * m.b) / m.det;
        var y = -(-xx * m.c + yy * m.a) / m.det;
        var erg = {
            X: x,
            Y: y
        };
        return erg;
    };
    var erg = [
        transf(0, 0),
        transf(csw, 0),
        transf(csw, csh),
        transf(0, csh)
    ];
    return {
        ctype: "shape",
        type: "polygon",
        value: [erg]
    };
};

evaluator.halfplane$2 = function(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var w0 = evaluateAndHomog(v0);
    var w1 = evaluateAndHomog(v1);
    if (v0 !== nada && v1 !== nada) {
        var u0 = v0.usage;
        var u1 = v1.usage;
        var p = w0;
        var l = w1;
        if (u0 === "Line" || u1 === "Point") {
            p = w1;
            l = w0;
        }
        //OK im Folgenden lässt sich viel optimieren
        var tt = List.turnIntoCSList([l.value[0], l.value[1], CSNumber.zero]);
        var erg = List.cross(tt, p);
        var foot = List.cross(l, erg);
        foot = General.div(foot, foot.value[2]);
        p = General.div(p, p.value[2]);
        var diff = List.sub(p, foot);
        var nn = List.abs(diff);
        diff = General.div(diff, nn);

        var sx = foot.value[0].value.real;
        var sy = foot.value[1].value.real;
        var dx = diff.value[0].value.real * 1000;
        var dy = diff.value[1].value.real * 1000;

        var pp1 = {
            X: sx + dy / 2,
            Y: sy - dx / 2
        };
        var pp2 = {
            X: sx + dy / 2 + dx,
            Y: sy - dx / 2 + dy
        };
        var pp3 = {
            X: sx - dy / 2 + dx,
            Y: sy + dx / 2 + dy
        };
        var pp4 = {
            X: sx - dy / 2,
            Y: sy + dx / 2
        };
        return {
            ctype: "shape",
            type: "polygon",
            value: [
                [pp1, pp2, pp3, pp4]
            ]
        };
    }
    return nada;
};

///////////////////////////////
//   Geometric elements      //
///////////////////////////////

evaluator.element$1 = function(args, modifs) {
    var name = evaluate(args[0]);
    if (name.ctype === "string")
        if (csgeo.csnames.hasOwnProperty(name.value))
            return {
                ctype: "geo",
                value: csgeo.csnames[name.value]
            };
    return nada;
};

// helper for all*(<geoobject>)
eval_helper.all$1 = function(args, filter) {
    var arg = evaluate(args[0]);
    if (arg.ctype !== "geo") return List.nil; // or nada?
    if (!arg.value.incidences) return List.nil;
    return List.ofGeos(arg.value.incidences.map(function(name) {
        return csgeo.csnames[name];
    }).filter(filter));
};

evaluator.allpoints$0 = function(args, modifs) {
    return List.ofGeos(csgeo.points);
};

evaluator.allpoints$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "P";
    });
};

evaluator.allmasses$0 = function(args, modifs) {
    return List.ofGeos(masses);
};

evaluator.allmasses$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "P" &&
            el.behavior && el.behavior.type === "Mass";
    });
};

evaluator.allsprings$0 = function(args, modifs) {
    return List.ofGeos(springs);
};

evaluator.allsprings$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "S" &&
            el.behavior && el.behavior.type === "Spring";
    });
};

evaluator.alllines$0 = function(args, modifs) {
    return List.ofGeos(csgeo.lines);
};

evaluator.alllines$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "L" || el.kind === "S";
    });
};

evaluator.allsegments$0 = function(args, modifs) {
    return List.ofGeos(csgeo.lines.filter(function(el) {
        return el.kind === "S";
    }));
};

evaluator.allsegments$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "S";
    });
};

evaluator.allconics$0 = function(args, modifs) {
    return List.ofGeos(csgeo.conics);
};

evaluator.allconics$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "C";
    });
};

evaluator.allcircles$0 = function(args, modifs) {
    return List.ofGeos(csgeo.conics.filter(function(el) {
        return el.matrix.usage === "Circle";
    }));
};

evaluator.allcircles$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return el.kind === "C" && el.matrix.usage === "Circle";
    });
};

evaluator.allelements$0 = function(args, modifs) {
    return List.ofGeos(csgeo.gslp);
};

evaluator.allelements$1 = function(args, modifs) {
    return eval_helper.all$1(args, function(el) {
        return true;
    });
};

evaluator.elementsatmouse$0 = function(args, modifs) {
    var eps = 0.5;
    var mouse = List.realVector([csmouse[0], csmouse[1], 1]);

    var distMouse = function(p) {
        if (CSNumber._helper.isAlmostZero(p.value[2])) return Infinity;
        var pz = List.normalizeZ(p);
        return List.abs(List.sub(pz, mouse)).value.real;
    };

    var getPerp = function(l) {
        var fp = List.turnIntoCSList([l.value[0], l.value[1], CSNumber.zero]);
        return List.normalizeMax(List.cross(mouse, fp));
    };

    var inciPP = function(p) {
        return (distMouse(p.homog) < eps);
    };

    var inciPL = function(l) {
        var perp = getPerp(l.homog);
        var pp = List.normalizeMax(List.cross(l.homog, perp));
        var d = distMouse(pp);
        return (d < eps);
    };

    var inciPC = function(c) {
        var l = General.mult(c.matrix, mouse);
        var perp = getPerp(l);
        var sect = geoOps._helper.IntersectLC(perp, c.matrix);
        var dists = sect.map(function(el) {
            return distMouse(el);
        });

        var erg = Math.min(dists[0], dists[1]);

        return (erg < eps);
    };

    var points = csgeo.points.filter(inciPP);

    var lines = csgeo.lines.filter(function(el) {
        var val = inciPL(el);
        // fetch segment
        if (val && el.kind === "S") {
            var line = el.homog;
            var tt = List.turnIntoCSList([line.value[0], line.value[1], CSNumber.zero]);
            var cr = List.crossratio3(
                el.farpoint, el.startpos, el.endpos, mouse, tt).value.real;
            if (cr < 0 || cr > 1) val = false;
        }

        return val;
    });

    var conics = csgeo.conics.filter(function(el) {
        var val = inciPC(el);
        // fetch arc
        if (val && el.isArc) {
            var cr = List.crossratio3harm(el.startPoint, el.endPoint,
                el.viaPoint, mouse, List.ii);
            var m = cr.value[0];
            var n = cr.value[1];
            if (!CSNumber._helper.isAlmostZero(m)) {
                n = CSNumber.div(n, m);
                m = CSNumber.real(1);
            } else {
                m = CSNumber.div(m, n);
                n = CSNumber.real(1);
            }
            var nor = List.abs(List.turnIntoCSList([n, m]));
            m = CSNumber.div(m, nor);
            n = CSNumber.div(n, nor);

            var prod = CSNumber.mult(n, m);
            if (m.value.real < 0) prod = CSNumber.neg(prod);

            if (prod.value.real < 0) val = false;
        }
        return val;
    });


    var elts = points.concat(lines, conics);

    return List.ofGeos(elts);
};

evaluator.incidences$1 = evaluator.allelements$1;

evaluator.createpoint$2 = function(args, modifs) {
    var name = evaluate(args[0]);
    var pos = evaluateAndHomog(args[1]);

    if (name.ctype !== "string") {
        printStackTrace("Name must be a string");
        return nada;
    }

    if (pos.ctype !== "list" && List.isNumberVector(pos)) {
        printStackTrace("Position must be a number vector");
        return nada;
    }

    var el = {
        name: name.value,
        type: "Free",
        labeled: true,
        pos: pos
    };

    return {
        'ctype': 'geo',
        'value': addElement(el, true)
    };
};


evaluator.create$3 = function(args, modifs) {
    var names = evaluate(args[0]);
    var type = evaluate(args[1]);
    var defs = evaluate(args[2]);
    var emodifs = {};
    for (var key in modifs) {
        emodifs[key] = evaluateAndVal(modifs[key]);
    }

    var name, el, i;
    if (names.ctype === "string") {
        name = names.value;
    } else if (names.ctype !== "list") {
        printStackTrace("Names must be a string or a list of strings");
        return nada;
    } else if (names.value.length !== 1) {
        // Create the compound object, then Select objects to split it up
        name = General.string(names.value.map(function(name) {
            return name.value;
        }).join("__"));
        el = evaluator.create$3([name, type, defs], emodifs);
        var ellist = [];
        if (el !== nada) {
            type = General.string(el.value.kind.replace(/^(.*)s$/, "Select$1"));
            defs = List.turnIntoCSList([General.string(el.value.name)]);
            for (i = 0; i < names.value.length; ++i) {
                emodifs.index = CSNumber.real(i + 1);
                ellist.push(
                    evaluator.create$3([names.value[i], type, defs], emodifs)
                );
            }
        }
        return List.turnIntoCSList(ellist);
    } else if (names.value[0].ctype !== "string") {
        printStackTrace("Element of names list must be a string");
        return nada;
    } else {
        name = names.value[0].value;
    }
    if (type.ctype !== "string") {
        printStackTrace("Type must be a string");
        return nada;
    }
    if (defs.ctype !== "list") {
        printStackTrace("Arguments must be a list");
        return nada;
    }

    if (!geoOps.hasOwnProperty(type.value) &&
        !geoAliases.hasOwnProperty(type.value) &&
        !geoMacros.hasOwnProperty(type.value)) {
        printStackTrace("Invalid geometric operation: '" + type.value + "'");
        return nada;
    }

    var a = [];
    var pos = null;

    for (i = 0; i < defs.value.length; i++) {
        var def = defs.value[i];

        if (def.ctype === "string") {
            a.push(def.value);
        } else if (def.ctype === "geo") {
            a.push(def.value.name);
        } else {
            var vec = evaluateAndHomog(def);
            if (vec !== nada) {
                pos = vec;
            } else {
                printStackTrace("Unknown argument type");
                return nada;
            }
        }
    }

    el = {
        name: name,
        type: type.value,
        labeled: true
    };

    if (pos)
        el.pos = pos;

    if (a.length > 0)
        el.args = a;

    for (var field in emodifs) {
        el[field] = General.unwrap(emodifs[field]);
    }

    return {
        'ctype': 'geo',
        'value': addElement(el, true)
    };
};

evaluator.create$2 = function(args, modifs) {
    var type = evaluate(args[0]);
    var defs = evaluate(args[1]);
    var emodifs = {};
    for (var key in modifs) {
        emodifs[key] = evaluateAndVal(modifs[key]);
    }

    if (!geoOps.hasOwnProperty(type.value) &&
        !geoAliases.hasOwnProperty(type.value) &&
        !geoMacros.hasOwnProperty(type.value)) {
        printStackTrace("Invalid geometric operation: '" + type.value + "'");
        return nada;
    }

    // Recursively apply aliases
    while (geoAliases.hasOwnProperty(type.value)) {
        type.value = geoAliases[type.value];
    }

    // Detect unsupported operations or missing or incorrect arguments
    var op = geoOps[type.value];


    function getFirstFreeName(kind) {
        var ans = false;

        function useiffree(name) {
            if (!csgeo.csnames[name]) {
                ans = name;
            }
        }
        var name, i;
        if (kind === 'P') {
            for (i = 0; i < 26 & !ans; i++) {
                if (i === 8 || i === 9) continue; //skip I and J
                useiffree(String.fromCharCode(65 + i)); //A, B, C...
            }
        } else if (kind === 'L' || kind === 'S') {
            for (i = 0; i < 26 & !ans; i++) {
                if (i === 8 || i === 9) continue; //skip i and j
                useiffree(String.fromCharCode(97 + i)); //a, b, c...
            }
        }
        for (i = 0; !ans; i++) {
            useiffree(kind + i); //P0, P1, P2, ...
        }
        return ans;
    }

    var name = General.string(getFirstFreeName(op.kind));


    if (defs.value.length > op.signature.length) {
        var warning = "Operation " + type.value + " requieres only " + op.signature.length + " argument" + (op.signature.length === 1 ? '' : 's') + " (" + defs.value.length + " argument" + (defs.value.length === 1 ? '' : 's') + " given) to create " + name.value + ". Ignoring the last arguments.";
        if (!emodifs.pos) {
            var pos = evaluateAndHomog(defs.value[defs.value.length - 1]); //interpret last argument as pos
            if (pos !== nada) {
                warning = warning + " Use the last argument as modifier `pos`.";
                emodifs.pos = pos;
            }
        }
        printStackTrace(warning);
        defs = List.turnIntoCSList(defs.value.slice(0, op.signature.length)); //ignore additional defs
    }

    var el = evaluator.create$3([name, type, defs], emodifs);
    if (el !== nada && el.value.kind[1] === 's' && el.value.results) { //Ps, Ls, etc.
        type = General.string("Select" + el.value.kind[0]);
        defs = List.turnIntoCSList([General.string(el.value.name)]);

        if (emodifs.pos) {
            //if there is a pos attribute (or the defs list is to long), then select only the given point
            name = General.string(getFirstFreeName(el.value.kind[0]));
            return evaluator.create$3([name, type, defs], emodifs);
        } else {
            //if a compound is generated with no pos specified, then the list of all points is returned.
            var ellist = [];
            for (var i = 0; i < el.value.results.value.length; i++) {
                emodifs.index = CSNumber.real(i + 1);
                name = General.string(getFirstFreeName(el.value.kind[0]));
                ellist.push(evaluator.create$3([name, type, defs], emodifs));
            }
            return List.turnIntoCSList(ellist);
        }

    } else {
        if (el.isDuplicate) delete el.isDuplicate;
        return el;
    }

};

///////////////////////////////
//   Calling external code   //
///////////////////////////////

evaluator.javascript$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'string') {
        var s = v0.value;
        var f = new Function(s); // jshint ignore:line
        f.call(globalInstance); // run code, with CindyJS instance as "this".
    }
    return nada;
};

evaluator.use$1 = function(args, modifs) {
    function defineFunction(name, arity, impl) {
        evaluator[name.toLowerCase() + "$" + arity] = impl;
    }
    var v0 = evaluate(args[0]);
    if (v0.ctype === "string") {
        var name = v0.value,
            cb;
        if (instanceInvocationArguments.plugins)
            cb = instanceInvocationArguments.plugins[name];
        if (!cb)
            cb = CindyJS._pluginRegistry[name];
        if (cb) {
            /* The following object constitutes API for third-party plugins.
             * We should feel committed to maintaining this API.
             */
            cb({
                "instance": globalInstance,
                "config": instanceInvocationArguments,
                "nada": nada,
                "evaluate": evaluate,
                "extractPoint": eval_helper.extractPoint,
                "evaluateAndVal": evaluateAndVal,
                "defineFunction": defineFunction,
                "addShutdownHook": shutdownHooks.push.bind(shutdownHooks),
                "addAutoCleaningEventListener": addAutoCleaningEventListener,
                "getVariable": namespace.getvar.bind(namespace),
                "getInitialMatrix": function() {
                    return csport.drawingstate.initialmatrix;
                },
                "setTextRenderer": function(handlerCanvas, handlerHtml) {
                    textRendererCanvas = handlerCanvas;
                    if (handlerHtml) textRendererHtml = handlerHtml;
                },
                "getImage": function(name, lazy) {
                    if (typeof name === "string")
                        name = General.string(name);
                    var img = imageFromValue(name);
                    if (!img) return null;
                    if (!lazy && img.cdyUpdate)
                        img.cdyUpdate();
                    return img;
                },
                "getMyfunction": function(name) {
                    if (!myfunctions.hasOwnProperty(name))
                        return null;
                    return myfunctions[name];
                }
            });
            return {
                "ctype": "boolean",
                "value": true
            };
        } else {
            printStackTrace("Plugin " + name + " not found");
            return {
                "ctype": "boolean",
                "value": false
            };
        }
    }
    return nada;
};

evaluator.format$2 = function(args, modifs) { //TODO Angles
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    var dec;

    function fmtNumber(n) {
        var erg = n.toFixed(dec),
            erg1;
        do {
            erg1 = erg;
            erg = erg.substring(0, erg.length - 1);
        } while (erg !== "" && erg !== "-" && +erg === +erg1);
        var tmp = "" + erg1;
        if (modifs.delimiter && modifs.delimiter.ctype === "string") {
            tmp = tmp.replace(".", modifs.delimiter.value);
        }
        return tmp;
    }

    function fmt(v) {
        var r, i, erg;
        if (v.ctype === 'number') {
            r = fmtNumber(v.value.real);
            i = fmtNumber(v.value.imag);
            if (i === "0")
                erg = r;
            else if (i.substring(0, 1) === "-")
                erg = r + " - i*" + i.substring(1);
            else
                erg = r + " + i*" + i;
            return {
                "ctype": "string",
                "value": erg
            };
        }
        if (v.ctype === 'list') {
            return {
                "ctype": "list",
                "value": v.value.map(fmt)
            };
        }
        return {
            "ctype": "string",
            "value": niceprint(v).toString()
        };
    }
    if ((v0.ctype === 'number' || v0.ctype === 'list') && v1.ctype === 'number') {
        dec = Math.max(0, Math.min(20, Math.round(v1.value.real)));
        return fmt(v0);
    }
    return nada;
};

///////////////////////////////
//     Date and time         //
///////////////////////////////

if (!Date.now) Date.now = function() {
    return new Date().getTime();
};
var epoch = 0;

evaluator.timestamp$0 = function(args, modifs) {
    return CSNumber.real(Date.now());
};

evaluator.seconds$0 = function(args, modifs) { //OK
    return CSNumber.real((Date.now() - epoch) / 1000);
};

evaluator.resetclock$0 = function(args, modifs) {
    epoch = Date.now();
    return nada;
};

evaluator.time$0 = function(args, modifs) {
    var now = new Date();
    return List.realVector([
        now.getHours(), now.getMinutes(),
        now.getSeconds(), now.getMilliseconds()
    ]);
};

evaluator.date$0 = function(args, modifs) {
    var now = new Date();
    return List.realVector([
        now.getFullYear(), now.getMonth() + 1, now.getDate()
    ]);
};

evaluator.simulationtime$0 = function(args, modifs) {
    return CSNumber.real(simtime * simunit);
};

evaluator.settimeout$2 = function(args, modifs) {
    var delay = evaluate(args[0]); // delay in seconds
    var code = args[1]; // code to execute, cannot refer to regional variables
    function callback() {
        evaluate(code);
        scheduleUpdate();
    }
    if (delay.ctype === "number") {
        if (typeof window !== "undefined") {
            window.setTimeout(callback, delay.value.real * 1000.0);
        }
    }
    return nada;
};

/***********************************/
/**********    WEBGL     ***********/
/***********************************/

eval_helper.formatForWebGL = function(x) {
    return x.toFixed(10);
};

evaluator.generateWebGL$2 = function(args, modifs) {
    var f = eval_helper.formatForWebGL;
    var expr = args[0];
    var vars = evaluate(args[1]);
    console.log(vars);
    if (vars.ctype !== "list") {
        return nada;
    }

    var varlist = [];
    for (var i = 0; i < vars.value.length; i++) {
        if (vars.value[i].ctype === "string") {
            varlist.push(vars.value[i].value);

        }
    }
    console.log("***********");
    console.log(varlist);
    var li = eval_helper.plotvars(expr);
    console.log(li);

    if (li.indexOf("a") === -1 && li.indexOf("b") === -1 && li.indexOf("c") === -1 && li.indexOf("d") === -1 && li.indexOf("e") === -1 && li.indexOf("f") === -1) {
        var erg = evaluateAndVal(expr);
        expr = erg;

    }

    //   dump(expr);
    if (expr.ctype === "number") {
        return {
            "ctype": "string",
            "value": "vec2(" + f(expr.value.real) + "," + f(expr.value.imag) + ")"
        };
    }
    if (expr.ctype === "variable") {

        return {
            "ctype": "string",
            "value": expr.name
        };
    }
    if (expr.ctype === "string" || expr.ctype === "void") {
        return expr;
    }
    var a, b;
    if (expr.args.length === 2) {
        if (expr.ctype === "infix" || expr.ctype === "function") {
            a = evaluator.compileToWebGL$1([expr.args[0]], {});
            b = evaluator.compileToWebGL$1([expr.args[1]], {});
            if (expr.oper === "+" || expr.oper === "add") {
                if (a.value === undefined || a.ctype === "void") {
                    return {
                        "ctype": "string",
                        "value": b.value
                    };

                } else {
                    return {
                        "ctype": "string",
                        "value": "addc(" + a.value + "," + b.value + ")"
                    };
                }

            }
            if (expr.oper === "*" || expr.oper === "mult") {
                return {
                    "ctype": "string",
                    "value": "multc(" + a.value + "," + b.value + ")"
                };
            }
            if (expr.oper === "/" || expr.oper === "div") {
                return {
                    "ctype": "string",
                    "value": "divc(" + a.value + "," + b.value + ")"
                };
            }
            if (expr.oper === "-" || expr.oper === "sub") {
                if (a.value === undefined || a.ctype === "void") {
                    return {
                        "ctype": "string",
                        "value": "negc(" + b.value + ")"
                    };

                } else {
                    return {
                        "ctype": "string",
                        "value": "subc(" + a.value + "," + b.value + ")"
                    };
                }
            }
            if (expr.oper === "^" || expr.oper === "pow") {
                return {
                    "ctype": "string",
                    "value": "powc(" + a.value + "," + b.value + ")"
                };
            }
        }
    }

    if ((expr.ctype === "function") && (expr.args.length === 1)) {
        a = evaluator.compileToWebGL$1([expr.args[0]], {});
        if (expr.oper === "sin$1") {
            return {
                "ctype": "string",
                "value": "sinc(" + a.value + ")"
            };
        }
        if (expr.oper === "cos$1") {
            return {
                "ctype": "string",
                "value": "cosc(" + a.value + ")"
            };
        }
        if (expr.oper === "tan$1") {
            return {
                "ctype": "string",
                "value": "tanc(" + a.value + ")"
            };
        }
        if (expr.oper === "exp$1") {
            return {
                "ctype": "string",
                "value": "expc(" + a.value + ")"
            };
        }
        if (expr.oper === "log$1") {
            return {
                "ctype": "string",
                "value": "logc(" + a.value + ")"
            };
        }
        if (expr.oper === "arctan$1") {
            return {
                "ctype": "string",
                "value": "arctanc(" + a.value + ")"
            };
        }
        if (expr.oper === "arcsin$1") {
            return {
                "ctype": "string",
                "value": "arcsinc(" + a.value + ")"
            };
        }
        if (expr.oper === "arccos$1") {
            return {
                "ctype": "string",
                "value": "arccosc(" + a.value + ")"
            };
        }
        if (expr.oper === "sqrt$1") {
            return {
                "ctype": "string",
                "value": "sqrtc(" + a.value + ")"
            };
        }
    }

    return nada;

};


evaluator.compileToWebGL$1 = function(args, modifs) {
    var a, b;
    var f = eval_helper.formatForWebGL;
    var expr = args[0];
    var li = eval_helper.plotvars(expr);

    if (li.indexOf("a") === -1 && li.indexOf("b") === -1 && li.indexOf("c") === -1 && li.indexOf("d") === -1 && li.indexOf("e") === -1 && li.indexOf("f") === -1) {
        var erg = evaluateAndVal(expr);
        expr = erg;

    }

    //   dump(expr);
    if (expr.ctype === "number") {
        return {
            "ctype": "string",
            "value": "vec2(" + f(expr.value.real) + "," + f(expr.value.imag) + ")"
        };
    }
    if (expr.ctype === "variable") {

        return {
            "ctype": "string",
            "value": expr.name
        };
    }
    if (expr.ctype === "string" || expr.ctype === "void") {
        return expr;
    }
    if (expr.args.length === 2) {
        if (expr.ctype === "infix" || expr.ctype === "function") {
            a = evaluator.compileToWebGL$1([expr.args[0]], {});
            b = evaluator.compileToWebGL$1([expr.args[1]], {});
            if (expr.oper === "+" || expr.oper === "add") {
                if (a.value === undefined || a.ctype === "void") {
                    return {
                        "ctype": "string",
                        "value": b.value
                    };

                } else {
                    return {
                        "ctype": "string",
                        "value": "addc(" + a.value + "," + b.value + ")"
                    };
                }

            }
            if (expr.oper === "*" || expr.oper === "mult") {
                return {
                    "ctype": "string",
                    "value": "multc(" + a.value + "," + b.value + ")"
                };
            }
            if (expr.oper === "/" || expr.oper === "div") {
                return {
                    "ctype": "string",
                    "value": "divc(" + a.value + "," + b.value + ")"
                };
            }
            if (expr.oper === "-" || expr.oper === "sub") {
                if (a.value === undefined || a.ctype === "void") {
                    return {
                        "ctype": "string",
                        "value": "negc(" + b.value + ")"
                    };

                } else {
                    return {
                        "ctype": "string",
                        "value": "subc(" + a.value + "," + b.value + ")"
                    };
                }
            }
            if (expr.oper === "^" || expr.oper === "pow") {
                return {
                    "ctype": "string",
                    "value": "powc(" + a.value + "," + b.value + ")"
                };
            }
        }
    }
    if ((expr.ctype === "function") && (expr.args.length === 1)) {
        a = evaluator.compileToWebGL$1([expr.args[0]], {});

        if (expr.oper === "sin$1") {
            return {
                "ctype": "string",
                "value": "sinc(" + a.value + ")"
            };
        }
        if (expr.oper === "cos$1") {
            return {
                "ctype": "string",
                "value": "cosc(" + a.value + ")"
            };
        }
        if (expr.oper === "tan$1") {
            return {
                "ctype": "string",
                "value": "tanc(" + a.value + ")"
            };
        }
        if (expr.oper === "exp$1") {
            return {
                "ctype": "string",
                "value": "expc(" + a.value + ")"
            };
        }
        if (expr.oper === "log$1") {
            return {
                "ctype": "string",
                "value": "logc(" + a.value + ")"
            };
        }
        if (expr.oper === "arctan$1") {
            return {
                "ctype": "string",
                "value": "arctanc(" + a.value + ")"
            };
        }
        if (expr.oper === "arcsin$1") {
            return {
                "ctype": "string",
                "value": "arcsinc(" + a.value + ")"
            };
        }
        if (expr.oper === "arccos$1") {
            return {
                "ctype": "string$1",
                "value": "arccosc(" + a.value + ")"
            };
        }
        if (expr.oper === "sqrt$1") {
            return {
                "ctype": "string",
                "value": "sqrtc(" + a.value + ")"
            };
        }
    }
    return nada;
};


/************************************/
/**********    PHYSICS    ***********/
/************************************/


evaluator.setsimulationspeed$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        setSpeed(v0.value.real);
    }
    return nada;
};

evaluator.setsimulationaccuracy$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        if (typeof(labObjects) !== "undefined" && typeof(labObjects.env) !== "undefined") {
            labObjects.env.accuracy = Math.max(1, v0.value.real | 0);
        }
    }
    return nada;
};

evaluator.setsimulationquality$1 = function(args, modifs) {

    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        if (typeof(labObjects) !== "undefined" && typeof(labObjects.env) !== "undefined") {
            var qual = v0.value.real;
            if (qual === 0) {
                labObjects.env.errorbound = 0.01;
                labObjects.env.lowestdeltat = 0.00001;
                labObjects.env.slowdownfactor = 2;
            }
            if (qual === 1) {
                labObjects.env.errorbound = 0.001;
                labObjects.env.lowestdeltat = 0.0000001;
                labObjects.env.slowdownfactor = 2;
            }
            if (qual === 2) {
                labObjects.env.errorbound = 0.00001;
                labObjects.env.lowestdeltat = 0.0000000001;
                labObjects.env.slowdownfactor = 4;
            }
            if (qual === 3) {
                labObjects.env.errorbound = 0.000001;
                labObjects.env.lowestdeltat = 0.000000000001;
                labObjects.env.slowdownfactor = 4;
            }
        }
    }
    return nada;
};

var activeButton = null;
var statusbar = null;

evaluator.createtool$3 = function(args, modifs) {
    var modif;
    var xref = "left";
    var yref = "top";

    var space = null;
    if (modifs.space) {
        modif = evaluate(modifs.space);
        if (modif.ctype === "number") {
            space = modif.value.real / 2;
        }
    }

    var toolbar = null;
    if (modifs.toolbar) {
        modif = evaluate(modifs.toolbar);
        if (modif.ctype === "string") {
            toolbar = document.getElementById(modif.value);
            if (!toolbar)
                console.warn("Element #" + modif.value + " not found");
        }
    }
    if (!toolbar) {
        if (modifs.reference) {
            var ref = evaluate(modifs.reference);
            if (ref.ctype === "string") {
                switch (ref.value) {
                    case "UR":
                        xref = "right";
                        break;
                    case "LL":
                        yref = "bottom";
                        break;
                    case "LR":
                        xref = "right";
                        yref = "bottom";
                }
            }
        }
        toolbar = document.createElement("div");
        toolbar.className = "CindyJS-toolbar";
        canvas.parentNode.appendChild(toolbar);
        var x = evaluate(args[1]);
        var y = evaluate(args[2]);
        if (x.ctype === "number")
            toolbar.style[xref] = x.value.real + "px";
        if (y.ctype === "number")
            toolbar.style[yref] = y.value.real + "px";
        if (space !== null)
            toolbar.style.margin = (-space) + "px";
    }

    var names = evaluate(args[0]);
    if (names.ctype === "string") {
        names = [
            [names.value]
        ];
    } else if (names.ctype === "list") {
        names = names.value.map(function(row) {
            if (row.ctype === "string") {
                return [row.value];
            } else if (row.ctype === "list") {
                return row.value.map(function(name) {
                    if (name.ctype === "string") {
                        return name.value;
                    } else {
                        return null;
                    }
                });
            } else {
                return [null];
            }
        });
    } else {
        printStackTrace("Name must be a string or a list of strings");
        return nada;
    }

    if (modifs.flipped) {
        modif = evaluate(modifs.flipped);
        if (modif.ctype === "boolean" && modif.value) {
            printStackTrace("Flipping");
            var ncols = 0;
            var nrows = names.length;
            names.forEach(function(row) {
                if (row.length > ncols)
                    ncols = row.length;
            });
            var flipped = [];
            for (var i = 0; i < ncols; ++i) {
                flipped[i] = [];
                for (var j = 0; j < nrows; ++j) {
                    flipped[i][j] = names[j][i] || null;
                }
            }
            names = flipped;
        }
    }

    if (yref === "bottom") names.reverse();
    names.forEach(function(row) {
        if (xref === "right") row.reverse();
        var rowElt = document.createElement("div");
        toolbar.appendChild(rowElt);
        row.forEach(function(name) {
            if (!tools.hasOwnProperty(name)) {
                printStackTrace("Tool '" + name + "' not implemented yet.");
                name = null;
            }
            if (name === null) {
                var spacer = document.createElement("span");
                spacer.className = "CindyJS-spacer";
                rowElt.appendChild(spacer);
                return;
            }
            var button = document.createElement("button");
            var img = document.createElement("img");
            img.src = CindyJS.getBaseDir() + "images/" + name + ".png";
            button.appendChild(img);

            function click() {
                if (activeButton)
                    activeButton.classList.remove("CindyJS-active");
                activeButton = button;
                button.classList.add("CindyJS-active");
                setActiveTool(name);
            }

            button.addEventListener("click", click);
            if (!activeButton) click();
            if (space !== null) button.style.margin = space + "px";
            rowElt.appendChild(button);
        });
    });

    return nada;
};

evaluator.dropped$0 = function() {
    return dropped;
};


evaluator.droppoint$0 = function() {
    return dropPoint;
};

evaluator.parsecsv$1 = function(args, modifs) {
    var autoconvert = true;
    var mcon = evaluateAndVal(modifs.autoconvert);
    if (mcon.ctype === "boolean") autoconvert = mcon.value;

    var delim = null;
    var md = evaluateAndVal(modifs.delimiter);
    if (md.ctype === "string" && /^[^\"\r\n]$/.test(md.value))
        delim = md.value;

    var str = evaluateAndVal(args[0]);
    if (str.ctype !== "string") {
        printStackTrace("CSV data is not a string");
        return nada;
    }
    str = str.value;

    var re = '(?:"((?:[^"]+|"")*)"|([^]*?))(\r\n|(,)|[\r\n]|$)';
    // captures:  1             1  2     2 3     4 4         3
    if (delim) {
        // see replace$3
        delim = delim
            .replace(/[^A-Za-z0-9]/g, "\\$&")
            .replace(/\$/g, "$$$$");
        re = re.replace(/,/g, delim);
    }
    re = new RegExp(re, "g");

    var row = [];
    var data = [];
    var ncols = null;
    while (re.lastIndex < str.length) {
        var match = re.exec(str);
        var itm = match[2];
        if (typeof match[1] === "string")
            itm = match[1].replace(/""/g, '"');
        if (!autoconvert)
            itm = General.string(itm);
        else if (/^[Tt]rue$/.test(itm))
            itm = General.bool(true);
        else if (/^[Ff]alse$/.test(itm))
            itm = General.bool(false);
        else if (/^[\-+]?([0-9]+(\.[0-9]*)?|\.[0-9]+|Infinity)$/.test(itm))
            itm = CSNumber.real(Number(itm));
        else
            itm = General.string(itm);
        row.push(itm);
        if (match[4] && re.lastIndex === str.length) {
            // last row ended with a delimiter
            row.push(General.string(""));
            match = {}; // fall through to end-of-input handling below
        }
        if (!match[4]) { // end of row
            if (ncols === null)
                ncols = row.length;
            if (ncols < row.length) {
                ncols = row.length;
                for (var i = 0; i < data.length; ++i)
                    for (var j = data[i].length; j < ncols; ++j)
                        data[i][j] = nada;
            } else if (ncols > row.length) {
                for (var k = row.length; k < ncols; ++k)
                    row[k] = nada;
            }
            data.push(row);
            row = [];
        }
    }
    return List.turnIntoCSList(data.map(List.turnIntoCSList));
};

evaluator.load$2 = function(args, modifs) {
    return evaluator.load$3([args[0], null, args[1]], modifs);
};

evaluator.load$3 = function(args, modifs) {
    var varname = '#';
    if (args[1] !== null) {
        if (args[1].ctype === 'variable') {
            varname = args[1].name;
        }
    }
    var arg0 = evaluateAndVal(args[0]);
    var url = null;
    var req = null;
    if (arg0.ctype === "string" && /^https?:\/\//.test(arg0.value)) {
        url = arg0.value;
    }
    if (url !== null) {
        req = new XMLHttpRequest();
        req.onreadystatechange = handleStateChange;
        req.open("GET", url);
        req.send();
        return General.bool(true);
    }
    return nada;

    function handleStateChange() {
        if (req.readyState !== XMLHttpRequest.DONE) return;
        var value;
        if (req.status === 200) {
            value = General.string(String(req.responseText));
        } else {
            printStackTrace("Failed to load " + url + ": " + req.statusText);
            value = nada;
        }
        namespace.newvar(varname);
        namespace.setvar(varname, value);
        evaluate(args[2]);
        namespace.removevar(varname);
        scheduleUpdate();
    }

};

evaluator.removeelement$1 = function(args, modifs) {
    var arg = evaluate(args[0]);
    if (arg.ctype === "geo") removeElement(arg.value.name);
    else console.log("argument of removeelement is undefined or not of type <geo>");
};
