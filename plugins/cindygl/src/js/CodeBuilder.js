/**
 * @constructor
 */
function CodeBuilder(api) {
    this.variables = {};
    this.assigments = {};
    this.T = {};
    this.uniforms = {};
    this.hasbeenincluded = {};
    this.includedfunctions = [];
    this.hasbeencompiled = {};
    this.compiledfunctions = [];
    this.precompileDone = false;
    this.myfunctions = {};
    this.api = api;
    this.texturereaders = {};
}

/** @dict @type {Object} */
CodeBuilder.prototype.hasbeencompiled;

/**  @type {Array.<string>} */
CodeBuilder.prototype.compiledfunctions;

/** @dict @type {Object} */
CodeBuilder.prototype.myfunctions;

/** @dict @type {boolean} */
CodeBuilder.prototype.precompileDone;

/** list of names of variables 
 *@dict @type {Object} */
CodeBuilder.prototype.variables;

/** 
 * variables -> list of assigments in the form of {expr: expression, fun: in which functions this expression will be eval}
 * @dict @type {Object} */
CodeBuilder.prototype.assigments;

/** 
 * T: scope -> (variables -> types)
 * @dict @type {Object} */
CodeBuilder.prototype.T;

/** @dict @type {Object} */
CodeBuilder.prototype.uniforms;

/** @dict @type {Object} */
CodeBuilder.prototype.hasbeenincluded;

/**  @type {Array.<string>} */
CodeBuilder.prototype.includedfunctions;

/** @type {CindyJS.pluginApi} */
CodeBuilder.prototype.api;

/** @type {Object.<TextureReader>} */
CodeBuilder.prototype.texturereaders;

/**
 * Creates new term that is casted to toType
 * assert that fromType is Type of term
 * assert that fromType is a subtype of toType
 */
CodeBuilder.prototype.castType = function(term, fromType, toType) {
    if (!issubtypeof(fromType, toType)) {
        console.error(typeToString(fromType) + " is no subtype of " + typeToString(toType) + " (trying to cast the term " + term + ")");
        return term;
    }

    if (fromType === toType) return term;
    else {
        let nextType = next[fromType][toType]; //use precomputed matrix
        //   console.log(nextType);
        if (!inclusionfunction.hasOwnProperty(fromType) || !inclusionfunction[fromType].hasOwnProperty(nextType)) {
            console.error("CindyGL: No type-inclusion function for " + typeToString(fromType) + " to " +
                typeToString(nextType) + " found. \n Using identity");
            return this.castType(term, nextType, toType);
        }
        return this.castType((inclusionfunction[fromType][nextType])(term, {}, this), nextType, toType);
    }
};


/**
 * computes the type of the expr, assuming it is evaluated in the scope of fun.
 * It might consider the type of variables (T)
 */
//@TODO: Consider stack of this.variables. e.g. repeat(3, i, e = 32+i);
CodeBuilder.prototype.computeType = function(expr, fun) { //expression, current function  
    if (expr['isuniform']) {
        return this.uniforms[expr['uvariable']].type;
    }

    if (expr['ctype'] === 'variable') {
        let name = expr['name'];

        //@rethink: use stack instead of scopes? # # #...
        if (name === '#') {
            /*if(modifs[generatecomplexresult]) { //better as uniform type handling
              return type.complex;
            }*/
            return type.vec2; //type.complex if complex->true

        }

        if (this.T.hasOwnProperty(fun) && this.T[fun].hasOwnProperty(name)) { //is there some local variable
            return this.T[fun][name];
        } else if (this.T.hasOwnProperty('') && this.T[''].hasOwnProperty(name)) { //interpret as global variable
            return this.T[''][name];
        }
    } else if (expr['ctype'] === 'function' && this.myfunctions.hasOwnProperty(expr['oper'])) {
        if (this.T.hasOwnProperty('') && this.T[''].hasOwnProperty(expr['oper'])) return this.T[''][expr['oper']];
    } else if (expr['ctype'] === 'number') {
        if (expr['value']['imag'] !== 0) return type.complex;
        //number is real
        if ((expr['value']['real'] | 0) === expr['value']['real']) return type.int; //MAX.Int?
        return type.float;
    } else if (expr['ctype'] === 'void') {
        return type.voidt;
    } else if (expr['ctype'] === 'field') {
        return type.float; //so far we only have field indexes vor vec2, vec3, vec4
    } else if (expr['ctype'] === 'string') {
        return type.image;
    } else {
        var argtypes = new Array(expr['args'].length);
        for (let i = 0; i < expr['args'].length; i++) {
            argtypes[i] = this.getType(expr['args'][i], fun);
        }
        //console.log(f);
        //console.log(argtypes);
        let f = getPlainName(expr['oper']);
        let signature = matchSignature(f, argtypes);
        //console.log(signature);
        if (signature === undefined || signature === nada) return nada;
        return signature.res;
    }
    return nada;
};

