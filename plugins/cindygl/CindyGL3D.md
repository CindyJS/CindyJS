# Temporary documentation of CindyGL3D

!!! CindyGL3D is still in development, there may be breaking changes between versions !!!

## Common reasons why a Script can be slower than expected

* Geometric objects are re-initialized each draw step:
    The intended way to draw scenes with a large number of objects it to draw the objects once (every time the rendered objects change) and only render the scene in the draw script.
    - Not redrawing the (complete) internal geometry every rendering step can significantly speed up the script if there is a large number of simple objects.
    - If necessary it is possible to update individual objects using `cglUpdate` or `cglUpdateBounds...` (using the object id returned by `colorplot3d` to `cglFindObject`)

* Large number of transparent objects:
    The algorithm for rendering transparent objects ensures that the depth information for all pixels is sorted correctly, this will normally need 2 shader calls per translucent object per render-layer.
    - If possible use 3-component colors for opaque objects, use `cglDiscard()` to discard individual pixels in a rendered objects.
    - If the depth-order of all transparent objects is known in advance it is possible set the `layers` modifier in `cglRender3d` to `0` to render transparent objects in the order they have been declared.


## Function

All CindyGL functions are preserved with their original behavior.

* `cglViewPos()` the current view-position in model space
* `cglViewRect()` the current view-rectangle returned as a 4-element list with elements in the order `x0,y0,x1,y1`
* `cglCoordSystem()` allows updating the 3D coordinate system, the modifier `z0` can be used to set the initial viewDepth (for rotations to work correctly z0 should be a negative real number).
The corners of the view-plane can be set using the modifiers `x0`, `y0`, `x1`, `y1` (or `p0`/`p1` for setting both coordinates of a corner at once), the z-coordinate of the view-plane can be set with `z1`.
* `rotate3d(<alpha>,<beta>)` rotate coordinate system
* `zoom3d(<zoom>)` set coordinate system scaling factor to given value
* `cglResetRotation` reset rotation
* `cglReset3d` reset 3D scene
* `cglRender3d` render 3D scene, the `layers` modifier can be used to change how translucent objects are rendered, setting `layers` to `0` will render all objects in the order they are declared, if layers is `N` larger that `0` the renderer will try to sort the non-opaque objects at each pixel by their depth value using textures to store the top `N-1` objects at each pixel as well as the remaining objects merged by depth.
By default `layers` is `0` is there is at most one non-opaque object and `2` otherwise, where an object is considered opaque if its pixel-color has (at most) 3 components
* `cglRender3d(<p0>,<p1>)` render 3D-scene to screen-rectangle bounded by the points `p0` and `p1`
* `cglRender3d(<image>)` render 3D-scene to image (given as a string)
* `colorPlot3d(<expr>)` prepares color-plot with depth the expression should return a vector of five values z,r,g,b,a where rgba are the color for the current pixel and z is a depth value between 0 and 1, returns the id of the created 3D-object
* `colorPlot3d(<expr>,<center>,<radius>)` like colorplot3d, but restricts the drawing area to a (bounding rectangle of a) sphere around `<center>` with the given radius
* `colorPlot3d(<expr>,<pointA>,<pointB>,<radius>)` like colorplot3d, but restricts the drawing area to a (bounding rectangle of a) cylinder with end-points `<pointA>` and `<pointB>` and the given radius
* `colorPlot3d(<expr>,<center>,<v1>,<v2>,<v3>)` like colorplot3d, but restricts the drawing area to a cuboid around the given center point with axes in the directions `v1`,`v2`,`v3`. (vertices $$center\pm v1 \pm v2 \pm v3$$)
* `colorPlot3d(<expr>,<triangles>)` colorplot the expression on a set of triangles given in the second parameter, the coordinates of the triangles can be given in each for the following 3 formats:
     - [x1,y1,z1,x2,y2,z2,...]      list of vertex coordinates
     - [v1,v2,v3,v4,...]            list of vertices
     - [[v1,v2,v3],[u1,u2,u3],...]  list of triangles
