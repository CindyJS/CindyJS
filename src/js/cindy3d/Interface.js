//////////////////////////////////////////////////////////////////////
// Type coercion

let coerce = {};

/**
 * @param {createCindy.anyval} arg
 * @param {Array.<createCindy.anyval>=} def
 * @return {Array.<createCindy.anyval>}
 */
coerce.toList = function(arg, def=null) {
  if (arg["ctype"] !== "list") {
    console.log("argument is not a list");
    return def;
  }
  return /** @type {Array.<createCindy.anyval>} */(arg["value"]);
};

/**
 * @param {createCindy.anyval} arg
 * @param {Array.<number>=} def
 * @param {number=} dim
 * @return {Array.<number>}
 */
coerce.toHomog = function(arg, def=[0,0,0,0], dim=3) {
  let lst1 = coerce.toList(arg);
  if (lst1 === null)
    return def;
  let lst = lst1.map(coerce.toReal);
  if (lst.length > dim + 1) {
    console.log("Coordinate vector too long.");
    lst = lst.slice(0, dim + 1);
  }
  while (lst.length < dim)
    lst.push(0);
  if (lst.length === dim)
    lst.push(1);
  return lst;
};

/**
 * @param {createCindy.anyval} arg
 * @param {Array.<number>=} def
 * @return {Array.<number>}
 */
coerce.toDirection = function(arg, def=[0,0,0]) {
  let lst1 = coerce.toList(arg);
  if (lst1 === null)
    return def;
  let lst = lst1.map(coerce.toReal);
  if (lst.length > 3) {
    console.log("Coordinate vector too long.");
    lst = lst.slice(0, 3);
  }
  while (lst.length < 3)
    lst.push(0);
  return lst;
};

/**
 * @param {createCindy.anyval} arg
 * @param {Array.<number>=} def
 * @return {Array.<number>}
 */
coerce.toColor = function(arg, def=[0.5,0.5,0.5]) {
  if (arg.ctype === "number") {
    let c = coerce.toInterval(0, 1, arg);
    if (!isNaN(c))
      return [c, c, c];
  }
  let lst = coerce.toList(arg);
  if (lst === null)
    return def;
  if (lst.length != 3) {
    console.log("Not an RGB color vector");
    return def;
  }
  return lst.map(c => coerce.toInterval(0, 1, c));
};

/**
 * @param {createCindy.anyval} arg
 * @param {number=} def
 * @return {number}
 */
coerce.toReal = function(arg, def=Number.NaN) {
  if (arg["ctype"] !== "number") {
    console.log("argument is not a number");
    return def;
  }
  let val = arg["value"], r = val["real"], i = val["imag"];
  if (i !== 0)
    console.log("complex number is not real");
  return r;
};

/**
 * @param {createCindy.anyval} arg
 * @param {number=} def
 * @return {number}
 */
coerce.toInt = function(arg, def=Number.NaN) {
  if (arg["ctype"] !== "number") {
    console.log("argument is not a number");
    return def;
  }
  let val = arg["value"], r = val["real"], i = val["imag"];
  if (i !== 0)
    console.log("complex number is not real");
  i = Math.round(r);
  if (i !== r)
    console.log("number is not an integer");
  return i;
};

/**
 * @param {number} min
 * @param {number} max
 * @param {number} arg
 * @return {number}
 */
coerce.clamp = function(min, max, arg) {
  return (arg < min) ? min : ((arg > max) ? max : arg);
};

/**
 * @param {number} min
 * @param {number} max
 * @param {createCindy.anyval} arg
 * @param {number=} def
 * @return {number}
 */
coerce.toInterval = function(min, max, arg, def=Number.NaN) {
  return coerce.clamp(min, max, coerce.toReal(arg, def));
};

/**
 * @param {createCindy.anyval} arg
 * @param {?string=} def
 * @return {?string}
 */
coerce.toString = function(arg, def=null) {
  if (arg["ctype"] === "string")
    return arg["value"];
  console.log("argument is not a string");
  return def;
};

/**
 * @param {createCindy.anyval} arg
 * @param {?boolean} def
 * @return {?boolean}
 */
coerce.toBool = function(arg, def) {
  if (arg["ctype"] === "boolean")
    return arg["value"];
  console.log("argument is not boolean");
  return def;
};
