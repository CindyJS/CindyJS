const BoundingBoxType = {
    none: 0, // full screen
    // XXX? add support for bounding boxes to 2D-mode?
    // rect: 1, // draw on rectange [vec2,vec2]
    sphere: 2, // draw on bounding cube of sphere [vec3,float]
    cylinder: 3, // draw in bounding cuboid of cylinder [vec3,vec3,float]
    triangles: 4, // draw on triangular mesh (given as list of triangles [3*vec3]
    cuboid: 5, // draw shapw within cuboid, cull back faces
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
Renderer.boundingCylinder = function(center,direction,radius,overhang){
    let length=Math.sqrt(dot3(direction,direction));
    return {
        type: BoundingBoxType.cylinder,center: center,direction: direction, radius: radius, 
        boxLengthScale: (length+overhang)/length
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
Renderer.boundingCuboid = function(center,v1,v2,v3){
    return {
        type: BoundingBoxType.cuboid,center: center,v1: v1, v2: v2, v3: v3
    };
}

const TransparencyType = {
    Simple: 0, // render everything in draw order (default)
    SingleLayer: 1, // merge transparent objects into a single layer
    MultiLayer: 2, // use multiple layers for rendering transparent objects
}

Renderer.uModifierPrefix = "uModifier_";
Renderer.vModifierPrefix = "vModifier_";
Renderer.vModifierPrefixV = "aModifier_";
Renderer.transparencyType = TransparencyType.Simple;

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
    gl.disable(gl.CULL_FACE);
};

/**
 * @param {CindyJS.anyval} expression for the Code that will be used for rendering
 * @param {{type: BoundingBoxType}} boundingBox
 * @param {Map<string,{type:type, isuniform: boolean, used: boolean}>} modifierTypes
 * @constructor
 */
function Renderer(api, expression,boundingBox,modifierTypes) {
    this.api = api;
    this.expression = expression;
    this.modifierTypes = modifierTypes;
    this.activeModifierTypes = modifierTypes;
    this.boundingBox = boundingBox;
    this.transparencyType = Renderer.transparencyType;
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

/** the TransparencyType used for the previous rendering call
 *  @type {TransparencyType} */
Renderer.prototype.transparencyType;

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
        return;
    }
    // TODO? use different header for fshader depending on box type
    this.transparencyType = Renderer.transparencyType;
    if (this.transparencyType === TransparencyType.Simple) {
        this.fragmentShaderCode = cgl_resources["standardFragmentHeader"];
    } else if ( this.transparencyType === TransparencyType.SingleLayer) {
        const typeSuffix = can_use_texture_float ? "" : "2I8";
        this.fragmentShaderCode = this.opaque ? cgl_resources["fragHeaderOpaqueLayer"+typeSuffix] : cgl_resources["fragHeaderSingleLayer"+typeSuffix];
    } else if ( this.transparencyType === TransparencyType.MultiLayer) {
        const typeSuffix = can_use_texture_float ? "" : "2I8";
        this.fragmentShaderCode = cgl_resources["fragHeaderOpaqueLayer"+typeSuffix]; // TODO better name for fShader? ('writeHeader')
    } else {
        console.error("unexpected transparencyType ",this.transparencyType);
        return;
    }
    this.fragmentShaderCode += this.cb.generateShader(this.cpg,this.transparencyType === TransparencyType.Simple);
    if(CindyGL.mode3D){
        if(this.boundingBox.type == BoundingBoxType.none) {
            this.vertexShaderCode = cgl_resources["vshader3d"];
        } else if(this.boundingBox.type==BoundingBoxType.sphere) {
            this.vertexShaderCode = cgl_resources["vshader3dSphere"];
        } else if(this.boundingBox.type==BoundingBoxType.cylinder) {
            this.vertexShaderCode = cgl_resources["vshader3dCylinder"];
        } else if(this.boundingBox.type==BoundingBoxType.triangles) {
            let attributeVars = "";
            let attributeCopies = "";
            let index=0;
            this.boundingBox.vModifiers.forEach((value,name)=>{
                // name given to this modifier by code-builder
                let vname = this.modifierTypes.get(name).uniformName;
                if(vname == undefined) {
                    console.warn("unused vertex-modifier:",name);
                    return;
                }
                value.aName = Renderer.vModifierPrefixV+index;
                // TODO? create structs for composite types
                attributeVars +=`in  ${webgltype(value.eltType)} ${value.aName};\nout ${webgltype(value.eltType)} ${vname};\n`;
                attributeCopies += `${vname}=${value.aName};\n`;
                index++;
            });
            this.vertexShaderCode = `${cgl_resources["vshader3dTrianglesHeader"]}${attributeVars}`+
            `void main(void){\n${attributeCopies}${cgl_resources["vshader3dTrianglesCode"]}}`;
            console.log(this.vertexShaderCode);
        } else if(this.boundingBox.type==BoundingBoxType.cuboid) {
            this.vertexShaderCode = cgl_resources["vshader3dCuboid"];
        } else {
            console.error("unsupported bounding box type: ",this.boundingBox.type);
            this.vertexShaderCode = cgl_resources["vshader3d"];
        }
    }else{
        this.vertexShaderCode = cgl_resources["vshader"];
    }
    this.shaderProgram = new ShaderProgram(gl, this.vertexShaderCode, this.fragmentShaderCode);
    this.updateVertices();
};
Renderer.prototype.updateVertices = function() {
    // TODO? share vertex attributes between different shader objects
    if(CindyGL.mode3D) {
        let zoom = CindyGL.coordinateSystem.zoom;
        let x0=CindyGL.coordinateSystem.x0*zoom;
        let x1=CindyGL.coordinateSystem.x1*zoom;
        let y0=CindyGL.coordinateSystem.y0*zoom;
        let y1=CindyGL.coordinateSystem.y1*zoom;
        let z1=CindyGL.coordinateSystem.z1*zoom;
        if(this.boundingBox.type == BoundingBoxType.none) {
            this.vertices = new Float32Array([x0,y0,z1, x1,y0,z1, x0,y1,z1, x1,y1,z1]);
        } else if(this.boundingBox.type==BoundingBoxType.sphere) {
            this.vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
        } else if(this.boundingBox.type==BoundingBoxType.triangles) {
            this.vertices = new Float32Array(this.boundingBox.vertices);
        } else if(this.boundingBox.type==BoundingBoxType.cuboid || this.boundingBox.type==BoundingBoxType.cylinder) {
            // copied from Cindy3D
            // TODO? use vertex-indices
            this.vertices = new Float32Array([
                1.0, 1.0, 1.0, 1.0,-1.0, 1.0, -1.0, 1.0, 1.0, -1.0,-1.0, 1.0, -1.0,-1.0,-1.0,
                1.0,-1.0, 1.0,  1.0,-1.0,-1.0, 1.0, 1.0,-1.0, -1.0,-1.0,-1.0, -1.0, 1.0,-1.0,
                -1.0, 1.0, 1.0, 1.0, 1.0,-1.0, 1.0, 1.0, 1.0, 1.0,-1.0, 1.0
            ]);
        } else {
            console.error("unsupported bounding box type: ",this.boundingBox.type);
            this.vertices = new Float32Array([x0,y0,z1, x1,y0,z1, x0,y1,z1, x1,y1,z1]);
        }
    } else {
        this.vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    }
    this.updateAttributes();
}

Renderer.computeAttributeData = function (eltType,values){
    let eltConverter = undefined;
    let attributeType = gl.FLOAT;
    switch (eltType) {
        case type.complex:
            eltConverter = (elts,val) => elts.push(val['value']['real'], val['value']['imag']);
            break;
        case type.bool:
            eltConverter = (elts,val) => elts.push((val['value']) ? 1 : 0);
            attributeType = gl.BYTE;
            break;
        case type.int:
            eltConverter = (elts,val) => elts.push(val['value']['real']);
            attributeType = gl.INT;
            break;
        case type.float:
            eltConverter = (elts,val) => elts.push(val['value']['real']);
            break;
        case type.point:
        case type.line:
            eltConverter = (elts,val) => {
                if (val.ctype === 'geo') {
                    val['value']['homog']['value'].forEach(x => elts.push(x['value']['real']));
                } else if (val.ctype === 'list' && val['value'].length === 2) {
                    val['value'].forEach(x => elts.push(x['value']['real']));
                } else if (val.ctype === 'list' && val['value'].length === 3) {
                    val['value'].forEach(x => elts.push(x['value']['real']));
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
                eltConverter = (elts,val) => {
                    val['value'].forEach(x => elts.push(x['value']['real']));
                };
                break;
            } else if (eltType.type === 'list' && eltType.parameters.type === 'list'
                && eltType.parameters.parameters === type.float) { //float matrix
                eltConverter = (elts,val) => {
                    //probably: if isnativeglsl?
                    for (let j = 0; j < eltType.length; j++)
                        for (let i = 0; i < eltType.parameters.length; i++)
                            elts.push(val['value'][j]['value'][i]['value']['real']);
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
    values.forEach(elt => eltConverter(data,elt));
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
    if (this.boundingBox.type === BoundingBoxType.cylinder || this.boundingBox.type === BoundingBoxType.cuboid) {
        gl.enable(gl.CULL_FACE); // FIXME orientation of cylinder in space changes how faces are culled
        gl.cullFace(gl.FRONT); // cull front faces to allow view-pos inside cuboid
    } else {
        gl.disable(gl.CULL_FACE);
    }
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
                texCoords.push.apply(texCoords,baseCoords);
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
            if(aLoc == -1)
                return;// skip unused attributes
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
    } else if(this.boundingBox.type == BoundingBoxType.cylinder || this.boundingBox.type == BoundingBoxType.cuboid) {
        // TODO find good texture coords for cuboid
        texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1,0, 0, 1, 0, 0, 1, 1, 1,0, 0, 1, 0, 0, 1, 1, 1,0,0,1,0]);
        totalBufferSize+=texCoords.byteLength;
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
            if(value.aData === undefined || value.aLoc < 0 || value.aSize <= 0)
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
        this.shaderProgram.uniform["spaceTransformMatrix"](transposeM4(CindyGL.trafoMatrix).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('inverseSpaceTransformMatrix'))
        this.shaderProgram.uniform["inverseSpaceTransformMatrix"](transposeM4(CindyGL.invTrafoMatrix).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('projectionMatrix'))
        this.shaderProgram.uniform["projectionMatrix"](transposeM4(CindyGL.projectionMatrix).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('projAndTrafoMatrix'))
        this.shaderProgram.uniform["projAndTrafoMatrix"]
            (transposeM4(mmult4(CindyGL.projectionMatrix,CindyGL.trafoMatrix)).flat());
    if (this.shaderProgram.uniform.hasOwnProperty('cgl_viewPos')){
        if(typeof(CindyGL.coordinateSystem.transformedViewPos)==="undefined"){
            CindyGL.coordinateSystem.transformedViewPos=
                mvmult4(CindyGL.invTrafoMatrix,CindyGL.coordinateSystem.viewPosition);
        }
        let viewPos4=CindyGL.coordinateSystem.transformedViewPos;
        this.shaderProgram.uniform["cgl_viewPos"]([viewPos4[0]/viewPos4[3],viewPos4[1]/viewPos4[3],viewPos4[2]/viewPos4[3]]);
    }
}
Renderer.prototype.setBoundingBoxUniforms = function() {
    // TODO? check first box-type then uniform existence
    if (this.shaderProgram.uniform.hasOwnProperty('uCenter')){
        if(this.boundingBox.center !== undefined) {
            this.shaderProgram.uniform["uCenter"]
                (this.boundingBox.center);
        }else{
            console.error("uCenter is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uRadius')){
        if(this.boundingBox.radius !== undefined) {
            this.shaderProgram.uniform["uRadius"]
                ([this.boundingBox.radius]);
        }else{
            console.error("uRadius is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uBoxLengthScale')){
        if(this.boundingBox.boxLengthScale !== undefined) {
            this.shaderProgram.uniform["uBoxLengthScale"]
                ([this.boundingBox.boxLengthScale]);
        }else{
            console.error("uBoxLengthScale is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uOrientation')){
        if(this.boundingBox.type==BoundingBoxType.cylinder) {
            this.shaderProgram.uniform["uOrientation"]
                (this.boundingBox.direction);
        }else{
            console.error("uOrientation is not supported for current bounding box type");
        }
    }
    if (this.shaderProgram.uniform.hasOwnProperty('uCubeAxes')){
        if(this.boundingBox.type==BoundingBoxType.cuboid) {
            this.shaderProgram.uniform["uCubeAxes"] // TODO is this the rigth order?
                (transpose3([this.boundingBox.v1,this.boundingBox.v2,this.boundingBox.v3].flat()));
        }else{
            console.error("uCubeAxes is not supported for current bounding box type");
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
            if(value === undefined) return; // modifier does not exist
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
 * @param {number} initCount number of textures bound before calling loadTextures
 */
Renderer.prototype.loadTextures = function(initCount) {
    let cnt = initCount;
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

/**@param {CglSceneLayer | undefined} targetLayer */
Renderer.prototype.prepareUniforms = function(targetLayer) {
    this.setUniforms();
    this.updateCoordinateUniforms();
    let texCount=0;
    if(targetLayer != null) {
        // set uniforms for rendering to targetLayer
        if(this.shaderProgram.uniform.hasOwnProperty('screenSize'))
            this.shaderProgram.uniform['screenSize']([targetLayer.iw,targetLayer.ih]);
        if(this.shaderProgram.uniform.hasOwnProperty('oldColorTex')) {
            gl.activeTexture(gl.TEXTURE0+texCount);
            gl.bindTexture(gl.TEXTURE_2D, targetLayer.colorTexture);
            this.shaderProgram.uniform['oldColorTex']([texCount]);//bind variable to texture 0
            texCount++;
        }
        if(this.shaderProgram.uniform.hasOwnProperty('oldDepthTex')) {
            gl.activeTexture(gl.TEXTURE0+texCount);
            gl.bindTexture(gl.TEXTURE_2D, targetLayer.depthTexture);
            this.shaderProgram.uniform['oldDepthTex']([texCount]);//bind variable to texture 1
            texCount++;
        }
    }
    this.loadTextures(texCount);
}
Renderer.prototype.updateCoordinateUniforms = function() {
    this.setCoordinateUniforms3D();
}

/**
 * runs shaderProgram on gl. Will render to texture in canvaswrapper
 * or if argument canvaswrapper is not given, then to glcanvas
 */
Renderer.prototype.render2d = function(a, b, sizeX, sizeY, boundingBox, plotModifiers, canvaswrapper) {
    Renderer.resetCachedState();
    Renderer.transparencyType = TransparencyType.Simple;
    this.boundingBox = boundingBox;
    if (!this.functionGenerationsOk()) { // only check functions once per shader program per drawCycle
        this.rebuild(true);
    } else {
        this.updateVertices();
    }

    enlargeCanvasIfRequired(sizeX, sizeY);
    if (canvaswrapper)
        gl.viewport(0, 0, sizeX, sizeY);
    else
        gl.viewport(0, glcanvas.height - sizeY, sizeX, sizeY);

    this.shaderProgram.use(gl);
    Renderer.prevShader = this.shaderProgram;
    this.prepareUniforms(null);
    // ? -> make part of initial renderer setup
    if (canvaswrapper) {
        canvaswrapper.bindFramebuffer(); //render to texture stored in canvaswrapper
        canvaswrapper.generation = ++canvaswrapper.canvas.generation;
    } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); //render to glcanvas
    }
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
    this.setBoundingBoxUniforms();
    this.setModifierUniforms(plotModifiers);

    // TODO should 2D-renderer use 3D-bounding box?
    if(this.boundingBox.type != BoundingBoxType.triangles) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);
    } else {
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/3);
    }
    gl.flush();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

/**
 * runs shaderProgram on gl. Will render to targetBuffer
 * or if argument targetBuffer is not given, then to glcanvas
 * @param {CglSceneLayer | null} targetLayer current rendering layer of null for simple rendering
 * @param {WebGLFramebuffer | null} targetBuffer current target frame buffer
 */
Renderer.prototype.render3d = function(sizeX, sizeY, boundingBox, plotModifiers, targetLayer,targetBuffer) {
    let shaderChanged = Renderer.prevShader !== this.shaderProgram;
    let needsRebuild = this.boundingBox.type !== boundingBox.type || (this.transparencyType !== Renderer.transparencyType);
    this.boundingBox = boundingBox;
    if (shaderChanged && (!this.functionGenerationsOk())) { // only check functions once per shader program per drawCycle
        this.rebuild(true);
    } else if(needsRebuild) {
        this.rebuild(false);
    } else if(CindyGL.projectionMatrix !== Renderer.prevProjection) {
        this.updateVertices();
        Renderer.prevProjection=CindyGL.projectionMatrix;
        Renderer.prevTrafo=undefined;
    } else if(shaderChanged || this.boundingBox.type === BoundingBoxType.triangles) {
        // TODO? don't update vertices for every shader change
        this.updateVertices();
    } else if(this.boundingBox.type !== Renderer.prevBoundingBoxType) {
        this.updateAttributes();
    }

    if( Renderer.prevSize[0] !== sizeX || Renderer.prevSize[1] !== sizeY ) {
        Renderer.prevSize=[sizeX,sizeY];
        enlargeCanvasIfRequired(sizeX, sizeY);
        if (targetBuffer)
            gl.viewport(0, 0, sizeX, sizeY);
        else
            gl.viewport(0, glcanvas.height - sizeY, sizeX, sizeY);
    }

    if(shaderChanged) {
        this.shaderProgram.use(gl);
        Renderer.prevShader = this.shaderProgram;
        this.prepareUniforms(targetLayer);
    // TODO is there a better way to detect change of coordinate system
    } else if(Renderer.prevTrafo!==CindyGL.trafoMatrix) {
        Renderer.prevTrafo = CindyGL.trafoMatrix;
        this.updateCoordinateUniforms();
    }
    this.setBoundingBoxUniforms();
    this.setModifierUniforms(plotModifiers);

    if(this.boundingBox.type != BoundingBoxType.triangles) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertices.length/3);
    } else {
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length/3);
    }
    if(targetBuffer) {
        gl.flush(); //renders stuff to targetBuffer
    }
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
    this.loadTextures(0);

    // Binds the necessary framebuffer object.
    CindyJS._pluginRegistry.CindyXR.xrUpdateCindyGLView(gl, viewIndex);

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

////////////////////////////////////////////
// Scene renderers
// TODO? move to seperate file
////////////////////////////////////////////
// interface Cgl3dSceneRenderer:
// functions:
//   constructor(iw: float, ih: float, ...) -> Cgl3dSceneRenderer
//   renderOpaque(objects: Map<number,CindyGL3DObject>)
//   renderTranslucent(objects: Map<number,CindyGL3DObject>)
// fields:
//  wrongOpacity: Set<CindyGL3DObject>

/**
 * @param {number} iw screen width
 * @param {number} ih screen height
 * @constructor
 */
function Cgl3dSimpleSceneRenderer(iw,ih) {
    Renderer.transparencyType = TransparencyType.Simple;
    this.iw = iw;
    this.ih = ih;
    /** @type {Set<CindyGL3DObject>} */
    this.wrongOpacity = new Set();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); // unbind previous frame-buffer
};

/**@param {Map<number,CindyGL3DObject>} objects */
Cgl3dSimpleSceneRenderer.prototype.renderOpaque = function(objects) {
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND); // no need to blend opaque objects
    objects.forEach((obj3d)=>{
        obj3d.renderer.render3d(this.iw, this.ih,obj3d.boundingBox,obj3d.plotModifiers,null, null);
        if(!obj3d.renderer.opaque){
            this.wrongOpacity.add(obj3d);
        }
    });
};
/**@param {Map<number,CindyGL3DObject>} objects */
Cgl3dSimpleSceneRenderer.prototype.renderTranslucent = function(objects) {
    // reenable blending
    gl.enable(gl.BLEND);
    objects.forEach((obj3d)=>{
        obj3d.renderer.render3d(this.iw, this.ih,obj3d.boundingBox,obj3d.plotModifiers,null, null);
    });
};

/**
 * @param {number} iw screen width
 * @param {number} ih screen height
 * @param {boolean} isDepth
 * @returns {WebGLTexture}
*/
function createRenderTexture(iw,ih,isDepth) {
    const texturePool = isDepth ?
        CglSceneLayer.depthTexturePool : CglSceneLayer.colorTexturePool;
    let texture;
    if(iw == CglSceneLayer.iw && ih == CglSceneLayer.ih && texturePool.length > 0) {
        return texturePool.pop();
    }
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if(isDepth) {
        gl.texImage2D(gl.TEXTURE_2D, 0, getDepthPixelFormat(), iw, ih, 0, getDepthPixelBaseFormat(),
             getPixelType(), createPixelArray(iw*ih*getDepthPixelSize()));
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, getPixelFormat(), iw, ih, 0, gl.RGBA, getPixelType(), createPixelArray(4*iw*ih));
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}
/**
 * @param {number} iw screen width
 * @param {number} ih screen height
 * @returns {WebGLTexture}
*/
function createDepthBuffer(iw,ih){
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    if(can_use_texture_float) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, iw, ih, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, iw, ih, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
}
/**
 * @param {number} iw screen width
 * @param {number} ih screen height
 * @constructor
 */
function CglSceneLayer(iw,ih) {
    this.iw = iw;
    this.ih = ih;
    this.colorTexture = createRenderTexture(iw,ih,false);
    this.depthTexture = createRenderTexture(iw,ih,true);
    // clear textures
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.depthTexture, 0);
    gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 0.0]);
    gl.clearBufferfv(gl.COLOR, 1, [1.0, 0.0, 0.0, 0.0]); // clear depth to 1
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]); // mark both textures as output
}
CglSceneLayer.iw = 0;
CglSceneLayer.ih = 0;
CglSceneLayer.colorTexturePool = [];
CglSceneLayer.depthTexturePool = [];
/**
 * @param {number} iw
 * @param {number} ih
 *  */
