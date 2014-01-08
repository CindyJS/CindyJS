
//*******************************************************
// and here are the definitions of the drawing operators
//*******************************************************



evaluator.draw=function(args,modifs){
    
    var handleModifs = function(){
        
        if(modifs.start!==undefined){
            var erg =evaluate(modifs.start);
            if(erg.ctype=='number'){
                startb=true;
                start=erg.value.real;
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
    csctx.fillStyle="#FF0000";
    
    csctx.arc(xx,yy,3,0,2*Math.PI);
    csctx.fill();
    csctx.stroke();

    
    return erg;
    
}



