/*jshint esversion: 6 */

makepluginfromcscode({
    init: `
    inspecting = false;
    join(list) := (
      if(length(list)==0,
        "",
        str = list_1;
        forall(2..length(list),k,
          str = str + ", " + list_k;
        );
        str
      )
    );
    
    properties(el) := (
      ["color", "alpha", "labeled", "trace", "pinned"] ++
      if(ispoint(el),
        ["x","y", "xy", "homog", "size"],
        if(isline(el) % issegment(el),
          ["homog", "size", "slope"],
          if(isconic(el),
            ["center","radius", "size"],
            []
          )
        )
      )
    );
    
    inspectselected(pts, lns, cns) := (
      json = "{"+join(
        apply(pts++lns++cns, el,
         el.name+": {" +
          join(apply(properties(el), key, key+": " + parse(el.name + "." + key)))+ "}"
         )
        )+"}";
      errc(json);
      javascript("Inspector.update('" + json + "')");
      
    );
    `
  },
  "inspector"
);

var Inspector = {
  id: "inspector",
  name: "Inspector",
  html: `<div id="inspector-window">
    <div id="inspector-window-header">Inspector</div>
    <div>
      <div id="inspector-contents">
        Select an element for inspection by clicking on it.
      </div>
      <div id="colorwheel">
        <div id="colorwheelCanvas"></div>
      </div>
    </div>
  </div>`,

  contents: null,
  colorwheel: null,

  init: function() {
    this.contents = document.getElementById('inspector-contents');
  },

  enter: function() {
    //init CindyJS only if it is visible
    if (!this.colorwheel) {
      this.colorwheel = generateColorwheel();
    }

    cdy.evokeCS(`inspecting = true;
      inspectselected(selpts, sellns, selcns);`);
  },

  leave: function() {
    if (this.colorwheel) {
      this.colorwheel.evokeCS('deactivate()');
    }
    cdy.evokeCS(`inspecting = false;`);
  },

  update: function(jsonstr) {
    if (document.getElementById('inspector-window').style.display == "none")
      return;
    console.log(jsonstr)
    var els = JSON.parse(jsonstr.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": '));
    console.log(els);
    let innerhtml = "";
    if (Object.keys(els).length > 0) {
      document.getElementById("inspector-window-header").innerHTML = "Inspecting " + Object.keys(els).join(', ');
    } else {
      document.getElementById("inspector-window-header").innerHTML = "Inspector";
      innerhtml = "Select an element for inspection by clicking on it.";
    }

    let elementswithkey = {};
    for (var el in els) {
      for (var key in els[el]) {
        if (!elementswithkey[key]) elementswithkey[key] = [];
        elementswithkey[key].push(el);
      }
    }

    if (!elementswithkey.hasOwnProperty("color")) {
      if (this.colorwheel) {
        this.colorwheel.evokeCS('deactivate()');
      }
    };
    for (let key in elementswithkey) {
      if (elementswithkey[key].length == 0) continue;
      let firstel = els[elementswithkey[key][0]];
      let value = firstel[key];
      let allequal = true;
      for (let j = 1; allequal && j < elementswithkey[key].length; j++) {
        if (JSON.stringify(els[elementswithkey[key][j]][key]) != JSON.stringify(value)) allequal = false;
      }
      let elnames = elementswithkey[key];
      if (key == "color") {
        this.colorelements = elnames;
        if (this.colorwheel) this.colorwheel.evokeCS(`activate([${value}])`);
        if (allequal)
          document.getElementById("colorwheel").classList.remove('different');
        else
          document.getElementById("colorwheel").classList.add('different');
      } else {
        innerhtml += `<div class=${allequal ? "equal" : "different"}><span style="color:rgb(150,150,150)">${elnames}</span> <label for="${key}">${key}: </label>${this.createinput(key, value, elnames, allequal)}`;
      }

    }
    this.contents.innerHTML = innerhtml;
  },

  updatecolor: function(color) {
    for (let i in this.colorelements) {
      let el = this.colorelements[i];
      cdy.evokeCS(`${el}.color = ${color}`);
    }
  },

  niceprint: function(value) {
    if (typeof(value) == 'number') {
      return Math.round(value * 100) / 100;
    }
    if (Array.isArray(value)) {
      return value.map(this.niceprint);
    }
    return value;
  },

  modifygslp: function(elements, key, value) {
    let cmd = elements.map(name => `${name}.${key} = ${value}`).join(';');
    console.log(cmd);
    cdy.evokeCS(cmd);
    cdy.evokeCS("inspectselected(selpts, sellns, selcns);");
  },

  createinput: function(key, value, elements, allequal) {
    elstr = '[' + elements.map(name => `'${name}'`).join(',') + ']';
    keystr = `'${key}'`;
    if (typeof(value) == 'boolean') {
      return `<input type="checkbox" name="${key}" ${value ? 'checked' : ''} onchange="Inspector.modifygslp(${elstr}, ${keystr}, this.checked)"></div>`;
    } else if (typeof(value) == 'number' && key != "x" && key != "y") {
      var min = 0;
      var max = 20;
      if (key == 'alpha') {
        min = 0;
        max = 1;
      }
      return `<input type="range" name="${key}" value="${value}" step=".01"   min="${min}" max="${max}" onchange="Inspector.modifygslp(${elstr}, ${keystr}, this.value); o${key}.value = this.value"><output name="o${key}" id="o${key}" for="${key}">${value}</output></div>`;
    } else if (Array.isArray(value)) {
      if (key == "pos" && value[2] != 0) {
        keystr = "'xy'";
        value = [value[0] / value[2], value[1] / value[2]];
      }
      return `<input type="text" name="${key}" value="[${this.niceprint(value)}]" onchange="Inspector.modifygslp(${elstr}, ${keystr}, this.value)"></div>`;
    }
    return `<input type="text" name="${key}" value="${value}" onchange="Inspector.modifygslp(${elstr}, ${keystr}, this.value)"></div>`;
  }
};