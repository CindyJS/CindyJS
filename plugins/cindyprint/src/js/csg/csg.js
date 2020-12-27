// See https://github.com/jscad/csg.js/ (MIT license)

//const _ = require('@jscad/csg');
var CSG;

// Load the jscad library.

// CindyJS environment or web worker?
if (typeof CindyJS === 'undefined') {
	importScripts("csg.js");
	self.CSG = self.csg.CSG;
	self.CAG = self.csg.CAG;
} else {
	CindyJS.loadScript("csg", "csg.js", csgReady);
	function csgReady() {
		self.CSG = self.csg.CSG;
		self.CAG = self.csg.CAG;
	}
}

// Global resolution setting for spheres and cylinders (quality/speed trade-off).
let csgResolution = 8;
let csgResolutionSphere = 16;
let csgResolutionCylinder = 8;

function setCsgResolution(_csgResolution) {
	csgResolution = _csgResolution;
}
function setCsgResolutionSphere(_csgResolutionSphere) {
	csgResolutionSphere = _csgResolutionSphere;
}
function setCsgResolutionCylinder(_csgResolutionCylinder) {
	csgResolutionCylinder = _csgResolutionCylinder;
}

/**
 * Creates a OpenJSCAD sphere from Cindy3D data.
 * @param {number[]} center The center of the sphere as a list of coordinates. 
 * @param {number} radius The radius of the sphere.
 * @return {CSG} The CSG object.
 *
 * For more information see:
 * https://github.com/jscad/csg.js/blob/V2/docs/api.md#sphere
 */
function createCSGSphere(center, radius) {
	return self.CSG.sphere({
		center: center,
		radius: radius,
		resolution: csgResolutionSphere
	});
}

/**
 * Creates a OpenJSCAD sphere from Cindy3D data.
 * @param {number[]} start The start point of the cylinder.
 * @param {number[]} end The end point of the cylinder.
 * @param {number} radius The radius of the cylinder.
 * @return {CSG} The CSG object.
 *
 * For more information see:
 * https://github.com/jscad/csg.js/blob/V2/docs/api.md#sphere
 */
function createCSGCylinder(start, end, radius) {
	// TODO: Check: Is this really a normal cylinder with spheres at the ends?
	return self.CSG.roundedCylinder({
		start: start,
		end: end,
		radius: radius,
		resolution: csgResolutionCylinder
	});
}

/**
 * Converts Cindy3D triangle points to an CSG polyhedron.
 * @param {number[][]} cindyTriangles The triangle points.
 * @return {CSG} The converted CSG object.
 *
 * For more information see:
 * https://github.com/jscad/csg.js/blob/V2/docs/api.md#polyhedron
 * https://github.com/jscad/OpenJSCAD.org/blob/master/packages/examples/polyhedron.jscad
 * https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/The_OpenSCAD_Language#polyhedron
 */
function convertCindy3DTrianglesToPolyhedron(cindyTriangles) {
	let triangleMesh = cindyTrianglePointsToIndexedMesh(cindyTriangles);
	return convertTriangleMeshToCSGPolyhedron(triangleMesh);
}

/**
 * Converts a triangle mesh to an CSG polyhedron.
 * @param {TriangleMesh} triangleMesh The mesh to convert.
 * @return {CSG} The converted CSG object.
 *
 * For more information see:
 * https://github.com/jscad/csg.js/blob/V2/docs/api.md#polyhedron
 * https://github.com/jscad/OpenJSCAD.org/blob/master/packages/examples/polyhedron.jscad
 * https://en.wikibooks.org/wiki/OpenSCAD_User_Manual/The_OpenSCAD_Language#polyhedron
 */
function convertTriangleMeshToCSGPolyhedron(triangleMesh) {
	// vec3 data needs to be converted to a list of numbers.
	let pointList = [];
	for (let i = 0; i < triangleMesh.vertices.length; i++) {
		let v = triangleMesh.vertices[i];
		pointList.push([v.x, v.y, v.z]);
	}
	
	// Triangle list expected as array of array of numbers.
	let triangleList = [];
	for (let i = 0; i < triangleMesh.indices.length; i += 3) {
		// CCW -> CW
		triangleList.push([triangleMesh.indices[i+2],
				triangleMesh.indices[i+1], triangleMesh.indices[i]]);
	}

	return self.CSG.polyhedron({
		points: pointList,
		faces: triangleList
	});
}

