
//*******************************************************
// and here are the definitions of the operators
//*******************************************************



evaluator.seconds=function(args,modifs){  //OK
    return {"ctype":"number" ,  "value":{'real':(new Date().getTime() / 1000),'imag':0}};
}



evaluator.err=function(args,modifs){      //OK
    
    if(typeof csconsole=="undefined"){
        csconsole=window.open('','','width=200,height=100');
    
    }
  
    
    if(args[0].ctype=='variable'){
        // var s=evaluate(args[0].value[0]);
        var s=evaluate(namespace.getvar(args[0].name));
        console.log(args[0].name+" ==> "+niceprint(s));
        csconsole.document.write(args[0].name+" ==> "+niceprint(s)+"<br>");
        
    } else {
        var s=evaluate(args[0]);        
        console.log(" ==> "+niceprint(s));
        csconsole.document.writeln(" ==> "+niceprint(s)+"<br>");
        
    }
    return nada;
}

evaluator.errc=function(args,modifs){      //OK
    
    
    if(args[0].ctype=='variable'){
        // var s=evaluate(args[0].value[0]);
        var s=evaluate(namespace.getvar(args[0].name));
        console.log(args[0].name+" ==> "+niceprint(s));

    } else {
        var s=evaluate(args[0]);
        console.log(" ==> "+niceprint(s));
        
    }
    return nada;
}



evaluator.repeat=function(args,modifs){    //OK
    var handleModifs = function(){
        
        if(modifs.start!==undefined){
            var erg =evaluate(modifs.start);
            if(erg.ctype=='number'){
                startb=true;
                start=erg.value.real;
            }
        }
        if(modifs.step!==undefined){
            var erg =evaluate(modifs.step);
            if(erg.ctype=='number'){
                stepb=true;
                step=erg.value.real;
            }
        }
        if(modifs.stop!==undefined){
            var erg =evaluate(modifs.stop);
            if(erg.ctype=='number'){
                stopb=true;
                stop=erg.value.real;
            }
        }
        
        
        if (startb && !stopb && !stepb) {
            stop = step * n + start;
        }
        
        if (!startb && stopb && !stepb) {
            start = -step * (n - 1) + stop;
            stop += step;
        }
        
        if (!startb && !stopb && stepb) {
            stop = step * n + start;
        }
        
        if (startb && stopb && !stepb) {
            step = (stop - start) / (n - 1);
            stop += step;
        }
        
        if (startb && !stopb && stepb) {
            stop = step * n + start;
        }
        
        if (!startb && stopb && stepb) {
            start = -step * (n - 1) + stop;
            stop += step;
        }
        
        if (startb && stopb && stepb) {
            stop += step;
        }
    }
    
    
    var v1=evaluateAndVal(args[0]);
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
            
        }
    }
    if(v1.ctype!='number'){
        return nada;
    }
    var n=Math.round(v1.value.real);//TODO: conversion to real!!!
    var step=1;
    var start=1;
    var stop=n+1;
    var startb=false;
    var stopb=false;
    var stepb=false;
    handleModifs();
    if ((start <= stop && step > 0) || (start >= stop && step < 0))
        if (startb && stopb && stepb) {
            n = Math.floor((stop - start) / step);
        }
    
    namespace.newvar(lauf);
    var erg;
    for(var i=0;i<n;i++){
        namespace.setvar(lauf,{'ctype':'number','value':{'real':i * step + start, 'imag':0}});
        erg=evaluate(args[argind]);
    }
    namespace.removevar(lauf);
    
    return erg;
    
}


evaluator.apply=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        erg[erg.length]=evaluate(args[argind]);
    }
    namespace.removevar(lauf);
    
    return {'ctype':'list','value':erg};
    
}

evaluator.forall=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    var res;
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        res=evaluate(args[argind]);
        erg[erg.length]=res;
    }
    namespace.removevar(lauf);
    
    return res;
    
}

evaluator.select=function(args,modifs){ //OK
    
    var v1=evaluateAndVal(args[0]);
    if(v1.ctype!='list'){
        return nada;
    }
    var argind=args.length-1;
    
    var lauf='#';
    if(args.length==3) {
        if(args[1].ctype=='variable'){
            lauf=args[1].name;
        }
    }
    
    var li=v1.value;
    var erg=[];
    namespace.newvar(lauf);
    for(var i=0;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        var res=evaluate(args[argind]);
        if(res.ctype=='boolean'){
            if(res.value==true){
                erg[erg.length]=li[i];
            }
        }
    }
    namespace.removevar(lauf);
    
    return {'ctype':'list','value':erg};
    
}






