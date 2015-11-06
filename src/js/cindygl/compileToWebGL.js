var webgltype = {}; //which type identifier is used in WebGL to represent our internal type

/** @type {createCindy.pluginApi} */
var api;

var precompileDone = false;

/** 
 * are two given signatures equal?
 */
function signaturesAreEqual(a, b) {
  if(a===b) return true;
  if(isprimitive(a) || isprimitive(b)) return a===b;
  
  for(let key in a) if(a.hasOwnProperty(key)) {
    if(!b.hasOwnProperty(key)) return false;
    if(!signaturesAreEqual(a[key], b[key])) return false;
  }
  
  for(let key in b) if(b.hasOwnProperty(key)) {
    if(!a.hasOwnProperty(key)) return false;
  }
  
  return true;
}


/**
 * Creates new term that is casted to toType
 * assert that fromType is Type of term
 * assert that fromType is a subtype of toType
 */
function castType(term, fromType, toType) {
//  console.log('cast type ' + typeToString(fromType) +  ' to ' + typeToString(toType) + " (for term" + term +")");
  if(fromType===toType) return term;
  else {
    let nextType = next[fromType][toType]; //use precomputed matrix
 //   console.log(nextType);
    if(!inclusionfunction.hasOwnProperty(fromType) || !inclusionfunction[fromType].hasOwnProperty(nextType)) {
      console.error("CindyGL: No type-inclusion function for " + typeToString(fromType) + " to " +
        typeToString(nextType) + " found. \n Using identity");
      return castType(term, nextType, toType);
    }
    return castType((inclusionfunction[fromType][nextType])(term), nextType, toType);
  }
}

///////////
var webgltr = {};



/*

function precompile(expr) {
  //variable?
  var argtypes = new Array(expr['args'].length);
  for(let i in expr['args']) {
    precompile(expr['args'][i]);
    argtypes[i] = expr['args'][i].signature.res;
  }
  if (myfunctions.hasOwnProperty(expr['oper'])) {
    //TODO
    //determine type...
    precompile(myfunctions[expr['oper']].body);
  } else {
    expr.signature = matchSignature(expr['oper'], argtypes) //TODO was ist mit myfunctions?
    if(expr.signature === nada) {
      console.log('No signature found for function ' + expr['oper'] + 
        ' with arguments (' + argtypes.slice(', ') + ')');
    }
  }
  
  
  
  //contains varying?
  //required type
  //is expression or statement?
}*/






function getPlainName(oper) { //converts opernames like re$1 to re
  if(oper.indexOf('$')===-1) return oper;
  else return oper.substr(0, oper.indexOf('$'));
}



var variables = {}; //list of names of variables
var assigments = {}; // variables -> list of assigments in the form of {expr: expression, fun: in which functions this expression will be eval}
var T = {}; //T: scope -> (variables -> types)


/**
 * computes the type of the expr, assuming it is evaluated in the scope of fun.
 * It might consider the type of variables (T)
 */
//@TODO: Consider stack of variables. e.g. repeat(3, i, e = 32+i);
function computeType(expr, fun) { //expression, current function
  //console.log('parse the following expression');
  //console.log(expr);
  
  if(expr['isuniform']) {
    return uniforms[expr['uvariable']].type;
  }
  
  if(expr['ctype'] === 'variable') {
    let name = expr['name'];
    
    //@TODO, implement complex->true and remove the following line
    //@rethink: use stack instead of scopes? # # #...
    if(name === '#') {
      /*if(modifs[generatecomplexresult]) { //better as uniform type handling
        return type.complex;
      }*/
      return type.vec2; //type.complex if complex->true
      
    }
    //if(name === 'pi') return type.float; //done as uniform
    
    if(T.hasOwnProperty(fun) && T[fun].hasOwnProperty(name)) { //is there some local variable
      return T[fun][name];
    } else if(T.hasOwnProperty('') && T[''].hasOwnProperty(name)) { //interpret as global variable
      return T[''][name];
    }
  } else if(expr['ctype'] === 'function' && myfunctions.hasOwnProperty(expr['oper'])) {
    if(T.hasOwnProperty('') && T[''].hasOwnProperty(expr['oper'])) return T[''][expr['oper']];
  } else if(expr['ctype'] === 'number') {
    if(expr['value']['imag']!==0) return type.complex;
    //number is real
    if((expr['value']['real']|0) === expr['value']['real']) return type.int; //MAX.Int?
    return type.float;
    //TODO: other primitives like color, point...
  } else if(expr['ctype']==='void') {
    return type.voidt;
  } else {
    var argtypes = new Array(expr['args'].length);
    for(let i in expr['args']) {
      argtypes[i] = getType(expr['args'][i], fun);
    }
    //console.log(f);
    //console.log(argtypes);
    let f = getPlainName(expr['oper']);
    let signature = matchSignature(f, argtypes);
    //console.log(signature);
    return signature.res;
  }
  return nada;
}

