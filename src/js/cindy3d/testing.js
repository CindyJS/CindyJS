var c3d = { };

var gl, glExtFragDepth;

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
  glExtFragDepth = gl.getExtension("EXT_frag_depth");
}

var shaderProgram;

function initShaders() {
  var fs = "precision mediump float;\n\n" + c3d.resources.lighting + "\n" + c3d.resources.sphere_frag;
  var vs = "precision mediump float;\n\n" + c3d.resources.sphere_vert;
  if (glExtFragDepth)
    fs = "#extension GL_EXT_frag_depth : enable\n" + fs;
  // console.log([fs,vs]);
  fs = new glObj.ShaderObject(gl, gl.FRAGMENT_SHADER, fs);
  vs = new glObj.ShaderObject(gl, gl.VERTEX_SHADER, vs);
  shaderProgram = new glObj.ShaderProgram([fs, vs]);
  shaderProgram.use();

  gl.enableVertexAttribArray(shaderProgram.attrib["aVertex"].location);
}

var projectionMatrix;
var mvMatrix;

function setUniforms() {
  var u = shaderProgram.uniform;
  u.uProjectionMatrix(projectionMatrix);
  u.materialShininess([60]);
  u.materialAmbient([0.2, 0.2, 0.2, 0.2]);
  u.materialSpecular([0.5, 0.5, 0.5, 0.5]);
  u.lightSource[0].position([0.0, 0.0, 0.0, 1.0]);
  u.lightSource[0].ambient([0.0, 0.0, 0.0, 1.0]);
  u.lightSource[0].diffuse([1.0, 1.0, 1.0, 1.0]);
  u.lightSource[0].specular([0.0, 0.0, 0.0, 1.0]);
}

var squareVertexPositionBuffer;

function initBuffers() {
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  vertices = [
     1.0,  1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0, -1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;
}

function drawSphere(pos, radius, rgba) {
  var u = shaderProgram.uniform;
  u.sphereCenter(transform4to3(mvMatrix, pos));
  u.sphereRadius([radius]);
  u.materialDiffuse(rgba);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

var spheres = [
  [[Math.cos(2*Math.PI/3), Math.sin(2*Math.PI/3), 0, 1], 1, [1, 0, 0, 0.85]],
  [[Math.cos(4*Math.PI/3), Math.sin(4*Math.PI/3), 0, 1], 1, [0, 1, 0, 0.85]],
  [[Math.cos(6*Math.PI/3), Math.sin(6*Math.PI/3), 0, 1], 1, [0, 0, 1, 0.85]]
];

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  //mat4.identity(mvMatrix);

  //mat4.translate(mvMatrix, [0, 0.0, -7.0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.attrib["aVertex"].location, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setUniforms();
  gl.enable(gl.BLEND);
  gl.depthMask(false);
  renderPrimitives(false);
  renderPrimitives(false);
  gl.depthMask(true);
  /*
  gl.disable(gl.BLEND);
  renderPrimitives(true);
  gl.enable(gl.BLEND);
  */
  renderPrimitives(false);
  gl.disable(gl.BLEND);
}

function renderPrimitives(opaque) {
  if (!opaque) {
    shaderProgram.uniform.sphereMode([0]);
    spheres.forEach(drawSphere.apply.bind(drawSphere, null));
  }
  shaderProgram.uniform.sphereMode([1]);
  spheres.forEach(drawSphere.apply.bind(drawSphere, null));
}

function setPerspective(fieldOfView, width, height, zNear, zFar) {
  var f = 1.0/Math.tan(fieldOfView * (Math.PI / 360.));
  var nearMinusFar = zNear - zFar;
  projectionMatrix = [
    f*height/width, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (zFar + zNear)/nearMinusFar, -1,
    0, 0, 2*zFar*zNear/nearMinusFar, 0
  ];
}

function norm(v) {
  var x = v[0], y = v[1], z = v[2];
  return Math.sqrt(x*x + y*y + z*z);
}

function normalized(v) {
  var x = v[0], y = v[1], z = v[2];
  var f = 1/Math.sqrt(x*x + y*y + z*z);
  return [f*x, f*y, f*z];
}

function transpose(m) {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8]
  ];
};

function adj3(m) {
  return [
    m[4]*m[8] - m[5]*m[7], m[2]*m[7] - m[1]*m[8], m[1]*m[5] - m[2]*m[4],
    m[5]*m[6] - m[3]*m[8], m[0]*m[8] - m[2]*m[6], m[2]*m[3] - m[0]*m[5],
    m[3]*m[7] - m[4]*m[6], m[1]*m[6] - m[0]*m[7], m[0]*m[4] - m[1]*m[3]
  ];
}

function sub3(a, b) {
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

function cross3(a, b) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}

