/**
 * param {TODO} expression for the Code that will be used for rendering
 * @constructor
 */
function Renderer(api, expression) {
    this.api = api;
    this.expression = expression;
    this.rebuild();
}

//////////////////////////////////////////////////////////////////////
// Members of the prototype objects

/**
 * List of uniforms that are required in cpg-prog
 * @type {Object}
 */
Renderer.prototype.cpguniforms;

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
Renderer.prototype.canvaswrapper;

/** @type {Object.<TextureReader>} */
Renderer.prototype.texturereaders;

/**
 * The generation of the current compiled myfunctions
 * @type {Object.<number>}
 */
Renderer.prototype.generations;

Renderer.prototype.rebuild = function () {
    let cb = new CodeBuilder(this.api);
    let cpg = cb.generateColorPlotProgram(this.expression);
    this.cpguniforms = cpg.uniforms;
    this.texturereaders = cpg.texturereaders;
    this.generations = cpg.generations;

    this.fragmentShaderCode =
        cgl_resources["standardFragmentHeader"] + cpg.code;
    this.vertexShaderCode = cgl_resources["vshader"];
    this.shaderProgram = new ShaderProgram(
        gl,
        this.vertexShaderCode,
        this.fragmentShaderCode
    );

    /*
     *    gl.bindBuffer(gl.ARRAY_BUFFER, this.ssArrayBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER, new Float32Array([
          1,  1,  1, 1,
          -1,  1, 0, 1,
          1, -1,  1, 0,
          -1, -1, 0, 0]),
        gl.STATIC_DRAW);
      this.textureQuadProgram = new ShaderProgram(
        gl, c3d_resources.texq_vert, c3d_resources.texq_frag);
      this.textureQuadAttrib = gl.getAttribLocation(l
        this.textureQuadProgram.handle, "aPos");*/
    var posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

    var vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);

    var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);

    var texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    var texCoordOffset = vertices.byteLength;

    gl.bufferData(
        gl.ARRAY_BUFFER,
        texCoordOffset + texCoords.byteLength,
        gl.STATIC_DRAW
    );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
};

/**
 * @param {Array.<number>} m
 * @return {Array.<number>}
 */
