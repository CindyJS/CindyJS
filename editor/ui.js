/*jshint esversion: 6 */
var UI = {
  modes: [],
  modeselect: null,
  lastmodeid: 'geometry',
  create(modes) {
    let windows = document.getElementById('windows');
    this.modeselect = document.getElementById("mode-select");

    this.modes = modes;

    for (var i = 0; i < modes.length; i++) {
      let m = modes[i];
      windows.innerHTML += m.html;

      var option = document.createElement("option");
      option.text = m.name;
      option.value = m.id;
      option.id = `${m.id}-option`;
      this.modeselect.add(option);
    }

    this.modeselect.addEventListener('change', function(event) {
      UI.entermode(this.value);
    }, false);
  },

  entermode: function(modeid) {
    let mode = this.modes[0];
    let lastmode = this.modes[0];
    for (let i = 0; i < this.modes.length; i++) {
      if (this.modes[i].id == modeid) mode = this.modes[i];
      if (this.modes[i].id == this.lastmodeid) lastmode = this.modes[i];
    }

    document.getElementById(`${modeid}-window`).style.display = "block";
    if (this.lastmodeid != modeid)
      document.getElementById(`${this.lastmodeid}-window`).style.display = "none";

    if (lastmode.leave && this.lastmodeid != modeid)
      lastmode.leave();

    if (mode.enter)
      mode.enter();

    this.lastmodeid = modeid;
  },

  init: function() {
    for (var i = 0; i < this.modes.length; i++) {
      let m = this.modes[i];
      UI.dragElement(document.getElementById(`${m.id}-window`));
      m.init();
      document.getElementById(`${m.id}-window`).style.display = "none";
    }
  },
  
  dragElement: function(elmnt) {
    var pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    if (document.getElementById(elmnt.id + "-header")) {
      /* if present, the header is where you move the DIV from:*/
      document.getElementById(elmnt.id + "-header").onmousedown = dragMouseDown;
    } else {
      /* otherwise, move the DIV from anywhere inside the DIV:*/
      elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      // get the mouse cursor position at startup:
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      // calculate the new cursor position:
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // set the element's new position:
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      /* stop moving when mouse button is released:*/
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
};
