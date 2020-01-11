/**
 * @file {PrintWorker.js}
 * If one wants to use multi-threading in JavaScript, web workers are necessary.
 * One can generate workers from arbitrary URLs. However, generating a worker
 * from anything other than source files (i.e. blobs) is usually prohibited by
 * default by CSP (content security policies). And as one cannot loosen CSPs
 * manually in HTML files, this file contains all functions that can be used by
 * web workers in CindyPrint.
 */

/**
 * Message handler of the web worker. Expects the data object of the event to
 * store an attribute 'command' that specifies which function to execute.
 */
onmessage = function (e) {
    printUiSettings = e.data.printUiSettings;
    self.useWebWorkers = true;
    let command = e.data.command;

    if (command == 'generateCsgMesh') {
        postMessage(generateCsgMeshFrom(e.data.spheres, e.data.cylinders, e.data.triangles));
    } else if (command == 'generateIsoMeshFromScalarFunction') {
        WORKER_generateIsoMeshFromScalarFunction(e.data);
    } else if (command == 'generateIsoMeshFromScalarFunction_PARALLEL') {
        generateIsoMeshFromScalarFunction_PARALLEL(e.data.workerID, e.data.gridCells, e.data.isoLevel);
    } else if (command == 'generateIsoMeshFromScalarFunctionSnapMC_PARALLEL') {
        generateIsoMeshFromScalarFunctionSnapMC_PARALLEL(e.data.workerID, e.data.gridCells, e.data.isoLevel, e.data.snapGrid, e.data.indices);
    }
}

/**
 * Calls generateIsoMeshFromGrid from within the web worker.
 * @param {object} data The data sent using 'postMessage' for 'generateIsoMeshFromGrid'.
 */
function WORKER_generateIsoMeshFromScalarFunction(data) {
    self.baseDir = data.baseDir;
    generateIsoMeshFromGrid(data.cartesianGrid.gridPoints, data.cartesianGrid.gridValues,
        data.cartesianGrid.gridNormals, data.isoLevel, (triangleVertexList, vertexNormalList) => {
            let triangleMesh = trianglePointsToIndexedMesh(triangleVertexList, vertexNormalList, 0.000001);
            if (printUiSettings.extrudeSurfaces) {
                if (printUiSettings.smoothEdges) {
                    triangleMesh = createOpenSurfaceShellMeshWithNormalsAndRoundEdges(
                        triangleMesh, printUiSettings.extrusionRadius);
                } else {
                    triangleMesh = createOpenSurfaceShellMeshWithNormals(
                        triangleMesh, printUiSettings.extrusionRadius);
                }
            }
            postMessage(triangleMesh);
        });
}


/**
 * 
 * @param {number} workerID The ID of the Marching Cubes worker. This is necessary for dispatching
 * new work to the web worker that is idle after returning the result of its current task.
 * @param {vec3[]} trianglePoints The triangle points the web worker has generated.
 * @param {vec3[]} triangleNormals The vertex normals the web worker has generated.
 */
function MCWorkerAnswer(workerID, trianglePoints, triangleNormals) {
    this.workerID = workerID;
    this.trianglePoints = trianglePoints;
    this.triangleNormals = triangleNormals;
}

/**
 * Calls 'polygonizeGridCell' to polygonize a set of grid cells sent to the web worker.
 * @param {number} workerID The ID of the Marching Cubes worker. This is necessary for dispatching
 * new work to the web worker that is idle after returning the result of its current task.
 * @param {GridCell[]} gridCells The grid cells to polygonize in the worker using the Marching Cubes algorithm.
 * @param {number} isoLevel The iso level of the iso surface to extract from the grid cells.
 */
function generateIsoMeshFromScalarFunction_PARALLEL(workerID, gridCells, isoLevel) {
    let triangleVertexList = [];
    let vertexNormalList = [];
    for (let i = 0; i < gridCells.length; i++) {
        let data = polygonizeGridCellMarchingCubes(gridCells[i], isoLevel);
        let newTriangles = data.trianglePoints;
        triangleVertexList = triangleVertexList.concat(newTriangles);
        let newNormals = data.triangleNormals;
        vertexNormalList = vertexNormalList.concat(newNormals);
    }
    postMessage(new MCWorkerAnswer(workerID, triangleVertexList, vertexNormalList));
}

/**
 * Calls 'polygonizeGridCell' to polygonize a set of grid cells sent to the web worker.
 * @param {number} workerID The ID of the Marching Cubes worker. This is necessary for dispatching
 * new work to the web worker that is idle after returning the result of its current task.
 * @param {GridCell[]} gridCells The grid cells to polygonize in the worker using the Marching Cubes algorithm.
 * @param {number} isoLevel The iso level of the iso surface to extract from the grid cells.
 */
function generateIsoMeshFromScalarFunctionSnapMC_PARALLEL(workerID, gridCells, isoLevel, snapGrid, indices) {
    let triangleVertexList = [];
    let vertexNormalList = [];
    for (let l = 0; l < gridCells.length; l++) {
        let data = polygonizeGridCellSnapMC(gridCells[l], isoLevel, snapGrid, indices[l][0], indices[l][1], indices[l][2]);
        let newTriangles = data.trianglePoints;
        triangleVertexList = triangleVertexList.concat(newTriangles);
        let newNormals = data.triangleNormals;
        vertexNormalList = vertexNormalList.concat(newNormals);
    }
    postMessage(new MCWorkerAnswer(workerID, triangleVertexList, vertexNormalList));
}
