const BoundingBoxType = {
    none: 0, // full screen
    // XXX? add support for bounding boxes to 2D-mode?
    // rect: 1, // draw on rectange [vec2,vec2]
    sphere: 2, // draw on bounding cube of sphere [vec3,float]
    cylinder: 3, // draw in bounding cuboid of cylinder [vec3,vec3,float]
    triangles: 4, // draw on triangular mesh (given as list of triangles [3*vec3]
    // TODO? rectangle orientated towarsd camera: [center: vec3, width: float, heigth: float]
}
// TODO find better names for box generator functions
Renderer.noBounds = function(){
    return { type: BoundingBoxType.none };
}
Renderer.boundingSphere = function(center,radius){
    return {
        type: BoundingBoxType.sphere,center: center, radius: radius
    };
}
Renderer.boundingCylinder = function(pointA,pointB,radius){
    return {
        type: BoundingBoxType.cylinder,pointA: pointA,pointB: pointB, radius: radius
    };
}
/**
 * @param {Array<number>} vertices list of coordinates in form [x1,y1,z1,x2,y2,z2,x3,...] groups of three vertices form a triangle
 * @param {Map<string,{values: Array<*>,eltType: type}>} vModifiers vertex modifiers
 */
Renderer.boundingTriangles = function(vertices,vModifiers){
    if(vertices.length%9 !== 0) {
        console.error("the length of vertices should be a multiple of 9");
    }
    // TODO optional additional parameter
    // triangles: array[ivec3] vertex indices (to reduce data consumption)
    // ? automatically create vertex indices to compress list of vertices
    return {
        type: BoundingBoxType.triangles,vertices: vertices, vModifiers: vModifiers
    };
}

Renderer.uModifierPrefix = "uModifier_";
Renderer.vModifierPrefix = "vModifier_";
Renderer.vModifierPrefixV = "aModifier_";

// remember previous values to detect changes
Renderer.prevBoundingBoxType = undefined;
Renderer.prevShader = undefined;
Renderer.prevTrafo = undefined;
Renderer.prevProjection = undefined;
Renderer.prevSize = [0,0];
Renderer.resetCachedState = function(){
    Renderer.prevBoundingBoxType = undefined;
    Renderer.prevShader = undefined;
    Renderer.prevTrafo = undefined;
    Renderer.prevProjection = undefined;
    Renderer.prevSize = [0,0];
};

/**
 * @param {CindyJS.anyval} expression for the Code that will be used for rendering
 * @param {DepthType} depthType
 * @param {{type: BoundingBoxType}} boundingBox 
 * @param {Map<string,{type:type, isuniform: boolean, used: boolean}>} modifierTypes
 * @constructor
 */
function Renderer(api, expression,depthType,boundingBox,modifierTypes) {
    this.api = api;
    this.expression = expression;
    this.modifierTypes = modifierTypes;
    this.activeModifierTypes = modifierTypes;
    this.depthType = depthType;
    this.boundingBox = boundingBox;
    this.rebuild(false);
}

//////////////////////////////////////////////////////////////////////
// Members of the prototype objects
/**
 * Source code of vertex shader
 * @type {string}
 */
Renderer.prototype.vertexShaderCode;

/**
 * Source code of fragment shader, contains code
 * @type {string}
 */
Renderer.prototype.fragmentShaderCode;

/** @type {ShaderProgram} */
Renderer.prototype.shaderProgram;

/** @type {CindyJS.pluginApi} */
Renderer.prototype.api;

/** @type {CindyJS.anyval} */
Renderer.prototype.expression;

/** @type {CodeBuilder} */
Renderer.prototype.cb;

/** @type {Object} */
Renderer.prototype.cpg;

/** @type {CanvasWrapper} */
Renderer.prototype.canvaswrapper

/** @type {boolean} */
Renderer.prototype.iscompiled

/** @type {number} */
Renderer.prototype.compiletime

/** @type {boolean} */
Renderer.prototype.opaque

/** @type {Map<string,{type:type, isuniform: boolean, used: boolean}>} */
Renderer.prototype.modifierTypes

