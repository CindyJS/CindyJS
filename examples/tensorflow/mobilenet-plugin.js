CindyJS.registerPlugin(1, "mobilenet", function(api) {
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
  var model = false;
  var processrunning = false;
  var tmpimg = new Image();
  
  handleModif = function(modifs, name, defaultvalue) {
    if(modifs[name]) {
      let val = api.evaluate(modifs[name]);
      if(val.ctype === 'number') {
        return val.value.real;
      }
      if(val.ctype === 'boolean') {
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
  
  async function classify(img, cdycallback) {
    if (processrunning) return;
    processrunning = true;

    // load the mobilenet model
    if (!model) model = await mobilenet.load();
    // Classify the image.
    const predictions = await model.classify(img);
    
    cdypredictions = wrap(
      replaceNanByZero(predictions.map(k => [k.className, k.probability]))
    );
    
    api.evaluate(
      recreplace(cdycallback, {
        '#': cdypredictions
      })
    );
    processrunning = false;
    
    const infer = await model.infer(img);
  }


  api.defineFunction("classify", 2, function(args, modifs) {
    if (processrunning) {
      console.log("skip classify, because process is already running");
      return api.nada;
    }

    let cdyimg = api.evaluate(args[0]);
    var prog = args[1];
    let imageobject = api.getImage(cdyimg, true);
    let h = imageobject.height;
    let w = imageobject.width;
    
    var tag = imageobject.img.tagName.toLowerCase();
    if (tag === "video" || tag === "image" || tag === "img") {
      imageobject.img.width = w;
      imageobject.img.height = h;
      classify(imageobject.img, cloneExpression(args[1]));
    } else if (tag === "canvas") {
      if (imageobject['canvaswrapper']) {
        imageobject.cdyUpdate();
      }
      //mobilenet appereantly does not work with canvas as input :(
      //img.src = canvas.toDataURL('image/jpeg', .9);
      tmpimg.src = imageobject.img.toDataURL();
      //img = canvas;
      tmpimg.width = w;
      tmpimg.height = h;
      classify(tmpimg, cloneExpression(args[1]));
    }
    return api.nada;
  });
});
