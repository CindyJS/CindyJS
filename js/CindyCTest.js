

var mouse={};
var move;

var cskey="";
var cskeycode=0;

movepoint=function (move){
    if(move.mover==undefined) return;
    m=move.mover;
    if(m.pinned) return;
    m.sx=mouse.x+move.offset.x;
    m.sy=mouse.y+move.offset.y;
    //experimental stuff by Ulli
    //move.offset.x *= 0.95;
    //move.offset.y = (move.offset.y-1.45)*0.95+1.45;
    //dump(move.offset);
    //end
    m.sz=1;
    m.homog=List.realVector([m.sx,m.sy,m.sz]);

}

movepointscr=function (mover,pos){
    m=mover;
    m.sx=pos.value[0].value.real;
    m.sy=pos.value[1].value.real;
    m.sz=1;
    m.homog=pos;

}


getmover = function(mouse){
    var mov;
    var adist=1000000;
    var diff,orad;
    for (var i=0;i<csgeo.free.length;i++){
        var el=csgeo.free[i];

        if(!el.pinned){
            var dx,dy;
            if(el.kind=="P"){
                dx=el.sx-mouse.x;
                dy=el.sy-mouse.y;
                var dist=Math.sqrt(dx*dx+dy*dy);
                var sc=csport.drawingstate.matrix.sdet;
                if(el.narrow & dist>20/sc) dist=10000;
            }
            if(el.kind=="C"){//Must be Circle by Rad
                var mid=csgeo.csnames[el.args[0]];
                var rad=el.radius;
                var xx=CSNumber.div(mid.homog.value[0],mid.homog.value[2]).value.real;
                var yy=CSNumber.div(mid.homog.value[1],mid.homog.value[2]).value.real;
                dx=xx-mouse.x;
                dy=yy-mouse.y;
                var ref=Math.sqrt(dx*dx+dy*dy);
                var dist=ref-rad.value.real;
                orad=-dist;
                dx=0;dy=0;
                if(dist<0){dist=-dist;}
                dist=dist+1;
            }
            if(el.kind=="L"){//Must be ThroughPoint(Horizontal/Vertical not treated yet)
                var l=List.normalizeZ(el.homog);
                var N=CSNumber;
                var nn=N.add(N.mult(l.value[0],N.conjugate(l.value[0])),
                             N.mult(l.value[1],N.conjugate(l.value[1])));
                var ln=List.scaldiv(N.sqrt(nn),l);
                var dist=ln.value[0].value.real*mouse.x+ln.value[1].value.real*mouse.y+ln.value[2].value.real;
                dx=ln.value[0].value.real*dist;
                dy=ln.value[1].value.real*dist;
                
                if(dist<0){dist=-dist;}
                dist=dist+1;
            }
            
            if(dist<adist+.2){//A bit a dirty hack, prefers new points
                adist=dist;
                mov=el;
                diff={x:dx,y:dy};
            }
        }
    }
    return {mover:mov,offset:diff,offsetrad:orad};
}


setuplisteners =function(canvas) {
    
    updatePostition= function(x,y){
        var pos=csport.to(x,y);
        mouse.prevx      = mouse.x;
        mouse.prevy      = mouse.y;
        mouse.x       = pos[0];
        mouse.y       = pos[1];
        csmouse[0]=mouse.x;
        csmouse[1]=mouse.y;
        
    }
    
    
    document.onkeydown=function(e){
       cs_keypressed(e);
       return false;
    };

    
    canvas.onmousedown = function (e) {
        mouse.button  = e.which;
        var rect      = canvas.getBoundingClientRect();
        updatePostition(e.clientX - rect.left,e.clientY - rect.top);
        cs_mousedown();
        move=getmover(mouse);
        startit();//starts d3-timer
            
            mouse.down    = true;
            e.preventDefault();
    };
    
    canvas.onmouseup = function (e) {
        mouse.down = false;
        
        cs_mouseup();

        updateCindy();
        
        e.preventDefault();
    };
    
    canvas.onmousemove = function (e) {
        var rect  = canvas.getBoundingClientRect();
        updatePostition(e.clientX - rect.left,e.clientY - rect.top);
        if(mouse.down){
            movepoint(move);
            cs_mousedrag();
        } else {
            cs_mousemove();
        }
        e.preventDefault();
    };
    
    
    
    function touchMove(e) {
        if (!e)
            var e = event;
        
        updatePostition(e.targetTouches[0].pageX - canvas.offsetLeft,
                        e.targetTouches[0].pageY - canvas.offsetTop);
        if(mouse.down){
            movepoint(move);
            cs_mousedrag();
        } else {
            cs_mousemove();
        }
        e.preventDefault();
        
    }
    
    function touchDown(e) {
        if (!e)
            var e = event;
        
        updatePostition(e.targetTouches[0].pageX - canvas.offsetLeft,
                        e.targetTouches[0].pageY - canvas.offsetTop);
        cs_mousedown();

        mouse.down = true;
        move=getmover(mouse);
        startit();
        e.preventDefault();
        
    }
    
    function touchUp(e) {
        mouse.down = false;
        updateCindy();
        cs_mouseup();

        e.preventDefault();
        
    }
    
    canvas.addEventListener("touchstart", touchDown, false);
    canvas.addEventListener("touchmove", touchMove, true);
    canvas.addEventListener("touchend", touchUp, false);
    document.body.addEventListener("touchcancel", touchUp, false);
    //    document.body.addEventListener("mouseup", mouseUp, false);
    
    
    updateCindy();
}


window.requestAnimFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function (callback) {
    //                window.setTimeout(callback, 1000 / 60);
    window.setTimeout(callback, 0);
};

var doit=function(){//Callback for d3-timer
    if(csanimating){
        cs_tick();
    }
    updateCindy();
    csticking=csanimating || mouse.down;
    return !csticking;
    
}

var startit=function(){
    if(!csticking) {
        csticking=true;
        d3.timer(doit)
    }
}

function updateCindy(){
    recalc();                          
    csctx.save();
    csctx.clearRect ( 0   , 0 , csw , csh );
    evaluate(cscompiled.move);
    render();
    csctx.restore();
    
}



function update() {
    
    updateCindy();
    if(mouse.down)
        requestAnimFrame(update);
}


var cs_keypressed=function(e){
    var evtobj=window.event? event : e;
    var unicode=evtobj.charCode? evtobj.charCode : evtobj.keyCode;
    var actualkey=String.fromCharCode(unicode);
    cskey=actualkey;
    cskeycode=unicode;


    evaluate(cscompiled.keydown);
    updateCindy();

}

var cs_mousedown=function(e){
    evaluate(cscompiled.mousedown);

}

var cs_mouseup=function(e){
    evaluate(cscompiled.mouseup);

}


var cs_mousedrag=function(e){
    evaluate(cscompiled.mousedrag);

}


var cs_mousemove=function(e){
    evaluate(cscompiled.mousemove);

}

var cs_tick=function(e){
    if(true) {//TODO: Check here if physics is required
    if(typeof(lab)!=='undefined') {
       lab.tick();
       }
    }
    if(csanimating) {
       evaluate(cscompiled.tick);
    }

}

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



//*************************************************************
// and here are the accessors for properties and elements
//*************************************************************

var Accessor={};

Accessor.generalFields={//Übersetungstafel der Feldnamen 
    color:"color",
    colorhsb:"",
    size:"size",
    alpha:"alpha",
    isshowing:"isshowing",
    visible:"visible",
    name:"name",
    caption:"caption",
    trace:"trace",
    tracelength:"",
    selected:""
}

Accessor.getGeoField=function(geoname,field){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.getField(csgeo.csnames[geoname],field);
    }
    return nada;
}


Accessor.setGeoField=function(geoname,field,value){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.setField(csgeo.csnames[geoname],field,value);
    }
    return nada;
}




Accessor.getField=function(geo,field){
    if(geo.kind=="P"){
        if(field=="xy") {
            var xx=CSNumber.div(geo.homog.value[0],geo.homog.value[2]);
            var yy=CSNumber.div(geo.homog.value[1],geo.homog.value[2]);
            var erg=List.turnIntoCSList([xx,yy]);
            erg.usage="Point";
            
            return erg;
        };
        
        if(field=="homog") {
            var erg=List.clone(geo.homog);//TODO will man hier clonen?
            erg.usage="Point";
            return erg;
        };
        
        
        if(field=="x") {
            var x=CSNumber.div(geo.homog.value[0],geo.homog.value[2]);
            return x;
        };
        
        if(field=="y") {
            var y=CSNumber.div(geo.homog.value[1],geo.homog.value[2]);
            return y;
        };
    } if(geo.kind=="L"){
        if(field=="homog") {
            var erg=List.clone(geo.homog);//TODO will man hier clonen?
            erg.usage="Line";
            return erg;
        }
            if(field=="angle") {
            var erg=List.eucangle(List.ey,geo.homog);
            erg.usage="Angle";
            return erg;
        }

    };
    if(Accessor.generalFields[field]) {//must be defined an an actual string
        var erg=geo[Accessor.generalFields[field]];
        if(erg) {
            erg=General.clone(erg);  
            return erg;
        } else 
            return nada;
    }   
    //Accessors for masses
    if(geo.behavior) {
        if(field=="mass" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.mass);
        }
        if(field=="radius" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.radius);
        }
        if(field=="charge" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.charge);
        }
        if(field=="friction" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.friction);
        }
        if(field=="vx" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.vx);
        }
        if(field=="vy" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.vy);
        }
        if(field=="v" && geo.behavior.type=="Mass") {
           return List.realVector([geo.behavior.vx,geo.behavior.vy]);
        }
        if(field=="fx" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.fx);
        }
        if(field=="fy" && geo.behavior.type=="Mass") {
           return CSNumber.real(geo.behavior.fy);
        }
        if(field=="f" && geo.behavior.type=="Mass") {
           return List.realVector([geo.behavior.fx,geo.behavior.fy]);
        }
    
    }
    return nada;
    
    
}

Accessor.setField=function(geo,field,value){
    if(field=="color") {
        geo.color=List.clone(value);
    }
    if(field=="size") {
        geo.size=General.clone(value);
    }
    if(field=="xy" && geo.kind=="P"&&geo.ismovable && List._helper.isNumberVecN(value,2)) {
        movepointscr(geo,List.turnIntoCSList([value.value[0],value.value[1],CSNumber.real(1)]));
        recalc();
    }

    if(field=="homog" && geo.kind=="P"&&geo.ismovable && List._helper.isNumberVecN(value,2)) {
        movepointscr(geo,General.clone(value));
        recalc();
    }

    if(field=="angle" && geo.kind=="L") {
        var cc=CSNumber.cos(value);
        var ss=CSNumber.sin(value);
        var dir=List.turnIntoCSList([cc,ss,CSNumber.real(0)]);
        geo.dir=dir;
        
    //    movepointscr(geo,General.clone(value));
        recalc();
    }
    if(geo.behavior) {
        if(field=="mass" && geo.behavior.type=="Mass" && value.ctype=="number") {
            geo.behavior.mass=value.value.real;
        }
        if(field=="friction" && geo.behavior.type=="Mass" && value.ctype=="number") {
            geo.behavior.friction=value.value.real;
        }
        if(field=="charge" && geo.behavior.type=="Mass" && value.ctype=="number") {
            geo.behavior.charge=value.value.real;
        }
        if(field=="radius" && geo.behavior.type=="Mass" && value.ctype=="number") {
            geo.behavior.radius=value.value.real;
        }
        if(field=="vx" && geo.behavior.type=="Mass" && value.ctype=="number") {
            geo.behavior.vx=value.value.real;
        }
        if(field=="vy" && geo.behavior.type=="Mass" && value.ctype=="number") {
            geo.behavior.vy=value.value.real;
        }
        if(field=="v" && geo.behavior.type=="Mass" && List._helper.isNumberVecN(value,2)) {
            geo.behavior.vx=value.value[0].value.real;
            geo.behavior.vy=value.value[1].value.real;
        }
    }
    

}



//==========================================
//      Complex Numbers
//==========================================
var CSNumber={};
CSNumber.niceprint= function(a){
    if (a.value.imag==0) {
        return ""+a.value.real;
    }
    
    if(a.value.imag>0){
        return ""+a.value.real+" + i*"+a.value.imag;
    } else {
        return ""+a.value.real+" - i*"+(-a.value.imag);
    }
}

CSNumber.complex=function(r,i){
    return {"ctype":"number" ,  "value":{'real':r,'imag':i}}
}

CSNumber.real=function(r){
    return {"ctype":"number" ,  "value":{'real':r,'imag':0}}
}



CSNumber.clone=function(a){
    return {"ctype":"number" ,  
            "value":{'real':a.value.real,'imag':a.value.imag}, 
            "usage":a.usage}
}


CSNumber.argmax=function(a,b){//Achtung: Gibt referenzen zurück, da 
                            //nur für NormalizeMax verwendet
    
    var n1=a.value.real*a.value.real+a.value.imag*a.value.imag;
    var n2=b.value.real*b.value.real+b.value.imag*b.value.imag;
    return (n1<n2 ? b : a );
    
}


CSNumber.max=function(a,b){
    return {"ctype":"number" ,  "value":{'real':Math.max(a.value.real,b.value.real),
        'imag':Math.max(a.value.imag,b.value.imag)}}
}


CSNumber.min=function(a,b){
    return {"ctype":"number" ,  "value":{'real':Math.min(a.value.real,b.value.real),
        'imag':Math.min(a.value.imag,b.value.imag)}}
}


CSNumber.add=function(a,b){
    return {"ctype":"number" ,  "value":{'real':a.value.real+b.value.real,
        'imag':a.value.imag+b.value.imag}}
}

CSNumber.sub=function(a,b){
    return {"ctype":"number" ,  "value":{'real':a.value.real-b.value.real,
        'imag':a.value.imag-b.value.imag}}
}

CSNumber.neg=function(a){
    return {"ctype":"number" ,
        "value":{'real':-a.value.real, 'imag':-a.value.imag}}
}


CSNumber.re=function(a){
    return {"ctype":"number" ,
        "value":{'real':a.value.real, 'imag':0}}
}


CSNumber.im=function(a){
    return {"ctype":"number" ,
        "value":{'real':a.value.imag, 'imag':0}}
}

CSNumber.conjugate=function(a){
    return {"ctype":"number" ,
        "value":{'real':a.value.real, 'imag':-a.value.imag}}
}



CSNumber.round=function(a){
    return {"ctype":"number" ,
        "value":{'real':Math.round(a.value.real), 'imag':Math.round(a.value.imag)}}
}

CSNumber.ceil=function(a){
    return {"ctype":"number" ,
        "value":{'real':Math.ceil(a.value.real), 'imag':Math.ceil(a.value.imag)}}
}

CSNumber.floor=function(a){
    return {"ctype":"number" ,
        "value":{'real':Math.floor(a.value.real), 'imag':Math.floor(a.value.imag)}}
}



CSNumber.mult=function(a,b){
    return {"ctype":"number" ,
        "value":{'real':a.value.real*b.value.real-a.value.imag*b.value.imag,
            'imag':a.value.real*b.value.imag+a.value.imag*b.value.real}};
}


CSNumber.abs2=function(a,b){
    return {"ctype":"number" ,
        "value":{'real':a.value.real*a.value.real+a.value.imag*a.value.imag,
            'imag':0}};
}

CSNumber.abs=function(a1){
    return CSNumber.sqrt(CSNumber.abs2(a1))
}


CSNumber.inv=function(a){
    var s=a.value.real*a.value.real+a.value.imag*a.value.imag;
    if(s==0) {
        console.log("DIVISION BY ZERO");
//        halt=immediately;
    
    }
    return {"ctype":"number" ,
        "value":{'real':a.value.real/s,
            'imag':-a.value.imag/s}}
}


CSNumber.div=function(a,b){
    return CSNumber.mult(a,CSNumber.inv(b));
}


CSNumber.eps=0.0000001;

CSNumber.snap=function(a){
    var r=a.value.real;
    var i=a.value.imag;
    if(Math.floor(r+CSNumber.eps)!=Math.floor(r-CSNumber.eps)){
        r=Math.round(r);
    }
    if(Math.floor(i+CSNumber.eps)!=Math.floor(i-CSNumber.eps)){
        i=Math.round(i);
    }
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
    
}

CSNumber.exp=function(a){
    var n = Math.exp(a.value.real);
    var r = n * Math.cos(a.value.imag);
    var i = n * Math.sin(a.value.imag);
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}

CSNumber.cos=function(a) {
    var rr=a.value.real;
    var ii=a.value.imag;
    var n = Math.exp(ii);
    var imag1 = n * Math.sin(-rr);
    var real1 = n * Math.cos(-rr);
    n = Math.exp(-ii);
    var imag2 = n * Math.sin(rr);
    var real2 = n * Math.cos(rr);
    var i = (imag1 + imag2) / 2.0;
    var r = (real1 + real2) / 2.0;
  //  if (i * i < 1E-30) i = 0;
  //  if (r * r < 1E-30) r = 0;
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}

CSNumber.sin=function(a) {
    var rr=a.value.real;
    var ii=a.value.imag;
    var n = Math.exp(ii);
    var imag1 = n * Math.sin(-rr);
    var real1 = n * Math.cos(-rr);
    n = Math.exp(-ii);
    var imag2 = n * Math.sin(rr);
    var real2 = n * Math.cos(rr);
    var r = -(imag1 - imag2) / 2.0;
    var i = (real1 - real2) / 2.0;
  //  if (i * i < 1E-30) i = 0;
  //  if (r * r < 1E-30) r = 0;
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}

CSNumber.tan=function(a) {
    var s=CSNumber.sin(a);
    var c=CSNumber.cos(a);
    return CSNumber.div(s,c);
}

CSNumber.arccos=function(a) {  //OK hässlich aber tuts.
    var t2=CSNumber.mult(a,CSNumber.neg(a));
    var tmp=CSNumber.sqrt(CSNumber.add(CSNumber.real(1),t2));
    var tmp1=CSNumber.add(CSNumber.mult(a,CSNumber.complex(0,1)),tmp);
    var erg=CSNumber.add(CSNumber.mult(CSNumber.log(tmp1),CSNumber.complex(0,1)),CSNumber.real(Math.PI*0.5));
    erg.usage = 'angle';
    return erg;
}

CSNumber.arcsin=function(a) {  //OK hässlich aber tuts.
    var t2=CSNumber.mult(a,CSNumber.neg(a));
    var tmp=CSNumber.sqrt(CSNumber.add(CSNumber.real(1),t2));
    var tmp1=CSNumber.add(CSNumber.mult(a,CSNumber.complex(0,1)),tmp);
    var erg=CSNumber.mult(CSNumber.log(tmp1),CSNumber.complex(0,-1));
    erg.usage = 'angle';
    return erg;
}

CSNumber.arctan=function(a) {  //OK hässlich aber tuts.
    var t1=CSNumber.log(CSNumber.add(CSNumber.mult(a,CSNumber.complex(0,-1)),CSNumber.real(1)));
    var t2=CSNumber.log(CSNumber.add(CSNumber.mult(a,CSNumber.complex(0,1)),CSNumber.real(1)));
    var erg=CSNumber.mult(CSNumber.sub(t1,t2),CSNumber.complex(0,0.5));
    erg.usage = 'angle';
    return erg;
}


//Das ist jetzt genau so wie in Cindy.
//Da wurde das aber niemals voll auf complexe Zahlen umgestellt
//Bei Beiden Baustellen machen!!!
CSNumber.arctan2=function(a,b) {  //OK
    var erg= CSNumber.real(Math.atan2(b.value.real,a.value.real));
    erg.usage = 'angle';
    return erg;
}



CSNumber.sqrt=function(a)  {
    var rr=a.value.real;
    var ii=a.value.imag;
    var n = Math.sqrt(Math.sqrt(rr * rr + ii * ii));
    var w = Math.atan2(ii, rr);
    var i = n * Math.sin(w / 2);
    var r = n * Math.cos(w / 2);
    return {"ctype":"number" ,"value":{'real':r,'imag':i}};
}


CSNumber.log=function(a){
    var re=a.value.real;
    var im=a.value.imag;
    var s = Math.sqrt(re*re+im*im);
    var i = im;
    

    var imag = Math.atan2(im, re);
    if (i < 0) {
        imag += (2 * Math.PI);
    }
    if (i == 0 && re < 0) {
        imag = Math.PI;
    }
    if (imag > Math.PI) {
        imag -= (2 * Math.PI)
    };
    var real = Math.log(s);
    
    return CSNumber.snap({"ctype":"number" ,"value":{'real':real,'imag':imag}});
}





CSNumber.pow=function(a,b){
    
    if(b.value.real==Math.round(b.value.real)&& b.value.imag==0){//TODO später mal effizienter machen
        var erg={"ctype":"number" ,"value":{'real':1,'imag':0}};
        for(var i=0;i<Math.abs(b.value.real);i++){
            erg=CSNumber.mult(erg,a);
        }
        if (b.value.real<0){
            return CSNumber.inv(erg);
        }
        return(erg);
        
    }
    var res=CSNumber.exp(CSNumber.mult(CSNumber.log(a),b));
    return res;
}


CSNumber.mod=function(a,b){
    var a1=a.value.real;
    var a2=b.value.real;
    var b1=a.value.imag;
    var b2=b.value.imag;

    
    var r = a1 - Math.floor(a1 / a2) * a2;
    var i = b1 - Math.floor(b1 / b2) * b2;
    if(a2==0) {r=0};
    if(b2==0) {i=0};
    
    return CSNumber.snap({"ctype":"number" ,"value":{'real':r,'imag':i}});
}

CSNumber._helper={};

CSNumber._helper.seed='NO';
CSNumber.eps=0.0000000001;
CSNumber.epsbig=0.000001;

CSNumber._helper.seedrandom=function(a){
    a=a-Math.floor(a);
    a=a*.8+.1;
    CSNumber._helper.seed=a;
}

CSNumber._helper.rand=function(){
    if(CSNumber._helper.seed=='NO'){
        return Math.random();
    }
    var a=CSNumber._helper.seed;
    a=Math.sin(1000*a)*1000;
    a=a-Math.floor(a);
    CSNumber._helper.seed=a;
    return a;
}

CSNumber._helper.randnormal=function(){
    var a=CSNumber._helper.rand();
    var b=CSNumber._helper.rand();
    return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*b);
}


CSNumber._helper.isEqual=function(a,b) {
    return (a.value.real == b.value.real) && (a.value.imag == b.value.imag);
}

CSNumber._helper.isLessThan=function(a,b) {

    return(a.value.real < b.value.real 
           || a.value.real == b.value.real && a.value.imag < b.value.imag)
}

CSNumber._helper.compare=function(a,b) {
    if(CSNumber._helper.isLessThan(a,b)){return -1}
    if(CSNumber._helper.isEqual(a,b)){return 0}
    return 1;
}

CSNumber._helper.isAlmostEqual=function(a,b) {
    var r=a.value.real-b.value.real;
    var i=a.value.imag-b.value.imag;
    return (r<CSNumber.eps) && (r>-CSNumber.eps)&&(i<CSNumber.eps) && (i>-CSNumber.eps);
}

CSNumber._helper.isZero=function(a) {
    return (a.value.real == 0) && (a.value.imag == 0);
}

CSNumber._helper.isAlmostZero=function(a) {
    var r=a.value.real;
    var i=a.value.imag;
    return (r<CSNumber.eps) && (r>-CSNumber.eps)&&(i<CSNumber.eps) && (i>-CSNumber.eps);
}



CSNumber._helper.isReal=function(a) {
    return (a.value.imag == 0) ;
}

CSNumber._helper.isAlmostReal=function(a) {
    var i=a.value.imag;
    return (i<CSNumber.epsbig) && (i>-CSNumber.epsbig);//So gemacht wie in Cindy
}

CSNumber._helper.isNaN=function(a) {
    return (isNaN(a.value.real)) || (isNaN(a.value.imag));
}


CSNumber._helper.isAlmostImag=function(a) {
    var r=a.value.real;
    return (r<CSNumber.epsbig) && (r>-CSNumber.epsbig);//So gemacht wie in Cindy
}


var operators={};
operators[':']=20;    //Colon: Feldzugriff auf Selbstdefinierte Felder
operators['.']=25;   //Dot: Feldzugriff
operators['\u00b0']=25;   //Degree
operators['_']=50;   //x_i i-tes Element von x
operators['^']=50;   //hoch
operators['*']=100;  //Multiplikation (auch für Vectoren, Scalarmul)
operators['/']=100;  //Division (auch für Vectoren, Scalerdiv)
operators['+']=200;  //Addition (auch für Vectoren, Vectorsumme)
operators['-']=200;  //Subtraktion (auch für Vectoren, Vectordiff)
operators['!']=200;  //Logisches Not (einstellig)
operators['==']=300; //Equals
operators['~=']=300; //approx Equals
operators['~<']=300; //approx smaller
operators['~>']=300; //approx greater
operators['=:=']=300;//Equals after evaluation
operators['>=']=300; //Größergleich
operators['<=']=300; //Kleinergleich
operators['~>=']=300; //ungefähr Größergleich
operators['~<=']=300; //ungefähr Kleinergleich
operators['>']=300;  //Größer
operators['<']=300;  //Kleiner
operators['<>']=300; //Ungleich
operators['&']=350;  //Logisches Und
operators['%']=350;  //Logisches Oder
operators['!=']=350; //Ungleich
operators['~!=']=350; //ungefähr Ungleich
operators['..']=350; //Aufzählung 1..5=(1,2,3,4,5)
operators['++']=370; //Listen Aneinanderhängen
operators['--']=370; //Listen wegnehmen
operators['~~']=370; //Gemeinsame Elemente
operators[':>']=370; //Append List
operators['<:']=370; //Prepend List
operators['=']=400;  //Zuweisung
operators[':=']=400; //Definition
operators[':=_']=400; //Definition
operators['::=']=400; //Definition
operators['->']=400; //Modifier
operators[',']=500;  //Listen und Vektoren Separator
operators[';']=500;  //Befehlsseparator


var infixmap={};
infixmap['+']='add';
infixmap['-']='minus';
infixmap['*']='mult';
infixmap['/']='div';
infixmap['^']='pow';
infixmap['°']='numb_degree';
infixmap[';']='semicolon';
infixmap['=']='assign';
infixmap['..']='sequence';
infixmap[':=']='define';
infixmap['==']='comp_equals';
infixmap['!=']='comp_notequals';
infixmap['~=']='comp_almostequals';
infixmap['~!=']='comp_notalmostequals';
infixmap['>']='comp_gt';
infixmap['<']='comp_lt';
infixmap['>=']='comp_ge';
infixmap['<=']='comp_le';
infixmap['~>']='comp_ugt';
infixmap['~<']='comp_ult';
infixmap['~>=']='comp_uge';
infixmap['~<=']='comp_ule';
infixmap['&']='and';
infixmap['%']='or';
infixmap['!']='not';
infixmap['_']='take';
infixmap['++']='concat';
infixmap['~~']='common';
infixmap['--']='remove';
infixmap[':>']='append';
infixmap['<:']='prepend';


//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

var niceprint=function(a){
    if(typeof a==='undefined'){
        return '_??_';
    }
    if(a.ctype=='undefined'){
        return '_?_';
    }
    if(a.ctype=='number'){
        return CSNumber.niceprint(a);
    }
    if(a.ctype=='string'){
        return a.value;
    }
    if(a.ctype=='boolean'){
        return a.value;
    }
    if(a.ctype=='list'){
        var erg="[";
        for(var i=0;i<a.value.length;i++){
            erg=erg+niceprint(evaluate(a.value[i]));
            if(i!=a.value.length-1){
                erg=erg+', ';
            }
            
        }
        return erg+"]";
    }
    if(a.ctype=='function'){
        return 'FUNCTION';
        
    }
    if(a.ctype=='infix'){
        return 'INFIX';
    }
    if(a.ctype=='modifier'){
        return a.key+'->'+niceprint(a.value);
    }
    if(a.ctype=='shape'){
        return a.type;
    }

    if(a.ctype=='error'){
        return "Error: "+a.message;
    }
    if(a.ctype=='variable'){
    console.log("HALLO");
        return niceprint(a.stack[length.stack]);
    }

    if(a.ctype=='geo'){
        return a.value.name;
    }


    return "__";
    
}


//TODO Eventuell auslagern
//*******************************************************
//this is the container for self-defined functions
//Distinct form evaluator for code clearness :-)
//*******************************************************
var myfunctions= function(name,args,modifs){
    var tt=myfunctions[name];
    if(tt===undefined){
        return nada;
    }
    
    var set=[];
    
    for(var i=0;i<tt.arglist.length;i++){
        set[set.length]=evaluate(args[i]);
    }
    for(var i=0;i<tt.arglist.length;i++){
        namespace.newvar(tt.arglist[i].name);
        namespace.setvar(tt.arglist[i].name,set[i]);
    }
    namespace.pushVstack("*");
    var erg= evaluate(tt.body);
    namespace.cleanVstack();
    for(var i=0;i<tt.arglist.length;i++){
        namespace.removevar(tt.arglist[i].name);
    }
    return erg;
    //                    return tt(args,modifs);
}

//*******************************************************
//this function evaluates a concrete function
//*******************************************************
var evaluator={};
evaluator._helper={};

evaluator._helper.eval= function(name,args,modifs){
    var tt=evaluator[name];
    if(tt===undefined){
        return myfunctions(name+args.length,args,modifs); //Ich habe  überdefinieren von fkts rausgenommen
        //Das muss man sich auch insbesomndere mit Arity nochmal anschauen
    }
    return tt(args,modifs);
}



evaluator._helper.clone=function(a){//Das ist jetzt gerade mal ätzend un-OO
   if(a.ctype=='list'){return List.clone(a);}
   if(a.ctype=='number'){return CSNumber.clone(a);}
   return a;//Werden die anderen sachen gecloned, in Cindy ist das nicht so???

}

evaluator._helper.equals=function(v0,v1){//Und nochmals un-OO
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return {'ctype':'boolean' ,
            'value':(v0.value.real==v1.value.real)&&
            (v0.value.imag==v1.value.imag)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        var erg=List.equals(v0,v1);
        return erg;
    }
    return {'ctype':'boolean' ,'value':false  };
}

//==========================================
//      Things that apply to several types
//==========================================
var General={};
General._helper={};

General.order={
undefined:0,
boolean:1,
number:2,
term:3,
atomic:4,
variable:5,
geo:6,
string:7,
list:8
} 

General.string=function(s){
    return {ctype:"string",value:s}
}

General.bool=function(b){
    return {ctype:"boolean",value:b}
}

General.isLessThan=function(a,b){
    return General.compare(a,b)==-1;
    
}


General.isEqual=function(a,b){
    return General.compare(a,b)==0;
    
}


General.compareResults=function(a,b){
    return General.compare(a.result,b.result);
}

General.compare=function(a,b){
    if (a.ctype!=b.ctype){
        return (General.order[a.ctype]-General.order[b.ctype])
    }
    if (a.ctype=='number') {
        return CSNumber._helper.compare(a,b);
    }
    if (a.ctype=='list') {
        return List._helper.compare(a,b);
    }
    if (a.ctype=='string') {
        if(a.value==b.value) {
            return 0;
        }
        if(a.value<b.value) {
            return -1;
        }
        return 1;
    }
    if (a.ctype=='boolean') {
        if(a.value==b.value) {
            return 0;
        }
        if(a.value==false) {
            return -1
        }
        return 1;
    }
    
}

