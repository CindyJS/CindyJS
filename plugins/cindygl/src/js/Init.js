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

/** @type {WebGL2RenderingContext} */
var gl;

var nada;

var can_use_texture_half_float = false;
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
    gl = glcanvas.getContext("webgl2", contextAttributes);
    if (!gl)
        throw new GlError(`Could not obtain a WebGL2 context.\nReason: ${errorInfo}`);
    console.log("Loaded WebGL 2.0.");
    CindyGL.gl = gl;
    glcanvas.removeEventListener(
        "webglcontextcreationerror",
        onContextCreationError, false);
    if(!use8bittextures) {
        can_use_texture_float = !! gl.getExtension('EXT_color_buffer_float') && gl.getExtension('OES_texture_float_linear');
        if(! can_use_texture_float) {
            console.error("Your browser does not support EXT_color_buffer_float, trying EXT_color_buffer_half_float...");
            // half-float textures are linear by default in WebGL2 -> no need to check extension
            can_use_texture_half_float = !! gl.getExtension('EXT_color_buffer_half_float');
            if(!can_use_texture_half_float) {
                // TODO test support for this extension (it does not seem to automatically exist on machines that support EXT_color_buffer_float)
                console.error("Your browser does not support EXT_color_buffer_half_float, will use 8-bit textures.");
            }
        }
    }
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    isinitialized = true;
}