// keep seperate map for active modifers to skip unneccessary checks in render loop
/** @type {Map<string,{type:type, used: boolean}>} */
Renderer.prototype.activeModifierTypes

/**
 * @param {Map<string,{type:type, isuniform: boolean, used: boolean}>} newModifierTypes
 * */
Renderer.prototype.updateModifierTypes = function(newModifierTypes) {
    this.modifierTypes=newModifierTypes;
    this.rebuild(true);
}
Renderer.prototype.recompile = function() {
    console.log("recompile");
    this.cb = new CodeBuilder(this.api);
    this.cpg = this.cb.generateColorPlotProgram(this.expression,this.modifierTypes);
    this.activeModifierTypes = new Map();
    this.modifierTypes.forEach((value,key)=>{
        if(!value.used||!value.isuniform||value.type.type == "cglLazy")
            return; //ignore unused modifers
        this.activeModifierTypes.set(key,value);
    });
    this.opaque = this.cpg.opaque;
    this.iscompiled = true;
    this.compiletime = requiredcompiletime;
}
Renderer.prototype.rebuild = function(forceRecompile) {
    console.log("rebuild");
    if(forceRecompile|| !this.iscompiled || this.compiletime < requiredcompiletime){
        this.recompile();
    }
    if(this.cpg===undefined){
        console.error("cpg is undefined");
    }
    // TODO? use different header for fshader depending on box type
    this.fragmentShaderCode =
        cgl3d_resources["standardFragmentHeader"] + this.cb.generateShader(this.cpg,this.depthType);
    if(CindyGL3D.mode3D){
        if(this.boundingBox.type == BoundingBoxType.none) {
            this.vertexShaderCode = cgl3d_resources["vshader3d"];
        } else if(this.boundingBox.type==BoundingBoxType.sphere) {
            this.vertexShaderCode = cgl3d_resources["vshader3dSphere"];
        } else if(this.boundingBox.type==BoundingBoxType.cylinder) {
            this.vertexShaderCode = cgl3d_resources["vshader3dCylinder"];
        } else if(this.boundingBox.type==BoundingBoxType.triangles) {
            let attributeVars = "";
            let attributeCopies = "";
            let index=0;
            this.boundingBox.vModifiers.forEach((value,name)=>{
                // name given to this modifier by code-builder
                let vname = this.modifierTypes.get(name).uniformName;
                value.aName = Renderer.vModifierPrefixV+index;
                // TODO? create structs for composite types
                attributeVars +=`in  ${webgltype(value.eltType)} ${value.aName};\nout ${webgltype(value.eltType)} ${vname};\n`;
                attributeCopies += `${vname}=${value.aName};\n`;
                index++;
            });
            this.vertexShaderCode = `${cgl3d_resources["vshader3dTrianglesHeader"]}${attributeVars}`+
            `void main(void){\n${attributeCopies}${cgl3d_resources["vshader3dTrianglesCode"]}}`;
            console.log(this.vertexShaderCode);
        } else {
            console.error("unsupported bounding box type: ",this.boundingBox.type);
            this.vertexShaderCode = cgl3d_resources["vshader3d"];
        }
    }else{
        this.vertexShaderCode = cgl3d_resources["vshader"];
    }
    // TODO? split creating of shader program and updating of attributes
    this.shaderProgram = new ShaderProgram(gl, this.vertexShaderCode, this.fragmentShaderCode);
    this.updateVertices();
};
Renderer.prototype.updateVertices = function() {
    // TODO? share vertex attributes between different shader objects
    if(CindyGL3D.mode3D){
        let zoom = CindyGL3D.coordinateSystem.zoom;
        let x0=CindyGL3D.coordinateSystem.x0*zoom;
        let x1=CindyGL3D.coordinateSystem.x1*zoom;
        let y0=CindyGL3D.coordinateSystem.y0*zoom;
        let y1=CindyGL3D.coordinateSystem.y1*zoom;
        let z1=CindyGL3D.coordinateSystem.z1*zoom;
        if(this.boundingBox.type == BoundingBoxType.none){
            this.vertices = new Float32Array([x0,y0,z1, x1,y0,z1, x0,y1,z1, x1,y1,z1]);
        }else if(this.boundingBox.type==BoundingBoxType.sphere){
            this.vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
        }else if(this.boundingBox.type==BoundingBoxType.cylinder){
            this.vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
        }else if(this.boundingBox.type==BoundingBoxType.triangles){
            this.vertices = new Float32Array(this.boundingBox.vertices);
        }else{
            console.error("unsupported bounding box type: ",this.boundingBox.type);
            this.vertices = new Float32Array([x0,y0,z1, x1,y0,z1, x0,y1,z1, x1,y1,z1]);
        }
    }else{
        this.vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    }
    this.updateAttributes();
}

