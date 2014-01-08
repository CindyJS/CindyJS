
//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

var evaluate=function(a){
    if(typeof a==='undefined'){
        return nada;
    }
    if(a.ctype=='infix'){
        var ioper=infixmap[a.oper];
        return evaluator(ioper,a.args,[]);
    }
    if(a.ctype=='variable'){
        return namespace.getvar(a.name);
        return a.value[0];
    }
    if(a.ctype=='void'){
        return a;
    }
    if(a.ctype=='number'){
        return a;
    }
    if(a.ctype=='boolean'){
        return a;
    }
    if(a.ctype=='string'){
        return a;
    }
    if(a.ctype=='list'){
        return a;
    }
    if(a.ctype=='undefined'){
        return a;
    }
    if(a.ctype=='function'){
        var eargs=[];
        return evaluator(a.oper,a.args,a.modifs);
    }
    return nada;
    
}


var evaluateAndVal=function(a){
    var x=evaluate(a);
    return x;//TODO Implement this
}



//*******************************************************
// this function removes all comments spaces and newlines
//*******************************************************

var condense=function(code){
    var literalmode=false;
    var commentmode=false;
    var erg='';
    for(var i=0;i<code.length;i++){
        var closetoend=(i==code.length-1);
        var c=code[i];
        if(c=='\"'&&!commentmode)
            literalmode=!literalmode;
        
        if(c=='/' && (i!=code.length-1))
            if(code[i+1]=='/')
                commentmode=true;
        if(c=='\n')
            commentmode=false;
        
        if((c!=' ' && c!='\n' && !commentmode) || literalmode)
            erg=erg+c;
    }
    return erg;
}

var dots='....................................................';


//*******************************************************
// this function shows an expression tree on the console
//*******************************************************

var report=function(a,i){
    var prep=dots.substring(0,i);
    if(a.ctype=='infix'){
        console.log(prep+"INFIX: "+a.oper);
        console.log(prep+"ARG 1 ");
        report(a.args[0],i+1);
        console.log(prep+"ARG 2 ");
        report(a.args[1],i+1);
    }
    if(a.ctype=='number'){
        console.log(prep+"NUMBER: "+Number.niceprint(a));
    }
    if(a.ctype=='variable'){
        console.log(prep+"VARIABLE: "+a.name);
    }
    if(a.ctype=='undefined'){
        console.log(prep+"UNDEF");
    }
    if(a.ctype=='void'){
        console.log(prep+"VOID");
    }
    if(a.ctype=='string'){
        console.log(prep+"STRING: "+a.value);
    }
    if(a.ctype=='modifier'){
        console.log(prep+"MODIF: "+a.key);
    }
    if(a.ctype=='list'){
        console.log(prep+"LIST ");
        var els=a.value;
        for(var j=0;j<els.length;j++) {
            console.log(prep+"EL"+ j);
            report(els[j],i+1);
        }
    }
    if(a.ctype=='function'){
        console.log(prep+"FUNCTION: "+a.oper);
        var els=a.args;
        for(var j=0;j<els.length;j++) {
            console.log(prep+"ARG"+ j);
            report(els[j],i+1);
        }
        els=a.modifs;
        for (var name in els) {
            console.log(prep+"MODIF:"+ name);
            report(els[name],i+1);
        }
    }
    if(a.ctype=='error'){
        console.log(prep+"ERROR: "+a.message);
    }
    
}


var generateInfix=function(oper, f1, f2){
    var erg={};
    erg.ctype='infix';
    erg.oper=oper;
    erg.args=[f1,f2];
    return erg;
}


var modifierOp = function(code, bestbinding, oper){
    var s = code.substring(0, bestbinding);
    var f1 = analyse(code.substring(bestbinding + oper.length),false);
    if(f1.ctype=='error') return f1;
    return {'ctype':'modifier','key':s,'value':f1};
}



