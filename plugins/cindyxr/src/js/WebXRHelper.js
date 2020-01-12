/**
 * CindyJS WebXR integration code:
 * 
 * Copyright 2019 Christoph Neuhauser
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 * Initial WebXR example code
 * (https://github.com/immersive-web/webxr-samples/blob/master/room-scale.html):
 *
 * Copyright 2018 The Immersive Web Community Group
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

 /**
  * The current WebXR frame.
  * @type {XRFrame}
  */
let xrLastFrame = null;
/**
 * The viewer pose in the current frame.
 * @type {XRViewerPose}
 */
let xrLastViewerPose = null;
/**
 * The render function callback. This is usually a wrapper around a CindyScript function.
 * @type {function}
 */
let renderFunction = null;
/**
 * A button for starting VR/AR mode.
 * @type {WebXRButton}
 */
let xrButton = null;
/**
 * The used reference space for tracking in VR.
 * @type {xrImmersiveRefSpace}
 */
let xrImmersiveRefSpace = null;
/**
 * A viewer helper for inline sessions not using a real VR/AR device.
 * @type {InlineViewerHelper}
 */
let inlineViewerHelper = null;
/**
 * The WebGL rendering context used for WebXR.
 * @type {WebGLRenderingContext}
 */
let xrgl = null;
/**
 * The width of the preview canvas in pixels.
 * @type {number}
 */
let xrCanvasWidth = 800;
/**
 * The height of the preview canvas in pixels.
 * @type {number}
 */
let xrCanvasHeight = 600;
/**
 * Whether WebXR was already initialized.
 * @type {boolean}
 */
let xrInitialized = false;

/**
 * Necessary until more browsers natively support WebXR.
 */
let xrPolyfill = null;
if ('xr' in navigator === false) {
    console.log("WebXR polyfill loaded.")
    xrPolyfill = new WebXRPolyfill(); // {allowCardboardOnDesktop: true}
}

/**
 * A temporary copy of the camera view matrix when the real matrix is modified for use with WebXR.
 * @type {number}
 */
let xrScalingFactor = 1.0;
/**
 * The reference mode can be either...
 * - 'local' for a seated VR/AR experience.
 * - 'local-floor' for a standing VR/AR experience.
 * - 'bounded-floor' for standing VR/AR experiences with a space bounded by a simple polygon.
 * - 'unbounded' for standing VR/AR experiences with an unbounded space.
 * The standard value is 'local-floor'.
 * @type {string}
 */
let xrReferenceMode = 'local-floor';
/**
 * A temporary copy of the camera view matrix when the real matrix is modified for use with WebXR.
 * @type {number[][]}
 */
let viewMatrixTmp;
/**
 * A temporary copy of the camera projection matrix when the real matrix is modified for use with WebXR.
 * @type {number[][]}
 */
let projMatrixTmp;
/**
 * A temporary copy of the camera model-view matrix when the real matrix is modified for use with WebXR.
 * @type {number[][]}
 */
let mvMatrixTmp;

/**
 * @return {number} The number of VR/AR views that need to be rendered (usually 1 for monoscopic content
 * and 2 for stereoscopic content).
 */
function xrGetNumViews() {
    if (!xrLastViewerPose) {
        return 0;
    }
    return xrLastViewerPose.views.length;
}

/**
 * @return {WebGLFramebuffer} The WebGL framebuffer provided by WebXR for rendering the final output image.
 */
function xrGetFramebuffer() {
    if (!xrLastFrame) {
        return null;
    }
    return xrLastFrame.session.renderState.baseLayer.framebuffer;
}

/**
 * Returns the viewport size (lower-left x and y coordinates and width and height) of a specific view as a
 * list of four numbers.
 * @param {number} viewIndex The view index.
 * @return {number[4]} The viewport size.
 */
function xrGetViewportSize(viewIndex) {
    let layer = xrLastFrame.session.renderState.baseLayer;
    let view = xrLastViewerPose.views[viewIndex];
    let viewport = layer.getViewport(view);
    return [viewport.x, viewport.y, viewport.width, viewport.height];
}

/**
 * @return {number} Returns the resolution scaling factor currently used when rendering.
 */
function xrGetScalingFactor() {
    return xrScalingFactor;
}

/**
 * Sets the resolution scaling factor that should be used for rendering.
 * @param {number} factor The new scaling factor.
 */
