/**
 * @constructor
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @implements {Stage}
 */
function SubdivisionPre(stategl, surface) {
    this.mkProgram(stategl, surface);
}

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 */
SubdivisionPre.prototype.mkProgram = function(stategl, surface) {
    var sources = StateGL.getShaderSources("SubdivisionPre");
    sources[0] = surface.withTextures(sources[0]);
    this.program = stategl.mkProgram(sources);
};

/** @type {WebGLProgram} */
SubdivisionPre.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {Surface} surface
 * @param {WebGLRenderingContext} gl
 */
SubdivisionPre.prototype.render = function(stategl, surface, gl) {
    var textureIn = surface.texturesIn[0],
        textureOut = surface.texturesOut[0];
    gl.useProgram(this.program);
    surface.fillIndexBuffer(stategl);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, surface.framebuffer);
    gl.bindTexture(gl.TEXTURE_2D, textureOut);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        textureOut, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureIn);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var samplerLocation = gl.getUniformLocation(this.program, 'sampler');
    gl.uniform1i(samplerLocation, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.viewport(0, 0, 2048, 2048);
    gl.drawArrays(gl.POINTS, 0, surface.numIndices);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D,
        null, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var textureTmp = textureIn;
    surface.texturesIn[0] = textureOut;
    surface.texturesOut[0] = textureTmp;
};

/** @type {number} */
SubdivisionPre.prototype.size = 0;