General.add=function(v0,v1){
    if(v0.ctype == 'void'  && v1.ctype=='number' ){   //Monadisches Plus
        return CSNumber.clone(v1);
    }
    
    if(v0.ctype=='number'  && v1.ctype=='number' ){
        return CSNumber.add(v0,v1);
    }
    if(v0.ctype=='string' || v1.ctype=='string' ){
        return {"ctype":"string" ,  "value":niceprint(v0)+niceprint(v1)}
    }
    
    if(v0.ctype=='list' && v1.ctype=='list' ){
        return List.add(v0,v1)
    }
    return nada;
}

General.mult=function(v0,v1){
    
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.mult(v0,v1);
    }
    if(v0.ctype=='number' &&v1.ctype=='list' ){
        return List.scalmult(v0,v1);
    }
    if(v0.ctype=='list' &&v1.ctype=='number' ){
        return List.scalmult(v1,v0);
    }
    if(v0.ctype=='list' &&v1.ctype=='list' ){
        return List.mult(v0,v1);
    }
    return nada;
    
}

General.div=function(v0,v1){
    
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.div(v0,v1);
    }
    if(v0.ctype=='list' &&v1.ctype=='number' ){
        return List.scaldiv(v1,v0);
    }
    return nada;
}



General.max=function(v0,v1){
    
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.max(v0,v1);
    }
    if(v0.ctype=='list' &&v1.ctype=='list' ){
        return List.max(v0,v1);
    }
    return nada;
    
}



General.min=function(v0,v1){
    
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.min(v0,v1);
    }
    if(v0.ctype=='list' &&v1.ctype=='list' ){
        return List.min(v0,v1);
    }
    return nada;
    
}

General.clone=function(v){
    if(v.ctype=='number' ){
        return CSNumber.clone(v);
    }
    if(v.ctype=='list' ){
        return List.clone(v);
    }
    if(v.ctype=='boolean' ){
        return {ctype:"boolean", value:v.value};
    }
    if(v.ctype=='string' ){
        return {ctype:"string", value:v.value};
    }
    
    return General.wrap(v);
    
}

General.wrap=function(v){
    if(typeof v=="number") {
        return CSNumber.real(v);
    }
    if(typeof v=="object"&&v.length!=undefined) {//evtl in List ziehen
        var li=[];
        for(var i=0;i<v.length;i++){
           li[i]=General.wrap(v[i]);
        }
        return List.turnIntoCSList(li);
    }
    if(typeof v=="string") {
        return {ctype:"string", value:v};
    }
    if(typeof v=="boolean") {
        return {ctype:"boolean", value:v};
    }
    return nada;    
}


//==========================================
//      Lists
//==========================================
var List={};
List._helper={};

List.turnIntoCSList=function(l){
    return {'ctype':'list','value':l};
}


List.realVector=function(l){
    var erg=[];
    for(var i=0;i<l.length;i++){
        erg[erg.length]={"ctype":"number" ,"value":{'real':l[i],'imag':0}};
    }
    return {'ctype':'list','value':erg};
}

List.realMatrix=function(l){
    var erg=[];
    for(var i=0;i<l.length;i++){
        erg[erg.length]=List.realVector(l[i]);
    }
    return List.turnIntoCSList(erg);
}

List.ex=List.realVector([1,0,0]);
List.ey=List.realVector([0,1,0]);
List.ez=List.realVector([0,0,1]);




List.linfty=List.realVector([0,0,1]);

List.ii=List.turnIntoCSList([CSNumber.complex(1,0),
    CSNumber.complex(0,1),
    CSNumber.complex(0,0)]);

List.jj=List.turnIntoCSList([CSNumber.complex(1,0),
    CSNumber.complex(0,-1),
    CSNumber.complex(0,0)]);


List.fundDual=List.realMatrix([[1,0,0],[0,1,0],[0,0,0]]);
List.fund=List.realMatrix([[0,0,0],[0,0,0],[0,0,1]]);


List.sequence=function(a,b){
    var erg=[];
    for(var i=Math.round(a.value.real);i<Math.round(b.value.real)+1;i++){
        erg[erg.length]={"ctype":"number" ,"value":{'real':i,'imag':0}};
    }
    return {'ctype':'list','value':erg};
}

List.pairs=function(a){
    var erg=[];
    for(var i=0;i<a.value.length-1;i++){
        for(var j=i+1;j<a.value.length;j++){
            erg[erg.length]={'ctype':'list','value':[a.value[i],a.value[j]]};
        }
    }
    return {'ctype':'list','value':erg};
}

List.triples=function(a){
    var erg=[];
    for(var i=0;i<a.value.length-2;i++){
        for(var j=i+1;j<a.value.length-1;j++){
            for(var k=j+1;k<a.value.length;k++){
                erg[erg.length]={'ctype':'list','value':[a.value[i],a.value[j],a.value[k]]};
            }
        }
    }
    return {'ctype':'list','value':erg};
}

List.triples=function(a){
    var erg=[];
    for(var i=0;i<a.value.length-2;i++){
        for(var j=i+1;j<a.value.length-1;j++){
            for(var k=j+1;k<a.value.length;k++){
                erg[erg.length]={'ctype':'list','value':[a.value[i],a.value[j],a.value[k]]};
            }
        }
    }
    return {'ctype':'list','value':erg};
}


List.cycle=function(a){
    var erg=[];
    for(var i=0;i<a.value.length-1;i++){
        erg[erg.length]={'ctype':'list','value':[a.value[i],a.value[i+1]]};
    }
    erg[erg.length]={'ctype':'list','value':[a.value[a.value.length-1],a.value[0]]};
    
    return {'ctype':'list','value':erg};
}

List.consecutive=function(a){
    var erg=[];
    for(var i=0;i<a.value.length-1;i++){
        erg[erg.length]={'ctype':'list','value':[a.value[i],a.value[i+1]]};
    }
    
    return {'ctype':'list','value':erg};
}

List.reverse=function(a){
    var erg=[];
    for(var i=a.value.length-1;i>=0;i--){
        erg[erg.length]=a.value[i];
    }
    
    return {'ctype':'list','value':erg};
}



List.directproduct=function(a,b){
    var erg=[];
    for(var i=0;i<a.value.length;i++){
        for(var j=0;j<b.value.length;j++){
            erg[erg.length]={'ctype':'list','value':[a.value[i],b.value[j]]};
        }
    }
    return {'ctype':'list','value':erg};
}


List.concat=function(a,b){
    var erg=[];
    for(var i=0;i<a.value.length;i++){
        erg[erg.length]=a.value[i];
    }
    for(var j=0;j<b.value.length;j++){
        erg[erg.length]=b.value[j];
    }
    return {'ctype':'list','value':erg};
}


List.prepend=function(b,a){
    var erg=[];
    erg[erg.length]=b;
    
    for(var i=0;i<a.value.length;i++){
        erg[erg.length]=a.value[i];
    }
    return {'ctype':'list','value':erg};
}

List.append=function(a,b){
    var erg=[];
    for(var i=0;i<a.value.length;i++){
        erg[erg.length]=a.value[i];
    }
    erg[erg.length]=b;
    return {'ctype':'list','value':erg};
}


List.contains=function(a,b){
    var erg=[];
    var bb=false; 
    for(var i=0;i<a.value.length;i++){
        var cc=a.value[i];
        if((evaluator._helper.equals(cc,b)).value){
            return {'ctype':'boolean','value':true};
            
        };
    }
    return {'ctype':'boolean','value':false};
}


List.common=function(a,b){
    var erg=[];
    for(var i=0;i<a.value.length;i++){
        var bb=false; 
        var cc=a.value[i];
        for(var j=0;j<b.value.length;j++){
            bb=bb||(evaluator._helper.equals(cc,b.value[j])).value;
        }
        if(bb){
            erg[erg.length]=a.value[i];
        }
    }
    return {'ctype':'list','value':erg};
}

List.remove=function(a,b){
    var erg=[];
    for(var i=0;i<a.value.length;i++){
        var bb=false; 
        var cc=a.value[i];
        for(var j=0;j<b.value.length;j++){
            bb=bb||(evaluator._helper.equals(cc,b.value[j])).value;
        }
        if(!bb){
            erg[erg.length]=a.value[i];
        }
    }
    return {'ctype':'list','value':erg};
}

List._helper.compare=function(a,b){
    if(a.ctype=='number' && b.ctype=='number'){
        return a.value.real-b.value.real
    }
    return -1;
    
}

List.sort1=function(a){
    var erg=a.value.sort(General.compare);
    return List.turnIntoCSList(erg);
}

List._helper.isEqual=function(a1,a2){
    return List.equals(a1,a2).value;
}

List._helper.isLessThan=function(a,b){
    
    var s1 = a.value.length;
    var s2 = b.value.length;
    var i = 0;
    
    while (!(    i >= s1 
                 || i >= s2 
                 || !General.isEqual(a.value[i], b.value[i])
                 )) {i++;}
    if (i == s1 && i < s2) {return true};
    if (i == s2 && i < s1) {return false};
    if (i == s1 && i == s2) {return false};
    return General.isLessThan(a.value[i], b.value[i]);
    
}


List._helper.compare=function(a,b) {
    if(List._helper.isLessThan(a,b)){return -1}
    if(List._helper.isEqual(a,b)){return 0}
    return 1;
}

List.equals=function(a1,a2){
    if(a1.value.length != a2.value.length){
        return {'ctype':'boolean','value':false};
    }
    var erg=true;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        
        if(av1.ctype=='list' && av2.ctype=='list' ){
            erg=erg && List.equals(av1,av2).value;
        } else {
            erg=erg && evaluator.comp_equals([av1,av2],[]).value;
            
        }
    }
    return {'ctype':'boolean','value':erg};
}

List.almostequals=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return {'ctype':'boolean','value':false};
    }
    var erg=true;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        
        if(av1.ctype=='list' && av2.ctype=='list' ){
            erg=erg && List.comp_almostequals(av1,av2).value;
        } else {
            erg=erg && evaluator.comp_almostequals([av1,av2],[]).value;
            
        }
    }
    return {'ctype':'boolean','value':erg};
}

List._helper.isAlmostReal=function(a1){
    var erg=true;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        
        if(av1.ctype=='list' ){
            erg=erg && List._helper.isAlmostReal(av1);
        } else {
            erg=erg && CSNumber._helper.isAlmostReal(av1);
        }
    }
    return erg;
}

List._helper.isNaN=function(a1){
    var erg=false;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        
        if(av1.ctype=='list' ){
            erg=erg || List._helper.isNaN(av1);
        } else {
            erg=erg || CSNumber._helper.isNaN(av1);
        }
    }
    return erg;
}



List.set=function(a1){
    var erg=[];
    var erg1=a1.value.sort(General.compare);
    
    for(var i=0;i<erg1.length;i++){
        if(i==0||!(evaluator.comp_equals([erg[erg.length-1],erg1[i]],[])).value){
            erg[erg.length]=erg1[i];
            
        }
        
    }
    
    return {'ctype':'list','value':erg};
    
}





List.genericListMath=function(a,op){
    
    if(a.value.length==0){
        return nada
    };
    var erg=a.value[0];
    for(var i=1;i<a.value.length;i++){
        erg=General[op](erg,a.value[i]); 
    }
    return erg;
}




///////////////////////////


List.maxval=function(a){//Only for Lists or Lists of Lists that contain numbers
                        //Used for Normalize max
    var erg=CSNumber.real(0);
    for(var i=0;i<a.value.length;i++){
        var v=a.value[i];
        if(v.ctype=="number"){
            erg=CSNumber.argmax(erg,v);
        }
        if(v.ctype=="list"){
            erg=CSNumber.argmax(erg,List.maxval(v));
        }
    }
    return CSNumber.clone(erg);
}

List.normalizeMax=function(a) {
    var s=CSNumber.inv(List.maxval(a));
    return List.scalmult(s,a);
}
List.normalizeZ=function(a) {
    var s=CSNumber.inv(a.value[2]);
    return List.scalmult(s,a);
}

List.max=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        erg[erg.length]=General.max(av1,av2);
    }
    return {'ctype':'list','value':erg};
}





List.min=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        erg[erg.length]=General.min(av1,av2);
    }
    return {'ctype':'list','value':erg};
}






List.scaldiv=function(a1,a2){
    if(a1.ctype != 'number'){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a2.value.length;i++){
        var av2=a2.value[i];
        if(av2.ctype=='number' ){
            erg[erg.length]=General.div(av2,a1);
        } else if(av2.ctype=='list'  ){
            erg[erg.length]=List.scaldiv(a1,av2);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}


List.scalmult=function(a1,a2){
    if(a1.ctype != 'number'){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a2.value.length;i++){
        var av2=a2.value[i];
        if(av2.ctype=='number' ){
            erg[erg.length]=General.mult(av2,a1);
        } else if(av2.ctype=='list'  ){
            erg[erg.length]=List.scalmult(a1,av2);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}


List.add=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        if(av1.ctype=='number' && av2.ctype=='number' ){
            erg[erg.length]=General.add(av1,av2);
        } else if(av1.ctype=='list' && av2.ctype=='list' ){
            erg[erg.length]=List.add(av1,av2);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}


List.sub=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        if(av1.ctype=='number' && av2.ctype=='number' ){
            erg[erg.length]=CSNumber.sub(av1,av2);
        } else if(av1.ctype=='list' && av2.ctype=='list' ){
            erg[erg.length]=List.sub(av1,av2);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}



List.abs2=function(a1){
    
    var erg=0;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        if(av1.ctype=='number' ){
            erg+=CSNumber.abs2(av1).value.real;
        } else if(av1.ctype=='list' ){
            erg+=List.abs2(av1).value.real;
        } else {
            return nada;
        }
    }
    
    return {"ctype":"number" ,
        "value":{'real':erg, 'imag':0}};
}

List.abs=function(a1){
    return CSNumber.sqrt(List.abs2(a1))
}


List.normalizeMaxXX=function(a){//Assumes that list is a number Vector
    var maxv=-10000;
    var nn=CSNumber.real(1);
    for(var i=0;i<a.value.length;i++){
        var v=CSNumber.abs(a.value[i]);
        if(v.value.real>maxv){
            nn=a.value[i];
            maxv=v.value.real; 
        }
    }
    return List.scaldiv(nn,a);
    
}



List.recursive=function(a1,op){
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=evaluateAndVal(a1.value[i]);//Will man hier evaluieren
        if(av1.ctype=='number'){
            erg[erg.length]=CSNumber[op](av1);
        } else if(av1.ctype=='list'){
            erg[erg.length]=List[op](av1);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
    
}

List.re=function(a){
    return List.recursive(a,"re");
}


List.neg=function(a){
    return List.recursive(a,"neg");
}

List.im=function(a){
    return List.recursive(a,"im");
}

List.conjugate=function(a){
    return List.recursive(a,"conjugate");
}


List.round=function(a){
    return List.recursive(a,"round");
}


List.ceil=function(a){
    return List.recursive(a,"ceil");
}


List.floor=function(a){
    return List.recursive(a,"floor");
}



List._helper.colNumb=function(a){
    if(a.ctype!='list') {
        return -1;
    }
    var ind=-1;
    for(var i=0;i<a.value.length;i++){
        if((a.value[i]).ctype!='list') {
            return -1;
        }
        if(i==0){
            ind=(a.value[i]).value.length;
        } else {
            if(ind!=(a.value[i]).value.length)
                return -1
        }
    }
        return ind;
        
}

List._helper.isNumberVecN=function(a,n){
    
    if(a.ctype!='list') {
        return false;
    }
    if(a.value.length!=n) {
        return false;
    }
    
    for(var i=0;i<a.value.length;i++){
        if((a.value[i]).ctype!='number') {
            return false;
        }
    }
    return true;
    
}



List.isNumberVector=function(a){
    if(a.ctype!='list') {
        return {'ctype':'boolean','value':false};
    }
    for(var i=0;i<a.value.length;i++){
        if((a.value[i]).ctype!='number') {
            return {'ctype':'boolean','value':false};
        }
    }
    return {'ctype':'boolean','value':true};
    
}


List.isNumberVectorN=function(a,n){
    if(a.ctype!='list') {
        return {'ctype':'boolean','value':false};
    }
    if(a.value)
        for(var i=0;i<a.value.length;i++){
            if((a.value[i]).ctype!='number') {
                return {'ctype':'boolean','value':false};
            }
        }
            return {'ctype':'boolean','value':true};
    
}






List.isNumberMatrix=function(a){
    if(List._helper.colNumb(a)==-1){
        return {'ctype':'boolean','value':false};
    }
    
    for(var i=0;i<a.value.length;i++){
        if(!List.isNumberVector((a.value[i])).value) {
            return {'ctype':'boolean','value':false};
        }
    }
    return {'ctype':'boolean','value':true};
    
}



List.scalproduct=function(a1,a2){
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg={'ctype':'number','value':{'real':0,'imag':0}};
    for(var i=0;i<a2.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        if(av1.ctype=='number' && av2.ctype=='number'){
            erg=CSNumber.add(CSNumber.mult(av1,av2),erg);
        } else {
            return nada;
        }
    }
    
    return erg;
}

List.productMV=function(a,b){
    if(a.value[0].value.length != b.value.length){
        return nada;
    }
    var li=[];
    for(var j=0;j<a.value.length;j++){
        var erg={'ctype':'number','value':{'real':0,'imag':0}};
        var a1=a.value[j];
        for(var i=0;i<b.value.length;i++){
            var av1=a1.value[i];
            var av2=b.value[i];
            
            if(av1.ctype=='number' && av2.ctype=='number'){
                erg=CSNumber.add(CSNumber.mult(av1,av2),erg);
            } else {
                return nada;
            }
        }
        li[li.length]=erg;
    }    
    return List.turnIntoCSList(li);
    
}


List.productVM=function(a,b){
    if(a.value.length != b.value.length){
        return nada;
    }
    var li=[];
    for(var j=0;j<b.value[0].value.length;j++){
        var erg={'ctype':'number','value':{'real':0,'imag':0}};
        for(var i=0;i<a.value.length;i++){
            var av1=a.value[i];
            var av2=b.value[i].value[j];
            
            if(av1.ctype=='number' && av2.ctype=='number'){
                erg=CSNumber.add(CSNumber.mult(av1,av2),erg);
            } else {
                return nada;
            }
        }
        li[li.length]=erg;
    }    
    return List.turnIntoCSList(li);
    
}

List.productMM=function(a,b){
    if(a.value[0].value.length != b.value.length){
        return nada;
    }
    var li=[];
    for(var j=0;j<a.value.length;j++){
        var aa=a.value[j];
        var erg=List.productVM(aa,b);
        li[li.length]=erg;
    }    
    return List.turnIntoCSList(li);
}





List.mult=function(a,b){
    
    if(a.value.length==b.value.length && List.isNumberVector(a).value && List.isNumberVector(b).value){
        return List.scalproduct(a,b);
    } 
    
    if(List.isNumberMatrix(a).value && b.value.length==a.value[0].value.length && List.isNumberVector(b).value){
        return List.productMV(a,b);
    } 
    
    if(List.isNumberMatrix(b).value && a.value.length==b.value.length && List.isNumberVector(a).value){
        return List.productVM(a,b);
    } 
    
    if(List.isNumberMatrix(a).value && List.isNumberMatrix(b) && b.value.length==a.value[0].value.length){
        return List.productMM(a,b);
    } 
    
    return nada;
    
    
}

List.projectiveDistMinScal=function(a,b){
    var sa=List.abs(a);
    var sb=List.abs(b);
    
    if(sa.value.real==0||sb.value.real==0)
        return 0;
    var cb=List.conjugate(b);
    var p=List.scalproduct(a,cb);
    
    var np=CSNumber.div(p,CSNumber.abs(p));
    var na=List.scaldiv(sa,a); 
    var nb=List.scaldiv(sb,b);
    na=List.scalmult(np,na);
    
    var d1=List.abs(List.add(na,nb));
    var d2=List.abs(List.sub(na,nb));
    return Math.min(d1.value.real,d2.value.real);
    
}

List.crossOperator=function(a){
    
    var x=CSNumber.clone(a.value[0]);
    var y=CSNumber.clone(a.value[1]);
    var z=CSNumber.clone(a.value[2]);
    return List.turnIntoCSList([
        List.turnIntoCSList([CSNumber.real(0),CSNumber.neg(z),y]),
        List.turnIntoCSList([z,CSNumber.real(0),CSNumber.neg(x)]),
        List.turnIntoCSList([CSNumber.neg(y),x,CSNumber.real(0)])
        ]
                               );
    
}

List.cross=function(a,b){//Assumes that a is 3-Vector
    var x=CSNumber.sub(CSNumber.mult(a.value[1],b.value[2]),CSNumber.mult(a.value[2],b.value[1]));
    var y=CSNumber.sub(CSNumber.mult(a.value[2],b.value[0]),CSNumber.mult(a.value[0],b.value[2]));
    var z=CSNumber.sub(CSNumber.mult(a.value[0],b.value[1]),CSNumber.mult(a.value[1],b.value[0]));
    return List.turnIntoCSList([x,y,z]);
}

List.veronese=function(a){//Assumes that a is 3-Vector
    var xx=CSNumber.mult(a.value[0],a.value[0]);
    var yy=CSNumber.mult(a.value[1],a.value[1]);
    var zz=CSNumber.mult(a.value[2],a.value[2]);
    var xy=CSNumber.mult(a.value[0],a.value[1]);
    var xz=CSNumber.mult(a.value[0],a.value[2]);
    var yz=CSNumber.mult(a.value[1],a.value[2]);
    return List.turnIntoSCList([xx,yy,zz,xy,xz,yz]);
}

List.matrixFromVeronese=function(a){//Assumes that a is 6-Vector
                                    //Wie Wichtig ist hier das Clonen???
    var xx=CSNumber.clone(a.value[0]);
    var yy=CSNumber.clone(a.value[1]);
    var zz=CSNumber.clone(a.value[2]);
    var xy=CSNumber.div(a.value[3],CSNumber.real(2));
    var xz=CSNumber.div(a.value[4],CSNumber.real(2));
    var yz=CSNumber.div(a.value[5],CSNumber.real(2));
    var yx=CSNumber.clone(xy);
    var zx=CSNumber.clone(xz);
    var zy=CSNumber.clone(yz);
    return List.turnIntoCSList([
        List.turnIntoCSList([xx,xy,xz]),
        List.turnIntoCSList([yx,yy,yz]),
        List.turnIntoCSList([zx,zy,zz])
        ])
        
}



List.det3=function(p,q,r){//Assumes that a,b,c are 3-Vectors
                          //Keine Ahnung ob man das so inlinen will (hab das grad mal so übernommen)
    
    var re=   p.value[0].value.real * q.value[1].value.real * r.value[2].value.real 
    - p.value[0].value.imag * q.value[1].value.imag * r.value[2].value.real 
    - p.value[0].value.imag * q.value[1].value.real * r.value[2].value.imag 
    - p.value[0].value.real * q.value[1].value.imag * r.value[2].value.imag 
    + p.value[2].value.real * q.value[0].value.real * r.value[1].value.real 
    - p.value[2].value.imag * q.value[0].value.imag * r.value[1].value.real 
    - p.value[2].value.imag * q.value[0].value.real * r.value[1].value.imag 
    - p.value[2].value.real * q.value[0].value.imag * r.value[1].value.imag 
    + p.value[1].value.real * q.value[2].value.real * r.value[0].value.real 
    - p.value[1].value.imag * q.value[2].value.imag * r.value[0].value.real 
    - p.value[1].value.imag * q.value[2].value.real * r.value[0].value.imag 
    - p.value[1].value.real * q.value[2].value.imag * r.value[0].value.imag
    - p.value[0].value.real * q.value[2].value.real * r.value[1].value.real 
    + p.value[0].value.imag * q.value[2].value.imag * r.value[1].value.real 
    + p.value[0].value.imag * q.value[2].value.real * r.value[1].value.imag 
    + p.value[0].value.real * q.value[2].value.imag * r.value[1].value.imag 
    - p.value[2].value.real * q.value[1].value.real * r.value[0].value.real 
    + p.value[2].value.imag * q.value[1].value.imag * r.value[0].value.real 
    + p.value[2].value.imag * q.value[1].value.real * r.value[0].value.imag 
    + p.value[2].value.real * q.value[1].value.imag * r.value[0].value.imag 
    - p.value[1].value.real * q.value[0].value.real * r.value[2].value.real 
    + p.value[1].value.imag * q.value[0].value.imag * r.value[2].value.real 
    + p.value[1].value.imag * q.value[0].value.real * r.value[2].value.imag 
    + p.value[1].value.real * q.value[0].value.imag * r.value[2].value.imag;
    
    var im= - p.value[0].value.imag * q.value[1].value.imag * r.value[2].value.imag 
        + p.value[0].value.imag * q.value[1].value.real * r.value[2].value.real 
        + p.value[0].value.real * q.value[1].value.real * r.value[2].value.imag 
        + p.value[0].value.real * q.value[1].value.imag * r.value[2].value.real 
        - p.value[2].value.imag * q.value[0].value.imag * r.value[1].value.imag 
        + p.value[2].value.imag * q.value[0].value.real * r.value[1].value.real 
        + p.value[2].value.real * q.value[0].value.real * r.value[1].value.imag 
        + p.value[2].value.real * q.value[0].value.imag * r.value[1].value.real 
        - p.value[1].value.imag * q.value[2].value.imag * r.value[0].value.imag 
        + p.value[1].value.imag * q.value[2].value.real * r.value[0].value.real 
        + p.value[1].value.real * q.value[2].value.real * r.value[0].value.imag 
        + p.value[1].value.real * q.value[2].value.imag * r.value[0].value.real
        + p.value[0].value.imag * q.value[2].value.imag * r.value[1].value.imag
        - p.value[0].value.imag * q.value[2].value.real * r.value[1].value.real 
        - p.value[0].value.real * q.value[2].value.real * r.value[1].value.imag
        - p.value[0].value.real * q.value[2].value.imag * r.value[1].value.real
        + p.value[2].value.imag * q.value[1].value.imag * r.value[0].value.imag
        - p.value[2].value.imag * q.value[1].value.real * r.value[0].value.real 
        - p.value[2].value.real * q.value[1].value.real * r.value[0].value.imag 
        - p.value[2].value.real * q.value[1].value.imag * r.value[0].value.real 
        + p.value[1].value.imag * q.value[0].value.imag * r.value[2].value.imag 
        - p.value[1].value.imag * q.value[0].value.real * r.value[2].value.real 
        - p.value[1].value.real * q.value[0].value.real * r.value[2].value.imag 
        - p.value[1].value.real * q.value[0].value.imag * r.value[2].value.real;
    
    
    return CSNumber.complex(re,im);
}

List.eucangle=function(a,b){
       var tmp1=List.cross(a, List.linfty);
       var tmp2=List.cross(b, List.linfty);
       var ca=List.det3(List.ez,tmp1,List.ii);
       var cb=List.det3(List.ez,tmp1,List.jj);
       var cc=List.det3(List.ez,tmp2,List.ii);
       var cd=List.det3(List.ez,tmp2,List.jj);
       var dv=CSNumber.div(CSNumber.mult(ca,cd),CSNumber.mult(cc,cb));
       var ang=CSNumber.log(dv);
       ang=CSNumber.mult(ang,CSNumber.complex(0,0.5)); 
       return ang;
}


List.clone=function(a){
    var erg=[];
    for(var i=0;i<a.value.length;i++){
        erg[erg.length]=evaluator._helper.clone(a.value[i]);
    }
    return {"ctype":"list" ,  "value":erg,"usage":a.usage}
}


List.zerovector=function(a){
    var erg=[];
    for(var i=0;i<Math.floor(a.value.real);i++){
        erg[erg.length]=0;
    }
    return List.realVector(erg);
}


List.zeromatrix=function(a,b){
    var erg=[];
    for(var i=0;i<Math.floor(a.value.real);i++){
        erg[erg.length]=List.zerovector(b);
    }
    return List.turnIntoCSList(erg);
}


List.transpose=function(a){
    var erg=[];
    var n=a.value[0].value.length;
    var m=a.value.length;
    for(var i=0;i<n;i++){
        var li=[]; 
        for(var j=0;j<m;j++){
            li[li.length]=a.value[j].value[i];
        }
        erg[erg.length]=List.turnIntoCSList(li)
    }
    return List.turnIntoCSList(erg);
}


List.column=function(a,b){
    var erg=[];
    var n=a.value.length;
    var i=Math.floor(b.value.real-1);
    for(var j=0;j<n;j++){
        erg[erg.length]=a.value[j].value[i];
    }
    
    return List.turnIntoCSList(erg);
}


List.row=function(a,b){
    var erg=[];
    var n=a.value[0].value.length;
    var i=Math.floor(b.value.real-1);
    for(var j=0;j<n;j++){
        erg[erg.length]=a.value[i].value[j];
    }
    
    return List.turnIntoCSList(erg);
}

List.inverse=function(a){//Das ist nur Reell und greift auf numeric zurück
    var x=[];
    var y=[];
    var n=a.value.length;
    for(var i=0;i<n;i++){
        var lix=[]; 
        var liy=[]; 
        for(var j=0;j<n;j++){
            lix[lix.length]=a.value[i].value[j].value.real;
            liy[liy.length]=a.value[i].value[j].value.imag;
        }
        x[x.length]=lix;
        y[y.length]=liy;
    }
    var z=new numeric.T(x,y);
    var res=z.inv(z);
    var erg=[];
    for(var i=0;i<n;i++){
        var li=[]; 
        for(var j=0;j<n;j++){
            li[li.length]=CSNumber.complex(res.x[i][j],res.y[i][j]);
        }
        erg[erg.length]=List.turnIntoCSList(li);
    }
    return List.turnIntoCSList(erg);
}

List.det=function(a){//Das ist nur Reell und greift auf numeric zurück
    var x=[];
    var y=[];
    var n=a.value.length;
    for(var i=0;i<n;i++){
        var lix=[]; 
        var liy=[]; 
        for(var j=0;j<n;j++){
            lix[lix.length]=a.value[i].value[j].value.real;
            liy[liy.length]=a.value[i].value[j].value.imag;
        }
        x[x.length]=lix;
        y[y.length]=liy;
    }
    var z=new numeric.T(x,y);
    var res=numeric.det(x);
        
    return CSNumber.real(res);
    
}


///Feldzugriff
///TODO Will man das in list haben??

List.getField=function(li,key){
    
    if(key=="homog"){
        if(List._helper.isNumberVecN(li,3)){
            return li;
        }
        if(List._helper.isNumberVecN(li,2)){
            var li2=General.clone(li);
            li2.value[2]=CSNumber.real(1);
            return li2;
        }
        return nada;
    }
    
    if(key=="xy"){
        if(List._helper.isNumberVecN(li,2)){
            return li;
        }
        if(List._helper.isNumberVecN(li,3)){
            var erg=General.clone(li);
            erg.value.pop();
            return List.scaldiv(li.value[2],erg);
        }
        return nada;
        
    }
    
    if(key=="x"){
        if(List.isNumberVector(li)){
            var n=li.value.length;
            if(n>0 && n!=3){
                return CSNumber.clone(li.value[0]);
            }
            if(n==3){
                if(li.usage=="Point"){
                    return CSNumber.div(li.value[0],li.value[2]);
                } else {
                    return CSNumber.clone(li.value[0]);
                }
            }
            
        }
        return nada;
        
    }
    
    if(key=="y"){
        if(List.isNumberVector(li)){
            var n=li.value.length;
            if(n>1 && n!=3){
                return CSNumber.clone(li.value[1]);
            }
            if(n==3){
                if(li.usage=="Point"){
                    return CSNumber.div(li.value[1],li.value[2]);
                } else {
                    return CSNumber.clone(li.value[1]);
                }
            }
            
        }
        return nada;
    }
    
    if(key=="z"){
        if(List.isNumberVector(li)){
            var n=li.value.length;
            if(n>2){
                return CSNumber.clone(li.value[2]);
            }
        }
        
        return nada;
    }
    
 
        
    return nada;
    
    
    
}




//==========================================
//      Namespace and Vars
//==========================================



function Nada(){this.ctype='undefined'};
function Void(){this.ctype='void'};
function CError(msg){this.ctype='error';this.message=msg};
var nada= new Nada();

function Namespace(){
    this.vars={
        'pi':{'ctype':'variable','stack':[{'ctype':'number','value':{'real':Math.PI,'imag':0}}],'name':'pi'},
        'i':{'ctype':'variable','stack':[{'ctype':'number','value':{'real':0,'imag':1}}],'name':'i'},
        'true':{'ctype':'variable','stack':[{'ctype':'boolean','value':true}],'name':'true'},
        'false':{'ctype':'variable','stack':[{'ctype':'boolean','value':false}],'name':'false'},
        '#':{'ctype':'variable','stack':[nada],'name':'#'}
    }
    this.isVariable= function(a){
        return this.vars[a]!== undefined;
        
    }
    
    this.isVariableName = function(a){//TODO will man das so? Den ' noch dazu machen
        
        if (a=='#') return true;
        if (a=='#1') return true;
        if (a=='#2') return true;
        
        var b0 =  /^[a-z,A-Z]+$/.test(a[0]);
        var b1 =  /^[0-9,a-z,A-Z]+$/.test(a);
        return b0 && b1;
    }
    
    this.create =function(code){
        this.vars[code]={'ctype':'variable','stack':[],'name':code};
        return this.vars[code];
    }
    
    this.newvar =function(code){
        if(this.vars[code]===undefined){
            return this.create(code);
        }
        this.vars[code].stack.push(nada);
        return this.vars[code];
    }
    
    this.removevar=function(code){
        this.vars[code].stack.pop();
    }
    
    
    this.setvar= function(code,val) {
        var stack=this.vars[code].stack;
        if(val.ctype=='undefined'){
            stack[stack.length-1]=val;
            return;
        }
        var erg=evaluator._helper.clone(val);
        stack[stack.length-1]=erg;
    }
    
    this.setvarnocopy= function(code,val) {
        var stack=this.vars[code].stack;
        stack[stack.length-1]=val;
    }
    
    
    this.getvar= function(code) {

        var stack=this.vars[code].stack;
        var erg=stack[stack.length-1];
        if(stack.length==0 && stack[stack.length-1]==nada){//Achtung das erforder das der GeoTeil da ist.
            if(typeof csgeo.csnames[code] !== 'undefined'){
                return {'ctype':'geo','value':csgeo.csnames[code]}
            }
        }
        return erg;
    }
    
    this.dump= function(code) {
        var stack=this.vars[code].stack;
        console.log("*** Dump "+code);
        
        for(var i=0;i<stack.length;i++){
            console.log(i+":> "+ niceprint(stack[i]))
            
        }
        
    }
    
    this.vstack=[];
    
    this.pushVstack=function(v){
        this.vstack.push(v);
    
    }
    this.popVstack=function(){
        this.vstack.pop();
    }
    
    this.cleanVstack=function(){
        var st=this.vstack;
        while(st.length>0 && st[st.length-1]!="*"){
            this.removevar(st[st.length-1]);
            st.pop();
        }
        if(st.length>0){st.pop();}
    }
    
    
    
    
}

var namespace =new Namespace();

//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************



evaluator._helper.extractPoint=function(v1){
    var erg={};
    erg.ok=false;
    if(v1.ctype=='geo') {
        var val=v1.value;
        if(val.kind=="P"){
            erg.x= Accessor.getField(val,"x").value.real;
            erg.y= Accessor.getField(val,"y").value.real;
            erg.ok=true;
            return erg;
        }
        
    }
    if(v1.ctype!='list'){
        return erg;
    }
    
    var pt1=v1.value;
    var x=0;
    var y=0;
    var z=0;
    if(pt1.length==2){
        var n1=pt1[0];
        var n2=pt1[1];
        if(n1.ctype=='number' && n2.ctype=='number'){
            erg.x=n1.value.real;
            erg.y=n2.value.real;
            erg.ok=true;
            return erg;
        }
    }
    
    if(pt1.length==3){
        var n1=pt1[0];
        var n2=pt1[1];
        var n3=pt1[2];
        if(n1.ctype=='number' && n2.ctype=='number'&& n3.ctype=='number'){
            n1=CSNumber.div(n1,n3);
            n2=CSNumber.div(n2,n3);
            erg.x=n1.value.real;
            erg.y=n2.value.real;
            erg.ok=true;
            return erg;
        }
    }
    
    return erg;
    
}

evaluator.draw=function(args,modifs){
    var erg;
    var psize=csport.drawingstate.pointsize;
    var lsize=csport.drawingstate.linesize;
    if(psize<0) psize=0;
    if(lsize<0) lsize=0;
    var overhang=1;//TODO Eventuell dfault setzen
    var dashing=false;
    var col;
    var black="rgb(0,0,0)";
    if(csport.drawingstate.alpha!=1){
        black="rgba(0,0,0,"+csport.drawingstate.alpha+")";
    }
    var handleModifs = function(type){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                if(type=="P"){
                    psize=erg.value.real;                       
                    if(psize<0) psize=0;
                    
                }
                if(type=="L"){
                    lsize=erg.value.real;
                    if(lsize<0) lsize=0;

                }
                
            }
        }
        
        if(type=="L"){
            
            if(modifs.dashpattern!==undefined){
                erg =evaluate(modifs.dashpattern);
                if(erg.ctype=='list'){
                    var pat=[]; 
                    for(var i=0; i<erg.value.length;i++){
                        pat[i]=erg.value[i].value.real;
                    }
                    evaluator._helper.setDash(pat,lsize);
                    dashing=true;
                }
            }
            
            
            if(modifs.dashtype!==undefined){
                erg =evaluate(modifs.dashtype);
                if(erg.ctype=='number'){
                    var type=Math.floor(erg.value.real);
                    evaluator._helper.setDashType(type,lsize);
                    dashing=true;
                    
                    
                }
            }
            
            if(modifs.dashing!==undefined){
                erg =evaluate(modifs.dashing);
                if(erg.ctype=='number'){
                    var si=Math.floor(erg.value.real);
                    evaluator._helper.setDash([si*2,si],lsize);
                    dashing=true;
                    
                    
                }
            }
            if(modifs.overhang!==undefined){
                erg =evaluate(modifs.overhang);
                if(erg.ctype=='number'){
                     overhang=(erg.value.real);
                                        
                }
            }
            
        }
        
        
        
        
        if(modifs.color===undefined &&modifs.alpha===undefined){
            return;
        }
        
        
        var r=0;
        var g=0;
        var b=0;
        var alpha=csport.drawingstate.alpha;
        if(type=="P"){
            r=csport.drawingstate.pointcolorraw[0]*255;
            g=csport.drawingstate.pointcolorraw[1]*255;
            b=csport.drawingstate.pointcolorraw[2]*255;
        }
        if(type=="L"){
            r=csport.drawingstate.linecolorraw[0]*255;
            g=csport.drawingstate.linecolorraw[1]*255;
            b=csport.drawingstate.linecolorraw[2]*255;
        }
        
        if(modifs.color!==undefined){
            erg =evaluate(modifs.color);
            if(List.isNumberVector(erg).value){
                if(erg.value.length==3){
                    r=Math.floor(erg.value[0].value.real*255);
                    g=Math.floor(erg.value[1].value.real*255);
                    b=Math.floor(erg.value[2].value.real*255);
                    
                }
                
            }
        }
        
        
        if(modifs.alpha!==undefined){
            erg =evaluate(modifs.alpha);
            if(erg.ctype=="number"){
                alpha=erg.value.real;
            }
        }
        col="rgba("+r+","+g+","+b+","+alpha+")";//TODO Performanter machen
            black="rgba(0,0,0,"+alpha+")";//TODO Performanter machen
    }
    
    var drawsegcore=function(pt1,pt2){
        var m=csport.drawingstate.matrix;
        var xx1=pt1.x*m.a-pt1.y*m.b+m.tx;
        var yy1=pt1.x*m.c-pt1.y*m.d-m.ty;
        var xx2=pt2.x*m.a-pt2.y*m.b+m.tx;
        var yy2=pt2.x*m.c-pt2.y*m.d-m.ty;
        

        col=csport.drawingstate.linecolor;
            
        handleModifs("L");
        var xxx1=overhang*xx1+(1-overhang)*xx2;
        var yyy1=overhang*yy1+(1-overhang)*yy2;
        var xxx2=overhang*xx2+(1-overhang)*xx1;
        var yyy2=overhang*yy2+(1-overhang)*yy1;
        csctx.beginPath();
        csctx.moveTo(xxx1, yyy1);
        csctx.lineTo(xxx2, yyy2);
        csctx.lineWidth = lsize;
        csctx.lineCap = 'round';
        
        //        csctx.strokeStyle="#0000FF";
        //        csctx.strokeStyle="rgba(0,0,255,0.2)";
        csctx.strokeStyle=col;
        csctx.stroke();
        
        if(dashing)
            evaluator._helper.unSetDash();
    }
    
    var drawsegment = function(aa,bb){
        var v1=evaluateAndVal(aa);
        var v2=evaluateAndVal(bb);
        var pt1=evaluator._helper.extractPoint(v1);
        var pt2=evaluator._helper.extractPoint(v2);
        if(!pt1.ok||!pt2.ok){
            return nada;
        }
        
        drawsegcore(pt1,pt2);
        
        return nada;
    }
    
    var drawline = function(){
        var na=CSNumber.abs(v1.value[0]).value.real;
        var nb=CSNumber.abs(v1.value[1]).value.real;
        var nc=CSNumber.abs(v1.value[2]).value.real;
        var divi;
        
        
        if(na>=nb&&na>=nc){
            divi=v1.value[0];
        }
        if(nb>=na&&nb>=nc){
            divi=v1.value[1];
        }
        if(nc>=nb&&nc>=na){
            divi=v1.value[2];
        }
        var a=CSNumber.div(v1.value[0],divi);
        var b=CSNumber.div(v1.value[1],divi);
        var c=CSNumber.div(v1.value[2],divi);//TODO Realitycheck einbauen
            
            
            var l=[a.value.real,
                b.value.real,
                c.value.real]
                var b1,b2;
            if(Math.abs(l[0])<Math.abs(l[1])){
                b1=[1,0,30];
                b2=[-1,0,30];
            } else {
                b1=[0,1,30];
                b2=[0,-1,30];
            }
            var erg1=[
                l[1]*b1[2]-l[2]*b1[1],
                l[2]*b1[0]-l[0]*b1[2],
                l[0]*b1[1]-l[1]*b1[0]
                ];
            var erg2=[
                l[1]*b2[2]-l[2]*b2[1],
                l[2]*b2[0]-l[0]*b2[2],
                l[0]*b2[1]-l[1]*b2[0]
                ];
            
            
            var pt1={
x:erg1[0]/erg1[2],
y:erg1[1]/erg1[2]
            }
            var pt2={
x:erg2[0]/erg2[2],
y:erg2[1]/erg2[2]
                
            }
            
            
            drawsegcore(pt1,pt2);
            
    }
    
    
    var drawpoint = function(){
        var pt=evaluator._helper.extractPoint(v1);
        
        if(!pt.ok){//eventuell doch ein Segment
            if(v1.value.length==2){

               drawsegment(v1.value[0],v1.value[1]);
               return;
            
            }
            return nada;
        }
        var m=csport.drawingstate.matrix;
        
        var xx=pt.x*m.a-pt.y*m.b+m.tx;
        var yy=pt.x*m.c-pt.y*m.d-m.ty;
        
        col=csport.drawingstate.pointcolor
            handleModifs("P");
        csctx.lineWidth = psize*.3;
        
        
        csctx.beginPath();
        csctx.arc(xx,yy,psize,0,2*Math.PI);
        csctx.fillStyle=col;
        
        csctx.fill();
        
        csctx.beginPath();
        csctx.arc(xx,yy,psize*1.15,0,2*Math.PI);
        csctx.fillStyle=black;
        csctx.strokeStyle=black;
        csctx.stroke();
    }
    
    
    if(args.length==2) {
        return drawsegment(args[0],args[1]);
    }
    var v1=evaluateAndVal(args[0]);
    
    if(v1.ctype=="shape"){
        return evaluator._helper.drawshape(v1,modifs);
        
    }
    
    
    if(v1.usage=="Line"){
        return drawline();
        
    }
    return drawpoint();
    
    
    
    
    
    
}

evaluator.drawcircle=function(args,modifs){
    evaluator._helper.drawcircle(args,modifs,"D");
}


evaluator.fillcircle=function(args,modifs){
    evaluator._helper.drawcircle(args,modifs,"F");
}

evaluator._helper.drawcircle=function(args,modifs,df){
    var erg;
    var size=4;
    var col;
    var black="rgb(0,0,0)";
    var handleModifs = function(){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
                if(size<0) size=0;

            }
        }
        
        
        if(modifs.color===undefined &&modifs.alpha===undefined){
            return;
        }
        
        
        var r=0;
        var g=0;
        var b=0;
        var alpha=csport.drawingstate.alpha;
        
        r=csport.drawingstate.linecolorraw[0]*255;
        g=csport.drawingstate.linecolorraw[1]*255;
        b=csport.drawingstate.linecolorraw[2]*255;
        
        if(modifs.color!==undefined){
            erg =evaluate(modifs.color);
            if(List.isNumberVector(erg).value){
                if(erg.value.length==3){
                    r=Math.floor(erg.value[0].value.real*255);
                    g=Math.floor(erg.value[1].value.real*255);
                    b=Math.floor(erg.value[2].value.real*255);
                    
                }
                
            }
        }
        
        
        if(modifs.alpha!==undefined){
            erg =evaluate(modifs.alpha);
            if(erg.ctype=="number"){
                alpha=erg.value.real;
            }
        }
        
        col="rgba("+r+","+g+","+b+","+alpha+")";//TODO Performanter machen
    }
    
    
    
    var drawcirc = function(){
        
        function magic_circle(ctx, x, y, r){
            m = 0.551784
            
            ctx.save()
            ctx.translate(x, y)
            ctx.scale(r, r)
            
            ctx.beginPath()
            ctx.moveTo(1, 0)
            ctx.bezierCurveTo(1,  -m,  m, -1,  0, -1)
            ctx.bezierCurveTo(-m, -1, -1, -m, -1,  0)
            ctx.bezierCurveTo(-1,  m, -m,  1,  0,  1)
            ctx.bezierCurveTo( m,  1,  1,  m,  1,  0)
            ctx.closePath()
            ctx.restore()
        }
        
                    
        var pt=evaluator._helper.extractPoint(v0);
        
        
        if(!pt.ok || v1.ctype!='number'){
            return nada;
        }
        var m=csport.drawingstate.matrix;
        
        var xx=pt.x*m.a-pt.y*m.b+m.tx;
        var yy=pt.x*m.c-pt.y*m.d-m.ty;
        
        col=csport.drawingstate.linecolor;
        handleModifs();
        csctx.lineWidth = size*.3;
        
        
        
        csctx.beginPath();
        csctx.lineWidth = size*.4;
        
        csctx.arc(xx,yy,v1.value.real*m.sdet,0,2*Math.PI);
      //  magic_circle(csctx,xx,yy,v1.value.real*m.sdet);
        
        
        if(df=="D"){
            csctx.strokeStyle=col;
            csctx.stroke();
        }
        if(df=="F"){
            csctx.fillStyle=col;
            csctx.fill();
        }
        if(df=="C"){
            csctx.clip();
        }
    }
    
    
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        
        return drawcirc();
    }
    
    return nada;
}