evaluator.semicolon=function(args,modifs){ //OK
    var u0=(args[0].ctype== 'void');
    var u1=(args[1].ctype== 'void');
    
    if(u0 && u1 ){
        return nada;
    }
    if(!u0 && u1 ){
        return evaluate(args[0]);
    }
    if(!u0 && !u1 ){
        evaluate(args[0]);  //Wegen sideeffects
    }
    if(!u1 ){
        return evaluate(args[1]);
    }
    return nada;
}


evaluator.genList=function(args,modifs){
    var erg=[];
    for(var i=0;i<args.length;i++){
        erg[erg.length]=evaluate(args[i]);
    }
    return {'ctype':'list','value':erg};
}

evaluator.assign=function(args,modifs){
    
    var u0=(args[0].ctype== 'undefined');
    var u1=(args[1].ctype== 'undefined');
    
    if(u0 || u1 ){
        return nada;
    }
    if(args[0].ctype=='variable' ){
        namespace.setvar(args[0].name,evaluate(args[1]));
    }
    
    return args[0].value;
}


evaluator.define=function(args,modifs){
    
    var u0=(args[0].ctype== 'undefined');
    var u1=(args[1].ctype== 'undefined');
    
    if(u0 || u1 ){
        return nada;
    }
    if(args[0].ctype=='function' ){
        var fname=args[0].oper;
        var ar=args[0].args;
        var body=args[1];
        myfunctions[fname+ar.length]={
            'oper':fname,
            'body':body,
            'arglist':ar
        };
    }
    
    return nada;
}


evaluator.if=function(args,modifs){  //OK
    
    var u0=(args[0].ctype== 'undefined');
    var u1=(args[1].ctype== 'undefined');
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='boolean'){
        if(v0.value==true){
            return evaluate(args[1]);
        } else if (args.length==3){
            return evaluate(args[2]);
        }
    }
    
    return nada;
    
}

evaluator.equals=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return {'ctype':'boolean' ,
            'value':(v0.value.real==v1.value.real)&&
            (v0.value.imag==v1.value.imag)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' ,
            'value':(v0.value==v1.value)  }
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        var erg=List.equals(v0,v1);
        return erg;
    }
    return {'ctype':'boolean' ,'value':false  };
}

evaluator.sequence=function(args,modifs){  //OK
    var v0=evaluate(args[0]);
    var v1=evaluate(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return List.sequence(v0,v1)
    }
    return nada;
}




evaluator.add=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype == 'void'  && v1.ctype=='number' ){   //Monadisches Plus
        return Number.clone(v1);
    }
    
    if(v0.ctype=='number'  && v1.ctype=='number' ){
        return Number.add(v0,v1);
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {"ctype":"string" ,  "value":v0.value+v1.value}
    }
    if(v0.ctype=='number' && v1.ctype=='string' ){
        return {"ctype":"string" ,  "value":v0.value.real+v1.value}
    }
    if(v0.ctype=='string' && v1.ctype=='number' ){
        return {"ctype":"string" ,  "value":v0.value+v1.value.real}
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        return List.add(v0,v1)
    }
    return nada;
    
}


evaluator.minus=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype == 'void'  && v1.ctype=='number' ){   //Monadisches Plus
        return Number.neg(v1);
    }
    
    if(v0.ctype == 'void'  && v1.ctype=='list' ){   //Monadisches Plus
        return List.neg(v1);
    }
    
    if(v0.ctype=='number'  && v1.ctype=='number' ){
        return Number.sub(v0,v1);
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        return List.sub(v0,v1)
    }
    return nada;
    
}

evaluator.mult=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return Number.mult(v0,v1);
    }
    if(v0.ctype=='number' &&v1.ctype=='list' ){
        return List.scalmult(v0,v1);
    }
    if(v0.ctype=='list' &&v1.ctype=='number' ){
        return List.scalmult(v1,v0);
    }
    if(v0.ctype=='list' &&v1.ctype=='list' ){
        return List.scalproduct(v0,v1);
    }
    return nada;
}

evaluator.div=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return Number.div(v0,v1);
    }
    if(v0.ctype=='list' &&v1.ctype=='number' ){
        return List.scaldiv(v1,v0);
    }
    return nada;
    
}



evaluator.mod=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return Number.mod(v0,v1);
    }
    return nada;
    
}

evaluator.pow=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return Number.pow(v0,v1);
    }
    return nada;
    
}


///////////////////////////////
//     UNARY MATH OPS        //
///////////////////////////////



evaluator.exp=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.exp(v0);
    }
    return nada;    
}

evaluator.sin=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.sin(v0);
    }
    return nada;
}

evaluator.sqrt=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.sqrt(v0);
    }
    return nada;
}


evaluator.cos=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.cos(v0);
    }
    return nada;
}


evaluator.tan=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.tan(v0);
    }
    return nada;
}

