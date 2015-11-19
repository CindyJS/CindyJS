============================================================
Javascript Clipper Change Log
============================================================

v6.1.2.1 (15 December 2013)
* Minor improvement to joining polygons.

v6.1.1.1 (13 December 2013)
* Fixed a couple of bugs affecting open paths that could 
  raise unhandled exceptions.
* Fixed Uncaught ReferenceError: DistanceFromLineSqrd is not defined when
  using CleanPolygon or CleanPolygons
* Fixed SimplifyPolygon calls in Main Demo

v6.1.0.1 (12 December 2013)
* Added: Info and Examples page: http://jsclipper.sourceforge.net/6.1.0.1/
* Added: Clipper 6 documentation in 
  https://sourceforge.net/p/jsclipper/wiki/documentation/
* Migration guide for Clipper 5 users in
  https://sourceforge.net/p/jsclipper/wiki/migration5to6/
* Modified: To accommodate open paths, several functions have been renamed:
  Polygon -> Path
  Polygons -> Paths
  AddPolygon -> AddPath
  AddPolygons -> AddPaths
  PolyTreeToPolygons -> PolyTreeToPaths
  ReversePolygons -> ReversePaths
* Modified: OffsetPolygons function is replaced by ClipperOffset
  class, which is much more flexible. There is also now deprecated
  OffsetPaths function, which may be removed in future update.
* Update: ExPolygons has been replaced with the PolyTree & 
  PolyNode classes to more fully represent the parent-child 
  relationships of the polygons returned by Clipper. There is 
  for backward compatibility ClipperLib.JS.PolyTreeToExPolygons.
* Added: Open path (polyline) clipping.
* Update: Major improvement in the merging of 
  shared/collinear edges in clip solutions (see Execute). 
* Added: The IntPoint structure now has an optional 'Z' member. 
  (See the precompiler directive use_xyz.) 
* Added: New CleanPolygon and CleanPolygons functions.
* Added: MinkowskiSum and MinkowskiDiff functions added. 
* Added: Several other new functions have been added including 
  PolyTreeToPaths, OpenPathsFromPolyTree and ClosedPathsFromPolyTree. 
* Added: ReverseSolution, PreserveCollinear and StrictlySimple properties to Clipper class
* Added: The Clipper constructor now accepts an optional InitOptions 
  parameter to simplify setting properties. 
* Modified: The Clipper class has a new ZFillFunction property. 
* Deprecated: Version 6 is a major upgrade from previous versions 
  and quite a number of changes have been made to exposed structures 
  and functions. To minimize inconvenience to existing library users, 
  some code has been retained and some added to maintain backward 
  compatibility. However, because this code will be removed in a 
  future update, it has been marked as deprecated and a precompiler 
  directive use_deprecated has been defined.
* Changed: The behaviour of the 'miter' JoinType has been 
  changed so that when squaring occurs, it's no longer 
  extended up to the miter limit but is squared off at 
  exactly 'delta' units. (This improves the look of mitering 
  with larger limits at acute angles.) 
* Bugfixes: Several minor bugs have been fixed including 
  occasionally an incorrect nesting within the PolyTree structure.

5.0.2.3 - 27 November 2013
* Added: Node.js compatibility.
* Bugfix: jQuery's "event.returnValue is deprecated." warning is stripped.

5.0.2.2 - 11 September 2013
* Bugfix: SlopesEqual() uses now big integers only when needed and causes speed improvements in certain cases.
* Bugfix: Fixed inconsistent use of DV in jsbn.js, in function bnpFromInt() DV replaced with this.DV.
* BugFix: ExPolygons structure is now working as expected.
* Added: Main Demo has now Ex-button in Polygon Explorer, which shows Solution as ExPolygons structure.
* Added: ExPolygons is now explained in wiki in https://sourceforge.net/p/jsclipper/wiki/ExPolygons/
* Added: Web Workers compatibility
* Added: Web Workers support page is available in https://sourceforge.net/p/jsclipper/wiki/Web%20Workers/

5.0.2.1 - 12 January 2013
* Update: Clipper library updated to version 5.0.2. The Area algorithm has been updated and is faster. 
  'CheckInputs' parameter of the OffsetPolygons function has been renamed 'AutoFix'.
* Added: ClipperLib.Clean(), which removes too near vertices to avoid micro-self-intersection-artifacts when offsetting.
* Added: ClipperLib.Lighten(), which reduces count of vertices using perpendicular distance reduction algorithm.
* Added: ClipperLib.Clone(), which make true clone of polygons.
Several updates to the Main Demo:
* Added: Clean, Simplify, Lighten buttons
* Change: Custom Polygons: input boxes to textareas to allow more data
* Added: Polygon Output Formats (Clipper, Plain, SVG)
* Update: Polygon Explorer: Also multipolygon is clickable (on Points column) 
* Added: Polygon Explorer: When numbers on Points or Points in subpolygons are clicked, the area of multipolygon or subpolygon is shown
* Update: Several updates to wiki in https://sourceforge.net/p/jsclipper/wiki/Home/

4.9.7.2 - 1 January 2013
* Update: Browser specific speedup for ClipperLib.Clipper.Round(), ClipperLib.Cast_Int32() and ClipperLib.Cast_Int64().
* Update: Major enhancements for Main Demo. Including benchmark, custom polygons and polygon importer.
* Update: Documentation is updated with new screenshots of Main Demo. Browser speedtest is published in Wiki.

4.9.7.1 - 12 December 2012
* Initial release