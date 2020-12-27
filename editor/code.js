/*jshint esversion: 6 */
var Code = {
    id: "code",
    name: "Scripting",
    html: `
  <div id="code-window">
    <div id="code-window-header">code window header</div>
    <select id="code-select"></select>
  </div>`,
    select: null,
    cm: null,
    init: function () {
        this.select = document.getElementById("code-select");

        this.cm = CodeMirror(document.getElementById("code-window"), {
            autoCloseBrackets: true,
            matchBrackets: true,
            theme: "base16-dark",
            //lineNumbers: true,
            lineWrapping: true,
            viewportMargin: Infinity,
        });

        this.cm.on("change", function (cm, change) {
            console.log("something changed! (" + change.origin + ")");
            var s = Code.select.options[Code.select.selectedIndex].value;
            if (scripts.hasOwnProperty(s)) {
                scripts[s] = Code.cm.getValue();
                cdy.evokeCS(`user${s}() := (
          ${scripts[s]}
        )`);
                if (s == "init") {
                    cdy.evokeCS(`userinit()`);
                }
            }
            Code.highlightoptions();
        });

        for (let s in scripts) {
            let option = document.createElement("option");
            option.text = `Edit ${s}-script`;
            option.value = s;
            option.id = `${s}-option`;
            this.select.add(option);
        }

        this.select.addEventListener(
            "change",
            function (event) {
                let s = this.value;
                var header = (document.getElementById("code-window-header").innerHTML = `${s}-script`);
                Code.cm.setValue(scripts[s]);
            },
            false
        );
    },

    highlightoptions: function () {
        for (let s in scripts) {
            let option = document.getElementById(`${s}-option`);
            if (scripts[s]) {
                option.classList.add("used-script");
            } else {
                option.classList.remove("used-script");
            }
        }
    },

    enter: function () {
        let s = Code.select.options[Code.select.selectedIndex].value;
        var header = (document.getElementById("code-window-header").innerHTML = `${s}-script`);
        Code.cm.setValue(scripts[s]);
        Code.highlightoptions();
    },
};