function xrSetScalingFactor(factor) {
    useRenderTargetHelpers = (factor != 1.0);
    xrScalingFactor = factor;
}

/**
 * Sets the reference mode that should be used for tracking.
 * @param {string} referenceMode The reference mode name.
 */
function xrSetReferenceMode(referenceMode) {
    xrReferenceMode = referenceMode;
}

/**
 * @return {string} The WebXR reference space. 
 */
function xrGetReferenceSpace() {
    let refSpace = xrLastFrame.session.isImmersive ? xrImmersiveRefSpace : inlineViewerHelper.referenceSpace;
    return refSpace;
}


/**
 * Transposes a flat 4x4 matrix.
 * @param {Array.<number>} m The 4x4 matrix.
 * @return {Array.<number>} The transposed matrix.
 */
function transpose4(m) {
    return [
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15]
    ];
};

/**
 * Converts a Float32Array to a number array.
 * @param {Float32Array} m
 * @return {Array.<number>}
 */
function float32ArrayToArray(m) {
    let newArray = [];
    for (let i = 0; i < m.length; i++) {
        newArray.push(m[i]);
    }
    return newArray;
};

/**
 * The view matrix needs to be transposed, as WebGL/WebXR use a column-major format,
 * while Cindy3D/CindyScript use a row-major format.
 * The view matrix is stored in the Cindy3D camera in row-major order, while the
 * projection matrix is stored in column-major order.
 * This design choice was also carried over to CindyXR, as this way, it is at least
 * consistent with how Cindy3D handles this.
 * 
 * @return {number[16]} The view matrix that should be used for a specific WebXR view.
 */
function xrGetViewMatrix(viewIndex) {
    return transpose4(float32ArrayToArray(xrLastViewerPose.views[viewIndex].transform.inverse.matrix));
}

/**
 * @return {number[16]} The projection matrix that should be used for a specific WebXR view.
 */
function xrGetProjectionMatrix(viewIndex) {
    return float32ArrayToArray(xrLastViewerPose.views[viewIndex].projectionMatrix);
}

/**
 * Sets the render function callback. This is usually a wrapper around a CindyScript function.
 * @param {function} _renderFunction 
 */
function setRenderFunction(_renderFunction) {
    renderFunction = _renderFunction;
}

/**
 * Sets up the Cindy3D camera for use with WebXR.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {Camera} cindy3DCamera The Cindy3D camera.
 */
function xrPreRender(gl, cindy3DCamera) {
    // Save the old camera matrices.
	viewMatrixTmp = cindy3DCamera.viewMatrix.slice();
	projMatrixTmp = cindy3DCamera.projectionMatrix.slice();
    mvMatrixTmp = cindy3DCamera.mvMatrix.slice();
    
    if (!useRenderTargetHelpers) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, xrGetFramebuffer());
    } else {
        // Use scaling.
        if (viewIndex == 0) {
            recreateRenderTargetHelpersIfNecessary(gl);
        }
    }
}

/**
 * Resets the changes done by @see xrPreRender to the WebGL context and the Cindy3D camera.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {Camera} cindy3DCamera The Cindy3D camera.
 * @param {number} screenWidth The width of the WebGL canvas in pixels.
 * @param {number} screenHeight The height of the WebGL canvas in pixels.
 */
function xrPostRender(gl, cindy3DCamera, screenWidth, screenHeight) {
    cindy3DCamera.viewMatrix = viewMatrixTmp.slice();
	cindy3DCamera.projectionMatrix = projMatrixTmp.slice();
    cindy3DCamera.mvMatrix = mvMatrixTmp.slice();
    
    if (useRenderTargetHelpers) {
         // Use scaling.
         blitHelperFramebuffersFullscreen(gl, xrGetFramebuffer());
    }
}

/**
 * Updates the Cindy3D camera matrices for rendering to a specific view.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} viewIndex The index of the quilt view.
 * @param {Camera} cindy3DCamera The Cindy3D camera.
 */
