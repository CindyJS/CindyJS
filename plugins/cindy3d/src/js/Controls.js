/**
 * @param {td.EventManager} addEventListener
 * @param {HTMLCanvasElement} canvas
 * @param {Camera} camera
 * @param {Viewer} viewer
 * @constructor
 * @struct
 */
function Controls(addEventListener, canvas, camera, viewer) {
  this.canvas = canvas;
  this.camera = camera;
  this.viewer = viewer;
  this.mx = Number.NaN;
  this.my = Number.NaN;
  this.mdown = false;
  this.touches = new Map();
  addEventListener(canvas, "mousedown", this.mousedown.bind(this));
  addEventListener(canvas, "mousemove", this.mousemove.bind(this));
  addEventListener(canvas, "mouseup", this.mouseup.bind(this));
  addEventListener(canvas, "mouseleave", this.mouseleave.bind(this));
  addEventListener(canvas, "wheel", this.wheel.bind(this));
  addEventListener(canvas, "touchstart", this.touchstart.bind(this));
  addEventListener(canvas, "touchend", this.touchend.bind(this));
  addEventListener(canvas, "touchcancel", this.touchcancel.bind(this));
  addEventListener(canvas, "touchmove", this.touchmove.bind(this));
}

/** @type {HTMLElement} */
Controls.prototype.canvas;

/** @type {Camera} */
Controls.prototype.camera;

/** @type {Viewer} */
Controls.prototype.viewer;

/** @type {number} */
Controls.prototype.mx;

/** @type {number} */
Controls.prototype.my;

/** @type {boolean} */
Controls.prototype.mdown;

/** @typedef {{x: number, y: number}} */
Controls.TouchInfo;

/** @type {Map<number, Controls.TouchInfo>} */
Controls.prototype.touches;

/**
 * @param {Event} evnt
 */
Controls.prototype.mousedown = function(/** MouseEvent */ evnt) {
  if (evnt.button === 0) {
    this.mdown = true;
  }
  if (evnt.buttons === undefined ? this.mdown : (evnt.buttons & 1)) {
    this.mx = evnt.clientX;
    this.my = evnt.clientY;
  }
};

/**
 * @param {Event} evnt
 */
Controls.prototype.mousemove = function(/** MouseEvent */ evnt) {
  if (evnt.buttons === undefined ? this.mdown : (evnt.buttons & 1)) {
    if (!isNaN(this.mx)) {
      let dx = evnt.clientX - this.mx, dy = evnt.clientY - this.my;
      if (evnt.shiftKey)
        this.camera.rotateXY(dx, dy);
      else if (evnt.altKey || evnt.ctrlKey || evnt.metaKey)
        this.camera.translateXY(dx, dy);
      else
        this.camera.orbitXY(dx, dy);
      this.viewer.render();
    }
    this.mx = evnt.clientX;
    this.my = evnt.clientY;
  }
};

/**
 * @param {Event} evnt
 */
Controls.prototype.mouseup = function(/** MouseEvent */ evnt) {
  if (evnt.button === 0) this.mdown = false;
};

/**
 * @param {Event} evnt
 */
Controls.prototype.mouseleave = function(/** MouseEvent */ evnt) {
  this.mdown = false;
  this.mx = this.my = Number.NaN;
};

/**
 * @param {Event} evnt
 */ 
Controls.prototype.wheel = function(/** WheelEvent */ evnt) {
  let d = evnt.deltaY;
  if (d) {
    if (evnt.shiftKey)
      this.camera.rotateZ(Camera.ROTATE_SENSITIVITY*d);
    else if (evnt.altKey || evnt.ctrlKey || evnt.metaKey)
      this.camera.translateZ(d);
    else
      this.camera.zoom(d);
    this.viewer.render();
  }
  evnt.preventDefault();
};

/**
 * @param {Event} evnt
 */ 
Controls.prototype.touchstart = function(/** TouchEvent */ evnt) {
  evnt.preventDefault();
  let /** TouchList */ ts = evnt.changedTouches;
  for (let i = 0; i < ts.length; ++i) {
    let /** Touch */ t = ts[i];
    this.touches.set(t.identifier, { x: t.clientX, y: t.clientY });
  }
};

/**
 * @param {Event} evnt
 */ 
Controls.prototype.touchend = function(/** TouchEvent */ evnt) {
  evnt.preventDefault();
  let /** TouchList */ ts = evnt.changedTouches;
  for (let i = 0; i < ts.length; ++i)
    this.touches.delete(ts[i].identifier);
};

/**
 * @param {Event} evnt
 */ 
Controls.prototype.touchcancel = function(/** TouchEvent */ evnt) {
  evnt.preventDefault();
  let /** TouchList */ ts = evnt.changedTouches;
  for (let i = 0; i < ts.length; ++i)
    this.touches.delete(ts[i].identifier);
};

/**
 * @param {Event} evnt
 */ 
Controls.prototype.touchmove = function(/** TouchEvent */ evnt) {
  evnt.preventDefault();
  let /** TouchList */ ts = evnt.targetTouches;
  if (ts.length === 1) {
    this.singleDrag(ts[0]);
  } else if (ts.length === 2) {
    this.doubleDrag(ts[0], ts[1]);
  }
  ts = evnt.changedTouches;
  for (let i = 0; i < ts.length; ++i) {
    let /** Touch */ cur = ts[i];
    let /** Controls.TouchInfo */ prev = this.touches.get(cur.identifier);
    prev.x = cur.clientX;
    prev.y = cur.clientY;
  }
};

/**
 * @param {Touch} cur
 */
Controls.prototype.singleDrag = function(cur) {
  let /** Controls.TouchInfo */ prev = this.touches.get(cur.identifier);
  let dx = cur.clientX - prev.x;
  let dy = cur.clientY - prev.y;
  this.camera.orbitXY(dx, dy);
  this.viewer.render();
};

/**
 * @param {Touch} cur1
 * @param {Touch} cur2
 */
Controls.prototype.doubleDrag = function(cur1, cur2) {
  let /** Controls.TouchInfo */ prev1 = this.touches.get(cur1.identifier);
  let /** Controls.TouchInfo */ prev2 = this.touches.get(cur2.identifier);
  let rect = this.canvas.getBoundingClientRect();
  let ctrX = this.canvas.clientLeft + rect.left + this.camera.width * 0.5;
  let ctrY = this.canvas.clientTop + rect.top + this.camera.height * 0.5;
  let cx = (prev1.x + prev2.x + 1) * 0.5;
  let cy = (prev1.y + prev2.y + 1) * 0.5;
  this.camera.translateXY(ctrX - cx, ctrY - cy);
  let dx = prev1.x - prev2.x;
  let dy = prev1.y - prev2.y;
  let prevDist = Math.hypot(dx, dy);
  let prevAngle = Math.atan2(dy, dx);
  cx = (cur1.clientX + cur2.clientX + 1) * 0.5;
  cy = (cur1.clientY + cur2.clientY + 1) * 0.5;
  dx = cur1.clientX - cur2.clientX;
  dy = cur1.clientY - cur2.clientY;
  let curDist = Math.hypot(dx, dy);
  let curAngle = Math.atan2(dy, dx);
  this.camera.zoom(prevDist - curDist);
  this.camera.rotateZ(prevAngle - curAngle);
  this.camera.translateXY(cx - ctrX, cy - ctrY);
  this.viewer.render();
};
