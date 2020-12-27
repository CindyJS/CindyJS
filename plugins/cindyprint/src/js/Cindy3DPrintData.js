/**
 * Data for storing a temporary representation of Cindy3D objects.
 * @param {number[]} pos The center of the sphere.
 * @param {number} radius The radius of the sphere.
 */
function SphereData(pos, radius) {
    this.pos = pos;
    this.radius = radius;
}

/**
 * Data for storing a temporary representation of Cindy3D objects.
 * @param {number[]} pos1 The start point of the cylinder.
 * @param {number[]} pos2 The end point of the cylinder.
 * @param {number} radius The radius of the cylinder.
 */
function CylinderData(pos1, pos2, radius) {
    this.pos1 = pos1;
    this.pos2 = pos2;
    this.radius = radius;
}

/**
 * Data for storing a temporary representation of Cindy3D objects.
 * @param {number[][]} trianglePoints A list of triangle points. Three consecutive points build one triangle.
 */
function TriangleData(trianglePoints) {
    this.trianglePoints = trianglePoints;
}

/**
 * Generates a triangle mesh from Cindy3D instance data (spheres, cylinders, triangles).
 * @param {SphereData[]} spheres The spheres.
 * @param {CylinderData[]} cylinders The cylinders.
 * @param {TriangleData[]} triangles The triangle meshes.
 * @return {TriangleMesh} The generated triangle mesh.
 */
function generateCsgMeshFrom(spheres, cylinders, triangles) {
    // Create the surface mesh for the triangle data (and use extrusion if wished by the user).
    let surfaceMesh = null;
    if (triangles.length > 0 && printUiSettings.exportTriangles) {
        surfaceMesh = cindyTrianglePointsToIndexedMesh(triangles[0].trianglePoints, 0.01);
        if (printUiSettings.extrudeSurfaces) {
            if (printUiSettings.smoothEdges) {
                surfaceMesh = createOpenSurfaceShellMeshWithNormalsAndRoundEdges(
                    surfaceMesh,
                    printUiSettings.extrusionRadius
                );
            } else {
                surfaceMesh = createOpenSurfaceShellMeshWithNormals(surfaceMesh, printUiSettings.extrusionRadius);
            }
        }
    }

    // Convert the spheres and cylinders to CSG objects.
    setCsgResolutionSphere(printUiSettings.sphereQuality);
    setCsgResolutionCylinder(printUiSettings.cylinderQuality);
    let csgObjects = [];
    for (let sphereIndex = 0; sphereIndex < spheres.length; sphereIndex++) {
        let radius = spheres[sphereIndex].radius;
        if (triangles.length > 0 && printUiSettings.extrudeSurfaces && printUiSettings.exportTriangles) {
            // In case of extrusion, increase the radius when merging with the surface
            radius += printUiSettings.extrusionRadius * 1.0;
            radius *= printUiSettings.radiusFactor;
        }

        csgObjects.push(createCSGSphere(spheres[sphereIndex].pos, radius));
    }
    for (let cylinderIndex = 0; cylinderIndex < cylinders.length; cylinderIndex++) {
        let radius = cylinders[cylinderIndex].radius;
        if (triangles.length > 0 && printUiSettings.extrudeSurfaces && printUiSettings.exportTriangles) {
            // In case of extrusion, increase the radius when merging with the surface
            radius += printUiSettings.extrusionRadius * 1.0;
            radius *= printUiSettings.radiusFactor;
        }
        csgObjects.push(createCSGCylinder(cylinders[cylinderIndex].pos1, cylinders[cylinderIndex].pos2, radius));
    }

    // Compute the union of all objects for the print mesh.
    let triangleMesh = null;
    if (triangles.length > 0 && printUiSettings.exportTriangles) {
        if (spheres.length == 0 && cylinders.length == 0) {
            triangleMesh = surfaceMesh;
        } else {
            //let objectUnion = new window.CSG().union(csgObjects);
            //triangleMesh = mergeObjects([convertTriangleMeshToCSGPolyhedron(surfaceMesh), objectUnion]);
            csgObjects = [convertTriangleMeshToCSGPolyhedron(surfaceMesh)].concat(csgObjects);
            triangleMesh = mergeObjects(csgObjects);
        }
    } else {
        triangleMesh = mergeObjects(csgObjects);
    }

    triangleMesh.scale(printUiSettings.modelScale);
    return triangleMesh;
}
