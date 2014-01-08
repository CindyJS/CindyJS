
//*******************************************************
// and here are the accessors for properties
//*******************************************************

var Accessor={};

Accessor.getGeoField=function(geoname,field){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.getField(gslp[csgeo.csnames[geoname]],field);
    }
    return nada;
}



Accessor.getField=function(geo,field){
    
    var m=csport.drawingstate.initialmatrix;
    if(geo.kind=="P"){
        if(field=="xy") {
            var xx = geo.px-m.tx;
            var yy = geo.py+m.ty;
            var x=(xx*m.d-yy*m.b)/m.det;
            var y=-(-xx*m.c+yy*m.a)/m.det;
            var erg=List.turnIntoCSList([CSNumber.real(x),CSNumber.real(y)]);
            erg.usage="Point";

            return erg;
        };
        
        if(field=="homog") {
            var xx = geo.px-m.tx;
            var yy = geo.py+m.ty;
            var x=(xx*m.d-yy*m.b)/m.det;
            var y=-(-xx*m.c+yy*m.a)/m.det;
            var erg=List.turnIntoCSList([CSNumber.real(x),CSNumber.real(y),CSNumber.real(1)]);
            erg.usage="Point";
            return erg;
        };

        
        if(field=="x") {
            var xx = geo.px-m.tx;
            var yy = geo.py+m.ty;
            var x=(xx*m.d-yy*m.b)/m.det;
            return CSNumber.real(x);
        };
        
        if(field=="y") {
            var xx = geo.px-m.tx;
            var yy = geo.py+m.ty;
            var y=-(-xx*m.c+yy*m.a)/m.det; 
            return CSNumber.real(y);
        };
        
        
    
    } if(geo.kind=="L"){
              
        
    }
    

}
