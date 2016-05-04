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
   * plots colorplot on whole main canvas in CindyJS coordinates
   */
  api.defineFunction("colorplot", 1, function(args, modifs) {
    initGLIfRequired();

    var prog = args[0];

    let cw = api.instance['canvas']['clientWidth']; //CSS pixels
    let ch = api.instance['canvas']['clientHeight'];

    let iw = api.instance['canvas']['width']; //internal measures. might be twice as cw on HiDPI-Displays
    let ih = api.instance['canvas']['height'];

    compileAndRender(prog, computeLowerLeftCorner(api), computeLowerRightCorner(api), iw, ih, null);
    let csctx = api.instance['canvas'].getContext('2d');
    csctx.drawImage(glcanvas, 0, 0, iw, ih, 0, 0, cw, ch);
    return nada;
  });


  /**
   * plots colorplot on main canvas in CindyJS coordinates in the rectangle bounded by two points (as in Cinderella: coloplot(<expr>, <vec>, <vec>))
   */
  api.defineFunction("colorplot", 3, function(args, modifs) {
    initGLIfRequired();

    var prog = args[0];
    var a = api.extractPoint(api.evaluateAndVal(args[1]));
    var b = api.extractPoint(api.evaluateAndVal(args[2]));

    var ll = {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y)
    }; //lower left pt
    var lr = {
      x: Math.max(a.x, b.x),
      y: Math.min(a.y, b.y)
    }; //lower right pt

    let cw = api.instance['canvas']['clientWidth']; //CSS pixels
    let ch = api.instance['canvas']['clientHeight'];

    let iw = api.instance['canvas']['width']; //internal measures. might be twice as cw on HiDPI-Displays
    let ih = api.instance['canvas']['height'];

    let cul = computeUpperLeftCorner(api);
    let cll = computeLowerLeftCorner(api);
    let clr = computeLowerRightCorner(api);

    let fx = Math.abs((a.x - b.x) / (cll.x - clr.x)); //x-ratio of screen that is used
    let fy = Math.abs((a.y - b.y) / (cul.y - cll.y)); //y-ratio of screen that is used

    compileAndRender(prog, ll, lr, iw * fx, ih * fy, null);
    let csctx = api.instance['canvas'].getContext('2d');
    //csctx.drawImage(glcanvas, 0, 0, iw*fx, ih*fy, ll.x, ll.y, cw, ch);

    let pt = {
      x: Math.min(a.x, b.x),
      y: Math.max(a.y, b.y)
    };
    let m = api.getInitialMatrix();
    var xx = pt.x * m.a - pt.y * m.b + m.tx;
    var yy = pt.x * m.c - pt.y * m.d - m.ty;

    csctx.drawImage(glcanvas, 0, glcanvas.height - ih * fy, iw * fx, ih * fy, xx, yy, fx * cw, fy * ch);
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

				let imageobject = generateImageObjectFromNameIfRequired(name.value, api);
    let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api);
    var cw = imageobject.width;
    var ch = imageobject.height;
    compileAndRender(prog, a, b, cw, ch, canvaswrapper);

    return nada;
  });

  /**
   * plots on a given canvas and assumes that it lies on CindyJS-table sharing the two bottom corners of main canvas
   */
  api.defineFunction("colorplot", 2, function(args, modifs) {
    initGLIfRequired();

    var a = computeLowerLeftCorner(api);
    var b = computeLowerRightCorner(api);
    var name = api.evaluateAndVal(args[0]);
    var prog = args[1];

    if (name.ctype !== 'string') {
      return nada;
    }

		let imageobject = generateImageObjectFromNameIfRequired(name.value, api);
    let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api);
    var cw = imageobject.width;
    var ch = imageobject.height;
    compileAndRender(prog, a, b, cw, ch, canvaswrapper);


    return nada;
  });

  api.defineFunction("setpixel", 4, function(args, modifs) {

    var name = coerce.toString(api.evaluateAndVal(args[0]));
    var x = coerce.toInt(api.evaluateAndVal(args[1]));
    var y = coerce.toInt(api.evaluateAndVal(args[2]));

    var color = coerce.toColor(api.evaluateAndVal(args[3]));
    
    let imageobject = generateImageObjectFromNameIfRequired(name, api);
    let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api);

    if (isFinite(x) && isFinite(y) && name && canvaswrapper && color) {
      canvaswrapper.setPixel(x, y, color);
    }
    return nada;
  });

});
