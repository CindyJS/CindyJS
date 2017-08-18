/**
 * @param {string} name    the id of the canvas element
 * @param {Object} ccOpts  options for context creation
 * @param {Object=} opts   other options
 * @param {td.EventManager=} addEventListener
 * @constructor
 * @struct
 */
function Viewer(name, ccOpts, opts, addEventListener) {
  /** @type {HTMLCanvasElement} */
  let canvas = /** @type {HTMLCanvasElement} */(document.getElementById(name));
  if (!canvas)
    throw new GlError("No canvas element with id " + name);
  let errorInfo = "Unknown";
  function onContextCreationError(e) {
    canvas.removeEventListener(
      "webglcontextcreationerror",
      onContextCreationError, false);
    if (e.statusMessage)
      errorInfo = e.statusMessage;
  }
  canvas.addEventListener(
    "webglcontextcreationerror",
    onContextCreationError, false);
  /** @type {WebGLRenderingContext} */
  let gl = /** @type {WebGLRenderingContext} */(
    canvas.getContext("webgl", ccOpts));
  if (!gl)
    gl = /** @type {WebGLRenderingContext} */(
      canvas.getContext("experimental-webgl", ccOpts));
  if (!gl)
    throw new GlError("Could not obtain a WebGL context.\nReason: " + errorInfo);

  if (/[?&]frag_depth=0/.test(window.location.search)) {
    this.glExtFragDepth = null;
  }
  else {
    this.glExtFragDepth = gl.getExtension("EXT_frag_depth");
    if (!this.glExtFragDepth) {
      console.log("EXT_frag_depth extension not supported, " +
                  "will try webgl 2.0.");
      let gl2 = /** @type {WebGLRenderingContext} */(
        canvas.getContext("webgl2", ccOpts));
      if (gl2) {
        gl = gl2;
        gl.webgl2 = true;
        console.log("Loaded Webgl 2.0!");
      } else {
        console.log("Webgl 2.0 is not availible, " +
                    "render in reduced quality.");
      }
    }
  }

  canvas.removeEventListener(
    "webglcontextcreationerror",
    onContextCreationError, false);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.gl = gl;

  this.ssFactor = 1;
  if (opts && opts.superSample) {
    this.ssFactor = opts.superSample|0;
    if (this.ssFactor < 1)
      this.ssFactor = 1;
  }
  if (this.ssFactor !== 1) {
    let ssArea = this.width*this.height*this.ssFactor;
    let ssSize = 64;
    while (ssSize*ssSize < ssArea)
      ssSize *= 2;
    this.ssWidth = this.ssHeight = ssSize;
    this.ssTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.ssTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.LINEAR_MIPMAP_LINEAR);
    gl.hint(gl.GENERATE_MIPMAP_HINT, gl.NICEST);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGB,
      this.ssWidth, this.ssHeight,
      0, gl.RGB, gl.UNSIGNED_BYTE, null
    );
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.ssDepthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.ssDepthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                           this.ssWidth, this.ssHeight);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    this.ssFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.ssFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                            gl.TEXTURE_2D, this.ssTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                               gl.RENDERBUFFER, this.ssDepthBuffer);
    let ssStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (ssStatus !== gl.FRAMEBUFFER_COMPLETE) {
      throw new GlError("Failed to create supersampling framebuffer. " +
                        "glCheckFramebufferStatus returned " + ssStatus);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.ssArrayBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ssArrayBuffer);
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
      this.textureQuadProgram.handle, "aPos");
  }
  else {
    this.ssWidth = this.width;
    this.ssHeight = this.height;
  }

  this.lighting = new Lighting();
  this.lightingCode = c3d_resources.lighting1 +
    this.lighting.shaderCode() + c3d_resources.lighting2;
  this.camera = new Camera(this.width, this.height);
  this.spheres = new Spheres(this);
  this.cylinders = new Cylinders(this);
  this.triangles = new Triangles(this);
  this.pointAppearance   = Appearance.clone(Viewer.defaultAppearances.point);
  this.lineAppearance    = Appearance.clone(Viewer.defaultAppearances.line);
  this.surfaceAppearance = Appearance.clone(Viewer.defaultAppearances.surface);
  this.appearanceStack = [];
  this.backgroundColor = [1, 1, 1, 1];
  this.renderTimeout = null;

  if (!addEventListener)
    addEventListener = /** @type {td.EventManager} */(function(
      target, name, listener, useCapture) {
      target.addEventListener(name, listener, !!useCapture);
    });
  new Controls(addEventListener, this.canvas, this.camera, this);
}

