/**
 * Contains global variables that are used everywhere
 */

/** @type {boolean} */
var isinitialized = false;

/** @type {HTMLCanvasElement|Element} */
var glcanvas;

/** @type {HTMLCanvasElement|Element} */
var tmpcanvas;

/** @type {WebGLRenderingContext} */
var gl;

var nada;
//var myfunctions;

var webgltype = {}; //which type identifier is used in WebGL to represent our internal type

var webgltr = {};


var can_use_texture_half_float = false;
var halfFloat;
var can_use_texture_float = false;

const oo = 1 << 30; //infinity, but oo + oo should be > 0, hence not MaxInt

var requiredcompiletime = 1;

var subtypegen = {}; //generators of subtype relations
var subtype = []; //distance matrix 
var next = []; //next[i][j]=k if i->k->...->j is shortest path of primitive subtype inclusions -> helps to compute subtype-inclusion sequence


function initGLIfRequired() {
  if (isinitialized)
    return;
  glcanvas = document.createElement("canvas");
  glcanvas.id = "glcanvas";
  glcanvas.style.display = "none";
  glcanvas.width = glcanvas.height = 0;
  document.body.appendChild(glcanvas); //document.body.appendChil

  tmpcanvas = document.createElement("canvas");
  tmpcanvas.id = "tmpcanvas";
  tmpcanvas.style.display = "none";
  document.body.appendChild(tmpcanvas);


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

  gl = (
    glcanvas.getContext("webgl"));
  if (!gl)
    gl = (
      glcanvas.getContext("experimental-webgl"));
  if (!gl)
    throw new GlError("Could not obtain a WebGL context.\nReason: " + errorInfo);
  glcanvas.removeEventListener(
    "webglcontextcreationerror",
    onContextCreationError, false);


  can_use_texture_float = gl.getExtension('OES_texture_float') && gl.getExtension('OES_texture_float_linear');
  if (!can_use_texture_float) {
    console.error("Your browser does not suppert OES_texture_float, trying OES_texture_half_float...");
    halfFloat = gl.getExtension('OES_texture_half_float');
    can_use_texture_half_float = halfFloat && gl.getExtension('OES_texture_half_float_linear');
    if (!can_use_texture_half_float)
      console.error("Your browser does not suppert OES_texture_half_float, will use 8-bit textures.");
  }
  isinitialized = true;
}