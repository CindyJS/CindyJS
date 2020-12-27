/*jshint esversion: 6 */
makepluginfromcscode(
    {
        init: `
    visiblerectactive = false;
    startvisiblerect() := (
      if(!visiblerectactive,
        maxx = max(apply(allpoints(),p, p.x))+.5;
        maxy = max(apply(allpoints(),p, p.y))+.5;
        minx = min(apply(allpoints(),p, p.x))-.5;
        miny = min(apply(allpoints(),p, p.y))-.5;
        if(isundefined(maxx) % isundefined(maxy) % isundefined(minx) % isundefined(miny),
          startvisiblerect(-1,-1,2,1);
          ,
          startvisiblerect(minx,miny,maxx,maxy);
        );
      );
    );
    startvisiblerect(minx,miny,maxx,maxy) := (
      if(!visiblerectactive,
        
        TL = create("Free", [], pos->[minx,maxy]);
        TR = create("Free", [], pos->[maxx,maxy]);
        BL = create("Free", [], pos->[minx,miny]);
        BR = create("Free", [], pos->[maxx,miny]);
        
        forall([TL,TR,BL,BR], P,
          P.alpha = .5;
          P.color = [1,1,1];
          P.labeled = false;
        );
        
        visiblerectactive = true;
      );
    );
    stopvisiblerect() := (
      if(visiblerectactive,
        removeelement(TL); 
        removeelement(TR);
        removeelement(BL);
        removeelement(BR);
        visiblerectactive = false;
      );
    );
    `,
        move: `
    if(visiblerectactive,
      if(mover()==TL,
        TR.y = TL.y;
        BL.x = TL.x;
      );
      
      if(mover()==TR,
        TL.y = TR.y;
        BR.x = TR.x;
      );
      
      if(mover()==BL,
        BR.y = BL.y;
        TL.x = BL.x;
      );
      
      if(mover()==BR,
        BL.y = BR.y;
        TR.x = BR.x;
      );
      visiblerect = [min(BL.x,TR.x),min(BL.y,TR.y),max(BL.x,TR.x),max(BL.y,TR.y)];
      
      //TODO: avoid javascript
      javascript("Configuration.updaterect('"+visiblerect+"')");
      
    );
  `,
        draw: `
    if(visiblerectactive,
      draw(TL,BL,color->[1,1,1], size->3);
      draw(BL,BR,color->[1,1,1], size->3);
      draw(BR,TR,color->[1,1,1], size->3);
      draw(TR,TL,color->[1,1,1], size->3);
      drawtext([min(BL.x,TR.x),min(BL.y,TR.y)], [min(BL.x,TR.x),min(BL.y,TR.y)], align->"right");
      drawtext([max(BL.x,TR.x),max(BL.y,TR.y)], [max(BL.x,TR.x),max(BL.y,TR.y)]);
    );
  `,
    },
    "visiblerect"
);

var Configuration = {
    visibleRect: null,
    id: "configuration",
    name: "General configuration",
    html: `
  <div id="configuration-window">
    <div id="configuration-window-header">Configuration</div>
    <div>
      <div>
        <h5>Change the size of the widget</h5>
        <div>
          <input id="configuration-fullscreen" type="checkbox" checked="true">
          <label for="configuration-fullscreen">Widget is fullscreen</label>
        </div>
        <div id="configuration-resolution">
          <div><b>Select the area of the widget</b></div>
          <div>
            <label for="configuration-width">width: </label><input type="text" id="configuration-width" name="configuration-width" value="800" size="3">
          </div>
          <div>
            <label for="configuration-height">height: </label><input type="text" id="configuration-height" name="configuration-height" value="600" size="3">
          </div>
        </div>
        <button type="button" id="configuration-change-size-button">Apply new size of the widget</button>
      </div>
    </div>
  </div>
  `,
    init: function () {
        var resolutionelement = document.getElementById("configuration-resolution");
        document.getElementById("configuration-fullscreen").onchange = function () {
            if (!this.checked) {
                resolutionelement.style.display = "block";
                //cdy.evokeCS(`startvisiblerect()`);
            } else {
                resolutionelement.style.display = "none";
                //cdy.evokeCS(`stopvisiblerect()`);
            }
        };

        document.getElementById("configuration-fullscreen").onchange();

        document.getElementById("configuration-change-size-button").onclick = function () {
            cdy.evokeCS(`stopvisiblerect()`);
            configuration.geometry = cdy.saveState().geometry; //copy gslp
            if (document.getElementById("configuration-fullscreen").checked) {
                configuration.fullscreenmode = true;
                if (configuration.ports && configuration.ports[0]) {
                    delete configuration.ports[0].width;
                    delete configuration.ports[0].height;
                }
            } else {
                configuration.fullscreenmode = false;
                if (!(configuration.ports && configuration.ports[0])) {
                    configuration.ports = [
                        {
                            id: "CSCanvas",
                        },
                    ];
                }
                configuration.ports[0].width = document.getElementById("configuration-width").value;
                configuration.ports[0].height = document.getElementById("configuration-height").value;
            }

            configuration.ports[0].transform = [
                {
                    visibleRect: Configuration.visibleRect,
                },
            ];
            configuration.oninit = function () {
                UI.entermode("geometry");
            };

            makeCindyJS();
        };
    },

    enter: function () {
        document.getElementById("configuration-window").style.display = "block";
        document.getElementById("configuration-fullscreen").checked = configuration.fullscreenmode;
        document.getElementById("configuration-fullscreen").onchange();

        try {
            this.visibleRect = configuration.ports[0].transformconfiguration.ports[0].transform[0].visibleRect;
            if (this.visibleRect) {
                cdy.evokeCS(
                    `startvisiblerect(${visibleRect[0]},${visibleRect[1]},${visibleRect[2]},${visibleRect[3]})`
                );
            }
        } catch (error) {
            cdy.evokeCS(`startvisiblerect()`);
        }
    },

    leave: function () {
        document.getElementById("configuration-window").style.display = "none";
        cdy.evokeCS(`stopvisiblerect()`);
    },

    updaterect: function (str) {
        this.visibleRect = JSON.parse(str);

        let ratio =
            Math.abs(this.visibleRect[3] - this.visibleRect[1]) / Math.abs(this.visibleRect[2] - this.visibleRect[0]);

        let width = document.getElementById("configuration-width").value;
        height = Math.round(width * ratio);
        document.getElementById("configuration-height").value = height;
    },
};
