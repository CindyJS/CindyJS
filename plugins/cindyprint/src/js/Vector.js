/**
 * A three-dimensional vector/point.
 * @param {number} x The x coordinate of the vector.
 * @param {number} y The y coordinate of the vector.
 * @param {number} z The z coordinate of the vector.
 */
function vec3(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}

/**
 * Sets the coordinates of the vector object.
 * @param {number} x The x coordinate to set.
 * @param {number} y The y coordinate to set.
 * @param {number} z The z coordinate to set.
 */
vec3.prototype.set = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

/**
 * @return Computes the sum of the passed vectors.
 */
function vec3add(p, q) {
    return new vec3(p.x + q.x, p.y + q.y, p.z + q.z);
}

/**
 * @return Computes the difference between the passed vectors.
 */
function vec3sub(p, q) {
    return new vec3(p.x - q.x, p.y - q.y, p.z - q.z);
}

/**
 * @return Computes the product of the vector and a scalar.
 */
function vec3mul(a, p) {
    return new vec3(p.x * a, p.y * a, p.z * a);
}

/**
 * @return Divides the vector by a scalar.
 */
function vec3div(a, p) {
    return new vec3(p.x / a, p.y / a, p.z / a);
}

/**
 * @return Computes the squared length of the passed vector.
 */
function vec3lengthsq(p) {
    return p.x * p.x + p.y * p.y + p.z * p.z;
}

/**
 * @return Computes the length of the passed vector.
 */
function vec3length(p) {
    return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
}

/**
 * @return Computes the dot product between the passed vectors.
 */
function vec3dot(p, q) {
    return p.x * q.x + p.y * q.y + p.z * q.z;
}

/**
 * @return Computes the cross product between the passed vectors.
 */
function vec3cross(p, q) {
    return new vec3(p.y * q.z - p.z * q.y, p.z * q.x - p.x * q.z, p.x * q.y - p.y * q.x);
}

/**
 * @return The normalized vector.
 */
function vec3normalize(p) {
    return vec3mul(1.0 / vec3length(p), p);
}

/**
 * @param {Object} cindyvec A vector from CindyScript.
 * @return {vec3} The vec3 object.
 */
function cindyscriptToVec3(cindyvec) {
    return new vec3(cindyvec.value[0].value.real, cindyvec.value[1].value.real, cindyvec.value[2].value.real);
}

/**
 * @param {vec3} v A vec3 object.
 * @return {number[]} A list of the x, y and z position of the vector.
 */
function vec3tolist(v) {
    return [v.x, v.y, v.z];
}
