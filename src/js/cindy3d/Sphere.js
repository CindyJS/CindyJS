/**
 * @param {Viewer} viewer
 * @constructor
 */
function Spheres(viewer) {
  var gl = viewer.gl;
  this.spheres = [];
  this.buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  var vertices = [
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  var vs = "precision mediump float;\n\n" + c3d_resources.sphere_vert;
  var fs = "precision mediump float;\n\n" + c3d_resources.lighting + "\n" +
      c3d_resources.sphere_frag;
  if (viewer.glExtFragDepth)
    fs = "#extension GL_EXT_frag_depth : enable\n" + fs;
  this.shaderProgram = new ShaderProgram(gl, vs, fs);
  gl.enableVertexAttribArray(this.shaderProgram.attrib["aVertex"].location);
}

/** @typedef {{pos:Array.<number>, radius:number, color:Array.<number>}} */
Spheres.Sphere;

/** @type {Array.<Spheres.Sphere>} */
Spheres.prototype.spheres;

/** @type {WebGLBuffer} */
Spheres.prototype.buffer;

/** @type {ShaderProgram} */
Spheres.prototype.shaderProgram;

Spheres.prototype.clear = function() {
  this.spheres = [];
};

Spheres.prototype.add = function(pos, radius, color) {
  this.spheres.push({pos, radius, color});
};

/**
 * @param {Viewer} viewer
 * @param {number} mode
 */
Spheres.prototype.render = function(viewer, mode) {
  var gl = viewer.gl, shaderProgram = this.shaderProgram;
  shaderProgram.use(gl);
  var u = shaderProgram.uniform;
  viewer.setUniforms(u);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  gl.vertexAttribPointer(shaderProgram.attrib["aVertex"].location,
                         3, gl.FLOAT, false, 0, 0);
  var i, n = this.spheres.length;
  u["sphereMode"]([mode]);
  var sphereCenter = u["sphereCenter"];
  var sphereRadius = u["sphereRadius"];
  var materialDiffuse = u["materialDiffuse"];
  for (i = 0; i < n; ++i) {
    var s = this.spheres[i];
    sphereCenter(transform4to3(viewer.camera.mvMatrix, s.pos));
    sphereRadius([s.radius]);
    materialDiffuse(s.color);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
};
