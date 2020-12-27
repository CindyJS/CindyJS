/**
 * @file IsoSurface.js
 * This file uses one of the algorithms in the same directory for iso surface computation for a scalar field.
 */

/**
 * Generates an iso surface mesh for the passed scalar field function.
 * @param {number[]} domainAABB The axis-aligned bounding box of the domain.
 * @param {number} isoLevel The Iso-value of the iso surface to construct.
 * @param {function(vec3):number} scalarFunction A three-dimensional scalar field function vec3 -> number.
 * @param {function(vec3):vec3} gradientFunction The three-dimensional gradient function vec3 -> vec3
 * of the scalar field function above.
 * @param {function(TriangleMesh)} meshCreationHandler Called when the triangle mesh of the iso surface is ready.
 */
function generateIsoMeshFromScalarFunction(
    origin,
    dx,
    nx,
    scalarFunction,
    gradientFunction,
    isoLevel,
    meshCreationHandler
) {
    let cartesianGrid = constructCartesianGridScalarField(origin, dx, nx, scalarFunction, gradientFunction);

    if (useWebWorkers) {
        // https://stackoverflow.com/questions/5408406/web-workers-without-a-separate-javascript-file
        let worker = new Worker(getCindyBaseDir() + "CindyPrintWorker.js");
        setMeshCreationWorker(worker);
        worker.onmessage = function (e) {
            let triangleMesh = e.data;
            triangleMesh.__proto__ = TriangleMesh.prototype;
            setMeshCreationWorker(null);
            meshCreationHandler(triangleMesh);
        };
        worker.postMessage({
            printUiSettings: printUiSettings,
            command: "generateIsoMeshFromScalarFunction",
            baseDir: getCindyBaseDir(),
            cartesianGrid: cartesianGrid,
            isoLevel: isoLevel,
        });
    } else {
        generateIsoMeshFromGrid(
            cartesianGrid.gridPoints,
            cartesianGrid.gridValues,
            cartesianGrid.gridNormals,
            isoLevel,
            (triangleVertexList, vertexNormalList) => {
                let triangleMesh = trianglePointsToIndexedMesh(triangleVertexList, vertexNormalList, 0.000001);
                if (printUiSettings.extrudeSurfaces) {
                    if (printUiSettings.smoothEdges) {
                        triangleMesh = createOpenSurfaceShellMeshWithNormalsAndRoundEdges(
                            triangleMesh,
                            printUiSettings.extrusionRadius
                        );
                    } else {
                        triangleMesh = createOpenSurfaceShellMeshWithNormals(
                            triangleMesh,
                            printUiSettings.extrusionRadius
                        );
                    }
                }
                meshCreationHandler(triangleMesh);
            }
        );
    }
}

/**
 * Generates an iso surface mesh for the passed scalar field function.
 * @param {number[]} domainAABB The axis-aligned bounding box of the domain.
 * @param {number} isoLevel The Iso-value of the iso surface to construct.
 * @param {function(vec3):number} scalarFunction A three-dimensional scalar field function vec3 -> Number.
 * generating a scalar field.
 * @return {TriangleMesh} The triangle mesh of the iso surface.
 */
function generateClosedIsoMeshFromScalarFunction(origin, dx, nx, scalarFunction, isoLevel) {
    let cartesianGrid = constructCartesianGridScalarField(origin, dx, nx, scalarFunction);
    let triangleMesh = generateIsoMeshFromGrid(
        cartesianGrid.gridPoints,
        cartesianGrid.gridValues,
        cartesianGrid.gridNormals,
        isoLevel
    );
    return triangleMesh;
}

/**
 * Constructs a cartesian grid from a scalar field in 3D.
 * @param {number[]} origin Origin of the cartesian grid.
 * @param {number} dx Distance between two vertices in x direction (assuming dx = dy = dz).
 * @param {number} nx The number of vertices in x direction (assuming nx = ny = nz).
 * @param {function(vec3):number} scalarFunction A three-dimensional scalar field function vec3 -> number.
 * @param {function(vec3):vec3} gradientFunction The three-dimensional gradient function vec3 -> vec3
 * of the scalar field function above.
 * @return {Object} An object storing "gridPoints" (a 3D array of 3D grid points), "gridValues"
 * (a 3D array of 1D grid values) and "gridNormals" (a 3D array of 3D unit length normals).
 */
