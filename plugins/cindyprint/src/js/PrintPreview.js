
/**
 * This class provides helper functions for creating a Cindy3D instance that can be used for rendering a
 * preview of a triangle mesh that the user wants to download for printing.
 */

/// GLOBAL VARIABLES - data used by the print preview

/** @type {string} The name of the Cindy3D instance to use for rendering the print mesh preview */
let printPreviewInstanceName = "Cindy3DPreview";
/** @type {boolean} */
let isPrintPreviewCanvasInitialized = false;
/** @type {boolean} */
let isPrintPreviewGLInitialized = false;
/** @type {boolean} */
let needsRecreatePreviewRenderData = false;
/** @type {Cindy3D.ShaderProgram} */
let previewShaderProgram = null;
/** @type {WebGLBuffer} */
let previewVertexBuffer = null;
/** @type {Float32Array} */
let previewVertexPositions = null;
/** @type {Float32Array} */
let previewVertexNormals = null;
/** @type {TriangleMesh} */
let previewMesh = null;
/** @type {boolean} */
let waitingForMeshCreation = false;
/** @type {Cindy3D.ShaderProgram} */
let waitSymbolShaderProgram = null;
/** @type {WebGLBuffer} */
let fullscreenQuadVertexBuffer = null;
/** @type {boolean} */
let useWebWorkers = true;
/** @type {Worker} */
let meshCreationWorker = null;


/**
 * Adds a canvas object to the HTML document used for rendering the print preview in an additional Cindy3D instance.
 */
function initPrintPreviewCanvas() {
    let cindyCanvas = document.getElementById('Cindy3D');
    let canvasWidth = 300;
    let canvasHeight = 200;
    if (cindyCanvas) {
        // Case #1: Print canvas for Cindy3D
        canvasWidth = cindyCanvas.width;
        canvasHeight = cindyCanvas.height;

        cindyCanvas.insertAdjacentHTML('afterend', '<canvas id="' + printPreviewInstanceName
            + '" style="border: none;" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas>');
    } else {
        // Case #2: CindyGL
        cindyCanvas = document.getElementById('CSCanvas');
        canvasWidth = self['cdy'].canvas.clientWidth;
        canvasHeight = self['cdy'].canvas.clientHeight;

        let canvasWrapper = document.getElementById('CanvasWrapper');
        if (canvasWrapper) {
            /**
             * Case #2.1: The CindyGL canvas is wrapped by a <div> element (recommended!).
             * This allows the two canvas objects to lie next to each other or wrap to the next line
             * by putting them into the same <div> object using a flexbox.
             */
            canvasWrapper.style["display"] = "flex";
            canvasWrapper.style["flex-wrap"] = "wrap";
            canvasWrapper.insertAdjacentHTML('beforeend', '<div style="position: relative; width: ' + canvasWidth + 'px; height: ' + canvasHeight + 'px;"><canvas id="' + printPreviewInstanceName
                + '" style="border: none;position: absolute; top: 0px; left: 0px;" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas></div>');
        } else {
            /**
             * Case #2.2: The CindyGL canvas is NOT wrapped by a <div> element.
             * Therefore, the two canvas objects are always positioned below each other and never next to each other.
             */
            cindyCanvas.insertAdjacentHTML('afterend', '<div style="position: relative; width: ' + canvasWidth + 'px; height: ' + canvasHeight + 'px;"><canvas id="' + printPreviewInstanceName
                + '" style="border: none;position: absolute; top: 0px; left: 0px;" width="' + canvasWidth + '" height="' + canvasHeight + '"></canvas></div>');
        }
    }

    isPrintPreviewCanvasInitialized = true;
}

/**
 * Creates a shader program for triangle meshes shown in the print preview.
 * The shader uses two directional lights independent of the view direction to simulate
 * a lighting effect similar to modelling software like Blender.
 * @param {WebGLRenderingContext} gl The WebGL rendering context of the print preview canvas.
 */
