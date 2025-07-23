function mmult4(A,B){
  // TODO better algorithm, ? use cindyscript matrix multiplication built-in
  // ? use matrix operations built-into Cindy3D
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

// try evaluating expr, return nada if evaluation fails
// silences all errors& warnings that occur during evaluation
function tryEvaluate(expr,api,def) {
    let value = def;
    const oldLog = console.log;
    try{
        // this is evil:
        //  redefine console.log to silence error messages during `api.evaluate` call
        console.log = function() {};
        value = api.evaluate(expr);
    } catch (ignored) {
        // if evaluation failed use result as expression
    } finally {
        // restore console.log to previous value
        console.log = oldLog;
    }
    return value;
}

/**
 * @param {Renderer} renderer rendering program
 * @param { { type: BoundingBoxType } } boundingBox bounding box of rendered object in 3D space
 * @param {Map<string,*>} plotModifiers
 * @param { Set<string> } tags tags assigned to this Object
 * @constructor
 */
function CindyGL3DObject(renderer,boundingBox,plotModifiers,tags) {
    /**@type {number} */
    this.id = CindyGL3DObject.NEXT_ID++;
    this.renderer = renderer;
    this.boundingBox = boundingBox;
    this.plotModifiers = plotModifiers;
    this.tags = tags;
    this.visible = true;
}
CindyGL3DObject.NEXT_ID=0;

let cglLogLevel = 3;
function cglLogError(...args){
    if(cglLogLevel<0)return;
    console.error(...args);
}
function cglLogWarning(...args){
    if(cglLogLevel<1)return;
    console.warn(...args);
}
function cglLogInfo(...args){
    if(cglLogLevel<2)return;
    console.info(...args);
}
function cglLogDebug(...args){
    if(cglLogLevel<3)return;
    console.debug(...args);
}

function getZoomedViewPlane(){
    // x0 = (x0+x1)/2 + (x0-x1)/2
    // x0' = (x0+x1)/2 + zoom*(x0-x1)/2 = 0.5*(x0*(1+zoom)+x1*(1-zoom))
    let zoom = CindyGL.coordinateSystem.zoom;
    let x0=CindyGL.coordinateSystem.x0;
    let x1=CindyGL.coordinateSystem.x1;
    let y0=CindyGL.coordinateSystem.y0;
    let y1=CindyGL.coordinateSystem.y1;
    let z0=CindyGL.coordinateSystem.z0;
    let z1=CindyGL.coordinateSystem.z1;
    return [0.5*(x0*(1+zoom)+x1*(1-zoom)),0.5*(y0*(1+zoom)+y1*(1-zoom)),
            0.5*(x1*(1+zoom)+x0*(1-zoom)),0.5*(y1*(1+zoom)+y0*(1-zoom)),
            zoom*(z0-z1)+z1,z1];
}

let CindyGL = function(api) {

    //////////////////////////////////////////////////////////////////////
    // API bindings
    nada = api.nada;

    //myfunctions = api.getMyfunctions();

    api.defineFunction("compile", 1, (args, modifs) => {
        let expr = args[0];
        let cb = new CodeBuilder(api);
        let plotModifiers = get3DPlotModifiers(modifs);
        let code = cb.generateColorPlotProgram(expr,plotModifiers,false);
        cglLogDebug(code);
        return {
            ctype: 'string',
            value: code
        };
        //console.log(myfunctions);
    });

    api.defineFunction("use8bittextures", 0, (args, modifs) => {
        use8bittextures = true;
        can_use_texture_float = can_use_texture_half_float = false;
        cglLogInfo("Switching to 8-bit textures mode.");
        return api.nada;
    });

    /**
     * argument canvaswrapper is optional. If it is not given, it will render on glcanvas
     */
    function compileAndRender(prog,a, b, width, height,boundingBox, canvaswrapper) {
        let renderer=compile(prog,boundingBox,new Map(),new Map(),false);
        renderer.render2d(a, b, width, height, boundingBox, new Map(), canvaswrapper);
        if (canvaswrapper)
            canvaswrapper.generation = Math.max(canvaswrapper.generation, canvaswrapper.canvas.generation + 1);
    }
    /**
     * @param {CindyJS.anyval} prog
     * @param {boundingBox} boundingBox
     * @param {Map<string,*>} plotModifiers values of plot-modifier arguments
     * @param {Map<string,{values:Array<*>,eltType:type}>} vModifiers vertex modifiers
     * @param {boolean} mode3D
     * @returns {Renderer}
     */
    function compile(prog,boundingBox,plotModifiers,vModifiers,mode3D) {
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
                const value = modifierTypes.get(key);
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
                        cglLogDebug(`changed type of modifier ${key} to ${typeToString(commonType)}`);
                    }
                    mergedTypes.get(key).type = commonType;
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
            cglLogDebug("create new Renderer for modifiers: ",modifierTypes);
            renderer = new Renderer(api, prog, boundingBox, modifierTypes,mode3D);
            prog.renderers.push(renderer);
            // TODO? sort renderes by number of instances
            modifierTypes.forEach((value,key)=>{
                if(!value.used){
                    cglLogInfo(`modifier ${key} is never used`)
                }
            });
        }
        return renderer;
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

    /**
     * @param {CindyJS.anyval} paramArg
     * @returns {Array<CindyJS.anyval>}
     *  */
    function cglLazyParams(paramArg){
        if(paramArg['ctype'] === "list") {
            return paramArg['value'];
        } else if(paramArg['ctype'] === "function" && paramArg['oper'] === "genList"){
            return paramArg['args'];
        } else {
            return [paramArg];
        }
    }
    let cglEvalCallCount=0;
    /** replace all occurences of names in argValues in the given expression with their corresponding value
        @param {Map<string,CindyJS.anyval>} argValues
    */
    function replaceVariables(expr,argValues){
        if(expr['ctype'] === 'variable') {
            const name = expr['name'];
            // TODO? are there any unhandled cases of variable shadowing
            if(argValues.has(name))
                return argValues.get(name);
            // name not matched
            return expr;
        } else if(expr['ctype'] === 'field') {
            // create copy of expression
            let newExpr = Object.assign({}, expr);
            // do not replace key for field
            newExpr['obj'] = replaceVariables(expr['obj'],argValues);
            return newExpr;
        } else if(expr['ctype'] === 'userdata') {
            // create copy of expression
            let newExpr = Object.assign({}, expr);
            newExpr['key'] = replaceVariables(expr['key'],argValues);
            newExpr['obj'] = replaceVariables(expr['obj'],argValues);
            return newExpr;
        } else if(expr.hasOwnProperty('args')) {
            let newArgs;
            if(expr['ctype'] === 'function' && ["repeat$2", "forall$2", "apply$2", "sum$2", "product$2"].includes(expr['oper'])) {
                // treat loop-body as seperate scope
                let argValues2 = /** @type {Map<string,CindyJS.anyval>}*/ (new Map(argValues));
                argValues2.delete("#");
                newArgs = [replaceVariables(expr['args'][0],argValues),replaceVariables(expr['args'][1],argValues2)];
            } else if(expr['ctype'] === 'function' && ["repeat$3", "forall$3", "apply$3", "sum$3", "product$3"].includes(expr['oper'])) {
                const itrName = expr['args'][1]['name'];
                // treat loop-body as seperate scope
                let argValues2 = /** @type {Map<string,CindyJS.anyval>}*/ (new Map(argValues));
                argValues2.delete(itrName);
                newArgs = [replaceVariables(expr['args'][0],argValues),expr['args'][1],replaceVariables(expr['args'][2],argValues2)];
            } else if(expr['ctype'] === 'function' && expr['oper'] === "cgllazy$2") {
                const params = cglLazyParams(expr['args'][0]);
                // seperate scope within body -> create copy of argValues
                let argValues2 = /** @type {Map<string,CindyJS.anyval>}*/ (new Map(argValues));
                params.forEach(v=>{
                    argValues2.delete(v['name']);
                });
                newArgs = [replaceVariables(expr['args'][0],argValues),replaceVariables(expr['args'][1],argValues2)];
            } else if(expr['oper'] === "=" && argValues.has(expr['args'][0]['name'])) {
                let argVal = argValues.get(expr['args'][0]['name']);
                if(argVal['name'] && argVal['name'].includes("_")) {
                    // regional variable
                    newArgs = expr['args'].map((oldArg)=>replaceVariables(oldArg,argValues));
                } else {
                    // TODO? how to handle (conditional) assignment to cgl-lazy parameter
                    cglLogError(`assignemnt to cglLazy parameter "${expr['args'][0]['name']}" is not supported`);
                }
            } else if(expr['oper'] === ":=") {
                const lhs = expr['args'][0];
                const rhs = expr['args'][1];
                const params = lhs['args'] === undefined ? [] : lhs['args'];
                // seperate scope for function body
                let argValues2 = /** @type {Map<string,CindyJS.anyval>}*/ (new Map(argValues));
                params.forEach(v=>{
                    argValues2.delete(v['name']);
                });
                newArgs = [lhs,replaceVariables(rhs,argValues2)];
            } else if(expr['ctype'] === 'function' && getPlainName(expr['oper']) === "regional") {
                newArgs = expr['args'].map(v=>{
                    let renamed = Object.assign({}, v);
                    // regional variables in api.evaluate leak into enclosing scope
                    // -> set name to invalid identifier to ensure variable stays within eval-block
                    renamed['name']=`${cglEvalCallCount}_${v['name']}`;
                    argValues.set(v['name'],renamed); // regional shaddows argument
                    return renamed;
                });
            } else {
                newArgs = expr['args'].map((oldArg)=>replaceVariables(oldArg,argValues));
            }
            // create copy of expression
            let newExpr = Object.assign({}, expr);
            newExpr['args'] = newArgs;
            if(expr['modifs'] !== undefined) {
                let newMods = {};
                Object.entries(expr['modifs']).forEach(([key,oldMod])=>{
                    newMods[key]=replaceVariables(oldMod,argValues);
                });
                newExpr['modifs'] = newMods;
            }
            return newExpr;
        }
        // TODO is this enough to replace all lazy params
        return expr;
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

        compileAndRender(prog,computeLowerLeftCorner(api), computeLowerRightCorner(api), iw, ih,Renderer.noBounds(),null);
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

        compileAndRender(prog,ll, lr, iw * fx, ih * fy,Renderer.noBounds(), null);
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
        compileAndRender(prog, a, b, cw, ch,Renderer.noBounds(), canvaswrapper);

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
        compileAndRender(prog, a, b, cw, ch, Renderer.noBounds() ,canvaswrapper);


        return nada;
    });

    function readModifierList(modValue,modName,modifiers,addModifier) {
        let modList;
        if(modValue["ctype"] === "list") {
            modList = modValue['value'];
            modList = modList.map(v => {
                if(v['ctype'] !== 'list' || v['value'].length != 2) {
                    cglLogError("unexpected entry in modifier list expected [key,value] got: ",v);
                    return [undefined,undefined];
                }
                let key = v["value"][0];
                if(key['ctype'] !== "string") {
                    cglLogError("unexpected key for modifier list expected string got: ",key);
                    return;
                }
                key = key['value'];
                return [key,v["value"][1]];
            });
        } else if(modValue["ctype"] === "JSON") {
            modList = Object.entries(modValue['value']);
        } else {
            cglLogError(`unexpected value for '${modName}' expected list or dict got: `,modValue);
            modList=[];
        }
        modList.forEach(([key,value])=>{
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
                cglLogWarning("modifier is shadowed by built-in: "+modName);
            }
            modifiers.set(modName,modValue);
        }
        if(callModifiers.hasOwnProperty("plotModifiers")){
            modifiers=readModifierList(api.evaluate(callModifiers["plotModifiers"]),"plotModifiers",modifiers,addUmodifier);
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
                cglLogWarning("vertex modifer is shadowed by uniform modifier: "+modName);
                return;
            }
            if(CodeBuilder.builtIns.has(modName)){
                cglLogWarning("modifer is shadowed by built-in: "+modName);
            }
            let valList = coerce.toList(modValue,[]);
            if(valList.length != vCount){
                cglLogError(`vertex modifier should be list with one element for each vertex: ${modName}`);
                cglLogError(`expected: ${vCount} got: ${valList.length}`);
                return;
            }
            // compute common element type
            let eltType = valList.map(guessTypeOfValue).reduce(lca);
            // promote int to float to allow interpolation
            eltType = replaceIntbyFloat(eltType);
            modifiers.set(modName,{values: valList,eltType: eltType});
        }
        if(callModifiers.hasOwnProperty("vModifiers")){
            modifiers=readModifierList(api.evaluate(callModifiers["vModifiers"]),"vModifiers",modifiers,addVmodifier);
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
        let isOpaque = obj3d.opaque !== undefined ? obj3d.opaque : obj3d.renderer.opaque;
        if(isOpaque) {
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
            cglLogWarning(`not enough elements for point ${name} expected 2 got ${val.length}`);
            return val.length > 0 ? [val[0],val[0]] : defValue;
        } else if(val.length > 2) {
            cglLogWarning("point has to many components, truncating");
            return val.slice(0,2);
        }
        return val;
    }

    // TODO? currently the opacity is only updated when a modifier changes
    // ? detect expressions that depend on global variables and update the opacity of those objects every frame
    function computeOpacity(obj3d,api){
        let expr = obj3d.opaqueIfExpr;
        if(expr === undefined) {
            delete obj3d.opaque;
            return;
        }
        expr = tryEvaluate(expr,api,expr);
        if(expr['ctype']==='cglLazy'){
            if(expr.params.length>0) {
                cglLogWarning("opacity expression should not have any parameters");
            }
            expr = expr.expr;
        } else {
            expr = obj3d.opaqueIfExpr;
        }
        expr = replaceVariables(expr,obj3d.plotModifiers);
        const value = tryEvaluate(expr,api,nada);
        // TODO? allow non-boolean expressions
        if(value['ctype']!=='boolean'){
            delete obj3d.opaque;
            return;
        }
        obj3d.opaque = value['value'];
    }
    /**
     * plots colorplot on whole main canvas in CindyJS coordinates
     * uses the z-coordinate for the nearest pixel as depth information
     */
    api.defineFunction("colorplot3d", 1, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        let plotModifiers=get3DPlotModifiers(modifs);
        let compiledProg=compile(prog,Renderer.noBounds(),plotModifiers,new Map(),true);
        let obj3d=new CindyGL3DObject(compiledProg,Renderer.noBounds(),plotModifiers,get3DPlotTags(modifs));
        if(modifs.hasOwnProperty('opaqueIf')) {
            obj3d.opaqueIfExpr = tryEvaluate(modifs['opaqueIf'],api,modifs['opaqueIf']);
            computeOpacity(obj3d,api);
        }
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
                    cglLogWarning(`${contentType} should be lists of length 3`);
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
                        cglLogWarning("vertices should be lists of length 3");
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
                cglLogError("the number of coordinates should be divisible by 3");
            }else if(vertices.length % 9 !== 0){
                cglLogError("the number of vertices should be divisible by 3");
            }
        } else {
            cglLogError(`unexpected type for vertex-coordinate: ${eltType}`);
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
            cglLogWarning("invalid vertex data",args[1]);
            return nada;
        }
        let vCount = vertices.length/3;
        if(vCount < 3) {
            cglLogWarning("not enough vertices for triangle");
            return nada; // not enough vertices
        }
        let vModifiers = get3DPlotVertexModifiers(modifs,vCount,plotModifiers);
        let boundingBox=Renderer.boundingTriangles(vertices,vModifiers);
        let compiledProg=compile(prog,boundingBox,plotModifiers,vModifiers,true);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs));
        if(modifs.hasOwnProperty('opaqueIf')) {
            obj3d.opaqueIfExpr = tryEvaluate(modifs['opaqueIf'],api,modifs['opaqueIf']);
            computeOpacity(obj3d,api);
        }
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
    });
    /**
     * plots colorplot in region bounded by sphere
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
        let compiledProg=compile(prog,boundingBox,plotModifiers,new Map(),true);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs));
        if(modifs.hasOwnProperty('opaqueIf')) {
            obj3d.opaqueIfExpr = tryEvaluate(modifs['opaqueIf'],api,modifs['opaqueIf']);
            computeOpacity(obj3d,api);
        }
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
    });
    /**
     * plots colorplot in region bounded by cylinder
     * uses the z-coordinate for the nearest pixel as depth information
     * args:  <expr> <pointA> <pointB> <radius>
     */
    // TODO? change cylinder parameters to center+direction?
    api.defineFunction("colorplot3d", 4, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        let plotModifiers=get3DPlotModifiers(modifs);
        var pointA = coerce.toDirection(api.evaluateAndVal(args[1]));
        var pointB = coerce.toDirection(api.evaluateAndVal(args[2]));
        var radius = api.evaluateAndVal(args[3])["value"]["real"];
        var overhang = 0;
        if (modifs.hasOwnProperty("overhang")) {
            overhang = api.evaluateAndVal(modifs["overhang"])["value"]["real"];
        }
        let boundingBox=Renderer.boundingCylinder(scalev3(0.5,addv3(pointA,pointB)),scalev3(0.5,subv3(pointB,pointA)),radius,overhang);
        let compiledProg=compile(prog,boundingBox,plotModifiers,new Map(),true);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs));
        if(modifs.hasOwnProperty('opaqueIf')) {
            obj3d.opaqueIfExpr = tryEvaluate(modifs['opaqueIf'],api,modifs['opaqueIf']);
            computeOpacity(obj3d,api);
        }
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
    });
    /**
     * plots colorplot in region bounded by cuboid
     * uses the z-coordinate for the nearest pixel as depth information
     * args:  <expr> <center> <v1> <v2> <v3>
     */
    api.defineFunction("colorplot3d", 5, (args, modifs) => {
        initGLIfRequired();
        var prog = args[0];
        let plotModifiers=get3DPlotModifiers(modifs);
        var center = coerce.toDirection(api.evaluateAndVal(args[1]));
        var v1 = coerce.toDirection(api.evaluateAndVal(args[2]));
        var v2 = coerce.toDirection(api.evaluateAndVal(args[3]));
        var v3 = coerce.toDirection(api.evaluateAndVal(args[4]));
        let boundingBox=Renderer.boundingCuboid(center,v1,v2,v3);
        let compiledProg=compile(prog,boundingBox,plotModifiers,new Map(),true);
        let obj3d=new CindyGL3DObject(compiledProg,boundingBox,plotModifiers,get3DPlotTags(modifs));
        if(modifs.hasOwnProperty('opaqueIf')) {
            obj3d.opaqueIfExpr = tryEvaluate(modifs['opaqueIf'],api,modifs['opaqueIf']);
            computeOpacity(obj3d,api);
        }
        setObject(obj3d.id,obj3d);
        return toCjsNumber(obj3d.id);
    });
    let recomputeProjMatrix = function(){
        let [x0,y0,x1,y1,z0,z1] = getZoomedViewPlane();
        // TODO this will break if z0 is near 0
        CindyGL.projectionMatrix=[
            [2/(x1-x0), 0, 0, - 2*x0/(x1-x0) -1],
            [0, 2/(y1-y0), 0, - 2*y0/(y1-y0) -1],
            [0, 0, 1/(z1-z0), - z0/(z1-z0) -1],
            [0, 0, -1/z0, 1]
        ];
        CindyGL.coordinateSystem.viewPosition = [(x0+x1)/2,(y0+y1)/2,z0,1];
        CindyGL.coordinateSystem.transformedViewNormal = mvmult4(CindyGL.invTrafoMatrix,[0,0,(z1-z0),1]);
        CindyGL.coordinateSystem.transformedViewPos =
            mvmult4(CindyGL.invTrafoMatrix,CindyGL.coordinateSystem.viewPosition);
    };
    let resetRotation = function(){
        CindyGL.trafoMatrix = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];// TODO? switch to Cindy3D matrix operations instead of writing library from scratch
        CindyGL.invTrafoMatrix = [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
        CindyGL.coordinateSystem.transformedViewPos = CindyGL.coordinateSystem.viewPosition;
        let [x0,y0,x1,y1,z0,z1] = getZoomedViewPlane();
        CindyGL.coordinateSystem.transformedViewNormal = [0,0,(z1-z0),1];
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
    resetRotation();
    updateCoordSytem({});
    api.defineFunction("cglCoordSystem", 0, (args, modifs) => {
        updateCoordSytem(modifs);
    });
    api.defineFunction("cglViewPos", 0, (args, modifs) => {
        let viewPos = CindyGL.coordinateSystem.transformedViewPos.slice(0,3);
        return { // convert to CindyJS list
            ctype: 'list',
            value: viewPos.map(toCjsNumber)
        };
    });
    api.defineFunction("cglViewRect", 0, (args, modifs) => {
        let [x0,y0,x1,y1,z0,z1] = getZoomedViewPlane();
        return { // convert to CindyJS list
            ctype: 'list',
            value: [x0,y0,x1,y1].map(toCjsNumber)
        };
    });
    api.defineFunction("cglAxes", 0, (args, modifs) => {
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
        // TODO? rotate relative to center of view-rect
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
            CindyGL.coordinateSystem.transformedViewPos =
                mvmult4(CindyGL.invTrafoMatrix,CindyGL.coordinateSystem.viewPosition);
            let [x0,y0,x1,y1,z0,z1] = getZoomedViewPlane();
            CindyGL.coordinateSystem.transformedViewNormal =
                mvmult4(CindyGL.invTrafoMatrix,[0,0,(z1-z0),1]);
            return nada;
        }
        return nada;
    });
    // TODO? directly set zoom or update relative to previous value
    api.defineFunction("zoom3d", 1, (args, modifs) => {
        let zoom = api.evaluateAndVal(args[0])["value"]["real"];
        CindyGL.coordinateSystem.zoom = zoom;
        recomputeProjMatrix();
    });
    // TODO? function to move view-position/canvas
    // TODO? combined reset for objects and coord-system
    api.defineFunction("cglResetRotation", 0, (args, modifs) => {
        resetRotation();
        return nada;
    });
    api.defineFunction("cglReset3d", 0, (args, modifs) => {
        CindyGL.objectBuffer = {
            opaque:new Map(),
            translucent:new Map(),
            callbacks:{
                preRender:[]
            }
        };
        return nada;
    });
    api.defineFunction("cglEvalOnRender", 1, (args, modifs) => {
        createCglEval(0);
        // TODO? return a callback id, that can be removed later
        CindyGL.objectBuffer.callbacks.preRender.push(wrapLazy(args[0],[],true));
        return nada;
    });
    // TODO? automatic update of coordinate system to match render region of screen
    // ?  no auto-update if coordinates have to been explicitly set
    // ? allow store/restore of coordinate system
    // ? support rotated coordinate-plane
    // move image information to render function:
    // ? cglRender3d(ll,lr,name) -> render to image at screen pos ll,lr (always update coordinates)
    api.defineFunction("cglRender3d", 0, (args, modifs) => {
        // internal measures. might be multiple of api.instance['canvas']['clientWidth'] on HiDPI-Displays
        let iw = api.instance['canvas']['width'];
        let ih = api.instance['canvas']['height'];
        render3d(0,0,iw,ih,iw,ih,null,modifs);
        return nada;
    });
    api.defineFunction("cglRender3d", 2, (args, modifs) => {
        var a = api.extractPoint(api.evaluateAndVal(args[0]));
        var b = api.extractPoint(api.evaluateAndVal(args[1]));

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

        var xx = iw * (ul.x - cul.x) / (clr.x - cul.x);
        var yy = ih * (ul.y - cul.y) / (clr.y - cul.y);
        render3d(xx, yy, iw*fx, ih*fy, iw*fx, ih*fy, null, modifs);
        return nada;
    });
    api.defineFunction("cglRender3d", 1, (args, modifs) => {
        initGLIfRequired();
        var name = api.evaluateAndVal(args[0]);
        if (name.ctype !== 'string') {
            return nada;
        }
        let imageobject = api.getImage(name['value'], true);
        //let canvaswrapper = generateWriteCanvasWrapperIfRequired(imageobject, api);
        let canvaswrapper = generateCanvasWrapperIfRequired(imageobject, api, false);
        var cw = imageobject.width;
        var ch = imageobject.height;
        render3d(0, 0, cw, ch, cw, ch, canvaswrapper, modifs);
        return nada;
    });
    function render3d(x0,y0,x1,y1,iw,ih,canvaswrapper,modifs){
        initGLIfRequired();
        let layerCount = getRealModifier(modifs,"layers",CindyGL.objectBuffer.translucent.size<2 ? 0 : 2);
        Renderer.resetCachedState();
        gl.clear(gl.DEPTH_BUFFER_BIT|gl.COLOR_BUFFER_BIT);
        CindyGL.objectBuffer.callbacks.preRender.forEach((func)=>{
            cglEvalImpl(func,[],{});
        });
        const sceneRenderer = (layerCount == 0) ?
            new Cgl3dSimpleSceneRenderer(iw,ih,canvaswrapper) :
            new Cgl3dLayeredSceneRenderer(iw,ih,canvaswrapper,layerCount);
        // ? split mesh into seperate layers depending on view direction
        CindyGL.objectBuffer.translucent.forEach((obj3d)=>{
            // sort triangles by depth
            if(obj3d.boundingBox.type!=BoundingBoxType.triangles) return;
            /**@type{Array<number>} */
            const vertices = obj3d.boundingBox.vertices;
            const triangleCount = vertices.length/9;
            const viewNormal = CindyGL.coordinateSystem.transformedViewNormal;
            // create an array of indices
            const indices = Array.from({ length: triangleCount }, (_, index) => index);
            // sort indices by distance of triangle midpoints from view-plane
            indices.sort((i1,i2)=>{
                const m1x = (vertices[9*i1]+vertices[9*i1+3]+vertices[9*i1+6])/3;
                const m1y = (vertices[9*i1+1]+vertices[9*i1+4]+vertices[9*i1+7])/3;
                const m1z = (vertices[9*i1+2]+vertices[9*i1+5]+vertices[9*i1+8])/3;
                const m2x = (vertices[9*i2]+vertices[9*i2+3]+vertices[9*i2+6])/3;
                const m2y = (vertices[9*i2+1]+vertices[9*i2+4]+vertices[9*i2+7])/3;
                const m2z = (vertices[9*i2+2]+vertices[9*i2+5]+vertices[9*i2+8])/3;
                const d1 = dot3([m1x,m1y,m1z],viewNormal);
                const d2 = dot3([m2x,m2y,m2z],viewNormal);
                return (d1 < d2) - (d2 < d1);
            });
            obj3d.boundingBox.vertices = vertices.map((_,index)=>{
                const triIndex =  Math.floor(index/9);
                const coordIndex = index%9;
                return vertices[9*indices[triIndex]+coordIndex];
            });
            obj3d.boundingBox.vModifiers.forEach((vMod)=>{
                vMod.values = vMod.values.map((_,index)=>{
                    const triIndex = Math.floor(index/3);
                    const vIndex = index%3;
                    return vMod.values[3*indices[triIndex]+vIndex];
                });
                vMod.aData = undefined; // remove cached attribute data
            });
        });
        sceneRenderer.renderOpaque(CindyGL.objectBuffer.opaque);
        // TODO? split cleanup& rendering of translucent objects
        sceneRenderer.renderTranslucent(CindyGL.objectBuffer.translucent);
        // TODO? extract to function on sceneRenderer
        let wrongOpacity = sceneRenderer.wrongOpacity;
        if(wrongOpacity.size>0){
            cglLogDebug(`changing opacity of ${wrongOpacity.size} objects`);
            // update objects that had the wrong opacity
            wrongOpacity.forEach((obj3d)=>{
                let isOpaque = obj3d.opaque !== undefined ? obj3d.opaque : obj3d.renderer.opaque;
                if(isOpaque){
                    CindyGL.objectBuffer.translucent.delete(obj3d.id);
                }else{
                    CindyGL.objectBuffer.opaque.delete(obj3d.id);
                }
                setObject(obj3d.id,obj3d);
            });
        }
        if(canvaswrapper!=null) {
          gl.flush(); //renders stuff to canvaswrapper
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          canvaswrapper.swap(); // swap textures after rendering
          return;
        }
        //  finish rendering
        let csctx = api.instance['canvas'].getContext('2d');
        csctx.save();
        csctx.setTransform(1, 0, 0, 1, 0, 0);
        csctx.drawImage(glcanvas, 0, 0, iw, ih, x0, y0, x1, y1);
        csctx.restore();
    };
    /**
     * Returns the current viewDirection for the pixel (args[0],args[1])
     */
    api.defineFunction("cglDirection", 2, (args, modifs) => {
        // FIXME use correct coord-system for x,y position
        let zoom = CindyGL.coordinateSystem.zoom;
        let x = zoom*api.evaluateAndVal(args[0])["value"]["real"];
        let y = zoom*api.evaluateAndVal(args[1])["value"]["real"];
        let screenPoint=[x,y,zoom*CindyGL.coordinateSystem.z1,1];
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
        // FIXME use correct coord-system for x,y position
        let zoom = CindyGL.coordinateSystem.zoom;
        let x = zoom*api.evaluateAndVal(args[0])["value"]["real"];
        let y = zoom*api.evaluateAndVal(args[1])["value"]["real"];
        // TODO? is this the correct z position
        let screenPoint=[x,y,zoom*CindyGL.coordinateSystem.z1,1];
        let tags = get3DPlotTags(modifs);
        let spacePoint = mvmult4(CindyGL.invTrafoMatrix,screenPoint);
        let viewPos = CindyGL.coordinateSystem.transformedViewPos;
        let direction = subv3(spacePoint,viewPos);
        let minDst = Infinity;
        let pickedId = -1;
        let searchObject = (obj3d)=>{
            // TODO use Set.intersection once suppported
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
            if(obj3d.boundingBox.type == BoundingBoxType.sphere) {
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
                if (dst>=0 && dst<=minDst) {
                    minDst = dst;
                    pickedId = obj3d.id;
                }
            } else if(obj3d.boundingBox.type == BoundingBoxType.cylinder) {
                let radius = obj3d.boundingBox.radius;
                let center = obj3d.boundingBox.center;
                let orientation = obj3d.boundingBox.direction;
                let direction0 = scalev3(1/Math.sqrt(dot3(direction,direction)),direction);
                let p1 = subv3(viewPos,center);
                let w = Math.sqrt(dot3(p1,p1));
                let W = addv3(viewPos,scalev3(w,direction0));
                let BA = orientation; // scaled by 2
                let U = scalev3(1/dot3(BA,BA),BA);
                let VA = subv3(W,center);
                let S = subv3(VA,scalev3(dot3(VA,BA),U));
                let T = subv3(direction0,scalev3(dot3(direction0,BA),U));
                let a = dot3(T,T);
                let b = dot3(S,T);
                let c = dot3(S,S) -radius*radius;
                let D= b*b-a*c;
                if(D<0){ return; } // ray does not hit cylinder
                let l1 = -(b + Math.sqrt(D))/a;
                let dst = w+l1;
                let v1 = subv3(addv3(W,scalev3(l1,direction0)),center);
                let delta = dot3(v1,U);
                if ( delta < -1 || delta > 1 ) {
                    let l2 = -(b - Math.sqrt(D))/a;
                    dst = w+l2;
                    let v2 = subv3(addv3(W,scalev3(l2,direction0)),center);
                    delta = dot3(v2,U);
                    if ( delta < -1 || delta > 1 ) {
                        return;
                    }
                }
                if (dst>=0 && dst<=minDst) {
                    minDst = dst;
                    pickedId = obj3d.id;
                }
            }
            // TODO? checks different bouning box types
            // TODO? make pixel depth dependent on actual shader code
        };
        CindyGL.objectBuffer.opaque.forEach(searchObject);
        // TODO? parameter to select if translucent objects should be checked
        CindyGL.objectBuffer.translucent.forEach(searchObject);
        // TODO? convert picked 3D-object to CindyJS object
        // TODO? add a way to group objects
        //   make name,position, readable, ? writable
        return toCjsNumber(pickedId);
    });
    function objectsById(idVal) {
        idVal = api.evaluateAndVal(idVal);
        let ids;
        if(idVal['ctype'] === 'number') {
            let objId = coerce.toInt(idVal,-1);
            if(objId<0)
                return [];
            ids = [objId];
        } else if(idVal['ctype'] === 'list') {
            ids = idVal['value'].map(id=>coerce.toInt(id,-1)).filter(id=>id>=0);
        }
        return ids.map(objId=>{
            let obj3d = CindyGL.objectBuffer.opaque.get(objId);
            let wasOpaque = true;
            if(obj3d === undefined){
                obj3d = CindyGL.objectBuffer.translucent.get(objId);
                wasOpaque = false;
                if(obj3d === undefined){
                    cglLogWarning(`could not find object with id ${objId}`);
                    return null;
                }
            }
            return [obj3d,objId,wasOpaque];
        }).filter(val=>val!==null);
    }
    // change bounding box
    api.defineFunction("cglUpdateBounds",1, (args, modifs) => {
        return objectsById(args[0]).map(([obj3d,objId,_])=>{
            obj3d.boundingBox = Renderer.noBounds();
            return toCjsNumber(objId);
        });
    });
    api.defineFunction("cglUpdateBounds",2, (args, modifs) => {
        return objectsById(args[0]).map(([obj3d,objId,_])=>{
            let vertices = verticesFromCJS(api.evaluateAndVal(args[1]));
            if(vertices === undefined) {
                cglLogWarning("invalid vertex data",args[1]);
                return nada;
            }
            let vCount = vertices.length/3;
            if(vCount < 3) {
                cglLogWarning("not enough vertices for triangle");
                return nada; // not enough vertices
            }
            let vModifiers = get3DPlotVertexModifiers(modifs,vCount,obj3d.plotModifiers);
            obj3d.boundingBox = Renderer.boundingTriangles(vertices,vModifiers);
            return toCjsNumber(objId);
        });
    });
    api.defineFunction("cglUpdateBounds",3, (args, modifs) => {
        return objectsById(args[0]).map(([obj3d,objId,_])=>{
            var center = coerce.toDirection(api.evaluateAndVal(args[1]));
            var radius = api.evaluateAndVal(args[2])["value"]["real"];
            obj3d.boundingBox=Renderer.boundingSphere(center,radius);
            return toCjsNumber(objId);
        });
    });
    api.defineFunction("cglUpdateBounds",4, (args, modifs) => {
        return objectsById(args[0]).map(([obj3d,objId,_])=>{
            var pointA = coerce.toDirection(api.evaluateAndVal(args[1]));
            var pointB = coerce.toDirection(api.evaluateAndVal(args[2]));
            var radius = api.evaluateAndVal(args[3])["value"]["real"];
            var overhang = 0;
            if (modifs.hasOwnProperty("overhang")) {
                overhang = modifs["overhang"]["value"]["real"];
            } else if (obj3d.boundingBox.boxLengthScale !== undefined) {
                // compute overhang from old length
                let oldLength = Math.sqrt(dot3(obj3d.boundingBox.direction,obj3d.boundingBox.direction));
                overhang = (obj3d.boundingBox.boxLengthScale*oldLength)-oldLength;
            }
            obj3d.boundingBox = Renderer.boundingCylinder(scalev3(0.5,addv3(pointA,pointB)),scalev3(0.5,subv3(pointB,pointA)),radius,overhang);
            return toCjsNumber(objId);
        });
    });
    api.defineFunction("cglUpdateBounds",5, (args, modifs) => {
        return objectsById(args[0]).map(([obj3d,objId,_])=>{
            var center = coerce.toDirection(api.evaluateAndVal(args[1]));
            var v1 = coerce.toDirection(api.evaluateAndVal(args[2]));
            var v2 = coerce.toDirection(api.evaluateAndVal(args[3]));
            var v3 = coerce.toDirection(api.evaluateAndVal(args[4]));
            obj3d.boundingBox=Renderer.boundingCuboid(center,v1,v2,v3);
            return toCjsNumber(objId);
        });
    });
    api.defineFunction("cglUpdate", 1, (args, modifs) => {
        return objectsById(args[0]).map(([obj3d,objId,wasOpaque])=>{
            let plotModifiers=get3DPlotModifiers(modifs);
            let vModifiers;
            if(obj3d.boundingBox.type == BoundingBoxType.triangles) {
                let vCount = obj3d.boundingBox.vertices.length/3;
                vModifiers = get3DPlotVertexModifiers(modifs,vCount,plotModifiers);
            } else {
                vModifiers = new Map();
            }
            if(plotModifiers.size == 0 && vModifiers.size == 0) {
                return toCjsNumber(objId); // no changes -> no need to update
            }
            // modifiers changed -> recompile if neccessary
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
            obj3d.renderer = compile(obj3d.renderer.expression,obj3d.boundingBox,plotModifiers,vModifiers,true);
            let isOpaque = obj3d.opaque !== undefined ? obj3d.opaque : obj3d.renderer.opaque;
            if(isOpaque !== wasOpaque){
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
            if(modifs.hasOwnProperty('opaqueIf')) {
                obj3d.opaqueIfExpr = tryEvaluate(modifs['opaqueIf'],api,modifs['opaqueIf']);
            }
            computeOpacity(obj3d,api);
            return toCjsNumber(objId);
        });
    });
    api.defineFunction("cglSetVisible", 2, (args, modifs) => {
        let isVisible = api.evaluateAndVal(args[1]);
        if(isVisible["ctype"]!="boolean"){
            cglLogWarning("the second parameter of cglSetVisible should be a boolean");
            return nada;
        }
        isVisible = isVisible["value"];
        objectsById(args[0]).forEach(([obj3d,_,__])=>{
            obj3d.visible = isVisible;
        });
        return nada;
    });
    api.defineFunction("cglDelete", 1, (args, modifs) => {
        objectsById(args[0]).forEach(([_,objId,wasOpaque])=>{
            if(wasOpaque) {
                CindyGL.objectBuffer.opaque.delete(objId);
            } else {
                CindyGL.objectBuffer.translucent.delete(objId);
            }
        });
        return nada;
    });
    // TODO? cglObjectInfo()
    api.defineFunction("cglSpherePos", 1, (args, modifs) => {
        let objects = objectsById(args[0]);
        if(objects.length === 0)
            return nada;
        // TODO? better support for multiple ids
        let [obj3d,objId,_] = objects[0];
        if(obj3d.boundingBox.type !== BoundingBoxType.sphere) {
            cglLogWarning(`the object with id ${objId} is no sphere`);
            return nada;
        }
        return { // convert to CindyJS list
            ctype: 'list',
            value: obj3d.boundingBox.center.map(toCjsNumber)
        };
    });
    // custom error class for errors produced by calling cglDiscard
    class CglDiscardError extends Error {
        constructor(message) {
            super(message);
            this.name = this.constructor.name;
            Error.captureStackTrace(this, this.constructor);
        }
    }
    api.defineFunction("cglDiscard", 0, (args, modifs) => {
        // stop of current code-branch when hitting cglDiscard() outside compiled code
        throw new CglDiscardError("unexpected `cglDiscard()` statement outside compiled code");
    });
    // catch error created by calling cglDiscard and return default value
    api.defineFunction("cglEvalOrDiscard", 1, (args, modifs) => {
        let defValue = modifs['default'];
        if(defValue === undefined) {
            defValue = nada;
        }
        try{
            let value = api.evaluate(args[0]);
            if(value['ctype'] === 'cglLazy'){
                if(value.params.length>0) {
                    cglLogWarning("cglTryEval expression should not take parameters");
                }
                value = value.expr;
            }
            return api.evaluateAndVal(value);
        } catch(error) {
            if (error instanceof CglDiscardError) {
                return defValue;
            }
            throw error;
        }
    });
    var cglEvalSizes=new Set();
    /**
     * @param {CindyJS.anyval} csexpr
     * @param {Array<CindyJS.anyval>} args
     * @param {object} modifs
     */
    function cglEvalImpl(csexpr,args,modifs) {
        const val = api.evaluate(csexpr);
        if(val['ctype'] !== 'cglLazy') {
            cglLogWarning("this first argument of cglEval has to be a cglLazy expression");
            return nada;
        }
        if(val.params.length != args.length) {
            cglLogWarning(`wrong number of arguments for lazy expression expected ${val.params.length} got ${args.length}`);
            return nada;
        }
        let argValues = new Map();
        val.modifs.forEach(([key,value])=>{
            argValues.set(key,value);
        });
        for(let index=0;index<val.params.length;index++) {
            argValues.set(val.params[index]['name'],args[index]);
        }
        cglEvalCallCount++;// increase eval-call count to get distinct names for regional variables
        const expr = replaceVariables(val.expr,argValues);
        return api.evaluate(expr);
    }
    /** @param {number} k  */
    function createCglEval(k){
        if(cglEvalSizes.has(k)) return; // function already exists
        cglEvalSizes.add(k);
        api.defineFunction("cglEval", k+1, (args, modifs) => {
            return cglEvalImpl(args[0],args.slice(1),modifs);
        });
    }
    // wrapper for unevaluated expression that can be passed to colorplot program
    api.defineFunction("cglLazy", 2, (args, modifs) => {
        let params = cglLazyParams(args[0]);
        let paramsOk = true;
        params.forEach(val=>{
            if(val['ctype'] !== 'variable'){
                cglLogError("unexpected parameter in cglLazy expected variable got:",val);
                paramsOk = false;
            }
        });
        if(!paramsOk)
            return nada;
        // ensure matching evaluator exists
        createCglEval(params.length);
        return {
            ctype: "cglLazy",
            params: params,
            expr: cloneExpression(args[1]),
            modifs: Object.entries(modifs).map(([key,value])=>[key,api.evaluate(value)]) // TODO? convert to map
        };
    });
    // convenience function for lazy expression without parameters
    api.defineFunction("cglLazy", 1, (args, modifs) => {
        createCglEval(0);
        return {
            ctype: "cglLazy",
            params: [],
            expr: cloneExpression(args[0]),
            modifs: Object.entries(modifs).map(([key,value])=>[key,api.evaluate(value)]) // TODO? convert to map
        };
    });
    api.defineFunction("cglIsLazy", 1, (args, modifs) => {
        let val = api.evaluate(args[0]);
        return {
            ctype: "boolean",
            value: val['ctype'] === 'cglLazy'
        };
    });
    // evaluate expression
    // use modifiers to replace some variables in the expression with a constant
    // equivalent to cglEval(cglLazy(<expr>,<modifs>))
    api.defineFunction("cglWith", 1, (args, modifs) => {
        cglEvalImpl({
            ctype: "cglLazy",
            params: [],
            expr: cloneExpression(args[0]),
            modifs: Object.entries(modifs).map(([key,value])=>[key,api.evaluate(value)])
        },[],{});
    });
    function asName(csVal) {
        if(csVal['ctype'] === 'variable') {
            return csVal['name'];
        } else if(csVal['ctype'] === 'string') {
            return csVal['value'];
        } else {
            cglLogError("unexpected value for name:",csVal);
        }
    }
    function parseInterfaceArgs(csVal) {
        let argList = cglLazyParams(csVal);
        // use :<param-list> to mark parameter as function
        return argList.map(val => (
            val['ctype'] === 'userdata' ?{
                name: asName(val['obj']),
                args: cglLazyParams(val['key']),
            } :{
                name: asName(val),
                args: null
            }
        ));
    }
    /**
     * @param {Array<*>} params 
     * @param {boolean} tryUnwrap don't wrap if expr is already a cglLazy
     */
    function wrapLazy(expr,params,tryUnwrap) {
        if(tryUnwrap) {
            let value = tryEvaluate(expr,api,nada);
            if(value['ctype'] === 'cglLazy') {
                // TODO? warning if parameter names do not match
                if(value.params.length === params.length) {
                    return value;
                }
                cglLogError("lazy expression has wrong number of arguments: "+
                    `got: ${value.params.length} expected: ${params.length} (${params.map(p=>p['name']).join(",")})`
                );
                // TODO? add dummy parameter if given lazy does not have enough paramters
            }
        }
        return {
            ctype: "cglLazy",
            params: params,
            expr: cloneExpression(expr),
            modifs: []
        };
    }
    /* cglInterface(<name>,<implName>,<args>,<modifs>)
         function wrapper to simplify user interaction with Cindygl3d implementation in CindyScript
    */
    api.defineFunction("cglInterface",4,(args,modifs) => {
        // name of wrapper function
        let fn_name = asName(args[0]);
        // name of implementation function
        let fn_impl = asName(args[1]).toLowerCase(); // cs expects lowercase name
        // list of function arguments
        let fn_args = parseInterfaceArgs(args[2]);
        // list of expected modifiers
        let fn_modifs = parseInterfaceArgs(args[3]);
        createCglEval(0); // create eval for argument wrappers
        // create wrapper-function with given signature
        api.defineFunction(fn_name,fn_args.length,(args,modifs) => {
            let paramExprs={},modifExprs={};
            let callArgs = new Array(args.length);
            // convert function-arguments (marked with parameter-list as user-data) to cglLazy
            for(let i=0;i<fn_args.length;i++) {
                paramExprs[fn_args[i].name]=wrapLazy(args[i],[],false);
                if (fn_args[i].args != null) {
                    callArgs[i] = wrapLazy(args[i],fn_args[i].args,true);
                    createCglEval(fn_args[i].args.length);
                } else {
                    callArgs[i] = args[i];
                }
            }
            let callMods = {};
            for(let i=0;i<fn_modifs.length;i++) {
                const modName = fn_modifs[i].name;
                let mod = modifs[modName];
                if(mod === undefined) {
                    // set missing modifiers to nada to avoid collision with global
                    callMods[modName]=nada;
                    modifExprs[modName]=wrapLazy(nada,[],false);
                } else if (fn_modifs[i].args != null) {
                    modifExprs[modName]=wrapLazy(mod,[],false);
                    // convert function-arguments (marked with parameter-list as user-data) to cglLazy
                    callMods[modName]=wrapLazy(mod,fn_modifs[i].args,true);
                    createCglEval(fn_modifs[i].args.length);
                } else {
                    callMods[modName]=mod;
                    modifExprs[modName]=wrapLazy(mod,[],false);
                }
            }
            callMods["cglParamExprs"]={ctype:"JSON",value:paramExprs};
            callMods["cglModifExprs"]={ctype:"JSON",value:modifExprs};
            // TODO? pass modifiers as seperate JSON object
            Object.entries(modifs).forEach(([name, value])=>{
                if(callMods.hasOwnProperty(name))
                    return;
                callMods[name] = value;
            });
            // create fake ir for cindy-script call to implementation function
            // the given object entries should be enough to trick the interpreter into calling the implemntation with the given arguments and modifiers
            let call = {
                "ctype": 'function',
                "oper": `${fn_impl}$${callArgs.length}`, // add parameter count to procedure name
                "args": callArgs,
                "modifs": callMods
            };
            return api.evaluate(call);
        });
    });
    api.defineFunction("cglTryDetermineDegree",1,(args,modifs) => {
        let arg = api.evaluate(args[0]);
        if(arg['ctype'] !== 'cglLazy') {
            cglLogError("expected cglLazy expression, if the first argument should be used as an expression add checked variables as second parameter");
            return nada;
        }
        const degreeData = tryDetermineDegree(arg.expr,arg.params.map(asName));
        if(degreeData.degree === undefined)
            return nada;
        return toCjsNumber(degreeData.degree);
    });
    api.defineFunction("cglTryDetermineDegree",2,(args,modifs) => {
        let params = api.evaluate(args[1]);
        if(params["ctype"] === "list") {
            params = params.value.map(asName);
        } else {
            params=[asName(params)];
        }
        const degreeData = tryDetermineDegree(args[0],params);
        if(degreeData.degree === undefined)
            return nada;
        return toCjsNumber(degreeData.degree);
    });

    // debugging helper, print expression before and after evalualtion
    api.defineFunction("cglDebugPrint", 1, (args, modifs) => {
        console.log(args[0],api.evaluate(args[0]),api.evaluateAndVal(args[0]));
        return nada;
    });
    // functions for printing error/warning messages from within cindy-script code
    // TODO cindy-script style printing for values
    api.defineFunction("cglLogError", 1, (args, modifs) => {
        let str = api.evaluateAndVal(args[0]);
        cglLogError(str['value']!==undefined?str['value']:"___");
        return nada;
    });
    api.defineFunction("cglLogWarning", 1, (args, modifs) => {
        let str = api.evaluateAndVal(args[0]);
        cglLogWarning(str['value']!==undefined?str['value']:"___");
        return nada;
    });
    api.defineFunction("cglLogInfo", 1, (args, modifs) => {
        let str = api.evaluateAndVal(args[0]);
        cglLogInfo(str['value']!==undefined?str['value']:"___");
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
            prog.renderer = new Renderer(api, prog,Renderer.noBounds(),new Map(),false);
        }
        prog.renderer.renderXR(viewIndex);

        return nada;
    });
}

// Exports for CindyXR
CindyGL.gl = null;
/** @type {{opaque:Map<number,CindyGL3DObject>, translucent:Map<number,CindyGL3DObject>,callbacks:{preRender:Array<CindyJS.anyval>}}} */
CindyGL.objectBuffer = {
    opaque:new Map(),
    translucent:new Map(),
    callbacks:{
        preRender:[]
    }
};
// initialize with dummy values to make type-resolving easier
CindyGL.coordinateSystem = {
    x0:0 , x1: 0, y0: 0, y1: 0,  z0: 0, z1:0, zoom: 1,
    viewPosition: [0,0,0,0], transformedViewPos: [0,0,0,0]
};
CindyGL.generateCanvasWrapperIfRequired = generateCanvasWrapperIfRequired;
CindyGL.initGLIfRequired = initGLIfRequired;
CindyJS.registerPlugin(1, "CindyGL", CindyGL);
