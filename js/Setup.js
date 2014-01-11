var csconsole;
var cslib;
dump=function(a){
  console.log(JSON.stringify(a));
  };

dumpcs=function(a){
  console.log(niceprint(a));
  };


createCindy = function(data){ 
    csmouse = [100, 100];
    cscount = 0;
    var c=document.getElementById(data.canvasname);
    csctx=c.getContext("2d");
    
    
    
    /*
    function reqListener () {
        var lib=this.responseText;

        lib=condense(lib);
        console.log(lib);
        cslib=analyse(lib,false);
        console.log(cslib);
        evaluate(cslib);
        updateCindy();
        
    }
    
    
    
    var oReq = new XMLHttpRequest();
    oReq.onload = reqListener;
    oReq.open("get","js/includes/geolib.txt" , true);
    oReq.send();
    
   
    */
    
    cscode=document.getElementById(data.movescript).text;
    cscode=condense(cscode);
    cserg=analyse(cscode,false);
    

    csw=c.width;
    csh=c.height;
    csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
    csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;
    
    csgeo={};
    
    var i=0;
    
    images={};

    csinit(gslp);
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
    setuplisteners(document.getElementById(data.canvasname));

}

