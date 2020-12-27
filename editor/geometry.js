/*jshint esversion: 6 */
/*
  UI for the geometry editor
*/
var Geometry = {
    name: "Edit geometry",
    id: "geometry",
    buttons: [
        ["move", "images/move.png"],
        ["delete", "images/delete.png"],
        ["singlepoint", "images/single-add.png"],
        ["middle", "images/multi-add-middle.png"],
        ["singleline", "images/multi-add-line.png"],
        ["singlesegment", "images/segment.png"],
        ["parallel", "images/multi-add-parallel.png"],
        ["perp", "images/multi-add-perp.png"],
        ["circlepp", "images/multi-add-circle.png"],
        ["circlepr", "images/circle-by-radius.png"],
    ],
    html: `
  <div id="geometry-window">
    <!--div id="geometry-window-header">geometry</div>-->
    <div id="geometry-mode-select">
    </div>
  </div>
  `,
    select: null,
    init: function () {
        this.select = document.getElementById("geometry-mode-select");

        // Add elements to geometry menu
        for (var i in Geometry.buttons) {
            var option = document.createElement("div");

            option.data = Geometry.buttons[i][0];
            option.id = Geometry.buttons[i][0];
            option.onclick = function () {
                Geometry.setmode(this.data);
            };
            option.style.backgroundImage = `url('${Geometry.buttons[i][1]}'`;
            Geometry.select.appendChild(option);
        }
        this.setmode("move");
    },

    setmode: function (m) {
        cdy.evokeCS(`setmode("${m}")`);

        if (Geometry.select) {
            let children = Geometry.select.children;

            for (var i = 0; i < children.length; i++) {
                if (children[i].data == m) children[i].classList.add("selected");
                else children[i].classList.remove("selected");
            }
        }
    },
    enter: function () {
        this.setmode("move");
    },

    leave: function () {
        /*cdy.evokeCS(`
      selpts=[];
      sellns=[];
      selcns=[];`);*/

        cdy.evokeCS(`
      tmppts=[];
      tmplns=[];
      tmpcns=[];`);
        this.setmode("move");
    },
};