evaluator.drawall =function(args,modifs){
    if(args.length==1) {
        var v1=evaluate(args[0]);
        
        if(v1.ctype=="list"){//TODO: Kann man optimaler implementieren (modifs nur einmal setzen)
            for (var i=0;i<v1.value.length;i++){
               evaluator.draw([v1.value[i]],modifs);
            } 
            
        }
    }
    return nada;
}
evaluator.connect=function(args,modifs){
    evaluator._helper.drawpolygon(args,modifs,"D",0);
}


evaluator.drawpoly=function(args,modifs){
    evaluator._helper.drawpolygon(args,modifs,"D",1);
}


evaluator.fillpoly=function(args,modifs){
    evaluator._helper.drawpolygon(args,modifs,"F",1);
}

evaluator.drawpolygon=function(args,modifs){
    evaluator._helper.drawpolygon(args,modifs,"D",1);
}


evaluator.fillpolygon=function(args,modifs){
    evaluator._helper.drawpolygon(args,modifs,"F",1);
}


evaluator._helper.drawpolygon=function(args,modifs,df,cycle){
    var erg;
    var size=4;
    var col;
    var black="rgb(0,0,0)";
    var handleModifs = function(){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
                if(size<0) size=0;

            }
        }
        
        
        if(modifs.color===undefined &&modifs.alpha===undefined){
            return;
        }
        
        
        var r=0;
        var g=0;
        var b=0;
        var alpha=csport.drawingstate.alpha;
        
        r=csport.drawingstate.linecolorraw[0]*255;
        g=csport.drawingstate.linecolorraw[1]*255;
        b=csport.drawingstate.linecolorraw[2]*255;
        
        if(modifs.color!==undefined){
            erg =evaluate(modifs.color);
            if(List.isNumberVector(erg).value){
                if(erg.value.length==3){
                    r=Math.floor(erg.value[0].value.real*255);
                    g=Math.floor(erg.value[1].value.real*255);
                    b=Math.floor(erg.value[2].value.real*255);
                    
                }
                
            }
        }
        
        
        if(modifs.alpha!==undefined){
            erg =evaluate(modifs.alpha);
            if(erg.ctype=="number"){
                alpha=erg.value.real;
            }
        }
        
        col="rgba("+r+","+g+","+b+","+alpha+")";//TODO Performanter machen
    }
    
    var drawpolyshape = function(){
        
        var m=csport.drawingstate.matrix;
        
        var polys=v0.value;
        if(df!="D")
            csctx.beginPath();
        for(var j=0;j<polys.length;j++){
            var pol=polys[j];
            var li=[];
            
            for(var i=0;i<pol.length;i++){
                var pt=pol[i]; 
                var xx=pt.X*m.a-pt.Y*m.b+m.tx;
                var yy=pt.X*m.c-pt.Y*m.d-m.ty;
                
                li[li.length]=[xx,yy];
            } 
            col=csport.drawingstate.linecolor;
            handleModifs();
            csctx.lineWidth = size*.3;
            csctx.mozFillRule = 'evenodd';
            csctx.lineJoin="round";
            if(df=="D")
                csctx.beginPath();
            csctx.lineWidth = size*.4;
            csctx.moveTo(li[0][0],li[0][1]);
            for(var i=1;i<li.length;i++){
                csctx.lineTo(li[i][0],li[i][1]);
            }
            if(df=="D"){
                csctx.closePath();
                csctx.strokeStyle=col;
                csctx.stroke();
            }
            
        }
        if(df!="D")
            csctx.closePath();

        if(df=="F"){
            csctx.fillStyle=col;
            csctx.fill();
        }
        if(df=="C"){
            csctx.clip();
        }
        
        
        
    }
    
    
    
    
    var drawpoly = function(){
        
        var m=csport.drawingstate.matrix;
        
        var li=[];
        for(var i=0;i<v0.value.length;i++){
            var pt=evaluator._helper.extractPoint(v0.value[i]);
            
            if(!pt.ok ){
                return nada;
            }
            var xx=pt.x*m.a-pt.y*m.b+m.tx;
            var yy=pt.x*m.c-pt.y*m.d-m.ty;
            
            li[li.length]=[xx,yy];
        } 
        col=csport.drawingstate.linecolor;
        handleModifs();
        csctx.lineWidth = size*.3;
        csctx.mozFillRule = 'evenodd';
        
        csctx.beginPath();
        csctx.lineWidth = size*.4;
        csctx.moveTo(li[0][0],li[0][1]);
        for(var i=1;i<li.length;i++){
            csctx.lineTo(li[i][0],li[i][1]);
        }
        if(cycle==1)
            csctx.closePath();
        if(df=="D"){
            csctx.strokeStyle=col;
            csctx.stroke();
        }
        if(df=="F"){
            csctx.fillStyle=col;
            csctx.fill();
        }
        if(df=="C"){
            csctx.clip();
        }
    }
    
    if(args.length==1) {
        var v0=evaluate(args[0]);
        
        
        if (v0.ctype=='list'){
            return drawpoly();
            
        }
        
        if (v0.ctype=='shape'){
            return drawpolyshape();
            
        }
        
    }
    
    return nada;
}



evaluator.drawtext=function(args,modifs){
    var size=csport.drawingstate.textsize;
    if(size<0) size=0;

    var bold="";
    var italics="";
    var family="Arial";
    var align=0;
    var ox=0;
    var oy=0;
    var handleModifs = function(){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
                if(size<0) size=0;
            }
        }
        
        if(modifs.bold!==undefined){
            erg =evaluate(modifs.bold);
            if(erg.ctype=='boolean' && erg.value ){
                bold="bold ";
            }
        }
        if(modifs.italics!==undefined){
            erg =evaluate(modifs.italics);
            if(erg.ctype=='boolean' && erg.value ){
                italics="italic ";
            }
        }
        
        if(modifs.family!==undefined){
            erg =evaluate(modifs.family);
            if(erg.ctype=='string'  ){
                family=erg.value;
            }
        }
        
        if(modifs.align!==undefined){
            erg =evaluate(modifs.align);
            if(erg.ctype=='string'  ){
                if(erg.value=="left"){align=0}; 
                if(erg.value=="right"){align=1}; 
                if(erg.value=="mid"){align=0.5}; 
            }
        }
        
        if(modifs.x_offset!==undefined){
            erg =evaluate(modifs.x_offset);
            if(erg.ctype=='number'){
                ox=erg.value.real;
            }
        }
        
        if(modifs.y_offset!==undefined){
            erg =evaluate(modifs.y_offset);
            if(erg.ctype=='number'){
                oy=erg.value.real;
            }
        }
        
        if(modifs.offset!==undefined){
            erg =evaluate(modifs.offset);
            if(erg.ctype=='list'){
                if(erg.value.length==2 &&
                   erg.value[0].ctype=="number" &&
                   erg.value[1].ctype=="number"){
                    ox=erg.value[0].value.real;
                    oy=erg.value[1].value.real;
                    
                }
                
            }
        }
        
        
        
        if(modifs.color===undefined &&modifs.alpha===undefined){
            return;
        }
        
        
        var r=0;
        var g=0;
        var b=0;
        var alpha=csport.drawingstate.alpha;
        
        r=csport.drawingstate.textcolorraw[0]*255;
        g=csport.drawingstate.textcolorraw[1]*255;
        b=csport.drawingstate.textcolorraw[2]*255;
        
        if(modifs.color!==undefined){
            erg =evaluate(modifs.color);
            if(List.isNumberVector(erg).value){
                if(erg.value.length==3){
                    r=Math.floor(erg.value[0].value.real*255);
                    g=Math.floor(erg.value[1].value.real*255);
                    b=Math.floor(erg.value[2].value.real*255);
                    
                }
                
            }
        }
        
        
        if(modifs.alpha!==undefined){
            erg =evaluate(modifs.alpha);
            if(erg.ctype=="number"){
                alpha=erg.value.real;
            }
        }
        
        col="rgba("+r+","+g+","+b+","+alpha+")";//TODO Performanter machen
    }
    
    
    
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluate(args[1]);
        var pt=evaluator._helper.extractPoint(v0);
        
        if(!pt.ok){
            return nada;
        }
        
        var m=csport.drawingstate.matrix;
        
        var xx=pt.x*m.a-pt.y*m.b+m.tx;
        var yy=pt.x*m.c-pt.y*m.d-m.ty;
        
        col=csport.drawingstate.textcolor;
        handleModifs();
        csctx.fillStyle=col;
        
        csctx.font=bold+italics+Math.round(size*10)/10+"px "+family;
        var txt=niceprint(v1);
        var width = csctx.measureText(txt).width;
        csctx.fillText(txt,xx-width*align+ox,yy-oy);        
        
    }
    
    return nada;
    
}

evaluator._helper.drawshape=function(shape,modifs){
    if(shape.type=="polygon") {
        return evaluator._helper.drawpolygon([shape],modifs,"D",1);
    }
    if(shape.type=="circle") {
        return evaluator._helper.drawcircle([shape.value.value[0],shape.value.value[1]],modifs,"D");
    }
    return nada;
}


evaluator._helper.fillshape=function(shape,modifs){
    
    if(shape.type=="polygon") {
        return evaluator._helper.drawpolygon([shape],modifs,"F",1);
    }
    if(shape.type=="circle") {
        return evaluator._helper.drawcircle([shape.value.value[0],shape.value.value[1]],modifs,"F");
    }
    return nada;
}


evaluator._helper.clipshape=function(shape,modifs){
    if(shape.type=="polygon") {
        return evaluator._helper.drawpolygon([shape],modifs,"C",1);
    }
    if(shape.type=="circle") {
        return evaluator._helper.drawcircle([shape.value.value[0],shape.value.value[1]],modifs,"C");
    }
    return nada;
}




evaluator.fill =function(args,modifs){
    if(args.length==1) {
        var v1=evaluate(args[0]);
        
        if(v1.ctype=="shape"){
            return evaluator._helper.fillshape(v1,modifs);
            
        }
    }
    return nada;
}



evaluator.clip =function(args,modifs){
    if(args.length==1) {
        var v1=evaluate(args[0]);
        
        if(v1.ctype=="shape"){
            return evaluator._helper.clipshape(v1,modifs);
            
        }
        if(v1.ctype=="list"){
            erg=evaluator.polygon(args,[]);
            
            return evaluator.clip([erg],[]);
            
        }
    }
    return nada;
}





evaluator._helper.setDash=function(pattern,size){
    var s=Math.sqrt(size);
    for (var i=0;i<pattern.length;i++){
        pattern[i]*=s;
    }
    if (!csctx.setLineDash) {
        csctx.setLineDash = function () {}
        
    }
    csctx.webkitLineDash=pattern;//Safari
        csctx.setLineDash(pattern)//Chrome
            csctx.mozDash = pattern;//FFX
}

evaluator._helper.unSetDash=function(){
    if (!csctx.setLineDash) {
        csctx.setLineDash = function () {}
        
    }
    csctx.webkitLineDash=[];//Safari
    csctx.setLineDash([])//Chrome
        csctx.mozDash = [];//FFX
}


evaluator._helper.setDashType=function(type,s){
    
    if(type==0){
        evaluator._helper.setDash([]);
    }
    if(type==1){
        evaluator._helper.setDash([10,10],s);
    }
    if(type==2){
        evaluator._helper.setDash([10,4],s);
    }
    if(type==3){
        evaluator._helper.setDash([1,3],s);
    }
    if(type==4){
        evaluator._helper.setDash([10,5,1,5],s);
    }
    
}



///////////////////////////////////////////////
////// FUNCTION PLOTTING    ///////////////////
///////////////////////////////////////////////

// TODO: Dynamic Color and Alpha

