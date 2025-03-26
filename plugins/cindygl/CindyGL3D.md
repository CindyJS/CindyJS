# Temporary documentation of CindyGL3D

!!! CindyGL3D is currently experimental !!!


## Function

All CindyGL functions are preserved with their original behavior.

* `cglBegin3d()` start 3D mode, and reset coordinate system, the modifier `z0` can be used to set the initial viewDepth (for rotations to work correctly z0 should be a negative real number).
The corners of the view-plane can be set using the modifiers `x0`, `y0`, `x1`, `y1` (or `p0`/`p1` for setting both coordinates of a corner at once), the z-coordinate of the view-plane can be set with `z1`.
* `cglViewPos()` the current view-position in model space
* `cglCoordSystem()` allows updating the coordinate system set with `cglBegin3d`
* `rotate3d(<alpha>,<beta>)` rotate coordinate system
* `zoom3d(<zoom>)` set coordinate system scaling factor to given value
* `cglResetRotation` reset rotation
* `cglReset3d` reset 3D scene
* `cglDraw3d` draw 3D scene
* `cglEnd3d` end 3D mode
* `colorPlot3d(<expr>)` prepares color-plot with depth the expression should return a vector of five values z,r,g,b,a where rgba are the color for the current pixel and z is a depth value between 0 and 1, returns the id of the created 3D-object
* `colorPlot3d(<expr>,<center>,<radius>)` like colorplot3d, but restricts the drawing area to a (bounding rectangle of a) sphere around `<center>` with the given radius
* `colorPlot3d(<expr>,<pointA>,<pointB>,<radius>)` like colorplot3d, but restricts the drawing area to a (bounding rectangle of a) cylinder with end-points `<pointA>` and `<pointB>` and the given radius
* `colorPlot3d(<expr>,<triangles>)` colorplot the expression on a set of triangles given in the second parameter, the coordinates of the triangles can be given in each for the following 3 formats:
     - [x1,y1,z1,x2,y2,z2,...]      list of vertex coordinates
     - [v1,v2,v3,v4,...]            list of vertices
     - [[v1,v2,v3],[u1,u2,u3],...]  list of triangles
* `cglFindObject(<x>,<y>)` finds the id of the object closest to the camera on the ray at screen-position `(x,y)`
* `cglUpdate(<objectId>)` can be used to update the modifiers of the object with the given id
* `cglLazy(<args>,<expr>)` converts and expression into a value that can be stored and passed through functions, the expression can be reconstructed in the compiled code using the `cglEval` built-in.
* `cglIsLazy(<val>)` checks if val is a cglLazy expression
`<args>` is a list of parameters that should be passed to the expression.
* `cglAxes()` returns the current coordinate axes as a list of vec3
* `cglDirection(x,y)` returns the view-direction for the screen pixel `(x,y)` seen from the viewPosition
* `cglSpherePos(<objId>)` returns the center of the sphere with the given object id
* `cglMoveSphere(<objId>,<newCenter: vec3>)` moves the center of the sphere with the given object-id
* `cglMoveCylinder(<objId>,<newPointA: vec3>,<newPointB: vec3>)` moves the endpoints of the cylinder with the given object-id
* `cglMoveTriangles(<objId>,<vertices: list<vec3>>)` moves the vertices of the triangle-mesh with the given object-id,
  if the number of vertices changes the corresponding vertex attributes should be updated accordingly (currently this needs a seperate call to `cglUpdate()`)

## Built-in variables

If a free parameter is passed to the expression in the colorplot function it will be initialized to the normalized viewDirection in 3D-mode
In 2D mode the current pixel position will be used instead.

The following variables are automatically initialized in the code passed to colorplot3d.
! Any CindyJS variables with the same name will be ignored,
all built-in variables start with the prefix `cgl` to reduce the risk for name collisions.

* `cglPixel`: the 2D pixel coordinate on the texture, currently only supported in 2D-mode
* `cglViewPos`: the current camera position
* `cglViewDirection`: the direction of the view ray for the current pixel
* `cglDepth` can be used to read and write the depth of the current pixel. before rendering the depth values will be truncated to the range [0,1], with 0 begin closest to the camera.


Depending on the bounding box type there may be additional variables

Sphere/Cylinder:
* `cglCenter`: the center of the bounding sphere
* `cglRadius`: the radius of the bounding sphere/cylinder
* `cglPointA` `cglPointB` the two endpoints of the bounding cylinder

Triangle/Mesh:

* `cglSpacePos`: position of current pixel in space

## Built-in functions