function initPrintPreviewGL(gl) {
    let previewVertexShaderString =
        "attribute vec3 aPosition;" +
        "attribute vec3 aNormal;" +
        "varying vec3 fragmentPosition;" +
        "varying vec3 fragmentNormal;" +
        "uniform mat4 uProjectionMatrix;" +
        "uniform mat4 uModelViewMatrix;" +
        "uniform mat4 uModelMatrix;" +

        "void main() {" +
        "fragmentPosition = (uModelMatrix * vec4(aPosition, 1.0)).xyz;" +
        "fragmentNormal = (uModelMatrix * vec4(aNormal, 1.0)).xyz;" +
        "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);" +
        "}"
        ;

    let previewFragmentShaderString =
        "precision highp float;\n" +
        "uniform vec3 cameraPosition;\n" +
        "uniform vec3 lightPosition;\n" +
        "uniform vec3 objectColor;\n" +
        "varying vec3 fragmentPosition;\n" +
        "varying vec3 fragmentNormal;\n" +

        "vec3 light(vec3 n, vec3 l, vec3 v, float spec, vec3 color) {\n" +
        "vec3 h = normalize(v + l);\n" +
        "float kd = clamp(dot(n,l), 0.0, 1.0) * 0.4;\n" +
        "float ks = pow(clamp(dot(n,h), 0.0, 1.0), 8.0)*spec;\n" +
        "return vec3(kd*color + vec3(ks));" +
        "}\n" +

        "void main()\n" +
        "{\n" +
        // Phong lighting
        "vec3 n = normalize(fragmentNormal);\n" +
        "vec3 v = normalize(cameraPosition - fragmentPosition);\n" +
        "float ka = 0.2;\n" +
        "vec3 lightColor1 = light(n, normalize(vec3(5.0, -3.0, 1.0)), v, 0.2, vec3(0.3, 0.3, 0.5));\n" +
        "vec3 lightColor2 = light(n, normalize(vec3(-1.2, 0.6, 1.0)), v, 0.3, vec3(0.6, 0.6, 0.6));\n" +
        "gl_FragColor = vec4(lightColor1 + lightColor2 + vec3(ka), 1.0);\n" +
        "}\n"
        ;

    previewShaderProgram = new ShaderProgram(gl, previewVertexShaderString, previewFragmentShaderString);

    isPrintPreviewGLInitialized = true;
}

/**
 * Sets whether a new preview mesh is currently being generated.
 * @param {boolean} waiting Whether to wait for the generation of a new mesh.
 */
function setWaitForMeshGeneration(waiting) {
    waitingForMeshCreation = waiting;
}
/**
 * @return {boolean} Whether a preview mesh is currently being generated.
 */
function getWaitForMeshGeneration() {
    return waitingForMeshCreation;
}

/**
 * Updates the preview mesh shown in the print preview canvas.
 * @param {TriangleMesh} newPreviewMesh The new preview mesh.
 */
function setPreviewMesh(newPreviewMesh) {
    if (newPreviewMesh !== previewMesh) {
        previewMesh = newPreviewMesh;
        needsRecreatePreviewRenderData = true;
    }
}

/**
 * The creation of triangle meshes can be offloaded to web workers. This way, the UI is responsive even
 * when we have a heavy computing workload. However, if a new worker is started, the old one should be
 * terminated, as its result probably has become irrelevant to the user.
 * @param {Worker} worker 
 */
function setMeshCreationWorker(worker) {
    if (meshCreationWorker) {
        // Stop old worker.
        meshCreationWorker.terminate();
    }
    meshCreationWorker = worker;
}


/**
 * Creates the vertex and normal buffers used for rendering the print preview of @see previewMesh.
 * The mesh is rendered using flat shading.
 * @param {WebGLRenderingContext} gl The WebGL rendering context of the print preview canvas.
 */
function createPrintPreviewRenderData(gl) {
    // Flat-shaded render data for the preview triangle mesh
    let vertexPositionArray = [];
    let vertexNormalArray = [];
    for (let i = 0; i < previewMesh.indices.length; i += 3) {
        let v0 = previewMesh.vertices[previewMesh.indices[i + 0]];
        let v1 = previewMesh.vertices[previewMesh.indices[i + 1]];
        let v2 = previewMesh.vertices[previewMesh.indices[i + 2]];
        let faceNormal = vec3normalize(vec3cross(vec3sub(v1, v0), vec3sub(v2, v0)));

        for (let j = 0; j < 3; j++) {
            let vertexPosition = previewMesh.vertices[previewMesh.indices[i + j]];
            // Cindy3D preview has high standard zoom, thus scale down a bit.
            vertexPositionArray.push(vertexPosition.x * 0.1);
            vertexPositionArray.push(vertexPosition.y * 0.1);
            vertexPositionArray.push(vertexPosition.z * 0.1);
            vertexNormalArray.push(faceNormal.x);
            vertexNormalArray.push(faceNormal.y);
            vertexNormalArray.push(faceNormal.z);
        }
    }

    previewVertexPositions = new Float32Array(vertexPositionArray);
    previewVertexNormals = new Float32Array(vertexNormalArray);

    previewVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, previewVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, previewVertexPositions.byteLength + previewVertexNormals.byteLength, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, previewVertexPositions);
    gl.bufferSubData(gl.ARRAY_BUFFER, previewVertexPositions.byteLength, previewVertexNormals);

    needsRecreatePreviewRenderData = false;
    console.log("Updated preview.");
}


/**
 * Renders the print preview using the WebGL context of the print preview canvas.
 * @param {WebGLRenderingContext} gl The WebGL rendering context of the print preview canvas.
 */
