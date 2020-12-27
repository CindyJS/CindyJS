/**
 * @file WebXRScalingHelper.js
 * At the time of creating CindyXR, framebufferScaleFactor is still not properly supported in many WebXR
 * implementations. The goal of this scaling helper is to enable the users of CindyXR to render at
 * downscaled resolutions anyway by rendering to a different render target using lower resolution textures.
 */

/**
 * This class represents a render target for rendering to a lower (upscaling) or higher (downscaling)
 * resolution texture than what WebXR uses.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} width The number of pixels in x direction used for the render target.
 * @param {number} height The number of pixels in y direction used for the render target.
 */
function XRHelperRenderTarget(gl, width, height, xrWidth, xrHeight) {
    /// @type {number} The WebXR resolution width.
    this.xrWidth = xrWidth;
    /// @type {number} The WebXR resolution height.
    this.xrHeight = xrHeight;
    /// @type {number} The render target resolution width.
    this.width = width;
    /// @type {number} The render target resolution height.
    this.height = height;
    /// @type {WebGLTexture}
    this.renderTexture = createRenderTexture(gl, width, height);
    /// @type {WebGLRenderbuffer} The depth buffer.
    this.depthRenderbuffer = createDepthRenderbuffer(gl, width, height);
    /// @type {WebGLFramebuffer}
    this.framebufferObject = createFramebufferObject(gl, this.renderTexture, this.depthRenderbuffer);
}

/**
 * The global list of XRHelperRenderTarget objects.
 * The render targets are updated by @see recreateRenderTargetHelpersIfNecessary.
 * @type {XRHelperRenderTarget[]}
 */
let renderTargetHelpers = [];
/**
 * The current scaling factor used for the render target list (@see renderTargetHelpers).
 * @type {XRHelperRenderTarget[]}
 */
let renderTargetHelpersCurrentScalingFactor = 1.0;
/**
 * Whether scaling is actually enabled. This value is set to true if the scaling factor is 1.0.
 * Otherwise it is set to false. If this variable is set to false, no scaling is applied, thus
 * saving a bit of computational time.
 * @type {boolean}
 */
let useRenderTargetHelpers = false;
/**
 * A shader program that blits a texture to the render target as a screen-filling quad.
 * @type {WebGLProgram}
 */
var fullscreenBlitShader = null;
/**
 * A WebGL vertex buffer storing the vertex and texture coordinate data for rendering a screen-filling
 * quad (in NDC/normalized device coordinates).
 * @type {WebGLBuffer}
 */
var fullscreenQuadVertexBuffer = null;

/**
 * This function is called before rendering to any render targets. If the scaling factor, the viewport
 * size or the number of views has changed, this function recreates the render targets.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 */
function recreateRenderTargetHelpersIfNecessary(gl) {
    if (fullscreenBlitShader == null) {
        createFullscreenBlitShader(gl);
        createFullscreenQuadRenderData(gl);
    }

    let hasResolutionChanged = false;
    let numViews = xrGetNumViews();
    let xrScalingFactor = xrGetScalingFactor();

    // Number of views or scaling factor changed?
    if (renderTargetHelpers.length == numViews && renderTargetHelpersCurrentScalingFactor == xrScalingFactor) {
        // Resolution changed?
        for (let viewIndex = 0; viewIndex < numViews; viewIndex++) {
            let viewportSize = xrGetViewportSize(viewIndex);
            let xrWidth = viewportSize[2];
            let xrHeight = viewportSize[3];
            if (
                xrWidth != renderTargetHelpers[viewIndex].xrWidth ||
                xrHeight != renderTargetHelpers[viewIndex].xrHeight
            ) {
                hasResolutionChanged = true;
            }
        }
        if (!hasResolutionChanged) {
            return;
        }
    }

    renderTargetHelpersCurrentScalingFactor = xrScalingFactor;
    renderTargetHelpers = [];
    for (let viewIndex = 0; viewIndex < numViews; viewIndex++) {
        let viewportSize = xrGetViewportSize(viewIndex);
        let xrWidth = viewportSize[2];
        let xrHeight = viewportSize[3];
        let width = Math.ceil(xrWidth * xrScalingFactor);
        let height = Math.ceil(xrHeight * xrScalingFactor);
        renderTargetHelpers.push(new XRHelperRenderTarget(gl, width, height, xrWidth, xrHeight));
    }
}

/**
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} width The number of pixels in x direction used for the render target.
 * @param {number} height The number of pixels in y direction used for the render target.
 * @return {WebGLTexture} The created render texture.
 */
