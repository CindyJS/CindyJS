/**
 * CindyXR is a CindyJS plug-in for outputting Cindy3D and CindyGL scenes on a VR or AR
 * device using the WebXR API.
 */

let CindyXR = function (api) {
    //////////////////////////////////////////////////////////////////////
    // API bindings

    /** @type {CindyJS.anyval} */
    let nada = api.nada;

    /** @type {function(CindyJS.anyval):CindyJS.anyval} */
    let evaluate = api.evaluate;

    /** @type {function(string,number,CindyJS.op)} */
    let defOp = api.defineFunction;

    //////////////////////////////////////////////////////////////////////
    // Modifier handling

    /**
     * @param {Object} modifs
     * @param {Object} handlers
     */
    function handleModifs(modifs, handlers) {
        let key, handler;
        for (key in modifs) {
            handler = handlers[key];
            if (handler) handler(evaluate(modifs[key]));
            else console.log("Modifier " + key + " not supported");
        }
    }

    //////////////////////////////////////////////////////////////////////
    // Plugin variables

    // The instance name of the Cindy3D instance to use.
    let instanceName = "Cindy3D";
    let isGLInitialized = false;

    //////////////////////////////////////////////////////////////////////
    // The CindyScript functions provided by this plug-in.

    /**
     * Initializes WebXR for use with Cindy3D.
     * This function assumes a Cindy3D instance with name "Cindy3D" should be used.
     *
     * Modifs:
     * - The instance name is the name of the Cindy3D instance to use for the WebXR session.
     *
     * - The reference mode can be either...
     *    o 'local' for a seated VR/AR experience.
     *    o 'local-floor' for a standing VR/AR experience.
     *    o 'bounded-floor' for standing VR/AR experiences with a space bounded by a simple polygon.
     *    o 'unbounded' for standing VR/AR experiences with an unbounded space.
     *   The standard value is 'local-floor'.
     *
     * - The scaling factor specifies what fraction the rendering resolution is of the
     *   screen/canvas resolution. The standard is 1 (i.e., full resolution).
     *   This can be used to get better performance in complex scenes.
     *
     * - Whether to hide or show the main (non-WebGL) CindyJS canvas (default: true).
     */
    defOp("initxrcindy3d", 0, function (args, modifs) {
        xrCindyPluginMode = "Cindy3D";
        let canvasWidth = 800;
        let canvasHeight = 600;
        let hideCanvas = true;
        handleModifs(modifs, {
            instancename: (a) => (instanceName = coerce.toString(a, "Cindy3D")),
            referencemode: (a) => xrSetReferenceMode(coerce.toString(a, "local-floor")),
            scaling: (a) => xrSetScalingFactor(coerce.toReal(a, 1)),
            canvaswidth: (a) => (canvasWidth = coerce.toReal(a, 800)),
            canvasheight: (a) => (canvasWidth = coerce.toReal(a, 600)),
            hidecanvas: (a) => (hideCanvas = coerce.toBool(a, true)),
        });

        api.evaluate({
            ctype: "function",
            oper: "begin3d$0",
            args: [{ ctype: "string", value: instanceName }],
            modifs: {},
        });

        let gl = CindyJS._pluginRegistry.Cindy3D.instances[instanceName].gl;
        initXR(api, gl, canvasWidth, canvasHeight, hideCanvas);

        api.evaluate({
            ctype: "function",
            oper: "end3d$0",
            args: [],
            modifs: {},
        });

        return nada;
    });

    /**
     * Initializes WebXR for use with CindyGL.
     *
     * Modifs:
     * - The instance name is the name of the Cindy3D instance to use for the WebXR session.
     *
     * - The reference mode can be either...
     *    o 'local' for a seated VR/AR experience.
     *    o 'local-floor' for a standing VR/AR experience.
     *    o 'bounded-floor' for standing VR/AR experiences with a space bounded by a simple polygon.
     *    o 'unbounded' for standing VR/AR experiences with an unbounded space.
     *   The standard value is 'local-floor'.
     *
     * - The scaling factor specifies what fraction the rendering resolution is of the
     *   screen/canvas resolution. The standard is 1 (i.e., full resolution).
     *   This can be used to get better performance in complex scenes.
     *
     * - Whether to hide or show the main (non-WebGL) CindyJS canvas (default: true).
     */
    defOp("initxrcindygl", 0, function (args, modifs) {
        xrCindyPluginMode = "CindyGL";
        let canvasWidth = 800;
        let canvasHeight = 600;
        let hideCanvas = true;
        handleModifs(modifs, {
            referencemode: (a) => xrSetReferenceMode(coerce.toString(a, "local-floor")),
            scaling: (a) => xrSetScalingFactor(coerce.toReal(a, 1)),
            canvaswidth: (a) => (canvasWidth = coerce.toReal(a, 800)),
            canvasheight: (a) => (canvasWidth = coerce.toReal(a, 600)),
            hidecanvas: (a) => (hideCanvas = coerce.toBool(a, true)),
        });

        // Call to CindyGL API to initialize WebGL if it is not yet loaded.
        CindyJS._pluginRegistry.CindyGL.initGLIfRequired();
        let gl = CindyJS._pluginRegistry.CindyGL.gl;
        initXR(api, gl, canvasWidth, canvasHeight, hideCanvas);
        isGLInitialized = true;
        return nada;
    });

    /**
     * For CindyXR, the draw CindyScript draw script can't be used for rendering, as the
     * refresh rate of a VR/AR device might differ from the refresh rate of the screen.
     * This function expects the invocation of the CindyScript function which should be
     * called for rendering.
     * Argument #0: The CindyScript rendering function.
     */
    defOp("xr", 1, function (args, modifs) {
        setRenderFunction(function () {
            api.evaluate(args[0]);
        });

        return nada;
    });

    /**
     * Returns the number of VR/AR views that need to be rendered (usually 1 for monoscopic
     * content and 2 for stereoscopic content).
     */
    defOp("getxrnumviews", 0, function (args, modifs) {
        return {
            ctype: "number",
            value: {
                real: xrGetNumViews(),
                imag: 0,
            },
        };
    });

    /**
     * Returns a two-element array containing the viewport width and height of a specific view.
     * Argument #0: The view index.
     */
    defOp("getxrviewportsize", 1, function (args, modifs) {
        let viewIndex = api.evaluate(args[0]).value.real;
        return nestedArrayToCSList(xrGetViewportSize(viewIndex).slice(2, 4));
    });

    /**
     * Returns the 4x4 view matrix of a specific view.
     * Argument #0: The view index.
     */
    defOp("getxrviewmatrix", 1, function (args, modifs) {
        let viewIndex = api.evaluate(args[0]).value.real;
        return nestedArrayToCSList(flatMatrix4ToNestedMatrix4RowMajor(xrGetViewMatrix(viewIndex)));
    });

    /**
     * Returns the 4x4 projection matrix of a specific view.
     *
     * NOTE: The projection matrix needs to be transposed, as WebGL/WebXR use a column-major format,
     * while Cindy3D/CindyScript use a row-major format. The view matrix is stored in the Cindy3D
     * camera in row-major order, while the projection matrix is stored in column-major order.
     * This design choice was also carried over to CindyXR, as this way, it is at least consistent
     * with how Cindy3D handles this.
     *
     * Argument #0: The view index.
     */
    defOp("getxrprojectionmatrix", 1, function (args, modifs) {
        let viewIndex = api.evaluate(args[0]).value.real;
        return nestedArrayToCSList(flatMatrix4ToNestedMatrix4ColumnMajor(xrGetProjectionMatrix(viewIndex)));
    });

    /**
     * Returns the outline of the VR/AR floor boundaries as a list of points in R^3.
     * These points form a simple polygon (i.e., concave or convex, but not self-intersecting).
     * CAUTION: This function requires that the reference space is of type 'bounded-floor'.
     */
    defOp("getxrbounds", 0, function (args, modifs) {
        return nestedArrayToCSList(xrGetBoundsLine());
    });

    //////////////////////////////////////////////////////////////////////
    // Input API.

    /**
     * Returns a list of XRInputSource entries as CindyScript JSON dictionaries.
     *
     * // @see https://www.w3.org/TR/webxr/#xrinputsource-interface
     * XRInputSource := {
     * 	// Whether the input source is associated with a handedness
     * 	handedness: ("none" | "left" | "right"),
     * 	// For more details see: https://www.w3.org/TR/webxr/#xrinputsource-interface
     * 	targetRayMode: ("gaze" | "tracked-pointer" | "screen"),
     *
     * 	// For tracking the input source in space
     * 	targetRaySpaceTransform: <XRRigidTransform>,
     * 	gripSpaceTransform: <XRRigidTransform>,
     *
     * 	// For getting gamepad button presses, ...
     * 	gamepad: ?<Gamepad>,
     *
     * 	// Example for profile: ["valve-index", "htc-vive", "generic-trigger-squeeze-touchpad-thumbstick"]
     * 	profiles: [
     * 		// ... list of strings ...
     * 	]
     * }
     *
     * XRRigidTransform := {
     *	// The position in homogeneous coordinates
     *  position: [ x, y, z, w ],
     * 	// The orientation as a quaternion
     * 	orientation: [ x, y, z, w ],
     * 	// The total transform as a 4x4 matrix
     * 	matrix: [[ a_11, ...], ...]
     * }
     *
     * // @see https://w3c.github.io/gamepad/#dom-gamepad
     * Gamepad := {
     * 	id: <string>,
     * 	index: <number>,
     * 	connected: <boolean>,
     * 	mapping: ("" | "standard" | "xr-standard"),
     * 	axes: list<number>,
     * 	buttons: list<GamepadButton>
     * }
     *
     * // @see https://w3c.github.io/gamepad/#dom-gamepadbutton
     * GamepadButton := {
     * 	pressed: <boolean>,
     * 	touched: <boolean>,
     * 	value: double
     * }
     */
    defOp("getxrinputsources", 0, function (args, modifs) {
        // Finally, extract all necessary information from the JavaScript objects.
        return convertObjectToCindyDict(xrFilterInputSourceArray(xrGetInputSources()), new Set([]), new Map());
    });
};

// Exports for use in Cindy3D and CindyGL.
CindyXR.xrGetNumViews = xrGetNumViews;
CindyXR.xrGetFramebuffer = xrGetFramebuffer;
CindyXR.xrGetViewportSize = xrGetViewportSize;
CindyXR.xrGetViewMatrix = xrGetViewMatrix;
CindyXR.xrGetProjectionMatrix = xrGetProjectionMatrix;
CindyXR.xrPreRender = xrPreRender;
CindyXR.xrPostRender = xrPostRender;
CindyXR.xrUpdateCindy3DCamera = xrUpdateCindy3DCamera;
CindyXR.xrUpdateCindyGLView = xrUpdateCindyGLView;
CindyJS.registerPlugin(1, "CindyXR", CindyXR);
