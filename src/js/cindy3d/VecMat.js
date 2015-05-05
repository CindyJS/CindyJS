/**
 * @param {Array.<number>} v
 * @return {number}
 */
function norm3(v) {
  let x = v[0], y = v[1], z = v[2];
  return Math.sqrt(x*x + y*y + z*z);
}

/**
 * @param {Array.<number>} v
 * @return {Array.<number>}
 */
function normalized3(v) {
  let x = v[0], y = v[1], z = v[2];
  let f = 1/Math.sqrt(x*x + y*y + z*z);
  return [f*x, f*y, f*z];
}

/**
 * @param {Array.<number>} v
 * @return {Array.<number>}
 */
function dehom3(v) {
  let f = 1/v[3];
  return [f*v[0], f*v[1], f*v[2]];
}

/**
 * @param {number} f
 * @param {Array.<number>} v
 * @return {Array.<number>}
 */
function scale3(f, v) {
  return [f*v[0], f*v[1], f*v[2]];
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
function add3(a, b) {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
}

/**
 * @param {Array.<number>} a
 * @param {Array.<number>} b
 * @return {Array.<number>}
 */
function add4(a, b) {
  return [a[0]+b[0], a[1]+b[1], a[2]+b[2], a[3]+b[3]];
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
  let x = m[0]*v[0] + m[1]*v[1] + m[2]*v[2] + m[3]*v[3];
  let y = m[4]*v[0] + m[5]*v[1] + m[6]*v[2] + m[7]*v[3];
  let z = m[8]*v[0] + m[9]*v[1] + m[10]*v[2] + m[11]*v[3];
  let f = 1/(m[12]*v[0] + m[13]*v[1] + m[14]*v[2] + m[15]*v[3]);
  return [x*f, y*f, z*f];
}
