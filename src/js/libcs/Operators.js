
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
    
    var varname = '', s;
    if(args[0].ctype=='variable'){
        varname = args[0].name;
        s = namespace.getvar(args[0].name);
    } else {
        s = args[0];
    }
    s = varname + " ==> " + niceprint(evaluate(s));
    if (console && console.log)
        console.log(s);
    if (csconsole)
        csconsole.document.write(s + "<br>");
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

evaluator.dump=function(args,modifs){      
    
    dump(args[0]);
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


evaluator.while=function(args,modifs){ //OK
    
    var prog=args[1];
    var test=args[0];
    var bo=evaluate(test);
    var erg=nada;
    while(bo.ctype!='list' && bo.value) {
        erg=evaluate(prog);
        bo=evaluate(test)
    }
    
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


evaluator.createvar=function(args,modifs){ //OK
    

    if(args.length==1) {
        if(args[0].ctype=='variable'){
            var v=args[0].name;
            namespace.newvar(v);
        }
    }
        
    return nada;
    
}

evaluator.local=function(args,modifs){ //OK
    
    for(var i=0;i<args.length;i++){
        if(args[i].ctype=='variable'){
            var v=args[i].name;
            namespace.newvar(v);
        }
    }
        
    return nada;
    
}




evaluator.removevar=function(args,modifs){ //OK
    

    if(args.length==1) {
        var ret=evaluate(args[0]);

        if(args[0].ctype=='variable'){
            var v=args[0].name;
            namespace.removevar(v);
        }
        return ret;
    }
        
    return nada;
    
}



evaluator.release=function(args,modifs){ //OK
    
    if(args.length==0) 
        return nada;

    
    var ret=evaluate(args[args.length-1]);

    for(var i=0;i<args.length;i++){
        if(args[i].ctype=='variable'){
            var v=args[i].name;
            namespace.removevar(v);
        }
    }
        
    return ret;
    
}

evaluator.regional=function(args,modifs){ //OK
    
    for(var i=0;i<args.length;i++){
        if(args[i].ctype=='variable'){
            var v=args[i].name;
            namespace.newvar(v);
            namespace.pushVstack(v);
        }
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


evaluator._helper.assigntake=function(data,what){//TODO: Bin nicht ganz sicher obs das so tut
    var where=evaluate(data.args[0]);
    var ind=evaluateAndVal(data.args[1]);
    
    if(where.ctype=='list'||where.ctype=='string'){
        var ind1=Math.floor(ind.value.real);
        if (ind1<0){
            ind1=where.value.length+ind1+1;
        }
        if(ind1>0 && ind1<where.value.length+1){ 
            if(where.ctype=='list')  {  
                where.value[ind1-1]=evaluate(what);
            } else{
                var str=where.value;
                str=str.substring(0,ind1-1)+niceprint(evaluate(what))+str.substring(ind1,str.length);
                where.value=str;
            }
        }
    }
    
    return nada;
    
}


evaluator._helper.assigndot=function(data,what){
    var where=evaluate(data.obj);
    var field=data.key;
    if(where && field){
        Accessor.setField(where.value,field,evaluate(what));       
    }
    
    return nada;
    
}



evaluator._helper.assignlist=function(vars,vals){
    var n=vars.length;
    var m=vals.length;
    if(m<n) n=m;

    for(var i=0;i<n;i++){
       var name=vars[i];
       var val=vals[i];
       evaluator.assign([name,val],[]);
    
    }
    

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
    if(args[0].ctype=='infix' ){
        if(args[0].oper=='_'){
            evaluator._helper.assigntake(args[0],args[1]);
        }
    }
    if(args[0].ctype=='field' ){
        evaluator._helper.assigndot(args[0],args[1]);
    }

    if(args[0].ctype=='function' &&args[0].oper=='genList' ){
        var v1=evaluate(args[1]);
        if(v1.ctype=="list"){
            
            evaluator._helper.assignlist(args[0].args,v1.value);
        }
        
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
        if (evaluator[fname] !== undefined)
            console.log("Warning: cannot redefine built-in function " + fname);
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

evaluator.comp_equals=function(args,modifs){  
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

evaluator.comp_notequals=function(args,modifs){  
    var erg=evaluator.comp_equals(args,modifs);
    erg.value=!erg.value;
    return erg;
}


evaluator.comp_almostequals=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return {'ctype':'boolean' ,
            'value':CSNumber._helper.isAlmostEqual(v0,v1)  }
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
        var erg=List.almostequals(v0,v1);
        return erg;
    }
    return {'ctype':'boolean' ,'value':false  };
}


evaluator.and=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(v0.value && v1.value)  }
    }
    
    return nada;
}


evaluator.or=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(v0.value || v1.value)  }
    }
    
    return nada;
}



evaluator.xor=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='boolean' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(v0.value != v1.value)  }
    }
    
    return nada;
}


evaluator.not=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='void' && v1.ctype=='boolean' ){
        return {'ctype':'boolean' , 'value':(!v1.value)  }
    }
    
    return nada;
}


evaluator.numb_degree=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype=='number' && v1.ctype=='void' ){
        return CSNumber.mult(v0,CSNumber.real(Math.PI/180));
    }
    
    return nada;
}




evaluator.comp_notalmostequals=function(args,modifs){  
    var erg=evaluator.comp_almostequals(args,modifs);
    erg.value=!erg.value;
    return erg;
}




evaluator.comp_ugt=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>v1.value.real+CSNumber.eps)  }
    }
    return nada;
}

evaluator.comp_uge=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>v1.value.real-CSNumber.eps)  }
    }
    return nada;
}