function xrUpdateCindy3DCamera(gl, viewIndex, cindy3DCamera) {
    if (!useRenderTargetHelpers) {
        let viewportSize = xrGetViewportSize(viewIndex);
        gl.viewport(viewportSize[0], viewportSize[1], viewportSize[2], viewportSize[3]);
    } else {
        bindHelperRenderTarget(gl, viewIndex);
    }

    let viewMatXR = transpose4(xrLastViewerPose.views[viewIndex].transform.inverse.matrix);
    cindy3DCamera.projectionMatrix = xrGetProjectionMatrix(viewIndex);
    cindy3DCamera.viewMatrix = viewMatXR;/*mul4mm(viewMatXR, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, -cindy3DCamera.viewDist,
        0, 0, 0, 1
    ])*/;
    cindy3DCamera.modelMatrix = /*[
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, -cindy3DCamera.viewDist,
        0, 0, 0, 1
    ];*/[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
	cindy3DCamera.mvMatrix = mul4mm(cindy3DCamera.viewMatrix, cindy3DCamera.modelMatrix);
}


/**
 * Analogously to xrUpdateCindy3DCamera, this function sets the rendering state for CindyGL
 * to render to a specific view.
 * This function is called by "colorplotxr".
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} viewIndex The index of the quilt view.
 */
function xrUpdateCindyGLView(gl, viewIndex) {
    if (!useRenderTargetHelpers) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, xrGetFramebuffer());
        let viewportSize = xrGetViewportSize(viewIndex);
        gl.viewport(viewportSize[0], viewportSize[1], viewportSize[2], viewportSize[3]);
    } else {
        if (viewIndex == 0) {
            recreateRenderTargetHelpersIfNecessary(gl);
        }
        bindHelperRenderTarget(gl, viewIndex);
    }
}

/**
 * This function is called by "finalizexr" after all calls to "colorplotxr" were made.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} screenWidth The width of the WebGL canvas in pixels.
 * @param {number} screenHeight The height of the WebGL canvas in pixels.
 */
function xrPostRenderCindyGL() {
    if (useRenderTargetHelpers) {
        blitHelperFramebuffersFullscreen(xrgl, xrGetFramebuffer());
    }
}


/**
 * Initializes WebXR using a certain WebGL context.
 * NOTE: It is necessary that the WebGL context is initialized with the 'xrCompatible' flag.
 * This is handled automatically in Cindy3D and CindyGL if the CindyXR plug-in is loaded.
 * @param {WebGLRenderingContext} gl The WebGL rendering context.
 * @param {number} canvasWidth The width of the preview canvas in pixels.
 * @param {number} canvasHeight The height of the preview canvas in pixels.
 */
function initXR(gl, canvasWidth, canvasHeight) {
    xrgl = gl;
    xrCanvasWidth = canvasWidth;
    xrCanvasHeight = canvasHeight;

    xrButton = new XRDeviceButton({
        onRequestSession: onRequestSession,
        onEndSession: onEndSession
    });
    document.body.appendChild(xrButton.domElement);
    if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
            xrButton.enabled = supported;
        });
        navigator.xr.requestSession('inline').then(onSessionStarted);
    }
}

/**
 * This function is called when the user requests a VR/AR session.
 */
function onRequestSession() {
    let requiredFeatures = [];
    let optionalFeatures = [];
    if (xrReferenceMode == 'local-floor') {
        requiredFeatures = ['local-floor'];
        optionalFeatures = ['bounded-floor'];
    } else if (xrReferenceMode == 'bounded-floor') {
        requiredFeatures = ['local-floor', 'bounded-floor'];
    } else if (xrReferenceMode == 'unbounded') {
        requiredFeatures = ['unbounded'];
    }

    navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: requiredFeatures,
        optionalFeatures: optionalFeatures
    }).then((session) => {
        xrButton.setSession(session);
        session.isImmersive = true;
        onSessionStarted(session);
    });
}

/**
 * This function initializes the WebGL context/its canvas for use with WebXR. 
 */
function initGL() {
    if (!xrInitialized) {
        xrInitialized = true;
    } else {
        return;
    }

    if (xrgl.canvas.width == 0 || xrgl.canvas.height == 0) {
        xrgl.canvas.width = xrCanvasWidth;
        xrgl.canvas.height = xrCanvasHeight;
        xrgl.canvas.style.display = 'block';
        document.getElementById('CSCanvas').style.display = 'none';
    }

    /*function onResize() {
        xrgl.canvas.width = xrgl.canvas.clientWidth * window.devicePixelRatio;
        xrgl.canvas.height = xrgl.canvas.clientHeight * window.devicePixelRatio;
    }
    window.addEventListener('resize', onResize);
    onResize();*/
}

/**
 * This function is called when a VR/AR session is started.
 * @param {XRSession} session 
 */
