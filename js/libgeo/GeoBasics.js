function csinit(gslp){
    csgeo.gslp=gslp;
    
          
    csgeo.csnames={};
    for( var k=0; k<csgeo.gslp.length; k++ ) {
        csgeo.csnames[csgeo.gslp[k].name]=k;
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
            csgeo.points[csgeo.ctp]=csgeo.gslp[k];
            csgeo.ctp+=1;
        }
        if(csgeo.gslp[k].kind=="L"){
            csgeo.lines[csgeo.ctl]=csgeo.gslp[k];
            csgeo.ctl+=1;
        }
        if(csgeo.gslp[k].type=="Free"){
            
            var v=csport.from(csgeo.gslp[k].sx,csgeo.gslp[k].sy,csgeo.gslp[k].sz)
            
            gslp[k].px=v[0];
            gslp[k].py=v[1];
            gslp[k].pz=1;
            
            
            csgeo.free[csgeo.ctf]=csgeo.gslp[k];
            csgeo.ctf+=1;
        }
        
    };
    

 
}