/**
 * gets the type of the expr, trying to use cached results. Otherwise it will call computeType
 */
//@TODO: Consider stack of this.variables. e.g. repeat(3, i, e = 32+i);
CodeBuilder.prototype.getType = function(expr, fun) { //expression, current function
    //return computeType(expr, fun);
    /////TODO: update expr["computedType"] in determineVariables
    if (!this.precompileDone || !expr.hasOwnProperty("computedType"))
        expr["computedType"] = this.computeType(expr, fun);
    return expr["computedType"];
};

/**
 * finds the occuring variables, saves them to this.variables and its occuring assigments to this.assigments
 */
CodeBuilder.prototype.determineVariables = function(expr) {

    //for some reason this reference does not work in local function. Hence generate local variables
    let variables = {}; //functionname -> list of variables occuring in this scope. global corresponds to ''-function
    let assigments = {};
    let myfunctions = this.myfunctions;

    rec(expr, ''); //global
    this.variables = variables;
    this.assigments = assigments;

    function rec(expr, fun) { //dfs over executed code
        if (!variables.hasOwnProperty(fun)) {
            variables[fun] = []; //list of variables
        }
        if (!assigments.hasOwnProperty(fun)) {
            assigments[fun] = {}; //map variables -> list of expressions
        }

        for (let i in expr['args']) {
            rec(expr['args'][i], fun);
        }

        //was there something happening to the (return)variables?
        if (expr['oper'] === '=') { //assignment to variable
            let vname = expr['args'][0]['name'];
            var scope = fun;
            if (variables[fun].indexOf(vname) === -1) { //no regional function found
                scope = ''; //consider global variable
                if (variables[scope].indexOf(vname) === -1) {
                    variables[scope].push(vname);
                    assigments[scope][vname] = [];
                }
            }
            //the scope of vname is scope
            assigments[scope][vname].push({
                expr: expr['args'][1], //variable in expr will interpreted in the scope of fun
                fun: fun
            });
            //rec(expr['args'][1], fun);
        } else if (expr['oper'] !== undefined && getPlainName(expr['oper']) === 'regional') {
            for (let i = 0; i < expr['args'].length; i++) {
                if (expr['args'][i]['ctype'] === 'variable') {
                    let vname = expr['args'][i]['name'];
                    if (variables[fun].indexOf(vname) === -1) {
                        variables[fun].push(vname);
                        assigments[fun][vname] = [];
                    }
                }
            }
        } else if (expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) { // call of user defined function
            let rfun = expr['oper']; //@TODO: Remove $...?
            if (!variables.hasOwnProperty(rfun)) {
                variables[rfun] = []; //list of variables
            }
            if (!assigments.hasOwnProperty(rfun)) {
                assigments[rfun] = {}; //map variables -> list of expressions
            }
            for (let i in myfunctions[rfun]['arglist']) {
                let a = myfunctions[rfun]['arglist'][i]['name'];
                variables[rfun].push(a);
                if (!assigments[rfun].hasOwnProperty(a)) assigments[rfun][a] = [];

                assigments[rfun][a].push({
                    expr: expr['args'][i],
                    fun: fun //the scope in which the function is called
                });
            }
            rec(myfunctions[rfun].body, rfun);


            //oh yes, the return variable of the function should be added as well
            //functions are always global
            if (variables[''].indexOf(rfun) === -1) {
                variables[''].push(rfun);
                assigments[''][rfun] = [{
                    expr: myfunctions[rfun]['body'],
                    fun: rfun //the expression above will be evalueted in scope of rfun
                }];
            }
        }
    }
};

/**
 * Computes the types of all occuring this.variables and user defined functions. These types are choosen such that the lca of all this.assigments
 */
