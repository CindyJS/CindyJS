//////////////////////////////////////////////////////////////////////
// Global variables

let instances = {};
let currentInstance;

//////////////////////////////////////////////////////////////////////
// Defining operators

/**
 * @param {string} name
 * @param {number} arity
 * @param {cjsType.op} impl
 */
function defOp(name, arity, impl) {
  /** @type {?cjsType.op} */
  let old = evaluator[name];

  /** @type {cjsType.op}  */
  let chain = function(args, modifs) {
    if (args.length === arity)
      return impl(args, modifs);
    else if (old)
      return old(args, modifs);
    else
      throw "No implementation for " + name + "(" + arity + ")";
  };

  evaluator[name] = chain;
}

//////////////////////////////////////////////////////////////////////
// Type coercion

let coerce = {};

/**
 * @param {cjsType.anyval} arg
 * @param {Array.<cjsType.anyval>=} def
 * @return {Array.<cjsType.anyval>}
 */
coerce.toList = function(arg, def=null) {
  if (arg["ctype"] !== "list") {
    console.log("argument is not a list");
    return def;
  }
  return /** @type {Array.<cjsType.anyval>} */(arg["value"]);
};

/**
 * @param {cjsType.anyval} arg
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
 * @param {cjsType.anyval} arg
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
 * @param {cjsType.anyval} arg
 * @param {Array.<number>=} def
 * @return {Array.<number>}
 */
coerce.toColor = function(arg, def=[0.5,0.5,0.5]) {
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
 * @param {cjsType.anyval} arg
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
 * @param {cjsType.anyval} arg
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
 * @param {cjsType.anyval} arg
 * @param {number=} def
 * @return {number}
 */
coerce.toInterval = function(min, max, arg, def=Number.NaN) {
  return coerce.clamp(min, max, coerce.toReal(arg, def));
};

/**
 * @param {cjsType.anyval} arg
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
 * @param {cjsType.anyval} arg
 * @param {?boolean} def
 * @return {?boolean}
 */
coerce.toBool = function(arg, def) {
  if (arg["ctype"] === "boolean")
    return arg["value"];
  console.log("argument is not boolean");
  return def;
};

//////////////////////////////////////////////////////////////////////
// Modifier handling

/**
 * @param {Object} modifs
 * @param {Object} handlers
 */
function handleModifs(modifs, handlers) {
  let key, handler;
  for (key in modifs) {
    handler = handlers[key];
    if (handler)
      handler(evaluate(modifs[key]));
    else
      console.log("Modifier " + key + " not supported");
  }
}

/**
 * @param {Appearance} appearance
 * @param {Object} modifs
 * @param {Object=} handlers
 * @return {Appearance}
 */
function handleModifsAppearance(appearance, modifs, handlers = null) {
  let color = appearance.color;
  let alpha = appearance.alpha;
  let shininess = appearance.shininess;
  let size = appearance.size;
  let combined = {
    "color": (a => color = coerce.toColor(a)),
    "alpha": (a => alpha = coerce.toInterval(0, 1, a)),
    "shininess": (a => shininess = coerce.toInterval(0, 128, a)),
    "size": (a => size = coerce.toReal(a) * Appearance.POINT_SCALE),
  };
  let key;
  if (handlers)
    for (key in handlers)
      combined[key] = handlers[key];
  handleModifs(modifs, combined);
  return Appearance.createReal(color, alpha, shininess, size);
}
