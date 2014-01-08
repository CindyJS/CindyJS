                    var csmouse = [100, 100];
            var cscount = 0;

            
			//Width and height
			var csw = 500;
			var csh = 500;
            csport.drawingstate.matrix.ty=csport.drawingstate.matrix.ty-csh;
            csport.drawingstate.initialmatrix.ty=csport.drawingstate.initialmatrix.ty-csh;

			var csconsole;
            var csgeo={};
            var svg;
            //Create SVG element
            var i=0;

			var gslp=[
                      {name:"A", kind:"P", type:"Free", sx:4,sy:8,sz:1},
                      {name:"B", kind:"P", type:"Free", sx:-9,sy:8,sz:1},
                      {name:"D", kind:"P", type:"Free", sx:-1,sy:0,sz:1},
                      {name:"C", kind:"P", type:"Free", sx:4,sy:3,sz:1},
                      {name:"X", kind:"P", type:"Free", sx:-8,sy:8,sz:1},
                      {name:"Y", kind:"P", type:"Free", sx:-8,sy:.8,sz:1},
                      {name:"Z", kind:"P", type:"Free", sx:-6,sy:0,sz:1}
                      ];
            
            csinit(gslp);
            var images={};
            

   
                       
            var c=document.getElementById("CSCanvas");
            c.width=csw;
            c.height=csh;
            var csctx=c.getContext("2d");
            var cscode=document.getElementById("firstDrawing").text;
            cscode=condense(cscode);
            var cserg=analyse(cscode,false);
        
        