CglSceneLayer.updateScreenSize = function(iw,ih) {
    if(iw == CglSceneLayer.iw && ih == CglSceneLayer.ih)
        return;
    // size changed -> clear texture pool
    // TODO? allow multiple texture sizes
    CglSceneLayer.colorTexturePool.forEach(t=>gl.deleteTexture(t));
    CglSceneLayer.colorTexturePool=[];
    CglSceneLayer.depthTexturePool.forEach(t=>gl.deleteTexture(t));
    CglSceneLayer.depthTexturePool=[];
    CglSceneLayer.iw = iw;
    CglSceneLayer.ih = ih;
}
/**@param {WebGLTexture} texture */
CglSceneLayer.freeColorTexture = function(texture) {
    CglSceneLayer.colorTexturePool.push(texture);
}
/**@param {WebGLTexture} texture */
CglSceneLayer.freeDepthTexture = function(texture) {
    CglSceneLayer.depthTexturePool.push(texture);
}
/**
 * @param {number} iw screen width
 * @param {number} ih screen height
 * @param {number} layerCount
 * @constructor
 */
function Cgl3dLayeredSceneRenderer(iw,ih,layerCount) {
    if(!(layerCount >= 1)){ // negated condition to correctly handle NaN values
        console.warn("invalid layerCount should be >= 1 got:",layerCount);
        layerCount = 1;
    }
    CglSceneLayer.updateScreenSize(iw,ih);
    layerCount = Math.floor(layerCount);
    Renderer.transparencyType = layerCount == 1 ? TransparencyType.SingleLayer : TransparencyType.MultiLayer;
    this.iw = iw;
    this.ih = ih;
    /** @type {Set<CindyGL3DObject>} */
    this.wrongOpacity = new Set();
    this.mergeBuffer = gl.createFramebuffer();
    this.renderBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderBuffer);
    gl.disable(gl.BLEND); // disable automatic blending
    this.renderDepthBuffer =  createDepthBuffer(iw,ih);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.renderDepthBuffer, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    this.layers=[];
    for(let layer=0;layer<layerCount;layer++){
        this.layers.push(new CglSceneLayer(iw,ih));
    }
    if (layerCount > 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.mergeBuffer);
        // temporary memory for texture sorting
        this.tmpLayers = [new CglSceneLayer(iw,ih),new CglSceneLayer(iw,ih)];
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tmpLayers[0].colorTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.tmpLayers[0].depthTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, this.tmpLayers[1].colorTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, gl.TEXTURE_2D, this.tmpLayers[1].depthTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderBuffer);
        // TODO check if framebuffer is complere
    } else {
        this.tmpLayers = [];
    }
    this.renderLayer = new CglSceneLayer(iw,ih);
    // TODO check if framebuffer is complere
};

