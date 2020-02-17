/**
 * @type {vec3[]}
 * A (global) list of circle coordinates in the xy-plane for tube generation.
 */
let circlePointData = [];
let circlePointDataTubeRadius = 0.0;

/**
 * Computes the points lying on the specified circle and stores them in @see circlePointData.
 * @param {number} numSegments The number of segments to use to approximate the circle.
 * @param {number} radius The radius of the circle.
 */
function initCircleVertices(numSegments, radius) {
	circlePointData = [];
	circlePointDataTubeRadius = radius;

    let theta = 2.0 * 3.1415926 / numSegments;
    let tangetialFactor = Math.tan(theta); // opposite / adjacent
    let radialFactor = Math.cos(theta); // adjacent / hypotenuse
    let position = new vec3(radius, 0, 0);

    for (let i = 0; i < numSegments; i++) {
        circlePointData.push(position);

        // Add the tangent vector and correct the position using the radial factor.
        let tangent = new vec3(-position.y, position.x, 0);
        position = vec3add(position, vec3mul(tangetialFactor, tangent));
        position = vec3mul(radialFactor, position);
    }
}

/**
 * Appends the vertex points of an oriented and shifted copy of a 2D circle in 3D space.
 * @param {vec3[]} vertices The list to append the circle points to.
 * @param {vec3[]} normals The list to append the normal vectors circles to.
 * @param {vec3} center The center of the circle in 3D space.
 * @param {vec3} normal The normal orthogonal to the circle plane.
 * @param {vec3} lastTangent The tangent of the last circle.
 */
function insertOrientedCirclePoints(vertices, normals, center, normal, lastTangent)
{
	let helperAxis = lastTangent;
	if (vec3length(vec3cross(helperAxis, normal)) < 0.01) {
		// If normal == helperAxis
		helperAxis = new vec3(0, 1, 0);
	}
	let tangent = vec3normalize(vec3sub(helperAxis, vec3mul(vec3dot(helperAxis, normal), normal))); // Gram-Schmidt
	lastTangent.set(tangent.x, tangent.y, tangent.z);
	let binormal = vec3cross(normal, tangent);
	
	for (let i = 0; i < circlePointData.length; i++) {
		let pt = circlePointData[i];
		let trafoPt = new vec3(
			pt.x * tangent.x + pt.y * binormal.x + pt.z * normal.x + center.x,
			pt.x * tangent.y + pt.y * binormal.y + pt.z * normal.y + center.y,
			pt.x * tangent.z + pt.y * binormal.z + pt.z * normal.z + center.z
		);
		vertices.push(trafoPt);
		
		let vertexNormal = vec3normalize(vec3sub(trafoPt, center));
		normals.push(vertexNormal);
	}
}

/**
 * Creates a triangle mesh of a closed tube specified by its center line points and its radius.
 * @param {vec3[]} pathLineCenters The path line center points of the tube.
 * @param {number} tubeRadius The radius of the tube.
 * @param {function(TriangleMesh|null)} meshCreationHandler Called when the triangle mesh of the tube is ready.
 * @param {boolean} tubeClosed Whether the tube is closed or not.
 * Passes a triangle mesh approximating the boundary of the tube.
 */