/**
 * gets the type of the expr, trying to use cached results. Otherwise it will call computeType
 */
//@TODO: Consider stack of variables. e.g. repeat(3, i, e = 32+i);
function getType(expr, fun) { //expression, current function
  //return computeType(expr, fun);
  if(precompileDone && expr.hasOwnProperty("computedType")) {
    return expr["computedType"];
  }
  expr["computedType"] = computeType(expr, fun);
  return expr["computedType"];
}

function determineVariables(expr) { //finds the occuring variables, saves them to variables and finally computes T
  variables = {}; //functionname -> list of variables occuring in this scope. global corresponds to ''-function
  assigments = {}; 
  
  rec(expr, ''); //global
  function rec(expr, fun) { //dfs over executed code
    if(!variables.hasOwnProperty(fun)) {
      variables[fun] = []; //list of variables
    }
    if(!assigments.hasOwnProperty(fun)) {
      assigments[fun] = {}; //map variables -> list of expressions
    }
    
    for(let i in expr['args']) {
      rec(expr['args'][i], fun);
    }
    
    //was there something happening to the (return)variables?
    if(expr['oper'] === '=') { //assignment to variable
      let vname = expr['args'][0]['name'];
      var scope = fun;
      if(variables[fun].indexOf(vname)===-1) { //no regional function found
        scope = ''; //consider global variable
        if(variables[scope].indexOf(vname)===-1) {
          variables[scope].push(vname);
          assigments[scope][vname] = [];
        }
      }
      //the scope of vname is scope
      assigments[scope][vname].push({
        expr: expr['args'][1], //variables in expr will interpreted in the scope of fun
        fun: fun
      });
      //rec(expr['args'][1], fun);
    } else if(expr['oper'] === 'regional') {
      for (let i = 0; i < expr['args'].length; i++) {
        
        if (expr['args'][i]['ctype'] === 'variable') {
          let vname = expr['args'][i]['name'];
          if(variables[fun].indexOf(vname) ===-1) {
            variables[fun].push(vname);
            assigments[fun][vname] = [];
          }
        }
      }
    } else if(expr['ctype'] ==='function' && myfunctions.hasOwnProperty(expr['oper'])) { // call of user defined function
      let rfun = expr['oper']; //@TODO: Remove $...?
      if(!variables.hasOwnProperty(rfun)) {
        variables[rfun] = []; //list of variables
      }
      if(!assigments.hasOwnProperty(rfun)) {
        assigments[rfun] = {}; //map variables -> list of expressions
      }
      for(let i in myfunctions[rfun]['arglist']) {
        let a = myfunctions[rfun]['arglist'][i]['name'];
        variables[rfun].push(a);
        if(!assigments[rfun].hasOwnProperty(a)) assigments[rfun][a] = [];
        
        assigments[rfun][a].push( {
          expr: expr['args'][i],
          fun: fun //the scope in which the function is called
        });
      }
      rec(myfunctions[rfun].body, rfun);
      
      
      //oh yes, the return variable of the function should be added as well
      //functions are always global
      if(variables[''].indexOf(rfun)===-1) {
        variables[''].push(rfun);
        assigments[''][rfun] = [{
          expr: myfunctions[rfun]['body'],
          fun: rfun //the expression above will be evalueted in scope of rfun
        }];
      }
    }
  }
}

/**
 * Computes the types of all occuring variables and user defined functions. These types are choosen such that the lca of all assigments
 */
