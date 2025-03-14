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
function addv3(u,v){
    return [u[0]+v[0],u[1]+v[1],u[2]+v[2]];
}
function subv3(u,v){
    return [u[0]-v[0],u[1]-v[1],u[2]-v[2]];
}
function scalev3(a,v){
    return [a*v[0],a*v[1],a*v[2]];
}
function dot3(u,v){
    return u[0]*v[0]+u[1]*v[1]+u[2]*v[2];
}

/**
 * @param {*} program rendering program
 * @param { { type: BoundingBoxType } } boundingBox bounding box of rendered object in 3D space
 * @param {Map<string,any>} plotModifiers
 * @param { Set<string> } tags tags assigned to this Object
 * @param {CanvasWrapper} canvaswrapper
 * @constructor
 */
function CindyGL3DObject(program,boundingBox,plotModifiers,tags,canvaswrapper) {
    /**@type {number} */
    this.id = CindyGL3DObject.NEXT_ID++;
    this.program = program;
    /**@type {BoundingBoxType} */
    this.boundingBox = boundingBox;
    /**@type {Map<string,any>} */
    this.plotModifiers = plotModifiers;
    /**@type {Set<string>} */
    this.tags = tags;
    /**@type {CanvasWrapper} */
    this.canvaswrapper = canvaswrapper;
}
CindyGL3DObject.NEXT_ID=0;