function constructCartesianGridScalarField(origin, dx, nx, scalarFunction, gradientFunction) {
    // The 3D grid points
    let gridPoints = [];
    // 1D scalar values at the grid points
    let gridValues = [];
    // 3D normal vectors at the grid points
    let gridNormals = [];
    for (let i = 0; i < nx; i++) {
        let pointPlane = [];
        let valuePlane = [];
        let normalPlane = [];
        for (let j = 0; j < nx; j++) {
            let pointRow = [];
            let valueRow = [];
            let normalRow = [];
            for (let k = 0; k < nx; k++) {
                let x = origin.x + k * dx;
                let y = origin.y + j * dx;
                let z = origin.z + i * dx;
                let point = new vec3(x, y, z);
                pointRow.push(point);
                valueRow.push(scalarFunction(point));
                normalRow.push(gradientFunction(point));
            }
            pointPlane.push(pointRow);
            valuePlane.push(valueRow);
            normalPlane.push(normalRow);
        }
        gridPoints.push(pointPlane);
        gridValues.push(valuePlane);
        gridNormals.push(normalPlane);
    }

    return {
        gridPoints: gridPoints,
        gridValues: gridValues,
        gridNormals: gridNormals,
    };
}

/**
 * Constructs a grid with snapped values from an cartesian grid
 * @param {Object} cartesianGrid The original grid. An object storing "gridPoints" (a 3D array of 3D grid points) and "gridValues"
 * (a 3D array of 1D grid values).
 * @param {number} isoLevel The Iso-value of the iso surface to construct.
 * @return {Object} An object storing "gridValues"(a 3D array of 1D grid values),
 * "snapBackTo" (a 3D array of 3D grid indices) and "weights" (a 3D array of 1D weights to snap vertices back)
 */
function constructCartesianSnapGridScalarField(cartesianGrid, isoLevel) {
    let snapGrid = {
        gridValues: [],
        snapBackTo: [],
        snapBackToNormals: [],
        weights: [],
    };
    snapGrid.gridValues = deepCopy(cartesianGrid.gridValues);

    //go over all vertices of the grid
    //(just not the last ones in the respective direction since we want to got over the edges)
    for (let i = 0; i < cartesianGrid.gridPoints.length - 1; i++) {
        for (let j = 0; j < cartesianGrid.gridPoints[0].length - 1; j++) {
            for (let k = 0; k < cartesianGrid.gridPoints[0][0].length - 1; k++) {
                snapAtEdge(cartesianGrid, snapGrid, isoLevel, i, j, k, i + 1, j, k);
                snapAtEdge(cartesianGrid, snapGrid, isoLevel, i, j, k, i, j + 1, k);
                snapAtEdge(cartesianGrid, snapGrid, isoLevel, i, j, k, i, j, k + 1);
            }
        }
    }
    return snapGrid;
}
/**
 * See https://medium.com/@ziyoshams/deep-copying-javascript-arrays-4d5fc45a6e3e
 * set up a function that iterates through a given array
 * if one of the elements is an array, call itself with that element
 * (Edited)
 * if elements of the array is an object, we make sure to take care of that too.
 */
const deepCopy = (arr) => {
    let copy = [];
    arr.forEach((elem) => {
        if (Array.isArray(elem)) {
            copy.push(deepCopy(elem));
        } else {
            if (typeof elem === "object") {
                copy.push(deepCopyObject(elem));
            } else {
                copy.push(elem);
            }
        }
    });
    return copy;
};
// Helper function to deal with Objects
const deepCopyObject = (obj) => {
    let tempObj = {};
    for (let [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            tempObj[key] = deepCopy(value);
        } else {
            if (typeof value === "object") {
                tempObj[key] = deepCopyObject(value);
            } else {
                tempObj[key] = value;
            }
        }
    }
    return tempObj;
};

/**
 * Snaps the isoLevel value at an edge to one of the vertices if the isosurface is near enough to one of them
 * @param {Object} cartesianGrid The original grid. An object storing "gridPoints" (a 3D array of 3D grid points) and "gridValues"
 * (a 3D array of 1D grid values).
 * @param {Object} snapGrid The grid where the snaps are happening. An object storing "gridValues"(a 3D array of 1D grid values),
 * "snapBackTo" (a 3D array of 3D grid indices) and "weights" (a 3D array of 1D weights to snap vertices back)
 * @param {number} isoLevel The Iso-value of the iso surface to construct.
 * @param {number} i0 The first index of the the first vertex of the edge
 * @param {number} j0 The second index of the the first vertex of the edge
 * @param {number} k0 The third index of the the first vertex of the edge
 * @param {number} i1 The first index of the the second vertex of the edge
 * @param {number} j1 The second index of the the second vertex of the edge
 * @param {number} k1 The third index of the the second vertex of the edge
 */
