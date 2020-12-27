/**
 * @file SimpleShell.js
 * Computes the shell of a (usually open) triangulated surface by offsetting all points along the
 * average normal of all surfaces that share a certain vertex.
 * The file is called "SimpleShell", as this approach is very simplistic and can result in self-
 * intersections in areas with large angles between two adjacent triangles.
 */

/**
 * Computes the shell of a (usually open) surface with a certain radius.
 * The edges are not rounded (use @see createOpenSurfaceShellMeshWithNormalsAndRoundEdges for this).
 * The shell is extruded by offsetting all normals along their (averaged) normal.
 * This can cause some distortions for large radii. Thus, implementing a more correct algorithm
 * would be beneficial for these cases (eventual TODO).
 * @param {TriangleMesh} triangleMesh The triangle mesh to compute the shell of.
 * @param {number} radius The radius of the surface shell.
 */
function createOpenSurfaceShellMeshWithNormals(triangleMesh, radius) {
	if (triangleMesh.normals.length == 0) {
		triangleMesh.computeSmoothNormals();
	}
	
	let newIndices = [];
	let newVertices = [];
	
	// Create two copies of the indices and vertices
	newIndices = triangleMesh.indices.concat(
		triangleMesh.indices.map(i => i + triangleMesh.vertices.length)
	);
	newVertices = triangleMesh.vertices.concat(triangleMesh.vertices);
	
	// Invert the winding order of the second copy indices
	for (let i = 0; i < triangleMesh.indices.length; i += 3) {
		let tmp = newIndices[i];
		newIndices[i] = newIndices[i+2];
		newIndices[i+2] = tmp;
	}
	
	// Push vertices in and out using the stored normal
	for (let i = 0; i < triangleMesh.vertices.length; i++) {
		let v = triangleMesh.vertices[i];
		let n = triangleMesh.normals[i];
		let positiveOffset = vec3mul(radius, n);
		let negativeOffset = vec3mul(-radius, n);
		newVertices[i] = vec3add(v, negativeOffset);
		newVertices[i + triangleMesh.vertices.length] = vec3add(v, positiveOffset);
	}
	
	// Create mesh graph with unordered indices in insertion order
	let meshGraph = new MeshGraph(triangleMesh, false);
	
	// Extrude the border edges
	for (let i = 0; i < meshGraph.edges.length; i++) {
		// Edge lies on border of object
		if (meshGraph.edges[i].meshEdgeCount == 1) {
			let edge = meshGraph.edges[i].connectedNodes;
			let i0 = edge[0];
			let i1 = edge[1];
			let j0 = i0 + triangleMesh.vertices.length;
			let j1 = i1 + triangleMesh.vertices.length;
			// Winding: CCW
			newIndices = newIndices.concat([j1, j0, i0, i1, j1, i0]);
		}
	}
	
	let newTriangleMesh = new TriangleMesh();
	newTriangleMesh.indices = newIndices;
	newTriangleMesh.vertices = newVertices;
	return newTriangleMesh;
}

/**
 * Computes the shell of a (usually open) surface with a certain radius.
 * The edges are rounded (use @see createOpenSurfaceShellMeshWithNormals for hard edges).
 * The shell is extruded by offsetting all normals along their (averaged) normal.
 * This can cause some distortions for large radii. Thus, implementing a more correct algorithm
 * would be beneficial for these cases (eventual TODO).
 * @param {TriangleMesh} triangleMesh The triangle mesh to compute the shell of.
 * @param {number} radius The radius of the surface shell.
 */
function createOpenSurfaceShellMeshWithNormalsAndRoundEdges(triangleMesh, radius) {
	if (triangleMesh.normals.length == 0) {
		triangleMesh.computeSmoothNormals();
	}
	
	let newIndices = [];
	let newVertices = [];
	
	// Create two copies of the indices and vertices
	newIndices = triangleMesh.indices.concat(
		triangleMesh.indices.map(i => i + triangleMesh.vertices.length)
	);
	newVertices = triangleMesh.vertices.concat(triangleMesh.vertices);
	
	// Invert the winding order of the second copy indices
	for (let i = 0; i < triangleMesh.indices.length; i += 3) {
		let tmp = newIndices[i];
		newIndices[i] = newIndices[i+2];
		newIndices[i+2] = tmp;
	}
	
	// Push vertices in and out using the stored normal
	for (let i = 0; i < triangleMesh.vertices.length; i++) {
		let v = triangleMesh.vertices[i];
		let n = triangleMesh.normals[i];
		let positiveOffset = vec3mul(radius, n);
		let negativeOffset = vec3mul(-radius, n);
		newVertices[i] = vec3add(v, negativeOffset);
		newVertices[i + triangleMesh.vertices.length] = vec3add(v, positiveOffset);
	}
	
	// Create the rounded edges (approximated by tubes using half-circles).
	// TODO: Let the user specify the number of half-circle segments for rounded edges.
	let numSegments = 8;
    addTubesOnBorderEdges(triangleMesh, triangleMesh.vertices, triangleMesh.indices, newVertices, newIndices, numSegments, radius);
	
	let newTriangleMesh = new TriangleMesh();
	newTriangleMesh.indices = newIndices;
	newTriangleMesh.vertices = newVertices;
	return newTriangleMesh;
}


