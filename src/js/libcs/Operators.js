//*******************************************************
// and here are the definitions of the operators
//*******************************************************


evaluator.seconds$0 = function(args, modifs) { //OK
    return {
        "ctype": "number",
        "value": {
            'real': (new Date().getTime() / 1000),
            'imag': 0
        }
    };
};


evaluator.err$1 = function(args, modifs) { //OK

    if (typeof csconsole === "undefined") {
        csconsole = window.open('', '', 'width=200,height=100');

    }

    var varname = '',
        s;
    if (args[0].ctype === 'variable') {
        varname = args[0].name;
        s = namespace.getvar(args[0].name);
    } else {
        s = args[0];
    }
    s = varname + " ===> " + niceprint(evaluate(s));
    if (console && console.log)
        console.log(s);
    if (csconsole)
        csconsole.document.write(s + "<br>");
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

evaluator.println$1 = function(args, modifs) {
    console.log(niceprint(evaluate(args[0])));
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
    var erg;
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
    var erg = [];
    for (var i = 0; i < args.length; i++) {
        erg[i] = evaluate(args[i]);
    }
    return {
        'ctype': 'list',
        'value': erg
    };
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
    if (where && field) {
        Accessor.setField(where.value, field, what);
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
            console.error("Can't use infix expression as lvalue");
        }
    } else if (args[0].ctype === 'field') {
        eval_helper.assigndot(args[0], v1);
    } else if (args[0].ctype === 'function' && args[0].oper === 'genList') {
        if (v1.ctype === "list") {
            eval_helper.assignlist(args[0].args, v1.value);
        } else {
            console.error("Expected list in rhs of assignment");
        }
    } else {
        console.error("Left hand side of assignment is not a recognized lvalue");
    }
    return v1;
}


function infix_define(args, modifs) {

    var u0 = (args[0].ctype === 'undefined');
    var u1 = (args[1].ctype === 'undefined');

    if (u0 || u1) {
        return nada;
    }
    if (args[0].ctype === 'function') {
        var fname = args[0].oper;
        var ar = args[0].args;
        var body = args[1];
        myfunctions[fname] = {
            'oper': fname,
            'body': body,
            'arglist': ar
        };
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
    }

    return nada;

};

function comp_equals(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return {
            'ctype': 'boolean',
            'value': (v0.value.real === v1.value.real) &&
                (v0.value.imag === v1.value.imag)
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
        var erg = List.equals(v0, v1);
        return erg;
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


function prefix_not(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'void' && v1.ctype === 'boolean') {
        return {
            'ctype': 'boolean',
            'value': (!v1.value)
        };
    }

    return nada;
}


function postfix_numb_degree(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'number' && v1.ctype === 'void') {
        return CSNumber.mult(v0, CSNumber.real(Math.PI / 180));
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
                'value': (v0.value.real > v1.value.real + CSNumber.eps)
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
                'value': (v0.value.real > v1.value.real - CSNumber.eps)
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
                'value': (v0.value.real < v1.value.real - CSNumber.eps)
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
                'value': (v0.value.real < v1.value.real + CSNumber.eps)
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
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    return General.add(v0, v1);
}

evaluator.sub$2 = infix_sub;

function infix_sub(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);

    if (v0.ctype === 'void' && v1.ctype === 'number') { //Monadisches Plus
        return CSNumber.neg(v1);
    }

    if (v0.ctype === 'void' && v1.ctype === 'list') { //Monadisches Plus
        return List.neg(v1);
    }

    if (v0.ctype === 'number' && v1.ctype === 'number') {
        return CSNumber.sub(v0, v1);
    }
    if (v0.ctype === 'list' && v1.ctype === 'list') {
        return List.sub(v0, v1);
    }
    return nada;
}

evaluator.mult$2 = infix_mult;

function infix_mult(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    return General.mult(v0, v1);
}

evaluator.div$2 = infix_div;

function infix_div(args, modifs) {
    var v0 = evaluateAndVal(args[0]);
    var v1 = evaluateAndVal(args[1]);
    return General.div(v0, v1);
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
        s = CSNumber.real(0.0);
        q = CSNumber.real(0.0);
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
            a = CSNumber.mult(CSNumber.add(CSNumber.abs(x), CSNumber.real(1.0)), CSNumber.complex(Math.cos(iter), Math.sin(iter)));
        if (CSNumber._helper.isLessThan(CSNumber.abs(a), CSNumber.real(tol)))
            return x;
        if (iter % 20 === 0)
            a = CSNumber.mult(a, CSNumber.real(rand[iter / 20]));
        x = CSNumber.sub(x, a);
    }
    return x;
};

