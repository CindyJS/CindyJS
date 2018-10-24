/*jshint esversion: 6 */
var Import = {
  id: 'import',
  name: "Import",
  html: `<div id="import-window">
    <div id="import-window-header">Import widget</div>
    <div>
      <div>
        <h5>Import a CindyJS widget from HTML-file</h5>
        <div>
          <input type="file" id="file-input" onchange="Import.fromfile(this.files[0])"> 
        </div>
        <div>
          If an HTML-file is uploaded, the CindyJS widget is tried to be extracted and imported.
        </div>
        <!-- Needs 'Access-Control-Allow-Origin' header on the requested resource :-/-->
        <h5>Import an external CindyJS from URL</h5>
        <div>
          <label for="import-url">URL: </label><input type="text" id="import-url" name="import-url" value="../examples/25_Lagrange.html">
          <button type="button" id="button-import-url">Load HTML from URL</button>
        </div>
        <div>
          You can load an external HTML-File from a given URL. The editor will try to find and import a CindyJS widget.
          For security reasons, the URL must be from the same server, or 'Access-Control-Allow-Origin' must be configured to allow this host.
        </div>
        <div id="import-error" class="error"></div>
      </div>
    </div>
  </div>
  `,
  init: function() {
    
    document.getElementById("button-import-url").onclick = function() {
      
      let url = document.getElementById("import-url").value;
      document.getElementById("import-error").innerHTML = (`Load content from ${url}`);
      
      let xmlHttp = new XMLHttpRequest();
      xmlHttp.withCredentials = true;
      xmlHttp.onreadystatechange = function() { 
          if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
              Import.fromsource(xmlHttp.responseText);
          else
            document.getElementById("import-error").innerHTML = "could not load URL";
      };
      xmlHttp.open("GET", url, true); // true for asynchronous 
      xmlHttp.send(null);
      
    };
  },

  fromfile: function(file) {
    let reader = new FileReader();

    //TODO: check whether file is plain HTML...
    reader.readAsText(file);
    reader.onloadend = function() {
      Import.fromsource(reader.result);
    };
  },

  fromsource: function(source) {
    for (let s in scripts) {
      scripts[s] = '';
    }
    
    //TODO: read scripts from configuration.scripts instead of using a general regex
    for (let s in scripts) {
      //var regex = /<script.*?(?:(?:cindyscript.*?move)|(?:move.*?cindyscript)).*?>([^]*?)<\/script>/g;

      var regex = new RegExp(`<script.*?(?:(?:cindyscript.*?${s})|(?:${s}.*?cindyscript)).*?>([^]*?)<\/script>`);

      var result = regex.exec(source);
      if (result && result[1]) {
        var code = result[1].trim();
        if (code) {
          scripts[s] = code;
        }
      }
    }

    //extract CindyJS code and object
    var javascriptregex = /<script.*?javascript.*?>([^]*?)<\/script>/g;
    var m;
    //var configuration = {};
    do {
      m = javascriptregex.exec(source);
      if (m && m[1]) {
        var jscode = m[1];
        if (jscode.match(/(CindyJS|createCindy)\([^]*?\)/g)) {
          var backupCindyJS = CindyJS;
          var backupcreateCindy = createCindy;
          var backupcdy = cdy;
          var createCindy;
          var CindyJS = createCindy = function(config) {
            configuration = config;
          };
          eval(jscode);
          CindyJS = backupCindyJS;
          createCindy = backupcreateCindy;
          cdy = backupcdy;

          console.log(jscode);
          console.log(configuration);
        }
      }
    } while (m);


    for (var s in scripts) {
      let sname = s + "script";
      if (configuration.hasOwnProperty(sname)) {
        console.log("delete property " + sname);
        delete configuration[sname];
      }

    }

    configuration.scripts = editorscripts;
    //configuration.initscript = scripts["init"]
    //configuration.scripts = scripts;

    if (configuration.canvasname)
      delete configuration.canvasname;


    configuration.exclusive = "true"; // shut down the previous instance

    if (!configuration.use)
      configuration.use = [];

    let plugins = ["dimensions", "geometryeditor", "inspector", "visiblerect", "user"];

    for (var i in plugins) {
      if (configuration.use.indexOf(plugins[i]) == -1) {
        configuration.use.push(plugins[i]);
      }
    }

    //load plugin CindyGL if required
    //TODO: do the same for other plugins as well...
    hascolorplot = false;
    for (let s in scripts) {
      if (scripts[s].match(/colorplot/g))
        hascolorplot = true;
    }
    if (hascolorplot && configuration.use.indexOf("CindyGL") == -1)
      configuration.use.push("CindyGL");

    configuration.fullscreenmode = true; //This is not a CindyJS property

    if (!configuration.ports) configuration.ports = [];
    if (!configuration.ports[0]) {
      configuration.ports[0] = {
        id: "CSCanvas"
      };
    } else {
      configuration.ports[0].id = "CSCanvas";
      //delete configuration.ports[0].width;
      //delete configuration.ports[0].height;
      /*if(configuration.ports[0].width) {
        cdy.canvas.style.width = configuration.ports[0].width;
      }
      if(configuration.ports[0].height) {
        cdy.canvas.style.height = configuration.ports[0].height;
      }*/


    }

    m = /<div.*?CSCanvas.*?width:.*?([0-9]*).*?>/g.exec(source);
    if (m && m[1]) {
      configuration.ports[0].width = m[1];
    }

    m = /<div.*?CSCanvas.*?height:.*?([0-9]*).*?>/g.exec(source);
    if (m && m[1]) {
      configuration.ports[0].height = m[1];
    }

    if (configuration.ports[0].width && configuration.ports[0].height) {
      configuration.fullscreenmode = false;
    }

    configuration.oninit = function() {
      UI.entermode("geometry");
      document.getElementById('move').onclick();
    };

    makeCindyJS();
  },

  fromurl: function(url) {
    try {
      for (let s in scripts) {
        let urlpart = url.searchParams.get(s);
        if (urlpart) {
          scripts[s] = decodeURIComponent(urlpart);
        }
      }

      let urlpart = url.searchParams.get("gslp");
      if (urlpart) {
        let gslpstr = decodeURIComponent(urlpart);
        let json = JSON.parse(gslpstr);
        if (json) {
          configuration.geometry = json;
        }
      }
    } catch (error) {
      console.error("Could not parse URL");
    }
  }


};
