/**
 * @param {Array.<string>} attributes  names of vec4-typed attributes
 * @param {number} numVertices
 * @constructor
 */
function PrimitiveRenderer(attributes, numVertices) {
  const vecLen = 4, numberSize = 4;
  this.attributes = attributes;
  var numAttributes = attributes.length;
  this.numAttributes = numAttributes;
  this.numVertices = numVertices;
  this.itemLength = vecLen * numVertices * numAttributes;
  this.vertexByteCount = vecLen * numberSize * numAttributes;
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
 * Number of vertices per primitive
 * @type {number}
 */
PrimitiveRenderer.prototype.numVertices;

/**
 * Number of floats per primitive
 * @type {number}
 */
PrimitiveRenderer.prototype.itemLength;

/**
 * Number of bytes per vertex
 * @type {number}
 */
PrimitiveRenderer.prototype.vertexByteCount;

//////////////////////////////////////////////////////////////////////
//

/**
 * @param {WebGLRenderingContext} gl
 * @param {string} vs
 * @param {string} fs
 */
PrimitiveRenderer.prototype.init = function(gl, vs, fs) {
  this.count = 0;
  this.capacity = this.initialCapacity;
  this.data = new Float32Array(this.initialCapacity * this.itemLength);

  this.buffer = gl.createBuffer();
  this.bufferCapacity = -1;
  this.shaderProgram = new ShaderProgram(gl, vs, fs);
  var sp = this.shaderProgram.handle;
  this.attribLocations = this.attributes.map(a => {
    var l = gl.getAttribLocation(sp, a);
    gl.enableVertexAttribArray(l);
    return l;
  });
}

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
 * Attributes for all vertices of all primitives
 * @type {Float32Array}
 */
PrimitiveRenderer.prototype.data;

/** @type {WebGLBuffer} */
PrimitiveRenderer.prototype.buffer;

/** @type {number} */
PrimitiveRenderer.prototype.bufferCapacity;

/** @type {ShaderProgram} */
PrimitiveRenderer.prototype.shaderProgram;

/** @type {Array.<number>} */
PrimitiveRenderer.prototype.attribLocations;

/**
 * @param {Array.<number>} attributes
 */
PrimitiveRenderer.prototype.addPrimitive = function(attributes) {
  if (attributes.length !== this.itemLength)
    throw new GlError("Wrong number of attributes given: expected " + this.itemLength + " but got " + attributes.length);
  if (this.count == this.capacity) {
    this.capacity *= 2;
    var nd = new Float32Array(this.capacity * this.itemLength);
    nd.set(this.data);
    this.data = nd;
  }
  this.data.set(attributes, (this.count++) * this.itemLength);
};

PrimitiveRenderer.prototype.renderPrimitives = function(gl, setUniforms) {
  if (this.count === 0)
    return;
  var shaderProgram = this.shaderProgram, u = shaderProgram.uniform;
  shaderProgram.use(gl);
  setUniforms(u);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
  if (this.bufferCapacity !== this.capacity) {
    gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
    this.bufferCapacity = this.capacity;
  }
  else {
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data);
  }
  var i;
  for (i = 0; i < this.numAttributes; ++i)
    gl.vertexAttribPointer(this.attribLocations[i],
                           4, gl.FLOAT, false, this.vertexByteCount, 4*4*i);
  gl.drawArrays(gl.TRIANGLES, 0, this.numVertices * this.count);
};

PrimitiveRenderer.prototype.clear = function() {
  this.count = 0;
};