function mul4mm(a, b) {
  return [
    a[0]*b[0] + a[1]*b[4] + a[2]*b[8] + a[3]*b[12],
    a[0]*b[1] + a[1]*b[5] + a[2]*b[9] + a[3]*b[13],
    a[0]*b[2] + a[1]*b[6] + a[2]*b[10] + a[3]*b[14],
    a[0]*b[3] + a[1]*b[7] + a[2]*b[11] + a[3]*b[15],
    a[4]*b[0] + a[5]*b[4] + a[6]*b[8] + a[7]*b[12],
    a[4]*b[1] + a[5]*b[5] + a[6]*b[9] + a[7]*b[13],
    a[4]*b[2] + a[5]*b[6] + a[6]*b[10] + a[7]*b[14],
    a[4]*b[3] + a[5]*b[7] + a[6]*b[11] + a[7]*b[15],
    a[8]*b[0] + a[9]*b[4] + a[10]*b[8] + a[11]*b[12],
    a[8]*b[1] + a[9]*b[5] + a[10]*b[9] + a[11]*b[13],
    a[8]*b[2] + a[9]*b[6] + a[10]*b[10] + a[11]*b[14],
    a[8]*b[3] + a[9]*b[7] + a[10]*b[11] + a[11]*b[15],
    a[12]*b[0] + a[13]*b[4] + a[14]*b[8] + a[15]*b[12],
    a[12]*b[1] + a[13]*b[5] + a[14]*b[9] + a[15]*b[13],
    a[12]*b[2] + a[13]*b[6] + a[14]*b[10] + a[15]*b[14],
    a[12]*b[3] + a[13]*b[7] + a[14]*b[11] + a[15]*b[15]
  ];
}

function mul3mv(m, v) {
  return [
    m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
    m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
    m[6]*v[0] + m[7]*v[1] + m[8]*v[2]
  ];
}

function transform4to3(m, v) {
  var x = m[0]*v[0] + m[1]*v[1] + m[2]*v[2] + m[3]*v[3];
  var y = m[4]*v[0] + m[5]*v[1] + m[6]*v[2] + m[7]*v[3];
  var z = m[8]*v[0] + m[9]*v[1] + m[10]*v[2] + m[11]*v[3];
  var f = 1/(m[12]*v[0] + m[13]*v[1] + m[14]*v[2] + m[15]*v[3]);
  return [x*f, y*f, z*f];
}

var viewDist;

function setCamera(position, lookAt, up) {
  var viewDir = sub3(position, lookAt);
  viewDist = norm(viewDir);
  var z2 = normalized(viewDir);
  var y2 = normalized(up);
  var x2 = cross3(y2, z2);
  var m1 = [
    x2[0], y2[0], z2[0],
    x2[1], y2[1], z2[1],
    x2[2], y2[2], z2[2]
  ];
  var m2 = adj3(m1);
  var t = mul3mv(m2, position);
  mvMatrix = [
    m2[0], m2[1], m2[2], -t[0],
    m2[3], m2[4], m2[5], -t[1],
    m2[6], m2[7], m2[8], -t[2],
    0, 0, 0, 1
  ];
  //console.log(mvMatrix);
}

var ROTATE_SENSITIVITY = 0.01;

function mouseRotate(dx, dy) {
  var ax = ROTATE_SENSITIVITY*dx, ay = ROTATE_SENSITIVITY*dy;
  var cx = Math.cos(ax), cy = Math.cos(ay);
  var sx = Math.sin(ax), sy = Math.sin(ay);
  var mx = [
    cx, 0, sx, 0,
    0, 1, 0, 0,
    -sx, 0, cx, 0,
    0, 0, 0, 1];
  var my = [
    1, 0, 0, 0,
    0, cy, -sy, 0,
    0, sy, cy, 0,
    0, 0, 0, 1];
  var mz1 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, viewDist,
    0, 0, 0, 1];
  var mz2 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, -viewDist,
    0, 0, 0, 1];
  mvMatrix = mul4mm(mz2, mul4mm(mul4mm(mx, my), mul4mm(mz1, mvMatrix)));
  drawScene();
}

function webGLStart() {
  var canvas = document.getElementById("canvas");
  var mx, my, mdown = false;
  canvas.addEventListener("mousedown", function(evnt) {
    if (evnt.button === 0) {
      mdown = true;
    }
    if (evnt.buttons === undefined ? mdown : (evnt.buttons & 1)) {
      mx = evnt.screenX;
      my = evnt.screenY;
    }
  });
  canvas.addEventListener("mousemove", function(evnt) {
    if (evnt.buttons === undefined ? mdown : (evnt.buttons & 1)) {
      if (evnt.movementX !== undefined) {
        mouseRotate(evnt.movementX, evnt.movementY);
      }
      else {
        mouseRotate(evnt.screenX - mx, evnt.screenY - my);
      }
      mx = evnt.screenX;
      my = evnt.screenY;
    }
  });
  canvas.addEventListener("mouseup", function(evnt) {
    if (evnt.button === 0) mdown = false;
  });
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  setPerspective(45.0, 632, 452, 0.1, 100.0);
  setCamera([0,0,5], [0,0,0], [0,1,0]);
  drawScene();
}