evaluator.plot=function(args,modifs){ //OK
    
    var dashing=false;
    var connectb=false;
    var minstep=0.001;
    var pxlstep=.2; //TODO Anpassen auf PortScaling
    var count=0;
    var stroking=false;
    var start=-10; //TODO Anpassen auf PortScaling
    var stop=10;
    var step=1;
    var steps=1000;
    
    
    var handleModifs = function(type){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                lsize=erg.value.real;
                if(lsize<0) lsize=0;
            }
            
        }
        
        
        if(modifs.dashpattern!==undefined){
            erg =evaluate(modifs.dashpattern);
            if(erg.ctype=='list'){
                var pat=[]; 
                for(var i=0; i<erg.value.length;i++){
                    pat[i]=erg.value[i].value.real;
                }
                evaluator._helper.setDash(pat,lsize);
                dashing=true;
            }
        }
        
        
        if(modifs.dashtype!==undefined){
            erg =evaluate(modifs.dashtype);
            if(erg.ctype=='number'){
                var type=Math.floor(erg.value.real);
                evaluator._helper.setDashType(type,lsize);
                dashing=true;
                
                
            }
        }
        
        if(modifs.dashing!==undefined){
            erg =evaluate(modifs.dashing);
            if(erg.ctype=='number'){
                var si=Math.floor(erg.value.real);
                evaluator._helper.setDash([si*2,si],lsize);
                dashing=true;
                
                
            }
        }
        
        
        if(modifs.connect!==undefined){
            erg =evaluate(modifs.connect);
            if(erg.ctype=='boolean'){
                connectb=erg.value;               
            }
        }
        
        if(modifs.start!==undefined){
            erg =evaluate(modifs.start);
            if(erg.ctype=='number'){
                start=erg.value.real;               
            }
        }
        
        if(modifs.stop!==undefined){
            erg =evaluate(modifs.stop);
            if(erg.ctype=='number'){
                stop=erg.value.real;               
            }
        }
        
        if(modifs.steps!==undefined){
            erg =evaluate(modifs.steps);
            if(erg.ctype=='number'){
                steps=erg.value.real;               
            }
        }
        
        
        
        
        
        if(modifs.color===undefined &&modifs.alpha===undefined){
            return;
        }
        
        
        var r=0;
        var g=0;
        var b=0;
        var alpha=csport.drawingstate.alpha;
        r=csport.drawingstate.linecolorraw[0]*255;
        g=csport.drawingstate.linecolorraw[1]*255;
        b=csport.drawingstate.linecolorraw[2]*255;
        
        if(modifs.color!==undefined){
            erg =evaluate(modifs.color);
            if(List.isNumberVector(erg).value){
                if(erg.value.length==3){
                    r=Math.floor(erg.value[0].value.real*255);
                    g=Math.floor(erg.value[1].value.real*255);
                    b=Math.floor(erg.value[2].value.real*255);
                    
                }
                
            }
        }
        
        
        if(modifs.alpha!==undefined){
            erg =evaluate(modifs.alpha);
            if(erg.ctype=="number"){
                alpha=erg.value.real;
            }
        }
        col="rgba("+r+","+g+","+b+","+alpha+")";//TODO Performanter machen
    }
    
    
    
    var v1=args[0];
    if(args.length==2 && args[1].ctype=='variable'){
        runv=args[1].name;
        
    } else {
        var li=evaluator._helper.plotvars(v1);
        var runv="#";
        if(li.indexOf("t")!=-1) {runv="t"};
        if(li.indexOf("z")!=-1) {runv="z"};
        if(li.indexOf("y")!=-1) {runv="y"};
        if(li.indexOf("x")!=-1) {runv="x"};
    }
    
    namespace.newvar(runv);
    
    var m=csport.drawingstate.matrix;
    var col=csport.drawingstate.linecolor;
    var lsize=1;
    
    handleModifs();
    
    
    csctx.strokeStyle=col;
    csctx.lineWidth = lsize;
    csctx.lineCap = 'round';
    csctx.lineJoin = 'round';
    
    
    
    
    
    var canbedrawn=function(v){
        return v.ctype=='number' && CSNumber._helper.isAlmostReal(v);
    }
    
    var drawstroke=function(x1,x2,v1,v2,step){
        
    }
    
    var limit=function(v){ //TODO: Die  muss noch geschreoben werden
        return v;
        
    }
    
    var drawstroke=function(x1,x2,v1,v2,step){
        count++;
        //console.log(niceprint(x1)+"  "+niceprint(x2));
        //console.log(step);
        var xb=+x2.value.real;
        var yb=+v2.value.real;
        
        
        var xx2=xb*m.a-yb*m.b+m.tx;
        var yy2=xb*m.c-yb*m.d-m.ty;
        var xa=+x1.value.real;
        var ya=+v1.value.real;
        var xx1=xa*m.a-ya*m.b+m.tx;
        var yy1=xa*m.c-ya*m.d-m.ty;
        
        if(!stroking){
            csctx.beginPath();
            csctx.moveTo(xx1, yy1);
            csctx.lineTo(xx2, yy2);
            stroking=true;
        } else {
            csctx.lineTo(xx1, yy1);
            
            csctx.lineTo(xx2, yy2);
        }
        
    }
    
    
    var drawrec=function(x1,x2,y1,y2,step){
        
        var drawable1 = canbedrawn(y1);
        var drawable2 = canbedrawn(y2);
        
        
        if ((step < minstep)) {//Feiner wollen wir  nicht das muss wohl ein Sprung sein
            if (!connectb) {
                if(stroking) {
                    csctx.stroke();
                    stroking=false;
                }
                
                
            }
            return;
        }
        if (!drawable1 && !drawable2)
            return; //also hier gibt's nix zu malen, ist ja nix da
        
        var mid=CSNumber.real((x1.value.real+x2.value.real)/2);
        namespace.setvar(runv,mid);
        var ergmid=evaluate(v1);
        
        var drawablem = canbedrawn(ergmid);
        
        if (drawable1 && drawable2 && drawablem) { //alles ist malbar ---> Nach Steigung schauen
            var a = limit(y1.value.real);
            var b = limit(ergmid.value.real);
            var c = limit(y2.value.real);
            var dd = Math.abs(a + c - 2 * b) / (pxlstep);
            var drawit=(dd<1) 
                if(drawit){//Weiterer Qualitätscheck eventuell wieder rausnehmen.
                    var mid1=CSNumber.real((x1.value.real+mid.value.real)/2);
                    namespace.setvar(runv,mid1);
                    var ergmid1=evaluate(v1);
                    
                    var mid2=CSNumber.real((mid.value.real+x2.value.real)/2);
                    namespace.setvar(runv,mid2);
                    var ergmid2=evaluate(v1);
                    
                    var ab = limit(ergmid1.value.real);
                    var bc = limit(ergmid2.value.real);
                    var dd1 = Math.abs(a + b - 2 * ab) / (pxlstep);
                    var dd2 = Math.abs(b + c - 2 * bc) / (pxlstep);
                    drawit=drawit && dd1<1 && dd2<1;
                    
                    
                }
            if (drawit) {  // Refinement sieht gut aus ---> malen
                drawstroke(x1, mid, y1, ergmid, step / 2);
                drawstroke(mid, x2, ergmid, y2, step / 2);
                
            } else {  //Refinement zu grob weiter verfeinern
                drawrec(x1, mid, y1, ergmid, step / 2);
                drawrec(mid, x2, ergmid, y2, step / 2);
            }
            return;
        }
        
        //Übergange con drawable auf nicht drawable
        
        drawrec(x1, mid, y1, ergmid, step / 2);
        
        drawrec(mid, x2, ergmid, y2, step / 2);
        
        
    }
    
    //Hier beginnt der Hauptteil
    var xo,vo,x,v;
    
    var stroking=false;
    
    x=CSNumber.real(14.32)
        namespace.setvar(runv,x);
    v=evaluate(v1);
    if(v.ctype!="number") {
        if(List.isNumberVector(v).value){
            if(v.value.length==2){  //Parametric Plot
                var stroking=false;
                step=(stop-start)/steps;
                for(var x=start;x<stop;x=x+step){
                    namespace.setvar(runv,CSNumber.real(x));
                    var erg=evaluate(v1);
                    if(List.isNumberVector(erg).value && erg.value.length==2){
                        var x1=+erg.value[0].value.real;
                        var y=+erg.value[1].value.real;
                        var xx=x1*m.a-y*m.b+m.tx;
                        var yy=x1*m.c-y*m.d-m.ty;
                        
                        if(!stroking){
                            csctx.beginPath();
                            csctx.moveTo(xx, yy);
                            stroking=true;
                        } else {
                            csctx.lineTo(xx, yy);
                        }
                        
                    }
                    
                    
                }
                csctx.stroke();
                
                namespace.removevar(runv);
                
            }
        }
        if(dashing)
            evaluator._helper.unSetDash();
        return nada;
    }
    
    
    for(var xx=start;xx<stop+step;xx=xx+step){
        
        x=CSNumber.real(xx)
        namespace.setvar(runv,x);
        v=evaluate(v1);
        
        if(x.value.real>start){
            drawrec(xo,x,vo,v,step);
            
        }
        xo=x;        
        vo=v;        
        
        
    }
    
    //    console.log(count);
    
    //   csctx.stroke();
    
    namespace.removevar(runv);
    if(stroking)
        csctx.stroke();
    
    if(dashing)
        evaluator._helper.unSetDash();
    return nada;
    
}



evaluator.plotX=function(args,modifs){ //OK
    
    
    var v1=args[0];
    var li=evaluator._helper.plotvars(v1);
    var runv="#";
    if(li.indexOf("t")!=-1) {runv="t"};
    if(li.indexOf("z")!=-1) {runv="z"};
    if(li.indexOf("y")!=-1) {runv="y"};
    if(li.indexOf("x")!=-1) {runv="x"};
    
    
    namespace.newvar(runv);
    var start=-10;
    var stop=10;
    var step=.01;
    var m=csport.drawingstate.matrix;
    var col=csport.drawingstate.linecolor
        csctx.fillStyle=col;
    csctx.lineWidth = 1;
    csctx.lineCap = 'round';
    
    var stroking=false;
    
    for(var x=start;x<stop;x=x+step){
        namespace.setvar(runv,CSNumber.real(x));
        
        var erg=evaluate(v1);
        if(erg.ctype=="number"){
            var y=+erg.value.real;
            var xx=x*m.a-y*m.b+m.tx;
            var yy=x*m.c-y*m.d-m.ty;
            if(!stroking){
                csctx.beginPath();
                csctx.moveTo(xx, yy);
                stroking=true;
            } else {
                csctx.lineTo(xx, yy);
            }
            
        }
        
        
    }
    csctx.stroke();
    
    namespace.removevar(runv);
    
    
    return nada;
    
}


evaluator._helper.plotvars=function(a){
    var merge=function(x,y){
        var obj = {};
        for (var i = x.length-1; i >= 0; -- i)
            obj[x[i]] = x[i];
        for (var i = y.length-1; i >= 0; -- i)
            obj[y[i]] = y[i];
        var res = []
            for (var k in obj) {
                if (obj.hasOwnProperty(k))  // <-- optional
                    res.push(obj[k]);
            }
        return res;
    }
    
    var remove=function(x,y){
        
        for (var i = 0; i < x.length; i++) {
            if (x[i] === y) {
                x.splice(i, 1);
                i--;
            }
        }
        return x;
    }
    
    if(a.ctype=="variable"){
        return [a.name];
    }
    
    if(a.ctype=='infix'){
        var l1=  evaluator._helper.plotvars(a.args[0]);
        var l2=  evaluator._helper.plotvars(a.args[1]);
        return merge(l1,l2);
    }
    
    if(a.ctype=='list'){
        var els=a.value;
        var li=[];
        for(var j=0;j<els.length;j++) {
            var l1= evaluator._helper.plotvars(els[j]);
            li=merge(li,l1);
        }
        return li;
    }
    
    if(a.ctype=='function'){
        var els=a.args;
        var li=[];
        for(var j=0;j<els.length;j++) {
            var l1=evaluator._helper.plotvars(els[j]);
            li=merge(li,l1);
            
        }
        if((  a.oper=="apply"  //OK, das kann man eleganter machen, TODO: irgendwann
              ||a.oper=="select"
              ||a.oper=="forall"
              ||a.oper=="sum"
              ||a.oper=="product"
              ||a.oper=="repeat"
              ||a.oper=="min"
              ||a.oper=="max"
              ||a.oper=="sort"
              ) 
           && a.args[1].ctype=="variable"){
            li=remove(li,a.args[1].name);
        }
        return li;
    }
    
    return [];
    
    
}


evaluator.clrscr=function(args,modifs){
    if(args.length==0) {
        if(typeof csw != 'undefined' && typeof csh != 'undefined') {
            csctx.clearRect ( 0   , 0 , csw , csh );
        }
    }
    return nada;
}

evaluator.repaint=function(args,modifs){
console.log("REPAINT");
    if(args.length==0) {
        updateCindy();
    }
    return nada;
}


//*******************************************************
// and here are the definitions of the operators
//*******************************************************



evaluator.seconds=function(args,modifs){  //OK
    return {"ctype":"number" ,  "value":{'real':(new Date().getTime() / 1000),'imag':0}};
}



evaluator.err=function(args,modifs){      //OK
    
    if(typeof csconsole=="undefined"){
        csconsole=window.open('','','width=200,height=100');
        
    }
    
    
    if(args[0].ctype=='variable'){
        // var s=evaluate(args[0].value[0]);
        var s=evaluate(namespace.getvar(args[0].name));
        console.log(args[0].name+" ==> "+niceprint(s));
        csconsole.document.write(args[0].name+" ==> "+niceprint(s)+"<br>");
        
    } else {
        var s=evaluate(args[0]);        
        console.log(" ==> "+niceprint(s));
        csconsole.document.writeln(" ==> "+niceprint(s)+"<br>");
        
    }
    return nada;
}

evaluator.errc=function(args,modifs){      //OK
    
    
    if(args[0].ctype=='variable'){
        // var s=evaluate(args[0].value[0]);
        var s=evaluate(namespace.getvar(args[0].name));
        console.log(args[0].name+" ==> "+niceprint(s));
        
    } else {
        var s=evaluate(args[0]);
        console.log(" ==> "+niceprint(s));
        
    }
    return nada;
}

evaluator.dump=function(args,modifs){      
    
    dump(args[0]);
    return nada;
}



evaluator.repeat=function(args,modifs){    //OK
    var handleModifs = function(){
        
        if(modifs.start!==undefined){
            var erg =evaluate(modifs.start);
            if(erg.ctype=='number'){
                startb=true;
                start=erg.value.real;
            }
        }
        if(modifs.step!==undefined){
            var erg =evaluate(modifs.step);
            if(erg.ctype=='number'){
                stepb=true;
                step=erg.value.real;
            }
        }
        if(modifs.stop!==undefined){
            var erg =evaluate(modifs.stop);
            if(erg.ctype=='number'){
                stopb=true;
                stop=erg.value.real;
            }
        }
        
        
        if (startb && !stopb && !stepb) {
            stop = step * n + start;
        }
        
        if (!startb && stopb && !stepb) {
            start = -step * (n - 1) + stop;
            stop += step;
        }
        
        if (!startb && !stopb && stepb) {
            stop = step * n + start;
        }
        
        if (startb && stopb && !stepb) {
            step = (stop - start) / (n - 1);
            stop += step;
        }
        
        if (startb && !stopb && stepb) {
            stop = step * n + start;
        }
        
        if (!startb && stopb && stepb) {
            start = -step * (n - 1) + stop;
            stop += step;
        }
        
        if (startb && stopb && stepb) {
            stop += step;
        }
    }
    
    
    var v1=evaluateAndVal(args[0]);
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
            
        }
    }
    if(v1.ctype!='number'){
        return nada;
    }
    var n=Math.round(v1.value.real);//TODO: conversion to real!!!
        var step=1;
        var start=1;
        var stop=n+1;
        var startb=false;
        var stopb=false;
        var stepb=false;
        handleModifs();
        if ((start <= stop && step > 0) || (start >= stop && step < 0))
            if (startb && stopb && stepb) {
                n = Math.floor((stop - start) / step);
            }
                
                namespace.newvar(lauf);
        var erg;
        for(var i=0;i<n;i++){
            namespace.setvar(lauf,{'ctype':'number','value':{'real':i * step + start, 'imag':0}});
            erg=evaluate(args[argind]);
        }
        namespace.removevar(lauf);
        
        return erg;
        
}


evaluator.while=function(args,modifs){ //OK
    
    var prog=args[1];
    var test=args[0];
    var bo=evaluate(test);
    var erg=nada;
    while(bo.ctype!='list' && bo.value) {
        erg=evaluate(prog);
        bo=evaluate(test)
    }
    
    return erg;
    
}


evaluator.apply=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        erg[erg.length]=evaluate(args[argind]);
    }
    namespace.removevar(lauf);
    
    return {'ctype':'list','value':erg};
    
}

evaluator.forall=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    var res;
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        res=evaluate(args[argind]);
        erg[erg.length]=res;
    }
    namespace.removevar(lauf);
    
    return res;
    
}

evaluator.select=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        var res=evaluate(args[argind]);
        if(res.ctype=='boolean'){
            if(res.value==true){
                erg[erg.length]=li[i];
            }
        }
    }
    namespace.removevar(lauf);
    
    return {'ctype':'list','value':erg};
    
}






evaluator.semicolon=function(args,modifs){ //OK
    var u0=(args[0].ctype== 'void');
    var u1=(args[1].ctype== 'void');
    
    if(u0 && u1 ){
        return nada;
    }
    if(!u0 && u1 ){
        return evaluate(args[0]);
    }
    if(!u0 && !u1 ){
        evaluate(args[0]);  //Wegen sideeffects
    }
    if(!u1 ){
        return evaluate(args[1]);
    }
    return nada;
}


evaluator.createvar=function(args,modifs){ //OK
    

    if(args.length==1) {
        if(args[0].ctype=='variable'){
            var v=args[0].name;
            namespace.newvar(v);
        }
    }
        
    return nada;
    
}

evaluator.local=function(args,modifs){ //OK
    
    for(var i=0;i<args.length;i++){
        if(args[i].ctype=='variable'){
            var v=args[i].name;
            namespace.newvar(v);
        }
    }
        
    return nada;
    
}




evaluator.removevar=function(args,modifs){ //OK
    

    if(args.length==1) {
        var ret=evaluate(args[0]);

        if(args[0].ctype=='variable'){
            var v=args[0].name;
            namespace.removevar(v);
        }
        return ret;
    }
        
    return nada;
    
}



evaluator.release=function(args,modifs){ //OK
    
    if(args.length==0) 
        return nada;

    
    var ret=evaluate(args[args.length-1]);

    for(var i=0;i<args.length;i++){
        if(args[i].ctype=='variable'){
            var v=args[i].name;
            namespace.removevar(v);
        }
    }
        
    return ret;
    
}

evaluator.regional=function(args,modifs){ //OK
    
    for(var i=0;i<args.length;i++){
        if(args[i].ctype=='variable'){
            var v=args[i].name;
            namespace.newvar(v);
            namespace.pushVstack(v);
        }
    }
    return nada;
    
}



evaluator.genList=function(args,modifs){
    var erg=[];
    for(var i=0;i<args.length;i++){
        erg[erg.length]=evaluate(args[i]);
    }
    return {'ctype':'list','value':erg};
}


evaluator._helper.assigntake=function(data,what){//TODO: Bin nicht ganz sicher obs das so tut
    var where=evaluate(data.args[0]);
    var ind=evaluateAndVal(data.args[1]);
    
    if(where.ctype=='list'||where.ctype=='string'){
        var ind1=Math.floor(ind.value.real);
        if (ind1<0){
            ind1=where.value.length+ind1+1;
        }
        if(ind1>0 && ind1<where.value.length+1){ 
            if(where.ctype=='list')  {  
                where.value[ind1-1]=evaluate(what);
            } else{
                var str=where.value;
                str=str.substring(0,ind1-1)+niceprint(evaluate(what))+str.substring(ind1,str.length);
                where.value=str;
            }
        }
    }
    
    return nada;
    
}


evaluator._helper.assigndot=function(data,what){
    var where=evaluate(data.obj);
    var field=data.key;
    if(where && field){
        Accessor.setField(where.value,field,evaluate(what));       
    }
    
    return nada;
    
}



evaluator._helper.assignlist=function(vars,vals){
    var n=vars.length;
    var m=vals.length;
    if(m<n) n=m;

    for(var i=0;i<n;i++){
       var name=vars[i];
       var val=vals[i];
       evaluator.assign([name,val],[]);
    
    }
    

}



evaluator.assign=function(args,modifs){
    
    var u0=(args[0].ctype== 'undefined');
    var u1=(args[1].ctype== 'undefined');
    if(u0 || u1 ){
        return nada;
    }
    if(args[0].ctype=='variable' ){
        namespace.setvar(args[0].name,evaluate(args[1]));
    }
    if(args[0].ctype=='infix' ){
        if(args[0].oper=='_'){
            evaluator._helper.assigntake(args[0],args[1]);
        }
    }
    if(args[0].ctype=='field' ){
        evaluator._helper.assigndot(args[0],args[1]);
    }

    if(args[0].ctype=='function' &&args[0].oper=='genList' ){
        var v1=evaluate(args[1]);
        if(v1.ctype=="list"){
            
            evaluator._helper.assignlist(args[0].args,v1.value);
        }
        
    }
    return args[0].value;
}


evaluator.define=function(args,modifs){
    
    var u0=(args[0].ctype== 'undefined');
    var u1=(args[1].ctype== 'undefined');
    
    if(u0 || u1 ){
        return nada;
    }
    if(args[0].ctype=='function' ){
        var fname=args[0].oper;
        var ar=args[0].args;
        var body=args[1];
        myfunctions[fname+ar.length]={
            'oper':fname,
            'body':body,
            'arglist':ar
        };
    }
    
    return nada;
}


evaluator.if=function(args,modifs){  //OK
    
    var u0=(args[0].ctype== 'undefined');
    var u1=(args[1].ctype== 'undefined');
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='boolean'){
        if(v0.value==true){
            return evaluate(args[1]);
        } else if (args.length==3){
            return evaluate(args[2]);
        }
    }
    
    return nada;
    
}

evaluator.comp_equals=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return {'ctype':'boolean' ,
            'value':(v0.value.real==v1.value.real)&&
            (v0.value.imag==v1.value.imag)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        var erg=List.equals(v0,v1);
        return erg;
    }
    return {'ctype':'boolean' ,'value':false  };
}

evaluator.comp_notequals=function(args,modifs){  
    var erg=evaluator.comp_equals(args,modifs);
    erg.value=!erg.value;
    return erg;
}


evaluator.comp_almostequals=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return {'ctype':'boolean' ,
            'value':CSNumber._helper.isAlmostEqual(v0,v1)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        var erg=List.almostequals(v0,v1);
        return erg;
    }
    return {'ctype':'boolean' ,'value':false  };
}


evaluator.and=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(v0.value && v1.value)  }
    }
    
    return nada;
}


evaluator.or=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(v0.value || v1.value)  }
    }
    
    return nada;
}



evaluator.xor=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(v0.value != v1.value)  }
    }
    
    return nada;
}


evaluator.not=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='void' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(!v1.value)  }
    }
    
    return nada;
}


evaluator.numb_degree=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='number' && v1.ctype=='void' ){
        return CSNumber.mult(v0,CSNumber.real(Math.PI/180));
    }
    
    return nada;
}




evaluator.comp_notalmostequals=function(args,modifs){  
    var erg=evaluator.comp_almostequals(args,modifs);
    erg.value=!erg.value;
    return erg;
}




evaluator.comp_ugt=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>v1.value.real+CSNumber.eps)  }
    }
    return nada;
}

evaluator.comp_uge=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>v1.value.real-CSNumber.eps)  }
    }
    return nada;
}

evaluator.comp_ult=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<v1.value.real-CSNumber.eps)  }
    }
    return nada;
}

evaluator.comp_ule=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<v1.value.real+CSNumber.eps)  }
    }
    return nada;
}



evaluator.comp_gt=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value>v1.value)  }
    }
    return nada;
}


evaluator.comp_ge=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>=v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value>=v1.value)  }
    }
    return nada;
}


evaluator.comp_le=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<=v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value<=v1.value)  }
    }
    return nada;
}

evaluator.comp_lt=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value<v1.value)  }
    }
    return nada;
}





evaluator.sequence=function(args,modifs){  //OK
    var v0=evaluate(args[0]);
    var v1=evaluate(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return List.sequence(v0,v1)
    }
    return nada;
}



evaluator._helper.genericListMath1=function(args,op){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    
    if(li.length==0){
        return nada;
    }
    namespace.newvar(lauf);
    namespace.setvar(lauf,li[0]);
    var erg=evaluate(args[argind]);
    for(var i=1;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        var b=evaluate(args[argind]);
        erg=General[op](erg,b);
    }
    namespace.removevar(lauf);
     return erg;
    
}


evaluator._helper.genericListMath=function(args,op){
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return erg = List.genericListMath(v0,op);
            
        }
    }
    return evaluator._helper.genericListMath1(args,op);
}


evaluator.product=function(args,modifs){
    return evaluator._helper.genericListMath(args,"mult");
}


evaluator.sum=function(args,modifs){
    return evaluator._helper.genericListMath(args,"add");
}


evaluator.max=function(args,modifs){
    return evaluator._helper.genericListMath(args,"max");
}

evaluator.min=function(args,modifs){
    return evaluator._helper.genericListMath(args,"min");
}



evaluator.add=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    return General.add(v0,v1);
    
}


evaluator.minus=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype == 'void'  && v1.ctype=='number' ){   //Monadisches Plus
        return CSNumber.neg(v1);
    }
    
    if(v0.ctype == 'void'  && v1.ctype=='list' ){   //Monadisches Plus
        return List.neg(v1);
    }
    
    if(v0.ctype=='number'  && v1.ctype=='number' ){
        return CSNumber.sub(v0,v1);
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        return List.sub(v0,v1)
    }
    return nada;
    
}

evaluator.mult=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    return General.mult(v0,v1);
}

evaluator.div=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    return General.div(v0,v1);
    
}



evaluator.mod=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.mod(v0,v1);
    }
    return nada;
    
}

evaluator.pow=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.pow(v0,v1);
    }
    return nada;
    
}


///////////////////////////////
//     UNARY MATH OPS        //
///////////////////////////////



evaluator.exp=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.exp(v0);
    }
    return nada;    
}

evaluator.sin=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.sin(v0);
    }
    return nada;
}

evaluator.sqrt=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.sqrt(v0);
    }
    return nada;
}


evaluator.cos=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.cos(v0);
    }
    return nada;
}


evaluator.tan=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.tan(v0);
    }
    return nada;
}

evaluator.arccos=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.arccos(v0);
    }
    return nada;
}


evaluator.arcsin=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.arcsin(v0);
    }
    return nada;
}


evaluator.arctan=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.arctan(v0);
    }
    return nada;
}

evaluator.arctan2=function(args,modifs){
    
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        if(v0.ctype=='number' &&v1.ctype=='number'){
            return CSNumber.arctan2(v0,v1);
        }
    }
    
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' &&v0.value.length==2){
            var tmp=v0.value;
            if(tmp[0].ctype=='number' && tmp[1].ctype=='number') {
                return evaluator.arctan2(tmp,modifs);
            }
        }
    }
    return nada;
}




evaluator.log=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.log(v0);
    }
    return nada;
    
}




evaluator.recursive=function(args,op){//OK dieses konstrukt frisst evtl ein klein wenig performance, let's try
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber[op](v0);
    }
    if(v0.ctype=='list' ){
        return List[op](v0);
    }
    return nada;
    
}

evaluator.im=function(args,modifs){
    return evaluator.recursive(args,"im");
}


evaluator.re=function(args,modifs){
    return evaluator.recursive(args,"re");
}


evaluator.conjugate=function(args,modifs){
    return evaluator.recursive(args,"conjugate");
}


evaluator.round=function(args,modifs){
    return evaluator.recursive(args,"round");
}


evaluator.ceil=function(args,modifs){
    return evaluator.recursive(args,"ceil");
}


evaluator.floor=function(args,modifs){
    return evaluator.recursive(args,"floor");
}


evaluator.abs=function(args,modifs){
    return evaluator.recursive(args,"abs");
}

///////////////////////////////
//        RANDOM             //
///////////////////////////////

evaluator.random=function(args,modifs){
    if(args.length==0){
        return CSNumber.real(CSNumber._helper.rand());
    }
    
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return CSNumber.complex(v0.value.real*CSNumber._helper.rand(),v0.value.imag*CSNumber._helper.rand());
        }
    }
    return nada;
    
}

evaluator.random=function(args,modifs){
    if(args.length==0){
        return CSNumber.real(CSNumber._helper.rand());
    }
    
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return CSNumber.complex(v0.value.real*CSNumber._helper.rand(),v0.value.imag*CSNumber._helper.rand());
        }
    }
    return nada;
    
}

evaluator.seedrandom=function(args,modifs){
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            CSNumber._helper.seedrandom(v0.value.real);
        }
    }
    return nada;
    
}




evaluator.randomnormal=function(args,modifs){
    
    if(args.length==0){
        return CSNumber.real(CSNumber._helper.randnormal());
    }
    return nada;
    
}


evaluator.randominteger=function(args,modifs){
    return evaluator.randomint(args,modifs);
}


evaluator.randombool=function(args,modifs){
    
    if(args.length==0){
        if(CSNumber._helper.rand()>0.5){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
        
    }
    
    return nada;
    
}


///////////////////////////////
//        TYPECHECKS         //
///////////////////////////////

evaluator.isreal=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(CSNumber._helper.isAlmostReal(v0)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.isinteger=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(CSNumber._helper.isAlmostReal(v0)&&
               v0.value.real==Math.floor(v0.value.real)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}


evaluator.iseven=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(CSNumber._helper.isAlmostReal(v0)&&
               v0.value.real/2==Math.floor(v0.value.real/2)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.isodd=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(CSNumber._helper.isAlmostReal(v0)&&
               (v0.value.real-1)/2==Math.floor((v0.value.real-1)/2)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}




evaluator.iscomplex=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}




evaluator.isstring=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='string' ){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.islist=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list' ){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}


evaluator.ismatrix=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if((List._helper.colNumb(v0))!=-1){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.isnumbermatrix=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if((List.isNumberMatrix(v0)).value){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}




evaluator.isnumbervector=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if((List.isNumberVector(v0)).value){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}


evaluator.matrixrowcolumn=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        var n=List._helper.colNumb(v0);
        if(n!=-1){
            return List.realVector([v0.value.length,v0.value[0].value.length]);
        }
    }
    return nada;
}



///////////////////////////////
//         GEOMETRY          //
///////////////////////////////


evaluator.complex=function(args,modifs){
    
    if(args.length==1){
        
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            if(List.isNumberVector(v0)) {
                if(v0.value.length==2){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    return CSNumber.complex(a.value.real-b.value.imag,b.value.real+a.value.imag);
                }
                if(v0.value.length==3){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    var c=v0.value[2];
                    a=CSNumber.div(a,c);
                    b=CSNumber.div(b,c);
                    return CSNumber.complex(a.value.real-b.value.imag,b.value.real+a.value.imag);
                }
                
            }
        }
    }
    return nada;
}

evaluator.gauss=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return List.realVector([v0.value.real,v0.value.imag]);
        }
    }
    return nada;
}



evaluator.cross=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="None";
            if(v0.usage=="Point"&&v1.usage=="Point"){erg.usage="Line"};
            if(v0.usage=="Line"&&v1.usage=="Line"){erg.usage="Point"};
            return erg;
        }
    }
    return nada;
    
}




evaluator.cross=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="None";
            if(v0.usage=="Point"&&v1.usage=="Point"){erg.usage="Line"};
            if(v0.usage=="Line"&&v1.usage=="Line"){erg.usage="Point"};
            return erg;
        }
    }
    return nada;
    
}


evaluator.para=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var w0=evaluateAndHomog(v0);
        var w1=evaluateAndHomog(v1);
        
               if(v0!=nada && v1!=nada){
            
            
            var u0=v0.usage;
            var u1=v1.usage;
            var p=w0;
            var l=w1;
            if(u0=="Line" || u1=="Point"){
                p=w1;
                l=w0;
            }
            
            var inf=List.linfty;
           
            var erg=List.cross(List.cross(inf,l),p);
            erg.usage="Line";
            return erg;
        }
    }
    return nada;
    
}

evaluator.perp=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var w0=evaluateAndHomog(v0);
        var w1=evaluateAndHomog(v1);
        if(v0!=nada && v1!=nada){
            
            
            var u0=v0.usage;
            var u1=v1.usage;
            var p=w0;
            var l=w1;
            if(u0=="Line" || u1=="Point"){
                p=w1;
                l=w0;
            }
            
            var inf=List.linfty;
            var tt=List.cross(inf,l);
            tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
            var erg=List.cross(tt,p);
            erg.usage="Line";
            return erg;
        }
    }
    
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        
        if(List._helper.isNumberVecN(v0,2)){
            v0.value=[CSNumber.neg(v0.value[1]),v0.value[0]];
            return(v0);
        }
        
    }
    
    return nada;
    
}



evaluator.parallel=function(args,modifs){
    return evaluator.para(args,modifs)
}

evaluator.perpendicular=function(args,modifs){
    return evaluator.perp(args,modifs)
}

evaluator.meet=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="Point";
            return erg;
        }
    }
    return nada;
    
}


evaluator.join=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="Line";
            return erg;
        }
    }
    return nada;
    
}



evaluator.dist=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var diff=evaluator.minus([v0,v1],[]);
        return evaluator.abs([diff],[]);
    }
    return nada;
    
}



evaluator.point=function(args,modifs){
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(List._helper.isNumberVecN(v0,3) || List._helper.isNumberVecN(v0,2)){
            v0.usage="Point";
        }
    }
    return v0;
    
}

evaluator.line=function(args,modifs){
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(List._helper.isNumberVecN(v0,3) ){
            v0.usage="Line";
        }
    }
    return v0;
    
}



evaluator.det=function(args,modifs){
    if(args.length==3){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        var v2=evaluateAndHomog(args[2]);
        if(v0!=nada && v1!=nada&& v2!=nada){
            var erg=List.det3(v0,v1,v2);
            return erg;
        }
    }
    return nada;
}

evaluator.area=function(args,modifs){
    if(args.length==3){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        var v2=evaluateAndHomog(args[2]);
        if(v0!=nada && v1!=nada&& v2!=nada){
            var z0=v0.value[2];
            var z1=v1.value[2];
            var z2=v2.value[2];
            if(!CSNumber._helper.isAlmostZero(z0) 
               && !CSNumber._helper.isAlmostZero(z1) 
               && !CSNumber._helper.isAlmostZero(z2) ){
                v0=List.scaldiv(z0,v0);
                v1=List.scaldiv(z1,v1);
                v2=List.scaldiv(z2,v2);
                var erg=List.det3(v0,v1,v2);
                erg.value.real=erg.value.real*.5;
                erg.value.imag=erg.value.imag*.5;
                return erg;
            }
        }
    }
    return nada;
}


evaluator.inverse=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            var n=List._helper.colNumb(v0);
            if(n!=-1&&n==v0.value.length){
                return List.inverse(v0);
                
            }
        }
    }
    return nada;
}

evaluator.det=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            var n=List._helper.colNumb(v0);
            if(n!=-1&&n==v0.value.length){
                return List.det(v0);
                
            }
        }
    }
    return nada;
}



///////////////////////////////
//    List Manipulations     //
///////////////////////////////

evaluator.take=function(args,modifs){
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluateAndVal(args[1]);
        if(v1.ctype=='number'){
            var ind=Math.floor(v1.value.real);
            if(v0.ctype=='list'||v0.ctype=='string'){
                if (ind<0){
                    ind=v0.value.length+ind+1;
                }
                if(ind>0 && ind<v0.value.length+1){
                    if(v0.ctype=='list'){
                        return v0.value[ind-1];
                    }
                    return {"ctype":"string" ,  "value":v0.value.charAt(ind-1)}
                    
                }
                return nada;
                
            }
            
        }
        
        if(v1.ctype=='list'){//Hab das jetzt mal rekursiv gemacht, ist anders als in Cindy
            var li=[];
            for(var i=0;i<v1.value.length;i++){
                var v1i=evaluateAndVal(v1.value[i]);
                li[i]=evaluator.take([v0,v1i],[]);
            }
            return List.turnIntoCSList(li);
            
        }
        
    }
    return nada;
    
    
}