evaluator.comp_ult=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<v1.value.real-CSNumber.eps)  }
    }
    return nada;
}

evaluator.comp_ule=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<v1.value.real+CSNumber.eps)  }
    }
    return nada;
}



evaluator.comp_gt=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value>v1.value)  }
    }
    return nada;
}


evaluator.comp_ge=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real>=v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value>=v1.value)  }
    }
    return nada;
}


evaluator.comp_le=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<=v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value<=v1.value)  }
    }
    return nada;
}

evaluator.comp_lt=function(args,modifs){  
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        if(CSNumber._helper.isAlmostReal(v0)&&CSNumber._helper.isAlmostReal(v0))
            return {'ctype':'boolean' , 'value':(v0.value.real<v1.value.real)  }
    }
    if(v0.ctype=='string' && v1.ctype=='string' ){
        return {'ctype':'boolean' ,'value':(v0.value<v1.value)  }
    }
    return nada;
}





evaluator.sequence=function(args,modifs){  //OK
    var v0=evaluate(args[0]);
    var v1=evaluate(args[1]);
    if(v0.ctype=='number' && v1.ctype=='number' ){
        return List.sequence(v0,v1)
    }
    return nada;
}



evaluator._helper.genericListMath1=function(args,op){ //OK
    
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
    
    if(li.length==0){
        return nada;
    }
    namespace.newvar(lauf);
    namespace.setvar(lauf,li[0]);
    var erg=evaluate(args[argind]);
    for(var i=1;i<li.length;i++){
        namespace.setvar(lauf,li[i]);
        var b=evaluate(args[argind]);
        erg=General[op](erg,b);
    }
    namespace.removevar(lauf);
     return erg;
    
}


evaluator._helper.genericListMath=function(args,op){
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return erg = List.genericListMath(v0,op);
            
        }
    }
    return evaluator._helper.genericListMath1(args,op);
}


evaluator.product=function(args,modifs){
    return evaluator._helper.genericListMath(args,"mult");
}


evaluator.sum=function(args,modifs){
    return evaluator._helper.genericListMath(args,"add");
}


evaluator.max=function(args,modifs){
    return evaluator._helper.genericListMath(args,"max");
}

evaluator.min=function(args,modifs){
    return evaluator._helper.genericListMath(args,"min");
}



evaluator.add=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    return General.add(v0,v1);
    
}


evaluator.minus=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v0.ctype == 'void'  && v1.ctype=='number' ){   //Monadisches Plus
        return CSNumber.neg(v1);
    }
    
    if(v0.ctype == 'void'  && v1.ctype=='list' ){   //Monadisches Plus
        return List.neg(v1);
    }
    
    if(v0.ctype=='number'  && v1.ctype=='number' ){
        return CSNumber.sub(v0,v1);
    }
    if(v0.ctype=='list' && v1.ctype=='list' ){
        return List.sub(v0,v1)
    }
    return nada;
    
}

evaluator.mult=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    return General.mult(v0,v1);
}

evaluator.div=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    return General.div(v0,v1);
    
}



evaluator.mod=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.mod(v0,v1);
    }
    return nada;
    
}

evaluator.pow=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return CSNumber.pow(v0,v1);
    }
    return nada;
    
}


///////////////////////////////
//     UNARY MATH OPS        //
///////////////////////////////



evaluator.exp=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.exp(v0);
    }
    return nada;    
}

evaluator.sin=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.sin(v0);
    }
    return nada;
}

evaluator.sqrt=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.sqrt(v0);
    }
    return nada;
}


evaluator.cos=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.cos(v0);
    }
    return nada;
}


evaluator.tan=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.tan(v0);
    }
    return nada;
}

evaluator.arccos=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.arccos(v0);
    }
    return nada;
}


evaluator.arcsin=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.arcsin(v0);
    }
    return nada;
}


evaluator.arctan=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber.arctan(v0);
    }
    return nada;
}

evaluator.arctan2=function(args,modifs){
    
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        if(v0.ctype=='number' &&v1.ctype=='number'){
            return CSNumber.arctan2(v0,v1);
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
        return CSNumber.log(v0);
    }
    return nada;
    
}




evaluator.recursive=function(args,op){//OK dieses konstrukt frisst evtl ein klein wenig performance, let's try
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number' ){
        return CSNumber[op](v0);
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
        return CSNumber.real(CSNumber._helper.rand());
    }
    
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return CSNumber.complex(v0.value.real*CSNumber._helper.rand(),v0.value.imag*CSNumber._helper.rand());
        }
    }
    return nada;
    
}

evaluator.random=function(args,modifs){
    if(args.length==0){
        return CSNumber.real(CSNumber._helper.rand());
    }
    
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            return CSNumber.complex(v0.value.real*CSNumber._helper.rand(),v0.value.imag*CSNumber._helper.rand());
        }
    }
    return nada;
    
}

evaluator.seedrandom=function(args,modifs){
    if(args.length==1 ){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number' ){
            CSNumber._helper.seedrandom(v0.value.real);
        }
    }
    return nada;
    
}




evaluator.randomnormal=function(args,modifs){
    
    if(args.length==0){
        return CSNumber.real(CSNumber._helper.randnormal());
    }
    return nada;
    
}


evaluator.randominteger=function(args,modifs){
    return evaluator.randomint(args,modifs);
}