/**
 * Computes loops of mesh edges lying on the border of the mesh.
 * Objects lying on the border of the mesh are only used once and not shared by more than one triangle.
 * This is useful to compute which edges we have to smoothen when computing the mesh shell.
 * @param {MeshGraph} meshGraph The mesh graph of the triangle mesh.
 * @return {number[][]} The border edge loops, i.e. an array of arrays of vertex indices lying on the mesh border.
 */
function getBorderEdgeLoops(meshGraph) {
	let visitedEdges = new Set();
	let borderEdgeLoops = [];

	for (let i = 0; i < meshGraph.edges.length; i++) {
		// Edge lies on border of object
		if (meshGraph.edges[i].meshEdgeCount == 1 && !visitedEdges.has(meshGraph.edges[i])) {
			visitedEdges.add(meshGraph.edges[i]);
			let edge = meshGraph.edges[i].connectedNodes;
			let i0 = edge[0];
			let i1 = edge[1];
			let startPoint = i0;

			let borderEdgeLoop = [i0];
			while (i1 != startPoint) {
				let nextEdge = null;
				for (let j = 0; j < meshGraph.edges.length; j++) {
					if (meshGraph.edges[j].meshEdgeCount == 1
							&& meshGraph.edges[j].connectedNodes.indexOf(i1) !== -1
							&& !visitedEdges.has(meshGraph.edges[j])) {
						nextEdge = meshGraph.edges[j];
						break;
					}
				}
                visitedEdges.add(nextEdge);
                if (nextEdge.connectedNodes[0] == i1) {
                    i0 = nextEdge.connectedNodes[0];
                    i1 = nextEdge.connectedNodes[1];
                } else {
                    i0 = nextEdge.connectedNodes[1];
                    i1 = nextEdge.connectedNodes[0];
                }
				borderEdgeLoop.push(i0);
			}
			borderEdgeLoops.push(borderEdgeLoop);
		}
	}

	return borderEdgeLoops;
}

/**
 * @type {vec3[]}
 * A (global) list of half-circle coordinates in the xy-plane for tube generation.
 */
let halfCirclePointData = [];

/**
 * Computes the points lying on the specified circle arc and stores them in @see halfCirclePointData.
 * @param {number} numSegments The number of segments to use to approximate the circle arc.
 * @param {number} radius The radius of the circle.
 * @param {number} startAngle The start angle of the circle arc (in radians).
 * @param {number} arcAngle The total angle of the circle arc (in radians).
 */
function initArcVertices(numSegments, radius, startAngle, arcAngle) {
    let theta = arcAngle / (numSegments - 1);
    let tangetialFactor = Math.tan(theta); // opposite / adjacent
    let radialFactor = Math.cos(theta); // adjacent / hypotenuse
	let position = new vec3(radius * Math.cos(startAngle), radius * Math.sin(startAngle), 0);
	halfCirclePointData = [];

    for (let i = 0; i < numSegments; i++) {
        halfCirclePointData.push(position);

        // Add the tangent vector and correct the position using the radial factor.
        let tangent = new vec3(-position.y, position.x, 0);
        position = vec3add(position, vec3mul(tangetialFactor, tangent));
        position = vec3mul(radialFactor, position);
    }
}

/**
 * This function transforms the circle arc data (@see halfCirclePointData) by shifting its center,
 * and reorienting its x and y axis so that the x axis then looks in the normal direction and
 * the y axis into the binormal direction (obtained by computing the cross product between the
 * normal and tangent direction).
 * @param {vec3} center The new center of the circle arc after the transformation.
 * @param {vec3} normal The normal of a tube curve (i.e. perpendicular to the curve direction).
 * @param {vec3} tangent The tangent of a tube curve (i.e. parallel to the curve direction).
 * @param {vec3[]} The transformed circle arc points.
 */
function getTransformedCircleVertices(center, normal, tangent) {
	let binormal = vec3cross(normal, tangent);
	let trafoedCirclePoints = [];
	for (let i = 0; i < halfCirclePointData.length; i++) {
		let pt = halfCirclePointData[i];
		let trafoPt = new vec3(
			pt.x * normal.x + pt.y * binormal.x + pt.z * tangent.x + center.x,
			pt.x * normal.y + pt.y * binormal.y + pt.z * tangent.y + center.y,
			pt.x * normal.z + pt.y * binormal.z + pt.z * tangent.z + center.z
		);
		trafoedCirclePoints.push(trafoPt);
	}
	return trafoedCirclePoints;
}

