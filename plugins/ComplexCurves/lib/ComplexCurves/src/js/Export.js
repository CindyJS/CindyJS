var Export = {};

/**
 * @param {Polynomial} p
 * @param {StateGL} stategl
 * @param {boolean=} big
 * @return {Array<string>}
 */
Export.domainColouring = function(p, stategl, big = false) {
    var gl = stategl.gl;
    var sources = StateGL.getShaderSources("DomainColouring");
    var customShaderSrc = GLSL.polynomialShaderSource(p);
    var commonShaderSrc = /** @type {string} */ (resources["Common.glsl"]);
    sources[1] = [customShaderSrc, commonShaderSrc, sources[1]].join("\n");
    var program = stategl.mkProgram(sources);
    var loc;
    var vars = p.variableList();
    var vy = vars.length === 0 ? "y" : vars[vars.length - 1];
    var numSheets = p.degree(vy);
    var sheets = [];
    var pixels;

    /** @param {number} sheet */
    function renderSheet(sheet) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, stategl.rttArrayBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        loc = gl.getUniformLocation(program, "sheet");
        gl.uniform1i(loc, sheet);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    for (var sheet = 1; sheet <= numSheets; sheet++) {
        stategl.withRenderToTexture(renderSheet.bind(null, sheet), big);
        var texture = big ? stategl.rttBigTexture : stategl.rttTexture;
        pixels = /** @type {Uint8Array} */
            (stategl.readTexture(texture));
        sheets[sheet - 1] = Export.pixelsToImageDataURL(pixels);
    }
    return sheets;
};

/**
 * @param {string} name
 * @param {string} url
 */
Export.download = function(name, url) {
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * @param {Polynomial} p
 * @param {StateGL} stategl
 * @param {string=} name
 * @param {boolean=} big
 */
Export.exportDomainColouring = function(p, stategl, name = "sheet", big = true) {
    var sheets = Export.domainColouring(p, stategl, big);
    for (var i = 0, l = sheets.length; i < l; i++)
        Export.download(name + (i + 1) + ".png", sheets[i]);
};

/**
 * @param {StateGL} stategl
 * @param {Float32Array} pixels
 * @param {string=} name
 * @param {boolean=} big
 */
Export.exportSurface = function(stategl, pixels, name = "surface", big = true) {
    var d, i, j, k, u, v, x, y, z, w;
    var length, indices, maxValue = -Infinity,
        minValue = Infinity;
    length = pixels.byteLength / pixels.BYTES_PER_ELEMENT / 4;
    var /** Array<Array<number>> */ vertices = [];
    for (i = 0; i < length * 4; i += 4) {
        x = pixels[i];
        y = pixels[i + 1];
        z = pixels[i + 2];
        w = pixels[i + 3];
        vertices.push([x, y, z]);
        minValue = Math.min(minValue, Math.min(z, w));
        maxValue = Math.max(maxValue, Math.max(z, w));
    }
    d = maxValue - minValue;
    var /** Array<Array<number>> */ uvs = [];
    for (i = 2; i < length * 4; i += 4) {
        u = (pixels[i] - minValue) / d;
        v = (pixels[i + 1] - minValue) / d;
        uvs.push([u, v]);
    }
    var /** Array<Array<number>> */ faces = [];
    for (i = 1; i <= length; i += 3) {
        j = i + 1;
        k = i + 2;
        faces.push([i, j, k]);
    }

    /* deduplicate mesh data */
    indices = vertices.map(function(v1, i) {
        var uv1 = uvs[i];
        return vertices.findIndex(function(v2, j) {
            var uv2 = uvs[j];
            return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2] &&
                uv1[0] === uv2[0] && uv1[1] === uv2[1];
        });
    });
    var /** @type {Array<number>} */ indices2 = Array.from(new Set(indices));
    vertices = indices2.map(function(ii) {
        return vertices[ii];
    });
    uvs = indices2.map(function(i) {
        return uvs[i];
    });
    faces = faces.map(function(f) {
        return f.map(function(i) {
            return indices2.findIndex(function(j) {
                return j === indices[i - 1];
            }) + 1;
        });
    });

    var vertexStrings = vertices.map( /** @param {Array<number>} v */ function(v) {
        return "v " + v[0] + " " + v[1] + " " + v[2];
    });
    var uvStrings = uvs.map( /** @param {Array<number>} uv */ function(uv) {
        return "vt " + uv[0] + " " + uv[1];
    });
    var faceStrings = faces.map( /** @param {Array<number>} f */ function(f) {
        var i = f[0],
            j = f[1],
            k = f[2];
        return "f " + i + "/" + i + " " + j + "/" + j + " " + k + "/" + k;
    });

    var obj = ["mtllib " + name + ".mtl", "usemtl surface", "s 1"];
    obj = obj.concat(vertexStrings, uvStrings, faceStrings);
    obj = "data:text/plain," + encodeURIComponent(obj.join("\n"));
    Export.download(name + ".obj", obj);

    var gl = stategl.gl;
    var sources = StateGL.getShaderSources("Export");
    var program = stategl.mkProgram(sources);
    var loc;
    stategl.withRenderToTexture(function() {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, stategl.rttArrayBuffer);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        loc = gl.getUniformLocation(program, "minValue");
        gl.uniform1f(loc, minValue);
        loc = gl.getUniformLocation(program, "maxValue");
        gl.uniform1f(loc, maxValue);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }, big);
    var texels = /** @type {Uint8Array} */
        (stategl.readTexture(big ? stategl.rttBigTexture : stategl.rttTexture));
    Export.download(name + ".png", Export.pixelsToImageDataURL(texels));

    var mtl = ["newmtl surface", "map_Kd " + name + ".png", "illum 0"];
    mtl = "data:text/plain," + encodeURIComponent(mtl.join("\n"));
    Export.download(name + ".mtl", mtl);
};

/**
 * @param {Uint8Array} pixels
 * @return {string}
 */
Export.pixelsToImageDataURL = function(pixels) {
    var size = Math.sqrt(pixels.length / 4);
    var canvas =
        /** @type {HTMLCanvasElement} */
        (document.createElement("canvas"));
    canvas.width = size;
    canvas.height = size;
    var context =
        /** @type {CanvasRenderingContext2D} */
        (canvas.getContext("2d"));
    var imageData = context.createImageData(canvas.width, canvas.height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);
    var canvasFlip =
        /** @type {HTMLCanvasElement} */
        (document.createElement("canvas"));
    canvasFlip.width = size;
    canvasFlip.height = size;
    var contextFlip =
        /** @type {CanvasRenderingContext2D} */
        (canvasFlip.getContext("2d"));
    contextFlip.translate(0, canvasFlip.height - 1);
    contextFlip.scale(1, -1);
    contextFlip.drawImage(canvas, 0, 0);
    return canvasFlip.toDataURL();
};
