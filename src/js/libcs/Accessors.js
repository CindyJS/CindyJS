
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
    selected:""
};

Accessor.getGeoField=function(geoname,field){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.getField(csgeo.csnames[geoname],field);
    }
    return nada;
};


Accessor.setGeoField=function(geoname,field,value){
    if(typeof csgeo.csnames[geoname] !== 'undefined'){
        return Accessor.setField(csgeo.csnames[geoname],field,value);
    }
    return nada;
};




Accessor.getField=function(geo,field){
    var erg;
    if(geo.kind==="P"){
        if(field==="xy") {
            var xx=CSNumber.div(geo.homog.value[0],geo.homog.value[2]);
            var yy=CSNumber.div(geo.homog.value[1],geo.homog.value[2]);
            erg=List.turnIntoCSList([xx,yy]);
            erg.usage="Point";
            
            return erg;
        }
        
        if(field==="homog") {
            erg=List.clone(geo.homog);//TODO will man hier clonen?
            erg.usage="Point";
            return erg;
        }
        
        
        if(field==="x") {
            var x=CSNumber.div(geo.homog.value[0],geo.homog.value[2]);
            return x;
        }
        
        if(field==="y") {
            var y=CSNumber.div(geo.homog.value[1],geo.homog.value[2]);
            return y;
        }
    } if(geo.kind==="L"){
        if(field==="homog") {
            erg=List.clone(geo.homog);//TODO will man hier clonen?
            erg.usage="Line";
            return erg;
        }
        if(field==="angle") {
            erg=List.eucangle(List.ey,geo.homog);
            erg.usage="Angle";
            return erg;
        }

    }
    if(geo.kind==="Tr"){
        if(field==="matrix") {
            erg=List.clone(geo.matrix);
            return erg;
        }
    }
    if(geo.kind==="C"){
        if(field==="radius") {//Assumes that we have a circle
            var s=geo.matrix;
            var ax=s.value[0].value[0];
            var az=s.value[0].value[2];
            var bz=s.value[1].value[2];
            var cz=s.value[2].value[2];
            
            
            var n = CSNumber.mult(ax,ax)
                var aa=CSNumber.div(az,ax);
            var bb=CSNumber.div(bz,ax);
            var cc=CSNumber.div(cz,ax);
            var erg=CSNumber.sqrt(CSNumber.sub(CSNumber.add(CSNumber.mult(aa,aa),
                                                            CSNumber.mult(bb,bb)),
                                               cc));
            
            return erg;
        }
    }
    
    if(Accessor.generalFields[field]) {//must be defined an an actual string
        erg=geo[Accessor.generalFields[field]];
        if(erg) {
            erg=General.clone(erg);  
            return erg;
        } else 
            return nada;
    }
    //Accessors for masses
    if(geo.behavior) {
        if(field==="mass" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.mass);
        }
        if(field==="radius" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.radius);
        }
        if(field==="charge" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.charge);
        }
        if(field==="friction" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.friction);
        }
        if(field==="vx" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.vx);
        }
        if(field==="vy" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.vy);
        }
        if(field==="v" && geo.behavior.type==="Mass") {
           return List.realVector([geo.behavior.vx,geo.behavior.vy]);
        }
        if(field==="fx" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.fx);
        }
        if(field==="fy" && geo.behavior.type==="Mass") {
           return CSNumber.real(geo.behavior.fy);
        }
        if(field==="f" && geo.behavior.type==="Mass") {
           return List.realVector([geo.behavior.fx,geo.behavior.fy]);
        }
    
    }
    return nada;
    
    
};

Accessor.setField=function(geo,field,value){
    if(field==="color") {
        geo.color=List.clone(value);
    }
    if(field==="size") {
        geo.size=General.clone(value);
    }
    if(field==="xy" && geo.kind==="P"&&geo.ismovable && List._helper.isNumberVecN(value,2)) {
        movepointscr(geo,List.turnIntoCSList([value.value[0],value.value[1],CSNumber.real(1)]));
        recalc();
    }

    if(field==="homog" && geo.kind==="P"&&geo.ismovable && List._helper.isNumberVecN(value,2)) {
        movepointscr(geo,General.clone(value));
        recalc();
    }

    if(field==="angle" && geo.kind==="L") {
        var cc=CSNumber.cos(value);
        var ss=CSNumber.sin(value);
        var dir=List.turnIntoCSList([cc,ss,CSNumber.real(0)]);
        geo.dir=dir;
        
    //    movepointscr(geo,General.clone(value));
        recalc();
    }
    if(geo.behavior) {
        if(field==="mass" && geo.behavior.type==="Mass" && value.ctype==="number") {
            geo.behavior.mass=value.value.real;
        }
        if(field==="friction" && geo.behavior.type==="Mass" && value.ctype==="number") {
            geo.behavior.friction=value.value.real;
        }
        if(field==="charge" && geo.behavior.type==="Mass" && value.ctype==="number") {
            geo.behavior.charge=value.value.real;
        }
        if(field==="radius" && geo.behavior.type==="Mass" && value.ctype==="number") {
            geo.behavior.radius=value.value.real;
        }
        if(field==="vx" && geo.behavior.type==="Mass" && value.ctype==="number") {
            geo.behavior.vx=value.value.real;
        }
        if(field==="vy" && geo.behavior.type==="Mass" && value.ctype==="number") {
            geo.behavior.vy=value.value.real;
        }
        if(field==="v" && geo.behavior.type==="Mass" && List._helper.isNumberVecN(value,2)) {
            geo.behavior.vx=value.value[0].value.real;
            geo.behavior.vy=value.value[1].value.real;
        }
    }
    

};


