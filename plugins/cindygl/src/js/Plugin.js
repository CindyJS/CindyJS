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
 * @param {Renderer} renderer rendering program
 * @param { { type: BoundingBoxType } } boundingBox bounding box of rendered object in 3D space
 * @param {Map<string,*>} plotModifiers
 * @param { Set<string> } tags tags assigned to this Object
 * @param {CanvasWrapper} canvaswrapper
 * @constructor
 */
function CindyGL3DObject(renderer,boundingBox,plotModifiers,tags,canvaswrapper) {
    /**@type {number} */
    this.id = CindyGL3DObject.NEXT_ID++;
    this.renderer = renderer;
    this.boundingBox = boundingBox;
    this.plotModifiers = plotModifiers;
    this.tags = tags;
    this.canvaswrapper = canvaswrapper;
}
CindyGL3DObject.NEXT_ID=0;

let CindyGL = function(api) {

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
        let renderer=compile(prog,depthType,boundingBox,new Map(),new Map());
        Renderer.resetCachedState();
        render(renderer, a, b, width, height,boundingBox, new Map(), canvaswrapper);
    }
    /**
     * @param {CindyJS.anyval} prog
     * @param {DepthType} depthType
     * @param {boundingBox} boundingBox
     * @param {Map<string,*>} plotModifiers values of plot-modifier arguments
     * @param {Map<string,{values:Array<*>,eltType:type}>} vModifiers vertex modifiers
     * @returns {Renderer}
     */
    function compile(prog,depthType,boundingBox,plotModifiers,vModifiers) {
        /**@type {Map<string,{type: type,isuniform: boolean,used: boolean}>} */
        const modifierTypes = new Map();
        /**@type {Map<string,{type: type,isuniform: boolean,used: boolean}>} */
        const mergedTypes = new Map();
        plotModifiers.forEach((value,key) => {
            let valType = guessTypeOfValue(value);
            modifierTypes.set(key, {type: valType,isuniform: true,used: false});
            mergedTypes.set(key, {type: valType,isuniform: true,used: false});
        });
        vModifiers.forEach((value,key) => {
            modifierTypes.set(key, {type: value.eltType,isuniform: false,used: false});
            mergedTypes.set(key, {type: value.eltType,isuniform: false,used: false});
        });
        if (typeof(prog.renderers)=="undefined") prog.renderers = [];
        /**@type {Renderer} */
        let renderer;
        let foundMatch = false;
        for(const candidate of prog.renderers){
            renderer = candidate;
            // ensure modifier types are compatible with previous modifiers
            let prevModifiers=renderer.modifierTypes;
            if(prevModifiers.size != modifierTypes.size)
                continue; // differernt sets of modifers -> try next renderer
            let changed = false;
            let compatible = true;
            for(const key of mergedTypes.keys()){
                let value = modifierTypes.get(key);
                if(prevModifiers.has(key)) {
                    let prevVal = prevModifiers.get(key);
                    if(prevVal.isuniform != value.isuniform){
                        compatible = false;
                        break;
                    }
                    let commonType = lca(value.type,prevVal.type);
                    if(commonType===false){
                        // incompatible modifier types
                        compatible = false;
                        break;
                    } else if(! typesareequal(commonType, prevVal.type)) {
                        changed = true;
                        console.log(`changled type of modifier ${key} to ${typeToString(commonType)}`);
                    }
                    value.type = commonType;
                } else {
                    // differernt sets of modifers
                    compatible = false;
                    break;
                }
            }
            if(!compatible)
                continue; // differernt sets of modifers -> try next renderer
            if(changed) {
                renderer.updateModifierTypes(mergedTypes);
            }
            foundMatch = true;
            break;
        }
        if(!foundMatch){
            console.log("create new Renderer for modifiers: ",modifierTypes);
            renderer = new Renderer(api, prog, depthType,boundingBox, modifierTypes);
            prog.renderers.push(renderer);
            // TODO? sort renderes by number of instances
            modifierTypes.forEach((value,key)=>{
                if(!value.used){
                    console.log(`modifier ${key} is never used`)
                }
            });
        }
        return renderer;
    }
    /**
     * argument canvaswrapper is optional. If it is not given, it will render on glcanvas
     */
    function render(renderer, a, b, width, height, boundingBox, plotModifiers, canvaswrapper){
        renderer.render(a, b, width, height, boundingBox, plotModifiers, canvaswrapper);
        if (canvaswrapper)
            canvaswrapper.generation = Math.max(canvaswrapper.generation, canvaswrapper.canvas.generation + 1);
    }
    function toCjsNumber(x) {
        return {
            ctype: 'number',
            value: {
                'real': x,
                'imag': 0
            }
        };
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

    function readModifierList(modValue,modName,modifiers,addModifier) {
        let modList;
        if(modValue["ctype"]!=="list") {
            console.error(`unexpected value for '${modName}' expected list got: `,modList);
            modList=[];
        } else {
            modList = modValue['value'];
        }
        modList.forEach(v=>{
            if(v['ctype'] !== 'list' || v['value'].length != 2) {
                console.error("unexpected entry in modifier list expected [key,value] got: ",v);
                return;
            }
            let key = v['value'][0];
            if(key['ctype'] !== "string") {
                console.error("unexpected key for modifier list expected string got: ",key);
                return;
            }
            key = key['value'];
            let value = v['value'][1];
            addModifier(modifiers,key,value);
        });
        return modifiers;
    }
    /**
     * get plot modifers from object
     * @param {Object} callModifiers
     * @returns {Map<string,*>}
     */
    function get3DPlotModifiers(callModifiers){
        let modifiers = new Map();
        // TODO? warn for duplicate elements
        function addUmodifier(modifiers,modName,modValue) {
            if(CodeBuilder.builtIns.has(modName)){
                console.warn("modifier is shadowed by built-in: "+modName);
            }
            modifiers.set(modName,modValue);
        }
        if(callModifiers.hasOwnProperty("plotModifiers")){
            modifiers=readModifierList(api.evaluateAndVal(callModifiers["plotModifiers"]),"plotModifiers",modifiers,addUmodifier);
        }
        Object.entries(callModifiers).forEach(([name, value])=>{
            if(name.length < 2 || !name.startsWith("U"))
                return;
            addUmodifier(modifiers,name.substring(1),api.evaluateAndVal(value));
        });
        return modifiers;
    }
    /**
     * get vertex modifers from object
     * @param {Object} callModifiers
     * @param {number} vCount
     * @returns {Map<string,{values: Array<*>,eltType: type}>}
     */
    function get3DPlotVertexModifiers(callModifiers,vCount,plotModifiers){
        let modifiers = new Map();
        function addVmodifier(modifiers,modName,modValue) {
            if(plotModifiers.has(modName)){
                console.warn("vertex modifer is shadowed by uniform modifier: "+modName);
                return;
            }
            if(CodeBuilder.builtIns.has(modName)){
                console.warn("modifer is shadowed by built-in: "+modName);
            }
            let valList = coerce.toList(modValue,[]);
            if(valList.length != vCount){
                console.error(`vertex modifier should be list with one element for each vertex: ${modName}`);
                console.error(`expected: ${vCount} got: ${valList.length}`);
                return;
            }
            // compute common element type
            let eltType = valList.map(guessTypeOfValue).reduce(lca);
            // promote int to float to allow interpolation
            eltType = replaceIntbyFloat(eltType);
            modifiers.set(modName,{values: valList,eltType: eltType});
        }
        if(callModifiers.hasOwnProperty("vModifiers")){
            modifiers=readModifierList(api.evaluateAndVal(callModifiers["vModifiers"]),"vModifiers",modifiers,addVmodifier);
        }
        Object.entries(callModifiers).forEach(([name, value])=>{
            if(name.length < 2 || !name.startsWith("V"))
                return;
            addVmodifier(modifiers,name.substring(1),api.evaluateAndVal(value));
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
        if(obj3d.renderer.opaque) {
            CindyGL.objectBuffer.opaque.set(objId,obj3d);
        } else {
            CindyGL.objectBuffer.translucent.set(objId,obj3d);
        }
    }
    /**
     * @param {*} modifs
     * @param {string} name
     * @param {number} defValue
     * @returns {number} */
    function getRealModifier(modifs,name,defValue) {
        if(!modifs.hasOwnProperty(name))
            return defValue;
        return coerce.toReal(api.evaluateAndVal(modifs[name]),defValue);
    }
    /**
     * @param {*} modifs
     * @param {string} name
     * @param {Array<number>} defValue
     * @returns {Array<number>} */
    function getPoint2DModifier(modifs,name,defValue) {
        if(!modifs.hasOwnProperty(name))
            return defValue;
        let val0 = api.evaluateAndVal(modifs[name]);
        val0 = coerce.toList(val0);
        if(val0 === null)
            return defValue;
        /**@type {Array<number>} */
        let val = val0.map(coerce.toReal);
        if(val.length < 2) {
            console.warn(`not enough elements for point ${name} expected 2 got ${val.length}`);
            return val.length > 0 ? [val[0],val[0]] : defValue;
        } else if(val.length > 2) {
            console.warn("point has to many components, truncating");
            return val.slice(0,2);
        }
        return val;
    }
    /**
     * plots colorplot on whole main canvas in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     */
    api.defineFunction("colorplot3d", 1, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        let plotModifiers=get3DPlotModifiers(modifs);
        let compiledProg=compile(prog,DepthType.Nearest,Renderer.noBounds(),plotModifiers,new Map());
        let obj3d=new CindyGL3DObject(compiledProg,Renderer.noBounds(),plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
    });
    function verticesFromCJS(vertices){
        vertices = coerce.toList(vertices);
        if(!(vertices instanceof Array)||vertices.length == 0){
            // no array or no vertices
            return undefined;
        }
        let eltType = vertices[0]['ctype'];
        // flatten vertex list
        // TODO! check if all components have same size
        if(eltType === 'list') {
            // nested list
            vertices = vertices.flatMap(v=>{
                let xyz=coerce.toList(v);
                if(!Array.isArray(xyz)||xyz.length!=3){
                    let contentType="vertices";
                    if(Array.isArray(xyz)&&xyz.length>0&&xyz[0]['ctype']=='list'){
                        contentType = "triangles";
                    }
                    console.warn(`${contentType} should be lists of length 3`);
                    return [];
                }
                return xyz;
            });
            eltType = vertices[0]['ctype'];
            // doubly nested list
            if(eltType === 'list') {
                vertices = vertices.flatMap(v=>{
                    let xyz=coerce.toList(v);
                    if(!Array.isArray(xyz)||xyz.length!=3){
                        console.warn("vertices should be lists of length 3");
                        return [];
                    }
                    return xyz;
                });
                eltType = vertices[0]['ctype'];
            }
        }
        if(eltType === 'number') {
            vertices = vertices.map(coerce.toReal);
            if(vertices.length % 3 !== 0){
                console.error("the number of coordinates should be divisible by 3");
            }else if(vertices.length % 9 !== 0){
                console.error("the number of vertices should be divisible by 3");
            }
        } else {
            console.error(`unexpected type for vertex-coordinate: ${eltType}`);
            return undefined;
        }
        return vertices;
    }
    /**
     * plots colorplot on whole main canvas in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     *
     * renderes the given colorplot function on a triangual mesh given in the second parameter.
     * the triangles can be given in one of the following three formats:
     *   - [x1,y1,z1,x2,y2,z2,...]      list of vertex coordinates
     *   - [v1,v2,v3,v4,...]            list of vertices
     *   - [[v1,v2,v3],[u1,u2,u3],...]  list of triangles
     */
    api.defineFunction("colorplot3d", 2, (args, modifs) => {
        initGLIfRequired();
        let prog = args[0];
        let plotModifiers = get3DPlotModifiers(modifs);
        let vertices = verticesFromCJS(api.evaluateAndVal(args[1]));
        if(vertices === undefined) {
            console.warn("invalid vertex data",args[1]);
            return nada;
        }
        let vCount = vertices.length/3;
        if(vCount < 3) {
            console.warn("not enough vertices for triangle");
            return nada; // not enough vertices
        }
        let vModifiers = get3DPlotVertexModifiers(modifs,vCount,plotModifiers);
        let boundingBox=Renderer.boundingTriangles(vertices,vModifiers);
        let compiledProg=compile(prog,DepthType.Nearest,boundingBox,plotModifiers,vModifiers);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
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
        let compiledProg=compile(prog,DepthType.Nearest,boundingBox,plotModifiers,new Map());
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
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
        let compiledProg=compile(prog,DepthType.Nearest,boundingBox,plotModifiers,new Map());
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs),null);
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
    });
    let recomputeProjMatrix = function(){
        let zoom = CindyGL.coordinateSystem.zoom;
        let x0=CindyGL.coordinateSystem.x0*zoom;
        let x1=CindyGL.coordinateSystem.x1*zoom;
        let y0=CindyGL.coordinateSystem.y0*zoom;
        let y1=CindyGL.coordinateSystem.y1*zoom;
        let z0=CindyGL.coordinateSystem.z0*zoom;
        let z1=CindyGL.coordinateSystem.z1*zoom;
        CindyGL.projectionMatrix=[
            [2/(x1-x0), 0, 0, - 2*x0/(x1-x0) -1],
            [0, 2/(y1-y0), 0, - 2*y0/(y1-y0) -1],
            [0, 0, 1/(z1-z0), - z0/(z1-z0) -.5],
            [0, 0, 1/(z1-z0), - z0/(z1-z0)]
        ];
        CindyGL.coordinateSystem.viewPosition=
            [(x0+x1)/2,(y0+y1)/2,z0,1];
        CindyGL.coordinateSystem.transformedViewPos=
            mvmult4(CindyGL.invTrafoMatrix,CindyGL.coordinateSystem.viewPosition);
    };
    let resetRotation = function(){
        CindyGL.trafoMatrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];// TODO is there a matrix type
        CindyGL.invTrafoMatrix=[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        CindyGL.coordinateSystem.transformedViewPos=CindyGL.coordinateSystem.viewPosition;
    };
    let updateCoordSytem = function(modifs) {
        let ul=computeUpperLeftCorner(api);
        let lr=computeLowerRightCorner(api);
        let x0 = getRealModifier(modifs,"x0",ul.x);
        let x1 = getRealModifier(modifs,"x1",lr.x);
        let y0 = getRealModifier(modifs,"y0",lr.y);
        let y1 = getRealModifier(modifs,"y1",ul.y);
        [x0, y0] = getPoint2DModifier(modifs,"p0",[x0, y0]);
        [x1, y1] = getPoint2DModifier(modifs,"p1",[x1, y1]);
        let z1 = getRealModifier(modifs,"z1",0);
        let z0 = getRealModifier(modifs,"z0",z1-2*Math.abs(x1-x0));
        let zoom = getRealModifier(modifs,"zoom",1);
        CindyGL.coordinateSystem = {
            x0: x0 , x1: x1, y0: y0, y1: y1,
            z0: z0, z1: z1, zoom: zoom,
            // will be correctly initialized by recomputeProjMatrix()
            viewPosition: [0,0,0,0], transformedViewPos: [0,0,0,0]
        };
        recomputeProjMatrix();
    }
    api.defineFunction("cglBegin3d", 0, (args, modifs) => {
        initGLIfRequired();
        CindyGL.mode3D=true;
        if(typeof(CindyGL.trafoMatrix) === "undefined"){
            resetRotation();
        }
        updateCoordSytem(modifs);
        return nada;
    });
    api.defineFunction("cglCoordSystem", 0, (args, modifs) => {
        updateCoordSytem(modifs);
    });
    api.defineFunction("cglViewPos", 0, (args, modifs) => { // TODO? variable instead of function
        // TODO? initialize coordinate-system if not existent
        let viewPos = CindyGL.coordinateSystem.transformedViewPos.slice(0,3);
        return { // convert to CindyJS list
            ctype: 'list',
            value: viewPos.map(toCjsNumber)
        };
    });
    api.defineFunction("cglAxes", 0, (args, modifs) => {
        // TODO? initialize coordinate-system if not existent
        let unitPoints = [
            mvmult4(CindyGL.trafoMatrix,[1,0,0,1]),
            mvmult4(CindyGL.trafoMatrix,[0,1,0,1]),
            mvmult4(CindyGL.trafoMatrix,[0,0,1,1]),
            mvmult4(CindyGL.trafoMatrix,[0,0,0,1]),
        ].map(v=>[v[0]/v[3],v[1]/v[3],v[2]/v[3]]);
        let coordVectors = [
            subv3(unitPoints[0],unitPoints[3]),
            subv3(unitPoints[1],unitPoints[3]),
            subv3(unitPoints[2],unitPoints[3]),
        ];
        return { // convert to CindyJS list
            ctype: 'list',
            value: coordVectors.map(v=>({
                ctype: 'list',
                value: v.map(toCjsNumber)
            }))
        };
    });
    api.defineFunction("rotate3d", 2, (args, modifs) => {
        let alpha = api.evaluateAndVal(args[0])["value"]["real"];
        let beta = api.evaluateAndVal(args[1])["value"]["real"];
        let trafoMatrix;
        if(typeof(CindyGL.trafoMatrix)!== "undefined"){
            trafoMatrix=CindyGL.trafoMatrix;
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
        CindyGL.trafoMatrix=mmult4(rotationMatrix,trafoMatrix);
        CindyGL.invTrafoMatrix=mmult4(CindyGL.invTrafoMatrix,transposeM4(rotationMatrix));
        if(typeof(CindyGL.coordinateSystem)!== "undefined"){
            CindyGL.coordinateSystem.transformedViewPos=
                mvmult4(CindyGL.invTrafoMatrix,CindyGL.coordinateSystem.viewPosition);
            return nada;
        }
        return nada;
    });
    // TODO? directly set zoom or update previous value
    api.defineFunction("zoom3d", 1, (args, modifs) => {
        let zoom = api.evaluateAndVal(args[0])["value"]["real"];
        CindyGL.coordinateSystem.zoom = zoom;
        recomputeProjMatrix();
    });
    // TODO? move position/canvas
    // TODO? combined reset for objects and coord-system
    api.defineFunction("cglResetRotation", 0, (args, modifs) => {
        resetRotation();
        return nada;
    });
    api.defineFunction("cglReset3d", 0, (args, modifs) => {
        CindyGL.objectBuffer={opaque:new Map(),translucent:new Map()};
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
        // TODO? put this line at end of render loops using frame-buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // ensure frame-buffers are detached before clearing canvas
        gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
        if(CindyGL.objectBuffer.translucent.size>0){
            // draw translucent objects without depth testing
            //  needed to correctly display translucent objects behind other transparent objects
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            CindyGL.objectBuffer.translucent.forEach((obj3d)=>{
                render(obj3d.renderer,ll,lr, iw, ih,obj3d.boundingBox,obj3d.plotModifiers, obj3d.canvaswrapper);
                if(obj3d.renderer.opaque){
                    wrongOpacity.add(obj3d);
                }
            });
        }
        gl.disable(gl.BLEND); // no need to blend opaque objects
        gl.enable(gl.DEPTH_TEST);
        CindyGL.objectBuffer.opaque.forEach((obj3d)=>{
            render(obj3d.renderer,ll,lr, iw, ih,obj3d.boundingBox,obj3d.plotModifiers, obj3d.canvaswrapper);
            if(!obj3d.renderer.opaque){
                wrongOpacity.add(obj3d);
            }
        });
        if(CindyGL.objectBuffer.translucent.size>0){
            // reenable blending
            gl.enable(gl.BLEND);
            CindyGL.objectBuffer.translucent.forEach((obj3d)=>{
                render(obj3d.renderer,ll,lr, iw, ih,obj3d.boundingBox,obj3d.plotModifiers, obj3d.canvaswrapper);
                if(obj3d.renderer.opaque){
                    wrongOpacity.add(obj3d);
                }
            });
        }
        if(wrongOpacity.size>0){
            console.log(`changing opacity of ${wrongOpacity.size} objects`);
            // update objects that had the wrong opacity
            wrongOpacity.forEach((obj3d)=>{
                if(obj3d.renderer.opaque){
                    CindyGL.objectBuffer.opaque.delete(obj3d.id);
                }else{
                    CindyGL.objectBuffer.translucent.delete(obj3d.id);
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
     * Returns the current viewDirection for the pixel (args[0],args[1])
     */
    api.defineFunction("cglDirection", 2, (args, modifs) => {
        let x = api.evaluateAndVal(args[0])["value"]["real"];
        let y = api.evaluateAndVal(args[1])["value"]["real"];
        let screenPoint=[x,y,CindyGL.coordinateSystem.z1,1];
        let spacePoint = mvmult4(CindyGL.invTrafoMatrix,screenPoint);
        let viewPos = CindyGL.coordinateSystem.transformedViewPos;
        let direction = subv3(spacePoint,viewPos);
        return { // convert to CindyJS list
            ctype: 'list',
            value: direction.map(toCjsNumber)
        };
    });
    /**
     * Finds the 3D object on the view-ray through the screen position (args[0],args[1]) that is closest to the camera.
     * If the `tags` modifier is set only objects that have at least one of the specified tags are considered
     */
    api.defineFunction("cglFindObject", 2, (args, modifs) => {
        let x = api.evaluateAndVal(args[0])["value"]["real"];
        let y = api.evaluateAndVal(args[1])["value"]["real"];
        // TODO? is this the correct z position
        let screenPoint=[x,y,CindyGL.coordinateSystem.z1,1];
        let tags = get3DPlotTags(modifs);
        let spacePoint = mvmult4(CindyGL.invTrafoMatrix,screenPoint);
        let viewPos = CindyGL.coordinateSystem.transformedViewPos;
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
        CindyGL.objectBuffer.opaque.forEach(searchObject);
        // TODO? parameter to select if translucent objects should be checked
        CindyGL.objectBuffer.translucent.forEach(searchObject);
        // TODO? convert picked 3D-object to CindyJS object
        //   make name,position, readable, ? writable
        return toCjsNumber(pickedId);
    });
    api.defineFunction("cglUpdate", 1, (args, modifs) => {
        let objId = coerce.toInt(api.evaluateAndVal(args[0]),-1);
        if(objId<0)
            return nada;
        let obj3d = CindyGL.objectBuffer.opaque.get(objId);
        let wasOpaque = true;
        if(obj3d === undefined){
            obj3d = CindyGL.objectBuffer.translucent.get(objId);
            wasOpaque = false;
            if(obj3d === undefined){
                console.warn(`could not find object with id ${objId}`);
                return nada;
            }
        }
        let plotModifiers=get3DPlotModifiers(modifs);
        let vModifiers;
        if(obj3d.boundingBox.type == BoundingBoxType.triangles) {
            let vCount = obj3d.boundingBox.vertices.length/3;
            vModifiers = get3DPlotVertexModifiers(modifs,vCount,plotModifiers);
        } else {
            vModifiers = new Map();
        }
        // modifiers changed -> recompile if neccessary
        if(plotModifiers.size > 0 || vModifiers.size > 0) {
            let vModsChanged = vModifiers.size > 0;
            // copy unchanged modifiers
            obj3d.plotModifiers.forEach((value,key)=>{
                if(!plotModifiers.has(key)){
                    plotModifiers.set(key,value);
                }
            });
            if(obj3d.boundingBox.type == BoundingBoxType.triangles) {
                obj3d.boundingBox.vModifiers.forEach((value,key)=>{
                    if(!vModifiers.has(key)) {
                        vModifiers.set(key,value);
                    } else if(value.aName !== undefined) {
                        // copy attribute names (if existent)
                        vModifiers.get(key).aName = value.aName;
                    }
                });
            }
            if(vModsChanged){ // update bounding box
                obj3d.boundingBox = Renderer.boundingTriangles(obj3d.boundingBox.vertices,vModifiers);
            }
            // update modifers types in renderer
            obj3d.renderer = compile(obj3d.renderer.expression,obj3d.renderer.depthType,obj3d.boundingBox,plotModifiers,vModifiers);
        }
        if(obj3d.renderer.opaque !== wasOpaque){
            // opacity changed
            if(wasOpaque) {
                CindyGL.objectBuffer.opaque.delete(objId);
                CindyGL.objectBuffer.translucent.set(objId,obj3d);
            } else {
                CindyGL.objectBuffer.translucent.delete(objId);
                CindyGL.objectBuffer.opaque.set(objId,obj3d);
            }
        }
        obj3d.plotModifiers = plotModifiers;
        return nada;
    });
    // TODO? cglObjectInfo()
    api.defineFunction("cglSpherePos", 1, (args, modifs) => {
        let objId = coerce.toInt(api.evaluateAndVal(args[0]),-1);
        if(objId<0)
            return nada;
        let obj3d = CindyGL.objectBuffer.opaque.get(objId);
        let wasOpaque = true;
        if(obj3d === undefined){
            obj3d = CindyGL.objectBuffer.translucent.get(objId);
            wasOpaque = false;
            if(obj3d === undefined){
                console.warn(`could not find object with id ${objId}`);
                return nada;
            }
        }
        if(obj3d.boundingBox.type !== BoundingBoxType.sphere) {
            console.log(`the object with id ${objId} is no sphere`);
            return nada;
        }
        return { // convert to CindyJS list
            ctype: 'list',
            value: obj3d.boundingBox.center.map(toCjsNumber)
        };
    });
    api.defineFunction("cglMoveSphere", 2, (args, modifs) => {
        let objId = coerce.toInt(api.evaluateAndVal(args[0]),-1);
        if(objId<0)
            return nada;
        let obj3d = CindyGL.objectBuffer.opaque.get(objId);
        let wasOpaque = true;
        if(obj3d === undefined){
            obj3d = CindyGL.objectBuffer.translucent.get(objId);
            wasOpaque = false;
            if(obj3d === undefined){
                console.warn(`could not find object with id ${objId}`);
                return nada;
            }
        }
        if(obj3d.boundingBox.type !== BoundingBoxType.sphere) {
            console.log(`the object with id ${objId} is no sphere`);
            return nada;
        }
        var newCenter = coerce.toDirection(api.evaluateAndVal(args[1]));
        obj3d.boundingBox.center = newCenter;
        // TODO? update modifiers
        return nada;
    });
    api.defineFunction("cglMoveCylinder", 3, (args, modifs) => {
        let objId = coerce.toInt(api.evaluateAndVal(args[0]),-1);
        if(objId<0)
            return nada;
        let obj3d = CindyGL.objectBuffer.opaque.get(objId);
        let wasOpaque = true;
        if(obj3d === undefined){
            obj3d = CindyGL.objectBuffer.translucent.get(objId);
            wasOpaque = false;
            if(obj3d === undefined){
                console.warn(`could not find object with id ${objId}`);
                return nada;
            }
        }
        if(obj3d.boundingBox.type !== BoundingBoxType.cylinder) {
            console.log(`the object with id ${objId} is no cylinder`);
            return nada;
        }
        var newPointA = coerce.toDirection(api.evaluateAndVal(args[1]));
        var newPointB = coerce.toDirection(api.evaluateAndVal(args[2]));
        obj3d.boundingBox.pointA = newPointA;
        obj3d.boundingBox.pointB = newPointB;
        // TODO? update modifiers
        return nada;
    });
    api.defineFunction("cglMoveTriangles", 2, (args, modifs) => {
        let objId = coerce.toInt(api.evaluateAndVal(args[0]),-1);
        if(objId<0)
            return nada;
        let obj3d = CindyGL.objectBuffer.opaque.get(objId);
        let wasOpaque = true;
        if(obj3d === undefined){
            obj3d = CindyGL.objectBuffer.translucent.get(objId);
            wasOpaque = false;
            if(obj3d === undefined){
                console.warn(`could not find object with id ${objId}`);
                return nada;
            }
        }
        if(obj3d.boundingBox.type !== BoundingBoxType.triangles) {
            console.log(`the object with id ${objId} is no triangle-mesh`);
            return nada;
        }
        var vertices = verticesFromCJS(api.evaluateAndVal(args[1]));
        if(vertices === undefined) {
            return nada;
        }
        obj3d.boundingBox.vertices = vertices;
        // TODO? update modifiers
        // TODO ensure number of Vmodifers matches number of vertices
        return nada;
    });
    api.defineFunction("cglEnd3d", 0, (args, modifs) => {
        initGLIfRequired();
        gl.disable(gl.DEPTH_TEST);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        CindyGL.mode3D=false;
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
            expr: cloneExpression(args[1])
        };
    });
    api.defineFunction("cglIsLazy", 1, (args, modifs) => {
        let val = api.evaluate(args[0]);
        return {
            ctype: "boolean",
            value: val['ctype'] === 'cglLazy'
        };
    });

    api.defineFunction("cglDebugPrint", 1, (args, modifs) => {
        console.log(args[0],api.evaluate(args[0]),api.evaluateAndVal(args[0]));
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
            prog.renderer = new Renderer(api, prog,DepthType.Flat,Renderer.noBounds(),new Map());
        }
        prog.renderer.renderXR(viewIndex);

        return nada;
    });
}

// Exports for CindyXR
CindyGL.gl = null;
CindyGL.mode3D = false;
/**@type {{opaque:Map<number,CindyGL3DObject>, translucent:Map<number,CindyGL3DObject>}} */
CindyGL.objectBuffer={opaque:new Map(),translucent:new Map()};
// initialize with dummy values to make type-resolving easier
CindyGL.coordinateSystem = {
    x0:0 , x1: 0, y0: 0, y1: 0,  z0: 0, z1:0, zoom: 1,
    viewPosition: [0,0,0,0], transformedViewPos: [0,0,0,0]
};
CindyGL.generateCanvasWrapperIfRequired = generateCanvasWrapperIfRequired;
CindyGL.initGLIfRequired = initGLIfRequired;
CindyJS.registerPlugin(1, "CindyGL", CindyGL);