* `cglDiscard()` when this function is called the current pixel will not be drawn to the screen.
Due to compiler limitations the source code still has to be valid if all `cglDiscrad` calls are ignored.
* `cglEval(<cglLazy>,<arg1>,...,<argN>)` evaluates the lazy expression (wrapped by `cglLazy`) in the first argument with the values in the remaining arguments passed to the corresponding parameters of the expression
* `cglTexture(<image>,<pos>)` and `cglTextureRGB(<image>,<pos>)` can be used to obtain the pixel of a texture without the transformations applied by `imagergba` / `imagergb`

## Plot Modifiers

Modifiers passed to `colorplot3d` that are prefixed with `U` can be used as constant values in the color-plot expression (without the `U` prefix).
Additionally a list of further plot modifiers can be passed through the `plotModifiers` modifier as a list of `(<key:string>,<value>)` pairs, by name collisions the last definition will be used, directly specified modifiers cannot be overwritten by implicit modifiers.
For plots on triangular meshes defined using the `colorPlot3d(<expr>,<triangles>)` function, it is additionally possible to attach a value to each vertex by prefixing the variable name with `V` and attaching the array of all values (in the same order as the corresponding vertices).
Like for the plot modifiers additional vertex modifiers can be specified as a key-value list and be passed through the modifier `vModifiers`

The values of the constants are directly associated with the drawn object and can be changed by calling `cglUpdate` with the matching modifiers.

## Primitive objects

The file `scripts/cglInit.cjs` contains definitions for geometric primitive objects,
the primary drawing functions have names starting with `cglDraw`.
The drawing functions take the objects geometry, and a color-expression as parameters,
where the color-expression can be either a list of 3 or 4 numbers specific the rgb(a) values (as floats from 0 to 1)
or a `cglLazy(...)` expression mapping the pixel-coordinate to a color.
For spheres it is additionally possible to specify how the spheres surface will be mapped to 2D-coordinates.

The main drawing functions are.

* `cglDrawSphere(center: vec3,radius: float,color,projection)` draws a sphere with the given midpoint and radius, the projection (`cglLazy: <normal> -> <texCoord>`) argument can be used to determine how the sphere is mapped to coordinates
* `cglDrawSphere(center: vec3,radius: float,color)`draws a sphere with the given midpoint and radius, the texture coordinates are determined by linearly mapping the angles of the sphere-point seen from the center to the unit square `[0,1]x[0,1]`
* `cglDrawCylinder(pointA: vec3,pointB: vec3,radius: float,color)` draws a cylinder with the given endpoints and radius, using height (from `pointA`) and angle seen from the center as texture coordinates, again mapped to the internal `[0,1]x[0,1]`
* `cglDrawCylinder(pointA: vec3,pointB: vec3,radius: float,colorA,colorB)` like `cglDrawCylinder` but linearly interpolated between the two colors given for the end-points
* `cglDrawRod(pointA: vec3,pointB: vec3,radius: float,color)` a cylinder with round end-caps
* `cglDrawRod(pointA: vec3,pointB: vec3,radius: float,colorA,colorB)` a cylinder with round end-caps
* `cglDrawTorus(center: vec3,orientation: vec3,radius1: float,radius2: float,color)` draws a torus with the given center and orientation with major radius `radius1` and minor radius `radius2`, the color-expression uses the angles around the major and minor circle (mapped to `[0,1]x[0,1]`) as coordinates.
The modifiers `angle0` and `angle1` can be used to set the starting/ending angle of a torus arc (by default the full torus is drawn).
* `cglDraw(color)` draws a color/expression on the whole screen, uses the CindyJS coordinate system as pixel coordinates
* `cglDrawPolygon(vertices: vec3[],color)` draws a (convex) polygon, with the given vertices, the color-expression for polygons and meshes takes the view-direction at the current pixel as input, it is possible to use modifiers and global variables to get more specific information about the pixel position.
* `cglDrawMesh(samples: vec3[][],color)` draws a rectangular mesh with the given sample points, the type of normal-vectors can be specified by setting the `normalType` modifier to one either `CGLuMESHuNORMALuFACE` or `CGLuMESHuNORMALuVERTEX`
* `cglDrawMesh(samples: vec3[][],normals: vec3[][],color)` draws a rectangular mesh with the given sample points and normal vectors. `normals` is expected be a nested list with the same shape as the sample-point array, if `normalType` is set to `CGLuMESHuNORMALuFACE` only the top left corner for each quadrilateral `(x,y), (x+1,y), (x,y+1), (x+1,y+1)` will be used.
Alternatively `normals` can be set to a `cglLazy` expression taking the current viewDirection as input and returning the normal vector at the current pixel, like for the color-expression it is possible to use modifiers and global variables to get further information about the current pixel.