function snapAtEdge(cartesianGrid, snapGrid, isoLevel, i0, j0, k0, i1, j1, k1) {
    let epsilon = 0.00001;
    let gamma = printUiSettings.gamma;

    //weight or distance
    let weight0 = gamma;
    let weight1 = gamma;

    //if this is a +/- edge
    if (
        (cartesianGrid.gridValues[i0][j0][k0] < isoLevel && cartesianGrid.gridValues[i1][j1][k1] > isoLevel) ||
        (cartesianGrid.gridValues[i0][j0][k0] > isoLevel && cartesianGrid.gridValues[i1][j1][k1] < isoLevel)
    ) {
        let value_difference = cartesianGrid.gridValues[i1][j1][k1] - cartesianGrid.gridValues[i0][j0][k0];

        if (value_difference > epsilon || value_difference < -epsilon) {
            weight0 = (cartesianGrid.gridValues[i1][j1][k1] - isoLevel) / value_difference;
            weight1 = (isoLevel - cartesianGrid.gridValues[i0][j0][k0]) / value_difference;
        } else {
            weight0 = 0.5;
            weight1 = 0.5;
        }
    }
    if (weight1 < gamma) {
        //snap to vertex i0,j0,k0
        snapToVertex(
            snapGrid,
            cartesianGrid.gridPoints,
            cartesianGrid.gridNormals,
            isoLevel,
            weight1,
            i0,
            j0,
            k0,
            i1,
            j1,
            k1
        );
    } else if (weight0 < gamma) {
        //snap to vertex i1,j1,k1
        snapToVertex(
            snapGrid,
            cartesianGrid.gridPoints,
            cartesianGrid.gridNormals,
            isoLevel,
            weight0,
            i1,
            j1,
            k1,
            i0,
            j0,
            k0
        );
    }
}

/**
 * Snaps the isoLevel value to the first given vertex of the edge, if the isoLevel has not been already
 * snaped to that vertex. If the isoSurface value on this edge lies nearer than the already snapped value of
 * another edge, the snapBackTo vertex is set to the second vertex given as well as the snapBackToNormal is
 * set to the normal of the second vertex. If the isoSurface value lies exactlyat the same distance as at the
 * already snapped value, the snapBackTo vertex is set to the vertex with the lowest overall index.
 * @param {Object} snapGrid The grid where the snaps are happening. An object storing "gridValues"(a 3D array of 1D grid values),
 * "snapBackTo" (a 3D array of 3D grid indices) and "weights" (a 3D array of 1D weights to snap vertices back)
 * @param {vec3[][][]} gridPoints A three-dimensional array of three-dimensional grid points.
 * @param {vec3[][][]} gridNormals A three-dimensional array of normals at the grid points.
 * @param {number} isoLevel The Iso-value of the iso surface to construct.
 * @param {number} weight The ratio to which the original point is between the first vertex and the second vertex
 * @param {number} i0 The first index of the the first vertex of the edge
 * @param {number} j0 The second index of the the first vertex of the edge
 * @param {number} k0 The third index of the the first vertex of the edge
 * @param {number} i1 The first index of the the second vertex of the edge
 * @param {number} j1 The second index of the the second vertex of the edge
 * @param {number} k1 The third index of the the second vertex of the edge
 */
function snapToVertex(snapGrid, gridPoints, gridNormals, isoLevel, weight, i0, j0, k0, i1, j1, k1) {
    //if no snap happend to the first vertex already
    if (snapGrid.gridValues[i0][j0][k0] != isoLevel) {
        snapGrid.gridValues[i0][j0][k0] = isoLevel;

        createArrayIfNecessary(snapGrid.snapBackTo, i0, j0);
        createArrayIfNecessary(snapGrid.snapBackToNormals, i0, j0);
        createArrayIfNecessary(snapGrid.weights, i0, j0);

        snapGrid.snapBackTo[i0][j0][k0] = gridPoints[i1][j1][k1];
        snapGrid.snapBackToNormals[i0][j0][k0] = gridNormals[i1][j1][k1];
        snapGrid.weights[i0][j0][k0] = weight;
    }
    //if the isoSurface value on the already snapped edge is further away than on the current one
    else if (
        snapGrid.weights[i0] != undefined &&
        snapGrid.weights[i0][j0] != undefined &&
        snapGrid.weights[i0][j0][k0] != undefined &&
        snapGrid.weights[i0][j0][k0] > weight
    ) {
        snapGrid.snapBackTo[i0][j0][k0] = gridPoints[i1][j1][k1];
        snapGrid.snapBackToNormals[i0][j0][k0] = gridNormals[i1][j1][k1];
        snapGrid.weights[i0][j0][k0] = weight;
    }
}

