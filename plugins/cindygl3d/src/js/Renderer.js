const BoundingBoxType = {
    none: 0, // full screen
    // XXX? add support for bounding boxes to 2D-mode?
    // rect: 1, // draw on rectange [vec2,vec2]
    sphere: 2, // draw on bounding cube of sphere [vec3,float]
    cylinder: 3, // draw in bounding cuboid of cylinder [vec3,vec3,float]
    // XXX polygon
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

// remember previous values to detect changes
Renderer.prevBoundingBoxType = undefined;
Renderer.prevShader = undefined;
Renderer.prevTrafo = undefined;
Renderer.prevSize = [0,0];
Renderer.resetCachedState = function(){
    Renderer.prevBoundingBoxType = undefined;
    Renderer.prevShader = undefined;
    Renderer.prevTrafo = undefined;
    Renderer.prevSize = [0,0];
};

/**
 * param {TODO} expression for the Code that will be used for rendering
 * @constructor
 */
function Renderer(api, expression,depthType) {
    this.api = api;
    this.expression = expression;
    this.depthType=depthType;
    this.boundingBox=Renderer.noBounds();
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


/** @type {CanvasWrapper} */
Renderer.prototype.canvaswrapper

Renderer.prototype.recompile = function() {
    console.log("recompile");
    this.expression.cb = new CodeBuilder(this.api);
    this.expression.cpg = this.expression.cb.generateColorPlotProgram(this.expression);
    this.expression.iscompiled = true; //Note we are adding attributes to the parsed cindyJS-Code tree
    this.expression.compiletime = requiredcompiletime;
}
Renderer.prototype.rebuild = function(forceRecompile) {
    console.log("rebuild");
    if(forceRecompile|| !this.expression.iscompiled || this.expression.compiletime < requiredcompiletime){
        this.recompile();
    }
    if(this.expression.cpg===undefined){
        console.error("cpg is undefined");
    }
    // TODO? use different header for fshader depending on box type
    this.fragmentShaderCode =
        cgl3d_resources["standardFragmentHeader"] + this.expression.cb.generateShader(this.expression.cpg,this.depthType);
    // TODO? share vertex attributes between different shader objects
    if(CindyGL3D.mode3D){
        let x0=CindyGL3D.coordinateSystem.x0;
        let x1=CindyGL3D.coordinateSystem.x1;
        let y0=CindyGL3D.coordinateSystem.y0;
        let y1=CindyGL3D.coordinateSystem.y1;
        let z1=CindyGL3D.coordinateSystem.z1;
        if(this.boundingBox.type == BoundingBoxType.none){
            this.vertexShaderCode = cgl3d_resources["vshader3d"];
            this.vertices = new Float32Array([x0,y0,z1, x1,y0,z1, x0,y1,z1, x1,y1,z1]);
        }else if(this.boundingBox.type==BoundingBoxType.sphere){
            this.vertexShaderCode = cgl3d_resources["vshader3dSphere"];
            this.vertices = new Float32Array([-1, -1, 1, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
        }else if(this.boundingBox.type==BoundingBoxType.cylinder){
            this.vertexShaderCode = cgl3d_resources["vshader3dCylinder"];
            // TODO? how to encode vertices for cylinder
            this.vertices = new Float32Array([-1, -1, 1, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
        }else{
            console.error("unsupported bounding box type: ",this.boundingBox.type);
            this.vertexShaderCode = cgl3d_resources["vshader3d"];
            this.vertices = new Float32Array([x0,y0,z1, x1,y0,z1, x0,y1,z1, x1,y1,z1]);
        }
    }else{
        this.vertexShaderCode = cgl3d_resources["vshader"];
        this.vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    }
    // TODO split creating of shader program and updating of attributes
    this.shaderProgram = new ShaderProgram(gl, this.vertexShaderCode, this.fragmentShaderCode);
    this.updateAttributes();
};
Renderer.prototype.updateAttributes = function() {
    Renderer.prevBoundingBoxType=this.boundingBox.type;
    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

    var texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    var texCoordOffset = this.vertices.byteLength;
    let totalBufferSize = texCoordOffset;

    var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
    if(aTexLoc!=-1){ // aTexCoord may get optimized out
        gl.enableVertexAttribArray(aTexLoc);
        totalBufferSize+=texCoords.byteLength;
    }

    gl.bufferData(gl.ARRAY_BUFFER, totalBufferSize, gl.STATIC_DRAW);

    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    if(aTexLoc!=-1){ // aTexCoord may get optimized out
        gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
        gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
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

Renderer.prototype.setUniforms = function() {
    function setUniform(setter, t, val) {
        if (!setter) return; //skip inactive uniforms

        if (typeof(setter) === 'function') {
            switch (t) {
                case type.complex:
                    setter([val['value']['real'], val['value']['imag']]);
                    break;
                case type.bool:
                    if (val['value'])
                        setter([1]);
                    else
                        setter([0]);
                    break;
                case type.int:
                case type.float:
                    setter([val['value']['real']]);
                    break;
                case type.point:
                case type.line:
                    if (val.ctype === 'geo')
                        setter(val['value']['homog']['value'].map(x => x['value']['real']));
                    else if (val.ctype === 'list' && val['value'].length === 2)
                        setter(val['value'].map(x => x['value']['real']).concat([1]));
                    else if (val.ctype === 'list' && val['value'].length === 3)
                        setter(val['value'].map(x => x['value']['real']));
                    break;
                default:
                    if (t.type === 'list' && t.parameters === type.float) { //float-list
                        setter(val['value'].map(x => x['value']['real']));
                        break;
                    } else if (t.type === 'list' && t.parameters.type === 'list' && t.parameters.parameters === type.float) { //float matrix
                        //probably: if isnativeglsl?
                        let m = [];
                        for (let j = 0; j < t.length; j++)
                            for (let i = 0; i < t.parameters.length; i++)
                                m.push(val['value'][j]['value'][i]['value']['real']);
                        setter(m);
                        break;
                    }

                    console.error(`Don't know how to set uniform of type ${typeToString(t)}, to ${val}`);
                    break;
            }
        } else if (t.type === 'list') {

            let d = depth(t);
            let fp = finalparameter(t);
            if (d === 1 && fp === type.float) {
                let n = t.length;
                let s = sizes(n);

                let cum = 0;
                for (let k in s) {
                    setUniform(setter[`a${k}`], type.vec(s[k]), {
                        'ctype': 'list',
                        'value': range(s[k]).map(l => val['value'][cum + l])
                    });
                    cum += s[k];
                }
                return;
            }
            for (let k = 0; k < t.length; k++) {
                setUniform(setter[`a${k}`], t.parameters, {
                    'ctype': 'list',
                    'value': val['value'][k]['value']
                });
            }
            return;
        } else {
            console.error(`Don't know how to set uniform of type ${typeToString(t)}, to`);
            console.log(val);
        }
    }


    for (let uname in this.expression.cpg.uniforms) {

        let val = this.api.evaluateAndVal(this.expression.cpg.uniforms[uname].expr);
        let t = this.expression.cpg.uniforms[uname].type;

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
    for (let t in this.expression.cpg.texturereaders) {
        gl.activeTexture(gl.TEXTURE0 + cnt);

        let tr = this.expression.cpg.texturereaders[t];
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
    for (let fname in this.expression.cpg.generations) {
        if (this.api.getMyfunction(fname).generation > this.expression.cpg.generations[fname]) {
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
Renderer.prototype.render = function(a, b, sizeX, sizeY, boundingBox, canvaswrapper) {
    let needsRebuild=this.boundingBox.type!=boundingBox.type;
    this.boundingBox=boundingBox;
    if ((Renderer.prevShader!==this.shaderProgram) // only check functions once per shader program per drawCycle
            && (!this.functionGenerationsOk())){
        this.rebuild(true);
    }else if(needsRebuild){
        this.rebuild(false);
    }else if(this.boundingBox.type!=Renderer.prevBoundingBoxType){
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
    this.setBoundingBoxUniforms(); // TODO? only change if bounding box is different

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if(!CindyGL3D.mode3D)
        gl.flush(); //renders stuff to canvaswrapper

    /* render on glcanvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();
  */
}


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
    this.setTransformMatrices3D();
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