function transpose3(m) {
    return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

/**
 * sets uniform transformMatrix such that it represents an affine trafo with (0,0)->a, (1,0)->b, (0,1)->c
 */
Renderer.prototype.setTransformMatrix = function (a, b, c) {
    let m = [b.x - a.x, c.x - a.x, a.x, b.y - a.y, c.y - a.y, a.y, 0, 0, 1];
    if (this.shaderProgram.uniform.hasOwnProperty("transformMatrix"))
        this.shaderProgram.uniform["transformMatrix"](transpose3(m));
};

Renderer.prototype.setUniforms = function () {
    function setUniform(setter, t, val) {
        if (!setter) return; //skip inactive uniforms

        if (typeof setter === "function") {
            switch (t) {
                case type.complex:
                    setter([val["value"]["real"], val["value"]["imag"]]);
                    break;
                case type.bool:
                    if (val["value"]) setter([1]);
                    else setter([0]);
                    break;
                case type.int:
                case type.float:
                    setter([val["value"]["real"]]);
                    break;
                case type.point:
                case type.line:
                    if (val.ctype === "geo")
                        setter(
                            val["value"]["homog"]["value"].map(
                                (x) => x["value"]["real"]
                            )
                        );
                    else if (val.ctype === "list" && val["value"].length === 2)
                        setter(
                            val["value"]
                                .map((x) => x["value"]["real"])
                                .concat([1])
                        );
                    else if (val.ctype === "list" && val["value"].length === 3)
                        setter(val["value"].map((x) => x["value"]["real"]));
                    break;
                default:
                    if (t.type === "list" && t.parameters === type.float) {
                        //float-list
                        setter(val["value"].map((x) => x["value"]["real"]));
                        break;
                    } else if (
                        t.type === "list" &&
                        t.parameters.type === "list" &&
                        t.parameters.parameters === type.float
                    ) {
                        //float matrix
                        //probably: if isnativeglsl?
                        let m = [];
                        for (let j = 0; j < t.length; j++)
                            for (let i = 0; i < t.parameters.length; i++)
                                m.push(
                                    val["value"][j]["value"][i]["value"]["real"]
                                );
                        setter(m);
                        break;
                    }

                    console.error(
                        `Don't know how to set uniform of type ${typeToString(
                            t
                        )}, to ${val}`
                    );
                    break;
            }
        } else if (t.type === "list") {
            let d = depth(t);
            let fp = finalparameter(t);
            if (d === 1 && fp === type.float) {
                let n = t.length;
                let s = sizes(n);

                let cum = 0;
                for (let k in s) {
                    setUniform(setter[`a${k}`], type.vec(s[k]), {
                        ctype: "list",
                        value: range(s[k]).map((l) => val["value"][cum + l]),
                    });
                    cum += s[k];
                }
                return;
            }
            for (let k = 0; k < t.length; k++) {
                setUniform(setter[`a${k}`], t.parameters, {
                    ctype: "list",
                    value: val["value"][k]["value"],
                });
            }
            return;
        } else {
            console.error(
                `Don't know how to set uniform of type ${typeToString(t)}, to`
            );
            console.log(val);
        }
    }

    for (let uname in this.cpguniforms) {
        let val = this.api.evaluateAndVal(this.cpguniforms[uname].expr);
        let t = this.cpguniforms[uname].type;

        if (!issubtypeof(constant(val), t)) {
            console.log(
                `Type of ${uname} changed (${typeToString(
                    constant(val)
                )} is no subtype of  ${typeToString(t)}); forcing rebuild.`
            );
            this.rebuild();
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
        ["rnd_", () => [Math.random()]],
        [
            `_lowerleft`,
            () => {
                let pt = computeLowerLeftCorner(this.api);
                return [pt.x, pt.y];
            },
        ],
        [
            `_lowerright`,
            () => {
                let pt = computeLowerRightCorner(this.api);
                return [pt.x, pt.y];
            },
        ],
    ].map(
        (a) =>
            this.shaderProgram.uniform[a[0]] &&
            this.shaderProgram.uniform[a[0]](a[1]())
    );
};

/**
 * Activates, loads textures and sets corresponding sampler uniforms
 */
Renderer.prototype.loadTextures = function () {
    let cnt = 0;
    for (let t in this.texturereaders) {
        gl.activeTexture(gl.TEXTURE0 + cnt);

        let tr = this.texturereaders[t];
        let tname = tr.name;

        let properties = tr.properties;
        let cw = tr.returnCanvaswrapper();

        cw.reloadIfRequired();
        cw.bindTexture();
        [
            [`_sampler${tname}`, [cnt]],
            [`_ratio${tname}`, [cw.sizeX / cw.sizeY]],
            [`_cropfact${tname}`, [cw.sizeX / cw.sizeXP, cw.sizeY / cw.sizeYP]],
        ].map(
            (a) =>
                this.shaderProgram.uniform[a[0]] &&
                this.shaderProgram.uniform[a[0]](a[1])
        );
        cnt++;
    }
};

/**
 * checks whether the generation of the compiled myfunctions is still the current one
 */
Renderer.prototype.functionGenerationsOk = function () {
    for (let fname in this.generations) {
        if (
            this.api.getMyfunction(fname).generation > this.generations[fname]
        ) {
            console.log(`${fname} is outdated; forcing rebuild.`);
            return false;
        }
    }
    return true;
};

/**
 * runs shaderProgram on gl. Will render to texture in canvaswrapper
 * or if argument canvaswrapper is not given, then to glcanvas
 */
Renderer.prototype.render = function (a, b, sizeX, sizeY, canvaswrapper) {
    if (!this.functionGenerationsOk()) this.rebuild();
    let alpha = sizeY / sizeX;
    let n = {
        x: -(b.y - a.y) * alpha,
        y: (b.x - a.x) * alpha,
    };
    let c = {
        x: a.x + n.x,
        y: a.y + n.y,
    };
    //let d = {x: b.x + n.x, y: b.y + n.y};

    enlargeCanvasIfRequired(sizeX, sizeY);
    if (canvaswrapper) gl.viewport(0, 0, sizeX, sizeY);
    else gl.viewport(0, glcanvas.height - sizeY, sizeX, sizeY);

    this.shaderProgram.use(gl);
    this.setUniforms();
    this.setTransformMatrix(a, b, c);
    this.loadTextures();

    if (canvaswrapper) {
        canvaswrapper.bindFramebuffer(); //render to texture stored in canvaswrapper
        canvaswrapper.generation = ++canvaswrapper.canvas.generation;
    } else gl.bindFramebuffer(gl.FRAMEBUFFER, null); //render to glcanvas
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush(); //renders stuff to canvaswrapper

    /* render on glcanvas
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();
  */
};

/**
 * For use with CindyXR.
 */

Renderer.prototype.renderXR = function (viewIndex) {
    if (viewIndex == 0) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Attribute locations might be changed by OpenXR.
        this.resetAttribLocations();
    }

    if (!this.functionGenerationsOk()) this.rebuild();

    this.shaderProgram.use(gl);
    this.setUniforms();
    // Transform texture coordinates to [-1,1]^2.
    this.setTransformMatrix(
        {
            x: -1,
            y: -1,
        },
        {
            x: 1,
            y: -1,
        },
        {
            x: -1,
            y: 1,
        }
    );
    this.loadTextures();

    // Binds the necessary framebuffer object.
    CindyJS._pluginRegistry.CindyXR.xrUpdateCindyGLView(gl, viewIndex);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.flush(); //renders stuff to canvaswrapper
};

Renderer.prototype.resetAttribLocations = function () {
    var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);

    var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);

    var texCoordOffset = 4 * 3 * 4; // 4 vertices, 3 entries, 4 bytes per entry

    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
};