evaluator.length=function(args,modifs){ //ACHTUNG: evaluator darf nicht array-artig sein.
                                        //Sonst kann ich hier nicht überschreiben
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'||v0.ctype=='string'){
            return CSNumber.real(v0.value.length);
            
        }
        
    }
    return nada;
}


evaluator.pairs=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.pairs(v0);
            
        }
        
    }
    return nada;
}

evaluator.triples=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.triples(v0);
        }
    }
    return nada;
}

evaluator.cycle=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.cycle(v0);
        }
    }
    return nada;
}

evaluator.consecutive=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.consecutive(v0);
        }
    }
    return nada;
}


evaluator.reverse=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.reverse(v0);
        }
    }
    return nada;
}

evaluator.directproduct=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.directproduct(v0,v1);
            
        }
        
    }
    return nada;
}

evaluator.concat=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.concat(v0,v1);
        }
        if(v0.ctype=='shape'&& v1.ctype=='shape'){
            return evaluator._helper.shapeconcat(v0,v1);
        }
    }
    return nada;
}



evaluator.common=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.common(v0,v1);
        }
        if(v0.ctype=='shape'&& v1.ctype=='shape'){
            return evaluator._helper.shapecommon(v0,v1);
        }

    }
    return nada;
}



evaluator.remove=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.remove(v0,v1);
        }
        if(v0.ctype=='shape'&& v1.ctype=='shape'){
            return evaluator._helper.shaperemove(v0,v1);
        }

    }
    return nada;
}


evaluator.append=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'){
            return List.append(v0,v1);
        }
    }
    return nada;
}

evaluator.prepend=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v1.ctype=='list'){
            return List.prepend(v0,v1);
        }
    }
    return nada;
}

evaluator.contains=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'){
            return List.contains(v0,v1);
        }
    }
    return nada;
}


evaluator._helper.sort2=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        erg[erg.length]={val:li[i] ,result:evaluate(args[argind])};
    }
    namespace.removevar(lauf);
    
    erg.sort(General.compareResults);    
    var erg1=[];
    for(var i=0;i<li.length;i++){
        erg1[erg1.length]=erg[erg1.length].val;
    }
    
    return {'ctype':'list','value':erg1};
    
}


evaluator.sort=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.sort1(v0);
        }
    }
    return evaluator._helper.sort2(args,modifs);
}


evaluator.set=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.set(v0);
        }
    }
    return nada;
}


evaluator.zeromatrix=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return List.zeromatrix(v0,v1);
    }
    return nada;
    
}



evaluator.zerovector=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number'){
        return List.zerovector(v0);
    }
    return nada;
    
}

evaluator.transpose=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    
    if(v0.ctype=='list' &&  List._helper.colNumb(v0)!=-1){
        return List.transpose(v0);
    }
    return nada;
    
}

evaluator.row=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v1.ctype=='number' && v0.ctype=='list' &&  List._helper.colNumb(v0)!=-1){
        return List.row(v0,v1);
    }
    return nada;
    
}

evaluator.column=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v1.ctype=='number' && v0.ctype=='list' &&  List._helper.colNumb(v0)!=-1){
        return List.column(v0,v1);
    }
    return nada;
    
}



///////////////////////////////
//         COLOR OPS         //
///////////////////////////////

evaluator.red=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([c,0,0]);
        }
    }
    return nada;
}

evaluator.green=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([0,c,0]);
        }
    }
    return nada;
}

evaluator.blue=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([0,0,c]);
        }
    }
    return nada;
}

evaluator.grey=function(args,modifs){ 
    return evaluator.gray(args,modifs);
}

evaluator.gray=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([c,c,c]);
        }
    }
    return nada;
}


evaluator._helper.HSVtoRGB =function(h, s, v) {
    
    var r, g, b, i, f, p, q, t;
    if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return List.realVector([r,g,b]);
}

evaluator.hue=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=v0.value.real;
            
            c=c-Math.floor(c );
            return evaluator._helper.HSVtoRGB(c,1,1);
        }
    }
    return nada;
}

///////////////////////////////
//      shape booleans       //
///////////////////////////////



evaluator._helper.shapeconvert=function(a){
    if(a.type=="circle") {
        var pt=a.value.value[0];
        var aa=General.div(pt,pt.value[2]);
        var mx=aa.value[0].value.real;
        var my=aa.value[1].value.real;
        var r=a.value.value[1].value.real;
        var li=[];
        var n=36;
        var d=Math.PI*2/n;
        for(var i=0; i<n;i++){
            li[i]={X:(mx+Math.cos(i*d)*r),Y:(my+Math.sin(i*d)*r)};
        }
        
        return [li];
    }
    if(a.type=="polygon") {
        erg=[];
        for(var i=0; i<a.value.length;i++){
            pol=a.value[i]
            li=[];
            for(var j=0; j<pol.length;j++){
                li[j]={X:pol[j].X,Y:pol[j].Y};
            }
            erg[i]=li;
        }
        return erg;
    }
    
    
}


evaluator._helper.shapeop=function(a,b,op){

    var convert
    var aa=evaluator._helper.shapeconvert(a);
    var bb=evaluator._helper.shapeconvert(b);
    var scale=1000;
    ClipperLib.JS.ScaleUpPaths(aa, scale);
    ClipperLib.JS.ScaleUpPaths(bb, scale);
    var cpr = new ClipperLib.Clipper();
    cpr.AddPaths(aa, ClipperLib.PolyType.ptSubject, true);
    cpr.AddPaths(bb, ClipperLib.PolyType.ptClip, true);
    var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
    var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
    var clipType =  op;
    var solution_paths= new ClipperLib.Paths();
    cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
    ClipperLib.JS.ScaleDownPaths(solution_paths, scale);
//    console.log(JSON.stringify(solution_paths));    
    return {ctype:"shape",type:"polygon", value:solution_paths};

};

evaluator._helper.shapecommon=function(a,b){
    return evaluator._helper.shapeop(a,b,ClipperLib.ClipType.ctIntersection);
}

evaluator._helper.shaperemove=function(a,b){
    return evaluator._helper.shapeop(a,b,ClipperLib.ClipType.ctDifference);
}

evaluator._helper.shapeconcat=function(a,b){
    return evaluator._helper.shapeop(a,b,ClipperLib.ClipType.ctUnion);
}


///////////////////////////////
//            IO             //
///////////////////////////////

evaluator.key=function(args,modifs){  //OK
    if(args.length==0){
        return {ctype:"string",value:cskey};
    }
    return nada;
}


evaluator.keycode=function(args,modifs){  //OK
    if(args.length==0){

        return CSNumber.real(cskeycode);

    }
    return nada;
}



evaluator.mouse=function(args,modifs){  //OK
    if(args.length==0){
        
        var x = csmouse[0];
        var y = csmouse[1];
        return List.realVector([x,y]);
    }
    return nada;
}

evaluator.mover=function(args,modifs){  //OK
    if(args.length==0){

        if(move && move.mover)
            return {ctype:"geo",value:move.mover,type:"P"};
    }
    return nada;
}




///////////////////////////////
//      Graphic State        //
///////////////////////////////

evaluator.translate=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            if(List.isNumberVector(v0)) {
                if(v0.value.length==2){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    
                    csport.translate(a.value.real,b.value.real);
                    return nada;
                    
                }
            }
        }
    }
    return nada;
}



evaluator.rotate=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.rotate(v0.value.real);
            return nada;
        }
    }
    return nada;
}


evaluator.scale=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.scale(v0.value.real);
            return nada;
        }
    }
    return nada;
}


evaluator.greset=function(args,modifs){ 
    if(args.length==0){
        var n=csgstorage.stack.length; 
        csport.greset();
        for(var i=0;i<n;i++){
                csctx.restore();
        }
        
    }
    return nada;
}


evaluator.gsave=function(args,modifs){ 
    if(args.length==0){
        csport.gsave();
        csctx.save();
    }
    return nada;
}


evaluator.grestore=function(args,modifs){ 
    if(args.length==0){
        csport.grestore();
        csctx.restore();

    }
    return nada;
}


evaluator.color=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' && List.isNumberVector(v0).value){
            csport.setcolor(v0);
        }
    }
    return nada;
    
}


evaluator.linecolor=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' && List.isNumberVector(v0).value){
            csport.setlinecolor(v0);
        }
    }
    return nada;
    
}


evaluator.pointcolor=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' && List.isNumberVector(v0).value){
            csport.setpointcolor(v0);
        }
    }
    return nada;
    
}

evaluator.alpha=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.setalpha(v0);
        }
    }
    return nada;
    
}

evaluator.pointsize=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.setpointsize(v0);
        }
    }
    return nada;
    
}


evaluator.linesize=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.setlinesize(v0);
        }
    }
    return nada;
    
}


evaluator.textsize=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.settextsize(v0);
        }
    }
    return nada;
    
}



///////////////////////////////
//          String           //
///////////////////////////////




evaluator.replace=function(args,modifs){ 
    if(args.length==3){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        var v2=evaluate(args[2]);
        if(v0.ctype=='string'&& v1.ctype=='string'&& v2.ctype=='string'){
            var str0=v0.value;
            var str1=v1.value;
            var str2=v2.value;
            var regex=new RegExp(str1,"g");
            str0=str0.replace(regex,str2);
            return {ctype:"string",value:str0};
        }
    }
    if(args.length==2){
        var ind;
        var repl;
        var keyind;
        var from;
        
        /////HELPER/////
        var getReplStr=function( str,  keys,  from) {
            var s = "";
            ind = -1;
            keyind = -1;
            for (var i = 0; i < keys.length; i++) {
                var s1 = keys[i][0];
                var a = str.indexOf(s1, from);
                if (a != -1) {
                    if (ind == -1) {
                        s = s1;
                        ind = a;
                        keyind = i;
                    } else if (a < ind) {
                        s = s1;
                        ind = a;
                        keyind = i;
                    }
                }
            }
            return s;
        }
        
        //////////////// 
        
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='string'&& v1.ctype=='list'){
            var s=v0.value;
            var rules=[];
            for (var i=0;i<v1.value.length;i++){
                var el=v1.value[i];
                if(el.ctype=="list" && 
                   el.value.length==2 &&
                   el.value[0].ctype=="string" &&
                   el.value[1].ctype=="string") {
                    rules[rules.length]=[el.value[0].value,el.value[1].value];
                }
                
            }
            ind = -1;
            from = 0;
            var srep = getReplStr(s, rules, from);
            while (ind != -1) {
                s = s.substring(0, ind) +
                (rules[keyind][1]) +
                s.substring(ind + (srep.length), s.length);
                from = ind + rules[keyind][1].length;
                srep = getReplStr(s, rules, from);
            }
            
            
        }
        return {ctype:"string",value:s}        
        
    }
    
    return nada;
}


evaluator.substring=function(args,modifs){ 
    
    if(args.length==3){
        var v0=evaluate(args[0]);
        var v1=evaluateAndVal(args[1]);
        var v2=evaluateAndVal(args[2]);
        if(v0.ctype=='string'&& v1.ctype=='number'&& v2.ctype=='number'){
            var s=v0.value;
            return {ctype:"string",value:s.substring(Math.floor(v1.value.real),
                                                     Math.floor(v2.value.real))};
        }
    }
    return nada;
}


evaluator.tokenize=function(args,modifs){ //TODO der ist gerade sehr uneffiktiv implementiert

    if(args.length==2){
           
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='string'&& v1.ctype=='string'){
            var convert=true;    
            if(modifs.autoconvert!==undefined){
                var erg =evaluate(modifs.autoconvert);
                if(erg.ctype=='boolean'){
                    convert=erg.value;
                }
            }
            
            
            var str=v0.value;
            var split=v1.value;
            var splitlist=str.split(split);
            var li=[];
            for (var i=0;i<splitlist.length;i++){
                var val= splitlist[i];
                if(convert){
                    var fl=parseFloat(val);
                    if(!isNaN(fl))
                        val=fl;
                }
                li[i]={ctype:"string",value:val};
            }
            return List.turnIntoCSList(li);
        }
        if(v0.ctype=='string'&& v1.ctype=='list'){
            if (v1.value.length==0){
                return v0;
            }

            var token=v1.value[0];
                 
            tli=List.turnIntoCSList(tokens);
            var firstiter=evaluator.tokenize([args[0],token],modifs).value;
            
            var li=[];
            for(var i=0;i<firstiter.length;i++){
                var tokens=[];
                for(var j=1;j<v1.value.length;j++){//TODO: Das ist Notlösung weil ich das wegen 
                    tokens[j-1]=v1.value[j];    //CbV und CbR irgendwie anders nicht hinbekomme
                }
                
                tli=List.turnIntoCSList(tokens);
                li[i]=evaluator.tokenize([firstiter[i],tli],modifs);
            }
            return List.turnIntoCSList(li);
            
        }
    
    }
    return nada;
    
}

evaluator.indexof=function(args,modifs){ 
    if(args.length==2){
           
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='string'&& v1.ctype=='string'){
            var str=v0.value;
            var code=v1.value;
            var i=str.indexOf(code);
            return CSNumber.real(i+1);
        }
    }
    if(args.length==3){
        
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        var v2=evaluate(args[2]);
        if(v0.ctype=='string'&& v1.ctype=='string'&& v2.ctype=='number'){
            var str=v0.value;
            var code=v1.value;
            var start=Math.round(v2.value.real);
            var i=str.indexOf(code,start-1);
            return CSNumber.real(i+1);
        }
    }
    
    return nada;
}



evaluator.parse=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluate(args[0]);
        
        if(v0.ctype=='string'){
            var code=condense(v0.value)
            var prog=analyse(code)
            return evaluate(prog);
        }
    }
    return nada;
    
}

///////////////////////////////
//     Transformations       //
///////////////////////////////

evaluator._helper.basismap=function(a,b,c,d){
    var mat= List.turnIntoCSList([a,b,c]);
    mat=List.inverse(List.transpose(mat));
    var vv=General.mult(mat,d);
    mat= List.turnIntoCSList([
        General.mult(vv.value[0],a),
        General.mult(vv.value[1],b),
        General.mult(vv.value[2],c)]);
    return List.transpose(mat);
    
} 


evaluator.map=function(args,modifs){ 
    
    if(args.length==8){
        var w0=evaluateAndHomog(args[0]);
        var w1=evaluateAndHomog(args[1]);
        var w2=evaluateAndHomog(args[2]);
        var w3=evaluateAndHomog(args[3]);
        var v0=evaluateAndHomog(args[4]);
        var v1=evaluateAndHomog(args[5]);
        var v2=evaluateAndHomog(args[6]);
        var v3=evaluateAndHomog(args[7]);
        if(v0!=nada && v1!=nada && v2!=nada && v3!=nada && 
           w0!=nada && w1!=nada && w2!=nada && w3!=nada){
            var m1=evaluator._helper.basismap(v0,v1,v2,v3);
            var m2=evaluator._helper.basismap(w0,w1,w2,w3);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    
    if(args.length==6){
        var w0=evaluateAndHomog(args[0]);
        var w1=evaluateAndHomog(args[1]);
        var w2=evaluateAndHomog(args[2]);
        var inf=List.realVector([0,0,1]);
        var cc=List.cross;
        
        var w3=cc(cc(w2,cc(inf,cc(w0,w1))),
                  cc(w1,cc(inf,cc(w0,w2))));
        
        var v0=evaluateAndHomog(args[3]);
        var v1=evaluateAndHomog(args[4]);
        var v2=evaluateAndHomog(args[5]);
        var v3=cc(cc(v2,cc(inf,cc(v0,v1))),
                  cc(v1,cc(inf,cc(v0,v2))));
        
        
        
        if(v0!=nada && v1!=nada && v2!=nada && v3!=nada && 
           w0!=nada && w1!=nada && w2!=nada && w3!=nada){
            var m1=evaluator._helper.basismap(v0,v1,v2,v3);
            var m2=evaluator._helper.basismap(w0,w1,w2,w3);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    
    
        if(args.length==4){
        
        var ii=List.ii;
        var jj=List.jj;

        var w0=evaluateAndHomog(args[0]);
        var w1=evaluateAndHomog(args[1]);        
        var v0=evaluateAndHomog(args[2]);
        var v1=evaluateAndHomog(args[3]);
        
        
        if(v0!=nada && v1!=nada && 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(v0,v1,ii,jj);
            var m2=evaluator._helper.basismap(w0,w1,ii,jj);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    

       if(args.length==2){
        
        var ii=List.ii;
        var jj=List.jj;
        var w0=evaluateAndHomog(args[0]);
        var w1=General.add(List.realVector([1,0,0]),w0);  
        var v0=evaluateAndHomog(args[1]);
        var v1=General.add(List.realVector([1,0,0]),v0);        

        
        if(v0!=nada && v1!=nada && 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(v0,v1,ii,jj);
            var m2=evaluator._helper.basismap(w0,w1,ii,jj);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    

    
    
    return nada;
    
}

evaluator.pointreflect=function(args,modifs){ 
    if(args.length==1){
        
        var ii=List.ii;
        var jj=List.jj;
        
        var w0=evaluateAndHomog(args[0]);
        var w1=General.add(List.realVector([1,0,0]),w0);  
        var v1=General.add(List.realVector([-1,0,0]),w0);  

        
        if( v1!=nada && 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(w0,v1,ii,jj);
            var m2=evaluator._helper.basismap(w0,w1,ii,jj);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);

        }
    }
    return nada;
}


evaluator.linereflect=function(args,modifs){ 
    if(args.length==1){
        
        var ii=List.ii;
        var jj=List.jj;

        var w0=evaluateAndHomog(args[0]);
        var r0=List.realVector([Math.random(),Math.random(),Math.random()]);
        var r1=List.realVector([Math.random(),Math.random(),Math.random()]);
        var w1=List.cross(r0,w0);  
        var w2=List.cross(r1,w0);  

        
        if( 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(w1,w2,ii,jj);
            var m2=evaluator._helper.basismap(w1,w2,jj,ii);
            var erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    return nada;
}



///////////////////////////////
//         Shapes            //
///////////////////////////////



evaluator._helper.extractPointVec=function(v1){//Eventuell Homogen machen
    var erg={};
    erg.ok=false;
    if(v1.ctype=='geo') {
        var val=v1.value;
        if(val.kind=="P"){
            erg.x= Accessor.getField(val,"x");
            erg.y= Accessor.getField(val,"y");
            erg.z= CSNumber.real(1);
            erg.ok=true;
            return erg;
        }
    
    }
    if(v1.ctype!='list'){
        return erg;
    }
    
    var pt1=v1.value;
    var x=0;
    var y=0;
    var z=0;
    if(pt1.length==2){
        var n1=pt1[0];
        var n2=pt1[1];
        if(n1.ctype=='number' && n2.ctype=='number'){
            erg.x=CSNumber.clone(n1);
            erg.y=CSNumber.clone(n2);
            erg.z= CSNumber.real(1);
            erg.ok=true;
            return erg;
        }
    }
    
    if(pt1.length==3){
        var n1=pt1[0];
        var n2=pt1[1];
        var n3=pt1[2];
        if(n1.ctype=='number' && n2.ctype=='number'&& n3.ctype=='number'){
            erg.x=CSNumber.div(n1,n3);
            erg.y=CSNumber.div(n2,n3);
            erg.z= CSNumber.real(1);
            erg.ok=true;
            return erg;
        }
    }
    
    return erg;
    
}




evaluator.polygon=function(args,modifs){ 
    if(args.length==1) {
        var v0=evaluate(args[0]);
        if (v0.ctype=='list'){
            var li=[];
            for(var i=0;i<v0.value.length;i++){
                var pt=evaluator._helper.extractPoint(v0.value[i]);
                if(!pt.ok ){
                    return nada;
                }
                              
                li[li.length]={X:pt.x,Y:pt.y};
            } 
            return {ctype:"shape", type:"polygon", value:[li]};
        }
        
    }
    return nada;
    
    
}


evaluator.circle=function(args,modifs){ 
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var pt=evaluator._helper.extractPointVec(v0);
        
        if(!pt.ok || v1.ctype!='number'){
            return nada;
        }
        var pt2 = List.turnIntoCSList([pt.x,pt.y,pt.z]);
        
        return {ctype:"shape", type:"circle", value:List.turnIntoCSList([pt2,v1])}
        
    }
    return nada;
}

evaluator.screen=function(args,modifs){ 
    if(args.length==0) {
        var m=csport.drawingstate.initialmatrix;
        var transf=function(px,py){
            var xx = px-m.tx;
            var yy = py+m.ty;
            var x=(xx*m.d-yy*m.b)/m.det;
            var y=-(-xx*m.c+yy*m.a)/m.det;
            var erg={X:x, Y:y};
            
            return erg;
        }
        var erg = [
            transf(0,0),
            transf(csw,0),
            transf(csw,csh),
            transf(0,csh)
            ];
        return {ctype:"shape", type:"polygon", value:[erg]}
        
    }
            
    return nada;
}

evaluator.allpoints=function(args,modifs){
	if (args.length==0) {
		erg=[];
		for (var i=0; i< csgeo.points.length; i++) {
			erg[i]={ctype:"geo",value:csgeo.points[i],type:"P"};
		}
		return {ctype:"list", value:erg};
	}
	return nada;
}


evaluator.allmasses=function(args,modifs){
	if (args.length==0) {
		erg=[];
		for (var i=0; i< masses.length; i++) {
                erg[i]={ctype:"geo",value:masses[i],type:"P"};
		}
		return {ctype:"list", value:erg};
	}
	return nada;
}


evaluator.alllines=function(args,modifs){
	if (args.length==0) {
		erg=[];
		for (var i=0; i< csgeo.lines.length; i++) {
			erg[i]={ctype:"geo",value:csgeo.lines[i],type:"L"};
		}
		return {ctype:"list", value:erg};
	}
	return nada;
}

evaluator.halfplane=function(args,modifs){ 
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var w0=evaluateAndHomog(v0);
        var w1=evaluateAndHomog(v1);
        if(v0!=nada && v1!=nada){
            var u0=v0.usage;
            var u1=v1.usage;
            var p=w0;
            var l=w1;
            if(u0=="Line" || u1=="Point"){
                p=w1;
                l=v0;
            }
            //OK im Folgenden lässt sich viel optimieren
            var inf=List.realVector([0,0,1]);
            var tt=List.cross(inf,l);
            tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
            var erg=List.cross(tt,p);
            var foot=List.cross(l,erg);
            foot=General.div(foot,foot.value[2]);
            p=General.div(p,p.value[2]);
            var diff=List.sub(p,foot);
            var nn=List.abs(diff);
            diff=General.div(diff,nn);
            
            var sx=foot.value[0].value.real;
            var sy=foot.value[1].value.real;
            var dx=diff.value[0].value.real*1000;
            var dy=diff.value[1].value.real*1000;
            
            var pp1={X:sx+dy/2,    Y:sy-dx/2};
            var pp2={X:sx+dy/2+dx, Y:sy-dx/2+dy};
            var pp3={X:sx-dy/2+dx, Y:sy+dx/2+dy};
            var pp4={X:sx-dy/2,    Y:sy+dx/2};
            return {ctype:"shape", type:"polygon", value:[[pp1,pp2,pp3,pp4]]};
        }
    }
    
    return nada;
    
    
}

evaluator.convexhull3d=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            var vals=v0.value;
            var pts=[];
            for(var i=0;i< vals.length;i++){
               if(List._helper.isNumberVecN(vals[i],3)){
                    for(var j=0;j< 3;j++){
                        var a=vals[i].value[j].value.real;
                        pts.push(a);
                    
                    }

               }
            
            }
            var ch=convexhull(pts);
            var chp=ch[0];
            var ergp=[];
            for(var i=0;i<chp.length;i+=3){
               ergp.push(List.realVector([chp[i],chp[i+1],chp[i+2]]));
            }
            var outp=List.turnIntoCSList(ergp);
            var chf=ch[1];
            var ergf=[];
            for(var i=0;i<chf.length;i++){
               for(var j=0;j<chf[i].length;j++){
                 chf[i][j]++;
               }
               ergf.push(List.realVector(chf[i]));
            }
            var outf=List.turnIntoCSList(ergf);
            return(List.turnIntoCSList([outp,outf]));
            
        }
    }
    return nada;
}





//*******************************************************
// and here are the definitions of the image operators
//*******************************************************


evaluator._helper.extractReferenceX=function(w,pos){
    
    
    
    
}

evaluator.drawimage = function(args,modifs){
    
    var drawimg1 = function(){
        
        
        var handleModifs = function(){
            if(modifs.angle!==undefined){
                erg =evaluate(modifs.angle);
                if(erg.ctype=='number'){
                    rot=erg.value.real;
                }
            }
            
            if(modifs.rotation!==undefined){
                erg =evaluate(modifs.rotation);
                if(erg.ctype=='number'){
                    rot=erg.value.real;
                }
            }
            
            if(modifs.scale!==undefined){
                erg =evaluateAndVal(modifs.scale);
                if(erg.ctype=='number'){
                    scax=erg.value.real;
                    scay=erg.value.real;
                }
                if(List.isNumberVector(erg).value && (erg.value.length==2)){
                    scax=erg.value[0].value.real;
                    scay=erg.value[1].value.real;
                }
                
            }
            
            if(modifs.scalex!==undefined){
                erg =evaluate(modifs.scalex);
                if(erg.ctype=='number'){
                    scax=erg.value.real;
                }
            }
            
            if(modifs.scaley!==undefined){
                erg =evaluate(modifs.scaley);
                if(erg.ctype=='number'){
                    scay=erg.value.real;
                }
            }
            
            if(modifs.flipx!==undefined){
                erg =evaluate(modifs.flipx);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipx=-1};
                }
            }
            
            if(modifs.flipy!==undefined){
                erg =evaluate(modifs.flipy);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipy=-1};
                }
            }
            
            
            if(modifs.alpha!==undefined){
                erg =evaluate(modifs.alpha);
                if(erg.ctype=='number'){
                    alpha=erg.value.real;
                }
                
            }
            
            
            
            
            
        }
        
        
        var scax=1;
        var scay=1;
        var flipx=1;
        var flipy=1;
        var rot=0;
        var alpha=1;
        
        var pt=evaluator._helper.extractPoint(v0);
        if(!pt.ok || img.ctype!='string'){
            return nada;
        }
        
        csctx.save();
        handleModifs();
        
        
        var m=csport.drawingstate.matrix;
        var initm=csport.drawingstate.initialmatrix;
        
        
        var w=images[img.value].width;
        var h=images[img.value].height;
        
        //TODO das ist für die Drehungen im lokaen koordinatensystem
        //sollte eigentlich einfacher gehen
        
        var xx=pt.x*m.a-pt.y*m.b+m.tx;
        var yy=pt.x*m.c-pt.y*m.d-m.ty;
        
        var xx1=(pt.x+1)*m.a-pt.y*m.b+m.tx-xx;
        var yy1=(pt.x+1)*m.c-pt.y*m.d-m.ty-yy;
        
        var ixx=pt.x*initm.a-pt.y*initm.b+initm.tx;
        var iyy=pt.x*initm.c-pt.y*initm.d-initm.ty;
        
        var ixx1=(pt.x+1)*initm.a-pt.y*initm.b+initm.tx-ixx;
        var iyy1=(pt.x+1)*initm.c-pt.y*initm.d-initm.ty-iyy;
        
        var sc=Math.sqrt(xx1*xx1+yy1*yy1)/Math.sqrt(ixx1*ixx1+iyy1*iyy1);
        var ang=-Math.atan2(xx1,yy1)+Math.atan2(ixx1,iyy1);
        
        
        
        if(alpha!=1)
            csctx.globalAlpha = alpha;
        
        csctx.translate(xx,yy);
        csctx.scale(scax*flipx*sc,scay*flipy*sc);
        
        
        csctx.rotate(rot+ang);
        
        
        csctx.translate(-xx,-yy);
        csctx.translate(-w/2,-h/2);
        
        
        csctx.drawImage(images[img.value], xx, yy);
        csctx.globalAlpha = 1;
        
        csctx.restore();
        
        
    }
    

    
    var drawimg3 = function(){
        var alpha=1;
        var flipx=1;
        var flipy=1;
        var aspect=1;
        
        var handleModifs = function(){
            
            if(modifs.alpha!==undefined){
                erg =evaluate(modifs.alpha);
                if(erg.ctype=='number'){
                    alpha=erg.value.real;
                }
                
            }
              if(modifs.aspect!==undefined){
                erg =evaluate(modifs.aspect);
                if(erg.ctype=='number'){
                    aspect=erg.value.real;
                }
                
            }
            
            if(modifs.flipx!==undefined){
                erg =evaluate(modifs.flipx);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipx=-1};
                }
            }
            
            if(modifs.flipy!==undefined){
                erg =evaluate(modifs.flipy);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipy=-1};
                }
            }
            
        }
        
        
        
        var pt1=evaluator._helper.extractPoint(v0);
        var pt2=evaluator._helper.extractPoint(v1);
        var pt3;
        
        
        if(!pt1.ok ||!pt2.ok  || img.ctype!='string'){
            return nada;
        }
       // console.lof(JSON.stringify(images));
        if(images===undefined || images[img.value]=='undefined')
            return;
        var w=images[img.value].width;
        var h=images[img.value].height;
        

        
        if(v2==0){
        
          pt3={};
          pt3.x=pt1.x-(pt2.y-pt1.y);
          pt3.y=pt1.y+(pt2.x-pt1.x);
          aspect=h/w;
        
        } else {
            var pt3=evaluator._helper.extractPoint(v2);
            if(!pt1.ok) return nada;
        }

        csctx.save();
        handleModifs();
        
        
        var m=csport.drawingstate.matrix;
        var initm=csport.drawingstate.initialmatrix;
        
        
              
        
        if(alpha!=1)
            csctx.globalAlpha = alpha;
        
        var xx1=pt1.x*m.a-pt1.y*m.b+m.tx;
        var yy1=pt1.x*m.c-pt1.y*m.d-m.ty;

        var xx2=pt2.x*m.a-pt2.y*m.b+m.tx;
        var yy2=pt2.x*m.c-pt2.y*m.d-m.ty;

        var xx3=pt3.x*m.a-pt3.y*m.b+m.tx;
        var yy3=pt3.x*m.c-pt3.y*m.d-m.ty;

        csctx.transform(xx2-xx1,yy2-yy1,xx3-xx1,yy3-yy1,xx1,yy1);
        csctx.scale(1/w,-1/h*aspect);
        
        csctx.translate(w/2,-h/2);
        csctx.scale(flipx,flipy);
        csctx.translate(-w/2,h/2);

        csctx.translate(0,-h);

        
        
        csctx.drawImage(images[img.value], 0,0);
        csctx.globalAlpha = 1;
        
        csctx.restore();
        
        
    }
    
    
    
    
    
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var img=evaluateAndVal(args[1]);
        
        return drawimg1();
    }
    
    if(args.length==3) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var v2=0;
        var img=evaluateAndVal(args[2]);
        
        return drawimg3();
    }

    
    if(args.length==4) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var v2=evaluateAndVal(args[2]);
        var img=evaluateAndVal(args[3]);
        
        return drawimg3();
    }
    
    return nada;
}



//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************

evaluator.sound={};
evaluator.sound.lines=[0,0,0,0,0,0,0,0,0,0,0,0];

