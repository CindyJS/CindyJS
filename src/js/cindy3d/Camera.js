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
  this.fieldOfView = 45;
  this.zNear = 0.1;
  this.zFar = 100;
  this.updatePerspective();
  this.setCamera([0,0,5], [0,0,0], [0,1,0]);
}

/** @type {number} */
Camera.prototype.width;

/** @type {number} */
Camera.prototype.height;

/** @type {number} */
Camera.prototype.fieldOfView;

/** @type {number} */
Camera.prototype.zNear;

/** @type {number} */
Camera.prototype.zFar;

/** @type {number} */
Camera.prototype.viewDist;

/** @type {Array.<number>} */
Camera.prototype.projectionMatrix;

/** @type {Array.<number>} */
Camera.prototype.mvMatrix;

Camera.prototype.updatePerspective = function() {
  let f = 1.0/Math.tan(this.fieldOfView * (Math.PI / 360.));
  let nearMinusFar = this.zNear - this.zFar;
  this.projectionMatrix = [
    f*this.height/this.width, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (this.zFar + this.zNear)/nearMinusFar, -1,
    0, 0, 2*this.zFar*this.zNear/nearMinusFar, 0
  ];
};

/**
 * @param {Array.<number>} position
 * @param {Array.<number>} lookAt
 * @param {Array.<number>} up
 */
Camera.prototype.setCamera = function(position, lookAt, up) {
  let viewDir = sub3(position, lookAt);
  this.viewDist = norm3(viewDir);
  let z2 = normalized3(viewDir);
  let y2 = normalized3(up);
  let x2 = cross3(y2, z2);
  let m1 = [
    x2[0], y2[0], z2[0],
    x2[1], y2[1], z2[1],
    x2[2], y2[2], z2[2]
  ];
  let m2 = adj3(m1);
  let t = mul3mv(m2, position);
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
  let ax = Camera.ROTATE_SENSITIVITY*dx, ay = Camera.ROTATE_SENSITIVITY*dy;
  let cx = Math.cos(ax), cy = Math.cos(ay);
  let sx = Math.sin(ax), sy = Math.sin(ay);
  let mx = [
    cx, 0, sx, 0,
    0, 1, 0, 0,
    -sx, 0, cx, 0,
    0, 0, 0, 1];
  let my = [
    1, 0, 0, 0,
    0, cy, -sy, 0,
    0, sy, cy, 0,
    0, 0, 0, 1];
  let mz1 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, this.viewDist,
    0, 0, 0, 1];
  let mz2 = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, -this.viewDist,
    0, 0, 0, 1];
  this.mvMatrix =
    mul4mm(mz2, mul4mm(mul4mm(mx, my), mul4mm(mz1, this.mvMatrix)));
}
