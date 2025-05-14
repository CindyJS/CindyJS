# Temporary documentation of primitive renderers for CindyGL3D

## Common modifiers

The following modiifers are present on all geoemetric primitives
* `color`
* `texture`
* `colorExpr:(texturePos)`
* `alpha`
* `light:(color,direction,normal)`

Points lines and circles aditionally have the modifier:
* `size` to specifiy the size (measured as a radius) of the drawn object

All spheres and points additionally allow the modifiers:

* `projection:(normal)` specifies the 2D texture coordinates for the point on the sphere with the given normal vector

For cylinders and lines there are additionall the following modifiers:

* `color1`, `color2`: the colors of the individual endpoints
* `projection:(normal,height,orientation)` specifies how the 2D texture-coordinates of a point on the cylinder are computed
* `caps`, `cap1`, `cap2`: the style(s) use for the end-caps of the cylinder possible values are:
    -
    -
    -
    -
    -
    -

similarely connect and curve have the same cap modifiers as well as the modifiers:

<!-- TODO is curve the right word here -->
* `joints` the joint-style for connecting the segments of the curve possible values are:
  -
  -
  -

* `closed` a boolean to specify if the two end-points of the curve should be connected


For triangles, polygons and meshes there are the following additional parameters:

* `colors` individual colors for each vertex
* `uv` the texture positions for each given vertex
* `normal` the normal vector to the polygon (does not exist for meshes)
* `normals` normal vectors at the individual vertices
* `normalExpr:(dir)` gives a normal vector for each pixel <!--TODO find good parameter list-->
* `normalType` (does not exist for triangles) specifies how normals are computed/assigned to vertices, possible values are:
  -
  -
  -

Surfaces and plots allow specifing:
<!--TODO? make space-color and texture color different modifiers-->
* `colorExpr:(x,y,z)` (instead of `colorExpr:texturePos`) gives a color for each pixel in 3D-space that can be used when rendering the shape
<!-- uv:?  a way to map surface to 2D coordinates -->
* `normals:(x,y,z)` (for surface) specify the normal vector for the surface point at the gien space position
* `df:(x,y)` /  `df:(z)` (for plots) derivative of the plotted function at the given coordinates, can be used to simplify computation of normal vectors
* `cutoffRegion:(direction)` region in 3D-space where the surface/plot should be rendered possible values are:
  -
  -
  -
* `degree` the degree of the rendered surface (may be smaller than the actual degree), use a value of `-1` to specify a degree of infinity.


## Functions

CindyGL3D defines the following functions for drawing primitive objects:

* `draw3d(pos3d)` draw a point at position `pos3d`
* `draw3d(point1,point2)` draw a line between the two points `point1` and `point2`
* `sphere3d(center,radius)` draw a sphere with the given center and radius
* `cylinder3d(point1,point2,radius)` draw a cylinder with radius `radius` between the endpoints `point1` and `point2` 
* `connect3d(points)` connect the given points by lines
* `curve3d(expr:(t),from,to)` draw the curve specified by the given equation for `t` in the range `from` and `to`
    the modifier `samples` specifies how many sample-points should be used
* `circle3d(center,orientation,radius)` draws a circle with the given center and radius, in the plane with normal-vector pointing in orientation
* `torus3d(center,orientation,radius1,radius2)` draws a torus with the given center, and orientation with major radius `radius1` and minor radius `radius2`

* `triangle3d(p1,p2,p3)` draw a triangle with the given vertices
* `polygon3d(vertices)` draw a polygon with the given vertices, the modifier `triangulationMode` can be used to specify how the vertices are seperated into triangles, possible values are:
  -
  -
  -
* `mesh3d(grid)` draws the rectangual mesh with the given sample points in grid, given as a rectangual matrix with in the form `grid_y_x`. It is expected that vertex data is given as retangual grids of the same shape. The modifier `topology` can be used to specify how the gird should be closed, possible values are:
  -
  -
  -
If the topology in a direction is closed it is possible to give one addtional row/column of vertex modifiers in that direction to specify the vertex data of the end-points when approaching from the other side. 
<!-- TODO formulation "the other side" may be unclear -->

* `surface3d(expr:(x,y,z))` render the algebraic surface that is the zero-set of the given expression
* `plot3d(f:(x,y))` plot a 2D-function
* `complexplot3d(f:(z))` / `cplot3d(f:(z))` plot the magnitude of the given complex function, if no color is specified the points are colored using the phase of the function
