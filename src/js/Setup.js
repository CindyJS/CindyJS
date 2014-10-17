var csconsole;
var cslib;

var cscompiled={};

var csanimating=false;
var csticking=false;
var csscale=0;
var csgridsize=0;
var csgridscript;
var cssnap=false;

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


var initialTransformation = function(data) {
    if(data.transform) {
        var trafos=data.transform;
        for(var i=0;i<trafos.length;i++){
           var trafo=trafos[i];
           var trname=Object.keys(trafo)[0]; 
           if(trname=="scale"){
               csscale=trafo.scale;
               csport[trname](trafo.scale)
           }
           if(trname=="translate"){
               csport[trname](trafo.translate[0],trafo.translate[1])
           }
        }
        csport.createnewbackup();
    }
}


createCindy = function(data){ 
    csmouse = [100, 100];
    cscount = 0;
    var cscode;
    var c=document.getElementById(data.canvasname);
    csctx=c.getContext("2d");
    //Run initialscript
          cscode=condense(initialscript);
          var iscr=analyse(cscode,false);
    evaluate(iscr);

    
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
    if(data.grid &&data.grid!=0){
      csgridsize=data.grid; 
      csgridscript=analyse('#drawgrid('+csgridsize+')',false);
    };
    if(data.snap){cssnap=data.snap};
    initialTransformation(data);

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



backup=[];
var backupGeo=function(){

    backup=[];

    for( var i=0; i<csgeo.points.length; i++ ) {
         var el=csgeo.points[i];
         var data={
             name:JSON.stringify(el.name),
             homog:JSON.stringify(el.homog),
             sx:JSON.stringify(el.sx),
             sy:JSON.stringify(el.sy),
             sz:JSON.stringify(el.sz)
         };       
         if(typeof(el.behavior)!=='undefined'){
             data.vx=JSON.stringify(el.behavior.vx);
             data.vy=JSON.stringify(el.behavior.vy);
             data.vz=JSON.stringify(el.behavior.vz);
         } 
         
         backup.push(data);   
              
    }

};


var restoreGeo=function(){


    for( var i=0; i<backup.length; i++ ) {
         name=JSON.parse(backup[i].name);
         
         var el=csgeo.csnames[name];
         el.homog=JSON.parse(backup[i].homog);
         el.sx=JSON.parse(backup[i].sx);
         el.sy=JSON.parse(backup[i].sy);
         el.sz=JSON.parse(backup[i].sz);
         if(typeof(el.behavior)!=='undefined'){//TODO Diese Physics Reset ist FALSCH
           el.behavior.vx=JSON.parse(backup[i].vx);
           el.behavior.vy=JSON.parse(backup[i].vy);
           el.behavior.vz=JSON.parse(backup[i].vz);
           el.behavior.fx=0;
           el.behavior.fy=0;
           el.behavior.fz=0;
         };              
    }

};



var csplay=function(){
  csanimating=true;
  backupGeo();
  startit();
}

var cspause=function(){

  csanimating=false;
}

var csstop=function(){

  csanimating=false;
  restoreGeo();
}

var initialscript=
'           #drawgrid(s):=('+
'              regional(b,xmin,xmax,ymin,ymax,nx,ny);'+
'              b=screenbounds();'+
'              xmin=b_4_1-s;'+
'              xmax=b_2_1+s;'+
'              ymin=b_4_2-s;'+
'              ymax=b_2_2+s;'+
'              nx=round((xmax-xmin)/s);'+
'              ny=round((ymax-ymin)/s);'+
'              xmin=floor(xmin/s)*s;'+
'              ymin=floor(ymin/s)*s;'+
'              repeat(nx,x,'+
'                 draw((xmin+x*s,ymin),(xmin+x*s,ymax),color->(1,1,1)*.9,size->1);'+
'              );'+
'              repeat(ny,y,'+
'                 draw((xmin,ymin+y*s),(xmax,ymin+y*s),color->(1,1,1)*.9,size->1);'+
'              ) '+
'           );'




