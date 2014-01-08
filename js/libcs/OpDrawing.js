
//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************



evaluator.draw=function(args,modifs){
    var erg;

    var handleModifs = function(){
        if(modifs.size!==undefined){
            erg =evaluate(modifs.size);
            if(erg.ctype=='number'){
                size=erg.value.real;
            }
        }

    }
    
    var drawline = function(){
    
        return nada;
    }
    
    
    if(args.length==2) {
        return drawline;
    }
    var v1=evaluateAndVal(args[0]);
    var size=4;
    if(v1.ctype!='list'){
        return nada;
    }
    
    var pt1=v1.value;
    var x=0;
    var y=0;
    var z=0;
    if(pt1.length==2){
        var n1=pt1[0];
        var n2=pt1[1];
        if(n1.ctype=='number' && n2.ctype=='number'){
            x=n1.value.real;
            y=n2.value.real;
        }
    }
    
    var xx=x*25+250;
    var yy=-y*25+250;
    
    
    handleModifs();

    csctx.beginPath();
    csctx.arc(xx,yy,size*1.1,0,2*Math.PI);
    csctx.fillStyle="#000000";
    csctx.fill();
    csctx.beginPath();

    csctx.arc(xx,yy,size,0,2*Math.PI);
    csctx.fillStyle="#FF0000";
    csctx.fill();
//    csctx.stroke();

    
    return erg;
    
}