evaluator.randombool=function(args,modifs){
    
    if(args.length==0){
        if(CSNumber._helper.rand()>0.5){
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
            if(CSNumber._helper.isAlmostReal(v0)){
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
            if(CSNumber._helper.isAlmostReal(v0)&&
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
            if(CSNumber._helper.isAlmostReal(v0)&&
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
            if(CSNumber._helper.isAlmostReal(v0)&&
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
        if((List._helper.colNumb(v0))!=-1){
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


evaluator.matrixrowcolumn=function(args,modifs){
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        var n=List._helper.colNumb(v0);
        if(n!=-1){
            return List.realVector([v0.value.length,v0.value[0].value.length]);
        }
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
                    return CSNumber.complex(a.value.real-b.value.imag,b.value.real+a.value.imag);
                }
                if(v0.value.length==3){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    var c=v0.value[2];
                    a=CSNumber.div(a,c);
                    b=CSNumber.div(b,c);
                    return CSNumber.complex(a.value.real-b.value.imag,b.value.real+a.value.imag);
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



evaluator.cross=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="None";
            if(v0.usage=="Point"&&v1.usage=="Point"){erg.usage="Line"};
            if(v0.usage=="Line"&&v1.usage=="Line"){erg.usage="Point"};
            return erg;
        }
    }
    return nada;
    
}




evaluator.cross=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="None";
            if(v0.usage=="Point"&&v1.usage=="Point"){erg.usage="Line"};
            if(v0.usage=="Line"&&v1.usage=="Line"){erg.usage="Point"};
            return erg;
        }
    }
    return nada;
    
}


evaluator.para=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var w0=evaluateAndHomog(v0);
        var w1=evaluateAndHomog(v1);
        
               if(v0!=nada && v1!=nada){
            
            
            var u0=v0.usage;
            var u1=v1.usage;
            var p=w0;
            var l=w1;
            if(u0=="Line" || u1=="Point"){
                p=w1;
                l=w0;
            }
            
            var inf=List.linfty;
           
            var erg=List.cross(List.cross(inf,l),p);
            erg.usage="Line";
            return erg;
        }
    }
    return nada;
    
}

evaluator.perp=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var w0=evaluateAndHomog(v0);
        var w1=evaluateAndHomog(v1);
        if(v0!=nada && v1!=nada){
            
            
            var u0=v0.usage;
            var u1=v1.usage;
            var p=w0;
            var l=w1;
            if(u0=="Line" || u1=="Point"){
                p=w1;
                l=w0;
            }
            
            var inf=List.linfty;
            var tt=List.cross(inf,l);
            tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
            var erg=List.cross(tt,p);
            erg.usage="Line";
            return erg;
        }
    }
    
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        
        if(List._helper.isNumberVecN(v0,2)){
            erg = List.turnIntoCSList([CSNumber.neg(v0.value[1]),v0.value[0]]);
            return erg;
        }
        
    }
    
    return nada;
    
}



evaluator.parallel=function(args,modifs){
    return evaluator.para(args,modifs)
}

evaluator.perpendicular=function(args,modifs){
    return evaluator.perp(args,modifs)
}

evaluator.meet=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="Point";
            return erg;
        }
    }
    return nada;
    
}


evaluator.join=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        if(v0!=nada && v1!=nada){
            var erg=List.cross(v0,v1);
            erg.usage="Line";
            return erg;
        }
    }
    return nada;
    
}



evaluator.dist=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var diff=evaluator.minus([v0,v1],[]);
        return evaluator.abs([diff],[]);
    }
    return nada;
    
}



evaluator.point=function(args,modifs){
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(List._helper.isNumberVecN(v0,3) || List._helper.isNumberVecN(v0,2)){
            v0.usage="Point";
        }
    }
    return v0;
    
}

evaluator.line=function(args,modifs){
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(List._helper.isNumberVecN(v0,3) ){
            v0.usage="Line";
        }
    }
    return v0;
    
}



evaluator.det=function(args,modifs){
    if(args.length==3){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        var v2=evaluateAndHomog(args[2]);
        if(v0!=nada && v1!=nada&& v2!=nada){
            var erg=List.det3(v0,v1,v2);
            return erg;
        }
    }
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            var n=List._helper.colNumb(v0);
            if(n!=-1&&n==v0.value.length){
                return List.det(v0);
                
            }
        }
    }
    return nada;
}

evaluator.area=function(args,modifs){
    if(args.length==3){
        var v0=evaluateAndHomog(args[0]);
        var v1=evaluateAndHomog(args[1]);
        var v2=evaluateAndHomog(args[2]);
        if(v0!=nada && v1!=nada&& v2!=nada){
            var z0=v0.value[2];
            var z1=v1.value[2];
            var z2=v2.value[2];
            if(!CSNumber._helper.isAlmostZero(z0) 
               && !CSNumber._helper.isAlmostZero(z1) 
               && !CSNumber._helper.isAlmostZero(z2) ){
                v0=List.scaldiv(z0,v0);
                v1=List.scaldiv(z1,v1);
                v2=List.scaldiv(z2,v2);
                var erg=List.det3(v0,v1,v2);
                erg.value.real=erg.value.real*.5;
                erg.value.imag=erg.value.imag*.5;
                return erg;
            }
        }
    }
    return nada;
}


evaluator.inverse=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            var n=List._helper.colNumb(v0);
            if(n!=-1&&n==v0.value.length){
                return List.inverse(v0);
                
            }
        }
    }
    return nada;
}


evaluator.linearsolve=function(args,modifs){
    if(args.length==2){
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        if(v0.ctype=='list'){
            var n=List._helper.colNumb(v0);
            if(n!=-1&&n==v0.value.length && List._helper.isNumberVecN(v1,n)){
                return List.linearsolve(v0,v1);
                
            }
        }
    }
    return nada;
}




