/** @constructor */
function State3D() {}

/** @type {boolean} */
State3D.prototype.autorotate = false;

/** @type {Array<number>} */
State3D.prototype.mouseCoord = [0, 0];

/** @type {boolean} */
State3D.prototype.ortho = false;

/** @type {boolean} */
State3D.prototype.rotating = false;

/** @type {Quaternion} */
State3D.prototype.rotation = Quaternion.fromLatLong(0, 0);

/** @type {boolean} */
State3D.prototype.rotationEasing = true;

/** @type {Quaternion} */
State3D.prototype.target0 = Quaternion.fromLatLong(0, 0);

/** @type {Quaternion} */
State3D.prototype.target1 = Quaternion.fromLatLong(0, 0);

/** @type {boolean} */
State3D.prototype.twoD = false;

/** @type {number} */
State3D.prototype.zoomFactor = 1;

/** @return {Array<number>} */
State3D.identityMatrix = function() {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

/** @return {boolean} */
State3D.prototype.isRotating = function() {
    return this.autorotate || this.rotating ||
        Quaternion.sub(this.rotation, this.target1).abs() > 1e-6;
};

/**
 * @param {number} theta
 * @param {number} phi
 * @param {boolean} ortho
 * @return {State3D}
 */
State3D.fromLatLong = function(theta, phi, ortho) {
    var q = Quaternion.fromLatLong(theta, phi),
        st = new State3D();
    st.ortho = ortho;
    st.rotation = st.target0 = st.target1 = q;
    return st;
};

/** @type {function(boolean) : State3D} */
State3D.backView = State3D.fromLatLong.bind(null, Math.PI / 2, Math.PI);
/** @type {function(boolean) : State3D} */
State3D.frontView = State3D.fromLatLong.bind(null, Math.PI / 2, 0);
/** @type {function(boolean) : State3D} */
State3D.topView = State3D.fromLatLong.bind(null, 0, 0);
/** @type {function(boolean) : State3D} */
State3D.bottomView = State3D.fromLatLong.bind(null, Math.PI, 0);
/** @type {function(boolean) : State3D} */
State3D.leftView = State3D.fromLatLong.bind(null, Math.PI / 2, -Math.PI / 2);
/** @type {function(boolean) : State3D} */
State3D.rightView = State3D.fromLatLong.bind(null, Math.PI / 2, Math.PI / 2);
/**
 * @param {number} lat
 * @param {number} lon
 * @param {boolean} ortho
 * @return {State3D}
 */
State3D.fromLatLongDegrees = function(lat, lon, ortho) {
    var piOver180 = Math.PI / 180;
    return State3D.fromLatLong(lat * piOver180, lon * piOver180, ortho);
};
/** @return {State3D} */
State3D.twoDimensionalView = function() {
    var st = State3D.topView(true);
    st.twoD = true;
    return st;
};

/** @return {Array<number>} */
State3D.prototype.modelMatrix = function() {
    return this.rotation.rotationMatrix();
};

/** @param {Array<number>} xy */
State3D.prototype.mouseDown = function(xy) {
    if (this.autorotate)
        return;
    this.mouseCoord = xy;
    this.rotating = true;
    this.target0 = this.target1;
};

/**
 * @param {number} x
 * @param {number} y
 */
State3D.prototype.mouseMove = function(x, y) {
    if (!(this.rotating))
        return;
    var xy = this.mouseCoord,
        xo = xy[0],
        yo = xy[1],
        dx = x - xo,
        dy = yo - y,
        dr = Math.sqrt(dx * dx + dy * dy),
        q = this.target0,
        r = 100,
        cost = r / Math.sqrt(r * r + dr * dr),
        sint = dr / Math.sqrt(r * r + dr * dr),
        q2 = Quaternion.mul(new Quaternion(cost, -sint * dy, sint * dx, 0),
            q);
    this.target1 = Quaternion.nlerp(q, q2, 0.05);
};

State3D.prototype.mouseUp = function() {
    this.mouseCoord = [0, 0];
    this.rotating = false;
};

/** @param {number} direction */
State3D.prototype.mouseWheel = function(direction) {
    if (direction > 0)
        this.zoomOut();
    else
        this.zoomIn();
};

/**
 * orthographic projection matrix, in column-major order
 * @param {number} width
 * @param {number} height
 * @param {number} zoom
 * @return {Array<number>}
 */
State3D.orthographicProjectionMatrix = function(width, height, zoom) {
    var bottom = -7.5 * zoom,
        left = -7.5 * zoom,
        right = 7.5 * zoom,
        top = 7.5 * zoom,
        zFar = 100,
        zNear = -100,
        s1 = Math.min(height / width, 1),
        s2 = Math.min(width / height, 1);
    return [s1 * 2 / (right - left), 0, 0, 0, 0, s2 * 2 / (top - bottom), 0,
        0, 0, 0, -2 / (zFar - zNear), 0, -s1 * (right + left) / (right -
            left), -s2 * (top + bottom) / (top - bottom), -(zFar +
            zNear) / (zFar - zNear), 1
    ];
};

/**
 * perspective projection matrix, in column-major order
 * @param {number} width
 * @param {number} height
 * @param {number} zoom
 * @return {Array<number>}
 */
State3D.perspectiveProjectionMatrix = function(width, height, zoom) {
    var zFar = 100,
        zNear = 1,
        aspect = height > 0 ? width / height : width;
    var fovy = 45 * zoom,
        f = 1 / Math.tan(fovy / 2 * Math.PI / 180);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (zFar +
            zNear) / (zNear - zFar), -1, 0, 0, 2 * zFar *
        zNear / (zNear - zFar), 0
    ];
};