CodeBuilder.prototype.determineTypes = function() {
    let changed = true;
    while (changed) {
        changed = false;
        //iterate over all scopes, their this.variables(and functions), and their rethis.assigments
        for (let s in this.assigments)
            for (let v in this.assigments[s])
                for (let i in this.assigments[s][v]) {
                    // variable  v (which lives in scope s) <- expression e in function f
                    let e = this.assigments[s][v][i].expr;
                    let f = this.assigments[s][v][i].fun;
                    let othertype = this.getType(e, f); //type of expression e in function f

                    let oldtype = nada;
                    if (this.T.hasOwnProperty(s) && this.T[s].hasOwnProperty(v)) oldtype = this.T[s][v];
                    let newtype = oldtype;

                    if (othertype !== nada) {
                        if (oldtype === nada) newtype = othertype;
                        else {
                            if (issubtypeof(othertype, oldtype)) newtype = oldtype; //dont change anything
                            else newtype = lca(oldtype, othertype);
                        }
                        if (newtype !== nada && newtype !== oldtype) {
                            if (!this.T.hasOwnProperty(s)) this.T[s] = {};

                            this.T[s][v] = newtype;
                            console.log("variable " + v + " in scope " + s + " got type " + typeToString(newtype) + " (oltype/othertype is " + typeToString(oldtype) + "/" + typeToString(othertype) + ")");

                            //console.log(this.T);
                            changed = true;
                        }
                    }
                }
    }
};


/**
 * computes the dict this.uniforms
 * and sets .uniformvariable
 * for all terms that have no child dependent on # or any variable dependent on #
 */
CodeBuilder.prototype.determineUniforms = function(expr) {
    var variableDependendsOnPixel = {
        '': {
            '#': true
        }
    }; //scope -> dict of this.variables being dependent on #

    //@rethink: include this.variables that change during plot call(like running this.variables in loops) as well.
    //variableDependendsOnPixel -> varyingVariable

    //@simplefix: assume wlog that every variable that appears on left sign of assigment is dependent on varying this.variables (if might be called or not, depending on #)

    let variables = this.variables;
    let myfunctions = this.myfunctions;


    function dependsOnPixel(expr, fun) {
        //Have we already found out that expr depends on pixel?
        if (expr.hasOwnProperty("dependsOnPixel") && expr["dependsOnPixel"] === true) {
            return true;
        }

        //Is expr a variable that depends on pixel? (according the current variableDependendsOnPixel)
        if (expr['ctype'] === 'variable') {
            let vname = expr['name'];

            if (variableDependendsOnPixel.hasOwnProperty(fun) && variableDependendsOnPixel[fun][vname]) { //local variable 
                return expr["dependsOnPixel"] = true;
            }
            if (variables[fun].indexOf(vname) === -1) { //no regional function found
                if ((variableDependendsOnPixel.hasOwnProperty('') && variableDependendsOnPixel[''][vname])) { //global variable
                    return expr["dependsOnPixel"] = true;
                }
            }
            return expr["dependsOnPixel"] = false;
        }

        //run recursion on all dependent arguments
        for (let i in expr['args']) {
            if (dependsOnPixel(expr['args'][i], fun)) {
                return expr["dependsOnPixel"] = true;
            }
        }

        //our random function is dependent on pixel!
        if (expr['ctype'] === 'function' && getPlainName(expr['oper']) === 'random') {
            return expr["dependsOnPixel"] = true;
        }

        //Oh yes, it also might be a user-defined function!
        if (expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) {
            let rfun = expr['oper'];
            if (!variableDependendsOnPixel.hasOwnProperty(rfun)) {
                variableDependendsOnPixel[rfun] = {}; //dict of dependent variables
            }
            if (dependsOnPixel(myfunctions[rfun].body, rfun)) {
                return expr["dependsOnPixel"] = true;
            }
        }

        //p.x
        if (expr['ctype'] === 'field') {
            return expr["dependsOnPixel"] = dependsOnPixel(expr['obj'], fun);
        }
        return false;
    }


    /*
    //try to expand the set of variablesDependentOnPixel as long as possible
    var changed = true;
    while(changed) {
      changed = false;
      //iterate over all scopes, their variables(and functions), and their reassigments
      for(let s in assigments) for(let v in assigments[s]) for(let i in assigments[s][v]) {
        // variable  v (which lives in scope s) <- expression e in function f
        let e = assigments[s][v][i].expr; 
        let f = assigments[s][v][i].fun;
        if(!variableDependendsOnPixel.hasOwnProperty(s)) {
          variableDependendsOnPixel[s] = {}; //dict of dependent variables
        }
        if(!variableDependendsOnPixel[s][v]) { 
          //try weather it actually is dependent
          if(dependsOnPixel(e, f)) {
            variableDependendsOnPixel[s][v] = true;
            changed = true;
          }
        }
      }
    }
    */
    //KISS-Fix: every variable appearing on left side of assigment is varying
    for (let s in this.assigments)
        for (let v in this.assigments[s]) { //scope s, variable v
            if (!variableDependendsOnPixel.hasOwnProperty(s)) {
                variableDependendsOnPixel[s] = {}; //dict of dependent variables
            }
            variableDependendsOnPixel[s][v] = true;
        }

    //run expression to get all expr["dependsOnPixel"]
    dependsOnPixel(expr, '');

    let visitedFunctions = {
        '': true
    };

    let uniforms = {};
    //now find use those elements in expression trees that have no expr["dependsOnPixel"] and as high as possible having that property
    function computeUniforms(expr, fun) {
        if (dependsOnPixel(expr, fun)) {
            //then run recursively on all childs
            for (let i in expr['args']) {
                computeUniforms(expr['args'][i], fun);
            }

            if (expr['ctype'] === 'field') {
                computeUniforms(expr['obj'], fun);
            }

            //Oh yes, it also might be a user-defined function!
            if (expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) {
                let rfun = expr['oper'];
                if (!visitedFunctions.hasOwnProperty(rfun)) { //only do this once per function
                    visitedFunctions[rfun] = true;
                    computeUniforms(myfunctions[rfun].body, rfun);
                }
            }
        } else {
            //assert that parent node was dependent on uniform
            //we found a highest child that is not dependent -> this will be a candidate for a uniform!

            //To pass constant numbers as uniforms is overkill
            if (expr['ctype'] === 'number') return;

            //nothing to pass
            if (expr['ctype'] === 'void') return;

            //check whether uniform with same expression has already been generated. Note this causes O(n^2) running time :/ One might use a hashmap if it becomes relevant
            let found = false;
            let uname;
            for (let otheruname in uniforms)
                if (!found) {
                    if (expressionsAreEqual(expr, uniforms[otheruname].expr)) {
                        found = true;
                        uname = otheruname;
                    }
                }
            if (!found) {
                uname = generateUniqueHelperString();
                uniforms[uname] = {
                    expr: expr,
                    type: nada
                };
            }

            expr["isuniform"] = true;
            expr["uvariable"] = uname;

        }
    }


    computeUniforms(expr, '');
    this.uniforms = uniforms;
};


