createCindy.registerPlugin(1, "CindyGL", function(api) {

  //////////////////////////////////////////////////////////////////////
  // API bindings
  nada = api.nada;

  //myfunctions = api.getMyfunctions();

  api.defineFunction("compile", 1, function(args, modifs) {
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

  /**
   * argument canvaswrapper is optional. If it is not given, it will render on glcanvas
   */
  function compileAndRender(prog, a, b, width, height, canvaswrapper) {
    if (!prog.iscompiled || prog.compiletime < requiredcompiletime) {
      //console.log("Program is not compiled. So we will do that");
      prog.iscompiled = true; //Note we are adding attributes to the parsed cindyJS-Code tree
      prog.compiletime = requiredcompiletime;
      prog.renderer = new Renderer(api, prog);
    }
    /*else {
         console.log("Program has been compiled; we will use that compiled code.");
       }*/
    prog.renderer.render(a, b, width, height, canvaswrapper);
  }


  api.defineFunction("forcerecompile", 0, function(args, modifs) {
    requiredcompiletime++;
    return nada;
  });

  /**
   * plots colorplot on main canvas in CindyJS coordinates
   */
  api.defineFunction("colorplot", 1, function(args, modifs) {
    initGLIfRequired();

    var prog = args[0];

    let cw = api.instance['canvas']['clientWidth']; //CSS pixels
    let ch = api.instance['canvas']['clientHeight'];

    let iw = api.instance['canvas']['width']; //internal measures. might be twice as cw on HiDPI-Displays
    let ih = api.instance['canvas']['height'];
    
    let m = api.getInitialMatrix();
    let transf = function(px, py) { //copied from Operators.js
      var xx = px - m.tx;
      var yy = py + m.ty;
      var x = (xx * m.d - yy * m.b) / m.det;
      var y = -(-xx * m.c + yy * m.a) / m.det;
      var erg = {
        x: x,
        y: y
      };
      return erg;
    };
    compileAndRender(prog, transf(0, ch), transf(cw, ch), iw, ih, null);
    let csctx = api.instance['canvas'].getContext('2d');
    csctx.drawImage(glcanvas, 0, 0, iw, ih, 0, 0, cw, ch);
    return nada;
  });

  /**
   * plots on a given canvas and assumes that it lies on CindyJS-table with corners having coordinates a and b.
   */
  api.defineFunction("colorplot", 4, function(args, modifs) {
    initGLIfRequired();

    var a = api.extractPoint(api.evaluateAndVal(args[0]));
    var b = api.extractPoint(api.evaluateAndVal(args[1]));
    var name = api.evaluateAndVal(args[2]);
    var prog = args[3];

    if (!a.ok || !b.ok || name.ctype !== 'string') {
      return nada;
    }

    var localcanvas = api.getImage(name.value, true);

    if (typeof(localcanvas) === "undefined" || localcanvas === null) {
      return nada;
    }

    var cw = localcanvas.width;
    var ch = localcanvas.height;

    if (!canvaswrappers.hasOwnProperty(name.value)) {
      canvaswrappers[name.value] = new CanvasWrapper(localcanvas);
    }

    compileAndRender(prog, a, b, cw, ch, canvaswrappers[name.value]);

    return nada;
  });

  api.defineFunction("setpixel", 4, function(args, modifs) {

    var name = coerce.toString(api.evaluateAndVal(args[0]));
    var x = coerce.toInt(api.evaluateAndVal(args[1]));
    var y = coerce.toInt(api.evaluateAndVal(args[2]));

    var color = coerce.toColor(api.evaluateAndVal(args[3]));

    if (isFinite(x) && isFinite(y) && name && canvaswrappers.hasOwnProperty(name) && color) {
      canvaswrappers[name].setPixel(x, y, color);
    }
    return nada;
  });

});