/** @param {CglSceneLayer} newRenderLayer */
Cgl3dLayeredSceneRenderer.prototype.swapRenderLayer = function(newRenderLayer) {
    const oldRenderLayer = this.renderLayer;
    this.renderLayer = newRenderLayer;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, newRenderLayer.colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, newRenderLayer.depthTexture, 0);
    // copy data from old layer into new layer
    copyLayer(oldRenderLayer);
    return oldRenderLayer;
}
/**
 * @param {number} tmpSlot
 * @param {CglSceneLayer} newTmpLayer */
Cgl3dLayeredSceneRenderer.prototype.swapTmpLayer = function(tmpSlot,newTmpLayer) {
    const oldTmpLayer = this.tmpLayers[tmpSlot];
    this.tmpLayers[tmpSlot] = newTmpLayer;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0+2*tmpSlot, gl.TEXTURE_2D, newTmpLayer.colorTexture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1+2*tmpSlot, gl.TEXTURE_2D, newTmpLayer.depthTexture, 0);
    return oldTmpLayer;
}

/**@param {Map<number,CindyGL3DObject>} objects */
Cgl3dLayeredSceneRenderer.prototype.renderOpaque = function(objects) {
    objects.forEach((obj3d)=>{
        obj3d.renderer.render3d(this.iw, this.ih,obj3d.boundingBox,obj3d.plotModifiers, null, this.renderBuffer);
        if(!obj3d.renderer.opaque){
            this.wrongOpacity.add(obj3d);
        }
    });
    gl.depthMask(false); // keep depth-buffer unchanged (holds depth of clostest opaque pixel)
    // move rendered data to opaque,layer and layers[0]
    this.layers[0] = this.swapRenderLayer(this.layers[0]);
};
/**@param {Map<number,CindyGL3DObject>} objects */
Cgl3dLayeredSceneRenderer.prototype.renderTranslucent = function(objects) {
    const layerCount = this.layers.length;
    // TODO? seperate out opaque objects (objects between opaque object and top pixel in lowest transparent layer will get lost)
    //  is this worth using an extra layer
    if (layerCount == 1) {
        // directly render objects to canvas
        objects.forEach((obj3d)=>{
            if(obj3d.renderer.opaque) {
                this.wrongOpacity.add(obj3d);
            }
            // cannot read and write to same texture in one shader call
            // 1. render to renderLayer with layers[0] as input
            Renderer.prevShader = undefined; // clear cached shader data
            obj3d.renderer.render3d(this.iw, this.ih,obj3d.boundingBox,obj3d.plotModifiers,this.layers[0], this.renderBuffer);
            // 2. swap rendered layer with layer[0]
            gl.disable(gl.CULL_FACE);// don't cull faces while swapping layers
            this.layers[0] = this.swapRenderLayer(this.layers[0]);
        });
    } else {
        objects.forEach((obj3d)=>{
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.renderBuffer);
            gl.enable(gl.DEPTH_TEST); // ignore pixels behind opaque objects
            // reset and clear render layer
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.renderLayer.colorTexture, 0);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, this.renderLayer.depthTexture, 0);
            gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
            gl.clearBufferfv(gl.COLOR, 1, [1, 0, 0, 0]); // clear depth-texture to 1
            Renderer.prevShader = undefined; // clear cached shader data
            obj3d.renderer.render3d(this.iw, this.ih,obj3d.boundingBox,obj3d.plotModifiers,null, this.renderBuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.mergeBuffer);
            gl.disable(gl.DEPTH_TEST); // no depth-testing during texture sorting
            gl.disable(gl.CULL_FACE); // don't cull faces while sorting layers
            // ensure all four drawBuffers are linked to framebuffer
            gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1,gl.COLOR_ATTACHMENT2,gl.COLOR_ATTACHMENT3]);
            /* TODO? sort/merge multiple layers in a single call
                limits:
                output: 4: guaranteed ; 6: 96.74%  8: 95.19%
                    (source: https://web3dsurvey.com/webgl2/parameters/MAX_DRAW_BUFFERS)
                input: 8: ~100% ; 16: 99.96%
                    (source: https://web3dsurvey.com/webgl2/parameters/MAX_TEXTURE_IMAGE_UNITS)
                -> 2layers input/output should work, very likely that 3 and 4 also work
                more than layers 4 at once unlikely (unless depth textures are merged)
            */
            for(let i=0;i<layerCount-1;i++){
                sortLayers(this.layers[i],this.renderLayer,false); // move closer pixel to left texture
                this.layers[i]=this.swapTmpLayer(0,this.layers[i]);
                this.renderLayer=this.swapTmpLayer(1,this.renderLayer);
            }
            gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);// removed unused drawBuffers
            sortLayers(this.layers[layerCount-1],this.renderLayer,true); // merge textures depending on relative depth
            this.layers[layerCount-1]=this.swapTmpLayer(0,this.layers[layerCount-1]);
            if(obj3d.renderer.opaque){
                this.wrongOpacity.add(obj3d);
            }
        });
    }
    // TODO? render multiple layers in a single call
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.depthMask(true); // reset depth masking
    gl.enable(gl.BLEND);
    for(let layerId = layerCount-1;layerId>=0;layerId--) {
        renderLayer(this.layers[layerId]); // TODO? ability to select which layers should be rendered
        // cleaup textures
        CglSceneLayer.freeColorTexture(this.layers[layerId].colorTexture);
        CglSceneLayer.freeDepthTexture(this.layers[layerId].depthTexture);
    }
    if(this.renderLayer !== this.layers[0]) {
        CglSceneLayer.freeColorTexture(this.renderLayer.colorTexture);
        CglSceneLayer.freeDepthTexture(this.renderLayer.depthTexture);
    }
    this.tmpLayers.forEach(layer=>{
        CglSceneLayer.freeColorTexture(layer.colorTexture);
        CglSceneLayer.freeDepthTexture(layer.depthTexture);
    });
    // TODO? reuse depth buffer texture
    gl.deleteTexture(this.renderDepthBuffer);
};
/**
 *  @param {CglSceneLayer} layer1
 *  @param {CglSceneLayer} layer2
 *  @param {boolean} merge   */
