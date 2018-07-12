/*jshint esversion: 6 */

var Export = {
  id: "export",
  name: "Export",
  html: `
  <div id="export-window">
    <div id="export-window-header">Export widget</div>
    <div>
      <div>
        <h5>Export to file</h5>
        <!--<button type="button" id="button-export-pdf">PDF</button>
        <button type="button" id="button-export-svg">SVG</button>
        <button type="button" id="button-export-html">HTML</button>-->
        <button type="button" id="button-export-html">Export HTML-File</button>
      </div>
      <h5>Export to URL</h5>
      <div>
        By clicking this button, the contents of the editor are encoded in the current URL. By opening the URL, the editing can be continued.<br/>
        <b>Note:</b> This only works on all browsers if the URL has less than 2000 characters, i.e. the geometry and the programms are sufficiently simple.
      </div>
      <div>
        <button type="button" id="button-export-url">Encode widget into URL</button>
      </div>
    </div>
  </div>
  `,
  init: function() {
    /*
    //TODO: implement measureText for PDF and SVG first...
    
    document.getElementById('button-export-pdf').onclick = function() {
      cdy.exportPDF();
    };
    document.getElementById('button-export-svg').onclick = function() {
      cdy.exportSVG();
    };
    */

    document.getElementById('button-export-html').onclick = function() {
      Export.buildhtml();
    };

    document.getElementById('button-export-url').onclick = function() {
      Export.exporturl();
    };
  },

  buildhtml: function() {
    //document.getElementById('move').onclick();
    //yield copy of configuration
    var cconfiguration = JSON.parse(JSON.stringify(configuration));

    //yield gslp
    cconfiguration.geometry = cdy.saveState().geometry;

    //remove uneeded plugins
    let removeplugins = ["geometryeditor", "visiblerect", "user"];
    cconfiguration.use = configuration.use.filter(p => removeplugins.indexOf(p) == -1);

    //remove editor stuff
    delete cconfiguration.oninit;
    delete cconfiguration.fullscreenmode;

    cconfiguration.scripts = "cs*";
    //yield scripts

    var csscripts = '';

    for (var s in scripts)
      if (scripts[s]) {
        csscripts = csscripts + `
      <script id="cs${s}" type="text/x-cindyscript">
      ${scripts[s]}
      </script>`;
      }

    //generate source
    var source = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        
        <title>exported from UIExperiments.html</title>
        <style type="text/css">
            body {
                margin: 0px;
                padding: 0px;
            }
            
            ${configuration.fullscreenmode ? `
            #CSCanvas {
                width: 100vw; height: 100vh;
            }` : ''}
        </style>
        <link rel="stylesheet" href="https://cindyjs.org/dist/latest/CindyJS.css">
        <script type="text/javascript" src="https://cindyjs.org/dist/latest/Cindy.js"></script>
        ${(configuration.use.indexOf("CindyGL")!=-1) ? '<script type="text/javascript" src="https://cindyjs.org/dist/latest/CindyGL.js"></script>' : ''}
        
        ${csscripts}
    
        <script type="text/javascript">
          var cdy = CindyJS(${JSON.stringify(cconfiguration, null, "  ")});
        </script>
    </head>
    <body>
        <div id="CSCanvas"></div>
    </body>
    </html>
  `;


    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(source));
    element.setAttribute('download', "cindy.html");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  },

  exporturl() {
    let gslp = cdy.saveState().geometry;

    let csscripts = '';

    for (var s in scripts)
      if (scripts[s]) {
        csscripts = csscripts + `&${s}=${encodeURIComponent(scripts[s])}`;
      }

    history.pushState(null, null, `?${csscripts}&gslp=${
      encodeURIComponent(JSON.stringify(gslp))
    }`);
  }
};
