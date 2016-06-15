/**
 * @constructor
 * @param {StateGL} stategl
 * @param {string} file
 * @param {Polynomial=} p
 * @param {function()} onload
 * @implements {Stage}
 */
function CachedSurface(stategl, file, p = null, onload = function() {}) {
    var cachedSurface = this;
    cachedSurface.polynomial = p;
    cachedSurface.loadModel(stategl, file, function() {
        cachedSurface.mkBuffer(stategl, cachedSurface.positions);
        cachedSurface.mkProgram(stategl);
        onload();
    });
}

/**
 * @param {StateGL} stategl
 * @param {boolean=} big
 * @return {Array<string>}
 */
CachedSurface.prototype.domainColouring = function(stategl, big = false) {
    if (this.polynomial)
        return Export.domainColouring(this.polynomial, stategl, big);
    else
        return [];
};

/**
 * @param {StateGL} stategl
 * @param {string=} name
 */
CachedSurface.prototype.exportBinary = function(stategl, name = "surface.bin") {
    Export.download(name, this.file);
};

/**
 * @param {StateGL} stategl
 * @param {string} name
 * @param {boolean=} big
 */
CachedSurface.prototype.exportDomainColouring = function(stategl, name = "sheet", big = true) {
    if (this.polynomial)
        Export.exportDomainColouring(this.polynomial, stategl, name, big);
};

/**
 * @param {StateGL} stategl
 * @param {string=} name
 * @param {boolean=} big
 */
CachedSurface.prototype.exportSurface = function(stategl, name = "surface", big = true) {
    Export.exportSurface(stategl, new Float32Array(this.positions), name, big);
};

/** @type {string} */
CachedSurface.prototype.file = "";

/**
 * @param {StateGL} stategl
 * @param {string} file
 * @param {function()} onload
 */
CachedSurface.prototype.loadModel = function(stategl, file, onload) {
    var cachedSurface = this;
    cachedSurface.file = file;
    var req = new XMLHttpRequest();
    req.open("GET", file, true);
    req.responseType = "arraybuffer";
    req.onload = function() {
        cachedSurface.positions = /** @type {ArrayBuffer|null} */ (req.response);
        onload();
    };
    req.send();
};

/**
 * @param {StateGL} stategl
 * @param {ArrayBuffer} positions
 */
CachedSurface.prototype.mkBuffer = function(stategl, positions) {
    var gl = stategl.gl;
    this.size = positions.byteLength / 16;
    gl.enableVertexAttribArray(0);
    this.positionsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
};

/** @param {StateGL} stategl */
CachedSurface.prototype.mkProgram = function(stategl) {
    var sources = StateGL.getShaderSources("CachedSurface");
    this.program = stategl.mkProgram(sources);
};

/** @type {Polynomial} */
CachedSurface.prototype.polynomial = null;

/** @type {ArrayBuffer} */
CachedSurface.prototype.positions = null;

/** @type {WebGLBuffer} */
CachedSurface.prototype.positionsBuffer = null;

/** @type {WebGLProgram} */
CachedSurface.prototype.program = null;

/**
 * @param {StateGL} stategl
 * @param {WebGLRenderingContext} gl
 * @param {State3D} state3d
 */
CachedSurface.prototype.render = function(stategl, gl, state3d) {
    if (!this.program)
        return;
    gl.useProgram(this.program);
    stategl.updateClipping();
    stategl.updateModelViewProjectionMatrices(state3d);
    stategl.updateTransparency();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionsBuffer);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, this.size);
    stategl.updateTransparency(false);
};

/** @type {number} */
CachedSurface.prototype.size = 0;
