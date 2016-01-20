//////////////////////////////////////////////////////////////////////
// GlError

/**
 * @param {string} message
 * @constructor
 */
function GlError(message) {
  this.message = message;
}

GlError.prototype.toString = function() {
  return this.message;
};

//////////////////////////////////////////////////////////////////////
// ShaderProgram - encapsulate WebGLProgram

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} vertexShaderCode
 * @param {string} fragmentShaderCode
 * @constructor
 * @struct
 */
function ShaderProgram(gl, vertexShaderCode, fragmentShaderCode) {
  this.handle = gl.createProgram();
  this.vs = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderCode);
  this.fs = this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderCode);
  this.link(gl);
  this.detectUniforms(gl);
  // this.detectAttributes(gl);
};

/** @type {WebGLProgram} */
ShaderProgram.prototype.handle;

/** @type {WebGLShader} */
ShaderProgram.prototype.vs;

/** @type {WebGLShader} */
ShaderProgram.prototype.fs;

/** @dict @type {Object} */
ShaderProgram.prototype.uniform;

/** @dict @type {Object} */
ShaderProgram.prototype.attrib;

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} kind
 * @param {string} code
 * @return {WebGLShader}
 */
ShaderProgram.prototype.createShader = function(gl, kind, code) {
  let shader = gl.createShader(kind);
  gl.shaderSource(shader, code);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(code.split("\n"));
    throw new GlError("Error compiling shader:\n" +
      gl.getShaderInfoLog(shader));
  }
  gl.attachShader(this.handle, shader);
  return shader;
};

/**
 * @param {WebGLRenderingContext} gl
 * @return {ShaderProgram}
 */
ShaderProgram.prototype.use = function(gl) {
  gl.useProgram(this.handle);
  return this;
};

/**
 * @param {WebGLRenderingContext} gl
 */
ShaderProgram.prototype.link = function(gl) {
  let handle = this.handle;
  gl.linkProgram(handle);
  if (!gl.getProgramParameter(handle, gl.LINK_STATUS))
    throw new GlError("Error linking shader:\n" +
      gl.getProgramInfoLog(handle));
  gl.validateProgram(handle);
  if (!gl.getProgramParameter(handle, gl.VALIDATE_STATUS))
    throw new GlError("Error validating shader:\n" +
      gl.getProgramInfoLog(handle));
};

/**
 * @param {WebGLRenderingContext} gl
 */
ShaderProgram.prototype.dispose = function(gl) {
  gl.detachShader(this.handle, this.vs);
  gl.deleteShader(this.vs);
  gl.detachShader(this.handle, this.fs);
  gl.deleteShader(this.fs);
  gl.deleteProgram(this.handle);
};

/**
 * @param {WebGLRenderingContext} gl
 */
ShaderProgram.prototype.detectUniforms = function(gl) {
  this.uniform = this.detectImpl(gl, true);
};

/**
 * @param {WebGLRenderingContext} gl
 */
ShaderProgram.prototype.detectAttributes = function(gl) {
  this.attrib = this.detectImpl(gl, false);
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {boolean} uniform
 */
ShaderProgram.prototype.detectImpl = function(gl, uniform) {
  let i, n, handle = this.handle,
    info;
  let name, match, root = {},
    node, base, idx, leaf;
  let size, j, arr, name2;
  if (uniform)
    n = /** @type {number} */
    (gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS));
  else
    n = /** @type {number} */
    (gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES));
  for (i = 0; i < n; ++i) {
    if (uniform)
      info = gl.getActiveUniform(handle, i);
    else
      info = gl.getActiveAttrib(handle, i);
    if (info === null) continue;
    name = info.name.replace(/\]/g, "");
    if (!name) continue;
    node = root;
    while ((match = /[.\[]/.exec(name)) !== null) {
      base = name.substr(0, match.index);
      if (node.hasOwnProperty(base)) node = node[base];
      else if (match[0] === ".") node = node[base] = {};
      else node = node[base] = [];
      name = name.substr(match.index + 1);
    }
    if (info.size > 1) {
      size = info.size;
      arr = Array(size);
      for (j = 0; j < size; ++j) {
        name2 = info.name + "[" + j + "]";
        if (uniform)
          leaf = this.uniformSetter(gl, name2, info);
        else
          leaf = this.attribFactory(gl, name2, info);
        arr[j] = leaf;
      }
      node[name] = arr;
    } else {
      if (uniform)
        leaf = this.uniformSetter(gl, info.name, info);
      else
        leaf = this.attribFactory(gl, info.name, info);
      node[name] = leaf;
    }
  }
  return root;
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} name
 * @param {WebGLActiveInfo} info
 */
ShaderProgram.prototype.uniformSetter = function(gl, name, info) {
  let handle = this.handle,
    loc;
  loc = gl.getUniformLocation(handle, name);
  switch (info.type) {
    case gl.FLOAT:
      return gl.uniform1f.bind(gl, loc); //gl.uniform1fv
    case gl.FLOAT_VEC2:
      return gl.uniform2fv.bind(gl, loc);
    case gl.FLOAT_VEC3:
      return gl.uniform3fv.bind(gl, loc);
    case gl.FLOAT_VEC4:
      return gl.uniform4fv.bind(gl, loc);
    case gl.BOOL:
    case gl.INT:
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      return gl.uniform1i.bind(gl, loc); //gl.uniform1iv
    case gl.BOOL_VEC2:
    case gl.INT_VEC2:
      return gl.uniform2iv.bind(gl, loc);
    case gl.BOOL_VEC3:
    case gl.INT_VEC3:
      return gl.uniform3iv.bind(gl, loc);
    case gl.BOOL_VEC4:
    case gl.INT_VEC4:
      return gl.uniform4iv.bind(gl, loc);
    case gl.FLOAT_MAT2:
      return gl.uniformMatrix2fv.bind(gl, loc, false);
    case gl.FLOAT_MAT3:
      return gl.uniformMatrix3fv.bind(gl, loc, false);
    case gl.FLOAT_MAT4:
      return gl.uniformMatrix4fv.bind(gl, loc, false);
    default:
      throw new GlError("Unknown data type for uniform " + name);
  }
};

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} name
 * @param {WebGLActiveInfo} info
 */
ShaderProgram.prototype.attribFactory = function(gl, name, info) {
  let handle = this.handle,
    loc;
  loc = gl.getAttribLocation(handle, name);
  switch (info.type) {
    case gl.FLOAT:
      return new VertexAttribute(gl, loc, gl.vertexAttrib1fv.bind(gl, loc));
    case gl.FLOAT_VEC2:
      return new VertexAttribute(gl, loc, gl.vertexAttrib2fv.bind(gl, loc));
    case gl.FLOAT_VEC3:
      return new VertexAttribute(gl, loc, gl.vertexAttrib3fv.bind(gl, loc));
    case gl.FLOAT_VEC4:
      return new VertexAttribute(gl, loc, gl.vertexAttrib4fv.bind(gl, loc));
    default:
      throw new GlError("Unknown data type for vertex attribute " + name);
  }
};

//////////////////////////////////////////////////////////////////////
// VertexAttribute

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} location
 * @param {function(Array.<number>)} setter
 * @constructor
 */
function VertexAttribute(gl, location, setter) {
  this.gl = gl;
  this.location = location;
  this.set = setter;
}