function determineTypes() {
  let changed = true;
  while(changed) {
    changed = false;
    for(let s in assigments) for(let v in assigments[s]) for(let i in assigments[s][v]) { //iterate over all scopes, their variables(and functions), and their reassigments
      // variable  v (which lives in scope s) <- expression e in function f
      let e = assigments[s][v][i].expr; 
      let f = assigments[s][v][i].fun;
      let othertype = getType(e, f); //type of expression e in function f
      
      let oldtype = nada;
      if(T.hasOwnProperty(s) && T[s].hasOwnProperty(v)) oldtype = T[s][v];
      let newtype = oldtype;
      
      if(othertype !== nada) {
        if(oldtype === nada) newtype = othertype;
        else {
          if(issubtypeof(othertype, oldtype)) newtype = oldtype; //dont change anything
          else newtype = lca(oldtype, othertype);
        }
        if(newtype !== nada && newtype !== oldtype) {
          if(!T.hasOwnProperty(s)) T[s] = {};
          
          T[s][v] = newtype;
          //console.log("variable " + v + " in scope " + s + " got type " + typeToString(newtype) + "(oltype/othertype is "+ typeToString(oldtype) + "/" + typeToString(othertype)+") because of expr " + JSON.stringify(e));
          //console.log(T);
          changed = true; 
        }
      }
    }
  }
}


var uniforms = {};
/**
 * computes the dict uniforms
 * and sets .uniformvariable
 * for all terms that have no child dependent on # or any variable dependent on #
 */
