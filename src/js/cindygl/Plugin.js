var nada;
var myfunctions;


createCindy.registerPlugin(1, "CindyGL", function(api) {

  //////////////////////////////////////////////////////////////////////
  // API bindings

  nada = api.nada;
  myfunctions = api.getMyfunctions();
  
  api.defineFunction("compile",1,function(args, modifs) {
    let expr = args[0];
    let code = generateColorPlotProgram(expr);
    console.log(code);
    return {
      ctype: 'string',
      value: code
    };
    console.log(myfunctions);
  });
  
});