var definitionDot = function(code, bestbinding, oper){
    if(isNumber(code)) {
        var erg={}
        erg.value={'real':parseFloat(code),'imag':0};
        erg.ctype='number';
        return erg;
    }
    var s1 = code.substring(0, bestbinding);
    var s2 = code.substring(bestbinding + oper.length);
    //TODO implement feldzugriff
    return nada;
}


var validDefinabaleFunction = function(f){//TODO Eventuell echte fehlermelungen zurückgeben
    if(f.ctype!='function'){
        return false;               //Invalid Function Name
    }
    for(var i=0; i<f.args.length;i++){
        if(f.args[i].ctype!='variable'){
            return false;               //Arg not a variable
        }
    }
    for(var i=0; i<f.args.length-1;i++){
        for(var j=i+1; j<f.args.length;j++){
            if(f.args[i].name==f.args[j].name){
                return false;       //Varname used twice
            }
            
        }
    }
    
    
    return true;
}

var definitionOp = function(code, bestbinding, oper){
    
    var s1 = code.substring(0, bestbinding);
    var f1 = analyse(s1,true);
    if(f1.ctype=='error') return f1;
    if(f1.cstring=='variable' || validDefinabaleFunction(f1)){
        
        var s2 = code.substring(bestbinding + oper.length);
        var f2 = analyse(s2,false);
        if(f2.ctype=='error') return f2;
        
        return generateInfix(oper, f1, f2);
        
    }
    return  new Error('Function not definable');
}




var infixOp=function(code, bestbinding, oper){
    var f1 = analyse(code.substring(0, bestbinding), false);
    var f2 = analyse(code.substring(bestbinding + oper.length), false);
    if(f1.ctype=='error') return f1;
    if(f2.ctype=='error') return f2;
    
    return generateInfix(oper, f1, f2);
    
}

var isPureNumber= function(code) {
    return code!="" && !isNaN(code);
}


var isNumber=function(code) {
    
    var a = code.indexOf('.');
    var b = code.lastIndexOf('.');
    if (a != b) return false;
    if (a == -1) {
        return isPureNumber(code);
    } else {
        return isPureNumber(code.substring(0, a)) || isPureNumber(code.substring(a + 1));
    }
}



var somethingelse= function(code){
    
    if(code=='') {
        return new Void();
    }
    if (code.charAt(0) == '"' && code.charAt(code.length - 1) == '"') {
        return {'ctype':'string','value':code.substring(1, code.length - 1)};
    }
    
    if (isPureNumber(code)) {
        return {'ctype':'number','value':{'real':parseInt(code),'imag':0}};
    }
    if (namespace.isVariable(code)){
        return namespace.vars[code];
    }
    if (namespace.isVariableName(code)){
        variable=namespace.create(code);
        namespace.setvar(code,nada);
        //                        var variable={'ctype':'variable','value':nada,'name':code};
        //                        namespace.vars[code]=variable;
        return variable;
    }
    
    
    /*                        if (isVariable(expr)) {
     if (cat.isDebugEnabled()) cat.debug("Variable: " + expr);
     Assignments ass = getAssignments();
     if (ass != null) {
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
     if (ass != null) dispatcher.namespace.putVariable(expr, f);
     fout = f;
     }*/
    //                      if (!fout.isNull()) return fout;
    return nada;
}


var isOpener= function(c){
    return c=='[' || c=='(' || c=='{' || c=='|';
}
var isCloser= function(c){
    return c==']' || c==')' || c=='}' || c=='|';
}
var isBracketPair= function(c){
    return c=='[]' || c=='()' || c=='{}' || c=='||';
}


