//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

function evaluate(a) {

    if (typeof a === 'undefined') {
        return nada;
    }

    if (a.ctype === 'infix') {
        return a.impl(a.args, {});
    }
    if (a.ctype === 'variable') {
        return namespace.getvar(a.name);
        //  return a.value[0];
    }
    if (a.ctype === 'void') {
        return a;
    }
    if (a.ctype === 'geo') {
        return a;
    }
    if (a.ctype === 'number') {
        return a;
    }
    if (a.ctype === 'boolean') {
        return a;
    }
    if (a.ctype === 'string') {
        return a;
    }
    if (a.ctype === 'list') {
        return a;
    }
    if (a.ctype === 'undefined') {
        return a;
    }
    if (a.ctype === 'shape') {
        return a;
    }

    if (a.ctype === 'field') {

        var obj = evaluate(a.obj);

        if (obj.ctype === "geo") {
            return Accessor.getField(obj.value, a.key);
        }
        if (obj.ctype === "list") {
            return List.getField(obj, a.key);
        }
        return nada;
    }

    if (a.ctype === 'function') {
        var eargs = [];
        return eval_helper.evaluate(a.oper, a.args, a.modifs);
    }
    return nada;

}


function evaluateAndVal(a) {


    var x = evaluate(a);
    if (x.ctype === 'geo') {
        var val = x.value;
        if (val.kind === "P") {
            return Accessor.getField(val, "xy");
        }

    }
    return x; //TODO Implement this
}

function evaluateAndHomog(a) {
    var x = evaluate(a);
    if (x.ctype === 'geo') {
        var val = x.value;
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
        var y = List.turnIntoCSList([
            x.value[0], x.value[1], CSNumber.real(1)
        ]);
        if (x.usage)
            y = General.withUsage(y, x.usage);
        return y;
    }

    return nada;
}


//*******************************************************
// this function removes all comments spaces and newlines
//*******************************************************

function condense(code) {
    var literalmode = false;
    var commentmode = false;
    var erg = '';
    for (var i = 0; i < code.length; i++) {
        var closetoend = (i === code.length - 1);
        var c = code[i];
        if (c === '\"' && !commentmode)
            literalmode = !literalmode;

        if (c === '/' && (i !== code.length - 1))
            if (code[i + 1] === '/')
                commentmode = true;
        if (c === '\n')
            commentmode = false;
        if (!(c === '\u0020' || c === '\u0009' || c === '\u000A' || c === '\u000C' || c === '\u000D' || commentmode) || literalmode)
            erg = erg + c;
    }
    return erg;
}

//*******************************************************
// this function shows an expression tree on the console
//*******************************************************

function report(a, i) {
    var prep = new Array(i + 1).join('.'),
        els, j;
    if (a.ctype === 'infix') {
        console.log(prep + "INFIX: " + a.oper);
        console.log(prep + "ARG 1 ");
        report(a.args[0], i + 1);
        console.log(prep + "ARG 2 ");
        report(a.args[1], i + 1);
    }
    if (a.ctype === 'number') {
        console.log(prep + "NUMBER: " + CSNumber.niceprint(a));
    }
    if (a.ctype === 'variable') {
        console.log(prep + "VARIABLE: " + a.name);
    }
    if (a.ctype === 'undefined') {
        console.log(prep + "UNDEF");
    }
    if (a.ctype === 'void') {
        console.log(prep + "VOID");
    }
    if (a.ctype === 'string') {
        console.log(prep + "STRING: " + a.value);
    }
    if (a.ctype === 'shape') {
        console.log(prep + "SHAPE: " + a.type);
    }
    if (a.ctype === 'modifier') {
        console.log(prep + "MODIF: " + a.key);
    }
    if (a.ctype === 'list') {
        console.log(prep + "LIST ");
        els = a.value;
        for (j = 0; j < els.length; j++) {
            console.log(prep + "EL" + j);
            report(els[j], i + 1);
        }
    }
    if (a.ctype === 'function') {
        console.log(prep + "FUNCTION: " + a.oper);
        els = a.args;
        for (j = 0; j < els.length; j++) {
            console.log(prep + "ARG" + j);
            report(els[j], i + 1);
        }
        els = a.modifs;
        for (var name in els) {
            console.log(prep + "MODIF:" + name);
            report(els[name], i + 1);
        }
    }
    if (a.ctype === 'error') {
        console.log(prep + "ERROR: " + a.message);
    }

}


