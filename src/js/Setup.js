var createCindy = this; // since this will be turned into a method

var csconsole;
var cslib;

var cscompiled={};

var csanimating=false;
var csticking=false;
var csscale=1;
var csgridsize=0;
var csgridscript;
var cssnap=false;

function dump(a){
  console.log(JSON.stringify(a));
}

function dumpcs(a){
  console.log(niceprint(a));
}

function evalcs(a){
    var prog=evaluator.parse([General.wrap(a)],[]);
    var erg=evaluate(prog);
    dumpcs(erg);
}


function evokeCS(code){
    var cscode=condense(code);

    var parsed = analyse(cscode,false);
    console.log(parsed);
    evaluate(parsed);
    updateCindy();
}


function initialTransformation(data) {
    if(data.transform) {
        var trafos=data.transform;
        for(var i=0;i<trafos.length;i++){
           var trafo=trafos[i];
           var trname=Object.keys(trafo)[0]; 
           if(trname==="scale"){
               csscale=trafo.scale;
               csport[trname](trafo.scale);
           }
           if(trname==="translate"){
               csport[trname](trafo.translate[0],trafo.translate[1]);
           }
           if(trname==="scaleAndOrigin"){
               csscale=trafo[trname][0]/25;
               csport[trname].apply(null,trafo[trname]);
           }
        }
        csport.createnewbackup();
    }
}

var csmouse, csctx, csw, csh, csgeo, images;

function createCindyNow(){
    var data = instanceInvocationArguments;
    if (data.csconsole !== undefined)
        csconsole = data.csconsole;
    csmouse = [100, 100];
    var cscode, c;
    if (typeof document !== "undefined") {
        c=document.getElementById(data.canvasname);
        csctx=c.getContext("2d");
    }

    //Run initialscript
    cscode=condense(initialscript);
    var iscr=analyse(cscode,false);
    evaluate(iscr);
    
    //Setup the scripts
    var scripts=["move","keydown","mousedown","mouseup","mousedrag","init","tick","draw"];
    var scriptconf=data.scripts, scriptpat=null;
    if (typeof scriptconf === "string" && scriptconf.search(/\*/))
        scriptpat = scriptconf;
    if (typeof scriptconf !== "object")
        scriptconf = null;

    scripts.forEach(function(s){
        var cscode;
        if(scriptconf!== null && scriptconf[s]) {
            cscode = scriptconf[s];
        } else {
            var sname=s+"script";
            if(data[sname]){
                cscode=document.getElementById(data[sname]);
            } else if (scriptpat) {
                cscode=document.getElementById(scriptpat.replace(/\*/, s));
                if (!cscode)
                    return;
            } else {
                return;
            }
            cscode=cscode.text;
        }
        cscode=condense(cscode);
        cscompiled[s]=analyse(cscode,false);
    });

    //Setup canvasstuff
    if(data.grid &&data.grid!==0){
      csgridsize=data.grid; 
      csgridscript=analyse('#drawgrid('+csgridsize+')',false);
    }
    if(data.snap) cssnap=data.snap;
    initialTransformation(data);

    if (c) {
        csw=c.width;
        csh=c.height;
        csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
        csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;
    }

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
    if(typeof csinitphys === 'function')
        csinitphys(data.behavior);
    
    //Read images: TODO ordentlich machen
    for (var k in data.images) {
        var name=data.images[k];
        images[k] = new Image();
        images[k].ready=false;
        /*jshint -W083 */
        images[k].onload = function() {
            images[k].ready=true;
            updateCindy();

            
        };
        /*jshint +W083 */
        images[k].src = name;
    }

    globalInstance.canvas = c;

    // Invoke oninit callback
    if (data.oninit)
        data.oninit(globalInstance);

    if (data.exclusive) {
        i = createCindy.instances.length;
        while (i > 0)
            createCindy.instances[--i].shutdown();
    }
    createCindy.instances.push(globalInstance);

    //Evaluate Init script
    evaluate(cscompiled.init);

    if (data.autoplay)
        csplay();

    if (c)
        setuplisteners(c, data);

}

var backup=[];
function backupGeo(){

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

}


function restoreGeo(){


    for( var i=0; i<backup.length; i++ ) {
         var name=JSON.parse(backup[i].name);
         
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
         }
    }

}



function csplay(){
  csanimating=true;
  backupGeo();
  startit();
}

function cspause(){

  csanimating=false;
}

function csstop(){

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
;

var shutdownHooks = [];
var isShutDown = false;

function shutdown(){
    if (isShutDown)
        return; // ignore multiple calls
    isShutDown = true;
    // console.log("Shutting down");

    // Remove this from the list of all running instances
    var n = createCindy.instances.length;
    while (n > 0) {
        if (createCindy.instances[--n] === globalInstance) {
            createCindy.instances.splice(n, 1);
            break;
        }
    }

    // Call hooks in reverse order
    n = shutdownHooks.length;
    while (n > 0) {
        try { shutdownHooks[--n](); }
        catch(e) { console.error(e); }
    }
}

// The following object will be returned from the public createCindy function.
// Its startup method will be called automatically unless specified otherwise.
var globalInstance = {
    "config": instanceInvocationArguments,
    "startup": createCindyNow,
    "shutdown": shutdown,
    "evokeCS": evokeCS,
    "play": csplay,
    "pause": cspause,
    "stop": csstop,
    "evalcs": function(code) {
      return evaluate(analyse(condense(code), false));
    },
    "niceprint": niceprint,
    "canvas": null, // will be set during startup
};
