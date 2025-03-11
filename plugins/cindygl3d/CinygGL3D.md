# Temporary documentation of CindyGL3D

!!! CindyGL3D is currently experimental !!!


## Function

All CindyGL functions are preserved with their original behaviour.

* `cglBegin3d` start 3D mode, and reset coordinate system, the modifier `z0` can be used to set the initial viewDepth (z0 should be a negative real number, the default is `-10`. a good range of values is approximately `-2` to `-20` )
* `rotate3d(<alpha>,<beta>)` rotate coordinate system
* `rotate3d(<zoom>)` set coordinate system scaling factor to given value
* `cglResetRotation` reset rotation
* `cglReset3d` reset 3D scene
* `cglDraw3d` draw 3D scene
* `cglEnd3d` end 3D mode
* `colorPlot3d(<expr>)` prepares color-plot with depth the exression should return a vector of five values z,r,g,b,a where rgba are the color for the current pixel and z is a depth value between 0 and 1
* `colorPlot3d(<expr>,<center>,<radius>)` like colorplot, but restricts the drawing area to a (bounding rectangle of a) sphere around `<center>` with the given radius
* `colorPlot3d(<expr>,<pointA>,<pointB>,<radius>)` like colorplot, but restricts the drawing area to a (bounding rectangle of a) cylinder with end-points `<pointA>` and `<pointB>` and the given radius

## Built-in variables

If a free parameter is passed to the expression in the colorplot function it will be initialized to the normalized viewDirection in 3D-mode
In 2D mode the current pixel position will be used instead.

The following variables are automatically initialized in the code passed to colorplot3d.
! Any CindyJS variables with the same name will be ignored,
all built-in variables start with the prefix `cgl` to reduce the risk for name collisions.

* `cglPixel`: the 2D pixel coordinate on the texture, currently only supported in 2D-mode
* `cglViewPos`: the current camera position
* `cglViewDirection`: the direction of the view ray for the current pixel
* `cglDepth` can be used to read and write the depth of the current pixel. before rendering the depth values will be truncated to the range [0,1], with 0 beein closest to the camera.


Depending on the bouding box type there may be additional variables

Sphere:
* `cglCenter`: the center of the bounding sphere
* `cglRadius`: the radius of the bounding sphere/cylinder
* `cglPointA` `cglPointB` the two endpoints of the bounding cylinder

## Built-in functions

* `cglDiscard()` when this function is called the current pixel will not be drawn to the screen.
Due to compiler limitations the source code still has to be valid if all `cglDiscrad` calls are ignored.

## Plot Modifiers

Modifiers starting with `cgl` can be used as constant values in the colorplot expression.
The concrete values passed to the colorplot call will be forwarded to the shader program as uniform variables.
