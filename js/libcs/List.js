

//==========================================
//      Lists
//==========================================
List={};
List.helper={};

List.turnIntoCSList=function(l){
    return {'ctype':'list','value':l};
}


List.realVector=function(l){
    var erg=[];
    for(var i=0;i<l.length;i++){
        erg[erg.length]={"ctype":"number" ,"value":{'real':l[i],'imag':0}};
    }
    return {'ctype':'list','value':erg};
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



List.abs2=function(a1){
    
    var erg=0;
    for(var i=0;i<a1.value.length;i++){
        var av1=a1.value[i];
        if(av1.ctype=='number' ){
            erg+=Number.abs2(av1).value.real;
        } else if(av1.ctype=='list' ){
            erg+=List.abs2(av1).value.real;
        } else {
            return nada;
        }
    }

    return {"ctype":"number" ,
        "value":{'real':erg, 'imag':0}};
}

List.abs=function(a1){
   return Number.sqrt(List.abs2(a1))
}


List.recursive=function(a1,op){
    var erg=[];
    for(var i=0;i<a1.value.length;i++){
        var av1=evaluateAndVal(a1.value[i]);//Will man hier evaluieren
        if(av1.ctype=='number'){
            erg[erg.length]=Number[op](av1);
        } else if(av1.ctype=='list'){
            erg[erg.length]=List[op](av1);
        } else {
            erg[erg.length]=nada;
        }
    }
    return {'ctype':'list','value':erg};

}

List.re=function(a){
    return List.recursive(a,"re");
}


List.neg=function(a){
    return List.recursive(a,"neg");
}

List.im=function(a){
    return List.recursive(a,"im");
}

List.conjugate=function(a){
    return List.recursive(a,"conjugate");
}


List.round=function(a){
    return List.recursive(a,"round");
}


List.ceil=function(a){
    return List.recursive(a,"ceil");
}


List.floor=function(a){
    return List.recursive(a,"floor");
}

List.helper.colNumb=function(a){
    if(a.ctype!='list') {
        return -1;
    }
    var ind=-1;
    for(var i=0;i<a.value.length;i++){
        if((a.value[i]).ctype!='list') {
            return -1;
        }
        if(i==0){
            ind=(a.value[i]).value.length;
        } else {
            if(ind!=(a.value[i]).value.length)
                return -1
        }
    }
    return ind;

}



List.isNumberVector=function(a){
    if(a.ctype!='list') {
        return {'ctype':'boolean','value':false};
    }
    for(var i=0;i<a.value.length;i++){
        if((a.value[i]).ctype!='number') {
            return {'ctype':'boolean','value':false};
        }
    }
    return {'ctype':'boolean','value':true};
    
}


List.isNumberVectorN=function(a,n){
    if(a.ctype!='list') {
        return {'ctype':'boolean','value':false};
    }
    if(a.value)
    for(var i=0;i<a.value.length;i++){
        if((a.value[i]).ctype!='number') {
            return {'ctype':'boolean','value':false};
        }
    }
    return {'ctype':'boolean','value':true};
    
}






List.isNumberMatrix=function(a){
    if(List.helper.colNumb(a)==-1){
        return {'ctype':'boolean','value':false};
    }

    for(var i=0;i<a.value.length;i++){
        if(!List.isNumberVector((a.value[i])).value) {
            return {'ctype':'boolean','value':false};
        }
    }
    return {'ctype':'boolean','value':true};
    
}
