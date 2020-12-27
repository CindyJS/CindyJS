/**
 * An O(n*log(n)) (average case) algorithm for indexing a triangle mesh using a k-d-tree.
 *
 * @param {vec3[]} trianglePoints The (unindexed) points forming a list of triangles.
 * @param {number} epsilon The epsilon for merging two very close points.
 * @return {TriangleMesh} An indexed triangle mesh constructed from the unindexed triangles.
 */
function trianglePointsToIndexedMesh(trianglePoints, triangleNormals, epsilon) {
    if (epsilon === undefined) epsilon = 0.00001;

    let triangleMesh = new TriangleMesh();
    let indexPoints = [];
    for (let i = 0; i < trianglePoints.length; i++) {
        indexPoints.push(new IndexedPoint(trianglePoints[i]));
    }
    let kdTree = new KDTree();

    let indexCounter = 0;
    for (let i = 0; i < trianglePoints.length; i++) {
        let currentPoint = trianglePoints[i];
        let indexedPoint = new IndexedPoint(currentPoint);
        let veryClosePoint = kdTree.findCloseIndexedPoint(indexedPoint, epsilon);
        if (veryClosePoint != null) {
            triangleMesh.indices.push(veryClosePoint.index);
        } else {
            indexedPoint.index = indexCounter;
            kdTree.addPoint(indexedPoint);
            triangleMesh.indices.push(indexCounter);
            triangleMesh.vertices.push(currentPoint);
            if (triangleNormals !== undefined) triangleMesh.normals.push(triangleNormals[i]);
            indexCounter++;
        }
    }
    return triangleMesh;
}

/**
 * An O(n^2) algorithm for indexing a triangle mesh.
 *
 * @param {vec3[]} trianglePoints The (unindexed) points forming a list of triangles.
 * @param {number} epsilon The epsilon for merging two very close points.
 * @return {TriangleMesh} An indexed triangle mesh constructed from the unindexed triangles.
 */
function trianglePointsToIndexedMeshON2(trianglePoints, epsilon) {
    if (epsilon === undefined) epsilon = 0.00001;

    let triangleMesh = new TriangleMesh();
    let isPointApproxEqual = function (p, q) {
        return Math.abs(p.x - q.x) < epsilon && Math.abs(p.y - q.y) < epsilon && Math.abs(p.z - q.z) < epsilon;
    };

    for (let i = 0; i < trianglePoints.length; i++) {
        let pointIndex = -1;

        // Search whether the current point in trianglePoints already was added.
        for (let j = 0; j < triangleMesh.vertices.length; j++) {
            if (isPointApproxEqual(trianglePoints[i], triangleMesh.vertices[j])) {
                pointIndex = j;
                break;
            }
        }

        if (pointIndex < 0) {
            // Vertex doesn't already exist. Add the new point and an index pointint to it.
            triangleMesh.indices.push(triangleMesh.vertices.length);
            triangleMesh.vertices.push(trianglePoints[i]);
        } else {
            // Vertex already exists. Just add an index to the existing vertex.
            triangleMesh.indices.push(pointIndex);
        }
    }

    return triangleMesh;
}

/**
 * Flips the orientation (clockwise, counterclockwise) of the vertices in the parameter array.
 * @param {any[]} triangleVertexList Vertex points or indices.
 */
function flipVertexListOrientation(triangleVertexList) {
    for (let i = 0; i < triangleVertexList.length; i += 3) {
        let tmp = triangleVertexList[i];
        triangleVertexList[i] = triangleVertexList[i + 2];
        triangleVertexList[i + 2] = tmp;
    }
}
