/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Polynomial} polynomial
 * @param {number} depth
 * @implements {Stage}
 */
function Surface(stategl, polynomial, depth) {
    stategl.getExtension("OES_texture_float");
    var gl = stategl.gl;
    if (gl.getSupportedExtensions().indexOf("WEBGL_color_buffer_float") !== -1)
        stategl.getExtension("WEBGL_color_buffer_float");

    // test whether readPixels works for float textures
    this.mkTextures(stategl);
    var pixels = stategl.readTexture(this.texturesIn[0]);
    if (pixels === null) {
        console.log('Reading from float textures not supported.');
        console.log('Please try another browser or platform.');
        return;
    }

    this.polynomial = polynomial;
    this.depth = depth;
    var surface = this;
    var p = surface.polynomial;
    var vars = p.variableList();
    var vy = vars.length === 0 ? "y" : vars[vars.length - 1];
    surface.sheets = p.degree(vy);
    surface.commonShaderSrc = resources["Common.glsl"];
    surface.customShaderSrc = GLSL.polynomialShaderSource(polynomial);
    surface.texturesShaderSrc = resources["Textures.glsl"];
    surface.initial = new Initial(stategl, surface);
    surface.initial.render(stategl, surface, gl);
    surface.subdivisionPre = new SubdivisionPre(stategl, surface);
    surface.subdivision = new Subdivision(stategl, surface);
    for (var i = 0; i < surface.depth; i++) {
        surface.subdivisionPre.render(stategl, surface, gl);
        surface.subdivision.render(stategl, surface, gl);
    }
    surface.assembly = new Assembly(stategl, surface);
    surface.assembly.render(stategl, surface, gl);
    surface.mkProgram(stategl);
    var canvas = gl.canvas;
    gl.viewport(0, 0, canvas.width, canvas.height);
}

/** @type {string} */
Surface.prototype.commonShaderSrc = "";

/** @type {string} */
Surface.prototype.customShaderSrc = "";

/**
 * @param {StateGL} stategl
 * @param {boolean=} big
 * @return {Array<string>}
 */
Surface.prototype.domainColouring = function(stategl, big = false) {
    return Export.domainColouring(this.polynomial, stategl, big);
};

/**
 * @param {StateGL} stategl
 * @param {string=} name
 */
Surface.prototype.exportBinary = function(stategl, name = "surface.bin") {
    var url = stategl.textureToURL(this.texturesIn[0], 4 * this.numIndices);
    Export.download(name, url);
};

/**
 * @param {StateGL} stategl
 * @param {string} name
 * @param {boolean=} big
 */
Surface.prototype.exportDomainColouring = function(stategl, name = "sheet", big = true) {
    Export.exportDomainColouring(this.polynomial, stategl, name, big);
};

/**
 * @param {StateGL} stategl
 * @param {string=} name
 * @param {boolean=} big
 */
Surface.prototype.exportSurface = function(stategl, name = "surface", big = true) {
    var texture = this.texturesIn[0];
    var length = 4 * this.numIndices;
    var pixels = /** @type {Float32Array} */
        (stategl.readTexture(texture, length));
    Export.exportSurface(stategl, pixels, name, big);
};

/** @type {WebGLFramebuffer} */
Surface.prototype.frameBuffer = null;

/** @param {StateGL} stategl */
Surface.prototype.fillIndexBuffer = function(stategl) {
    var gl = stategl.gl;
    var indices = [];
    for (var i = 0; i < this.numIndices; i++)
        indices[i] = i;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
};

/** @type {WebGLFramebuffer} */
Surface.prototype.framebuffer = null;

/** @type {WebGLBuffer} */
Surface.prototype.indexBuffer = null;

/** @param {StateGL} stategl */
Surface.prototype.mkProgram = function(stategl) {
    var sources = StateGL.getShaderSources("Surface");
    sources[0] = this.withTextures(sources[0]);
    sources[1] = this.withCustomAndCommon(sources[1]);
    this.program = stategl.mkProgram(sources);
};

/** @param {StateGL} stategl */
Surface.prototype.mkTextures = function(stategl) {
    var gl = stategl.gl,
        texturesIn = [],
        texturesOut = [];
    for (var i = 0; i < 5; i++) {
        texturesIn[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texturesIn[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
        texturesOut[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texturesOut[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.texturesIn = texturesIn;
    this.texturesOut = texturesOut;
};

/** @type {number} */
Surface.prototype.numIndices = 0;

/** @type {WebGLProgram} */
Surface.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {WebGLRenderingContext} gl
 * @param {State3D} state3d
 */
Surface.prototype.render = function(stategl, gl, state3d) {
    if (!this.program)
        return;
    gl.useProgram(this.program);
    stategl.updateClipping();
    stategl.updateModelViewProjectionMatrices(state3d);
    stategl.updateTransparency();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texturesIn[0]);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var samplerLocation = gl.getUniformLocation(this.program, 'sampler');
    gl.uniform1i(samplerLocation, 0);

    this.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, this.numIndices);
    stategl.updateTransparency(false);
};

/** @type {number} */
Surface.prototype.sheets = 0;

/** @type {Array<WebGLTexture>} */
Surface.prototype.texturesIn = [];

/** @type {Array<WebGLTexture>} */
Surface.prototype.texturesOut = [];

/** @type {string} */
Surface.prototype.texturesShaderSrc = "";

/**
 * @param {string} src
 * @return {string}
 */
Surface.prototype.withTextures = function(src) {
    return [this.texturesShaderSrc, src].join("\n");
};

/**
 * @param {string} src
 * @return {string}
 */
Surface.prototype.withCustomAndCommon = function(src) {
    return [this.customShaderSrc, this.commonShaderSrc, src].join("\n");
};
