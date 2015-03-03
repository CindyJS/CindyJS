createCindy.registerPlugin(1, "Cindy3D", function(api) {

  //////////////////////////////////////////////////////////////////////
  // API bindings

  /** @type {createCindy.anyval} */
  let nada = api.nada;

  /** @type {function(createCindy.anyval):createCindy.anyval} */
  let evaluate = api.evaluate;

  /** @type {function(string,number,createCindy.op)} */
  let defOp = api.defineFunction;

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

  //////////////////////////////////////////////////////////////////////
  // Almost global variables

  let instances = {};
  let currentInstance;

  //////////////////////////////////////////////////////////////////////
  // Initialization and Execution

  defOp("begin3d", 0, function(args, modifs) {
    let name = "Cindy3D";
    let ccOpts = {}, opts = {};
    handleModifs(modifs, {
      "name": (a => name = /** @type {string} */(coerce.toString(a, name))),
      "antialias": (a => ccOpts["antialias"] = coerce.toBool(a, false)),
      "supersample": (a => opts.superSample = coerce.toReal(a, 1)),
    });
    currentInstance = instances[name];
    if (!currentInstance) {
      instances[name] = currentInstance = new Viewer(
        name, ccOpts, opts, api.addAutoCleaningEventListener);
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

  defOp("shininess3d", 1, function(args, modifs) {
    let shininess = coerce.toInterval(0, 128, evaluate(args[0]));
    if (!isNaN(shininess)) {
      currentInstance.pointAppearance.shininess = shininess;
      currentInstance.lineAppearance.shininess = shininess;
      currentInstance.surfaceAppearance.shininess = shininess;
    }
    return nada;
  });

  defOp("pointshininess3d", 1, function(args, modifs) {
    let shininess = coerce.toInterval(0, 128, evaluate(args[0]));
    if (!isNaN(shininess))
      currentInstance.pointAppearance.shininess = shininess;
    return nada;
  });

  defOp("lineshininess3d", 1, function(args, modifs) {
    let shininess = coerce.toInterval(0, 128, evaluate(args[0]));
    if (!isNaN(shininess))
      currentInstance.lineAppearance.shininess = shininess;
    return nada;
  });

  defOp("surfaceshininess3d", 1, function(args, modifs) {
    let shininess = coerce.toInterval(0, 128, evaluate(args[0]));
    if (!isNaN(shininess))
      currentInstance.surfaceAppearance.shininess = shininess;
    return nada;
  });

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
    currentInstance.spheres.add(pos, appearance.size, appearance);
    return nada;
  });

  defOp("draw3d", 2, function(args, modifs) {
    let pos1 = coerce.toHomog(evaluate(args[0]));
    let pos2 = coerce.toHomog(evaluate(args[1]));
    // TODO: handle "type" modifier
    let appearance = handleModifsAppearance(
      currentInstance.lineAppearance, modifs);
    currentInstance.cylinders.add(pos1, pos2, appearance);
    return nada;
  });

  defOp("connect3d", 1, function(args, modifs) {
    let lst = coerce.toList(evaluate(args[0]));
    let appearance = handleModifsAppearance(
      currentInstance.lineAppearance, modifs);
    if (lst.length < 2) return nada;
    let pos1 = coerce.toHomog(lst[0]);
    for (let i = 1; i < lst.length; ++i) {
      let pos2 = coerce.toHomog(lst[i]);
      currentInstance.cylinders.add(pos1, pos2, appearance);
      pos1 = pos2;
    }
    return nada;
  });

  defOp("drawpoly3d", 1, function(args, modifs) {
    let lst = coerce.toList(evaluate(args[0]));
    let appearance = handleModifsAppearance(
      currentInstance.lineAppearance, modifs);
    if (lst.length < 2) return nada;
    let pos1 = coerce.toHomog(lst[lst.length - 1]);
    for (let i = 0; i < lst.length; ++i) {
      let pos2 = coerce.toHomog(lst[i]);
      currentInstance.cylinders.add(pos1, pos2, appearance);
      pos1 = pos2;
    }
    return nada;
  });

  defOp("fillpoly3d", 1, function(args, modifs) {
    let lst = coerce.toList(evaluate(args[0]));
    let appearance = handleModifsAppearance(
      currentInstance.surfaceAppearance, modifs);
    if (lst.length < 2) return nada;
    let pos = lst.map(elt => coerce.toHomog(elt));
    currentInstance.triangles.addPolygonAutoNormal(pos, appearance);
    return nada;
  });

  defOp("fillpoly3d", 2, function(args, modifs) {
    let lst1 = coerce.toList(evaluate(args[0]));
    let lst2 = coerce.toList(evaluate(args[1]));
    let appearance = handleModifsAppearance(
      currentInstance.surfaceAppearance, modifs);
    if (lst1.length < 2 || lst1.length != lst2.length) return nada;
    let pos = lst1.map(elt => coerce.toHomog(elt));
    let n = lst2.map(elt => coerce.toDirection(elt));
    currentInstance.triangles.addPolygonWithNormals(pos, n, appearance);
    return nada;
  });

  defOp("fillcircle3d", 3, function(args, modifs) {
    return nada;
  });

  defOp("drawsphere3d", 2, function(args, modifs) {
    let pos = coerce.toHomog(evaluate(args[0]));
    let radius = coerce.toReal(evaluate(args[1]));
    let appearance = handleModifsAppearance(
      currentInstance.surfaceAppearance, modifs);
    currentInstance.spheres.add(pos, radius, appearance);
    return nada;
  });

  defOp("mesh3d", 3, function(args, modifs) {
    let m = coerce.toInt(evaluate(args[0]));
    let n = coerce.toInt(evaluate(args[1]));
    let pos = coerce.toList(evaluate(args[2])).map(elt => coerce.toHomog(elt));
    let appearance = handleModifsAppearance(
      currentInstance.surfaceAppearance, modifs);
    // TODO: handle modifiers, per-vertex normals in particular.
    let k = 0;
    for (let i = 1; i < m; ++i) {
      for (let j = 1; j < n; ++j) {
        currentInstance.triangles.addPolygonAutoNormal(
          [pos[k], pos[k + 1], pos[k + n + 1], pos[k + n]], appearance);
        ++k;
      }
      ++k;
    }
    return nada;
  });

  defOp("mesh3d", 4, function(args, modifs) {
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

  defOp("lookat3d", 3, function(args, modifs) {
    let position = coerce.toHomog(evaluate(args[0]), null);
    let lookAt = coerce.toHomog(evaluate(args[1]), null);
    let up = coerce.toDirection(evaluate(args[2]), null);
    if (position && lookAt && up) {
      currentInstance.camera.setCamera(dehom3(position), dehom3(lookAt), up);
    }
    return nada;
  });

  defOp("fieldofview3d", 1, function(args, modifs) {
    let fov = coerce.toInterval(1, 179, evaluate(args[0]), 0);
    if (fov > 0) {
      currentInstance.camera.fieldOfView = fov;
      currentInstance.camera.updatePerspective();
    }
    return nada;
  });

  defOp("depthrange3d", 2, function(args, modifs) {
    let near = coerce.toReal(evaluate(args[0]), -1);
    let far = coerce.toReal(evaluate(args[1]), -1);
    if (near >= 0 && far > near) {
      currentInstance.camera.zNear = near;
      currentInstance.camera.zFar = far;
      currentInstance.camera.updatePerspective();
    }
    return nada;
  });

  defOp("renderhints3d", 0, function(args, modifs) {
    return nada;
  });

  defOp("pointlight3d", 1, function(args, modifs) {
    let index = coerce.toInt(evaluate(args[0]), 0);
    let position = [0, 0, 0, 1], diffuse = [1, 1, 1], specular = [1, 1, 1];
    handleModifs(modifs, {
      "position": a => position = coerce.toHomog(a, position),
      "diffuse": a => diffuse = coerce.toColor(a, diffuse),
      "specular": a => specular = coerce.toColor(a, specular),
    });
    currentInstance.lighting.setLight(
      index, new PointLight(dehom3(position), diffuse, specular));
    return nada;
  });

  defOp("directionallight3d", 1, function(args, modifs) {
    let index = coerce.toInt(evaluate(args[0]), 0);
    let direction = [0, -1, 0], diffuse = [1, 1, 1], specular = [1, 1, 1];
    handleModifs(modifs, {
      "direction": a => direction = coerce.toDirection(a, direction),
      "diffuse": a => diffuse = coerce.toColor(a, diffuse),
      "specular": a => specular = coerce.toColor(a, specular),
    });
    currentInstance.lighting.setLight(
      index, new DirectionalLight(direction, diffuse, specular));
    return nada;
  });

  defOp("spotlight3d", 1, function(args, modifs) {
    let index = coerce.toInt(evaluate(args[0]), 0);
    let position = [0, 0, 0, 1], direction = [0, -1, 0];
    let cutoff = Math.PI/4, exponent = 0;
    let diffuse = [1, 1, 1], specular = [1, 1, 1];
    handleModifs(modifs, {
      "position": a => position = coerce.toHomog(a, position),
      "direction": a => direction = coerce.toDirection(a, direction),
      "cutoffangle": a => cutoff = coerce.toInterval(0, Math.PI, a, cutoff),
      "exponent": a => exponent = coerce.toReal(a, exponent),
      "diffuse": a => diffuse = coerce.toColor(a, diffuse),
      "specular": a => specular = coerce.toColor(a, specular),
    });
    currentInstance.lighting.setLight(
      index, new SpotLight(dehom3(position), direction, Math.cos(cutoff),
                           exponent, diffuse, specular));
    return nada;
  });

  defOp("disablelight3d", 1, function(args, modifs) {
    let index = coerce.toInt(evaluate(args[0]), 0);
    currentInstance.lighting.setLight(index, null);
    return nada;
  });

});