Renderer.computeAttributeData = function (eltType,values){
    let eltConverter = undefined;
    let attributeType = gl.FLOAT;
    switch (eltType) {
        case type.complex:
            eltConverter = (elts,val) => elts.concat(val['value']['real'], val['value']['imag']);
            break;
        case type.bool:
            eltConverter = (elts,val) => elts.concat((val['value']) ? 1 : 0);
            attributeType = gl.BYTE;
            break;
        case type.int:
            eltConverter = (elts,val) => elts.concat(val['value']['real']);
            attributeType = gl.INT;
            break;
        case type.float:
            eltConverter = (elts,val) => elts.concat(val['value']['real']);
            break;
        case type.point:
        case type.line:
            eltConverter = (elts,val) => {
                if (val.ctype === 'geo') {
                    return elts.concat(val['value']['homog']['value'].map(x => x['value']['real']));
                } else if (val.ctype === 'list' && val['value'].length === 2) {
                    return elts.concat(val['value'].map(x => x['value']['real'])).concat([1]);
                } else if (val.ctype === 'list' && val['value'].length === 3) {
                    return elts.concat(val['value'].map(x => x['value']['real']));
                }
                console.error("unexpected value for geometry object: ",val);
            }
            break;
        default:
            if(eltType.parameters === type.int) {
                attributeType = gl.INT;
            }
            // TODO? do i need special handling for composite attributes
            //  or is structure memory layout linear in memory
            if (eltType.type === 'list' && (eltType.parameters === type.float
                    || eltType.parameters === type.int)) { // float-list or int-list
                eltConverter = (elts,val) => elts.concat(val['value'].map(x => x['value']['real']));
                break;
            } else if (eltType.type === 'list' && eltType.parameters.type === 'list'
                && eltType.parameters.parameters === type.float) { //float matrix
                eltConverter = (elts,val) => {
                    //probably: if isnativeglsl?
                    for (let j = 0; j < eltType.length; j++)
                        for (let i = 0; i < eltType.parameters.length; i++)
                            elts.push(val['value'][j]['value'][i]['value']['real']);
                    return elts;
                }
            }
            break;
    }
    if(!eltConverter) {
        console.error(`Don't know how to set vertex attribute array of type ${typeToString(eltType)}, to`);
        console.log(values);
        return {aData: undefined, aSize: 0, aType: attributeType};
    }
    let data = [];
    values.forEach(elt => {data = eltConverter(data,elt);});
    let aData = attributeType == gl.FLOAT ?
        new Float32Array(data) :
        attributeType == gl.INT ?
            new Int32Array(data) :
            new Int8Array(data);
    return {aData: aData, aSize: aData.length/values.length, aType: attributeType};
}
// TODO? seperate version for triangles
Renderer.prototype.updateAttributes = function() {
    Renderer.prevBoundingBoxType=this.boundingBox.type;
    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

    var texCoordOffset = this.vertices.byteLength;
    let totalBufferSize = texCoordOffset;
    var texCoords;
    if(this.boundingBox.type == BoundingBoxType.triangles) {
        if(this.boundingBox.texCoords){
            texCoords = this.boundingBox.texCoords;
        } else {
            // texCoords is unsed by random operator
            // -> TODO? generate unique coordinates for each pixel
            // TODO? compress using index table
            let baseCoords = [0, 0, 1, 0, 0, 1];
            texCoords = []; // ! no let here, this is the function-level variable
            for(let i=0;i<this.vertices.length;i+=9){ // 3floats / vertex * 3 vertex / triangle
                texCoords = texCoords.concat(baseCoords);
            }
            texCoords = new Float32Array(texCoords);
            this.boundingBox.texCoords =texCoords;
        }
        totalBufferSize+=texCoords.byteLength;

        let index=0;
        // TODO? compress vertex data using element index table
        // find name and location of vertex modifier attributes
        this.boundingBox.vModifiers.forEach((value)=>{
            // compute name if it does not curently exist
            let aName = value.aName || Renderer.vModifierPrefixV+index;
            let aLoc = gl.getAttribLocation(this.shaderProgram.handle, aName);
            if(aLoc != -1)
                gl.enableVertexAttribArray(aLoc);
            value.aLoc = aLoc;
            value.aOffset = totalBufferSize;
            if(value.aData === undefined) {
                let aData = Renderer.computeAttributeData(value.eltType,value.values);
                value.aData = aData.aData;
                value.aSize = aData.aSize;
                value.aType = aData.aType;
            }
            totalBufferSize += value.aData.byteLength;
            index ++;
        });
    } else {
        texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
        totalBufferSize+=texCoords.byteLength;
    }

    var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
    if(aTexLoc!=-1){ // aTexCoord may get optimized out
        gl.enableVertexAttribArray(aTexLoc);
    }

    gl.bufferData(gl.ARRAY_BUFFER, totalBufferSize, gl.STATIC_DRAW);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    if(aTexLoc!=-1) { // aTexCoord may get optimized out
        gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
        gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
    }
    if(this.boundingBox.type == BoundingBoxType.triangles) {
        this.boundingBox.vModifiers.forEach((value)=>{
            if(value.aLoc < 0 || value.aSize <= 0)
                return; // no attribute / no data
            gl.bufferSubData(gl.ARRAY_BUFFER, value.aOffset, value.aData);
            gl.vertexAttribPointer(value.aLoc, value.aSize, value.aType, false, 0, value.aOffset);
        });
    }
}

