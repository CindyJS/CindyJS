//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

function evaluate(a) {
  if (a === undefined) {
    return nada;
  }
  if (a.ctype === "infix") {
    return a.impl(a.args, {}, a);
  }
  if (a.ctype === "variable") {
    return evaluate(namespace.getvar(a.name));
  }
  if (a.ctype === "function") {
    callStack.push(a);
    a = eval_helper.evaluate(a.oper, a.args, a.modifs);
    callStack.pop();
    return a;
  }
  if (a.ctype === "void") {
    return nada;
  }
  if (a.ctype === "field") {
    var obj = evaluate(a.obj);
    if (obj.ctype === "geo") {
      return Accessor.getField(obj.value, a.key);
    }
    if (obj.ctype === "list") {
      return List.getField(obj, a.key);
    }
    if (obj.ctype === "JSON") {
      return Json.getField(obj, a.key);
    }
    return nada;
  }
  if (a.ctype === "userdata") {
    var uobj = evaluate(a.obj);
    var key = General.string(niceprint(evaluate(a.key)));
    if (key.value === "_?_") key = nada;

    if (uobj.ctype === "geo") {
      return Accessor.getuserData(uobj.value, key);
    }
    if (uobj.ctype === "list" || uobj.ctype === "string") {
      return Accessor.getuserData(uobj, key);
    }
    return nada;
  }
  return a;
}

function evaluateAndVal(a) {
  var x = evaluate(a);
  if (x.ctype === "geo") {
    var val = x.value;
    if (val.kind === "P") {
      return Accessor.getField(val, "xy");
    }
    if (val.kind === "V") {
      return val.value;
    }
  }
  return x; //TODO Implement this
}

function evaluateAndHomog(a) {
  var x = evaluate(a);
  if (x.ctype === "geo") {
    var val = x.value;
    if (val.kind === "P") {
      return Accessor.getField(val, "homog");
    }
    if (val.kind === "L") {
      return Accessor.getField(val, "homog");
    }
  }
  if (List._helper.isNumberVecN(x, 3)) {
    return x;
  }

  if (List._helper.isNumberVecN(x, 2)) {
    var y = List.turnIntoCSList([x.value[0], x.value[1], CSNumber.real(1)]);
    if (x.usage) y = General.withUsage(y, x.usage);
    return y;
  }

  return nada;
}

//*******************************************************
// this function shows an expression tree on the console
//*******************************************************

function report(a, i) {
  var prep = new Array(i + 1).join("."),
    els,
    j;
  if (a.ctype === "infix") {
    console.log(prep + "INFIX: " + a.oper);
    console.log(prep + "ARG 1 ");
    report(a.args[0], i + 1);
    console.log(prep + "ARG 2 ");
    report(a.args[1], i + 1);
  }
  if (a.ctype === "number") {
    console.log(prep + "NUMBER: " + CSNumber.niceprint(a));
  }
  if (a.ctype === "variable") {
    console.log(prep + "VARIABLE: " + a.name);
  }
  if (a.ctype === "undefined") {
    console.log(prep + "UNDEF");
  }
  if (a.ctype === "void") {
    console.log(prep + "VOID");
  }
  if (a.ctype === "string") {
    console.log(prep + "STRING: " + a.value);
  }
  if (a.ctype === "shape") {
    console.log(prep + "SHAPE: " + a.type);
  }
  if (a.ctype === "modifier") {
    console.log(prep + "MODIF: " + a.key);
  }
  if (a.ctype === "list") {
    console.log(prep + "LIST ");
    els = a.value;
    for (j = 0; j < els.length; j++) {
      console.log(prep + "EL" + j);
      report(els[j], i + 1);
    }
  }
  if (a.ctype === "function") {
    console.log(prep + "FUNCTION: " + a.oper);
    els = a.args;
    for (j = 0; j < els.length; j++) {
      console.log(prep + "ARG" + j);
      report(els[j], i + 1);
    }
    els = a.modifs;
    for (var name in els) {
      console.log(prep + "MODIF:" + name);
      report(els[name], i + 1);
    }
  }
  if (a.ctype === "error") {
    console.log(prep + "ERROR: " + a.message);
  }
}

var usedFunctions = {};

function analyse(code) {
  var parser = new Parser();
  parser.usedFunctions = usedFunctions;
  parser.infixmap = infixmap;
  var res = parser.parse(code);
  for (var name in parser.usedVariables) namespace.create(name);
  return res;
}

var callStack = [];

function labelCode(code, label) {
  function run() {
    return evaluate(code);
  }
  return {
    ctype: "infix",
    args: [],
    impl: function () {
      callStack = [
        {
          oper: label,
        },
      ];
      var res = evaluate(code);
      callStack = [];
      return res;
    },
  };
}

function printStackTrace(msg) {
  csconsole.err(
    msg +
      callStack
        .map(function (frame) {
          return "\n  at " + frame.oper;
        })
        .join("\n")
  );
}
