/** @constant @type {number} */
let vec4Length = 4;

/** @constant @type {number} */
let float32ByteCount = 4;

/** @constant @type {number} */
let indexByteCount = 2;

/**
 * @param {Array.<string>} attributes  names of vec4-typed attributes
 * @param {Array.<number>} elements  order of vertices in the drawn elements
 * @constructor
 */
function PrimitiveRenderer(attributes, elements) {
  let numAttributes = attributes.length, numElements = elements.length;
  let numVertices = Math.max.apply(null, elements) + 1, tmp;
  this.attributes = attributes;
  this.numAttributes = numAttributes;
  this.numVertices = numVertices;
  this.elements = elements;
  this.numElements = numElements;
  this.itemLength = vec4Length * numVertices * numAttributes;
  this.vertexByteCount = vec4Length * float32ByteCount * numAttributes;
  this.itemAttribByteCount = tmp = numVertices * this.vertexByteCount;
  this.itemTotalByteCount = tmp + numElements * indexByteCount;
}

//////////////////////////////////////////////////////////////////////
// Members of the prototype objects

/**
 * @type {number}
 */
PrimitiveRenderer.prototype.initialCapacity = 16;

/**
 * Names of the attributes
 * @type {Array.<string>}
 */
PrimitiveRenderer.prototype.attributes;

/**
 * Number of attributes per vertex
 * @type {number}
 */
PrimitiveRenderer.prototype.numAttributes;

/**
 * Number of vertices (without repetition) per item
 * @type {number}
 */
PrimitiveRenderer.prototype.numVertices;

/**
 * Vertex indices for one item
 * @type {Array.<number>}
 */
PrimitiveRenderer.prototype.elements;

/**
 * Number of vertices (with repetition) per item
 * @type {number}
 */
PrimitiveRenderer.prototype.numElements;

/**
< * Number of floats per item for its attributes
 * @type {number}
 */
PrimitiveRenderer.prototype.itemLength;

/**
 * Number of bytes per vertex
 * @type {number}
 */
PrimitiveRenderer.prototype.vertexByteCount;

/**
 * Number of bytes per item, attribute use only
 * @type {number}
 */
PrimitiveRenderer.prototype.itemAttribByteCount;

/**
 * Number of bytes per item, including indices
 * @type {number}
 */
PrimitiveRenderer.prototype.itemTotalByteCount;

/**
 * Whether to make use of the fragment depth extension
 * @type {boolean}
 */
PrimitiveRenderer.prototype.useFragDepth = true;

/**
 * Source code of vertex shader
 * @type {string}
 */
PrimitiveRenderer.prototype.vertexShaderCode;

/**
 * Source code of fragment shader, sans lighting
 * @type {string}
 */
PrimitiveRenderer.prototype.fragmentShaderCode;

//////////////////////////////////////////////////////////////////////
//

/**
 * @param {number} mode
 * @param {Viewer} viewer
 */
PrimitiveRenderer.prototype.init = function(mode, viewer) {
  let c = this.initialCapacity, d;
  this.mode = mode;
  this.count = 0;
  this.opaque = true;
  this.capacity = c;
  this.data = new ArrayBuffer(c * this.itemTotalByteCount);
  this.dataAttribs = new Float32Array(this.data, 0, c * this.itemLength);
  d = new Uint16Array(this.data, c * this.itemAttribByteCount);
  this.dataIndices = d;
  let i, j, k = 0, o, e = this.elements;
  for (i = 0; i < c; ++i) {
    o = i * this.numVertices;
    for (j = 0; j < e.length; ++j)
      d[k++] = e[j] + o;
  }
  this.bufferAttribs = viewer.gl.createBuffer();
  this.bufferIndices = viewer.gl.createBuffer();
  this.bufferCapacity = -1;
  this.shaderProgram = null;
  this.recompileShader(viewer);
}

/**
 * Enum constant identifying the kind of primitives to draw
 * @type {number}
 */
PrimitiveRenderer.prototype.mode;

/**
 * Number of primitives currently stored
 * @type {number}
 */
PrimitiveRenderer.prototype.count;

/**
 * Number of primitives that can be stored in the data buffer
 * @type {number}
 */
