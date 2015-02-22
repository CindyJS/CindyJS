/*jshint -W069 */

var operators = {};
operators[':'] = 20; //Colon: Feldzugriff auf Selbstdefinierte Felder
operators['.'] = 25; //Dot: Feldzugriff
operators['\u00b0'] = 25; //Degree
operators['_'] = 50; //x_i i-tes Element von x
operators['^'] = 50; //hoch
operators['*'] = 100; //Multiplikation (auch für Vectoren, Scalarmul)
operators['/'] = 100; //Division (auch für Vectoren, Scalerdiv)
operators['+'] = 200; //Addition (auch für Vectoren, Vectorsumme)
operators['-'] = 200; //Subtraktion (auch für Vectoren, Vectordiff)
operators['!'] = 200; //Logisches Not (einstellig)
operators['=='] = 300; //Equals
operators['~='] = 300; //approx Equals
operators['~<'] = 300; //approx smaller
operators['~>'] = 300; //approx greater
operators['=:='] = 300; //Equals after evaluation
operators['>='] = 300; //Größergleich
operators['<='] = 300; //Kleinergleich
operators['~>='] = 300; //ungefähr Größergleich
operators['~<='] = 300; //ungefähr Kleinergleich
operators['>'] = 300; //Größer
operators['<'] = 300; //Kleiner
operators['<>'] = 300; //Ungleich
operators['&'] = 350; //Logisches Und
operators['%'] = 350; //Logisches Oder
operators['!='] = 350; //Ungleich
operators['~!='] = 350; //ungefähr Ungleich
operators['..'] = 350; //Aufzählung 1..5=(1,2,3,4,5)
operators['++'] = 370; //Listen Aneinanderhängen
operators['--'] = 370; //Listen wegnehmen
operators['~~'] = 370; //Gemeinsame Elemente
operators[':>'] = 370; //Append List
operators['<:'] = 370; //Prepend List
operators['='] = 400; //Zuweisung
operators[':='] = 400; //Definition
operators[':=_'] = 400; //Definition
operators['::='] = 400; //Definition
operators['->'] = 400; //Modifier
operators[','] = 500; //Listen und Vektoren Separator
operators[';'] = 500; //Befehlsseparator


var infixmap = {};
infixmap['+'] = 'add$2';
infixmap['-'] = 'minus$2';
infixmap['*'] = 'mult$2';
infixmap['/'] = 'div$2';
infixmap['^'] = 'pow$2';
infixmap['°'] = 'numb_degree';
infixmap[';'] = 'semicolon$2';
infixmap['='] = 'assign$2';
infixmap['..'] = 'sequence$2';
infixmap[':='] = 'define$2';
infixmap['=='] = 'comp_equals';
infixmap['!='] = 'comp_notequals';
infixmap['~='] = 'comp_almostequals';
infixmap['~!='] = 'comp_notalmostequals';
infixmap['>'] = 'comp_gt';
infixmap['<'] = 'comp_lt';
infixmap['>='] = 'comp_ge';
infixmap['<='] = 'comp_le';
infixmap['~>'] = 'comp_ugt';
infixmap['~<'] = 'comp_ult';
infixmap['~>='] = 'comp_uge';
infixmap['~<='] = 'comp_ule';
infixmap['&'] = 'and$2';
infixmap['%'] = 'or$2';
infixmap['!'] = 'not';
infixmap['_'] = 'take$2';
infixmap['++'] = 'concat$2';
infixmap['~~'] = 'common$2';
infixmap['--'] = 'remove$2';
infixmap[':>'] = 'append$2';
infixmap['<:'] = 'prepend$2';

/*jshint +W069 */


//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

function niceprint(a) {
    if (typeof a === 'undefined') {
        return '_??_';
    }
    if (a.ctype === 'undefined') {
        return '_?_';
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


    return "__";

}


//TODO Eventuell auslagern
//*******************************************************
//this is the container for self-defined functions
//Distinct form evaluator for code clearness :-)
//*******************************************************
function myfunctions(name, args, modifs) {
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
        return myfunctions(name, args, modifs);
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
    console.log("Called undefined function " + name + "(" + n + ")");
    return nada;
};


eval_helper.clone = function(a) { //Das ist jetzt gerade mal ätzend un-OO
    if (a.ctype === 'list') {
        return List.clone(a);
    }
    if (a.ctype === 'number') {
        return CSNumber.clone(a);
    }
    return a; //Werden die anderen sachen gecloned, in Cindy ist das nicht so???

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