///////////////////////////////
//    List Manipulations     //
///////////////////////////////

evaluator.take=function(args,modifs){
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluateAndVal(args[1]);
        if(v1.ctype=='number'){
            var ind=Math.floor(v1.value.real);
            if(v0.ctype=='list'||v0.ctype=='string'){
                if (ind<0){
                    ind=v0.value.length+ind+1;
                }
                if(ind>0 && ind<v0.value.length+1){
                    if(v0.ctype=='list'){
                        return v0.value[ind-1];
                    }
                    return {"ctype":"string" ,  "value":v0.value.charAt(ind-1)}
                    
                }
                return nada;
                
            }
            
        }
        
        if(v1.ctype=='list'){//Hab das jetzt mal rekursiv gemacht, ist anders als in Cindy
            var li=[];
            for(var i=0;i<v1.value.length;i++){
                var v1i=evaluateAndVal(v1.value[i]);
                li[i]=evaluator.take([v0,v1i],[]);
            }
            return List.turnIntoCSList(li);
            
        }
        
    }
    return nada;
    
    
}


evaluator.length=function(args,modifs){ //ACHTUNG: evaluator darf nicht array-artig sein.
                                        //Sonst kann ich hier nicht überschreiben
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'||v0.ctype=='string'){
            return CSNumber.real(v0.value.length);
            
        }
        
    }
    return nada;
}


evaluator.pairs=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.pairs(v0);
            
        }
        
    }
    return nada;
}

evaluator.triples=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.triples(v0);
        }
    }
    return nada;
}

evaluator.cycle=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.cycle(v0);
        }
    }
    return nada;
}

evaluator.consecutive=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.consecutive(v0);
        }
    }
    return nada;
}


evaluator.reverse=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.reverse(v0);
        }
    }
    return nada;
}

evaluator.directproduct=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.directproduct(v0,v1);
            
        }
        
    }
    return nada;
}

evaluator.concat=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.concat(v0,v1);
        }
        if(v0.ctype=='shape'&& v1.ctype=='shape'){
            return evaluator._helper.shapeconcat(v0,v1);
        }
    }
    return nada;
}



evaluator.common=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.common(v0,v1);
        }
        if(v0.ctype=='shape'&& v1.ctype=='shape'){
            return evaluator._helper.shapecommon(v0,v1);
        }

    }
    return nada;
}



evaluator.remove=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'&& v1.ctype=='list'){
            return List.remove(v0,v1);
        }
        if(v0.ctype=='shape'&& v1.ctype=='shape'){
            return evaluator._helper.shaperemove(v0,v1);
        }

    }
    return nada;
}


evaluator.append=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'){
            return List.append(v0,v1);
        }
    }
    return nada;
}

evaluator.prepend=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v1.ctype=='list'){
            return List.prepend(v0,v1);
        }
    }
    return nada;
}

evaluator.contains=function(args,modifs){ 
    
    if(args.length==2){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='list'){
            return List.contains(v0,v1);
        }
    }
    return nada;
}


evaluator._helper.sort2=function(args,modifs){ //OK
    
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
        erg[erg.length]={val:li[i] ,result:evaluate(args[argind])};
    }
    namespace.removevar(lauf);
    
    erg.sort(General.compareResults);    
    var erg1=[];
    for(var i=0;i<li.length;i++){
        erg1[erg1.length]=erg[erg1.length].val;
    }
    
    return {'ctype':'list','value':erg1};
    
}


evaluator.sort=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.sort1(v0);
        }
    }
    return evaluator._helper.sort2(args,modifs);
}


evaluator.set=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            return List.set(v0);
        }
    }
    return nada;
}


evaluator.zeromatrix=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        return List.zeromatrix(v0,v1);
    }
    return nada;
    
}



evaluator.zerovector=function(args,modifs){
    
    var v0=evaluateAndVal(args[0]);
    if(v0.ctype=='number'){
        return List.zerovector(v0);
    }
    return nada;
    
}

evaluator.transpose=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    
    if(v0.ctype=='list' &&  List._helper.colNumb(v0)!=-1){
        return List.transpose(v0);
    }
    return nada;
    
}

evaluator.row=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v1.ctype=='number' && v0.ctype=='list' &&  List._helper.colNumb(v0)!=-1){
        return List.row(v0,v1);
    }
    return nada;
    
}

evaluator.column=function(args,modifs){
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    
    if(v1.ctype=='number' && v0.ctype=='list' &&  List._helper.colNumb(v0)!=-1){
        return List.column(v0,v1);
    }
    return nada;
    
}



///////////////////////////////
//         COLOR OPS         //
///////////////////////////////

evaluator.red=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([c,0,0]);
        }
    }
    return nada;
}

evaluator.green=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([0,c,0]);
        }
    }
    return nada;
}

evaluator.blue=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([0,0,c]);
        }
    }
    return nada;
}

evaluator.grey=function(args,modifs){ 
    return evaluator.gray(args,modifs);
}

evaluator.gray=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=Math.min(1,Math.max(0,v0.value.real));
            return List.realVector([c,c,c]);
        }
    }
    return nada;
}


evaluator._helper.HSVtoRGB =function(h, s, v) {
    
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
    return List.realVector([r,g,b]);
}

evaluator.hue=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='number'){
            var c=v0.value.real;
            
            c=c-Math.floor(c );
            return evaluator._helper.HSVtoRGB(c,1,1);
        }
    }
    return nada;
}

///////////////////////////////
//      shape booleans       //
///////////////////////////////



