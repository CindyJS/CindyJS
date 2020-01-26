# CindyXR

CindyXR is a CindyJS plugin that adds WebXR support to Cindy3D and CindyGL. For more information on Cindy3D and CindyGL, please visit the corresponding reference pages.

WebXR is an open standard for virtual reality and augmented reality applications on the web. For more information see https://www.w3.org/TR/webxr/.

### Using CindyXR

First of all, additionally to either Cindy3D or CindyGL, the compiled JavaScript source of CindyXR needs to be included in the web page.

```html
<script type="text/javascript" src="../../build/js/CindyXR.js"></script>
```
Please make sure that the plug-in is also loaded with a `use` statement. Then, in the CindyScript code of `'csinit'`, the user needs to call either `initxrcindy3d` or `initxrcindygl`.

------

#### Initializing WebXR for Cindy3D or CindyGL: `initxrcindy3d(), initxrcindygl()`

**Description:**
Initializes WebXR for use with Cindy3D.

**Modifiers:**

| Modifier  | Parameter                | Effect                                                   |
| --------- | ------------------------ | -------------------------------------------------------- |
| `instancename` | `‹string›` | The name of the Cindy3D instance to use (*only* for `initxrcindy3d`). The standard value is `'Cindy3D'`. |
| `referencemode` | `'local', 'local-floor', 'bounded-floor', 'unbounded'` | See section *Tracking Reference Modes* below. The standard is `'local-floor'`. |
| `scaling` | `‹real›` | The scaling factor specifies what fraction the rendering resolution is of the screen/canvas resolution. The standard is 1 (i.e., full resolution). This can be used to get better performance in complex scenes. |
| `canvaswidth` | `‹real›` | The width of the WebXR preview canvas in pixels. |
| `canvasheight` | `‹real›` | The height of the WebXR preview canvas in pixels. |
| `hidecanvas` | `‹boolean›` | Whether to hide or show the main (non-WebGL) CindyJS canvas (default: true, i.e., hide). |


VR and AR devices might have a different screen refresh rate than the main monitor the rest of the browser is running on. Thus, we unfortunately can't use `'csdraw'` for rendering to the canvas, as it is internally tied to `window.requestAnimationFrame` in CindyJS. However, to get the right refresh rate for WebXR, `XRSession.requestAnimationFrame` needs to be used. Thus, the user needs to manually specify a CindyScript rendering callback function that is then called by `XRSession.requestAnimationFrame`.

```html
<script id="csinit" type="text/x-cindyscript">
    use("CindyGL");
    use("CindyXR");
    initxrcindygl();
    // ...
    xrrenderfunction() := (
        // ...
    );
    xr(xrrenderfunction());
</script>
```
For examples of different render function callbacks, please visit the directory `examples/cindyxr`.

### Tracking Reference Modes

The reference mode (`referencemode`) can be specified as a modifier in the initialization functions. The reference mode can be either...
- `'local'` for a seated VR/AR experience. The origin (zero point) is at the initial position of the user.
- `'local-floor'` for a standing VR/AR experience. The origin is somewhere on the floor.
- `'bounded-floor'` for standing VR/AR experiences with a space bounded by a simple polygon. The polygon can be queried by a call to `getxrbounds`.
- `'unbounded'` for standing VR/AR experiences with an unbounded space.

The standard value is 'local-floor'. Please note that not all VR/AR devices support all reference modes. Devices with 3 DOFs (degrees of freedom) that only support rotational tracking like smartphones might not support anything other than `'local'`. CindyXR will try to find a good fallback when the user specifies more capabilities than the device supports.

### Transform Tracking with CindyGL

In Cindy3D, the transform of the WebXR device is automatically used for the camera settings (field of view, position, rotation, ...). However, in CindyGL, we need to manually query the transform of the device and use this information when rendering. For this, the following functions are available.

- `getxrnumviews()`: Returns the number of views that need to be rendered for the WebXR device. This is usually either one (monoscopic rendering mode) or two (stereoscopic rendering mode, one view per eye).
- `getxrviewportsize(viewidx)`: Returns the width and height of the viewport at the specified index (starting with 0) in a list of two numbers.
- `getxrviewmatrix(viewidx)`: Returns the current 4x4 view matrix of the viewport at the specified index (starting with 0).
- `getxrprojectionmatrix(viewidx)`: Returns the 4x4 projection matrix of the viewport at the specified index (starting with 0).
- `getxrbounds()`: Optionally, when the user specified `'bounded-floor'` as the reference mode during initialization, the vertices of the simple polygon representing the boundary of the user space can be queried with this function as a list of 3D points.


