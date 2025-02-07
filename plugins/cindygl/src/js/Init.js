/**
 * Contains global variables that are used everywhere
 */

/** @type {boolean} */
var isinitialized = false;

/** @type {HTMLCanvasElement} */
var glcanvas;

/** @type {HTMLCanvasElement} */
var tmpcanvas;

/** @type {HTMLCanvasElement} */
var dummycanvas;

var dummyimage;

/** @type {WebGLRenderingContext} */
var gl;

var nada;

var can_use_texture_half_float = false;
var halfFloat;
var can_use_texture_float = false;

var use8bittextures = false;

const oo = 1 << 30; //infinity, but oo + oo should be > 0, hence not MaxInt

var requiredcompiletime = 1;

var subtypegen = {}; //generators of subtype relations
var subtype = []; //distance matrix 
var next = []; //next[i][j]=k if i->k->...->j is shortest path of primitive subtype inclusions -> helps to compute subtype-inclusion sequence


function initGLIfRequired() {
    if (isinitialized)
        return;
    glcanvas = /** @type {HTMLCanvasElement} */ (document.createElement("canvas"));
    glcanvas.id = "glcanvas";
    glcanvas.style.display = "none";
    glcanvas.width = glcanvas.height = 0;
    document.body.appendChild(glcanvas);

    tmpcanvas = /** @type {HTMLCanvasElement} */ (document.createElement("canvas"));
    tmpcanvas.id = "tmpcanvas";
    tmpcanvas.style.display = "none";
    tmpcanvas.width = tmpcanvas.height = 0;
    document.body.appendChild(tmpcanvas);

    dummycanvas = /** @type {HTMLCanvasElement} */ (document.createElement("canvas"));
    dummycanvas.id = "dummycanvas";
    dummycanvas.style.display = "none";
    dummycanvas.width = dummycanvas.height = 1;
    document.body.appendChild(dummycanvas);
    dummyimage = {
        "ctype": "image",
        "value": {
            "img": dummycanvas,
            "width": 1,
            "height": 1,
            "ready": true,
            "live": false,
            "generation": 0,
            "whenReady": function(f) {
                return;
            },
        },
    };


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

    let contextAttributes = {};
    let useWebXR = typeof CindyJS._pluginRegistry.CindyXR !== 'undefined';
    if (useWebXR) {
        contextAttributes['xrCompatible'] = true;
    }
    gl = /** @type {WebGL2RenderingContext} */ (
        glcanvas.getContext("webgl2", contextAttributes));
    if(gl){
        gl.webgl2 = true;
        console.log("Loaded WebGL 2.0.");
    }else{
        gl = /** @type {WebGLRenderingContext} */ (
            glcanvas.getContext("webgl", contextAttributes));
        if (gl){
            if (/[?&]frag_depth=0/.test(window.location.search)) {
                this.glExtFragDepth = null;
            }else {
                this.glExtFragDepth = gl.getExtension("EXT_frag_depth");
                if (!this.glExtFragDepth) {
                    console.log("EXT_frag_depth extension not supported.");
                }
            }
        }else{
            gl = /** @type {WebGLRenderingContext} */ (
                glcanvas.getContext("experimental-webgl", contextAttributes));
        }
    }
    if (!gl)
        throw new GlError(`Could not obtain a WebGL context.\nReason: ${errorInfo}`);
    CindyGL.gl = gl;
    // TODO update texture type test to wegl2 canvas
    glcanvas.removeEventListener(
        "webglcontextcreationerror",
        onContextCreationError, false);
    if (!use8bittextures) {
        can_use_texture_float = gl.getExtension('OES_texture_float') && gl.getExtension('OES_texture_float_linear');
        if (!can_use_texture_float) {
            console.error("Your browser does not suppert OES_texture_float, trying OES_texture_half_float...");
            halfFloat = gl.getExtension('OES_texture_half_float');
            can_use_texture_half_float = halfFloat && gl.getExtension('OES_texture_half_float_linear');
            if (!can_use_texture_half_float)
                console.error("Your browser does not suppert OES_texture_half_float, will use 8-bit textures.");
        }

        if (navigator.userAgent.match(/(iPad|iPhone)/i)) { //TODO: detect this better by checking wheather building a toy shader fails...
            console.log("You are using an iPhone/iPad.");
            can_use_texture_float = can_use_texture_half_float = false;
            if (gl.getExtension('OES_texture_half_float') && gl.getExtension('OES_texture_half_float_linear') && gl.getExtension('EXT_color_buffer_half_float')) {
                can_use_texture_half_float = true;
            } else {
                console.error("Your browser does not suppert writing to half_float textures, we will use 8-bit textures.");
            }


        }
    }
    isinitialized = true;
}
