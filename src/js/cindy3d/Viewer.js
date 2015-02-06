/**
 * @param {string} name  the id of the canvas element
 * @constructor
 * @struct
 */
function Viewer(name) {
  /** @type {HTMLCanvasElement} */
  var canvas = /** @type {HTMLCanvasElement} */(document.getElementById(name));
  if (!canvas)
    throw new GlError("No canvas element with id " + name);
  var errorInfo = "Unknown";
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
  var gl = /** @type {WebGLRenderingContext} */(canvas.getContext("webgl"));
  if (!gl)
    gl = /** @type {WebGLRenderingContext} */(canvas.getContext("experimental-webgl"));
  if (!gl)
    throw new GlError("Could not obtain a WebGL context.\nReason: " + errorInfo);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.gl = gl;
  if (/[?&]frag_depth=0/.test(window.location.search)) {
    this.glExtFragDepth = null;
  }
  else {
    this.glExtFragDepth = gl.getExtension("EXT_frag_depth");
    if (!this.glExtFragDepth)
      console.log("EXT_frag_depth extension not supported, " +
                  "will render with reduced quality.");
  }
  this.camera = new Camera(this.width, this.height);
  this.spheres = new Spheres(this);
  this.pointAppearance   = Appearance.create([1, 0, 0], 1, 60, 1);
  this.lineAppearance    = Appearance.create([0, 0, 1], 1, 60, 1);
  this.surfaceAppearance = Appearance.create([0, 1, 0], 1, 60, 1);
  this.backgroundColor = [1, 1, 1, 1];
  this.setupListeners();
}

/** @type {Spheres} */
Viewer.prototype.spheres;

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

/** @type {Array.<number>} */
Viewer.prototype.backgroundColor;

Viewer.prototype.setupListeners = function() {
  var canvas = this.canvas, mx = Number.NaN, my = Number.NaN, mdown = false;
  var camera = this.camera, render = this.render.bind(this);
  canvas.addEventListener("mousedown", function(/** MouseEvent */ evnt) {
    if (evnt.button === 0) {
      mdown = true;
    }
    if (evnt.buttons === undefined ? mdown : (evnt.buttons & 1)) {
      mx = evnt.screenX;
      my = evnt.screenY;
    }
  });
  canvas.addEventListener("mousemove", function(/** MouseEvent */ evnt) {
    if (evnt.buttons === undefined ? mdown : (evnt.buttons & 1)) {
      /* if (evnt.movementX !== undefined) {
        camera.mouseRotate(evnt.movementX, evnt.movementY);
        render();
      }
      else */ if (!isNaN(mx)) {
        camera.mouseRotate(evnt.screenX - mx, evnt.screenY - my);
        render();
      }
      mx = evnt.screenX;
      my = evnt.screenY;
    }
  });
  canvas.addEventListener("mouseup", function(/** MouseEvent */ evnt) {
    if (evnt.button === 0) mdown = false;
  });
  canvas.addEventListener("mouseleave", function(/** MouseEvent */ evnt) {
    mdown = false;
    mx = my = Number.NaN;
  });
};

Viewer.prototype.clear = function() {
  this.spheres.clear();
};

Viewer.prototype.render = function() {
  var gl = this.gl;
  gl.viewport(0, 0, this.width, this.height);
  gl.clearColor.apply(gl, this.backgroundColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  //gl.vertexAttribPointer(shaderProgram.attrib["aVertex"].location, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  //setUniforms();
  gl.enable(gl.BLEND);
  gl.depthMask(false);
  this.renderPrimitives(false);
  this.renderPrimitives(false);
  gl.depthMask(true);
  /*
  gl.disable(gl.BLEND);
  this.renderPrimitives(true);
  gl.enable(gl.BLEND);
  */
  this.renderPrimitives(false);
  gl.disable(gl.BLEND);
};

/**
 * @param {boolean} opaque
 */
Viewer.prototype.renderPrimitives = function(opaque) {
  if (!opaque)
    this.spheres.render(this, +1); // back
  this.spheres.render(this, -1); // front
};

/**
 * @param {Object} u
 */
Viewer.prototype.setUniforms = function(u) {
  u["uProjectionMatrix"](this.camera.projectionMatrix);
  u["uModelViewMatrix"](transpose4(this.camera.mvMatrix));
  u["materialShininess"]([60]);
  u["materialAmbient"]([0.2, 0.2, 0.2, 0.2]);
  u["materialSpecular"]([0.5, 0.5, 0.5, 0.5]);
  u["lightSource"][0]["position"]([0.0, 0.0, 0.0, 1.0]);
  u["lightSource"][0]["ambient"]([0.0, 0.0, 0.0, 1.0]);
  u["lightSource"][0]["diffuse"]([1.0, 1.0, 1.0, 1.0]);
  u["lightSource"][0]["specular"]([0.0, 0.0, 0.0, 1.0]);
};
