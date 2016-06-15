/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function Initial(stategl, surface) {
    this.mkBuffers(stategl, surface, Mesh.tetrakis(2));
    this.mkProgram(stategl, surface);
}

/** @type {WebGLBuffer} */
Initial.prototype.indexBuffer = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {Array<number>} positions
 */
Initial.prototype.mkBuffers = function(stategl, surface, positions) {
    var gl = stategl.gl;
    surface.numIndices = positions.length / 2;
    gl.enableVertexAttribArray(0);
    surface.indexBuffer = gl.createBuffer();
    surface.fillIndexBuffer(stategl);
    gl.enableVertexAttribArray(1);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    surface.framebuffer = gl.createFramebuffer();
};

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
Initial.prototype.mkProgram = function(stategl, surface) {
    var sources = StateGL.getShaderSources("Initial");
    sources[0] = surface.withTextures(sources[0]);
    sources[1] = surface.withCustomAndCommon(sources[1]);
    this.program = stategl.mkProgram(sources);
};

/** @type {WebGLBuffer} */
Initial.prototype.positionBuffer = null;

/** @type {WebGLProgram} */
Initial.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
Initial.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        texturesOut = surface.texturesOut;
    gl.useProgram(this.program);
    gl.enableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.indexBuffer);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(1);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.framebuffer);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);

    var computedRootsLoc = gl.getUniformLocation(this.program, 'computedRoots');
    var sheets = surface.sheets;
    var i, l;

    for (var computedRoots = 0; computedRoots <= sheets + 1; computedRoots += 2) {
        i = computedRoots < sheets ? computedRoots / 2 + 1 : 0;
        gl.bindTexture(gl.TEXTURE_2D, texturesOut[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA,
            gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, texturesOut[i], 0);
        gl.uniform1i(computedRootsLoc, computedRoots);
        gl.drawArrays(gl.POINTS, 0, surface.numIndices);
    }

    for (i = 0, l = texturesOut.length; i < l; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(1);

    var texturesTmp = texturesIn;
    surface.texturesIn = texturesOut;
    surface.texturesOut = texturesTmp;
};
