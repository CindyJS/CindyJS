//////////////////////////////////////////////////////////////////////
// Now come the operators

defOp("begin3d", 0, function(args, modifs) {
  var name = "Cindy3D";
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
  var pos = coerce.toHomog(evaluate(args[0]));
  var radius = coerce.toReal(evaluate(args[1]));
  var appearanceStack = currentInstance.surfaceAppearance;
  var appearance = handleModifsAppearance(appearanceStack, modifs);
  currentInstance.spheres.add(pos, radius,
                              Appearance.colorWithAlpha(appearance));
  return nada;
});

defOp("background3d", 1, function(args, modifs) {
  var color = coerce.toColor(evaluate(args[0]), null);
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
