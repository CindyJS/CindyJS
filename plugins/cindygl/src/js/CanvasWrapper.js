function generateCanvasWrapperIfRequired(imageobject, api, properties) {
  if (imageobject["canvaswrapper"]) {
    if (
      imageobject.ready &&
      (imageobject["canvaswrapper"].canvas == dummyimage ||
        imageobject["canvaswrapper"].sizeX != imageobject.width ||
        imageobject["canvaswrapper"].sizeY != imageobject.height)
    ) {
      delete imageobject["canvaswrapper"];
      imageobject["canvaswrapper"] = generateCanvasWrapperIfRequired(
        imageobject,
        api,
        properties
      );
    }
    if (properties)
      imageobject["canvaswrapper"].updateReadingProperties(properties);
  } else {
    imageobject["canvaswrapper"] = new CanvasWrapper(
      imageobject.ready ? imageobject : dummyimage,
      properties || {
        interpolate: true,
        mipmap: false,
        repeat: false,
        clamptoedge: false,
      }
    );

    if (!imageobject.ready) {
      console.log("Image is not ready yet.");
    }
  }
  return imageobject["canvaswrapper"];
}

/**
 * Note that CanvasWrapper might also wrap an image instead of a canvas
 * @constructor
 * @param canvas {CindyJS.image}
 */
function CanvasWrapper(canvas, properties) {
  this.canvas = canvas;
  this.properties = properties;
  this.sizeX = canvas.width;
  this.sizeY = canvas.height;
  this.updateInternalTextureMeasures();
  this.ratio = canvas.height / canvas.width;
  this.it = 0;
  this.textures = [];
  this.framebuffers = [];
  this.generation = -1;

  this.bindTexture();

  canvas["drawTo"] = this.drawTo.bind(this);
  canvas["readPixels"] = this.readPixels.bind(this);
  canvas["cdyUpdate"] = this.copyTextureToCanvas.bind(this);

  let rawData = createPixelArray(this.sizeXP * this.sizeYP * 4);

  for (let j = 0; j < 2; j++) {
    this.textures[j] = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.sizeXP,
      this.sizeYP,
      0,
      gl.RGBA,
      getPixelType(),
      rawData
    );
    if (properties.mipmap)
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        properties.interpolate
          ? gl.LINEAR_MIPMAP_LINEAR
          : gl.NEAREST_MIPMAP_LINEAR
      );
    //always interpolate between 2 mipmap levels NEAREST_MIPMAP_LINEAR
    else
      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MIN_FILTER,
        properties.interpolate ? gl.LINEAR : gl.NEAREST
      );

    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      properties.interpolate ? gl.LINEAR : gl.NEAREST
    );

    if (properties.clamptoedge) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    this.framebuffers[j] = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[j]);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.textures[j],
      0
    );
  }

  this.shaderProgram = new ShaderProgram(
    gl,
    cgl_resources["copytexture_v"],
    cgl_resources["copytexture_f"]
  );
  var posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);

  var vertices = new Float32Array([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0]);

  var aPosLoc = gl.getAttribLocation(this.shaderProgram.handle, "aPos");
  gl.enableVertexAttribArray(aPosLoc);

  var aTexLoc = gl.getAttribLocation(this.shaderProgram.handle, "aTexCoord");
  gl.enableVertexAttribArray(aTexLoc);

  var texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);

  var texCoordOffset = vertices.byteLength;

  gl.bufferData(
    gl.ARRAY_BUFFER,
    texCoordOffset + texCoords.byteLength,
    gl.STATIC_DRAW
  );
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
  gl.bufferSubData(gl.ARRAY_BUFFER, texCoordOffset, texCoords);
  gl.vertexAttribPointer(aPosLoc, 3, gl.FLOAT, false, 0, 0);
  gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, texCoordOffset);
}

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

/** @type {number} */
CanvasWrapper.prototype.lastframecount;

/** @type {CindyJS.image} */
CanvasWrapper.prototype.canvas;

