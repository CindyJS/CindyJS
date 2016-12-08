/**
 * @constructor
 */
function CodeBuilder(api) {
    this.variables = {};
    this.uniforms = {};
    this.scopes = {};

    this.sections = {};

    this.precompileDone = false;
    this.myfunctions = {};
    this.api = api;
    this.texturereaders = {};
}

/** @type {Object} */
CodeBuilder.prototype.sections;

/**
 * adds a snipped of code to the header of the current code builder and marks the corresponding identifier
 * Ignores call if code has already been added to the identifier in the given section.
 * @param {string} section section to which the code is suppoed to be added
 * @param {string} name an identifier for the corresponding code
 * @param {function():string} codegen is a callback that generates code to be added (at the end of the corresponding section)
 */
CodeBuilder.prototype.add = function(section, name, codegen) {
    this.mark(section, name);
    if (!this.sections[section].codes[name]) {
        //console.log(`adding ${name} to ${section}: ${code}`);
        this.sections[section].codes[name] = codegen();
        this.sections[section].marked[name] = true;
        this.sections[section].order.push(name);
    }
};

/**
 * marks a given identifier in a given section.
 * returns wheather code with a given identifier has been marked before
 * @param {string} section section to which the code is suppoed to be marked
 * @param {string} name an identifier
 */
CodeBuilder.prototype.mark = function(section, name) {
    if (!this.sections[section]) this.sections[section] = {
        order: [],
        marked: {},
        codes: {}
    };
    let r = this.sections[section].marked[name] || false;
    this.sections[section].marked[name] = true;
    return r;
};

/**
 * returns the entire section code in correct order
 * @param {string} section
 * @return {string}
 */
CodeBuilder.prototype.generateSection = function(section) {
    return this.sections[section] ?
        this.sections[section].order.map(name => this.sections[section].codes[name]).join('\n') : '\n';
};


/** @dict @type {Object} */
CodeBuilder.prototype.myfunctions;

/** @dict @type {boolean} */
CodeBuilder.prototype.precompileDone;

/** @dict @type {Object} */
CodeBuilder.prototype.variables;

/** @dict @type {Object} */
CodeBuilder.prototype.uniforms;

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
    if (typesareequal(fromType, toType)) return term;
    if (fromType === type.anytype) return term;

    if (!issubtypeof(fromType, toType)) {
        console.error(`${typeToString(fromType)} is no subtype of ${typeToString(toType)} (trying to cast the term ${term})`);
        return term;
    } else if (fromType.type === "constant") {
        return pastevalue(fromType.value, toType);
    } else {
        let implementation = inclusionfunction(toType)([fromType]);
        if (!implementation) {
            console.error(`cannot find an implementation for ${typeToString(fromType)} -> ${typeToString(toType)}, using identity`);
            return term;
        }
        let generator = implementation.generator;

        return generator(this.castType(term, fromType, implementation.args[0]), {}, this);
    }
};

/**
 * Initializes the entry in this.variables for the variable with given name if it is not initialized yet.
 */
CodeBuilder.prototype.initvariable = function(vname, declareglobal) {
    if (!this.variables[vname]) this.variables[vname] = {};
    if (!this.variables[vname].assigments) this.variables[vname].assigments = [];
    if (!this.variables[vname].T) this.variables[vname].T = false;
    if (!this.hasOwnProperty('global')) this.variables[vname]['global'] = declareglobal;
};

/**
 * computes the type of the expr, assuming it is evaluated with the given variable-bindings
 * It might consider the type of variables (variables[name].T)
 */
