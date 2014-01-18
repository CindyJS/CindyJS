
//*************************************************************
// and here are the accessors for properties and elements
//*************************************************************

var Accessor={};

Accessor.generalFields={//Übersetungstafel der Feldnamen 
    color:"color",
    colorhsb:"",
    size:"size",
    alpha:"alpha",
    isshowing:"isshowing",
    visible:"visible",
    name:"name",
    caption:"caption",
    trace:"trace",
    tracelength:"",
    selected:"",
}

Accessor.getGeoField=function(geoname,field){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.getField(csgeo.csnames[geoname],field);
    }
    return nada;
}


Accessor.setGeoField=function(geoname,field,value){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.setField(csgeo.csnames[geoname],field,value);
    }
    return nada;
}




Accessor.getField=function(geo,field){
    if(geo.kind=="P"){
        if(field=="xy") {
            var xx=CSNumber.div(geo.homog.value[0],geo.homog.value[2]);
            var yy=CSNumber.div(geo.homog.value[1],geo.homog.value[2]);
            var erg=List.turnIntoCSList([xx,yy]);
            erg.usage="Point";
            
            return erg;
        };
        
        if(field=="homog") {
            var erg=List.clone(geo.homog);//TODO will man hier clonen?
            erg.usage="Point";
            return erg;
        };
        
        
        if(field=="x") {
            var x=CSNumber.div(geo.homog.value[0],geo.homog.value[2]);
            return x;
        };
        
        if(field=="y") {
            var y=CSNumber.div(geo.homog.value[1],geo.homog.value[2]);
            return y;
        };
    } if(geo.kind=="L"){
        if(field=="homog") {
            var erg=List.clone(geo.homog);//TODO will man hier clonen?
            erg.usage="Line";
            return erg;
        }
    };
    if(Accessor.generalFields[field]) {//must be defined an an actual string
        var erg=geo[Accessor.generalFields[field]];
        if(erg) {
            erg=General.clone(erg);  
            return erg;
        } else 
            return nada;
    }   
    return nada;
    
    
}

Accessor.setField=function(geo,field,value){
    if(field=="color") {
        geo.color=List.clone(value);
    }
    if(field=="size") {
        geo.size=General.clone(value);
    }
    if(field=="xy" && geo.kind=="P"&&geo.ismovable && List._helper.isNumberVecN(value,2)) {
        movepointscr(geo,List.turnIntoCSList([value.value[0],value.value[1],CSNumber.real(1)]));
        recalc();
    }

    if(field=="homog" && geo.kind=="P"&&geo.ismovable && List._helper.isNumberVecN(value,2)) {
        movepointscr(geo,General.clone(value));
        recalc();
    }


}


