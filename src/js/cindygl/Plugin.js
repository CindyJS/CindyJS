createCindy.registerPlugin(1, "CindyGL", function(api) {

  //////////////////////////////////////////////////////////////////////
  // API bindings
  nada = api.nada;
  
  //myfunctions = api.getMyfunctions();
  
  api.defineFunction("compile",1,function(args, modifs) {
    let expr = args[0];
    let cb = new CodeBuilder(api);
    let code = cb.generateColorPlotProgram(expr);
    console.log(code);
    return {
      ctype: 'string',
      value: code
    };
    //console.log(myfunctions);
  });
  
  api.defineFunction("colorplot", 4, function(args, modifs) {
    initGLIfRequired();
    
    var a = api.eval_helper.extractPoint(api.evaluateAndVal(args[0]));
    var b = api.eval_helper.extractPoint(api.evaluateAndVal(args[1]));
    var name = api.evaluateAndVal(args[2]);
    var prog = args[3];
    
    if (!a.ok || !b.ok || name.ctype !== 'string') {
        return nada;
    }
    
    var localcanvas = document.getElementById(name.value);
    if (typeof(localcanvas) === "undefined" || localcanvas === null) {
        return nada;
    }
    
    var cw = localcanvas.width;
    var ch = localcanvas.height;
    
    if(!canvaswrappers.hasOwnProperty(name.value)) {
      canvaswrappers[name.value] = new CanvasWrapper(localcanvas);
    }
    
    if(!prog.iscompiled) { //Note we are adding attributes to the parsed cindyJS-Code tree
      //console.log("Program is not compiled. So we will do that");
      prog.iscompiled = true;
      prog.renderer = new Renderer(api, prog, canvaswrappers[name.value]);
    } /*else {
      console.log("Program has been compiled; we will use that compiled code.");
    }*/

    let alpha = ch/cw;
    let n = {x: -(b.y-a.y)*alpha, y: (b.x-a.x)*alpha};
    let c = {x: a.x + n.x, y: a.y + n.y};
    //let d = {x: b.x + n.x, y: b.y + n.y};
    
    prog.renderer.render(a, b, c);
    
    canvaswrappers[name.value].copyTextureToCanvas();
    
    /*
    var localcontext = localcanvas.getContext('2d');
    localcontext.clearRect(0, 0, cw, ch);
    //@TODO5: copy from texture to glcanvas... Or render directly
    localcontext.drawImage(glcanvas, 0, 0);
    */

    return nada;
  });
  
  api.defineFunction("setpixel", 4, function(args, modifs) {

    var name = coerce.toString(api.evaluateAndVal(args[0]));
    var x = coerce.toInt(api.evaluateAndVal(args[1]));
    var y = coerce.toInt(api.evaluateAndVal(args[2]));

    var color = coerce.toColor(api.evaluateAndVal(args[3]));
    
    if(isFinite(x) && isFinite(y) && name && canvaswrappers.hasOwnProperty(name) && color) {
      canvaswrappers[name].setPixel(x, y, color);
    }
    return nada;
  });
  
});



