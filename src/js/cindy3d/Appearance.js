/** @typedef {{color:Array.<number>, alpha:number, shininess:number, size:number}} */
let Appearance = {};

/** @typedef {{point:Appearance, line:Appearance, surface:Appearance}} */
Appearance.Triple;

/** @typedef {Array.<Appearance.Triple>} */
Appearance.Stack;

/**
 * Conversion factor from object size to world coordinates.
 * @const
 * @type {number}
 */
Appearance.POINT_SCALE = 0.05;

/**
 * @param {Array.<number>} color
 * @param {number} alpha
 * @param {number} shininess
 * @param {number} size
 * @return {Appearance}
 */
Appearance.createReal = function(color, alpha, shininess, size) {
  return {color: color, alpha: alpha, shininess: shininess, size: size};
};

/**
 * @param {Array.<number>} color
 * @param {number} alpha
 * @param {number} shininess
 * @param {number} size
 * @return {Appearance}
 */
Appearance.createScaled = function(color, alpha, shininess, size) {
  return {color: color, alpha: alpha, shininess: shininess,
          size: size * Appearance.POINT_SCALE};
};

/**
 * @param {Appearance} appearance
 * @return {Array.<number>}
 */
Appearance.colorWithAlpha = function(appearance) {
  let color = appearance.color;
  return [color[0], color[1], color[2], appearance.alpha];
};

/**
 * @param {Appearance} a
 * @return {Appearance}
 */
Appearance.clone = function(a) {
  return Appearance.createReal(a.color, a.alpha, a.shininess, a.size);
};

/**
 * @param {Appearance} p
 * @param {Appearance} l
 * @param {Appearance} s
 * @return {Appearance.Triple}
 */
Appearance.mkTriple = function(p, l, s) {
  return {
    point: Appearance.clone(p),
    line: Appearance.clone(l),
    surface: Appearance.clone(s)
  };
};
