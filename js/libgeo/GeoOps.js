function recalc(){
    var gslp=csgeo.gslp;
    for( var k=0; k<gslp.length; k++ ) {
        var el=gslp[k];
        
        if (el.type=="Free") {
            el.x=el.px/el.pz;
            el.y=el.py/el.pz;
        };
        
        
        if (el.type=="Mid") {
            var el1=gslp[names[(el.arg1)]];
            var el2=gslp[names[(el.arg2)]];
            el.px=(el1.px/el1.pz+el2.px/el2.pz)/2;
            el.py=(el1.py/el1.pz+el2.py/el2.pz)/2;
            el.pz=1;
            el.x=el.px/el.pz;
            el.y=el.py/el.pz;
        };
        
        
        if (el.type=="Join") {
            var el1=gslp[names[(el.arg1)]];
            var el2=gslp[names[(el.arg2)]];
            el.px=(el1.py*el2.pz-el1.pz*el2.py);
            el.py=(el1.pz*el2.px-el1.px*el2.pz);
            el.pz=(el1.px*el2.py-el1.py*el2.px);
            var n=Math.sqrt(el.px*el.px+el.py*el.py+el.pz*el.pz);
            el.px=el.px/n;
            el.py=el.py/n;
            el.pz=el.pz/n;
            if(el.px*el.px<el.py*el.py){
                el.x1=0;
                el.y1=-el.pz/el.py;
                el.x2=500;
                el.y2=-(500*el.px+el.pz)/el.py;
            } else {
                el.x1=-el.pz/el.px;
                el.y1=0;
                el.x2=-(500*el.py+el.pz)/el.px;
                el.y2=500;
            }
            
            
        };
        
        
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
    }
};



function render(){
    csgeo.edges.attr("x1", function(d) { return d.x1; })
    .attr("y1", function(d) { return d.y1; })
    .attr("x2", function(d) { return d.x2; })
    .attr("y2", function(d) { return d.y2; });
    
    csgeo.nodes.attr("cx", function(d) { return d.x})
    .attr("cy", function(d) { return d.y});
    
};



