
//*************************************************************
// and here are the accessors for properties and elements
//*************************************************************

var Accessor={};

Accessor.getGeoField=function(geoname,field){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.getField(csgeo.csnames[geoname],field);
    }
    return nada;
}



Accessor.getField=function(geo,field){
    
    var m=csport.drawingstate.initialmatrix;
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
    if(field=="color") {
        var erg=List.clone(geo.color);  
        return erg;
    }   
    
    
}



