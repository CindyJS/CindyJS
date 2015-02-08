//////////////////////////////////////////////////////////////////////
// Initialization and Execution

defOp("begin3d", 0, function(args, modifs) {
  let name = "Cindy3D";
  handleModifs(modifs, {
    "name": (a => name = /** @type {string} */(coerce.toString(a, name)))
  });
  currentInstance = instances[name];
  if (!currentInstance) {
    instances[name] = currentInstance = new Viewer(name);
  }
  return nada;
});

defOp("end3d", 0, function(args, modifs) {
  currentInstance.render();
  currentInstance = null;
  return nada;
});

//////////////////////////////////////////////////////////////////////
// Object appearance

defOp("gsave3d", 0, function(args, modifs) {
  currentInstance.appearanceStack.push(
    Appearance.mkTriple(
      currentInstance.pointAppearance,
      currentInstance.lineAppearance,
      currentInstance.surfaceAppearance));
  return nada;
});

defOp("grestore3d", 0, function(args, modifs) {
  let s = currentInstance.appearanceStack;
  if (s.length > 0) {
    /** @type {Appearance.Triple} */ let t = s.pop();
    currentInstance.pointAppearance = t.point;
    currentInstance.lineAppearance = t.line;
    currentInstance.surfaceAppearance = t.surface;
  }
  else {
    /** @type {Appearance.Triple} */ let t = Viewer.defaultAppearances;
    currentInstance.pointAppearance = Appearance.clone(t.point);
    currentInstance.lineAppearance = Appearance.clone(t.line);
    currentInstance.surfaceAppearance = Appearance.clone(t.surface);
  }
  return nada;
});

defOp("color3d", 1, function(args, modifs) {
  let color = coerce.toColor(evaluate(args[0]), null);
  if (color) {
    currentInstance.pointAppearance.color = color;
    currentInstance.lineAppearance.color = color;
    currentInstance.surfaceAppearance.color = color;
  }
  return nada;
});

defOp("pointcolor3d", 1, function(args, modifs) {
  let color = coerce.toColor(evaluate(args[0]), null);
  if (color) {
    currentInstance.pointAppearance.color = color;
  }
  return nada;
});

defOp("linecolor3d", 1, function(args, modifs) {
  let color = coerce.toColor(evaluate(args[0]), null);
  if (color) {
    currentInstance.lineAppearance.color = color;
  }
  return nada;
});

defOp("surfacecolor3d", 1, function(args, modifs) {
  let color = coerce.toColor(evaluate(args[0]), null);
  if (color) {
    currentInstance.surfaceAppearance.color = color;
  }
  return nada;
});

function surfacealpha3d(args, modifs) {
  currentInstance.surfaceAppearance.alpha =
    coerce.toInterval(0, 1, evaluate(args[0]), 1);
  return nada;
}
defOp("alpha3d", 1, surfacealpha3d);
defOp("surfacealpha3d", 1, surfacealpha3d);

defOp("size3d", 1, function(args, modifs) {
  let size = coerce.toReal(evaluate(args[0]), -1) * Appearance.POINT_SCALE;
  if (size >= 0) {
    currentInstance.pointAppearance.size = size;
    currentInstance.lineAppearance.size = size;
  }
  return nada;
});

defOp("pointsize3d", 1, function(args, modifs) {
  let size = coerce.toReal(evaluate(args[0]), -1) * Appearance.POINT_SCALE;
  if (size >= 0) {
    currentInstance.pointAppearance.size = size;
  }
  return nada;
});

defOp("linesize3d", 1, function(args, modifs) {
  let size = coerce.toReal(evaluate(args[0]), -1) * Appearance.POINT_SCALE;
  if (size >= 0) {
    currentInstance.lineAppearance.size = size;
  }
  return nada;
});

//////////////////////////////////////////////////////////////////////
// Drawing

defOp("draw3d", 1, function(args, modifs) {
  let pos = coerce.toHomog(evaluate(args[0]));
  let appearance = handleModifsAppearance(
    currentInstance.pointAppearance, modifs);
  currentInstance.spheres.add(
    pos, appearance.size,
    Appearance.colorWithAlpha(appearance));
  return nada;
});

defOp("draw3d", 2, function(args, modifs) {
  let pos1 = coerce.toHomog(evaluate(args[0]));
  let pos2 = coerce.toHomog(evaluate(args[1]));
  let appearance = handleModifsAppearance(
    currentInstance.lineAppearance, modifs);
  currentInstance.cylinders.add(
    pos1, pos2, appearance.size,
    Appearance.colorWithAlpha(appearance));
  return nada;
});

defOp("drawsphere3d", 2, function(args, modifs) {
  let pos = coerce.toHomog(evaluate(args[0]));
  let radius = coerce.toReal(evaluate(args[1]));
  let appearance = handleModifsAppearance(
    currentInstance.surfaceAppearance, modifs);
  currentInstance.spheres.add(
    pos, radius, Appearance.colorWithAlpha(appearance));
  return nada;
});

//////////////////////////////////////////////////////////////////////
// Lighting and scene appearance

defOp("background3d", 1, function(args, modifs) {
  let color = coerce.toColor(evaluate(args[0]), null);
  if (color) {
    color.push(1);
    currentInstance.backgroundColor = color;
  }
  return nada;
});
