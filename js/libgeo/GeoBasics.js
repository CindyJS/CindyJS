

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
            csgeo.conics[csgeo.ctl]=l;
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

    if(CSNumber.helper.isAlmostReal(x1)&&
       CSNumber.helper.isAlmostReal(y1)&&
       CSNumber.helper.isAlmostReal(x2)&&
       CSNumber.helper.isAlmostReal(y2)&&
       CSNumber.helper.isAlmostReal(xm)&&
       CSNumber.helper.isAlmostReal(ym)){
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
    //TODO Test auf Complex einbauen
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
        if(!el.isshowing)
            return;
        evaluator.draw([el.homog],{size:el.size,color:el.color,alpha:el.alpha});
        
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
        if(!el.isshowing)
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

                if(!CSNumber.helper.isAlmostZero(z)){
                    x=CSNumber.div(x,z);
                    y=CSNumber.div(y,z);
                    if(CSNumber.helper.isAlmostReal(x)&&CSNumber.helper.isAlmostReal(y)){
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