/** @const @type {Appearance.Triple} */
Viewer.defaultAppearances =
  Appearance.mkTriple(
    Appearance.createScaled([1, 0, 0], 1, 60, 1),
    Appearance.createScaled([0, 0, 1], 1, 60, 1),
    Appearance.createScaled([0, 1, 0], 1, 60, 1));

/** @type {number} */
Viewer.prototype.ssFactor;

/** @type {number} */
Viewer.prototype.ssWidth;

/** @type {number} */
Viewer.prototype.ssHeight;

/** @type {WebGLTexture} */
Viewer.prototype.ssTexture;

/** @type {WebGLRenderbuffer} */
Viewer.prototype.ssDepthBuffer;

/** @type {WebGLFramebuffer} */
Viewer.prototype.ssFramebuffer;

/** @type {WebGLBuffer} */
Viewer.prototype.ssArrayBuffer;

/** @type {ShaderProgram} */
Viewer.prototype.textureQuadProgram;

/** @type {number} */
Viewer.prototype.textureQuadAttrib;

/** @type {Lighting} */
Viewer.prototype.lighting;

/** @type {string} */
Viewer.prototype.lightingCode;

/** @type {Spheres} */
Viewer.prototype.spheres;

/** @type {Cylinders} */
Viewer.prototype.cylinders;

/** @type {Triangles} */
Viewer.prototype.triangles;

/** @type {HTMLCanvasElement} */
Viewer.prototype.canvas;

/** @type {number} */
Viewer.prototype.width;

/** @type {number} */
Viewer.prototype.height;

/** @type {WebGLRenderingContext} */
Viewer.prototype.gl;

/** @type {Object} */
Viewer.prototype.glExtFragDepth;

/** @type {Camera} */
Viewer.prototype.camera;

/** @type {Appearance} */
Viewer.prototype.pointAppearance;

/** @type {Appearance} */
Viewer.prototype.lineAppearance;

/** @type {Appearance} */
Viewer.prototype.surfaceAppearance;

/** @type {Appearance.Stack} */
Viewer.prototype.appearanceStack;

/** @type {Array.<number>} */
Viewer.prototype.backgroundColor;

/** @type {?number} */
Viewer.prototype.renderTimeout;

Viewer.prototype.clear = function() {
  this.spheres.clear();
  this.cylinders.clear();
  this.triangles.clear();
};

Viewer.prototype.scheduleRender = function() {
  if (this.renderTimeout === null)
    this.renderTimeout = setTimeout(this.render.bind(this), 0);
};

Viewer.prototype.render = function() {
  this.renderTimeout = null;
  if (this.lighting.modified) {
    this.lightingCode = c3d_resources.lighting1 +
      this.lighting.shaderCode() + c3d_resources.lighting2;
    this.spheres.recompileShader(this);
    this.cylinders.recompileShader(this);
    this.triangles.recompileShader(this);
  }
  if (this.ssFactor === 1)
    this.renderAliased();
  else
    this.renderAntiAliased();
  this.gl.flush();
}

Viewer.prototype.renderAntiAliased = function() {
  let gl = this.gl;
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.ssFramebuffer);
  this.renderAliased();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, this.width, this.height);
  gl.disable(gl.DEPTH_TEST);
  gl.bindTexture(gl.TEXTURE_2D, this.ssTexture);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.ssArrayBuffer);
  gl.enableVertexAttribArray(this.textureQuadAttrib);
  gl.vertexAttribPointer(this.textureQuadAttrib, 4, gl.FLOAT, false, 4*4, 0);
  this.textureQuadProgram.use(gl);
  this.textureQuadProgram.uniform["uTexture"]([0]);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.disableVertexAttribArray(this.textureQuadAttrib);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

Viewer.prototype.renderAliased = function() {
  let gl = this.gl;
  gl.viewport(0, 0, this.ssWidth, this.ssHeight);
  gl.clearColor.apply(gl, this.backgroundColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (this.spheres.opaque && this.cylinders.opaque && this.triangles.opaque) {
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    this.renderPrimitives(true);
  }
  else {
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    this.renderPrimitives(false);
    this.renderPrimitives(false);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    /*
    gl.disable(gl.BLEND);
    this.renderPrimitives(true);
    gl.enable(gl.BLEND);
    */
    this.renderPrimitives(false);
  }
};

/**
 * @param {boolean} opaque
 */
Viewer.prototype.renderPrimitives = function(opaque) {
  if (!opaque)
    this.spheres.render(this, +1); // back
  this.triangles.render(this);
  this.cylinders.render(this);
  this.spheres.render(this, -1); // front
};

/**
 * @param {Object} u
 */
Viewer.prototype.setUniforms = function(u) {
  u["uProjectionMatrix"](this.camera.projectionMatrix);
  u["uModelViewMatrix"](transpose4(this.camera.mvMatrix));
  this.lighting.setUniforms(u);
};