CodeBuilder.prototype.determineUniformTypes = function() {
    for (let uname in this.uniforms) {
        //Default value
        this.uniforms[uname].type = type.float; //every cindyJS number can be interpreted as complex.

        //TODO: check wether type was specified by modifier?

        let tval = this.api.evaluateAndVal(this.uniforms[uname].expr);


        this.uniforms[uname].type = guessTypeOfValue(tval);

        //TODO: list...    TODO: why are points evaluated to ints?
        console.log("guessed type " + typeToString(this.uniforms[uname].type) + " for " + JSON.stringify(this.uniforms[uname].expr['name']));
    }
};

/**
 * examines recursively all code generates myfunctions, which is cloned from results from api.getMyfunction(...)
 */
CodeBuilder.prototype.copyRequiredFunctions = function(expr) {
    if (expr['ctype'] === 'function' && !this.myfunctions.hasOwnProperty(expr['oper']) && this.api.getMyfunction(expr['oper']) !== null) { //copy and transverse recursively all occuring myfunctions
        let fun = expr['oper'];
        this.myfunctions[fun] = cloneExpression(this.api.getMyfunction(fun));
        this.copyRequiredFunctions(this.myfunctions[fun].body);
    }
    for (let i in expr['args']) {
        this.copyRequiredFunctions(expr['args'][i]);
    }
}


CodeBuilder.prototype.precompile = function(expr) {
    this.precompileDone = false;

    this.copyRequiredFunctions(expr);
    this.determineVariables(expr);
    this.determineUniforms(expr);
    this.determineUniformTypes();

    this.determineTypes();
    this.precompileDone = true;
};


