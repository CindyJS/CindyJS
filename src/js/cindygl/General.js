/**
 * General helping functions
 */


/**
 * clone some object while ignoring  pointer-references to the same child
 */
function clone(obj) {
  var copy;
  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;
 // Handle Object
    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }
    
  if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
  }
}


function isprimitive(a) {
  return (typeof(a)==='number');
}

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
 * converts opernames like re$1 to re
 */
function getPlainName(oper) {
  if(oper.indexOf('$')===-1) return oper;
  else return oper.substr(0, oper.indexOf('$'));
}



/**
 * guesses the type of an concrete value
 */
function guessTypeOfValue(tval) {
  if(tval['ctype'] === 'boolean') {
    return type.bool;
  } else if(tval['ctype'] === 'number') {
    let z = tval['value'];
    if(Math.abs(z['imag'])<1e-10) { //eps test. for some reasons sin(1) might have some imag part of order e-17
      if((z['real']|0) === z['real']) {
        return type.int;
      } else {
        return type.float;
      }
    } else {
      return type.complex;
    }
  } else if(tval['ctype'] === 'list') {
    let l = tval['value'];
    if(l.length>0) {
      let ctype = guessTypeOfValue(l[0]);
      for(let i=1; i<l.length; i++) {
        ctype = lca(ctype, guessTypeOfValue(l[i]));
      }
      //console.log("got lca " + typeToString(ctype));
      if(issubtypeof(ctype, type.float)) {
        if(l.length==2) return type.vec2;
        if(l.length==3) return type.vec3;
        if(l.length==4) return type.vec4;
      }
      
      if(issubtypeof(ctype, type.complex)) {
							 if(l.length==2) return type.vec2complex;
						}
						
      if(ctype === type.vec2 && l.length == 2) return type.mat2;
      if(ctype === type.vec2complex && l.length == 2) return type.mat2complex;
      if(ctype === type.vec3 && l.length == 3) return type.mat3;
      if(ctype === type.vec4 && l.length == 4) return type.mat4;
      //TODO: do all other lists and other matrices
    }
  } else if(tval['ctype'] === 'string') {
    return type.string;
  }
  console.error("Cannot guess type of " + JSON.stringify(tval));
  return nada;
}


var helpercnt = 0;

function generateUniqueHelperString() {
  helpercnt++;
  return '_helper' + helpercnt;
}