function onSessionStarted(session) {
    session.addEventListener('end', onSessionEnded);
    initGL();
    /*
     * Unfortunately, as of writing, framebufferScaleFactor is still not properly supported by
     * many WebXR implementations. Instead, the code in WebXRScalingHelper.js should be used.
     */
    //let scaleFactor = XRWebGLLayer.getNativeFramebufferScaleFactor(session);
    //let scaleFactor = 0.5;
    let glLayer = new XRWebGLLayer(session, xrgl/*, { framebufferScaleFactor: scaleFactor }*/);
    session.updateRenderState({ baseLayer: glLayer });
    let refSpaceType = session.isImmersive ? xrReferenceMode : 'viewer';
    session.requestReferenceSpace(refSpaceType).then((refSpace) => {
        if (session.isImmersive) {
            xrImmersiveRefSpace = refSpace;
        } else {
            // If we're using a viewer reference space we need to scoot the
            // origin down a bit to put the camera at approximately the right
            // level. (Here we're moving it 1.6 meters, which is *very* roughly
            // the eye height of an "average" adult human.)
            inlineViewerHelper = new InlineViewerHelper(xrgl.canvas, refSpace);
            inlineViewerHelper.setHeight(1.6);
            // You can accomplish the same thing without the helper class by
            // simply offseting the reference space with a negative y value:
            // refSpace = refSpace.getOffsetReferenceSpace(new XRRigidTransform({y: -1.6}));
        }
        session.requestAnimationFrame(onXRFrame);
    });
}

/**
 * This functions ends the passed WebXR session.
 * @param {XRSession} session 
 */
function onEndSession(session) {
    session.end();
}

/**
 * This function is called when the VR/AR session was ended (usually by the user).
 * @param {XRSessionEvent} event 
 */
function onSessionEnded(event) {
    if (event.session.isImmersive) {
        xrButton.setSession(null);
    }
}


/**
 * Returns the outline of the VR/AR floor boundaries as a list of points.
 * These points form a simple polygon (i.e., concave or convex, but not self-intersecting).
 * CAUTION: This function requires that the reference space is of type 'bounded-floor'.
 * @return {number[][3]} The outline as a list of points in R^3.
 */
function xrGetBoundsLine() {
    let boundsLine = [];
    let numPoints = xrImmersiveRefSpace.boundsGeometry.length;
    for (let i = 0; i < numPoints; ++i) {
        let pt = xrImmersiveRefSpace.boundsGeometry[i];
        boundsLine.push([pt.x, 0, pt.z]);
    }
    return boundsLine;
}


/// For debug output (@see onXRFrame).
//let lastTimestamp = 0;

/**
 * This function is called when rendering a new frame is requested by WebXR.
 * This happens usually at the refresh rate of the VR/AR device.
 * @param {number} t The current time stamp (in milliseconds).
 * @param {XRFrame} frame The current WebXR frame.
 */
function onXRFrame(t, frame) {
    let session = frame.session;
    let refSpace = session.isImmersive ? xrImmersiveRefSpace : inlineViewerHelper.referenceSpace;
    let pose = frame.getViewerPose(refSpace);

    session.requestAnimationFrame(onXRFrame);
    drawXRFrame(frame, pose);
}

/**
 * Draws a frame using the passed WebXR frame data.
 * @param {XRFrame} frame The current WebXR frame.
 * @param {XRViewerPose} pose The viewer pose in the current frame.
 */
function drawXRFrame(frame, pose) {
    xrLastFrame = frame;
    xrLastViewerPose = pose;
    renderFunction();
}

/**
 * Returns the currently available XR input sources.
 * @see https://www.w3.org/TR/webxr/#xrinputsource-interface
 * @return {XRInputSource[]} A list of available XR input sources.
 */
function xrGetInputSources() {
    return xrLastFrame.session.inputSources;
}


// Exports for use in Cindy3D and CindyGL.
window['xrGetNumViews'] = xrGetNumViews;
window['xrGetFramebuffer'] = xrGetFramebuffer;
window['xrGetViewportSize'] = xrGetViewportSize;
window['xrGetViewMatrix'] = xrGetViewMatrix;
window['xrGetProjectionMatrix'] = xrGetProjectionMatrix;
window['xrPreRender'] = xrPreRender;
window['xrPostRender'] = xrPostRender;
window['xrUpdateCindy3DCamera'] = xrUpdateCindy3DCamera;
window['xrUpdateCindyGLView'] = xrUpdateCindyGLView;
