(function(exports) {

  //////////////////////////////////////////////////////////////////////
  // GlError

  function GlError(message) {
    this.message = message;
  }

  GlError.prototype.toString = function() {
    return this.message;
  };

  //////////////////////////////////////////////////////////////////////
  // ShaderObject - encapsulate WebGLShader

  function ShaderObject(gl, type, str) {
    this.gl = gl;
    this.handle = gl.createShader(type);
    this.program = null;
    this.compiled = false;
    if (str) {
      this.setSource(str);
      this.compile();
    }
  }

  ShaderObject.prototype.dispose = function() {
    this.gl.deleteShader(this.handle);
  };

  ShaderObject.prototype.setSource = function(str) {
    this.src = str;
    this.gl.shaderSource(this.handle, str);
    return this;
  };

  ShaderObject.prototype.sourceFromElement = function(id) {
    this.setSource(document.getElementById(id).textContent);
    return this;
  };

  ShaderObject.prototype.compile = function() {
    var gl = this.gl, handle = this.handle;
    gl.compileShader(handle);
    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS))
      throw new GlError("Error compiling shader:\n" +
                        gl.getShaderInfoLog(handle));
    this.compiled = true;
    return this;
  };

  //////////////////////////////////////////////////////////////////////
  // ShaderProgram - encapsulate WebGLProgram

  function ShaderProgram(gl_or_objs) {
    var n, i, o;
    if (gl_or_objs.length && gl_or_objs[0] && gl_or_objs[0].handle) {
      this.gl = o = gl_or_objs[0].gl;
      this.handle = o.createProgram();
      n = gl_or_objs.length;
      for (i = 0; i < n; ++i) {
        o = gl_or_objs[i];
        if (!o.compiled)
          o.compile();
        this.attach(o);
      }
      this.link();
      this.detectUniforms();
      this.detectAttributes();
    }
    else {
      this.gl = gl;
      this.handle = gl.createProgram();
    }
  };

  ShaderProgram.prototype.dispose = function() {
    this.gl.deleteProgram(this.handle);
  };

  ShaderProgram.prototype.use = function(shaderObject) {
    this.gl.useProgram(this.handle);
    return this;
  };

  ShaderProgram.prototype.attach = function(shaderObject) {
    this.gl.attachShader(this.handle, shaderObject.handle);
    shaderObject.program = this;
    return this;
  };

  ShaderProgram.prototype.detach = function(shaderObject) {
    this.gl.detachShader(this.handle, shaderObject.handle);
    shaderObject.program = null;
    return this;
  };

  ShaderProgram.prototype.link = function() {
    var gl = this.gl, handle = this.handle;
    gl.linkProgram(handle);
    if (!gl.getProgramParameter(handle, gl.LINK_STATUS))
      throw new GlError("Error linking shader:\n" +
                        gl.getProgramInfoLog(handle));
    gl.validateProgram(handle);
    if (!gl.getProgramParameter(handle, gl.VALIDATE_STATUS))
      throw new GlError("Error validating shader:\n" +
                        gl.getProgramInfoLog(handle));
    return this;
  };

  ShaderProgram.prototype.detectUniforms = function() {
    this.uniform = this.detectImpl(true);
  };

  ShaderProgram.prototype.detectAttributes = function() {
    this.attrib = this.detectImpl(false);
  };

  ShaderProgram.prototype.detectImpl = function(uniform) {
    var i, n, gl = this.gl, handle = this.handle, info;
    var name, match, root = {}, node, base, idx, leaf;
    var size, j, arr, name2;
    if (uniform)
      n = gl.getProgramParameter(handle, gl.ACTIVE_UNIFORMS);
    else
      n = gl.getProgramParameter(handle, gl.ACTIVE_ATTRIBUTES);
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
            leaf = this.uniformSetter(name2, info);
          else
            leaf = this.attribFactory(name2, info);
          arr[j] = leaf;
        }
        node[name] = arr;
      }
      else {
        if (uniform)
          leaf = this.uniformSetter(info.name, info);
        else
          leaf = this.attribFactory(info.name, info);
        node[name] = leaf;
      }
    }
    return root;
  };

  ShaderProgram.prototype.uniformSetter = function(name, info) {
    var gl = this.gl, handle = this.handle, loc;
    loc = gl.getUniformLocation(handle, name);
    switch(info.type) {
    case gl.FLOAT:
      return gl.uniform1fv.bind(gl, loc);
    case gl.FLOAT_VEC2:
      return gl.uniform2fv.bind(gl, loc);
    case gl.FLOAT_VEC3:
      return gl.uniform3fv.bind(gl, loc);
    case gl.FLOAT_VEC4:
      return gl.uniform4fv.bind(gl, loc);
    case gl.BOOL:
    case gl.INT:
      return gl.uniform1iv.bind(gl, loc);
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
    // case gl.SAMPLER_2D:
    // case gl.SAMPLER_CUBE:
    default:
      throw new GlError("Unknown data type for uniform " + name);
    }
  };

  ShaderProgram.prototype.attribFactory = function(name, info) {
    var gl = this.gl, handle = this.handle, loc;
    loc = gl.getAttribLocation(handle, name);
    switch(info.type) {
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

  function VertexAttribute(gl, location, setter) {
    this.gl = gl;
    this.location = location;
    this.set = setter;
  }

  //////////////////////////////////////////////////////////////////////
  // exports

  exports.glObj = {
    'ShaderObject': ShaderObject,
    'ShaderProgram': ShaderProgram,
    'version': 1
  };

})(this);
