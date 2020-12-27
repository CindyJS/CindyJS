var Vector = function (x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
};

var VectorOperations = {};
VectorOperations.DOUBLE_PRECISION = 2.2204460492503131e-16;

VectorOperations.add = function (vector1, vector2) {
    return new Vector(vector1.x + vector2.x, vector1.y + vector2.y, vector1.z + vector2.z);
};

VectorOperations.sub = function (vector1, vector2) {
    return new Vector(vector1.x - vector2.x, vector1.y - vector2.y, vector1.z - vector2.z);
};

VectorOperations.scalmult = function (s, vector) {
    return new Vector(s * vector.x, s * vector.y, s * vector.z);
};

VectorOperations.scaldiv = function (s, vector) {
    return new Vector(vector.x / s, vector.y / s, vector.z / s);
};

VectorOperations.abs2 = function (vector) {
    return vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
};

VectorOperations.abs = function (vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
};

VectorOperations.distance2 = function (vector1, vector2) {
    var dx = vector1.x - vector2.x;
    var dy = vector1.y - vector2.y;
    var dz = vector1.z - vector2.z;

    return dx * dx + dy * dy + dz * dz;
};

VectorOperations.distance = function (vector1, vector2) {
    var dx = vector1.x - vector2.x;
    var dy = vector1.y - vector2.y;
    var dz = vector1.z - vector2.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

VectorOperations.normalize = function (vector) {
    var length2 = vector.x * vector.x + vector.y * vector.y + vector.z * vector.z;
    var precision = 2 * VectorOperations.DOUBLE_PRECISION;
    var error = length2 - 1;
    var length;

    if (error > precision || error < -2 * precision) {
        length = Math.sqrt(length2);

        return new Vector(vector.x / length, vector.y / length, vector.z / length);
    }

    return new Vector(vector.x, vector.y, vector.z);
};

VectorOperations.scalproduct = function (v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

VectorOperations.cross = function (v1, v2) {
    return new Vector(v1.y * v2.z - v1.z * v2.y, v1.z * v2.x - v1.x * v2.z, v1.x * v2.y - v1.y * v2.x);
};

VectorOperations.zerovector = function () {
    return new Vector(0, 0, 0);
};

VectorOperations.copy = function (vector) {
    return new Vector(vector.x, vector.y, vector.z);
};
