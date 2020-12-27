/**
 * The plugin supports creating meshes for 3D-printing by creating iso surfaces for a scalar field.
 */

CindyJS.registerPlugin(1, "CindyGLPrint", function (api) {
    //////////////////////////////////////////////////////////////////////
    // API bindings

    /** @type {CindyJS.anyval} */
    let nada = api.nada;

    /** @type {function(CindyJS.anyval):CindyJS.anyval} */
    let evaluate = api.evaluate;

    /** @type {function(string,number,CindyJS.op)} */
    let defOp = api.defineFunction;

    //////////////////////////////////////////////////////////////////////
    // Mesh from iso surfaces
    /**
     * Creates the iso surface of a scalar field as a triangle mesh.
     * @param {string} filename The filename of the triangle mesh file.
     * @param {object} Three-dimensional CindyJS scalar field function R^3 -> R.
     * @param {object} Three-dimensional CindyJS gradient function R^3 -> R^3 of the scalar field.
     * @param {number} isoLevel The iso level (usually 0).
     * @param {vec3} origin The origin of the cartesian grid used for iso surface construction.
     * @param {number} nx The number of vertices in x, y and z direction (nx = ny = nz).
     * @param {number} dx The cell width in x, y, and z direction (Cartesian grid: dx = dy = dz).
     * @param {number} radius The radius of the iso mesh to extract.
     * @return {TriangleMesh} The triangle mesh generated.
     * @param {function(TriangleMesh)} meshCreationHandler Called when the triangle mesh of the iso surface is ready.
     */
    function generateIsoMesh(
        scalarFunctionCindyScript,
        gradientFunctionCindyScript,
        isoLevel,
        origin,
        nx,
        dx,
        radius,
        meshCreationHandler
    ) {
        // Wrapper for the CindyScript function.
        let scalarFunction = function (v) {
            let functor = {
                ctype: "function",
                oper: scalarFunctionCindyScript.name.toLowerCase() + "$1",
                args: [
                    {
                        ctype: "function",
                        oper: "genList",
                        modifs: {},
                        args: [
                            { ctype: "number", value: { real: v.x, imag: 0 } },
                            { ctype: "number", value: { real: v.y, imag: 0 } },
                            { ctype: "number", value: { real: v.z, imag: 0 } },
                        ],
                    },
                ],
                modifs: {},
            };
            return api.evaluate(functor).value.real;
        };
        let gradientFunction = function (v) {
            let functor = {
                ctype: "function",
                oper: gradientFunctionCindyScript.name.toLowerCase() + "$1",
                args: [
                    {
                        ctype: "function",
                        oper: "genList",
                        modifs: {},
                        args: [
                            { ctype: "number", value: { real: v.x, imag: 0 } },
                            { ctype: "number", value: { real: v.y, imag: 0 } },
                            { ctype: "number", value: { real: v.z, imag: 0 } },
                        ],
                    },
                ],
                modifs: {},
            };
            let cindyvec = api.evaluate(functor).value;
            return new vec3(cindyvec[0].value.real, cindyvec[1].value.real, cindyvec[2].value.real);
        };

        setWaitForMeshGeneration(true);
        generateIsoMeshFromScalarFunction(
            origin,
            dx,
            nx,
            scalarFunction,
            gradientFunction,
            isoLevel,
            (triangleMesh) => {
                // Sphere clipping is used in the CindyGL example apps, thus maybe the user also wants it for the export.
                if (printUiSettings.clipToSphere) {
                    // Higher quality as usual, as the sphere is large.
                    setCsgResolutionSphere(2 * printUiSettings.sphereQuality);
                    let csgObject = convertTriangleMeshToCSGPolyhedron(triangleMesh);
                    let csgSphere = createCSGSphere([origin.x + radius, origin.y + radius, origin.z + radius], radius);
                    triangleMesh = intersectObjects([csgObject, csgSphere]);
                }

                triangleMesh.scale(printUiSettings.modelScale);
                setPreviewMesh(triangleMesh);
                setWaitForMeshGeneration(false);
                meshCreationHandler(triangleMesh);
            }
        );
    }

    /**
     * Saves the iso mesh to a file.
     * @param {string} filename The filename of the triangle mesh file.
     * @param {object} Three-dimensional CindyJS scalar field function R^3 -> R.
     * @param {object} Three-dimensional CindyJS gradient function R^3 -> R^3 of the scalar field.
     * @param {number} isoLevel The iso level (usually 0).
     * @param {vec3} origin The origin of the cartesian grid used for iso surface construction.
     * @param {number} nx The number of vertices in x, y and z direction (nx = ny = nz).
     * @param {number} dx The cell width in x, y, and z direction (Cartesian grid: dx = dy = dz).
     * @param {number} radius The radius of the iso mesh to extract.
     */
    function saveIsoMeshToFile(
        filename,
        scalarFunctionCindyScript,
        gradientFunctionCindyScript,
        isoLevel,
        origin,
        nx,
        dx,
        radius
    ) {
        generateIsoMesh(
            scalarFunctionCindyScript,
            gradientFunctionCindyScript,
            isoLevel,
            origin,
            nx,
            dx,
            radius,
            (triangleMesh) => {
                triangleMesh.saveToFile(filename);
            }
        );
    }

    /**
     * Creates the iso surface of a scalar field and saves it in a file as a triangle mesh.
     * Argument #0: Filename to use for saving the mesh.
     * Argument #1: Variable: Three-dimensional scalar field function R^3 -> float.
     * Argument #2: Variable: Gradient function of the scalar function above, i.e. R^3 -> R^3.
     * Argument #3: The iso value of the iso surface to construct.
     * Argument #4: The origin of the Cartesian grid to use for creating the iso mesh.
     * Argument #5: The cell width in x, y, and z direction (Cartesian grid: dx = dy = dz).
     * Argument #6: The number of vertices in x, y and z direction (nx = ny = nz).
     * NOTE: The number of vertices is one more than the number of cells!
     * E.g. call: saveisomeshtofile("model.stl", F, dF, 0, [-5,-5,-5], 0.01, 1001);
     */
    defOp("saveisomeshtofile", 7, function (args, modifs) {
        let filename = api.evaluate(args[0]).value;
        let scalarFunctionCindyScript = args[1];
        let gradientFunctionCindyScript = args[2];
        let isoLevel = api.evaluate(args[3]).value.real;
        let origin = cindyscriptToVec3(api.evaluate(args[4]));
        let dx = api.evaluate(args[5]).value.real;
        let nx = api.evaluate(args[6]).value.real;
        let radius = (dx * (nx - 1)) / 2;

        if (getWaitForMeshGeneration() && !useWebWorkers) {
            return nada;
        }
        saveIsoMeshToFile(
            filename,
            scalarFunctionCindyScript,
            gradientFunctionCindyScript,
            isoLevel,
            origin,
            nx,
            dx,
            radius
        );
        return nada;
    });
    /**
     *A second version of the command assuming a Cartesian grid centered at (0,0,0) and standard
     * values for the other arguments. The grid resolution is loaded from PrintUiSettings.
     * Creates the iso surface of a scalar field and saves it in a file as a triangle mesh.
     * Argument #0: Filename to use for saving the mesh.
     * Argument #1: Variable: Three-dimensional scalar field function R^3 -> float.
     * Argument #2: Variable: Gradient function of the scalar function above, i.e. R^3 -> R^3.
     * Argument #3: The iso value of the iso surface to construct.
     * Argument #4: The radius of the iso mesh to extract (inside of a sphere at the origin).
     * E.g. call: saveisomeshtofile("model.stl", F, dF, 0, 1/zoom);
     */
    defOp("saveisomeshtofile", 5, function (args, modifs) {
        let filename = api.evaluate(args[0]).value;
        let scalarFunctionCindyScript = args[1];
        let gradientFunctionCindyScript = args[2];
        let isoLevel = api.evaluate(args[3]).value.real;
        let radius = api.evaluate(args[4]).value.real;
        let origin = new vec3(-radius, -radius, -radius);
        let nx = printUiSettings.gridResolution + 1;
        let dx = (2 * radius) / printUiSettings.gridResolution;

        if (getWaitForMeshGeneration() && !useWebWorkers) {
            return nada;
        }
        saveIsoMeshToFile(
            filename,
            scalarFunctionCindyScript,
            gradientFunctionCindyScript,
            isoLevel,
            origin,
            nx,
            dx,
            radius
        );
        return nada;
    });

    /**
     * Adds a printing user interface to the bottom of the website.
     * This includes both changing print settings (like the model scale) and a print preview canvas.
     * It is expected that 'saveisomeshtofile' will be used for generating print models.
     * Argument #0: Filename to use for saving the mesh when the user presses the 'Save mesh' button.
     * Argument #1: Arguments to use for 'updatepreviewcdygl' and 'saveisomeshtofile' when
     * the user presses the 'Save mesh' or 'Update preview' buttons. This needs to be a string, as
     * this way, the arguments can also contain a variable expression like '1/zoom' that can't be
     * precomputed.
     */
    defOp("addcindyglprintui", 2, function (args, modifs) {
        // Strings to be found in PrintSettings.js.
        let meshFilename = api.evaluate(args[0]).value;
        let updatepreviewcdyglArguments = api.evaluate(args[1]).value;
        document.body.insertAdjacentHTML(
            "beforeend",
            uiStringStyle + uiStringCindyGL(meshFilename, updatepreviewcdyglArguments)
        );

        if (!isPrintPreviewCanvasInitialized) {
            initPrintPreviewCanvas();
        }

        return nada;
    });

    /**
     * Renders the content of the print preview canvas using the last generated mesh.
     * For more details see: PrintPreview.js
     */
    defOp("drawprintpreview", 0, function (args, modifs) {
        drawPrintPreview(api, previewMesh);
        return nada;
    });

    /**
     * Updates the print preview by generating a new mesh using @see generateIsoMesh.
     * For more details, please see the description of the arguments of @see saveisomeshtofile with 5 arguments.
     */
    defOp("updatepreviewcdygl", 4, function (args, modifs) {
        let scalarFunctionCindyScript = args[0];
        let gradientFunctionCindyScript = args[1];
        let isoLevel = api.evaluate(args[2]).value.real;
        let radius = api.evaluate(args[3]).value.real;
        let origin = new vec3(-radius, -radius, -radius);
        let nx = printUiSettings.gridResolution + 1;
        let dx = (2 * radius) / printUiSettings.gridResolution;

        if (getWaitForMeshGeneration() && !useWebWorkers) {
            return nada;
        }
        generateIsoMesh(
            scalarFunctionCindyScript,
            gradientFunctionCindyScript,
            isoLevel,
            origin,
            nx,
            dx,
            radius,
            () => {}
        );
        return nada;
    });

    /**
     * Updates the print preview by generating a new mesh using @see generateIsoMesh.
     * For more details, please see the description of the arguments of @see saveisomeshtofile with 7 arguments.
     */
    defOp("updatepreviewcdygl", 6, function (args, modifs) {
        let scalarFunctionCindyScript = args[0];
        let gradientFunctionCindyScript = args[1];
        let isoLevel = api.evaluate(args[2]).value.real;
        let origin = cindyscriptToVec3(api.evaluate(args[3]));
        let dx = api.evaluate(args[4]).value.real;
        let nx = api.evaluate(args[5]).value.real;
        let radius = (dx * (nx - 1)) / 2;

        if (getWaitForMeshGeneration() && !useWebWorkers) {
            return nada;
        }
        generateIsoMesh(
            scalarFunctionCindyScript,
            gradientFunctionCindyScript,
            isoLevel,
            origin,
            nx,
            dx,
            radius,
            () => {}
        );
        return nada;
    });
});
