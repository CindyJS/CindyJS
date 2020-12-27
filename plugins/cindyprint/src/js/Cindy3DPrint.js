/**
 * This plugin supports creating meshes for 3D-printing either by
 * merging polygonal representations of all objects in the scene using
 * constructive solid geometry (CSG) or constructing a tube mesh from
 * a closed line loop.
 * For class definitions, see Cindy3DPrintData.js.
 */

CindyJS.registerPlugin(1, "Cindy3DPrint", function (api) {
    //////////////////////////////////////////////////////////////////////
    // API bindings

    /** @type {CindyJS.anyval} */
    let nada = api.nada;

    /** @type {function(CindyJS.anyval):CindyJS.anyval} */
    let evaluate = api.evaluate;

    /** @type {function(string,number,CindyJS.op)} */
    let defOp = api.defineFunction;

    /** @type {function(string)} */
    let evokeCS = api.instance.evokeCS;

    //////////////////////////////////////////////////////////////////////
    // Modifier handling

    /**
     * @param {Object} modifs
     * @param {Object} handlers
     */
    function handleModifs(modifs, handlers) {
        let key, handler;
        for (key in modifs) {
            handler = handlers[key];
            if (handler) handler(evaluate(modifs[key]));
            else console.log("Modifier " + key + " not supported");
        }
    }

    //////////////////////////////////////////////////////////////////////
    // Print data

    /** @type {SphereData[]} */
    let spheres = [];
    /** @type {CylinderData[]} */
    let cylinders = [];
    /** @type {TriangleData[]} */
    let triangles = [];

    /**
     * Reads the instance data from Cindy3D to create a triangle mesh for printing.
     * @param {object} currentInstance The Cindy3D instance.
     */
    function createDataFromCindy3DInstance(currentInstance) {
        spheres = [];
        cylinders = [];
        triangles = [];

        for (
            let sphereIndex = 0;
            sphereIndex < currentInstance.spheres.count && printUiSettings.exportSpheres;
            sphereIndex++
        ) {
            let dataAttribsOffset = sphereIndex * currentInstance.spheres.itemLength;
            let x = currentInstance.spheres.dataAttribs[dataAttribsOffset + 0];
            let y = currentInstance.spheres.dataAttribs[dataAttribsOffset + 1];
            let z = currentInstance.spheres.dataAttribs[dataAttribsOffset + 2];
            let w = currentInstance.spheres.dataAttribs[dataAttribsOffset + 3];
            let radius = currentInstance.spheres.dataAttribs[dataAttribsOffset + 11];
            spheres.push(new SphereData([x / w, y / w, z / w], radius));
        }

        for (
            let cylinderIndex = 0;
            cylinderIndex < currentInstance.cylinders.count && printUiSettings.exportCylinders;
            cylinderIndex++
        ) {
            let dataAttribsOffset = cylinderIndex * currentInstance.cylinders.itemLength;
            let x1 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 0];
            let y1 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 1];
            let z1 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 2];
            let w1 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 3];
            let x2 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 4];
            let y2 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 5];
            let z2 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 6];
            let w2 = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 7];
            let radius = currentInstance.cylinders.dataAttribs[dataAttribsOffset + 15];
            cylinders.push(new CylinderData([x1 / w1, y1 / w1, z1 / w1], [x2 / w2, y2 / w2, z2 / w2], radius));
        }

        // Three consecutive vertices form one triangle.
        let vertexList = [];

        for (
            let triangleIndex = 0;
            triangleIndex < currentInstance.triangles.count && printUiSettings.exportTriangles;
            triangleIndex++
        ) {
            let dataAttribsOffset = triangleIndex * currentInstance.triangles.itemLength;
            for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
                let vertexOffset =
                    dataAttribsOffset +
                    (vertexIndex * currentInstance.triangles.itemLength) / currentInstance.triangles.numElements;
                let x = currentInstance.triangles.dataAttribs[vertexOffset + 0];
                let y = currentInstance.triangles.dataAttribs[vertexOffset + 1];
                let z = currentInstance.triangles.dataAttribs[vertexOffset + 2];
                let w = currentInstance.triangles.dataAttribs[vertexOffset + 3];
                vertexList.push([x / w, y / w, z / w]);
            }
        }
        if (vertexList.length > 0) {
            triangles.push(new TriangleData(vertexList));
        }
    }

    /**
     * Generates a triangle mesh from Cindy3D instance data (spheres, cylinders, triangles).
     * @param {string} instanceName The Cindy3D instance name to use for exporting.
     * @param {function(TriangleMesh)} meshCreationHandler Called when the generated triangle mesh is ready.
     */
    function generateCsgMesh(instanceName, meshCreationHandler) {
        createDataFromCindy3DInstance(CindyJS._pluginRegistry.Cindy3D.instances[instanceName]);

        setWaitForMeshGeneration(true);
        if (useWebWorkers) {
            // https://stackoverflow.com/questions/5408406/web-workers-without-a-separate-javascript-file
            let worker = new Worker(getCindyBaseDir() + "CindyPrintWorker.js");
            setMeshCreationWorker(worker);
            worker.onmessage = function (e) {
                let triangleMesh = e.data;
                triangleMesh.__proto__ = TriangleMesh.prototype;
                setMeshCreationWorker(null);
                setPreviewMesh(triangleMesh);
                setWaitForMeshGeneration(false);
                meshCreationHandler(triangleMesh);
            };
            worker.postMessage({
                printUiSettings: printUiSettings,
                command: "generateCsgMesh",
                spheres: spheres,
                cylinders: cylinders,
                triangles: triangles,
            });
        } else {
            let triangleMesh = generateCsgMeshFrom(spheres, cylinders, triangles);
            setPreviewMesh(triangleMesh);
            setWaitForMeshGeneration(false);
            meshCreationHandler(triangleMesh);
        }
    }

    /**
     * Generates and saves a triangle mesh from Cindy3D instance data (spheres, cylinders, triangles).
     * @param {string} filename The filename of the generated triangle mesh.
     * @param {string} instanceName The Cindy3D instance name to use for exporting.
     */
    function saveCsgMesh(filename, instanceName) {
        let triangleMesh = generateCsgMesh(instanceName);
        triangleMesh.saveToFile(filename);
    }

    /**
     * Creates a triangle tube mesh from a list of line points forming a closed path in space.
     * @param {object} tubePointsCindyList The tube center points (as a CindyScript list).
     * @param {number} radius The radius of the tube to be generated.
     * @param {function(TriangleMesh)} meshCreationHandler Called when the triangle mesh of the tube is ready.
     * @param {boolean} tubeClosed Whether the tube is closed or not.
     */
    function generateTubeMeshFromCdyPoints(tubePointsCindyList, radius, tubeClosed, meshCreationHandler) {
        let tubeRadius = radius * printUiSettings.radiusFactor;
        //console.log(printUiSettings.radiusFactor);

        let tubePoints = [];
        for (let i = 0; i < tubePointsCindyList.length; i++) {
            let tubePointCindy = tubePointsCindyList[i];
            tubePoints.push(
                new vec3(
                    tubePointCindy.value[0].value.real,
                    tubePointCindy.value[1].value.real,
                    tubePointCindy.value[2].value.real
                )
            );
        }

        setWaitForMeshGeneration(true);
        createTubeMesh(tubePoints, tubeRadius, tubeClosed, (tubeMesh) => {
            tubeMesh.scale(printUiSettings.modelScale);
            setPreviewMesh(tubeMesh);
            setWaitForMeshGeneration(false);
            meshCreationHandler(tubeMesh);
        });
    }

    /**
     * Computes the union of all objects in the Cindy3D instance to create an output mesh.
     * The union is computed using constructive solid geometry (CSG).
     * Argument #0: Filename of the generated mesh.
     *
     * Modifs:
     * - The instance name is the name of the Cindy3D instance to use.
     */
    defOp("savecsgmesh", 1, function (args, modifs) {
        let filename = api.evaluate(args[0]).value;
        let instanceName = "Cindy3D";
        handleModifs(modifs, {
            instancename: (a) => (instanceName = coerce.toString(a, "Cindy3D")),
        });

        if (getWaitForMeshGeneration() && !useWebWorkers) {
            return nada;
        }
        generateCsgMesh(instanceName, (triangleMesh) => {
            triangleMesh.saveToFile(filename);
        });

        return nada;
    });

    /**
     * Generates the triangle mesh of a tube represented by a list of path line points and a
     * radius and saves it in a file.
     * Argument #0: Filename of the generated mesh.
     * Argument #1: The tube line points.
     * Argument #2: The radius of the tube.
     * Argument #3: A boolean value specifying whether the tube is closed or not.
     */
    defOp("savetubemesh", 4, function (args, modifs) {
        let filename = api.evaluate(args[0]).value;
        let tubePointsCindyList = api.evaluate(args[1]).value;
        let radius = api.evaluate(args[2]).value.real;
        let tubeClosed = api.evaluate(args[3]).value;

        if (getWaitForMeshGeneration()) {
            return nada;
        }
        generateTubeMeshFromCdyPoints(tubePointsCindyList, radius, tubeClosed, (tubeMesh) => {
            tubeMesh.saveToFile(filename);
        });

        return nada;
    });

    /**
     * Adds a printing user interface to the bottom of the website.
     * This includes both changing print settings (like the model scale) and a print preview canvas.
     * It is expected that 'savecsgmesh' will be used for generating print models.
     * Argument #0: Filename to use for saving the mesh when the user presses the 'Export mesh' button.
     */
    defOp("addcindy3dprintui", 1, function (args, modifs) {
        let meshFilename = api.evaluate(args[0]).value;

        // Strings to be found in PrintSettings.js.
        document.body.insertAdjacentHTML("beforeend", uiStringStyle + uiStringCindy3D(meshFilename));

        if (!isPrintPreviewCanvasInitialized) {
            initPrintPreviewCanvas();
        }

        return nada;
    });

    /**
     * Adds a printing user interface to the bottom of the website.
     * This includes both changing print settings (like the model scale) and a print preview canvas.
     * It is expected that 'savetubemesh' will be used for generating print models.
     * Argument #0: Filename to use for saving the mesh when the user presses the 'Export mesh' button.
     * Argument #1: A function that expects the number of tube points to generate as an argument, and
     * returns the tube points.
     * Argument #2: A string encoding the number of tube points to generate.
     * Argument #3: A string encoding the radius of the tube.
     * Argument #4: A boolean value specifying whether the tube is closed or not.
     * The last two numbers are passed as strings and not as variable values, as this way arbitrary computations
     * for the number of points can be used that are variable and dependent on the program state.
     */
    defOp("addcindy3dprintuitubes", 5, function (args, modifs) {
        let meshFilename = api.evaluate(args[0]).value;
        let computeTubePointsFunctionName = args[1].name;
        let numTubePointsString = api.evaluate(args[2]).value;
        let radiusString = api.evaluate(args[3]).value;
        let tubeClosed = api.evaluate(args[4]).value;

        // Strings to be found in PrintSettings.js.
        document.body.insertAdjacentHTML(
            "beforeend",
            uiStringStyle +
                uiStringTubes(
                    meshFilename,
                    computeTubePointsFunctionName,
                    numTubePointsString,
                    radiusString,
                    tubeClosed
                )
        );

        if (!isPrintPreviewCanvasInitialized) {
            initPrintPreviewCanvas();
        }

        return nada;
    });

    /**
     * Renders the content of the print preview canvas using the last generated mesh.
     * For more details see: PrintPreview.js
     * NOTE: This should be called after the rendering code of the main Cindy3D instance!
     */
    defOp("drawprintpreview", 0, function (args, modifs) {
        drawPrintPreview(api);
        return nada;
    });

    /**
     * Updates the print preview added by addcindy3dprint by generating a new mesh using the objects
     * stored in the main Cindy3D instance.
     *
     * Modifs:
     * - The instance name is the name of the Cindy3D instance to use.
     */
    defOp("updatepreviewcdy3d", 0, function (args, modifs) {
        let instanceName = "Cindy3D";
        handleModifs(modifs, {
            instancename: (a) => (instanceName = coerce.toString(a, "Cindy3D")),
        });

        if (getWaitForMeshGeneration() && !useWebWorkers) {
            return nada;
        }
        generateCsgMesh(instanceName, (triangleMesh) => {});
        return nada;
    });

    /**
     * The function updates the print preview added by addcindy3dprintuitubes.
     * It computes the triangle mesh of a tube represented by a list of path line points and a radius.
     * Argument #0: The tube line points.
     * Argument #1: The radius of the tube.
     * Argument #2: A boolean value specifying whether the tube is closed or not.
     */
    defOp("updatepreviewtubes", 3, function (args, modifs) {
        let tubePointsCindyList = api.evaluate(args[0]).value;
        let radius = api.evaluate(args[1]).value.real;
        let tubeClosed = api.evaluate(args[2]).value;

        if (getWaitForMeshGeneration()) {
            return nada;
        }
        generateTubeMeshFromCdyPoints(tubePointsCindyList, radius, tubeClosed, (triangleMesh) => {});
        return nada;
    });
});