/**
 * What was the generation of the imageobject when it was copied to the internal textures.
 * It should be canvas.generation whenever the internal texture is read.
 * @type {number} */
CanvasWrapper.prototype.generation;

/** What is the current index of the rendered frame
 *@type {number} */
CanvasWrapper.prototype.it;

/** @type {ShaderProgram} */
CanvasWrapper.prototype.shaderProgram;

CanvasWrapper.prototype.updateReadingProperties = function (properties) {
  let oldproperties = this.properties;
  if (
    properties &&
    (properties.repeat != oldproperties.repeat ||
      properties.clamptoedge != oldproperties.clamptoedge ||
      properties.mipmap != oldproperties.mipmap ||
      properties.interpolate != oldproperties.interpolate)
  ) {
    this.properties = properties;
    for (let j = 0; j < 2; j++) {
      gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
      if (properties.mipmap)
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          properties.interpolate
            ? gl.LINEAR_MIPMAP_LINEAR
            : gl.NEAREST_MIPMAP_LINEAR
        );
      //always interpolate between 2 mipmap levels NEAREST_MIPMAP_LINEAR
      else
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          properties.interpolate ? gl.LINEAR : gl.NEAREST
        );

      gl.texParameteri(
        gl.TEXTURE_2D,
        gl.TEXTURE_MAG_FILTER,
        properties.interpolate ? gl.LINEAR : gl.NEAREST
      );

      if (properties.clamptoedge) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
    }
  }
};

CanvasWrapper.prototype.updateInternalTextureMeasures = function () {
  // WebGL 1 only supports NPOT textures in certain configurations.
  if (
    this.properties.clamptoedge &&
    this.properties.interpolate &&
    !this.properties.repeat &&
    !this.properties.mipmap
  ) {
    this.sizeXP = this.sizeX;
    this.sizeYP = this.sizeY;
  } else {
    this.sizeXP = smallestPowerOfTwoGreaterOrEqual(
      this.sizeX +
        (this.sizeX / 2) * (this.properties.mipmap && this.properties.repeat)
    );
    this.sizeYP = smallestPowerOfTwoGreaterOrEqual(
      this.sizeY +
        (this.sizeY / 2) * (this.properties.mipmap && this.properties.repeat)
    );
  }
};

/**
 * runs a gl.bindTexture(  gl.TEXTURE_2D,...) for sampling purposes
 */
CanvasWrapper.prototype.bindTexture = function () {
  gl.bindTexture(gl.TEXTURE_2D, this.textures[this.it]);
};

/**
 * runs a gl.bindFramebuffer (required before rendering) and updates
 */
CanvasWrapper.prototype.bindFramebuffer = function () {
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.it ^ 1]);
  this.it ^= 1;
};

CanvasWrapper.prototype.copyTextureToCanvas = function () {
  let context = null;
  if (this.canvas.img.hasOwnProperty("getContext"))
    context = this.canvas.img.getContext("2d");
  else {
    this.canvas.img = /** @type {HTMLCanvasElement} */ (document.createElement(
      "canvas"
    ));
    this.canvas.img.style.display = "none";
    this.canvas.img.width = this.sizeX;
    this.canvas.img.height = this.sizeY;
    context = this.canvas.img.getContext("2d");
  }

  //Copy things from glcanvas to the cindyjs-canvas representing that canvas
  context.clearRect(0, 0, this.sizeX, this.sizeY);
  this.drawTo(context, 0, 0);
  this.canvas.img.generation++;
};

/**
 * Reload texture data from input element (e.g. HTML video)
 */
