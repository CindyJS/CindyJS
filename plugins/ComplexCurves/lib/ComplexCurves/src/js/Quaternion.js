/**
 * @param {number} w
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @constructor
 */
function Quaternion(w, x, y, z) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
}

/** @return {number} */
Quaternion.prototype.abs = function() {
    var q = this;
    return Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
};

/**
 * @param {number} lat
 * @param {number} long
 * @return {Quaternion}
 */
Quaternion.fromLatLong = function(lat, long) {
    var theta = -lat / 2,
        phi = -long / 2,
        a = new Quaternion(Math.cos(theta), Math.sin(theta), 0, 0),
        b = new Quaternion(Math.cos(phi), 0, 0, Math.sin(phi));
    return Quaternion.mul(a, b);
};

/**
 * @param {Quaternion} a
 * @param {Quaternion} b
 * @param {number} t
 * @return {Quaternion}
 */
Quaternion.lerp = function(a, b, t) {
    return new Quaternion(
        Misc.lerp(a.w, b.w, t),
        Misc.lerp(a.x, b.x, t),
        Misc.lerp(a.y, b.y, t),
        Misc.lerp(a.z, b.z, t)
    );
};

/**
 * @param {Quaternion} a
 * @param {Quaternion} b
 * @return {Quaternion}
 */
Quaternion.mul = function(a, b) {
    return new Quaternion(
        a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
        a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
        a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
        a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w
    );
};

/**
 * @param {Quaternion} a
 * @param {Quaternion} b
 * @param {number} t
 * @return {Quaternion}
 */
Quaternion.nlerp = function(a, b, t) {
    return Quaternion.lerp(a, b, t).normalize();
};

/** @return {Quaternion} */
Quaternion.prototype.normalize = function() {
    var q = this,
        abs = q.abs();
    return new Quaternion(q.w / abs, q.x / abs, q.y / abs, q.z / abs);
};

/**
 * rotation matrix from quaternion, in column-major order
 * @return {Array<number>}
 */
Quaternion.prototype.rotationMatrix = function() {
    var w = this.w,
        x = this.x,
        y = this.y,
        z = this.z;
    return [w * w + x * x - y * y - z * z, 2 * x * y + 2 * w * z, 2 * x * z -
        2 * w * y, 0, 2 * x * y - 2 * w * z, w * w - x * x + y * y - z *
        z, 2 * y * z + 2 * w * x, 0, 2 * x * z + 2 * w * y, 2 * y * z -
        2 * w * x, w * w - x * x - y * y + z * z, 0, 0, 0, 0, w * w + x *
        x + y * y + z * z
    ];
};

/**
 * @param {Quaternion} a
 * @param {Quaternion} b
 * @return {Quaternion}
 */
Quaternion.sub = function(a, b) {
    return new Quaternion(a.w - b.w, a.x - b.x, a.y - b.y, a.z - b.z);
};
