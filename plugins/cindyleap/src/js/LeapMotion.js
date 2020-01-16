/**
 * @file LeapMotion.js
 * This file contains helper functions for using the Leap Motion controller.
 */

/**
 * A temporary copy of the camera model matrix when the real matrix is modified for use with the Leap Motion controller.
 * @type {number[}
 */
var modelMatrixTmp;
/**
 * A temporary copy of the camera model-view matrix when the real matrix is modified for use with the Leap Motion controller.
 * @type {number[}
 */
var mvMatrixTmp;
/**
 * The current transformation that is imposed on the scene by the Leap Motion controller plugin.
 * @type {number[}
 */
var leapMotionModelMatrixInternal = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
/**
 * The current rotation that is imposed on the scene by the Leap Motion controller plugin.
 * @type {number[}
 */
var leapMotionRotationMatrixInternal = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
/**
 * True if the transformation imposed on the scene by the Leap Motion controller plugin has changed.
 * @type {boolean}
 */
var leapMotionTransformHasChanged = false;
/**
 * Amplification factor for the tracked rotation.
 * @type {number}
 */
var leapMotionRotationFactor = 2.0;
/**
 * Amplification factor for the tracked translation.
 * @type {number}
 */
var leapMotionTranslationFactor = 1.0;
/**
 * The last Leap Motion controller frame.
 * https://developer-archive.leapmotion.com/documentation/v2/javascript/api/Leap.Frame.html
 * @type {Leap.Frame}
 */
var lastLeapFrame = null;
/**
 * If this value is true, the transform of a Cindy3D scene is multiplied with the hand transform.
 * @type {boolean}
 */
var manipulateSceneTransformActive = false;
/**
 * True if the support for gestures has been enabled.
 * @type {boolean}
 */
var gesturesEnabled = false;


/**
 * Sets up the Cindy3D camera for use with the Leap Motion controller.
 * @param {Camera} cindy3DCamera The Cindy3D camera.
 */
function leapPreRender(cindy3DCamera) {
	if (manipulateSceneTransformActive) {
		// Save the old camera matrices.
		modelMatrixTmp = cindy3DCamera.modelMatrix.slice();
		mvMatrixTmp = cindy3DCamera.mvMatrix.slice();
		
		// Set the new camera matrices.
		let leapMotionModelMatrix = getLeapMotionModelMatrix();
		cindy3DCamera.modelMatrix = mul4mm(leapMotionModelMatrix, cindy3DCamera.modelMatrix);
		cindy3DCamera.mvMatrix = mul4mm(cindy3DCamera.viewMatrix, cindy3DCamera.modelMatrix);
	}
}

/**
 * Resets the changes done by @see leapPreRender to the Cindy3D camera.
 * @param {Camera} cindy3DCamera The Cindy3D camera.
 */
function leapPostRender(cindy3DCamera) {
	if (manipulateSceneTransformActive) {
		cindy3DCamera.modelMatrix = modelMatrixTmp.slice();
		cindy3DCamera.mvMatrix = mvMatrixTmp.slice();	
	}
}


/**
 * Initializes the Leap Motion controller. This requires that the Leap Motion SDK v2 or v3 is installed.
 * Unfortunately, the Orion v4 SDK no longer supports JavaScript.
 * @param {CindyJS.pluginApi} api CindyJS API object
 * @param {boolean} enableGestures Whether to enable gesture recognition (default: off).
 */
function initLeapMotion(api, enableGestures) {
	gesturesEnabled = enableGestures;
    var controller = new Leap.Controller({enableGestures: enableGestures});
    controller.on('frame', function(frame) {
		onLeapMotionControllerFrame(api, controller, frame);
    });
	controller.connect();
}

/**
 * This function is called when a new Leap Motion tracking frame is available.
 * A tracking frame contains tracking data of tracked hands and fingers.
 * @param {CindyJS.pluginApi} api CindyJS API object
 * @param {Leap.Controller} controller For more details see
 * https://developer-archive.leapmotion.com/documentation/javascript/devguide/Leap_Controllers.html
 * @param {Leap.Frame} frame For more details see
 * https://developer-archive.leapmotion.com/documentation/javascript/devguide/Leap_Frames.html
 */
