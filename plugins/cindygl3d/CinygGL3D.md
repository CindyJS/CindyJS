# Temporary documentation of CindyGL3D

!!! CindyGL3D is currently experimental !!!


## Function

All CindyGL functions are preserved with their original behaviour.

* `cglBegin3d` start 3D mode, and reset coordinate system, the modifier `z0` can be used to set the initial viewDepth (z0 should be a negative real number, the default is `-10`. a good range of values is approximately `-2` to `-20` )
* `rotate3d(<alpha>,<beta>)` rotate coordinate system
* `zoom3d(<zoom>)` set coordinate system scaling factor to given value
* `cglResetRotation` reset rotation
* `cglReset3d` reset 3D scene
* `cglDraw3d` draw 3D scene
* `cglEnd3d` end 3D mode
* `colorPlot3d(<expr>)` prepares color-plot with depth the exression should return a vector of five values z,r,g,b,a where rgba are the color for the current pixel and z is a depth value between 0 and 1
* `colorPlot3d(<expr>,<center>,<radius>)` like colorplot, but restricts the drawing area to a (bounding rectangle of a) sphere around `<center>` with the given radius
* `colorPlot3d(<expr>,<pointA>,<pointB>,<radius>)` like colorplot, but restricts the drawing area to a (bounding rectangle of a) cylinder with end-points `<pointA>` and `<pointB>` and the given radius
* `colorPlot3d(<expr>,<triangles>)` colorplot the expression on a set of trinagles given in the second parameter, the coordinates of the triangles can be given in each for the following 3 formats:
     - [x1,y1,z1,x2,y2,z2,...]      list of vertex coordinates
     - [v1,v2,v3,v4,...]            list of vertices
     - [[v1,v2,v3],[u1,u2,u3],...]  list of triangles
* `cglFindObject(<x>,<y>)` finds the id of object closest to the camera on the ray at position `(x,y)`
* `cglUpdate(<objectId>)` can be used to update the modifiers of the object with the given id
* `cglLazy(<args>,<expr>)` converts and expression into a value that can be stored and passed through functions, the expression can be reconstructed in the compiled code using the `cglEval` built-in.
`<args>` is a list of parameters that should be passed to the expression.

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
* `cglEval(<cglLazy>,<arg1>,...,<argN>)` evaluates the lazy expression (wrapped by `cglLazy`) in the first argument with the values in the remaining arguments passed to the corresponding parameters of the expression
* `cglTexture(<image>,<pos>)` and `cglTextureRGB(<image>,<pos>)` can be used to obtain the pixel of a texture without the transformations applied by `imagergba` / `imagergb`

## Plot Modifiers

Modifiers passed to `colorplot3d` that are prefixed with `U` can be used as constant values in the color-plot expression (without the `U` prefix).
The values of the constant are directly associated with the draw object and can be changed by calling `cglUpdate` with the matching modifiers.
