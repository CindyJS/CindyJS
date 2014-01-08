

//==========================================
//      Lists
//==========================================
List={};

List.turnIntoCSList=function(l){
    return {'ctype':'list','value':l};
}


List.sequence=function(a,b){
    var erg=[];
    for(var i=Math.round(a.value.real);i<Math.round(b.value.real)+1;i++){
        erg[erg.length]={"ctype":"number" ,"value":{'real':i,'imag':0}};
    }
    return {'ctype':'list','value':erg};
}


List.scalproduct=function(a1,a2){
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg={'ctype':'number','value':{'real':0,'imag':0}};
    for(var i=0;i<a2.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        if(av1.ctype=='number' && av2.ctype=='number'){
            erg=Number.add(Number.mult(av2,av2),erg);
        } else {
            return nada;
        }
    }
    
    return erg;
}


List.scaldiv=function(a1,a2){//TODO Rekursion stimmt hier noch nicht [2,[3,4],2]/2=_?_
    if(a1.ctype != 'number'){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a2.value.length;i++){
        var av2=a2.value[i];
        if(av2.ctype=='number' ){
            erg[erg.length]=evaluator.div([av2,a1],[]);
        } else if(av2.ctype=='list'  ){
            erg[erg.length]=List.scaldiv(av2,a1);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}


List.scalmult=function(a1,a2){//TODO Rekursion stimmt hier noch nicht [2,[3,4],2]*2=_?_
    if(a1.ctype != 'number'){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a2.value.length;i++){
        var av2=a2.value[i];
        if(av2.ctype=='number' ){
            erg[erg.length]=evaluator.mult([av2,a1],[]);
        } else if(av2.ctype=='list'  ){
            erg[erg.length]=List.scalmult(av2,a1);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}

List.equals=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return {'ctype':'boolean','value':false};
    }
    var erg=true;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        
        if(av1.ctype=='list' && av2.ctype=='list' ){
            erg=erg && List.equals(av1,av2).value;
        } else {
            erg=erg && evaluator.equals([av1,av2],[]).value;
            
        }
    }
    return {'ctype':'boolean','value':erg};
}


List.add=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        if(av1.ctype=='number' && av2.ctype=='number' ){
            erg[erg.length]=evaluator.add([av1,av2],[]);
        } else if(av1.ctype=='list' && av2.ctype=='list' ){
            erg[erg.length]=List.add(av1,av2);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}


List.sub=function(a1,a2){
    
    if(a1.value.length != a2.value.length){
        return nada;
    }
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        var av2=a2.value[i];
        if(av1.ctype=='number' && av2.ctype=='number' ){
            erg[erg.length]=Number.sub(av1,av2);
        } else if(av1.ctype=='list' && av2.ctype=='list' ){
            erg[erg.length]=List.sub(av1,av2);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}

List.neg=function(a1,a2){
    
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=evaluateAndVal(a1.value[i]);
        if(av1.ctype=='number'){
            erg[erg.length]=Number.neg(av1);
        } else if(av1.ctype=='list'){
            erg[erg.length]=List.neg(av1);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};
}