evaluator.playsin= function(args,modifs){

    var handleModifs = function(){

        if(modifs.line!==undefined){

            erg =evaluate(modifs.line);
            if(erg.ctype=='number'){
                linenumber=Math.floor(erg.value.real);
                if(linenumber<0){linenumber=0;}
                if(linenumber>10){inenumber=10;}
            }
        }
    }  
        

    var v0=evaluateAndVal(args[0]);
    var linenumber=0;
    if(v0.ctype=='number' ){
        handleModifs();
        var lines=evaluator.sound.lines;
        var f=v0.value.real;
        if (lines[linenumber]==0){
            lines[linenumber]=T("sin", {freq:f,mul:0.6}).play();


        } else {
            lines[linenumber].set({freq:f});
        }
        
    }
    return nada;    

}

//****************************************************************
// this function is responsible for evaluation an expression tree
//****************************************************************

var evaluate=function(a){

    if(typeof a==='undefined'){
        return nada;
    }

    if(a.ctype=='infix'){
        var ioper=infixmap[a.oper];
        return evaluator._helper.eval(ioper,a.args,[]);
    }
    if(a.ctype=='variable'){
        return namespace.getvar(a.name);
      //  return a.value[0];
    }
    if(a.ctype=='void'){
        return a;
    }
    if(a.ctype=='geo'){
        return a;
    }
    if(a.ctype=='number'){
        return a;
    }
    if(a.ctype=='boolean'){
        return a;
    }
    if(a.ctype=='string'){
        return a;
    }
    if(a.ctype=='list'){
        return a;
    }
    if(a.ctype=='undefined'){
        return a;
    }
    if(a.ctype=='shape'){
        return a;
    }
    
    if(a.ctype=='field'){ 
        
        var obj=evaluate(a.obj);

        if(obj.ctype=="geo"){
            return Accessor.getField(obj.value,a.key);
        }
        if(obj.ctype=="list"){
            return List.getField(obj,a.key);
        }
        return nada;
    }

    if(a.ctype=='function'){
        var eargs=[];
        return evaluator._helper.eval(a.oper,a.args,a.modifs);
    }
    return nada;
    
}


var evaluateAndVal=function(a){


    var x=evaluate(a);
    if(x.ctype=='geo'){
        var val=x.value;
        if(val.kind=="P"){
            return Accessor.getField(val,"xy");
        }

    }
    return x;//TODO Implement this
}

var evaluateAndHomog=function(a){
    var x=evaluate(a);
    if(x.ctype=='geo'){
        var val=x.value;
        if(val.kind=="P"){
            return Accessor.getField(val,"homog");
        }
        if(val.kind=="L"){
            return x;//TODO implement
        }
        
    }
    if(List._helper.isNumberVecN(x,3)){
        return x;
    }
    
    if(List._helper.isNumberVecN(x,2)){
        var y=General.clone(x);
        y.value[2]=CSNumber.real(1);
        return y;
    }
    
    return nada;
}



//*******************************************************
// this function removes all comments spaces and newlines
//*******************************************************

var condense = function(code) {
	var literalmode = false;
	var commentmode = false;
	var erg = '';
	for (var i = 0; i < code.length; i++) {
		var closetoend = (i == code.length - 1);
		var c = code[i];
		if (c == '\"' && !commentmode)
			literalmode = !literalmode;

		if (c == '/' && (i != code.length - 1))
			if (code[i + 1] == '/')
				commentmode = true;
		if (c == '\n')
			commentmode = false;
		if (!(c === '\u0020' || c === '\u0009' || c === '\u000A' || c === '\u000C' || c === '\u000D' || commentmode) || literalmode)
			erg = erg + c;
	}
	return erg;
}

//*******************************************************
// this function shows an expression tree on the console
//*******************************************************

var report=function(a,i){
    var prep= new Array(i + 1).join('.');
    if(a.ctype=='infix'){
        console.log(prep+"INFIX: "+a.oper);
        console.log(prep+"ARG 1 ");
        report(a.args[0],i+1);
        console.log(prep+"ARG 2 ");
        report(a.args[1],i+1);
    }
    if(a.ctype=='number'){
        console.log(prep+"NUMBER: "+CSNumber.niceprint(a));
    }
    if(a.ctype=='variable'){
        console.log(prep+"VARIABLE: "+a.name);
    }
    if(a.ctype=='undefined'){
        console.log(prep+"UNDEF");
    }
    if(a.ctype=='void'){
        console.log(prep+"VOID");
    }
    if(a.ctype=='string'){
        console.log(prep+"STRING: "+a.value);
    }
    if(a.ctype=='shape'){
        console.log(prep+"SHAPE: "+a.type);
    }
    if(a.ctype=='modifier'){
        console.log(prep+"MODIF: "+a.key);
    }
    if(a.ctype=='list'){
        console.log(prep+"LIST ");
        var els=a.value;
        for(var j=0;j<els.length;j++) {
            console.log(prep+"EL"+ j);
            report(els[j],i+1);
        }
    }
    if(a.ctype=='function'){
        console.log(prep+"FUNCTION: "+a.oper);
        var els=a.args;
        for(var j=0;j<els.length;j++) {
            console.log(prep+"ARG"+ j);
            report(els[j],i+1);
        }
        els=a.modifs;
        for (var name in els) {
            console.log(prep+"MODIF:"+ name);
            report(els[name],i+1);
        }
    }
    if(a.ctype=='error'){
        console.log(prep+"ERROR: "+a.message);
    }
    
}


var generateInfix=function(oper, f1, f2){
    var erg={};
    erg.ctype='infix';
    erg.oper=oper;
    erg.args=[f1,f2];
    return erg;
}


var modifierOp = function(code, bestbinding, oper){
    var s = code.substring(0, bestbinding);
    var f1 = analyse(code.substring(bestbinding + oper.length),false);
    if(f1.ctype=='error') return f1;
    return {'ctype':'modifier','key':s,'value':f1};
}



var definitionDot = function(code, bestbinding, oper){
    if(isNumber(code)) {
        var erg={}
        erg.value={'real':parseFloat(code),'imag':0};
        erg.ctype='number';
        return erg;
    }
    var s1 = analyse(code.substring(0, bestbinding),false);
    var s2 = code.substring(bestbinding + oper.length);
    return {'ctype':'field','obj':s1,'key':s2};
}


var validDefinabaleFunction = function(f){//TODO Eventuell echte fehlermelungen zurückgeben
    if(f.ctype!='function'){
        return false;               //Invalid Function Name
    }
    for(var i=0; i<f.args.length;i++){
        if(f.args[i].ctype!='variable'){
            return false;               //Arg not a variable
        }
    }
    for(var i=0; i<f.args.length-1;i++){
        for(var j=i+1; j<f.args.length;j++){
            if(f.args[i].name==f.args[j].name){
                return false;       //Varname used twice
            }
            
        }
    }
    
    
    return true;
}

var definitionOp = function(code, bestbinding, oper){
    
    var s1 = code.substring(0, bestbinding);
    var f1 = analyse(s1,true);
    if(f1.ctype=='error') return f1;
    if(f1.cstring=='variable' || validDefinabaleFunction(f1)){
        
        var s2 = code.substring(bestbinding + oper.length);
        var f2 = analyse(s2,false);
        if(f2.ctype=='error') return f2;
        
        return generateInfix(oper, f1, f2);
        
    }
    return  new CError('Function not definable');
}




var infixOp=function(code, bestbinding, oper){
    var f1 = analyse(code.substring(0, bestbinding), false);
    var f2 = analyse(code.substring(bestbinding + oper.length), false);
    if(f1.ctype=='error') return f1;
    if(f2.ctype=='error') return f2;
    
    return generateInfix(oper, f1, f2);
    
}

var isPureNumber= function(code) {
    return code!="" && !isNaN(code);
}


var isNumber=function(code) {
    
    var a = code.indexOf('.');
    var b = code.lastIndexOf('.');
    if (a != b) return false;
    if (a == -1) {
        return isPureNumber(code);
    } else {
        return isPureNumber(code.substring(0, a)) || isPureNumber(code.substring(a + 1));
    }
}



var somethingelse= function(code){
    
    if(code=='') {
        return new Void();
    }
    if (code.charAt(0) == '"' && code.charAt(code.length - 1) == '"') {
        return {'ctype':'string','value':code.substring(1, code.length - 1)};
    }
    
    if (isPureNumber(code)) {
        return {'ctype':'number','value':{'real':parseInt(code),'imag':0}};
    }
    if (namespace.isVariable(code)){
        return namespace.vars[code];
    }
    if (namespace.isVariableName(code)){
        var variable=namespace.create(code);
        namespace.setvar(code,nada);
        //                        var variable={'ctype':'variable','value':nada,'name':code};
        //                        namespace.vars[code]=variable;
        return variable;
    }
    
    
    /*                        if (isVariable(expr)) {
     if (cat.isDebugEnabled()) cat.debug("Variable: " + expr);
     Assignments ass = getAssignments();
     if (ass != null) {
     FormulaValue elem = dispatcher.namespace.getVariable(expr);
     if (!elem.isNull()) {
     fout = (Formula) elem;
     }
     }
     } else if (isVariableName(expr)) {
     if (cat.isDebugEnabled()) cat.debug("Create Variable: " + expr);
     Variable f = new Variable(this);
     f.setCode(expr);
     Assignments ass = getAssignments();
     if (ass != null) dispatcher.namespace.putVariable(expr, f);
     fout = f;
     }*/
    //                      if (!fout.isNull()) return fout;
    return nada;
}


var isOpener= function(c){
    return c=='[' || c=='(' || c=='{' || c=='|';
}
var isCloser= function(c){
    return c==']' || c==')' || c=='}' || c=='|';
}
var isBracketPair= function(c){
    return c=='[]' || c=='()' || c=='{}' || c=='||';
}


var funct=function(code, firstbraind, defining){

    var args = [];
    var argsi = [];
    var argsf = [];
    var modifs = {};
    
    var oper = code.substring(0, firstbraind);
    
    var length = code.length;
    var bracount = 0;
    var start = firstbraind + 1;
    var literalmode = false;
    var absolute = false;
    for (var i = start; i < length; i++) {
        var c = code[i];
        if (c == '"') literalmode = !literalmode;
        if (!literalmode) {
            if (isOpener(c)  && (c != '|' || !absolute)) {
                bracount++;
                if (c == '|') absolute = true;
            } else if (isCloser(c) && (c != '|' || absolute)) {
                bracount--;
                if (c == '|') absolute = false;
            }
            if (c == ',' && bracount == 0 || bracount == -1) {
                var arg = code.substring(start, i);
                args[args.length]=arg;
                argsi[argsi.length]=start;

                if (args.length == 1 && bracount == -1 && !args[0].length) {//Um f() abzufangen
                   args=[];
                   argsi=[];
                 }
                start = i + 1;
            }
        }
    }

    for (var i = 0; i < args.length; i++) {
        var s = args[i];
        
        var f = analyse(s, false);
        if(f.ctype=='error') return f;
        if(f.ctype=='modifier'){
            modifs[f.key]=f.value;
            //                           modifs[modifs.length]=f;
        } else {
            argsf[argsf.length]=f;
        }
    }

    // Term t = (Term) generateFunction(oper, argsf, modifs, defining);
    // return t;
    var erg={};
    erg.ctype='function';
    erg.oper=oper;
    erg.args=argsf;
    erg.modifs=modifs;

    return erg;
    
}




var parseList=function(code) {
    var code1 = code;
    
    var args=[];        //das sind die argument exprs
    var argsi=[];       //das sind die startindize
    var argsf=[];       //das sind die formeln zu den exprs
    code1 = code1 + ',';
    var length = code1.length;
    var bracount = 0;
    var start = 0;
    var absolute = false;
    var literalmode = false;
    for (var i = start; i < length; i++) {
        var c;
        c = code1[i];
        if (c == '"') literalmode = !literalmode;
        if (!literalmode) {
            if (isOpener(c) && (c != '|' || !absolute)) {
                bracount++;
                if (c == '|') absolute = true;
            } else if (isCloser(c) && (c != '|' || absolute)) {
                bracount--;
                if (c == '|') absolute = false;
            }
            if (c == ',' && bracount == 0 || bracount == -1) {
                
                var arg = code1.substring(start, i);
                args[args.length]=arg;
                argsi[argsi.length]=start;
                start = i + 1;
                
            }
        }
    }
    for (var i = 0; i < args.length; i++) {
        var s = args[i];
        if (""==s) {
            argsf[argsf.length]='nil';
        } else {
            var f = analyse(s, false);
            if(f.ctype=='error') return f;
            
            argsf[argsf.length]=f;
        }
    }
    /*  var erg={};
     erg.ctype='list';
     erg.value=argsf;*/
    var erg={};
    erg.ctype='function';
    erg.oper='genList';
    erg.args=argsf;
    erg.modifs=[];
    return erg;
}



var bracket=function(code){
    //TODO: ABS
    /*      if (code.charAt(0) == '|') {
     Formula f1 = parseList(expr.substring(1, expr.length() - 1), csc);
     OpAbsArea f = new OpAbsArea(csc);
     ArrayList<Formula> args = new ArrayList<Formula>();
     args.add(f1);
     f.setArguments(args);
     return f;
     }*/
     
     if (code[0]=="|"){
        var f1= parseList(code.substring(1, code.length - 1));
        var type=f1.args.length;
        if(type==1){
          f1.oper="abs";
          return f1;
                
        }
        if(type==2){
          f1.oper="dist";
          return f1;
                
        }
        return nada; 
     
     }
    
    if (code=="()" || code=="[]") {
        var erg={};
        erg.ctype='list';
        erg.value=[];
        return erg;
    }
    
    if (code[0] == '[') {
        return parseList(code.substring(1, code.length - 1));
    }
    if (code[0] == '(') {
        var erg=parseList(code.substring(1, code.length - 1));
        if(erg.args.length>1){
            return erg;
        }
        
    }
    
    var erg = analyse(code.substring(1, code.length - 1), false);
    
    
    return erg;
    
}


var analyse=function(code,defining){
    var literalmode=false;
    var erg={};
    var bra='';
    var bestbinding=-1;
    var yourthetop=-1;
    var bestoper='';
    var bracount=0;
    var braexprcount=0;
    var firstbra = ' ';//erste Klammer
    var lastbra = ' ';//letzte Klammer
    var open1 = 0;
    var close1 = 0;
    var open2 = 0;
    var close2 = 0;
    var offset = 0;
    var absolute = false; //betragsklammer
    var length=code.length;
    
    for (var i = 0; i < length; i++) {
        var c;
        var c1 = ' ';
        var c2 = ' ';
        if (offset > 0) offset--;
        c = code[i];
        if (i + 1 < length) c1 = code[i + 1];//die werden fuer lange operatoren gebraucht
        if (i + 2 < length) c2 = code[i + 2];
        
        if (c == '\"') { //Anführungszeichen schalten alles aus
            literalmode = !literalmode;
        }
        if (!literalmode) {
            if (isOpener(c) && (c != '|' || !absolute)) { //Klammer geht auf
                if (c == '|') absolute = true;
                bra = bra + c;
                bracount++;
                if (bracount == 1) {
                    braexprcount++;
                    if (braexprcount == 1) open1 = i;
                    if (braexprcount == 2) open2 = i;
                }
                if (firstbra == ' ') firstbra = c;
            } else if (isCloser(c) && (c != '|' || absolute)) { //Schließende Klammer
                if (c == '|') absolute = false;
                if (bracount == 0) {
                    return new CError('close without open');
                }
                var pair = bra[bra.length - 1] + c;
                if (isBracketPair(pair)) { //Passt die schliesende Klammer?
                    bracount--;
                    bra = bra.substring(0, bra.length - 1);
                    if (braexprcount == 1) close1 = i;
                    if (braexprcount == 2) close2 = i;
                    lastbra = c;
                } else {
                    return new CError('unmatched brackets');
                }
            }
            if (bra.length == 0) {//Wir sind auf oberster Stufe
                var prior = -1;
                var oper = "";
                if ((typeof operators[c + c1 + c2] !='undefined') && offset == 0) {
                    oper = c + c1 + c2;
                    offset = 3;
                } else if ((typeof operators[c + c1 ] !='undefined') && offset == 0) {
                    oper = "" + c + c1;
                    offset = 2;
                } else if ((typeof operators[c] !='undefined') && offset == 0) {
                    oper = "" + c;
                    offset = 1;
                }
                if (oper!='') {
                    prior = operators[oper];
                }
                
                if (prior >= yourthetop) {//Der bindet bisher am stärksten
                    yourthetop = prior;
                    bestbinding = i;
                    bestoper = oper;
                    if (prior >= 0) i += oper.length - 1;
                }
            }
        }
    }
    
    
    
    
    if (bracount != 0) {
        return new CError('open without close');
        
    }
    
    //Und jetzt wird der Baum aufgebaut.
    
    var firstbraind = code.indexOf(firstbra);
    var lastbraind = code.lastIndexOf(lastbra);
    
    if (bracount == 0 && yourthetop > -1) { //infix Operator gefunden
        //   if (bestoper.equals("->")) //Specialbehandlung von modyfiern
        //   return modifierOp(expr, bestbinding, bestoper);
        //   else if (bestoper.equals(":=")) //Specialbehandlung von definitionen
        //   return definitionOp(expr, bestbinding, bestoper);
        //   else if (bestoper.equals(".")) //Specialbehandlung von Feldzugriff
        //   return definitionDot(expr, bestbinding, bestoper);
        //   else return infixOp(expr, bestbinding, bestoper);
        if (bestoper=='->') //Specialbehandlung von modifyern
            return modifierOp(code, bestbinding, bestoper);
        if (bestoper=='.') //Specialbehandlung von Feldzugriff
            return definitionDot(code, bestbinding, bestoper);
        if (bestoper==':=') //Specialbehandlung von definitionen
            return definitionOp(code, bestbinding, bestoper);
        return infixOp(code, bestbinding, bestoper)
    } else if (bracount == 0 && braexprcount == 1 && lastbraind == code.length - 1) {//Klammer oder Funktion
        
        if (firstbraind == 0) {//Einfach eine Klammer (evtl Vector))
            return bracket(code, this);
        } else {
            return funct(code, firstbraind, defining);
        }
    } else {
        return somethingelse(code);//Zahlen, Atomics, Variablen, oder nicht parsebar
    }
    
    
}



var defaultAppearance={};
defaultAppearance.clip="none";
defaultAppearance.pointColor=[1,0,0];
defaultAppearance.lineColor=[0,0,1];
defaultAppearance.pointSize=5;
defaultAppearance.lineSize=2;
defaultAppearance.alpha=1;
defaultAppearance.overhangLine=1.1;
defaultAppearance.overhangSeg=1;
defaultAppearance.dimDependent=1;



function csinit(gslp){

    //Main Data:
    //args          The arguments of the operator
    //type          The operator
    //kind          L,P,C, wird automatisch zugeordnet

    //Relevant fields for appearance:
    //color
    //size
    //alpha
    //overhang
    //clip
    //visible       zum ein und ausblenden
    //isshowing     das wird durch den Konstruktionsbaum vererbt
    //ismovable     



    // Setzen der Default appearance

    function pointDefault(el){
        
        el.size=CSNumber.real(el.size || defaultAppearance.pointSize);
        if(el.type!="Free"){
            el.color=List.realVector(el.color || defaultAppearance.pointColor);
            el.color=List.scalmult(CSNumber.real(defaultAppearance.dimDependent),el.color);
        } else {
            el.color=List.realVector(el.color || defaultAppearance.pointColor);
        }
        el.alpha=CSNumber.real(el.alpha || defaultAppearance.alpha);
    }
    
    function lineDefault(el){
        el.size=CSNumber.real(el.size || defaultAppearance.lineSize);
        el.color=List.realVector(el.color || defaultAppearance.lineColor);
        el.alpha=CSNumber.real(el.alpha || defaultAppearance.alpha);
        el.clip=General.string(el.clip || defaultAppearance.clip);
        el.overhang=CSNumber.real(el.overhang || defaultAppearance.overhangLine);
    }
    
    function segmentDefault(el){
        lineDefault(el);
        el.clip=General.string("end");
        el.overhang=CSNumber.real(el.overhang || defaultAppearance.overhangSeg);

    }

    csgeo.gslp=gslp;    
          
    csgeo.csnames={}; //Lookup für elemente mit über Namen
    
    
    
    
    // Das ist für alle gleich
    for( var k=0; k<csgeo.gslp.length; k++ ) {
        csgeo.csnames[csgeo.gslp[k].name]=csgeo.gslp[k];
        csgeo.gslp[k].kind=geoOpMap[csgeo.gslp[k].type];
        csgeo.gslp[k].incidences=[];
        csgeo.gslp[k].isshowing=true;
        csgeo.gslp[k].movable=false;
        csgeo.gslp[k].inited=false;
    };
    
    csgeo.points=[];
    csgeo.lines=[];
    csgeo.conics=[];
    csgeo.free=[];
    csgeo.ctp=0;
    csgeo.ctf=0;
    csgeo.ctl=0;
    csgeo.ctc=0;
    var m=csport.drawingstate.matrix;
    
    for( var k=0; k<csgeo.gslp.length; k++ ) {
        if(csgeo.gslp[k].kind=="P"){
            var p=csgeo.gslp[k];
            csgeo.points[csgeo.ctp]=p;
            pointDefault(p );
            csgeo.ctp+=1;
        }
        if(csgeo.gslp[k].kind=="L"){
            var l=csgeo.gslp[k];
            csgeo.lines[csgeo.ctl]=l;
            lineDefault(l)
            csgeo.ctl+=1;
        }
        if(csgeo.gslp[k].kind=="C"){
            var l=csgeo.gslp[k];
            csgeo.conics[csgeo.ctc]=l;
            lineDefault(l)
            csgeo.ctc+=1;
        }
        if(csgeo.gslp[k].kind=="S"){
            var l=csgeo.gslp[k];
            csgeo.lines[csgeo.ctl]=l;
            segmentDefault(l)
            csgeo.ctl+=1;
        }
        
        var ty=csgeo.gslp[k].type;
        if(ty=="Free" 
        || ty=="PointOnLine" 
        || ty=="PointOnCircle" 
        || ty=="PointOnSegment"){//TODO generisch nach geoops ziehen
            var f=csgeo.gslp[k];
            if(f.pos) {
               if(f.pos.length==2){
                  f.sx=f.pos[0];
                  f.sy=f.pos[1];
                  f.sz=1;
               }
               if(f.pos.length==3){
                  f.sx=f.pos[0];
                  f.sy=f.pos[1];
                  f.sz=f.pos[2];
               }
            
            }
            f.homog=List.realVector([gslp[k].sx,gslp[k].sy,gslp[k].sz]);
            f.isfinite=(f.sz!=0);
            f.ismovable=true;
            if(ty=="PointOnCircle"){
                f.angle=CSNumber.real(f.angle);
                
            }   
            csgeo.free[csgeo.ctf]=f;
            csgeo.ctf+=1;
        } 
        if(ty=="CircleMr" || ty=="CircleMFixedr"){
            var f=csgeo.gslp[k];
            f.radius=CSNumber.real(f.radius);
            csgeo.free[csgeo.ctf]=f;
            csgeo.ctf+=1;
        } 
        if(ty=="Through"){
            var f=csgeo.gslp[k];
            f.dir=General.wrap(f.dir);
            csgeo.free[csgeo.ctf]=f;
            csgeo.ctf+=1;
        } 

       
    };
    guessIncidences();
};

function onSegment(p,s){//TODO was ist mit Fernpunkten
                        // TODO das ist eine sehr teure implementiereung
                        // Geht das einfacher?
    var el1=csgeo.csnames[s.args[0]].homog;
    var el2=csgeo.csnames[s.args[1]].homog;
    var elm=p.homog;

    var x1=CSNumber.div(el1.value[0],el1.value[2]);
    var y1=CSNumber.div(el1.value[1],el1.value[2]);
    var x2=CSNumber.div(el2.value[0],el2.value[2]);
    var y2=CSNumber.div(el2.value[1],el2.value[2]);
    var xm=CSNumber.div(elm.value[0],elm.value[2]);
    var ym=CSNumber.div(elm.value[1],elm.value[2]);

    if(CSNumber._helper.isAlmostReal(x1)&&
       CSNumber._helper.isAlmostReal(y1)&&
       CSNumber._helper.isAlmostReal(x2)&&
       CSNumber._helper.isAlmostReal(y2)&&
       CSNumber._helper.isAlmostReal(xm)&&
       CSNumber._helper.isAlmostReal(ym)){
            x1=x1.value.real;
            y1=y1.value.real;
            x2=x2.value.real;
            y2=y2.value.real;
            xm=xm.value.real;
            ym=ym.value.real;
            var d12=Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
            var d1m=Math.sqrt((x1-xm)*(x1-xm)+(y1-ym)*(y1-ym));
            var d2m=Math.sqrt((x2-xm)*(x2-xm)+(y2-ym)*(y2-ym));
            var dd=d12-d1m-d2m;
            return dd*dd<0.000000000000001;
       
       }
    return false;

}

function isShowing(el,op){
    el.isshowing=true;
    if(el.args){
        for(var i=0;i<el.args.length;i++){
            if(!csgeo.csnames[el.args[i]].isshowing){
                el.isshowing=false;
                return;
            }
        }
    }
/*    if (el.kind=="P" ||el.kind=="L"){
    
        if(!List.helper.isAlmostReal(el.homog)){
            el.isshowing=false;
            return;
        }
    }*/
    
    if(op.visiblecheck){
        op.visiblecheck(el);
    }

}

function recalc(){

    csport.reset();
    var gslp=csgeo.gslp;
    for( var k=0; k<gslp.length; k++ ) {
        var el=gslp[k];
        var op= geoOps[el.type];       
        op(el);
        isShowing(el,op);
                     
    }
};


function guessIncidences(){

    var gslp=csgeo.gslp;
    recalc();
    for( var i=0; i<csgeo.lines.length; i++ ) {
        var l=csgeo.lines[i];
        for( var j=0; j<csgeo.points.length; j++ ) {
            var  p=csgeo.points[j];
            var pn=List.scaldiv(List.abs(p.homog),p.homog);
            var ln=List.scaldiv(List.abs(l.homog),l.homog);
            var prod=CSNumber.abs(List.scalproduct(pn,ln));
            if(prod.value.real<0.0000000000001){
                p.incidences.push(l.name);
                l.incidences.push(p.name);
            
            }

        }
    }


}


function render(){

    var drawgeopoint= function(el){
        if(!el.isshowing||!List._helper.isAlmostReal(el.homog))
            return;
        var col=    el.color;
        if(el.behavior) {
            col=    el.color;//TODO Anpassen
           // col=List.realVector([0,0,1]);
        }    
        evaluator.draw([el.homog],{size:el.size,color:col,alpha:el.alpha});
        
    }


    var drawgeoconic= function(el){
        if(!el.isshowing)
            return;
        var cc=el.matrix;
        var cxr = cc.value[2].value[0].value.real 
        var axr = cc.value[0].value[0].value.real;
        var cyr = cc.value[2].value[1].value.real 
        var byr = cc.value[1].value[1].value.real;
        var czr = cc.value[2].value[2].value.real;
        var x = -cxr / axr;
        var y = -cyr / byr;
        var r2 = (axr * (x * x + y * y) + 2 * cxr * x + 2 * cyr * y + czr) / axr;
        var rad = Math.sqrt(r2 > 0 ? r2 : -r2);
        var imaginary = r2 > 0;
        evaluator.drawcircle([List.realVector([x,y]),CSNumber.real(rad)],
                           {size:el.size,color:el.color,alpha:el.alpha});

        /*
        
        double x = -cc.cxr / cc.axr;
        double y = -cc.cyr / cc.byr;
        double r2 = (cc.axr * (x * x + y * y) + 2 * cc.cxr * x + 2 * cc.cyr * y + cc.czr) / cc.axr;
        rad = Math.sqrt(r2 > 0 ? r2 : -r2);
        imaginary = r2 > 0;
        radp.setLocation(rad, 0);
        rad *= ((EuclideanCoordinateTransformation) viewport.trans).scale;
        mid.assign(x, y, 1);
        (viewport).toPoint(mid, midp);
        
        */
        
    }
    
    var drawgeoline= function(el){
        if(!el.isshowing || !List._helper.isAlmostReal(el.homog) )
            return;

        if(el.clip.value=="none"){
            evaluator.draw([el.homog],{size:el.size,color:el.color,alpha:el.alpha});
        }
        if(el.clip.value=="end"){
            var pt1=csgeo.csnames[el.args[0]];
            var pt2=csgeo.csnames[el.args[1]];
            evaluator.draw([pt1.homog,pt2.homog],
                           {size:el.size,color:el.color,alpha:el.alpha});
        }
        if(el.clip.value=="inci"){
            var li=[];
            var xmin=[+1000000,0];
            var xmax=[-1000000,0];
            var ymin=[+1000000,0];
            var ymax=[-1000000,0];
            for(var i=0;i<el.incidences.length;i++){
                var pt=csgeo.csnames[el.incidences[i]].homog;
                var x=pt.value[0];
                var y=pt.value[1];
                var z=pt.value[2];

                if(!CSNumber._helper.isAlmostZero(z)){
                    x=CSNumber.div(x,z);
                    y=CSNumber.div(y,z);
                    if(CSNumber._helper.isAlmostReal(x)&&CSNumber._helper.isAlmostReal(y)){
                        if(x.value.real<xmin[0]){
                            xmin=[x.value.real,pt];
                        }
                        if(x.value.real>xmax[0]){
                            xmax=[x.value.real,pt];
                        }
                        if(y.value.real<ymin[0]){
                            ymin=[y.value.real,pt];
                        }
                        if(y.value.real>ymax[0]){
                            ymax=[y.value.real,pt];
                        }
                    }
                }
            }
            var pt1, pt2;
            if((xmax[0]-xmin[0])>(ymax[0]-ymin[0])) {
                pt1=xmin[1];
                pt2=xmax[1];
            } else {
                pt1=ymin[1];
                pt2=ymax[1];
           
            }
            if(pt1!=pt2){
                evaluator.draw([pt1,pt2],
                {size:el.size,color:el.color,alpha:el.alpha,overhang:el.overhang});
            } else {
                evaluator.draw([el.homog],{size:el.size,color:el.color,alpha:el.alpha});

            
            }
        }
        

    }
    for( var i=0; i<csgeo.conics.length; i++ ) {
        drawgeoconic(csgeo.conics[i]);
    }
    
    
    for( var i=0; i<csgeo.lines.length; i++ ) {
        drawgeoline(csgeo.lines[i]);
    }
    
    
    for( var i=0; i<csgeo.points.length; i++ ) {
        drawgeopoint(csgeo.points[i]);
    }

     
};





geoOps={};
geoOps._helper={};

var geoOpMap={};


geoOps.Join =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
}
geoOpMap.Join="L";


geoOps.Segment =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
}
geoOpMap.Segment="S";



geoOps.Meet =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    el.homog=List.cross(el1.homog,el2.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";  
}

geoOps.Meet.visiblecheck=function(el){
    var visible=true;  
    var el1=csgeo.csnames[(el.args[0])];
    var el2=csgeo.csnames[(el.args[1])];
    
    if(el1.type=="Segment") {
        visible=onSegment(el,el1)
    } 
    if(visible && el1.type=="Segment") {
        visible=onSegment(el,el2)
    }
    el.isshowing=visible;
}

geoOpMap.Meet="P";



geoOps.Mid =function(el){
    var x=csgeo.csnames[(el.args[0])].homog;
    var y=csgeo.csnames[(el.args[1])].homog;
    
    var line=List.cross(x, y);
    var infp=List.cross(line, List.linfty);
    var ix= List.det3(x, infp, line);
    var iy= List.det3(y, infp, line);
    var z1=List.scalmult(iy,x);
    var z2=List.scalmult(ix,y);
    el.homog=List.add(z1,z2);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";      
}
geoOpMap.Mid="P";


