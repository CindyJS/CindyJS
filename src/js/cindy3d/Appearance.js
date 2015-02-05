/** @typedef {{color:Array.<number>, alpha:number, shininess:number, size:number}} */
var Appearance = {};

/** @typedef {Array.<Appearance>} */
Appearance.Stack;

/**
 * @param {Array.<number>} color
 * @param {number} alpha
 * @param {number} shininess
 * @param {number} size
 * @return {Appearance}
 */
Appearance.create = function(color, alpha, shininess, size) {
  return {color: color, alpha: alpha, shininess: shininess, size: size};
};

/**
 * @param {Appearance} old
 * @param {Array.<number>} color
 * @return {Appearance}
 */
Appearance.withColor = function(old, color) {
  return {color: color, alpha: old.alpha,
          shininess: old.shininess, size: old.size};
};

/**
 * @param {Appearance} old
 * @param {number} alpha
 * @return {Appearance}
 */
Appearance.withAlpha = function(old, alpha) {
  return {color: old.color, alpha: alpha,
          shininess: old.shininess, size: old.size};
};

/**
 * @param {Appearance} old
 * @param {number} shininess
 * @return {Appearance}
 */
Appearance.withShininess = function(old, shininess) {
  return {color: old.color, alpha: old.alpha,
          shininess: shininess, size: old.size};
};

/**
 * @param {Appearance} old
 * @param {number} size
 * @return {Appearance}
 */
Appearance.withSize = function(old, size) {
  return {color: old.color, alpha: old.alpha,
          shininess: old.shininess, size: size};
};

/**
 * @param {Appearance} appearance
 * @return {Array.<number>}
 */
Appearance.colorWithAlpha = function(appearance) {
  var color = appearance.color;
  return [color[0], color[1], color[2], appearance.alpha];
};