/**
 * Adds a two or one dimension array to an array, so it can be called
 * on a 3-Dimensional index at this position.
 * @param {any[]} array The array to add arrays to
 * @param {number} i The first index
 * @param {number} j The second index
 */
function createArrayIfNecessary(array, i, j) {
    if (array[i] == undefined) {
        array[i] = [];
        array[i][j] = [];
    } else if (array[i][j] == undefined) {
        array[i][j] = [];
    }
}

/**
 * A grid cell with eight edge vertices (the array "v") and eight edge values (the "f" array).
 */
function GridCell() {
    /** @type {vec3[]} */
    this.v = [];
    /** @type {number[]} */
    this.f = [];
    /** @type {vec3[]} */
    this.n = [];

    for (let i = 0; i < 8; i++) {
        this.v.push(new vec3(0, 0, 0));
        this.f.push(0);
        this.n.push(new vec3(0, 0, 0));
    }
}

/**
 * Linearly interpolates between p0 and p1 using the values of f0, f1 and the iso-level.
 * For more information see: http://paulbourke.net/geometry/polygonise/
 * @param {number} isoLevel The Iso-value of the iso surface to polygonize.
 * @param {vec3} p0 The first point to interpolate.
 * @param {vec3} p1 The second point to interpolate.
 * @param {number} f0 The scalar value of the first point.
 * @param {number} f1 The scalar value of the second point.
 * @return {vec3} The interpolated point.
 */
function vertexInterpIso(isoLevel, p0, p1, f0, f1) {
    if (Math.abs(isoLevel - f0) < 0.00001) return p0;
    if (Math.abs(isoLevel - f1) < 0.00001) return p1;
    if (Math.abs(f0 - f1) < 0.00001) return p0;

    let mu = (isoLevel - f0) / (f1 - f0);
    let p = new vec3(0, 0, 0);
    p.x = p0.x + mu * (p1.x - p0.x);
    p.y = p0.y + mu * (p1.y - p0.y);
    p.z = p0.z + mu * (p1.z - p0.z);

    return p;
}

/**
 * Linearly interpolates between p0 and p1 using the values of f0, f1 and the iso-level.
 * For more information see: http://paulbourke.net/geometry/polygonise/
 * @param {number} isoLevel The Iso-value of the iso surface to polygonize.
 * @param {vec3} p0 The first point to interpolate.
 * @param {vec3} p1 The second point to interpolate.
 * @param {number} f0 The scalar value of the first point.
 * @param {number} f1 The scalar value of the second point.
 * @return {vec3} The interpolated normal.
 */
function normalInterpIso(isoLevel, p0, p1, f0, f1) {
    let p = vertexInterpIso(isoLevel, p0, p1, f0, f1);
    return vec3normalize(p);
}

/**
 * Generates an iso surface mesh for the passed scalar field grid.
 * @param {vec3[][][]} gridPoints A three-dimensional array of three-dimensional grid points.
 * @param {number[][][]} gridValues A three-dimensional array of one-dimensional grid scalar values.
 * @param {vec3[][][]} gridNormals A three-dimensional array of normals at the grid points.
 * @param {number} isoLevel The iso level of the iso surface to extract from the grid cells.
 * @param {function(vec3[], vec3[])} trianglePointsCallback Called when the triangle of the iso surface
 * are generated.
 */
