/**
 * The CindyLeap plug-in enables the user to use a Leap Motion controller together with Cindy3D and CindyGL.
 * The Leap Motion controller enables hand, finger and arm tracking.
 * More information on the controller can be found here: https://www.leapmotion.com/
 * 
 * This plug-in has two modes:
 * 
 * In the first mode, the plug-in tracks a single hand and provides the user with a rotation matrix of the
 * hand and a translational component of the hand in space. When using Cindy3D, this data is automatically
 * used to rotate and translate the rendered scene using this hand.
 * 
 * In the second mode, the raw tracking data of all tracked hands and gestures can be accessed by the user.
 * This data is directly translated to a CindyScript object from JavaScript objects using
 * convertObjectToCindyDict.
 */

let CindyLeap = function(api) {
	
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
	// Plugin functions part #1: Initialization.


	/**
	 * Initializes the Leap Motion controller.
	 * 
	 * Modifs:
	 * - enablegestures: Whether to enable gesture support (standard: disabled).
	 * - usehandtransformcdy3d: If this value is set to true, the transform of a
	 *   Cindy3D scene is multiplied with the hand transform (standard: disabled).
	 * - rotationfactor: Using this variable, the user can specify the sensibility
	 *   of the Leap Motion controller's rotational tracking. A factor of 2 is the
	 *   standard value. This is useful in many scenarios, as a hand can't be freely
	 *   rotated 360° in all directions because of limitations in the human anatomy
	 *   of the hand wrists. However, if perfect 1:1 tracking (not reinforced) is
	 *   desired, this factor should be set to 1.
	 * - translationfactor: Using this variable, the user can specify the sensibility
	 *   of the Leap Motion controller's translational/positional tracking. A factor
	 *   of 1 is the standard value. This is especially necessary if the user has
	 *   created a scene with large coordinates. In this case, movements of the hands
	 *   might result in too small movements. This factor is also used by
	 *   leapnormalizeposition.
	 */
	defOp("initleapmotion", 0, function(args, modifs) {
		let enableGestures = false;
		handleModifs(modifs, {
			"enablegestures": (a => enableGestures = coerce.toBool(a, false)),
			"usehandtransformcdy3d": (a => setManipulateSceneTransformActive(coerce.toBool(a, false))),
			"rotationfactor": (a => setLeapMotionRotationFactor(coerce.toReal(a, 2))),
			"translationfactor": (a => setLeapMotionTranslationFactor(coerce.toReal(a, 1)))
		});

		initLeapMotion(api, enableGestures);
		return nada;
	});


	//////////////////////////////////////////////////////////////////////
	// Plugin functions part #2: Accessing raw tracking data.

	/**
	 * Prints the hand data of the last frame for debugging purposes.
	 */
	defOp("leapdebugprinthands", 0, function(args, modifs) {
		let handsData = getLeapHandsData();
		if (handsData.length > 0) {
			console.log(handsData);
		}
		return nada;
	});

	/**
	 * Prints the gesture data of the last frame for debugging purposes.
	 * Gesture support needs to be enabled in "initleapmotion"!
	 */
	defOp("leapdebugprintgestures", 0, function(args, modifs) {
		let gestureData = getLeapGestureData();
		if (gestureData.length > 0) {
			console.log(gestureData);
		}
		return nada;
	});

	/**
	 * This function can be used to normalize Leap Motion controller positions to the range
	 * [-leapMotionTranslationFactor, leapMotionTranslationFactor]^3.
	 * The default value for leapMotionTranslationFactor is 1.0 and is affected/set by calling
	 * "setleapmotiontranslationfactor".
	 * Argument #0: A position in Leap Motion controller space to normalize.
	 */
	defOp("leapnormalizeposition", 1, function(args, modifs) {
		let cindyPosition = api.evaluate(args[0]).value;
		let position = [
			cindyPosition[0].value.real,
			cindyPosition[1].value.real,
			cindyPosition[2].value.real
		];
		let normalizedPosition = leapNormalizePosition(position);
		return nestedArrayToCSList(normalizedPosition);
	});

	/**
	 * Returns the list of the tracking data of all visible hands.
	 * The user can inspect the data structure with a call to "leapdebugprinthands".
	 * The data is a list of hand objects of this data structure:
	 * https://developer-archive.leapmotion.com/documentation/v2/javascript/api/Leap.Hand.html
	 * CAVEAT: The postional data is not normalized. For this, a call to "leapnormalizeposition"
	 * is necessary (unlike when calling "getleapmotiontranslationvector").
	 */
	defOp("getleaphandsdata", 0, function(args, modifs) {
		let blacklistNames = new Set(["frame"]);
		let handsData = getLeapHandsData();
		let cindyScriptHandsData = convertObjectToCindyDict(handsData, blacklistNames, new Map());
		return cindyScriptHandsData;
	});

	/**
	 * Returns a list of the tracked gestures in the last frame.
	 * See: https://developer-archive.leapmotion.com/documentation/v2/javascript/api/Leap.Frame.html#Frame.gestures[]
	 * "Circle and swipe gestures are updated every frame. Tap gestures only appear in the list for a single frame."
	 */
	defOp("getleapgesturedata", 0, function(args, modifs) {
		let blacklistNames = new Set(["frame"]);
		let jsonHands = getLeapGestureData();
		let cindyScriptHands = convertObjectToCindyDict(jsonHands, blacklistNames, new Map());
		return cindyScriptHands;
	});


	//////////////////////////////////////////////////////////////////////
	// Plugin functions part #3: Controlling the scene with the hand rotation and translation.

	/**
	 * With the Leap Motion controller, the transformation of a model can be changed.
	 * This function returns the corresponding matrix as a CindyScript object.
	 */
	defOp("getleapmotionmodelmatrix", 0, function(args, modifs) {
		let leapMotionModelMatrix = getLeapMotionModelMatrix();
		let leapMotionModelMatrixNested = [
			[leapMotionModelMatrix[0], leapMotionModelMatrix[1], leapMotionModelMatrix[2], leapMotionModelMatrix[3]],
			[leapMotionModelMatrix[4], leapMotionModelMatrix[5], leapMotionModelMatrix[6], leapMotionModelMatrix[7]],
			[leapMotionModelMatrix[8], leapMotionModelMatrix[9], leapMotionModelMatrix[10], leapMotionModelMatrix[11]],
			[leapMotionModelMatrix[12], leapMotionModelMatrix[13], leapMotionModelMatrix[14], leapMotionModelMatrix[15]]
		];
		let cindyMatrix = nestedArrayToCSList(leapMotionModelMatrixNested);
		return cindyMatrix;
	});

	/**
	 * With the Leap Motion controller, the transformation of a model can be changed.
	 * This function returns the corresponding rotation matrix as a CindyScript object.
	 */
	defOp("getleapmotionrotationmatrix", 0, function(args, modifs) {
		let leapMotionModelMatrix = getLeapMotionModelMatrix();
		let leapMotionRotationMatrixNested = [
			[leapMotionModelMatrix[0], leapMotionModelMatrix[1], leapMotionModelMatrix[2]],
			[leapMotionModelMatrix[4], leapMotionModelMatrix[5], leapMotionModelMatrix[6]],
			[leapMotionModelMatrix[8], leapMotionModelMatrix[9], leapMotionModelMatrix[10]]
		];
		let cindyMatrix = nestedArrayToCSList(leapMotionRotationMatrixNested);
		return cindyMatrix;
	});

	/**
	 * With the Leap Motion controller, the transformation of a model can be changed.
	 * This function returns the corresponding translation vector as a CindyScript object.
	 */
	defOp("getleapmotiontranslationvector", 0, function(args, modifs) {
		let leapMotionModelMatrix = getLeapMotionModelMatrix();
		let leapMotionTranslationVectorNested = [
			// Reason for + epsilon: Prevent shader rebuild, as CindyGL thinks this is an int3 vector in the beginning.
			leapMotionModelMatrix[3] + 0.000001,
			leapMotionModelMatrix[7],
			leapMotionModelMatrix[11]
		];
		let cindyMatrix = nestedArrayToCSList(leapMotionTranslationVectorNested);
		return cindyMatrix;
	});

	/**
	 * Returns true if the leap motion tracking has changed since the last call to this function.
	 * This is necessary if the user wants to redraw a CindyGL scene only if there has been achange in the tracking data from
	 * the Leap Motion controller.
	 */
	defOp("getleapmotiontransformhaschanged", 0, function(args, modifs) {
		return {
			"ctype": "boolean",
			"value": getLeapMotionTransformHasChanged()
		};
	});
}

// Exports for use in Cindy3D.
CindyLeap.leapPreRender = leapPreRender;
CindyLeap.leapPostRender = leapPostRender;
CindyJS.registerPlugin(1, "CindyLeap", CindyLeap);