async function createTubeMesh(pathLineCenters, tubeRadius, tubeClosed, meshCreationHandler) {
	let numSegments = printUiSettings.cylinderQuality;
	if (circlePointData.length != numSegments || tubeRadius != circlePointDataTubeRadius) {
		initCircleVertices(numSegments, tubeRadius);
	}
	
	let n = pathLineCenters.length;
	
	// Assert that we have a valid input data range
	if (tubeClosed && n < 3) {
		console.log("createClosedTubeMesh: Closed tube too short.");
		return null;
	}
	if (!tubeClosed && n < 2) {
		console.log("createClosedTubeMesh: Open tube too short.");
		return null;
	}
	
	let triangleMesh = new TriangleMesh();
	let vertices = triangleMesh.vertices;
	let indices = triangleMesh.indices;
	let normals = triangleMesh.normals;
	let lastLineNormal = new vec3(1, 0, 0);
	let lineNormals = [];
	let numValidLinePoints = 0;
	for (let i = 0; i < n; i++) {
		let tangent = vec3sub(pathLineCenters[(i+1)%n], pathLineCenters[i]);
		if (!tubeClosed && i == n-1) {
			tangent = vec3sub(pathLineCenters[i], pathLineCenters[i-1]);
		}
		let lineSegmentLength = vec3length(tangent);

		if (lineSegmentLength < 0.00001) {
		    // In case the two vertices are almost identical, just skip this path line segment
		    continue;
		}
		tangent = vec3normalize(tangent);
		
		insertOrientedCirclePoints(vertices, normals, pathLineCenters[i], tangent, lastLineNormal);
		lineNormals.push(new vec3(lastLineNormal.x, lastLineNormal.y, lastLineNormal.z));
		numValidLinePoints++;
	}
	
	for (let i = 0; i < numValidLinePoints-1; i++) {
		for (let j = 0; j < numSegments; j++) {
			// Build two CCW triangles (one quad) for each side
			// Triangle 1
			indices.push(i*numSegments+j);
			indices.push(i*numSegments+(j+1)%numSegments);
			indices.push(((i+1)%numValidLinePoints)*numSegments+(j+1)%numSegments);

			// Triangle 2
			indices.push(i*numSegments+j);
			indices.push(((i+1)%numValidLinePoints)*numSegments+(j+1)%numSegments);
			indices.push(((i+1)%numValidLinePoints)*numSegments+j);
		}
	}
	
	if (tubeClosed) {
		/*
		 * The tube is supposed to be closed. However, as we iteratively construct an artificial normal for
		 * each line point perpendicular to the approximated line tangent, the normals at the begin and the
		 * end of the tube do not match (i.e. the normal is not continuous).
		 * Thus, the idea is to connect the begin and the end of the tube in such a way that the length of
		 * the connecting edges is minimized. This is done by computing the angle between the two line
		 * normals and shifting the edge indices by a necessary offset.
		 */
		let normalA = lineNormals[numValidLinePoints-1];
		let normalB = lineNormals[0];
		let normalAngleDifference = Math.atan2(vec3length(vec3cross(normalA, normalB)), vec3dot(normalA, normalB));
		normalAngleDifference = (normalAngleDifference + 2*Math.PI) % (2*Math.PI);
		let jOffset = Math.round(normalAngleDifference / (2*Math.PI) * numSegments);
		for (let j = 0; j < numSegments; j++) {
			// Build two CCW triangles (one quad) for each side
			// Triangle 1
			indices.push((numValidLinePoints-1)*numSegments+(j)%numSegments);
			indices.push((numValidLinePoints-1)*numSegments+(j+1)%numSegments);
			indices.push(0*numSegments+(j+1+jOffset)%numSegments);

			// Triangle 2
			indices.push((numValidLinePoints-1)*numSegments+(j)%numSegments);
			indices.push(0*numSegments+(j+1+jOffset)%numSegments);
			indices.push(0*numSegments+(j+jOffset)%numSegments);
		}
	} else {
		/*
		 * If the tube is open, close it with two hemisphere caps at the ends.
		 */
		let numLongitudeSubdivisions = numSegments; // azimuth
		let numLatitudeSubdivisions = Math.ceil(numSegments/2); // zenith
		let theta; // azimuth;
		let phi; // zenith;

		// Hemisphere at the start
		let center0 = pathLineCenters[0];
		let tangent0 = vec3sub(pathLineCenters[0], pathLineCenters[1]);
		tangent0 = vec3normalize(tangent0);
		let normal0 = lineNormals[0];

		// Hemisphere at the end
		let center1 = pathLineCenters[n-1];
		let tangent1 = vec3sub(pathLineCenters[n-1], pathLineCenters[n-2]);
		tangent1 = vec3normalize(tangent1);
		let normal1 = lineNormals[numValidLinePoints-1];

		let addHemisphereToMesh = function(center, tangent, normal, isStartHemisphere) {
			let binormal = vec3cross(normal, tangent);
			tangent = vec3mul(tubeRadius, tangent);
			normal = vec3mul(tubeRadius, normal);
			binormal = vec3mul(tubeRadius, binormal);

			let vertexIndexOffset = vertices.length - numLongitudeSubdivisions;
			for (let lat = 1; lat <= numLatitudeSubdivisions; lat++) {
				phi = 0.5 * Math.PI * (1 - lat/numLatitudeSubdivisions);
				for (let lon = 0; lon < numLongitudeSubdivisions; lon++) {
					theta = -2.0*Math.PI * lon/numLongitudeSubdivisions;
	
					let pt = new vec3(
						Math.cos(theta) * Math.sin(phi),
						Math.sin(theta) * Math.sin(phi),
						Math.cos(phi)
					);
	
					let trafoPt = new vec3(
						pt.x * normal.x + pt.y * binormal.x + pt.z * tangent.x + center.x,
						pt.x * normal.y + pt.y * binormal.y + pt.z * tangent.y + center.y,
						pt.x * normal.z + pt.y * binormal.z + pt.z * tangent.z + center.z
					);
		
					vertices.push(trafoPt);
	
					if (lat == numLatitudeSubdivisions) {
						break;
					}
				}
			}
			for (let lat = 0; lat < numLatitudeSubdivisions; lat++) {
				for (let lon = 0; lon < numLongitudeSubdivisions; lon++) {
					if (isStartHemisphere && lat == 0) {
						indices.push(
							(2*numLongitudeSubdivisions-lon)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(
							(2*numLongitudeSubdivisions-lon-1)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon)%numLongitudeSubdivisions
							+ (lat+1)*numLongitudeSubdivisions);
						indices.push(
							(2*numLongitudeSubdivisions-lon-1)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon+1)%numLongitudeSubdivisions
							+ (lat+1)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon)%numLongitudeSubdivisions
							+ (lat+1)*numLongitudeSubdivisions);
					} else if (lat < numLatitudeSubdivisions-1) {
						indices.push(vertexIndexOffset
							+ (lon)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon+1)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon)%numLongitudeSubdivisions
							+ (lat+1)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon+1)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon+1)%numLongitudeSubdivisions
							+ (lat+1)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon)%numLongitudeSubdivisions
							+ (lat+1)*numLongitudeSubdivisions);
					} else {
						indices.push(vertexIndexOffset
							+ (lon)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ (lon+1)%numLongitudeSubdivisions
							+ (lat)*numLongitudeSubdivisions);
						indices.push(vertexIndexOffset
							+ 0
							+ (lat+1)*numLongitudeSubdivisions);
					}
				}
			}
		}

		addHemisphereToMesh(center1, tangent1, normal1, false);
		addHemisphereToMesh(center0, tangent0, normal0, true);
	}

	meshCreationHandler(triangleMesh);
}