function generateInfix(oper, f1, f2) {
    var erg = {};
    erg.ctype = 'infix';
    erg.oper = oper;
    erg.impl = infixmap[oper];
    erg.args = [f1, f2];
    return erg;
}


function modifierOp(code, bestbinding, oper) {
    var s = code.substring(0, bestbinding);
    var f1 = analyse(code.substring(bestbinding + oper.length), false);
    if (f1.ctype === 'error') return f1;
    return {
        'ctype': 'modifier',
        'key': s,
        'value': f1
    };
}


function definitionDot(code, bestbinding, oper) {
    if (isNumber(code)) {
        var erg = {};
        erg.value = {
            'real': parseFloat(code),
            'imag': 0
        };
        erg.ctype = 'number';
        return erg;
    }
    var s1 = analyse(code.substring(0, bestbinding), false);
    var s2 = code.substring(bestbinding + oper.length);
    return {
        'ctype': 'field',
        'obj': s1,
        'key': s2
    };
}


function validDefinabaleFunction(f) { //TODO Eventuell echte fehlermelungen zurückgeben
    var i, j;
    if (f.ctype !== 'function') {
        console.log("Invalid function name.");
        return false; //Invalid Function Name
    }
    for (i = 0; i < f.args.length; i++) {
        if (f.args[i].ctype !== 'variable') {
            console.log("Argument is not a variable.");
            return false; //Arg not a variable
        }
    }
    for (i = 0; i < f.args.length - 1; i++) {
        for (j = i + 1; j < f.args.length; j++) {
            if (f.args[i].name === f.args[j].name) {
                console.log("Variable name used twice.");
                return false; //Varname used twice
            }

        }
    }


    return true;
}

function definitionOp(code, bestbinding, oper) {

    var s1 = code.substring(0, bestbinding);
    var f1 = analyse(s1, true);
    if (f1.ctype === 'error') return f1;
    if (f1.cstring === 'variable' || validDefinabaleFunction(f1)) {

        var s2 = code.substring(bestbinding + oper.length);
        var f2 = analyse(s2, false);
        if (f2.ctype === 'error') return f2;

        return generateInfix(oper, f1, f2);

    }
    console.log(["Function not definable", f1]);
    return new CError('Function not definable');
}


function infixOp(code, bestbinding, oper) {
    var f1 = analyse(code.substring(0, bestbinding), false);
    var f2 = analyse(code.substring(bestbinding + oper.length), false);
    if (f1.ctype === 'error') return f1;
    if (f2.ctype === 'error') return f2;

    return generateInfix(oper, f1, f2);

}

function isPureNumber(code) {
    return code !== "" && !isNaN(code);
}


function isNumber(code) {

    var a = code.indexOf('.');
    var b = code.lastIndexOf('.');
    if (a !== b) return false;
    if (a === -1) {
        return isPureNumber(code);
    } else {
        return isPureNumber(code.substring(0, a)) || isPureNumber(code.substring(a + 1));
    }
}


function somethingelse(code) {

    if (code === '') {
        return new Void();
    }
    if (code.charAt(0) === '"' && code.charAt(code.length - 1) === '"') {
        return {
            'ctype': 'string',
            'value': code.substring(1, code.length - 1)
        };
    }

    if (isPureNumber(code)) {
        return {
            'ctype': 'number',
            'value': {
                'real': parseInt(code),
                'imag': 0
            }
        };
    }
    if (namespace.isVariable(code)) {
        return namespace.vars[code];
    }
    if (namespace.isVariableName(code)) {
        var variable = namespace.create(code);
        return variable;
    }


    /*                        if (isVariable(expr)) {
     if (cat.isDebugEnabled()) cat.debug("Variable: " + expr);
     Assignments ass = getAssignments();
     if (ass !== null) {
     FormulaValue elem = dispatcher.namespace.getVariable(expr);
     if (!elem.isNull()) {
     fout = (Formula) elem;
     }
     }
     } else if (isVariableName(expr)) {
     if (cat.isDebugEnabled()) cat.debug("Create Variable: " + expr);
     Variable f = new Variable(this);
     f.setCode(expr);
     Assignments ass = getAssignments();
     if (ass !== null) dispatcher.namespace.putVariable(expr, f);
     fout = f;
     }*/
    //                      if (!fout.isNull()) return fout;
    return nada;
}


function isOpener(c) {
    return c === '[' || c === '(' || c === '{' || c === '|';
}

function isCloser(c) {
    return c === ']' || c === ')' || c === '}' || c === '|';
}

