
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
    var isArrow = false;
    var angle;
    var arrowSides = '==>';
    var arrowScaling = 1.0; // scale arrow length
    var headlen = 10; // arrow head length - perhaps set this relative to canvas size
    var arrowShape = 'default';
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
                    if(psize>1000) psize=1000;
                }
                if(type=="L"){
                    lsize=erg.value.real;
                    if(lsize<0) lsize=0;
                    if(lsize>1000) lsize=1000;
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
            if(modifs.arrow !== undefined){ 
		    erg = evaluate(modifs.arrow); 
		    if(erg.ctype == 'boolean'){
                    isArrow = erg.value; 
		    }
		    else{
			    console.error("arrow needs to be of type boolean");
		    }
                }
            if(modifs.arrowshape !== undefined){
		    erg = evaluate(modifs.arrowshape);

		    erg = evaluate(modifs.arrowshape);
		    if(erg.ctype == 'string'){
                    arrowShape = erg.value; 
		    if(!isArrow){ 
			    console.log("warning: implicitly activated modifier arrow by using arrowShape"); 
		    }
		    isArrow = true;
		    }
		    else{
			    console.error("arrowshape needs to be of type string");
		    }
	    } 

	    if(modifs.arrowsides !== undefined){
		    erg = evaluate(modifs.arrowsides);
		    if(!isArrow){ 
			    console.log("warning: implicitly activated modifier arrow by using arrowsides"); 
		    }
		    isArrow = true;
		    if(erg.ctype !== 'string'){
			    console.error('arrowsides is not of type string');
		    }

		    if(!(erg.value == '==>' || erg.value == '<==>' || erg.value == '<==')){
			    console.error("arrowsides is unknows");
		    }
		    else{
			    arrowSides = erg.value;
		    }
	    }

	    if(modifs.arrowposition !== undefined){
		    erg = evaluate(modifs.arrowposition);
		    if(!isArrow){ 
			    console.log("warning: implicitly activated modifier arrow by using arrowposition"); 
		    	    isArrow = true;
		    }
		    if(erg.ctype !== "number"){
			    console.error('arrowposition is not of type number');
		    }

		    if(erg.value.real < 0.0){
			    console.error("arrowposition has to be positive");
		    }
		    else{
			    arrowScaling = erg.value.real;
		    }
	    }

	    if(modifs.arrowsize !== undefined){
		    erg = evaluate(modifs.arrowsize);
		    if(!isArrow){ 
			    console.log("warning: implicitly activated modifier arrow by using arrowposition"); 
		    	    isArrow = true;
		    }
		    if(erg.ctype !== "number"){
			    console.error('arrowsize is not of type number');
		    }

		    if(erg.value.real < 0.0){
			    console.error("arrowposition has to be positive");
		    }
		    else{
			    headlen = headlen * erg.value.real;
		    }
	    }
    } // end handleModifs
        
        
        
        
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
        csctx.lineWidth = lsize;
        csctx.lineCap = 'round';
        csctx.strokeStyle=col;

	// nasty workaround - could not get rid of this case easily - works at the moment
	if(arrowScaling == 0.5){arrowScaling = 0.500001;}

	// save original x/y values
	var or_x1 = xxx1;
	var or_x2 = xxx2;
	var or_y1 = yyy1;
	var or_y2 = yyy2;
	if(isArrow){

		var sc_x1, sc_x2, sc_y1, sc_y2;
		var norm = Math.pow(xxx1 - xxx2, 2) + Math.pow(yyy1 - yyy2, 2);
		norm = Math.sqrt(norm);

		var sc_fac = norm * (1-arrowScaling);
		//angle = Math.atan2(yyy2 - yyy1, xxx2 - xxx1);
		angle = Math.atan2(or_y2 - or_y1, or_x2 - or_x1);
		sc_x1 = xxx1 + sc_fac * Math.cos(angle);
		sc_x2 = xxx2 - sc_fac * Math.cos(angle);
		sc_y1 = yyy1 + sc_fac * Math.sin(angle);
		sc_y2 = yyy2 - sc_fac * Math.sin(angle);

		// does this have nasty sideeffects? Currently none
		xxx1 = sc_x1;
		xxx2 = sc_x2;
		yyy1 = sc_y1;
		yyy2 = sc_y2;

	}
        	csctx.moveTo(xxx1, yyy1);
	// shorten arrow for full arrow
	// Math.abs() for preventing bugs if points are the same
	//if(isArrow && arrowShape == "full" && (Math.abs(xxx1 - xxx2) + Math.abs(yyy1-yyy2))){
	if(isArrow && arrowShape == "full" && (Math.abs(xxx1 - xxx2) + Math.abs(yyy1-yyy2))){

		angle = Math.atan2(or_y2 - or_y1, or_x2 - or_x1);
		if(arrowScaling <= 0.5 && arrowScaling >= 0.5){
		var rx = xxx2 + headlen*Math.cos(angle - Math.PI/6);
		var ry = yyy2 + headlen*Math.sin(angle - Math.PI/6);
		var lx = xxx2 + headlen*Math.cos(angle + Math.PI/6);
		var ly = yyy2 + headlen*Math.sin(angle + Math.PI/6);
		}
		else{
		var rx = xxx2 - headlen*Math.cos(angle - Math.PI/6);
		var ry = yyy2 - headlen*Math.sin(angle - Math.PI/6);
		var lx = xxx2 - headlen*Math.cos(angle + Math.PI/6);
		var ly = yyy2 - headlen*Math.sin(angle + Math.PI/6);
		}

		var t1 = xxx2;
                var t2 = yyy2;
		if(arrowSides == '==>' || arrowSides == '<==>'){
		t1 = (rx + lx) / 2;
		t2 = (ry + ly) / 2;
		}
		if(arrowSides == "<==>" || arrowSides == "<=="){

		if(arrowScaling <= 0.5 && arrowScaling >= 0.5){
		rx = xxx1 - headlen*Math.cos(angle - Math.PI/6);
		ry = yyy1 - headlen*Math.sin(angle - Math.PI/6);
		lx = xxx1 - headlen*Math.cos(angle + Math.PI/6);
		ly = yyy1 - headlen*Math.sin(angle + Math.PI/6);
		}
		else{
		rx = xxx1 + headlen*Math.cos(angle - Math.PI/6);
		ry = yyy1 + headlen*Math.sin(angle - Math.PI/6);
		lx = xxx1 + headlen*Math.cos(angle + Math.PI/6);
		ly = yyy1 + headlen*Math.sin(angle + Math.PI/6);
		}

		s1 = (rx + lx) / 2;
		s2 = (ry + ly) / 2;
		csctx.moveTo(t1, t2);
		csctx.lineTo(s1, s2);
		}
		else{
        	csctx.lineTo(t1, t2);
		}

	}
	else{
        csctx.lineTo(xxx2, yyy2);
	}

	csctx.stroke();


	if(isArrow){
		var draw_arrowhead = function(xxx1, xxx2, yyy1, yyy2, anglemodifier){
		angle = Math.atan2(yyy2 - yyy1, xxx2 - xxx1);

		if(anglemodifier !== undefined){ angle = angle + anglemodifier; } // for arrow rotation
		var rx = xxx2 - headlen*Math.cos(angle - Math.PI/6);
		var ry = yyy2 - headlen*Math.sin(angle - Math.PI/6);

		csctx.beginPath();
		if(arrowShape == "full"){csctx.lineWidth = lsize/2;}
		//else{ csctx.lineWidth = lsize;}
		//csctx.moveTo(xxx2 - lll*Math.cos(angle - Math.PI/6), yyy2 - lll*Math.sin(angle - Math.PI/6));
		csctx.moveTo(xxx2, yyy2);
		csctx.lineTo(rx ,ry);
        	//csctx.moveTo(xxx2 - lll*Math.cos(angle + Math.PI/6), yyy2 - lll*Math.sin(angle + Math.PI/6));
        	csctx.moveTo(xxx2, yyy2);
		var lx = xxx2 - headlen*Math.cos(angle + Math.PI/6);
		var ly = yyy2 - headlen*Math.sin(angle + Math.PI/6);

		
		if(arrowShape== 'default'){
		csctx.lineTo(lx, ly);
		}
		else if(arrowShape == "full"){
		csctx.moveTo(rx, ry);
		csctx.lineTo(lx, ly);
		csctx.lineTo(xxx2, yyy2);
		csctx.fillStyle = col;
		csctx.fill();
		}

		else{ // this is failsafe - if type is unknow we will draw std arrows
			console.error("arrowshape is unknown");
		}

		csctx.stroke();
		} // end draw_arrowhead

		// draw arrow heads at desired positions
		var amodif = 0;
		if(arrowScaling < 0.5){ amodif = Math.PI}
		if(arrowSides == '==>' || arrowSides == '<==>'){
		draw_arrowhead(xxx1, xxx2, yyy1, yyy2, amodif);
		}
		if(arrowSides == '<==' || arrowSides == '<==>'){
		draw_arrowhead(xxx2, xxx1, yyy2, yyy1, amodif);
		}

		// fix missing paths if we scale down arrows
		if(arrowScaling < 1.0){
			var fixpaths = function(x1, y1, x2, y2){
				csctx.beginPath();
				csctx.strokeStyle = col;
				csctx.lineWidth = lsize;
       				csctx.lineCap = 'round';
				csctx.moveTo(x1, y1);
				csctx.lineTo(x2, y2);
				csctx.stroke();
			}
			
			if(arrowScaling > 0.5){
				fixpaths(xxx1, yyy1, or_x1, or_y1);
				fixpaths(xxx2, yyy2, or_x2, or_y2);
			}
			else{
				fixpaths(xxx1, yyy1, or_x2, or_y2);
				fixpaths(xxx2, yyy2, or_x1, or_y1);
			}

		}

	} // end isArrow
        
        //        csctx.strokeStyle="#0000FF";
        //        csctx.strokeStyle="rgba(0,0,255,0.2)";
        
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
        
        if(!pt.ok && typeof(v1.value)!=="undefined"){//eventuell doch ein Segment
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

evaluator.drawconic = function(args, modifs){
var Conic = args.Cparameters;

var norm = function(x0, y0, x1, y1){
	var norm = Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2);
	return Math.sqrt(norm);
};

// arrays to save points on conic
var arr_x1 = [];
var arr_x2 = [];
var arr_y1 = [];
var arr_y2 = [];
var arr_xg = [];
var arr_yg = [];

var resetArrays = function(){
      arr_x1 = [];
      arr_x2 = [];
      arr_y1 = [];
      arr_y2 = [];
      arr_xg = [];
      arr_yg = [];
};

var drawArray = function(x, y, col){
	csctx.strokeStyle= 'blue';
	csctx.lineWidth = 2;
	if(col !== 'undefined'){
		csctx.strokeStyle = col;
	}
	csctx.beginPath();
	var xx0, yy0, xx1, yy1;
	var temp, x0, x1, y0, y1;
	for(var i = 1; i < x.length; i++){
		x0 = x[i-1];
		x1 = x[i];
		y0 = y[i-1];
		y1 = y[i];

		csctx.moveTo(x0, y0);
		csctx.lineTo(x1, y1);
		csctx.moveTo(x[i-1], y0);
		csctx.lineTo(x[i], y1);
	}
	csctx.stroke();
}; // end drawArray

var get_concic_type = function(C){
	var eps = Math.pow(10, -8);

	if(C == 'undefined' || C.length != 6){
	   console.error("this does not define a Conic");
	}

	   var det = C[0]*C[2] - C[1]*C[1];

	   if(Math.abs(det) < eps){
		   return "parabola";
	   }
	   else if(det > eps){
		   return "ellipsoid";
	   }
	   else{
		   return "hyperbola";
	   }

}; // end get_concic_type

var eval_conic_x = function(C,ymin, ymax){
var x1, x2;
var type = get_concic_type(C);

if(C.length !== 6)
{
  console.error("Conic needs 6 Parameters");
  return;
}

var a = C[0];
var b = C[1];
var c = C[2];
var d = C[3];
var e = C[4];
var f = C[5];

// get DET 
var eps = 10e-6;
var det = a*c*f - a*e*e - b*b*f + 2*b*d*e - c*d*d;
var degen = Math.abs(det) < eps ? true : false;
if(degen) console.log("degenerate");

var step = 1/5;
if(degen){
	step = 1/10;
}

var ttemp; // trafo temp
for(var y = ymin; y < ymax; y+=step){
var yback = y;
ttemp = csport.to(0, y);
y = ttemp[1];
var inner = -a*c* Math.pow(y, 2) - 2*a*e*y - a*f + Math.pow(b, 2) * Math.pow(y, 2) + 2*b*d*y  + Math.pow(d, 2);
inner = Math.sqrt(inner);

x1 = 1/a * (-b*y - d + inner);
x2 = -1/a * (b*y + d + inner);

y = yback; // convert y back

var lleft = csport.to(0,0);
var uright = csport.to(csw, csh);

// transform to canvas coordiantes
if(!isNaN(x1)){
ttemp = csport.from(x1, 0, 1);
x1 = ttemp[0];
}
if(!isNaN(x2)){
ttemp = csport.from(x2, 0, 1);
x2 = ttemp[0];
}

	// for ellipsoids we go out of canvas
    if(!isNaN(x1) && type == "ellipsoid"){
    arr_x1.push(x1);
    arr_y1.push(y);
    }
    else if(!isNaN(x1) && x1 > 0 && x1 < csh){
    arr_x1.push(x1);
    arr_y1.push(y);
    }

    if(!isNaN(x2) && type == "ellipsoid"){
    arr_x2.push(x2);
    arr_y2.push(y);
    }
    else if(!isNaN(x2) && x2 > 0 && x2 < csh){
    arr_x2.push(x2);
    arr_y2.push(y);
    }

}
}; // end eval_conic_x

// calc and draw conic
var calc_draw = function(C){
var ymin, ymax, y0, y1;
var ttemp;

var eps = 10e-5;

var lleft = [0, csh];
var uright = [csw, 0];


var type = get_concic_type(C);


if(C.length !== 6)
{
  console.error("Conic needs 6 Parameters");
  return;
}

var a = C[0];
var b = C[1];
var c = C[2];
var d = C[3];
var e = C[4];
var f = C[5];

// get DET 
eps = 10e-5;
var det = a*c*f - a*e*e - b*b*f + 2*b*d*e - c*d*d;
var degen = Math.abs(det) < eps ? true : false;
//if(degen) console.log("degenerate");

//if(type == "parabola" || type == "hyperbola" || true){
y0 = (-a*e + b*d - Math.sqrt(a*(-a*c*f + a*Math.pow(e, 2) + Math.pow(b, 2)*f - 2*b*d*e + c*Math.pow(d,2))))/(a*c - Math.pow(b, 2));
y1 = (-a*e + b*d + Math.sqrt(a*(-a*c*f + a*Math.pow(e, 2) + Math.pow(b, 2)*f - 2*b*d*e + c*Math.pow(d,2))))/(a*c - Math.pow(b, 2));

if(!isNaN(y0)){
	ttemp = csport.from(0, y0, 1);
	y0 = ttemp[1];
}
else{
	y0 = lleft[1];
}

if(!isNaN(y1)){
	ttemp = csport.from(0, y1, 1);
	y1 = ttemp[1];
}
else{
	 y1 = uright[1];
}
// out of bound checks
if(!(type == 'ellipsoid')){
y0 < uright[1] ? y0 = uright[1] : y0 = y0;
y1 < uright[1] ? y1 = uright[1] : y1 = y1;

y0 > lleft[1] ? y0 = lleft[1] : y0 = y0;
y1 > lleft[1] ? y1 = lleft[1] : y1 = y1;
}

y0 < y1 ? ymin = y0 : ymin = y1;
y0 > y1 ? ymax = y0 : ymax = y1;

eval_conic_x(C, 0, ymin); //(, ymin); // TODO
arr_xg = arr_x1.concat(arr_x2.reverse());
arr_yg = arr_y1.concat(arr_y2.reverse());
drawArray(arr_xg, arr_yg, "gold");
//drawArray(arr_xg, arr_yg);

resetArrays();


eval_conic_x(C, ymax, csh);
drawArray(arr_x1, arr_y1);
// Bridge branches
csctx.beginPath();
csctx.moveTo(arr_x1[0], arr_y1[0]);
csctx.lineTo(arr_x2[0], arr_y2[0]);
csctx.stroke();
drawArray(arr_x2, arr_y2, "black");
//drawArray(arr_x2, arr_y2);
// i don't get it why this does not paint correctly with arr_xg / arr_yg
//arr_xg = arr_x1.concat(arr_x2.reverse());
//arr_yg = arr_y1.concat(arr_y2.reverse());
//drawArray(arr_xg, arr_yg, "purple");

var is_inside = function(x, y){
	return (x > 0 && x < csw && y > 0 && y < csh);
}

resetArrays();
eval_conic_x(C, ymin, ymax);
drawArray(arr_x1, arr_y1, "red");
//drawArray(arr_x2, arr_y2, "green");
//drawArray(arr_x1, arr_y1);
// close gap
//if(arr_y1[0] > 0 && arr_y1[0] < csh && arr_y2[0] > 0 && arr_x2[0] < csh && type == 'ellipsoid'){
if(!degen && is_inside(arr_x1[0], arr_y1[0]) && is_inside(arr_x2[0], arr_y2[0]) && type == 'ellipsoid'){
csctx.beginPath();
csctx.moveTo(arr_x1[0], arr_y1[0]);
csctx.lineTo(arr_x2[0], arr_y2[0]);
csctx.stroke()
}
if(!degen && is_inside(arr_x1[arr_x1.length-1], arr_y1[arr_y1.length -1]) && is_inside(arr_x2[arr_x2.length-1], arr_y2[arr_y2.length-1]) && type == 'ellipsoid'){
csctx.beginPath();
csctx.moveTo(arr_x1[arr_x1.length-1], arr_y1[arr_y1.length-1]);
csctx.lineTo(arr_x2[arr_x2.length-1], arr_y2[arr_y2.length-1]);
csctx.stroke();
}

drawArray(arr_x2, arr_y2, "green");
resetArrays();
//} // end if type parabola ellipsoid
//if(type == "ellipsoid" && false){  // remove
//resetArrays();
//eval_conic_x(C, 0, csh);
//arr_xg = arr_x1.concat(arr_x2.reverse());
//arr_yg = arr_y1.concat(arr_y2.reverse());
//// close gap
////var x0 = arr_x1[0];
////var y0 = arr_y1[0];
////var x1 = arr_xg[arr_xg.length - 1];
////var y1 = arr_yg[arr_yg.length - 1];
////if(norm(x0, y0, x1, y1) < 10){
//arr_xg.push(arr_x1[0]);
//arr_yg.push(arr_y1[0]);
////}
////drawArray(arr_xg, arr_yg, "green");
//drawArray(arr_xg, arr_yg);
//} // end if ellipsoid

//var degen;
//if(degen && false){ // TODO Code Stillgelegt
//
//var points = [];
//for(var i = 0; i < args.Cpoints.length; i++){
//var pt = args.Cpoints[i];
//points[i] = [pt.value[0].value.real, pt.value[1].value.real];
//}
//
////console.log(points);
//
//var comb = [ // all point combinations
//[0, 1, 2], 
//[0, 1, 3],
//[0, 1, 4],
//[0, 2, 3],
//[0, 2, 4],
//[0, 3, 4],
//[1, 2, 3],
//[1, 2, 4],
//[1, 3, 4],
//[2, 3, 4]
//];
//
//var test_combination = function(A, B, C){
//
//var M = [
//[A[0], A[1], 1],
//[B[0], B[1], 1],
//[C[0], C[1], 1]
//]
//var det = numeric.det(M);
//return Math.abs(det) < 0.5;
//} // end test_combination
//
//var tested_combinations = [];
//
//for(var i = 0; i < comb.length; i++){
//var k, l, m;
//k = comb[i][0];
//l = comb[i][1];
//m = comb[i][2];
//tested_combinations[i] = test_combination(points[k], points[l], points[m]);
//if(tested_combinations[i]){
////var ttemp = csport.from(points[k][0], points[k][1], 1);
////csctx.beginPath();
////csctx.moveTo(ttemp[0], ttemp[1]);
////ttemp = csport.from(points[l][0], points[l][1], 1);
////csctx.lineTo(ttemp[0], ttemp[1]);
////csctx.stroke();
//}
//} // end loop
//
//
//} // end if degen

resetArrays();
}; // end calc_draw


// actually start drawing
calc_draw(Conic);

} // end evaluator.drawconic

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
                
                li[i]=[xx,yy];
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
            
            li[i]=[xx,yy];
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
    var pxlstep=.2/csscale; //TODO Anpassen auf PortScaling
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
    if(args.length==0) {
        updateCindy();
        
    }
    return nada;
}


evaluator.screenbounds=function(args,modifs){
    if(args.length==0) {
        var pt1=List.realVector(csport.to(0,0));
        pt1.usage="Point";
        var pt2=List.realVector(csport.to(csw,0));
        pt2.usage="Point";
        var pt3=List.realVector(csport.to(csw , csh ));
        pt3.usage="Point";
        var pt4=List.realVector(csport.to(0 , csh ));
        pt4.usage="Point";
        return(List.turnIntoCSList([pt1,pt2,pt3,pt4]));
    
    }
    return nada;

}
