/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function Assembly(stategl, surface) {
    this.mkProgram(stategl, surface);
}

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
Assembly.prototype.mkProgram = function(stategl, surface) {
    var sources = StateGL.getShaderSources("Assembly");
    sources[0] = surface.withTextures(sources[0]);
    sources[1] = surface.withCustomAndCommon(sources[1]);
    this.program = stategl.mkProgram(sources);
};

/** @type {WebGLProgram} */
Assembly.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
Assembly.prototype.render = function(stategl, surface, gl) {
    var texturesIn = surface.texturesIn,
        textureOut = surface.texturesOut[0];
    gl.useProgram(this.program);

    var numIndicesLoc = gl.getUniformLocation(this.program, 'numIndices');
    var numIndices = surface.numIndices;
    gl.uniform1f(numIndicesLoc, numIndices);

    surface.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, textureOut);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        textureOut, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    var texIs = [];
    for (var i = 0, l = texturesIn.length; i < l; i++) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texturesIn[i]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        texIs[i] = i;
    }
    var samplersLocation = gl.getUniformLocation(this.program, 'samplers');
    gl.uniform1iv(samplersLocation, texIs);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);

    var sheetLoc = gl.getUniformLocation(this.program, 'sheet');
    for (var sheet = 0, sheets = surface.sheets; sheet < sheets; sheet++) {
        gl.uniform1f(sheetLoc, sheet);
        gl.drawArrays(gl.POINTS, 0, numIndices);
    }

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    var texturesTmp = surface.texturesIn;
    surface.texturesIn = surface.texturesOut;
    surface.texturesOut = texturesTmp;
    surface.numIndices *= surface.sheets;
    surface.fillIndexBuffer(stategl);
};
