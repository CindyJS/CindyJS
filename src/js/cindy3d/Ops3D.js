//////////////////////////////////////////////////////////////////////
// Now come the operators

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

defOp("drawsphere3d", 2, function(args, modifs) {
  let pos = coerce.toHomog(evaluate(args[0]));
  let radius = coerce.toReal(evaluate(args[1]));
  let appearance = handleModifsAppearance(
    currentInstance.surfaceAppearance, modifs);
  currentInstance.spheres.add(
    pos, radius, Appearance.colorWithAlpha(appearance));
  return nada;
});

defOp("draw3d", 1, function(args, modifs) {
  let pos = coerce.toHomog(evaluate(args[0]));
  let appearance = handleModifsAppearance(
    currentInstance.pointAppearance, modifs);
  currentInstance.spheres.add(
    pos, appearance.size * POINT_SCALE,
    Appearance.colorWithAlpha(appearance));
  return nada;
});

defOp("draw3d", 2, function(args, modifs) {
  let pos1 = coerce.toHomog(evaluate(args[0]));
  let pos2 = coerce.toHomog(evaluate(args[1]));
  let appearance = handleModifsAppearance(
    currentInstance.lineAppearance, modifs);
  currentInstance.cylinders.add(
    pos1, pos2, appearance.size * POINT_SCALE,
    Appearance.colorWithAlpha(appearance));
  return nada;
});

defOp("background3d", 1, function(args, modifs) {
  let color = coerce.toColor(evaluate(args[0]), null);
  if (color) {
    color.push(1);
    currentInstance.backgroundColor = color;
  }
  return nada;
});

defOp("alpha3d", 1, function(args, modifs) {
  currentInstance.surfaceAppearance.alpha =
    coerce.toInterval(0, 1, evaluate(args[0]), 1);
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

defOp("size3d", 1, function(args, modifs) {
  let size = coerce.toReal(evaluate(args[0]), -1);
  if (size >= 0) {
    currentInstance.pointAppearance.size = size;
    currentInstance.lineAppearance.size = size;
    currentInstance.surfaceAppearance.size = size;
  }
  return nada;
});
