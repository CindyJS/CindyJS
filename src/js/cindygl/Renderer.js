/**
 * param {TODO} expression for the Code that will be used for rendering
 * @constructor
 */
function Renderer(api, expression, sizeX, sizeY) {
  this.api = api;
  
  let cpg = generateColorPlotProgram(expression);
  this.cpguniforms = cpg.uniforms;
  this.fragmentShaderCode =
    cgl_resources["standardFragmentHeader"] + cpg.code;
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

/** @type {number} */
Renderer.prototype.sizeX;

/** @type {number} */
Renderer.prototype.sizeY;

/** @type {ShaderProgram} */
Renderer.prototype.shaderProgram;

/** @type {createCindy.pluginApi} */
Renderer.prototype.api;



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


Renderer.prototype.setUniforms = function() {
  for(let uname in this.cpguniforms) {
    let val = this.api.evaluateAndVal(this.cpguniforms[uname].expr);
    let t = this.cpguniforms[uname].type;
    
    //@TODO: handle other types as well
    
    let setter = this.shaderProgram.uniform[uname];
    
    if(setter===undefined) continue;
    switch(t) {
      case type.complex:
        setter([val['value']['real'], val['value']['imag']]);
        break;
      case type.float:
        setter([val['value']['real']]);
        break;
      case type.int:
        setter([val['value']['real']]);
        break;
      case type.bool:
        setter([val['value']['real']]);
        break;
      case type.vec2:
        setter([
          val['value'][0]['value']['real'],
          val['value'][1]['value']['real']
        ]);
        break;
      case type.vec3:
        setter([
          val['value'][0]['value']['real'],
          val['value'][1]['value']['real'],
          val['value'][2]['value']['real']
        ]);
        break;
      case type.vec4:
        setter([
          val['value'][0]['value']['real'],
          val['value'][1]['value']['real'],
          val['value'][2]['value']['real'],
          val['value'][3]['value']['real']
        ]);
        break;
      default:
        console.error("Don't know how to set uniform" + uname + " to " + val);
        break;
    }
  }
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
  this.setUniforms();

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();
}