All drawing functions accept the following modifiers:
 * `Ulight: cglLazy` can be used to modify the lighting calculation, the lighting function expects the parameters `(color:vec3|vec4,viewDirection:vec3,surfaceNormal:vec3)` in that order and is expected to return a color
 * `tags` a list of strings that can be attached to different objects.
 * `plotModifiers` a list of key-value pairs mapping variable-names (string) to plot modifiers

Triangle based functions additionally have the modifier
 * `vModifiers` a list of key-value pairs mapping variable-names (string) to vertex modifiers should have same shape as vertex input
For meshes there is additionally:
 * for `cglDrawMesh`: `fModifiers` a list of key-value pairs mapping variable-names (string) to face modifiers, should have same shape as face normal input

For simplicity the library also defined the following wrapper functions:

* `sphere(center: vec3,radius: float,color: vec3|vec4)` a sphere with the given midpoint, radius and color
* `colorplotSphere(center: vec3,radius: float,pixelExpr: cglLazy,projection: cglLazy)` a sphere with the given midpoint, radius the color is computed by applying the given `projection` to the normal vector and then evaluating `pixelExpr` at that position
* `colorplotSphere(center: vec3,radius: float,pixelExpr: cglLazy)` like the general `colorplotSphere` where projection linearly maps the angles on the sphere to points in the unit square `[0,1]x[0,1]`
* `colorplotSphereC(center: vec3,radius: float,pixelExpr: cglLazy)` like the general `colorplotSphere` where projection stereographically maps the sphere to the complex protective line CP1
* `cylinder(pointA: vec3,pointB: vec3,radius: float,colorA: vec3|vec4,colorB: vec3|vec4)` draws a cylinder with the given endpoints and radius the the color is linearly interpolated between the colors given for the endpoints
* `colorplotCylinder(pointA: vec3,pointB: vec3,radius: float,pixelExpr: cglLazy)` draws a cylinder with the given endpoints and radius the color is computed by evaluating `pixelExpr` at `[a: float,h: float]`, where `a` is the angle around the cylinder and `h` is the height of the current point starting at `pointA` going towards `pointB` both values are mapped to the interval `[0,1]`
* `rod(pointA: vec3,pointB: vec3,radius: float,colorA: vec3|vec4,colorB: vec3|vec4)` draws a cylinder with round end-caps, with the given endpoints and radius the the color is linearly interpolated between the colors given for the endpoints
* `torus(center: vec3,orientation: vec3,radius1: float,radius2: float,color: vec3|vec4)` draws a torus with the given center, orientation, major radius `radius1` and minor radius `radius2` with color `color`
* `colorplotTorus(center: vec3,orientation: vec3,radius1: float,radius2: float,pixelExpr: cglLazy)` draws a torus with the given center, orientation, major radius `radius1` and minor radius `radius2` the pixel colors will be determined using `pixelExpr` at the position `[a,b]` where `a` and `b` are the angles along the two circles, both mapped to the interval `[0,1]`
* `background(color: vec3|vec4)` fill the back of the canvas with the given color (ignores lighting information)
* `polygon3d(vertices: list<vec3>,color: vec3|vec4)` plot a single colored polygon with the given vertex set (currently only works correctly for convex polygons)
* `updatePolygon3d(<objId>,<vertices>,<color>)` similar to `polygon3d`, replaces the existing polygon with the given object id
* `mesh3d(<samples>:list<list<vec3>>,<color>:vec3|vec4)` creates a mesh for the given samples and colors the faces in a constant color. The given `samples` should be a rectangular grid of points, the surface normals will be determined from the given points, the normal type can be set with the modifier `normalType` it has to be either `CGLuMESHuNORMALuFACE` (one normal per triangular face) or `CGLuMESHuNORMALuVERTEX` (one normal per vertex, computed as average face normal)
* `mesh3d(<samples>:list<list<vec3>>,<normals>:list<list<vec3>>,<color>: vec3|vec4)` like `mesh3d` but will use the vectors in the list `normals` as face/vertex normals. Normals should be a rectangular grid containing a normal vector for each vertex, in face mode only the corner `(x,y)` of each quadrilateral `(x,y), (x+1,y), (x,y+1), (x+1,y+1)` will be used.
* `colorplotMesh3d(<samples>,<pixelExpr>)`, `colorplotMesh3d(<samples>,<normals>,<pixelExpr>)` like `mesh3d` but with a cglLazy expression instead of a constant color (the parameter of the pixel-expression will be the view-direction at the current pixel)