function sortLayers(layer1,layer2,merge){
    const typeSuffix = can_use_texture_float ? "" : "2I8";
    let renderShader = new ShaderProgram(gl, cgl_resources["copytexture_v"],cgl_resources[ (merge ? "fragMergeLayers" : "fragSortLayers")+typeSuffix]);
    renderShader.use(gl);
    const aPosLoc = gl.getAttribLocation(renderShader.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    const aTexLoc = gl.getAttribLocation(renderShader.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);
    // create vertex data
    const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const texCoordOffset = vertices.byteLength;
    const totalBufferSize = texCoordOffset + texCoords.byteLength;
    gl.bufferData(gl.ARRAY_BUFFER, totalBufferSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
    // attach texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,layer1.colorTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,layer1.depthTexture);
    renderShader.uniform['src1Color']([0]);
    renderShader.uniform['src1Depth']([1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D,layer2.colorTexture);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D,layer2.depthTexture);
    renderShader.uniform['src2Color']([2]);
    renderShader.uniform['src2Depth']([3]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
    // TODO swap source and target textures
}
/** @param {CglSceneLayer} layerData  */
function copyLayer(layerData){
    const typeSuffix = can_use_texture_float ? "" : "2I8";
    let renderShader = new ShaderProgram(gl, cgl_resources["copytexture_v"], cgl_resources["fragCopyLayer"+typeSuffix]);
    renderShader.use(gl);
    const aPosLoc = gl.getAttribLocation(renderShader.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    const aTexLoc = gl.getAttribLocation(renderShader.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);
    // create vertex data
    const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const texCoordOffset = vertices.byteLength;
    const totalBufferSize = texCoordOffset + texCoords.byteLength;
    gl.bufferData(gl.ARRAY_BUFFER, totalBufferSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
    // attach texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,layerData.colorTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,layerData.depthTexture);
    renderShader.uniform['srcColor']([0]);
    renderShader.uniform['srcDepth']([1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
}
/** @param {CglSceneLayer} layerData  */
function renderLayer(layerData) {
    let renderShader = new ShaderProgram(gl, cgl_resources["copytexture_v"], cgl_resources["copytexture_f"]);
    renderShader.use(gl);
    const aPosLoc = gl.getAttribLocation(renderShader.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    const aTexLoc = gl.getAttribLocation(renderShader.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);
    // create vertex data
    const vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    const texCoordOffset = vertices.byteLength;
    const totalBufferSize = texCoordOffset + texCoords.byteLength;
    gl.bufferData(gl.ARRAY_BUFFER, totalBufferSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
    // attach texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,layerData.colorTexture);
    // depth information is not needed for final rendering (pixels are already sorted)
    renderShader.uniform['sampler']([0]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush();
}
