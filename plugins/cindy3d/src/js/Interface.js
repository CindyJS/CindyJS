//////////////////////////////////////////////////////////////////////
// Type coercion

let coerce = {};

/**
 * @param {CindyJS.anyval} arg
 * @param {Array.<CindyJS.anyval>=} def
 * @return {Array.<CindyJS.anyval>}
 */
coerce.toList = function(arg, def=null) {
  if (arg["ctype"] !== "list") {
    console.log("argument is not a list");
    return def;
  }
  return /** @type {Array.<CindyJS.anyval>} */(arg["value"]);
};

/**
 * @param {CindyJS.anyval} arg
 * @param {Array.<number>=} def
 * @return {Array.<number>}
 */
coerce.toHomog = function(arg, def=[0,0,0,0]) {
  let lst1 = coerce.toList(arg);
  if (lst1 === null)
    return def;
  let lst = lst1.map(coerce.toReal);
  if (lst.length > 4) {
    console.log("Coordinate vector too long.");
    lst = lst.slice(0, 4);
  }
  while (lst.length < 3)
    lst.push(0);
  if (lst.length === 3)
    lst.push(1);
  return lst;
};

/**
 * @param {CindyJS.anyval} arg
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
 * @param {CindyJS.anyval} arg
 * @param {Array.<number>=} def
 * @return {Array.<number>}
 */
coerce.toDirectionPoint = function(arg, def=[0,0,0,0]) {
  let lst = coerce.toDirection(arg, def);
  if (lst !== def) lst[3] = 0;
  return lst;
}

/**
 * @param {CindyJS.anyval} arg
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
 * @param {CindyJS.anyval} arg
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
 * @param {CindyJS.anyval} arg
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
 * @param {CindyJS.anyval} arg
 * @param {number=} def
 * @return {number}
 */
coerce.toInterval = function(min, max, arg, def=Number.NaN) {
  return coerce.clamp(min, max, coerce.toReal(arg, def));
};

/**
 * @param {CindyJS.anyval} arg
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
 * @param {Array.<?string>} names
 * @param {CindyJS.anyval} arg
 * @param {?string=} def
 * @return {?string}
 */
coerce.toEnum = function(names, arg, def=null) {
  let str = coerce.toString(arg, def);
  if (str !== def && names.indexOf(str) !== -1)
    return str;
  console.log("argument is not one of " + names.join(", "));
  return def;
};

/**
 * @param {CindyJS.anyval} arg
 * @param {?boolean} def
 * @return {?boolean}
 */
coerce.toBool = function(arg, def) {
  if (arg["ctype"] === "boolean")
    return arg["value"];
  console.log("argument is not boolean");
  return def;
};