function renderPrintPreview(gl) {
    if (!isPrintPreviewGLInitialized) {
        initPrintPreviewGL(gl);
    }
    if (needsRecreatePreviewRenderData) {
        createPrintPreviewRenderData(gl);
    }

    gl.clearColor(0.22, 0.22, 0.22, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (waitingForMeshCreation) {
        renderWaitSymbol(gl);
    }

    if (previewMesh === null || waitingForMeshCreation) {
        //gl.clearColor(0.0, 0.0, 0.0, 1.0);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        return;
    }

    let camera = CindyJS._pluginRegistry.Cindy3D.instances[printPreviewInstanceName].camera;

    previewShaderProgram.use(gl);
    let cameraPosition = [-camera.mvMatrix[3], -camera.mvMatrix[7], -camera.mvMatrix[11], 1.0];
    previewShaderProgram.uniform["cameraPosition"](cameraPosition.slice(0, 3));
    previewShaderProgram.uniform["uProjectionMatrix"](camera.projectionMatrix);
    previewShaderProgram.uniform["uModelViewMatrix"](transpose4(camera.mvMatrix));
    previewShaderProgram.uniform["uModelMatrix"](transpose4(camera.modelMatrix));

    let normalOffset = previewVertexPositions.byteLength;
    var aPositionLoc = gl.getAttribLocation(previewShaderProgram.handle, "aPosition");
    gl.enableVertexAttribArray(aPositionLoc);
    var aNormalLoc = gl.getAttribLocation(previewShaderProgram.handle, "aNormal");
    gl.enableVertexAttribArray(aNormalLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, previewVertexBuffer);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, normalOffset);
    gl.drawArrays(gl.TRIANGLES, 0, previewMesh.indices.length);
    gl.disableVertexAttribArray(aPositionLoc);
    gl.disableVertexAttribArray(aNormalLoc);
}


/**
 * Renders a rotating circle in the middle of the window indicating waiting for a new mesh.
 * @param {WebGLRenderingContext} gl The WebGL rendering context of the print preview canvas.
 */
function renderWaitSymbol(gl) {
    let texCoordOffsetFullscreenQuad = 4 * 4 * 3;
    if (!fullscreenQuadVertexBuffer) {
        let vertexShaderCode =
            "attribute vec3 aPos;" +
            "attribute vec2 aTexCoord;" +
            "varying vec2 iUv;" +

            "void main() {" +
            "iUv = aTexCoord;" +
            "gl_Position = vec4(aPos, 1.0);" +
            "}"
            ;

        let fragmentShaderCode =
            "precision highp float;\n" +
            "varying vec2 iUv;\n" +
            "uniform float time;\n" +
            "#define EPSILON 0.02\n" +
            "float getSmoothRectangle(float x, float minval, float maxval) {\n" +
            "return smoothstep(minval-EPSILON, minval+EPSILON, x) - smoothstep(maxval-EPSILON, maxval+EPSILON, x);\n" +
            "}\n" +
            "#define PI 3.14159265358979323846\n" +

            "void main()\n" +
            "{\n" +
            "vec2 unitCirclePos = normalize(iUv*2.0 - vec2(1.0));\n" +
            "vec2 position = (iUv*2.0 - vec2(1.0)) * 8.0;\n" +
            "float len = length(position);\n" +
            "float interpolationFactor = getSmoothRectangle(len, 0.8, 1.0);\n" +
            "float angle = atan(unitCirclePos.y, unitCirclePos.x);\n" +
            "vec3 color = vec3(mod(angle+PI+time, 2.0*PI)/(2.0*PI)/2.0 + 0.3);\n" +
            "gl_FragColor = vec4(interpolationFactor*color, 1.0);\n" +
            "}"
            ;

        waitSymbolShaderProgram = new ShaderProgram(gl, vertexShaderCode, fragmentShaderCode);

        fullscreenQuadVertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadVertexBuffer);

        // Vertex positions of the quad in normalized device coordinates.
        let vertexPositions = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);
        let texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

        gl.bufferData(gl.ARRAY_BUFFER, texCoordOffsetFullscreenQuad + texCoords.byteLength, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertexPositions);
        gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffsetFullscreenQuad, texCoords);
    }

    waitSymbolShaderProgram.use(gl);
    waitSymbolShaderProgram.uniform["time"]([(Date.now() / 1000.0) % (2 * Math.PI)]);
    var aPosLoc = gl.getAttribLocation(waitSymbolShaderProgram.handle, "aPos");
    gl.enableVertexAttribArray(aPosLoc);
    var aTexLoc = gl.getAttribLocation(waitSymbolShaderProgram.handle, "aTexCoord");
    gl.enableVertexAttribArray(aTexLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadVertexBuffer);
    gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffsetFullscreenQuad);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aPosLoc);
    gl.disableVertexAttribArray(aTexLoc);
}



/**
 * Draws the print preview using Cindy3D and WebGL.
 * @param {object} api The CindyScript API object.
 */
function drawPrintPreview(api) {
    let evokeCS = api.instance.evokeCS;
    evokeCS('begin3d(name->"' + printPreviewInstanceName + '");');
    evokeCS('depthrange3d(0.2, 1000.0);');
    CindyJS._pluginRegistry.Cindy3D.instances[printPreviewInstanceName].externalRenderHook = renderPrintPreview;
    evokeCS('end3d();');
}
