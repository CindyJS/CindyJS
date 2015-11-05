/** @dict @type {Object} */
var hasbeenincluded = {};
/**  @type {Array.<string>} */
var includedfunctions = [];


var requires = {};

function includefunction(name) { //includes functions and does DFS on all required functions.
  if(hasbeenincluded.hasOwnProperty(name)) return;
  hasbeenincluded[name] = true; 
  for(let i in requires[name]) {
    let f = requires[name][i];
    includefunction(f);
  }
  
  includedfunctions.push(cgl_resources[name]); //lade aus name.glsl...
}

function generateHeaderOfIncludedFunctions() {
  /*var h = '';
  for(let f in includedfunctions) {
    h += includedfunctions[f] + '\n';
  }*/
  return includedfunctions.join('\n');
}

function useincludefunction(name) {
  //includefunction(name);
  //return usefunction(name);
  return function(args) { //runs includefunction(name) whenever useincludefunction(name) is called with some arguments
    includefunction(name);
    return (usefunction(name))(args);
  };
}





