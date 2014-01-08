
//*******************************************************
// and here are the accessors for properties
//*******************************************************

Accessor={};

Accessor.getGeoField=function(geoname,field){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.getField(gslp[csgeo.csnames[geoname]],field);
    }
    return nada;
}



Accessor.getField=function(geo,field){
    
    if(geo.kind=="P"){
        if(field=="xy") {
            var x = (-250+geo.px)/25.0;
            var y = (250-geo.py)/25.0;
            var erg=List.turnIntoCSList([Number.real(x),Number.real(y)]);
            return erg;
        };
        
        if(field=="x") {
            var x = (-250+geo.px)/25.0;
            return Number.real(x);
        };
        
        if(field=="y") {
            var y = (250-geo.py)/25.0;
            return Number.real(y);
        };
        
        
    
    } if(geo.kind=="L"){
        
        
        
    }
    

}
