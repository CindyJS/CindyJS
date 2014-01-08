
//==========================================
//      Things that apply to several types
//==========================================
General={};
General.helper={};

General.order={
    undefined:0,
    boolean:1,
    number:2,
    term:3,
    atomic:4,
    variable:5,
    geo:6,
    string:7,
    list:8
} 

General.isLessThan=function(a,b){
   return General.compare(a,b)==-1;

}


General.isEqual=function(a,b){
   return General.compare(a,b)==0;

}


General.compareResults=function(a,b){
    return General.compare(a.result,b.result);
}

General.compare=function(a,b){
    if (a.ctype!=b.ctype){
        return (General.order[a.ctype]-General.order[b.ctype])
    }
    if (a.ctype=='number') {
        return Number.helper.compare(a,b);
    }
    if (a.ctype=='list') {
        return List.helper.compare(a,b);
    }
    if (a.ctype=='string') {
        if(a.value==b.value) {
            return 0;
        }
        if(a.value<b.value) {
            return -1;
        }
        return 1;
    }
    if (a.ctype=='boolean') {
        if(a.value==b.value) {
            return 0;
        }
        if(a.value=false) {
            return -1
        }
        return 1;
    }
    
}