async function generateIsoMeshFromGrid(gridPoints, gridValues, gridNormals, isoLevel, trianglePointsCallback) {
    let nx = gridPoints.length;

    //TODO
    if (useWebWorkers) {
        let numWorkers = self.navigator.hardwareConcurrency || 4;
        if (numWorkers > 1) {
            generateIsoMeshFromGridParallel(
                gridPoints,
                gridValues,
                gridNormals,
                isoLevel,
                numWorkers,
                trianglePointsCallback
            );
            return;
        }
    }

    let snapGrid;

    //if SnapMC is selected, create snapped Grid
    if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
        let cartesianGrid = {
            gridPoints: gridPoints,
            gridValues: gridValues,
            gridNormals: gridNormals,
        };
        snapGrid = constructCartesianSnapGridScalarField(cartesianGrid, isoLevel);
    }

    let gridCell = new GridCell();
    let triangleVertexList = [];
    let vertexNormalList = [];

    // Iterate over all grid cells
    for (let i = 0; i < nx - 1; i++) {
        for (let j = 0; j < nx - 1; j++) {
            for (let k = 0; k < nx - 1; k++) {
                for (let l = 0; l < 8; l++) {
                    let gridIndex = new vec3(k, j, i);
                    //For vertex indices see {@link isoTable}
                    if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
                        if (l == 1 || l == 3 || l == 5 || l == 7) {
                            gridIndex.x += 1;
                        }
                        if (l == 2 || l == 3 || l == 6 || l == 7) {
                            gridIndex.y += 1;
                        }
                        if (l == 4 || l == 5 || l == 6 || l == 7) {
                            gridIndex.z += 1;
                        }
                    }
                    // For vertex indices see: http://paulbourke.net/geometry/polygonise/
                    else {
                        if (l == 1 || l == 2 || l == 5 || l == 6) {
                            gridIndex.x += 1;
                        }
                        if (l == 4 || l == 5 || l == 6 || l == 7) {
                            gridIndex.y += 1;
                        }
                        if (l == 2 || l == 3 || l == 6 || l == 7) {
                            gridIndex.z += 1;
                        }
                    }

                    gridCell.v[l] = gridPoints[gridIndex.z][gridIndex.y][gridIndex.x];
                    gridCell.n[l] = gridNormals[gridIndex.z][gridIndex.y][gridIndex.x];

                    //set gridValues of corresponding grid
                    if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
                        gridCell.f[l] = snapGrid.gridValues[gridIndex.z][gridIndex.y][gridIndex.x];
                    } else {
                        gridCell.f[l] = gridValues[gridIndex.z][gridIndex.y][gridIndex.x];
                    }
                }

                let data;

                //pologinize gridcell with corresponding algorithm
                if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
                    data = polygonizeGridCellSnapMC(gridCell, isoLevel, snapGrid, i, j, k);
                } else {
                    data = polygonizeGridCellMarchingCubes(gridCell, isoLevel);
                }

                let newTriangles = data.trianglePoints;
                let newNormals = data.triangleNormals;
                triangleVertexList = triangleVertexList.concat(newTriangles);
                vertexNormalList = vertexNormalList.concat(newNormals);
            }
        }
    }

    trianglePointsCallback(triangleVertexList, vertexNormalList);
}

/**
 * If the worker should quit, gridCells is set to null. Otherwise, it is the array of
 * GridCell objects that should be processed by a worker.
 */
function MCWorkerJob(workerID, gridCells, isoLevel) {
    this.workerID = workerID;
    this.gridCells = gridCells;
    this.isoLevel = isoLevel;
    this.command = "generateIsoMeshFromScalarFunction_PARALLEL";
    this.printUiSettings = self.printUiSettings;
}

/**
 * If the worker should quit, gridCells is set to null. Otherwise, it is the array of
 * GridCell objects that should be processed by a worker.
 */
function MCWorkerJobSnapMC(workerID, gridCells, isoLevel, snapGrid, indices) {
    this.workerID = workerID;
    this.gridCells = gridCells;
    this.isoLevel = isoLevel;
    this.snapGrid = snapGrid;
    this.indices = indices;
    this.command = "generateIsoMeshFromScalarFunctionSnapMC_PARALLEL";
    this.printUiSettings = self.printUiSettings;
}

/**
 * Generates an iso surface mesh for the passed scalar field grid using multiple web workers for
 * parallelizing the task.
 *
 * @param {vec3[][][]} gridPoints A three-dimensional array of three-dimensional grid points.
 * @param {number[][][]} gridValues A three-dimensional array of one-dimensional grid scalar values.
 * @param {vec3[][][]} gridNormals A three-dimensional array of normals at the grid points.
 * @param {number} isoLevel The iso level of the iso surface to extract from the grid cells.
 * @param {number} numWorkers The number of web workers to use for parallelizing the task.
 * @param {function(vec3[])} trianglePointsCallback Called when the triangle of the iso surface are generated.
 */