/**
 * @param {Array.<number>} m
 * @return {Array.<number>}
 */
function transpose3(m) {
    return [
        m[0], m[3], m[6],
        m[1], m[4], m[7],
        m[2], m[5], m[8]
    ];
};


/**
 * sets uniform transformMatrix such that it represents an affine trafo with (0,0)->a, (1,0)->b, (0,1)->c
 */
Renderer.prototype.setTransformMatrix = function(a, b, c) {
    if (this.shaderProgram.uniform.hasOwnProperty('transformMatrix')){
        let m = [
            b.x - a.x, c.x - a.x, a.x,
            b.y - a.y, c.y - a.y, a.y,
            0, 0, 1
        ];
        this.shaderProgram.uniform["transformMatrix"](transpose3(m));
    }
}
/**
 * sets uniform space transformation matrices
 */
Renderer.prototype.setCoordinateUniforms3D = function() {
    if (this.shaderProgram.uniform.hasOwnProperty('spaceTransformMatrix'))
        this.shaderProgram.uniform["spaceTransformMatrix"](transposeM4(CindyGL3D.trafoMatrix).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('inverseSpaceTransformMatrix'))
        this.shaderProgram.uniform["inverseSpaceTransformMatrix"](transposeM4(CindyGL3D.invTrafoMatrix).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('projectionMatrix'))
        this.shaderProgram.uniform["projectionMatrix"](transposeM4(CindyGL3D.projectionMatrix).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('projAndTrafoMatrix'))
        this.shaderProgram.uniform["projAndTrafoMatrix"]
            (transposeM4(mmult4(CindyGL3D.projectionMatrix,CindyGL3D.trafoMatrix)).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('cgl_viewPos')){
        if(typeof(CindyGL3D.coordinateSystem.transformedViewPos)==="undefined"){
            CindyGL3D.coordinateSystem.transformedViewPos=
                mvmult4(CindyGL3D.invTrafoMatrix,CindyGL3D.coordinateSystem.viewPosition);
        }
        let viewPos4=CindyGL3D.coordinateSystem.transformedViewPos;
        this.shaderProgram.uniform["cgl_viewPos"]([viewPos4[0]/viewPos4[3],viewPos4[1]/viewPos4[3],viewPos4[2]/viewPos4[3]]);
    }
}
Renderer.prototype.setBoundingBoxUniforms = function() {
    // TODO? check first box-type then uniform existence
    if (this.shaderProgram.uniform.hasOwnProperty('uCenter')){
        if(this.boundingBox.type==BoundingBoxType.sphere){
            this.shaderProgram.uniform["uCenter"]
                (this.boundingBox.center);
        }else{
            console.error("uCenter is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uRadius')){
        if(this.boundingBox.type==BoundingBoxType.sphere||this.boundingBox.type==BoundingBoxType.cylinder){
            this.shaderProgram.uniform["uRadius"]
                ([this.boundingBox.radius]);
        }else{
            console.error("uRadius is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uPointA')){
        if(this.boundingBox.type==BoundingBoxType.cylinder){
            this.shaderProgram.uniform["uPointA"]
                (this.boundingBox.pointA);
        }else{
            console.error("uPointA is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uPointB')){
        if(this.boundingBox.type==BoundingBoxType.cylinder){
            this.shaderProgram.uniform["uPointB"]
                (this.boundingBox.pointB);
        }else{
            console.error("uPointB is not supported for current bounding box type");
        }
    }
}

Renderer.computeUniformValue = function (setter,uniformType,val){
    if (typeof(setter) === 'function') {
        switch (uniformType) {
            case type.complex:
                return [val['value']['real'], val['value']['imag']];
            case type.bool:
                return [(val['value']) ? 1 : 0];
            case type.int:
            case type.float:
                return [val['value']['real']];
            case type.point:
            case type.line:
                if (val.ctype === 'geo')
                    return val['value']['homog']['value'].map(x => x['value']['real']);
                else if (val.ctype === 'list' && val['value'].length === 2)
                    return val['value'].map(x => x['value']['real']).concat([1]);
                else if (val.ctype === 'list' && val['value'].length === 3)
                    return val['value'].map(x => x['value']['real']);
                break;
            default:
                if (uniformType.type === 'list' && (uniformType.parameters === type.float
                        || uniformType.parameters === type.int)) { // float-list or int-list
                    return val['value'].map(x => x['value']['real']);
                } else if (uniformType.type === 'list' && uniformType.parameters.type === 'list'
                    && uniformType.parameters.parameters === type.float) { //float matrix
                    //probably: if isnativeglsl?
                    let m = [];
                    for (let j = 0; j < uniformType.length; j++)
                        for (let i = 0; i < uniformType.parameters.length; i++)
                            m.push(val['value'][j]['value'][i]['value']['real']);
                    return m;
                }
                break;
        }
    } else if (uniformType.type === 'list') {
        let elts=[];
        let d = depth(uniformType);
        let fp = finalparameter(uniformType);
        if (d === 1 && (fp === type.float || fp === type.int )) {
            let n = uniformType.length;
            let s = sizes(n);
            let listBuilder = (fp === type.float)?type.vec:type.ivec;

            let cum = 0;
            for (let k in s) {
                let setterKey = `a${k}`;
                elts.push([
                    setterKey,
                    Renderer.computeUniformValue(setter[setterKey], listBuilder(s[k]), {
                        'ctype': 'list',
                        'value': range(s[k]).map(l => val['value'][cum + l])
                    })
                ]);
                cum += s[k];
            }
            return elts;
        }
        for (let k = 0; k < uniformType.length; k++) {
            let setterKey = `a${k}`;
            elts.push([
                setterKey,
                Renderer.computeUniformValue(setter[setterKey], uniformType.parameters, {
                    'ctype': 'list',
                    'value': val['value'][k]['value']
                })
            ]);
        }
        return elts;
    }
    console.error(`Don't know how to set uniform of type ${typeToString(uniformType)}, to`);
    console.log(val);
    return undefined;
}
Renderer.setUniformValue = function (setter,uniformValue){
    if(uniformValue===undefined)
        return; // not a valid uniform value
    if (typeof(setter) === 'function') {
        setter(uniformValue);
        return;
    }
    uniformValue.forEach(([setterKey,value])=>{
        Renderer.setUniformValue(setter[setterKey],value);
    });
}

/**
 * @param {Map} plotModifiers
 */
Renderer.prototype.setModifierUniforms = function(plotModifiers){
    this.activeModifierTypes.forEach((modifierType,modifierName)=>{
        let uniformName=modifierType.uniformName;
        if (this.shaderProgram.uniform.hasOwnProperty(uniformName)){
            let value = plotModifiers.get(modifierName);
            let uniformSetter = this.shaderProgram.uniform[uniformName];
            if(!value.uniformValue || value.modifierTypes!==this.modifierTypes){ // uniform value not up to date
                value.uniformValue = Renderer.computeUniformValue(uniformSetter,modifierType.type,value);
                // remember current modifier types to ensure update when type changes
                value.modifierTypes=this.activeModifierTypes;
            }
            Renderer.setUniformValue(uniformSetter,value.uniformValue);
        } else {
            console.warn(`missing uniform ${uniformName} for modifier ${modifierName}`);
        }
    });
}

Renderer.prototype.setUniforms = function() {
    function setUniform(setter, t, val) {
        if (!setter) return; //skip inactive uniforms
        Renderer.setUniformValue(setter,Renderer.computeUniformValue(setter,t,val));
    }


    for (let uname in this.cpg.uniforms) {

        let val = this.api.evaluateAndVal(this.cpg.uniforms[uname].expr);
        let t = this.cpg.uniforms[uname].type;

        if (!issubtypeof(constant(val), t)) {
            console.log(`Type of ${uname} changed (${typeToString(constant(val))} is no subtype of  ${typeToString(t)}); forcing rebuild.`);
            this.rebuild(true);
            this.shaderProgram.use(gl);
            this.setUniforms();
            return;
        }

        if (this.shaderProgram.uniform[uname]) {
            let setter = this.shaderProgram.uniform[uname];
            setUniform(setter, t, val);
        }
    }

    [
        ['rnd_', () => [Math.random()]],
        [`_lowerleft`, () => {
            let pt = computeLowerLeftCorner(this.api);
            return [pt.x, pt.y];
        }],
        [`_lowerright`, () => {
            let pt = computeLowerRightCorner(this.api);
            return [pt.x, pt.y];
        }],
    ].map(
        a => (this.shaderProgram.uniform[a[0]]) && this.shaderProgram.uniform[a[0]](a[1]())
    )
};

/**
 * Activates, loads textures and sets corresponding sampler uniforms
 */
Renderer.prototype.loadTextures = function() {
    let cnt = 0;
    for (let t in this.cpg.texturereaders) {
        gl.activeTexture(gl.TEXTURE0 + cnt);

        let tr = this.cpg.texturereaders[t];
        let tname = tr.name;

        let properties = tr.properties;
        let cw = tr.returnCanvaswrapper();

        cw.reloadIfRequired();
        cw.bindTexture();
        [
            [`_sampler${tname}`, [cnt]],
            [`_ratio${tname}`, [cw.sizeX / cw.sizeY]],
            [`_cropfact${tname}`, [cw.sizeX / cw.sizeXP, cw.sizeY / cw.sizeYP]]
        ].map(
            a => (this.shaderProgram.uniform[a[0]]) && this.shaderProgram.uniform[a[0]](a[1])
        )
        cnt++;
    }
}

/**
 * checks whether the generation of the compiled myfunctions is still the current one
 */
Renderer.prototype.functionGenerationsOk = function() {
    for (let fname in this.cpg.generations) {
        if (this.api.getMyfunction(fname).generation > this.cpg.generations[fname]) {
            console.log(`${fname} is outdated; forcing rebuild.`);
            return false;
        }
    }
    return true;
}

Renderer.prototype.prepareUniforms = function() {
    this.setUniforms();
    this.updateCoordinateUniforms();
    this.loadTextures();
}
Renderer.prototype.updateCoordinateUniforms = function() {
    this.setCoordinateUniforms3D();
}

// TODO? split 2d and 3d rendering functions
/**
 * runs shaderProgram on gl. Will render to texture in canvaswrapper
 * or if argument canvaswrapper is not given, then to glcanvas
 */
Renderer.prototype.render = function(a, b, sizeX, sizeY, boundingBox, plotModifiers, canvaswrapper) {
    let needsRebuild = this.boundingBox.type!=boundingBox.type;
    this.boundingBox = boundingBox;
    if ((Renderer.prevShader!==this.shaderProgram) // only check functions once per shader program per drawCycle
            && (!this.functionGenerationsOk())){
        this.rebuild(true);
    }else if(needsRebuild){
        this.rebuild(false);
    }else if(CindyGL3D.projectionMatrix!=Renderer.prevProjection){
        this.updateVertices();
        Renderer.prevProjection=CindyGL3D.projectionMatrix;
        Renderer.prevTrafo=undefined;
    }else if(this.boundingBox.type == BoundingBoxType.triangles){
        this.updateVertices();
    }else if(this.boundingBox.type != Renderer.prevBoundingBoxType){
        this.updateAttributes();
    }

    if(Renderer.prevSize[0]!==sizeX||Renderer.prevSize[1]!==sizeY){
        Renderer.prevSize=[sizeX,sizeY];
        enlargeCanvasIfRequired(sizeX, sizeY)
        if (canvaswrapper)
            gl.viewport(0, 0, sizeX, sizeY);
        else
            gl.viewport(0, glcanvas.height - sizeY, sizeX, sizeY);
    }

    if(Renderer.prevShader!==this.shaderProgram){
        this.shaderProgram.use(gl);
        Renderer.prevShader = this.shaderProgram;
        this.prepareUniforms();
        // ? -> make part of initial renderer setup
        if (canvaswrapper) {
            canvaswrapper.bindFramebuffer(); //render to texture stored in canvaswrapper
            canvaswrapper.generation = ++canvaswrapper.canvas.generation;
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null); //render to glcanvas
        }
    // TODO is there a better way to detect change of coordinate system
    }else if(Renderer.prevTrafo!==CindyGL3D.trafoMatrix){
        Renderer.prevTrafo = CindyGL3D.trafoMatrix;
        this.updateCoordinateUniforms();
    }
    if(!CindyGL3D.mode3D){ // TODO? split render2d and render3d
        let alpha = sizeY / sizeX;
        let n = {
            x: -(b.y - a.y) * alpha,
            y: (b.x - a.x) * alpha
        };
        let c = {
            x: a.x + n.x,
            y: a.y + n.y
        };
        //let d = {x: b.x + n.x, y: b.y + n.y};
        this.setTransformMatrix(a, b, c);
    }
    this.setBoundingBoxUniforms();
    this.setModifierUniforms(plotModifiers);

    if(this.boundingBox.type != BoundingBoxType.triangles){
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
        // TODO? seperate render-call for drawing triangles
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/3);
    }
    if(!CindyGL3D.mode3D)
        gl.flush(); //renders stuff to canvaswrapper

    /* render on glcanvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();
  */
}

// TODO? make 3D mode compatible with CindyXR
/**
 * For use with CindyXR.
 */

Renderer.prototype.renderXR = function(viewIndex) {
    if (viewIndex == 0) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Attribute locations might be changed by OpenXR.
        this.resetAttribLocations();
    }

    if (!this.functionGenerationsOk()) this.rebuild(true);

    this.shaderProgram.use(gl);
    this.setUniforms();
    // Transform texture coordinates to [-1,1]^2.
    this.setTransformMatrix({
        x: -1,
        y: -1
    }, {
        x: 1,
        y: -1
    }, {
        x: -1,
        y: 1
    });
    this.loadTextures();

    // Binds the necessary framebuffer object.
    CindyJS._pluginRegistry.CindyXR.xrUpdateCindyGL3DView(gl, viewIndex);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush(); //renders stuff to canvaswrapper
}

Renderer.prototype.resetAttribLocations = function() {
    var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    var texCoordOffset = 4 * 3 * 4; // 4 vertices, 3 entries, 4 bytes per entry

    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);

    var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
    if(aTexLoc!=-1){ // aTexCoord may get optimized out
        gl.enableVertexAttribArray(aTexLoc);
        gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
    }
}