CodeBuilder.prototype.computeType = function(expr) { //expression, current function
    let bindings = expr.bindings;
    if (expr['isuniform']) {
        return this.uniforms[expr['uvariable']].type;
    } else if (expr['ctype'] === 'variable') {
        let name = expr['name'];
        name = bindings[name] || name;
        return this.variables[name].T;
    } else if (expr['ctype'] === 'function' && this.myfunctions.hasOwnProperty(expr['oper'])) {
        return this.variables[bindings[expr['oper']]].T;
    } else if (expr['ctype'] === 'number') {
        return constant(expr);
    } else if (expr['ctype'] === 'void') {
        return type.voidt;
    } else if (expr['ctype'] === 'field') {
        return type.float; //so far we only have field indexes vor vec2, vec3, vec4
    } else if (expr['ctype'] === 'string') {
        return type.image;
    } else if (expr['ctype'] === 'function' || expr['ctype'] === 'infix') {
        var argtypes = new Array(expr['args'].length);
        for (let i = 0; i < expr['args'].length; i++) {
            argtypes[i] = this.getType(expr['args'][i]);
        }
        let f = getPlainName(expr['oper']);
        let implementation = webgl[f] ? webgl[f](argtypes) : false;
        if (!implementation && argtypes.every(a => a)) //no implementation found and all args are set
            console.error(`Could not find an implementation for ${f} with args (${argtypes.map(typeToString).join(', ')})`);
        return implementation ? implementation.res : false;
    }
    console.error("Don't know how to compute type of");
    console.log(expr);
    return false;
};

/**
 * gets the type of the expr, trying to use cached results. Otherwise it will call computeType
 */
CodeBuilder.prototype.getType = function(expr) { //expression, current function
    if (!this.precompileDone || !expr.hasOwnProperty("computedType"))
        expr["computedType"] = this.computeType(expr);
    return expr["computedType"];
};

/**
 * finds the occuring variables, saves them to this.variables with their occuring assigmets.
 * Furthermore attaches an bindings-dictionary to each expression that is tranversed.
 */
CodeBuilder.prototype.determineVariables = function(expr, bindings) {
    //for some reason this reference does not work in local function. Hence generate local variables
    let variables = this.variables; //functionname -> list of variables occuring in this scope. global corresponds to ''-function
    let myfunctions = this.myfunctions;
    var self = this;

    rec(expr, bindings, 'global');

    //clones the a bindings-dict and addes one variable of given type to it
    function addvar(bindings, varname, type) {
        let ans = {}; //clone bindings
        for (let i in bindings) ans[i] = bindings[i];
        let ivar = generateUniqueHelperString();
        self.initvariable(ivar, false);
        variables[ivar].T = type;
        variables[ivar].iterationvariable = true;
        ans[varname] = ivar;
        return ans;
    }

    //dfs over executed code
    function rec(expr, bindings, scope) {
        expr.bindings = bindings;
        bindings = (expr['oper'] === "repeat$2") ? addvar(bindings, '#', type.int) :
            (expr['oper'] === "repeat$3") ? addvar(bindings, expr['args'][1]['name'], type.int) :
            bindings;

        for (let i in expr['args']) rec(expr['args'][i], bindings, scope);
        if (expr['ctype'] === 'field') rec(expr['obj'], bindings, scope);

        //was there something happening to the (return)variables?
        if (expr['oper'] === '=') { //assignment to variable
            let vname = expr['args'][0]['name'];
            vname = bindings[vname] || vname;

            self.initvariable(vname, true);
            variables[vname].assigments.push(expr['args'][1]);
        } else if (expr['oper'] && getPlainName(expr['oper']) === 'regional' && scope != 'global') {
            for (let i in expr['args']) {
                let vname = expr['args'][i]['name'];
                let iname = generateUniqueHelperString();
                bindings[vname] = iname;

                if (!myfunctions[scope].variables) myfunctions[scope].variables = [];
                myfunctions[scope].variables.push(iname);
                self.initvariable(iname, false);
            }
        } else if (expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) { // call of user defined function
            let rfun = expr['oper'];
            let pname = rfun.replace('$', '_'); //remove $
            self.initvariable(pname, false);
            bindings[rfun] = pname;

            let localbindungs = {};
            for (let i in myfunctions[rfun]['arglist']) {
                let localname = myfunctions[rfun]['arglist'][i]['name'];
                let a = pname + '_' + localname;
                localbindungs[localname] = a;

                self.initvariable(a, false);
                variables[a].assigments.push(expr['args'][i]);
            }
            if (!myfunctions[rfun].visited) {
                myfunctions[rfun].visited = true;
                rec(myfunctions[rfun]['body'], localbindungs, rfun);

                //the return variable of the function should be added as well
                variables[pname].assigments.push(myfunctions[rfun]['body']); //the expression will be evalueted in scope of rfun
            }
        }
    }
};

