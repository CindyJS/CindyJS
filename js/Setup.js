var csconsole;
var cslib;

var cscompiled={};

var csanimating=false;
var csticking=false;

dump=function(a){
  console.log(JSON.stringify(a));
  };

dumpcs=function(a){
  console.log(niceprint(a));
  };

evalcs=function(a){
    var prog=evaluator.parse([General.wrap(a)],[]);
    var erg=evaluate(prog);
    dumpcs(erg);
}


evokeCS = function(code){
    var cscode=condense(code);

    var parsed = analyse(cscode,false);
    console.log(parsed);
    evaluate(parsed);
    evaluate(cscompiled.draw);
}


createCindy = function(data){ 
    csmouse = [100, 100];
    cscount = 0;
    var cscode;
    var c=document.getElementById(data.canvasname);
    csctx=c.getContext("2d");
    
    
    //Setup the scripts
    var scripts=["move","keydown","mousedown","mouseup","mousedrag","init","tick"];
    
    scripts.forEach(function(s){
        var sname=s+"script";
        if(data[sname]){
          cscode=document.getElementById(data[sname]).text;
          cscode=condense(cscode);
          cscompiled[s]=analyse(cscode,false);
      }
    });

    //Setup canvasstuff

    csw=c.width;
    csh=c.height;
    csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
    csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;
    
    csgeo={};
    
    var i=0;
    images={};
    
    //Read Geometry
    if(!data.geometry) {
        data.geometry=[];
    }
    csinit(data.geometry);
    
    //Read Geometry
    if(!data.behavior) {
        data.behavior=[];
    }
    if(typeof csinitphys == 'function')
        csinitphys(data.behavior);
    
    //Read images: TODO ordentlich machen

    for (var k in data.images) {
        var name=data.images[k];
        images[k] = new Image();
        images[k].ready=false;
        images[k].onload = function() {
            images[k].ready=true;
            updateCindy();

            
        };
        images[k].src = name;
    }
    //Evaluate Init script
    evaluate(cscompiled.init);


    
    setuplisteners(document.getElementById(data.canvasname));

}

var csplay=function(){
  csanimating=true;
console.log("START");
  startit();
}

var cspause=function(){
console.log("PAUSE");

  csanimating=false;
}

var csstop=function(){
console.log("STOP");

  csanimating=false;
}