geoOps.Perp =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var inf=List.linfty;
    var tt=List.cross(inf,l);
    tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
    el.homog=List.cross(tt,p);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";
}
geoOpMap.Perp="L";


geoOps.Para =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    var inf=List.linfty;
    el.homog=List.cross(List.cross(inf,l),p);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";
}
geoOpMap.Para="L";

geoOps.Horizontal =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    el.homog=List.cross(List.ex,el1.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
}
geoOpMap.Horizontal="L";

geoOps.Vertical =function(el){
    var el1=csgeo.csnames[(el.args[0])];
    el.homog=List.cross(List.ey,el1.homog);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
}
geoOpMap.Vertical="L";


geoOps.Through =function(el){
    var el1=List.normalizeZ(csgeo.csnames[(el.args[0])].homog);
    
    if(move && move.mover==el){
        var xx=el1.value[0].value.real-mouse.x+move.offset.x;
        var yy=el1.value[1].value.real-mouse.y+move.offset.y;
        el.dir=List.realVector([xx,yy,0]);
    }

    el.homog=List.cross(el.dir,el1);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Line";  
}
geoOpMap.Through="L";


geoOps.Free =function(el){
    
}
geoOpMap.Free="P";

geoOps.PointOnLine =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var p=el.homog;
    var inf=List.linfty;
    var tt=List.cross(inf,l);
    tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
    var perp=List.cross(tt,p);
    el.homog=List.cross(perp,l);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
}
geoOpMap.PointOnLine="P";



geoOps.PointOnCircle =function(el){//TODO was ist hier zu tun damit das stabil bei tracen bleibt

    var c=csgeo.csnames[(el.args[0])];
    var pts=geoOps._helper.IntersectLC(List.linfty,c.matrix);
    var ln1=General.mult(c.matrix,pts[0]);
    var ln2=General.mult(c.matrix,pts[1]);
    var mid=List.normalizeZ(List.cross(ln1,ln2));
 
    if(move && move.mover==el){
        var xx=mid.value[0].value.real-mouse.x-move.offset.x;
        var yy=mid.value[1].value.real-mouse.y-move.offset.y;
        el.angle=CSNumber.real(Math.atan2(-yy,-xx));
 
    }
    
    var angle=el.angle;

    var pt=List.turnIntoCSList([CSNumber.cos(angle),CSNumber.sin(angle),CSNumber.real(0)]);
    pt=List.scalmult(CSNumber.real(10),pt);
    pt=List.add(mid,pt);

    ln=List.cross(pt,mid);
    var ints=geoOps._helper.IntersectLC(ln,c.matrix);//TODO richtiges Tracing einbauen!!!
    var int1=List.normalizeZ(ints[0]);
    var int2=List.normalizeZ(ints[1]);
    var d1=List.abs2(List.sub(pt,int1));
    var d2=List.abs2(List.sub(pt,int2));
   
    var erg=ints[0];
    if(d1.value.real>d2.value.real){erg=ints[1];}


    el.homog=erg;
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";

    
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
}
geoOpMap.PointOnCircle="P";



geoOps.PointOnSegment =function(el){//TODO was ist hier zu tun damit das stabil bei tracen bleibt
    
    var l=csgeo.csnames[(el.args[0])].homog;
    var el1=csgeo.csnames[csgeo.csnames[(el.args[0])].args[0]].homog;
    var el2=csgeo.csnames[csgeo.csnames[(el.args[0])].args[1]].homog;
    var elm=el.homog;
    
    var xx1=CSNumber.div(el1.value[0],el1.value[2]);
    var yy1=CSNumber.div(el1.value[1],el1.value[2]);
    var xx2=CSNumber.div(el2.value[0],el2.value[2]);
    var yy2=CSNumber.div(el2.value[1],el2.value[2]);
    var xxm=CSNumber.div(elm.value[0],elm.value[2]);
    var yym=CSNumber.div(elm.value[1],elm.value[2]);
    if(!move || move.mover==el){
        
        var p=el.homog;
        var inf=List.linfty;
        var tt=List.cross(inf,l);
        tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
        var perp=List.cross(tt,p);
        el.homog=List.cross(perp,l);
        el.homog=List.normalizeMax(el.homog);
        el.homog.usage="Point";
        
        
        
        
        var x1=xx1.value.real;
        var y1=yy1.value.real;
        var x2=xx2.value.real;
        var y2=yy2.value.real;
        var xm=xxm.value.real;
        var ym=yym.value.real;
        var d12=Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
        var d1m=Math.sqrt((x1-xm)*(x1-xm)+(y1-ym)*(y1-ym));
        var d2m=Math.sqrt((x2-xm)*(x2-xm)+(y2-ym)*(y2-ym));
        var dd=d12-d1m-d2m;
        var par=d1m/d12;
        if (d1m>d12) par=1;
        if (d2m>d12) par=0;
        el.param=CSNumber.real(par);
        
    }
    
    par=el.param;
    
    var diffx=CSNumber.sub(xx2,xx1);
    var ergx=CSNumber.add(xx1,CSNumber.mult(el.param,diffx));
    var diffy=CSNumber.sub(yy2,yy1);
    var ergy=CSNumber.add(yy1,CSNumber.mult(el.param,diffy));
    var ergz=CSNumber.real(1);
    el.homog=List.turnIntoCSList([ergx,ergy,ergz]);
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";

    
    //TODO: Handle complex and infinite Points
    var x=CSNumber.div(el.homog.value[0],el.homog.value[2]);
    var y=CSNumber.div(el.homog.value[1],el.homog.value[2]);
    
    el.sx=x.value.real;
    el.sy=y.value.real;
    el.sz=1;
}
geoOpMap.PointOnSegment="P";



geoOps._helper.CenterOfConic =function(c){
        var pts=geoOps._helper.IntersectLC(List.linfty,c);
        var ln1=General.mult(c,pts[0]);
        var ln2=General.mult(c,pts[1]);

        var erg=List.cross(ln1,ln2);

        return erg;
}

geoOps.CenterOfConic =function(el){
    var c=csgeo.csnames[(el.args[0])].matrix;
    var erg=geoOps._helper.CenterOfConic(c);
    el.homog=erg;
    el.homog=List.normalizeMax(el.homog);
    el.homog.usage="Point";


}
geoOpMap.CenterOfConic="P";

geoOps._helper.CircleMP=function(m,p){
    var l1=List.crossOperator(m);
    var l2=List.transpose(l1);
    
    
    var tang=General.mult(l2,General.mult(List.fundDual,l1));
    var mu=General.mult(General.mult(p,tang),p);
    var la=General.mult(General.mult(p,List.fund),p);
    var m1=General.mult(mu,List.fund);
    var m2=General.mult(la,tang);
    var erg=List.sub(m1,m2);
    return erg;
}

geoOps.CircleMP =function(el){//TODO Performance Checken. Das ist jetzt der volle CK-ansatz
                                //Weniger Allgemein geht das viiiiel schneller
    var m=csgeo.csnames[(el.args[0])].homog;
    var p=csgeo.csnames[(el.args[1])].homog;
    el.matrix=geoOps._helper.CircleMP(m,p);
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Circle";
    
}
geoOpMap.CircleMP="C";


geoOps.CircleMr =function(el){
    var m=csgeo.csnames[(el.args[0])].homog;
    var mid=List.scaldiv(m.value[2],m);


    if(move && move.mover==el){
        var xx=mid.value[0].value.real-mouse.x;
        var yy=mid.value[1].value.real-mouse.y;
        rad=Math.sqrt(xx*xx+yy*yy);//+move.offsetrad;
        el.radius=CSNumber.real(rad+move.offsetrad);
    }
    var r=el.radius;
    var p=List.turnIntoCSList([r,CSNumber.real(0),CSNumber.real(0)]);
    p=List.add(p,mid);
    
    el.matrix=geoOps._helper.CircleMP(mid,p);
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Circle";
    
}
geoOpMap.CircleMr="C";



geoOps.CircleMFixedr =function(el){
    var m=csgeo.csnames[(el.args[0])].homog;
    var mid=List.scaldiv(m.value[2],m);

    var r=el.radius;
    var p=List.turnIntoCSList([r,CSNumber.real(0),CSNumber.real(0)]);
    p=List.add(p,mid);
    
    el.matrix=geoOps._helper.CircleMP(mid,p);
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Circle";
    
}
geoOpMap.CircleMFixedr="C";



geoOps._helper.ConicBy5 =function(el,a,b,c,d,p){

    var v23=List.turnIntoCSList([List.cross(b, c)]);
    var v14=List.turnIntoCSList([List.cross(a, d)]);
    var v12=List.turnIntoCSList([List.cross(a, b)]);
    var v34=List.turnIntoCSList([List.cross(c, d)]);
    var deg1=General.mult(List.transpose(v14),v23);

    var deg2=General.mult(List.transpose(v34),v12);
    deg1=List.add(deg1,List.transpose(deg1));
    deg2=List.add(deg2,List.transpose(deg2));
    var mu=General.mult(General.mult(p,deg1),p);
    var la=General.mult(General.mult(p,deg2),p);
    var m1=General.mult(mu,deg2);
    var m2=General.mult(la,deg1);

    var erg=List.sub(m1,m2);
    return erg;
}


geoOps.ConicBy5 =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=csgeo.csnames[(el.args[2])].homog;
    var d=csgeo.csnames[(el.args[3])].homog;
    var p=csgeo.csnames[(el.args[4])].homog;
    var erg=geoOps._helper.ConicBy5(el,a,b,c,d,p);
    el.matrix=erg;
    el.matrix=List.normalizeMax(el.matrix);
    el.matrix.usage="Conic";
}
geoOpMap.ConicBy5="C";

geoOps.CircleBy3 =function(el){
    var a=csgeo.csnames[(el.args[0])].homog;
    var b=csgeo.csnames[(el.args[1])].homog;
    var c=List.ii;
    var d=List.jj;
    var p=csgeo.csnames[(el.args[2])].homog;
    var erg=geoOps._helper.ConicBy5(el,a,b,c,d,p);
    el.matrix=List.normalizeMax(erg);
    el.matrix.usage="Circle";

}
geoOpMap.CircleBy3="C";


geoOps._helper.tracing2=function(n1,n2,c1,c2,el){//Billigtracing
    var OK=0;
    var DECREASE_STEP=1;
    var INVALID=2;
    var tooClose=OK;
    var security = 3;
    var security = 3;

    var do1n1=List.projectiveDistMinScal(c1,n1);
    var do1n2=List.projectiveDistMinScal(c1,n2);
    var do2n1=List.projectiveDistMinScal(c2,n1);
    var do2n2=List.projectiveDistMinScal(c2,n2);

    
    if((do1n1 + do2n2)<(do1n2 + do2n1)){
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
    } else {
        el.results=List.turnIntoCSList([n2,n1]);//Das ist "sort Output"

    }
    
}

geoOps._helper.tracing2X=function(n1,n2,c1,c2,el){
    var OK=0;
    var DECREASE_STEP=1;
    var INVALID=2;
    var tooClose=OK;
    var security = 3;

    var do1n1=List.projectiveDistMinScal(c1,n1);
    var do1n2=List.projectiveDistMinScal(c1,n2);
    var do2n1=List.projectiveDistMinScal(c2,n1);
    var do2n2=List.projectiveDistMinScal(c2,n2);
    var do1o2=List.projectiveDistMinScal(c1,c2);
    var dn1n2=List.projectiveDistMinScal(n1,n2);

    //Das Kommt jetzt eins zu eins aus Cindy
    
    var care = (do1o2 > .000001);
    
    // First we try to assign the points
    
    if (do1o2 / security > do1n1 + do2n2 && dn1n2 / security > do1n1 + do2n2) {
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
        return OK + tooClose;
    }
    
    if (do1o2 / security > do1n2 + do2n1 && dn1n2 / security > do1n2 + do2n1) {
        el.results=List.turnIntoCSList([n2,n1]);//Das ist "sort Output"
        return OK + tooClose;
    }
    
    //  Maybe they are too close?
    
    if (dn1n2 < 0.00001) {
        // They are. Do we care?
        if (care) {
            tooClose = INVALID;
            el.results=List.turnIntoCSList([n1,n2]);
            return OK + tooClose;
        } else {
            el.results=List.turnIntoCSList([n1,n2]);
            return OK + tooClose;
        }
    }
    
    // They are far apart. We care now.
    if (!care || tooClose == INVALID) {
        el.results=List.turnIntoCSList([n1,n2]);//Das ist "sort Output"
        return OK + tooClose;
    }
    return DECREASE_STEP + tooClose;        
    
}

geoOps._helper.IntersectLC=function(l,c){

    var N=CSNumber;
    var l1=List.crossOperator(l);
    var l2=List.transpose(l1);
    var s=General.mult(l2,General.mult(c,l1));

    var ax=s.value[0].value[0];
    var ay=s.value[0].value[1];
    var az=s.value[0].value[2];
    var bx=s.value[1].value[0];
    var by=s.value[1].value[1];
    var bz=s.value[1].value[2];
    var cx=s.value[2].value[0];
    var cy=s.value[2].value[1];
    var cz=s.value[2].value[2];

    var xx=l.value[0];
    var yy=l.value[1];
    var zz=l.value[2];
    

    var absx=N.abs(xx).value.real;
    var absy=N.abs(yy).value.real;
    var absz=N.abs(zz).value.real;

    var alp;
    if(absz>=absx && absz>=absy){
        alp=N.div(N.sqrt(N.sub(N.mult(ay,bx),N.mult(ax,by))),zz);
    } 
    if(absx>=absy && absx>=absz){

        alp=N.div(N.sqrt(N.sub(N.mult(bz,cy),N.mult(by,cz))),xx);
    } 
    if(absy>=absx && absy>=absz){
        alp=N.div(N.sqrt(N.sub(N.mult(cx,az),N.mult(cz,ax))),yy);
    } 
    var erg=List.add(s,List.scalmult(alp,l1));
    var erg1=erg.value[0];
    erg1=List.normalizeMax(erg1);
    erg1.usage="Point";      
    erg=List.transpose(erg);
    var erg2=erg.value[0];
    erg2=List.normalizeMax(erg2);
    erg2.usage="Point";  
    return[erg1,erg2];

}

geoOps.IntersectLC =function(el){
    var l=csgeo.csnames[(el.args[0])].homog;
    var c=csgeo.csnames[(el.args[1])].matrix;
    
    var erg=geoOps._helper.IntersectLC(l,c);
    var erg1=erg[0];
    var erg2=erg[1];
                           
    if(!el.inited){
        el.check1=erg1;
        el.check2=erg2;
        el.inited=true;
        el.results=List.turnIntoCSList([erg1,erg2]);
        
    } else {
        var action=geoOps._helper.tracing2(erg1,erg2,el.check1,el.check2,el);
        if(!List._helper.isNaN(el.results.value[0]) &&!List._helper.isNaN(el.results.value[1])){
            el.check1=el.results.value[0];
            el.check2=el.results.value[1];
        }
    }
}
geoOpMap.IntersectLC="T";

geoOps.IntersectCirCir =function(el){
    var c1=csgeo.csnames[(el.args[0])].matrix;
    var c2=csgeo.csnames[(el.args[1])].matrix;

    var ct1 =c2.value[0].value[0];
    var line1=List.scalmult(ct1,c1.value[2]);
    var ct2 =c1.value[0].value[0];
    var line2=List.scalmult(ct2,c2.value[2]);
    var ll=List.sub(line1,line2);
    ll.value[2]=CSNumber.mult(CSNumber.real(0.5),ll.value[2]);
    ll=List.normalizeMax(ll);

    
    
    var erg=geoOps._helper.IntersectLC(ll,c1);
    var erg1=erg[0];
    var erg2=erg[1];
                           
    if(!el.inited){
        el.check1=erg1;
        el.check2=erg2;
        el.inited=true;
        el.results=List.turnIntoCSList([erg1,erg2]);
        
    } else {
        var action=geoOps._helper.tracing2(erg1,erg2,el.check1,el.check2,el);
        el.check1=el.results.value[0];
        el.check2=el.results.value[1];
    }

}
geoOpMap.IntersectCirCir="T";


geoOps.SelectP =function(el){
    var set=csgeo.csnames[(el.args[0])];
    if(!el.inited){
        el.inited=true;
    }
    el.homog=set.results.value[el.index-1];
}
geoOpMap.SelectP="P";

var geoscripts={};

var csgstorage={};

var csport={};
csport.drawingstate={};
csport.drawingstate.linecolor="rgb(0,0,255)";
csport.drawingstate.linecolorraw=[0,0,1];
csport.drawingstate.pointcolor="rgb(255,200,0)";
csport.drawingstate.pointcolorraw=[1,0.78,0];
csport.drawingstate.textcolor="rgb(0,0,0)";
csport.drawingstate.textcolorraw=[0,0,0];
csport.drawingstate.alpha=1.0;
csport.drawingstate.pointsize=4.0;
csport.drawingstate.linesize=1.0;
csport.drawingstate.textsize=20;

csport.drawingstate.matrix={};
csport.drawingstate.matrix.a=25;
csport.drawingstate.matrix.b=0;
csport.drawingstate.matrix.c=0;
csport.drawingstate.matrix.d=25;
csport.drawingstate.matrix.tx=250;
csport.drawingstate.matrix.ty=250;
csport.drawingstate.matrix.det= csport.drawingstate.matrix.a*csport.drawingstate.matrix.d
-csport.drawingstate.matrix.b*csport.drawingstate.matrix.c;

    csport.drawingstate.matrix.sdet=Math.sqrt(csport.drawingstate.matrix.det);


    csport.drawingstate.initialmatrix={};
    csport.drawingstate.initialmatrix.a=csport.drawingstate.matrix.a;
    csport.drawingstate.initialmatrix.b=csport.drawingstate.matrix.b;
    csport.drawingstate.initialmatrix.c=csport.drawingstate.matrix.c;
    csport.drawingstate.initialmatrix.d=csport.drawingstate.matrix.d;
    csport.drawingstate.initialmatrix.tx=csport.drawingstate.matrix.tx;
    csport.drawingstate.initialmatrix.ty=csport.drawingstate.matrix.ty;
    csport.drawingstate.initialmatrix.det=csport.drawingstate.matrix.det;
    csport.drawingstate.initialmatrix.sdet=csport.drawingstate.matrix.sdet;

    csport.clone=function (obj){
        if(obj == null || typeof(obj) != 'object')
            return obj;
        
        var temp = obj.constructor(); // changed
        
        for(var key in obj)
            temp[key] = csport.clone(obj[key]);
        return temp;
    }

    csgstorage.backup=csport.clone(csport.drawingstate);
    csgstorage.stack=[];


    var back= csport.clone(csport.drawingstate);


    csport.reset=function(){
        
        
        csport.drawingstate.matrix.a=csport.drawingstate.initialmatrix.a;
        csport.drawingstate.matrix.b=csport.drawingstate.initialmatrix.b;
        csport.drawingstate.matrix.c=csport.drawingstate.initialmatrix.c;
        csport.drawingstate.matrix.d=csport.drawingstate.initialmatrix.d;
        csport.drawingstate.matrix.tx=csport.drawingstate.initialmatrix.tx;
        csport.drawingstate.matrix.ty=csport.drawingstate.initialmatrix.ty;
        csport.drawingstate.matrix.det=csport.drawingstate.initialmatrix.det;
        csport.drawingstate.matrix.sdet=csport.drawingstate.initialmatrix.sdet;
    }

    csport.from=function(x,y,z){//Rechnet Homogene Koordinaten in Pixelkoordinaten um
        var xx=x/z;
        var yy=y/z;
        var m=csport.drawingstate.matrix;
        var xxx=xx*m.a-yy*m.b+m.tx;
        var yyy=xx*m.c-yy*m.d-m.ty;
        return [xxx,yyy];
    }

    csport.to=function(px,py){//Rechnet Pixelkoordinaten in Homogene Koordinaten um
            var m=csport.drawingstate.matrix;
            var xx = px-m.tx;
            var yy = py+m.ty;
            var x=(xx*m.d-yy*m.b)/m.det;
            var y=-(-xx*m.c+yy*m.a)/m.det;
            return [x,y,1];
    };

    csport.dumpTrafo=function(){
        
        var r=function(x){
            return Math.round(x*1000)/1000;
            
        }
        m=csport.drawingstate.matrix;
        
        console.log("a:"+r(m.a)+" "+
                    "b:"+r(m.b)+" "+
                    "c:"+r(m.c)+" "+
                    "d:"+r(m.d)+" "+
                    "tx:"+r(m.ty)+" "+
                    "ty:"+r(m.tx)
                    )
            
    }

    csport.applyMat=function(a,b,c,d,tx,ty){
        m=csport.drawingstate.matrix;
        var ra=  m.a*a+m.c*b;
        var rb=  m.b*a+m.d*b;
        var rc=  m.a*c+m.c*d;
        var rd=  m.b*c+m.d*d;
        var rtx= m.a*tx+m.c*ty+m.tx;
        var rty= m.b*tx+m.d*ty+m.ty;
        m.a=ra;
        m.b=rb;
        m.c=rc;
        m.d=rd;
        m.tx=rtx;
        m.ty=rty;
        m.det= csport.drawingstate.matrix.a*csport.drawingstate.matrix.d
            -csport.drawingstate.matrix.b*csport.drawingstate.matrix.c;
        
        m.sdet=Math.sqrt(csport.drawingstate.matrix.det);
    }

    csport.translate=function(tx,ty){
        csport.applyMat(1,0,0,1,tx,ty);
    }

    csport.rotate=function(w){
        var c=Math.cos(w);
        var s=Math.sin(w);
        csport.applyMat(c,s,-s,c,0,0);
    }

    csport.scale=function(s){
        csport.applyMat(s,0,0,s,0,0);
    }

    csport.gsave=function(){
        csgstorage.stack.push(csport.clone(csport.drawingstate));
        
    }

    csport.grestore=function(){
        if(csgstorage.stack.length!=0){
            csport.drawingstate=csgstorage.stack.pop();
        }
    }

    csport.greset=function(){
        csport.drawingstate =csport.clone(csgstorage.backup);
        csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
        csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;
            csgstorage.stack=[];

    }

    csport.setcolor=function(co){
        var r=co.value[0].value.real; 
        var g=co.value[1].value.real; 
        var b=co.value[2].value.real; 
        if(csport.drawingstate.alpha==1){
            
            csport.drawingstate.linecolor="rgb("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+")";
            csport.drawingstate.linecolorraw=[r,g,b];
            csport.drawingstate.pointcolor="rgb("+Math.floor(r*255)+","
                +Math.floor(g*255)+","
                +Math.floor(b*255)+")";
        } else {
            csport.drawingstate.linecolor="rgb("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+csport.drawingstate.alpha+")";
            csport.drawingstate.linecolorraw=[r,g,b];
            csport.drawingstate.pointcolor="rgb("+Math.floor(r*255)+","
                +Math.floor(g*255)+","
                +Math.floor(b*255)+","+csport.drawingstate.alpha+")";
            
            
            
        }
        csport.drawingstate.pointcolorraw=[r,g,b];
        
    }

    csport.setlinecolor=function(co){
        var r=co.value[0].value.real; 
        var g=co.value[1].value.real; 
        var b=co.value[2].value.real; 
        if(csport.drawingstate.alpha==1){
            csport.drawingstate.linecolor=
            "rgb("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+")";
        } else{
            csport.drawingstate.linecolor=
            "rgba("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+csport.drawingstate.alpha+")";
        }
        csport.drawingstate.linecolorraw=[r,g,b];
    }
    
    csport.settextcolor=function(co){
        var r=co.value[0].value.real; 
        var g=co.value[1].value.real; 
        var b=co.value[2].value.real; 
        if(csport.drawingstate.alpha==1){
            csport.drawingstate.textcolor=
            "rgb("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+")";
        } else{
            csport.drawingstate.textcolor=
            "rgba("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+csport.drawingstate.alpha+")";
        }
        csport.drawingstate.textcolorraw=[r,g,b];
    }

    

    csport.setpointcolor=function(co){
        var r=co.value[0].value.real; 
        var g=co.value[1].value.real; 
        var b=co.value[2].value.real; 
        
        if(csport.drawingstate.alpha==1){
            csport.drawingstate.linecolor=
            "rgb("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+")";
        } else{
            csport.drawingstate.linecolor=
            "rgba("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+csport.drawingstate.alpha+")";
        }
        
        csport.drawingstate.pointcolorraw=[r,g,b];
        
    }

    csport.setalpha=function(al){
        var alpha=al.value.real;
        var r=csport.drawingstate.linecolorraw[0]; 
        var g=csport.drawingstate.linecolorraw[1]; 
        var b=csport.drawingstate.linecolorraw[2]; 
        
        csport.drawingstate.linecolor="rgba("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+alpha+")";
        
        var r=csport.drawingstate.pointcolorraw[0]; 
        var g=csport.drawingstate.pointcolorraw[1]; 
        var b=csport.drawingstate.pointcolorraw[2];                        
        csport.drawingstate.pointcolor="rgba("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+alpha+")";
 
        var r=csport.drawingstate.textcolorraw[0]; 
        var g=csport.drawingstate.textcolorraw[1]; 
        var b=csport.drawingstate.textcolorraw[2];                        
        csport.drawingstate.textcolor="rgba("+Math.floor(r*255)+","
            +Math.floor(g*255)+","
            +Math.floor(b*255)+","+alpha+")";
 
                      
        csport.drawingstate.alpha=alpha;
        
    }

    csport.setpointsize=function(si){
        csport.drawingstate.pointsize=si.value.real;
    }



    csport.setlinesize=function(si){
        csport.drawingstate.linesize=si.value.real;
    }

   csport.settextsize=function(si){
        csport.drawingstate.textsize=si.value.real;
    }

var lab={};

var doPri45 = {};


doPri45.a=[[],
    [1 / 5],
    [3 / 40, 9 / 40],
    [44 / 45, -56 / 15, 32 / 9],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]
    ];
doPri45.dt = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
doPri45.b1 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
doPri45.b2 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
doPri45.size = 7;//is this 5, 6 or 7


var rk=doPri45;
var behaviors;
var masses=[];
function csinitphys(behavs){
    behaviors=behavs;
    masses=[];
    
    
    behaviors.forEach(function(beh){
        if(beh.name){
            var geoname=beh.name;
            if(csgeo.csnames[geoname]){
                csgeo.csnames[geoname].behavior=beh.behavior;
                labObjects[beh.behavior.type].init(beh.behavior,csgeo.csnames[geoname]);
                if(beh.behavior.type=="Mass"){
                    masses.push(csgeo.csnames[geoname]);    
                }
                
                
            }
        } else {
           labObjects[beh.behavior.type].init(beh.behavior);
        }
    }
                      
                      
                      )
        
}




lab.tick=function(){
    for(var i=0;i<labObjects.env.accuracy;i++) {
        lab.tick1(labObjects.env.deltat/labObjects.env.accuracy);
    }
}

lab.tick1=function(deltat) {
    var mydeltat = deltat;
    
    
    var proceeded = 0;
    var actualdelta;
    
    while (deltat > 0 && proceeded < deltat * 0.999
           || deltat < 0 && proceeded > deltat * 0.999) {
        
        
        actualdelta = lab.oneRKStep(mydeltat);
        
        proceeded += actualdelta;
        mydeltat = Math.min(actualdelta * 2, deltat - proceeded);
        mydeltat = Math.max(mydeltat, 0.0000000000000001);
        lab.restorePosition();
        lab.doCollisions();
        lab.calculateForces();
        lab.moveToFinalPos();
    }
    return true;
}

lab.restorePosition=function() {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].restorePos(beh,rk.size+2);
    } );
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.restorePos(rk.getSize() + 2);
    //    }
    //}
}

lab.doCollisions=function() {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].doCollisions(beh);
    } );

}

lab.calculateForces=function() {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].calculateForces(beh);
    } );
    //dispatcher.callScriptsForOccasion(Assignments.OCCASION_STEP);
    //for (Behavior anAll : all) {
    //    if (!anAll.getBlock()) {
    //        anAll.calculateForces();
    //    }
    //}
}
lab.moveToFinalPos=function() {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].move(beh);
    } );
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.move();
    //    }
    //}
}





lab.oneRKStep=function(mydeltat) {
    
    var initRKTimeStep=function(deltat) {
        
        behaviors.forEach( function(b) {
            beh=b.behavior;
            labObjects[beh.type].initRK(beh,deltat);
            labObjects[beh.type].storePosition(beh);
        } );
        //for (Behavior anAll : all) {
        //    if (!anAll.getBlock()) {
        //        anAll.initRK(mydeltat);
        //        anAll.storePosition();
        //    }
        //}
    }

var setToTimestep=function(j) {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].setToTimestep(beh,rk.dt[j]);
    } );
    //   for (Behavior anAll : all) {
    //   if (!anAll.getBlock()) {
    //       anAll.setToTimestep(rk.getDt(j));
    //   }
    //}
}

var proceedMotion=function(j) {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].proceedMotion(beh,rk.dt[j],j,rk.a[j]);
    } );
    //for (Behavior anAll : all) {
    //    if (!anAll.getBlock()) {
    //        anAll.proceedMotion(rk.getDt(j), j, rk.getA(j));
    //    }
    //}
    
}

var resetForces=function() {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].resetForces(beh);
    } );
    //for (Behavior anAll : all) {
    //    if (!anAll.getBlock()) {
    //        anAll.resetForces();
    //    }
    //}
}

var calculateDelta=function(j) {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].calculateDelta(beh,j);
    } );
    //for (Behavior anAll : all) {
    //    if (!anAll.getBlock()) {
    //        anAll.calculateDelta(j);
    //    }
    //}
}


var calculateError=function(j) {
    var error = 0;
    behaviors.forEach( function(b) {
        beh=b.behavior;
        var j=rk.size;
        labObjects[beh.type].proceedMotion(beh,rk.dt[j-1],j,rk.b1);
        labObjects[beh.type].savePos(beh,j+1);
        labObjects[beh.type].proceedMotion(beh,rk.dt[j-1],j,rk.b2);
        labObjects[beh.type].savePos(beh,j+2);
        error+=labObjects[beh.type].sqDist(beh,j+1,j+2);
        
    } );
    
    error = Math.sqrt(error) / mydeltat;
    return error;
    
    //var error = 0;
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.proceedMotion(rk.getDt(rk.getSize() - 1), rk.getSize(), rk.getB1());
    //        beh.savePos(rk.getSize() + 1);
    //        beh.proceedMotion(rk.getDt(rk.getSize() - 1), rk.getSize(), rk.getB2());
    //        beh.savePos(rk.getSize() + 2);
    //        error += beh.sqDist(rk.getSize() + 1, rk.getSize() + 2);
    //    }
    //}
    //error = Math.sqrt(error) / mydeltat;
    //return error;
}

var recallInitialPosition=function(j) {
    behaviors.forEach( function(b) {
        beh=b.behavior;
        labObjects[beh.type].recallPosition(beh);
    } );
    
    //for (Behavior beh : all) {
    //    if (!beh.getBlock()) {
    //        beh.recallPosition();
    //    }
    //}
}


var rksize = rk.size;
var madeIt = false;
while (!madeIt) {
    initRKTimeStep(mydeltat);
    for (var j = 0; j < rksize; j++) {
        setToTimestep(j);
        proceedMotion(j);
        resetForces();
        lab.calculateForces();
        calculateDelta(j);
        
    }
    var error = calculateError(mydeltat);
    
    if (error > 0.001 && mydeltat > 0.0000001) {
        //            if (error > 0.1 && mydeltat > 0.001) {
        mydeltat /= 2;
        recallInitialPosition();
        } else {
            
            madeIt = true;
        }
    
    }        