* `cglUpdateBounds(<objId>)` `cglUpdateBounds(<objId>,<center>,<radius>)` `cglUpdateBounds(<objId>,<pointA>,<pointB>,<radius>)` `cglUpdateBounds(<objId>,<triangles>)` `cglUpdateBounds(<objId>,<center>,<v1>,<v2>,<v3>)` updates the bounding box of the object with the given id, the parameters after the object id behave the same way as those in the corresponding version of `colorplot3d`
* `cglUpdate(<objId>)` can be used to update the modifiers of the object with the given id all modifiers passed to this function will be replace the cooresponding modifier on the existing object.
* `cglSetVisible(<objId>,<bool>)` sets objects visibility, (true -> visible, false -> invisible). Invisible objects are not drawn/updated but remember their previous state
* `cglDelete(<objId>)` deletes the object with the given id
* `cglFindObject(<x>,<y>)` finds the id of the object closest to the camera on the ray at screen-position `(x,y)`
* `cglEvalOrDiscard(<expr>)` evaluates the given expression, if `cglDiscard()` is called during the evaluation a default value (that can be set with the modifier `default`) is returned
* `cglLazy(<args>,<expr>)` converts and expression into a value that can be stored and passed through functions, the expression can later be evaluated by calling `cglEval()`. All modifiers passed to `cglLazy` can be used as named constants within the expression.
* `cglEval(<cglLazy>,<arg1>,...,<argN>)` evaluates the lazy expression (wrapped by `cglLazy()`) in the first argument with the values in the remaining arguments passed to the corresponding parameters of the expression
* `cglIsLazy(<val>)` checks if val is a cglLazy expression
`<args>` is a list of parameters that should be passed to the expression.
* `cglWith(<expr>)` evaluate the given expression. All modifiers passed to `cglWith` can be used as named constants within the expression.
The intended use of this function is a way to "freeze" the iteration variable of loops when used in expression passed to lazy functions
* `cglInterface(<name>:name,<implName>:name,<args>:list<name>,<modifs>:list<name>)` can be used to wrap CindyScript functions in a more convenient user-interface:
    - missing modifiers are set to nada (even if there is a global with the same name)
    - adding a parameter list as user-data to the name of an argument or modifier will wrap the expression given to that argument in a `cglLazy` function with that parameter list
* `cglTryDetermineDegree(<expr>,<vars>:list<name>)` tries to determine the degree of the given expression in the given values, if the degree is infinite `-1` is returned. When determining the degree is not possible the function returns `undefined`
* `cglTryDetermineDegree(<lazy-expr>)` similar to `cglTryDetermineDegree(2)`, tries to determine the degree of a lazy-expression in its parameters
* `cglLogError` `cglLogWarning` `cglLogInfo` print a string at different logging levels, makes error messages easier to find in the JavaScript console
* `cglAxes()` returns the current coordinate axes as a list of vec3
* `cglDirection(x,y)` returns the view-direction for the screen pixel `(x,y)` seen from the viewPosition
* `cglSpherePos(<objId>)` returns the center of the sphere with the given object id

## Built-in variables

If a free parameter is passed to the expression in the colorplot function it will be initialized to the normalized viewDirection in 3D-mode
In 2D mode the current pixel position will be used instead.

The following variables are automatically initialized in the code passed to colorplot3d.
! Any CindyJS variables with the same name will be ignored,
all built-in variables start with the prefix `cgl` to reduce the risk for name collisions.

* `cglPixel`: the 2D pixel coordinate on the texture, currently only supported in 2D-mode
* `cglViewPos`: the current camera position
* `cglViewDirection`: the direction of the view ray for the current pixel
* `cglViewNormal` normal-vector to the current view-plane, scaled to the distance between view-plane and View-position
* `cglDepth` can be used to read and write the depth of the current pixel. before rendering the depth values will be truncated to the range [0,1], with 0 begin closest to the camera.


Depending on the bounding box type there may be additional variables

* `cglCenter`: the center of the bounding sphere/cylinder/cube
* `cglRadius`: the radius of the bounding sphere/cylinder
* `cglOrientation` the orientation of the bounding cylinder (vector from first endpoint to center / center to second endpoint)
* `cglCubeAxes` the axes vectors of the bounding cubioid as 3x3 matrix
* `cglSpacePos`: position of current pixel in space (for triangles/mesh)

## Built-in functions

The following built-in functions are available in code passed to colorplot.

* `cglDiscard()` when this function is called the current pixel will not be drawn to the screen.
Due to compiler limitations the source code still has to be valid if all `cglDiscrad` calls are ignored.
* `cglTexture(<image>,<pos>)` and `cglTextureRGB(<image>,<pos>)` can be used to obtain the pixel of a texture without the transformations applied by `imagergba` / `imagergb`

## Plot Modifiers

Modifiers passed to `colorplot3d` that are prefixed with `U` can be used as constant values in the color-plot expression (without the `U` prefix).
Additionally a list of further plot modifiers can be passed through the `plotModifiers` modifier as a list of `(<key:string>,<value>)` pairs, by name collisions the last definition will be used, directly specified modifiers cannot be overwritten by implicit modifiers.
For plots on triangular meshes defined using the `colorPlot3d(<expr>,<triangles>)` function, it is additionally possible to attach a value to each vertex by prefixing the variable name with `V` and attaching the array of all values (in the same order as the corresponding vertices).
Like for the plot modifiers additional vertex modifiers can be specified as a key-value list and be passed through the modifier `vModifiers`

The values of the constants are directly associated with the drawn object and can be changed by calling `cglUpdate` with the matching modifiers.

The modifier `opaqueIf` can be used to specify when the object should be rendered opaque, the given value can be eigther a boolean, an expression evaluating to a boolean variable or a cglLazy expression without parameters.
Within the given (lazy) expression plotModifiers can be used and will evaluate to their value within the render evironment.
`opaqueIf` is only a hit for how the renderer should treat the object (rendering translucent objects is much more expensive), it does not have an effect on the actual rendered alpha-value.

## Primitive objects

The file `scripts/cgl3d.cjs` contains definitions for geometric primitive objects, for a documentation of the available functions seee `Primitives.md`