evaluator._helper.shapeconvert=function(a){
    if(a.type=="circle") {
        var pt=a.value.value[0];
        var aa=General.div(pt,pt.value[2]);
        var mx=aa.value[0].value.real;
        var my=aa.value[1].value.real;
        var r=a.value.value[1].value.real;
        var li=[];
        var n=36;
        var d=Math.PI*2/n;
        for(var i=0; i<n;i++){
            li[i]={X:(mx+Math.cos(i*d)*r),Y:(my+Math.sin(i*d)*r)};
        }
        
        return [li];
    }
    if(a.type=="polygon") {
        erg=[];
        for(var i=0; i<a.value.length;i++){
            pol=a.value[i]
            li=[];
            for(var j=0; j<pol.length;j++){
                li[j]={X:pol[j].X,Y:pol[j].Y};
            }
            erg[i]=li;
        }
        return erg;
    }
    
    
}


evaluator._helper.shapeop=function(a,b,op){

    var convert
    var aa=evaluator._helper.shapeconvert(a);
    var bb=evaluator._helper.shapeconvert(b);
    var scale=1000;
    ClipperLib.JS.ScaleUpPaths(aa, scale);
    ClipperLib.JS.ScaleUpPaths(bb, scale);
    var cpr = new ClipperLib.Clipper();
    cpr.AddPaths(aa, ClipperLib.PolyType.ptSubject, true);
    cpr.AddPaths(bb, ClipperLib.PolyType.ptClip, true);
    var subject_fillType = ClipperLib.PolyFillType.pftNonZero;
    var clip_fillType = ClipperLib.PolyFillType.pftNonZero;
    var clipType =  op;
    var solution_paths= new ClipperLib.Paths();
    cpr.Execute(clipType, solution_paths, subject_fillType, clip_fillType);
    ClipperLib.JS.ScaleDownPaths(solution_paths, scale);
//    console.log(JSON.stringify(solution_paths));    
    return {ctype:"shape",type:"polygon", value:solution_paths};

};

evaluator._helper.shapecommon=function(a,b){
    return evaluator._helper.shapeop(a,b,ClipperLib.ClipType.ctIntersection);
}

evaluator._helper.shaperemove=function(a,b){
    return evaluator._helper.shapeop(a,b,ClipperLib.ClipType.ctDifference);
}

evaluator._helper.shapeconcat=function(a,b){
    return evaluator._helper.shapeop(a,b,ClipperLib.ClipType.ctUnion);
}


///////////////////////////////
//            IO             //
///////////////////////////////

evaluator.key=function(args,modifs){  //OK
    if(args.length==0){
        return {ctype:"string",value:cskey};
    }
    return nada;
}


evaluator.keycode=function(args,modifs){  //OK
    if(args.length==0){

        return CSNumber.real(cskeycode);

    }
    return nada;
}



evaluator.mouse=function(args,modifs){  //OK
    if(args.length==0){
        
        var x = csmouse[0];
        var y = csmouse[1];
        return List.realVector([x,y]);
    }
    return nada;
}

evaluator.mover=function(args,modifs){  //OK
    if(args.length==0){

        if(move && move.mover)
            return {ctype:"geo",value:move.mover,type:"P"};
    }
    return nada;
}




///////////////////////////////
//      Graphic State        //
///////////////////////////////

evaluator.translate=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list'){
            if(List.isNumberVector(v0)) {
                if(v0.value.length==2){
                    var a=v0.value[0];
                    var b=v0.value[1];
                    
                    csport.translate(a.value.real,b.value.real);
                    return nada;
                    
                }
            }
        }
    }
    return nada;
}



evaluator.rotate=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.rotate(v0.value.real);
            return nada;
        }
    }
    return nada;
}


evaluator.scale=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.scale(v0.value.real);
            return nada;
        }
    }
    return nada;
}


evaluator.greset=function(args,modifs){ 
    if(args.length==0){
        var n=csgstorage.stack.length; 
        csport.greset();
        for(var i=0;i<n;i++){
                csctx.restore();
        }
        
    }
    return nada;
}


evaluator.gsave=function(args,modifs){ 
    if(args.length==0){
        csport.gsave();
        csctx.save();
    }
    return nada;
}


evaluator.grestore=function(args,modifs){ 
    if(args.length==0){
        csport.grestore();
        csctx.restore();

    }
    return nada;
}


evaluator.color=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' && List.isNumberVector(v0).value){
            csport.setcolor(v0);
        }
    }
    return nada;
    
}


evaluator.linecolor=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' && List.isNumberVector(v0).value){
            csport.setlinecolor(v0);
        }
    }
    return nada;
    
}


evaluator.pointcolor=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='list' && List.isNumberVector(v0).value){
            csport.setpointcolor(v0);
        }
    }
    return nada;
    
}

evaluator.alpha=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.setalpha(v0);
        }
    }
    return nada;
    
}

evaluator.pointsize=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.setpointsize(v0);
        }
    }
    return nada;
    
}


evaluator.linesize=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.setlinesize(v0);
        }
    }
    return nada;
    
}


evaluator.textsize=function(args,modifs){
    if(args.length==1){
        var v0=evaluateAndVal(args[0]);
        if(v0.ctype=='number'){
            csport.settextsize(v0);
        }
    }
    return nada;
    
}



///////////////////////////////
//          String           //
///////////////////////////////