var funct=function(code, firstbraind, defining){
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
    for (var i = start; i < length; i++) {
        var c = code[i];
        if (c == '"') literalmode = !literalmode;
        if (!literalmode) {
            if (isOpener(c)  && (c != '|' || !absolute)) {
                bracount++;
                if (c == '|') absolute = true;
            } else if (isCloser(c) && (c != '|' || absolute)) {
                bracount--;
                if (c == '|') absolute = false;
            }
            if (c == ',' && bracount == 0 || bracount == -1) {
                var arg = code.substring(start, i);
                args[args.length]=arg;
                argsi[argsi.length]=start;
                //TODO (was soll das`)
                /*if (args.size() == 1 && bracount == -1 && args.get(0).equals("")) {//Sonderbehandlung f�r leere argumente
                 args.clear();
                 argsi.clear();
                 }*/
                start = i + 1;
            }
        }
    }
    for (var i = 0; i < args.length; i++) {
        var s = args[i];
        
        var f = analyse(s, false);
        if(f.ctype=='error') return f;
        if(f.ctype=='modifier'){
            modifs[f.key]=f.value;
            //                           modifs[modifs.length]=f;
        } else {
            argsf[argsf.length]=f;
        }
    }
    
    // Term t = (Term) generateFunction(oper, argsf, modifs, defining);
    // return t;
    erg={};
    erg.ctype='function';
    erg.oper=oper;
    erg.args=argsf;
    erg.modifs=modifs;
    return erg;
    
}




var parseList=function(code) {
    var code1 = code;
    
    var args=[];        //das sind die argument exprs
    var argsi=[];       //das sind die startindize
    var argsf=[];       //das sind die formeln zu den exprs
    code1 = code1 + ',';
    var length = code1.length;
    var bracount = 0;
    var start = 0;
    var absolute = false;
    var literalmode = false;
    for (var i = start; i < length; i++) {
        var c;
        c = code1[i];
        if (c == '"') literalmode = !literalmode;
        if (!literalmode) {
            if (isOpener(c) && (c != '|' || !absolute)) {
                bracount++;
                if (c == '|') absolute = true;
            } else if (isCloser(c) && (c != '|' || absolute)) {
                bracount--;
                if (c == '|') absolute = false;
            }
            if (c == ',' && bracount == 0 || bracount == -1) {
                
                var arg = code1.substring(start, i);
                args[args.length]=arg;
                argsi[argsi.length]=start;
                start = i + 1;
                
            }
        }
    }
    for (var i = 0; i < args.length; i++) {
        var s = args[i];
        if (""==s) {
            argsf[argsf.length]='nil';
        } else {
            var f = analyse(s, false);
            if(f.ctype=='error') return f;
            
            argsf[argsf.length]=f;
        }
    }
    /*  var erg={};
     erg.ctype='list';
     erg.value=argsf;*/
    erg={};
    erg.ctype='function';
    erg.oper='genList';
    erg.args=argsf;
    erg.modifs=[];
    return erg;
}



var bracket=function(code){
    //TODO: ABS
    /*      if (code.charAt(0) == '|') {
     Formula f1 = parseList(expr.substring(1, expr.length() - 1), csc);
     OpAbsArea f = new OpAbsArea(csc);
     ArrayList<Formula> args = new ArrayList<Formula>();
     args.add(f1);
     f.setArguments(args);
     return f;
     }*/
    
    if (code=="()" || code=="[]") {
        var erg={};
        erg.ctype='list';
        erg.value=[];
        return erg;
    }
    
    if (code[0] == '[') {
        return parseList(code.substring(1, code.length - 1));
    }
    if (code[0] == '(') {
        var erg=parseList(code.substring(1, code.length - 1));
        if(erg.args.length>1){
            return erg;
        }
        
    }
    
    var erg = analyse(code.substring(1, code.length - 1), false);
    
    
    return erg;
    
}


