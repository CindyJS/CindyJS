CindyJS.registerPlugin(1, "posenet", function(api) {
  var cloneExpression = function(obj) {
    var copy;
    if (null == obj || "object" != typeof obj) return obj;
    if (obj instanceof Array) {
      copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = cloneExpression(obj[i]);
      }
      return copy;
    }

    if (obj instanceof Object) {
      copy = {};
      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          if (['oper', 'impl', 'args', 'ctype', 'stack', 'name', 'arglist', 'value', 'real', 'imag', 'key', 'obj', 'body'].indexOf(attr) >= 0)
            copy[attr] = cloneExpression(obj[attr]);
        }
      }
      if (obj['modifs']) copy['modifs'] = obj['modifs']; //modifs cannot be handeled in recursion properly
      return copy;
    }
  }

  var real = function(r) {
    return {
      "ctype": "number",
      "value": {
        'real': r,
        'imag': 0
      }
    };
  };

  var list = function(l) {
    return {
      'ctype': 'list',
      'value': l
    };
  };


  var wrap = function(v) {
    if (typeof v === "number") {
      return real(v);
    }
    if (typeof v === "object" && v.length !== undefined) {
      var li = [];
      for (var i = 0; i < v.length; i++) {
        li[i] = wrap(v[i]);
      }
      return list(li);
    }
    if (typeof v === "string") {
      return {
        ctype: "string",
        value: v
      };
    }
    if (typeof v === "boolean") {
      return {
        ctype: "boolean",
        value: v
      };
    }
    return nada;
  };

  var recreplace = function(ex, rmap) {
    if (ex.ctype === "variable" && rmap[ex.name]) {
      return rmap[ex.name];
    } else {
      if (ex.args)
        ex.args = ex.args.map(e => recreplace(e, rmap));
      return ex;
    }
  };
  var net = false;
  var processrunning = false;
  var tmpimg = new Image();

  handleModif = function(modifs, name, defaultvalue) {
    if (modifs[name]) {
      let val = api.evaluate(modifs[name]);
      if (val.ctype === 'number') {
        return val.value.real;
      }
      if (val.ctype === 'boolean') {
        return val.value;
      }
    }
    return defaultvalue;
  };

  function replaceNanByZero(o) {
    if (typeof o === "number") {
      return isNaN(o) ? 0 : o;
    }
    if (typeof o === "object" && o.length !== undefined)
      return o.map(replaceNanByZero);
    return o;
  }


  async function getpose(img, cdycallback, px2coord, modifs) {
    if (processrunning) return;
    processrunning = true;

    //https://github.com/tensorflow/tfjs-models/tree/master/posenet
    let imageScaleFactor = handleModif(modifs, 'imagescalefactor', 0.2);
    let flipHorizontal = handleModif(modifs, 'fliphorizontal', false);
    let outputStride = handleModif(modifs, 'outputstride', 16);

    // load the posenet model
    if (!net) //net = await posenet.load(handleModif(modifs, 'multiplier', 0.75));
      net = await posenet.load({
        architecture: 'MobileNetV1',  //mid-range/lower-end GPUS
        outputStride: 16,
        multiplier: handleModif(modifs, 'multiplier', 0.75)
      });
      /*net = await posenet.load({ //slower but more accurate
        architecture: 'ResNet50',
        outputStride: 32,
        quantBytes: 2
      });*/
    const pose = await net.estimateSinglePose(img, imageScaleFactor, flipHorizontal, outputStride);

    //console.log(pose);
    cdypose = wrap(
      replaceNanByZero(pose.keypoints.map(k => [k.part, k.score, px2coord(k.position)]))
    );
    api.evaluate(
      recreplace(cdycallback, {
        '#': cdypose
      })
    );
    processrunning = false;
  }


  api.defineFunction("estimateSinglePose", 4, function(args, modifs) {
    // https://github.com/tensorflow/tfjs-models/tree/master/posenet
    if (processrunning) {
      console.log("skip estimateSinglePose, because process is already running");
      return api.nada;
    }

    let cdyimg = api.evaluate(args[2]);

    let a = api.extractPoint(api.evaluateAndVal(args[0]));
    let b = api.extractPoint(api.evaluateAndVal(args[1]));
    var prog = args[3];

    if (!a.ok || !b.ok) {
      return api.nada;
    }

    let imageobject = api.getImage(cdyimg, true);
    let h = imageobject.height;
    let w = imageobject.width;
    let c = {
      x: a.x - (b.y - a.y) * h / w,
      y: a.y + (b.x - a.x) * h / w
    };
    var px2coord = function(p) {
      return [c.x + (p.x / w) * (b.x - a.x) + (p.y / h) * (b.y - a.y), c.y + (p.y / h) * (a.y - c.y) + (p.x / w) * (b.y - a.y)];
    };

    var tag = imageobject.img.tagName.toLowerCase();
    if (tag === "video" || tag === "image" || tag === "img") {
      imageobject.img.width = w;
      imageobject.img.height = h;
      getpose(imageobject.img, cloneExpression(args[3]), px2coord, modifs);
    } else if (tag === "canvas") {
      if (imageobject['canvaswrapper']) {
        imageobject.cdyUpdate();
      }
      //posenet appereantly does not work with canvas as input :(
      //img.src = canvas.toDataURL('image/jpeg', .9);
      tmpimg.src = imageobject.img.toDataURL();
      //img = canvas;
      tmpimg.width = w;
      tmpimg.height = h;
      getpose(tmpimg, cloneExpression(args[3]), px2coord, modifs);
    }
    return api.nada;
  });
});
