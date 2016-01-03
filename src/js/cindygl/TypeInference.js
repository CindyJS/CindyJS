const oo = 1<<30; //infinity, but oo + oo should be > 0, hence not MaxInt


//////

var subtypegen = {}; //generators of subtype relations
var subtype = []; //distance matrix 
var next = []; //next[i][j]=k if i->k->...->j is shortest path of primitive subtype inclusions -> helps to compute subtype-inclusion sequence

function isprimitive(a) {
  return (typeof(a)==='number');
}

function issubtypeof(a, b) { //TODO: what if b is template?
  if(a===b) return true;
  
  if(isprimitive(a) && isprimitive(b)) {
    if(subtype[a] === undefined) return false;
    return (subtype[a][b]<oo);
  } 
  return false;
  /*
  //TODO: what is for nonprimitive types? Dont forget to consider nada/undefined, which is no subtype of any other type
  else {
    for(var key in b) if(b.hasOwnProperty(key)) {
      if(!a.hasOwnProperty(key)) return false; //if a < b then a must have all "properties" of b
      if(!issubtypeof(a[key], b[key])) return false;
    }
    return true;
  }*/
}

var highesttypeindex = 0;

function preliminaryComputations() {
  //in makefile durch node berechnen?
  function max(a,b) {return a > b ? a : b};
  for(let key in type) highesttypeindex = max(highesttypeindex, type[key]+1); //compute maximum
  
  subtype = new Array(highesttypeindex);
  next = new Array(highesttypeindex);
  for(let i = 0; i<highesttypeindex; i++) {
    subtype[i] = new Array(highesttypeindex);
    next[i] = new Array(highesttypeindex);
    for(let j = 0; j<highesttypeindex; j++) {
      subtype[i][j] = oo;
      next[i][j] = -1;
    }
    subtype[i][i] = 0;
  }
  //copy subtypegen type.into subtype
  for(let i = 0; i<highesttypeindex; i++) {
    for(let j in subtypegen[i]) {
      var o = subtypegen[i][j];
      subtype[i][o] = 1;
      next[i][o] = o;
    }
  }
  
  for(let b = 0; b<highesttypeindex; b++) { //Floyd-Warshall: a<b<c shortest path => a<c
    for(let a = 0; a<highesttypeindex; a++) {
      for(let c = 0; c<highesttypeindex; c++) {
        if(subtype[a][b] + subtype[b][c] < subtype[a][c]) {
          subtype[a][c] = subtype[a][b] + subtype[b][c];
          next[a][c] = next[a][b];
        }
      }
    }
  }
}



// find supertype of both a and b that is minimal wrt. subtype 
function lca(a, b) {
  var best = undefined;
  //TODO find out efficient algorithm, i.e. http://en.wikipedia.org/wiki/Lowest_common_ancestor
  //but since there are few type so far, KISS
  //RETHINK: What if there are 2 such minimal lcas? (subtype order is not total)
  
  
  if(issubtypeof(b,a)) return a;
  if(issubtypeof(a,b)) return b;
  
  if(!isprimitive(a)) return b; //handle nadas
  if(!isprimitive(b)) return a; //TODO find algo for non-primitive types
  
  for(let t = 0; t<highesttypeindex; t++) { //O(|types|)
    if(issubtypeof(a, t) && issubtypeof(b, t)) {
      if(best === undefined) {
        best = t;
      } else {
        if(issubtypeof(t, best)) best = t;
      }
    }
  }
  return best;
}

function makeTemplate(idx) {
  return {
    index: idx,
    type: "template"
  }
};

function istemplate(t) {
  return (t.type === "template");
}


var typeinference = {};


//console.log(typeinference);

function matchSignature(functionname, args) { //args is a list of types
  //if(args.indexOf(nada) != -1) { //skip matching signatures if one input type is unknown yet
  //  return nada;
  //}
  for(let idx in typeinference[functionname]) { //return first matching entry
    var s = typeinference[functionname][idx];
    var match = (args.length === s.args.length); //boolean, do they probably match?
    var template = {}; // type in template[i] <=> type should match with template_i
    for(var j = 0; j<args.length && match; j++) {
      if(istemplate(s.args[j])) {
        if(template[s.args[j].index]===undefined)
          template[s.args[j].index] = [];
        template[s.args[j].index].push(args[j]); //we will handle these templates later
      } else
        match &= issubtypeof(args[j],s.args[j]);
    }
    //console.log(template);
    if(!match) continue;
  
    var templatetype = {}; //template i will get type templatetype[i], which is lca of all occuring types
    for(let i in template) { //if(template[t]!==undefined && template[t].length>0)
      templatetype[i] = template[i][0];
      
      //console.log(" t is");
      //console.log(templatetype[i]);
      
      
      for(let idx2 in template[i]) {
        var t = template[i][idx2];
        templatetype[i] = lca(templatetype[i], t);
        if(templatetype[i]===undefined) match = false;
       // console.log(templatetype[i]);
       // console.log(match);
      }
    }
    if(match) {
      var si = {args: []}; //build copy of s with proper types
      for(var j = 0; j<args.length && match; j++) {
        if(istemplate(s.args[j]))
          si.args[j] = templatetype[s.args[j].index];
        else
          si.args[j] = s.args[j];
      }
      if(istemplate(s.res))
        si.res = templatetype[s.res.index];
      else
        si.res = s.res;
      return si;
    }
  }
  //console.error('No Signature found for ' + functionname + '(' + args.map(typeToString).join(', ') + ')(' + JSON.stringify(args) + ')');
  return nada;
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