function generateIsoMeshFromGridParallel(
    gridPoints,
    gridValues,
    gridNormals,
    isoLevel,
    numWorkers,
    trianglePointsCallback
) {
    let nx = gridPoints.length;
    let trianglePoints = [];
    let triangleNormals = [];

    let snapGrid;

    //if SnapMC is selected, create snapped Grid
    if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
        let cartesianGrid = {
            gridPoints: gridPoints,
            gridValues: gridValues,
            gridNormals: gridNormals,
        };
        snapGrid = constructCartesianSnapGridScalarField(cartesianGrid, isoLevel);
    }

    // Dynamic scheduling
    let workers = [];
    let jobs = [];
    // Iterate over all grid cells
    for (let i = 0; i < nx - 1; i++) {
        let gridCellsOfJob = [];
        let indicesOfJob = [];
        for (let j = 0; j < nx - 1; j++) {
            for (let k = 0; k < nx - 1; k++) {
                let gridCell = new GridCell();
                for (let l = 0; l < 8; l++) {
                    let gridIndex = new vec3(k, j, i);
                    //For vertex indices see {@link isoTable}
                    if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
                        if (l == 1 || l == 3 || l == 5 || l == 7) {
                            gridIndex.x += 1;
                        }
                        if (l == 2 || l == 3 || l == 6 || l == 7) {
                            gridIndex.y += 1;
                        }
                        if (l == 4 || l == 5 || l == 6 || l == 7) {
                            gridIndex.z += 1;
                        }
                    } else {
                        // For vertex indices see: http://paulbourke.net/geometry/polygonise/
                        if (l == 1 || l == 2 || l == 5 || l == 6) {
                            gridIndex.x += 1;
                        }
                        if (l == 4 || l == 5 || l == 6 || l == 7) {
                            gridIndex.y += 1;
                        }
                        if (l == 2 || l == 3 || l == 6 || l == 7) {
                            gridIndex.z += 1;
                        }
                    }

                    gridCell.v[l] = gridPoints[gridIndex.z][gridIndex.y][gridIndex.x];
                    gridCell.n[l] = gridNormals[gridIndex.z][gridIndex.y][gridIndex.x];

                    //set gridValues of corresponding grid
                    if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
                        gridCell.f[l] = snapGrid.gridValues[gridIndex.z][gridIndex.y][gridIndex.x];
                    } else {
                        gridCell.f[l] = gridValues[gridIndex.z][gridIndex.y][gridIndex.x];
                    }
                }
                if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
                    indicesOfJob.push([i, j, k]);
                }
                gridCellsOfJob.push(gridCell);
            }
        }
        if (printUiSettings.reconstructionAlgorithm == reconstructionAlgorithms.SNAPMC) {
            jobs.push(new MCWorkerJobSnapMC(-1, gridCellsOfJob, isoLevel, snapGrid, indicesOfJob));
        } else {
            jobs.push(new MCWorkerJob(-1, gridCellsOfJob, isoLevel));
        }
    }
    let numJobsLeftToFinish = jobs.length;

    function workerCallback(e) {
        // Attach the new processed triangle points to the global array.
        let trianglePointsOfJob = e.data.trianglePoints;
        let triangleNormalsOfJob = e.data.triangleNormals;
        for (let i = 0; i < trianglePointsOfJob.length; i++) {
            trianglePointsOfJob[i].__proto__ = vec3.prototype;
        }
        for (let i = 0; i < triangleNormalsOfJob.length; i++) {
            triangleNormalsOfJob[i].__proto__ = vec3.prototype;
        }
        trianglePoints = trianglePoints.concat(trianglePointsOfJob);
        triangleNormals = triangleNormals.concat(triangleNormalsOfJob);

        numJobsLeftToFinish--;
        if (numJobsLeftToFinish == 0) {
            // We have processed all jobs! Call the callback and pass the result.
            for (let i = 0; i < workers.length; i++) {
                workers[i].terminate();
            }
            trianglePointsCallback(trianglePoints, triangleNormals);
        }

        // Start a new job in the now finished web worker.
        if (jobs.length > 0) {
            let workerID = e.data.workerID;
            let job = jobs.pop();
            job.workerID = workerID;
            workers[workerID].postMessage(job);
        }
    }

    // Create the desired number of web workers and give each of them a first job.
    for (let i = 0; i < numWorkers && jobs.length > 0; i++) {
        let job = jobs.pop();
        job.workerID = i;

        let baseDir = "";
        if (self.baseDir) {
            baseDir = self.baseDir;
        } else {
            baseDir = getCindyBaseDir();
        }
        let worker = new Worker(baseDir + "CindyPrintWorker.js");
        worker.onmessage = workerCallback;
        worker.postMessage(job);
        workers.push(worker);
    }
}