/**
 * compiles an CindyJS-expression to GLSL-Code
 * generateTerm = true <-> returns a term that corresponds to value of expression, precode might be generated
 * @returns: {code: string of precode that has evaluated before it is possible to evalue expr
 * [if generateTerm then also with the additional keys] term: expression in webgl, type: type of expression }
 */

CodeBuilder.prototype.compile = function(expr, scope, generateTerm) {
    var self = this; //for some reason recursion on this does not work, hence we create a copy; see http://stackoverflow.com/questions/18994712/recursive-call-within-prototype-function
    if (expr['isuniform']) {
        let uname = expr['uvariable'];
        let uniforms = this.uniforms;
        let ctype = uniforms[uname].type;
        return generateTerm ? {
            code: '',
            term: uname,
            type: ctype
        } : {
            code: ''
        };
    }
    if (expr['oper'] === ";") {
        /*
        let r0 = this.compile(expr['args'][0], scope, false);
        let r1 = this.compile(expr['args'][1], scope, generateTerm);
        let code = r0.code + r1.code;// + ((c.hasOwnProperty(expr)) ? '' : (c.expr + ';\n'));
        //let r = generateTerm ? this.compile(expr['args'][1], true) : this.compile(expr['args'][1], false);
        return generateTerm ? {code: code, term: r1.term, type:r1.type} : {code: code};
        */


        //arbitrary number of arguments, e.g. only 1

        //let r = new Array(expr['args'].length);
        let r = {
            type: type.voidt,
            term: ''
        }; //default return value
        let code = '';
        let lastindex = expr['args'].length - 1;
        for (let i = lastindex; i >= 0; i--) {
            if (expr['args'][i]['ctype'] === 'void') lastindex--; //take last non-void entry
        }

        for (let i = 0; i <= lastindex; i++) {
            r = this.compile(expr['args'][i], scope, generateTerm && (i === lastindex)); //last one is responsible to generate term if required
            code += r.code;
        }

        return generateTerm ? {
            code: code,
            term: r.term,
            type: r.type
        } : {
            code: code
        };

    } else if (expr['oper'] === "=") {
        let r = this.compile(expr['args'][1], scope, true);
        let varname = expr['args'][0]['name']
            //console.log(scope);
            //console.log(varname);
        let t = varname + ' = ' + this.castType(r.term, r.type, this.getType(expr['args'][0], scope));
        if (generateTerm) {
            return {
                code: r.code,
                term: t,
                type: this.T[scope][varname]
            };
        } else {
            return {
                code: r.code + t + ';\n'
            }
        }
    } else if (expr['oper'] === "repeat$2") {
        if (expr['args'][0]['ctype'] !== 'number') {
            console.error('repeat possible only for fixed constant number in GLSL');
            return nada;
        }
        let it = generateUniqueHelperString();
        let n = (expr['args'][0]['value']['real'] | 0); //TODO use some internal function like evalCS etc.
        let r = this.compile(expr['args'][1], scope, generateTerm);

        let code = '';
        let ans = '';
        let ansvar = '';

        if (generateTerm) {
            ansvar = generateUniqueHelperString();
            code += webgltype[r.type] + ' ' + ansvar + ';'; //initial ansvar
        }
        code += 'for(int ' + it + '=0; ' + it + ' < ' + n + '; ' + it + '++) {\n';
        code += r.code;
        if (generateTerm) {
            code += ansvar + ' = ' + r.term + ';\n';
        }
        code += '}\n';
        return (generateTerm ? {
            code: code,
            term: ansvar,
            type: r.type
        } : {
            code: code
        });
    } else if (expr['oper'] === "repeat$3") {
        console.error("TODO");
        //@TODO implement with manual variable
    } else if (expr['oper'] === "if$2" || expr['oper'] === "if$3") {
        let cond = this.compile(expr['args'][0], scope, true);
        let ifbranch = this.compile(expr['args'][1], scope, generateTerm);

        let code = '';
        let ans = '';
        let ansvar = '';

        let termtype = this.getType(expr, scope);

        if (generateTerm) {
            ansvar = generateUniqueHelperString();
            code += webgltype[termtype] + ' ' + ansvar + ';'; //initial ansvar
        }
        code += cond.code;
        code += 'if(' + cond.term + ') {\n';
        code += ifbranch.code;
        if (generateTerm) {
            code += ansvar + ' = ' + this.castType(ifbranch.term, ifbranch.type, termtype) + ';\n';
        }

        if (expr['oper'] === "if$3") {
            let elsebranch = this.compile(expr['args'][2], scope, generateTerm);
            code += '} else {\n';
            code += elsebranch.code;
            if (generateTerm) {
                code += ansvar + ' = ' + this.castType(elsebranch.term, elsebranch.type, termtype) + ';\n';
            }
        }
        code += '}\n';
        return (generateTerm ? {
            code: code,
            term: ansvar,
            type: termtype
        } : {
            code: code
        });
        //@TODO implement if$2
    } else if (expr['ctype'] === "function" || expr['ctype'] === "infix") {
        let fname = expr['oper'];

        //console.log(JSON.stringify(expr));
        //console.log("this:" + JSON.stringify(this));

        let r = expr['args'].map(e => self.compile(e, scope, true)); //recursion on all arguments

        let termGenerator;


        //console.log('recursion in scope ' + scope);
        //console.log(expr);
        //console.log(fname);
        //console.log(r);//TODO remove

        let currenttype = r.map(c => c.type);
        let targettype;
        let restype;

        if (this.myfunctions.hasOwnProperty(fname)) { //user defined function
            termGenerator = this.usemyfunction(fname);
            targettype = new Array(r.length)
            for (let i = 0; i < r.length; i++) {
                targettype[i] = this.T[fname][this.myfunctions[fname]['arglist'][i]['name']];
            }

            restype = this.T[''][fname];

        } else { //cindyscript-function
            fname = getPlainName(fname);
            if (fname === 'regional')
                return (generateTerm ? {
                    term: '',
                    type: type.voidt,
                    code: ''
                } : {
                    code: ''
                });
            let signature = matchSignature(fname, currenttype);
            if (signature === nada) {
                console.error("Could not find a signature for " + fname + '(' + currenttype.map(typeToString).join(', ') + ').\n' +
                    "Returning empty code");
                return (generateTerm ? {
                    term: '',
                    type: type.voidt,
                    code: ''
                } : {
                    code: ''
                });
            }
            //console.log("got the following signature for function " + fname + " and types " + typeToString(currenttype));
            //console.log(signature);
            targettype = signature.args;
            restype = signature.res;
            termGenerator = nada;
            for (let i in webgltr[fname]) {
                if (signaturesAreEqual(webgltr[fname][i][0], signature)) {
                    termGenerator = webgltr[fname][i][1];
                    break;
                }
            }
            if (termGenerator === nada) {
                console.error("There is no webgl-implementation for " + fname + '(' + signature.args.map(typeToString).join(', ') + ').\n' +
                    'default: Try glsl-function with same name'
                );
                termGenerator = (args => fname + '(' + args.join(', ') + ')');
            }
        }

        let code = '';
        let argterms = new Array(r.length);
        for (let i = 0; i < r.length; i++) {
            code += r[i].code;
            argterms[i] = this.castType(r[i].term, currenttype[i], targettype[i]);

        }
        //console.log("Running Term Generator with arguments" + JSON.stringify(argterms) + " and this: " + JSON.stringify(this));
        let term = termGenerator(argterms, expr['modifs'], this);
        //console.log(termGenerator);
        //console.log(termGenerator([1]));
        //console.log("generated the following term:" + term);
        if (generateTerm)
            return {
                term: term,
                type: restype,
                code: code
            };
        else
            return {
                code: code + term + ';\n'
            };
    } else if (expr['ctype'] === 'number') { //write numbers(int, float, complex) directly in code
        let termtype = this.getType(expr, scope);
        let term;

        if (termtype === type.int) term = (expr['value']['real'] | 0);
        else if (termtype === type.float) term = expr['value']['real'];
        else if (termtype === type.complex) term = 'vec2( ' + expr['value']['real'] + ', ' + expr['value']['imag'] + ')';

        return (generateTerm ? {
            term: term,
            type: termtype,
            code: ''
        } : {
            code: termtype + ';\n'
        });
    } else if (expr['ctype'] === 'string') { //just copy strings directly into glsl. Useful for example for names of textures
        /*let termtype = type.string;
            let term = expr['value'];
            return (generateTerm ? {
                term: term,
                type: termtype,
                code: ''
            } : {
                code: termtype + ';\n'
        });*/
        console.error("Cannot compile strings to WebGL.");
        return nada;
    } else if (expr['ctype'] === "variable") {
        let termtype = this.getType(expr, scope);

        let term = expr['name'];

        if (term === '#') { //TODO: This could be passed by some additional argument: Or # could be inside repeat-loop...
            term = 'cgl_pixel';
        }
        return (generateTerm ? {
            term: term,
            type: termtype,
            code: ''
        } : {
            code: term + ';\n'
        });
    } else if (expr['ctype'] === "void") {
        return (generateTerm ? {
            term: '',
            type: type.voidt,
            code: ''
        } : {
            code: ''
        });
    } else if (expr['ctype'] === 'field') {
        //TODO: finish implementation once cindyJS got implementation
        let termtype = this.getType(expr, scope);
        let term = self.compile(expr['obj'], scope, true).term;
        /*
        if (term === '#') {
          term = 'cgl_pixel';
        }*/
        term += '.' + expr['key']; //for .x .y. z .r .g .b things are same in cindyjs and glsl
        return (generateTerm ? {
            term: term,
            type: termtype,
            code: ''
        } : {
            code: term + ';\n'
        });
    }
    console.error("dont know how to this.compile " + JSON.stringify(expr));

};