function isBracketPair(c) {
    return c === '[]' || c === '()' || c === '{}' || c === '||';
}


function funct(code, firstbraind, defining) {

    var args = [];
    var argsi = [];
    var argsf = [];
    var modifs = {};

    var oper = code.substring(0, firstbraind);

    var length = code.length;
    var bracount = 0;
    var start = firstbraind + 1;
    var literalmode = false;
    var absolute = false;
    var i;
    for (i = start; i < length; i++) {
        var c = code[i];
        if (c === '"') literalmode = !literalmode;
        if (!literalmode) {
            if (isOpener(c) && (c !== '|' || !absolute)) {
                bracount++;
                if (c === '|') absolute = true;
            } else if (isCloser(c) && (c !== '|' || absolute)) {
                bracount--;
                if (c === '|') absolute = false;
            }
            if (c === ',' && bracount === 0 || bracount === -1) {
                var arg = code.substring(start, i);
                args.push(arg);
                argsi.push(start);

                if (args.length === 1 && bracount === -1 && !args[0].length) { //Um f() abzufangen
                    args = [];
                    argsi = [];
                }
                start = i + 1;
            }
        }
    }

    for (i = 0; i < args.length; i++) {
        var s = args[i];

        var f = analyse(s, false);
        if (f.ctype === 'error') return f;
        if (f.ctype === 'modifier') {
            modifs[f.key] = f.value;
            //                           modifs[modifs.length]=f;
        } else {
            argsf.push(f);
        }
    }

    // Term t = (Term) generateFunction(oper, argsf, modifs, defining);
    // return t;
    var erg = {};
    erg.ctype = 'function';
    erg.oper = oper + "$" + argsf.length;
    erg.args = argsf;
    erg.modifs = modifs;

    return erg;

}


function parseList(code) {
    var code1 = code;

    var args = []; //das sind die argument exprs
    var argsi = []; //das sind die startindize
    var argsf = []; //das sind die formeln zu den exprs
    code1 = code1 + ',';
    var length = code1.length;
    var bracount = 0;
    var start = 0;
    var absolute = false;
    var literalmode = false;
    var i;
    for (i = start; i < length; i++) {
        var c;
        c = code1[i];
        if (c === '"') literalmode = !literalmode;
        if (!literalmode) {
            if (isOpener(c) && (c !== '|' || !absolute)) {
                bracount++;
                if (c === '|') absolute = true;
            } else if (isCloser(c) && (c !== '|' || absolute)) {
                bracount--;
                if (c === '|') absolute = false;
            }
            if (c === ',' && bracount === 0 || bracount === -1) {

                var arg = code1.substring(start, i);
                args.push(arg);
                argsi.push(start);
                start = i + 1;

            }
        }
    }
    for (i = 0; i < args.length; i++) {
        var s = args[i];
        if ("" === s) {
            argsf.push('nil');
        } else {
            var f = analyse(s, false);
            if (f.ctype === 'error') return f;

            argsf.push(f);
        }
    }
    /*  var erg={};
     erg.ctype='list';
     erg.value=argsf;*/
    var erg = {};
    erg.ctype = 'function';
    erg.oper = 'genList';
    erg.args = argsf;
    erg.modifs = {};
    return erg;
}


function bracket(code) {
    //TODO: ABS
    /*      if (code.charAt(0) === '|') {
     Formula f1 = parseList(expr.substring(1, expr.length() - 1), csc);
     OpAbsArea f = new OpAbsArea(csc);
     ArrayList<Formula> args = new ArrayList<Formula>();
     args.add(f1);
     f.setArguments(args);
     return f;
     }*/

    var erg;

    if (code[0] === "|") {
        var f1 = parseList(code.substring(1, code.length - 1));
        var type = f1.args.length;
        if (type === 1) {
            f1.oper = "abs_infix";
            return f1;

        }
        if (type === 2) {
            f1.oper = "dist_infix";
            return f1;

        }
        return nada;

    }

    if (code === "()" || code === "[]") {
        erg = {};
        erg.ctype = 'list';
        erg.value = [];
        return erg;
    }

    if (code[0] === '[') {
        return parseList(code.substring(1, code.length - 1));
    }
    if (code[0] === '(') {
        erg = parseList(code.substring(1, code.length - 1));
        if (erg.args.length > 1) {
            return erg;
        }

    }

    erg = analyse(code.substring(1, code.length - 1), false);


    return erg;

}


