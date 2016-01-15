function smallestPowerOfTwoGreaterOrEqual(a){
  let ans = 1;
  while(ans<a) ans <<= 1;
  return ans;
};
 
 /**
 * @constructor
 */
function CanvasWrapper(canvas) {
  this.canvas = canvas;
  this.sizeX = canvas.width;
  this.sizeY = canvas.height;
  this.sizeXP = smallestPowerOfTwoGreaterOrEqual(this.sizeX);
  this.sizeYP = smallestPowerOfTwoGreaterOrEqual(this.sizeY);
  this.ratio = canvas.height/canvas.width;
  this.it = 0;
 //black default texture @TODO: copy texture from canvas
    var pixels = [];
    
		for ( var i = 0; i < this.sizeXP; i++) {
			for ( var j = 0; j < this.sizeYP; j++) {
				pixels.push(0, 0, 0, 255);
			}
		}

  let rawData = new Float32Array(pixels);
  
  //framebuffers and textures
  this.textures = [];
  this.framebuffers = [];

  canvas['drawTo'] = this.drawTo.bind(this);
  canvas['cdyUpdate'] = this.copyTextureToCanvas.bind(this);
  
  
  for(let j = 0; j<2; j++) {
    this.textures[j] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1); //TODO?
    
    
    //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.sizeXP, this.sizeYP, 0, gl.RGBA, gl.UNSIGNED_BYTE, rawData);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.sizeXP, this.sizeYP, 0, gl.RGBA, gl.FLOAT, rawData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    this.framebuffers[j] = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[j]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[j], 0);
  }
  
  this.shaderProgram = new ShaderProgram(gl, cgl_resources["copytexture_v"], cgl_resources["copytexture_f"]);
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

	var vertices = new Float32Array([ -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0 ]);

	var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
	gl.enableVertexAttribArray(aPosLoc);

	var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
	gl.enableVertexAttribArray(aTexLoc);

	var texCoords = new Float32Array([ 0, 0, 1, 0, 0, 1, 1, 1 ]);

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
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.it^1]);
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
  glcanvas.width  = this.sizeX;
  glcanvas.height = this.sizeY;
	gl.viewport(0, 0, this.sizeXP, this.sizeYP);

	this.shaderProgram.use(gl);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.textures[this.it]);
  this.shaderProgram.uniform["sampler"](0);
  
	gl.bindFramebuffer(gl.FRAMEBUFFER, null); //renders to glcanvas
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	gl.flush();
  context.drawImage(glcanvas, x, y);
};

/**
 * sets pixel at absolute coordinate x and y to color; both on canvas and on this.textures[this.it]
 * 
 */
CanvasWrapper.prototype.setPixel = function(x, y, color) {
    this.bindTexture();
    
    let color255 = [color[0]*255, color[1]*255, color[2]*255, 255];
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, 1, 1,
                     gl.RGBA, gl.UNSIGNED_BYTE,
                     new Uint8Array(color255));
    
    let context = this.canvas.getContext('2d');
    let id = context.createImageData(1,1); // only do this once per page
    id.data.d = color255;
    context.putImageData( id, x, y );
};