evaluator.replace=function(args,modifs){ 
    if(args.length==3){
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        var v2=evaluate(args[2]);
        if(v0.ctype=='string'&& v1.ctype=='string'&& v2.ctype=='string'){
            var str0=v0.value;
            var str1=v1.value;
            var str2=v2.value;
            var regex=new RegExp(str1,"g");
            str0=str0.replace(regex,str2);
            return {ctype:"string",value:str0};
        }
    }
    if(args.length==2){
        var ind;
        var repl;
        var keyind;
        var from;
        
        /////HELPER/////
        var getReplStr=function( str,  keys,  from) {
            var s = "";
            ind = -1;
            keyind = -1;
            for (var i = 0; i < keys.length; i++) {
                var s1 = keys[i][0];
                var a = str.indexOf(s1, from);
                if (a != -1) {
                    if (ind == -1) {
                        s = s1;
                        ind = a;
                        keyind = i;
                    } else if (a < ind) {
                        s = s1;
                        ind = a;
                        keyind = i;
                    }
                }
            }
            return s;
        }
        
        //////////////// 
        
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='string'&& v1.ctype=='list'){
            var s=v0.value;
            var rules=[];
            for (var i=0;i<v1.value.length;i++){
                var el=v1.value[i];
                if(el.ctype=="list" && 
                   el.value.length==2 &&
                   el.value[0].ctype=="string" &&
                   el.value[1].ctype=="string") {
                    rules[rules.length]=[el.value[0].value,el.value[1].value];
                }
                
            }
            ind = -1;
            from = 0;
            var srep = getReplStr(s, rules, from);
            while (ind != -1) {
                s = s.substring(0, ind) +
                (rules[keyind][1]) +
                s.substring(ind + (srep.length), s.length);
                from = ind + rules[keyind][1].length;
                srep = getReplStr(s, rules, from);
            }
            
            
        }
        return {ctype:"string",value:s}        
        
    }
    
    return nada;
}


evaluator.substring=function(args,modifs){ 
    
    if(args.length==3){
        var v0=evaluate(args[0]);
        var v1=evaluateAndVal(args[1]);
        var v2=evaluateAndVal(args[2]);
        if(v0.ctype=='string'&& v1.ctype=='number'&& v2.ctype=='number'){
            var s=v0.value;
            return {ctype:"string",value:s.substring(Math.floor(v1.value.real),
                                                     Math.floor(v2.value.real))};
        }
    }
    return nada;
}


evaluator.tokenize=function(args,modifs){ //TODO der ist gerade sehr uneffiktiv implementiert

    if(args.length==2){
           
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='string'&& v1.ctype=='string'){
            var convert=true;    
            if(modifs.autoconvert!==undefined){
                var erg =evaluate(modifs.autoconvert);
                if(erg.ctype=='boolean'){
                    convert=erg.value;
                }
            }
            
            
            var str=v0.value;
            var split=v1.value;
            var splitlist=str.split(split);
            var li=[];
            for (var i=0;i<splitlist.length;i++){
                var val= splitlist[i];
                if(convert){
                    var fl=parseFloat(val);
                    if(!isNaN(fl))
                        val=fl;
                }
                li[i]={ctype:"string",value:val};
            }
            return List.turnIntoCSList(li);
        }
        if(v0.ctype=='string'&& v1.ctype=='list'){
            if (v1.value.length==0){
                return v0;
            }

            var token=v1.value[0];
                 
            tli=List.turnIntoCSList(tokens);
            var firstiter=evaluator.tokenize([args[0],token],modifs).value;
            
            var li=[];
            for(var i=0;i<firstiter.length;i++){
                var tokens=[];
                for(var j=1;j<v1.value.length;j++){//TODO: Das ist Notlösung weil ich das wegen 
                    tokens[j-1]=v1.value[j];    //CbV und CbR irgendwie anders nicht hinbekomme
                }
                
                tli=List.turnIntoCSList(tokens);
                li[i]=evaluator.tokenize([firstiter[i],tli],modifs);
            }
            return List.turnIntoCSList(li);
            
        }
    
    }
    return nada;
    
}

evaluator.indexof=function(args,modifs){ 
    if(args.length==2){
           
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        if(v0.ctype=='string'&& v1.ctype=='string'){
            var str=v0.value;
            var code=v1.value;
            var i=str.indexOf(code);
            return CSNumber.real(i+1);
        }
    }
    if(args.length==3){
        
        var v0=evaluate(args[0]);
        var v1=evaluate(args[1]);
        var v2=evaluate(args[2]);
        if(v0.ctype=='string'&& v1.ctype=='string'&& v2.ctype=='number'){
            var str=v0.value;
            var code=v1.value;
            var start=Math.round(v2.value.real);
            var i=str.indexOf(code,start-1);
            return CSNumber.real(i+1);
        }
    }
    
    return nada;
}



evaluator.parse=function(args,modifs){ 
    if(args.length==1){
        var v0=evaluate(args[0]);
        
        if(v0.ctype=='string'){
            var code=condense(v0.value)
            var prog=analyse(code)
            return evaluate(prog);
        }
    }
    return nada;
    
}

///////////////////////////////
//     Transformations       //
///////////////////////////////

evaluator._helper.basismap=function(a,b,c,d){
    var mat= List.turnIntoCSList([a,b,c]);
    mat=List.inverse(List.transpose(mat));
    var vv=General.mult(mat,d);
    mat= List.turnIntoCSList([
        General.mult(vv.value[0],a),
        General.mult(vv.value[1],b),
        General.mult(vv.value[2],c)]);
    return List.transpose(mat);
    
} 