function onLeapMotionControllerFrame(api, controller, frame) {
	let crossProduct = function(a, b) {
		return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
	}
	let transpose4 = function(m) {
		return [
			m[0], m[4], m[8], m[12],
			m[1], m[5], m[9], m[13],
			m[2], m[6], m[10], m[14],
			m[3], m[7], m[11], m[15]
		];
	};
	let mul4mm = function(a, b) {
		return [
			a[0]*b[0] + a[1]*b[4] + a[2]*b[8] + a[3]*b[12],
			a[0]*b[1] + a[1]*b[5] + a[2]*b[9] + a[3]*b[13],
			a[0]*b[2] + a[1]*b[6] + a[2]*b[10] + a[3]*b[14],
			a[0]*b[3] + a[1]*b[7] + a[2]*b[11] + a[3]*b[15],
			a[4]*b[0] + a[5]*b[4] + a[6]*b[8] + a[7]*b[12],
			a[4]*b[1] + a[5]*b[5] + a[6]*b[9] + a[7]*b[13],
			a[4]*b[2] + a[5]*b[6] + a[6]*b[10] + a[7]*b[14],
			a[4]*b[3] + a[5]*b[7] + a[6]*b[11] + a[7]*b[15],
			a[8]*b[0] + a[9]*b[4] + a[10]*b[8] + a[11]*b[12],
			a[8]*b[1] + a[9]*b[5] + a[10]*b[9] + a[11]*b[13],
			a[8]*b[2] + a[9]*b[6] + a[10]*b[10] + a[11]*b[14],
			a[8]*b[3] + a[9]*b[7] + a[10]*b[11] + a[11]*b[15],
			a[12]*b[0] + a[13]*b[4] + a[14]*b[8] + a[15]*b[12],
			a[12]*b[1] + a[13]*b[5] + a[14]*b[9] + a[15]*b[13],
			a[12]*b[2] + a[13]*b[6] + a[14]*b[10] + a[15]*b[14],
			a[12]*b[3] + a[13]*b[7] + a[14]*b[11] + a[15]*b[15]
		];
	}
	
	// Is a hand we can track currently visible?
	if (frame.hands.length > 0) {
		lastLeapFrame = frame;

        // Use the hand with index zero for tracking.
		let hand = frame.hands[0];
        let previousFrame = controller.frame(1);
        
		// Rotation matrix in row-major order.
		let rotationMatrix3x3 = hand.rotationMatrix(previousFrame);

		// Query the position of the hand in controller coordinates.
		//let handPosition = hand.stabilizedPalmPosition;
		let handPosition = hand.palmPosition;
		
		// The normalized position is a 3D vector with each entry being between 0 and 1.
		var interactionBox = frame.interactionBox;
		let normalizedHandPosition = interactionBox.normalizePoint(handPosition, true);
		
		// Use relative or absolute rotational tracking?
		let relativeRotationTracking = false;
		if (relativeRotationTracking) {
			// Relative rotational tracking adds the multiplication since the last frame.
			let rotationMatrix4x4 = [
				rotationMatrix3x3[0], rotationMatrix3x3[1], rotationMatrix3x3[2], 0,
				rotationMatrix3x3[3], rotationMatrix3x3[4], rotationMatrix3x3[5], 0,
				rotationMatrix3x3[6], rotationMatrix3x3[7], rotationMatrix3x3[8], 0,
				0, 0, 0, 1
			];

			// Amplify the rotation (i.e., higher sensitivity).
			if (leapMotionRotationFactor == 2.0) {
				// Simple special case: Square matrix equals double angle.
				leapMotionRotationMatrixInternal = mul4mm(rotationMatrix4x4, leapMotionRotationMatrixInternal);
			} else if (leapMotionRotationFactor != 1.0) {
				let result = axisAngleFromRotationMatrix(rotationMatrix4x4);
				let axis = result[0];
				let angle = result[1];
				rotationMatrix4x4 = rotationMatrixFromAxisAngle(axis, leapMotionRotationFactor*angle);
			}
			leapMotionRotationMatrixInternal = mul4mm(rotationMatrix4x4, leapMotionRotationMatrixInternal);
		} else {
			// Absolute rotational tracking uses the absolute orientation matrix of the hand.
			// The identity rotation should be the hand facing downwards. Thus, additionally apply rotateXPi to the rotation.
			let rotateXPi = [1, 0, 0, 0,  0, -1, 0, 0,  0, 0, -1, 0,  0, 0, 0, 1];
			let handBinormal = crossProduct(hand.palmNormal, hand.direction);
			leapMotionRotationMatrixInternal = [
				handBinormal[0], handBinormal[1], handBinormal[2], 0,
				hand.palmNormal[0], hand.palmNormal[1], hand.palmNormal[2], 0,
				hand.direction[0], hand.direction[1], hand.direction[2], 0,
				0, 0, 0, 1
			];
			leapMotionRotationMatrixInternal = transpose4(mul4mm(rotateXPi, leapMotionRotationMatrixInternal));

			// Amplify the rotation (i.e., higher sensitivity).
			if (leapMotionRotationFactor == 2.0) {
				// Simple special case: Square matrix equals double angle.
				leapMotionRotationMatrixInternal = mul4mm(leapMotionRotationMatrixInternal, leapMotionRotationMatrixInternal);
			} else if (leapMotionRotationFactor != 1.0) {
				let result = axisAngleFromRotationMatrix(leapMotionRotationMatrixInternal);
				let axis = result[0];
				let angle = result[1];
				leapMotionRotationMatrixInternal = rotationMatrixFromAxisAngle(axis, leapMotionRotationFactor*angle);
			}
		}

		// Combine rotation and position to model matrix.
		leapMotionModelMatrixInternal = leapMotionRotationMatrixInternal.slice();
		leapMotionModelMatrixInternal[3] = leapMotionTranslationFactor*(2*normalizedHandPosition[0]-1);
		leapMotionModelMatrixInternal[7] = leapMotionTranslationFactor*(2*normalizedHandPosition[1]-1);
		leapMotionModelMatrixInternal[11] = leapMotionTranslationFactor*(2*normalizedHandPosition[2]-1);
	
		// Request repaint in CindyJS.
		leapMotionTransformHasChanged = true;
		api.scheduleUpdate();
	}
}