/**
 * This function is used by @see createOpenSurfaceShellMeshWithNormalsAndRoundEdges in order to smooth border edges
 * by creating tubes along these edges. The tube data is appended to newVertices and newIndices.
 * @param {TriangleMesh} triangleMesh The triangle mesh from which the edges are used as paths to create tubes along.
 * @param {vec3[]} vertices The vertices of the mesh.
 * @param {number[]} indices The indices of the mesh.
 * @param {vec3[]} newVertices The vertices of the already extruded mesh (without closed border edges).
 * @param {number[]} newIndices The indices of the already extruded mesh (without closed border edges).
 * @param {number} numSegments The number of segments to use for the triangular approximation of the tubes.
 * @param {number} radius The radius of the tubes.
 */
function addTubesOnBorderEdges(triangleMesh, vertices, indices, newVertices, newIndices, numSegments, radius) {
	// Intialize arc data with half circles, as the tubes are inside the mesh on one side.
	// Skip the first and last points, as these are already part of the mesh.
	initArcVertices(numSegments-2, radius, -Math.PI/2.0+Math.PI/(numSegments-1), Math.PI - 2*Math.PI/(numSegments-1));

    // Create mesh graph with unordered indices in insertion order
	let meshGraph = new MeshGraph(triangleMesh, false);

    let indexOffset = newVertices.length;
	let borderEdgeLoops = getBorderEdgeLoops(meshGraph);
	for (let i = 0; i < borderEdgeLoops.length; i++) {
		for (let j = 0; j < borderEdgeLoops[i].length; j++) {
			// Indices of the edge loop points.
			let iLast = borderEdgeLoops[i][(j-1+borderEdgeLoops[i].length) % borderEdgeLoops[i].length];
			let iCurrent = borderEdgeLoops[i][j];
			let iNext = borderEdgeLoops[i][(j+1) % borderEdgeLoops[i].length];

			// The edge loop points themselved.
			let pLast = vertices[iLast];
			let pCurrent = vertices[iCurrent];
			let pNext = vertices[iNext];

			// Compute the tangent direction, i.e. the direction of the tube/the direction of the line segment.
            let tangent = vec3add(vec3sub(pCurrent, pLast), vec3sub(pNext, pCurrent));
			let tangentLength = vec3length(tangent);
			if (tangentLength < 0.0001) {
				// In case the two vertices are almost identical, just skip this path line segment.
				continue;
			}
			tangent = vec3mul(1/tangentLength, tangent);

			// Compute the normal of the current edge segment after extrusion.
			let k0 = iLast;
			let k1 = iCurrent;
			let k2 = iNext;
			let k3 = iLast + triangleMesh.vertices.length;
			let k4 = iCurrent + triangleMesh.vertices.length;
			let k5 = iNext + triangleMesh.vertices.length;
			let normal0 = vec3cross(vec3sub(newVertices[k4], newVertices[k0]), vec3sub(newVertices[k4], newVertices[k1]));
            let normal1 = vec3cross(vec3sub(newVertices[k5], newVertices[k1]), vec3sub(newVertices[k5], newVertices[k2]));
            let normal = vec3normalize(vec3add(normal0, normal1));

			// Add the circle arc points to the vertex data
            let circleVertices = getTransformedCircleVertices(pCurrent, normal, tangent);
			for (let k = 0; k < circleVertices.length; k++) {
                newVertices.push(circleVertices[k]);
            }

			// Gather the indices of the circle points. This is necessary, as we skipped the first and last point of the
			// arc when calling initArcVertices. Thus, we need to use different indices fot these points (i.e., k1,k4/k2,k5).
			let indicesCircle0 = [];
			let indicesCircle1 = [];
			indicesCircle0.push(k1);
			indicesCircle1.push(k2);
			for (let k = 0; k < circleVertices.length; k++) {
                indicesCircle0.push(indexOffset+k);
                if (j < borderEdgeLoops[i].length-1) {
                    indicesCircle1.push(indexOffset+circleVertices.length+k);
                } else {
                    indicesCircle1.push(indexOffset-circleVertices.length*(borderEdgeLoops[i].length-1)+k);
                }
			}
			indicesCircle0.push(k4);
			indicesCircle1.push(k5);
			indexOffset += circleVertices.length;

			// Now add indices for creating triangles approximating the tube along the mesh edges.
			for (let k = 0; k < indicesCircle0.length-1; k++) {
				// Build two CCW triangles (one quad) for each side
				// Triangle 1
				newIndices.push(indicesCircle1[k+1]);
				newIndices.push(indicesCircle0[k+1]);
				newIndices.push(indicesCircle0[k]);

				// Triangle 2
				newIndices.push(indicesCircle1[k]);
				newIndices.push(indicesCircle1[k+1]);
				newIndices.push(indicesCircle0[k]);
			}
		}
	}
}