/**
 * Converts the passed Cindy3D objects to CSG objects, merges them, and returns them as a triangle mesh.
 * @param {SphereData[]]} spheres A list of Cindy3D spheres.
 * @param {CylinderData[]} cylinders A list of Cindy3D cylinders.
 * @param {TriangleData[]} triangles A list of Cindy3D triangle meshes.
 * @return {TriangleMesh} The merged triangle mesh.
 */
function mergeCindy3DObjectsToMesh(spheres, cylinders, triangles) {
	let csgObjects = [];
	
	// First, convert the Cindy3D objects to CSG objects
	for (let i = 0; i < spheres.length; i++) {
		csgObjects.push(createCSGSphere(spheres[i].pos, spheres[i].radius));
	}
	for (let i = 0; i < cylinders.length; i++) {
		csgObjects.push(createCSGCylinder(cylinders[i].pos1, cylinders[i].pos2, cylinders[i].radius));
	}
	for (let i = 0; i < triangles.length; i++) {
		csgObjects.push(convertCindy3DTrianglesToPolyhedron(triangles[i].trianglePoints));
	}
		
	let triangleMesh = mergeObjects(csgObjects);
	return triangleMesh;
}

/**
 * @param {CSG[]} csgObjects The CSG objects to merge using the union operation.
 * @return {TriangleMesh} The merged triangle mesh.
 */
function mergeObjects(csgObjects) {
	let objectUnion = new self.CSG().union(csgObjects);
	let triangleMesh = convertCSGPolygonsToTriangleMesh(objectUnion);
	return triangleMesh;
}

/**
 * @param {CSG[]} csgObjects The CSG objects to compute the intersection of.
 * @return {TriangleMesh} The resulting triangle mesh.
 */
function intersectObjects(csgObjects) {
	let objectUnion = new self.CSG().intersect(csgObjects);
	let triangleMesh = convertCSGPolygonsToTriangleMesh(objectUnion);
	return triangleMesh;
}

/**
 * Converts CSG objects to a triangle mesh;
 * @param {CSG} csgObjects The CSG objects to convert.
 * @return {TriangleMesh} The converted triangle mesh.
 */
function convertCSGPolygonsToTriangleMesh(csgObjects) {
	let polygons = csgObjects.toTriangles(); // type: Polygons
	
	// First, construct a list of triangle points.
	let trianglePoints = [];
	for (let i = 0; i < polygons.length; i++) {
		let polygon = polygons[i].vertices;
		// Each triangle polygon consists of three points. Reverse winding (CW -> CCW).
		for (let j = 0; j < 3; j++) {
			// TODO: Use polygon[j].tag. It is sort of an index not starting at 0.
			let pt = polygon[j].pos;
			trianglePoints.push(new vec3(pt._x, pt._y, pt._z));
		}
	}
	
	// Index the triangle vertex set.
	let triangleMesh = trianglePointsToIndexedMesh(trianglePoints);

	return triangleMesh;
}


/**
 * Uses @ref trianglePointsToIndexedMesh to index Cindy3D triangle meshes.
 * @param {number[][]} trianglePoints The Cindy3D triangle points.
 * @param {number} epsilon OPTIONAL: The epsilon for merging two vertices.
 * @return {TriangleMesh} An indexed triangle mesh constructed from the unindexed triangles.
 */
function cindyTrianglePointsToIndexedMesh(trianglePointsCindy3D, epsilon) {
	let trianglePoints = trianglePointsCindy3D.map(function(p) {
		return new vec3(p[0], p[1], p[2]);
	});
	// Convert triangle vertex list to indexed triangle mesh (using code from IndexMesh.js)
	return trianglePointsToIndexedMesh(trianglePoints, undefined, epsilon);
}
