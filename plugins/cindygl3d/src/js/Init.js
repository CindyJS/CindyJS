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
    if (!gl)
        throw new GlError(`Could not obtain a WebGL2 context.\nReason: ${errorInfo}`);
    console.log("Loaded WebGL 2.0.");
    CindyGL3D.gl = gl;
    glcanvas.removeEventListener(
        "webglcontextcreationerror",
        onContextCreationError, false);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    isinitialized = true;
}