function createRenderTexture(gl, width, height) {
    let renderTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return renderTexture;
}

/**
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} width The number of pixels in x direction used for the render target.
 * @param {number} height The number of pixels in y direction used for the render target.
 * @return {WebGLRenderbuffer} The created depth render buffer.
 */
function createDepthRenderbuffer(gl, width, height) {
    let depthRenderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    return depthRenderbuffer;
}

/**
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {WebGLTexture} renderTexture The render texture to attach to the framebuffer object.
 * @param {WebGLRenderbuffer} depthRenderbuffer The depth renderbuffer to attach to the framebuffer object.
 * @return {WebGLFramebuffer} The created framebuffer object.
 */
function createFramebufferObject(gl, renderTexture, depthRenderbuffer) {
    let framebufferObject = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebufferObject);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRenderbuffer);

    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) {
        if (status == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
            console.log("gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
        } else if (status == gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
            console.log("gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
        } else if (status == gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS) {
            console.log("gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
        } else if (status == gl.FRAMEBUFFER_UNSUPPORTED) {
            console.log("gl.FRAMEBUFFER_UNSUPPORTED");
        } else {
            console.log("Unknown framebuffer error.");
        }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return framebufferObject;
}

/**
 * Creates the shader program for blitting a texture in a fullscreen format.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @return {WebGLProgram} The shader program.
 */
function createFullscreenBlitShader(gl) {
    let vertexShaderCode =
        "attribute vec3 aPos;" +
        "attribute vec2 aTexCoord;" +
        "varying vec2 iUv;" +
        "void main() {" +
        "iUv = aTexCoord;" +
        "gl_Position = vec4(aPos, 1.0);" +
        "}";
    let fragmentShaderCode =
        "precision highp float;" +
        "uniform sampler2D readTexture;" +
        "varying vec2 iUv;" +
        "void main() {" +
        "gl_FragColor = texture2D(readTexture, iUv);" +
        "}";
    fullscreenBlitShader = new ShaderProgram(gl, vertexShaderCode, fragmentShaderCode);
}

/**
 * Creates a WebGL vertex buffer storing the vertex and texture coordinate data for rendering a screen-filling
 * quad (in NDC/normalized device coordinates).
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 */
function createFullscreenQuadRenderData(gl) {
    fullscreenQuadVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadVertexBuffer);

    // Vertex positions of the quad in normalized device coordinates.
    let vertexPositions = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
    let texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

    let texCoordOffsetFullscreenQuad = 4 * 4 * 3; // vertexPositions.byteLength
    gl.bufferData(gl.ARRAY_BUFFER, texCoordOffsetFullscreenQuad + texCoords.byteLength, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexPositions);
    gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffsetFullscreenQuad, texCoords);
}

/**
 * Binds the helper render target of a certain view and clears it before use.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} viewIndex The view index.
 */
function bindHelperRenderTarget(gl, viewIndex) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTargetHelpers[viewIndex].framebufferObject);
    gl.viewport(0, 0, renderTargetHelpers[viewIndex].width, renderTargetHelpers[viewIndex].height);
    gl.depthMask(true);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

/**
 * Blits the view textures rendered to by the helper framebuffers to the WebXR framebuffer.
 * @param {WebGLRenderingContext} gl The WebGL context.
 */
function blitHelperFramebuffersFullscreen(gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, xrGetFramebuffer());
    fullscreenBlitShader.use(gl);
    gl.activeTexture(gl.TEXTURE0);
    fullscreenBlitShader.uniform["readTexture"]([0]);

    let texCoordOffsetFullscreenQuad = 4 * 4 * 3; // vertexPositions.byteLength
    var aPosLoc = gl.getAttribLocation(fullscreenBlitShader.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);
    var aTexLoc = gl.getAttribLocation(fullscreenBlitShader.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadVertexBuffer);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffsetFullscreenQuad);

    for (let viewIndex = 0; viewIndex < renderTargetHelpers.length; viewIndex++) {
        let viewportSize = xrGetViewportSize(viewIndex);
        gl.viewport(viewportSize[0], viewportSize[1], viewportSize[2], viewportSize[3]);
        gl.bindTexture(gl.TEXTURE_2D, renderTargetHelpers[viewIndex].renderTexture);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    gl.disableVertexAttribArray(aPosLoc);
    gl.disableVertexAttribArray(aTexLoc);
}