function determineUniforms(expr) {
  uniforms = {};
  
  var variableDependendsOnPixel = {'': {'#': true} };  //functionname -> dict of variables being dependent on #

  //@rethink: include variables that change during plot call(like running variables in loops) as well.
  //variableDependendsOnPixel -> varyingVariable
  
  //@simplefix: assume wlog that every variable that appears on left sign of assigment is dependent on varying variables (if might be called or not, depending on #)
  
  
  function dependsOnPixel(expr, fun) {
    //Have we already found out that expr depends on pixel?
    if(expr.hasOwnProperty("dependsOnPixel") && expr["dependsOnPixel"] === true) {
      return true;
    }
    
    //Is expr a variable that depends on pixel? (according the current variableDependendsOnPixel)
    if (expr['ctype'] === 'variable') {
      let vname = expr['name'];
      
      if(variableDependendsOnPixel.hasOwnProperty(fun) && variableDependendsOnPixel[fun][vname]) {//local variable 
        return expr["dependsOnPixel"] = true;
      }
      if(variables[fun].indexOf(vname)===-1) { //no regional function found
        if((variableDependendsOnPixel.hasOwnProperty('') && variableDependendsOnPixel[''][vname])) { //global variable
          return expr["dependsOnPixel"] = true;
        }
      } 
    }
    
    //run recursion on all dependent arguments
    for(let i in expr['args']) {
      if(dependsOnPixel(expr['args'][i], fun)) {
        return expr["dependsOnPixel"] = true;
      }
    }
    
    //Oh yes, it also might be a user-defined function!
    if(expr['ctype'] ==='function' && myfunctions.hasOwnProperty(expr['oper'])) {
      let rfun = expr['oper'];
      if(!variableDependendsOnPixel.hasOwnProperty(rfun)) {
        variableDependendsOnPixel[rfun] = {}; //dict of dependent variables
      }
      if(dependsOnPixel(myfunctions[rfun].body, rfun)) {
        return expr["dependsOnPixel"] = true;
      }
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
  for(let s in assigments) for(let v in assigments[s]) {
   if(!variableDependendsOnPixel.hasOwnProperty(s)) {
      variableDependendsOnPixel[s] = {}; //dict of dependent variables
    }
    variableDependendsOnPixel[s][v] = true;
  }
  
  //run expression to get all expr["dependsOnPixel"]
  dependsOnPixel(expr, '');
  
  let visitedFunctions = {'': true};
  //now find use those elements in expression trees that have no expr["dependsOnPixel"] and as high as possible having that property
  function computeUniforms(expr, fun) {
    if(dependsOnPixel(expr, fun)) {
      //then run recursively on all childs
      for(let i in expr['args']) {
        computeUniforms(expr['args'][i], fun);
      }
    
      //Oh yes, it also might be a user-defined function!
      if(expr['ctype'] ==='function' && myfunctions.hasOwnProperty(expr['oper'])) {
        let rfun = expr['oper'];
        if(!visitedFunctions.hasOwnProperty(rfun)) { //only do this once per function
          visitedFunctions[rfun] = true;
          computeUniforms(myfunctions[rfun].body, rfun);
        }
      }
    } else {
      //assert that parent node was dependent on uniform
      //we found a highest child that is not dependent -> this will be a candidate for a uniform!
      
      //To pass numbers as uniforms is overkill
      if(expr['ctype']==='number') return;
      
      //nothing to pass
      if(expr['ctype']==='void') return;
      
      let uname = generateUniqueHelperString();
      expr["isuniform"] = true;
      expr["uvariable"] = uname;
      uniforms[uname] = {expr: expr, type: nada};    
    }
  }
  computeUniforms(expr, '');
  
  console.log(uniforms);
}

function determineUniformTypes() {

  
  for(let uname in uniforms) {
    //Default value
    uniforms[uname].type = type.float; //every cindyJS number can be interpreted as complex.
    
    //TODO: check weather type was specified by modifier?
  
    //TODO: Compute value with api.eval and find out by guessing type
    let tval = api.evaluateAndVal(uniforms[uname].expr);
    
    
    if(tval['ctype'] === 'number') {
      let z = tval['value'];
      if(z['imag']===0.) {
        if((z['real']|0) === z['real']) {
          uniforms[uname].type = type.int;
        } else {
          uniforms[uname].type = type.float;
        }
      } else {
        uniforms[uname].type = type.complex;
      }
    }
    //TODO: genList...    
    
  }
}


function precompile(expr) {
  precompileDone = false;
  determineVariables(expr);
  determineUniforms(expr);
  determineUniformTypes();
  
  determineTypes();
  precompileDone = true;
}

/*
function getScope(varname, currentscope) {
  not needed?
}*/

var helpercnt = 0;
function generateUniqueHelperString() {
  helpercnt++;
  return '_helper'+helpercnt;
}


/**
 * generateTerm = true <-> returns a term that corresponds to value of expression, precode might be generated
 * @returns: {code: string of precode that has evaluated before it is possible to evalue expr
 * [if generateTerm then also with the additional keys] term: expression in webgl, type: type of expression }
 */
 //TODO: rename to compileExpressionToWebGL...
function compile(expr, scope, generateTerm) {
  if(expr['isuniform']) {
    let uname = expr['uvariable'];
    let type = uniforms[uname].type;
    return generateTerm ? {code: '', term: uname, type: type} : {code: ''}; 
  }
  if(expr['oper'] === ";") {
    /*
    let r0 = compile(expr['args'][0], scope, false);
    let r1 = compile(expr['args'][1], scope, generateTerm);
    let code = r0.code + r1.code;// + ((c.hasOwnProperty(expr)) ? '' : (c.expr + ';\n'));
    //let r = generateTerm ? compile(expr['args'][1], true) : compile(expr['args'][1], false);
    return generateTerm ? {code: code, term: r1.term, type:r1.type} : {code: code};
    */
    
    
    //arbitrary number of arguments, e.g. only 1
    
    //let r = new Array(expr['args'].length);
    let r = {type: type.voidt, term: ''}; //default return value
    let code = '';
    let lastindex = expr['args'].length-1;
    for(let i = lastindex; i>=0 ; i--) {
      if(expr['args'][i]['ctype']==='void') lastindex--; //take last non-void entry
    }
    
    for(let i = 0; i<= lastindex; i++) {
      r = compile(expr['args'][i], scope, generateTerm && (i === lastindex)); //last one is responsible to generate term if required
      code += r.code;
    }
    
    return generateTerm ? {code: code, term: r.term, type: r.type} : {code: code};
    
  } else if (expr['oper'] === "=") {
    let r = compile(expr['args'][1], scope, true);
    let varname = expr['args'][0]['name']
    //console.log(scope);
    //console.log(varname);
    let t = varname + ' = ' + castType(r.term, r.type, getType(expr['args'][0], scope));
    if(generateTerm) {
      return {code: r.code, term: t, type: T[scope][varname]};
    } else {
      return {code: r.code + t + ';\n'}
    }
  } else if (expr['oper'] === "repeat$2") {
    if(expr['args'][0]['ctype']!== 'number') {
      console.error('repeat possible only for fixed constant number in GLSL');
      return nada;
    }
    let it = generateUniqueHelperString();
    let n = (expr['args'][0]['value']['real']|0); //TODO use some internal function like evalCS etc.
    let r = compile(expr['args'][1], scope, generateTerm);
    
    let code = '';
    let ans = '';
    let ansvar = '';
    
    if(generateTerm) {
      ansvar = generateUniqueHelperString();
      code += webgltype[r.type] + ' ' + ansvar + ';'; //initial ansvar
    }
    code += 'for(int ' + it + '=0; ' + it + ' < ' + n + '; ' + it + '++) {\n';
      code += r.code;
      if(generateTerm) {
        code += ansvar + ' = ' + r.term + ';\n';
      }
    code += '}\n';
    return (generateTerm ? {code: code, term: ansvar, type: r.type} : {code: code});
  } else if (expr['oper'] === "repeat$3") {
    console.error("TODO");
    //@TODO implement with manual variable
  } else if (expr['oper'] === "if$2" || expr['oper'] === "if$3") {
    let cond =       compile(expr['args'][0], scope, true);
    let ifbranch   = compile(expr['args'][1], scope, generateTerm);
    
    let code = '';
    let ans = '';
    let ansvar = '';
    
    let termtype = getType(expr, scope);
    
    if(generateTerm) {
      ansvar = generateUniqueHelperString();
      code += webgltype[termtype] + ' ' + ansvar + ';'; //initial ansvar
    }
    code += cond.code;
    code += 'if(' + cond.term + ') {\n';
      code += ifbranch.code;
      if(generateTerm) {
        code += ansvar + ' = ' + castType(ifbranch.term, ifbranch.type, termtype) + ';\n';
      }

    if(expr['oper'] === "if$3") {
      let elsebranch = compile(expr['args'][2], scope, generateTerm);
      code += '} else {\n';
      code += elsebranch.code;
      if(generateTerm) {
        code += ansvar + ' = ' + castType(elsebranch.term, elsebranch.type, termtype) + ';\n';
      }
    }
    code += '}\n';
    return (generateTerm ? {code: code, term: ansvar, type: termtype} : {code: code});
    //@TODO implement if
  } else if (expr['ctype'] === "function" || expr['ctype'] === "infix") {
    let fname = expr['oper'];
    
    //console.log(JSON.stringify(expr));
    let r = expr['args'].map(e => compile(e, scope, true)); //recursion on all arguments
    
    let termGenerator;
    
    
    
    //console.log('recursion in scope ' + scope);
    //console.log(expr);
    //console.log(fname);
    //console.log(r);//TODO remove
    
    let currenttype = r.map(c => c.type);
    let targettype;
    let restype;
    
    if(myfunctions.hasOwnProperty(fname)) {  //user defined function
      termGenerator = usemyfunction(fname);
      targettype = new Array(r.length)
      for(let i = 0; i<r.length; i++) {
        targettype[i] = T[fname][myfunctions[fname]['arglist'][i]['name']]; 
      }
      
      restype = T[''][fname];
      
    } else { //cindyscript-function
      fname = getPlainName(fname);
      let signature = matchSignature(fname, currenttype);
      //console.log("got the following signature for function " + fname + " and types " + currenttype);
      //console.log(signature);
      targettype = signature.args;
      restype = signature.res;
      termGenerator = nada;
      for(let i in webgltr[fname]) {
        if(signaturesAreEqual(webgltr[fname][i][0], signature)) {
          termGenerator = webgltr[fname][i][1];
          break;
        }
      }
      if(termGenerator === nada) {
        console.error("There is no webgl-implementation for " + fname + '(' + signature.args.map(typeToString).join(', ') + ').');
      }
    }
    
    let code = '';
    let argterms = new Array(r.length);
    for(let i in r) {
      code += r[i].code;
      argterms[i] = castType(r[i].term, currenttype[i], targettype[i]);
      
    }
    
    
    let term = termGenerator(argterms);
    //console.log(termGenerator);
    //console.log(termGenerator([1]));
    //console.log("generated the following term:" + term);
    if(generateTerm)
      return {term: term, type: restype, code: code};
    else
      return {code: code + term + ';\n'};
  } else if(expr['ctype'] === 'number') {
    let termtype = getType(expr, scope);
    let term;
    
         if(termtype === type.int)     term = (expr['value']['real']|0);
    else if(termtype === type.float)   term = expr['value']['real'];
    else if(termtype === type.complex) term = 'vec2( '+expr['value']['real']+ ', '+expr['value']['imag']+')';
    
    //console.log(type.int);
    //console.log('got plain number' + JSON.stringify(expr) + ' -> compiled to ' + term + '(type:' + termtype +')');
    return (generateTerm ? {term: term, type: termtype, code: ''} : {code: termtype +';\n'});
    //TODO other plain types, like 
  } else if(expr['ctype'] === "variable") {
    let termtype = getType(expr, scope);
    
    if(expr['name']==='pi') { // || === 'e'?
      return compile(expr['stack'][0], scope, generateTerm);
    }
    
    let term = expr['name'];
    
    if(term === '#') {
      term = 'cgl_pixel';
    }
    return (generateTerm ? {term: term, type: termtype, code: ''} : {code: term +';\n'});
  } else if(expr['ctype'] === "void") {
    return (generateTerm ? {term: '', type: type.voidt, code: ''} : {code: ''});
  }
  console.error("dont know how to compile " + JSON.stringify(expr));
  
}




function usemyfunction(fname) {
  compileFunction(fname, myfunctions[fname]['arglist'].length);
  return usefunction(fname);
}

/** @dict @type {Object} */
var hasbeencompiled = {};
/**  @type {Array.<string>} */
var compiledfunctions = [];

function compileFunction(fname, nargs) {
  if(hasbeencompiled.hasOwnProperty(fname)) return;
  hasbeencompiled[fname] = true; //visited
  
  let m = myfunctions[fname]; // + '$' + nargs];
  
  let vars = new Array(nargs);
  for(let i=0; i<nargs; i++) {
    vars[i] = m['arglist'][i]['name'];
  }
  let isvoid = (webgltype[T[''][fname]] === type.voidt);
  
  let code = webgltype[T[''][fname]] /*TODO: mach das schoener*/ + ' ' + getPlainName(fname) +
  '(' + vars.map(varname => webgltype[T[fname][varname]] + ' ' + varname).join(', ') + ')'
  +'{\n';
    for(let i in variables[fname]) {
      let doprint = true;
      let varname = variables[fname][i];
      for(let j in vars) doprint &= (varname!==vars[j]);
      if(doprint) code += webgltype[T[fname][varname]] + ' ' + varname + ';\n';
    }
    let r = compile(m.body, fname, !isvoid);
    code += r.code;
    //console.log(r);
    if(!isvoid)
      code += 'return ' + castType(r.term, r.type, T[''][fname]) + ';\n'; //TODO REPL 
  code += '}\n';
  
  
  compiledfunctions.push(code);
}

function generateListOfUniforms() {
  let ans = [];
  for(let uname in uniforms)
    ans.push('uniform ' + webgltype[uniforms[uname].type] + ' ' + uname + ';');
  return ans.join('\n');
}

function generateHeaderOfCompiledFunctions() {
  return compiledfunctions.join('\n');
}


function cleanup(expr) {
   
  //cleaning up
  includedfunctions = [];
  hasbeenincluded = {};
  
  compiledfunctions = [];
  hasbeencompiled = {};
  
  variables = {}; 
  assigments = {};
  T = {};
  uniforms = {};
  
  var vis = {};
  function dfs(expr) {
    delete expr['computedType'];
    delete expr['dependsOnPixel'];
    delete expr['isuniform'];
    delete expr['uvariable'];
    for(let i in expr['args']) {
      dfs(expr['args'][i]);
    }
    if(expr['ctype'] ==='function' && myfunctions.hasOwnProperty(expr['oper'])) {
      let rfun = expr['oper'];
      if(!vis.hasOwnProperty(rfun)) {
        vis[rfun] = true;
        dfs(myfunctions[rfun].body);
      }
    }
  }
  dfs(expr);
}

function generateColorPlotProgram(expr) { //TODO add arguments for #
  
  precompile(expr); //determine variables, types etc.
  let r = compile(expr, '', true);
  let colorterm = castType(r.term, r.type, type.color);
  
  if(!issubtypeof(r.type,type.color)) {
    console.error("expression does not generate a color");
  }
  let code = generateListOfUniforms();
  code += generateHeaderOfIncludedFunctions();
  
  for(let i in variables['']) {//global variables
    let varname = variables[''][i];
    if(myfunctions.hasOwnProperty(varname)) continue; //only consider real variables
    code += webgltype[T[''][varname]] + ' ' + varname + ';\n';
  }
  
  code += generateHeaderOfCompiledFunctions();
  
  code += 'void main(void) {\n' +
    r.code +
    'gl_FragColor = ' + colorterm + ';\n' +
  '}\n';
  
  let utmp = uniforms;
  
  
  cleanup(expr);// TODO: remove all 'isuniform' etc
  
  console.log(code);
  return {code: code, uniforms: utmp};
}

//TODO:
//write inclusion function: auch mit automatischen Einbinden von Abhaengigen Funktionen!
//

