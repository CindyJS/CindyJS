/**
 * @param {string} name  the id of the canvas element
 * @constructor
 * @struct
 */
function Viewer(name) {
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
  let gl = /** @type {WebGLRenderingContext} */(canvas.getContext("webgl"));
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
  this.cylinders = new Cylinders(this);
  this.pointAppearance   = Appearance.clone(Viewer.defaultAppearances.point);
  this.lineAppearance    = Appearance.clone(Viewer.defaultAppearances.line);
  this.surfaceAppearance = Appearance.clone(Viewer.defaultAppearances.surface);
  this.appearanceStack = [];
  this.backgroundColor = [1, 1, 1, 1];
  this.setupListeners();
}

/** @const @type {Appearance.Triple} */
Viewer.defaultAppearances =
  Appearance.mkTriple(
    Appearance.createScaled([1, 0, 0], 1, 60, 1),
    Appearance.createScaled([0, 0, 1], 1, 60, 1),
    Appearance.createScaled([0, 1, 0], 1, 60, 1));

/** @type {Spheres} */
Viewer.prototype.spheres;

/** @type {Cylinders} */
Viewer.prototype.cylinders;

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

Viewer.prototype.setupListeners = function() {
  let canvas = this.canvas, mx = Number.NaN, my = Number.NaN, mdown = false;
  let camera = this.camera, render = this.render.bind(this);
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
  let gl = this.gl;
  gl.viewport(0, 0, this.width, this.height);
  gl.clearColor.apply(gl, this.backgroundColor);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (this.spheres.opaque && this.cylinders.opaque) {
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    this.renderPrimitives(true);
  }
  else {
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
  }
  gl.flush();
};

/**
 * @param {boolean} opaque
 */
Viewer.prototype.renderPrimitives = function(opaque) {
  if (!opaque)
    this.spheres.render(this, +1); // back
  this.cylinders.render(this);
  this.spheres.render(this, -1); // front
};

/**
 * @param {Object} u
 */
Viewer.prototype.setUniforms = function(u) {
  u["uProjectionMatrix"](this.camera.projectionMatrix);
  u["uModelViewMatrix"](transpose4(this.camera.mvMatrix));
  if(!u["materialShininess"]) return;
  u["materialShininess"]([60]);
  u["materialAmbient"]([0.2, 0.2, 0.2, 0.2]);
  u["materialSpecular"]([0.5, 0.5, 0.5, 0.5]);
  u["lightSource"][0]["position"]([0.0, 0.0, 0.0, 1.0]);
  u["lightSource"][0]["ambient"]([0.0, 0.0, 0.0, 1.0]);
  u["lightSource"][0]["diffuse"]([1.0, 1.0, 1.0, 1.0]);
  u["lightSource"][0]["specular"]([0.0, 0.0, 0.0, 1.0]);
};
