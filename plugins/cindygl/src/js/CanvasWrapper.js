function smallestPowerOfTwoGreaterOrEqual(a) {
  let ans = 1;
  while (ans < a) ans <<= 1;
  return ans;
};


function createArray(pixels) {
  if (can_use_texture_float) return new Float32Array(pixels);
  if (can_use_texture_half_float) return new Uint16Array(pixels);
  else return new Uint8Array(pixels);
}

function getPixelType() {
  if (can_use_texture_float) return gl.FLOAT;
  if (can_use_texture_half_float) return halfFloat.HALF_FLOAT_OES
  else return gl.UNSIGNED_BYTE;
}
/**
 * @constructor
 */
function CanvasWrapper(canvas) {
  this.canvas = canvas;
  this.sizeX = canvas.width;
  this.sizeY = canvas.height;
  this.sizeXP = smallestPowerOfTwoGreaterOrEqual(this.sizeX);
  this.sizeYP = smallestPowerOfTwoGreaterOrEqual(this.sizeY);
  this.ratio = canvas.height / canvas.width;
  this.it = 0;
  //black default texture @TODO: copy texture from canvas
  var pixels = [];

  for (var i = 0; i < this.sizeXP; i++) {
    for (var j = 0; j < this.sizeYP; j++) {
      pixels.push(0, 0, 0, 255);
    }
  }

  let rawData = createArray(pixels);

  //framebuffers and textures
  this.textures = [];
  this.framebuffers = [];

  canvas['drawTo'] = this.drawTo.bind(this);
  canvas['cdyUpdate'] = this.copyTextureToCanvas.bind(this);


  for (let j = 0; j < 2; j++) {
    this.textures[j] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); //TODO?


    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.sizeXP, this.sizeYP, 0, gl.RGBA, gl.UNSIGNED_BYTE, rawData);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.sizeXP, this.sizeYP, 0, gl.RGBA, getPixelType(), rawData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.framebuffers[j] = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[j]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[j], 0);
  }

  this.shaderProgram = new ShaderProgram(gl, cgl_resources["copytexture_v"], cgl_resources["copytexture_f"]);
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

  var vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);

  var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
  gl.enableVertexAttribArray(aPosLoc);

  var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
  gl.enableVertexAttribArray(aTexLoc);

  var texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

  var texCoordOffset = vertices.byteLength;

  gl.bufferData(gl.ARRAY_BUFFER, texCoordOffset + texCoords.byteLength, gl.STATIC_DRAW);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
  gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
  gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);

};

/** @type {Array.<WebGLTexture>} */
CanvasWrapper.prototype.textures;

/** @type {Array.<WebGLFramebuffer>} */
CanvasWrapper.prototype.framebuffers;

/** @type {number} */
CanvasWrapper.prototype.sizeX;

/** @type {number} */
CanvasWrapper.prototype.sizeY;

/** @type {number} */
CanvasWrapper.prototype.ratio;

/** @type {HTMLCanvasElement|Element} */
CanvasWrapper.prototype.canvas;

/** What is the current index of the rendered frame
 *@type {number} */
CanvasWrapper.prototype.it;

/** @type {ShaderProgram} */
CanvasWrapper.prototype.shaderProgram;

/**
 * runs a gl.bindTexture(  gl.TEXTURE_2D,...) for sampling purposes
 */
CanvasWrapper.prototype.bindTexture = function() {
  gl.bindTexture(gl.TEXTURE_2D, this.textures[this.it]);
};

/**
 * runs a gl.bindFramebuffer (required before rendering) and updates 
 */
CanvasWrapper.prototype.bindFramebuffer = function() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.it ^ 1]);
  this.it ^= 1;
};



CanvasWrapper.prototype.copyTextureToCanvas = function() {
  let context = this.canvas.getContext('2d');

  //Copy things from glcanvas to the cindyjs-canvas representing that canvas
  context.clearRect(0, 0, this.sizeX, this.sizeY);
  this.drawTo(context, 0, 0);
}

CanvasWrapper.prototype.drawTo = function(context, x, y) {
  //TODO: render texture this.textures[this.it] on glcanvas
  if(this.sizeX > glcanvas.width || this.sizeY > glcanvas.height) {
    console.log("resize" + this.sizeX + " x " + this.sizeY);
    glcanvas.width = this.sizeX;
    glcanvas.height = this.sizeY;
  }
  gl.viewport(0, 0, this.sizeXP, this.sizeYP);

  this.shaderProgram.use(gl);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.textures[this.it]);
  this.shaderProgram.uniform["sampler"]([0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null); //renders to glcanvas
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.flush();
  context.drawImage(glcanvas, 0, 0, this.sizeX, this.sizeY, x, y, this.sizeX, this.sizeY);
};


//from http://stackoverflow.com/questions/6162651/half-precision-floating-point-in-java/6162687#6162687
var toHalf = (function() {

  var floatView = new Float32Array(1);
  var int32View = new Int32Array(floatView.buffer);

  return function toHalf(fval) {
    floatView[0] = fval;
    var fbits = int32View[0];
    var sign = (fbits >> 16) & 0x8000; // sign only
    var val = (fbits & 0x7fffffff) + 0x1000; // rounded value

    if (val >= 0x47800000) { // might be or become NaN/Inf
      if ((fbits & 0x7fffffff) >= 0x47800000) {
        // is or must become NaN/Inf
        if (val < 0x7f800000) { // was value but too large
          return sign | 0x7c00; // make it +/-Inf
        }
        return sign | 0x7c00 | // remains +/-Inf or NaN
          (fbits & 0x007fffff) >> 13; // keep NaN (and Inf) bits
      }
      return sign | 0x7bff; // unrounded not quite Inf
    }
    if (val >= 0x38800000) { // remains normalized value
      return sign | val - 0x38000000 >> 13; // exp - 127 + 15
    }
    if (val < 0x33000000) { // too small for subnormal
      return sign; // becomes +/-0
    }
    val = (fbits & 0x7fffffff) >> 23; // tmp exp for subnormal calc
    return sign | ((fbits & 0x7fffff | 0x800000) // add subnormal bit
      + (0x800000 >>> val - 102) // round depending on cut off
      >> 126 - val); // div by 2^(1-(exp-127+15)) and >> 13 | exp=0
  };
}());

var toByte = function(f) {
  return f * 255;
}

/**
 * sets pixel at absolute coordinate x and y to color; both on canvas and on this.textures[this.it]
 * 
 */
CanvasWrapper.prototype.setPixel = function(x, y, color) {
  this.bindTexture();

  let s = can_use_texture_float ? 1. : (can_use_texture_half_float ? ((1 << 16) - 1) : ((1 << 8) - 1));
  console.log(s);
  let colordata = [color[0], color[1], color[2], 1.];
  if (!can_use_texture_float && can_use_texture_half_float)
    colordata = colordata.map(toHalf);
  else if (!can_use_texture_float && !can_use_texture_half_float)
    colordata = colordata.map(toByte);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, 1, 1,
    gl.RGBA, getPixelType(), createArray(colordata));

  let context = this.canvas.getContext('2d');
  let id = context.createImageData(1, 1); // only do this once per page
  id.data.d = colordata;
  context.putImageData(id, x, y);
};
