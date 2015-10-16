var includedfunctions = {};
var requires = {};

function includefunction(name) {
  includedfunctions[name] = true;
  for(let i in requires[name]) {
    let f = requires[name][i];
    if(includedfunctions.hasOwnProperty(f)) continue;
    includefunction(f);
  }
  includedfunctions[name] = cgl_resources[name]; //lade aus name.glsl...
}

function generateHeaderOfIncludedFunctions() {
  var h = '';
  for(let f in includedfunctions) {
    h += includedfunctions[f] + '\n';
  }
  return h;
}

function useincludefunction(name) {
  //includefunction(name);
  //return usefunction(name);
  
  return function(args) { //runs includefunction(name) whenever useincludefunction(name) is called with some arguments
    includefunction(name);
    return (usefunction(name))(args);
  };
}