function analyse(code, defining) {
    var literalmode = false;
    var erg = {};
    var bra = '';
    var bestbinding = -1;
    var yourthetop = -1;
    var bestoper = '';
    var bracount = 0;
    var braexprcount = 0;
    var firstbra = ' '; //erste Klammer
    var lastbra = ' '; //letzte Klammer
    var open1 = 0;
    var close1 = 0;
    var open2 = 0;
    var close2 = 0;
    var offset = 0;
    var absolute = false; //betragsklammer
    var length = code.length;

    for (var i = 0; i < length; i++) {
        var c;
        var c1 = ' ';
        var c2 = ' ';
        if (offset > 0) offset--;
        c = code[i];
        if (i + 1 < length) c1 = code[i + 1]; //die werden fuer lange operatoren gebraucht
        if (i + 2 < length) c2 = code[i + 2];

        if (c === '\"') { //Anführungszeichen schalten alles aus
            literalmode = !literalmode;
        }
        if (!literalmode) {
            if (isOpener(c) && (c !== '|' || !absolute)) { //Klammer geht auf
                if (c === '|') absolute = true;
                bra = bra + c;
                bracount++;
                if (bracount === 1) {
                    braexprcount++;
                    if (braexprcount === 1) open1 = i;
                    if (braexprcount === 2) open2 = i;
                }
                if (firstbra === ' ') firstbra = c;
            } else if (isCloser(c) && (c !== '|' || absolute)) { //Schließende Klammer
                if (c === '|') absolute = false;
                if (bracount === 0) {
                    return new CError('close without open');
                }
                var pair = bra[bra.length - 1] + c;
                if (isBracketPair(pair)) { //Passt die schliesende Klammer?
                    bracount--;
                    bra = bra.substring(0, bra.length - 1);
                    if (braexprcount === 1) close1 = i;
                    if (braexprcount === 2) close2 = i;
                    lastbra = c;
                } else {
                    return new CError('unmatched brackets');
                }
            }
            if (bra.length === 0) { //Wir sind auf oberster Stufe
                var prior = -1;
                var oper = "";
                if ((typeof operators[c + c1 + c2] !== 'undefined') && offset === 0) {
                    oper = c + c1 + c2;
                    offset = 3;
                } else if ((typeof operators[c + c1] !== 'undefined') && offset === 0) {
                    oper = "" + c + c1;
                    offset = 2;
                } else if ((typeof operators[c] !== 'undefined') && offset === 0) {
                    oper = "" + c;
                    offset = 1;
                }
                if (oper !== '') {
                    prior = operators[oper];
                }

                if (prior >= yourthetop) { //Der bindet bisher am stärksten
                    yourthetop = prior;
                    bestbinding = i;
                    bestoper = oper;
                    if (prior >= 0) i += oper.length - 1;
                }
            }
        }
    }


    if (bracount !== 0) {
        return new CError('open without close');

    }

    //Und jetzt wird der Baum aufgebaut.

    var firstbraind = code.indexOf(firstbra);
    var lastbraind = code.lastIndexOf(lastbra);

    if (bracount === 0 && yourthetop > -1) { //infix Operator gefunden
        //   if (bestoper.equals("->")) //Specialbehandlung von modyfiern
        //   return modifierOp(expr, bestbinding, bestoper);
        //   else if (bestoper.equals(":=")) //Specialbehandlung von definitionen
        //   return definitionOp(expr, bestbinding, bestoper);
        //   else if (bestoper.equals(".")) //Specialbehandlung von Feldzugriff
        //   return definitionDot(expr, bestbinding, bestoper);
        //   else return infixOp(expr, bestbinding, bestoper);
        if (bestoper === '->') //Specialbehandlung von modifyern
            return modifierOp(code, bestbinding, bestoper);
        if (bestoper === '.') //Specialbehandlung von Feldzugriff
            return definitionDot(code, bestbinding, bestoper);
        if (bestoper === ':=') //Specialbehandlung von definitionen
            return definitionOp(code, bestbinding, bestoper);
        return infixOp(code, bestbinding, bestoper);
    } else if (bracount === 0 && braexprcount === 1 && lastbraind === code.length - 1) { //Klammer oder Funktion

        if (firstbraind === 0) { //Einfach eine Klammer (evtl Vector))
            return bracket(code);
        } else {
            return funct(code, firstbraind, defining);
        }
    } else {
        return somethingelse(code); //Zahlen, Atomics, Variablen, oder nicht parsebar
    }


}