var analyse=function(code,defining){
    var literalmode=false;
    var erg={};
    var bra='';
    var bestbinding=-1;
    var yourthetop=-1;
    var bestoper='';
    var bracount=0;
    var braexprcount=0;
    var firstbra = ' ';//erste Klammer
    var lastbra = ' ';//letzte Klammer
    var open1 = 0;
    var close1 = 0;
    var open2 = 0;
    var close2 = 0;
    var offset = 0;
    var absolute = false; //betragsklammer
    var length=code.length;
    
    for (var i = 0; i < length; i++) {
        var c;
        var c1 = ' ';
        var c2 = ' ';
        if (offset > 0) offset--;
        c = code[i];
        if (i + 1 < length) c1 = code[i + 1];//die werden fuer lange operatoren gebraucht
        if (i + 2 < length) c2 = code[i + 2];
        
        if (c == '\"') { //Anführungszeichen schalten alles aus
            literalmode = !literalmode;
        }
        if (!literalmode) {
            if (isOpener(c) && (c != '|' || !absolute)) { //Klammer geht auf
                if (c == '|') absolute = true;
                bra = bra + c;
                bracount++;
                if (bracount == 1) {
                    braexprcount++;
                    if (braexprcount == 1) open1 = i;
                    if (braexprcount == 2) open2 = i;
                }
                if (firstbra == ' ') firstbra = c;
            } else if (isCloser(c) && (c != '|' || absolute)) { //Schließende Klammer
                if (c == '|') absolute = false;
                if (bracount == 0) {
                    return new Error('close without open');
                }
                var pair = bra[bra.length - 1] + c;
                if (isBracketPair(pair)) { //Passt die schliesende Klammer?
                    bracount--;
                    bra = bra.substring(0, bra.length - 1);
                    if (braexprcount == 1) close1 = i;
                    if (braexprcount == 2) close2 = i;
                    lastbra = c;
                } else {
                    return new Error('unmatched brackets');
                }
            }
            if (bra.length == 0) {//Wir sind auf oberster Stufe
                var prior = -1;
                var oper = "";
                if ((typeof operators[c + c1 + c2] !='undefined') && offset == 0) {
                    oper = c + c1 + c2;
                    offset = 3;
                } else if ((typeof operators[c + c1 ] !='undefined') && offset == 0) {
                    oper = "" + c + c1;
                    offset = 2;
                } else if ((typeof operators[c] !='undefined') && offset == 0) {
                    oper = "" + c;
                    offset = 1;
                }
                if (oper!='') {
                    prior = operators[oper];
                }
                
                if (prior >= yourthetop) {//Der bindet bisher am stärksten
                    yourthetop = prior;
                    bestbinding = i;
                    bestoper = oper;
                    if (prior >= 0) i += oper.length - 1;
                }
            }
        }
    }
    
    
    
    
    if (bracount != 0) {
        return new Error('open without close');
        
    }
    
    //Und jetzt wird der Baum aufgebaut.
    
    var firstbraind = code.indexOf(firstbra);
    var lastbraind = code.lastIndexOf(lastbra);
    
    if (bracount == 0 && yourthetop > -1) { //infix Operator gefunden
        //   if (bestoper.equals("->")) //Specialbehandlung von modyfiern
        //   return modifierOp(expr, bestbinding, bestoper);
        //   else if (bestoper.equals(":=")) //Specialbehandlung von definitionen
        //   return definitionOp(expr, bestbinding, bestoper);
        //   else if (bestoper.equals(".")) //Specialbehandlung von Feldzugriff
        //   return definitionDot(expr, bestbinding, bestoper);
        //   else return infixOp(expr, bestbinding, bestoper);
        if (bestoper=='->') //Specialbehandlung von modifyern
            return modifierOp(code, bestbinding, bestoper);
        if (bestoper=='.') //Specialbehandlung von Feldzugriff
            return definitionDot(code, bestbinding, bestoper);
        if (bestoper==':=') //Specialbehandlung von definitionen
            return definitionOp(code, bestbinding, bestoper);
        return infixOp(code, bestbinding, bestoper)
    } else if (bracount == 0 && braexprcount == 1 && lastbraind == code.length - 1) {//Klammer oder Funktion
        
        if (firstbraind == 0) {//Einfach eine Klammer (evtl Vector))
            return bracket(code, this);
        } else {
            return funct(code, firstbraind, defining);
        }
    } else {
        return somethingelse(code);//Zahlen, Atomics, Variablen, oder nicht parsebar
    }
    
    
}

