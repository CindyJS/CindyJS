let CindyGL = function (api) {
    //////////////////////////////////////////////////////////////////////
    // API bindings
    nada = api.nada;

    //myfunctions = api.getMyfunctions();

    api.defineFunction("compile", 1, (args, modifs) => {
        let expr = args[0];
        let cb = new CodeBuilder(api);
        let code = cb.generateColorPlotProgram(expr);
        console.log(code);
        return {
            ctype: "string",
            value: code,
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

        let iw = api.instance["canvas"]["width"]; //internal measures. might be multiple of api.instance['canvas']['clientWidth'] on HiDPI-Displays
        let ih = api.instance["canvas"]["height"];

        compileAndRender(prog, computeLowerLeftCorner(api), computeLowerRightCorner(api), iw, ih, null);
        let csctx = api.instance["canvas"].getContext("2d");

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
            y: Math.min(a.y, b.y),
        }; //lower left pt
        var lr = {
            x: Math.max(a.x, b.x),
            y: Math.min(a.y, b.y),
        }; //lower right pt
        var ul = {
            x: Math.min(a.x, b.x),
            y: Math.max(a.y, b.y),
        }; //upper left pt

        let iw = api.instance["canvas"]["width"]; //internal measures. (works also on HiDPI-Displays)
        let ih = api.instance["canvas"]["height"];

        let cul = computeUpperLeftCorner(api);
        let clr = computeLowerRightCorner(api);

        let fx = Math.abs((a.x - b.x) / (clr.x - cul.x)); //x-ratio of screen that is used
        let fy = Math.abs((a.y - b.y) / (clr.y - cul.y)); //y-ratio of screen that is used

        compileAndRender(prog, ll, lr, iw * fx, ih * fy, null);
        let csctx = api.instance["canvas"].getContext("2d");

        let pt = {
            x: Math.min(a.x, b.x),
            y: Math.max(a.y, b.y),
        };
        let m = api.getInitialMatrix();

        var xx = (iw * (ul.x - cul.x)) / (clr.x - cul.x);
        var yy = (ih * (ul.y - cul.y)) / (clr.y - cul.y);

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

        if (!a.ok || !b.ok || name.ctype !== "string") {
            return nada;
        }
        let imageobject = api.getImage(name["value"], true);
        //let canvaswrapper = generateWriteCanvasWrapperIfRequired(imageobject, api);
        let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api, false);
        var cw = imageobject.width;
        var ch = imageobject.height;
        compileAndRender(prog, a, b, cw, ch, canvaswrapper);

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

        if (name.ctype !== "string") {
            return nada;
        }

        let imageobject = api.getImage(name["value"], true);
        //let canvaswrapper = generateWriteCanvasWrapperIfRequired(imageobject, api);
        let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api, false);
        var cw = imageobject.width;
        var ch = imageobject.height;
        compileAndRender(prog, a, b, cw, ch, canvaswrapper);

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

        if (!prog.iscompiled || prog.compiletime < requiredcompiletime) {
            //console.log("Program is not compiled. So we will do that");
            prog.iscompiled = true; //Note we are adding attributes to the parsed cindyJS-Code tree
            prog.compiletime = requiredcompiletime;
            prog.renderer = new Renderer(api, prog);
        }
        prog.renderer.renderXR(viewIndex);

        return nada;
    });
};

// Exports for CindyXR
CindyGL.gl = null;
CindyGL.generateCanvasWrapperIfRequired = generateCanvasWrapperIfRequired;
CindyGL.initGLIfRequired = initGLIfRequired;
CindyJS.registerPlugin(1, "CindyGL", CindyGL);