return mydeltat;
}


labObjects={};

/*----------------------------MASS--------------------------*/


labObjects.Mass={
    
init:function(beh,elem){
    beh.vel=[0,0,0];//TODO: Das wird später mal die Velocity
    beh.pos=[0,0,0,0];//Position (homogen) 

        
        beh.el=elem;
        if(typeof(beh.mass) === 'undefined')  beh.mass= 1;
        if(typeof(beh.charge) === 'undefined') beh.charge= 0;
        if(typeof(beh.friction) === 'undefined') beh.friction= 0;
        beh.lnfrict=0;
        if(typeof(beh.limitspeed) === 'undefined') beh.limitspeed=false;   
        if(typeof(beh.fixed) === 'undefined') beh.fixed=false;
        if(typeof(beh.radius) === 'undefined') beh.radius= 1;
        beh.internalmove=false;
        
        beh.fx=0;
        beh.fy=0;
        beh.fz=0;
        beh.vx=beh.vx || 0;
        beh.vy=beh.vy || 0;
        beh.vz=beh.vz || 0;
        
        beh.mtype=0 // TODO: Free, Online, OnCircle
            
        var x=0;
        var y=0;
        var z=0;
        var xo=0;
        var yo=0;
        var zo=0;
        var vxo=0;
        var vyo=0;
        var vzo=0;
            /*  var x,y,z,xo,yo,zo,vxo,vyo,vzo,oldx,oldy,oldz;
        var oldx1,oldy1,oldz1;
        var oldx2,oldy2,oldz2;
        var oldx3,oldy3,oldz3;
        var oldx4,oldy4,oldz4;*/
            
        beh.env=labObjects.env; //TODO Environment
        
        //For Runge Kutta
        beh.deltat=0;
        beh.mx=0;
        beh.my=0;
        beh.mz=0;
        beh.mvx=0;
        beh.mvy=0;
        beh.mvz=0;
        beh.dx=[0,0,0,0,0,0,0,0,0,0];
        beh.dy=[0,0,0,0,0,0,0,0,0,0];
        beh.dz=[0,0,0,0,0,0,0,0,0,0];
        beh.dvx=[0,0,0,0,0,0,0,0,0,0];
        beh.dvy=[0,0,0,0,0,0,0,0,0,0];
        beh.dvz=[0,0,0,0,0,0,0,0,0,0];
        beh.midx=0;
        beh.midy=0;
        beh.midz=0;
        beh.lx=0;
        beh.ly=0;
        beh.lz=0;
        
        
},

resetForces:function(beh){
    beh.fx=0;
    beh.fy=0;
    beh.fz=0;
    
},

getBlock:false,

setToTimestep:function(beh,j,a){},

initRK:function(beh,dt){
    var pt=evaluator._helper.extractPoint(beh.el.homog);

    beh.x = pt.x;
    beh.y = pt.y;
    beh.z = 0;
    beh.xo = beh.x;
    beh.yo = beh.y;
    beh.zo = beh.z;
    beh.vxo = beh.vx;
    beh.vyo = beh.vy;
    beh.vzo = beh.vz;
    beh.deltat = dt;
    
    beh.fx=0;
    beh.fy=0;
    beh.fz=0;

    /* TODO Implement this
        if (type == TYPE_POINTONCIRCLE) {
            Vec mid = ((PointOnCircle) associatedPoint.algorithm).getCenter();
            midx = mid.xr / mid.zr;
            midy = mid.yr / mid.zr;
            
        }
    if (type == TYPE_POINTONLINE) {
        Vec line = ((PointOnLine) associatedPoint.algorithm).getLine().coord;
        lx = line.yr;
        ly = -line.xr;
        double n = Math.sqrt(lx * lx + ly * ly);
        lx /= n; //Das ist die normierte Geradenrichtung
        ly /= n;
    } 
    */
},

setVelocity:function(beh,vx,vy,vz){
    if(!vz) vz=0;
    //if (type == TYPE_FREE) {
    if (true) {
        beh.vx = vx;
        beh.vy = vy;
        beh.vz = vz;
    }
    
    /* TODO Implement
        if (type == TYPE_POINTONCIRCLE) {
            double x = associatedPoint.coord.xr / associatedPoint.coord.zr;
            double y = associatedPoint.coord.yr / associatedPoint.coord.zr;
            Vec mid = ((PointOnCircle) associatedPoint.algorithm).getCenter();
            double midx = mid.xr / mid.zr;
            double midy = mid.yr / mid.zr;
            double dix = y - midy;  //Steht senkrecht auf Radius
            double diy = -x + midx;
            double n = Math.sqrt(dix * dix + diy * diy);
            dix /= n;
            diy /= n;
            double scal = dix * vx + diy * vy;//Es wird nur die wirsame kraftmomponente berücksichtigt
                
                this.vx = dix * scal;
                this.vy = diy * scal;
        }
    if (type == TYPE_POINTONLINE) {
        Vec line = ((PointOnLine) associatedPoint.algorithm).getLine().coord;
        double lx = line.yr;
        double ly = -line.xr;
        double n = Math.sqrt(lx * lx + ly * ly);
        lx /= n; //Das ist die normierte Geradenrichtung
        ly /= n;
        double scal = lx * vx + ly * vy;//Es wird nur die wirsame kraftmomponente berücksichtigt
            this.vx = lx * scal;
            this.vy = ly * scal;
    }
    */
    
    
    },


move:function(beh){
    // if (type == TYPE_FREE) {
    if (true) {
        beh.pos=[beh.x, beh.y, 1.0];
        beh.internalmove = true;
        if(!move || !mouse.down||beh.el!=move.mover )
            (beh.el).homog=List.realVector(beh.pos);
            (beh.el).sx=beh.x;
            (beh.el).sy=beh.y;

        beh.internalmove = false;
    }
    
    
    
    /*
     if (kernel.simulation.containsMover(associatedPoint)) {
         //Hier wird "werfen" implementiert
         voldx4 = voldx3;
         voldy4 = voldy3;
         voldx3 = voldx2;
         voldy3 = voldy2;
         voldx2 = voldx1;
         voldy2 = voldy1;
         voldx1 = x;
         voldy1 = y;
         x = associatedPoint.coord.xr / associatedPoint.coord.zr;
         y = associatedPoint.coord.yr / associatedPoint.coord.zr;
         //reset();
         fx = 0;
         fy = 0;
         vx = (x - voldx4) / 2.0;
         vy = (y - voldy4) / 2.0;
         return;
     }
     if (type == TYPE_FREE) {
         pos.assign(x, y, 1.0);
         internalmove = true;
         kernel.construction.simulateMoveUnlessFixedByMouse(associatedPoint, pos);
         internalmove = false;
     }
     if (type == TYPE_POINTONCIRCLE) {
         double dix = y - midy;  //Steht senkrecht auf radius
         double diy = -x + midx;
         double n = Math.sqrt(dix * dix + diy * diy);
         dix /= n;
         diy /= n;
         n = Math.sqrt(vx * vx + vy * vy);
         dix *= n;
         diy *= n;
         double scal = dix * vx + diy * vy;
         if (scal < 0) {
             vx = -dix;
             vy = -diy;
         } else {
             vx = dix;
             vy = diy;
         }
         pos.assign(x, y, 1.0);
         internalmove = true;
         kernel.construction.simulateMoveUnlessFixedByMouse(associatedPoint, pos);
         internalmove = false;
     }
     if (type == TYPE_POINTONLINE) {
         
         double scal = lx * vx + ly * vy;
         vx = scal * lx;
         vy = scal * ly;
         
         pos.assign(x, y, 1.0);
         internalmove = true;
         kernel.construction.simulateMoveUnlessFixedByMouse(associatedPoint, pos);
         internalmove = false;
     }
     
     */
    },

proceedMotion:function(beh,dt,i,a){

    if (!beh.fixed 
        //&& !associatedPoint.appearance.isPinned()   //TODO
        ) {
        
        if (true) {
        
            beh.x = beh.mx;
            beh.y = beh.my;
            beh.z = beh.mz;
            beh.vx = beh.mvx;
            beh.vy = beh.mvy;
            beh.vz = beh.mvz;
            for (var j = 0; j < i; j++) {
                beh.x += a[j] * beh.dx[j] * beh.deltat;
                beh.y += a[j] * beh.dy[j] * beh.deltat;
                beh.z += a[j] * beh.dz[j] * beh.deltat;
                beh.vx += a[j] * beh.dvx[j] * beh.deltat;
                beh.vy += a[j] * beh.dvy[j] * beh.deltat;
                beh.vz += a[j] * beh.dvz[j] * beh.deltat;
            }
        } else {
            beh.vx = 0;
            beh.vy = 0;
            beh.vz = 0;
        }
    }
},

calculateForces:function(beh){
    var bv = Math.sqrt(beh.vx * beh.vx + beh.vy * beh.vy+ beh.vz * beh.vz);
    var bvv = (bv > .1 && beh.limitSpeed) ? .1 / bv : 1;
    var fri = (1 - beh.env.friction) * bvv;
    beh.lnfrict = -Math.log((1 - beh.friction) * fri);

    //        if (Double.isInfinite(lnfrict)) lnfrict = 10000000000000.0; TODO
    beh.fx += -beh.vx * beh.lnfrict * beh.mass;//Reibung F_R=v*f*m (richtige Formel ?)
        beh.fy += -beh.vy * beh.lnfrict * beh.mass;
        beh.fz += -beh.vz * beh.lnfrict * beh.mass;
        
},

calculateDelta:function(beh,i){
    
    //  if (type == TYPE_FREE) {
    if (true) {
        beh.dx[i] = beh.vx;             //x'=v
        beh.dy[i] = beh.vy;
        beh.dz[i] = beh.vz;
        beh.dvx[i] = beh.fx / beh.mass;       //v'=F/m
        beh.dvy[i] = beh.fy / beh.mass;
        beh.dvz[i] = beh.fz / beh.mass;
    }
    /* TODO Implement
    if (type == TYPE_POINTONCIRCLE) {
        double dix = y - midy;  //Steht senkrecht auf Radius
        double diy = -x + midx;
        double n = Math.sqrt(dix * dix + diy * diy);
        dix /= n;
        diy /= n;
        double scal = dix * fx + diy * fy;//Es wird nur die wirsame kraftmomponente berücksichtigt
            dx[i] = vx;             //x'=v
            dy[i] = vy;
            dvx[i] = dix * scal / mass;       //v'=F/m
            dvy[i] = diy * scal / mass;
    }
    if (type == TYPE_POINTONLINE) {
        double scal = lx * fx + ly * fy;//Es wird nur die wirsame kraftmomponente berücksichtigt
        dx[i] = vx;             //x'=v
        dy[i] = vy;
        dvx[i] = lx * scal / mass;       //v'=F/m
        dvy[i] = ly * scal / mass;
    }
    */
    
    
    },

savePos:function(beh,i){
    beh.dx[i] = beh.x;
    beh.dy[i] = beh.y;
    beh.dz[i] = beh.z;
    beh.dvx[i] = beh.vx;
    beh.dvy[i] = beh.vy;
    beh.dvz[i] = beh.vz;
},

restorePos:function(beh,i){
    
    if (!beh.fixed) {
        beh.x = beh.dx[i];
        beh.y = beh.dy[i];
        beh.z = beh.dz[i];
        beh.vx = beh.dvx[i];
        beh.vy = beh.dvy[i];
        beh.vz = beh.dvz[i];
    }
},


sqDist:function(beh,i,j){
    var dist = (beh.dx[i] - beh.dx[j]) * (beh.dx[i] - beh.dx[j]);
    dist += (beh.dy[i] - beh.dy[j]) * (beh.dy[i] - beh.dy[j]);
    dist += (beh.dz[i] - beh.dz[j]) * (beh.dz[i] - beh.dz[j]);
    dist += (beh.dvx[i] - beh.dvx[j]) * (beh.dvx[i] - beh.dvx[j]);
    dist += (beh.dvy[i] - beh.dvy[j]) * (beh.dvy[i] - beh.dvy[j]);
    dist += (beh.dvz[i] - beh.dvz[j]) * (beh.dvz[i] - beh.dvz[j]);
    return dist;
},

kineticEnergy:function(beh){
    var vsq = beh.vx[i]*beh.vx[i]+beh.vy[i]*beh.vy[i]+beh.vz[i]*beh.vz[i];
    return 0.5*beh.mass*vsq;
},

storePosition:function(beh){
    beh.mx = beh.x;
    beh.my = beh.y;
    beh.mz = beh.z;
    beh.mvx = beh.vx;
    beh.mvy = beh.vy; 
    beh.mvz = beh.vz; 
     },

recallPosition:function(beh){
    if (!beh.fixed) {
        beh.x = beh.mx;
        beh.y = beh.my;
        beh.z = beh.mz;
        beh.vx = beh.mvx;
        beh.vy = beh.mvy;
        beh.vz = beh.mvz;
    }
},

doCollisions:function(beh) {}



}

/*----------------------------SUN--------------------------*/


labObjects.Sun={
    
init:function(beh,elem){
    beh.vel=[0,0,0];//TODO: Das wird später mal die Velocity
    beh.pos=[0,0,0,0];//Position (homogen) 
        
    beh.el=elem;
    if(typeof(beh.mass) === 'undefined')  beh.mass=10;
    if(typeof(beh.friction) === 'undefined') beh.friction= 0;

    beh.charge=0;
    beh.x=0;
    beh.y=0;
    beh.z=0;
        
},

resetForces:function(beh){},

getBlock:false,

setToTimestep:function(beh,j,a){},

initRK:function(beh,dt){
    var pt=evaluator._helper.extractPoint(beh.el.homog);

    beh.x = pt.x;
    beh.y = pt.y;
    beh.z = 0;
},

setVelocity:function(beh,vx,vy,vz){},


move:function(beh){},

proceedMotion:function(beh,dt,i,a){},

calculateDelta:function(beh,i){},


calculateForces:function(beh){

        var x1=beh.x;
        var y1=beh.y;
        var z1=beh.z;
        for (var i = 0; i < masses.length; i++) {
           var m=masses[i];
           var x2=m.behavior.x;
           var y2=m.behavior.y;
           var z2=m.behavior.z;
           var l = Math.sqrt(
                             (x1 - x2) * (x1 - x2) 
                             + (y1 - y2) * (y1 - y2)
                             + (z1 - z2) * (z1 - z2)
                             );
           var fx = (x1 - x2) * beh.mass * m.behavior.mass / (l * l * l);
           var fy = (y1 - y2) * beh.mass * m.behavior.mass / (l * l * l);
           var fz = (z1 - z2) * beh.mass * m.behavior.mass / (l * l * l);
           m.behavior.fx+=fx*m.behavior.mass;
           m.behavior.fy+=fy*m.behavior.mass;
           m.behavior.fz+=fz*m.behavior.mass;

        
        }


  /*    masses = kernel.simulation.masses;
        double x1 = p1.coord.xr / p1.coord.zr;
        double y1 = p1.coord.yr / p1.coord.zr;
        for (int i = 0; i < masses.size(); i++) {
            Mass m = ((Mass) masses.elementAt(i));
            double x2 = m.x;
            double y2 = m.y;
            double l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
            double fx = (x1 - x2) * mass * m.mass / (l * l * l);
            double fy = (y1 - y2) * mass * m.mass / (l * l * l);
            m.fx += fx * m.mass;
            m.fy += fy * m.mass;
        }
        */
        

        
},

savePos:function(beh,i){},

restorePos:function(beh,i){},


sqDist:function(beh,i,j){},

kineticEnergy:function(beh){},

storePosition:function(beh){},

recallPosition:function(beh){},

doCollisions:function(beh) {}



}


/*-------------------------SPRING-----------------------*/
labObjects.Spring={
    
init:function(beh,elem){
      
        beh.el=elem;
        if(typeof(beh.strength) === 'undefined') beh.strength= 1;
        if(typeof(beh.amplitude) === 'undefined') beh.amplitude= 0;
        if(typeof(beh.phase) === 'undefined') beh.phase= 0;
        if(typeof(beh.speed) === 'undefined') beh.speed= 1;
        if(typeof(beh.l0) === 'undefined') beh.l0= 0;
        //0=HOOK, 1=RUBBER, 2=NEWTON, 3=ELECTRO
        if(typeof(beh.stype) === 'undefined') beh.stype=1;  
        if(typeof(beh.readOnInit) === 'undefined') beh.readOnInit= false;
     
        beh.namea=elem.args[0];
        beh.nameb=elem.args[1];
        beh.ma=csgeo.csnames[beh.namea];
        beh.mb=csgeo.csnames[beh.nameb];
        var pta=evaluator._helper.extractPoint(beh.ma.homog);
        var ptb=evaluator._helper.extractPoint(beh.mb.homog);
        if(true){
           beh.l0 = (Math.sqrt((pta.x - ptb.x) * (pta.x - ptb.x) 
                    + (pta.y - ptb.y) * (pta.y - ptb.y)));
        }
        beh.env=labObjects.env; //TODO Environment


},

resetForces:function(beh){},

getBlock:false,

setToTimestep:function(beh,j,a){},

initRK:function(beh,dt){},

setVelocity:function(beh,vx,vy,vz){},

move:function(beh){},

proceedMotion:function(beh,dt,i,a){},

calculateForces:function(beh){
        var xa,xb,ya,yb;
        if(beh.ma.behavior && (!move || !mouse.down||beh.ma!=move.mover )) {
           xa=beh.ma.behavior.x;
           ya=beh.ma.behavior.y;
        } else {
            var pta=evaluator._helper.extractPoint(beh.ma.homog);
            xa=pta.x;
            ya=pta.y;
        }
        if(beh.mb.behavior && (!move || !mouse.down||beh.mb!=move.mover )) {
           xb=beh.mb.behavior.x;
           yb=beh.mb.behavior.y;
        } else {
            var ptb=evaluator._helper.extractPoint(beh.mb.homog);
            xb=ptb.x;
            yb=ptb.y;
        }
        
        
        
        var l = (Math.sqrt((xa - xb) * (xa - xb) + (ya - yb) * (ya - yb)));

        var lact = beh.l0; //TODO Motor
        var mytype=beh.stype;

        if(mytype==1) {
           lact=0;
        }

        var factor=0;
        
        if (mytype == 2 || mytype == 3){
            factor=beh.ma.behavior.mass*beh.mb.behavior.mass*beh.strength;
        }
        
        if(mytype==2) factor=-factor;//NEWTON
        
        if (l != 0.0 && (mytype == 0 || mytype == 1)) {
            fx = -(xa - xb) * beh.strength * (l - lact) / l * beh.env.springstrength;
            fy = -(ya - yb) * beh.strength * (l - lact) / l * beh.env.springstrength;
        } else if (a != null && b != null && l != 0.0) {
            var l3 = (l * l * l);
            if (mytype == 2 || mytype == 3) {//NEWTON //ELECTRO
                fx = (xa - xb) * factor / l3;
                fy = (ya - yb) * factor / l3;
            } 
        } else {
            fx = fy = 0.0;
        }
        
        //if (a != null) {
        if (beh.ma.behavior) {
            beh.ma.behavior.fx+=fx;
            beh.ma.behavior.fy+=fy;
        }
        //if (b != null) {
        if (beh.mb.behavior) {
            beh.mb.behavior.fx-=fx;
            beh.mb.behavior.fy-=fy;
        }
       
},

calculateDelta:function(beh,i){ },

savePos:function(beh,i){},

restorePos:function(beh,i){},

sqDist:function(beh,i,j){},

kineticEnergy:function(beh){},

storePosition:function(beh){},

recallPosition:function(beh){},

doCollisions:function(beh) {}


}







/*-------------------------Bouncer-----------------------*/
labObjects.det=function (x1, y1, x2,  y2, x3, y3) {
    return x2 * y3 - x3 * y2
    + x3 * y1 - x1 * y3
    + x1 * y2 - x2 * y1;
}


labObjects.Bouncer={
    
    
init:function(beh,elem){
      
        beh.el=elem;
        if(typeof(beh.xdamp) === 'undefined') beh.xdamp= 0;
        if(typeof(beh.ydamp) === 'undefined') beh.ydamp= 0;
        if(typeof(beh.motorchanger) === 'undefined') beh.motorchanger= true;

        beh.namea=elem.args[0];
        beh.nameb=elem.args[1];
        beh.ma=csgeo.csnames[beh.namea];
        beh.mb=csgeo.csnames[beh.nameb];
        var pta=evaluator._helper.extractPoint(beh.ma.homog);
        var ptb=evaluator._helper.extractPoint(beh.mb.homog);
        beh.x1o=pta.x;
        beh.y1o=pta.y;
        beh.x2o=ptb.x;
        beh.y2o=ptb.y;
        
        beh.env=labObjects.env; //TODO Environment


},

resetForces:function(beh){},

getBlock:false,

setToTimestep:function(beh,j,a){},

initRK:function(beh,dt){
       beh.deltat = dt;
},

setVelocity:function(beh,vx,vy,vz){},

move:function(beh){},

proceedMotion:function(beh,dt,i,a){},

calculateForces:function(beh){ },

calculateDelta:function(beh,i){ },

savePos:function(beh,i){},

restorePos:function(beh,i){},

sqDist:function(beh,i,j){},

kineticEnergy:function(beh){},

storePosition:function(beh){},

recallPosition:function(beh){},

doCollisions:function(beh) {

        
        var pta=evaluator._helper.extractPoint(beh.ma.homog);
        var ptb=evaluator._helper.extractPoint(beh.mb.homog);
        var x1=pta.x;
        var y1=pta.y;
        var x2=ptb.x;
        var y2=ptb.y;
        
        var x1o=beh.x1o;
        var y1o=beh.y1o;
        var x2o=beh.x2o;
        var y2o=beh.y2o;
        
        var n = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
        var nx = (x1 - x2) / n;
        var ny = (y1 - y2) / n;


        for (var i = 0; i < masses.length; i++) {

            var mass = masses[i];

            //a1=x1o+i*y1o
            //b1=x2o+i*y2o
            //c1=mass.xo+i*mass.yo
            //a2=x1+i*y1
            //b2=x2+i*y2
            //Nun berechne (a1*b2-b1*a2+c1*a2-c1*b2)/(a1-b1);
            //Dass ist eine abgefahrene aber effektive Art eine Ähnlichkeitstransformation zu bestimmen

/*          aa.assign(x1o, y1o).mul(x2, y2);
            bb.assign(x2o, y2o).mul(x1, y1);
            aa.sub(bb);
            bb.assign(mass.xo, mass.yo).mul(x1, y1);
            aa.add(bb);
            bb.assign(mass.xo, mass.yo).mul(x2, y2);
            aa.sub(bb);
            bb.assign(x1o, y1o).sub(x2o, y2o);
            aa.div(bb);
*/


            var mxo=mass.behavior.xo;
            var myo=mass.behavior.yo;
            var mx=mass.behavior.x;
            var my=mass.behavior.y;
            
            var aa=CSNumber.mult(CSNumber.complex(x1o, y1o),CSNumber.complex(x2, y2));
            var bb=CSNumber.mult(CSNumber.complex(x2o, y2o),CSNumber.complex(x1, y1));

            aa=CSNumber.sub(aa,bb);
            bb=CSNumber.mult(CSNumber.complex(mxo, myo),CSNumber.complex(x1, y1));
            aa=CSNumber.add(aa,bb);
            bb=CSNumber.mult(CSNumber.complex(mxo, myo),CSNumber.complex(x2, y2));
            aa=CSNumber.sub(aa,bb);
            bb=CSNumber.sub(CSNumber.complex(x1o, y1o),CSNumber.complex(x2o, y2o));
            aa=CSNumber.div(aa,bb);

            if (labObjects.det(x1, y1, x2, y2, mx, my)
                * labObjects.det(x1, y1, x2, y2, aa.value.real, aa.value.imag) < 0 &&
                labObjects.det(x1, y1, mx, my, aa.value.real, aa.value.imag)
                * labObjects.det(x2, y2, mx, my, aa.value.real, aa.value.imag) < 0) {
               
 
                // doHitScript(mass);//TODO


//TODO                if (motorChanger)
//                    kernel.simulation.motor.dir *= -1;

                var vvx = mass.behavior.mvx + beh.deltat * (-aa.value.real + mass.behavior.xo);
                var vvy = mass.behavior.mvy + beh.deltat * (-aa.value.imag + mass.behavior.yo);

                var ss1 = nx * vvx + ny * vvy;
                var ss2 = ny * vvx - nx * vvy;
                //TODO Nächsten zwei zeilen sind gepfuscht, erhalten aber die Energie

                mass.behavior.x = aa.value.real;
                mass.behavior.y = aa.value.imag;
                mass.behavior.vx  =  nx * ss1 * (1.0 - beh.xdamp);
                mass.behavior.vy  =  ny * ss1 * (1.0 - beh.xdamp);
                mass.behavior.vx += -ny * ss2 * (1.0 - beh.ydamp);
                mass.behavior.vy +=  nx * ss2 * (1.0 - beh.ydamp);

            }
        }
        beh.x1o = x1;
        beh.y1o = y1;
        beh.x2o = x2;
        beh.y2o = y2;
    }


}





/*-------------------------ENVIRONMENT-----------------------*/
labObjects.Environment={
    
init:function(beh){
        if(typeof(beh.gravity) === 'undefined') beh.gravity= 0;
        if(typeof(beh.friction) === 'undefined') beh.friction= 0;
        if(typeof(beh.springstrength) === 'undefined') beh.springstrength= 1;
        if(typeof(beh.accuracy) === 'undefined') beh.accuracy= 10;
        if(typeof(beh.deltat) === 'undefined') beh.deltat= .3;
        if(typeof(beh.charges) === 'undefined') beh.charges= false;
        if(typeof(beh.balls) === 'undefined') beh.balls= false;
        if(typeof(beh.newton) === 'undefined') beh.newton= false;
        if(typeof(beh.ballInteractionBoosting) === 'undefined') beh.ballInteractionBoosting= 0;
        labObjects.env=beh;

},

resetForces:function(beh){},

getBlock:false,

setToTimestep:function(beh,j,a){},

initRK:function(beh,dt){},

setVelocity:function(beh,vx,vy,vz){},

move:function(beh){},

proceedMotion:function(beh,dt,i,a){},

calculateForces:function(beh){
 
    if (beh.newton) {
        for (var i = 0; i < masses.length - 1; i++) {
            var m1 = masses[i];
            var x1 = m1.behavior.x;
            var y1 = m1.behavior.y;
            for (var j = i + 1; j < masses.length; j++) {
                
                var m2 = masses[j];
                var x2 = m2.behavior.x;
                var y2 = m2.behavior.y;
                var l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                var fx = (x1 - x2) * m1.behavior.mass * m2.behavior.mass / (l * l * l);
                var fy = (y1 - y2) * m1.behavior.mass * m2.behavior.mass / (l * l * l);
                
                m1.behavior.fx -= fx;
                m1.behavior.fy -= fy;
                m2.behavior.fx += fx;
                m2.behavior.fy += fy;
            }
        }
    }
    
       if (beh.charges) {
        for (var i = 0; i < masses.length - 1; i++) {
            var m1 = masses[i];
            var x1 = m1.behavior.x;
            var y1 = m1.behavior.y;
            for (var j = i + 1; j < masses.length; j++) {
                
                var m2 = masses[j];
                var x2 = m2.behavior.x;
                var y2 = m2.behavior.y;
                var l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                var fx = (x1 - x2) * m1.behavior.charge * m2.behavior.charge / (l * l * l);
                var fy = (y1 - y2) * m1.behavior.charge * m2.behavior.charge / (l * l * l);
                
                m1.behavior.fx += fx;
                m1.behavior.fy += fy;
                m2.behavior.fx -= fx;
                m2.behavior.fy -= fy;
            }
        }
    }
 
    if (beh.balls) {
        
        for (var i = 0; i < masses.length - 1; i++) {
            var m1 = masses[i];
            if(m1.behavior.radius!=0){
                var x1 = m1.behavior.x;
                var y1 = m1.behavior.y;
                for (var j = i + 1; j < masses.length; j++) {
                    
                    var m2 = masses[j];
                    if(m2.behavior.radius!=0){
                        
                        var x2 = m2.behavior.x;
                        var y2 = m2.behavior.y;
                        
                        var r = m1.behavior.radius + m2.behavior.radius;
                        var l = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                        var fx = 0;
                        var fy = 0;
                        
                        if (beh.ballInteractionBoosting == 0) {
                            fx = (x1 - x2) / (l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                            fy = (y1 - y2) / (l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                        } else {
                            if (ballInteractionBoosting == 1) {
                                
                                fx = (x1 - x2) / (l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                fy = (y1 - y2) / (l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                            } else {
                                fx = (x1 - x2) / (l * l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                                fy = (y1 - y2) / (l * l * l * l * l) * (l > r ? 0 : (l - r) * (l - r));
                            }
                        }
                        
                        
                        m1.behavior.fx += fx;
                        m1.behavior.fy += fy;
                        m2.behavior.fx -= fx;
                        m2.behavior.fy -= fy;
                    }
                }
            }
        }
    }


    
    for (var i = 0; i < masses.length; i++) {
        var m=masses[i];
        
        m.behavior.fx+=0;
        m.behavior.fy+=beh.gravity;
        m.behavior.fz+=0;
        
        
    }       
},

calculateDelta:function(beh,i){ },

savePos:function(beh,i){},

restorePos:function(beh,i){},

sqDist:function(beh,i,j){},

kineticEnergy:function(beh){},

storePosition:function(beh){},

recallPosition:function(beh){},

doCollisions:function(beh) {}


}



var d3_arraySlice = [].slice,
    d3_array = function(list) { return d3_arraySlice.call(list); }; 
    
    
    
var d3_document = document,
    d3_documentElement = d3_document.documentElement,
    d3_window = window;

// Redefine d3_array if the browser doesn’t support slice-based conversion.
try {
  d3_array(d3_documentElement.childNodes)[0].nodeType;
} catch(e) {
  d3_array = function(list) {
    var i = list.length, array = new Array(i);
    while (i--) array[i] = list[i];
    return array;
  };
}



function d3_vendorSymbol(object, name) {
  if (name in object) return name;
  name = name.charAt(0).toUpperCase() + name.substring(1);
  for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
    var prefixName = d3_vendorPrefixes[i] + name;
    if (prefixName in object) return prefixName;
  }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];

var d3={};

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_active, // active timer object
    d3_timer_frame = d3_window[d3_vendorSymbol(d3_window, "requestAnimationFrame")] || function(callback) { setTimeout(callback, 17); };

// The timer will continue to fire until callback returns true.
d3.timer = function(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();

  // Add the callback to the tail of the queue.
  var time = then + delay, timer = {c: callback, t: time, f: false, n: null};
  if (d3_timer_queueTail) d3_timer_queueTail.n = timer;
  else d3_timer_queueHead = timer;
  d3_timer_queueTail = timer;

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
};

function d3_timer_step() {
  var now = d3_timer_mark(),
      delay = d3_timer_sweep() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  d3_timer_mark();
  d3_timer_sweep();
};

function d3_timer_mark() {
  var now = Date.now();
  d3_timer_active = d3_timer_queueHead;
  while (d3_timer_active) {
    if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
    d3_timer_active = d3_timer_active.n;
  }
  return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
  var t0,
      t1 = d3_timer_queueHead,
      time = Infinity;
  while (t1) {
    if (t1.f) {
      t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
    } else {
      if (t1.t < time) time = t1.t;
      t1 = (t0 = t1).n;
    }
  }
  d3_timer_queueTail = t0;
  return time;
}