CodeBuilder.prototype.usemyfunction = function(fname) {
    this.compileFunction(fname, this.myfunctions[fname]['arglist'].length);
    return usefunction(fname);
};


CodeBuilder.prototype.compileFunction = function(fname, nargs) {
    var self = this;
    if (this.hasbeencompiled.hasOwnProperty(fname)) return;
    this.hasbeencompiled[fname] = true; //visited

    let m = this.myfunctions[fname]; // + '$' + nargs];

    let vars = new Array(nargs);
    for (let i = 0; i < nargs; i++) {
        vars[i] = m['arglist'][i]['name'];
    }
    let isvoid = (webgltype[this.T[''][fname]] === type.voidt);

    let code = webgltype[this.T[''][fname]] /*TODO: mach das schoener*/ + ' ' + getPlainName(fname) +
        '(' + vars.map(varname => webgltype[self.T[fname][varname]] + ' ' + varname).join(', ') + ')' + '{\n';
    for (let i in this.variables[fname]) {
        let doprint = true;
        let varname = this.variables[fname][i];
        for (let j = 0; j < vars.length; j++) doprint &= (varname !== vars[j]);
        if (doprint) code += webgltype[this.T[fname][varname]] + ' ' + varname + ';\n';
    }
    let r = self.compile(m.body, fname, !isvoid);
    code += r.code;
    //console.log(r);
    if (!isvoid)
        code += 'return ' + this.castType(r.term, r.type, this.T[''][fname]) + ';\n'; //TODO REPL 
    code += '}\n';


    this.compiledfunctions.push(code);
};