/**
 * @param {boolean} _manipulateSceneTransformActive If this value is set to true, the transform of a
 * Cindy3D scene is multiplied with the hand transform.
 */
function setManipulateSceneTransformActive(_manipulateSceneTransformActive) {
	manipulateSceneTransformActive = _manipulateSceneTransformActive;
}

/**
 * Returns the hands tracked in the last frame.
 * @return {Leap.Hand[]} The data of the tracked hands.
 */
function getLeapHandsData() {
	if (lastLeapFrame != null) {
		return lastLeapFrame.hands;
	} else {
		return [];
	}
}

/**
 * Returns the gestures tracked in the last frame.
 * @return {Leap.Hand[]} The data of the tracked hands.
 */
function getLeapGestureData() {
	if (lastLeapFrame != null && gesturesEnabled) {
		return lastLeapFrame.gestures;
	} else {
		return [];
	}
}

/**
 * This function can be used to normalize Leap Motion controller positions to the range
 * [-leapMotionTranslationFactor, leapMotionTranslationFactor]^3.
 * The default value for leapMotionTranslationFactor is 1.0.
 * @param {number[3]} position The Leap Motion controller position to normalize.
 * @return {number[3]} The normalized position.
 */
function leapNormalizePosition(position) {
	// The normalized position is a 3D vector with each entry being between -1 and 1.
	if (lastLeapFrame != null) {
		var interactionBox = lastLeapFrame.interactionBox;
		let normalizedHandPosition = interactionBox.normalizePoint(position, true);
		// Conversion from Float32Array to normal array.
		return [
			leapMotionTranslationFactor*(2*normalizedHandPosition[0]-1),
			leapMotionTranslationFactor*(2*normalizedHandPosition[1]-1),
			leapMotionTranslationFactor*(2*normalizedHandPosition[2]-1)];
	} else {
		return position;
	}
}


/**
 * Creates a 4x4 rotation matrix from an axis-angle representation of a rotation.
 * For more details see: https://en.wikipedia.org/wiki/Rotation_matrix#Determining_the_angle
 * @param {number[]} axis The axis of rotation.
 * @param {number} angle The size of the rotation angle.
 * @return {number[]} The according rotation matrix.
 */
function rotationMatrixFromAxisAngle(axis, angle) {
	let sinAngle = Math.sin(angle);
	let cosAngle = Math.cos(angle);
	let oneMinusCosAngle = 1 - cosAngle;

	return [
		cosAngle + axis[0]*axis[0] * oneMinusCosAngle,
		axis[0]*axis[1] * oneMinusCosAngle - axis[2] * sinAngle,
		axis[0]*axis[2] * oneMinusCosAngle + axis[1] * sinAngle,
		0,
		
		axis[1]*axis[0] * oneMinusCosAngle + axis[2] * sinAngle,
		cosAngle + axis[1]*axis[1] * oneMinusCosAngle,
		axis[1]*axis[2] * oneMinusCosAngle - axis[0] * sinAngle,
		0,

		axis[2]*axis[0] * oneMinusCosAngle - axis[1] * sinAngle,
		axis[2]*axis[1] * oneMinusCosAngle + axis[0] * sinAngle,
		cosAngle + axis[2]*axis[2] * oneMinusCosAngle,
		0,

		0, 0, 0, 1
	];
}