evaluator.arccos=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.arccos(v0);
    }
    return nada;
}


evaluator.arcsin=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.arcsin(v0);
    }
    return nada;
}


evaluator.arctan=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.arctan(v0);
    }
    return nada;
}

evaluator.arctan2=function(args,modifs){
    
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        if(v0.ctype=='number' &&v1.ctype=='number'){
            return Number.arctan2(v0,v1);
        }
    }
    
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' &&v0.value.length==2){
            var tmp=v0.value;
            if(tmp[0].ctype=='number' && tmp[1].ctype=='number') {
                return evaluator.arctan2(tmp,modifs);
            }
        }
    }
    return nada;
}




evaluator.log=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number.log(v0);
    }
    return nada;
    
}




evaluator.recursive=function(args,op){//OK dieses konstrukt frisst evtl ein klein wenig performance, let's try
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return Number[op](v0);
    }
    if(v0.ctype=='list' ){
        return List[op](v0);
    }
    return nada;
    
}

evaluator.im=function(args,modifs){
    return evaluator.recursive(args,"im");
}


evaluator.re=function(args,modifs){
    return evaluator.recursive(args,"re");
}


evaluator.conjugate=function(args,modifs){
    return evaluator.recursive(args,"conjugate");
}


evaluator.round=function(args,modifs){
    return evaluator.recursive(args,"round");
}


evaluator.ceil=function(args,modifs){
    return evaluator.recursive(args,"ceil");
}


evaluator.floor=function(args,modifs){
    return evaluator.recursive(args,"floor");
}


evaluator.abs=function(args,modifs){
    return evaluator.recursive(args,"abs");
}

///////////////////////////////
//        RANDOM             //
///////////////////////////////

evaluator.random=function(args,modifs){
    if(args.length==0){
        return Number.real(Number.helper.rand());
    }
    
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return Number.complex(v0.value.real*Number.helper.rand(),v0.value.imag*Number.helper.rand());
        }
    }
    return nada;

}

evaluator.random=function(args,modifs){
    if(args.length==0){
        return Number.real(Number.helper.rand());
    }
    
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return Number.complex(v0.value.real*Number.helper.rand(),v0.value.imag*Number.helper.rand());
        }
    }
    return nada;
    
}

evaluator.seedrandom=function(args,modifs){
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            Number.helper.seedrandom(v0.value.real);
        }
    }
    return nada;
    
}




evaluator.randomnormal=function(args,modifs){

    if(args.length==0){
        return Number.real(Number.helper.randnormal());
    }
    return nada;
    
}


evaluator.randominteger=function(args,modifs){
    return evaluator.randomint(args,modifs);
}


evaluator.randombool=function(args,modifs){
    
    if(args.length==0){
        if(Number.helper.rand()>0.5){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };

    }
    
    return nada;

}


///////////////////////////////
//        TYPECHECKS         //
///////////////////////////////

evaluator.isreal=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(Number.helper.isAlmostReal(v0)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.isinteger=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(Number.helper.isAlmostReal(v0)&&
               v0.value.real==Math.floor(v0.value.real)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}


evaluator.iseven=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(Number.helper.isAlmostReal(v0)&&
               v0.value.real/2==Math.floor(v0.value.real/2)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.isodd=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            if(Number.helper.isAlmostReal(v0)&&
               (v0.value.real-1)/2==Math.floor((v0.value.real-1)/2)){
                return {'ctype':'boolean' ,'value':true  };
            }
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}




evaluator.iscomplex=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number' ){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}




evaluator.isstring=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='string' ){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.islist=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list' ){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}


evaluator.ismatrix=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if((List.helper.colNumb(v0))!=-1){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}

evaluator.isnumbermatrix=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if((List.isNumberMatrix(v0)).value){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}




evaluator.isnumbervector=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if((List.isNumberVector(v0)).value){
            return {'ctype':'boolean' ,'value':true  };
        }
        return {'ctype':'boolean' ,'value':false  };
    }
    return nada;
}



///////////////////////////////
//         GEOMETRY          //
///////////////////////////////


evaluator.complex=function(args,modifs){
    
    if(args.length==1){
        
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            if(List.isNumberVector(v0)) {
                if(v0.value.length==2){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    return Number.complex(a.value.real-b.value.imag,b.value.real+a.value.imag);
                }
                if(v0.value.length==3){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    var c=v0.value[2];
                    a=Number.div(a,c);
                    b=Number.div(b,c);
                    return Number.complex(a.value.real-b.value.imag,b.value.real+a.value.imag);
                }

            }
        }
    }
    return nada;
}

evaluator.gauss=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return List.realVector([v0.value.real,v0.value.imag]);
        }
    }
    return nada;
}




