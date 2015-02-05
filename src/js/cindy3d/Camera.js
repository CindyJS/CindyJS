/**
 * @param {Array.<number>} v
 * @return {number}
 */
function norm3(v) {
  var x = v[0], y = v[1], z = v[2];
  return Math.sqrt(x*x + y*y + z*z);
}

/**
 * @param {Array.<number>} v
 * @return {Array.<number>}
 */
function normalized3(v) {
  var x = v[0], y = v[1], z = v[2];
  var f = 1/Math.sqrt(x*x + y*y + z*z);
  return [f*x, f*y, f*z];
}

/**
 * @param {Array.<number>} m
 * @return {Array.<number>}
 */
function transpose3(m) {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8]
  ];
};

/**
 * @param {Array.<number>} m
 * @return {Array.<number>}
 */
function transpose4(m) {
  return [
    m[0], m[4], m[8], m[12],
    m[1], m[5], m[9], m[13],
    m[2], m[6], m[10], m[14],
    m[3], m[7], m[11], m[15]
  ];
};

/**
 * @param {Array.<number>} m
 * @return {Array.<number>}
 */
function adj3(m) {
  return [
    m[4]*m[8] - m[5]*m[7], m[2]*m[7] - m[1]*m[8], m[1]*m[5] - m[2]*m[4],
    m[5]*m[6] - m[3]*m[8], m[0]*m[8] - m[2]*m[6], m[2]*m[3] - m[0]*m[5],
    m[3]*m[7] - m[4]*m[6], m[1]*m[6] - m[0]*m[7], m[0]*m[4] - m[1]*m[3]
  ];
}

/**
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
function sub3(a, b) {
  return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

/**
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
function cross3(a, b) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}

/**
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
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

/**
 * @param {Array.<number>} m
 * @param {Array.<number>} v
 * @return {Array.<number>}
 */
function mul3mv(m, v) {
  return [
    m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
    m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
    m[6]*v[0] + m[7]*v[1] + m[8]*v[2]
  ];
}

/**
 * @param {Array.<number>} m
 * @param {Array.<number>} v
 * @return {Array.<number>}
 */
function transform4to3(m, v) {
  var x = m[0]*v[0] + m[1]*v[1] + m[2]*v[2] + m[3]*v[3];
  var y = m[4]*v[0] + m[5]*v[1] + m[6]*v[2] + m[7]*v[3];
  var z = m[8]*v[0] + m[9]*v[1] + m[10]*v[2] + m[11]*v[3];
  var f = 1/(m[12]*v[0] + m[13]*v[1] + m[14]*v[2] + m[15]*v[3]);
  return [x*f, y*f, z*f];
}

//////////////////////////////////////////////////////////////////////
// Camera

/**
 * @param {number} width
 * @param {number} height
 * @constructor
 */
function Camera(width, height) {
  this.width = width;
  this.height = height;
  this.setPerspective(45, width, height, 0.1, 100);
  this.setCamera([0,0,5], [0,0,0], [0,1,0]);
}

/** @type {number} */
Camera.prototype.viewDist;

/** @type {Array.<number>} */
Camera.prototype.projectionMatrix;

/** @type {Array.<number>} */
Camera.prototype.mvMatrix;

/**
 * @param {number} fieldOfView
 * @param {number} width
 * @param {number} height
 * @param {number} zNear
 * @param {number} zFar
 */
Camera.prototype.setPerspective = function
(fieldOfView, width, height, zNear, zFar) {
  var f = 1.0/Math.tan(fieldOfView * (Math.PI / 360.));
  var nearMinusFar = zNear - zFar;
  this.projectionMatrix = [
    f*height/width, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (zFar + zNear)/nearMinusFar, -1,
    0, 0, 2*zFar*zNear/nearMinusFar, 0
  ];
};

/**
 * @param {Array.<number>} position
 * @param {Array.<number>} lookAt
 * @param {Array.<number>} up
 */
Camera.prototype.setCamera = function(position, lookAt, up) {
  var viewDir = sub3(position, lookAt);
  this.viewDist = norm3(viewDir);
  var z2 = normalized3(viewDir);
  var y2 = normalized3(up);
  var x2 = cross3(y2, z2);
  var m1 = [
    x2[0], y2[0], z2[0],
    x2[1], y2[1], z2[1],
    x2[2], y2[2], z2[2]
  ];
  var m2 = adj3(m1);
  var t = mul3mv(m2, position);
  this.mvMatrix = [
    m2[0], m2[1], m2[2], -t[0],
    m2[3], m2[4], m2[5], -t[1],
    m2[6], m2[7], m2[8], -t[2],
    0, 0, 0, 1
  ];
  //console.log(mvMatrix);
}

/** @constant @type {number} */
Camera.ROTATE_SENSITIVITY = 0.01;

Camera.prototype.mouseRotate = function(dx, dy) {
  var ax = Camera.ROTATE_SENSITIVITY*dx, ay = Camera.ROTATE_SENSITIVITY*dy;
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
    0, 0, 1, this.viewDist,
    0, 0, 0, 1];
  var mz2 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, -this.viewDist,
    0, 0, 0, 1];
  this.mvMatrix =
    mul4mm(mz2, mul4mm(mul4mm(mx, my), mul4mm(mz1, this.mvMatrix)));
}