If the user is unfamiliar with the terms view matrix and projection matrix, we recommend reading an introduction, like https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/projection-matrix-introduction. The code below shows an example of a typical use-case of CindyXR in combination with CindyGL.

```html
<script id="csinit" type="text/x-cindyscript">
    initxrcindygl();
    ray(t) := rayOrig + t*rayDir;

    // ...

    normalizedDirection(a, b) := (
        (a - b) / dist(a, b)
    );

    xrrenderfunction() := (
        light = [cos(seconds())+2,2, sin(seconds())];
        numViews = getxrnumviews();
    
        repeat(numViews, i,
            viewIndex = i - 1;
            viewportSize = getxrviewportsize(viewIndex);
            aspectRatio = viewportSize.x/viewportSize.y;

            invProjectionMatrix = inverse(getxrprojectionmatrix(viewIndex));
            invViewMatrix = inverse(getxrviewmatrix(viewIndex));
            invViewProjMatrix = invViewMatrix * invProjectionMatrix;

            colorplotxr(viewIndex,
                moving = true;
                // Coordinates in NDC space
                ndcPixelNearCoord = [#.x, #.y, -1, 1];
                ndcPixelFarCoord = [#.x, #.y, 1, 1];
        
                // Multiply with inverse view-projection matrix to get world space coordinates.
                nearPointWorldHom = invViewProjMatrix * ndcPixelNearCoord;
                farPointWorldHom = invViewProjMatrix * ndcPixelFarCoord;

                // Dehomogenize the homogeneous coordinates.
                nearPointWorldDehom = [nearPointWorldHom_1, nearPointWorldHom_2, nearPointWorldHom_3] / nearPointWorldHom_4;
                farPointWorldDehom = [farPointWorldHom_1, farPointWorldHom_2, farPointWorldHom_3] / farPointWorldHom_4;

                camPos = nearPointWorldDehom;
                rayDir = normalizedDirection(farPointWorldDehom, nearPointWorldDehom);

                computeColor();
            );
        );
    );
    xr(xrrenderfunction());
</script>
```


### Using WebXR Input Sources

Using `getxrinputsources`, the user can get a list of available input sources. An input source of a VR device is typically something like a gamepad-like controller tracked in space. The input source objects in CindyScript have a similar structure to what is described in the WebXR JavaScript specification: https://www.w3.org/TR/webxr/#xrinputsource-interface. `getxrinputsources` returns a list of XRInputSource entries as CindyScript JSON dictionaries as described in the pseudo-code-like format below.

```
// @see https://www.w3.org/TR/webxr/#xrinputsource-interface
XRInputSource := {
	// Whether the input source is associated with a handedness
	handedness: ("none" | "left" | "right"),
	// For more details see: https://www.w3.org/TR/webxr/#xrinputsource-interface
	targetRayMode: ("gaze" | "tracked-pointer" | "screen"),

	// For tracking the input source in space
	targetRaySpaceTransform: <XRRigidTransform>,
	gripSpaceTransform: <XRRigidTransform>,

	// For getting gamepad button presses, ...	
	gamepad: ?<Gamepad>,

	// Example for profile: ["valve-index", "htc-vive", "generic-trigger-squeeze-touchpad-thumbstick"]
	profiles: [
		// ... list of strings ...
	]
}

XRRigidTransform := {
	// The position in homogeneous coordinates
    position: [ x, y, z, w ],
	// The orientation as a quaternion
	orientation: [ x, y, z, w ],
	// The total transform as a 4x4 matrix
	matrix: [[ a_11, ...], ...]
}

// @see https://w3c.github.io/gamepad/#dom-gamepad
Gamepad := {
	id: <string>,
	index: <number>,
	connected: <boolean>,
	mapping: ("" | "standard" | "xr-standard"),
	axes: list<number>,
	buttons: list<GamepadButton>
}

// @see https://w3c.github.io/gamepad/#dom-gamepadbutton
GamepadButton := {
	pressed: <boolean>,
	touched: <boolean>,
	value: double
}
```
