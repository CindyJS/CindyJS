var lock=false;

function recalc(){
   if(!lock){
      lock=true;
      recalcX();
      lock=false;
   } else {
   
      console.log("locked");
   }

}

function recalcX(){
    csport.reset();
    var gslp=csgeo.gslp;
    for( var k=0; k<gslp.length; k++ ) {
        var el=gslp[k];
        
        if (el.type=="Free") {
//Ist alles in die Event Loop Gewandert
            el.kind="P";          

        };
        
        /*
        if (el.type=="Mid") {
            var el1=gslp[names[(el.arg1)]];
            var el2=gslp[names[(el.arg2)]];
            el.px=(el1.px/el1.pz+el2.px/el2.pz)/2;
            el.py=(el1.py/el1.pz+el2.py/el2.pz)/2;
            el.pz=1;
            el.x=el.px/el.pz;
            el.y=el.py/el.pz;
        };
        
        */
        if (el.type=="Join") {
            var el1=gslp[csgeo.csnames[(el.args[0])]];
            var el2=gslp[csgeo.csnames[(el.args[1])]];
            el.homog=List.cross(el1.homog,el2.homog);
            el.homog.usage="Line";  
            el.kind="L";          
            
        };


       if (el.type=="Meet") {
            var el1=gslp[csgeo.csnames[(el.args[0])]];
            var el2=gslp[csgeo.csnames[(el.args[1])]];
            el.homog=List.cross(el1.homog,el2.homog);
            el.homog.usage="Point";            
            el.kind="P";          

        };
        
       /* 
        if (el.type=="Meet") {
            var el1=gslp[names[(el.arg1)]];
            var el2=gslp[names[(el.arg2)]];
            el.px=(el1.py*el2.pz-el1.pz*el2.py);
            el.py=(el1.pz*el2.px-el1.px*el2.pz);
            el.pz=(el1.px*el2.py-el1.py*el2.px);
            var n=Math.sqrt(el.px*el.px+el.py*el.py+el.pz*el.pz);
            el.px=el.px/n;
            el.py=el.py/n;
            el.pz=el.pz/n;
            el.x=el.px/el.pz;
            el.y=el.py/el.pz;
        };
        
        */
    }
};

