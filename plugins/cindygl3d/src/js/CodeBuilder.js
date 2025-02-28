const DepthType={
    Flat: 0, // no depth information
    Nearest: 1, // use depth of nearest point (lowest z)
    // XXX? multi-layered depth information
}
/**
 * @constructor
 */
function CodeBuilder(api) {
    this.variables = {};
    this.uniforms = {};
    this.scopes = {};
    this.sections = {};
    this.typetime = 0; //the last time when a type got changed
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

/** @dict @type {number} */
CodeBuilder.prototype.typetime;

/** @dict @type {Object} */
CodeBuilder.prototype.variables;

/** @dict @type {Object} */
CodeBuilder.prototype.uniforms;

/** @type {CindyJS.pluginApi} */
CodeBuilder.prototype.api;

/** @type {Object.<TextureReader>} */
CodeBuilder.prototype.texturereaders;

CodeBuilder.builtInVariables=new Map([
    ["cglPixel",{type:"uniform",expr:"cgl_pixel",valueType:type.vec2}],
    // 3D- only
    ["cglViewPos",{type:"uniform",expr:"cgl_viewPos",valueType:type.vec3}],
    ["cglViewDirection",{type:"uniform",expr:"cgl_viewDirection",valueType:type.vec3}],
    // TODO? add a normalized version of viewDirection
    // TODO! make code/available constants dependent on bounding box type
    // only for spherical bounding box
    ["cglCenter",{type:"uniform",expr:"uCenter",valueType:type.vec3}],
    ["cglRadius",{type:"uniform",expr:"uRadius",valueType:type.float}],
    ["cglPointA",{type:"uniform",expr:"uPointA",valueType:type.vec3}],
    ["cglPointB",{type:"uniform",expr:"uPointB",valueType:type.vec3}]
]);

/**
 * Creates new term that is casted to toType
 * assert that fromType is Type of term
 * assert that fromType is a subtype of toType
 */
CodeBuilder.prototype.castType = function(term, fromType, toType) {
    if (typesareequal(fromType, toType)) return term;

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
CodeBuilder.prototype.computeType = function(expr) { //expression
    let bindings = expr.bindings;
    if (expr['isuniform']) {
        return this.uniforms[expr['uvariable']].type;
    } else if(expr['isbuiltin']){
        if (expr['ctype'] === 'variable') {
            let name = expr['name'];
            return CodeBuilder.builtInVariables.get(name).valueType;
        }
        console.error(`unsupported built-in ${JSON.stringify(expr)}`);
        return false;
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
        let t = generalize(this.getType(expr['obj']));
        if (expr['key'].length == 1) {
            if (t.type === 'list')
                return t.parameters;
            else if (issubtypeof(t, type.point))
                return type.float;
        } else if (expr['key'] == 'xy' && issubtypeof(t, type.point))
            return type.vec2;

        if (!t) return false;
    } else if (expr['ctype'] === 'string') {
        return type.image;
    } else if (expr['ctype'] === 'function' || expr['ctype'] === 'infix') {
        var argtypes = new Array(expr['args'].length);
        let allconstant = true;
        for (let i = 0; i < expr['args'].length; i++) {
            argtypes[i] = this.getType(expr['args'][i]);
            allconstant &= (argtypes[i].type === 'constant');
        }
        if (allconstant && expr['impl']) { //use api.evaluateAndVal to compute type of constant expression
            let constantexpression = {
                "ctype": expr['ctype'],
                "oper": expr['oper'],
                "impl": expr['impl'],
                "args": argtypes.map(a => a.value)
            };
            let val = this.api.evaluateAndVal(constantexpression);
            return constant(val);
        } else { //if there is something non-constant, we will the functions specified in WebGL.js
            let f = getPlainName(expr['oper']);
            let implementation = webgl[f] ? webgl[f](argtypes) : false;
            if (!implementation && argtypes.every(a => finalparameter(a))) { //no implementation found and all args are set
                console.error(`Could not find an implementation for ${f} with args (${argtypes.map(typeToString).join(', ')})`);
                console.log(expr);
                throw ("error");

            }
            return implementation ? implementation.res : false;
        }
    }
    console.error("Don't know how to compute type of");
    console.log(expr);
    return false;
};

/**
 * gets the type of the expr, trying to use cached results. Otherwise it will call computeType
 */
CodeBuilder.prototype.getType = function(expr) { //expression, current function
    if (!expr.computedType || !expr.typetime || this.typetime > expr.typetime) {
        expr.computedType = this.computeType(expr);
        expr.typetime = this.typetime;
    }
    return expr.computedType;
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

    rec(expr, bindings, 'global', false);

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
    function rec(expr, bindings, scope, forceconstant) {
        expr.bindings = bindings;
        for (let i in expr['args']) {
            let needtobeconstant = forceconstant || (expr['oper'] === "repeat$2" && i == 0) || (expr['oper'] === "repeat$3" && i == 0) || (expr['oper'] === "_" && i == 1);
            let nbindings = bindings;
            if (["repeat", "forall", "apply"].indexOf(getPlainName(expr['oper'])) !== -1) {
                if (i == 1) {
                    nbindings = (expr['oper'] === "repeat$2") ? addvar(bindings, '#', type.int) :
                        (expr['oper'] === "repeat$3") ? addvar(bindings, expr['args'][1]['name'], type.int) :
                        (expr['oper'] === "forall$2" || expr['oper'] === "apply$2") ? addvar(bindings, '#', false) :
                        (expr['oper'] === "forall$3" || expr['oper'] === "apply$3") ? addvar(bindings, expr['args'][1]['name'], false) : bindings;
                } else if (i == 2) { //take same bindings as for second argument
                    nbindings = expr['args'][1].bindings;
                }
            }
            rec(expr['args'][i],
                nbindings,
                scope,
                needtobeconstant);
        }
        if (expr['ctype'] === 'field') rec(expr['obj'], bindings, scope, forceconstant);

        if (expr['ctype'] === 'variable') {
            let vname = expr['name'];
            // TODO? special handling for built-in variables
            vname = bindings[vname] || vname;
            if (forceconstant && self.variables[vname]) {
                //console.log(`mark ${vname} as constant iteration variable`);
                self.variables[vname].forceconstant = true;
            }
        }
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
        } else if (expr['oper'] === "forall$2" || expr['oper'] === "apply$2" || expr['oper'] === "forall$3" || expr['oper'] === "apply$3") {
            let it = (expr['args'].length === 2) ? expr['args'][1].bindings['#'] : expr['args'][2].bindings[expr['args'][1]['name']];
            variables[it].assigments.push({ //add function that accesses first element of array for type detection
                "ctype": "infix",
                "oper": "_",
                "args": [expr['args'][0], {
                    "ctype": "number",
                    "value": {
                        "real": 1,
                        "imag": 0
                    }
                }],
                bindings: expr['args'][0].bindings
            });
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
                rec(myfunctions[rfun]['body'], localbindungs, rfun, forceconstant);

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

        if (this.variables[v].forceconstant) {
            this.variables[v].T = constint(1);
            this.typetime++;
        }
    }

    while (changed) { //TODO: implement queue to make this faster
        changed = false;
        for (let v in this.variables)
            if (!this.variables[v].forceconstant) {
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
                            this.typetime++;
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
        'cgl_pixel': true,
        'cgl_pixel.x': true,
        'cgl_pixel.y': true,
        'normalize(cgl_viewDirection)': true,
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
            if(CodeBuilder.builtInVariables.has(vname)){
                expr["isbuiltin"] = true; // TODO? allow precomputing expressions containing built-ins in some cases
                return expr["dependsOnPixel"] = true;
            }
            vname = expr.bindings[vname] || vname;
            if (variableDependendsOnPixel[vname]) {
                return expr["dependsOnPixel"] = true;
            }
            return expr["dependsOnPixel"] = false;
        }

        let alwaysPixelDependent = [ //Operators that are supposed to be interpreted as pixel dependent;
            'random', //our random function is dependent on pixel!
            'randomint',
            'randominteger',
            'randombool',
            'randomnormal',
            'verbatimglsl' //we dont analyse verbatimglsl functions
        ];
        if (expr['ctype'] === 'function' && alwaysPixelDependent.indexOf(getPlainName(expr['oper'])) !== -1) {
            return expr["dependsOnPixel"] = true;
        }

        //repeat is pixel dependent iff it's code is pixel dependent. Then it also makes the running variable pixel dependent.
        if (expr['oper'] === "repeat$2" || expr['oper'] === "forall$2" || expr['oper'] === "apply$2") {
            if (dependsOnPixel(expr['args'][1])) {
                variableDependendsOnPixel[expr['args'][1].bindings['#']] = true;
                return expr["dependsOnPixel"] = true;
            } else return expr["dependsOnPixel"] = false;
        } else if (expr['oper'] === "repeat$3" || expr['oper'] === "forall$3" || expr['oper'] === "apply$3") {
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

            //To pass constant numbers or constant booleans as uniforms is overkill
            //TODO better: if it does not contain variables or functions
            if (expr['ctype'] === 'boolean') return;

            if (expr['ctype'] === 'number') return;

            //nothing to pass
            if (expr['ctype'] === 'void') return;

            if (expr['oper'] === '..') forceconstant = true; //if this would vary, then also its length, ergo its type. Hence we can assume that it is constant :-)
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
            uniforms[uname].forceconstant = uniforms[uname].forceconstant || forceconstant;
            expr["isuniform"] = true;
            expr["uvariable"] = uname;
        }
    }
};


CodeBuilder.prototype.determineUniformTypes = function() {
    for (let uname in this.uniforms) {
        let tval = this.api.evaluateAndVal(this.uniforms[uname].expr);
        if (!tval["ctype"] || tval["ctype"] === "undefined") {
            console.error("can not evaluate:");
            console.log(this.uniforms[uname].expr);
            return false;
        }
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


CodeBuilder.prototype.generatePixelBindings = function(expr) {
    let bindings = {};
    let free = {};

    function clone(a) {
        let c = {};
        for (let i in a) c[i] = a[i];
        return c;
    };

    function rec(expr, bounded) {
        if (expr['oper'] === "repeat$2" || expr['oper'] === "forall$2" || expr['oper'] === "apply$2") {
            bounded = clone(bounded);
            bounded['#'] = true;
        } else if (expr['oper'] === "repeat$3" || expr['oper'] === "forall$3" || expr['oper'] === "apply$3") {
            bounded = clone(bounded);
            bounded[expr['args'][1]['name']] = true;
        } else if (expr['oper'] === "=") {
            bounded[expr['args'][0]['name']] = true;
        }

        for (let i in expr['args']) {
            rec(expr['args'][i], bounded);
        }

        if (expr['ctype'] === 'field') {
            rec(expr['obj'], bounded);
        }

        if (expr['ctype'] === 'variable') {
            let vname = expr['name'];
            if (!bounded[vname]) free[vname] = true;
        }
    }

    rec(expr, {});

    this.initvariable('cgl_pixel', false);
    this.variables['cgl_pixel'].T = type.vec2;
    // TODO? should direction argument be normalized
    this.initvariable('normalize(cgl_viewDirection)', false);
    this.variables['normalize(cgl_viewDirection)'].T = type.vec3;
    if (Object.keys(free).length == 1) {
        bindings[Object.keys(free)[0]] = CindyGL3D.mode3D ? 'normalize(cgl_viewDirection)':'cgl_pixel';
    } else if (free['#']) {
        bindings['#'] = CindyGL3D.mode3D ? 'normalize(cgl_viewDirection)':'cgl_pixel';
    } else if (free['x'] && free['y']) {
        this.initvariable('cgl_pixel.x', false);
        this.variables['cgl_pixel.x'].T = type.float;
        bindings['x'] = 'cgl_pixel.x';

        this.initvariable('cgl_pixel.y', false);
        this.variables['cgl_pixel.y'].T = type.float;
        bindings['y'] = 'cgl_pixel.y';
    } else {
        //generate list of not assigned. if length =1 .
        let notassigned = [];

        for (let v in free) {
            if (this.api.nada == this.api.evaluateAndVal({
                    "ctype": 'variable',
                    "name": v
                })) notassigned.push(v);
        }

        if (notassigned.length == 1) {
            bindings[notassigned[0]] = 'cgl_pixel';
        } else if (free['p']) {
            bindings['p'] = 'cgl_pixel';
        } else if (free['z']) {
            bindings['z'] = 'cgl_pixel';
        }
    }

    if (bindings['z'] === 'cgl_pixel') {
        this.variables['cgl_pixel'].T = type.complex;
    }

    return bindings;
}

CodeBuilder.prototype.precompile = function(expr) {
    this.copyRequiredFunctions(expr);
    this.determineVariables(expr, this.generatePixelBindings(expr));
    this.determineUniforms(expr);
    this.determineUniformTypes();

    this.determineTypes();
    for (let u in this.uniforms)
        if (this.uniforms[u].type.type === 'list') createstruct(this.uniforms[u].type, this);
    for (let v in this.variables)
        if (this.variables[v].T.type === 'list') createstruct(this.variables[v].T, this);
};


/**
 * compiles an CindyJS-expression to GLSL-Code
 * generateTerm = true <-> returns a term that corresponds to value of expression, precode might be generated
 * @returns: {code: string of precode that has evaluated before it is possible to evalue expr
 * [if generateTerm then also with the additional keys] term: expression in webgl, type: type of expression }
 */

CodeBuilder.prototype.compile = function(expr, generateTerm) {
    var self = this; //for some reason recursion on this does not work, hence we create a copy; see http://stackoverflow.com/questions/18994712/recursive-call-within-prototype-function

    let ctype = this.getType(expr);
    if (expr['isuniform']) {
        let uname = expr['uvariable'];
        let uniforms = this.uniforms;
        return generateTerm ? {
            code: '',
            term: ctype.type === 'constant' ? pastevalue(ctype.value, generalize(ctype)) : uname,
        } : {
            code: ''
        };
    } else if(expr['isbuiltin']){
        if(expr['ctype'] === 'variable'){
            let vname = expr['name'];
            return generateTerm ? {
                code: '',
                term: CodeBuilder.builtInVariables.get(vname).expr,
            } : {
                code: ''
            };
        }
        console.error(`dont know how to this.compile built-in ${JSON.stringify(expr)}`);
        return;
    } else if (expr['oper'] === ";") {
        let r = {
            term: ''
        }; //default return value
        let code = '';
        let lastindex = expr['args'].length - 1;

        for (let i = lastindex; i >= 0; i--) {
            if (expr['args'][i]['ctype'] === 'void') lastindex = i - 1; //take last non-void entry
        }

        for (let i = 0; i <= lastindex; i++) {
            r = this.compile(expr['args'][i], generateTerm && (i === lastindex)); //last one is responsible to generate term if required
            code += r.code;
        }

        return generateTerm ? {
            code: code,
            term: r.term,
        } : {
            code: code
        };

    }
    if (ctype.type === 'constant') {
        return generateTerm ? {
            term: pastevalue(ctype.value, generalize(ctype)),
            code: ''
        } : {
            code: ''
        };
    } else if (expr['oper'] === "=") {
        let r = this.compile(expr['args'][1], true);
        let varexpr = this.compile(expr['args'][0], true).term; //note: this migth be also a field access
        let t = `${varexpr} = ${this.castType(r.term, this.getType(expr['args'][1]), this.getType(expr['args'][0]))}`;
        if (generateTerm) {
            return {
                code: r.code,
                term: t,
            };
        } else {
            return {
                code: `${r.code + t};\n`
            }
        }
    } else if (expr['oper'] === "repeat$2" || expr['oper'] === "repeat$3") {
        let number = this.compile(expr['args'][0], true);
        let ntype = this.getType(expr['args'][0]);
        if (ntype.type !== 'constant') {
            console.error('repeat possible only for fixed constant number in GLSL');
            return false;
        }
        let it = (expr['oper'] === "repeat$2") ? expr['args'][1].bindings['#'] : expr['args'][2].bindings[expr['args'][1]['name']];

        let n = Number(number.term);
        let code = '';

        if (this.variables[it].T.type === 'constant') {
            for (let k = 1; k <= n; k++) { //unroll
                this.variables[it].T = constint(k); //overwrites binding
                this.typetime++;
                let r = this.compile(expr['args'][(expr['oper'] === "repeat$2") ? 1 : 2], (k === n) && generateTerm);
                code += r.code;
                if ((k === n) && generateTerm) {
                    return {
                        code: code,
                        term: r.term,
                    };
                }
            }
        } else { //non constant running variable
            let ansvar = '';
            let r = this.compile(expr['args'][(expr['oper'] === "repeat$2") ? 1 : 2], generateTerm);
            let rtype = this.getType(expr['args'][(expr['oper'] === "repeat$2") ? 1 : 2]);
            if (generateTerm) {
                ansvar = generateUniqueHelperString();
                if (!this.variables[ansvar]) {
                    this.initvariable(ansvar, true);
                    this.variables[ansvar].T = rtype;
                }
            }
            code += `for(int ${it}=1; ${it} <= ${n}; ${it}++) {\n`;
            code += r.code;
            if (generateTerm) {
                code += `${ansvar} = ${r.term};\n`;
            }
            code += '}\n';
            if (generateTerm) {
                return {
                    code: code,
                    term: ansvar,
                };
            }
        }
        //generateTerm == false
        return ({
            code: code
        });
    } else if (expr['oper'] === "forall$2" || expr['oper'] === "forall$3" || expr['oper'] === "apply$2" || expr['oper'] === "apply$3") {
        let arraytype = this.getType(expr['args'][0]);

        if (!(arraytype.type === 'list' || (arraytype.type === 'constant' && arraytype.value['ctype'] === 'list'))) {
            console.error(`${expr['oper']} only possible for lists`);
            return false;
        }

        let n = arraytype.length || arraytype.value["value"].length;
        let r;

        let it = (expr['args'].length === 2) ? expr['args'][1].bindings['#'] : expr['args'][2].bindings[expr['args'][1]['name']];
        let ittype = this.variables[it].T;


        let code = '';
        let ans = '';

        if (generateTerm) {
            ans = generateUniqueHelperString();
            code += `${webgltype(ctype)} ${ans};\n`;
        }

        if (ctype.type === 'list') createstruct(ctype, this);


        if (this.variables[it].T.type === 'constant' || arraytype.type === 'constant') {
            let arrayval = this.api.evaluateAndVal(expr['args'][0]);
            for (let i = 0; i < n; i++) {
                this.variables[it].T = constant(arrayval['value'][i]); //overwrites binding
                this.typetime++;
                //console.log(`current binding: ${it} -> ${typeToString(this.variables[it].T)}`);
                r = this.compile(expr['args'][(expr['args'].length === 2) ? 1 : 2], generateTerm);
                code += r.code;

                if (expr['oper'] === "forall$2" || expr['oper'] === "forall$3") {
                    if ((i + 1 === n) && generateTerm) {
                        code += `${ans} = ${r.term};\n`;
                    }
                } else { //apply
                    if (generateTerm) {
                        code += `${accesslist(ctype, i)([ans], [], this)} = ${r.term};\n`;
                    }
                }
            }
        } else { //assume that array is non-constant
            r = this.compile(expr['args'][(expr['args'].length === 2) ? 1 : 2], generateTerm);
            let array = this.compile(expr['args'][0], true);


            code += array.code;
            let sterm = array.term;

            //evaluate array.term to new variable sterm if it is complicated and it used at least twice
            if (!this.variables[sterm] && !this.uniforms[sterm] && arraytype.length >= 2) {
                sterm = generateUniqueHelperString();
                code += `${webgltype(arraytype)} ${sterm} = ${array.term};\n`;
            }

            this.variables[it]['global'] = true;

            //unroll forall/apply because dynamic access of arrays would require branching
            for (let i = 0; i < n; i++) {
                code += `${it} = ${accesslist(arraytype, i)([sterm], [], this)};\n`
                code += r.code;
                if (generateTerm) {
                    if (expr['oper'] === "forall$2" || expr['oper'] === "forall$3") {
                        if (i === n - 1) {
                            code += `${ans} = ${r.term};\n`;
                        }
                    } else code += `${accesslist(ctype, i)([ans], [], this)} = ${r.term};\n`;
                }
            }

            if (ittype.type === 'list') createstruct(ittype, this);
        }
        return (generateTerm ? {
            code: code,
            term: ans,
        } : {
            code: code
        });

    } else if (expr['oper'] === "if$2" || expr['oper'] === "if$3") {
        let cond = this.compile(expr['args'][0], true);
        let condt = this.getType(expr['args'][0]);

        let code = '';
        let ansvar = '';

        let ifbranch = this.compile(expr['args'][1], generateTerm);


        if (generateTerm) {
            ansvar = generateUniqueHelperString();
            if (!this.variables[ansvar]) {
                this.initvariable(ansvar, true);
                this.variables[ansvar].T = ctype;
            }
        }


        if (condt.type != 'constant') {
            code += cond.code;
            code += `if(${cond.term}) {\n`;
        }


        if (condt.type != 'constant' || (condt.type == 'constant' && condt.value["value"])) {
            code += ifbranch.code;
            if (generateTerm) {
                code += `${ansvar} = ${this.castType(ifbranch.term, this.getType(expr['args'][1]), ctype)};\n`;
            }
        }

        if (expr['oper'] === "if$3") {
            let elsebranch = this.compile(expr['args'][2], generateTerm);
            if (condt.type != 'constant')
                code += '} else {\n';


            if (condt.type != 'constant' || (condt.type == 'constant' && !condt.value["value"])) {
                code += elsebranch.code;
                if (generateTerm) {
                    code += `${ansvar} = ${this.castType(elsebranch.term, this.getType(expr['args'][2]), ctype)};\n`;
                }
            }
        }
        if (condt.type != 'constant')
            code += '}\n';
        return (generateTerm ? {
            code: code,
            term: ansvar,
        } : {
            code: code
        });
    } else if (expr['ctype'] === "function" || expr['ctype'] === "infix") {
        let fname = expr['oper'];

        if (getPlainName(fname) === 'verbatimglsl') {
            let glsl = this.api.evaluateAndVal(expr['args'][0])['value'];
            return (generateTerm ? {
                term: glsl,
                code: ''
            } : {
                code: glsl
            });
        }

        let r = expr['args'].map(e => self.compile(e, true)); //recursion on all arguments

        let termGenerator;

        let currenttype = expr['args'].map(e => self.getType(e)); //recursion on all arguments
        let targettype;

        if (this.myfunctions.hasOwnProperty(fname)) { //user defined function
            termGenerator = this.usemyfunction(fname);
            targettype = new Array(r.length)
            for (let i = 0; i < r.length; i++) {
                targettype[i] = this.variables[this.myfunctions[fname].body.bindings[this.myfunctions[fname]['arglist'][i]['name']]].T;
            }
        } else { //cindyscript-function
            fname = getPlainName(fname);
            if (fname === 'regional')
                return (generateTerm ? {
                    term: '',
                    code: ''
                } : {
                    code: ''
                });


            let implementation = webgl[fname](currenttype);
            if (!implementation) {
                console.error(`Could not find an implementation for ${fname}(${currenttype.map(typeToString).join(', ')}).\nReturning empty code`);
                return (generateTerm ? {
                    term: '',
                    code: ''
                } : {
                    code: ''
                });
            }

            targettype = implementation.args;
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
                code: code
            };
        else
            return {
                code: `${code + term};\n`
            };
    } else if (expr['ctype'] === "variable") {
        let term = expr['name'];
        term = expr.bindings[term] || term;
        return (generateTerm ? {
            term: term,
            code: ''
        } : {
            code: `${term};\n`
        });
    } else if (expr['ctype'] === "void") {
        return (generateTerm ? {
            term: '',
            code: ''
        } : {
            code: ''
        });
    } else if (expr['ctype'] === 'field') {
        let objt = this.getType(expr['obj']);
        let index = {
            'x': 0,
            'y': 1,
            'z': 2,
            'r': 0,
            'g': 1,
            'b': 2,
            'a': 3
        }[expr['key']];
        let term = false;
        let objterm = self.compile(expr['obj'], true).term;
        if (index != undefined && objt.type === "list") {
            term = accesslist(objt, index)([objterm], null, this);
        } else if (expr['key'] === "xy" && objt.type === "list") {
            if (objt.length === 2) term = objterm;
            if (objt.length === 3) term = useincludefunction('dehomogenize')([self.castType(objterm, objt, type.point)], null, this);
        } else if (objt === type.point) {
            let funs = {
                'xy': 'dehomogenize',
                'x': 'dehomogenizex',
                'y': 'dehomogenizey',
            };
            if (funs[expr['key']])
                term = useincludefunction(funs[expr['key']])([self.castType(objterm, objt, type.point)], null, this);
        }

        if (term) {
            return (generateTerm ? {
                term: term,
                code: ''
            } : {
                code: `${term};\n`
            });
        }
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
    let rtype = self.getType(m.body);
    code += r.code;
    if (!isvoid)
        code += `return ${this.castType(r.term, rtype, this.variables[pname].T)};\n`; //TODO REPL
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

function generateSetDepth(depthExrp){
    return `
    #ifdef webgl2
    gl_FragDepth= ${depthExrp};
    #else
    #ifdef GL_EXT_frag_depth
    gl_FragDepthEXT= ${depthExrp};
    #else
    #endif
    #endif`
}

CodeBuilder.prototype.generateColorPlotProgram = function(expr) { //TODO add arguments for #
    helpercnt = 0;
    expr = cloneExpression(expr); //then we can write dirty things on expr...

    this.precompile(expr); //determine this.variables, types etc.
    let r = this.compile(expr, true);
    let rtype = this.getType(expr);

    let code = this.generateSection('structs');
    code += this.generateSection('uniforms');
    code += this.generateListOfUniforms();
    code += generateHeaderOfTextureReaders(this);
    code += this.generateSection('includedfunctions');;
    code += this.generateSection('functions');


    for (let iname in this.variables)
        if (this.variables[iname].T && this.variables[iname]['global']) {
            code += `${webgltype(this.variables[iname].T)} ${iname};\n`;
        }

    code += this.generateSection('compiledfunctions');
    console.log(code,r);

    let generations = {};
    if (this.sections['compiledfunctions'])
        for (let fname in this.sections['compiledfunctions'].marked) {
            generations[fname] = this.api.getMyfunction(fname).generation;
        }
    return {
        code: code,
        colorExpr: r,
        colorType: rtype,
        uniforms: this.uniforms,
        texturereaders: this.texturereaders,
        generations: generations //all used functions with their generation
    };
};
CodeBuilder.prototype.generateShader = function(plotProgram, depthType){
    let code=plotProgram.code;
    let colorExpr=plotProgram.colorExpr;
    let colorType=plotProgram.colorType;

    let colorterm;
    if(depthType==DepthType.Flat){
        colorterm = this.castType(colorExpr.term, colorType, type.color);
        if (!issubtypeof(colorType, type.color)) {
            console.error("expression does not generate a color");
        }
    }else if(depthType==DepthType.Nearest){ // TODO special type for depth+color
        if (!issubtypeof(colorType, type.vec(5))) {
            console.error("expression does not generate a color(rgba)+depth");
        }
        colorterm = this.castType(colorExpr.term, colorType, type.vec(5));
    }else{
        console.error("unsupported depth type");
    }

    //JRG: THis snipped is used to bypass an error caused
    //by the current WebGL implementation on most machines
    //see https://stackoverflow.com/questions/79053598/bug-in-current-webgl-shader-implementation-concerning-variable-settings
    let randompatch="";
    if (this.sections['includedfunctions'])
      if(this.sections['includedfunctions'].marked.random)
        randompatch="last_rnd=0.1231;\n"; //This must be included in "main"
    //////////////////////

    // TODO? code for handling bounding box

    if(depthType==DepthType.Flat){
        code += `void main(void) {\n ${randompatch} ${colorExpr.code}gl_FragColor = ${colorterm};\n}\n`;
    }else if(depthType==DepthType.Nearest){
        code += `void main(void) {\n ${randompatch} ${colorExpr.code}
        vec5 colorAndDepth= ${colorterm};
        gl_FragColor = vec4(colorAndDepth.a0.y,colorAndDepth.a1);
        ${generateSetDepth("colorAndDepth.a0.x")}\n}\n`;
    }else{
        console.error("unsupported depth type");
    }
    return code
}