/**
 * This function converts a rotation matrix to the axis-angle representation of a rotation.
 * For more details see: https://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm
 * @param {number[]} m The homogeneous 4x4 rotation matrix.
 * @return {Array<number[], number}> An array containing the according rotation axis and angle.
 */
function axisAngleFromRotationMatrix(m) {
	let square = function(x) { return x*x; }
	let epsilon = 0.001;
	let epsilon2 = 0.01;

	// Check for singular cases 0° and 180°.
	if ((Math.abs(m[0*4+1] - m[1*4+0]) < epsilon)
			&& (Math.abs(m[0*4+2] - m[2*4+0]) < epsilon)
			&& (Math.abs(m[1*4+2] - m[2*4+1]) < epsilon)) {
		// First check for the case 0°. In this case, we have an identity matrix.
		if ((Math.abs(m[0*4+1] + m[1*4+0]) < epsilon)
				&& (Math.abs(m[0*4+2] + m[2*4+0]) < epsilon2)
				&& (Math.abs(m[1*4+2] + m[2*4+1]) < epsilon2)
				&& (Math.abs(m[0*4+0] + m[1*4+1]+ m[2*4+2]-3) < epsilon2)) {
			return [[1.0, 0.0, 0.0], 0.0];
		}
		
		// Otherwise, the angle is approximately 180°.
		let axis = [0.0, 0.0, 0.0];
		let xx = (m[0*4+0] + 1.0) / 2.0;
		let yy = (m[1*4+1] + 1.0) / 2.0;
		let zz = (m[2*4+2] + 1.0) / 2.0;
		let xy = (m[0*4+1] + m[1*4+0]) / 4.0;
		let xz = (m[0*4+2] + m[2*4+0]) / 4.0;
		let yz = (m[1*4+2] + m[2*4+1]) / 4.0;
		let invSqrtTwo = 1.0 / Math.sqrt(2.0);
		
		// Check which diagonal term is largest.
		if ((xx > yy) && (xx > zz)) {
			if (xx < epsilon) {
				x = 0;
				y = invSqrtTwo;
				z = invSqrtTwo;
			} else {
				x = Math.sqrt(xx);
				y = xy / x;
				z = xz / x;
			}
		} else if (yy > zz) {
			if (yy < epsilon) {
				x = invSqrtTwo;
				y = 0;
				z = invSqrtTwo;
			} else {
				y = Math.sqrt(yy);
				x = xy / y;
				z = yz / y;
			}	
		} else {
			if (zz < epsilon) {
				x = invSqrtTwo;
				y = invSqrtTwo;
				z = 0;
			} else {
				z = Math.sqrt(zz);
				x = xz / z;
				y = yz / z;
			}
		}
		
		return [axis, Math.PI];
	}
	
	// Regular cases.
	let axisLength = Math.sqrt(
		square(m[2*4+1] - m[1*4+2])
		+ square(m[0*4+2] - m[2*4+0])
		+ square(m[1*4+0] - m[0*4+1])
	);
	
	let angle = Math.acos((m[0*4+0] + m[1*4+1] + m[2*4+2] - 1.0) / 2.0);
	let axis = [
		(m[2*4+1] - m[1*4+2]) / axisLength,
		(m[0*4+2] - m[2*4+0]) / axisLength,
		(m[1*4+0] - m[0*4+1]) / axisLength
	];
	
	return [axis, angle];
}


/**
 * @see CindyLeap.js
 */
function getLeapMotionModelMatrix() {
    return leapMotionModelMatrixInternal;
}

/**
 * @see CindyLeap.js
 */
function getLeapMotionTransformHasChanged() {
    if (leapMotionTransformHasChanged) {
		leapMotionTransformHasChanged = false;
		return true;
	} else {
		return false;
	}
}

/**
 * @see CindyLeap.js
 */
function setLeapMotionRotationFactor(factor) {
	leapMotionRotationFactor = factor;
}

/**
 * @see CindyLeap.js
 */
function setLeapMotionTranslationFactor(factor) {
	leapMotionTranslationFactor = factor;
}