CodeBuilder.prototype.generateListOfUniforms = function() {
    let ans = [];
    for (let uname in this.uniforms)
        if (this.uniforms[uname].type != type.image)
            ans.push('uniform ' + webgltype[this.uniforms[uname].type] + ' ' + uname + ';');
    return ans.join('\n');
};

CodeBuilder.prototype.generateHeaderOfCompiledFunctions = function() {
    return this.compiledfunctions.join('\n');
};

CodeBuilder.prototype.generateColorPlotProgram = function(expr) { //TODO add arguments for #
    expr = cloneExpression(expr); //then we can write dirty things on expr...

    this.precompile(expr); //determine this.variables, types etc.
    let r = this.compile(expr, '', true);
    let colorterm = this.castType(r.term, r.type, type.color);

    if (!issubtypeof(r.type, type.color)) {
        console.error("expression does not generate a color");
    }
    let code = this.generateListOfUniforms();
    code += generateHeaderOfTextureReaders(this);
    code += generateHeaderOfIncludedFunctions(this);

    for (let i in this.variables['']) { //global this.variables
        let varname = this.variables[''][i];
        if (this.myfunctions.hasOwnProperty(varname)) continue; //only consider real this.variables
        code += webgltype[this.T[''][varname]] + ' ' + varname + ';\n';
    }

    code += this.generateHeaderOfCompiledFunctions();

    code += 'void main(void) {\n' +
        r.code +
        'gl_FragColor = ' + colorterm + ';\n' +
        //'gl_FragColor.a = 1.;\n' +
        '}\n';

    console.log(code);

    return {
        code: code,
        uniforms: this.uniforms,
        texturereaders: this.texturereaders
    };
};
