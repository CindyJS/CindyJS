var isinitialized = false;
var glcanvas;

/** @type {WebGLRenderingContext} */
var gl;

function initGLIfRequired() {
  if(isinitialized)
    return;
  glcanvas = document.createElement("canvas");
  glcanvas.id = "glcanvas";
  glcanvas.style.display = "none";
  document.body.appendChild(glcanvas); //document.body.appendChil



  let errorInfo = "Unknown";
    function onContextCreationError(e) {
      glcanvas.removeEventListener(
        "webglcontextcreationerror",
        onContextCreationError, false);
      if (e.statusMessage)
        errorInfo = e.statusMessage;
    }
    glcanvas.addEventListener(
      "webglcontextcreationerror",
      onContextCreationError, false);
    /** @type {WebGLRenderingContext} */
     gl = /** @type {WebGLRenderingContext} */(
      glcanvas.getContext("webgl"));
    if (!gl)
      gl = /** @type {WebGLRenderingContext} */(
        glcanvas.getContext("experimental-webgl"));
    if (!gl)
      throw new GlError("Could not obtain a WebGL context.\nReason: " + errorInfo);
    glcanvas.removeEventListener(
      "webglcontextcreationerror",
      onContextCreationError, false);
      
  isinitialized = true;
}