evaluator.map=function(args,modifs){ 
    
    if(args.length==8){
        var w0=evaluateAndHomog(args[0]);
        var w1=evaluateAndHomog(args[1]);
        var w2=evaluateAndHomog(args[2]);
        var w3=evaluateAndHomog(args[3]);
        var v0=evaluateAndHomog(args[4]);
        var v1=evaluateAndHomog(args[5]);
        var v2=evaluateAndHomog(args[6]);
        var v3=evaluateAndHomog(args[7]);
        if(v0!=nada && v1!=nada && v2!=nada && v3!=nada && 
           w0!=nada && w1!=nada && w2!=nada && w3!=nada){
            var m1=evaluator._helper.basismap(v0,v1,v2,v3);
            var m2=evaluator._helper.basismap(w0,w1,w2,w3);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    
    if(args.length==6){
        var w0=evaluateAndHomog(args[0]);
        var w1=evaluateAndHomog(args[1]);
        var w2=evaluateAndHomog(args[2]);
        var inf=List.realVector([0,0,1]);
        var cc=List.cross;
        
        var w3=cc(cc(w2,cc(inf,cc(w0,w1))),
                  cc(w1,cc(inf,cc(w0,w2))));
        
        var v0=evaluateAndHomog(args[3]);
        var v1=evaluateAndHomog(args[4]);
        var v2=evaluateAndHomog(args[5]);
        var v3=cc(cc(v2,cc(inf,cc(v0,v1))),
                  cc(v1,cc(inf,cc(v0,v2))));
        
        
        
        if(v0!=nada && v1!=nada && v2!=nada && v3!=nada && 
           w0!=nada && w1!=nada && w2!=nada && w3!=nada){
            var m1=evaluator._helper.basismap(v0,v1,v2,v3);
            var m2=evaluator._helper.basismap(w0,w1,w2,w3);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    
    
        if(args.length==4){
        
        var ii=List.ii;
        var jj=List.jj;

        var w0=evaluateAndHomog(args[0]);
        var w1=evaluateAndHomog(args[1]);        
        var v0=evaluateAndHomog(args[2]);
        var v1=evaluateAndHomog(args[3]);
        
        
        if(v0!=nada && v1!=nada && 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(v0,v1,ii,jj);
            var m2=evaluator._helper.basismap(w0,w1,ii,jj);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    

       if(args.length==2){
        
        var ii=List.ii;
        var jj=List.jj;
        var w0=evaluateAndHomog(args[0]);
        var w1=General.add(List.realVector([1,0,0]),w0);  
        var v0=evaluateAndHomog(args[1]);
        var v1=General.add(List.realVector([1,0,0]),v0);        

        
        if(v0!=nada && v1!=nada && 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(v0,v1,ii,jj);
            var m2=evaluator._helper.basismap(w0,w1,ii,jj);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    

    
    
    return nada;
    
}

evaluator.pointreflect=function(args,modifs){ 
    if(args.length==1){
        
        var ii=List.ii;
        var jj=List.jj;
        
        var w0=evaluateAndHomog(args[0]);
        var w1=General.add(List.realVector([1,0,0]),w0);  
        var v1=General.add(List.realVector([-1,0,0]),w0);  

        
        if( v1!=nada && 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(w0,v1,ii,jj);
            var m2=evaluator._helper.basismap(w0,w1,ii,jj);
            erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);

        }
    }
    return nada;
}


evaluator.linereflect=function(args,modifs){ 
    if(args.length==1){
        
        var ii=List.ii;
        var jj=List.jj;

        var w0=evaluateAndHomog(args[0]);
        var r0=List.realVector([Math.random(),Math.random(),Math.random()]);
        var r1=List.realVector([Math.random(),Math.random(),Math.random()]);
        var w1=List.cross(r0,w0);  
        var w2=List.cross(r1,w0);  

        
        if( 
           w0!=nada && w1!=nada){
            var m1=evaluator._helper.basismap(w1,w2,ii,jj);
            var m2=evaluator._helper.basismap(w1,w2,jj,ii);
            var erg=General.mult(m1,List.inverse(m2));
            return List.normalizeMax(erg);
        }
    }
    return nada;
}



///////////////////////////////
//         Shapes            //
///////////////////////////////



evaluator._helper.extractPointVec=function(v1){//Eventuell Homogen machen
    var erg={};
    erg.ok=false;
    if(v1.ctype=='geo') {
        var val=v1.value;
        if(val.kind=="P"){
            erg.x= Accessor.getField(val,"x");
            erg.y= Accessor.getField(val,"y");
            erg.z= CSNumber.real(1);
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
            erg.x=CSNumber.clone(n1);
            erg.y=CSNumber.clone(n2);
            erg.z= CSNumber.real(1);
            erg.ok=true;
            return erg;
        }
    }
    
    if(pt1.length==3){
        var n1=pt1[0];
        var n2=pt1[1];
        var n3=pt1[2];
        if(n1.ctype=='number' && n2.ctype=='number'&& n3.ctype=='number'){
            erg.x=CSNumber.div(n1,n3);
            erg.y=CSNumber.div(n2,n3);
            erg.z= CSNumber.real(1);
            erg.ok=true;
            return erg;
        }
    }
    
    return erg;
    
}




evaluator.polygon=function(args,modifs){ 
    if(args.length==1) {
        var v0=evaluate(args[0]);
        if (v0.ctype=='list'){
            var li=[];
            for(var i=0;i<v0.value.length;i++){
                var pt=evaluator._helper.extractPoint(v0.value[i]);
                if(!pt.ok ){
                    return nada;
                }
                              
                li[li.length]={X:pt.x,Y:pt.y};
            } 
            return {ctype:"shape", type:"polygon", value:[li]};
        }
        
    }
    return nada;
    
    
}


evaluator.circle=function(args,modifs){ 
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var pt=evaluator._helper.extractPointVec(v0);
        
        if(!pt.ok || v1.ctype!='number'){
            return nada;
        }
        var pt2 = List.turnIntoCSList([pt.x,pt.y,pt.z]);
        
        return {ctype:"shape", type:"circle", value:List.turnIntoCSList([pt2,v1])}
        
    }
    return nada;
}

evaluator.screen=function(args,modifs){ 
    if(args.length==0) {
        var m=csport.drawingstate.initialmatrix;
        var transf=function(px,py){
            var xx = px-m.tx;
            var yy = py+m.ty;
            var x=(xx*m.d-yy*m.b)/m.det;
            var y=-(-xx*m.c+yy*m.a)/m.det;
            var erg={X:x, Y:y};
            
            return erg;
        }
        var erg = [
            transf(0,0),
            transf(csw,0),
            transf(csw,csh),
            transf(0,csh)
            ];
        return {ctype:"shape", type:"polygon", value:[erg]}
        
    }
            
    return nada;
}

evaluator.allpoints=function(args,modifs){
	if (args.length==0) {
		erg=[];
		for (var i=0; i< csgeo.points.length; i++) {
			erg[i]={ctype:"geo",value:csgeo.points[i],type:"P"};
		}
		return {ctype:"list", value:erg};
	}
	return nada;
}


evaluator.allmasses=function(args,modifs){
	if (args.length==0) {
		erg=[];
		for (var i=0; i< masses.length; i++) {
                erg[i]={ctype:"geo",value:masses[i],type:"P"};
		}
		return {ctype:"list", value:erg};
	}
	return nada;
}


evaluator.alllines=function(args,modifs){
	if (args.length==0) {
		erg=[];
		for (var i=0; i< csgeo.lines.length; i++) {
			erg[i]={ctype:"geo",value:csgeo.lines[i],type:"L"};
		}
		return {ctype:"list", value:erg};
	}
	return nada;
}

evaluator.halfplane=function(args,modifs){ 
    if(args.length==2) {
        var v0=evaluateAndVal(args[0]);
        var v1=evaluateAndVal(args[1]);
        var w0=evaluateAndHomog(v0);
        var w1=evaluateAndHomog(v1);
        if(v0!=nada && v1!=nada){
            var u0=v0.usage;
            var u1=v1.usage;
            var p=w0;
            var l=w1;
            if(u0=="Line" || u1=="Point"){
                p=w1;
                l=v0;
            }
            //OK im Folgenden lässt sich viel optimieren
            var inf=List.realVector([0,0,1]);
            var tt=List.cross(inf,l);
            tt.value=[tt.value[1],CSNumber.neg(tt.value[0]),tt.value[2]];
            var erg=List.cross(tt,p);
            var foot=List.cross(l,erg);
            foot=General.div(foot,foot.value[2]);
            p=General.div(p,p.value[2]);
            var diff=List.sub(p,foot);
            var nn=List.abs(diff);
            diff=General.div(diff,nn);
            
            var sx=foot.value[0].value.real;
            var sy=foot.value[1].value.real;
            var dx=diff.value[0].value.real*1000;
            var dy=diff.value[1].value.real*1000;
            
            var pp1={X:sx+dy/2,    Y:sy-dx/2};
            var pp2={X:sx+dy/2+dx, Y:sy-dx/2+dy};
            var pp3={X:sx-dy/2+dx, Y:sy+dx/2+dy};
            var pp4={X:sx-dy/2,    Y:sy+dx/2};
            return {ctype:"shape", type:"polygon", value:[[pp1,pp2,pp3,pp4]]};
        }
    }
    
    return nada;
    
    
}

evaluator.convexhull3d=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
        if(v0.ctype=='list'){
            var vals=v0.value;
            var pts=[];
            for(var i=0;i< vals.length;i++){
               if(List._helper.isNumberVecN(vals[i],3)){
                    for(var j=0;j< 3;j++){
                        var a=vals[i].value[j].value.real;
                        pts.push(a);
                    
                    }

               }
            
            }
            var ch=convexhull(pts);
            var chp=ch[0];
            var ergp=[];
            for(var i=0;i<chp.length;i+=3){
               ergp.push(List.realVector([chp[i],chp[i+1],chp[i+2]]));
            }
            var outp=List.turnIntoCSList(ergp);
            var chf=ch[1];
            var ergf=[];
            for(var i=0;i<chf.length;i++){
               for(var j=0;j<chf[i].length;j++){
                 chf[i][j]++;
               }
               ergf.push(List.realVector(chf[i]));
            }
            var outf=List.turnIntoCSList(ergf);
            return(List.turnIntoCSList([outp,outf]));
            
        }
    }
    return nada;
}



evaluator.javascript=function(args,modifs){ 
    
    if(args.length==1){
        var v0=evaluate(args[0]);
       
        if(v0.ctype=='string'){
            var s=v0.value;
            eval(s);
            
        }
    }
    return nada;
}

evaluator.format=function(args,modifs){//TODO Complex,Angels etc
    
    var v0=evaluateAndVal(args[0]);
    var v1=evaluateAndVal(args[1]);
    if(v0.ctype=='number' &&v1.ctype=='number' ){
        var val=v0.value.real;
        var dec=Math.round(v1.value.real);
        var erg=val.toFixed(dec);
        do {
          var erg1=erg;
          erg=erg.substring(0,erg.length-1);
       } while (erg!=""&& erg!="-"&& eval(erg)==eval(erg1));       
        
        return {"ctype":"string" ,  "value":""+erg1}
    }
    return nada;
    
}