CanvasWrapper.prototype.reloadIfRequired = function () {
  if (
    this.canvas.live &&
    (this.canvas.img.webkitDecodedFrameCount ||
      this.canvas.img.mozDecodedFrames) &&
    this.lastframecount >=
      (this.canvas.img.webkitDecodedFrameCount ||
        this.canvas.img.mozDecodedFrames)
  ) {
    return;
  }

  if (
    !this.canvas.live &&
    (!this.canvas.ready || this.generation >= this.canvas.generation)
  ) {
    return;
  }

  if (this.sizeX != this.canvas.width || this.sizeY != this.canvas.height) {
    this.sizeX = this.canvas.width;
    this.sizeY = this.canvas.height;
    this.updateInternalTextureMeasures();
    let rawData = createPixelArray(this.sizeXP * this.sizeYP * 4);

    for (let j = 0; j < 2; j++) {
      gl.bindTexture(gl.TEXTURE_2D, this.textures[j]);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        this.sizeXP,
        this.sizeYP,
        0,
        gl.RGBA,
        getPixelType(),
        rawData
      );
    }
  }

  this.bindTexture();
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if (!this.properties.repeat)
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      gl.RGBA,
      getPixelType(),
      this.canvas.img
    );
  else {
    /*  We want something like, but this unfortunately does not work because texture is to small
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, getPixelType(), this.canvas.img);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, this.sizeX, 0, gl.RGBA, getPixelType(), this.canvas.img);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, this.sizeY, gl.RGBA, getPixelType(), this.canvas.img);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, this.sizeX, this.sizeY, gl.RGBA, getPixelType(), this.canvas.img);
          */

    tmpcanvas.width = this.sizeXP;
    tmpcanvas.height = this.sizeYP;

    let ctx = tmpcanvas.getContext("2d");

    ctx.drawImage(this.canvas.img, 0, this.sizeYP - this.sizeY);
    ctx.drawImage(this.canvas.img, this.sizeX, this.sizeYP - this.sizeY);
    ctx.drawImage(this.canvas.img, 0, this.sizeYP - 2 * this.sizeY);
    ctx.drawImage(this.canvas.img, this.sizeX, this.sizeYP - 2 * this.sizeY);

    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      gl.RGBA,
      getPixelType(),
      tmpcanvas
    );
  }

  if (this.properties.mipmap) gl.generateMipmap(gl.TEXTURE_2D);

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  this.generation = this.canvas.generation;
  this.lastframecount = Math.min(
    this.lastframecount + 1,
    this.canvas.img.webkitDecodedFrameCount || this.canvas.img.mozDecodedFrames
  );
};

CanvasWrapper.prototype.drawTo = function (context, x, y) {
  enlargeCanvasIfRequired(this.sizeXP, this.sizeYP);
  gl.viewport(0, 0, this.sizeXP, this.sizeYP);

  this.shaderProgram.use(gl);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.textures[this.it]);
  this.shaderProgram.uniform["sampler"]([0]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null); //renders to glcanvas
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.flush();
  context.drawImage(
    glcanvas,
    0,
    glcanvas.height - this.sizeY,
    this.sizeX,
    this.sizeY,
    x,
    y,
    this.sizeX,
    this.sizeY
  );
};

/**
 * reads a rectangular block of pixels from the upper left corner.
 * The colors are representent as a 4 component RGBA vector with entries in [0,1]
 */
CanvasWrapper.prototype.readPixels = function (x, y, width, height) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.it]);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    this.textures[this.it],
    0
  );

  var pixels = createPixelArray(width * height * 4);

  //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); does not affect readPixels :(, hence this mess:
  gl.readPixels(
    x,
    this.sizeY - y - height,
    width,
    height,
    gl.RGBA,
    getPixelType(),
    pixels
  );

  //reverse row order
  let res = [];
  for (let i = height - 1; i >= 0; i--)
    res = res.concat(toFloat(pixels.slice(i * width * 4, (i + 1) * width * 4)));
  return res;
};

/**
 * sets pixel at absolute coordinate x and y to color; both on canvas and on this.textures[this.it]
 *
 */
CanvasWrapper.prototype.setPixel = function (x, y, color) {
  this.bindTexture();
  let colordata = [color[0], color[1], color[2], 1];

  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,
    x,
    y,
    1,
    1,
    gl.RGBA,
    getPixelType(),
    createPixelArrayFromFloat(colordata)
  );

  let context = this.canvas.img.getContext("2d");
  let id = context.createImageData(1, 1); // only do this once per page
  id.data.d = colordata;
  context.putImageData(id, x, y);
};
