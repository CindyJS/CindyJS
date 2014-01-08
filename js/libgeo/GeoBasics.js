function csinit(gslp){
    csgeo.gslp=gslp;
    
    svg = d3.select("body")
    .append("svg")
    .attr("width", csw)
    .attr("height", csh)
    .attr("onmousemove", "test (event)")
    ;
        
/*    svg.on("mousemove", function() {
       // csmouse = d3.svg.mouse(this);
        console.log(d3.event.pageX);
    });*/

    test=function(evt){
        var x = (-250+evt.offsetX)/25.0;
        var y = (250-evt.offsetY)/25.0;
        csmouse=[x,y];
    }

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
    
    recalc();
    csgeo.dataset = {
    nodes: csgeo.free,
    edges: []
    };
    
    
    //Initialize a default force layout, using the nodes and edges in dataset
    csgeo.eventhandler = d3.layout.force()
    .nodes(csgeo.dataset.nodes)
    .links(csgeo.dataset.edges)
    .size([csw, csh])
    .linkDistance([80])
    .charge([0])
    .gravity([.000])
    .start();
    
    
    //Create edges as lines
    csgeo.edges = svg.selectAll("line")
    .data(csgeo.lines)
    .enter()
    .append("line")
    .style("stroke", "#000")
    .style("stroke-width", 3);
    
    //Create nodes as circles
    csgeo.nodes = svg.selectAll("circle")
    .data(csgeo.points)
    .enter()
    .append("circle")
    .attr("r", 9)
    .style("fill", function(d,i) {
           if (d.type=="Free") {return "rgba(1,1,1,0)";}
           return "red";})
   // .style("stroke", "black")
   // .style("stroke-width", 2)
    .call(csgeo.eventhandler.drag);
    
    csgeo.eventhandler.on("tick", function() {
                          
                         // csgeo.gslp[1].py=30;
                          
                          recalc();                          

                          csctx.clearRect ( 0   , 0 , 500 , 500 );
                          evaluate(cserg);
                          render();
                          
                          });
    
    
    
    
    
    
}