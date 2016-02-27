/*jshint -W069 */

var myfunctions = {};

/*
var operators = {};
operators[':'] = 20; // Access to user-defined fields
operators['.'] = 25; // Field access
operators['°'] = 25; // Degree
operators['_'] = 50; // x_i means i-th element of x
operators['^'] = 50; // power
operators['*'] = 100; // multiplication (also for vectors and matrices)
operators['/'] = 100; // division (also vectoren divided by scalar)
operators['+'] = 200; // addition (also for vectors and matrices)
operators['-'] = 200; // subtraction (also for vectors and matrices)
operators['!'] = 200; // logical not (unary)
operators['=='] = 300; // equal
operators['~='] = 300; // approximately equal
operators['~<'] = 300; // approximately less
operators['~>'] = 300; // approximately greater
operators['=:='] = 300; // equals after evaluation
operators['>='] = 300; // greater or equal
operators['<='] = 300; // less or equal
operators['~>='] = 300; // approximately greater or equal
operators['~<='] = 300; // approximately less or equal
operators['>'] = 300; // greater
operators['<'] = 300; // less
operators['<>'] = 300; // not equal
operators['&'] = 350; // logical and
operators['%'] = 350; // logical or
operators['!='] = 350; // not equal
operators['~!='] = 350; // approximately not equal
operators['..'] = 350; // sequence
operators['++'] = 370; // concatenation of lists, union of shapes
operators['--'] = 370; // list or shape difference
operators['~~'] = 370; // list or shape intersection
operators[':>'] = 370; // append element to list
operators['<:'] = 370; // prepend element to list
operators['='] = 400; // assignment
operators[':='] = 400; // function definition
operators[':=_'] = 400; // function undefinition
operators['::='] = 400; // binding function definition
operators['->'] = 400; // modifier
operators[';'] = 500; // sequence of statements
//operators[','] = 510 is the list element separator, handled in parselist
*/


var infixmap = {};
infixmap[':'] = operator_not_implemented(':');
// infixmap['.'] not needed thanks to definitionDot special handling
infixmap['°'] = postfix_numb_degree;
infixmap['_'] = infix_take;
infixmap['^'] = infix_pow;
infixmap['√'] = infix_sqrt;
infixmap['*'] = infix_mult;
infixmap['×'] = infix_cross;
infixmap['/'] = infix_div;
infixmap['+'] = infix_add;
infixmap['-'] = infix_sub;
infixmap['!'] = prefix_not;
infixmap['=='] = comp_equals;
infixmap['~='] = comp_almostequals;
infixmap['~<'] = comp_ult;
infixmap['~>'] = comp_ugt;
infixmap['=:='] = operator_not_implemented('=:=');
infixmap['>='] = comp_ge;
infixmap['<='] = comp_le;
infixmap['~>='] = comp_uge;
infixmap['~<='] = comp_ule;
infixmap['>'] = comp_gt;
infixmap['<'] = comp_lt;
infixmap['<>'] = comp_notequals;
infixmap['∈'] = infix_in;
infixmap['∉'] = infix_nin;
infixmap['&'] = infix_and;
infixmap['%'] = infix_or;
infixmap['!='] = comp_notequals;
infixmap['~!='] = comp_notalmostequals;
infixmap['..'] = infix_sequence;
infixmap['++'] = infix_concat;
infixmap['--'] = infix_remove;
infixmap['~~'] = infix_common;
infixmap[':>'] = infix_append;
infixmap['<:'] = infix_prepend;
infixmap['='] = infix_assign;
infixmap[':='] = infix_define;
infixmap[':=_'] = operator_not_implemented(':=_');
infixmap['::='] = operator_not_implemented('::=');
// infixmap['->'] not needed thanks to modifierOp special handling
infixmap[';'] = infix_semicolon;

/*jshint +W069 */

function operator_not_implemented(name) {
    var first = true;
    return function(args, modifs) {
        if (first) {
            console.error("Operator " + name + " is not supported yet.");
            first = false;
        }
        return nada;
    };
}

//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

function niceprint(a) {
    if (typeof a === 'undefined') {
        return '_??_';
    }
    if (a.ctype === 'undefined') {
        return '___';
    }
    if (a.ctype === 'number') {
        return CSNumber.niceprint(a);
    }
    if (a.ctype === 'string') {
        return a.value;
    }
    if (a.ctype === 'boolean') {
        return a.value;
    }
    if (a.ctype === 'list') {
        var erg = "[";
        for (var i = 0; i < a.value.length; i++) {
            erg = erg + niceprint(evaluate(a.value[i]));
            if (i !== a.value.length - 1) {
                erg = erg + ', ';
            }

        }
        return erg + "]";
    }
    if (a.ctype === 'function') {
        return 'FUNCTION';

    }
    if (a.ctype === 'infix') {
        return 'INFIX';
    }
    if (a.ctype === 'modifier') {
        return a.key + '->' + niceprint(a.value);
    }
    if (a.ctype === 'shape') {
        return a.type;
    }

    if (a.ctype === 'error') {
        return "Error: " + a.message;
    }
    if (a.ctype === 'variable') {
        console.log("HALLO");
        return niceprint(a.stack[length.stack]);
    }

    if (a.ctype === 'geo') {
        return a.value.name;
    }


    return "_?_";

}


//TODO Eventuell auslagern
//*******************************************************
//this is the container for self-defined functions
//Distinct form evaluator for code clearness :-)
//*******************************************************
function evalmyfunctions(name, args, modifs) {
    var tt = myfunctions[name];
    if (tt === undefined) {
        return nada;
    }

    var set = [],
        i;

    for (i = 0; i < tt.arglist.length; i++) {
        set[i] = evaluate(args[i]);
    }
    for (i = 0; i < tt.arglist.length; i++) {
        namespace.newvar(tt.arglist[i].name);
        namespace.setvar(tt.arglist[i].name, set[i]);
    }
    namespace.pushVstack("*");
    var erg = evaluate(tt.body);
    namespace.cleanVstack();
    for (i = 0; i < tt.arglist.length; i++) {
        namespace.removevar(tt.arglist[i].name);
    }
    return erg;
    //                    return tt(args,modifs);
}

//*******************************************************
//this function evaluates a concrete function
//*******************************************************
var evaluator = {};
var eval_helper = {};

eval_helper.evaluate = function(name, args, modifs) {
    if (myfunctions.hasOwnProperty(name))
        return evalmyfunctions(name, args, modifs);
    var f = evaluator[name];
    if (f)
        return f(args, modifs);
    // This following is legacy code, and should be removed
    // once all functions are converted to their arity-aware form.
    // Unless we introduce something like variadic functions.
    var n = name.lastIndexOf("$");
    if (n !== -1) {
        n = name.substr(0, n);
        f = evaluator[n];
        if (f)
            return f(args, modifs);
    }
    csconsole.err("Called undefined function " + n + " (as " + name + ")");
    return nada;
};


eval_helper.equals = function(v0, v1) { //Und nochmals un-OO
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
};