PrimitiveRenderer.prototype.capacity;

/**
 * Data storage for vertex attributes and indices
 * @type {ArrayBuffer}
 */
PrimitiveRenderer.prototype.data;

/**
 * Attributes for all vertices of all items
 * @type {Float32Array}
 */
PrimitiveRenderer.prototype.dataAttribs;

/**
 * Indices describing the order of vertices of all items
 * @type {Uint16Array}
 */
PrimitiveRenderer.prototype.dataIndices;

/** @type {WebGLBuffer} */
PrimitiveRenderer.prototype.bufferAttribs;

/** @type {WebGLBuffer} */
PrimitiveRenderer.prototype.bufferIndices;

/** @type {number} */
PrimitiveRenderer.prototype.bufferCapacity;

/** @type {ShaderProgram} */
PrimitiveRenderer.prototype.shaderProgram;

/** @type {Array.<number>} */
PrimitiveRenderer.prototype.attribLocations;

/**
 * @param {Viewer} viewer
 */
PrimitiveRenderer.prototype.recompileShader = function(viewer) {
  let gl = viewer.gl;
  if (this.shaderProgram !== null)
    this.shaderProgram.dispose(gl);
  let vs = [
    "precision mediump float;",
    this.vertexShaderCode
  ].join("\n");
  let fs = [
    "precision mediump float;",
    viewer.lightingCode,
    this.fragmentShaderCode
  ].join("\n");
  if (this.useFragDepth && viewer.glExtFragDepth)
    fs = "#extension GL_EXT_frag_depth : enable\n" + fs;
  this.shaderProgram = new ShaderProgram(gl, vs, fs);
  let sp = this.shaderProgram.handle;
  this.attribLocations = this.attributes.map(a => gl.getAttribLocation(sp, a));
}

/**
 * @param {Array.<number>} attributes
 */
PrimitiveRenderer.prototype.addPrimitive = function(attributes) {
  if (attributes.length !== this.itemLength)
    throw new GlError("Wrong number of attributes given");
  if (this.count == this.capacity) {
    let c = this.capacity*2, nd, nda, ndi, i, j, k, o, e = this.elements;
    nd = new ArrayBuffer(c * this.itemTotalByteCount);
    nda = new Float32Array(nd, 0, c * this.itemLength);
    ndi = new Uint16Array(nd, c * this.itemAttribByteCount);
    nda.set(this.dataAttribs);
    ndi.set(this.dataIndices);
    k = this.dataIndices.length;
    for (i = this.capacity; i < c; ++i) {
      o = i * this.numVertices;
      for (j = 0; j < e.length; ++j)
        ndi[k++] = e[j] + o;
    }
    this.capacity = c;
    this.data = nd;
    this.dataAttribs = nda;
    this.dataIndices = ndi;
  }
  this.dataAttribs.set(attributes, (this.count++) * this.itemLength);
};

PrimitiveRenderer.prototype.renderPrimitives = function(gl, setUniforms) {
  if (this.count === 0)
    return;
  let shaderProgram = this.shaderProgram, u = shaderProgram.uniform;
  shaderProgram.use(gl);
  setUniforms(u);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferAttribs);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferIndices);
  if (this.bufferCapacity !== this.capacity) {
    gl.bufferData(gl.ARRAY_BUFFER, this.dataAttribs, gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.dataIndices, gl.STATIC_DRAW);
    this.bufferCapacity = this.capacity;
  }
  else {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array
                     (this.data, 0, this.count * this.itemLength));
  }
  let i;
  for (i = 0; i < this.numAttributes; ++i) {
    let loc = this.attribLocations[i];
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(
      loc, vec4Length, gl.FLOAT, /* normalized */ false,
      this.vertexByteCount, vec4Length*float32ByteCount*i);
  }
  gl.drawElements(this.mode, this.numElements * this.count,
                  gl.UNSIGNED_SHORT, 0);
  for (i = 0; i < this.numAttributes; ++i) {
    gl.disableVertexAttribArray(this.attribLocations[i]);
  }
};

PrimitiveRenderer.prototype.clear = function() {
  this.count = 0;
  this.opaque = true;
};
