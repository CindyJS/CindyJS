
//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************
evaluator.drawingstate={};
evaluator.drawingstate.linecolor="rgb(0,0,255)";
evaluator.drawingstate.linecolorraw=[0,0,1];
evaluator.drawingstate.pointcolor="rgb(255,200,0)";
evaluator.drawingstate.pointcolorraw=[1,0,0];
evaluator.drawingstate.alpha=1.0;

function HSVtoRGB(h, s, v) {
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
    return {
    r: Math.floor(r * 255),
    g: Math.floor(g * 255),
    b: Math.floor(b * 255)
    };
}

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
        var alpha=evaluator.drawingstate.alpha;
        if(type=="P"){
            r=evaluator.drawingstate.pointcolorraw[0]*255;
            g=evaluator.drawingstate.pointcolorraw[1]*255;
            b=evaluator.drawingstate.pointcolorraw[2]*255;
        }
        if(type=="L"){
            r=evaluator.drawingstate.linecolorraw[0]*255;
            g=evaluator.drawingstate.linecolorraw[1]*255;
            b=evaluator.drawingstate.linecolorraw[2]*255;
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
        col=evaluator.drawingstate.linecolor
        
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
        
        col=evaluator.drawingstate.pointcolor
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





     