/**
 * Computes the types of all occuring this.variables and user defined functions. These types are choosen such that the lca of all this.assigments
 */
CodeBuilder.prototype.determineTypes = function() {
    let changed = true;

    for (let v in this.variables) {
        this.variables[v].T = this.variables[v].T || false; //false corresponds no type yet
    }

    while (changed) { //TODO: implement queue to make this faster
        changed = false;
        for (let v in this.variables) {
            for (let i in this.variables[v].assigments) {
                let e = this.variables[v].assigments[i];
                let othertype = generalize(this.getType(e)); //type of expression e in function f
                let oldtype = this.variables[v].T || false;
                let newtype = oldtype;
                if (othertype) {
                    if (!oldtype) newtype = othertype;
                    else {
                        if (issubtypeof(othertype, oldtype)) newtype = oldtype; //dont change anything
                        else newtype = lca(oldtype, othertype);
                    }
                    if (newtype && newtype !== oldtype) {
                        this.variables[v].T = newtype;
                        //console.log(`variable ${v} got type ${typeToString(newtype)} (oltype/othertype is ${typeToString(oldtype)}/${typeToString(othertype)})`);
                        changed = true;
                    }
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
    let variables = this.variables;
    let myfunctions = this.myfunctions;

    var variableDependendsOnPixel = {
        'cgl_pixel': true
    }; //dict of this.variables being dependent on #

    //KISS-Fix: every variable appearing on left side of assigment is varying
    for (let v in variables)
        if (variables[v].assigments.length >= 1 || variables[v].iterationvariable)
            variableDependendsOnPixel[v] = true;
        //run expression to get all expr["dependsOnPixel"]
    dependsOnPixel(expr);


    let visitedFunctions = {
        '': true
    };

    let uniforms = this.uniforms;
    computeUniforms(expr, false);


    function dependsOnPixel(expr) {
        //Have we already found out that expr depends on pixel?
        if (expr.hasOwnProperty("dependsOnPixel")) {
            return expr["dependsOnPixel"];
        }

        //Is expr a variable that depends on pixel? (according the current variableDependendsOnPixel)
        if (expr['ctype'] === 'variable') {
            let vname = expr['name'];
            vname = expr.bindings[vname] || vname;
            if (variableDependendsOnPixel[vname]) {
                return expr["dependsOnPixel"] = true;
            }
            return expr["dependsOnPixel"] = false;
        }

        let alwaysPixelDependent = [ //Operators that are supposed to be interpreted as pixel dependent;
            'random', //our random function is dependent on pixel!
            'verbatimglsl' //we dont analyse verbatimglsl functions
        ];
        if (expr['ctype'] === 'function' && alwaysPixelDependent.indexOf(getPlainName(expr['oper'])) != -1) {
            return expr["dependsOnPixel"] = true;
        }

        //repeat is pixel dependent iff it's code is pixel dependent. Then it also makes the running variable pixel dependent.
        if (expr['oper'] === "repeat$2") {
            if (dependsOnPixel(expr['args'][1])) {
                variableDependendsOnPixel[expr['args'][1].bindings['#']] = true;
                return expr["dependsOnPixel"] = true;
            } else return expr["dependsOnPixel"] = false;
        } else if (expr['oper'] === "repeat$3") {
            if (dependsOnPixel(expr['args'][2])) {
                variableDependendsOnPixel[expr['args'][2].bindings[expr['args'][1]['name']]] = true;
                expr['args'][1]["dependsOnPixel"] = true;
                return expr["dependsOnPixel"] = true;
            } else return expr["dependsOnPixel"] = false;
        }

        //run recursion on all dependent arguments
        for (let i in expr['args']) {
            if (dependsOnPixel(expr['args'][i])) {
                return expr["dependsOnPixel"] = true;
            }
        }

        //Oh yes, it also might be a user-defined function!
        if (expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) {
            let rfun = expr['oper'];
            if (dependsOnPixel(myfunctions[rfun].body)) {
                return expr["dependsOnPixel"] = true;
            }
        }

        //p.x
        if (expr['ctype'] === 'field') {
            return expr["dependsOnPixel"] = dependsOnPixel(expr['obj']);
        }
        return expr["dependsOnPixel"] = false;
    }

    //now find use those elements in expression trees that have no expr["dependsOnPixel"] and as high as possible having that property
    function computeUniforms(expr, forceconstant) {
        if (dependsOnPixel(expr)) {
            //then run recursively on all childs
            for (let i in expr['args']) {
                let needtobeconstant = forceconstant || (expr['oper'] === "repeat$2" && i == 0) || (expr['oper'] === "repeat$3" && i == 0) || (expr['oper'] === "_" && i == 1);
                computeUniforms(expr['args'][i], needtobeconstant);
            }

            if (expr['ctype'] === 'field') {
                computeUniforms(expr['obj'], forceconstant);
            }

            //Oh yes, it also might be a user-defined function!
            if (expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) {
                let rfun = expr['oper'];
                if (!visitedFunctions.hasOwnProperty(rfun)) { //only do this once per function
                    visitedFunctions[rfun] = true;
                    computeUniforms(myfunctions[rfun].body, forceconstant);
                }
            }
        } else {
            //assert that parent node was dependent on pixel
            //we found a highest child that is not dependent -> this will be a candidate for a uniform!

            //To pass constant numbers as uniforms is overkill
            //TODO better: if it does not contain variables or functions
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
                    type: false,
                    forceconstant: forceconstant
                };
            }
            expr["isuniform"] = true;
            expr["uvariable"] = uname;
        }
    }
};


CodeBuilder.prototype.determineUniformTypes = function() {
    for (let uname in this.uniforms) {
        let tval = this.api.evaluateAndVal(this.uniforms[uname].expr);
        this.uniforms[uname].type = this.uniforms[uname].forceconstant ? constant(tval) : guessTypeOfValue(tval);
        //console.log(`guessed type ${typeToString(this.uniforms[uname].type)} for ${(this.uniforms[uname].expr['name']) || (this.uniforms[uname].expr['oper'])}`);
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


CodeBuilder.prototype.precompile = function(expr, bindings) {
    this.precompileDone = false;
    this.copyRequiredFunctions(expr);
    this.determineVariables(expr, bindings);
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

CodeBuilder.prototype.compile = function(expr, generateTerm) {
    var self = this; //for some reason recursion on this does not work, hence we create a copy; see http://stackoverflow.com/questions/18994712/recursive-call-within-prototype-function
    if (expr['isuniform']) {
        let uname = expr['uvariable'];
        let uniforms = this.uniforms;
        let ctype = uniforms[uname].type;
        return generateTerm ? {
            code: '',
            term: ctype.type === 'constant' ? pastevalue(ctype.value, generalize(ctype)) : uname,
            type: ctype
        } : {
            code: ''
        };
    } else if (expr['oper'] === ";") {
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
            r = this.compile(expr['args'][i], generateTerm && (i === lastindex)); //last one is responsible to generate term if required
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
        let r = this.compile(expr['args'][1], true);
        let varname = expr['args'][0]['name']
        varname = expr.bindings[varname] || varname;
        let t = `${varname} = ${this.castType(r.term, r.type, this.getType(expr['args'][0]))}`;
        if (generateTerm) {
            return {
                code: r.code,
                term: t,
                type: this.variables[varname].T
            };
        } else {
            return {
                code: `${r.code + t};\n`
            }
        }
    } else if (expr['oper'] === "repeat$2" || expr['oper'] === "repeat$3") {
        let number = this.compile(expr['args'][0], true);
        if (number.type.type !== 'constant') {
            console.error('repeat possible only for fixed constant number in GLSL');
            return false;
        }
        let it = (expr['oper'] === "repeat$2") ? expr['args'][1].bindings['#'] :
            expr['args'][2].bindings[expr['args'][1]['name']] //(expr['oper'] === "repeat$3")
        ;
        let n = number.term;
        let r = this.compile(expr['args'][(expr['oper'] === "repeat$2") ? 1 : 2], generateTerm);

        let code = '';
        let ans = '';
        let ansvar = '';

        if (generateTerm) {
            ansvar = generateUniqueHelperString();
            code += `${webgltype(r.type)} ${ansvar};`; //initial ansvar
        }
        code += `for(int ${it}=1; ${it} <= ${n}; ${it}++) {\n`;
        code += r.code;
        if (generateTerm) {
            code += `${ansvar} = ${r.term};\n`;
        }
        code += '}\n';
        return (generateTerm ? {
            code: code,
            term: ansvar,
            type: r.type
        } : {
            code: code
        });
    } else if (expr['oper'] === "if$2" || expr['oper'] === "if$3") {
        let cond = this.compile(expr['args'][0], true);
        let ifbranch = this.compile(expr['args'][1], generateTerm);

        let code = '';
        let ans = '';
        let ansvar = '';

        let termtype = this.getType(expr);

        if (generateTerm) {
            ansvar = generateUniqueHelperString();
            code += `${webgltype(termtype)} ${ansvar};`; //initial ansvar
        }
        code += cond.code;
        code += `if(${cond.term}) {\n`;
        code += ifbranch.code;
        if (generateTerm) {
            code += `${ansvar} = ${this.castType(ifbranch.term, ifbranch.type, termtype)};\n`;
        }

        if (expr['oper'] === "if$3") {
            let elsebranch = this.compile(expr['args'][2], generateTerm);
            code += '} else {\n';
            code += elsebranch.code;
            if (generateTerm) {
                code += `${ansvar} = ${this.castType(elsebranch.term, elsebranch.type, termtype)};\n`;
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

        if (getPlainName(fname) === 'verbatimglsl') {
            let glsl = this.api.evaluateAndVal(expr['args'][0]).value;
            return (generateTerm ? {
                term: glsl,
                type: type.anytype,
                code: ''
            } : {
                code: glsl
            });
        }

        let r = expr['args'].map(e => self.compile(e, true)); //recursion on all arguments

        let termGenerator;

        let currenttype = r.map(c => c.type);
        let targettype;
        let restype;

        if (this.myfunctions.hasOwnProperty(fname)) { //user defined function
            termGenerator = this.usemyfunction(fname);
            targettype = new Array(r.length)
            for (let i = 0; i < r.length; i++) {
                targettype[i] = this.variables[this.myfunctions[fname].body.bindings[this.myfunctions[fname]['arglist'][i]['name']]].T;
            }
            restype = this.variables[expr.bindings[fname]].T;
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


            let implementation = webgl[fname](currenttype);
            if (!implementation) {
                console.error(`Could not find an implementation for ${fname}(${currenttype.map(typeToString).join(', ')}).\nReturning empty code`);
                return (generateTerm ? {
                    term: '',
                    type: type.voidt,
                    code: ''
                } : {
                    code: ''
                });
            }

            targettype = implementation.args;
            restype = implementation.res;
            termGenerator = implementation.generator;
        }

        let code = '';
        let argterms = new Array(r.length);
        for (let i = 0; i < r.length; i++) {
            code += r[i].code;
            argterms[i] = this.castType(r[i].term, currenttype[i], targettype[i]);

        }
        //console.log("Running Term Generator with arguments" + JSON.stringify(argterms) + " and this: " + JSON.stringify(this));
        let term = termGenerator(argterms, expr['modifs'], this);
        //console.log("generated the following term:" + term);
        if (generateTerm)
            return {
                term: term,
                type: restype,
                code: code
            };
        else
            return {
                code: `${code + term};\n`
            };
    } else if (expr['ctype'] === 'number') { //write numbers(int, float, complex) directly in code
        let termtype = this.getType(expr);
        let term = pastevalue(expr, guessTypeOfValue(expr));
        return (generateTerm ? {
            term: term,
            type: termtype,
            code: ''
        } : {
            code: `${termtype};\n`
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
        return false;
    } else if (expr['ctype'] === "variable") {
        let termtype = this.getType(expr);
        let term = expr['name'];
        term = expr.bindings[term] || term;
        return (generateTerm ? {
            term: term,
            type: termtype,
            code: ''
        } : {
            code: `${term};\n`
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
        let termtype = this.getType(expr);
        let term = self.compile(expr['obj'], true).term;
        term += `.${expr['key']}`; //for .x .y. z .r .g .b things are same in cindyjs and glsl
        return (generateTerm ? {
            term: term,
            type: termtype,
            code: ''
        } : {
            code: `${term};\n`
        });
    }
    console.error(`dont know how to this.compile ${JSON.stringify(expr)}`);

};


CodeBuilder.prototype.usemyfunction = function(fname) {
    this.compileFunction(fname, this.myfunctions[fname]['arglist'].length);
    return usefunction(fname.replace('$', '_'));
};


CodeBuilder.prototype.compileFunction = function(fname, nargs) {
    var self = this;
    if (this.mark('compiledfunctions', fname)) return; //visited

    let m = this.myfunctions[fname];
    let pname = fname.replace('$', '_'); //remove $
    let bindings = m.body.bindings;

    let vars = new Array(nargs);
    for (let i = 0; i < nargs; i++) {
        vars[i] = m['arglist'][i]['name'];
    }
    let isvoid = (this.variables[pname].T === type.voidt);

    let code = `${webgltype(this.variables[pname].T)} ${pname}(${vars.map(varname => webgltype(self.variables[bindings[varname]].T) + ' ' + bindings[varname]).join(', ')}){\n`;
    for (let i in m.variables) {
        let iname = m.variables[i];
        code += `${webgltype(this.variables[iname].T)} ${iname};\n`;
    }
    let r = self.compile(m.body, !isvoid);
    code += r.code;
    if (!isvoid)
        code += `return ${this.castType(r.term, r.type, this.variables[pname].T)};\n`; //TODO REPL
    code += '}\n';

    this.add('compiledfunctions', fname, () => code);
};

CodeBuilder.prototype.generateListOfUniforms = function() {
    let ans = [];
    for (let uname in this.uniforms)
        if (this.uniforms[uname].type.type != 'constant' && this.uniforms[uname].type != type.image)
            ans.push(`uniform ${webgltype(this.uniforms[uname].type)} ${uname};`);
    return ans.join('\n');
};


CodeBuilder.prototype.generateColorPlotProgram = function(expr) { //TODO add arguments for #
    helpercnt = 0;
    expr = cloneExpression(expr); //then we can write dirty things on expr...

    this.initvariable('cgl_pixel', false);
    this.variables['cgl_pixel'].T = type.vec2;
    let bindings = {
        '#': 'cgl_pixel'
    }
    this.precompile(expr, bindings); //determine this.variables, types etc.
    let r = this.compile(expr, true);
    let colorterm = this.castType(r.term, r.type, type.color);

    if (!issubtypeof(r.type, type.color)) {
        console.error("expression does not generate a color");
    }
    let code = this.generateSection('structs');
    code += this.generateSection('uniforms');
    code += this.generateListOfUniforms();
    code += generateHeaderOfTextureReaders(this);
    code += this.generateSection('functions');
    code += this.generateSection('includedfunctions');

    for (let iname in this.variables)
        if (this.variables[iname]['global']) {
            code += `${webgltype(this.variables[iname].T)} ${iname};\n`;
        }

    code += this.generateSection('compiledfunctions');

    code += `void main(void) {\n${r.code}gl_FragColor = ${colorterm};\n}\n`;

    console.log(code);

    let generations = {};
    if (this.sections['compiledfunctions'])
        for (let fname in this.sections['compiledfunctions'].marked) {
            generations[fname] = this.api.getMyfunction(fname).generation;
        }
    return {
        code: code,
        uniforms: this.uniforms,
        texturereaders: this.texturereaders,
        generations: generations //all used functions with their generation
    };
};
