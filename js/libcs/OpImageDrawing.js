
//*******************************************************
// and here are the definitions of the image operators
//*******************************************************


evaluator._helper.extractReferenceX=function(w,pos){
    
    
    
    
}

evaluator.drawimage = function(args,modifs){
    
    var drawimg1 = function(){
        
        
        var handleModifs = function(){
            if(modifs.angle!==undefined){
                erg =evaluate(modifs.angle);
                if(erg.ctype=='number'){
                    rot=erg.value.real;
                }
            }
            
            if(modifs.rotation!==undefined){
                erg =evaluate(modifs.rotation);
                if(erg.ctype=='number'){
                    rot=erg.value.real;
                }
            }
            
            if(modifs.scale!==undefined){
                erg =evaluateAndVal(modifs.scale);
                if(erg.ctype=='number'){
                    scax=erg.value.real;
                    scay=erg.value.real;
                }
                if(List.isNumberVector(erg).value && (erg.value.length==2)){
                    scax=erg.value[0].value.real;
                    scay=erg.value[1].value.real;
                }
                
            }
            
            if(modifs.scalex!==undefined){
                erg =evaluate(modifs.scalex);
                if(erg.ctype=='number'){
                    scax=erg.value.real;
                }
            }
            
            if(modifs.scaley!==undefined){
                erg =evaluate(modifs.scaley);
                if(erg.ctype=='number'){
                    scay=erg.value.real;
                }
            }
            
            if(modifs.flipx!==undefined){
                erg =evaluate(modifs.flipx);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipx=-1};
                }
            }
            
            if(modifs.flipy!==undefined){
                erg =evaluate(modifs.flipy);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipy=-1};
                }
            }
            
            
            if(modifs.alpha!==undefined){
                erg =evaluate(modifs.alpha);
                if(erg.ctype=='number'){
                    alpha=erg.value.real;
                }
                
            }
            
            
            
            
            
        }
        
        
        var scax=1;
        var scay=1;
        var flipx=1;
        var flipy=1;
        var rot=0;
        var alpha=1;
        
        var pt=evaluator._helper.extractPoint(v0);
        if(!pt.ok || img.ctype!='string'){
            return nada;
        }
        
        csctx.save();
        handleModifs();
        
        
        var m=csport.drawingstate.matrix;
        var initm=csport.drawingstate.initialmatrix;
        
        
        var w=images[img.value].width;
        var h=images[img.value].height;
        
        //TODO das ist für die Drehungen im lokaen koordinatensystem
        //sollte eigentlich einfacher gehen
        
        var xx=pt.x*m.a-pt.y*m.b+m.tx;
        var yy=pt.x*m.c-pt.y*m.d-m.ty;
        
        var xx1=(pt.x+1)*m.a-pt.y*m.b+m.tx-xx;
        var yy1=(pt.x+1)*m.c-pt.y*m.d-m.ty-yy;
        
        var ixx=pt.x*initm.a-pt.y*initm.b+initm.tx;
        var iyy=pt.x*initm.c-pt.y*initm.d-initm.ty;
        
        var ixx1=(pt.x+1)*initm.a-pt.y*initm.b+initm.tx-ixx;
        var iyy1=(pt.x+1)*initm.c-pt.y*initm.d-initm.ty-iyy;
        
        var sc=Math.sqrt(xx1*xx1+yy1*yy1)/Math.sqrt(ixx1*ixx1+iyy1*iyy1);
        var ang=-Math.atan2(xx1,yy1)+Math.atan2(ixx1,iyy1);
        
        
        
        if(alpha!=1)
            csctx.globalAlpha = alpha;
        
        csctx.translate(xx,yy);
        csctx.scale(scax*flipx*sc,scay*flipy*sc);
        
        
        csctx.rotate(rot+ang);
        
        
        csctx.translate(-xx,-yy);
        csctx.translate(-w/2,-h/2);
        
        
        csctx.drawImage(images[img.value], xx, yy);
        csctx.globalAlpha = 1;
        
        csctx.restore();
        
        
    }
    

    
    var drawimg3 = function(){
        var alpha=1;
        var flipx=1;
        var flipy=1;
        var aspect=1;
        
        var handleModifs = function(){
            
            if(modifs.alpha!==undefined){
                erg =evaluate(modifs.alpha);
                if(erg.ctype=='number'){
                    alpha=erg.value.real;
                }
                
            }
              if(modifs.aspect!==undefined){
                erg =evaluate(modifs.aspect);
                if(erg.ctype=='number'){
                    aspect=erg.value.real;
                }
                
            }
            
            if(modifs.flipx!==undefined){
                erg =evaluate(modifs.flipx);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipx=-1};
                }
            }
            
            if(modifs.flipy!==undefined){
                erg =evaluate(modifs.flipy);
                if(erg.ctype=='boolean'){
                    if(erg.value){flipy=-1};
                }
            }
            
        }
        
        
        
        var pt1=evaluator._helper.extractPoint(v0);
        var pt2=evaluator._helper.extractPoint(v1);
        var pt3;
        
        
        if(!pt1.ok ||!pt2.ok  || img.ctype!='string'){
            return nada;
        }
       // console.lof(JSON.stringify(images));
        if(images===undefined || images[img.value]=='undefined')
            return;
        var w=images[img.value].width;
        var h=images[img.value].height;
        

        
        if(v2==0){
        
          pt3={};
          pt3.x=pt1.x-(pt2.y-pt1.y);
          pt3.y=pt1.y+(pt2.x-pt1.x);
          aspect=h/w;
        
        } else {
            var pt3=evaluator._helper.extractPoint(v2);
            if(!pt1.ok) return nada;
        }

        csctx.save();
        handleModifs();
        
        
        var m=csport.drawingstate.matrix;
        var initm=csport.drawingstate.initialmatrix;
        
        
              
        
        if(alpha!=1)
            csctx.globalAlpha = alpha;
        
        var xx1=pt1.x*m.a-pt1.y*m.b+m.tx;
        var yy1=pt1.x*m.c-pt1.y*m.d-m.ty;

        var xx2=pt2.x*m.a-pt2.y*m.b+m.tx;
        var yy2=pt2.x*m.c-pt2.y*m.d-m.ty;

        var xx3=pt3.x*m.a-pt3.y*m.b+m.tx;
        var yy3=pt3.x*m.c-pt3.y*m.d-m.ty;

        csctx.transform(xx2-xx1,yy2-yy1,xx3-xx1,yy3-yy1,xx1,yy1);
        csctx.scale(1/w,-1/h*aspect);
        
        csctx.translate(w/2,-h/2);
        csctx.scale(flipx,flipy);
        csctx.translate(-w/2,h/2);

        csctx.translate(0,-h);

        
        
        csctx.drawImage(images[img.value], 0,0);
        csctx.globalAlpha = 1;
        
        csctx.restore();
        
        
    }
    
    
    
    
    
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var img=evaluateAndVal(args[1]);
        
        return drawimg1();
    }
    
    if(args.length==3) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var v2=0;
        var img=evaluateAndVal(args[2]);
        
        return drawimg3();
    }

    
    if(args.length==4) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var v2=evaluateAndVal(args[2]);
        var img=evaluateAndVal(args[3]);
        
        return drawimg3();
    }
    
    return nada;
}