evaluator.roots$1 = function(args, modifs) {
    var cs = evaluateAndVal(args[0]);
    if (cs.ctype === 'list') {
        var i;
        for (i = 0; i < cs.value.length; i++)
            if (cs.value[i].ctype !== 'number')
                return nada;

        var roots = [];
        var cs_orig = cs;
        var n = cs.value.length - 1;
        for (i = 0; i < n; i++) {
            roots[i] = eval_helper.laguerre(cs, CSNumber.zero, 200);
            roots[i] = eval_helper.laguerre(cs_orig, roots[i], 1);
            var fx = [];
            fx[n - i] = cs.value[n - i];
            for (var j = n - i; j > 0; j--)
                fx[j - 1] = CSNumber.add(cs.value[j - 1], CSNumber.mult(fx[j], roots[i]));
            fx.shift();
            cs = List.turnIntoCSList(fx);
        }
        return List.sort1(List.turnIntoCSList(roots));
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
        console.log("could not parse function");
        return nada;
    }
    var xarr = evaluateAndVal(args[1]);
    var grade = evaluateAndVal(args[2]);

    if (grade.value.real < 1) {
        console.log("grade cant be < 1");
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
    }
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

evaluator.isnumbermatrix$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if ((List.isNumberMatrix(v0)).value) {
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

evaluator.isnumbervector$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if ((List.isNumberVector(v0)).value) {
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


evaluator.cross$2 = function(args, modifs) {
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
    if (List.isNumberMatrix(costMatrix)) {
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
    if (v1.ctype === 'number') {
        var ind = Math.floor(v1.value.real);
        if (v0.ctype === 'list' || v0.ctype === 'string') {
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
            }
            return nada;
        }
    }
    if (v1.ctype === 'list') { //Hab das jetzt mal rekursiv gemacht, ist anders als in Cindy
        var li = [];
        for (var i = 0; i < v1.value.length; i++) {
            var v1i = evaluateAndVal(v1.value[i]);
            li[i] = infix_take([v0, v1i], []);
        }
        return List.turnIntoCSList(li);
    }
    return nada;
}


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
    if (v0.ctype === 'list' && v1.ctype === 'list') {
        return List.concat(v0, v1);
    }
    if (v0.ctype === 'shape' && v1.ctype === 'shape') {
        return eval_helper.shapeconcat(v0, v1);
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
        li = [];
        var n = 36;
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
            value: move.mover,
            type: "P"
        };
    else
        console.log("Not moving anything at the moment");
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


evaluator.replace$3 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    var v2 = evaluate(args[2]);
    if (v0.ctype === 'string' && v1.ctype === 'string' && v2.ctype === 'string') {
        var str0 = v0.value;
        var str1 = v1.value;
        var str2 = v2.value;
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


evaluator.tokenize$2 = function(args, modifs) { //TODO der ist gerade sehr uneffiktiv implementiert
    var li, i;
    var v0 = evaluate(args[0]);
    var v1 = evaluate(args[1]);
    if (v0.ctype === 'string' && v1.ctype === 'string') {
        var convert = true;
        if (modifs.autoconvert !== undefined) {
            var erg = evaluate(modifs.autoconvert);
            if (erg.ctype === 'boolean') {
                convert = erg.value;
            }
        }


        var str = v0.value;
        var split = v1.value;
        var splitlist = str.split(split);
        li = [];
        for (i = 0; i < splitlist.length; i++) {
            var val = splitlist[i];
            if (convert) {
                var fl = parseFloat(val);
                if (!isNaN(fl))
                    val = fl;
            }
            li[i] = {
                ctype: "string",
                value: val
            };
        }
        return List.turnIntoCSList(li);
    }
    if (v0.ctype === 'string' && v1.ctype === 'list') {
        if (v1.value.length === 0) {
            return v0;
        }

        var token = v1.value[0];

        var tli = List.turnIntoCSList(tokens);
        var firstiter = evaluator.tokenize$2([args[0], token], modifs).value;

        li = [];
        for (i = 0; i < firstiter.length; i++) {
            var tokens = [];
            for (var j = 1; j < v1.value.length; j++) { //TODO: Das ist Notlösung weil ich das wegen 
                tokens[j - 1] = v1.value[j]; //CbV und CbR irgendwie anders nicht hinbekomme
            }

            tli = List.turnIntoCSList(tokens);
            li[i] = evaluator.tokenize$2([firstiter[i], tli], modifs);
        }
        return List.turnIntoCSList(li);
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
        var code = condense(v0.value);
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
    mat = List.inverse(List.transpose(mat));
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
        var erg = General.mult(m1, List.inverse(m2));
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
        var erg = General.mult(m1, List.inverse(m2));
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
        var erg = General.mult(m1, List.inverse(m2));
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
        var erg = General.mult(m1, List.inverse(m2));
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
        var erg = General.mult(m1, List.inverse(m2));
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
        var erg = General.mult(m1, List.inverse(m2));
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

evaluator.allpoints$0 = function(args, modifs) {
    var erg = [];
    for (var i = 0; i < csgeo.points.length; i++) {
        erg[i] = {
            ctype: "geo",
            value: csgeo.points[i],
            type: "P"
        };
    }
    return {
        ctype: "list",
        value: erg
    };
};

evaluator.allmasses$0 = function(args, modifs) {
    var erg = [];
    for (var i = 0; i < masses.length; i++) {
        erg[i] = {
            ctype: "geo",
            value: masses[i],
            type: "P"
        };
    }
    return {
        ctype: "list",
        value: erg
    };
};

evaluator.alllines$0 = function(args, modifs) {
    var erg = [];
    for (var i = 0; i < csgeo.lines.length; i++) {
        erg[i] = {
            ctype: "geo",
            value: csgeo.lines[i],
            type: "L"
        };
    }
    return {
        ctype: "list",
        value: erg
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
            l = v0;
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

evaluator.convexhull3d$1 = function(args, modifs) {
    var v0 = evaluate(args[0]);
    if (v0.ctype === 'list') {
        var vals = v0.value;
        if (vals.length < 4) {
            console.error("Less than four input points specified");
            return nada;
        }
        var pts = [],
            i, j;
        for (i = 0; i < vals.length; i++) {
            if (List._helper.isNumberVecN(vals[i], 3)) {
                for (j = 0; j < 3; j++) {
                    var a = vals[i].value[j].value.real;
                    pts.push(a);

                }

            }

        }
        var ch = convexhull(pts);
        var chp = ch[0];
        var ergp = [];
        for (i = 0; i < chp.length; i += 3) {
            ergp.push(List.realVector([chp[i], chp[i + 1], chp[i + 2]]));
        }
        var outp = List.turnIntoCSList(ergp);
        var chf = ch[1];
        var ergf = [];
        for (i = 0; i < chf.length; i++) {
            for (j = 0; j < chf[i].length; j++) {
                chf[i][j]++;
            }
            ergf.push(List.realVector(chf[i]));
        }
        var outf = List.turnIntoCSList(ergf);
        return (List.turnIntoCSList([outp, outf]));

    }
    return nada;
};


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
        // The following can be simplified once we handle arity differently.
        var old = evaluator[name];
        var chain = function(args, modifs) {
            if (args.length === arity)
                return impl(args, modifs);
            else if (old)
                return old(args, modifs);
            else
                throw "No implementation for " + name + "(" + arity + ")";
        };
        evaluator[name] = chain;
    }
    var v0 = evaluate(args[0]);
    if (v0.ctype === "string") {
        var name = v0.value,
            cb;
        if (instanceInvocationArguments.plugins)
            cb = instanceInvocationArguments.plugins[name];
        if (!cb)
            cb = createCindy._pluginRegistry[name];
        if (cb) {
            /* The following object constitutes API for third-party plugins.
             * We should feel committed to maintaining this API.
             */
            cb({
                "instance": globalInstance,
                "config": instanceInvocationArguments,
                "nada": nada,
                "evaluate": evaluate,
                "evaluateAndVal": evaluateAndVal,
                "defineFunction": defineFunction,
                "addShutdownHook": shutdownHooks.push.bind(shutdownHooks),
                "addAutoCleaningEventListener": addAutoCleaningEventListener,
                "getVariable": namespace.getvar.bind(namespace),
                "getInitialMatrix": function() {
                    return csport.drawingstate.initialmatrix;
                },
            });
            return {
                "ctype": "boolean",
                "value": true
            };
        } else {
            console.log("Plugin " + name + " not found");
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
        return "" + erg1;
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
        dec = Math.round(v1.value.real);
        return fmt(v0);
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

        if (expr.oper === "sin") {
            return {
                "ctype": "string",
                "value": "sinc(" + a.value + ")"
            };
        }
        if (expr.oper === "cos") {
            return {
                "ctype": "string",
                "value": "cosc(" + a.value + ")"
            };
        }
        if (expr.oper === "tan") {
            return {
                "ctype": "string",
                "value": "tanc(" + a.value + ")"
            };
        }
        if (expr.oper === "exp") {
            return {
                "ctype": "string",
                "value": "expc(" + a.value + ")"
            };
        }
        if (expr.oper === "log") {
            return {
                "ctype": "string",
                "value": "logc(" + a.value + ")"
            };
        }
        if (expr.oper === "arctan") {
            return {
                "ctype": "string",
                "value": "arctanc(" + a.value + ")"
            };
        }
        if (expr.oper === "arcsin") {
            return {
                "ctype": "string",
                "value": "arcsinc(" + a.value + ")"
            };
        }
        if (expr.oper === "arccos") {
            return {
                "ctype": "string",
                "value": "arccosc(" + a.value + ")"
            };
        }
        if (expr.oper === "sqrt") {
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

        if (expr.oper === "sin") {
            return {
                "ctype": "string",
                "value": "sinc(" + a.value + ")"
            };
        }
        if (expr.oper === "cos") {
            return {
                "ctype": "string",
                "value": "cosc(" + a.value + ")"
            };
        }
        if (expr.oper === "tan") {
            return {
                "ctype": "string",
                "value": "tanc(" + a.value + ")"
            };
        }
        if (expr.oper === "exp") {
            return {
                "ctype": "string",
                "value": "expc(" + a.value + ")"
            };
        }
        if (expr.oper === "log") {
            return {
                "ctype": "string",
                "value": "logc(" + a.value + ")"
            };
        }
        if (expr.oper === "arctan") {
            return {
                "ctype": "string",
                "value": "arctanc(" + a.value + ")"
            };
        }
        if (expr.oper === "arcsin") {
            return {
                "ctype": "string",
                "value": "arcsinc(" + a.value + ")"
            };
        }
        if (expr.oper === "arccos") {
            return {
                "ctype": "string",
                "value": "arccosc(" + a.value + ")"
            };
        }
        if (expr.oper === "sqrt") {
            return {
                "ctype": "string",
                "value": "sqrtc(" + a.value + ")"
            };
        }
    }
    return nada;
};


/***********************************/
/**********    PHYSIC    ***********/
/***********************************/


evaluator.setsimulationspeed$1 = function(args, modifs) {
    
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        if(typeof(labObjects)!=="undefined" && typeof(labObjects.env)!=="undefined") {
            labObjects.env.deltat=v0.value.real;
        }
    }
    return nada;
};

evaluator.setsimulationaccuracy$1 = function(args, modifs) {
    
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        if(typeof(labObjects)!=="undefined" && typeof(labObjects.env)!=="undefined") {
            labObjects.env.accuracy=v0.value.real;
        }
    }
    return nada;
};

evaluator.setsimulationquality$1 = function(args, modifs) {
    
    var v0 = evaluateAndVal(args[0]);
    if (v0.ctype === 'number') {
        if(typeof(labObjects)!=="undefined" && typeof(labObjects.env)!=="undefined") {
            var qual=v0.value.real;
            if(qual==0) {
                labObjects.env.errorbound=0.01;
                labObjects.env.lowestdeltat=0.00001;
                labObjects.env.slowdownfactor=2;
            }
            if(qual==1) {
                labObjects.env.errorbound=0.001;
                labObjects.env.lowestdeltat=0.0000001;
                labObjects.env.slowdownfactor=2;
            }
            if(qual==2) {
                labObjects.env.errorbound=0.00001;
                labObjects.env.lowestdeltat=0.0000000001;
                labObjects.env.slowdownfactor=4;
            }
            if(qual==3) {
                labObjects.env.errorbound=0.000001;
                labObjects.env.lowestdeltat=0.000000000001;
                labObjects.env.slowdownfactor=4;
            }
        }
    }
    return nada;
};

