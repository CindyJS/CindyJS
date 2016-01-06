var requires = {};

function includefunction(name, codebuilder) { //includes functions and does DFS on all required functions.
  //console.log("Runnining includefunction with args" + JSON.stringify([name,codebuilder]));
  if(codebuilder.hasbeenincluded.hasOwnProperty(name)) return;
  codebuilder.hasbeenincluded[name] = true; 
  for(let i in requires[name]) {
    let f = requires[name][i];
    includefunction(f, codebuilder);
  }
  
  codebuilder.includedfunctions.push(cgl_resources[name]); //lade aus name.glsl...
}

function generateHeaderOfIncludedFunctions(codebuilder) {
  return codebuilder.includedfunctions.join('\n');
}

function useincludefunction(name) {
  //includefunction(name);
  //return usefunction(name);
  return function(args, codebuilder) { //runs includefunction(name) whenever useincludefunction(name) is called with some arguments
    includefunction(name, codebuilder);
    return (usefunction(name))(args);
  };
}





