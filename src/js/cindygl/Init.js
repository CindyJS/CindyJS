/**
 * Contains global variables that are used everywhere
 */

/** @type {boolean} */
var isinitialized = false;

/** @type {HTMLCanvasElement|Element} */
var glcanvas;

/** @type {WebGLRenderingContext} */
var gl;

/**
 * Dictoionary of all used canvaswrappers
 * @dict @type {Object}
 */
var canvaswrappers = {};

var nada;
//var myfunctions;

var webgltype = {}; //which type identifier is used in WebGL to represent our internal type

var webgltr = {};

const oo = 1<<30; //infinity, but oo + oo should be > 0, hence not MaxInt


var subtypegen = {}; //generators of subtype relations
var subtype = []; //distance matrix 
var next = []; //next[i][j]=k if i->k->...->j is shortest path of primitive subtype inclusions -> helps to compute subtype-inclusion sequence


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
      
      
        var float_texture_ext = gl.getExtension('OES_texture_float');
  var float_texture_ext2 = gl.getExtension('OES_float_linear');
  var float_texture_ext3 = gl.getExtension('OES_texture_float_linear');
  
  
  
  
  isinitialized = true;
}
