var geoOpMap={
  Free:"P",
  Meet:"P",
  Join:"L"
}

function csinit(gslp){
    csgeo.gslp=gslp;
    
          
    csgeo.csnames={};
    for( var k=0; k<csgeo.gslp.length; k++ ) {
        csgeo.csnames[csgeo.gslp[k].name]=k;
        csgeo.gslp[k].kind=geoOpMap[csgeo.gslp[k].type];
    };
    
    csgeo.points=[];
    csgeo.lines=[];
    csgeo.free=[];
    csgeo.ctp=0;
    csgeo.ctf=0;
    csgeo.ctl=0;
    var m=csport.drawingstate.matrix;
    
    for( var k=0; k<csgeo.gslp.length; k++ ) {
        if(csgeo.gslp[k].kind=="P"){
            var p=csgeo.gslp[k];
            csgeo.points[csgeo.ctp]=p;
            p.size=CSNumber.real(6);
            p.color=List.realVector([.7,0,0]);
            p.alpha=CSNumber.real(1);
            csgeo.ctp+=1;
        }
        if(csgeo.gslp[k].kind=="L"){
            var l=csgeo.gslp[k];
            csgeo.lines[csgeo.ctl]=l;
            l.size=CSNumber.real(2);
            l.color=List.realVector([0,0,1]);
            l.alpha=CSNumber.real(1);
            csgeo.ctl+=1;
        }
        if(csgeo.gslp[k].type=="Free"){
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
            f.color=List.realVector([1,0,0]);

            
            csgeo.free[csgeo.ctf]=f;
            csgeo.ctf+=1;
        }
        
    };
    
};




function render(){
    var drawgeopoint= function(el){
        evaluator.draw([el.homog],{size:el.size,color:el.color,alpha:el.alpha});
    
    }

    var drawgeoline= function(el){
        evaluator.draw([el.homog],{size:el.size,color:el.color,alpha:el.alpha});
    
    }
   for( var i=0; i<csgeo.lines.length; i++ ) {
        drawgeoline(csgeo.lines[i]);
    }


    for( var i=0; i<csgeo.points.length; i++ ) {
        drawgeopoint(csgeo.points[i]);
    }

     
};





