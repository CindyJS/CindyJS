/**
 * @param {Viewer} viewer
 * @constructor
 */
function Spheres(viewer) {
  var gl = viewer.gl;
  this.count = 0;
  this.capacity = Spheres.initialCapacity;
  this.data = new Float32Array(Spheres.initialCapacity * Spheres.itemLength);
  this.buffer = gl.createBuffer();
  this.bufferCapacity = -1;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  /*
  var vertices = [
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  */

  var vs = "precision mediump float;\n\n" + c3d_resources.sphere_vert;
  var fs = "precision mediump float;\n\n" + c3d_resources.lighting + "\n" +
      c3d_resources.sphere_frag;
  if (viewer.glExtFragDepth)
    fs = "#extension GL_EXT_frag_depth : enable\n" + fs;
  this.shaderProgram = new ShaderProgram(gl, vs, fs);
  gl.enableVertexAttribArray(this.shaderProgram.attrib["aCenter"].location);
  gl.enableVertexAttribArray(this.shaderProgram.attrib["aColor"].location);
  gl.enableVertexAttribArray(this.shaderProgram.attrib["aRelative"].location);
  gl.enableVertexAttribArray(this.shaderProgram.attrib["aRadius"].location);
}

/** @constant @type {number} */
Spheres.offsetCenter = 0;

/** @constant @type {number} */
Spheres.offsetColor = Spheres.offsetCenter + 4;

/** @constant @type {number} */
Spheres.offsetRelative = Spheres.offsetColor + 4;

/** @constant @type {number} */
Spheres.offsetRadius = Spheres.offsetRelative + 3;

/** @constant @type {number} */
Spheres.vertexLength = Spheres.offsetRadius + 1;

/** @constant @type {number} */
Spheres.itemLength = 6 * Spheres.vertexLength;

/** @constant @type {number} */
Spheres.itemByteCount = 4 * Spheres.itemLength;

/** @constant @type {number} */
Spheres.vertexByteCount = 4 * Spheres.vertexLength;

/** @constant @type {number} */
Spheres.initialCapacity = 16;

/** @type {number} */
Spheres.prototype.count;

/** @type {number} */
Spheres.prototype.capacity;

/** @type {Float32Array} */
Spheres.prototype.data;

/** @typedef {{pos:Array.<number>, radius:number, color:Array.<number>}} */
Spheres.Sphere;

/** @type {Array.<Spheres.Sphere>} */
//Spheres.prototype.spheres;

/** @type {WebGLBuffer} */
Spheres.prototype.buffer;

/** @type {number} */
Spheres.prototype.bufferCapacity;

/** @type {ShaderProgram} */
Spheres.prototype.shaderProgram;

Spheres.prototype.clear = function() {
  this.count = 0;
};

Spheres.prototype.add = function(pos, radius, color) {
  if (this.count == this.capacity) {
    var nd = new Float32Array(this.capacity * (2 * Spheres.itemLength));
    nd.set(this.data);
    this.data = nd;
    this.capacity *= 2;
  }
  var x = pos[0], y = pos[1], z = pos[2], w = pos[3];
  var r = color[0], g = color[1], b = color[2], a = color[3];
  var i = this.count * Spheres.itemLength;
  this.data.set([
    x, y, z, w, r, g, b, a,  1.0,  1.0, 0.0, radius,
    x, y, z, w, r, g, b, a, -1.0,  1.0, 0.0, radius,
    x, y, z, w, r, g, b, a,  1.0, -1.0, 0.0, radius,
    x, y, z, w, r, g, b, a,  1.0, -1.0, 0.0, radius,
    x, y, z, w, r, g, b, a, -1.0,  1.0, 0.0, radius,
    x, y, z, w, r, g, b, a, -1.0, -1.0, 0.0, radius
  ], i);
  this.count++;
};

/**
 * @param {Viewer} viewer
 * @param {number} mode
 */
Spheres.prototype.render = function(viewer, mode) {
  if (this.count === 0)
    return;
  var gl = viewer.gl, shaderProgram = this.shaderProgram;
  shaderProgram.use(gl);
  var u = shaderProgram.uniform;
  viewer.setUniforms(u);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  if (this.bufferCapacity !== this.capacity) {
    gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
    this.bufferCapacity = this.capacity;
  }
  else {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data);
  }
  gl.vertexAttribPointer(shaderProgram.attrib["aCenter"].location,
                         4, gl.FLOAT, false, Spheres.vertexByteCount,
                         4 * Spheres.offsetCenter);
  gl.vertexAttribPointer(shaderProgram.attrib["aColor"].location,
                         4, gl.FLOAT, false, Spheres.vertexByteCount,
                         4 * Spheres.offsetColor);
  gl.vertexAttribPointer(shaderProgram.attrib["aRelative"].location,
                         3, gl.FLOAT, false, Spheres.vertexByteCount,
                         4 * Spheres.offsetRelative);
  gl.vertexAttribPointer(shaderProgram.attrib["aRadius"].location,
                         1, gl.FLOAT, false, Spheres.vertexByteCount,
                         4 * Spheres.offsetRadius);
  u["sphereMode"]([mode]);
  gl.drawArrays(gl.TRIANGLES, 0, 6 * this.count);
};
