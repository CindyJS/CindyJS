/*jshint esversion: 6 */
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

    cdy.evokeCS(`javascript("Inspector.update('" + (selpts++sellns++selcns) + "')")`);
  },

  leave: function() {
    if (this.colorwheel) {
      this.colorwheel.evokeCS('deactivate()');
    }
  },

  update: function(str) {
    if (document.getElementById('inspector-window').style.display == "none")
      return;

    selected = str.slice(1, str.length - 1).split(',').map(el => el.trim());
    var gslp = cdy.saveState().geometry;

    var els = gslp.filter(el => selected.indexOf(el.name) != -1);


    let innerhtml = "";
    if (els.length > 0) {
      document.getElementById("inspector-window-header").innerHTML = "Inspecting " + els.map(el => el.name).join(', ');
    } else {
      document.getElementById("inspector-window-header").innerHTML = "Inspector";
      innerhtml = "Select an element for inspection by clicking on it.";
    }

    let elementswithkey = {};
    for (var i in els) {
      var el = els[i];
      for (var key in el) {
        if (!elementswithkey[key]) elementswithkey[key] = [];
        elementswithkey[key].push(i);
      }
    }

    if (!elementswithkey.hasOwnProperty("color")) {
      if (this.colorwheel) {
        this.colorwheel.evokeCS('deactivate()');
      }
    };

    for (let key in elementswithkey) {
      if (key == "type" || key == "args" || key == "name") continue;
      if (elementswithkey[key].length == 0) continue;
      let firstel = els[elementswithkey[key][0]];
      let value = firstel[key];
      let allequal = true;
      for (let j = 1; allequal && j < elementswithkey[key].length; j++) {
        if (JSON.stringify(els[elementswithkey[key][j]][key]) != JSON.stringify(value)) allequal = false;
      }
      let elnames = elementswithkey[key].map(i => els[i].name);
      if (key == "color") {
        this.colorelements = elnames;
        
        /* Reverse of StateIO.js
        var undim = CSNumber.real(1 / defaultAppearance.dimDependent);
        res.color = General.unwrap(List.scalmult(undim, el.color));
        */
        let f = .7;
        if(configuration.defaultAppearance && configuration.defaultAppearance.dimDependent) f = configuration.defaultAppearance.dimDependent;
        value = [f*value[0], f*value[1], f*value[2]];
        
        if (this.colorwheel) this.colorwheel.evokeCS(`activate([${value}])`);
      } else {
        innerhtml += `<div><span style="color:rgb(150,150,150)">${elnames}</span> <label for="${key}">${key}: </label>${this.createinput(key, value, elnames, allequal)}`;
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
  },

  createinput: function(key, value, elements, allequal) {
    elstr = '[' + elements.map(name => `'${name}'`).join(',') + ']';
    keystr = `'${key}'`;
    if (typeof(value) == 'boolean') {
      return `<input type="checkbox" name="${key}" ${value ? 'checked' : ''} onchange="Inspector.modifygslp(${elstr}, ${keystr}, this.checked)"></div>`;
    } else if (typeof(value) == 'number') {
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
