function mmult4(A,B){
  // TODO better algorithm, ? use cindyscript matrix multiplication built-in
  let C=[
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ];
  for(let i=0;i<4;i++){
    for(let j=0;j<4;j++){
      for(let k=0;k<4;k++){
        C[i][j]+=A[i][k]*B[k][j];
      }
    }
  }
  return C;
}
function mvmult4(A,v){
  let w=[0,0,0,0];
  for(let i=0;i<4;i++){
    for(let j=0;j<4;j++){
       w[i]+=A[i][j]*v[j];
    }
  }
  return w;
}
function transposeM4(A){
  let C=[
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0]
  ];
  for(let i=0;i<4;i++){
    for(let j=0;j<4;j++){
       C[i][j]=A[j][i];
    }
  }
  return C;
}

let CindyGL3D = function(api) {

    //////////////////////////////////////////////////////////////////////
    // API bindings
    nada = api.nada;

    //myfunctions = api.getMyfunctions();

    api.defineFunction("compile", 1, (args, modifs) => {
        let expr = args[0];
        let cb = new CodeBuilder(api);
        let code = cb.generateColorPlotProgram(expr,DepthType.Flat);
        console.log(code);
        return {
            ctype: 'string',
            value: code
        };
        //console.log(myfunctions);
    });

    api.defineFunction("use8bittextures", 0, (args, modifs) => {
        use8bittextures = true;
        can_use_texture_float = can_use_texture_half_float = false;
        console.log("Switching to 8-bit textures mode.");
        return api.nada;
    });


    /**
     * argument canvaswrapper is optional. If it is not given, it will render on glcanvas
     */
    function compileAndRender(prog,depthType, a, b, width, height,boundingBox, canvaswrapper) {
        prog=compile(prog,depthType);
        render(prog, a, b, width, height,boundingBox, canvaswrapper);
    }
    function compile(prog,depthType) {
        if (typeof(prog.renderer)=="undefined") {
            prog.renderer = new Renderer(api, prog, depthType);
        }
        return prog;
    }
    /**
     * argument canvaswrapper is optional. If it is not given, it will render on glcanvas
     */
    function render(prog, a, b, width, height, boundingBox,canvaswrapper){
        prog.renderer.render(a, b, width, height, boundingBox,canvaswrapper);
        if (canvaswrapper)
            canvaswrapper.generation = Math.max(canvaswrapper.generation, canvaswrapper.canvas.generation + 1);
    }


    api.defineFunction("forcerecompile", 0, (args, modifs) => {
        requiredcompiletime++;
        return nada;
    });

    /**
     * plots colorplot on whole main canvas in CindyJS coordinates
     */
    api.defineFunction("colorplot", 1, (args, modifs) => {
        initGLIfRequired();

        var prog = args[0];

        let iw = api.instance['canvas']['width']; //internal measures. might be multiple of api.instance['canvas']['clientWidth'] on HiDPI-Displays
        let ih = api.instance['canvas']['height'];

        compileAndRender(prog,DepthType.Flat, computeLowerLeftCorner(api), computeLowerRightCorner(api), iw, ih,Renderer.noBounds(),null);
        let csctx = api.instance['canvas'].getContext('2d');

        csctx.save();
        csctx.setTransform(1, 0, 0, 1, 0, 0);
        csctx.drawImage(glcanvas, 0, 0, iw, ih, 0, 0, iw, ih);
        csctx.restore();

        return nada;
    });


    /**
     * plots colorplot on main canvas in CindyJS coordinates in the rectangle bounded by two points (as in Cinderella: coloplot(<expr>, <vec>, <vec>))
     */
    api.defineFunction("colorplot", 3, (args, modifs) => {
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
        var ul = {
            x: Math.min(a.x, b.x),
            y: Math.max(a.y, b.y)
        }; //upper left pt

        let iw = api.instance['canvas']['width']; //internal measures. (works also on HiDPI-Displays)
        let ih = api.instance['canvas']['height'];

        let cul = computeUpperLeftCorner(api);
        let clr = computeLowerRightCorner(api);

        let fx = Math.abs((a.x - b.x) / (clr.x - cul.x)); //x-ratio of screen that is used
        let fy = Math.abs((a.y - b.y) / (clr.y - cul.y)); //y-ratio of screen that is used

        compileAndRender(prog,DepthType.Flat, ll, lr, iw * fx, ih * fy,Renderer.noBounds(), null);
        let csctx = api.instance['canvas'].getContext('2d');

        let pt = {
            x: Math.min(a.x, b.x),
            y: Math.max(a.y, b.y)
        };
        let m = api.getInitialMatrix();

        var xx = iw * (ul.x - cul.x) / (clr.x - cul.x);
        var yy = ih * (ul.y - cul.y) / (clr.y - cul.y);

        csctx.save();
        csctx.setTransform(1, 0, 0, 1, 0, 0);
        csctx.drawImage(glcanvas, 0, 0, iw * fx, ih * fy, xx, yy, iw * fx, ih * fy);
        csctx.restore();
        return nada;
    });

    /**
     * plots on a given canvas and assumes that it lies on CindyJS-table with corners having coordinates a and b.
     */
    api.defineFunction("colorplot", 4, (args, modifs) => {
        initGLIfRequired();

        var a = api.extractPoint(api.evaluateAndVal(args[0]));
        var b = api.extractPoint(api.evaluateAndVal(args[1]));
        var name = api.evaluateAndVal(args[2]);
        var prog = args[3];

        if (!a.ok || !b.ok || name.ctype !== 'string') {
            return nada;
        }
        let imageobject = api.getImage(name['value'], true);
        //let canvaswrapper = generateWriteCanvasWrapperIfRequired(imageobject, api);
        let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api, false);
        var cw = imageobject.width;
        var ch = imageobject.height;
        compileAndRender(prog,DepthType.Flat, a, b, cw, ch,Renderer.noBounds(), canvaswrapper);

        return nada;
    });

    /**
     * plots on a given canvas and assumes that it lies on CindyJS-table sharing the two bottom corners of main canvas
     */
    api.defineFunction("colorplot", 2, (args, modifs) => {
        initGLIfRequired();

        var a = computeLowerLeftCorner(api);
        var b = computeLowerRightCorner(api);
        var name = api.evaluateAndVal(args[0]);
        var prog = args[1];

        if (name.ctype !== 'string') {
            return nada;
        }

        let imageobject = api.getImage(name['value'], true);
        //let canvaswrapper = generateWriteCanvasWrapperIfRequired(imageobject, api);
        let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api, false);
        var cw = imageobject.width;
        var ch = imageobject.height;
        compileAndRender(prog,DepthType.Flat, a, b, cw, ch, canvaswrapper);


        return nada;
    });


    /**
     * plots colorplot on whole main canvas in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     */
    api.defineFunction("colorplot3d", 1, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        let compiledProg=compile(prog,DepthType.Nearest);
        // TODO? use objects for elements of buffer
        CindyGL3D.objectBuffer.push([compiledProg,Renderer.noBounds(),null]);
        return nada;
    });
    /**
     * plots colorplot in region bounded by sphere in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     * args:  <expr> <center> <radius>
     */
    api.defineFunction("colorplot3d", 3, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        var center = coerce.toDirection(api.evaluateAndVal(args[1]));
        var radius = api.evaluateAndVal(args[2])["value"]["real"];
        let boundingBox=Renderer.boundingSphere(center,radius);
        let compiledProg=compile(prog,DepthType.Nearest,boundingBox);
        // TODO? use objects for elements of buffer
        CindyGL3D.objectBuffer.push(
            [compiledProg,boundingBox,null]);
        return nada;
    });
    /**
     * plots colorplot in region bounded by cylinder in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     * args:  <expr> <pointA> <pointB> <radius>
     */
    api.defineFunction("colorplot3d", 4, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        var pointA = coerce.toDirection(api.evaluateAndVal(args[1]));
        var pointB = coerce.toDirection(api.evaluateAndVal(args[2]));
        var radius = api.evaluateAndVal(args[3])["value"]["real"];
        let boundingBox=Renderer.boundingCylinder(pointA,pointB,radius);
        let compiledProg=compile(prog,DepthType.Nearest,boundingBox);
        // TODO? use objects for elements of buffer
        CindyGL3D.objectBuffer.push(
            [compiledProg,boundingBox,null]);
        return nada;
    });
    // plot3d(expr)
    // plot3d(expr,center,radius)
    let recomputeProjMatrix = function(){
        let x0=CindyGL3D.coordinateSystem.x0;
        let x1=CindyGL3D.coordinateSystem.x1;
        let y0=CindyGL3D.coordinateSystem.y0;
        let y1=CindyGL3D.coordinateSystem.y1;
        let z0=CindyGL3D.coordinateSystem.z0;
        let z1=CindyGL3D.coordinateSystem.z1;
        CindyGL3D.projectionMatrix=[
            [2/(x1-x0), 0, 0, - 2*x0/(x1-x0) -1],
            [0, 2/(y1-y0), 0, - 2*y0/(y1-y0) -1],
            [0, 0, 1/(z1-z0), - z0/(z1-z0) -.5],
            [0, 0, 1/(z1-z0), - z0/(z1-z0)]
        ];
    };
    let resetRotation = function(){
        CindyGL3D.trafoMatrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];// TODO is there a matrix type
        CindyGL3D.invTrafoMatrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        CindyGL3D.coordinateSystem.transformedViewPos=CindyGL3D.coordinateSystem.viewPosition;
    };
    api.defineFunction("cglBegin3d", 0, (args, modifs) => {
        initGLIfRequired();
        CindyGL3D.mode3D=true;
        let ul=computeUpperLeftCorner(api);
        let lr=computeLowerRightCorner(api);
        // TODO? make z-coords customizable
        CindyGL3D.coordinateSystem={
            x0: ul.x , x1: lr.x, y0: ul.y, y1: lr.y,
            z0: -10, z1:0
        };
        let x0=CindyGL3D.coordinateSystem.x0;
        let y0=CindyGL3D.coordinateSystem.y0;
        let x1=CindyGL3D.coordinateSystem.x1;
        let y1=CindyGL3D.coordinateSystem.y1;
        CindyGL3D.coordinateSystem.viewPosition=
            [(x0+x1)/2,(y0+y1)/2,CindyGL3D.coordinateSystem.z0,1];
        resetRotation();
        recomputeProjMatrix();
        return nada;
    });
    api.defineFunction("rotate3d", 2, (args, modifs) => {
        let alpha = api.evaluateAndVal(args[0])["value"]["real"];
        let beta = api.evaluateAndVal(args[1])["value"]["real"];
        let trafoMatrix;
        if(typeof(CindyGL3D.trafoMatrix)!== "undefined"){
            trafoMatrix=CindyGL3D.trafoMatrix;
        }else{
            trafoMatrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        }
        // TODO? are this the correct axex/directions
        let rotZ=[
          [1,0,0,0],
          [0,Math.cos(beta),Math.sin(beta),0],
          [0,-Math.sin(beta),Math.cos(beta),0],
          [0,0,0,1]
        ];
        let rotY=[
          [Math.cos(alpha),0,-Math.sin(alpha),0],
          [0,1,0,0],
          [Math.sin(alpha),0,Math.cos(alpha),0],
          [0,0,0,1]
        ];
        let rotationMatrix=mmult4(rotY,rotZ);
        CindyGL3D.trafoMatrix=mmult4(rotationMatrix,trafoMatrix);
        CindyGL3D.invTrafoMatrix=mmult4(CindyGL3D.invTrafoMatrix,transposeM4(rotationMatrix));
        if(typeof(CindyGL3D.coordinateSystem)!== "undefined"){
            CindyGL3D.coordinateSystem.transformedViewPos=
                mvmult4(CindyGL3D.invTrafoMatrix,CindyGL3D.coordinateSystem.viewPosition);
            return nada;
        }
        return nada;
    });
    // TODO? zoom function
    // TODO? move position/canvas
    // TODO? combined reset for objects and coord-system
    api.defineFunction("cglResetRotation", 0, (args, modifs) => {
        resetRotation()
    });
    api.defineFunction("cglReset3d", 0, (args, modifs) => {
        CindyGL3D.objectBuffer=[];
    });
    api.defineFunction("cglDraw3d", 0, (args, modifs) => {
        initGLIfRequired();
        // render order for translucent obejcts copied from cindy3d:
        // 1. render all objects once without depth testing
        // 2. render all objects with current depth
        // TODO ommit first render call when all objects are opaque
        // TODO find better way for rendering multiple translucent objects
            //internal measures. might be multiple of api.instance['canvas']['clientWidth'] on HiDPI-Displays
        let ll=computeLowerLeftCorner(api);
        let lr=computeLowerRightCorner(api);
        let iw = api.instance['canvas']['width'];
        let ih = api.instance['canvas']['height'];
        Renderer.resetCachedState();
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
        CindyGL3D.objectBuffer.forEach(([prog,boundingBox,cWrap])=>{
            render(prog,ll,lr, iw, ih,boundingBox, cWrap);
        });
        gl.enable(gl.DEPTH_TEST);
        CindyGL3D.objectBuffer.forEach(([prog,boundingBox,cWrap])=>{
            render(prog,ll,lr, iw, ih,boundingBox, cWrap);
        });
        //  gl.flush(); //renders stuff to canvaswrapper  TODO? support for canvasWrapper in 3d mode
        // TODO? directly render to main canvas
        let csctx = api.instance['canvas'].getContext('2d');
        csctx.save();
        csctx.setTransform(1, 0, 0, 1, 0, 0);
        csctx.drawImage(glcanvas, 0, 0, iw, ih, 0, 0, iw, ih);
        csctx.restore();
        return nada;
    });
    api.defineFunction("cglEnd3d", 0, (args, modifs) => {
        initGLIfRequired();
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        CindyGL3D.mode3D=false;
        return nada;
    });

    api.defineFunction("setpixel", 4, (args, modifs) => {

        var name = coerce.toString(api.evaluateAndVal(args[0]));
        var x = coerce.toInt(api.evaluateAndVal(args[1]));
        var y = coerce.toInt(api.evaluateAndVal(args[2]));

        var color = coerce.toColor(api.evaluateAndVal(args[3]));
        if (!name) return nada;
        let imageobject = api.getImage(name, true);
        //let canvaswrapper = generateWriteCanvasWrapperIfRequired(imageobject, api);
        let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api, false);

        if (isFinite(x) && isFinite(y) && name && canvaswrapper && color) {
            canvaswrapper.setPixel(x, y, color);
        }
        return nada;
    });


    // --- CindyXR support ---

    /**
     * Plots colorplot on one view of the main canvas in CindyJS coordinates.
     */
    api.defineFunction("colorplotxr", 2, (args, modifs) => {
        initGLIfRequired();

        let viewIndex = api.evaluate(args[0])["value"]["real"];
        var prog = args[1];

        if (typeof(prog.renderer)=="undefined") {
            prog.renderer = new Renderer(api, prog,DepthType.Flat);
        }
        prog.renderer.renderXR(viewIndex);

        return nada;
    });
}

// Exports for CindyXR
CindyGL3D.gl = null;
CindyGL3D.mode3D = false;
CindyGL3D.objectBuffer=[];
CindyGL3D.coordinateSystem = undefined;
CindyGL3D.generateCanvasWrapperIfRequired = generateCanvasWrapperIfRequired;
CindyGL3D.initGLIfRequired = initGLIfRequired;
CindyJS.registerPlugin(1, "CindyGL3D", CindyGL3D);
