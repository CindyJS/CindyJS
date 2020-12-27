/*
 * Dictionaries map CindyScript values to CindyScript values.
 * Since values are immutable and support equality testing,
 * they can be easily used as keys.
 *
 * Internally the map is an object with properties
 * whose names are stringified versions of the CindyScript keys.
 * The values are objects which hold the original key and value.
 * To keep overhead low, avoid deeply nested data structures as keys.
 */

var Dict = {};

Dict.key = function (x) {
  if (x.ctype === "string") return "s" + x.value.length + ":" + x.value + ";";
  if (x.ctype === "number")
    return "n" + x.value.real + "," + x.value.imag + ";";
  if (x.ctype === "list")
    return "l" + x.value.length + ":" + x.value.map(Dict.key).join(",") + ";";
  if (x.ctype === "boolean") return "b" + x.value + ";";
  if (x.ctype === "dict") {
    var keys = Object.keys(x.value).sort();
    return "d" + keys.length + ":" + keys.join(",") + ";";
  }
  if (x.ctype !== "undefined")
    csconsole.err("Bad dictionary key: " + niceprint(x));
  return "undef";
};

// Dictionary creation is a two-step process:
// one creates a dictionary (empty or cloned), then adds entries to it.
// During this process, the dictionary is considered mutable.
// But as for all other CindyJS data structures, once the construction
// is complete and other code gains access to the dictionary,
// the dictionary is considered immutable.

Dict.create = function () {
  return {
    ctype: "dict",
    value: {}, // or Map or Object.create(null)?
  };
};

Dict.clone = function (dict) {
  var res = Dict.create();
  for (var key in dict.value)
    if (dict.value.hasOwnProperty(key)) res.value[key] = dict.value[key];
  return res;
};

// Modifying operation
Dict.put = function (dict, key, value) {
  dict.value[Dict.key(key)] = {
    key: key,
    value: value,
  };
};

Dict.get = function (dict, key, dflt) {
  var kv = dict.value[Dict.key(key)];
  if (kv) return kv.value; // check kv.key?
  return dflt;
};

Dict.niceprint = function (dict) {
  return (
    "{" +
    Object.keys(dict.value)
      .sort()
      .map(function (key) {
        var kv = dict.value[key];
        return niceprint(kv.key) + ":" + niceprint(kv.value);
      })
      .join(", ") +
    "}"
  );
};
