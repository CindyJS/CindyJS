/**
 * CindyXR is a CindyJS plug-in for outputting Cindy3D and CindyGL scenes on a VR or AR
 * device using the WebXR API.
 */

CindyJS.registerPlugin(1, "CindyXR", function(api) {
	
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
		if (handler)
			handler(evaluate(modifs[key]));
		else
			console.log("Modifier " + key + " not supported");
		}
	}


	//////////////////////////////////////////////////////////////////////
	// Cindy script helper functions

	/**
	 * Recursively converts a nested JavaScript array to a CindyScript list of the same structure.
	 * This function only handles numbers at the final recursion step.
	 * @param {Array|number} l The JavaScript list.
	 * @return {CindyJS.anyval} The CindyScript representation of the list.
	 */
	function nestedArrayToCSList(l) {
		if (Array.isArray(l)) {
			return {
				'ctype': 'list',
				'value': l.map(e => nestedArrayToCSList(e))
			};
		} else {
			return {
				"ctype": "number",
				"value": {
					'real': l,
					'imag': 0
				}
			};
		}
	}
	
	/**
	 * Converts a JavaScript object to a CindyScript JSON dictionary.
	 * Strings, numbers, boolean values and arrays are also handled correctly.
	 * Functions, as well as null and undefined values, are removed.
	 * @param {object|string|number|boolean|function|null|undefined|Array} obj An arbitrary JavaScript object.
	 * @param {Set<string>} blacklistNames A blacklist of properties to omit.
	 * This is used for removing a reference to the frame data when converting the hand data.
	 * @param {Map<object, object>} convertedObjectMap A map of already converted objects.
	 * These are excluded when converting child properties/objects, i.e., to remove cyclic dependencies.
	 * @return {object} A CindyScript object representing "obj".
	 */
	function convertObjectToCindyDict(obj, blacklistNames, convertedObjectMap) {
		if (obj instanceof Object) {
			// Cyclic dependency detected -> stop.
			if (convertedObjectMap.has(obj)) {
				return convertedObjectMap.get(obj);
			}
		}

		if (Array.isArray(obj)) {
			let cindyObjectList = [];
			obj.forEach(function(entry) {
				let cindyEntry = convertObjectToCindyDict(entry, blacklistNames, convertedObjectMap);
				if (cindyEntry != null) {
					cindyObjectList.push(cindyEntry);
				}
			});
			return {
				ctype : "list",
				value : cindyObjectList
			};
		} else if (typeof obj === "string" || obj instanceof String) {
			return {
				ctype : "string",
				value : obj
			};
		} else if (typeof obj === 'number' && isFinite(obj)) {
			return {
				ctype : "number",
				value : {
					"real" : obj,
					"imag" : 0
				}
			};
		} else if (typeof obj === 'boolean') {
			return {
				ctype : "boolean",
				value : obj
			};
		} else if (obj === null || typeof obj === 'undefined') {
			// Null is removed in upper levels of recursion (see else section).
			return null;
		} else if (typeof obj === 'function') {
			// Functions not supported. Null is removed in upper levels of recursion (see else section).
			return null;
		} else {
			// The CindyScript dictionary object.
			let dictionary = {};
			// Add this object to the set of the already converted objects visible for its properties.
			let convertedObjectMapChild = new Map(convertedObjectMap);
			convertedObjectMapChild.set(obj, dictionary);

			// Probably this is an object with key-value pairs.
			for (let key in obj) {
				if (blacklistNames.has(key)) {
					continue;
				}

				// No prototype?
				if (obj.hasOwnProperty(key)) {
					let value = obj[key];
					let cindyValue = convertObjectToCindyDict(value, blacklistNames, convertedObjectMapChild);
					dictionary[key] = cindyValue;
				}
			}

			return {
				ctype : "JSON",
				value : dictionary
			}		
		}
	}

	/**
	 * Converts a flat row-major 4x4 matrix to a nested 4x4 matrix.
	 * @param {number[16]} m A flat 4x4 matrix.
	 * @return {number[4][4]} The nested 4x4 matrix.
	 */
	function flatMatrix4ToNestedMatrix4RowMajor(m) {
		return [
			[m[0], m[1], m[2], m[3]],
			[m[4], m[5], m[6], m[7]],
			[m[8], m[9], m[10], m[11]],
			[m[12], m[13], m[14], m[15]]
		];
	}

	/**
	 * Converts a flat column-major 4x4 matrix to a nested 4x4 matrix.
	 * @param {number[16]} m A flat 4x4 matrix.
	 * @return {number[4][4]} The nested 4x4 matrix.
	 */
	function flatMatrix4ToNestedMatrix4ColumnMajor(m) {
		return [
			[m[0], m[4], m[8], m[12]],
			[m[1], m[5], m[9], m[13]],
			[m[2], m[6], m[10], m[14]],
			[m[3], m[7], m[11], m[15]]
		];
	}


	//////////////////////////////////////////////////////////////////////
	// Plugin variables

	// Whether Cindy3D or CindyGL is used together with CindyXR.
	let cindyPluginMode = "";
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
	 */
	defOp("initxrcindy3d", 0, function(args, modifs) {
		cindyPluginMode = "Cindy3D";
		let canvasWidth = 800;
		let canvasHeight = 600;
		handleModifs(modifs, {
			"instancename": (a => instanceName = coerce.toString(a, 'Cindy3D')),
			"referencemode": (a => xrSetReferenceMode(coerce.toString(a, 'local-floor'))),
			"scaling": (a => xrSetScalingFactor(coerce.toReal(a, 1))),
			"canvaswidth": (a => canvasWidth = coerce.toReal(a, 800)),
			"canvasHeight": (a => canvasWidth = coerce.toReal(a, 600))
		});
		
		api.evaluate({
			ctype : "function",
			oper : "begin3d$0",
			args : [{ctype : "string", value : instanceName}],
			modifs : {}
		});

		let gl = CindyJS._pluginRegistry.Cindy3D.instances[instanceName].gl;
		initXR(gl, canvasWidth, canvasHeight);

		api.evaluate({
			ctype : "function",
			oper : "end3d$0",
			args : [],
			modifs : {}
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
	 */
	defOp("initxrcindygl", 0, function(args, modifs) {
		cindyPluginMode = "CindyGL";
		let canvasWidth = 800;
		let canvasHeight = 600;
		handleModifs(modifs, {
			"referencemode": (a => xrSetReferenceMode(coerce.toString(a, 'local-floor'))),
			"scaling": (a => xrSetScalingFactor(coerce.toReal(a, 1))),
			"canvaswidth": (a => canvasWidth = coerce.toReal(a, 800)),
			"canvasHeight": (a => canvasWidth = coerce.toReal(a, 600))
		});

		// Call to CindyGL API to initialize WebGL if it is not yet loaded.
		initGLIfRequired();
		let gl = window['cindygl-gl'];
		initXR(gl, canvasWidth, canvasHeight);
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
	defOp("xr", 1, function(args, modifs) {
		setRenderFunction(function() {
			if (!isGLInitialized && cindyPluginMode == "Cindy3D") {
			}

			api.evaluate(args[0]);

			if (cindyPluginMode == "CindyGL") {
				xrPostRenderCindyGL();
			}
		});

		return nada;
	});

	/**
	 * Returns the number of VR/AR views that need to be rendered (usually 1 for monoscopic
	 * content and 2 for stereoscopic content).
	 */
	defOp("getxrnumviews", 0, function(args, modifs) {
		return {
			ctype : "number",
			value : {
				"real" : xrGetNumViews(),
				"imag" : 0
			}
		};
	});

	/**
	 * Returns a two-element array containing the viewport width and height of a specific view.
	 * Argument #0: The view index.
	 */
	defOp("getxrviewportsize", 1, function(args, modifs) {
		let viewIndex = api.evaluate(args[0]).value.real;
		return nestedArrayToCSList(xrGetViewportSize(viewIndex).slice(2, 4));
	});

	/**
	 * Returns the 4x4 view matrix of a specific view.
	 * Argument #0: The view index.
	 */
	defOp("getxrviewmatrix", 1, function(args, modifs) {
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
	defOp("getxrprojectionmatrix", 1, function(args, modifs) {
		let viewIndex = api.evaluate(args[0]).value.real;
		return nestedArrayToCSList(flatMatrix4ToNestedMatrix4ColumnMajor(xrGetProjectionMatrix(viewIndex)));
	});

	/**
	 * Returns the outline of the VR/AR floor boundaries as a list of points in R^3.
	 * These points form a simple polygon (i.e., concave or convex, but not self-intersecting).
	 * CAUTION: This function requires that the reference space is of type 'bounded-floor'.
	 */
	defOp("getxrbounds", 0, function(args, modifs) {
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
	let gCounter = 0;
	defOp("getxrinputsources", 0, function(args, modifs) {
		// Helper function for extracting transforms from XR spaces
		let identityTransform = {
			position: [0, 0, 0, 1],
			orientation: [0, 0, 0, 1],
			matrix: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
		};
		let extractTransform = function(xrSpace) {
			if (xrSpace == null) {
				return identityTransform;
			}
			let xrPose = xrLastFrame.getPose(xrSpace, xrGetReferenceSpace());
			if (xrPose == null) {
				return identityTransform;
			}
			let xrTransform = xrPose.transform;
			let filteredTransform = {
				position: [xrTransform.position.x, xrTransform.position.y, xrTransform.position.z, xrTransform.position.w],
				orientation: [xrTransform.orientation.x, xrTransform.orientation.y, xrTransform.orientation.z, xrTransform.orientation.w],
				matrix: flatMatrix4ToNestedMatrix4ColumnMajor(xrTransform.matrix)
			};
			return filteredTransform;
		}

		// Finally, extract all necessary information from the JavaScript objects.
		let inputSources = xrGetInputSources();
		let filteredInputSources = [];
		for (let i = 0; i < inputSources.length; i++) {
			let inputSource = inputSources[i];
			let filteredInputSource = {
				handedness: inputSource.handedness,
				targetRayMode: inputSource.targetRayMode,
				targetRaySpaceTransform: extractTransform(inputSource.targetRaySpace),
				gripSpaceTransform: extractTransform(inputSource.gripSpace),
				profiles: inputSource.profiles
			};
			if (typeof inputSource.gamepad !== "undefined" && inputSource.gamepad != null) {
				let gamepad = inputSource.gamepad;
				let filteredGamepad = {
					id: gamepad.id,
					index: gamepad.index,
					connected: gamepad.connected,
					mapping: gamepad.mapping,
					axes: gamepad.axes,
					buttons: gamepad.buttons
				};
				filteredInputSource.gamepad = filteredGamepad;
			}
			filteredInputSources.push(filteredInputSource);
		}

		return convertObjectToCindyDict(filteredInputSources, new Set([]), new Map());
	});
});
