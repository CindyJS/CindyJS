/**
 * param {TODO} expression for the Code that will be used for rendering
 * @constructor
 */
function Renderer(expression, sizeX, sizeY) {
  this.fragmentShaderCode =
    cgl_resources["standardFragmentHeader"] + generateColorPlotProgram(expression);
  this.vertexShaderCode = cgl_resources["vshader"];
  this.sizeX = sizeX;
  this.sizeY = sizeY;
  this.shaderProgram = new ShaderProgram(gl, this.vertexShaderCode, this.fragmentShaderCode);
  
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
    this.textureQuadAttrib = gl.getAttribLocation(
      this.textureQuadProgram.handle, "aPos");*/
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

	var vertices = new Float32Array([ -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0 ]);

	var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
	gl.enableVertexAttribArray(aPosLoc);

	var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
	gl.enableVertexAttribArray(aTexLoc);

	var texCoords = new Float32Array([ 0, 0, 1, 0, 0, 1, 1, 1 ]);

	var texCoordOffset = vertices.byteLength;

	gl.bufferData(gl.ARRAY_BUFFER, texCoordOffset + texCoords.byteLength, gl.STATIC_DRAW);
	gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
	gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
	gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
	gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
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

/** @type {number} */
Renderer.prototype.sizeX;

/** @type {number} */
Renderer.prototype.sizeY;

/** @type {ShaderProgram} */
Renderer.prototype.shaderProgram;



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
  let m = [
    b.x - a.x, c.x - a.x, a.x,
    b.y - a.y, c.y - a.y, a.y,
    0,         0,         1
  ];
  this.shaderProgram.uniform["transformMatrix"](transpose3(m));
}

/**
 * runs shaderProgram on gl
 */
Renderer.prototype.render = function(a, b, c) {
  glcanvas.width  = this.sizeX;
  glcanvas.height = this.sizeY;
	gl.viewport(0, 0, this.sizeX, this.sizeY);
  
	this.shaderProgram.use(gl);
  this.setTransformMatrix(a, b, c);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();
}