/**
 * @param {number} w
 * @param {number} h
 * @return {Array<number>}
 */
State3D.prototype.projectionMatrix = function(w, h) {
    if (this.ortho)
        return State3D.orthographicProjectionMatrix(w, h, this.zoomFactor);
    else if (this.twoD)
        return State3D.identityMatrix();
    else
        return State3D.perspectiveProjectionMatrix(w, h, this.zoomFactor);
};

/** @param {boolean} autorotate */
State3D.prototype.setAutorotate = function(autorotate) {
    this.autorotate = autorotate;
};

/** @param {boolean} ortho */
State3D.prototype.setOrtho = function(ortho) {
    this.ortho = ortho;
};

/** @param {boolean} twoD */
State3D.prototype.setTwoD = function(twoD) {
    this.twoD = twoD;
};

State3D.prototype.toggleAutorotate = function() {
    this.autorotate = !this.autorotate;
};

State3D.prototype.toggleOrtho = function() {
    this.ortho = !this.ortho;
};

State3D.prototype.toggleTwoD = function() {
    this.twoD = !this.twoD;
};

State3D.prototype.updateRotation = function() {
    if (this.autorotate) {
        var q = new Quaternion(0.01, 0, 0, 1).normalize();
        q = Quaternion.mul(q, q);
        this.rotation = this.target1 = Quaternion.mul(this.rotation, q);
    } else if (this.rotationEasing) {
        this.rotation = Quaternion.nlerp(this.rotation, this.target1, 0.1);
    } else {
        this.rotation = this.target1;
    }
};

/** @param {number} z */
State3D.prototype.updateZoom = function(z) {
    this.zoomFactor = z;
};

/** @return {Array<number>} */
State3D.prototype.viewMatrix = function() {
    if (this.ortho || this.twoD)
        return State3D.identityMatrix();
    else
        return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -20, 1];
};

State3D.prototype.zoomIn = function() {
    this.updateZoom(Math.max(0.5, this.zoomFactor - 0.1));
};

State3D.prototype.zoomOut = function() {
    this.updateZoom(Math.min(4, this.zoomFactor + 0.1));
};
