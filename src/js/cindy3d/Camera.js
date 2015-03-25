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
Camera.prototype.modelMatrix;

/** @type {Array.<number>} */
Camera.prototype.viewMatrix;

/** @type {Array.<number>} */
Camera.prototype.mvMatrix;

Camera.prototype.updatePerspective = function() {
  let f = 1.0/Math.tan(this.fieldOfView * (Math.PI / 360.));
  let nearMinusFar = this.zNear - this.zFar;
  // Near plane is actually at -zNear, far plane at -zFar.
  // This is in sync with the glFrustrum call of legacy OpenGL 2.
  // This matrix is already tranposed.
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
  let t = mul3mv(m2, lookAt);
  this.modelMatrix = [
    m2[0], m2[1], m2[2], -t[0],
    m2[3], m2[4], m2[5], -t[1],
    m2[6], m2[7], m2[8], -t[2],
    0, 0, 0, 1
  ];
  this.viewMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, -this.viewDist,
    0, 0, 0, 1
  ];
  this.mvMatrix = mul4mm(this.viewMatrix, this.modelMatrix);
};

/** @constant @type {number} */
Camera.ORBIT_SENSITIVITY = 0.01;

/**
 * Rotate camera around lookAt point.
 * Another interpretation is to rotate the viewed object.
 *
 * @param {number} dx
 * @param {number} dy
 */
Camera.prototype.orbitXY = function(dx, dy) {
  let ax = Camera.ORBIT_SENSITIVITY*dx, ay = Camera.ORBIT_SENSITIVITY*dy;
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
  this.modelMatrix = mul4mm(mul4mm(mx, my), this.modelMatrix);
  this.mvMatrix = mul4mm(this.viewMatrix, this.modelMatrix);
};

/** @constant @type {number} */
Camera.ROTATE_SENSITIVITY = -0.01;

/**
 * Rotate camera around its own center.
 *
 * @param {number} dx
 * @param {number} dy
 */
Camera.prototype.rotateXY = function(dx, dy) {
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
  let mv = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, this.viewDist,
    0, 0, 0, 1];
  this.mvMatrix = mul4mm(mul4mm(mx, my), this.mvMatrix);
  this.modelMatrix = mul4mm(mv, this.mvMatrix);
};

/** @constant @type {number} */
Camera.PAN_SENSITIVITY = 0.002;

/**
 * Move camera parallel to image plane but keep view direction and distance.
 * Another interpretation is to move the displayed object.
 *
 * @param {number} dx
 * @param {number} dy
 */
Camera.prototype.translateXY = function(dx, dy) {
  let f = Camera.PAN_SENSITIVITY*this.viewDist, ax = f*dx, ay = -f*dy;
  let m = [
    1, 0, 0, ax,
    0, 1, 0, ay,
    0, 0, 1, 0,
    0, 0, 0, 1];
  this.modelMatrix = mul4mm(m, this.modelMatrix);
  this.mvMatrix = mul4mm(this.viewMatrix, this.modelMatrix);
};

/**
 * Change distance between camera and lookAt point.
 *
 * Strictly speaking this is not a zoom since the view angle remains
 * the same but the position changes, while for a real zoom the view
 * angle would change and the position remain.
 * 
 * @param {number} dy
 */
Camera.prototype.zoom = function(dy) {
  this.viewDist = this.viewDist * Math.pow(1.01, dy);
  this.viewMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, -this.viewDist,
    0, 0, 0, 1
  ];
  this.mvMatrix = mul4mm(this.viewMatrix, this.modelMatrix);
};

/** @constant @type {number} */
Camera.DOLLY_SENSITIVITY = 0.02;

/**
 * Move camera perpendicular to image plane.
 * In contrast to the zoom method above, this maintains the viewDist,
 * and therefore shifts the viewAt point along with the camera.
 *
 * @param {number} dy
 */
Camera.prototype.translateZ = function(dy) {
  let az = -Camera.DOLLY_SENSITIVITY*this.viewDist*dy;
  let m = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, az,
    0, 0, 0, 1];
  this.modelMatrix = mul4mm(m, this.modelMatrix);
  this.mvMatrix = mul4mm(this.viewMatrix, this.modelMatrix);
};

/**
 * Roll camera around viewing axis.
 *
 * @param {number} dy
 */
Camera.prototype.rotateZ = function(dy) {
  let a = Camera.ROTATE_SENSITIVITY*dy;
  let c = Math.cos(a), s = Math.sin(a);
  let m = [
    c, -s, 0, 0,
    s, c, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1];
  this.modelMatrix = mul4mm(m, this.modelMatrix);
  this.mvMatrix = mul4mm(this.viewMatrix, this.modelMatrix);
};