let CindyGL3D = function(api) {

    //////////////////////////////////////////////////////////////////////
    // API bindings
    nada = api.nada;

    //myfunctions = api.getMyfunctions();

    api.defineFunction("compile", 1, (args, modifs) => {
        let expr = args[0];
        let cb = new CodeBuilder(api);
        let plotModifiers = get3DPlotModifiers(modifs);
        let code = cb.generateColorPlotProgram(expr,plotModifiers);
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
        prog=compile(prog,depthType,new Map());
        render(prog, a, b, width, height,boundingBox, new Map(), canvaswrapper);
    }
    /**
     * @param {DepthType} depthType
     * @param {Map<string,any>} plotModifiers values of plot-modifier arguments
     */
    function compile(prog,depthType,plotModifiers) {
        /**@type {Map<string,{type: type,used: boolean}>} */
        const modifierTypes = new Map();
        plotModifiers.forEach((value,key) => {
            modifierTypes.set(key, {type: guessTypeOfValue(value),used: false});
        });
        if (typeof(prog.renderer)=="undefined") {
            prog.renderer = new Renderer(api, prog, depthType,modifierTypes);
        } else if(plotModifiers.size>0) {
            // ensure modifier types are compatible with previous modifiers
            let prevModifiers=prog.renderer.modifierTypes;
            let sameKeys = prevModifiers.size == modifierTypes.size;
            let changed = false;
            modifierTypes.forEach(
                (value,key)=>{
                    if(prevModifiers.has(key)) {
                        let prevVal = prevModifiers.get(key);
                        if(prevVal.used) {
                            let commonType = lca(value.type,prevVal.type);
                            if(commonType===false){
                                // TODO? support multiple independent versions of program depending on types of modifiers
                                console.error(`incompatiable types for ${key}: ${typeToString(prevVal.type)} and ${value.type}`);
                                // use new type
                                commonType = value.type;
                                changed = true;
                            } else if(! typesareequal(commonType, prevVal.type)) {
                                changed = true;
                                console.log(`changled type of modifier ${key} to ${typeToString(commonType)}`);
                            }
                            value.type = commonType;
                            value.used = true;
                        }
                    } else {
                        sameKeys = false;
                        changed = true;
                    }
                }
            );
            if(!sameKeys){
                // TODO? allow and handle multiple modifier-sets on one program
                console.error("the set of modifiers associated with a plot expression should not change");
            }
            if(changed) {
                prog.renderer.updateModifierTypes(modifierTypes);
            }
        }
        // remove unused modifiers
        let unusedModifers=new Set();
        modifierTypes.forEach((value,key)=>{if(!value.used){unusedModifers.add(key)}});
        unusedModifers.forEach(key=>{plotModifiers.delete(key);modifierTypes.delete(key);});
        return prog;
    }
    /**
     * argument canvaswrapper is optional. If it is not given, it will render on glcanvas
     */
    function render(prog, a, b, width, height, boundingBox, plotModifiers, canvaswrapper){
        prog.renderer.render(a, b, width, height, boundingBox, plotModifiers, canvaswrapper);
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
        compileAndRender(prog,DepthType.Flat, a, b, cw, ch, Renderer.noBounds() ,canvaswrapper);


        return nada;
    });
    /**
     * get plot modifers from object
     * @param {Object} callModifiers
     * @returns {Map<string,any>}
     */
    function get3DPlotModifiers(callModifiers){
        let modifiers = new Map();
        Object.entries(callModifiers).forEach(([name, value])=>{
            if(name.length < 2 || !name.startsWith("U"))
                return;
            let modName=name.substring(1);
            if(CodeBuilder.builtIns.has(modName)){
                console.warn("modifer is shadowed by built-in: "+modName);
            }else if(modName.startsWith(CodeBuilder.cindygl3dPrefix)){
                console.warn(`names starting with "${CodeBuilder.cindygl3dPrefix}" are reserved for internal use`);
            }
            modifiers.set(modName,api.evaluateAndVal(value));
        });
        return modifiers;
    }
    /**
     * @param {Object} callModifiers
     * @returns {Set<string>}
     */
    function get3DPlotTags(callModifiers){
        let tags = new Set();
        if(callModifiers.hasOwnProperty("tags")){
            let tagList = coerce.toList(api.evaluateAndVal(callModifiers["tags"]));
            tagList.forEach((tagValue)=>{
                tags.add(coerce.toString(tagValue));
            });
        }
        return tags;
    }
    /**
     * @param {number} objId
     * @param {CindyGL3DObject} obj3d
     */
    function setObject(objId,obj3d){
        if(obj3d.program.renderer.opaque) {
            CindyGL3D.objectBuffer.opaque.set(objId,obj3d);
        } else {
            CindyGL3D.objectBuffer.translucent.set(objId,obj3d);
        }
    }
    /**
     * plots colorplot on whole main canvas in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     */
    api.defineFunction("colorplot3d", 1, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        let plotModifiers=get3DPlotModifiers(modifs);
        let compiledProg=compile(prog,DepthType.Nearest,plotModifiers);
        let obj3d=new CindyGL3DObject(compiledProg,Renderer.noBounds(),plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
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
        let plotModifiers=get3DPlotModifiers(modifs);
        var center = coerce.toDirection(api.evaluateAndVal(args[1]));
        var radius = api.evaluateAndVal(args[2])["value"]["real"];
        let boundingBox=Renderer.boundingSphere(center,radius);
        let compiledProg=compile(prog,DepthType.Nearest,plotModifiers);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
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
        let plotModifiers=get3DPlotModifiers(modifs);
        var pointA = coerce.toDirection(api.evaluateAndVal(args[1]));
        var pointB = coerce.toDirection(api.evaluateAndVal(args[2]));
        var radius = api.evaluateAndVal(args[3])["value"]["real"];
        let boundingBox=Renderer.boundingCylinder(pointA,pointB,radius);
        let compiledProg=compile(prog,DepthType.Nearest,plotModifiers);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
        return nada;
    });
    let recomputeProjMatrix = function(){
        let zoom = CindyGL3D.coordinateSystem.zoom;
        let x0=CindyGL3D.coordinateSystem.x0*zoom;
        let x1=CindyGL3D.coordinateSystem.x1*zoom;
        let y0=CindyGL3D.coordinateSystem.y0*zoom;
        let y1=CindyGL3D.coordinateSystem.y1*zoom;
        let z0=CindyGL3D.coordinateSystem.z0*zoom;
        let z1=CindyGL3D.coordinateSystem.z1*zoom;
        CindyGL3D.projectionMatrix=[
            [2/(x1-x0), 0, 0, - 2*x0/(x1-x0) -1],
            [0, 2/(y1-y0), 0, - 2*y0/(y1-y0) -1],
            [0, 0, 1/(z1-z0), - z0/(z1-z0) -.5],
            [0, 0, 1/(z1-z0), - z0/(z1-z0)]
        ];
        CindyGL3D.coordinateSystem.viewPosition=
            [(x0+x1)/2,(y0+y1)/2,z0,1];
        CindyGL3D.coordinateSystem.transformedViewPos=
            mvmult4(CindyGL3D.invTrafoMatrix,CindyGL3D.coordinateSystem.viewPosition);
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
        let z0 = modifs.hasOwnProperty("z0") ?
            api.evaluateAndVal(modifs["z0"])["value"]["real"] : -10;
        // TODO? make z-coords customizable
        CindyGL3D.coordinateSystem = {
            x0: ul.x , x1: lr.x, y0: lr.y, y1: ul.y,
            z0: z0, z1:0, zoom: 1,
            // will be correctly initialized by recomputeProjMatrix()
            viewPosition: [0,0,0,0], transformedViewPos: [0,0,0,0]
        };
        resetRotation();
        recomputeProjMatrix();
        return nada;
    });
    api.defineFunction("cglViewPos", 0, (args, modifs) => { // TODO? variable instead of function
        // TODO? initialize coordinate-system if not existent
        let viewPos = CindyGL3D.coordinateSystem.transformedViewPos.slice(0,3);
        return { // convert to CindyJS list
            ctype: 'list',
            value: viewPos.map(v => ({
                ctype: 'number',
                value: {
                    'real': v,
                    'imag': 0
                }
            }))
        };
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
        // TODO? are this the correct axes/directions
        let rotZ=[
          [1,0,0,0],
          [0,Math.cos(beta),-Math.sin(beta),0],
          [0,Math.sin(beta),Math.cos(beta),0],
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
    // TODO? directly set zoom or update previous value
    api.defineFunction("zoom3d", 1, (args, modifs) => {
        let zoom = api.evaluateAndVal(args[0])["value"]["real"];
        CindyGL3D.coordinateSystem.zoom = zoom;
        recomputeProjMatrix();
    });
    // TODO? move position/canvas
    // TODO? combined reset for objects and coord-system
    api.defineFunction("cglResetRotation", 0, (args, modifs) => {
        resetRotation();
        return nada;
    });
    api.defineFunction("cglReset3d", 0, (args, modifs) => {
        CindyGL3D.objectBuffer={opaque:new Map(),translucent:new Map()};
        return nada;
    });
    api.defineFunction("cglDraw3d", 0, (args, modifs) => {
        initGLIfRequired();
        // render order for translucent obejcts copied from cindy3d:
        // 1. render translucent objects to get correct background for transparent pixels
        // 2. render all opaque objects
        // 3. render translucent objects above opaque objects where neccessary
        // TODO find better way for rendering multiple translucent objects

        // internal measures. might be multiple of api.instance['canvas']['clientWidth'] on HiDPI-Displays
        let ll=computeLowerLeftCorner(api);
        let lr=computeLowerRightCorner(api);
        let iw = api.instance['canvas']['width'];
        let ih = api.instance['canvas']['height'];
        Renderer.resetCachedState();
        /*
            changing global variables can change internal code of rendered objects
             -> check for each object if it is in the correct category
        */
        /** @type{Set<CindyGL3DObject>} */
        const wrongOpacity = new Set();
        gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
        if(CindyGL3D.objectBuffer.translucent.size>0){
            // draw translucent objects without depth testing
            //  needed to correctly display translucent objects behind other transparent objects
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            CindyGL3D.objectBuffer.translucent.forEach((obj3d)=>{
                render(obj3d.program,ll,lr, iw, ih,obj3d.boundingBox,obj3d.plotModifiers, obj3d.canvaswrapper);
                if(obj3d.program.renderer.opaque){
                    wrongOpacity.add(obj3d);
                }
            });
        }
        gl.disable(gl.BLEND); // no need to blend opaque objects
        gl.enable(gl.DEPTH_TEST);
        CindyGL3D.objectBuffer.opaque.forEach((obj3d)=>{
            render(obj3d.program,ll,lr, iw, ih,obj3d.boundingBox,obj3d.plotModifiers, obj3d.canvaswrapper);
            if(!obj3d.program.renderer.opaque){
                wrongOpacity.add(obj3d);
            }
        });
        if(CindyGL3D.objectBuffer.translucent.size>0){
            // reenable blending
            gl.enable(gl.BLEND);
            CindyGL3D.objectBuffer.translucent.forEach((obj3d)=>{
                render(obj3d.program,ll,lr, iw, ih,obj3d.boundingBox,obj3d.plotModifiers, obj3d.canvaswrapper);
                if(obj3d.program.renderer.opaque){
                    wrongOpacity.add(obj3d);
                }
            });
        }
        if(wrongOpacity.size>0){
            console.log(`changing opacity of ${wrongOpacity.size} objects`);
            // update objects that had the wrong opacity
            wrongOpacity.forEach((obj3d)=>{
                if(obj3d.program.renderer.opaque){
                    CindyGL3D.objectBuffer.opaque.delete(obj3d.id);
                }else{
                    CindyGL3D.objectBuffer.translucent.delete(obj3d.id);
                }
                setObject(obj3d.id,obj3d);
            });
        }
        //  gl.flush(); //renders stuff to canvaswrapper  TODO? support for canvasWrapper in 3d mode
        // TODO? directly render to main canvas
        let csctx = api.instance['canvas'].getContext('2d');
        csctx.save();
        csctx.setTransform(1, 0, 0, 1, 0, 0);
        csctx.drawImage(glcanvas, 0, 0, iw, ih, 0, 0, iw, ih);
        csctx.restore();
        return nada;
    });
    /**
     * Finds the 3D object on the view-ray through the screen position (args[0],args[1]) that is closest to the camera.
     * If the `tags` modifier is set only objects that have at least one of the specified tags are considered
     */
    api.defineFunction("cglFindObject", 2, (args, modifs) => {
        let x = api.evaluateAndVal(args[0])["value"]["real"];
        let y = api.evaluateAndVal(args[1])["value"]["real"];
        // TODO? is this the correct z position
        let screenPoint=[x,y,CindyGL3D.coordinateSystem.z1,1];
        let tags = get3DPlotTags(modifs);
        let spacePoint = mvmult4(CindyGL3D.invTrafoMatrix,screenPoint);
        let viewPos = CindyGL3D.coordinateSystem.transformedViewPos;
        let direction = subv3(spacePoint,viewPos);
        let minDst = Infinity;
        let pickedId = -1;
        let searchObject = (obj3d)=>{
            // TODO Set.intersection once suppported
            let sharesTag = tags.size==0;
            for(const tag of tags){
                if(obj3d.tags.has(tag)){
                    sharesTag=true;
                    break;
                }
            };
            if(!sharesTag)
                return;
            // TODO? execute colorplot code to get correct z-coordinate
            if(obj3d.boundingBox.type == BoundingBoxType.sphere){
                let center = obj3d.boundingBox.center;
                // TODO? also detect positions sligthly outside sphere
                let radius = obj3d.boundingBox.radius;
                // |v+l*d -c|=r
                let vc = subv3(viewPos,center);
                let a = dot3(direction,direction);
                let b = dot3(vc,direction);
                let c = dot3(vc,vc) - radius*radius;
                let D = b*b-a*c;
                if(D<0){ return; } // ray does not hit sphere
                let dst = (-b - Math.sqrt(D))/a;
                if(dst>=0 && dst<=minDst){
                    minDst = dst;
                    pickedId = obj3d.id;
                }
            }else if(obj3d.boundingBox.type == BoundingBoxType.cylinder){
                let radius = obj3d.boundingBox.radius;
                let pointA = obj3d.boundingBox.pointA;
                let pointB = obj3d.boundingBox.pointB;
                let direction0 = scalev3(1/Math.sqrt(dot3(direction,direction)),direction);
                let p1 = subv3(viewPos,scalev3(0.5,addv3(pointA,pointB)));
                let w = Math.sqrt(dot3(p1,p1));
                let W = addv3(viewPos,scalev3(w,direction0));
                let BA= subv3(pointB,pointA);
                let U=scalev3(1/dot3(BA,BA),BA);
                let VA = subv3(W,pointA);
                let S = subv3(VA,scalev3(dot3(VA,BA),U));
                let T = subv3(direction0,scalev3(dot3(direction0,BA),U));
                let a = dot3(T,T);
                let b = dot3(S,T);
                let c = dot3(S,S) -radius*radius;
                let D= b*b-a*c;
                if(D<0){ return; } // ray does not hit cylinder
                let l1 = -(b + Math.sqrt(D))/a;
                let v1 = subv3(addv3(W,scalev3(l1,direction0)),pointA);
                let delta = Math.max(0,Math.min(dot3(v1,U),1));
                let center = addv3(scalev3(delta,pointB),scalev3(1-delta,pointA));
                let vc = subv3(viewPos,center);
                // a = dot3(direction0,direction0) // == 1
                b = dot3(vc,direction0);
                c = dot3(vc,vc) - radius*radius;
                D = b*b-c;
                if(D<0){ return; } // ray does not hit sphere
                let dst = -b - Math.sqrt(D);
                if(dst>=0 && dst<=minDst){
                    minDst = dst;
                    pickedId = obj3d.id;
                }
            }
            // TODO? checks different bouning box types
        };
        CindyGL3D.objectBuffer.opaque.forEach(searchObject);
        // TODO? parameter to select if translucent objects should be checked
        CindyGL3D.objectBuffer.translucent.forEach(searchObject);
        // TODO? convert picked 3D-object to CindyJS object
        //   make name,position, readable, ? writable
        return {
            ctype: 'number',
            value: {
                'real': pickedId,
                'imag': 0
            }
        };
    });
    api.defineFunction("cglUpdate", 1, (args, modifs) => {
        let objId = coerce.toInt(api.evaluateAndVal(args[0]),-1);
        if(objId<0)
            return nada;
        let obj3d = CindyGL3D.objectBuffer.opaque.get(objId);
        let wasOpaque = true;
        if(obj3d === undefined){
            obj3d = CindyGL3D.objectBuffer.translucent.get(objId);
            wasOpaque = false;
            if(obj3d === undefined){
                console.warn(`could not find object with id ${objId}`);
                return nada;
            }
        }
        let plotModifiers=get3DPlotModifiers(modifs);
        // copy unchanged modifiers
        obj3d.plotModifiers.forEach((value,key)=>{
            if(!plotModifiers.has(key)){
                plotModifiers.set(key,value);
            }
        });
        // update modifers types in renderer
        obj3d.program = compile(obj3d.program,obj3d.program.renderer.depthType,plotModifiers);
        if(obj3d.program.renderer.opaque !== wasOpaque){
            // opacity changed
            if(wasOpaque) {
                CindyGL3D.objectBuffer.opaque.delete(objId);
                CindyGL3D.objectBuffer.translucent.set(objId,obj3d);
            } else {
                CindyGL3D.objectBuffer.translucent.delete(objId);
                CindyGL3D.objectBuffer.opaque.set(objId,obj3d);
            }
        }
        obj3d.plotModifiers = plotModifiers;
        return nada;
    });
    api.defineFunction("cglEnd3d", 0, (args, modifs) => {
        initGLIfRequired();
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        CindyGL3D.mode3D=false;
        return nada;
    });
    // wrapper for unevaluated expression that can be passed to colorplot program
    api.defineFunction("cglLazy", 2, (args, modifs) => {
        let params;
        if(args[0]['ctype'] === "list") {
            params = args[0]['value'];
        } else if(args[0]['ctype'] === "function" && args[0]['oper'] === "genList"){
            params = args[0]['args'];
        } else {
            params = [args[0]];
        }
        let paramsOk = true;
        params.forEach(val=>{
            if(val['ctype'] !== 'variable'){
                console.error("unexpected parameter in cglLazy expected variable got:",val);
                paramsOk = false;
            }
        });
        if(!paramsOk)
            return nada;
        return {
            ctype: "cglLazy",
            params: params,
            expr: args[1]
        };
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
            prog.renderer = new Renderer(api, prog,DepthType.Flat,new Map());
        }
        prog.renderer.renderXR(viewIndex);

        return nada;
    });
}

// Exports for CindyXR
CindyGL3D.gl = null;
CindyGL3D.mode3D = false;
/**@type {{opaque:Map<number,CindyGL3DObject>, translucent:Map<number,CindyGL3DObject>}} */
CindyGL3D.objectBuffer={opaque:new Map(),translucent:new Map()};
// initialize with dummy values to make type-resolving easier
CindyGL3D.coordinateSystem = {
    x0:0 , x1: 0, y0: 0, y1: 0,  z0: 0, z1:0, zoom: 1,
    viewPosition: [0,0,0,0], transformedViewPos: [0,0,0,0]
};
CindyGL3D.generateCanvasWrapperIfRequired = generateCanvasWrapperIfRequired;
CindyGL3D.initGLIfRequired = initGLIfRequired;
CindyJS.registerPlugin(1, "CindyGL3D", CindyGL3D);
