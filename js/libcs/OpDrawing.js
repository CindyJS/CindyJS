
//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************



evaluator.helper.extractPoint=function(v1){
    var erg={};
    erg.ok=false;
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
            n1=Number.div(n1,n3);
            n2=Number.div(n2,n3);
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
    var size=4;
    var col;
    var black="rgb(0,0,0)";
    var handleModifs = function(type){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
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
        var xx1=pt1.x*25+250;
        var yy1=-pt1.y*25+250;
        var xx2=pt2.x*25+250;
        var yy2=-pt2.y*25+250;
        col=csport.drawingstate.linecolor
        
        handleModifs("L");
        
        csctx.beginPath();
        csctx.moveTo(xx1, yy1);
        csctx.lineTo(xx2, yy2);
        csctx.lineWidth = size*.4;
        csctx.lineCap = 'round';
        
        //        csctx.strokeStyle="#0000FF";
        //        csctx.strokeStyle="rgba(0,0,255,0.2)";
        csctx.strokeStyle=col;
        csctx.stroke();
    }
    
    var drawsegment = function(){

        var v1=evaluateAndVal(args[0]);
        var v2=evaluateAndVal(args[1]);
        var pt1=evaluator.helper.extractPoint(v1);
        var pt2=evaluator.helper.extractPoint(v2);
        if(!pt1.ok||!pt2.ok){
            return nada;
        }
      
        drawsegcore(pt1,pt2);
        
        return nada;
    }
    
    var drawline = function(){
        var na=Number.abs(v1.value[0]).value.real;
        var nb=Number.abs(v1.value[1]).value.real;
        var nc=Number.abs(v1.value[2]).value.real;
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
        var a=Number.div(v1.value[0],divi);
        var b=Number.div(v1.value[1],divi);
        var c=Number.div(v1.value[2],divi);//TODO Realitycheck einbauen
        

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
        var pt=evaluator.helper.extractPoint(v1);
        
        
        if(!pt.ok){
            return nada;
        }
        var xx=pt.x*25+250;
        var yy=-pt.y*25+250;
        
        col=csport.drawingstate.pointcolor
        handleModifs("P");
        csctx.lineWidth = size*.3;
        
        
        csctx.beginPath();
        csctx.arc(xx,yy,size,0,2*Math.PI);
        csctx.fillStyle=col;
        
        csctx.fill();
        
        csctx.beginPath();
        csctx.arc(xx,yy,size*1.15,0,2*Math.PI);
        csctx.fillStyle=black;
        csctx.strokeStyle=black;
        csctx.stroke();
    }
    
    
    if(args.length==2) {
        return drawsegment();
    }
    var v1=evaluateAndVal(args[0]);

    if(v1.usage=="Line"){
        return drawline();

    }
    return drawpoint();


    

    
    
}

evaluator.drawcircle=function(args,modifs){
  evaluator.helper.drawcircle(args,modifs,"D");
}


evaluator.fillcircle=function(args,modifs){
  evaluator.helper.drawcircle(args,modifs,"F");
}

evaluator.helper.drawcircle=function(args,modifs,df){
    var erg;
    var size=4;
    var col;
    var black="rgb(0,0,0)";
    var handleModifs = function(){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
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
    
        var pt=evaluator.helper.extractPoint(v0);
        
        
        if(!pt.ok || v1.ctype!='number'){
            return nada;
        }
        var xx=pt.x*25+250;
        var yy=-pt.y*25+250;
        
        col=csport.drawingstate.linecolor;
        handleModifs();
        csctx.lineWidth = size*.3;
        
        
        
        csctx.beginPath();
        csctx.lineWidth = size*.4;

        csctx.arc(xx,yy,v1.value.real*25,0,2*Math.PI);
        if(df=="D"){
            csctx.strokeStyle=col;
            csctx.stroke();
        }
        if(df=="F"){
            csctx.fillStyle=col;
            csctx.fill();
        }
    }
    
    
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
    
        return drawcirc();
    }

    return nada;
}


evaluator.drawpoly=function(args,modifs){
  evaluator.helper.drawpolygon(args,modifs,"D");
}


evaluator.fillpoly=function(args,modifs){
  evaluator.helper.drawpolygon(args,modifs,"F");
}

evaluator.drawpolygon=function(args,modifs){
  evaluator.helper.drawpolygon(args,modifs,"D");
}


evaluator.fillpolygon=function(args,modifs){
  evaluator.helper.drawpolygon(args,modifs,"F");
}


evaluator.helper.drawpolygon=function(args,modifs,df){
    var erg;
    var size=4;
    var col;
    var black="rgb(0,0,0)";
    var handleModifs = function(){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
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
    
    
    var drawpoly = function(){
    
        var li=[];
        for(var i=0;i<v0.value.length;i++){
            var pt=evaluator.helper.extractPoint(v0.value[i]);
            if(!pt.ok ){
                return nada;
            }
            li[li.length]=[pt.x*25+250,-pt.y*25+250];
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
        csctx.closePath();
        if(df=="D"){
            csctx.strokeStyle=col;
            csctx.stroke();
        }
        if(df=="F"){
            csctx.fillStyle=col;
            csctx.fill();
        }
    }
    
    
    if(args.length==1) {
        var v0=evaluate(args[0]);
        if (v0.ctype=='list'){
            return drawpoly();
        
        }
    
    }

    return nada;
}





